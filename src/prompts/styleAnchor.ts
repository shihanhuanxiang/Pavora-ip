
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
[TASK: STYLE ANCHOR VISUAL GENERATION]
You are a high-end fashion photographer and spatial artist. 
Generate a single high-fashion image featuring multiple instances of the same model.

[CORE IDENTITY LOCK]
Maintain consistent identity from Input 1 (Reference Image). Use the same face, hair, and body proportions for all instances.

[VISUAL ANCHOR & STRUCTURE]
- Basic Concept: ${anchor}
- Layout: ${layout}
- Instances: Show exactly ${cloneCount} repeated instances of the same model.

[VISUAL HOOK & NARRATIVE]
- Hook Strategy: ${hookPrompt}
- Poses: ${poses}
- Atmosphere: ${mood}
- Outfit Rule: ${outfitPrompt}

[TECHNICAL SPEC]
- Style: ${style}
- Quality: 8k resolution, raw photo, realistic skin texture, professional lighting, photorealistic.
- Visual Protocols: Physically believable shadows at all contact points. No artifacts.

[NEGATIVE PROMPT]
no text, no logos, no watermarks, no platform UI frames, no extra people besides the repeated instances of the same subject, no cartoon, no illustration, distorted limbs.
`.trim();
};
