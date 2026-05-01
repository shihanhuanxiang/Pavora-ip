export const buildFittingPrompt = (category: string) => {
    const cat = category.toLowerCase();
    const isOuterwear = cat.match(/jacket|coat|blazer|cardigan|vest|outerwear|外套|夾克|大衣|風衣|背心/);

    return `
[TASK: HIGH-FIDELITY GARMENT TRANSFER]
You are an expert in digital fashion catalog production. Your objective is to overlay a specific garment onto a model while preserving the model's visual characteristics and the original scene's composition.

### Reference Assets:
- **Asset 1 (Model Reference)**: Defines the model's appearance and features.
- **Asset 2 (Target Garment)**: The specific item to be transferred.
- **Asset 3 (Scene Reference)**: The base image providing the pose, background, and framing.

### Technical Requirements:
1. **Visual Consistency**: The model's appearance, hair, and features from Asset 1 and Asset 3 must remain perfectly consistent.
2. **Composition Integrity**: Maintain the exact camera distance, angle, and framing of Asset 3. If Asset 3 is a full-body shot, the output must be a full-body shot. Do not crop.
3. **Garment Application**: 
   - Transfer the garment from Asset 2 onto the model in Asset 3.
   - [🛡️ MATERIAL FIDELITY 2.0]: 
     - Maintain 100% of the original fabric texture, weave, and material properties from Asset 2.
     - If Asset 2 is silk, it must remain lustrous. If it is denim, it must remain rugged.
     - Ensure high-precision reproduction of patterns, embroidery, and construction details.
   - ${isOuterwear ? 'Style the outerwear as an open-front layer over the existing outfit in Asset 3 to create a professional layered look. Ensure a natural fit on the shoulders and arms.' : 'Apply the garment from Asset 2 onto the model in Asset 3, following the natural silhouette.'}
4. **Aesthetic Quality**: The final output must resemble a high-end studio fashion photograph with consistent lighting and shadows.
`.trim();
};

export const buildIdentityFixPrompt = () => `
[TASK: HIGH-PRECISION VISUAL RESTORATION]
You are an expert in digital image restoration. 

### 🎯 Objective:
- **Asset 1 (Visual Reference)**: The target appearance and characteristics.
- **Asset 2 (Target Scene)**: The current scene with the new garment.

### 🛠️ Execution:
1. **Appearance Alignment**: Align the visual characteristics from Asset 1 onto the subject in Asset 2.
2. **Feature Restoration**: Restore the specific features and hair characteristics from Asset 1 onto the subject in Asset 2.
3. **Garment Protection**: Do NOT modify the garment or background from Asset 2. 
4. **Seamless Integration**: Ensure perfect blending of tones and textures.

[STRICT]: 100% match to Asset 1 characteristics. 0% change to Asset 2's garment.
`.trim();

export const buildStylingPlanPrompt = (stylingNote: string, intensity: string) => `
Analyze this styling request: "${stylingNote}". Intensity: ${intensity}. 
Return JSON with: 
- ui_feedback (summary, warnings, suggested_quick_actions)
- generation_plan (prompt, negative_prompt)
- safe_fallback (boolean)
`;