
export interface VisualPreset {
    preset_id: string;
    label_zh: string;
    label_en: string;
    gender: 'F' | 'M' | 'U';
    description: string;

    // 填入 IPVisualConstants
    visualConstants: {
        signaturePoses: string[];
        stylingFilters: string[];
        expressionStyle: string;
        colorTone: string;
        poseEnergy: string;
        catchlightPreference: string;
    };

    // 填入 preferences
    preferences: {
        preferred_archetypes: string[];
        aesthetic_tier_min: number;
        aesthetic_tier_max: number;
    };

    // 注入 Layer 9
    visual_aesthetic: string;
}

export const VISUAL_PRESETS: VisualPreset[] = [

    // ==============================
    // 女性 Preset
    // ==============================
    {
        preset_id: "korean_ig_girl",
        label_zh: "日韓系 IG 網紅",
        label_en: "Korean IG Girl",
        gender: "F",
        description: "韓系 IG 抖音世代少女,年輕活潑,過曝高飽和,K-beauty 妝感,iPhone 隨拍生活感",
        visualConstants: {
            signaturePoses: [
                "extreme close-up selfie, face fills 80% of frame, pouty kiss face or wide-eyed surprised expression, 85mm compression, dewy K-beauty skin with peachy blush prominent",
                "half-body candid laugh shot, head tilted back mid-laugh, hair slightly messy, 50mm natural perspective, captured in genuine moment of joy",
                "close-up portrait with cheek-to-palm gesture, playful eye contact, glossy wet lip visible, soft pout, 85mm compression",
                "bathroom or mirror selfie close distance, slightly wet hair or fresh makeup, raw unposed mood, phone reflection visible",
                "waist-up shot biting lower lip softly, looking off-camera shyly, 85mm compression, dewy skin shine prominent",
                "candid eating or drinking moment caught mid-action, food or cup partially in frame, 50mm, mouth full or mid-bite expression",
                "seated on sofa or floor leaning back relaxed, legs visible, casual home setting, slight overhead angle, natural unposed energy",
                "full body MRT or street snap, walking past or about to turn, 35mm natural, motion energy frozen, NOT a posed model stance"
            ],
            stylingFilters: [
                "K-beauty filter aesthetic",
                "Gen Z high-saturation peachy tones",
                "iPhone candid snapshot feel",
                "TikTok generation vibe",
                "harsh flash with bright highlights"
            ],
            expressionStyle: "23-year-old Gen Z vitality: rotating youthful expressions — pouty kiss face with eyes half-closed, wide-eyed genuinely surprised open mouth, soft real laugh showing teeth with eyes crinkled, cheek squish with both hands, lower lip bite caught mid-thought, aegyo tongue peek — expression changes frame to frame like a photo dump, eyes must appear bright and alive with clear catchlight, ALWAYS in-the-moment authentic energy, NEVER static fashion model gaze, NEVER blank stare or dead eyes, NEVER pursed lips with no expression, NOT mature or composed or editorial",
            colorTone: "high saturation Gen Z peachy palette: prominent blush blooming across cheeks and nose bridge, glossy wet-look lip with visible highlight reflection, dewy skin with light glitter or shimmer under-eye, slight intentional overexposure on highlights creating luminous blowout, skin tone appears warm and luminous not matte, fine skin texture visible — pores, tiny flyaway hairs, natural lip pigment variation — NOT airbrushed, NOT film grain, NOT desaturated, NOT cool tones, the overall image feels one notch too bright and too saturated in the best Gen Z way",
            poseEnergy: "23-year-old college girl energy: body in constant subtle motion — weight shifting, hair tossing, reaching for something, laughing mid-movement — NEVER both feet planted static, body language open and un-self-conscious, gestures small and personal like checking phone, fixing hair, adjusting strap, tugging sleeve, arms rarely hanging neutral at sides, the overall read is someone who forgot the camera was there and got caught being genuinely alive, NEVER runway walk energy, NEVER knowing smoulder, spontaneous always",
            catchlightPreference: "natural catchlight in large eyes, dewy skin reflection, bright eye highlights"
        },
        preferences: {
            preferred_archetypes: ["korean_chic", "feminine_sweet", "sporty_active"],
            aesthetic_tier_min: 1,
            aesthetic_tier_max: 3
        },
        visual_aesthetic: "Korean IG influencer photography for Gen Z, harsh flash and bright peachy tones, youthful vitality, glossy K-beauty makeup with prominent blush, iPhone candid moment, TikTok generation aesthetic, NOT editorial, NOT magazine, NOT mature woman style"
    },

    {
        preset_id: "artistic_girlfriend",
        label_zh: "文藝氣質女友風",
        label_en: "Artistic Girlfriend",
        gender: "F",
        description: "飄逸長裙、書店咖啡廳、溫柔沉靜眼神、底片感構圖",
        visualConstants: {
            signaturePoses: [
                "medium shot 85mm, subject gazing slightly off-frame past camera, three-quarter angle, contemplative faraway expression, soft diffused window light, background blurred but recognizable as indie cafe or bookstore",
                "seated by window with open book or ceramic coffee cup, side profile 85mm compression, soft golden light on cheekbone, hair falling naturally, quietly absorbed in thought, NOT looking at camera",
                "close-up portrait 85mm, natural light falling on one cheek leaving other in gentle shadow, three-quarter profile, eyes downcast or drifting slightly away, lips softly closed, hair wisps catching window glow",
                "wide shot 35mm, subject intentionally small within large environment — floor-to-ceiling bookshelves, narrow old street, or indie cafe interior — negative space dominant, atmospheric and unhurried",
                "shot from behind 85mm, subject facing away toward window or open street, hair movement from gentle breeze, shoulder and hair lines as focal point, back-of-head composition with soft rim light",
                "close-up on hands holding book pages or handmade ceramic cup, 100mm shallow DOF, warm table lamp or window side light, natural unmanicured nails, quiet tactile detail, NOT face-focused",
                "standing in doorway or threshold 50mm, backlit from behind by window creating soft silhouette rim, facing mostly away or in partial profile, analog aura quality, intentional lens softness acceptable",
                "seated on floor against bookcase or low wall, knees pulled up casually, 50mm, soft overhead lamp or filtered afternoon light, absorbed and unhurried, book or phone nearby, NEVER posed or facing camera squarely"
            ],
            stylingFilters: [
                "Kodak Portra 400 analog film aesthetic",
                "warm amber-ivory tonal range",
                "subtle film grain at natural density",
                "soft lens vignette and gentle flare",
                "muted saturation, no digital sharpness"
            ],
            expressionStyle: "soft and inward-looking: gentle eyes with slight downward gaze or drifting off-frame, lips naturally relaxed with no smile or barely perceptible quiet smile, NOT wide-eyed or bright-energetic, NOT laughing or animated, NOT looking directly into camera with confidence — the gaze feels private and caught-unaware, subtle wistfulness or quiet contentment acceptable, NEVER performative expression, NEVER aegyo or cutesy gesture, NEVER editorial stare",
            colorTone: "warm analog film tones: soft amber-orange highlights, ivory and cream midtones, gentle film grain visible, skin appears slightly warm with natural uneven texture, soft lens flare or light leak acceptable, NOT high saturation, NOT peachy K-beauty glow, NOT crisp digital sharpness — Kodak Portra or Fujifilm 400H feel, shadows lift gently never crushing to pure black, slight halation around light sources",
            poseEnergy: "unhurried and turned inward, body language angled slightly away or resting against surface, arms relaxed and natural — often holding small object like book or cup, no dynamic or active motion, stillness preferred over movement, weight resting or supported, head often slightly tilted or gently bowed, NEVER arms akimbo or assertive open stance, NEVER facing camera with challenge or direct confidence, the body language says 'I forgot you were watching'",
            catchlightPreference: "soft diffused window or ambient lamp light with gentle single irregular catchlight, slightly crescent or soft rectangular shape, warm yellow-white tone, NOT bright digital sparkle or multiple points, eyes appear soft and slightly glossy with depth but NOT doll-like brightness"
        },
        preferences: {
            preferred_archetypes: ["vintage_retro", "minimalist", "feminine_mature"],
            aesthetic_tier_min: 2,
            aesthetic_tier_max: 4
        },
        visual_aesthetic: "Kodak Portra analog film photography, warm Taiwanese indie bookstore and cafe culture, quiet literary feminine introspection, Mori Girl meets urban thoughtful woman, natural documentary light, NOT K-beauty, NOT editorial magazine, NOT bright studio, NOT TikTok energy — visual language closer to a handmade zine or carefully shot poetry book, the subject exists in the frame rather than performing for it"
    },

    {
        preset_id: "office_lady_fresh",
        label_zh: "清新OL上班族",
        label_en: "Fresh Office Lady",
        gender: "F",
        description: "剛出社會到30歲、通勤穿搭、幹練中帶點青春感",
        visualConstants: {
            signaturePoses: [
                "medium shot 85mm, three-quarter angle, subject at clean cafe table or open-plan office desk with laptop, looking up from screen with alert approachable smile, crisp natural light, background architecturally clean",
                "full body 35mm, mid-stride walking through Taipei urban environment — business district sidewalk, MRT exit, or modern lobby — business casual outfit in natural motion, confident purposeful stride, NOT posed standing",
                "half body 85mm, subject holding takeaway coffee or checking smartphone at commuter moment, slightly off-camera gaze, MRT platform or modern building entrance background, candid transit energy",
                "seated 85mm, both hands wrapped around coffee cup on cafe table, leaning slightly forward in engaged posture, warm coworking or cafe background, natural conversation energy caught mid-moment",
                "close-up portrait 85mm, subject looking directly into camera with clear confident smile, bright alert eyes, clean soft natural light, professional warmth without stiffness — the look of someone competent and genuinely friendly",
                "standing at modern glass building entrance or MRT turnstile 50mm, bag strap on shoulder, mid-action checking watch or tapping phone, spontaneous transit candid, urban Taipei lifestyle energy",
                "wide establishing shot 35mm, subject as one figure in Taipei urban context — crosswalk, commercial plaza, or office park greenery — slight motion, environment contextualizes the 26-year-old working woman lifestyle",
                "three-quarter 85mm near modern glass window or elevator lobby reflection, slightly candid self-aware moment, polished outfit visible in ambient reflection, quiet urban poetry of the daily commute"
            ],
            stylingFilters: [
                "clean bright urban lifestyle tones",
                "crisp natural daylight or soft office window light",
                "slight cool-neutral color temperature",
                "Taiwanese urban professional aesthetic",
                "sharp fabric texture with warm skin tone balance"
            ],
            expressionStyle: "natural professional expressions: approachable confident smile with visible genuine ease, bright alert eyes that read as capable and warm, occasional candid caught-mid-thought expression looking slightly off-camera, NEVER stiff corporate headshot energy, NEVER wide-eyed exaggerated cuteness or aegyo, NOT performance smile — the expression says 'I'm good at my job and I know it, and I'm also a real person', ALWAYS in-the-moment authenticity over posed professionalism",
            colorTone: "clean bright urban palette: crisp whites and navy blues anchor the clothing tones, skin appears clear and healthy with subtle natural luminosity NOT dewy K-beauty glow, slightly cool-neutral digital photograph feel, building materials and surfaces — glass, polished floors, pale concrete — reflect clean ambient light, fabric detail sharp and precise, NOT warm or analog, NOT oversaturated, NOT grey or heavy",
            poseEnergy: "forward-moving purposeful energy: body language leans slightly toward point of interest, confident upright posture when seated, arms active with bag strap or laptop or coffee, quick efficient movements frozen mid-action, NEVER slouching or relaxed domestic energy, the body communicates 'I have somewhere important to be and I'm ready' — even in still moments there is a sense of readiness and capable lightness",
            catchlightPreference: "bright clear natural daylight or large office window catchlight, crisp clean rectangular or oval reflection in both eyes, eyes appear bright and capable, NOT dramatic single-point nor film-soft diffused — clean and clear like a well-lit modern Taiwanese office building lobby"
        },
        preferences: {
            preferred_archetypes: ["feminine_mature", "minimalist", "feminine_sweet"],
            aesthetic_tier_min: 1,
            aesthetic_tier_max: 3
        },
        visual_aesthetic: "clean urban professional lifestyle photography, Taipei working woman aesthetic circa 26 years old, bright natural light and credible competence, not aspirational luxury but achieved everyday capability — the visual diary of someone who has her Monday morning together, candid documentary meets curated Instagram, NOT fashion editorial, NOT formal corporate portrait, NOT cute girl next door, crisp and genuine and capable"
    },

    // ==============================
    // 男性 Preset
    // ==============================
    {
        preset_id: "handsome_elite",
        label_zh: "高富帥美男",
        label_en: "Handsome Elite",
        gender: "M",
        description: "合身西裝或簡約上衣、健身後汗水感、城市夜景側臉構圖",
        visualConstants: {
            signaturePoses: [
                "side profile close-up, sharp jawline prominent, city lights bokeh background",
                "low angle full body, subject looking ahead confidently, urban night setting",
                "medium shot, three-quarter angle, slight smirk, tailored outfit",
                "shot from behind slightly, subject looking over shoulder, suit or fitted top",
                "close-up on face and neck, strong jaw and cheekbones, dramatic side light"
            ],
            stylingFilters: [
                "dramatic cinematic tones",
                "cool blue-grey city aesthetic",
                "sharp high contrast",
                "luxury lifestyle feel"
            ],
            expressionStyle: "neutral or slight smirk, intense gaze, calm confidence",
            colorTone: "cool city tones, deep blues and greys, dramatic contrast, night city glow",
            poseEnergy: "calm and commanding, effortless confidence, magnetic stillness",
            catchlightPreference: "dramatic single point catchlight, sharp eye reflection"
        },
        preferences: {
            preferred_archetypes: ["masculine_clean", "dandy_refined"],
            aesthetic_tier_min: 3,
            aesthetic_tier_max: 5
        },
        visual_aesthetic: "high-end menswear editorial, cinematic city night photography, sharp and sophisticated, masculine luxury aesthetic"
    },

    {
        preset_id: "gentle_scholar",
        label_zh: "文質彬彬奶油書生",
        label_en: "Gentle Scholar",
        gender: "M",
        description: "寬鬆針織文青格紋、圖書館、戴眼鏡低頭、柔光暖色",
        visualConstants: {
            signaturePoses: [
                "seated reading or writing, head slightly bowed, warm library or cafe light",
                "close-up portrait, glasses on, soft gentle expression, book in hand",
                "three-quarter medium shot, candid moment of thought, window light",
                "shot from slightly above, subject looking down at book or notes",
                "wide shot in library or bookstore, subject browsing shelves alone"
            ],
            stylingFilters: [
                "warm amber bookstore light",
                "soft vintage tones",
                "gentle film grain",
                "cozy intellectual atmosphere"
            ],
            expressionStyle: "soft and thoughtful, gentle eyes behind glasses, quiet intelligence",
            colorTone: "warm amber and cream tones, soft golden lamp light, cozy warmth",
            poseEnergy: "absorbed and unhurried, gentle and introverted, intellectually present",
            catchlightPreference: "warm lamp or window diffused light, gentle soft catchlight"
        },
        preferences: {
            preferred_archetypes: ["masculine_clean", "vintage_retro", "minimalist"],
            aesthetic_tier_min: 1,
            aesthetic_tier_max: 3
        },
        visual_aesthetic: "warm literary photography, soft ambient light, intellectual and gentle masculine aesthetic, Taiwanese bookstore cafe culture"
    },

    {
        preset_id: "street_cool_guy",
        label_zh: "街頭酷男",
        label_en: "Street Cool Guy",
        gender: "M",
        description: "oversized 穿搭、球鞋文化、街頭塗鴉背景、冷酷低調",
        visualConstants: {
            signaturePoses: [
                "full body against urban wall or graffiti, arms crossed, cool neutral expression",
                "low angle full body, fresh sneakers prominent in foreground",
                "candid mid-stride on street, oversized outfit in motion",
                "close-up face and chest, cap low, looking just past camera",
                "seated on steps or ledge, relaxed slouch, streetwear layering visible"
            ],
            stylingFilters: [
                "urban street photography tones",
                "slightly desaturated cool tones",
                "raw unfiltered aesthetic",
                "skate and street culture feel"
            ],
            expressionStyle: "neutral or slightly bored, cool detachment, effortless nonchalance",
            colorTone: "cool desaturated urban tones, concrete grey and muted earth, street light glow",
            poseEnergy: "effortlessly cool, low energy swagger, naturally unposed",
            catchlightPreference: "urban ambient light, minimal catchlight, natural street light"
        },
        preferences: {
            preferred_archetypes: ["street_edgy", "street_techwear", "sporty_active"],
            aesthetic_tier_min: 1,
            aesthetic_tier_max: 3
        },
        visual_aesthetic: "raw urban street photography, skate culture aesthetic, candid documentary style, authentic street fashion, Taipei urban youth culture"
    }
];

export const getPresetById = (id?: string | null): VisualPreset | null => {
    if (!id) return null;
    return VISUAL_PRESETS.find(p => p.preset_id === id) || null;
};

export const getPresetsByGender = (gender: 'F' | 'M'): VisualPreset[] => {
    return VISUAL_PRESETS.filter(p => p.gender === gender || p.gender === 'U');
};
