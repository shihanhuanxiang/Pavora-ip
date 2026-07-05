# PAVORA Code Deep Review - 2026-05-24

## 檢查範圍

- 使用者指定最新版名稱：`PAVORA_辦公室同步包_2026-05-21`。
- 實際確認後的主要 git 專案路徑：`C:\Users\Owner\Desktop\PAVORA IP\Pavora-ip-github-analysis-20260518`。
- 外層路徑 `C:\Users\Owner\Desktop\PAVORA IP` 不是 git repo；最新版 zip 內容根目錄為 `Pavora-ip-github-analysis-20260518/`，且內含 `.git`，因此以此資料夾為本次檢查主體。
- 本次沒有安裝套件、沒有 commit、沒有 push、沒有 reset、沒有刪除既有變更，沒有真實大量呼叫 AI/API。
- 本次只新增本報告與 UX 報告，未修改功能程式碼。

## 已讀取文件

- `README.md`
- `package.json`
- `handoff_docs\PAVORA_HANDOVER_v21.md`
- `handoff_docs\PAVORA_MODEL_CREATION_REDESIGN_HANDOFF_2026-05-21.md`
- `handoff_docs\PAVORA_LOCALIZATION_COMMERCIALIZATION_HANDOFF_2026-05-19.md`
- `handoff_docs\PAVORA_KNOWN_PITFALLS.md`
- `AGENTS.md`：專案內未找到檔案；本次採用使用者訊息中提供的 AGENTS 規範。

## Git 狀態摘要

- Repo：`C:\Users\Owner\Desktop\PAVORA IP\Pavora-ip-github-analysis-20260518`
- Branch：`main...origin/main [ahead 6]`
- HEAD：`bf97850`
- 工作區已經有多個使用者既有變更與未追蹤檔案，包含：
  - `index.css`
  - `index.html`
  - `src\shell\App.tsx`
  - `src\shell\Header.tsx`
  - `src\shell\HomePage.tsx`
  - `src\modules\narrative\NarrativeWorkflow.tsx`
  - `src\modules\narrative\services\narrativeService.ts`
  - `src\modules\modelCreation\ModelSetup.tsx`
  - `src\modules\modelCreation\services\modelCreationService.ts`
  - `src\shared\stores\useModelStore.ts`
  - `handoff_docs\`
  - `dist\`
- 注意：本次檢查期間新增了 review artifact，例如 `.codex-review-build\`、`.codex-review-screens\`、`.codex-review-server.*.log`，供驗證紀錄使用。

## Package Scripts 盤點

- `dev`：`tsx server.ts`
- `build`：`vite build`
- `start`：`NODE_ENV=production node server.ts`
- `preview`：`vite preview`
- `lint`：`tsc --noEmit`
- 沒有 `test` script。
- 沒有獨立 `typecheck` script；目前 `lint` 實際上就是 TypeScript typecheck。

## 主要入口與模組地圖

- App 入口：`index.tsx` -> `src\shell\App.tsx`
- Server 入口：`server.ts`
- Vite 設定：`vite.config.ts`
- 主要 workflow 狀態：`src\shell\App.tsx`
- 首頁與模式入口：`src\shell\HomePage.tsx`
- Narrative workbench：
  - `src\modules\narrative\NarrativeWorkflow.tsx`
  - `src\modules\narrative\services\narrativeService.ts`
  - `src\modules\narrative\components\NarrativeSettings.tsx`
  - `src\modules\narrative\components\WardrobeManager.tsx`
- Model creation：
  - `src\modules\modelCreation\ModelSetup.tsx`
  - `src\modules\modelCreation\services\modelCreationService.ts`
  - `src\modules\modelCreation\services\personaService.ts`
- Store：
  - `src\shared\stores\useModelStore.ts`
  - `src\shared\stores\useAppStore.ts`
- AI/API core：
  - `src\shared\services\core\geminiClient.ts`
  - `src\shared\services\geminiService.ts`
  - `server.ts`
- Prompt hygiene：
  - `src\shared\services\promptSanitizer.ts`
  - `src\prompts\`

## 已執行指令與結果

- `rg --files -g AGENTS.md -g !old/** -g !**/node_modules/**`
  - 結果：專案內未找到 `AGENTS.md`。
- `git -c safe.directory='C:/Users/Owner/Desktop/PAVORA IP/Pavora-ip-github-analysis-20260518' status --short --branch`
  - 結果：repo 在 `main`，ahead 6，且工作區已有多個修改與未追蹤檔案。
- `Test-Path .\node_modules`
  - 結果：`True`。
- `Test-Path .\node_modules\.bin\tsc.cmd`
  - 結果：`True`。
- `Test-Path .\node_modules\.bin\vite.cmd`
  - 結果：`True`。
- `Test-Path .\node_modules\.bin\tsx.cmd`
  - 結果：`True`。
- `npm.cmd run`
  - 結果：成功列出 scripts。
- `npm.cmd run lint`
  - 結果：通過，`tsc --noEmit` exit 0。
- `.\node_modules\.bin\vite.cmd build --outDir .codex-review-build`
  - sandbox 內第一次失敗：`Cannot read directory "../../..": Access is denied.`，屬 Windows/esbuild sandbox 權限問題。
  - 重新以使用者核准的 escalated 權限執行後通過。
  - Vite build 警告：主 bundle 約 `4,349.23 kB`，gzip 約 `1,102.36 kB`，超過 500 kB；另有多個 dynamic import 因同時 static import 而無法分包。
- 本機 server HTTP 檢查
  - 以 `node node_modules/tsx/dist/cli.mjs server.ts` 啟動後檢查：
  - `/` -> 200，title `Pavora - AI 時尚工作室`
  - `/narrative` -> 200，title `Pavora - AI 時尚工作室`
  - `/model-lounge` -> 200，title `Pavora - AI 時尚工作室`
  - `/model-creation` -> 200，title `Pavora - AI 時尚工作室`
  - 注意：HTTP 200 只代表 SPA 可回應，仍不代表 App 內 workflow state 會載入正確頁面。
- Headless Chrome 截圖檢查
  - 嘗試執行，但截圖結果為 `ERR_CONNECTION_REFUSED`，因此本次不能把瀏覽器截圖當成有效 UI 驗證。
  - 已清理殘留 node/chrome/esbuild 程序。
- Prompt leak 掃描
  - `outfit_hint` 仍存在於 types 與 extended scenes。
  - facial mark 詞彙仍出現在部分 prompt 來源或功能 UI。
  - `scene_id` / `outfit_id` 中文 ID 掃描結果多為使用端雜訊，未視為確認問題。

## 程式碼問題清單

### P0

1. API key 仍可由前端取得
   - 檔案路徑：`C:\Users\Owner\Desktop\PAVORA IP\Pavora-ip-github-analysis-20260518\server.ts`
   - 行號：101-106
   - 相關檔案：`src\shared\services\core\geminiClient.ts` 37-52、`src\shared\utils\imageUtils.ts` 126、`src\modules\directorMode\services\directorService.ts` 270、`src\modules\directorMode\DirectorMode.tsx` 359、`src\shared\components\common\VideoPlayer.tsx` 44
   - 問題描述：`/api/config` 會把 `GEMINI_API_KEY` 回傳給前端，而且不是完全死碼，仍有多個前端模組呼叫 `getApiKey()`。
   - 影響：這直接違反 handoff v21 的「官方 API key 不可暴露到 frontend/localStorage/screenshots/GitHub」原則。若部署到公開環境，任何人都能取走 key。
   - 建議修法：移除或封鎖 `/api/config` 回傳 key 的行為；把所有 Gemini 呼叫改走 server proxy；舊的 `getApiKey()` 呼叫點要逐一改成不需要 client key 的 API。
   - 是否需要我決策：需要。要先決定此專案是純本機工具、內部工具，還是未來公開部署；安全策略不同。

### P1

1. Gemini proxy 未做權限與額度保護
   - 檔案路徑：`C:\Users\Owner\Desktop\PAVORA IP\Pavora-ip-github-analysis-20260518\server.ts`
   - 行號：109-157
   - 問題描述：`/api/gemini-proxy` 會用 server 端 key 代理任意 Gemini API path，但沒有登入驗證、rate limit、CSRF/origin 檢查或 per-user quota。
   - 影響：如果公開部署，外部使用者可以直接打 proxy 消耗 API 額度。即使有 usage log，也只能事後追蹤，不能防止消耗。
   - 建議修法：加入 auth/session 驗證、origin allowlist、rate limit、模型/endpoint allowlist、單次 payload 大小限制與 user quota。
   - 是否需要我決策：需要。需決定上線形態、誰可以使用生成額度、是否允許匿名使用。

2. Narrative diary 生成失敗會被包成「成功結果」
   - 檔案路徑：`C:\Users\Owner\Desktop\PAVORA IP\Pavora-ip-github-analysis-20260518\src\modules\narrative\services\narrativeService.ts`
   - 行號：1358-1367
   - 相關檔案：`src\modules\narrative\NarrativeWorkflow.tsx` 656-683
   - 問題描述：`generateIPDiary` catch error 後回傳 fallback diary；UI 收到結果後直接 `setDiary` 並進到 Step 4。
   - 影響：AI 失敗、JSON 壞掉或 payload 問題時，使用者可能以為生成成功，接著再送圖片生成，造成錯誤內容進入下一步並消耗額度。
   - 建議修法：生成失敗時回傳明確錯誤狀態，不自動進 Step 4；如果要保留 fallback，UI 必須標示「暫存草稿/未通過 AI 生成」並禁止直接送圖。
   - 是否需要我決策：需要。要決定 fallback 是保留為離線草稿，還是正式流程必須中止。

3. Final visual prompt 不能保證全英文
   - 檔案路徑：`C:\Users\Owner\Desktop\PAVORA IP\Pavora-ip-github-analysis-20260518\src\modules\narrative\services\narrativeService.ts`
   - 行號：343-370、767-786
   - 相關檔案：`src\shared\services\promptSanitizer.ts` 107-155
   - 問題描述：`buildSubjectToken()` 會直接把 `locked_descriptor`、`model.name`、identity hint 等值放入 final visual prompt；sanitizer 只偵測中文並產生 warning，沒有移除或阻擋中文。
   - 影響：handoff 要求 UI 可 zh-TW，但 final prompt 應是 en-US。若模型名稱、persona、場景或描述含中文，可能污染最終圖片 prompt。
   - 建議修法：final prompt 組裝前建立「英文化/阻擋」層；若出現中文，UI 顯示需要同步翻譯，不直接送出圖片 API。
   - 是否需要我決策：需要。需決定是否允許使用者手動中文 prompt，或 final image path 一律阻擋中文。

4. Random scene / 動作 / 道具仍有不合理組合風險
   - 檔案路徑：`C:\Users\Owner\Desktop\PAVORA IP\Pavora-ip-github-analysis-20260518\src\modules\narrative\services\narrativeService.ts`
   - 行號：443-472、555-647
   - 問題描述：`interestProp`、`forcedAction`、`forcedBodyPose` 仍在 prompt builder 內直接隨機注入。雖然 body pose 有 blocker 過濾，但 facial action 與 interest prop 沒有完整 scene/action matrix。
   - 影響：可能出現不合場景的食物、手勢、道具或姿勢，例如通勤/辦公/浴室/戶外場景混入不合理動作，影響 Soul Narrative 的「多樣但合理」要求。
   - 建議修法：建立明確的 scene action rule/matrix，把動作、道具、食物、碎屑、寵物互動等分成 scene-safe pool；不在 final prompt builder 裡直接散落隨機池。
   - 是否需要我決策：需要。這牽涉 PAVORA 商業敘事規則與風格取捨，建議交由 Hank/Claude 確認矩陣規則。

5. legacy `outfit_hint` 尚未清乾淨
   - 檔案路徑：`C:\Users\Owner\Desktop\PAVORA IP\Pavora-ip-github-analysis-20260518\src\shared\types\types.ts`
   - 行號：260
   - 相關檔案：`src\modules\narrative\constants\extendedScenesPart1.ts` 18 起多處、`extendedScenesPart2.ts` 17 起多處、`extendedScenesPart3.ts` 17 起多處
   - 問題描述：handoff/prompt sanitizer 註記期待 prompt source 不再使用舊欄位污染，但 extended scenes 仍大量保留 `outfit_hint`。
   - 影響：可能和新的 outfit filter / wardrobe selection 規則互相覆蓋，導致場景直接指定服裝，削弱 5-step workflow 的穿搭選擇。
   - 建議修法：確認 `outfit_hint` 是否仍被 runtime 使用；若不用，清除型別與資料；若要保留，改名並明確限制為 UI hint，不可進入 final prompt。
   - 是否需要我決策：需要。需確認既有 scene data 是要遷移、保留為顯示提示，還是移除。

6. facial mark 詞彙仍存在於部分 prompt 來源
   - 檔案路徑：`C:\Users\Owner\Desktop\PAVORA IP\Pavora-ip-github-analysis-20260518\src\modules\modelCreation\services\modelCreationService.ts`
   - 行號：26-27
   - 相關檔案：`src\modules\modelCreation\services\personaService.ts` 106、`src\prompts\hair.ts` 155、`src\shared\constants\salonPresets.ts` 63、`src\modules\characterLab\CharacterLab.tsx` 223-227、`src\modules\hairSalon\HairSalon.tsx` 1175
   - 問題描述：prompt sanitizer 的 detector list 是允許存在的，但部分生成 prompt 或工具功能仍含 `freckles/moles/birthmarks` 等詞，即使是負面規則也可能進入 prompt。
   - 影響：可能和 PAVORA IP identity guardrail 衝突，尤其是模型建立與髮妝工具可能把臉部標記語彙重新注入生成流程。
   - 建議修法：先分類哪些模組屬於 PAVORA IP identity path，哪些是獨立妝容工具；identity path 裡避免把 forbidden words 直接送入生成 prompt，改用抽象 policy token 或 server-side validator。
   - 是否需要我決策：需要。Hair Salon/Character Lab 是否允許雀斑妝，屬產品規則取捨。

### P2

1. App 內路由只真正支援 `/narrative`
   - 檔案路徑：`C:\Users\Owner\Desktop\PAVORA IP\Pavora-ip-github-analysis-20260518\src\shell\App.tsx`
   - 行號：47-55、152-163
   - 問題描述：`getWorkflowStepForPath()` 只把 `/narrative` 對到 workflow step，其餘 step 都會回首頁。HTTP 檢查 `/model-lounge`、`/model-creation` 是 200，但 App 內不一定載入對應頁。
   - 影響：使用者重整、分享連結或從瀏覽器直接進入主要頁面時，可能看到首頁而不是預期功能頁。
   - 建議修法：補齊主要 workflow route mapping，或停止暴露看似可直連但實際不支援的 URL。
   - 是否需要我決策：需要。要決定 PAVORA 是否要支援正式 deep link。

2. sessionStorage 壞資料可能造成 App 初始化白畫面
   - 檔案路徑：`C:\Users\Owner\Desktop\PAVORA IP\Pavora-ip-github-analysis-20260518\src\shell\App.tsx`
   - 行號：87-90
   - 問題描述：`pavora_editing_image` 直接 `JSON.parse(saved)`，沒有 try/catch。
   - 影響：只要 sessionStorage 中該 key 壞掉，App 可能在初始化時直接 crash，使用者看不到可理解錯誤訊息。
   - 建議修法：解析失敗時移除該 key，回到安全空狀態並顯示簡短通知。
   - 是否需要我決策：不需要。

3. 圖片生成缺少函式內部防重送 guard
   - 檔案路徑：`C:\Users\Owner\Desktop\PAVORA IP\Pavora-ip-github-analysis-20260518\src\modules\narrative\NarrativeWorkflow.tsx`
   - 行號：706-783
   - 問題描述：`handleGenerateImage()` 只在 UI button 上依靠 disabled 狀態，函式開頭沒有 `isGeneratingImage` 之類的內部 guard。
   - 影響：快速連點、多個 CTA 同時存在、或 React state 尚未更新時，仍可能重複送出生成請求。
   - 建議修法：在函式入口加 pending guard，必要時加 request id 或 AbortController，確保同一 diary/prompt 同時只會送一次。
   - 是否需要我決策：不需要。

4. Google Drive 自動同步可能是不明顯的外部寫入
   - 檔案路徑：`C:\Users\Owner\Desktop\PAVORA IP\Pavora-ip-github-analysis-20260518\src\shared\stores\useModelStore.ts`
   - 行號：193-237
   - 問題描述：gallery update 時會自動檢查 Google Drive 連線，若已連線就 list/create folders 並同步圖片。
   - 影響：使用者可能只以為在本機儲存，實際上產生外部 Drive 寫入；若生成量大，也可能累積大量雲端檔案。
   - 建議修法：把 auto-sync 改成明確設定或每次 session 顯示同步狀態；新增「只存本機」與「同步 Drive」的清楚切換。
   - 是否需要我決策：需要。這是產品流程選擇。

5. bundle 體積偏大
   - 檔案路徑：`C:\Users\Owner\Desktop\PAVORA IP\Pavora-ip-github-analysis-20260518\vite.config.ts`
   - 行號：專案 build 設定整體
   - 問題描述：build 通過，但主 chunk 約 `4.35 MB`，且多個 dynamic import 因 static import 重疊無法分包。
   - 影響：若上線，首次載入與手機網路體驗可能偏慢。
   - 建議修法：整理 route-level lazy loading、拆分大型 AI/素材/工具模組；先不要做大重構，建議在功能穩定後獨立處理。
   - 是否需要我決策：不需要，但建議排在安全與生成可靠性之後。

### P3

1. 首頁仍偏工具 dashboard，和 Narrative workbench 的商業 editorial 質感不完全一致
   - 檔案路徑：`C:\Users\Owner\Desktop\PAVORA IP\Pavora-ip-github-analysis-20260518\src\shell\HomePage.tsx`
   - 行號：176-244
   - 問題描述：首頁有新手引導，但整體仍是大型卡片/工具入口語言，較像 generic AI dashboard；和已接受的 PAVORA premium commerce/editorial 方向相比不夠一致。
   - 影響：第一印象可能比 Narrative workbench 弱，品牌感落差大。
   - 建議修法：維持現有功能入口，但用更商業電商/品牌工作室的資訊架構與視覺語言重整首頁。
   - 是否需要我決策：需要。這是品牌設計方向。

2. NarrativeWorkflow 仍有舊區塊與多處重複 CTA 的維護風險
   - 檔案路徑：`C:\Users\Owner\Desktop\PAVORA IP\Pavora-ip-github-analysis-20260518\src\modules\narrative\NarrativeWorkflow.tsx`
   - 行號：1294 起，以及多個 Step 4/Step 5 CTA 區域
   - 問題描述：檔案內存在大型改版後的新 studio 結構，也保留多個重複操作入口。雖然目前可能是刻意保留，但維護與視覺 QA 成本偏高。
   - 影響：後續修功能時容易改到其中一個入口，另一個入口不同步。
   - 建議修法：先不要重構；等安全與生成流程修完後，做一次只針對 CTA/狀態入口的收斂。
   - 是否需要我決策：不需要，但執行前要確認不改 5-step 商業流程。

3. 沒有 test script
   - 檔案路徑：`C:\Users\Owner\Desktop\PAVORA IP\Pavora-ip-github-analysis-20260518\package.json`
   - 行號：scripts 區塊
   - 問題描述：目前沒有 `npm test`，只能靠 typecheck/build/手動流程檢查。
   - 影響：prompt、路由、store migration、API payload 這類高風險邏輯缺少回歸保護。
   - 建議修法：先新增最小 smoke tests 或 pure function tests，例如 prompt sanitizer、route mapping、random scene rule、payload builder。
   - 是否需要我決策：需要。新增測試工具前需確認是否允許安裝測試套件。

## PAVORA 核心功能觀察

- 5-step narrative workflow 仍存在，UI 也保留 scene -> outfit -> diary/prompt -> image -> finish/save 的主軸。
- `handleGenerateDiary`、`handleGenerateImage`、`handleFinish` 仍串接在 NarrativeWorkflow 內，商業流程沒有在靜態檢查中看到被完全移除。
- Handoff v21 提到的 `worldAnchors`、`iconicItems`、`pet` schema 相關風險，在目前 `ModelSetup.tsx` 與 `modelCreationService.ts` 中已看到部分修補痕跡；但未做真實模型生成，因此只能說靜態上未見明顯斷線。
- 最大風險不是 UI 改掉 5-step，而是失敗 fallback、prompt 污染、隨機場景合理性與 API 安全。

## 尚未能驗證的項目與原因

- 未真實大量呼叫 Gemini / image generation API：使用者要求避免大量真實 AI/API 呼叫。
- 未驗證 Google OAuth / Drive / Firebase 實際登入與寫入：會涉及外部帳號與真實 API。
- 未驗證完整瀏覽器互動流程：本次 headless Chrome 截圖結果為 `ERR_CONNECTION_REFUSED`，只能以 HTTP 200 與靜態檢查作為依據。
- 未驗證手機實際版面截圖：同上，瀏覽器截圖不可靠。
- 未執行 `npm test`：專案沒有 test script。
- 未安裝任何新測試工具：遵守使用者要求。
