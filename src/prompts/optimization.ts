
export const buildOptimizationPrompt = (params: any) => {
    const qualityFlags = params.quality || [];
    const isSkinEnabled = qualityFlags.includes('skin-texture');
    const isFabricEnabled = qualityFlags.includes('fabric-fidelity');
    const is8kEnabled = qualityFlags.includes('8k-reconstruct');
    const isRimLightEnabled = qualityFlags.includes('rim-light');
    const isCatchlightEnabled = qualityFlags.includes('catchlight');

    let texturePrompt = "";
    if (isSkinEnabled) {
        texturePrompt += "Apply high-end frequency separation. Reconstruct realistic skin micro-texture including visible pores, fine hairs, and natural skin oils. Eliminate AI plastic smoothness. ";
    }
    if (isFabricEnabled) {
        texturePrompt += `Focus on material fidelity for ${params.materialFocus || 'clothing'}. Enhance thread count visibility, weave patterns, and specular highlights on fabric. `;
    }
    if (is8kEnabled) {
        texturePrompt += "Execute 8K detail reconstruction protocol. Sharpen micro-details to extreme clarity. Add a layer of very fine, clean film grain to simulate high-end digital sensor noise and avoid artificial smoothness. ";
    }

    let lightingPrompt = "";
    if (isRimLightEnabled) {
        lightingPrompt += "Add a subtle, professional rim light (back-side kick) to separate the subject from the background, emphasizing silhouettes and hair edges. ";
    }
    if (isCatchlightEnabled) {
        lightingPrompt += `Inject a ${params.catchlightStyle || 'natural'} catchlight into the eyes to add vitality and a professional studio look. `;
    }
    if (params.fillLight && params.fillLight !== 'none') {
        lightingPrompt += `Apply virtual fill light (${params.fillLight}) to soften harsh shadows on the face and body, ensuring balanced professional exposure. `;
    }

    let colorSciencePrompt = "";
    if (params.filmStock && params.filmStock !== 'none') {
        colorSciencePrompt += `Apply ${params.filmStock} film simulation. Emulate its specific color response, highlight roll-off, and shadow density. `;
    }
    if (params.colorGrading && params.colorGrading !== 'natural') {
        colorSciencePrompt += `Apply ${params.colorGrading} color grading style for a cinematic look. `;
    }

    return `Optimize this image for professional high-fashion photography.
Re-angle: Yaw ${params.yaw}, Pitch ${params.pitch}, Roll ${params.roll}.
Lighting: ${params.lightDirection} ${params.lightStyle}.
${lightingPrompt}
${colorSciencePrompt}
Composition: ${params.composition}. Focal Length: ${params.focalLength}.
Aspect Ratio: ${params.aspectRatio}.
${texturePrompt}
Texture Intensity: ${params.textureIntensity || 'natural'}.
Quality: ${qualityFlags.join(', ')}.
Edits: Add ${params.addObject}, Remove ${params.removeObject}, Style ${params.changeStyle}.
Target Resolution: ${params.resolution}.
${params.additionalPrompt || ''}`;
};

export const REALISM_ANALYSIS_PROMPT = `請分析這張圖片的寫實度與攝影品質。
請以 JSON 格式回傳，且內容必須使用繁體中文 (Traditional Chinese)：
{ 
  "critique_zh": "專業的分析報告，指出優點與待改進之處", 
  "suggested_params": { 
    "composition": "default", 
    "lightDirection": "front", 
    "lightStyle": "soft", 
    "focalLength": "85mm", 
    "depthOfField": "medium", 
    "quality": ["enhance-details", "color-correction"],
    "additional_prompt": "額外的優化建議提示詞" 
  } 
}
注意：suggested_params 中的值必須符合預設的選項值（例如 composition 只能是 default, rule_of_thirds, center）。`;
