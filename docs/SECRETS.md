# 機密治理（Secrets Governance）

最後更新：2026-07-05
讀者：任何維護 PAVORA repo 的人（含 AI）。

## 1. 鐵則

1. 所有機密（API key、OAuth client secret、未來的 admin token）只放兩個地方：
   - 本機開發：`.env.local`（`.gitignore` 已排除，不會進 git）。
   - 正式部署：部署平台的環境變數設定介面（例如 Cloud Run / Vercel / Render 的 Secrets 或 Environment Variables 頁面）。
2. 機密絕不寫進前端程式碼（`src/` 下任何檔案）。前端只能透過後端 proxy（`server.ts` 的 `/api/gemini-proxy`、`/api/gemini-video` 等）間接使用金鑰，金鑰本身永遠留在 server 端環境變數。
3. 機密絕不 commit 進 git。`.env.example` 只列欄位名稱與說明，欄位值永遠留空。
4. 任何回報、文件、log 輸出，看到疑似真實金鑰字串（如 `AIza...`、OAuth client secret 格式）要視為污染事故處理，不得原樣貼出或留在版控歷史。

## 2. 目前全部 env 欄位用途表

以 `.env.example`（repo 根目錄）為準，欄位如有異動請同步更新本表。

| 欄位 | 用途 | 未設定時的行為 |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API 金鑰，供 server 端 `/api/gemini-proxy`、`/api/gemini-video` 呼叫 Gemini API 使用。前端不可直接持有此值。 | 相關 API 呼叫回傳 500（`GEMINI_API_KEY not configured`）。 |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID，供 Google Drive 串接（`/api/auth/google/*`）使用。 | OAuth 流程會失敗（Google 端拒絕未帶正確 client id 的請求）。 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret，與 `GOOGLE_CLIENT_ID` 成對使用，僅 server 端持有。 | 同上，OAuth 流程失敗。 |
| `GOOGLE_REDIRECT_URI` | Google OAuth 導回網址，需與 Google Cloud Console 設定的授權導回 URI 一致。 | 退回程式內建預設 `${APP_BASE_URL}/api/auth/google/callback`（見 `server.ts` 第 23 行）。 |
| `APP_BASE_URL` | 應用程式對外基準網址，組成預設 OAuth 導回網址、部分連結時使用。 | 預設 `http://localhost:3000`。 |
| `ALLOWED_ORIGINS` | `server/middleware/guard.ts` 的 `originGuard` 用的來源網域白名單，逗號分隔，用於擋跨站非預期的寫入請求。 | 預設只允許 `http://localhost:3000` 與 `http://127.0.0.1:3000`。 |
| `RATE_LIMIT_PER_MIN` | `server/middleware/guard.ts` 的 `rateLimit`，限制每個 IP 每分鐘的請求數。 | 預設 60。 |
| `GEMINI_MODEL_ALLOWLIST` | `server/middleware/guard.ts` 的 `geminiAllowlist`，限制 `/api/gemini-proxy` 可呼叫的 Gemini 模型名稱，逗號分隔。 | 使用程式內建清單（`DEFAULT_MODEL_ALLOWLIST`，涵蓋目前 repo 實際用到的文字/生圖/生影片模型）。 |
| `ADMIN_TOKEN` | 預留給後台管理頁（`/admin`）存取控制用（Stage E 包 E4 將實作驗證邏輯）。目前 `/admin` 尚未依此值做驗證。 | 目前無驗證邏輯，此變數尚未生效；E4 完成前 `/admin` 頁面本身無存取控制，屬已知風險，待 E4 補上。 |

## 3. 為什麼選擇新建這份文件而非改寫既有 README

Repo 根目錄僅有一份 `README.md`，內容是 AI Studio 產生的「本機執行說明」（安裝依賴、設定 `GEMINI_API_KEY`、啟動指令），定位是給第一次跑起這個專案的人看的極簡上手指南，不適合塞入完整的機密治理規則與 env 欄位總表（會讓上手文件變得臃腫，也混淆讀者）。Repo 內原本沒有 `docs/` 目錄或其他機密相關文件，因此依 repo 慣例新建 `docs/SECRETS.md` 作為機密治理的單一權威文件，README 之後可視需要加一行連結指向本檔（此次未動 README，避免超出本包範圍）。
