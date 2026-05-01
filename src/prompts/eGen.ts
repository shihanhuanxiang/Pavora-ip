
export const EGEN_ANALYSIS_PROMPT = `
### [核心指令：多維產品 DNA 刻錄 4.0]
分析提供的產品參考圖及其標註的角度。你的任務是從這組圖片中提取「絕對真實」的物理與光學特徵。

請根據標註的角度精確識別並記錄以下內容：
1. **LOGO 完整性**：記錄 LOGO 在不同視角下的外觀、比例與質感。
2. **材質特徵**：布料紋理、縫線、五金件的微觀細節。
3. **光學屬性 (Optical Properties)**：識別材質的反射率 (Reflectivity)、透明度 (Transparency)、光澤度 (Glossiness) 與次表面散射特徵。
4. **結構對齊**：對齊正面、背面、側面的具體構造。

必須以【繁體中文】返回 JSON：
{
  "basic_info": {
    "category": "品類名稱",
    "color": "精確顏色描述",
    "material": "材質詳細分析",
    "optical": "光學屬性描述 (如：高光澤鏡面、啞光漫反射、半透明磨砂)"
  },
  "branding_audit": "詳細描述 LOGO 的文字內容、樣式與工藝",
  "physical_traits": ["特徵1", "特徵2", "特徵3"],
  "selling_points": ["核心賣點1", "核心賣點2"]
}
`;

export const EGEN_STYLE_DEF_PROMPT = (analysisJson: string) => `
根據產品多維分析，規劃 Pavora 4.0 旗艦級視覺系統 (KV System)。
分析數據：${analysisJson}

請以【繁體中文】返回 JSON，並包含專業攝影維度：
{
  "palette": {
    "main": "十六進位主色",
    "accent": "十六進位輔助色",
    "bg": "背景環境描述 (需能襯托材質質感)"
  },
  "lighting_protocol": "專業攝影燈位描述 (如：三點式佈光、雷達罩硬光、側逆光輪廓、柔光箱背光)",
  "material_response": "材質對光線的物理反應規則 (如：強調金屬邊緣高光、織物紋理陰影補償)",
  "visual_vibe": "視覺氛圍 (例如：現代極簡攝影，強調高對比光影以突顯紋理)"
}
`;

export const EGEN_COPYWRITING_PROMPT = (analysisJson: string) => `
為 9 個視覺單元生成【繁體中文】營銷文案。
背景內容：${analysisJson}

返回 JSON 對象，包含 "poster_1" 到 "poster_9"：
每個值為：{ "title": "標題", "subtitle": "副標", "bullets": ["賣點1", "賣點2"] }
`;

// 定義九個單元的具體視角 (Phase 2: 商業視覺矩陣 4.0)
export const EGEN_MATRIX_CELLS = [
    { id: 'hero_34', label: '黃金 3/4 視角', prompt: 'Hero shot from a 3/4 dynamic angle, emphasizing product volume and depth. High-end commercial lighting.' },
    { id: 'flat_lay_spec', label: '平鋪規格圖', prompt: 'Top-down flat lay composition, perfectly symmetrical, clean shadows, optimized for technical spec overlay.' },
    { id: 'macro_craft', label: '工藝細節特寫', prompt: 'Extreme macro close-up on a key design element, shallow depth of field, emphasizing premium craftsmanship.' },
    { id: 'branding_hero', label: '品牌標識像', prompt: 'Focused shot on the branding/logo, using rim lighting to highlight texture and metallic/embroidery finish.' },
    { id: 'material_dna', label: '材質肌理圖', prompt: 'Microscopic focus on fabric weave or material texture, high-contrast lighting to reveal surface detail.' },
    { id: 'lifestyle_narrative_a', label: '敘事生活化 A', prompt: 'Product integrated into an elegant, high-end interior scene. Rule of thirds composition, natural sunlight through a window.' },
    { id: 'lifestyle_narrative_b', label: '敘事生活化 B', prompt: 'Product in an outdoor urban or natural setting, shallow depth of field, bokeh background, cinematic atmosphere.' },
    { id: 'negative_space_poster', label: '留白海報位', prompt: 'Minimalist composition with significant negative space on one side, designed for large typography placement.' },
    { id: 'mood_abstract', label: '藝術情緒渲染', prompt: 'Abstract artistic composition using dramatic shadows, reflections, and creative lighting to evoke brand emotion.' }
];

export const buildEGenSingleGridPrompt = (analysis: any, style: any, anchorsContext: string, manualDescription?: string) => {
    const { basic_info, branding_audit } = analysis;
    const { palette, visual_vibe, lighting_protocol, material_response } = style;

    return `
**[TASK: 3x3 E-COMMERCE PRODUCT LOOKBOOK GRID 4.0]**
Create a professional 3:4 fashion lookbook collage poster on a single canvas.

**[CORE IDENTITY & OPTICAL LOCK]**
- SUBJECT: The EXACT product from the reference images: ${anchorsContext}.
- FIDELITY: 100% strict adherence to color (${basic_info.color}), material (${basic_info.material}), and ${branding_audit}.
- OPTICAL: ${basic_info.optical}.
${manualDescription ? `- MANUAL SPECIFICATIONS: ${manualDescription}` : ''}

**[LIGHTING & MATERIAL PROTOCOL]**
- LIGHTING: ${lighting_protocol}.
- RESPONSE: ${material_response}.

**[LAYOUT STRUCTURE]**
Generate a single image divided into a clean 3x3 grid (9 cells):
- TOP ROW: Front View, Back View, Side Profile.
- MIDDLE ROW: Macro Logo, Macro Texture, Hardware Detail.
- BOTTOM ROW: 3 different Lifestyle/Atmospheric shots in a ${palette.bg}.

[STYLE]: ${visual_vibe}. 8k resolution, photorealistic, clean studio layout. NO TEXT.
`.trim();
};

export const buildEGenBatchPrompt = (cell: any, analysis: any, style: any, anchorsContext: string, manualDescription?: string) => {
    const { basic_info, branding_audit } = analysis;
    const { palette, visual_vibe, lighting_protocol, material_response } = style;

    return `
**[TASK: HIGH-END E-COMMERCE RENDER 4.0]**
View Type: ${cell.label}.
Reference Source: ${anchorsContext}.

[PHYSICAL CONSTRAINTS]: 
1. 100% product consistency. Match ${basic_info.color} and ${basic_info.material} perfectly.
2. Optical Property: ${basic_info.optical}.
3. Execute: ${cell.prompt}.

[LIGHTING & MATERIAL]:
- Lighting Setup: ${lighting_protocol}.
- Material Interaction: ${material_response}.
- Background: ${palette.bg}.
${manualDescription ? `4. PRODUCT DATA: ${manualDescription}` : ''}

[STYLE]: ${visual_vibe}. 8k, raw photography, sharp focus. NO TEXT.
`.trim();
};
