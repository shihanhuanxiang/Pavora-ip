
export const MACRO_ANALYSIS_PROMPT = `
Analyze the uploaded fashion product image for a micro-scale narrative.
Identify key structural nodes (seams, stitches, buttons, fabric grain, edges).
Return JSON strictly:
{
  "structureNodes": ["list of key areas"],
  "materialProperties": "description of texture and hardness",
  "narrativeHotspots": ["potential locations for miniature worker interaction"]
}
Output in English for technical accuracy.
`;

export const buildMacroCraftPrompt = (params: any, analysis: any) => {
    const { mode, scale, productType, customInstruction } = params;

    const modePrompts = {
        build: "Constructing and assembling. Miniature workers are using precision tools to weave, stitch, and join the product's components. Scaffolding may be visible near seams.",
        repair: "Maintaining and restoring. Experts are meticulously fixing minor imperfections, polishing surfaces, or re-stitching sections to ensure peak quality.",
        upgrade: "Material evolution. Specialists are injecting glowing technological elements or high-end finishes into the product's structure to enhance its value.",
        structure: "Architectural blueprint. Reveal the inner layers, hidden internal padding, or structural integrity through a cross-section or transparent view with workers auditing nodes.",
        material: "Geological exploration. The fabric or leather is treated as a vast terrain. Workers are exploring the microscopic peaks and valleys of the material grain."
    };

    const scalePrompts = {
        subtle: "Miniature figures are tiny details, hidden in the corners or along one specific seam. Focus remains 95% on the product.",
        balanced: "Interaction is clear. Workers are actively engaged with major structural components. Equal focus on craft behavior and product aesthetics.",
        dominant: "The product is a massive monolith or landscape. The micro-world is fully realized with multiple action nodes across the entire frame."
    };

    return `
[WORLD LOGIC: MACRO-CRAFT NARRATIVE]
You are a technical visual director. The target object (Input 1) is the ONLY world. Human figures are MINUSCULE (micro-scale) functional units.
DO NOT make them cute or cartoony. They should look like professional industrial workers or craftsmen.

[PRODUCT CONTEXT]
Type: ${productType}.
Structural Analysis: ${analysis?.structureNodes?.join(', ') || 'General structure'}.
Material Behavior: ${analysis?.materialProperties || 'Standard fabric'}.

[NARRATIVE MISSION]
Mode: ${modePrompts[mode]}.
Scale Level: ${scalePrompts[scale]}.
Additional Context: ${customInstruction || 'No additional notes'}.

[VISUAL PROTOCOLS]
1. **PRODUCT INTEGRITY**: Preserve all original logos, textures, and specific design quirks. The product is the landscape.
2. **SCALE DISSONANCE**: Characters must look like they belong to a much smaller scale (e.g., 1/100th size). Their shadows and lighting must integrate with the macro-surface of the product.
3. **FUNCTIONAL POSE**: Figures must be performing REAL tasks (measuring, cutting, welding light, sweeping dust, inspecting grain). No generic posing.
4. **STYLE**: Hyper-photorealistic macro photography. Sharp focus on specific nodes, soft depth of field for background areas.

[NEGATIVE PROMPT]
(toy-like:1.5), (cartoony:1.5), (drawing), (CGI render look), (unrealistic proportions), (generic model), (missing product details), (blurry logos), cute, miniature set.
`.trim();
};
