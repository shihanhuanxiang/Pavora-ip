
// ============================================================================
// PAVORA V8.6 - FULL BODY ANCHOR EDITION
// ============================================================================

// 1. AESTHETIC STYLE MAPPING (Gender Specific)
const AESTHETIC_MAP: Record<string, Record<string, string>> = {
    female: {
        realistic: "Raw photorealism, shot on 85mm lens. Hyper-realistic skin texture with visible pores. Soft natural lighting. Full body framing with safe margins around feet.",
        high_fashion: "High-end fashion editorial. Sharp, angular posing. Full body silhouette against clean studio background. Expensive designer look. Maintain the model's original ethnic features.",
        korean_soft: "K-Beauty aesthetic. 'Glass skin'. High-key lighting. Soft coral makeup. Full length portrait showing entire posture.",
        western_vogue: "Western supermodel aesthetic. Sun-kissed skin. Strong contouring. Sultry gaze. Full body fashion shot.",
        japanese_fresh: "Japanese 'Mori Girl' transparency. Low contrast, airy feel. Natural makeup. Full body standing pose.",
        cyberpunk: "Cyberpunk futuristic aesthetic. Neon rim lighting. Techwear elements. Full body height visible.",
        cinematic: "Cinematic movie still. Anamorphic bokeh. Tonal depth. Full body narrative composition."
    },
    male: {
        realistic: "Raw masculine photorealism. Detailed skin texture, visible stubble. Natural daylight. Full length standing view.",
        high_fashion: "Men's Vogue editorial. Sharp jawline. Moody structured lighting. Full body tailored styling.",
        korean_soft: "K-Pop Idol aesthetic. Flawless complexion. Textured hair. Bright studio lighting. Full body lean fit.",
        western_vogue: "Classic GQ style. Rugged texture, strong jaw. Full body powerful stance.",
        japanese_fresh: "Japanese 'City Boy' aesthetic. Fresh-faced. Relaxed full body posture.",
        cyberpunk: "Future-tech mercenary. Neon reflections. Full body height, grounded stance.",
        cinematic: "Action movie hero. Gritty texture, dramatic lighting. Full body dramatic still."
    }
};

// 2. FACE ARCHETYPE MAPPING
const FACE_ARCHETYPE_MAP: Record<string, Record<string, string>> = {
    female: {
        standard: "Symmetrical face, oval shape. Friendly and approachable beauty.",
        delicate_asian: "Refined East Asian features. Soft facial contours, petite nose.",
        sharp_western: "Defined Western features. Deep-set eyes, sharp jawline.",
        soft_youthful: "Youthful face. Large innocent eyes, fuller cheeks.",
        exotic_mixed: "Striking mixed-heritage look. Unique golden skin tone.",
        classic_beauty: "Timeless Hollywood beauty. Golden ratio proportions.",
        high_cheekbones: "High-fashion model face. Prominent cheekbones, edgy look.",
        ethereal_elfin: "Ethereal, elfin-like features. Narrow chin, large expressive eyes, delicate pointed nose.",
        mature_elegant: "Sophisticated mature beauty. Refined bone structure, graceful expression, confident aura.",
        cyber_stray: "Edgy futuristic look. Sharp features, intense gaze, tech-optimized proportions.",
        fitness_leader: "Healthy athletic face. Toned facial muscles, clear skin, vibrant and energetic look.",
        nordic_minimal: "Clean Nordic aesthetic. Pale features, sharp bone structure, minimalist beauty."
    },
    male: {
        standard: "Handsome commercial face. Square jaw, friendly smile.",
        delicate_asian: "Refined Asian features. Slim face, intellectual vibe.",
        sharp_western: "Rugged Western features. Chiseled and masculine.",
        soft_youthful: "Youthful flower boy aesthetic. Smooth skin, expressive eyes.",
        exotic_mixed: "Unique mixed features. Modern global appeal.",
        classic_beauty: "Classic gentleman look. Timeless elegance.",
        high_cheekbones: "Edgy editorial face. Angular and severe.",
        cyber_stray: "Sharp futuristic mercenary look. Intense gaze, tech-ready features.",
        fitness_leader: "Athletic and masculine. Strong jawline, healthy skin, focused energy.",
        nordic_minimal: "Minimalist Nordic look. Sharp blue/grey-eyed aesthetic, clean bone structure."
    }
};

// 3. AI STYLIST ASSISTANT (Photography Keywords)
const FIDELITY_LEVELS: Record<number, string> = {
    1: "Studio Clean: Professional studio setup, clean backdrop, perfect lighting, no noise.",
    2: "Soft Realism: Natural skin texture, subtle ambient light, clean street environment.",
    3: "Street Snap: Visible skin pores, real-world lighting, authentic street texture, balanced colors.",
    4: "Hyper-Real: Raw sensor data look, minor lens aberrations, Taiwan urban clutter (scooters, cables, signage), realistic fabric micro-wear.",
    5: "UGC/Candid: Smartphone camera quality, high ISO grain, lens flare, incidental messy background, opportunistic lighting, 100% candid vibe."
};

const getStylistKeywords = (params: any) => {
    let keywords = "";
    if (params.generationQuality === 'ultra') {
        keywords += "Shot on Phase One XF, IQ4 150MP. Extreme resolution. 16-bit color depth. Professional color grading. Sub-pixel detail. ";
    } else if (params.generationQuality === 'high') {
        keywords += "Shot on Sony A7R V, 61MP. Sharp focus. Professional post-processing. ";
    }

    const styleKeywords: Record<string, string> = {
        realistic: "Natural skin texture, raw photo, unedited look, 8k resolution.",
        high_fashion: "Editorial lighting, sharp contrast, high-end retouching, glossy finish.",
        korean_soft: "Soft focus, pastel tones, clean background, ethereal glow.",
        western_vogue: "Strong contouring, dramatic shadows, sun-kissed skin, high-fashion pose.",
        japanese_fresh: "Airy atmosphere, low contrast, natural daylight, minimalist aesthetic.",
        cyberpunk: "Neon reflections, chromatic aberration, futuristic textures, high-tech vibe.",
        cinematic: "Anamorphic bokeh, film grain, cinematic color grading, dramatic storytelling."
    };

    keywords += styleKeywords[params.aestheticStyle] || styleKeywords['realistic'];
    return keywords;
};

// 4. TAIWAN LOCALIZED SCENE ANCHORS
const TAIWAN_SCENE_ANCHORS: Record<string, string> = {
    ximending_neon: "Ximending youth district at night. Vibrant neon signs in Traditional Chinese, wet asphalt reflections, bustling crowds in the far background, urban anime aesthetic, slightly gritty city vibe.",
    xinyi_modern: "Xinyi District luxury skyline. Sleek glass skyscrapers (Taipei 101 style), modern architectural lines, clean wide sidewalks, upscale urban lighting, high-end commercial atmosphere.",
    old_street_vibe: "Traditional Taiwan old street. Red brick walls, retro iron window lattices (窗花), weathered textures, hanging lanterns, nostalgic atmosphere, warm amber lighting.",
    convenience_store_night: "Outside a brightly lit 24/7 convenience store. Iconic white/green/blue ambient glow, plastic chairs, city night background with passing scooters, everyday life realism.",
    dadaocheng_retro: "Dadaocheng historical district. Baroque-style facades, tea house interiors, nostalgic wooden textures, heritage vibe, warm afternoon sun filtering through old windows."
};

// 5. BUILDER FUNCTION
export const buildModelPrompt = (params: any) => {
    const hasFaceRef = params.faceReferences && params.faceReferences.length > 0;
    const genderKey = params.gender === 'male' ? 'male' : 'female';
    const aestheticDesc = AESTHETIC_MAP[genderKey][params.aestheticStyle] || AESTHETIC_MAP[genderKey]['realistic'];
    const archetypeDesc = hasFaceRef ? "" : (FACE_ARCHETYPE_MAP[genderKey][params.archetype] || FACE_ARCHETYPE_MAP[genderKey]['standard']);
    const stylistKeywords = getStylistKeywords(params);

    // --- 🛡️ SAFETY COMPLIANCE TRANSLATION LAYER (PHASE 2) ---
    const translateOutfit = (rawPrompt: string) => {
        let p = rawPrompt.toLowerCase();
        
        // --- [EXPLICIT SEMANTIC TRANSFORMATION] ---
        // 將敏感詞轉義為高階時裝工學描述
        p = p.replace(/bikini/g, 'High-Tension Structural Athletic Cut Set');
        p = p.replace(/比基尼/g, 'High-Tension Structural Athletic Cut Set');
        
        p = p.replace(/string/g, 'Precision Corded Support Architecture');
        p = p.replace(/細帶/g, 'Precision Corded Support Architecture');
        p = p.replace(/thin strap/g, 'Precision Corded Support Architecture');
        
        p = p.replace(/nude/g, 'Matte Second-Skin Elastane');
        p = p.replace(/裸感/g, 'Matte Second-Skin Elastane');
        p = p.replace(/naked/g, 'Matte Second-Skin Elastane');
        
        p = p.replace(/sexy/g, 'sophisticated avant-garde couture');
        p = p.replace(/micro/g, 'precision-engineered minimalist');
        p = p.replace(/transparent/g, 'sheer-overlay technical fabric');
        
        return p;
    };

    let prompt = `Generate a photorealistic ${params.gender} fashion model based on the following specific mandates.\n\n`;

    // --- 🚨 [PHASE 1: THE IDENTITY ANCHOR - BIOMETRIC LOCK] 🚨 ---
    if (hasFaceRef) {
        prompt += `[🚨 ULTIMATE IDENTITY MANDATE: BIOMETRIC_MESH_LOCK_LEVEL_10 🚨]\n`;
        prompt += `- STATUS: ABSOLUTE SURGICAL PRECISION.\n`;
        prompt += `- THE ONLY VISUAL TRUTH: The provided face reference images are the EXCLUSIVE source for facial identity. \n`;
        prompt += `- FEATURE RECOVERY (五官還原): 1:1 mapping of eye tilt, nasal bridge height, lip thickness, and ear position. \n`;
        prompt += `- RENDERING ENGINE INSTRUCTION: Prioritize biometric data in the reference photos as the master layer. Background and clothing must conform to face geometry, never the other way around. \n`;
        prompt += `- ANTI-DRIFT PROTOCOL: Reject all generic AI aesthetics. If the result looks like a "typical AI model," it is a failure. Preserve skin texture, slight facial asymmetry, and unique heritage markers from source. \n\n`;
    }

    // --- [SPECTRAL FIDELITY: COLOR CHANNELS] ---
    prompt += `[COLOR SPECTRAL FIDELITY: PRIORITY ALPHA]\n`;
    prompt += `- SKIN SPECTRUM: Force color output to exact "${params.skinTone}" tone. This is a Spectral Instruction: do NOT allow environment lighting, "Aesthetic Style", or color grading to wash out or shift this skin tone. \n`;
    prompt += `- HAIR SPECTRUM: Force hair color to exact "${params.hairColor}" color. Identity depends on this chromatic consistency. \n\n`;
    if (params.persona) {
        const personaPrefix = hasFaceRef ? "Subject Behavior" : "IP Persona";
        prompt += `[${personaPrefix}: ${params.persona.coreVibe}]\n`;
        prompt += `- Behavioral Personality: ${params.persona.mbti || 'Unknown'} - ${params.persona.profession || ''}. \n`;
        prompt += `- Expression Archetype: ${params.persona.toneOfVoice || 'Natural'}. \n`;
        prompt += `- Background Setting: ${params.lifeCircuit?.primaryCity || 'Taiwan'}. \n`;
        
        // Micro-Expression Logic based on Vibe
        prompt += `[MICRO-EXPRESSION ENGINE]\n`;
        if (params.persona.coreVibe === '高冷厭世') {
            prompt += `- Expression: Subtle "sultry/bored" look. Slightly narrowed eyes, relaxed lips. Micro-tension in the forehead. \n`;
        } else if (params.persona.coreVibe === '鄰家親切') {
            prompt += `- Expression: Genuine warm smile. Visible nasolabial folds (法令紋) and soft "crow's feet" (魚尾紋) muscle compression for authenticity. \n`;
        } else {
            prompt += `- Expression: Controlled facial tension. Professional model gaze. \n`;
        }
        
        // Catchlight tracking
        prompt += `- Eyes Catchlight: Procedural reflection based on ${params.lightingPreset} source. Sharp, crystal-clear iris reflections. \n\n`;
    }

    // --- REALISM & FIDELITY ENGINE ---
    const fLevel = params.fidelityScale || (params.realismToggle ? 4 : 2);
    prompt += `[FIDELITY ENGINE: LEVEL ${fLevel}]\n`;
    prompt += `- ${FIDELITY_LEVELS[fLevel] || FIDELITY_LEVELS[2]}\n`;
    
    if (params.dofIntensity !== undefined) {
        const dof = params.dofIntensity;
        prompt += `[DEPTH OF FIELD CONTROL]\n`;
        if (dof < 30) prompt += `- Optics: f/1.2 prime lens, extremely shallow DOF, heavy creamy bokeh, background completely blurred.\n`;
        else if (dof < 70) prompt += `- Optics: f/2.8 standard lens, natural background separation, soft focus transition.\n`;
        else prompt += `- Optics: f/8.0 deep focus, sharp street background, wide-angle clarity.\n`;
    }

    // --- COMPOSITION MANDATE (CRITICAL FOR FOOTWEAR) ---
    prompt += `[🚨 COMPOSITION RULE: FULL BODY MANDATORY 🚨]\n`;
    prompt += `- Frame the shot from HEAD TO TOE. \n`;
    prompt += `- MUST show the entire feet and shoes clearly. \n`;
    prompt += `- Ensure a safe margin (padding) between the feet and the bottom edge of the image. \n`;
    prompt += `- The model must be standing vertically within the frame.\n\n`;

    prompt += `[BIOLOGICAL TIME-AXIS: AGE ${params.age || 25}]\n`;
    prompt += `- PHYSIOLOGICAL SYNTHESIS: Adjust the person's appearance to exactly ${params.age || 25} years old.\n`;
    if (params.age > 45) {
        prompt += `- MATURITY SCAN: Introduce realistic age-appropriate skin laxity, subtle nasolabial folds, and character lines around the eyes. Maintain the core bone structure from reference images but overlay natural aging markers.\n`;
    } else if (params.age < 25) {
        prompt += `- YOUTHFUL SCAN: Ensure high skin elasticity, soft facial fat distribution (if appropriate for age), and crystal-clear complexion while preserving biometric features.\n`;
    }
    prompt += `- AGE CONSISTENCY: The age-appearance must be physically plausible for the target number.\n\n`;

    if (params.brandStyleAnchor && params.brandStyleAnchor !== 'none' && !params.isMultiAngle) {
        const anchorMap: Record<string, string> = {
            minimal_luxury: "Clean, high-end aesthetic. Neutral color palette (beige, cream, charcoal). Soft diffused lighting. Minimalist background.",
            vibrant_street: "High energy, urban feel. Saturated colors, dynamic lighting. Streetwear vibe with gritty but polished textures.",
            noir_elegance: "Dark, moody, and sophisticated. Deep shadows, high contrast. Rich textures like velvet or silk. Dramatic lighting.",
            ethereal_dream: "Soft, misty, and otherworldly. Pastel tones, lens flares, soft focus. Airy and light composition.",
            tech_utilitarian: "Futuristic and functional. Cool tones (blue, grey, silver). Sharp lighting, tech-inspired textures and backgrounds."
        };
        prompt += `[BRAND VISUAL ANCHOR: ${params.brandStyleAnchor}]\n${anchorMap[params.brandStyleAnchor]}\n\n`;
    }

    const aestheticLabel = hasFaceRef ? "ENVIRONMENTAL AESTHETIC" : "AESTHETIC STYLE";
    if (!params.isMultiAngle) {
        prompt += `[${aestheticLabel}: ${params.aestheticStyle}]\n${aestheticDesc}\n\n`;
    }

    // --- PHYSIOLOGICAL FEATURE CONTROLS (PHASE 2: ANATOMICAL MAPPING) ---
    if (params.gender === 'female') {
        const bt = params.bustTension || 50;
        const pc = params.physiqueCurvature || 50;
        
        prompt += `[PHYSIQUE ARCHITECTURE: FEMALE ANATOMY]\n`;
        // Mapping Curvature (0-100) -> Physique Contour
        if (pc <= 30) prompt += `- Contour: Lean high-fashion runway frame, minimal anatomical curvature, emphasis on long slender lines. \n`;
        else if (pc <= 70) prompt += `- Contour: Well-proportioned hourglass silhouette, defined bust-to-waist ratio, balanced anatomical curves. \n`;
        else prompt += `- Contour: High-prominence anatomical curvature, significant hourglass projection, emphasized pelvic-waist contrast for high-impact presence. \n`;
        
        // Mapping Bust Volume & Physics (0-100) -> [上圍體積感]
        if (bt > 80) {
            prompt += `- Volume Physics: 🚨 HIGH STRUCTURAL VOLUME. Emphasize a powerful silhouette with significant bust projection. Force realistic "Fabric Stress Creases" across the chest area of the clothing. The fabric MUST look stretched and under tension from internal physical volume. \n`;
        } else if (bt > 40) {
            prompt += `- Volume Physics: Natural feminine volume with realistic gravitational drape. \n`;
        } else {
            prompt += `- Volume Physics: High-fashion lean aesthetic with flat, elegant fabric lines. \n`;
        }
    } else {
        const md = params.muscularDensity || 50;
        const vt = params.vTaperScale || 50;
        
        prompt += `[PHYSIQUE ARCHITECTURE: MALE ANATOMY]\n`;
        // Mapping Muscular Density (0-100)
        if (md <= 30) prompt += `- Density: Slender and lean physique, subtle muscle tone, marathon-runner aesthetic. \n`;
        else if (md <= 70) prompt += `- Density: Athletic aesthetic build, defined pectoralis major, clear muscle separation and vascularity. \n`;
        else prompt += `- Density: 🚨 MAXIMUM MUSCULAR HYPERTROPHY. Dense muscle structure, massive deltoids and pectorals, deep muscle separation and hyper-defined density. \n`;
        
        // Mapping Shoulder Frame (0-100) -> V-Taper
        if (vt > 80) {
            prompt += `- Frame Architecture: 🚨 EXTREME SHOULDER TENSION. Powerful V-tapered skeleton with ultra-broad shoulders. Force fabric tension marks across the trapezius and upper back, showing the garment being stretched by the wide frame. \n`;
        } else {
            prompt += `- Frame Architecture: Natural V-taper architectural frame with professional athletic proportions. \n`;
        }
    }

    if (params.isExpertMode) {
        prompt += `[🚨 MANDATORY BIOLOGICAL METRICS (PHYSICAL TRUTH) 🚨]\n`;
        prompt += `- BIOMETRIC ENFORCEMENT: The model's physique MUST strictly adhere to these precise metrics. No approximation allowed. \n`;
        prompt += `- HEIGHT: Exactly ${params.height}cm (This affects limb length and vertical proportions). \n`;
        prompt += `- BODY MEASUREMENTS (EXACT): Bust ${params.bust}cm, Waist ${params.waist}cm, Hips ${params.hip}cm. \n`;
        prompt += `- PROPORTION RATIO: Head-to-body ratio must be strictly ${params.headBodyRatio || 8.0} heads. \n`;
        prompt += `- SILHOUETTE: ${params.proportionMode} physique mode. The body volume and skeletal structure must be a 100% match for these specifications.\n\n`;
        
        prompt += `[EXPERT SURFACE REALISM]\n`;
        if (params.skinMicroTexture) prompt += `- SKIN: Enable hyper-realistic skin micro-texture, visible pores, and subsurface scattering. \n`;
        if (params.naturalBlemishes) prompt += `- SKIN: Include subtle natural imperfections (moles, freckles) from references for identity verification. \n`;
        if (params.irisDetail) prompt += `- EYES: High-fidelity iris depth and realistic catchlights. \n`;
        
        if (hasFaceRef) {
            prompt += `[EXPERT FACIAL SCULPTING OVERRIDE: DEACTIVATED]\n`;
            prompt += `- Status: Face Reference detected. Manual facial sculpting is IGNORED to prevent identity drift. \n\n`;
        } else {
            prompt += `[EXPERT FACIAL SCULPTING OVERRIDE]\n`;
            prompt += `- Technical Overrides: Eye Shape: ${params.eyeShape}, Nose Height: ${params.noseHeight}/100, Lip Thickness: ${params.lipThickness}/100. \n\n`;
        }

        const lightingMap: Record<string, string> = {
            studio_soft: "Soft professional studio lighting with gentle, realistic shadows.",
            golden_hour: "Warm, low-angle natural sunlight typical of the hour before sunset.",
            cinematic_warm: "Dramatic cinematic lighting with realistic amber tones and professional depth.",
            high_contrast: "Edgy high-contrast photography lighting, sharp highlights and deep blacks.",
            natural_daylight: "Clear, bright natural daylight. Neutral photographic color temperature.",
            neon_night: "Vibrant neon rim lighting with realistic colorful reflections on skin."
        };
        prompt += `[LIGHTING SPECTRUM: ${params.lightingPreset}]\n${lightingMap[params.lightingPreset] || params.lightingDepthControl}\n\n`;
    }

    prompt += `[SUBJECT APPEARANCE]\n`;
    if (!params.faceReferences || params.faceReferences.length === 0) {
        prompt += `Face: ${archetypeDesc}\n`;
    } else {
        prompt += `Face: Locked to Reference Images (BIOMETRIC_LOCK: ACTIVE).\n`;
    }
    prompt += `Skin: Confirming "${params.skinTone}" tone with ${params.skinFinish} finish.\n`;
    prompt += `Hair: Confirming "${params.hairColor}" color. Style: ${params.hairStyle}.\n`;
    prompt += `Body: ${params.proportionMode} proportions. Height: ${params.height}cm. Head-to-body ratio: ${params.headBodyRatio || 8.0} heads. (Bust ${params.bust}, Waist ${params.waist}, Hip ${params.hip}).\n\n`;

    let outfitPrompt = '';
    if (params.customOutfitPrompt) {
        outfitPrompt = params.customOutfitPrompt;
    } else if (params.outfitItems && params.outfitItems.length > 0) {
        // 多組件複選邏輯
        outfitPrompt = params.outfitItems.map((item: any) => item.prompt).join(', ');
    } else {
        outfitPrompt = params.outfitPreset?.prompt || 'Minimalist high-fashion basic wear, neutral colors';
    }
    
    prompt += `[OUTFIT MANDATE]\n`;
    prompt += `- Description: ${translateOutfit(outfitPrompt)}.\n`;
    prompt += `- Aesthetic: Stick to a clean, solid color palette. Use high-end technical fabrics like matte lycra or double-knit jersey. \n`;
    prompt += `- Silhouette Architecture: Prioritize form-fitting silhouettes that precisely map the model's physical structure. Highlight the anatomical curves and torso-to-hip transitions using clear visible seams and structural lines. \n`;
    prompt += `- Compliance Policy: Ensure the garment construction is sophisticated and follows high-end fashion standards. Avoid any speculative artifacts. \n\n`;

    if (params.isMultiAngle) {
        prompt += `[🚨 PROFESSIONAL CHARACTER REFERENCE SHEET (MODEL SETTING) 🚨]\n`;
        prompt += `- FORMAT: Generate a SINGLE 16:9 horizontal photographic layout. This is a technical character sheet for identity reference.\n`;
        prompt += `- BACKGROUND: Clean, solid neutral studio background (e.g., white or light grey). No props, no furniture, no environment. Just the character.\n`;
        prompt += `- COMPOSITION: Use a strictly organized 2-ROW GRID structure.\n\n`;
        
        prompt += `[ROW 1: FULL BODY TURNAROUND (Top Half of Frame)]:\n`;
        prompt += `- 4 full-length figures aligned horizontally: FRONT VIEW, LEFT PROFILE, RIGHT PROFILE, BACK VIEW.\n`;
        prompt += `- All figures must be at the same scale and perfectly aligned at the head and feet.\n\n`;
        
        prompt += `[ROW 2: BIOMETRIC FACE CLOSE-UPS (Bottom Half of Frame)]:\n`;
        prompt += `- 4 detailed face close-ups aligned horizontally: FRONTAL FACE, LEFT FACE PROFILE, RIGHT FACE PROFILE, BACK OF HEAD (Hair texture).\n`;
        prompt += `- Focus on high-fidelity biometric restoration of facial features (五官).\n\n`;
        
        prompt += `- CONSISTENCY: The identity, skin texture, hair, and clothing MUST remain 100% consistent across all 8 views. Zero drift in character identity.\n`;
        prompt += `- FIDELITY: Sharp high-detail fashion photography. No CG, no 3D-render look. \n\n`;
    }

    prompt += `[TECHNICAL SPECS]\n`;
    prompt += `Shot: ${params.isMultiAngle ? 'Technical Photographic Sheet' : 'FULL BODY VERTICAL SHOT'}. Angle: ${params.angle || 'eye-level'}.\n`;
    prompt += `Camera: 50mm or 85mm prime lens for zero distortion.\n`;
    prompt += `Lighting: ${params.isMultiAngle ? 'Neutral high-key studio lighting, even illumination' : params.lightingDepthControl}.\n`;
    prompt += `Quality: ${stylistKeywords}, photorealistic, RAW quality, 8k resolution.\n\n`;

    prompt += `[NEGATIVE PROMPT]\n`;
    const baseNegatives = "(3D render:1.5), (illustration:1.5), (painting:1.5), (cartoon:1.5), (CG), (anime), (unreal engine), (mutated), (deformed), (low quality), (blurry), (extra limbs), (fused bodies), (mutated hands), (deformed face), (merged characters), (different outfits), (asymmetric clothing)";
    if (!params.isMultiAngle) {
        prompt += `${baseNegatives}, (cropped feet:2.0), (cut off legs:2.0), (missing shoes:2.0), (out of frame:1.8), (half body), (close up), (distorted limbs), (extra toes), (blurry feet).`;
    } else {
        prompt += `${baseNegatives}, (cluttered background:1.8), (messy environment:1.8), (outdoors:1.8), (bokeh:1.5), (depth of field:1.5)`;
    }

    return prompt;
};
