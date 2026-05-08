
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
            expressionStyle: "varying youthful expressions: pouty kiss face, wide-eyed surprised, soft genuine laugh showing teeth, cheek squish gesture, biting lower lip playfully, NEVER static modeling pose, ALWAYS in-the-moment energy of a 23-year-old",
            colorTone: "high saturation peachy blush prominent on cheeks, glossy wet-look lip with shine, dewy translucent skin with light glitter under-eye, slight overexposure on highlights, K-beauty filter aesthetic, NOT muted, NOT contemplative, NOT editorial",
            poseEnergy: "energetic 23-year-old college-girl vibe, never posed like a model, always caught mid-motion or candid, body language playful and youthful, spontaneous and unposed, NEVER a static fashion shot",
            catchlightPreference: "natural catchlight in large eyes, dewy skin reflection, bright eye highlights"
        },
        preferences: {
            preferred_archetypes: ["korean_chic", "feminine_sweet", "sporty_active"],
            aesthetic_tier_min: 1,
            aesthetic_tier_max: 3
        },
        visual_aesthetic: "Korean IG influencer photography for Gen Z, harsh flash and bright peachy tones, youthful 23-year-old vitality, glossy K-beauty makeup with prominent blush, iPhone candid moment, TikTok generation aesthetic, NOT editorial, NOT magazine, NOT mature woman style"
    },

    {
        preset_id: "artistic_girlfriend",
        label_zh: "文藝氣質女友風",
        label_en: "Artistic Girlfriend",
        gender: "F",
        description: "飄逸長裙、書店咖啡廳、溫柔沉靜眼神、底片感構圖",
        visualConstants: {
            signaturePoses: [
                "medium shot, subject looking slightly off-frame into distance, contemplative mood",
                "seated by window with book or coffee, side profile, soft natural light",
                "shot from behind, subject looking away, hair movement visible",
                "close-up portrait, three-quarter profile, natural light on one cheek",
                "wide shot, subject as small element in large environment, bookstore or cafe"
            ],
            stylingFilters: [
                "film grain vintage",
                "muted warm tones",
                "soft natural bokeh",
                "analog photography feel"
            ],
            expressionStyle: "gentle and contemplative, soft eyes looking away, quiet inner world",
            colorTone: "warm muted tones, soft amber and ivory, gentle film grain",
            poseEnergy: "languid and thoughtful, still and composed",
            catchlightPreference: "soft diffused window light, gentle eye reflection"
        },
        preferences: {
            preferred_archetypes: ["vintage_retro", "minimalist", "feminine_mature"],
            aesthetic_tier_min: 2,
            aesthetic_tier_max: 4
        },
        visual_aesthetic: "film photography aesthetic, warm analog tones, artistic and literary mood, quiet feminine energy, Taiwanese indie cafe atmosphere"
    },

    {
        preset_id: "office_lady_fresh",
        label_zh: "清新OL上班族",
        label_en: "Fresh Office Lady",
        gender: "F",
        description: "剛出社會到30歲、通勤穿搭、幹練中帶點青春感",
        visualConstants: {
            signaturePoses: [
                "medium shot, three-quarter angle, slight confident smile, office or cafe background",
                "full body walking, mid-stride, business casual outfit, urban street",
                "seated at desk or cafe table, laptop open, looking up from work",
                "standing at building entrance or transit station, bag on shoulder",
                "half body shot, looking at phone or coffee cup, candid commuter moment"
            ],
            stylingFilters: [
                "clean professional tones",
                "bright natural office light",
                "crisp and polished look",
                "urban lifestyle aesthetic"
            ],
            expressionStyle: "confident but approachable smile, competent and fresh, youthful professionalism",
            colorTone: "clean neutral tones, crisp whites and navy, soft natural light",
            poseEnergy: "purposeful and efficient, confident stride, approachable energy",
            catchlightPreference: "bright office or outdoor natural light catchlight"
        },
        preferences: {
            preferred_archetypes: ["feminine_mature", "minimalist", "feminine_sweet"],
            aesthetic_tier_min: 1,
            aesthetic_tier_max: 3
        },
        visual_aesthetic: "clean urban professional photography, bright and crisp, Taiwanese office lady style, fresh and competent, lifestyle fashion"
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
