
export const PROMPT_ANALYSIS_PROMPT = `
You are a professional photographer and prompt engineer.
Deconstruct this image into a generative AI prompt and detailed metadata.

**OUTPUT FORMAT:**
Return strictly valid JSON. No markdown formatting.
Schema:
{
  "prompt_en": "The full, optimized English prompt to generate this image.",
  "prompt_zh": "Traditional Chinese translation of the prompt.",
  "spec": {
    "subject": "Detailed description of the person/object",
    "attire": "Detailed breakdown of clothing items, materials, and fits",
    "composition": "Camera angle (e.g., Low angle), shot type (e.g., Cowboy shot), framing",
    "lighting": "Lighting setup (e.g., Rembrandt, Softbox, Neon rim light)",
    "camera_settings": "Estimated focal length, aperture, film stock look",
    "style": "Artistic style (e.g., Cyberpunk, Minimalist, 90s Vogue)",
    "style_tags": ["tag1", "tag2", "tag3"],
    "color_palette": [
       { "hex": "#RRGGBB", "name": "Color Name" }
    ],
    "negative_prompt": ["ugly", "deformed"]
  }
}
`;

export const ASSET_IDENTIFICATION_PROMPT = (target: string) => `
Analyze the fashion image. Identify the Model's Head AND all visible fashion items matching: "${target}".
Return a valid JSON Array of objects. DO NOT use markdown code blocks.
Schema:
[
  { 
    "id": "unique_id", 
    "name": "Short Item Name (e.g. 'Model Head', 'Leather Jacket', 'Denim Jeans')", 
    "category": "One of ['head', 'tops', 'bottoms', 'outerwear', 'dresses', 'accessories', 'shoes']",
    "description": "Visual description of the item" 
  }
]
IMPORTANT: 
1. Always include "Model Head" (category: 'head') as the first item if a person is visible.
2. Then list every distinct garment and accessory.
3. Keep descriptions concise.
`;

export const ASSET_EXTRACTION_IMAGE_PROMPT = (itemName: string, description: string) => `
Task: Asset Extraction.
Item: ${itemName}.
Description: ${description}.

Instructions:
1. Isolate THIS SPECIFIC ITEM from the provided source image.
2. Re-render it on a **PURE WHITE BACKGROUND (#FFFFFF)**.
3. Maintain the original angle, lighting, texture, and fabric folds.
4. Ensure edges are clean. This is a product photography asset.
`;

export const ASSET_FLAT_LAY_PROMPT = (itemName: string, description: string) => `
Task: Professional E-commerce Product Photography Generation.
Target Item: ${itemName}.
Visual Context: ${description}.

Instructions:
1. Generate a **High-End E-commerce Flat Lay (Knolling)** photo of ONLY this specific item based on the source image.
2. **LAYOUT**: The item must be neatly arranged flat or presented on an invisible mannequin (Ghost Mannequin). Symmetrical and tidy.
3. **BACKGROUND**: Pure White (#FFFFFF).
4. **FIDELITY**: Strictly preserve the brand LOGOS, PATTERNS, fabric TEXTURES, and design details visible in the source image.
5. **CLEAN UP**: Remove any human body parts, hangers, tags, or chaotic wrinkles. The item should look brand new and ready for sale.
`;

export const HEAD_PORTRAIT_PROMPT = (description: string) => `
Task: High-End Beauty Headshot Extraction.
Context: ${description}.

Instructions:
1. Generate a high-quality beauty portrait of the model's head and shoulders based on the source image.
2. **BACKGROUND**: Clean White (#FFFFFF) or Soft Studio Grey.
3. **FIDELITY**: Keep the model's exact facial features, makeup, and hairstyle identity from the source image.
4. **STYLE**: High-end beauty retouching style. Sharp focus on eyes and face. No body below shoulders.
`;
