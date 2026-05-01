
export const buildApparelBasePrompt = (params: any) => 
    `Design: ${params.taxonomyEntry.display_name_en}. 
    Brand: ${params.brandDefinition?.display_name || 'Custom'}. 
    Brand Aesthetic: ${params.brandDefinition?.stylePrompt || ''} ${params.customBrandStyle}. 
    Color: ${params.colors.join(', ')}. 
    Pattern: ${params.pattern}.
    Texture & Detail: Photorealistic fabric texture, high fashion photography lighting.`;

export const PACKSHOT_SUFFIX = "View: Flat lay on white background. High quality product photography. Clean isolation.";
export const MODEL_FRONT_SUFFIX = "View: Model wearing the item, front view. Full body. Photorealistic editorial shot.";
export const MODEL_BACK_SUFFIX = "View: Model wearing the item, back view. Full body. Photorealistic editorial shot.";

export const ANALYZE_APPAREL_PROMPT = `Analyze this apparel item. Return JSON: { color: string, material: string, occasion: string, season: string, tags: string[] }`;
