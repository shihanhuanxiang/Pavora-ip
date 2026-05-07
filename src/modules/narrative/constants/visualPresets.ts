
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
        description: "貼身上衣、黑絲襪、甜美活潑自拍，生活感場景，高互動率 IG 風格",
        visualConstants: {
            signaturePoses: [
                "close-up selfie, face fills frame, soft smile, phone-held-out angle",
                "low angle shot emphasizing legs and outfit, subject looking down at camera",
                "seated candid, crossed legs visible, black stockings prominent",
                "mirror selfie full body, outfit showcase, playful expression",
                "close-up on face, pouting lips, eyes slightly downcast, ultra shallow depth of field"
            ],
            stylingFilters: [
                "bright warm tones",
                "korean IG aesthetic",
                "soft skin glow",
                "natural dewy finish"
            ],
            expressionStyle: "playful smile or soft pout, bright expressive eyes, youthful energy",
            colorTone: "warm ivory and peachy tones, soft golden hour light",
            poseEnergy: "spontaneous and playful, caught in natural moment",
            catchlightPreference: "natural window catchlight, bright eye reflections"
        },
        preferences: {
            preferred_archetypes: ["feminine_sweet", "sporty_active"],
            aesthetic_tier_min: 1,
            aesthetic_tier_max: 3
        },
        visual_aesthetic: "Korean IG fashion photography, bright and warm, youthful and trendy, natural skin texture, candid street or cafe setting"
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
            preferred_archetypes: ["feminine_mature", "vintage_retro", "minimalist"],
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
            preferred_archetypes: ["feminine_mature", "minimalist"],
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
            preferred_archetypes: ["clean_masculine", "dandy_refined"],
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
            preferred_archetypes: ["clean_masculine", "vintage_retro"],
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
            preferred_archetypes: ["street_edgy", "sporty_active"],
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
