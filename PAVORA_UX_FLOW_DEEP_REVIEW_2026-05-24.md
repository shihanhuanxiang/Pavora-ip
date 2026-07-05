# PAVORA UX Flow Deep Review - 2026-05-24

## 目前使用者流程地圖

### A. 進入專案

1. 使用者開啟 PAVORA 首頁。
2. 選擇 project mode 或從首頁功能卡進入不同工具。
3. Commerce 方向可進入商品、行銷、品牌素材類工具。
4. IP 方向可進入 model creation、model lounge、narrative、wardrobe、scene、hair salon 等工具。

### B. PAVORA IP 建立與管理

1. 首頁進入 `model_setup`。
2. 建立或補齊 IP model：照片、persona、世界觀 anchor、pet、iconic items、風格偏好。
3. 儲存後進入 Model Lounge。
4. Model Lounge 選擇 active model。
5. 由 active model 進入 NarrativeWorkflow。

### C. Soul Narrative 5-step workflow

1. Step 1：選擇或隨機場景。
2. Step 2：選擇 outfit，或使用自動搭配。
3. Step 3：輸入事件、使用 random event，或生成 diary/story。
4. Step 4：確認 prompt、同步中英文 prompt、生成圖片。
5. Step 5：預覽生成圖、文案/caption、carousel、finish/save，回到 Model Lounge 或保存 gallery。

### D. 資料與輸出流向

1. model/persona/preferences 主要進入 Zustand store 與 localStorage metadata。
2. 大圖資料主要走 IndexedDB reference，store 只保留 metadata 與最多 20 筆 gallery 摘要。
3. 若 Google Drive 已連線，gallery update 可能自動同步到 Drive。
4. Narrative 最終 prompt 會進入 image generation path，生成結果再包入 identity metadata。

## 操作者角度問題清單

### 1. 使用者直接進入主要 URL 時，看到的頁面可能不是預期頁

- 問題：HTTP 上 `/model-lounge`、`/model-creation` 都能回 200，但 App 內 route mapping 只支援 `/narrative`。
- 操作者感受：貼給別人或重新整理後，可能以為連結壞掉，因為畫面回首頁。
- 建議：補齊正式 deep link，或不要讓 URL 看起來像可直連。

### 2. 首頁知道「可以做什麼」，但不夠像 PAVORA 品牌工作室

- 問題：首頁已有新手引導，功能也夠多，但視覺語言仍偏通用 AI dashboard。
- 操作者感受：第一次進入會知道有很多工具，但不一定感受到高質感商業電商 / editorial 品牌方向。
- 建議：保留功能入口，重整成「品牌工作室 / IP showroom / editorial production」的首頁結構。

### 3. Narrative 失敗時可能被包成成功，使用者不會知道真正問題

- 問題：diary 生成失敗會變成 fallback diary 並進入 Step 4。
- 操作者感受：看起來像成功，但內容可能是備援文字，後續再送圖片會浪費額度。
- 建議：失敗要清楚停在目前步驟，顯示「無法產生故事，請重試或改事件」，不要自動進下一步。

### 4. 同一步驟可能有多個相近操作入口

- 問題：Narrative workbench 有側欄、底部、Step panel、preview panel 等多個 CTA 入口。
- 操作者感受：進階使用者會覺得方便，但新使用者可能不確定哪個按鈕才是主流程。
- 建議：每一步只保留一個主 CTA，其他入口改成次要 icon 或折疊工具。

### 5. 生成成本與外部寫入提示不足

- 問題：生成圖片、同步 Drive、可能產生 caption/carousel 等行為，對非工程背景使用者不一定清楚哪些會消耗 API 或寫入雲端。
- 操作者感受：以為只是預覽，實際上可能消耗額度或建立 Drive 檔案。
- 建議：把「會消耗 AI 額度」與「會同步到 Google Drive」做成清楚狀態，而不是每次彈窗打擾。

### 6. 行動裝置視覺尚未有效驗證

- 問題：本次 headless Chrome 截圖驗證失敗，因此無法確認 mobile/narrow viewport 是否破版。
- 操作者感受：目前只能從程式碼推測，不能保證手機版按鈕、長文字、側欄與 Step panel 不會擠壓。
- 建議：下一階段修完高風險邏輯後，必須做一次真瀏覽器桌機/手機截圖驗證。

## UI/UX 建議調整

1. 把正式 route policy 補齊
   - 若 PAVORA 要像產品一樣使用，`/model-lounge`、`/model-creation`、`/narrative` 這些主要頁面應該可重整、可分享、可回上一頁。

2. Narrative 每一步只保留一個主操作
   - Step 1 主 CTA：確認場景。
   - Step 2 主 CTA：確認造型。
   - Step 3 主 CTA：生成故事。
   - Step 4 主 CTA：生成圖片。
   - Step 5 主 CTA：保存/完成。
   - 其他功能放在 tool tray，不和主 CTA 搶視覺層級。

3. 失敗訊息改成「下一步可做什麼」
   - 例如「故事生成失敗，請先檢查事件是否太短，或直接按重試」。
   - 避免只顯示 AI engine error 或 console 型描述。

4. 成本與外部同步要有固定狀態區
   - 不建議每次都彈窗。
   - 建議在生成按鈕旁顯示小型狀態：`會使用 AI 額度`、`Drive 同步：開啟/關閉`、`目前模型：Flash/Pro`。

5. 保留已接受的 Narrative editorial 方向
   - 不建議把 Narrative workbench 改回一般 dashboard。
   - 首頁與 Model Lounge 應往 Narrative 的品牌質感靠近，而不是反過來。

6. 手機版要做專門版型，而不是只縮小桌機
   - 重要區域：側欄、Step rail、prompt editor、preview image、bottom CTA。
   - 手機上應優先顯示當前步驟與主 CTA，次要工具收進抽屜。

## 可能上線後才會遇到的隱憂

1. API key / proxy 被外部濫用
   - 這是最嚴重上線風險。若公開部署，可能直接造成額度損失。

2. localStorage / IndexedDB / Drive 長期累積
   - store 已限制 gallery metadata 為 20 筆，但 IndexedDB 與 Drive 實際圖片仍可能長期累積，需要清理策略。

3. 使用者誤以為 fallback 內容是 AI 正常生成
   - 會讓 gallery 混入低品質、非預期或 prompt 污染內容。

4. 手機首次載入慢
   - build 主 chunk 約 4.35 MB，若上線到一般手機網路，首次載入可能明顯偏慢。

5. route refresh 造成操作中斷
   - 使用者在 Model Lounge 或 Model Creation 重整後可能回首頁，流程感會斷。

6. Prompt 中英文混用造成生成品質不穩
   - UI 可以繁中，但 final visual prompt 若混入中文或 legacy field，可能造成 Gemini 圖像結果不穩。

## 建議分包修正企劃

### Package 1：API 安全與額度保護

- 目標：移除前端取得 API key 的路徑，保護 Gemini proxy。
- 檔案範圍：
  - `server.ts`
  - `src\shared\services\core\geminiClient.ts`
  - `src\shared\utils\imageUtils.ts`
  - `src\modules\directorMode\`
  - `src\shared\components\common\VideoPlayer.tsx`
- 驗收方式：
  - `rg "getApiKey\\(" src` 不再出現需要 client key 的生成路徑。
  - `/api/config` 不再回傳 real key。
  - Gemini proxy 有 auth/rate/allowlist 基本防護。
  - `npm.cmd run lint` 通過。
  - build 通過。
- 風險：需要先決定本機工具和公開部署的安全策略。

### Package 2：Narrative 生成狀態與防重送

- 目標：讓失敗、重試、等待、成功、取消有明確 UI 狀態，避免 hidden fallback 與重複送出。
- 檔案範圍：
  - `src\modules\narrative\NarrativeWorkflow.tsx`
  - `src\modules\narrative\services\narrativeService.ts`
  - 必要時調整 notification 文案。
- 驗收方式：
  - diary 失敗不自動進 Step 4。
  - image generation 同一時間不能重複送出。
  - UI 對非工程使用者說明下一步。
  - 不改 5-step 商業流程。
- 風險：fallback 是否保留需產品決策。

### Package 3：Prompt / random scene guardrail 清理

- 目標：確保 final visual prompt en-US、場景動作合理、legacy outfit/facial mark 不污染生成流程。
- 檔案範圍：
  - `src\modules\narrative\services\narrativeService.ts`
  - `src\modules\narrative\constants\extendedScenesPart*.ts`
  - `src\shared\services\promptSanitizer.ts`
  - `src\shared\types\types.ts`
  - `src\modules\modelCreation\services\*.ts`
  - 視決策可能包含 `HairSalon` / `CharacterLab`
- 驗收方式：
  - final prompt 若含中文會阻擋或先翻譯。
  - `outfit_hint` 不再作為 final prompt source。
  - random action/prop 由 scene-safe rule 控制。
  - prompt leak scan 通過。
- 風險：場景合理性牽涉 PAVORA 敘事策略，需 Hank/Claude 決策。

### Package 4：Route、初始化與儲存可靠性

- 目標：避免畫面可見但流程 state 錯、重新整理回首頁、sessionStorage 壞資料白畫面。
- 檔案範圍：
  - `src\shell\App.tsx`
  - `src\shared\stores\useModelStore.ts`
  - 必要時加小型 route smoke test。
- 驗收方式：
  - `/model-lounge`、`/model-creation`、`/narrative` 重整後進入正確 workflow。
  - 壞掉的 `pavora_editing_image` 不會 crash。
  - Drive 同步狀態明確可見或可關閉。
- 風險：是否支援正式 deep link 需先決策。

### Package 5：UI/mobile visual QA 與首頁品牌一致性

- 目標：保留 Narrative 已接受的 editorial 商業質感，補齊首頁與 mobile 實際操作體驗。
- 檔案範圍：
  - `src\shell\HomePage.tsx`
  - `src\modules\narrative\NarrativeWorkflow.tsx`
  - `index.css`
  - brand assets 如有需要
- 驗收方式：
  - 桌機與手機截圖驗證。
  - Narrative 5-step 不變。
  - 首頁不再像 generic dashboard。
  - 主要按鈕文字不破版、不重疊。
- 風險：這是視覺設計工作，需先確認方向再改。
