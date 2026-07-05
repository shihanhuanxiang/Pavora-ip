// --- Director Mode Presets (V5.0 Pro-Cine Edition) ---

export const DIRECTOR_STYLES = [
    { value: 'luxury_tvc', label: '頂奢廣告 (Luxury Brand TVC)', prompt: 'high-end luxury commercial aesthetic, Chanel and Dior advertising style, extreme skin texture, expensive color grading, 8k polished look', description: '模仿頂級奢侈品廣告，強調極致的質感與昂貴的色彩分級。' },
    { value: 'avant_garde', label: '前衛實驗 (Avant-Garde Experimental)', prompt: 'avant-garde experimental film style, Alexander McQueen aesthetic, surrealist visuals, high contrast, bold artistic flair', description: '突破常規的藝術表達，融合超現實視覺與強烈對比。' },
    { value: 'quiet_luxury', label: '老錢風 (Quiet Luxury)', prompt: 'quiet luxury aesthetic, Loro Piana style, minimalist sophistication, muted earth tones, high-quality natural textures, timeless elegance', description: '低調奢華美學，強調自然材質的紋理與永恆的優雅感。' },
    { value: 'cyber_noir', label: '賽博黑色 (Cyber-Noir)', prompt: 'cyber-noir aesthetic, Blade Runner 2049 style, teal and orange color contrast, volumetric lighting in fog, lonely urban atmosphere', description: '冷暖對比的未來感，營造迷幻且孤獨的都市氛圍。' },
    { value: 'surrealist_dream', label: '超現實夢境 (Surrealist Dream)', prompt: 'David Lynch surrealist dream style, shifting shadows, ethereal halation on edges, dream-like logic, mysterious atmosphere', description: '大衛·林區式的夢幻邏輯，光影交錯且帶有神祕感。' },
    { value: 'technicolor', label: '三色帶時代 (Technicolor)', prompt: 'vintage 1950s Technicolor film look, hyper-saturated colors, distinct color separation, classic Hollywood golden age aesthetic', description: '復刻 50 年代好萊塢經典，色彩極度飽和且具備時代感。' },
    { value: 'french_new_wave', label: '法國新浪潮 (French New Wave)', prompt: 'French New Wave cinema style, naturalistic lighting, jump cut energy, raw artistic texture, Godard aesthetic', description: '強調自然光與跳接感，具備粗糙且真實的藝術美學。' },
    { value: 'cyber_brutalism', label: '賽博粗獷 (Cyber-Brutalism)', prompt: 'cyber-brutalism aesthetic, massive concrete structures, cold minimalist lighting, futuristic industrial grit', description: '巨大的混凝土結構與冷峻燈光，展現工業風的未來感。' },
    { value: 'wes_anderson', label: '魏斯安德森 (Wes Anderson)', prompt: 'Wes Anderson aesthetic, perfect center-weighted symmetry, pastel color palette, flat lighting, whimsical storybook feel', description: '極致的對稱構圖與粉嫩色調，營造童話般的視覺感。' },
    { value: 'wong_kar_wai', label: '王家衛 (Wong Kar-wai)', prompt: 'Wong Kar-wai cinematic style, step-printing motion blur, moody neon saturation, emotional longing, Hong Kong night vibe', description: '經典的抽幀殘影與霓虹色彩，傳達強烈的情感渴望。' },
    { value: 'custom', label: '自訂風格 (Custom)', prompt: '', description: '手動輸入您的專屬風格描述。' }
];

export const LENS_LANGUAGES = [
    { value: 'prime_35mm', label: '人文 35mm (Master Prime)', prompt: 'shot on 35mm master prime lens, natural storytelling perspective, human-centric depth, realistic field of view', description: '最接近人眼視角，適合敘述故事與展現自然的空間感。' },
    { value: 'tele_135mm', label: '極致壓縮 135mm (Telephoto)', prompt: 'shot on 135mm telephoto lens, extreme background compression, subject isolation, sharp focus, cinematic depth', description: '強大的背景壓縮感，能將遠景拉近並極度突出主體。' },
    { value: 'anamorphic_2x', label: '變形寬螢幕 (Anamorphic 2X)', prompt: 'shot on 2X anamorphic lens, oval bokeh, horizontal blue lens flares, cinematic widescreen distortion, theatrical look', description: '電影感十足的寬螢幕比例，具備橢圓虛化與水平光暈。' },
    { value: 'laowa_probe', label: '探針微距 (Laowa Probe)', prompt: 'Laowa probe lens perspective, immersive macro journey, traveling through intricate textures and small spaces', description: '極致微距視角，能穿梭於細小空間展現驚人的細節。' },
    { value: 'petzval_vintage', label: '旋轉虛化 (Vintage Petzval)', prompt: 'shot on vintage Petzval lens, swirly bokeh effect, 19th-century artistic aesthetic, soft edges with sharp center', description: '復古的螺旋狀虛化效果，具備 19 世紀的古典藝術感。' },
    { value: 'wide_24mm', label: '廣角 24mm (Expansive Wide)', prompt: 'shot on 24mm wide angle lens, deep focus, expansive environment, architectural perspective, dynamic framing', description: '開闊的視野，適合展現宏大的環境與具備張力的構圖。' },
    { value: 'split_diopter', label: '分鏡頭濾鏡 (Split Diopter)', prompt: 'split diopter effect, simultaneous sharp focus on foreground and background, dramatic visual tension', description: '讓遠近物體同時清晰，營造強烈的視覺對比與緊張感。' },
    { value: 'fisheye_ultra', label: '全週魚眼 (Ultra Fisheye)', prompt: 'ultra-wide fisheye lens, extreme barrel distortion, immersive 180-degree perspective, dynamic street culture', description: '極致的桶形畸變，提供 180 度的沉浸式動態視角。' }
];

export const ACTION_RHYTHMS = [
    { value: 'natural', label: '自然流暢 (Natural 24fps)', prompt: 'natural fluid motion, standard 24fps cinematic timing, realistic movement', description: '標準電影幀率，提供最符合現實視覺的自然動態。' },
    { value: 'slow_motion_60', label: '優雅慢速 (60fps)', prompt: 'elegant slow motion, 60fps interpreted to 24fps, fluid fabric movement, dreamy atmosphere', description: '優雅的慢動作，適合展現布料飄動或夢幻的氛圍。' },
    { value: 'super_slow_120', label: '極致慢速 (120fps)', prompt: '120fps super slow motion, liquid dynamics, capturing micro-moments, suspended particles', description: '極致慢速捕捉微小瞬間，展現液體或微粒的動態美。' },
    { value: 'step_printing', label: '王家衛抽幀 (Step Printing)', prompt: 'step-printing motion effect, intentional motion blur, emotional trailing, choppy but fluid artistic rhythm', description: '刻意的動態模糊與殘影，營造具備藝術感的節奏。' },
    { value: 'speed_ramping', label: '變速控制 (Speed Ramping)', prompt: 'dynamic speed ramping, fast to slow transition, high energy action beats, cinematic timing', description: '在鏡頭內進行快慢切換，增加畫面的能量與節奏感。' },
    { value: 'reverse_motion', label: '逆向動作 (Reverse)', prompt: 'reverse motion effect, surreal backward movement, water or smoke flowing backwards', description: '時間倒流的超現實效果，如煙霧倒流或水滴回升。' },
    { value: 'timelapse_pro', label: '專業縮時 (Pro Timelapse)', prompt: 'cinematic pro timelapse, fast-moving environmental elements, stationary subject focus, high-speed time passage', description: '展現時間的快速流逝，適合環境變化或宏大敘事。' },
    { value: 'stop_motion_tactile', label: '定格質感 (Stop Motion)', prompt: 'tactile stop motion aesthetic, slight jitter, handmade feel, creative animation texture', description: '模擬手工定格動畫，具備輕微的抖動感與創意質感。' }
];

export const LIGHTING_VIBES = [
    { value: 'chiaroscuro', label: '明暗對照 (Chiaroscuro)', prompt: 'chiaroscuro lighting, dramatic high contrast, deep shadows, Da Vinci inspired light and dark balance', description: '強烈的明暗對比與深沉陰影，強調主體的立體結構。' },
    { value: 'volumetric_tyndall', label: '丁達爾效應 (Volumetric)', prompt: 'volumetric lighting, Tyndall effect, visible light beams through haze or dust, ethereal and holy atmosphere', description: '可見的光束穿過霧氣，營造神聖且空靈的氛圍。' },
    { value: 'butterfly_beauty', label: '蝴蝶光 (Butterfly Beauty)', prompt: 'butterfly lighting, high-end fashion beauty setup, subtle shadow under nose, flattering facial structure', description: '時尚攝影標準佈光，最能修飾五官並提升高級感。' },
    { value: 'motivated_practical', label: '動機光源 (Motivated)', prompt: 'motivated practical lighting, light originating from visible sources like lamps or screens, realistic cast shadows', description: '模擬場景內真實光源的投射，增加畫面的真實感。' },
    { value: 'rembrandt', label: '林布蘭光 (Rembrandt)', prompt: 'Rembrandt lighting setup, dramatic triangle of light on cheek, moody shadows, classic cinematic portraiture', description: '經典的人像佈光，在臉部形成神祕的三角光影。' },
    { value: 'golden_hour', label: '黃金時刻 (Golden Hour)', prompt: 'warm golden hour glow, backlighting, soft rim light, magical sunset atmosphere, lens flares', description: '日落前的溫暖光輝，營造浪漫且具備魔力的氛圍。' },
    { value: 'neon_noir', label: '霓虹夜色 (Neon)', prompt: 'vibrant neon lighting, cinematic teal and orange contrast, urban night reflections, rainy street glow', description: '鮮豔的霓虹燈光與冷暖對比，展現都市夜晚的迷幻感。' },
    { value: 'high_key_clean', label: '高調明亮 (High Key)', prompt: 'high-key lighting, bright and airy, minimal shadows, clean commercial aesthetic, optimistic vibe', description: '明亮且陰影極少的佈光，適合清爽的商業廣告。' }
];

export const COMPOSITION_FOCUSES = [
    { value: 'rule_of_thirds', label: '三分法 (Rule of Thirds)', prompt: 'balanced composition following rule of thirds, dynamic and natural framing', description: '最經典的平衡構圖，提供自然且具備動態感的視角。' },
    { value: 'golden_ratio', label: '黃金比例 (Golden Ratio)', prompt: 'composition based on golden spiral, natural aesthetic balance, mathematically pleasing framing', description: '基於黃金螺旋的構圖，展現極致的視覺美感與平衡。' },
    { value: 'negative_space', label: '留白構圖 (Negative Space)', prompt: 'minimalist composition with significant negative space, focus on isolation and breathing room', description: '大面積的留白，強調主體的孤獨感或畫面的呼吸感。' },
    { value: 'frame_in_frame', label: '框中框 (Frame in Frame)', prompt: 'frame within a frame composition, using windows or architecture to frame the subject, depth of field', description: '利用環境元素框住主體，增加畫面的層次與深度。' },
    { value: 'low_angle_hero', label: '英雄視角 (Low Angle)', prompt: 'low angle hero shot, empowering perspective, subject looks dominant and powerful', description: '由下往上的仰拍，讓主體顯得高大且具備權威感。' },
    { value: 'top_down_flat', label: '上帝視角 (Top Down)', prompt: 'flat lay top-down perspective, geometric arrangement, overview of scene', description: '由上往下的俯拍，適合展現幾何排列或場景全貌。' },
    { value: 'deep_focus', label: '全深焦 (Deep Focus)', prompt: 'deep focus cinematography, everything from foreground to background is sharp, expansive storytelling', description: '讓遠近物體皆清晰，適合敘述宏大且複雜的故事。' },
    { value: 'extreme_close_up', label: '細節特寫 (Extreme Close-up)', prompt: 'extreme close-up on textures or specific features, intimate and intense focus', description: '極近距離的觀察，專注於材質紋理或細微特徵。' }
];

export const CAMERA_MOVEMENTS = [
    { value: 'static', label: '固定機位 (Static)', prompt: 'locked-off static camera, stable tripod shot, no movement', description: '完全靜止的鏡頭，適合展現穩定的構圖與平靜感。' },
    { value: 'technocrane_sweep', label: '伸縮搖臂 (Technocrane)', prompt: 'sweeping Technocrane movement, large scale arc from low to high, expansive spatial reveal', description: '大範圍的弧形升降，展現宏大的空間感與視覺張力。' },
    { value: 'steadicam_follow', label: '斯坦尼康跟隨 (Steadicam)', prompt: 'smooth Steadicam follow shot, organic fluid movement, slight breathing rhythm, immersive', description: '流暢且帶有呼吸感的跟隨，增加畫面的臨場感。' },
    { value: 'vertigo_effect', label: '眩暈變焦 (Vertigo Effect)', prompt: 'vertigo effect dolly zoom, background warps while subject size remains constant, psychological tension', description: '主體不動但背景扭曲，傳達強烈的情緒震撼。' },
    { value: 'parallax_pan', label: '視差搖鏡 (Parallax Pan)', prompt: 'smooth parallax pan, foreground and background move at different speeds, 3D depth feel', description: '利用前景與背景的速度差，創造極強的立體空間感。' },
    { value: 'orbit_360', label: '環繞運鏡 (Orbit)', prompt: '360-degree orbital camera movement around the subject, full spatial exploration', description: '繞著主體進行 360 度旋轉，全方位探索空間關係。' },
    { value: 'whip_pan', label: '甩鏡 (Whip Pan)', prompt: 'dynamic whip pan transition, fast motion blur, high energy camera movement', description: '極速的左右搖鏡，帶有強烈動態模糊，充滿能量。' },
    { value: 'handheld_organic', label: '有機手持 (Handheld)', prompt: 'organic handheld camera shake, immersive documentary feel, breathing camera texture', description: '自然的晃動感，模擬紀實攝影的真實與沉浸感。' }
];

export const SUBJECT_ACTIONS = [
    { value: 'micro_expression', label: '微表情 (Micro-expression)', prompt: 'subtle facial micro-expressions, emotional nuance, eyes reflecting light, deep internal thought', description: '捕捉細微的情緒波動與眼神光影，展現內心世界。' },
    { value: 'texture_interaction', label: '材質互動 (Texture Play)', prompt: 'subject interacting with fabric or environment, tactile focus, sensory exploration of surfaces', description: '強調觸覺互動，如手輕撫過絲綢或觸碰冰冷金屬。' },
    { value: 'runway_walk', label: '伸展台步 (Runway Walk)', prompt: 'confident fashion runway walk, elegant stride, rhythmic movement, high-fashion attitude', description: '自信且具備節奏感的步伐，展現高端時尚的態度。' },
    { value: 'dynamic_turn', label: '動態回眸 (Dynamic Turn)', prompt: 'subject turning towards camera, hair flip, sudden eye contact, high energy reveal', description: '突然的轉身與眼神接觸，具備極強的視覺衝擊力。' },
    { value: 'slow_motion_pose', label: '慢速變換 (Fluid Posing)', prompt: 'fluidly shifting between poses in slow motion, graceful transitions, sculptural movement', description: '在慢動作中優雅地變換姿勢，展現如雕塑般的動態。' },
    { value: 'emotional_transition', label: '情緒轉折 (Emotional Shift)', prompt: 'subject transitioning from one emotion to another, from calm to surprise, narrative acting', description: '從一種情緒轉變為另一種，增加鏡頭的敘事張力。' },
    { value: 'prop_interaction', label: '道具互動 (Prop Play)', prompt: 'subject interacting with props like perfume or bags, commercial focus on product usage', description: '與產品或道具的互動，適合展現商品的使用場景。' },
    { value: 'environmental_look', label: '環顧探索 (Exploring)', prompt: 'subject exploring the environment, curious gaze, natural interaction with surroundings', description: '好奇地觀察四周，展現主體與環境的自然融合。' }
];

export const TRANSITION_STYLES = [
    { value: 'morph', label: 'AI 變形 (Morph)', prompt: 'seamless AI morph transition between the start and end frame' },
    { value: 'match_cut', label: '匹配剪輯 (Match Cut)', prompt: 'cinematic match cut based on shape or color, seamless visual continuity' },
    { value: 'cross_dissolve', label: '疊化 (Dissolve)', prompt: 'elegant cross dissolve transition, fading one image into another' },
    { value: 'whip_pan', label: '甩鏡 (Whip Pan)', prompt: 'dynamic whip pan transition with motion blur, high energy' },
    { value: 'zoom_blur', label: '衝擊變焦 (Zoom Blur)', prompt: 'energetic zoom blur transition, fast forward motion feel' }
];

export const MASTER_PRESETS = [
    {
        id: 'scent_of_eternity',
        name: '永恆之香 (Scent of Eternity)',
        description: '適用於珠寶、香水、高端配飾',
        params: {
            directorStyle: 'luxury_tvc',
            lensLanguage: 'laowa_probe',
            actionRhythm: 'super_slow_120',
            lightingVibe: 'chiaroscuro',
            compositionFocus: 'extreme_close_up',
            cameraMovement: 'steadicam_follow',
            subjectAction: 'texture_interaction'
        }
    },
    {
        id: 'urban_hunter',
        name: '都市獵人 (Urban Hunter)',
        description: '適用於街頭潮流、機能服飾',
        params: {
            directorStyle: 'cyber_noir',
            lensLanguage: 'wide_24mm',
            actionRhythm: 'speed_ramping',
            lightingVibe: 'neon_noir',
            compositionFocus: 'low_angle_hero',
            cameraMovement: 'whip_pan',
            subjectAction: 'runway_walk'
        }
    },
    {
        id: 'the_muse',
        name: '繆思女神 (The Muse)',
        description: '適用於高級時裝、雜誌封面',
        params: {
            directorStyle: 'avant_garde',
            lensLanguage: 'tele_135mm',
            actionRhythm: 'natural',
            lightingVibe: 'butterfly_beauty',
            compositionFocus: 'golden_ratio',
            cameraMovement: 'static',
            subjectAction: 'slow_motion_pose'
        }
    },
    {
        id: 'cyber_avant_garde',
        name: '虛擬異境 (Cyber-Avant-Garde)',
        description: '適用於科技配件、未來感服飾',
        params: {
            directorStyle: 'avant_garde',
            lensLanguage: 'anamorphic_2x',
            actionRhythm: 'step_printing',
            lightingVibe: 'neon_noir',
            compositionFocus: 'negative_space',
            cameraMovement: 'orbit_360',
            subjectAction: 'dynamic_turn'
        }
    },
    {
        id: 'old_money_estate',
        name: '老錢莊園 (Old Money Estate)',
        description: '適用於奢華生活、羊絨服飾',
        params: {
            directorStyle: 'quiet_luxury',
            lensLanguage: 'prime_35mm',
            actionRhythm: 'slow_motion_60',
            lightingVibe: 'golden_hour',
            compositionFocus: 'rule_of_thirds',
            cameraMovement: 'parallax_pan',
            subjectAction: 'environmental_look'
        }
    },
    {
        id: 'raw_authenticity',
        name: '紀實真我 (Raw Authenticity)',
        description: '適用於品牌故事、戶外裝備',
        params: {
            directorStyle: 'french_new_wave',
            lensLanguage: 'prime_35mm',
            actionRhythm: 'natural',
            lightingVibe: 'motivated_practical',
            compositionFocus: 'rule_of_thirds',
            cameraMovement: 'handheld_organic',
            subjectAction: 'environmental_look'
        }
    },
    {
        id: 'symmetrical_dream',
        name: '對稱美學 (Symmetrical Dream)',
        description: '適用於創意禮品、童裝',
        params: {
            directorStyle: 'wes_anderson',
            lensLanguage: 'prime_35mm',
            actionRhythm: 'step_printing',
            lightingVibe: 'high_key_clean',
            compositionFocus: 'golden_ratio',
            cameraMovement: 'static',
            subjectAction: 'micro_expression'
        }
    },
    {
        id: 'noir_narrative',
        name: '情緒時光 (Noir Narrative)',
        description: '適用於高端腕錶、神祕感',
        params: {
            directorStyle: 'cyber_noir',
            lensLanguage: 'tele_135mm',
            actionRhythm: 'natural',
            lightingVibe: 'chiaroscuro',
            compositionFocus: 'extreme_close_up',
            cameraMovement: 'static',
            subjectAction: 'micro_expression'
        }
    },
    {
        id: 'liquid_motion',
        name: '動態流光 (Liquid Motion)',
        description: '適用於護膚品、飲品',
        params: {
            directorStyle: 'luxury_tvc',
            lensLanguage: 'laowa_probe',
            actionRhythm: 'super_slow_120',
            lightingVibe: 'volumetric_tyndall',
            compositionFocus: 'extreme_close_up',
            cameraMovement: 'steadicam_follow',
            subjectAction: 'texture_interaction'
        }
    },
    {
        id: 'experimental_art',
        name: '前衛實驗 (Experimental Art)',
        description: '適用於藝術跨界、概念設計',
        params: {
            directorStyle: 'avant_garde',
            lensLanguage: 'fisheye_ultra',
            actionRhythm: 'speed_ramping',
            lightingVibe: 'volumetric_tyndall',
            compositionFocus: 'low_angle_hero',
            cameraMovement: 'technocrane_sweep',
            subjectAction: 'dynamic_turn'
        }
    }
];
