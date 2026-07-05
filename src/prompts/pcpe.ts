
export const PCPE_DIAGNOSIS_PROMPT = (isModel: boolean) => `你現在是一位頂級的影像創意總監。請針對上傳的一張或多張影像進行「多維度綜合診斷」。
這些影像可能是同一個${isModel ? '人物' : '產品'}的不同角度、細節或光影表現。

[核心任務]：
1. 跨圖分析：對比所有上傳的影像，識別出主體的核心特徵（如：人物的面部特徵、產品的材質細節、品牌識別物）。
2. 特徵融合：從多張圖中提取最優視覺元素，構建一個完整的「主體特徵畫像」。
3. 診斷與建議：基於綜合觀察，給出專業的攝影與後期創意方向。

[輸出要求]：
- 必須回傳一個有效的 JSON 物件。
- 所有數值與描述請使用 繁體中文 (Traditional Chinese)。
- 嚴格遵守以下 Schema：

{
    "視覺摘要": { 
        "主體核心特徵": "綜合多圖觀察後，描述主體的最關鍵特徵（如：模特兒的氣質、產品的高級感來源）",
        "多角度觀察": "描述不同影像所展現的角度優勢（如：正面展現品牌、側面展現流線型）",
        "色彩與材質觀察": "綜合分析主體的真實色彩與表面質感細節",
        "環境適配性": "分析主體目前所處環境與理想海報環境的落差"
    },
    "問題診斷": { 
        "視覺缺陷": "分析現有影像在構圖、光影或主體呈現上的不足之處",
        "融合挑戰": "若要將主體置入新場景，可能遇到的透視或光影匹配問題"
    },
    "攝影方向": { 
        "鏡頭策略": "建議使用的焦段與視角，以強化主體美感",
        "主體控制": "建議如何調整主體的姿態或位置以達到最佳海報效果",
        "層次處理": "建議背景與主體之間的虛實、明暗對比關係"
    },
    "創意建議": { 
        "主體姿態優化": "具體的姿態調整建議（針對人物）或展示角度建議（針對產品）",
        "背景類型建議": "最能襯托該主體特徵的背景風格與色調",
        "道具與裝飾": "可增強畫面真實感或故事性的點綴物建議，並說明理由"
    }
}`;

export const PCPE_CARDS_PROMPT = (diagnosisJson: string) => `Based on the visual diagnosis, generate 4 DISTINCT and CREATIVE background concept cards for a high-end product/portrait poster.
Diagnosis: ${diagnosisJson}

STRICT JSON Output Schema (Array of 4 objects). DO NOT use Markdown.
[
  {
    "id": "card_1",
    "title": "Creative Title (Traditional Chinese)",
    "why": "Reasoning why this fits (Traditional Chinese)",
    "background": "Detailed English Image Prompt for Background",
    "camera": "English Camera Prompt (e.g. 'Low angle, 50mm')",
    "pose": "English Pose Prompt",
    "lighting": "English Lighting Prompt",
    "props": "English Props Prompt"
  }
]
Make them diverse: 1 Minimal, 1 Contextual, 1 Artistic, 1 Bold.`;

export const PCPE_OPTIONS_PROMPT = (diagnosisJson: string, cardJson: string) => `Generate 3 DISTINCT alternative fine-tuning options for EACH category based on the diagnosis and selected concept card.
Diagnosis: ${diagnosisJson}
Selected Concept: ${cardJson}

You MUST return a VALID JSON object with these EXACT keys. DO NOT use Markdown code blocks.
Schema:
{
  "bg_options": [ { "label_zh": "選項名稱", "purpose_zh": "用途描述", "background": "Detailed English prompt" }, ... ],
  "cam_options": [ { "label_zh": "選項名稱", "purpose_zh": "用途描述", "camera": "English prompt part" }, ... ],
  "pose_options": [ { "label_zh": "選項名稱", "purpose_zh": "用途描述", "pose": "English prompt part" }, ... ],
  "light_options": [ { "label_zh": "選項名稱", "purpose_zh": "用途描述", "lighting": "English prompt part" }, ... ],
  "props_options": [ { "label_zh": "選項名稱", "purpose_zh": "用途描述", "props": "English prompt part" }, ... ]
}

Rules:
1. Provide exactly 3 options per category.
2. Options must be DIFFERENT from the default card settings.
3. The prompt field (background, camera, pose, lighting, props) MUST NOT be empty.
4. Ensure the JSON is valid and follows the Traditional Chinese (繁體中文) requirement for labels and purposes.`;

export const buildPCPEPosterPrompt = (overrides: any, ratio: string, quality: string, colorLock?: string) => {
    let prompt = `Create a professional product poster. 
Subject: From Input 1. 
Background: ${overrides.background}.
Camera & Lens: ${overrides.camera}.
Lighting: ${overrides.lighting}.
Pose: ${overrides.pose}.
Props: ${overrides.props}.
Aspect Ratio: ${ratio}. Rendering Quality: ${quality}. 8k, photorealistic.`;

    if (colorLock) {
        prompt += `\n[COLOR REFERENCE LOCK]: The primary product color MUST be exactly ${colorLock}. Maintain strict color fidelity for the product surface.`;
    }
    return prompt;
};
