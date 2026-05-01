
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { Readable } from 'stream';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SEC;
const redirectUri = process.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_U || `${process.env.APP_BASE_URL}/api/auth/google/callback`;

console.log('--- Server Environment Check ---');
console.log('GOOGLE_CLIENT_ID present:', !!clientID);
console.log('GOOGLE_CLIENT_SECRET/SEC present:', !!clientSecret);
console.log('GOOGLE_REDIRECT_URI/U:', redirectUri);
console.log('APP_BASE_URL:', process.env.APP_BASE_URL);
console.log('--------------------------------');

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

app.get('/api/auth/google/url', (req, res) => {
  console.log('GET /api/auth/google/url');
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  res.json({ url });
});

app.get('/api/auth/google/callback', async (req, res) => {
  console.log('GET /api/auth/google/callback');
  const { code, error } = req.query;

  if (error) {
    console.error('Google OAuth error from query:', error);
    return res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: '${error}' }, '*');
            window.close();
          </script>
        </body>
      </html>
    `);
  }

  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    if (tokens.refresh_token) {
      res.cookie('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });
    }
    
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
            window.close();
          </script>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('Error getting tokens from Google:', error?.response?.data || error.message || error);
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: 'auth_failed' }, '*');
            window.close();
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

  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Folder name is required' });
  }

  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const folderMetadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder'
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
