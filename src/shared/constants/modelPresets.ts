
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
    // --- FULL SETS (成套預設：極簡、素色、身形展現優化) ---
    { 
        id: 'f_full_minimalist_nude', 
        label: '裸感無縫成套 (Seamless Nude-feel Set)', 
        prompt: 'minimalist seamless nude-colored athletic set, skin-tight second-skin fabric, high-waist briefs, sleeveless top, maximum silhouette visibility', 
        category: 'full_set', 
        gender: 'female' 
    },
    { 
        id: 'f_full_pro_vogue', 
        label: 'Vogue 簡約連體衣 (Couture Bodysuit)', 
        prompt: 'high-cut elegant bodysuit, matte black stretch fabric, razor-sharp silhouette, showing long legs and refined torso', 
        category: 'full_set', 
        gender: 'female' 
    },
    {
        id: 'f_full_avant_garde_bandage',
        label: '前衛繃帶感連體衣 (Avant-garde Bandage)',
        prompt: 'structural overlapping compression bands, technical cross-strap architecture, maximum anatomical definition visibility, avant-garde silhouette',
        category: 'full_set',
        gender: 'female'
    },
    {
        id: 'f_full_precision_swim',
        label: '精密工學兩件式 (Precision 2-Piece)',
        prompt: 'Precision-engineered dual-piece technical ensemble. Separated crop-top and high-waisted briefs with visible midriff gap. Structural micro-corded ties, modular compression panels, technical matte material, clear anatomical seam lines.',
        category: 'full_set',
        gender: 'female'
    },
    { 
        id: 'f_vto_bra_bikeshorts', 
        label: '競技交叉背心 + 自行車褲 (Pro-Cross Set)', 
        prompt: 'cross-back performance sports bra, high-compression bike shorts, professional athletic physique display', 
        category: 'full_set', 
        gender: 'female' 
    },
    { 
        id: 'f_vto_bikini', 
        label: '極簡細帶比基尼 (Slim-Strap Bikini)', 
        prompt: 'minimalist color-block technical swimwear, structural micro-corded ties, clean profile architecture, high-end material finish', 
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

    // --- MALE (男性：身形強化預設) ---
    { 
        id: 'm_full_pro_sculpt', 
        label: '修身掛脖 + 運動短褲 (Athlete Sculpt Set)', 
        prompt: 'tight athletic tank, high-cut performance shorts, showing muscular leg definition', 
        category: 'full_set', 
        gender: 'male' 
    },
    { id: 'm_top_shirtless', label: '自然赤膊 (Natural Shirtless)', prompt: 'shirtless, showcasing toned muscular torso', category: 'top', gender: 'male' }
];

export const FEMALE_PRESETS = APPAREL_ITEMS.filter(i => i.gender !== 'male' && i.category === 'full_set');
export const MALE_PRESETS = APPAREL_ITEMS.filter(i => i.gender !== 'female' && i.category === 'full_set');

export const FACE_ARCHETYPES = [
    { value: 'standard', label: '標準臉孔 (Standard)', gender: 'both' },
    { value: 'identity_lock', label: '✨ 依據參考圖生成 (Identity Lock)', gender: 'both' },
    { value: 'delicate_asian', label: '精緻東方 (Delicate Asian)', gender: 'both' },
    { value: 'sharp_western', label: '立體歐美 (Sharp Western)', gender: 'both' },
    { value: 'soft_youthful', label: '清純幼態 (Soft Youthful)', gender: 'female' },
    { value: 'exotic_mixed', label: '混血風情 (Exotic Mixed)', gender: 'both' },
    { value: 'classic_beauty', label: '古典美人 (Classic Beauty)', gender: 'female' },
    { value: 'high_cheekbones', label: '高級厭世 (High Fashion)', gender: 'both' },
    { value: 'ethereal_elfin', label: '靈動空靈 (Ethereal Elfin)', gender: 'female' },
    { value: 'mature_elegant', label: '成熟優雅 (Mature Elegant)', gender: 'female' },
    { value: 'cyber_stray', label: '賽博流浪 (Cyber Stray)', gender: 'both' },
    { value: 'fitness_leader', label: '健美領袖 (Fitness Leader)', gender: 'both' },
    { value: 'nordic_minimal', label: '北歐極簡 (Nordic Minimal)', gender: 'both' },
    { value: 'rugged_handsome', label: '粗獷帥氣 (Rugged)', gender: 'male' },
    { value: 'boyish_charm', label: '鄰家男孩 (Boyish)', gender: 'male' }
];

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
        standard: { height: 168, bust: 85, waist: 65, hip: 90 },
        tall: { height: 178, bust: 85, waist: 65, hip: 90 },
        petite: { height: 155, bust: 80, waist: 60, hip: 82 },
        slim: { height: 170, bust: 80, waist: 58, hip: 85 },
        curvy: { height: 165, bust: 95, waist: 68, hip: 100 },
        plus_size: { height: 168, bust: 105, waist: 85, hip: 110 },
        athletic: { height: 172, bust: 88, waist: 68, hip: 92 },
        v_shape: { height: 175, bust: 92, waist: 66, hip: 88 }
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
        outfitPresetId: 'f_vto_tee_shorts',
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
        archetype: 'delicate_asian', 
        outfitPresetId: 'f_vto_tank_safety',
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
        archetype: 'high_cheekbones', 
        outfitPresetId: 'f_vto_bodysuit',
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
        outfitPresetId: 'f_vto_bra_bikeshorts',
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
        archetype: 'exotic_mixed', 
        outfitPresetId: 'f_vto_sports_bra_leggings',
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
        outfitPresetId: 'm_vto_tee_shorts',
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
        archetype: 'soft_youthful', 
        outfitPresetId: 'm_vto_tank_shorts',
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
        archetype: 'rugged_handsome', 
        outfitPresetId: 'm_vto_compression_top',
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
        outfitPresetId: 'm_vto_shirtless',
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
        archetype: 'cyber_stray',
        outfitPresetId: 'f_vto_bodysuit',
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
        archetype: 'ethereal_elfin',
        outfitPresetId: 'f_vto_bikini',
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
        outfitPresetId: 'f_vto_tee_shorts',
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
        archetype: 'fitness_leader',
        outfitPresetId: 'f_vto_bra_bikeshorts',
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
        archetype: 'cyber_stray',
        outfitPresetId: 'm_vto_compression_top',
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
        outfitPresetId: 'm_vto_tee_shorts',
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
        archetype: 'fitness_leader',
        outfitPresetId: 'm_vto_shirtless',
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
        outfitPresetId: 'f_vto_tank_safety',
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
        outfitPresetId: 'm_vto_tank_shorts',
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
        archetype: 'classic_beauty',
        outfitPresetId: 'f_vto_bodysuit',
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
        archetype: 'exotic_mixed',
        outfitPresetId: 'm_vto_compression_top',
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
    outfitItems: ['f_vto_tee_shorts'], // 改為陣列支援複選
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
    angle: 'eye-level',
    cameraLensType: '85mm portrait lens',
    lightingDepthControl: 'soft studio lighting',
    // Phase 1: Advanced Parameters
    isExpertMode: false,
    skinMicroTexture: true,
    naturalBlemishes: false,
    irisDetail: true,
    noseHeight: 50,
    eyeShape: 'standard',
    lipThickness: 50,
    lightingPreset: 'studio_soft',
    brandStyleAnchor: 'none',
    isMultiAngle: false,
    // Phase 1: Physiological Feature Controls
    bustTension: 50,
    physiqueCurvature: 50,
    muscularDensity: 50,
    vTaperScale: 50
};

export const LIGHTING_PRESETS = [
    { value: 'studio_soft', label: '柔和棚拍 (Studio Soft)' },
    { value: 'golden_hour', label: '黃金小時 (Golden Hour)' },
    { value: 'cinematic_warm', label: '電影暖調 (Cinematic Warm)' },
    { value: 'high_contrast', label: '高反差時尚 (High Contrast)' },
    { value: 'natural_daylight', label: '自然日光 (Natural Daylight)' },
    { value: 'neon_night', label: '霓虹夜色 (Neon Night)' }
];

export const EYE_SHAPE_OPTIONS = [
    { value: 'standard', label: '標準 (Standard)' },
    { value: 'almond', label: '杏仁眼 (Almond)' },
    { value: 'round', label: '圓眼 (Round)' },
    { value: 'monolid', label: '單眼皮 (Monolid)' },
    { value: 'phoenix', label: '鳳眼 (Phoenix)' }
];

export const BRAND_STYLE_ANCHORS = [
    { value: 'none', label: '無 (None)' },
    { value: 'minimal_luxury', label: '極簡奢華 (Minimal Luxury)' },
    { value: 'vibrant_street', label: '活力街頭 (Vibrant Street)' },
    { value: 'noir_elegance', label: '暗黑優雅 (Noir Elegance)' },
    { value: 'ethereal_dream', label: '空靈夢幻 (Ethereal Dream)' },
    { value: 'tech_utilitarian', label: '科技機能 (Tech Utilitarian)' }
];
