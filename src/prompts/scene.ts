
import { ScenePhysics } from '../shared/types/types';

/**
 * 空間分析提示詞
 */
export const SCENE_ANALYSIS_PROMPT = `
Analyze the compatibility of the subject and background. 
CRITICAL: Identify the horizon line Y-coordinate and the vanishing point.
Return JSON ONLY:
{
  "analysis": {
    "spatial": {
      "horizon_y": "number (0-1000)",
      "vanishing_point": "string",
      "suggested_scale": "string (e.g., 'full_body_small', 'waist_up_large')",
      "ground_type": "string"
    },
    "detectedEnvironment": { "time": "string", "weather": "string", "intensity": "string" }
  }
}`;

// 時間物理光影映射
const TIME_MAPPING: Record<string, string> = {
    early_morning: "Cold blue hour light transitioning to 3000K warm sunrise. Long directional shadows.",
    morning: "Standard 5500K daylight, clean neutral white balance, sharp clarity.",
    afternoon: "Hard side-lighting, 4500K golden-white, deep contrasty shadows.",
    evening: "7000K Golden Hour sunset. Extreme amber rim lighting, long cinematic shadows.",
    night: "Cool 9000K midnight tones with artificial warm key lights.",
    deep_night: "Near-black ambient, high-ISO grain feel, single harsh dramatic light source."
};

/**
 * 天氣物理語法映射 (V2.2 強化版：顯著提升雪與霜的物理交互作用)
 */
const WEATHER_MAPPING: Record<string, Record<string, string>> = {
    clear: {
        "柔光": "Soft global illumination. [Subject]: Velvety skin textures.",
        "標準": "Hard direct sunlight. [Subject]: Defined shadows.",
        "強光": "Overexposed sun. [Subject]: Specular highlights on forehead and shoulders.",
        "烈日": "Scorching sun. [Subject]: High-contrast lighting, squinting look."
    },
    overcast: {
        "薄雲": "Diffused light. [Subject]: Natural flat lighting.",
        "多雲": "Softbox sky. [Subject]: Muted highlights.",
        "厚雲": "Gloomy ambiance. [Subject]: Desaturated skin tones.",
        "陰鬱": "Dark storm clouds. [Subject]: Dramatic low-key lighting."
    },
    rain: {
        "細雨": "Mist droplets in air. [Subject]: Subtle moisture on hair, damp fabric textures.",
        "中雨": "Vertical rain streaks. [Subject]: Wet-look clothing, reflective water coating on skin.",
        "大雨": "Heavy downpour. [Subject]: Drenched look, water dripping from hem.",
        "暴雨": "Torrential chaos. [Subject]: Motion blurred rain, completely soaked."
    },
    snow: {
        "小雪": "Light snowflakes dancing in air. [Subject]: Visible white snow particles resting on hair strands and shoulder fabric. Soft cold glow.",
        "大雪": "Dense winter snowfall. [Subject]: Heavy snow accumulation on shoulders and head. Shivering expression, visible cold breath, frost appearing on eyelashes.",
        "暴雪": "Extreme blizzard, low visibility. [Subject]: Clothes heavily covered in white snow powder. Volumetric snow masking the silhouette, wind-blown hair with ice bits.",
        "冰雪": "Frozen arctic environment. [Subject]: Reddened nose and cheeks from extreme cold, skin has a pale crystalline sheen, clothing looks stiff and iced over."
    },
    fog: {
        "薄霧": "Soft haze. [Subject]: Slightly softened edges.",
        "中霧": "Noticeable fog. [Subject]: Subject is clear but background is heavily obscured.",
        "濃霧": "Deep volumetric fog. [Subject]: Only silhouette is sharp.",
        "迷霧": "Mystical mist. [Subject]: Ethereal glow around edges."
    },
    frost: {
        "輕霜": "Crystalline frost layer. [Subject]: Micro-crystals of ice shimmering on clothing collars and hair tips. Slightly pale, dewy skin.",
        "結冰": "Slick ice textures. [Subject]: Sharp specular glints on garment edges as if coated in thin ice. Hair looks sharp and frozen.",
        "冰封": "Deep rime ice coverage. [Subject]: 50% of the outfit is covered in detailed white frost patterns and ice crust. Intense visible frozen breath.",
        "嚴寒": "Sub-zero deathly cold. [Subject]: Blueish-pale skin tone, heavy frost on eyebrows and facial hair. Every fabric fold has white crystalline edges."
    },
    thunder: {
        "遠雷": "Ominous dark sky. [Subject]: Muted low-key lighting.",
        "電閃": "Sudden sharp strobe effect. [Subject]: High-contrast lightning flash.",
        "暴雷": "Violent storm. [Subject]: Flickering illumination.",
        "雲爆": "Explosive charge. [Subject]: Backlit by lightning strike."
    },
    wind: {
        "輕風": "Gentle breeze. [Subject]: Subtle hair movement.",
        "陣風": "Intermittent gusts. [Subject]: Tangled hair, dynamic clothing flow.",
        "疾風": "Strong wind force. [Subject]: Hair blown across face, coat trailing behind.",
        "颶風": "Extreme wind chaos. [Subject]: Motion blurred elements, intense physical resistance."
    },
    aurora: {
        "幽光": "Faint green glow. [Subject]: Subtle green rim light on shoulders.",
        "漫射": "Wavy curtains of light. [Subject]: Soft neon green shadows.",
        "霓虹": "Vivid dancing lights. [Subject]: Strong colorful ambient spill.",
        "輝煌": "Spectacular sky. [Subject]: High-key magical lighting."
    }
};

const getShadowDescription = (value: number): string => {
    if (value <= 20) return "Ultra-soft contact shadows.";
    if (value <= 50) return "Natural balanced shadows with soft falloff.";
    if (value <= 80) return "Dense, hard-edged shadows with deep pitch-black core.";
    return "Extreme high-contrast shadows, total blackness in non-lit areas.";
};

/**
 * 建立場景合成提示詞
 */
export const buildSceneCompositionPrompt = (
    pose: string, 
    expression: string, 
    physics: ScenePhysics, 
    backgroundPreset: string = "", 
    hasBgImage: boolean = true,
    backgroundSupplement: string = "",
    gender: string = "auto",
    spatialData?: any,
    framing: string = "",
    supermodelPose?: string,
    poseIntensity: number = 50,
    lightHardness: string = 'balanced',
    colorTemperature: string = 'neutral',
    lensFocalLength: string = '50mm',
    dofIntensity: number = 50,
    fantasyRace?: any,
    fantasyJob?: any,
    battleDamage: number = 0,
    companion: string = 'none',
    multiAngleData: string[] | boolean = false,
    seed?: number
) => {
    const isMultiAngle = Array.isArray(multiAngleData) ? multiAngleData.length > 0 : multiAngleData;
    const labels = Array.isArray(multiAngleData) ? multiAngleData : [];

    const timeDesc = physics.time === 'auto' ? "Match Input 1 lighting" : (TIME_MAPPING[physics.time] || "");
    const weatherDesc = (physics.weather !== 'auto' && WEATHER_MAPPING[physics.weather]) 
        ? WEATHER_MAPPING[physics.weather][physics.intensity] 
        : "Standard clear weather";
    
    // 多角度矩陣融合邏輯 (Global Reference Fusion - Phase 2 Optimized)
    const multiAngleProtocol = isMultiAngle ? `
### [GLOBAL_REFERENCE_FUSION: ENABLED]
- MULTI-MODAL CONTEXT: You are provided with ${labels.length > 0 ? labels.length : 'multiple'} reference images of the SAME subject from different angles.
${labels.length > 0 ? `- INPUT MAPPING: The reference images correspond to: ${labels.join(', ')}.` : ''}

- [FEATURE_WEIGHT_DISTRIBUTION]:
    1. **IDENTITY ANCHOR (High Weight)**: The 'Front' view (正面) is the primary source for facial features, bone structure, and identity recognition. 100% facial likeness must be derived from this view.
    2. **STRUCTURAL SUPPLEMENT (Medium Weight)**: 'Side' (側面) and 'Angle' (45度) views provide critical 3D volume data, hair length/texture from different perspectives, and clothing wrap details.
    3. **BACK DETAIL (Contextual Weight)**: The 'Back' (背面) view is used to accurately render the rear of the outfit, ensuring continuity of patterns and design.

- CORE TASK: Synthesize a unified 3D mental model. Cross-reference fabric patterns, logos, and textures from ALL angles to ensure 100% accuracy in the final scene fusion.
- CONSISTENCY: The generated output must be a logical 3D projection of the combined features.
` : "";

    // 一致性校驗協議 (Consistency Verification - Phase 3)
    const consistencyProtocol = seed !== undefined ? `
### [CONSISTENCY_VERIFICATION_PROTOCOL: ACTIVE]
- SEED LOCK: Seed ${seed} is active. 
- [CONTROLNET_SIMULATION]: 
    1. **POSE LOCK**: Maintain the exact skeletal structure and limb positioning across different camera angles.
    2. **DEPTH LOCK**: Ensure the spatial relationship between the subject and background elements remains constant.
    3. **LIGHTING CALIBRATION**: Calibrate light bounce and global illumination to match the environment perfectly. There should be NO "jumping" effect in lighting when switching between angles.
- TEMPORAL COHERENCE: If this is part of a multi-angle set, ensure the background elements (trees, buildings, furniture) are in the exact same positions relative to the camera's rotation.
` : "";

    const shadowDesc = getShadowDescription(physics.shadowIntensity || 50);
    
    const lightHardnessDesc = 
        lightHardness === 'hard' ? "Hard, direct light source with sharp shadow edges and high-specular highlights." :
        lightHardness === 'soft' ? "Soft, diffused light source with gentle falloff and minimal specular glare." :
        lightHardness === 'ultra_soft' ? "Ultra-soft dreamlike glow, ethereal diffused lighting with zero harsh shadows." :
        lightHardness === 'chiaroscuro' ? "Dramatic Chiaroscuro lighting, extreme contrast between deep shadows and bright pools of light." :
        lightHardness === 'rim_only' ? "Backlit silhouette with strong rim lighting, subject is mostly in shadow with a glowing outline." :
        "Balanced studio lighting.";

    const colorTempDesc = 
        colorTemperature === 'warm' ? "Warm 3200K color temperature, amber highlights, and cozy shadows." :
        colorTemperature === 'golden_hour' ? "7000K Golden Hour sunset glow, intense amber rim lighting, long cinematic shadows." :
        colorTemperature === 'cool' ? "Cool 7500K color temperature, blueish highlights, and crisp shadows." :
        colorTemperature === 'teal_orange' ? "Cinematic Teal and Orange color grading, orange skin tones with teal shadows." :
        colorTemperature === 'neon_cyber' ? "Cyberpunk Neon lighting, dual-tone cyan and magenta ambient spill." :
        "Neutral 5500K daylight balance.";

    const lensDesc = 
        lensFocalLength === '14mm' ? "Ultra-wide 14mm lens, epic perspective, slight barrel distortion for grand scale." :
        lensFocalLength === '24mm' ? "Wide-angle 24mm lens, deep depth of field, slight perspective distortion for dynamic energy." :
        lensFocalLength === '35mm' ? "Classic 35mm street photography lens, natural storytelling perspective." :
        lensFocalLength === '85mm' ? "Portrait 85mm lens, shallow depth of field, beautiful bokeh, compressed background for elegant focus." :
        lensFocalLength === '135mm' ? "Telephoto 135mm lens, extreme background compression, creamy bokeh, intimate focus." :
        "Standard 50mm prime lens, natural human-eye perspective.";

    const dofDesc = `Depth of Field Intensity: ${dofIntensity}/100. ${dofIntensity > 70 ? "Extremely shallow focus with creamy bokeh." : (dofIntensity > 30 ? "Cinematic background blur." : "Deep focus, everything sharp.")}`;

    const finalBgSetting = backgroundPreset + (backgroundSupplement ? `. Extra details: ${backgroundSupplement}` : "");

    const horizonY = spatialData?.horizon_y || 650;
    const suggestedScale = framing || spatialData?.suggested_scale || "Full body shot";

    // 自拍模式特化邏輯 (Phase 2: Deep POV & Fidelity)
    const isSelfie = suggestedScale.toLowerCase().includes('selfie');
    const isMirrorSelfie = suggestedScale.toLowerCase().includes('mirror');
    const isSelfieStick = suggestedScale.toLowerCase().includes('selfie stick');
    
    const ugcVal = physics.ugcIntensity || 50;
    const camType = physics.selfieCameraType || 'front';
    const selfieAngle = physics.selfieAngle || 'eye';
    
    const noiseDesc = ugcVal > 70 ? "Visible digital noise, high ISO grain, raw smartphone sensor look." : (ugcVal > 30 ? "Subtle digital grain, natural mobile photo texture." : "Clean, high-end digital capture, minimal noise.");
    const mirrorDesc = isMirrorSelfie 
        ? (ugcVal > 60 ? "Authentic mirror artifacts: faint fingerprints, subtle dust specks, and soft reflections of the surrounding room." : "Clean mirror surface with sharp reflections.")
        : "NO MIRROR. This is a direct shot, not a reflection.";
    
    const clutterDesc = ugcVal > 80 ? "Include casual background elements (e.g., a slightly messy room, clothing on a rack) to enhance the 'candid' lifestyle feel." : "Maintain a clean and professional background environment.";

    const angleDesc = selfieAngle === 'high' ? "High-angle shot (looking down), slightly elongated face, classic 'top-down' selfie perspective." : 
                     (selfieAngle === 'low' ? "Low-angle shot (looking up), dominant perspective, dramatic chin and jawline visibility." : "Eye-level perspective, natural and direct.");

    // 自拍旋轉邏輯 (Selfie Rotation Logic)
    const selfieRotationProtocol = (isSelfie && isMultiAngle) ? `
### [SELFIE_ROTATION_LOGIC: ACTIVE]
- CONCEPT: The subject is holding the camera (smartphone) and rotating their body or the camera position to capture different angles (Front, Side, Angle, Back) while maintaining the SAME pose, expression, and environment.
- CAMERA ATTACHMENT: The camera is physically attached to the subject's hand/arm. 
- [POV_CONSISTENCY]: Since the camera moves WITH the subject, the subject's face and body orientation relative to the camera should match the requested angle (e.g., 'Side view' means the camera is held at the side of the subject's face).
- ARM VISIBILITY: For 'Front', 'Side', and 'Angle' views, the arm holding the camera MUST be partially visible in the frame (bottom or side corner).
- NO SMARTPHONE: Strictly PROHIBIT showing the actual smartphone hardware. Focus on the POV effect.
- BACKGROUND PANNING: As the subject "rotates", the background environment must pan accordingly to reflect the change in orientation.
- CONSISTENCY: The subject's pose and expression must remain identical across all angles.
` : "";

    const cameraSpec = camType === 'front' 
        ? `Front-facing smartphone camera (Selfie Mode). 
           [POV_EFFECT]: ${isSelfieStick ? "Mandatory selfie stick visible, extending from the bottom corner towards the subject." : "Mandatory arm extension visible in the bottom corner, suggesting the subject is holding the phone."} 
           [DISTORTION]: Slight wide-angle barrel distortion at edges. 
           [FOCUS]: Fixed focus on the face, slight background blur.
           [STRICT]: NO mirror reflection. NO smartphone visible in the subject's hand. The subject is looking directly into the camera lens.`
        : `Rear smartphone camera (Mirror Selfie). 
           [POV_EFFECT]: The subject is holding a high-end smartphone, visible in the mirror reflection. 
           [PERSPECTIVE]: Natural optical depth, crisp details, professional mobile photography look.
           [INTERACTION]: The subject is looking at their own reflection or the phone screen in the mirror.`;

    const ugcProtocol = isSelfie ? `
### [UGC_PROTOCOL: TRUE_POV_SELFIE - INTENSITY: ${ugcVal}/100]
${selfieRotationProtocol}
- PERSPECTIVE: MANDATORY FIRST-PERSON POINT-OF-VIEW (POV). 
- CAMERA ANGLE: ${angleDesc}
- CAMERA SPEC: ${cameraSpec}
- TEXTURE: ${noiseDesc}
- MIRROR ARTIFACTS: ${mirrorDesc}
- ENVIRONMENT: ${clutterDesc}
- INTERACTION: The subject MUST be interacting with the camera/mirror as specified in CAMERA SPEC.
- STRICT PROHIBITION: NO THIRD-PERSON VIEW. DO NOT show the subject from a distance unless it's a mirror selfie. The camera MUST feel like it is part of the subject's immediate action.
` : "";

    // 背景模式判定：如果有背景圖，則執行融合；如果沒有背景圖，則執行「全面環境建構」
    const environmentStrategy = hasBgImage 
        ? "INTEGRATE the subject into the specific environment shown in Input 1."
        : `[ENV_CONSTRUCTION_MODE]: CREATE a complete, high-fidelity photorealistic environment around the person based on the following description: ${finalBgSetting}. The background must be physically coherent and high-end fashion quality.`;

    const subjectIdx = hasBgImage ? 3 : 2;
    const identityIdx = hasBgImage ? 2 : 1;

    // Fantasy 3.0 Logic: Identity Lock & Race Overlay
    let fantasyProtocol = "";
    if (fantasyRace) {
        const racePrompt = gender === 'male' ? (fantasyRace.race_prompt_male_en || fantasyRace.race_prompt_en) : 
                          (gender === 'female' ? (fantasyRace.race_prompt_female_en || fantasyRace.race_prompt_en) : fantasyRace.race_prompt_en);
        
        const jobPrompt = fantasyJob ? `Class: ${fantasyJob.labelZh}. Features: ${fantasyJob.features?.join(', ')}. Action: ${fantasyJob.action?.join(', ')}.` : "";
        
        const damageDesc = battleDamage === 1 ? "Light battle wear: minor scratches on armor, slightly disheveled hair." :
                          (battleDamage === 2 ? "Moderate battle damage: cracked armor plates, visible dirt and small cuts, intense expression." :
                          (battleDamage === 3 ? "Heavy battle damage: broken equipment, blood stains, torn fabric, exhausted but heroic stance." : "Pristine condition."));

        const companionDesc = companion !== 'none' ? `Companion: A ${companion} following or standing beside the subject, interacting naturally.` : "";

        fantasyProtocol = `
### [FANTASY_3.0_IDENTITY_LOCK_ENGINE]
- **RACE OVERLAY**: ${racePrompt}
- **IDENTITY PRESERVATION**: MANDATORY. Apply race features (ears, eyes, skin tone) as an OVERLAY. DO NOT change the underlying bone structure, nose shape, or eye position of the person from Input ${identityIdx}.
- **MORPHING RULE**: The result must be "The person from Input ${identityIdx} as a ${fantasyRace.labelZh}". 100% facial recognition must be maintained.
- **JOB & GEAR**: ${jobPrompt}
- **NARRATIVE STATE**: ${damageDesc}
- **EXTRAS**: ${companionDesc}
- **VISUAL STYLE**: Epic cinematic fantasy, high-end concept art fidelity.
`;
    }

    let poseInstruction = `POSE: ${pose}.`;
    if (supermodelPose) {
        poseInstruction = `[SUPERMODEL_POSE_TRANSFER]: 
        RE-TARGET the subject's body into this professional fashion pose: ${supermodelPose}. 
        POSE INTENSITY: ${poseIntensity}/100. (Higher means more dramatic change from original).
        Maintain 100% identity and apparel fidelity while re-posing the limbs.`;
    }

    return `
**[ROLE: MASTER CINEMATIC COMPOSITOR & FIDELITY SPECIALIST]**
Task: Photorealistically place the subject from Input ${subjectIdx} into a new scene with 100% FIDELITY.

[🚨 GENDER GUARD]: Subject is ${gender === 'female' ? 'FEMALE' : (gender === 'male' ? 'MALE' : `the person from Input ${subjectIdx}`)}.

### [CORE MANDATE: 100% FIDELITY & COMPOSITION]
${multiAngleProtocol}
- FRAMING PRIORITY: The [CAMERA & FRAMING] instruction is the absolute authority for the shot's scale. If "Medium Shot" or "Close-up" is requested, you MUST crop the subject and background accordingly. Do NOT feel obligated to show the entire body or outfit if it conflicts with the requested framing.
- IDENTITY LOCK: 100% STRICT preservation of facial features, bone structure, and likeness from Input ${identityIdx} and Input ${subjectIdx}. The face must be an EXACT match. No AI "beautification" or alterations.
- OUTFIT LOCK: 100% EXACT replication of the clothing from Input ${subjectIdx}. Maintain all textures, patterns, logos, and design details. If the requested framing cuts off parts of the outfit, focus on rendering the visible portions with extreme fidelity.
- MANDATORY: Do not hallucinate or "improve" the person's face or clothing. They must be identical to the references, but framed according to the specific request.

### [ENVIRONMENT & STRATEGY]
${consistencyProtocol}
- STRATEGY: ${environmentStrategy}
- LIGHTING: ${timeDesc}. ${lightHardnessDesc} ${colorTempDesc}
- SHADOWS: ${shadowDesc}
- WEATHER PROTOCOL: ${weatherDesc}.
${fantasyProtocol}
${ugcProtocol}

### [RAY-TRACED FUSION & MATERIAL RESPONSE]
- SUBSURFACE SCATTERING: Simulate realistic light penetration through skin, especially in backlit areas (ears, nose, fingers).
- SPECULAR REFLECTION: Dynamically calculate highlights based on material DNA. 
    - SILK/SATIN: High-gloss anisotropic reflections.
    - LEATHER: Subtle pebbled sheen with sharp specular points.
    - DENIM/COTTON: Diffuse absorption with micro-texture shadows.
    - METAL/JEWELRY: Ray-traced mirror reflections of the environment.
- GLOBAL ILLUMINATION: Ensure ambient light from the background "bleeds" onto the subject's edges (Color Bleeding) for 100% integration.

### [SPATIAL ENGINE & OPTICS]
- HORIZON: Y=${horizonY}. Align eye-level.
- LENS: ${lensDesc}
- BOKEH: ${dofDesc}
- CAMERA & FRAMING: ${suggestedScale}. Use professional cinematic lens settings.
- ATMOSPHERIC PERSPECTIVE: Add subtle haze and color desaturation for distant background elements to create immense depth.

### [ULTIMATE DETAIL RECONSTRUCTION - 8K PROTOCOL]
- TEXTURE: Render at 8K perceived resolution. Micro-pores on skin, individual fabric threads, and ultra-fine hair strands must be visible.
- SHARPNESS: Professional digital negative sharpness. No artificial over-sharpening artifacts.
- NOISE: Clean, high-ISO film grain texture (subtle) to avoid "plastic" AI look.

### [PERFORMANCE & IDENTITY LOCK - CRITICAL]
- ${poseInstruction}
- EXPRESSION: ${expression}. 
- FINAL CHECK: Ensure the [CAMERA & FRAMING] scale is strictly followed. If it is a Medium Shot, the subject must be cropped at the waist.
- MANDATORY: Do not hallucinate or "improve" the person's face or clothing. They must be identical to the references.

### [MATERIAL & PHYSICS]
- MATERIAL ENHANCEMENT: Analyze the clothing material and render with extreme realism (e.g., leather grain, silk sheen, knit depth).
- If SNOW/FROST is active: Ensure physical snow/ice particles are visible on hair, shoulders, and garment folds. 
- Render realistic sub-surface scattering for skin in cold conditions.

[NEGATIVE PROMPT]
(smooth skin:1.5), (plastic:1.5), CGI, 3d render, cartoon, floating, blurry face, distorted limbs, (bad hand:1.5), text, watermarks.
`.trim();
};

export const DETAIL_TUNE_PROMPT = (instruction: string) => `Edit image based on mask. Instruction: ${instruction}.`;
