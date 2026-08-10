
/**
 * 2026-08-09（企劃案 A-2／AD-1）：img2img 專用指令。
 *
 * 改版前的問題：上傳參考圖時，送出去的 prompt 與「沒有上傳圖」時**逐字相同**
 * （`buildApparelBasePrompt`），整段是「從零設計一件新衣服」的規格書，
 * 從頭到尾沒有一個字提到那張圖。模型收到「一張沒有說明的圖 ＋ 一份從零開始的規格」，
 * 怎麼處理全憑運氣 —— 這就是「服裝設計基本沒在用」的根因（規劃檔第 4-1 節）。
 *
 * 這份指令只做一件事：**把附圖當基底，鎖住版型與結構，只改使用者明確指定的項目。**
 * 沒有指定任何項目時退化成「忠實重拍」，而不是「重新設計」。
 */
export const buildApparelRedesignPrompt = (params: any) => {
    const designName = params.taxonomyEntry?.display_name_en || params.detectedItemType || 'the garment in the reference image';
    const brandName = params.brandDefinition?.display_name || '';
    const brandAesthetic = [params.brandDefinition?.stylePrompt, params.customBrandStyle].filter(Boolean).join(' ');
    const colorList = (params.colors || []).join(', ');
    const pattern = params.pattern;
    const sourceAnalysis = params.sourceAnalysis;

    // 只把使用者「真的填了」的項目列進允許變更清單。空清單＝忠實重拍，不是重新設計。
    const changes: string[] = [];
    if (colorList) changes.push(`COLORWAY — recolor the garment to: ${colorList}. Apply the new color to the garment fabric only; do not change where seams, panels or closures sit.`);
    if (pattern) changes.push(`PATTERN / PRINT — apply this surface pattern: ${pattern}. The pattern sits on top of the existing fabric; it must follow the garment's existing drape, folds and seam lines.`);
    if (brandAesthetic) changes.push(`BRAND DESIGN LANGUAGE — reinterpret the surface design details in this aesthetic${brandName ? ` (${brandName})` : ''}: ${brandAesthetic}. This affects trims, hardware finish, print treatment and styling cues ONLY — it must not change the garment's silhouette, length or cut.`);

    const changeBlock = changes.length > 0
        ? changes.map((c, i) => `${i + 1}. ${c}`).join('\n')
        : `NONE. No design change was requested. Reproduce the reference garment faithfully and only re-render it to the photographic standard below.`;

    return `[TASK: APPAREL REDESIGN FROM REFERENCE IMAGE — IMG2IMG]
You are a senior fashion designer performing a controlled redesign. The FIRST image provided is the SOURCE GARMENT. It is the basis of this task, not an inspiration board.

[ABSOLUTE BASE — DO NOT ALTER]
- The source garment's SILHOUETTE, CUT, LENGTH, PROPORTIONS and CONSTRUCTION are locked. Reproduce them exactly.
- Preserve: neckline shape, sleeve length and shape, hem length and finish, waist position, closure type and placement, pocket placement, panel and seam layout, collar/lapel shape.
- Do NOT add, remove or relocate any structural element that is not visible in the source image (no new seams, no new panels, no new pleats, no new hardware, no added layers).
- Do NOT reinterpret the garment as a different item type.
- Reference item: ${designName}${sourceAnalysis ? `\n- Detected source material / construction: ${sourceAnalysis}` : ''}

[PERMITTED CHANGES — apply ONLY these]
${changeBlock}

[MATERIAL & CONSTRUCTION STANDARD]
- Fabric must exhibit realistic physical properties: visible weave structure, natural drape, and correct weight behavior.
- Surface texture must be photorealistic — not illustrated or CGI. Thread count, sheen level, and material grain should be clearly legible.
- Existing stitching, seams, buttons and zippers must be rendered exactly as they appear in the source image.
${colorList ? `- Color accuracy is mandatory: ${colorList} must match exactly under neutral studio lighting.` : ''}

[PHOTOGRAPHY STANDARD]
- Lighting: Professional studio setup. Even, soft, directional light to reveal garment texture and silhouette.
- Shadows: Natural contact shadows. No floating or ungrounded elements.
- Focus: Tack-sharp on key design details (collar, buttons, seams, patterns).
- Output quality: High-end e-commerce or editorial catalog standard.

[CONSTRAINTS]
- No models or body parts unless specified by view suffix.
- No lifestyle backgrounds unless specified.
- No text, watermarks, or logos beyond the garment's own design.
- No cartoon or illustration rendering style.`;
};

export const buildApparelBasePrompt = (params: any) => {
    const designName = params.taxonomyEntry.display_name_en;
    const brandName = params.brandDefinition?.display_name || 'Custom';
    const brandAesthetic = [params.brandDefinition?.stylePrompt, params.customBrandStyle].filter(Boolean).join(' ');
    const colorList = params.colors.join(', ');
    const pattern = params.pattern;

    return `[TASK: HIGH-END FASHION APPAREL DESIGN GENERATION]
You are a senior fashion designer and commercial apparel photographer. Generate a photorealistic image of the specified garment at professional catalog quality.

[GARMENT SPECIFICATION]
- Item Type: ${designName}
- Brand: ${brandName}
- Brand Aesthetic: ${brandAesthetic || 'Contemporary fashion, clean and modern'}
- Colorway: ${colorList}
- Pattern / Print: ${pattern || 'Solid / None'}

[MATERIAL & CONSTRUCTION STANDARD]
- Fabric must exhibit realistic physical properties: visible weave structure, natural drape, and correct weight behavior.
- Surface texture must be photorealistic — not illustrated or CGI. Thread count, sheen level, and material grain should be clearly legible.
- Stitching, seams, buttons, zippers, and construction details must be precisely rendered.
- Color accuracy is mandatory: ${colorList} must match exactly under neutral studio lighting.

[PHOTOGRAPHY STANDARD]
- Lighting: Professional studio setup. Even, soft, directional light to reveal garment texture and silhouette.
- Shadows: Natural contact shadows. No floating or ungrounded elements.
- Focus: Tack-sharp on key design details (collar, buttons, seams, patterns).
- Output quality: High-end e-commerce or editorial catalog standard.

[CONSTRAINTS]
- No models or body parts unless specified by view suffix.
- No lifestyle backgrounds unless specified.
- No text, watermarks, or logos beyond the garment's own design.
- No cartoon or illustration rendering style.`;
};

export const PACKSHOT_SUFFIX = `
[VIEW: PACKSHOT — FLAT LAY]
Layout: Neatly arranged flat lay (knolling style). Item placed symmetrically on a pure white background (#FFFFFF).
Ghost mannequin effect if the item has a defined 3D structure. No body parts.
Ensure all design details, labels, and closures are fully visible.`;

export const MODEL_FRONT_SUFFIX = `
[VIEW: MODEL — FRONT]
A professional model wears the item. Full body shot, front-facing.
Natural standing pose, neutral background (white or soft grey studio).
Photorealistic editorial quality. Model identity should not dominate — the garment is the hero.`;

export const MODEL_BACK_SUFFIX = `
[VIEW: MODEL — BACK]
A professional model wears the item. Full body shot, rear-facing.
Natural standing pose, neutral background (white or soft grey studio).
Emphasize back construction details, seam lines, and silhouette from behind.`;

/**
 * 2026-08-09（企劃案 A-2／AD-2）：新增 `item_type` 與 `item_type_keywords` 兩欄。
 *
 * 動機：服裝設計上傳參考圖後要自動回填分類，但原本的回傳沒有「這是什麼衣服」。
 * 少了它，表單的分類永遠停在預設的 T恤，於是「上傳洋裝、指令寫 T-Shirt」
 * 這個直接矛盾就會一路送進生圖（企劃案 D-6）。
 *
 * `item_type_keywords` 是給程式比對 taxonomy 用的小寫單字，不是給人看的；
 * 比對不到就退回 `item_type` 原文，不要硬塞一個錯的分類。
 */
export const ANALYZE_APPAREL_PROMPT = `Analyze this apparel item image with precision. Return strictly valid JSON with no markdown:
{
  "item_type": "Concise garment name in English (e.g. 'Midi Slip Dress', 'Oversized Denim Jacket', 'Ribbed Knit Vest')",
  "item_type_keywords": ["lowercase", "single", "words", "for", "matching"],
  "color": "Primary color name and hex approximate (e.g. 'Ivory White #F5F0E8')",
  "material": "Estimated fabric type and properties (e.g. 'Heavyweight denim, structured, matte')",
  "occasion": "Best use context (e.g. 'Casual streetwear', 'Formal office', 'Evening event')",
  "season": "Suitable season(s) (e.g. 'Spring/Summer', 'All-season')",
  "tags": ["style tag 1", "style tag 2", "style tag 3", "style tag 4", "style tag 5"]
}`;
