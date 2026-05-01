
import { HairstyleParams } from '../shared/types/types';

export const HAIR_BASE_INSTRUCTION = "Re-render the person's portrait, applying the following changes. Critically, maintain the original person's facial identity, bone structure, expression, pose, clothing, and background. Only modify the specified elements. ";

export const SALON_REALISM_MANDATE = `
[🚨 REALISM ENGINE MANDATE: ULTRA-DETAIL PHASE 🚨]
1. HAIR STRAND & TEXTURE:
   - Render individual hair strands with 8K micro-precision.
   - HAIR FLOW: Follow natural growth patterns, gravity, and wind-blown physics.
   - ROOT SHADOWS: Apply realistic ambient occlusion at the hair roots to ground the hairstyle.
   - ANISOTROPIC HIGHLIGHTS: Hair must exhibit realistic light scattering and environmental reflections.
   - SILKY FINISH: Ensure hair looks touchable, soft, and professionally conditioned.

2. MICRO-MAKEUP & SKIN FUSION:
   - EYELASH PRECISION: Render every single eyelash with realistic length, curl, and separation. No clumping.
   - PRESERVE SKIN TEXTURE: DO NOT smooth or blur the skin. Maintain visible pores, fine lines, and natural skin micro-texture.
   - SEAMLESS BLENDING: Makeup must appear as if it is absorbed into the skin's surface, with realistic gradients.
   - AVOID "PASTED" LOOK: Ensure makeup follows the 3D contours of the face perfectly.

3. LIGHTING & DEPTH:
   - Analyze the original image's light source direction, intensity, and color temperature.
   - The new hair and makeup MUST exhibit shadows and highlights that match this environment 100%.
   - BOKEH & DOF: Maintain the original depth of field, ensuring hair edges blend naturally with the background blur.

[📐 HAIR & MAKEUP CONTINUITY PROTOCOL 📐]
- SPATIAL LOGIC: When rendering different angles (Side, Back, 45°), ensure the hairstyle's layers, volume, and length are logically consistent with the front view.
- COMPOSITION: The person MUST be perfectly centered in the frame for all angles. Maintain a consistent distance from the camera across all views.
- WRAP-AROUND MAKEUP: Makeup (like eyeliner wings, blush placement, and contouring) must wrap around the face's curvature naturally when viewed from the side.
- DEPTH PERCEPTION: Maintain the correct depth of hair layers; back-view hair should show the nape and lower layers clearly.

[🔒 IDENTITY LOCK & PERFORMANCE OPTIMIZATION 🔒]
- IDENTITY PRESERVATION: You are provided with an IDENTITY REFERENCE image. You MUST maintain the exact facial features, eye shape, nose structure, lip shape, and overall bone structure of the person in the reference image. DO NOT "beautify" or alter the underlying identity.
- LOCALIZED FOCUS: Focus your generative power ONLY on the hair and the makeup application. The background, clothing, and non-face skin areas should remain as close to the original as possible to ensure high-speed, high-fidelity local transformation.
`;

export const buildSalonPrompt = (
    params: HairstyleParams, 
    color: string, 
    mode: 'color' | 'gradient' | 'highlight',
    stops: {hex: string}[],
    coverage: number,
    pattern: string,
    density: number,
    isColorOnly: boolean,
    makeupKeyword: string,
    makeupIntensity: number,
    makeupParams?: any,
    isSelfieMode?: boolean,
    beardPrompt?: string,
    beardColor?: string
) => {
    let salonPrompt = SALON_REALISM_MANDATE + '\n\n';

    if (isSelfieMode) {
        salonPrompt += `[POV: SOCIAL SELFIE MODE]
- COMPOSITION: The image should look like a high-quality smartphone selfie.
- PERSPECTIVE: Slight wide-angle distortion typical of front-facing cameras.
- ARM POSITION: One arm should be partially visible at the edge of the frame, suggesting the person is holding the phone.
- NO PHONE: The smartphone itself MUST NOT be visible in the image.
- VIBE: Casual, authentic, and social-media ready.
\n`;
    }

    // Hairstyle Section
    if (!isColorOnly) {
        salonPrompt += `Apply a new hairstyle with these characteristics: ${JSON.stringify(params)}. `;
        if (params.volume) salonPrompt += `The hair should have a volume level of ${params.volume}/100. `;
        if (params.curliness) salonPrompt += `The hair should have a curliness level of ${params.curliness}/100. `;
        if (params.density) salonPrompt += `Hair density: ${params.density}/100 (thickness). `;
        if (params.shine) salonPrompt += `Hair shine/gloss: ${params.shine}/100. `;
        if (params.flyaways) salonPrompt += `Hair flyaways/messiness: ${params.flyaways}/100 for realism. `;
        if (params.finish) salonPrompt += `Hair finish texture: ${params.finish}. `;
        if (params.parting) salonPrompt += `Hair parting style: ${params.parting}. `;
        if (params.bangs_style && params.bangs_style !== 'none') salonPrompt += `Bangs style: ${params.bangs_style}. `;
        if (params.root_lift) salonPrompt += `Hair root lift/volume at crown: ${params.root_lift}/100. `;
        if (params.baby_hair) salonPrompt += `Natural baby hair/hairline soft edges: ${params.baby_hair}/100. `;
        if (params.layering) salonPrompt += `Hair layering level: ${params.layering}/100 (from solid to highly layered). `;
        if (params.texturizing) salonPrompt += `Hair texturizing/thinning: ${params.texturizing}/100 (weight reduction). `;
        if (params.edge_finish) salonPrompt += `Hair edge finish: ${params.edge_finish} cut style. `;
    }

    // Beard Section
    if (beardPrompt) {
        salonPrompt += `\n[FACIAL HAIR]: Apply facial hair style: ${beardPrompt}. Beard color: ${beardColor || '#000000'}. Render realistic beard strands and textures integrated with the face. `;
    }

    let colorPrompt = '';
    const baseColorPrompt = `over a base hair color of ${color}`;

    if (mode === 'color') {
        colorPrompt = `Recolor the hair to a solid ${color}. `;
    } else if (mode === 'gradient') {
        const hexes = stops.map(s => s.hex);
        if (hexes.length >= 2) {
            colorPrompt = `Apply a professional "Ombré" or "Sombré" gradient effect. Start with the base color of ${color} at the roots, then seamlessly transition through ${hexes.join(' to ')} towards the ends. The gradient should cover ${coverage}% of the hair length, showing a clear but natural progression of color. Ensure the transitions are smooth with no harsh lines.`;
        }
    } else if (mode === 'highlight') {
        const colorList = stops.map(s => s.hex).join(' and ');
        const highlightBase = `Add high-contrast, professional salon-quality highlights using ${colorList} over the base color of ${color}. `;
        switch (pattern) {
            case 'face-framing': 
                colorPrompt = highlightBase + `Focus on "Money Piece" face-framing highlights, brightening the strands immediately surrounding the face. The highlights should be distinct and visible, with a density of ${density}%.`; 
                break;
            case 'overall-fine': 
                colorPrompt = highlightBase + `Apply fine "Babylights" woven throughout the entire head of hair. Ensure the highlights are thin but clearly visible against the ${color} base, with ${density}% coverage.`; 
                break;
            case 'chunky-strands': 
                colorPrompt = highlightBase + `Apply bold, chunky 90s-style highlight streaks. Each streak should be thick and have high visual impact, covering ${density}% of the hair.`; 
                break;
            case 'underlayer': 
                colorPrompt = highlightBase + `Apply "Peekaboo" highlights on the under-layers of the hair. The ${colorList} should be visible when the hair moves or is tucked behind the ears.`; 
                break;
            case 'balayage':
                colorPrompt = highlightBase + `Apply a "Balayage" hand-painted technique. The highlights should start subtly near the roots and become more saturated and thicker towards the ends, creating a sun-kissed, multi-dimensional look.`;
                break;
            case 'airtouch':
                colorPrompt = highlightBase + `Apply the "Airtouch" technique for seamless, high-contrast blending. The transitions between the ${color} base and ${colorList} highlights should be ultra-smooth but the color difference must be striking.`;
                break;
            default:
                colorPrompt = highlightBase + `Apply highlights with ${density}% coverage.`;
        }
        colorPrompt += ` Ensure the highlights follow the 3D flow and texture of the hair strands perfectly.`;
    }
    
    if (isColorOnly) {
        salonPrompt = "Keep the existing haircut, length, parting, and curl pattern exactly as in the original image. Only modify the hair color as follows: " + colorPrompt + " Do not change the haircut, curl pattern, or hair volume. ";
    } else {
        salonPrompt += `\n\n[COLOR & HIGHLIGHT INTEGRATION]:\n${colorPrompt}`;
    }

    // Makeup Section
    salonPrompt += `Apply new makeup with an intensity of ${makeupIntensity}%. Style: ${makeupKeyword}. `;
    if (makeupParams) {
        if (makeupParams.lipstick_color) {
            salonPrompt += `Lipstick color: ${makeupParams.lipstick_color} (intensity ${makeupParams.lipstick_intensity || 100}%). `;
            if (makeupParams.lipstick_texture) salonPrompt += `Lipstick texture: ${makeupParams.lipstick_texture}. `;
            if (makeupParams.lipstick_blending) salonPrompt += `Lipstick blending style: ${makeupParams.lipstick_blending}. `;
        }
        if (makeupParams.eyeshadow_color) salonPrompt += `Eyeshadow color: ${makeupParams.eyeshadow_color} (intensity ${makeupParams.eyeshadow_intensity || 100}%). `;
        if (makeupParams.blush_color) salonPrompt += `Blush color: ${makeupParams.blush_color} (intensity ${makeupParams.blush_intensity || 100}%). `;
        if (makeupParams.contact_lens_color) salonPrompt += `Change the eye color to ${makeupParams.contact_lens_color} contact lenses. `;
        if (makeupParams.eyebrow_style) salonPrompt += `Eyebrow style: ${makeupParams.eyebrow_style}. `;
        if (makeupParams.foundation_finish) salonPrompt += `Foundation finish: ${makeupParams.foundation_finish}. `;
        if (makeupParams.aegyo_sal_intensity) salonPrompt += `Aegyo-sal (under-eye highlight) intensity: ${makeupParams.aegyo_sal_intensity}/100. `;
        if (makeupParams.skin_texture_intensity) salonPrompt += `Visible skin micro-texture/pores intensity: ${makeupParams.skin_texture_intensity}/100. `;
        if (makeupParams.inner_corner_pop) salonPrompt += `Inner corner eye highlight intensity: ${makeupParams.inner_corner_pop}/100. `;
        if (makeupParams.cut_crease) salonPrompt += `Cut-crease eye makeup definition: ${makeupParams.cut_crease}/100. `;
        if (makeupParams.nose_sculpt) salonPrompt += `Nose contouring/sculpting definition: ${makeupParams.nose_sculpt}/100. `;
        if (makeupParams.jawline_definition) salonPrompt += `Jawline definition/sharpening intensity: ${makeupParams.jawline_definition}/100. `;
        if (makeupParams.eyelash_length) salonPrompt += `Eyelash length: ${makeupParams.eyelash_length}/100. `;
        if (makeupParams.eyeliner_sharpness) salonPrompt += `Eyeliner sharpness: ${makeupParams.eyeliner_sharpness}/100. `;
        if (makeupParams.contour_intensity) salonPrompt += `Face contouring intensity: ${makeupParams.contour_intensity}/100. `;
        if (makeupParams.highlight_intensity) salonPrompt += `Face highlight intensity: ${makeupParams.highlight_intensity}/100. `;
        if (makeupParams.freckles) salonPrompt += `Realistic skin freckles intensity: ${makeupParams.freckles}/100. `;
    }

    salonPrompt += " Maintain the original person's facial features and identity perfectly. Only change the hair and makeup.";
    
    return salonPrompt;
};

export const STYLE_ANALYSIS_PROMPT = (gender: string) => `Analyze the person in this image. Gender: ${gender}.
Suggest a hairstyle and makeup style that suits their face shape and features.
Return JSON: { 
    summary: string (analysis in Traditional Chinese), 
    recommendations: {
        hairstyle_id: string,
        hair_color_description: string,
        makeup_id: string,
        makeup_intensity: number
    },
    context: { outfit_type: string }
}`;

export const STYLIST_FEEDBACK_PROMPT = `Analyze the final hair and makeup look in this image. 
Provide a professional stylist's feedback in Traditional Chinese (繁體中文).
Return JSON: {
    overall_critique: string (總體評價),
    hair_analysis: string (髮型分析),
    makeup_analysis: string (妝容分析),
    professional_tips: string[] (專業建議清單)
}`;
