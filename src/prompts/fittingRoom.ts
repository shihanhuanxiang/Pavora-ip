export const buildFittingPrompt = (category: string) => {
    const cat = category.toLowerCase();
    const isOuterwear = cat.match(/jacket|coat|blazer|cardigan|vest|outerwear|外套|夾克|大衣|風衣|背心/);
    const isBottom = cat.match(/bottom|pants|shorts|skirt|jeans|leggings|褲|裙/);
    const isAccessory = cat.match(/bag|shoe|accessory|hat|glass|包|鞋|飾|帽|鏡/);

    const garmentInstruction = isOuterwear
        ? 'Style the outerwear as an open-front layer over the existing outfit in Asset 3. Ensure a natural shoulder fit, correct sleeve length, and realistic fabric drape at the hem.'
        : isBottom
        ? 'Replace ONLY the bottom garment. Preserve the existing top garment exactly as shown in Asset 3. Ensure waistband alignment is natural and pant/skirt hem falls at the correct length.'
        : isAccessory
        ? 'Add the accessory from Asset 2 to the appropriate body location. Maintain realistic scale, natural shadows, and correct occlusion with existing elements.'
        : 'Apply the garment from Asset 2 onto the model in Asset 3, following the natural body silhouette and gravity. Ensure armhole, neckline, and hemline sit correctly.';

    return `
[TASK: HIGH-FIDELITY VIRTUAL GARMENT TRANSFER — FASHION CATALOG STANDARD]

You are a senior digital fashion production specialist. Your objective is to execute a pixel-accurate garment transfer that meets professional e-commerce catalog standards.

### Input Assets:
- **Asset 1 (Identity Anchor)**: The model's face, hair, and distinguishing features. Treat this as the ground-truth reference. LOCK these characteristics — do not alter them.
- **Asset 2 (Target Garment)**: The specific garment or accessory to be applied. This is the ONLY element that changes.
- **Asset 3 (Scene Canvas)**: The base image defining pose, body, background, and existing scene composition. Preserve everything EXCEPT the garment being replaced.

### Execution Protocol:

**[IDENTITY LOCK]**
- The model's face, skin tone, hair color, hair style, and overall appearance from Asset 1 MUST be preserved with zero drift.
- If Asset 1 and Asset 3 show slight inconsistencies, Asset 1 takes priority for facial features.

**[COMPOSITION LOCK]**
- Maintain the EXACT camera angle, distance, and framing of Asset 3.
- Full-body input → full-body output. Waist-up input → waist-up output. Do not reframe or crop.
- Preserve background, lighting direction, and shadow positions from Asset 3.

**[GARMENT TRANSFER — MATERIAL FIDELITY 3.0]**
- ${garmentInstruction}
- Reproduce 100% of the source material properties from Asset 2: fabric weave, surface texture, sheen level, pattern scale, stitch construction, and edge finishing.
- Silk must remain lustrous. Denim must remain structured. Knit must retain its dimensional texture.
- Patterns (stripes, florals, checks, prints) must maintain correct scale and alignment relative to the body.

**[PHYSICS & FIT REALISM]**
- Apply realistic fabric physics: gravity drape, body contour, natural fold formation at joints (elbows, knees, waist).
- Garment should fit the model's body type naturally — not floating, not painted-on.
- Ensure sleeve length, hem length, and garment proportions are consistent with the original item in Asset 2.

**[LIGHTING INTEGRATION]**
- Garment highlights and shadows must match the existing scene lighting direction in Asset 3.
- Do not introduce new light sources or alter the ambient light color temperature.

**[OUTPUT STANDARD]**
- Final image must be indistinguishable from a professional studio fashion photograph.
- Clean edges where garment meets skin, background, or other garments.
- No artifacts, blurring, or seam misalignment at garment boundaries.
`.trim();
};

export const buildIdentityFixPrompt = () => `
[TASK: IDENTITY RESTORATION — PRECISION ALIGNMENT]

You are a specialist in identity-consistent image restoration. 

### Input Assets:
- **Asset 1 (Identity Reference)**: Ground-truth appearance — face structure, skin tone, hair color, hair texture, eye characteristics.
- **Asset 2 (Target Scene)**: Current scene containing the garment and pose to PRESERVE.

### Restoration Protocol:

**[FACE & FEATURE ALIGNMENT]**
- Align the facial structure, skin tone, and defining features from Asset 1 onto the subject in Asset 2.
- Restore hair: color, texture, length, and style must match Asset 1 exactly.
- Preserve any distinctive features (jawline, eye shape, nose) from Asset 1.

**[PROTECTED ZONES — DO NOT MODIFY]**
- Garment: every stitch, pattern, color, and texture in Asset 2 is LOCKED.
- Background: preserve 100% of the scene environment from Asset 2.
- Pose and body position: do not alter.
- Lighting and shadow: maintain from Asset 2.

**[BLENDING STANDARD]**
- Skin-to-garment edge must be seamless with no color bleeding or hard borders.
- Restored features must match the existing lighting direction in Asset 2.
- Output must read as a single, coherent photograph — not a composite.

[ABSOLUTE CONSTRAINT]: Identity from Asset 1. Everything else from Asset 2. Zero compromise on either.
`.trim();

export const buildStylingPlanPrompt = (stylingNote: string, intensity: string) => `
Analyze this styling request: "${stylingNote}". Intensity: ${intensity}. 
Return JSON with: 
- ui_feedback (summary, warnings, suggested_quick_actions)
- generation_plan (prompt, negative_prompt)
- safe_fallback (boolean)
`;