// PAVORA Stage 28-1: server-side auth + per-user daily generation quota
//
// 設計原則（延續 guard.ts 的風格）：
// - fail-closed：REQUIRE_AUTH=true 時，無 token / token 無效一律 401，不放行。
// - 本機開發：REQUIRE_AUTH 未設或非 'true' 時跳過驗證，uid 記為 'dev-local'，
//   啟動 log 會明確印出目前模式，部署前必須設 REQUIRE_AUTH=true。
// - quota 只擋「生成類」請求（生圖/生影片 model，比對 guard.ts 白名單的命名慣例），
//   文字/分析類請求不計入額度。
// - 計數存記憶體，重啟時從 usage.jsonl 重建當日數字（log 內已含 uid 才能重建，
//   舊格式無 uid 的行會被略過——代表升級當天的既有用量不回溯，屬可接受誤差）。
//
// 已知限制（誠實記錄）：
// - 單機部署設計。多實例部署時各實例記憶體計數獨立，quota 會變成 per-instance；
//   屆時需改用共享存儲（Firestore/Redis），列入上線前檢查。
// - Firebase 公鑰透過 jose createRemoteJWKSet 取得並自動快取/輪替，離線環境會驗證失敗。

import type { Request, Response, NextFunction } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// projectId 與前端共用同一份 firebase-applet-config.json，避免雙軌設定
function loadFirebaseProjectId(): string {
  try {
    const configPath = path.join(__dirname, '..', '..', 'firebase-applet-config.json');
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return typeof raw.projectId === 'string' ? raw.projectId : '';
  } catch {
    return '';
  }
}

const FIREBASE_PROJECT_ID = loadFirebaseProjectId();
const REQUIRE_AUTH = process.env.REQUIRE_AUTH === 'true';
const DAILY_IMAGE_QUOTA = Number(process.env.DAILY_IMAGE_QUOTA ?? '200');

// Firebase ID token 的簽章公鑰（securetoken），jose 會自動快取與依 kid 輪替
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

export function logAuthQuotaConfig(): void {
  console.log(
    `[authQuota] REQUIRE_AUTH=${REQUIRE_AUTH} (${REQUIRE_AUTH ? 'fail-closed，需登入' : '開發模式，未驗證身份'})` +
    ` DAILY_IMAGE_QUOTA=${DAILY_IMAGE_QUOTA}` +
    ` projectId=${FIREBASE_PROJECT_ID || '(讀取失敗)'}`
  );
  if (REQUIRE_AUTH && !FIREBASE_PROJECT_ID) {
    console.error('[authQuota] REQUIRE_AUTH=true 但讀不到 firebase projectId，所有請求將被 401 拒絕');
  }
}

export async function authGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!REQUIRE_AUTH) {
    res.locals.uid = 'dev-local';
    return next();
  }
  if (!FIREBASE_PROJECT_ID) {
    // fail-closed：設定壞掉時拒絕，而不是靜默放行
    res.status(401).json({ error: 'AUTH_MISCONFIGURED', code: 'AUTH_MISCONFIGURED' });
    return;
  }
  const authz = req.headers.authorization ?? '';
  const token = authz.startsWith('Bearer ') ? authz.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'Login required', code: 'AUTH_REQUIRED' });
    return;
  }
  try {
    const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    });
    if (!payload.sub) throw new Error('token has no sub');
    res.locals.uid = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token', code: 'AUTH_INVALID' });
  }
}

// --- per-user daily generation quota ---

// 與 guard.ts 生成類白名單的命名慣例對齊：生圖 model 名含 'image'、生影片含 'veo'
const GENERATION_MODEL_PATTERN = /image|veo/i;

interface DayCounter { date: string; count: number; }
const usageByUid = new Map<string, DayCounter>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getTodayCount(uid: string): number {
  const entry = usageByUid.get(uid);
  return entry && entry.date === todayKey() ? entry.count : 0;
}

export function isGenerationModel(model: string): boolean {
  return GENERATION_MODEL_PATTERN.test(model);
}

export function recordGeneration(uid: string, model: string, success: boolean): void {
  if (!success || !isGenerationModel(model)) return;
  const today = todayKey();
  const entry = usageByUid.get(uid);
  if (entry && entry.date === today) {
    entry.count += 1;
  } else {
    usageByUid.set(uid, { date: today, count: 1 });
  }
}

// 重啟時從 usage.jsonl 重建「今天」的 per-uid 計數（只認有 uid 且成功的生成行）
export function initQuotaFromLog(usageLogPath: string): void {
  try {
    if (!fs.existsSync(usageLogPath)) return;
    const today = todayKey();
    const lines = fs.readFileSync(usageLogPath, 'utf8').split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const rec = JSON.parse(line);
        if (
          typeof rec.uid === 'string' && rec.uid &&
          rec.success === true &&
          typeof rec.model === 'string' && isGenerationModel(rec.model) &&
          typeof rec.timestamp === 'string' && rec.timestamp.slice(0, 10) === today
        ) {
          recordGeneration(rec.uid, rec.model, true);
        }
      } catch { /* 壞行略過 */ }
    }
    console.log(`[authQuota] 從 usage.jsonl 重建當日計數：${usageByUid.size} 位使用者`);
  } catch (e) {
    console.warn('[authQuota] 重建當日計數失敗（不影響啟動）：', String(e));
  }
}

export function quotaGuard(req: Request, res: Response, next: NextFunction): void {
  // 與 server.ts proxy handler 相同的路徑解析：/v1beta/models/{model}:{endpoint}
  const modelMatch = req.path.match(/\/models\/([^:]+):/);
  const model = modelMatch ? modelMatch[1] : '';
  if (!isGenerationModel(model)) return next();

  const uid = typeof res.locals.uid === 'string' ? res.locals.uid : 'unknown';
  const used = getTodayCount(uid);
  if (used >= DAILY_IMAGE_QUOTA) {
    res.status(429).json({
      error: `Daily generation quota exceeded (${used}/${DAILY_IMAGE_QUOTA})`,
      code: 'QUOTA_EXCEEDED',
      used,
      limit: DAILY_IMAGE_QUOTA,
    });
    return;
  }
  next();
}
