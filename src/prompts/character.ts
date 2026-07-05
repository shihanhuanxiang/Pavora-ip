export type MatrixModeKey = 'orbit' | 'expression' | 'lighting' | 'outfit' | 'storyboard' | 'editorial_popout';

const GLOBAL_PHOTOGRAPHY_DNA = `
[PHOTOGRAPHY SPEC]: High-end commercial fashion photography, 8k resolution, shot on Phase One XF, 100MP. 
[OPTICAL INTEGRATION]: Masterful Global Illumination. The subject MUST "absorb" and reflect the environment's light. Implement realistic Light Bleed and Rim Lighting where the subject meets the background.
[LENS PHYSICS]: Natural Depth of Field (DoF) with realistic bokeh. Implement soft-focus fall-off. Subject edges must have subtle "Light Bleed" and soft blending with the background to eliminate any "cut-out" look.
[PHYSICAL INTERACTION]: Implement deep Ambient Occlusion (AO) and contact shadows where the subject touches any surface (ground, objects). For wet environments, generate realistic blurry reflections on the floor.
[DYNAMIC BALANCE]: Postures must exhibit realistic weight distribution and center of gravity. Clothing should show dynamic tension folds and natural draping that responds to the body's movement and posture.
[MICRO-TEXTURE]: Hyper-realistic skin with visible pores, fine downy hair, and natural imperfections. Fabric MUST show 3D weave depth, tactile fiber textures, and realistic weight/drape.
[LIGHTING]: Masterful use of Subsurface Scattering (SSS) for realistic skin translucency. Sharp focus on eyes with natural catchlights that reflect the specific environment.
[IDENTITY LOCK]: CRITICAL. Absolute 1:1 facial reconstruction. Maintain the exact bone structure, eye shape, nasal bridge geometry, and lip fullness from the reference images. DO NOT genericize the face.
`;

export const MAGAZINE_LAYOUT_DNA: Record<string, string> = {
    vogue: "Iconic high-fashion authority. Lighting: Soft volumetric studio light with elegant rim highlights. Background: Minimalist luxury interior. Cover Elements: Bold masthead, sophisticated cover lines like 'THE NEW ELEGANCE', 'EXCLUSIVE INTERVIEW'.",
    gq: "Modern masculine luxury. Lighting: Structured architectural light, high contrast shadows. Background: Contemporary urban or high-end office. Cover Elements: Clean masthead, smart cover lines like 'STYLE & SUBSTANCE', 'MAN OF THE YEAR'.",
    vanity_fair: "Cinematic narrative glamour. Lighting: Film-like chiaroscuro, dramatic side-lighting. Background: Elegant ballroom or historic library. Cover Elements: Script masthead, storytelling cover lines.",
    i_d: "Raw youth culture. Lighting: Hard direct flash, high contrast, intentional red-eye or lens flare. Background: Concrete street or raw studio. Cover Elements: Vertical masthead, edgy cover lines, hand-written style accents.",
    dazed: "Experimental visual disruption. Lighting: Multi-colored gel lights, motion blur, chromatic aberration. Background: Surreal or distorted space. Cover Elements: Distorted masthead, provocative cover lines.",
    harpers_bazaar: "Refined feminine elegance. Lighting: Radiant glow, high-key, soft-focus edges. Background: Parisian balcony or flower garden. Cover Elements: Classic serif masthead, elegant cover lines.",
    elle: "Approachable modern chic. Lighting: Natural window light, warm golden hour tones. Background: Bright airy apartment. Cover Elements: Vibrant masthead, relatable lifestyle cover lines.",
    new_yorker: "Intellectual conceptual mood. Lighting: Soft diffused light, minimal shadows. Background: Abstract or symbolic illustration-style background. Cover Elements: Iconic font masthead, minimal text.",
    numero: "Avant-garde intellectual fashion. Lighting: Cold clinical light, blue-toned shadows. Background: Brutalist architecture. Cover Elements: Minimalist masthead, abstract cover lines.",
    vogue_italia: "Dramatic cinematic intensity. Lighting: High-contrast spotlight, deep blacks. Background: Italian villa or dramatic landscape. Cover Elements: Classic Vogue masthead with 'ITALIA' subtitle.",
    default: "Professional fashion magazine cover. Lighting: Studio lighting. Background: Clean editorial background. Cover Elements: Magazine masthead, cover lines, barcode, and issue date."
};

export const MAGAZINE_NEGATIVE_GUARD = `(text:1.3), (watermark:1.3), (UI:1.3), (distorted text:1.2), (blurry background:1.2), (low quality:1.5)`;

const OUTFIT_GLOBAL_COMMON_PREFIX = `
${GLOBAL_PHOTOGRAPHY_DNA}
[OUTFIT SPEC]: High-end fashion commercial photography. 
[MATERIAL]: 100% material fidelity. Focus on fabric drape, weave, and tactile quality. 
[SUBJECT]: Professional fashion model. 
[LIGHTING]: Masterful Global Illumination. The subject must be perfectly integrated with the environment's light and shadows. implement Rim Lighting and Ambient Occlusion.
[COMPOSITION RULE]: Single clear camera shot. NO split screen, NO multi-view in a single frame, NO collage elements.
`;

const OUTFIT_NEGATIVE_GUARD = `(split screen:2.0), (multi-view:2.0), (collage:2.0), (duplicate legs:2.0), (extra limbs:2.0), (merged bodies:2.0), (two people:2.0), (nude:2.0), (lingerie:1.5), (distorted face:1.5)`;

export const MATRIX_MODES: Record<MatrixModeKey, { 
    label: string; 
    description: string; 
    isSingleImage?: boolean; 
    isBatchable?: boolean; 
    prompts: { id: string; label: string; prompt: string }[] 
}> = {
    orbit: {
        label: '3x3 環繞視圖 (Orbit)',
        description: '包含仰視、平視、俯視及左右側轉，檢視角色結構一致性。',
        prompts: [
            { id: '00', label: '左上 (仰視/左側)', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nClose-up Headshot. 85mm lens. Camera at chest level looking UP. Face turned 45 degrees to the Left. Sharp jawline definition, focus on the mandibular angle.` },
            { id: '01', label: '中上 (仰視/正臉)', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nClose-up Headshot. 85mm lens. Worm's-eye view. Camera looking UP at the chin. Symmetrical face pointing forward. Visible nostrils and clean neck line.` },
            { id: '02', label: '右上 (仰視/右側)', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nClose-up Headshot. 85mm lens. Camera low, looking UP. Face turned 45 degrees to the Right. Focus on the right zygomatic bone.` },
            { id: '10', label: '左中 (平視/左90度)', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nSide Profile Portrait. 105mm macro lens. Camera at eye level. Face turned exactly 90 degrees to the Left. Perfect nasal bridge silhouette.` },
            { id: '11', label: '正中 (中心錨點)', prompt: 'ORIGINAL' },
            { id: '12', label: '右中 (平視/右90度)', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nSide Profile Portrait. 105mm macro lens. Camera at eye level. Face turned exactly 90 degrees to the Right. Sharp ear and jawline detail.` },
            { id: '20', label: '左下 (俯視/左側)', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nHigh Angle shot. 50mm lens. Camera above head looking DOWN. Face turned 45 degrees to the Left. Focus on the crown and forehead.` },
            { id: '21', label: '中下 (俯視/正臉)', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nHigh Angle shot. 50mm lens. Camera looking DOWN. Face pointing forward. Eyelashes casting subtle shadows on cheeks.` },
            { id: '22', label: '右下 (俯視/右側)', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nHigh Angle shot. 50mm lens. Camera above looking DOWN. Face turned 45 degrees to the Right. Dramatic perspective on the facial planes.` },
        ]
    },
    expression: {
        label: '九宮格表情包 (半身版)',
        description: '測試角色在不同情緒下的肢體語言與五官神韻。',
        prompts: [
             { id: '00', label: '純粹喜悅 (Joy)', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nWaist-up. Duchenne smile. Genuine joy, contraction of orbicularis oculi muscle, subtle nasolabial fold depth, teeth visible, eyes crinkled with warmth.` },
             { id: '01', label: '冷淡厭世 (Deadpan)', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nWaist-up. High-fashion deadpan. Neutral brow, relaxed lips, cold editorial stare, "Sanpaku" eyes effect, high-fashion vacancy.` },
             { id: '02', label: '憤怒張力 (Anger)', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nWaist-up. Intense Anger. Corrugator supercilii muscle contraction, flared nostrils, tight jaw, piercing gaze, micro-expression of fury.` },
             { id: '10', label: '憂鬱感性 (Sadness)', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nWaist-up. Melancholic sorrow. Inner eyebrows raised, subtle lip quiver, moist eyes reflecting soft light, downward gaze.` },
             { id: '11', label: '正中 (中心錨點)', prompt: 'ORIGINAL' },
             { id: '12', label: '輕蔑傲慢 (Disdain)', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nWaist-up. Haughty disdain. One eyebrow slightly raised, upper lip curled, chin raised, looking down the nose at the camera.` },
             { id: '20', label: '恐懼張力 (Fear)', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nWaist-up. Fear and tension. Widened palpebral fissures, pulled back lips, visible neck tendons, pale complexion, cold sweat sheen.` },
             { id: '21', label: '絕對自信 (Confidence)', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nWaist-up. Unshakable Confidence. Relaxed but powerful posture, slight smirk, direct eye contact, dominant presence.` },
             { id: '22', label: '驚訝瞬間 (Surprise)', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nWaist-up. Sudden Shock. Raised eyebrows, dropped jaw, widened eyes, frozen moment of realization.` },
        ]
    },
    lighting: {
        label: '光影實驗室 (Lighting)',
        description: '模擬不同攝影棚布光對角色臉部結構的影響。',
        prompts: [
             { id: '00', label: '倫勃朗光 (Rembrandt)', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nRembrandt lighting. 45-degree key light, characteristic triangle of light on the shadow-side cheek. Deep chiaroscuro effect.` },
             { id: '01', label: '蝴蝶光 (Butterfly)', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nParamount/Butterfly lighting. Key light directly in front and above. Symmetrical shadow under the nose, accentuating cheekbones.` },
             { id: '02', label: '分割光 (Split)', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nSplit lighting. Light source at 90 degrees. Exactly half the face in shadow, dramatic texture on the lit side.` },
             { id: '10', label: '邊緣光 (Rim)', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nRim lighting. Strong backlight creating a glowing halo around the silhouette. Subject underexposed to emphasize the outline.` },
             { id: '11', label: '正中 (中心錨點)', prompt: 'ORIGINAL' },
             { id: '12', label: '底光 (Under)', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nUnder lighting / "Monster" lighting. Light source from below the chin. Eerie shadows cast upwards, dramatic and cinematic.` },
             { id: '20', label: '霓虹 (Neon)', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nCyberpunk Neon. Dual-tone lighting: Cyan key light, Magenta rim light. Volumetric fog, high contrast, futuristic vibe.` },
             { id: '21', label: '窗光 (Window)', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nSoft side window light. Natural diffused illumination, gentle fall-off, organic shadows, 5500K color temperature.` },
             { id: '22', label: '剪影 (Silhouette)', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nPure Silhouette. Subject completely black against a bright, overexposed white background. Focus on the iconic character shape.` },
        ]
    },
    outfit: {
      label: '穿搭九宮格 (細節掃描)',
      description: '【掃描式佈局】上排：上身特寫；中排：全身輪廓；下排：下半身與鞋履細節。',
      isBatchable: true,
      prompts: [
          { id: '00', label: '上① 上身正側面', prompt: `${OUTFIT_GLOBAL_COMMON_PREFIX}\nWaist-up shot. 3/4 orientation. Focus on shoulders and torso structure. Sharp tailoring visible. Negative: ${OUTFIT_NEGATIVE_GUARD}` },
          { id: '01', label: '上② 領口材質', prompt: `${OUTFIT_GLOBAL_COMMON_PREFIX}\nMacro close-up on neckline and upper chest fabric. Extreme texture clarity, visible stitching, fabric grain. Negative: ${OUTFIT_NEGATIVE_GUARD}` },
          { id: '02', label: '上③ 上身側面', prompt: `${OUTFIT_GLOBAL_COMMON_PREFIX}\nWaist-up side profile. Sharp silhouette of upper garment tailoring, focus on sleeve attachment and shoulder line. Negative: ${OUTFIT_NEGATIVE_GUARD}` },
          { id: '10', label: '中④ 全身站姿', prompt: `${OUTFIT_GLOBAL_COMMON_PREFIX}\nFull body fashion shot. Elegant posture, weight on one leg. Neutral studio background. Perfect head-to-toe balance. Negative: ${OUTFIT_NEGATIVE_GUARD}` },
          { id: '11', label: '中⑤ 系統錨點', prompt: 'ORIGINAL' },
          { id: '12', label: '中⑥ 全身步態', prompt: `${OUTFIT_GLOBAL_COMMON_PREFIX}\nFull body movement shot. Mid-stride walking pause. Dynamic silhouette, fabric flowing naturally with motion. Negative: ${OUTFIT_NEGATIVE_GUARD}` },
          { id: '20', label: '下⑦ 褲裝細節', prompt: `${OUTFIT_GLOBAL_COMMON_PREFIX}\nLower garment focus. Macro shot of trouser texture, pockets, and fabric drape. Clean commercial angle. Negative: ${OUTFIT_NEGATIVE_GUARD}` },
          { id: '21', label: '下⑧ 腿部輪廓', prompt: `${OUTFIT_GLOBAL_COMMON_PREFIX}\nLower leg shot focusing on the hem of the garment and shoe transition. Symmetrical balance, sharp focus on the ankle area. Negative: ${OUTFIT_NEGATIVE_GUARD}` },
          { id: '22', label: '下⑨ 鞋履細節', prompt: `${OUTFIT_GLOBAL_COMMON_PREFIX}\nMacro ground-level shot of the footwear and material finish. Extreme detail on leather/fabric texture of shoes. Negative: ${OUTFIT_NEGATIVE_GUARD}` },
          { 
            id: 'single_collage', 
            label: '單圖拼貼版', 
            prompt: `${OUTFIT_GLOBAL_COMMON_PREFIX}\nA professional 3:4 fashion lookbook collage poster. 
[CONTENT]: A clean 3x3 grid showing the SAME model in 9 different views of the SAME outfit.
- TOP ROW: 3 Waist-up close-ups focusing on upper garment details.
- MID ROW: 3 Full-body editorial shots showing silhouettes.
- BOTTOM ROW: 3 Lower-body focus shots showing garment drape and footwear.
[STRICT RULE]: No back views. No suggestive angles. Pure e-commerce aesthetic.
[STYLE]: Commercial studio photography, pure white background, high-end editorial layout.
Negative: ${OUTFIT_NEGATIVE_GUARD}`
          }
      ]
    },
    storyboard: {
        label: '影片分鏡矩陣 (Storyboard)',
        description: '生成影片導演等級的分鏡腳本，包含運鏡與動態指引。',
        prompts: [
            { id: '00', label: 'Shot 1', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nWide Shot. Establishing posture. Model standing in a vast, minimalist architectural space. Cold morning light.` },
            { id: '01', label: 'Shot 2', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nMedium-Full. Model turns 45 degrees. Camera tracks slowly. Focus on the fluid motion of the garment.` },
            { id: '02', label: 'Shot 3', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nFull Body Tracking. Mid-stride walk. Low-angle camera following the pace. Motion blur on the background.` },
            { id: '10', label: 'Shot 4', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nMedium Close-up. Push-in on neckline. Shallow depth of field. Focus on the tactile quality of the fabric.` },
            { id: '11', label: 'Shot 5', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nExtreme Close-up (Face). Micro-expression of realization. Eyes reflecting the studio lights. 100mm macro.` },
            { id: '12', label: 'Shot 6', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nMedium Shot. Dynamic torso movement. Model twisting slightly. Sharp focus on the interplay of light and shadow on the torso.` },
            { id: '20', label: 'Shot 7', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nLow Angle. Tracking the feet movement. Focus on the shoes hitting the floor. Cinematic floor reflections.` },
            { id: '21', label: 'Shot 8', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nClose-up. Hands subtly adjusting fabric edge. Focus on finger dexterity and fabric texture.` },
            { id: '22', label: 'Shot 9', prompt: `${GLOBAL_PHOTOGRAPHY_DNA}\nFull Body. Final stylish hero pose. Strong backlighting, lens flare, epic conclusion.` }
        ]
    },
    editorial_popout: {
        label: '雜誌風格立體矩陣 (Editorial Pop-Out)',
        description: '生成單張 3:4 高端海報：3x3 雜誌封面背景 + 前景巨大的 3D 立體人物。',
        isSingleImage: true,
        prompts: [
            { 
                id: 'main', 
                label: 'Editorial Pop-Out Poster', 
                prompt: `${GLOBAL_PHOTOGRAPHY_DNA}
A high-fashion vertical 3:4 editorial collage poster. 
[FOREGROUND]: A massive, hyper-detailed full-body fashion model in a dominant and commanding hero pose. The pose must feel grounded with natural weight distribution.
[OPTICAL POP-OUT]: The subject MUST physically step OUT of the background grid. Implement deep contact shadows and Ambient Occlusion (AO) where the subject's feet meet the grid to ground the subject. Use shallow Depth of Field (DoF) to blur the background grid slightly.
[DYNAMIC POLISH]: Clothing must show realistic tension and movement folds. The overall composition should have a high-end, polished editorial finish with perfect color grading and tonal balance.
[BACKGROUND]: A sophisticated 3x3 grid of professional fashion magazine covers. Each cell MUST look like a complete, finished magazine cover with its own unique lighting, background, and typography.
[STYLE]: High-end editorial, professional publishing layout, 8k resolution, volumetric lighting, paper texture finish.
{{MAGAZINE_GRID}}` 
            }
        ]
    }
};

export const CHARACTER_NORMALIZATION_PROMPT = `${GLOBAL_PHOTOGRAPHY_DNA}
[TASK]: Generate a high-fidelity Waist-up portrait for character standardization.
[IDENTITY]: 100% strict adherence to the facial features provided in the reference images. Prioritize restoring the unique facial geometry, eye shape, and skin texture.
[COMPOSITION]: 
1. Framing: Crop to show Head, Shoulders, and Chest clearly.
2. Background: FORCE SOLID WHITE (#FFFFFF).
3. Lighting: Neutral flat studio lighting to capture all details without harsh shadows.
4. Pose: Symmetrical front-facing pose, neutral expression.`;

export const STORYBOARD_ANALYSIS_PROMPT = `
Act as a Professional Film Director. Analyze the provided image and create a coherent 9-frame cinematic storyboard script.
The storyboard should tell a compelling visual story featuring the character/product in the image.

Output MUST be a JSON object:
{
  "story_breakdown": "A detailed explanation of the narrative arc and visual progression (in Traditional Chinese).",
  "frames": [
    {
      "id": "00",
      "label": "Shot 1: [Title]",
      "prompt": "Detailed English prompt for image generation focusing on composition, lighting, and action.",
      "translation": "Chinese description of this shot for the user."
    }
  ]
}

Guidelines:
- Generate 9 frames total (id: "00", "01", "02", "10", "11", "12", "20", "21", "22").
- Frames should follow a logical sequence (e.g., Establishing -> Detail -> Action -> Climax -> Resolution).
- Prompts should be professional, technical, and optimized for high-quality image generation.
- Maintain character/product consistency in all prompts.
`;
