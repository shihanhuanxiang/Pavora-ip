
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { Readable } from 'stream';
import { originGuard, rateLimit, geminiAllowlist, adminGuard } from './server/middleware/guard';
import { authGuard, quotaGuard, recordGeneration, initQuotaFromLog, logAuthQuotaConfig } from './server/middleware/authQuota';

dotenv.config({ path: '.env.local', override: false });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SEC;
const redirectUri = process.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_U || process.env.GOOGLE_REDIRECT_L || `${process.env.APP_BASE_URL}/api/auth/google/callback`;

const getRequestOrigin = (req: express.Request) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const forwardedHost = req.headers['x-forwarded-host'];
  const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  const host = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost;
  
  // AI Studio 網域強制使用 https
  const finalProto = (host?.includes('asia-northeast1.run.app') || host?.includes('aistudio.google')) ? 'https' : (proto || req.protocol);
  return `${finalProto}://${host || req.get('host')}`;
};

const buildRedirectUri = (req: express.Request) => {
  const currentOrigin = getRequestOrigin(req);
  const potentialUris = [
    process.env.GOOGLE_REDIRECT_URI,
    process.env.GOOGLE_REDIRECT_U,
    process.env.GOOGLE_REDIRECT_L,
    process.env.GOOGLE_REDIRECT_PRE,
    process.env.GOOGLE_REDIRECT_DEV
  ].filter(Boolean) as string[];

  // 嘗試在 Secrets 中尋找與目前網域匹配的設定 (精確匹配或包含網域)
  const matchedUri = potentialUris.find(uri => currentOrigin.includes(new URL(uri).hostname));
  
  if (matchedUri) {
    console.log(`Matched environment-specific redirect URI: ${matchedUri}`);
    return matchedUri;
  }

  // 若無匹配則使用動態生成的網址
  const dynamicUri = `${currentOrigin}/api/auth/google/callback`;
  console.log(`No direct match in secrets, using dynamic: ${dynamicUri}`);
  return dynamicUri;
};

console.log('--- Server Environment Check ---');
console.log('GOOGLE_CLIENT_ID present:', !!clientID);
console.log('GOOGLE_CLIENT_SECRET/SEC present:', !!clientSecret);
console.log('Configured Secrets URIs:', [process.env.GOOGLE_REDIRECT_URI, process.env.GOOGLE_REDIRECT_L].filter(Boolean).join(', ') || 'NONE');
console.log('APP_BASE_URL:', process.env.APP_BASE_URL);
console.log('--------------------------------');

// /api/gemini-proxy 收斂 payload 上限：敘事生圖會在單次 generateContent 帶入多張 base64
// 參考圖（identity ref + apparel + canvas，見 fittingService.ts / narrativeService.ts 實掃），
// 單張 1024px 級 JPEG/PNG base64 約 1-3MB，3-4 張疊加可能到 8-12MB；32mb 給出充足緩衝，
// 同時遠低於 50mb 全域值，避免異常大 payload（濫用/攻擊）打滿記憶體。
// 必須註冊在全域 express.json 之前：Express 的 body parser 依註冊順序執行，
// 全域版本先註冊的話 /api/gemini-proxy 會先被 50mb 版本解析掉，路由級 limit 就不會生效。
app.use('/api/gemini-proxy', express.json({ limit: '32mb' }));

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

const oauth2Client = new google.auth.OAuth2(
  clientID,
  clientSecret,
  redirectUri
);

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.readonly'
];

// --- API Routes ---

const USAGE_LOG_PATH = path.join(__dirname, 'logs', 'usage.jsonl');

function appendUsageLog(record: {
  timestamp: string;
  model: string;
  endpoint: string;
  success: boolean;
  statusCode: number;
  durationMs: number;
  uid?: string; // Stage 28-1: per-user quota 需要，舊行無此欄位屬正常
}): void {
  try {
    const line = JSON.stringify(record) + '\n';
    fs.appendFileSync(USAGE_LOG_PATH, line, 'utf8');
  } catch {
    // log 失敗不影響主流程
  }
}

app.get('/api/gemini-video', originGuard, rateLimit, async (req: express.Request, res: express.Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  const fileUri = req.query.fileUri;
  if (!fileUri || typeof fileUri !== 'string') {
    return res.status(400).json({ error: 'fileUri query parameter is required' });
  }

  // SSRF 防護：只允許 Google Generative Language API 網域，拒絕任意 URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(fileUri);
  } catch {
    return res.status(400).json({ error: 'Invalid fileUri' });
  }
  if (parsedUrl.hostname !== 'generativelanguage.googleapis.com' || parsedUrl.protocol !== 'https:') {
    return res.status(403).json({ error: 'fileUri host not allowed' });
  }

  try {
    const upstream = await fetch(parsedUrl.toString(), {
      headers: {
        'x-goog-api-key': apiKey,
      },
      redirect: 'follow',
    });

    if (!upstream.ok || !upstream.body) {
      return res.status(upstream.status).json({ error: `Upstream video fetch failed: ${upstream.status}` });
    }

    const contentType = upstream.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    const contentLength = upstream.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    const videoStream = Readable.fromWeb(upstream.body as any);
    // 防 stream 中斷造成 unhandled error 讓整個 server process crash（E0 驗收記錄的非阻斷風險）
    videoStream.on('error', (streamErr) => {
      console.warn('[gemini-video] upstream stream error:', String(streamErr));
      if (!res.headersSent) {
        res.status(502).json({ error: 'Video stream interrupted' });
      } else {
        res.destroy();
      }
    });
    res.on('close', () => videoStream.destroy());
    videoStream.pipe(res);
  } catch (err) {
    res.status(502).json({ error: 'Video proxy upstream error', detail: String(err) });
  }
});

// Stage 28-1 middleware 順序：origin → rateLimit → auth（驗身份）→ quota（查額度）→ allowlist
initQuotaFromLog(USAGE_LOG_PATH);
logAuthQuotaConfig();

app.use('/api/gemini-proxy', originGuard, rateLimit, authGuard, quotaGuard, geminiAllowlist, async (req: express.Request, res: express.Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  const geminiBase = 'https://generativelanguage.googleapis.com';
  const targetUrl = `${geminiBase}${req.path}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;

  // 從 URL 路徑抓 model 和 endpoint
  // 路徑格式：/v1beta/models/{model}:{endpoint}
  const modelMatch = req.path.match(/\/models\/([^:]+):(.+)/);
  const model = modelMatch ? modelMatch[1] : 'unknown';
  const endpoint = modelMatch ? modelMatch[2] : 'unknown';
  const startTime = Date.now();

  try {
    const body = req.method !== 'GET' ? JSON.stringify(req.body) : undefined;
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body,
    });
    const data = await upstream.json();

    const uid = typeof res.locals.uid === 'string' ? res.locals.uid : 'unknown';
    recordGeneration(uid, model, upstream.ok); // 只有生成類 model 且成功才計入額度
    appendUsageLog({
      timestamp: new Date().toISOString(),
      model,
      endpoint,
      success: upstream.ok,
      statusCode: upstream.status,
      durationMs: Date.now() - startTime,
      uid,
    });

    res.status(upstream.status).json(data);
  } catch (err) {
    appendUsageLog({
      timestamp: new Date().toISOString(),
      model,
      endpoint,
      success: false,
      statusCode: 502,
      durationMs: Date.now() - startTime,
      uid: typeof res.locals.uid === 'string' ? res.locals.uid : 'unknown',
    });
    res.status(502).json({ error: 'Proxy upstream error', detail: String(err) });
  }
});

app.get('/api/auth/google/url', (req, res) => {
  console.log('GET /api/auth/google/url');
  // AI Studio 優先使用動態偵測 buildRedirectUri(req)，確保跳轉網址正確
  const finalRedirectUri = buildRedirectUri(req);
  console.log('Google OAuth request redirect URI (Dynamic):', finalRedirectUri);
  const requestOAuthClient = new google.auth.OAuth2(
    clientID,
    clientSecret,
    finalRedirectUri
  );
  const url = requestOAuthClient.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  res.json({ url });
});

app.get('/api/auth/google/callback', async (req, res) => {
  console.log('GET /api/auth/google/callback - Code received:', !!req.query.code);
  const { code, error } = req.query;

  if (error) {
    console.error('Google OAuth error from query:', error);
    return res.send(`
      <html>
        <body style="background: #111; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
          <div style="text-align: center; padding: 40px; background: #222; border-radius: 20px; border: 1px solid #333;">
            <h2 style="color: #ff5555; margin-bottom: 20px;">認證錯誤</h2>
            <p style="opacity: 0.8;">${error}</p>
            <p style="font-size: 12px; margin-top: 20px; color: #666;">視窗即將關閉...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: '${error}' }, '*');
            }
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `);
  }

  if (!code) {
    console.error('No code provided in Google OAuth callback');
    return res.status(400).send('No code provided');
  }

  try {
    const finalRedirectUri = buildRedirectUri(req);
    console.log('Google OAuth callback handler redirect URI (Dynamic):', finalRedirectUri);
    
    // Create temporary client to avoid modifying global client's private state
    const callbackClient = new google.auth.OAuth2(
      clientID,
      clientSecret,
      finalRedirectUri
    );
    
    console.log('Exchanging code for tokens...');
    const { tokens } = await callbackClient.getToken(code as string);
    console.log('Tokens received successfully');

    if (tokens.refresh_token) {
      console.log('Setting refresh token in cookie');
      res.cookie('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });
    }
    
    res.send(`
      <html>
        <body style="background: #111; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
          <div style="text-align: center; padding: 40px; background: #222; border-radius: 20px; border: 1px solid #333; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
            <div style="font-size: 40px; margin-bottom: 20px;">✓</div>
            <h2 style="color: #61DAFB; margin-bottom: 10px;">Google Drive 連線成功</h2>
            <p style="opacity: 0.8;">身分驗證完成，正在同步資料...</p>
            <p style="font-size: 11px; margin-top: 20px; color: #555;">SECURITY: SESSION ESTABLISHED</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
            }
            setTimeout(() => window.close(), 1500);
          </script>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('Error during Google token exchange:', error?.response?.data || error.message || error);
    res.send(`
      <html>
        <body style="background: #111; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
          <div style="text-align: center; padding: 40px; background: #222; border-radius: 20px; border: 1px solid #333;">
            <h2 style="color: #ff5555; margin-bottom: 20px;">連線失敗</h2>
            <p style="opacity: 0.8;">${error.message || '認證程序發生錯誤'}</p>
            <button onclick="window.close()" style="margin-top: 30px; background: #333; color: white; border: 1px solid #444; padding: 10px 24px; border-radius: 8px; cursor: pointer;">關閉視窗</button>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: 'auth_failed' }, '*');
            }
          </script>
        </body>
      </html>
    `);
  }
});

app.get('/api/auth/status', (req, res) => {
  console.log('GET /api/auth/status');
  const refreshToken = req.cookies.google_refresh_token;
  res.json({ connected: !!refreshToken });
});

app.post('/api/auth/logout', (req, res) => {
  console.log('POST /api/auth/logout');
  res.clearCookie('google_refresh_token');
  res.json({ success: true });
});

app.post('/api/drive/sync', async (req, res) => {
  console.log('POST /api/drive/sync');
  const refreshToken = req.cookies.google_refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ error: 'Not connected to Google Drive' });
  }

  const { fileName, fileData, mimeType, folderName = 'Pavora_Assets', folderId: providedFolderId } = req.body;

  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    let folderId = providedFolderId;
    
    if (!folderId) {
      const folderSearch = await drive.files.list({
        q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id)',
        spaces: 'drive'
      });

      if (folderSearch.data.files && folderSearch.data.files.length > 0) {
        folderId = folderSearch.data.files[0].id;
      } else {
        const folderMetadata = {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder'
        };
        const folder = await drive.files.create({
          requestBody: folderMetadata,
          fields: 'id'
        });
        folderId = folder.data.id;
      }
    }

    const buffer = Buffer.from(fileData.split(',')[1], 'base64');
    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };
    
    // Use a Readable stream for the media body to avoid "part.body.pipe is not a function"
    const media = {
      mimeType: mimeType,
      body: Readable.from(buffer)
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink'
    });

    res.json({ success: true, fileId: file.data.id, link: file.data.webViewLink });
  } catch (error) {
    console.error('Drive sync error:', error);
    res.status(500).json({ error: 'Failed to sync to Google Drive' });
  }
});

app.post('/api/drive/folders', async (req, res) => {
  console.log('POST /api/drive/folders');
  const refreshToken = req.cookies.google_refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ error: 'Not connected to Google Drive' });
  }

  const { name, parentId } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Folder name is required' });
  }

  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const folderMetadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId ? { parents: [parentId] } : {})
    };
    
    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id, name'
    });

    res.json({ success: true, folder: folder.data });
  } catch (error) {
    console.error('Drive create folder error:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

app.get('/api/drive/folders', async (req, res) => {
  console.log('GET /api/drive/folders');
  const refreshToken = req.cookies.google_refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ error: 'Not connected to Google Drive' });
  }

  const { pageToken, search, parentId = 'root' } = req.query;

  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    let query = "mimeType = 'application/vnd.google-apps.folder' and trashed = false";
    if (search) {
      query += ` and name contains '${search}'`;
    } else if (parentId) {
      query += ` and '${parentId}' in parents`;
    }

    const response = await drive.files.list({
      q: query,
      fields: 'nextPageToken, files(id, name)',
      spaces: 'drive',
      orderBy: 'name',
      pageSize: 50,
      pageToken: pageToken as string
    });

    res.json({ 
      success: true, 
      folders: response.data.files, 
      nextPageToken: response.data.nextPageToken 
    });
  } catch (error) {
    console.error('Drive list folders error:', error);
    res.status(500).json({ error: 'Failed to list folders' });
  }
});

app.get('/api/drive/files', async (req, res) => {
  console.log('GET /api/drive/files');
  const refreshToken = req.cookies.google_refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ error: 'Not connected to Google Drive' });
  }

  const { folderId } = req.query;
  if (!folderId) {
    return res.status(400).json({ error: 'folderId is required' });
  }

    try {
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      const response = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType, webViewLink, thumbnailLink)',
        spaces: 'drive',
        orderBy: 'name'
      });

      // Filter for images and videos on the server side but more broadly
      const filteredFiles = (response.data.files || []).filter(file => 
        file.mimeType?.includes('image/') || 
        file.mimeType?.includes('video/') ||
        file.mimeType === 'application/octet-stream' // Some files might lose their mimeType
      );

      res.json({ success: true, files: filteredFiles });
    } catch (error) {
    console.error('Drive list files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

app.get('/api/drive/file/:fileId', async (req, res) => {
  console.log('GET /api/drive/file/:fileId');
  const refreshToken = req.cookies.google_refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ error: 'Not connected to Google Drive' });
  }

  const { fileId } = req.params;

  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    console.log(`Downloading file: ${fileId}`);
    
    const metadata = await drive.files.get({
      fileId: fileId,
      fields: 'name, mimeType, size'
    });

    // Check file size (limit to 10MB for data URL transfer to avoid memory issues)
    const fileSize = parseInt(metadata.data.size || '0');
    if (fileSize > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'File too large (max 10MB)' });
    }

    const response = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );

    const buffer = Buffer.from(response.data as ArrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${metadata.data.mimeType};base64,${base64}`;

    res.json({ success: true, dataUrl, name: metadata.data.name, mimeType: metadata.data.mimeType });
  } catch (error: any) {
    console.error('Drive download file error:', error?.response?.data || error.message);
    const status = error?.response?.status || 500;
    res.status(status).json({ error: `Failed to download file: ${error.message}` });
  }
});

app.get('/api/drive/image/:fileId', async (req, res) => {
  console.log('GET /api/drive/image/:fileId');
  const refreshToken = req.cookies.google_refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ error: 'Not connected to Google Drive' });
  }

  const { fileId } = req.params;

  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const metadata = await drive.files.get({
      fileId,
      fields: 'name, mimeType, size'
    });

    const mimeType = metadata.data.mimeType || 'application/octet-stream';
    if (!mimeType.startsWith('image/')) {
      return res.status(415).json({ error: 'Drive file is not an image' });
    }

    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );

    const buffer = Buffer.from(response.data as ArrayBuffer);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buffer);
  } catch (error: any) {
    console.error('Drive image proxy error:', error?.response?.data || error.message || error);
    const status = error?.response?.status || 500;
    res.status(status).json({ error: `Failed to proxy Drive image: ${error.message}` });
  }
});

app.get('/admin/usage-data', adminGuard, (_req, res) => {
  try {
    const logPath = path.join(__dirname, 'logs', 'usage.jsonl');
    if (!fs.existsSync(logPath)) {
      return res.json({ records: [], stats: {} });
    }
    const lines = fs.readFileSync(logPath, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));

    // 統計：依模型分群
    const statsMap: Record<string, { calls: number; success: number; totalMs: number }> = {};
    for (const r of lines) {
      if (!statsMap[r.model]) statsMap[r.model] = { calls: 0, success: 0, totalMs: 0 };
      statsMap[r.model].calls++;
      if (r.success) statsMap[r.model].success++;
      statsMap[r.model].totalMs += r.durationMs || 0;
    }

    const stats = Object.entries(statsMap).map(([model, s]) => ({
      model,
      calls: s.calls,
      successRate: ((s.success / s.calls) * 100).toFixed(1) + '%',
      avgMs: Math.round(s.totalMs / s.calls),
    }));

    // 最近 50 筆紀錄（倒序）
    const recent = lines.slice(-50).reverse();
    res.json({ stats, recent });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get('/admin', adminGuard, (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>Pavora Admin</title>
  <style>
    body { font-family: monospace; background: #0d0d0d; color: #e0e0e0; padding: 32px; }
    h1 { color: #f5c518; margin-bottom: 8px; }
    h2 { color: #aaa; font-size: 14px; margin: 24px 0 8px; text-transform: uppercase; letter-spacing: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #1a1a1a; color: #f5c518; padding: 8px 12px; text-align: left; font-size: 12px; }
    td { padding: 7px 12px; border-bottom: 1px solid #222; font-size: 12px; }
    tr:hover td { background: #1a1a1a; }
    .ok { color: #4caf50; }
    .fail { color: #f44336; }
    .ts { color: #666; }
    #refresh { background: #f5c518; color: #000; border: none; padding: 6px 16px; cursor: pointer; font-family: monospace; font-weight: bold; }
  </style>
</head>
<body>
  <h1>PAVORA ADMIN</h1>
  <button id="refresh" onclick="load()">↻ 重新整理</button>

  <h2>模型用量統計</h2>
  <table id="stats-table">
    <thead><tr><th>Model</th><th>總呼叫</th><th>成功率</th><th>平均耗時 (ms)</th></tr></thead>
    <tbody id="stats-body"></tbody>
  </table>

  <h2>最近 50 筆紀錄</h2>
  <table id="recent-table">
    <thead><tr><th>時間</th><th>Model</th><th>Endpoint</th><th>狀態</th><th>耗時 (ms)</th></tr></thead>
    <tbody id="recent-body"></tbody>
  </table>

  <script>
    async function load() {
      // /admin 頁面本身是靠 ?token= query 打開的（瀏覽器網址列無法帶自訂 header），
      // 這裡的子請求 /admin/usage-data 一樣掛了 adminGuard，所以要把目前網址的
      // token 原封轉發過去，否則頁面殼打得開、內部這個 fetch 會 401（半殘：表格空白）。
      const currentToken = new URLSearchParams(window.location.search).get('token');
      const dataUrl = currentToken ? '/admin/usage-data?token=' + encodeURIComponent(currentToken) : '/admin/usage-data';
      const r = await fetch(dataUrl);
      const { stats = [], recent = [] } = await r.json();

      document.getElementById('stats-body').innerHTML = stats.map(s =>
        '<tr><td>' + s.model + '</td><td>' + s.calls + '</td><td>' + s.successRate + '</td><td>' + s.avgMs + '</td></tr>'
      ).join('');

      document.getElementById('recent-body').innerHTML = recent.map(r =>
        '<tr>' +
        '<td class="ts">' + new Date(r.timestamp).toLocaleString('zh-TW') + '</td>' +
        '<td>' + r.model + '</td>' +
        '<td>' + r.endpoint + '</td>' +
        '<td class="' + (r.success ? 'ok' : 'fail') + '">' + (r.success ? '✓ ' + r.statusCode : '✗ ' + r.statusCode) + '</td>' +
        '<td>' + r.durationMs + '</td>' +
        '</tr>'
      ).join('');
    }
    load();
  </script>
</body>
</html>`);
});

// Catch-all for /api/* to prevent falling through to SPA fallback
app.all('/api/*all', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
