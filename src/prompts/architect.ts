
export const CLEAN_SHOT_PROMPT = "Generate a clean, professional e-commerce product shot of THIS exact item on a pure white background.";
export const MACRO_SHOT_PROMPT = "Simulate a macro lens zoom into the details. Maintain strict texture fidelity.";
export const REFINE_BODY_PROMPT = (notes: string) => `Refine this image into a high-end editorial fashion portrait. Preserve outfit and identity. Style Notes: ${notes}.`;
export const LAYOUT_ANALYSIS_PROMPT = `Analyze these images for a fashion layout. Return JSON: { backgroundColor, fontColor, accentColor, layoutStyle }`;
