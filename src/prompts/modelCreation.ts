
// ============================================================================
// PAVORA V8.6 - FULL BODY ANCHOR EDITION
// ============================================================================

// T8: 有限集合 preset 的確定性 zh→en 映射（final prompt 全英文鐵則）。
import { CORE_VIBE_EN_MAP, TONE_OF_VOICE_EN_MAP, TAIWAN_COUNTY_EN_MAP } from '../shared/constants/personaPresets';

// 2026-07-11 膚色語意校準（Hank 拍板美感升級）：裸值 "medium" 會被生圖模型解讀成
// 全球平均的偏深膚色（東南亞/南亞感）。此映射把 4 檔膚色錨定在高級時裝 IP 審美語彙。
// 鍵對應 modelPresets.ts 的 SKIN_TONE_OPTIONS value（fair/medium/tan/deep）。
// 2026-07-20：fair/tan/deep 補東亞語感——原本只有 medium 有，fair 的 porcelain-ivory
// rosy undertone 措辭是實測歐美臉漂移的引信之一。
const SKIN_TONE_DESC_MAP: Record<string, string> = {
    fair: 'porcelain-fair luminous ivory with a subtle rosy undertone — a bright translucent fair East Asian complexion (NOT Caucasian skin)',
    medium: 'natural light-medium warm ivory — a healthy, bright, translucent East Asian complexion (NOT tan, NOT olive, NOT dusky)',
    tan: 'sun-kissed light golden honey tan, warm and luminous — a healthy tanned East Asian complexion',
    deep: 'rich deep bronze, smooth, even and luminous East Asian complexion'
};

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
        standard: "ETHNICITY: East Asian (Taiwanese) facial structure and features — this is a Taiwanese woman. FACE SHAPE: balanced soft oval, gentle jawline without sharp angles. EYES: natural double eyelids, eye width slightly wider than average, relaxed friendly gaze, no exaggerated features. INDIVIDUALITY: one subtly asymmetric feature allowed (e.g. one eyelid slightly higher, natural uneven lip corners). Approachable East Asian beauty, feel like a real person not a filtered photo.",
        taiwan_natural: "FACE SHAPE: soft oval with gentle taper toward chin, natural cheek volume without excessive baby fat, jaw is smooth and lightly defined giving photogenic lift. NOT round or flat — the face has upward structural energy. EYES: natural double eyelids with clearly visible crease, eyes appear bright and larger than average due to clear defined lid line and luminous iris, eye tails neutral to very slightly upturned giving alert camera-aware energy, mild aegyo-sal under-eye fat pad adding warmth. INDIVIDUALITY: slightly asymmetric eye openings, lips have natural soft color with gentle cupid's bow definition, subtle visible pores on nose bridge. SKIN: luminous translucent quality, inner-glow effect on cheekbones, NOT matte or dull. OVERALL: naturally photogenic Taiwanese beauty — the kind of face that photographs better than average because of well-proportioned features and expressive eyes, NOT because of surgery or heavy makeup. Think: real Taiwanese girl-next-door who happens to be genuinely pretty.",
        taiwan_sweet: "FACE SHAPE: round face with prominent baby-fat cheeks, short chin, heart-shaped upper face. EYES: crescent-shaped double eyelids that curve into eye-smile naturally, large bright irises, strong aegyo-sal under-eye pouch. INDIVIDUALITY: one side of mouth corners slightly higher when relaxed giving natural gentle smile, small visible nose tip rounding, skin has natural slight unevenness NOT airbrushed. Youthful sweet energy with real-girl imperfections.",
        korean_iu: "FACE SHAPE: soft inverted triangle, V-line jaw that is soft not sharp, high-set cheekbones but not prominent, forehead slightly wide. EYES: refined almond double eyelids, strong aegyo-sal under-eye fat pad (signature IU feature), inner corner slightly pointed, gaze has soft deer-eyed quality. INDIVIDUALITY: subtle natural asymmetry in eye tail angles, lips naturally slightly pouty at center with defined cupid's bow, philtrum slightly long giving mature-sweet balance. NOT aggressively cute, gentle refined sweetness.",
        japanese_pure: "FACE SHAPE: slim narrow oval, delicate bone structure, slightly angular but soft jaw, understated features that don't shout. EYES: single or natural inner-double eyelids (NOT full crescent double), almond shape, gaze is calm and quietly expressive, lashes natural not dramatic. INDIVIDUALITY: nose bridge is low-to-medium (NOT high European), slight natural asymmetry in upper lip shape, skin has porcelain quality but with subtle natural texture NOT plastic. Quiet understated beauty that grows on you, NOT immediately striking.",
        mature_elegant: "FACE SHAPE: defined oval with visible but not sharp cheekbone structure, jaw is clean and tapered, forehead balanced. EYES: mature double eyelids with more visible lid space, gaze is direct and composed, slight natural hood to upper lid giving depth. INDIVIDUALITY: faint natural eye corners (NOT crow's feet, but lived-in depth), defined philtrum, lips have natural pigment variation (slightly darker at corners), skin shows very subtle texture of a real adult woman NOT teenager-smooth. Confidence without trying.",
        mixed_aesthetic: "FACE SHAPE: three-dimensional structure, higher and more defined cheekbones than typical East Asian, slightly stronger jaw but still feminine, face has more sculptural quality. EYES: deep-set double eyelids, larger iris diameter than typical Asian, slight natural shadow in upper orbital area giving depth, eye color may be naturally lighter brown. INDIVIDUALITY: nose bridge visibly higher with defined bridge line (NOT European sharp, but clearly elevated), fuller lips with natural color variation, skin has warm honey-toned unevenness (NOT matte uniform). East Asian proportions but with three-dimensional dimensionality.",
        sharp_western: "FACE SHAPE: angular defined structure, high prominent cheekbones, jawline clean and defined, face has architectural quality. EYES: deep-set with natural brow bone shadow, almond or slightly round shape, bold natural lashes. INDIVIDUALITY: nose bridge high and straight with defined tip, lips full with clear lip line, skin has natural slight color variation NOT uniform filter. Striking Western beauty that reads as real photography.",
        nordic_minimal: "FACE SHAPE: clean angular bone structure, long narrow face, high set sharp cheekbones, minimal soft tissue. EYES: pale-colored irises (grey, light blue, or light hazel), deep-set with defined orbital structure, gaze is cool and direct. INDIVIDUALITY: very light natural brows, pale lips with subtle natural color, skin extremely fair with faint natural pink undertone at cheeks and nose. Minimal beauty — the face needs nothing added to it."
    },
    male: {
        standard: "ETHNICITY: East Asian (Taiwanese) facial structure and features — this is a Taiwanese man. FACE SHAPE: balanced rectangular-to-oval, clean masculine jawline without being too sharp, proportional features. EYES: natural single or double eyelids, natural East Asian eye shape, direct friendly gaze, no exaggerated features. INDIVIDUALITY: one subtly asymmetric feature (e.g. slightly uneven jaw angle), natural skin texture visible. Real adult masculine facial texture, NOT a filtered idol.",
        taiwan_boy_next_door: "FACE SHAPE: slightly rounded square face, defined but not aggressive jaw, cheeks have slight natural fullness. EYES: gentle double or natural single eyelids, warm soft gaze, eye tail neutral or very slightly downturned. INDIVIDUALITY: slight natural smile lines starting at mouth corners, visible skin pores on nose and T-zone, eyebrows slightly irregular NOT perfectly groomed. Sunny natural Taiwanese male charm, NOT polished idol.",
        korean_idol_male: "FACE SHAPE: V-line jaw that is sharp but not aggressive, high and slightly prominent cheekbones, smooth skin, face reads as aesthetically refined. EYES: defined crease double eyelids, dark iris, gaze is calm and slightly intense, natural lash density. INDIVIDUALITY: cupid's bow lips with natural slight pout, philtrum well-defined, skin is smooth but NOT plastic — subtle texture under eyes and at nose. Polished but real, NOT CGI.",
        japanese_fresh_male: "FACE SHAPE: slim narrow oval, delicate but masculine bone structure, jaw is clean and slightly tapered. EYES: natural single or soft-double eyelids, calm expressive gaze, eyebrows natural and slightly sparse. INDIVIDUALITY: nose is refined with slightly low bridge (Japanese typical), lips thin to medium with natural pale color, skin has clean matte quality with slight natural texture. Understated masculine freshness.",
        mature_taiwan_male: "FACE SHAPE: defined strong jaw with slight squareness, cheekbones defined, face reads experienced not soft. EYES: deeper set with visible slight upper lid heaviness, gaze is direct and composed, slight natural squint from confidence. INDIVIDUALITY: very faint beginning of laugh lines at eye corners (NOT wrinkles, just depth), defined philtrum, skin shows real adult male texture (NOT teenager-smooth), optional very faint stubble shadow. Real mature masculine energy.",
        mixed_aesthetic: "FACE SHAPE: three-dimensional bone structure, defined and slightly prominent cheekbones, jaw is strong and angular but still proportional. EYES: deep-set with natural orbital shadow, larger iris with lighter brown tone possible, direct intense gaze. INDIVIDUALITY: nose bridge clearly elevated (NOT European extreme, but dimensional), lips fuller than typical East Asian male, skin warm honey-tone with natural variation. Striking dimensional face.",
        sharp_western: "FACE SHAPE: strong angular masculine structure, prominent cheekbones and jaw, face has chiseled architectural quality. EYES: deep-set with defined brow bone, direct powerful gaze, strong natural brows. INDIVIDUALITY: sharp defined nose bridge and tip, lips medium with clear natural line, skin has natural male texture with visible pores. Strong Western masculine face that reads as real.",
        nordic_minimal: "FACE SHAPE: long angular clean structure, prominent bone definition, minimal soft tissue. EYES: light colored irises, deep-set, cool direct gaze. INDIVIDUALITY: very light or ash-brown brows, pale defined lips, fair skin with faint natural redness at cheeks. Clean cold Nordic energy."
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
    old_street_vibe: "Traditional Taiwan old street. Red brick walls, retro iron window lattices, weathered textures, hanging lanterns, nostalgic atmosphere, warm amber lighting.",
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

    // 2026-07-20 台灣臉第二輪加強：人種寫進第一句（位置最前＝權重最高）。
    // 第一輪只在 BIOMETRIC IDENTITY 段（prompt 約 2/3 深處）錨定，實測仍輸給
    // 開頭 COLOR SPECTRAL 的 fair-ivory/棕髮等西方臉引信。有參考圖時人種由參考圖主導。
    let prompt = hasFaceRef
        ? `Generate a photorealistic ${params.gender} fashion model based on the following specific mandates.\n\n`
        : `Generate a photorealistic Taiwanese (East Asian) ${params.gender} fashion model based on the following specific mandates. The model's facial structure MUST be East Asian (Taiwanese) — this requirement overrides all styling, hair color, and skin tone directives below.\n\n`;

    // --- 🚨 [PHASE 1: THE IDENTITY ANCHOR - BIOMETRIC LOCK] 🚨 ---
    if (hasFaceRef) {
        prompt += `[🚨 ULTIMATE IDENTITY MANDATE: BIOMETRIC_MESH_LOCK_LEVEL_10 🚨]\n`;
        prompt += `- STATUS: ABSOLUTE SURGICAL PRECISION.\n`;
        prompt += `- THE ONLY VISUAL TRUTH: The provided face reference images are the EXCLUSIVE source for facial identity. \n`;
        prompt += `- FEATURE RECOVERY: 1:1 mapping of eye tilt, nasal bridge height, lip thickness, and ear position. \n`;
        prompt += `- RENDERING ENGINE INSTRUCTION: Prioritize biometric data in the reference photos as the master layer. Background and clothing must conform to face geometry, never the other way around. \n`;
        prompt += `- ANTI-DRIFT PROTOCOL: Reject all generic AI aesthetics. If the result looks like a "typical AI model," it is a failure. Preserve skin texture, slight facial asymmetry, and unique heritage markers from source. \n\n`;
    }

    // --- [SPECTRAL FIDELITY: COLOR CHANNELS] ---
    prompt += `[COLOR SPECTRAL FIDELITY: PRIORITY ALPHA]\n`;
    prompt += `- SKIN SPECTRUM: Force color output to exact "${SKIN_TONE_DESC_MAP[params.skinTone] ?? params.skinTone}" tone. This is a Spectral Instruction: do NOT allow environment lighting, "Aesthetic Style", or color grading to wash out or shift this skin tone. \n`;
    prompt += `- HAIR SPECTRUM: Force hair color to exact "${params.hairColor}" color. Identity depends on this chromatic consistency. \n\n`;
    if (params.persona) {
        const personaPrefix = hasFaceRef ? "Subject Behavior" : "IP Persona";
        // T8: preset 中文值在插值處走確定性映射（coreVibe/toneOfVoice/primaryCity）；
        // profession/hairColor 等自由輸入已在 service 層 ensureEnglishPrompt 前置翻譯。
        const coreVibeEn = CORE_VIBE_EN_MAP[params.persona.coreVibe] ?? params.persona.coreVibe;
        const toneEn = params.persona.toneOfVoice
            ? (TONE_OF_VOICE_EN_MAP[params.persona.toneOfVoice] ?? params.persona.toneOfVoice)
            : 'Natural';
        const cityZh = params.lifeCircuit?.primaryCity;
        const cityEn = cityZh ? (TAIWAN_COUNTY_EN_MAP[cityZh] ?? cityZh) : '';
        prompt += `[${personaPrefix}: ${coreVibeEn}]\n`;
        prompt += `- Behavioral Personality: ${params.persona.mbti || 'Unknown'} - ${params.persona.profession || ''}. \n`;
        prompt += `- Expression Archetype: ${toneEn}. \n`;
        prompt += `- Background Setting: ${cityEn ? `${cityEn}, Taiwan` : 'Taiwan'}. \n`;

        // Micro-Expression Logic based on Vibe
        // T8 bug fix：原比對字串（'高冷厭世'/'鄰家親切'）與 CORE_VIBE_OPTIONS 實際值
        // 不符，兩分支從未生效；改比對實際 preset 值（Hank 2026-07-11 拍板順手修）。
        // 注意此處比對「原始中文 preset 值」（service 層不改寫 coreVibe，映射僅在插值處）。
        prompt += `[MICRO-EXPRESSION ENGINE]\n`;
        // 2026-07-11 美型版（Hank 拍板）：拿掉法令紋/魚尾紋/額頭張力等 authenticity
        // 措辭——它們會把臉往「普通/顯老」拉，與 premium IP 審美衝突。
        if (params.persona.coreVibe === '高冷超模') {
            prompt += `- Expression: Subtle "sultry/bored" supermodel look. Slightly narrowed elegant eyes, relaxed lips, poised chin. Effortless aloof confidence — flawless editorial beauty, absolutely no frown lines or forehead tension. \n`;
        } else if (params.persona.coreVibe === '清純鄰家') {
            prompt += `- Expression: Soft genuine smile with a natural gentle eye-smile (crescent eyes). Bright clear luminous eyes, fresh dewy youthful glow, sweet refined charm. Photogenic girl/boy-next-door warmth — youthful and polished, absolutely no smile wrinkles, nasolabial folds, or crow's feet. \n`;
        } else {
            prompt += `- Expression: Relaxed composed features. Professional model gaze with soft camera-aware confidence. \n`;
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

    // --- HAND ANATOMY MANDATE (③ POSITIVE HAND GUIDANCE) ---
    prompt += `[HAND ANATOMY MANDATE]\n`;
    prompt += `- Each hand must have exactly five fingers, clearly separated and individually articulated. \n`;
    prompt += `- No fused, missing, extra, or malformed fingers. Each knuckle and joint must read as anatomically correct. \n`;
    prompt += `- Avoid unnatural hyperextension or overbent finger joints; joints must bend within natural human range. \n`;
    prompt += `- Hands should rest in a relaxed, natural pose consistent with the body's posture and the garment being worn. \n\n`;

    prompt += `[BIOLOGICAL TIME-AXIS: AGE ${params.age || 25}]\n`;
    prompt += `- PHYSIOLOGICAL SYNTHESIS: Adjust the person's appearance to exactly ${params.age || 25} years old.\n`;
    const age = params.age || 25;
    if (age <= 25) {
        prompt += `- YOUTHFUL SCAN: High skin elasticity, soft facial fat distribution, fresh dewy complexion, smooth youthful features while preserving biometric identity.\n`;
    } else if (age <= 35) {
        prompt += `- PRIME SCAN: Mature yet fresh adult features, firm well-maintained skin with healthy natural texture, confident refined expression, no aging markers.\n`;
    } else if (age <= 45) {
        prompt += `- REFINED MATURITY SCAN: Sophisticated adult elegance, subtle expression character around the eyes, well-maintained firm skin, graceful mature beauty that remains attractive and well-kept (NOT tired, NOT plain).\n`;
    } else {
        prompt += `- GRACEFUL MATURITY SCAN: Elegant mature presence, natural age-appropriate skin character with subtle fine lines and gentle nasolabial definition, refined bone structure, dignified graceful aging while remaining attractive, healthy and well-kept.\n`;
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
        
        prompt += `[FIGURE TYPE & GARMENT FIT — FEMALE]\n`;
        // Mapping Curvature (0-100) -> Figure Type Contour
        if (pc <= 30) prompt += `- Contour: Lean editorial runway figure type — long slender lines, straight silhouette, minimal hip curve; garments hang with a clean straight drape. \n`;
        else if (pc <= 55) prompt += `- Contour: Natural feminine figure type with a defined waistline — balanced proportions, soft everyday silhouette; garments follow a gently tailored fit. \n`;
        else if (pc <= 75) prompt += `- Contour: Hourglass figure type — clearly defined waist and balanced shoulder-to-hip line; garments tailored to follow the waist-to-hip line and drape cleanly over the silhouette. \n`;
        else prompt += `- Contour: Full hourglass figure type — pronounced waist definition with a curvier shoulder-to-hip line; garments tailored for a fuller-figured fit that follows the body's curve. \n`;

        // Mapping Bust Tension (0-100) -> Upper-garment Fit
        if (bt > 80) {
            prompt += `- Upper-garment Fit: Tailored for a fuller-bust figure type — upper garments cut with a fuller fit through the chest, fabric drapes with a clean structured line. \n`;
        } else if (bt > 55) {
            prompt += `- Upper-garment Fit: Tailored for a full-bust figure type — upper garments follow a rounded fuller fit through the chest with natural drape. \n`;
        } else if (bt > 30) {
            prompt += `- Upper-garment Fit: Standard feminine fit through the chest with natural garment drape. \n`;
        } else {
            prompt += `- Upper-garment Fit: Lean editorial fit — minimal chest projection, straight garment line, high-fashion silhouette. \n`;
        }
    } else {
        const md = params.muscularDensity || 50;
        const vt = params.vTaperScale || 50;

        prompt += `[FIGURE TYPE & GARMENT FIT — MALE]\n`;
        // Mapping Muscular Density (0-100)
        if (md <= 30) prompt += `- Density: Slim lean figure type, subtle muscle tone; garments follow a slim tailored fit. \n`;
        else if (md <= 70) prompt += `- Density: Athletic figure type, defined build; garments follow a fitted athletic cut. \n`;
        else prompt += `- Density: Muscular athletic figure type, broad structured shoulders and defined build; garments tailored for a broad muscular fit. \n`;

        // Mapping Shoulder Frame (0-100) -> V-Taper Figure/Fit
        if (vt > 80) {
            prompt += `- Frame Architecture: Pronounced V-taper figure type with an ultra-broad shoulder-to-waist line; garments tailored with a strong shoulder line, structured across the upper back to follow the wide frame. \n`;
        } else {
            prompt += `- Frame Architecture: Natural V-taper figure type with professional athletic proportions; garments follow a balanced shoulder-to-waist tailored line. \n`;
        }
    }

    if (params.isExpertMode) {
        prompt += `[🚨 MANDATORY BIOLOGICAL METRICS (PHYSICAL TRUTH) 🚨]\n`;
        prompt += `- BIOMETRIC ENFORCEMENT: The model's physique MUST strictly adhere to these precise metrics. No approximation allowed. \n`;
        prompt += `- HEIGHT: Exactly ${params.height}cm (This affects limb length and vertical proportions). \n`;
        prompt += `- PROPORTION RATIO: Head-to-body ratio must be strictly ${params.headBodyRatio || 8.0} heads. \n`;
        prompt += `- SILHOUETTE: ${params.proportionMode} physique mode. The body volume and skeletal structure must be a 100% match for these specifications.\n\n`;
        
        prompt += `[EXPERT SURFACE REALISM]\n`;
        if (params.skinMicroTexture) prompt += `- SKIN: Enable hyper-realistic skin micro-texture, visible pores, and subsurface scattering. \n`;
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
        prompt += `[BIOMETRIC IDENTITY — HIGH PRIORITY]\n`;
        prompt += `${archetypeDesc}\n\n`;
        prompt += `[INDIVIDUALITY MANDATE]\n`;
        prompt += `- REQUIRED: This face MUST have at least one subtle natural asymmetry (e.g. one eyelid slightly higher, one lip corner slightly raised, jaw angle slightly uneven). Real human faces are NOT perfectly symmetrical.\n`;
        prompt += `- REQUIRED: Skin texture must be visible and natural — fine pores on nose bridge and T-zone, very slight natural unevenness, NOT airbrushed or plastic-smooth.\n`;
        prompt += `- FORBIDDEN: Do NOT generate a generic averaged AI-looking face and do NOT drift toward Western facial structure. The face MUST read as a distinctive, real East Asian (Taiwanese) individual — not a statistical average. Do NOT apply beauty filters or face-smoothing algorithms. Do NOT make the face look like a standard trained model output.\n`;
        prompt += `- FORBIDDEN: Do NOT generate obviously distorted, strange, or uncanny facial features. All features must read as naturally attractive.\n`;
        prompt += `[ATTRACTIVENESS BOUNDARY]\n`;
        prompt += `- This person is naturally attractive in the way a real person can be — NOT surgically enhanced, NOT filter-processed, NOT AI-idealized. Think: the kind of face that stands out on a street in Taipei or Seoul because they are genuinely good-looking, not because they look like a digital render.\n`;
        prompt += `- Maintain beautiful proportions and pleasant features WITHIN the individuality constraints above.\n`;
        prompt += `- BEAUTY FLOOR (APPLIES TO BOTH GENDERS AND ALL ARCHETYPES): This model is the face of a commercial fashion & social-media IP account. The face must be clearly above-average attractive by contemporary Taiwanese beauty standards — harmonious refined features, clean facial lines, bright expressive eyes, youthful healthy complexion. Realism details (pores, subtle asymmetry) must stay subtle and must NEVER make the face look plain, tired, or aged.\n`;
        const netRedLevel = params.netRedLevel || 2;
        if (netRedLevel === 1) {
            prompt += `[PHOTOGENIC LEVEL: NATURAL]\n`;
            prompt += `- Generate a real, everyday attractive person. Skin texture is visible and unretouched. Eyes are natural and unpretentious. Face does NOT need to be photogenic — it just needs to be genuine and believable.\n`;
            prompt += `- Think: a naturally good-looking person you'd pass on the street in Taipei, NOT someone who looks like they're about to post on Instagram.\n`;
        } else if (netRedLevel === 2) {
            prompt += `[PHOTOGENIC LEVEL: NATURAL INFLUENCER — HIGH PRIORITY]\n`;
            prompt += `- EYES: MUST appear bright and alive. Clear natural catchlight in iris, eyes look alert and camera-aware, NOT sleepy, flat, or dull.\n`;
            prompt += `- SKIN: luminous translucent quality with inner-glow effect on cheekbones and nose bridge, subtle dewy sheen, NOT matte flat or dull.\n`;
            prompt += `- FACE LIFT ENERGY: slight upward lift quality in overall facial structure, chin slightly tapered, face reads as photogenic NOT heavy or drooping.\n`;
            prompt += `- This is a naturally photogenic person — a real Taiwanese beauty influencer who photographs better than average because of genuine good proportions and bright eyes, NOT because of filters or surgery.\n`;
        } else if (netRedLevel === 3) {
            prompt += `[PHOTOGENIC LEVEL: IDOL REFINEMENT — HIGH PRIORITY]\n`;
            prompt += `- EYES: large, luminous, with strong natural catchlight. Iris appears deep and clear. Lashes are naturally full. Gaze is magnetic and camera-commanding.\n`;
            prompt += `- SKIN: glass-skin quality — extremely translucent, poreless-looking surface with intense inner luminosity. Subtle highlight on nose bridge and cupid's bow.\n`;
            prompt += `- FACIAL STRUCTURE: all features are idealized within the archetype — stronger definition, more refined proportions, highest version of the chosen archetype.\n`;
            prompt += `- OVERALL: this face is at the upper boundary of natural human attractiveness for this archetype. Think: top-tier K-pop idol or Taiwanese celebrity — NOT obviously AI-generated, but clearly exceptionally good-looking.\n`;
        }
    } else {
        prompt += `Face: Locked to Reference Images (BIOMETRIC_LOCK: ACTIVE).\n`;
    }
    prompt += `Skin: Confirming "${SKIN_TONE_DESC_MAP[params.skinTone] ?? params.skinTone}" tone with ${params.skinFinish} finish.\n`;
    prompt += `Hair: Confirming "${params.hairColor}" color. Style: ${params.hairStyle}.\n`;
    prompt += `Body: ${params.proportionMode} proportions. Height: ${params.height}cm. Head-to-body ratio: ${params.headBodyRatio || 8.0} heads.\n\n`;

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
        
        if (params.gender === 'female') {
            const pc = params.physiqueCurvature || 50;
            const bt = params.bustTension || 50;
            if (pc > 55 || bt > 55) {
                prompt += `[PHYSIQUE MANDATE FOR ALL VIEWS]\n`;
                prompt += `- CRITICAL: All 4 body views MUST show consistent body proportions. The silhouette MUST be visible and consistent across front, side, and back views.\n`;
                if (pc > 75) prompt += `- Body has dramatic hourglass figure — significantly cinched waist, full rounded hips, strong S-curve visible in side profile.\n`;
                else if (pc > 55) prompt += `- Body has clear hourglass silhouette — visibly cinched waist with full hip line, S-curve clearly visible in side profile.\n`;
                if (bt > 55) prompt += `- Bust has natural full rounded projection visible in side profile and front view. Clothing fits snugly across chest.\n`;
            }
        }
        prompt += `[ROW 1: FULL BODY TURNAROUND (Top Half of Frame)]:\n`;
        prompt += `- 4 full-length figures aligned horizontally: FRONT VIEW, LEFT PROFILE, RIGHT PROFILE, BACK VIEW.\n`;
        prompt += `- All figures must be at the same scale and perfectly aligned at the head and feet.\n\n`;
        
        prompt += `[ROW 2: BIOMETRIC FACE CLOSE-UPS (Bottom Half of Frame)]:\n`;
        prompt += `- 4 detailed face close-ups aligned horizontally: FRONTAL FACE, LEFT FACE PROFILE, RIGHT FACE PROFILE, BACK OF HEAD (Hair texture).\n`;
        prompt += `- Focus on high-fidelity biometric restoration of facial features.\n\n`;
        
        prompt += `- CONSISTENCY: The identity, skin texture, hair, and clothing MUST remain 100% consistent across all 8 views. Zero drift in character identity.\n`;
        prompt += `- FIDELITY: Sharp high-detail fashion photography. No CG, no 3D-render look. \n\n`;
    }

    prompt += `[TECHNICAL SPECS]\n`;
    prompt += `Shot: ${params.isMultiAngle ? 'Technical Photographic Sheet' : 'FULL BODY VERTICAL SHOT'}. Angle: ${params.angle || 'eye-level'}.\n`;
    prompt += `Camera: 50mm or 85mm prime lens for zero distortion.\n`;
    prompt += `Lighting: ${params.isMultiAngle ? 'Neutral high-key studio lighting, even illumination' : params.lightingDepthControl}.\n`;
    prompt += `Quality: ${stylistKeywords}, photorealistic, RAW quality, 8k resolution.\n\n`;

    prompt += `[NEGATIVE PROMPT]\n`;
    // 2026-07-20：無參考圖時加西方臉負面詞（有參考圖時人種由參考圖決定，不加以免干擾）。
    const ethnicityNegatives = hasFaceRef ? "" : ", (Caucasian face:1.5), (Western facial features:1.4), (European bone structure:1.4)";
    const baseNegatives = "(3D render:1.5), (illustration:1.5), (painting:1.5), (cartoon:1.5), (CG), (anime), (unreal engine), (mutated), (deformed), (low quality), (blurry), (extra limbs), (fused bodies), (mutated hands), (deformed face), (merged characters), (different outfits), (asymmetric clothing)" + ethnicityNegatives;
    if (!params.isMultiAngle) {
        prompt += `${baseNegatives}, (cropped feet:2.0), (cut off legs:2.0), (missing shoes:2.0), (out of frame:1.8), (half body), (close up), (distorted limbs), (extra toes), (blurry feet).`;
    } else {
        prompt += `${baseNegatives}, (cluttered background:1.8), (messy environment:1.8), (outdoors:1.8), (bokeh:1.5), (depth of field:1.5)`;
    }

    return prompt;
};
