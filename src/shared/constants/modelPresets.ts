
// --- Model Creation Presets (VTO Base Optimized) ---

export const GENDER_PRESETS = [
    { value: 'female', label: '女性 (Female)' },
    { value: 'male', label: '男性 (Male)' }
];

// 針對虛擬試衣優化的極簡穿搭 (Minimalist / Tight-fitting)
// 升級為「成套預設」與「細分組件」
export const APPAREL_CATEGORIES = [
    { id: 'full_set', label: '成套預設 (Full Sets)' },
    { id: 'top', label: '上身組件 (Tops)' },
    { id: 'bottom', label: '下身組件 (Bottoms)' },
    { id: 'footwear', label: '鞋履組件 (Footwear)' }
];

export const APPAREL_ITEMS = [
    // --- FULL SETS FEMALE (成套預設：IG 日常年輕風格) ---
    {
        id: 'f_full_tanktop_shorts',
        label: '無袖背心 + 熱褲 (Tank + Hot Shorts)',
        prompt: 'fitted ribbed sleeveless tank top with scoop neck, paired with high-waist denim hot pants, casual youthful street style, midriff slightly visible',
        category: 'full_set',
        gender: 'female'
    },
    {
        id: 'f_full_camisole_shorts',
        label: '細肩帶背心 + 短褲 (Cami + Shorts)',
        prompt: 'delicate spaghetti strap camisole top in pastel tone, paired with loose casual shorts, relaxed K-style summer outfit, soft feminine energy',
        category: 'full_set',
        gender: 'female'
    },
    {
        id: 'f_full_croptee_miniskirt',
        label: '短版T + 迷你裙 (Crop Tee + Mini Skirt)',
        prompt: 'cropped fitted short sleeve t-shirt, paired with high-waist pleated mini skirt, classic Korean IG girl aesthetic, clean and youthful',
        category: 'full_set',
        gender: 'female'
    },
    {
        id: 'f_full_offsholder_shorts',
        label: '一字領上翼 + 熱褲 (Off-shoulder + Shorts)',
        prompt: 'off-shoulder fitted top showing collarbone, paired with high-waist shorts, summer date outfit, soft warm tones',
        category: 'full_set',
        gender: 'female'
    },
    {
        id: 'f_full_knit_vest_shorts',
        label: '針織背心 + 休閒短褲 (Knit Vest + Casual Shorts)',
        prompt: 'ribbed knit sleeveless vest top, paired with relaxed casual shorts, Korean college girl style, layered with optional small bag',
        category: 'full_set',
        gender: 'female'
    },
    {
        id: 'f_full_sporty_set',
        label: '運動背心 + 緊身短褲 (Sporty Set)',
        prompt: 'athletic sleeveless sports top, paired with high-waist tight biker shorts, activewear K-beauty style, clean sporty energy',
        category: 'full_set',
        gender: 'female'
    },
    
    // --- TOPS (上身：專業細分) ---
    { id: 'f_top_racerback', label: '高強度工字背心 (Pro Racerback)', prompt: 'high-impact technical racerback tank', category: 'top', gender: 'female' },
    { id: 'f_top_bandeau', label: '細膩平口束胸 (Ribbed Bandeau)', prompt: 'delicate ribbed bandeau top, sleek fit', category: 'top', gender: 'female' },
    { id: 'f_top_halter', label: '掛脖挖肩背心 (Halter Neck Tank)', prompt: 'halter neck bodysuit top, showing defined shoulders', category: 'top', gender: 'female' },
    { id: 'f_top_crop_tee', label: '超短版修身T (Micro Crop Tee)', prompt: 'ultra-cropped fitted short sleeve t-shirt', category: 'top', gender: 'female' },
    
    // --- BOTTOMS (下身：身形強化) ---
    { id: 'f_bottom_leggings', label: '修身高腰壓力褲 (High-waist Compression)', prompt: 'sculpting high-waisted compression leggings', category: 'bottom', gender: 'female' },
    { id: 'f_bottom_split_yoga', label: '側開衩瑜珈褲 (Split-Hem Yoga)', prompt: 'fitted yoga pants with side slits at ankles', category: 'bottom', gender: 'female' },
    { id: 'f_bottom_hot_pants', label: '無縫提臀短褲 (Seamless Lift Shorts)', prompt: 'seamless booty-lifting athletic shorts', category: 'bottom', gender: 'female' },
    { id: 'f_bottom_denim_shorts', label: '毛邊丹寧極短褲 (Raw-edge Denim)', prompt: 'ultra-short raw-edge denim shorts', category: 'bottom', gender: 'female' },
    
    // --- FOOTWEAR (鞋履) ---
    { id: 'foot_barefoot', label: '極致赤足 (Studio Barefoot)', prompt: 'clean realistic barefoot, high detail', category: 'footwear', gender: 'both' },
    { id: 'foot_transparent_heels', label: '透明細帶高跟 (Clear Strappy Heels)', prompt: 'minimalist transparent strap high heels, invisible look', category: 'footwear', gender: 'female' },
    { id: 'foot_white_sneakers', label: '全白極簡板鞋 (Minimalist Trainers)', prompt: 'all-white minimal design sneakers', category: 'footwear', gender: 'both' },

    // --- FULL SETS MALE (成套預設：男性日常街頭風格) ---
    { 
        id: 'm_full_pro_sculpt', 
        label: '修身掛脖 + 運動短褲 (Athlete Set)', 
        prompt: 'tight athletic tank, high-cut performance shorts, showing muscular leg definition', 
        category: 'full_set', 
        gender: 'male' 
    },
    {
        id: 'm_full_tee_shorts',
        label: '素色T恤 + 休閒短褲 (Tee + Casual Shorts)',
        prompt: 'clean solid color fitted crew-neck t-shirt, paired with relaxed casual shorts, everyday Korean street style, simple and clean',
        category: 'full_set',
        gender: 'male'
    },
    {
        id: 'm_full_polo_chinos',
        label: 'Polo衫 + 卡其褲 (Polo + Chinos)',
        prompt: 'fitted short-sleeve polo shirt in neutral tone, paired with slim chino pants, smart casual Korean male style, clean preppy energy',
        category: 'full_set',
        gender: 'male'
    },
    {
        id: 'm_full_hoodie_jogger',
        label: '連帽衛衣 + 慢跑褲 (Hoodie + Joggers)',
        prompt: 'fitted zip-up or pullover hoodie, paired with tapered jogger pants, casual sporty streetwear, relaxed urban male style',
        category: 'full_set',
        gender: 'male'
    },
    {
        id: 'm_full_shirt_jeans',
        label: '開領襯衫 + 牛仔褲 (Shirt + Jeans)',
        prompt: 'light open-collar linen or cotton shirt slightly unbuttoned, paired with slim straight jeans, casual summer male style, relaxed masculine energy',
        category: 'full_set',
        gender: 'male'
    },
    { id: 'm_top_shirtless', label: '自然赤膊 (Natural Shirtless)', prompt: 'shirtless, showcasing toned muscular torso', category: 'top', gender: 'male' }
];

export const FEMALE_PRESETS = APPAREL_ITEMS.filter(i => i.gender !== 'male' && i.category === 'full_set');
export const MALE_PRESETS = APPAREL_ITEMS.filter(i => i.gender !== 'female' && i.category === 'full_set');

export const FACE_ARCHETYPES = [
    { value: 'standard', label: '標準臉孔', gender: 'both' },
    { value: 'identity_lock', label: '✨ 依據參考圖生成', gender: 'both' },
    { value: 'taiwan_natural', label: '台系清新女孩', gender: 'female' },
    { value: 'taiwan_sweet', label: '甜美鄰家女孩', gender: 'female' },
    { value: 'korean_iu', label: '韓系微甜系', gender: 'female' },
    { value: 'japanese_pure', label: '日系純淨系', gender: 'female' },
    { value: 'mature_elegant', label: '知性都會女子', gender: 'female' },
    { value: 'mixed_aesthetic', label: '混血感', gender: 'both' },
    { value: 'sharp_western', label: '立體歐美', gender: 'both' },
    { value: 'nordic_minimal', label: '北歐極簡', gender: 'both' },
    { value: 'taiwan_boy_next_door', label: '台系暖男', gender: 'male' },
    { value: 'korean_idol_male', label: '韓系花美男', gender: 'male' },
    { value: 'japanese_fresh_male', label: '日系男孩', gender: 'male' },
    { value: 'mature_taiwan_male', label: '熟男魅力', gender: 'male' }
];

// 臉部原型對應的固定風格設定(選臉部原型時自動套用,取代基礎人型預設)
export const FACE_ARCHETYPE_STYLE_MAP: Record<string, { aestheticStyle: string; skinFinish: string; makeupStyle: string }> = {
    standard: { aestheticStyle: 'realistic', skinFinish: 'natural', makeupStyle: 'natural' },
    taiwan_natural: { aestheticStyle: 'realistic', skinFinish: 'dewy', makeupStyle: 'natural' },
    taiwan_sweet: { aestheticStyle: 'korean_soft', skinFinish: 'dewy', makeupStyle: 'natural' },
    korean_iu: { aestheticStyle: 'korean_soft', skinFinish: 'dewy', makeupStyle: 'k_pop' },
    japanese_pure: { aestheticStyle: 'japanese_fresh', skinFinish: 'matte', makeupStyle: 'natural' },
    mature_elegant: { aestheticStyle: 'high_fashion', skinFinish: 'matte', makeupStyle: 'glam' },
    mixed_aesthetic: { aestheticStyle: 'western_vogue', skinFinish: 'natural', makeupStyle: 'glam' },
    sharp_western: { aestheticStyle: 'western_vogue', skinFinish: 'matte', makeupStyle: 'glam' },
    nordic_minimal: { aestheticStyle: 'high_fashion', skinFinish: 'matte', makeupStyle: 'natural' },
    taiwan_boy_next_door: { aestheticStyle: 'realistic', skinFinish: 'natural', makeupStyle: 'natural' },
    korean_idol_male: { aestheticStyle: 'korean_soft', skinFinish: 'dewy', makeupStyle: 'natural' },
    japanese_fresh_male: { aestheticStyle: 'japanese_fresh', skinFinish: 'matte', makeupStyle: 'natural' },
    mature_taiwan_male: { aestheticStyle: 'high_fashion', skinFinish: 'natural', makeupStyle: 'grooming' }
};

export const SKIN_TONE_OPTIONS = [
    { value: 'fair', label: '白皙 (Fair)' },
    { value: 'medium', label: '自然 (Medium)' },
    { value: 'tan', label: '小麥色 (Tan)' },
    { value: 'deep', label: '深色 (Deep)' }
];

export const SKIN_FINISH_OPTIONS = {
    female: [
        { value: 'natural', label: '自然肌理 (Natural)' }, 
        { value: 'dewy', label: '水光肌 (Dewy)' }, 
        { value: 'matte', label: '霧面啞光 (Matte)' }
    ],
    male: [
        { value: 'natural', label: '自然肌理 (Natural)' }, 
        { value: 'matte', label: '霧面啞光 (Matte)' }
    ]
};

export const MAKEUP_STYLE_OPTIONS = {
    female: [
        { value: 'natural', label: '偽素顏 (Natural)' }, 
        { value: 'glam', label: '華麗濃妝 (Glam)' }, 
        { value: 'no_makeup', label: '完全素顏 (No Makeup)' }, 
        { value: 'k_pop', label: '韓系偶像 (K-Pop)' }
    ],
    male: [
        { value: 'natural', label: '自然修容 (Natural)' }, 
        { value: 'grooming', label: '潔淨保養 (Groomed)' }
    ]
};

export const PROPORTION_MODE_OPTIONS = [
    { value: 'standard', label: '標準比例 (Standard)' },
    { value: 'tall', label: '高挑修長 (Tall)' },
    { value: 'petite', label: '嬌小比例 (Petite)' },
    { value: 'slim', label: '纖細 (Slim)' },
    { value: 'curvy', label: '豐腴沙漏 (Curvy / Hourglass)' },
    { value: 'plus_size', label: '大碼時尚 (Plus Size)' },
    { value: 'athletic', label: '運動健美 (Athletic / Toned)' },
    { value: 'v_shape', label: '倒三角/寬肩 (V-Shape)' }
];

export const PROPORTION_DEFAULTS = {
    female: {
        standard: { height: 160, bust: 92, waist: 61, hip: 92, bustTension: 75, physiqueCurvature: 78 },
        tall: { height: 170, bust: 92, waist: 61, hip: 92, bustTension: 75, physiqueCurvature: 78 },
        petite: { height: 153, bust: 90, waist: 59, hip: 90, bustTension: 75, physiqueCurvature: 78 },
        slim: { height: 163, bust: 90, waist: 59, hip: 90, bustTension: 72, physiqueCurvature: 72 },
        curvy: { height: 160, bust: 96, waist: 63, hip: 96, bustTension: 82, physiqueCurvature: 85 },
        plus_size: { height: 160, bust: 100, waist: 70, hip: 102, bustTension: 80, physiqueCurvature: 80 },
        athletic: { height: 163, bust: 91, waist: 62, hip: 91, bustTension: 73, physiqueCurvature: 75 },
        v_shape: { height: 165, bust: 93, waist: 61, hip: 93, bustTension: 76, physiqueCurvature: 78 }
    },
    male: {
        standard: { height: 180, bust: 95, waist: 80, hip: 95 },
        tall: { height: 192, bust: 100, waist: 82, hip: 100 },
        petite: { height: 168, bust: 88, waist: 75, hip: 88 },
        slim: { height: 182, bust: 90, waist: 75, hip: 90 },
        curvy: { height: 180, bust: 105, waist: 88, hip: 105 },
        plus_size: { height: 185, bust: 115, waist: 100, hip: 115 },
        athletic: { height: 185, bust: 105, waist: 78, hip: 98 },
        v_shape: { height: 188, bust: 110, waist: 80, hip: 95 }
    }
};

export const FEMALE_HAIR_LENGTH_OPTIONS = [
    { value: 'short', label: '短髮 (Short)' }, { value: 'medium', label: '中長髮 (Medium)' }, { value: 'long', label: '長髮 (Long)' }
];
export const FEMALE_HAIR_STYLE_OPTIONS = [
    { value: 'straight', label: '直髮 (Straight)' }, { value: 'wavy', label: '波浪捲 (Wavy)' }, { value: 'curly', label: '羊毛捲 (Curly)' }
];
export const FEMALE_HAIR_BANG_OPTIONS = [
    { value: 'none', label: '無瀏海 (None)' }, { value: 'curtain', label: '八字瀏海 (Curtain)' }, { value: 'full', label: '齊瀏海 (Full)' }
];

export const MALE_HAIR_LENGTH_OPTIONS = [
    { value: 'short', label: '短髮 (Short)' }, { value: 'medium', label: '中長髮 (Medium)' }
];
export const MALE_HAIR_STYLE_OPTIONS = [
    { value: 'straight', label: '直髮 (Straight)' }, { value: 'textured', label: '層次紋理 (Textured)' }
];
export const MALE_HAIR_BANG_OPTIONS = [
    { value: 'none', label: '無瀏海 (None)' }, { value: 'side', label: '側分 (Side Part)' }
];

export const AESTHETIC_STYLES = [
    { value: 'realistic', label: '極致寫實 (Realistic)' },
    { value: 'high_fashion', label: '高級時尚 (High Fashion)' },
    { value: 'korean_soft', label: '韓系柔美 (Korean Soft)' },
    { value: 'western_vogue', label: '歐美 Vogue (Western)' },
    { value: 'japanese_fresh', label: '日系清新 (Japanese)' },
    { value: 'cyberpunk', label: '賽博龐克 (Cyberpunk)' },
    { value: 'cinematic', label: '電影質感 (Cinematic)' }
];

export const SMART_SUGGEST_PRESETS: Record<string, any> = {
    'female_natural': { 
        label: '自然日常 (Natural)',
        aestheticStyle: 'realistic',
        archetype: 'standard',
        outfitPresetId: 'f_full_knit_vest_shorts',
        proportionMode: 'standard',
        skinTone: 'medium',
        skinFinish: 'natural',
        makeupStyle: 'natural',
        hairStyle: 'straight',
        ...PROPORTION_DEFAULTS.female.standard
    },
    'female_korean_idol': { 
        label: '韓系偶像 (Korean Idol)',
        aestheticStyle: 'korean_soft', 
        archetype: 'korean_iu', 
        outfitPresetId: 'f_full_croptee_miniskirt',
        proportionMode: 'slim',
        skinTone: 'fair',
        skinFinish: 'dewy',
        makeupStyle: 'k_pop',
        hairStyle: 'wavy',
        ...PROPORTION_DEFAULTS.female.slim
    },
    'female_paris_chic': { 
        label: '巴黎名伶 (Paris Chic)',
        aestheticStyle: 'high_fashion', 
        archetype: 'mature_elegant', 
        outfitPresetId: 'f_full_offsholder_shorts',
        proportionMode: 'tall',
        skinTone: 'fair',
        skinFinish: 'matte',
        makeupStyle: 'glam',
        hairStyle: 'straight',
        ...PROPORTION_DEFAULTS.female.tall
    },
    'female_la_glam': { 
        label: 'LA 名媛 (LA Glam)',
        aestheticStyle: 'western_vogue', 
        archetype: 'sharp_western', 
        outfitPresetId: 'f_full_tanktop_shorts',
        proportionMode: 'curvy',
        skinTone: 'tan',
        skinFinish: 'matte',
        makeupStyle: 'glam',
        hairStyle: 'curly',
        ...PROPORTION_DEFAULTS.female.curvy
    },
    'female_athleisure': { 
        label: '運動休閒 (Athleisure)',
        aestheticStyle: 'realistic', 
        archetype: 'mixed_aesthetic', 
        outfitPresetId: 'f_full_sporty_set',
        proportionMode: 'athletic',
        skinTone: 'medium',
        skinFinish: 'natural',
        makeupStyle: 'natural',
        hairStyle: 'long',
        ...PROPORTION_DEFAULTS.female.athletic
    },
    'male_natural': { 
        label: '自然日常 (Natural)',
        aestheticStyle: 'realistic', 
        archetype: 'standard', 
        outfitPresetId: 'm_full_tee_shorts',
        proportionMode: 'standard',
        skinTone: 'medium',
        skinFinish: 'natural',
        makeupStyle: 'natural',
        hairStyle: 'straight',
        ...PROPORTION_DEFAULTS.male.standard
    },
    'male_korean_actor': { 
        label: '韓系男演員 (Korean Actor)',
        aestheticStyle: 'korean_soft',
        archetype: 'korean_idol_male',
        outfitPresetId: 'm_full_shirt_jeans',
        proportionMode: 'slim',
        skinTone: 'fair',
        skinFinish: 'natural',
        makeupStyle: 'natural',
        hairStyle: 'textured',
        ...PROPORTION_DEFAULTS.male.slim
    },
    'male_rugged_gentleman': { 
        label: '粗獷紳士 (Rugged)',
        aestheticStyle: 'high_fashion',
        archetype: 'mature_taiwan_male',
        outfitPresetId: 'm_full_pro_sculpt',
        proportionMode: 'v_shape',
        skinTone: 'tan',
        skinFinish: 'natural',
        makeupStyle: 'natural',
        hairStyle: 'short',
        ...PROPORTION_DEFAULTS.male.v_shape
    },
    'male_western_editorial': { 
        label: '歐美時尚 (Western)',
        aestheticStyle: 'western_vogue', 
        archetype: 'sharp_western', 
        outfitPresetId: 'm_full_pro_sculpt',
        proportionMode: 'athletic',
        skinTone: 'tan',
        skinFinish: 'matte',
        makeupStyle: 'grooming',
        hairStyle: 'straight',
        ...PROPORTION_DEFAULTS.male.athletic
    },
    'female_cyber_punk': {
        label: '賽博酷兒 (Cyberpunk)',
        aestheticStyle: 'cyberpunk',
        archetype: 'mixed_aesthetic',
        outfitPresetId: 'f_full_tanktop_shorts',
        proportionMode: 'slim',
        skinTone: 'fair',
        skinFinish: 'matte',
        makeupStyle: 'glam',
        hairStyle: 'straight',
        ...PROPORTION_DEFAULTS.female.slim
    },
    'female_ethereal_elfin': {
        label: '精靈空靈 (Ethereal)',
        aestheticStyle: 'realistic',
        archetype: 'japanese_pure',
        outfitPresetId: 'f_full_camisole_shorts',
        proportionMode: 'petite',
        skinTone: 'fair',
        skinFinish: 'dewy',
        makeupStyle: 'natural',
        hairStyle: 'long',
        ...PROPORTION_DEFAULTS.female.petite
    },
    'female_mature_executive': {
        label: '熟齡優雅 (Executive)',
        aestheticStyle: 'high_fashion',
        archetype: 'mature_elegant',
        outfitPresetId: 'f_full_offsholder_shorts',
        proportionMode: 'standard',
        skinTone: 'medium',
        skinFinish: 'natural',
        makeupStyle: 'natural',
        hairStyle: 'medium',
        ...PROPORTION_DEFAULTS.female.standard
    },
    'female_fitness_pro': {
        label: '健美教練 (Fitness)',
        aestheticStyle: 'realistic',
        // TODO(P2): 合法臉型清單無「運動員臉型」對應，暫用 mixed_aesthetic 佔位，待 Hank 裁決是否新增 archetype
        archetype: 'mixed_aesthetic',
        outfitPresetId: 'f_full_sporty_set',
        proportionMode: 'athletic',
        skinTone: 'tan',
        skinFinish: 'natural',
        makeupStyle: 'no_makeup',
        hairStyle: 'short',
        ...PROPORTION_DEFAULTS.female.athletic
    },
    'male_cyber_mercenary': {
        label: '科技傭兵 (Mercenary)',
        aestheticStyle: 'cyberpunk',
        archetype: 'mixed_aesthetic',
        outfitPresetId: 'm_full_hoodie_jogger',
        proportionMode: 'v_shape',
        skinTone: 'medium',
        skinFinish: 'matte',
        makeupStyle: 'grooming',
        hairStyle: 'textured',
        ...PROPORTION_DEFAULTS.male.v_shape
    },
    'male_mature_ceo': {
        label: '熟男總裁 (CEO)',
        aestheticStyle: 'high_fashion',
        archetype: 'standard',
        outfitPresetId: 'm_full_polo_chinos',
        proportionMode: 'standard',
        skinTone: 'fair',
        skinFinish: 'natural',
        makeupStyle: 'natural',
        hairStyle: 'short',
        ...PROPORTION_DEFAULTS.male.standard
    },
    'male_fitness_coach': {
        label: '明星教練 (Fit Coach)',
        aestheticStyle: 'realistic',
        // TODO(P2): 合法臉型清單無「運動員臉型」對應，暫用 mixed_aesthetic 佔位，待 Hank 裁決是否新增 archetype
        archetype: 'mixed_aesthetic',
        outfitPresetId: 'm_full_pro_sculpt',
        proportionMode: 'athletic',
        skinTone: 'medium',
        skinFinish: 'natural',
        makeupStyle: 'natural',
        hairStyle: 'short',
        ...PROPORTION_DEFAULTS.male.athletic
    },
    'female_nordic_minimal': {
        label: '北歐冷感 (Nordic)',
        aestheticStyle: 'high_fashion',
        archetype: 'nordic_minimal',
        outfitPresetId: 'f_full_knit_vest_shorts',
        proportionMode: 'tall',
        skinTone: 'fair',
        skinFinish: 'matte',
        makeupStyle: 'natural',
        hairStyle: 'straight',
        ...PROPORTION_DEFAULTS.female.tall
    },
    'male_nordic_sculpted': {
        label: '北歐雕塑 (Nordic)',
        aestheticStyle: 'high_fashion',
        archetype: 'nordic_minimal',
        outfitPresetId: 'm_full_pro_sculpt',
        proportionMode: 'tall',
        skinTone: 'fair',
        skinFinish: 'matte',
        makeupStyle: 'natural',
        hairStyle: 'straight',
        ...PROPORTION_DEFAULTS.male.tall
    },
    'female_retro_vintage': {
        label: '復古名伶 (Vintage)',
        aestheticStyle: 'cinematic',
        archetype: 'mature_elegant',
        outfitPresetId: 'f_full_offsholder_shorts',
        proportionMode: 'curvy',
        skinTone: 'fair',
        skinFinish: 'natural',
        makeupStyle: 'glam',
        hairStyle: 'wavy',
        ...PROPORTION_DEFAULTS.female.curvy
    },
    'male_tech_nomad': {
        label: '機迷遊牧 (Tech Nomad)',
        aestheticStyle: 'cyberpunk',
        archetype: 'mixed_aesthetic',
        outfitPresetId: 'm_full_hoodie_jogger',
        proportionMode: 'slim',
        skinTone: 'tan',
        skinFinish: 'natural',
        makeupStyle: 'grooming',
        hairStyle: 'medium',
        ...PROPORTION_DEFAULTS.male.slim
    }
};

export const ModelGenerationDefaults = {
    gender: 'female',
    age: 25,
    aestheticStyle: 'realistic',
    archetype: 'standard',
    outfitItems: ['f_full_knit_vest_shorts'], // 陣列支援複選（2026-08-01 修：原 f_vto_tee_shorts 對不上 APPAREL_ITEMS）
    hairLength: 'long',
    hairStyle: 'straight',
    hairBang: 'none',
    skinFinish: 'natural',
    skinTone: 'fair',
    makeupStyle: 'natural',
    hairColor: 'brown',
    proportionMode: 'standard',
    height: 168,
    headBodyRatio: 8.0,
    bust: 85,
    waist: 65,
    hip: 90,
    // ⚰️ 2026-08-04（企劃案 B-5）：angle 與 lightingDepthControl 已失去讀取端。
    // prompts/modelCreation.ts 的 [TECHNICAL SPECS] 原本插值這兩個欄位，
    // 現已寫死成「eye-level, straight-on」＋「soft even studio lighting」。
    // 兩者都從來沒有 UI 控制項、恆為下面這兩個預設值，改也改不動。
    // 定妝照的角度與光線由 [CASTING STUDIO SPECIFICATION] 統一管理。
    // 依鐵則不自動 delete，保留墓碑；確認後可由 Hank 刪除這兩行。
    angle: 'eye-level',
    // 2026-08-03（企劃案 B-4a）：移除 cameraLensType。
    // 全 repo 只有這一行，沒有任何讀取端——prompt 裡的鏡頭描述是寫死的 50mm/85mm。
    lightingDepthControl: 'soft studio lighting',
    // Phase 1: Advanced Parameters
    isExpertMode: false,
    skinMicroTexture: true,
    irisDetail: true,
    noseHeight: 50,
    eyeShape: 'standard',
    lipThickness: 50,
    // ⚰️ 2026-08-04（企劃案 B-5）：lightingPreset 在模特兒生成已失去讀取端
    // （[LIGHTING SPECTRUM] 與舊表情引擎的 catchlight 插值都已移除）。
    // 注意：合成卡工作室（CompositeCardStudio）與虛擬試衣間各有自己的 lighting state，
    // 它們的選單是元件內 inline 陣列，不吃這裡也不吃已墓碑化的 LIGHTING_PRESETS。
    lightingPreset: 'studio_soft',
    netRedLevel: 2,
    // 2026-08-03（企劃案 B-4a）：移除 brandStyleAnchor。
    // 它從來沒有任何 UI 控制項，恆為 'none'，所以下游那兩段 prompt 分支永遠不會觸發。
    // CLAUDE.md 第 7 節「brandStyleAnchor 暴露位置」這條躺著的小裁決，答案是：不暴露，直接刪。
    // 理由：它描述的是視覺氛圍（背景、光線、色調），不是人物表面特徵，
    // 依「模特兒生成只留五官／身形／髮型／服裝」的架構原則，本來就不該在這裡。
    isMultiAngle: false,
    // Phase 1: Physiological Feature Controls
    bustTension: 50,
    physiqueCurvature: 50,
    muscularDensity: 50,
    vTaperScale: 50
};

/**
 * ⚰️ 已退役 —— 2026-08-04（企劃案 B-5）
 *
 * `lightingPreset` 從無 UI 控制項、恆為 'studio_soft'，六個選項裡有五個從未被使用。
 * 而 prompts/modelCreation.ts 的 [LIGHTING SPECTRUM] 段落已移除——它會跟新的
 * [CASTING STUDIO SPECIFICATION]（均勻柔光、無投影）直接打架。
 * 光線一律由棚拍規格統一管理；戲劇光屬於場景轉移與靈魂敘事。
 *
 * 已無任何 import。依鐵則不自動 delete，保留墓碑；確認後可由 Hank 刪除。
 *
 * 原本的六個選項（保留於此供查閱，git 歷史亦有）：
 *   studio_soft 柔和棚拍 / golden_hour 黃金小時 / cinematic_warm 電影暖調 /
 *   high_contrast 高反差時尚 / natural_daylight 自然日光 / neon_night 霓虹夜色
 */
export const LIGHTING_PRESETS: { value: string; label: string }[] = [];

export const EYE_SHAPE_OPTIONS = [
    { value: 'standard', label: '標準 (Standard)' },
    { value: 'almond', label: '杏仁眼 (Almond)' },
    { value: 'round', label: '圓眼 (Round)' },
    { value: 'monolid', label: '單眼皮 (Monolid)' },
    { value: 'phoenix', label: '鳳眼 (Phoenix)' }
];

/**
 * ⚰️ 已退役 —— 2026-08-03（企劃案 B-4a）
 *
 * 這組選項從來沒有被任何 UI 渲染過：`brandStyleAnchor` 恆為 'none'，
 * 下游兩處 prompt 分支（modelCreationService / prompts/modelCreation）從未觸發。
 * 內容本身描述的是背景、光線、色調——屬於場景與氛圍，不是人物表面特徵，
 * 依「模特兒生成只留五官／身形／髮型／服裝」的架構原則本來就不該在這裡。
 *
 * 已無任何 import。依鐵則不自動 delete，保留墓碑；確認後可由 Hank 刪除本區塊。
 */
export const BRAND_STYLE_ANCHORS: { value: string; label: string }[] = [];
