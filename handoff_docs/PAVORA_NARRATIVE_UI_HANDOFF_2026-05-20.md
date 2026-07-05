# PAVORA Narrative UI Handoff - 2026-05-20

## Current Project

Active project served on localhost:

`C:\Users\shiha\OneDrive\Desktop\AiStudio\Pavora-ip-github-analysis-20260518`

Important note: an earlier clean package also exists at:

`C:\Users\shiha\OneDrive\Desktop\AiStudio\PAVORA-v21-clean\Pavora-ip-main`

The live `localhost:3000` app was confirmed to serve from `Pavora-ip-github-analysis-20260518`, so all latest UI fixes were applied there.

## Edited Files

- `src/modules/narrative/NarrativeWorkflow.tsx`
- `index.css`
- `handoff_docs/PAVORA_NARRATIVE_UI_HANDOFF_2026-05-20.md`

## Design Source

The target design reference is the local preview file:

`C:\Users\shiha\OneDrive\Desktop\AiStudio\PAVORA-v21-clean\Pavora-ip-main\design_previews\narrative-open-design-preview.html`

The requested direction is the Open Design-style five-stage "Soul Narrative" workflow:

1. Stage 01 - Scene Casting / 場景定錨
2. Stage 02 - Wardrobe Casting / 造型選角
3. Stage 03 - Narrative Script / 敘事編排
4. Stage 04 - Prompt Review / 鏡頭審閱
5. Stage 05 - Delivery Desk / 發布交付

## Implemented Changes

### Global Five-Stage Layout

- Added `NARRATIVE_STAGE_META` in `NarrativeWorkflow.tsx`.
- Added the five-stage progress track in the topbar.
- Added Open Design-style warm paper grid background.
- Added `narrative-screen-head` large stage headers.
- Added dark ink / gold CTA treatment for stage actions.

### Stage 01

- Added large `Stage 01 · Scene Casting` header.
- Added right-side `確認場景 ->` CTA.
- Scene cards styled as tall tarot-like cards.
- AI 感應 card kept as dark featured tarot card.
- Filters use dark ink active state.

### Stage 02

- Added large `Stage 02 · Wardrobe Casting` header.
- Added right-side `選定造型 ->` CTA.
- Outfit options styled as tarot-like cards.
- AI 推薦 card kept as dark featured card.

### Stage 03

- Added `Stage 03 · Narrative Script` header.
- Removed image preview from Stage 03. Image preview belongs only to Stage 05.
- Hid the old external summary bar.
- Added left-panel metric row:
  - 場景
  - 造型
  - 人格
  - 狀態
- Removed the old `FinalShootCard` from Stage 03.
- Removed the old "切換後請重新點擊同步靈魂敘事" hint.
- Forced Stage 03 panel text to warm-paper dark ink colors.

### Stage 04

- Added `Stage 04 · Prompt Review` header.
- Added review toolbar matching preview:
  - 檢查差異
  - ⇄ 雙向同步
- Prompt review panels are styled as warm paper blocks.

### Stage 05

- Stage 05 is a left/right delivery desk:
  - Left: image preview and thumbnails.
  - Right: delivery copy, platform tabs, workflow return actions, carousel variation actions, final action buttons.
- Removed extra Stage 05 top header so it matches the preview more closely.
- Added final color lock CSS to keep Stage 05 readable:
  - Right panel text is dark ink.
  - Caption editor is warm white with dark text.
  - Platform tabs use readable ink colors.
  - Action buttons use high-contrast text.
  - Primary button uses dark ink background with white text.

## Verification

Commands already run:

```powershell
npx tsc --noEmit
```

Result: 0 TypeScript errors.

Local app status after restart:

```powershell
Invoke-WebRequest -UseBasicParsing -Uri http://localhost:3000/narrative -TimeoutSec 5
```

Result: HTTP 200.

## Known Caveats

- User has been comparing against `design_previews/narrative-open-design-preview.html`; future work should continue comparing each stage visually against that file.
- Some old Tailwind utility classes remain in JSX. Most visual parity is currently enforced by stronger CSS overrides in `index.css`.
- If a future agent sees unchanged UI in browser, first confirm which folder `localhost:3000` is serving. Earlier confusion came from editing `PAVORA-v21-clean\Pavora-ip-main` while port 3000 served `Pavora-ip-github-analysis-20260518`.
- Use `Ctrl + F5` after CSS changes because Vite/browser cache sometimes keeps stale styles.

## Recommended Next QA Pass

1. Open `http://localhost:3000/narrative`.
2. Walk through all five stages with a generated image available.
3. Compare every stage against `design_previews/narrative-open-design-preview.html`.
4. Focus especially on:
   - Stage 03 exact visual parity.
   - Stage 05 right-panel contrast.
   - Whether bottom commandbar duplicates actions already present in the stage.

