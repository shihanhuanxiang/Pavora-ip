
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

export const ANALYZE_APPAREL_PROMPT = `Analyze this apparel item image with precision. Return strictly valid JSON with no markdown:
{
  "color": "Primary color name and hex approximate (e.g. 'Ivory White #F5F0E8')",
  "material": "Estimated fabric type and properties (e.g. 'Heavyweight denim, structured, matte')",
  "occasion": "Best use context (e.g. 'Casual streetwear', 'Formal office', 'Evening event')",
  "season": "Suitable season(s) (e.g. 'Spring/Summer', 'All-season')",
  "tags": ["style tag 1", "style tag 2", "style tag 3", "style tag 4", "style tag 5"]
}`;
