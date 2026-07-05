// PAVORA Stage E 包 E1 — proxy 硬化 middleware
// 依據：handoff_docs/PAVORA_E_SECURITY_PLAN.md §3 E1
// 決策：不做 shared secret（Hank 已決策）。防護靠 origin allowlist + rate limit + model/endpoint allowlist，
// 未來要更強防護再疊登入（per-user auth）。
//
// 這裡的每一層都「誠實地」擋得住什麼、擋不住什麼在註解裡寫清楚，避免未來 session 誤以為這是萬全防護。

import type express from 'express';

// ---------------------------------------------------------------------------
// 1) originGuard — Origin/Referer allowlist
// ---------------------------------------------------------------------------
//
// 取捨（誠實記錄）：
// - 瀏覽器的跨網域 POST/PUT/DELETE 一定會帶 Origin header（fetch/XHR 的標準行為），
//   所以「非 GET 且 Origin 不在名單」可以放心 403。
// - 瀏覽器的同源請求、以及某些「非 fetch」的請求（例如 <img>/<video> 標籤發出的 GET）
//   不一定帶 Origin，但通常會帶 Referer；兩者都拿來比對。
// - 如果 Origin 與 Referer 都沒帶：
//     * GET/HEAD 放行 —— 因為 <img src>、<video src> 等媒體標籤本來就不帶 Origin，
//       這是本地與正常瀏覽器使用的必要路徑（video proxy 靠這個活）。
//     * 非 GET/HEAD 直接 403 —— 因為瀏覽器發出的跨域寫入請求一定有 Origin/Referer，
//       「兩者都沒有」多半是 curl/腳本直打，不是正常瀏覽器行為。
// - **誠實的防護邊界**：curl 或任何自訂 HTTP client 都可以偽造 Origin/Referer header，
//   這一層擋不住「刻意偽造 header 的攻擊者」，只擋「瀏覽器跨站發出、無法偽造 Origin 的請求」與
//   「完全不帶 header 的裸 GET 濫用」。真正防低階濫用要靠下面的 rate limit；
//   要擋「刻意偽造」則要靠未來的登入/per-user auth（本包不做）。
const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];

function getAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw || raw.trim() === '') return DEFAULT_ALLOWED_ORIGINS;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function extractOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

export function originGuard(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const allowlist = getAllowedOrigins();

  const originHeader = req.headers.origin;
  const refererHeader = req.headers.referer;
  const origin = extractOrigin(Array.isArray(originHeader) ? originHeader[0] : originHeader);
  const referer = extractOrigin(Array.isArray(refererHeader) ? refererHeader[0] : refererHeader);

  if (origin) {
    if (allowlist.includes(origin)) return next();
    res.status(403).json({ error: 'Origin not allowed' });
    return;
  }

  if (referer) {
    if (allowlist.includes(referer)) return next();
    res.status(403).json({ error: 'Referer not allowed' });
    return;
  }

  // 兩者皆無：GET/HEAD 放行（媒體標籤、本地工具），其他方法視為可疑直打，拒絕。
  if (req.method === 'GET' || req.method === 'HEAD') {
    return next();
  }
  res.status(403).json({ error: 'Origin/Referer required for this request' });
}

// ---------------------------------------------------------------------------
// 2) rateLimit — per-IP 滑動窗（記憶體，無新依賴）
// ---------------------------------------------------------------------------
//
// 注意：req.ip 在 Express 沒設定 `trust proxy` 時，回傳的是直接 TCP 連線的來源位址。
// 若部署在反向代理（Nginx/Caddy/平台 LB）後面且沒設定 trust proxy，所有請求的 req.ip
// 都會是代理伺服器的位址，導致「所有使用者共用同一個 rate limit 桶」——這是 E6（平台落地包）
// 要處理的事（設定 app.set('trust proxy', ...) 對應層數）。本包不動 trust proxy 設定，
// 只誠實記錄這個已知限制，避免未來 session 誤以為 rate limit 在代理後面仍是 per-real-IP。
const RATE_LIMIT_WINDOW_MS = 60_000;

function getRateLimitPerMin(): number {
  const raw = process.env.RATE_LIMIT_PER_MIN;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60;
}

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

// 惰性清理：每次請求檢查時，順手把「視窗內完全沒有任何時間戳」的桶清掉，
// 避免長時間運行後 Map 無限成長造成記憶體洩漏。不另開 setInterval，避免額外常駐計時器。
// 誠實記錄的已知限制：短時間內大量「不同來源 IP」（尤其 IPv6）各發 1-2 個請求，這些桶在
// 60 秒視窗內不算空、清不掉，Map 會暫時性膨脹；徹底解法（bucket 總數上限/LRU）留待部署包（E6）評估。
function pruneBucket(bucket: Bucket, now: number): void {
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  while (bucket.timestamps.length > 0 && bucket.timestamps[0] < cutoff) {
    bucket.timestamps.shift();
  }
}

function pruneEmptyBuckets(now: number): void {
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  for (const [key, bucket] of buckets) {
    if (bucket.timestamps.length === 0 || bucket.timestamps[bucket.timestamps.length - 1] < cutoff) {
      buckets.delete(key);
    }
  }
}

export function rateLimit(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const limit = getRateLimitPerMin();
  const key = req.ip || 'unknown';
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }
  pruneBucket(bucket, now);

  if (bucket.timestamps.length >= limit) {
    res.setHeader('Retry-After', Math.ceil(RATE_LIMIT_WINDOW_MS / 1000).toString());
    res.status(429).json({ error: 'Too many requests, please slow down.' });
    return;
  }

  bucket.timestamps.push(now);

  // 惰性清理：機率性觸發（每 ~50 次請求一次），避免每個請求都全表掃描造成效能負擔，
  // 又能保證長時間運行後過期的 key 會被回收。
  if (Math.random() < 0.02) {
    pruneEmptyBuckets(now);
  }

  next();
}

// ---------------------------------------------------------------------------
// 3) geminiAllowlist — model/endpoint 白名單（只掛 /api/gemini-proxy）
// ---------------------------------------------------------------------------
//
// 實掃依據（2026-07-05，grep src/ 全部 `.models.generateContent` / `model:` 字面值 與
// directorService.ts 的 generateVideos／getVideosOperation 呼叫）：
//   - geminiService.ts, captionService.ts, personaService.ts, ModelSetup.tsx,
//     narrativeService.ts, faceCrop.ts, directorService.ts, fittingService.ts,
//     modelCreationService.ts 全部呼叫 model: 'gemini-3-flash-preview'（文字/分析類最大宗）
//   - 生圖：'gemini-2.5-flash-image'、'gemini-3.1-flash-image-preview'、'gemini-3-pro-image-preview'
//     （modelCreationService.ts、fittingService.ts、geminiService.ts、directorService.ts、
//     NarrativeWorkflow.tsx 依 HD/Cinematic/Pro 檔次切換這三個）
//   - 生影片：directorService.ts generateVideo() 用 'veo-3.1-lite-generate-preview' 與
//     'veo-3.1-generate-preview'（client.models.generateVideos，走 POST :generateVideos）
// 白名單可用 env GEMINI_MODEL_ALLOWLIST（逗號分隔）覆寫，方便未來加新模型不必改程式碼重新部署。
const DEFAULT_MODEL_ALLOWLIST = [
  'gemini-3-flash-preview',
  'gemini-2.5-flash-image',
  'gemini-3.1-flash-image-preview',
  'gemini-3-pro-image-preview',
  'veo-3.1-lite-generate-preview',
  'veo-3.1-generate-preview',
];

// 實際用到的 endpoint（generateContent 為主，generateVideos 為生影片）。
// streamGenerateContent 目前 repo 未使用，但先預留在白名單內（不影響現況、留給未來串流輸出）。
const DEFAULT_ENDPOINT_ALLOWLIST = ['generateContent', 'streamGenerateContent', 'generateVideos'];

function getModelAllowlist(): string[] {
  const raw = process.env.GEMINI_MODEL_ALLOWLIST;
  if (!raw || raw.trim() === '') return DEFAULT_MODEL_ALLOWLIST;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

// 長輪詢（operations.getVideosOperation）打的路徑是 `models/{model}/operations/{id}`，
// 是 GET、沒有 `:{endpoint}` 後綴，不會命中 `/models/([^:]+):(.+)/` 這個 pattern。
// 這是已授權生影片操作的「查狀態」，本身不會呼叫任何生成端點，風險低，且擋掉會直接弄壞
// 生影片進度輪詢（DirectorMode 的核心功能）。所以：命中 operations 路徑的 GET 一律放行，
// 不套 model allowlist；其餘（generateContent/generateVideos 等真正的生成呼叫）才檢查白名單。
const OPERATIONS_PATH_RE = /\/models\/[^/]+\/operations\//;

export function geminiAllowlist(req: express.Request, res: express.Response, next: express.NextFunction): void {
  // 限定 GET：operations 路徑只有「查狀態」是正當用途；非 GET 一律落入下方白名單檢查（fail-closed），
  // 防止用 operations 形狀的路徑夾帶其他方法繞過白名單（E1 fresh-context 驗收發現的縫）。
  if (req.method === 'GET' && OPERATIONS_PATH_RE.test(req.path)) {
    return next();
  }

  const modelMatch = req.path.match(/\/models\/([^:]+):(.+)/);
  const model = modelMatch ? modelMatch[1] : null;
  const endpoint = modelMatch ? modelMatch[2] : null;

  const modelAllowlist = getModelAllowlist();

  if (!model || !endpoint || !modelAllowlist.includes(model) || !DEFAULT_ENDPOINT_ALLOWLIST.includes(endpoint)) {
    console.warn(`[geminiAllowlist] blocked request: path=${req.path} model=${model ?? 'unknown'} endpoint=${endpoint ?? 'unknown'}`);
    res.status(403).json({ error: 'Model or endpoint not allowed' });
    return;
  }

  next();
}

// ---------------------------------------------------------------------------
// 4) adminGuard — /admin 與 /admin/usage-data 的 token 檢查
// ---------------------------------------------------------------------------
//
// 取捨（誠實記錄，Stage E 包 E4a 決策）：
// - **Fail-closed**：如果 `ADMIN_TOKEN` 沒有設定在環境變數裡，一律回 403，不會「沒設定就放行」。
//   理由：/admin 會暴露用量統計（模型呼叫量、成功率、耗時），這是內部維運資訊，不該在「忘記設定
//   env」的情況下變成預設公開。寧可 Hank 本地多設一行 env、重啟才能用 /admin，也不留一個
//   fail-open 的洞讓正式部署踩雷（例如忘記設定就直接上線，/admin 對全世界公開）。
// - Token 比對支援兩種帶法：
//     1) `Authorization: Bearer <token>` header —— 給程式化呼叫（curl/monitoring）用。
//     2) `?token=<token>` query string —— 給 Hank 直接在瀏覽器網址列打開 /admin 頁面用
//        （瀏覽器直開網址沒辦法帶自訂 header，只能靠 query）。
// - **誠實的防護邊界**：這不是完整的 auth 系統，只是一個共用 token 的簡單門檔。token 會出現在
//   瀏覽器網址列、瀏覽紀錄、伺服器 access log 裡（query string 的固有限制），不適合當成高敏感
//   憑證的等級。若未來要更嚴謹，應換成真正的登入（per-user auth），本包不做。
// - 未帶 token（不論 header 或 query 都沒有）視為「格式錯誤的請求」而非「token 錯誤」，但為了不
//   洩漏「到底是沒帶還是帶錯」這種細節給攻擊者，兩種情況統一回 401，訊息一致。
function getAdminToken(): string | undefined {
  const raw = process.env.ADMIN_TOKEN;
  if (!raw || raw.trim() === '') return undefined;
  return raw.trim();
}

function extractBearerToken(header: string | string[] | undefined): string | null {
  const value = Array.isArray(header) ? header[0] : header;
  if (!value) return null;
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export function adminGuard(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const adminToken = getAdminToken();

  // Fail-closed：沒設定 env 一律 403，不因為「圖方便本地測試」而放行。
  if (!adminToken) {
    res.status(403).json({ error: 'ADMIN_TOKEN 未設定，請在 .env.local 加入後重啟' });
    return;
  }

  const headerToken = extractBearerToken(req.headers.authorization);
  const queryTokenRaw = req.query.token;
  const queryToken = typeof queryTokenRaw === 'string' ? queryTokenRaw : null;
  const providedToken = headerToken || queryToken;

  if (!providedToken) {
    res.status(401).json({ error: '需要提供管理權限 token（Authorization: Bearer 或 ?token=）' });
    return;
  }

  if (providedToken !== adminToken) {
    res.status(401).json({ error: '管理權限 token 不正確' });
    return;
  }

  next();
}
