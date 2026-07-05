
import { STYLE_ANCHOR_TYPES, STRUCTURE_LAYOUTS, POSE_SETS, MOOD_STATES, PHOTO_STYLES } from '../shared/constants/styleAnchorPresets';

export const buildStyleAnchorPrompt = (params: any) => {
    const { anchorType, cloneCount, structureLayout, poseSet, hookIntensity, outfitConsistency, moodState, photoStyle } = params;

    const anchor = STYLE_ANCHOR_TYPES.find(a => a.value === anchorType)?.prompt || '';
    const layout = STRUCTURE_LAYOUTS.find(l => l.value === structureLayout)?.prompt || '';
    const poses = POSE_SETS.find(p => p.value === poseSet)?.prompt || '';
    const mood = MOOD_STATES.find(m => m.value === moodState)?.prompt || '';
    const style = PHOTO_STYLES.find(s => s.value === photoStyle)?.prompt || '';

    const hookPrompt = {
        low: "subtle visual order, clean composition",
        medium: "subtle gravity-defying composition while remaining physically believable, clean contact shadows",
        high: "bold spatial illusions and gravity violations, high visual tension, complex character placement"
    }[hookIntensity as 'low'|'medium'|'high'];

    const outfitPrompt = outfitConsistency === 'identical' 
        ? "all clones wear the exact same outfit with no variation" 
        : "all clones wear the same base identity but one specific item (like outerwear or shoes) varies between them";

    return `
[TASK: STYLE ANCHOR — MULTI-INSTANCE IDENTITY CONSISTENCY]
You are a world-class fashion photographer and spatial composition artist specializing in identity-consistent multi-figure fashion editorials.

Generate a single, cohesive high-fashion image featuring exactly ${cloneCount} instances of the same model, arranged according to the specified layout.

[IDENTITY ANCHOR — ZERO DRIFT PROTOCOL]
- The provided reference image (Input 1) is the ground-truth identity. Treat it as an absolute lock.
- Every instance must share identical: facial structure, skin tone, hair color, hair texture, eye characteristics, and body proportions.
- Cross-instance identity drift is NOT acceptable. A viewer should immediately recognize all instances as the same person.
- If facial details are ambiguous across instances, defer to Input 1 as the tiebreaker.

[VISUAL ANCHOR & STRUCTURE]
- Core Concept: ${anchor}
- Spatial Layout: ${layout}
- Instance Count: Exactly ${cloneCount} — no more, no fewer.

[VISUAL HOOK & NARRATIVE TENSION]
- Compositional Hook: ${hookPrompt}
- Pose Choreography: ${poses}
- Emotional Atmosphere: ${mood}
- Outfit Consistency Rule: ${outfitPrompt}

[PRODUCTION QUALITY STANDARD]
- Photography Style: ${style}
- Resolution: 8K equivalent output. Razor-sharp focus on key subject areas.
- Skin rendering: Natural skin texture with visible pores, subtle subsurface scattering. No over-smoothing or plastic appearance.
- Lighting: Consistent light source direction across ALL instances. Shadows must be physically coherent — no floating elements.
- Contact shadows: Precise contact shadows at every ground or surface interaction point.
- Garment: Fabric texture, drape, and detail must be consistent across instances.
- Background integration: Seamless depth of field. Instances feel grounded in the same physical space.

[ABSOLUTE CONSTRAINTS]
- No text, logos, watermarks, or platform UI elements.
- No extra people beyond the ${cloneCount} repeated instances of the subject.
- No cartoon, illustration, or CGI rendering style.
- No distorted limbs, unnatural joint angles, or anatomical errors.
- No identity drift between instances.
`.trim();
};
