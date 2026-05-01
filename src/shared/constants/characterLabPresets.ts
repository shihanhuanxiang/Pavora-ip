// --- Character Lab Presets ---

export const GLOBAL_FASHION_MAGAZINES = [
    // Condé Nast
    { id: 'vogue', label: 'Vogue (時尚)', prompt: 'Vogue cover editorial style. Iconic fashion authority, timeless luxury, commanding presence. Centered or near-centered composition, strong silhouette. The subject defines the era and stands at the top of fashion hierarchy.' },
    { id: 'gq', label: 'GQ (紳士)', prompt: 'GQ cover editorial style. Modern luxury with architectural clarity, relaxed confidence. Clean lines, structured framing, understated authority. The subject represents contemporary taste and intelligence.' },
    { id: 'vanity_fair', label: 'Vanity Fair (名利場)', prompt: 'Vanity Fair cover style. Cinematic portraiture, narrative depth, refined glamour. Film-like lighting and storytelling composition. The subject feels like a character in an elegant story.' },
    { id: 'new_yorker', label: 'The New Yorker (紐約客)', prompt: 'The New Yorker inspired cover. Intellectual mood, conceptual framing, cultural symbolism. Restrained elegance, thoughtful and reflective presence.' },

    // Hearst Communications
    { id: 'harpers_bazaar', label: 'Harper\'s Bazaar (時尚芭莎)', prompt: 'Harper’s Bazaar cover editorial style. Elegant glamour, refined femininity, graceful authority. Elongated lines, polished luxury aesthetics. The subject appears poised and timelessly sophisticated.' },
    { id: 'elle', label: 'Elle (她)', prompt: 'ELLE magazine cover style. Modern feminine fashion, approachable confidence. Clean contemporary composition, lifestyle elegance. The subject feels current, relatable, and stylish.' },
    { id: 'marie_claire', label: 'Marie Claire (美麗佳人)', prompt: 'Marie Claire cover editorial style. Professional chic, confident modern woman. Clean lighting, composed posture, aspirational tone.' },
    { id: 'cosmopolitan', label: 'Cosmopolitan (柯夢波丹)', prompt: 'Cosmopolitan cover style. Youthful energy, bold confidence, expressive attitude. Direct engagement with the camera, vibrant lifestyle mood.' },

    // Independent / Youth Culture
    { id: 'i_d', label: 'i-D', prompt: 'i-D magazine cover style. Raw youth culture fashion, unconventional framing. Direct gaze, authentic and unpolished presence.' },
    { id: 'dazed', label: 'Dazed', prompt: 'Dazed cover editorial style. Experimental imagery, expressive movement, visual disruption. Provocative, artistic, and emotionally charged presence.' },
    { id: 'another', label: 'AnOther', prompt: 'AnOther magazine cover style. Art-driven, conceptual composition with intellectual restraint. The subject feels curated like part of an exhibition.' },
    { id: 'love', label: 'LOVE', prompt: 'LOVE magazine cover style. Bold sensuality, dramatic presence, unapologetic confidence. High-impact visuals and emotional intensity.' },
    { id: 'the_face', label: 'The Face', prompt: 'The Face magazine cover style. Youth culture meets fashion, graphic composition. Confident attitude and cultural coolness.' },

    // France
    { id: 'numero', label: 'Numéro', prompt: 'Numéro cover style. Cool intellectual avant-garde fashion. Minimalist yet bold composition, emotional distance.' },
    { id: 'lofficiel', label: 'L’Officiel', prompt: 'L’Officiel cover editorial style. Classic French luxury, timeless sophistication. Balanced composition and elegant posture.' },
    { id: 'cr_fashion', label: 'CR Fashion Book', prompt: 'CR Fashion Book cover style. Bold creative direction, iconic styling. Fashion as attitude and self-expression.' },
    { id: 'purple', label: 'Purple Fashion', prompt: 'Purple Fashion cover style. Art-fashion hybrid, minimalist eroticism. Conceptual restraint and quiet provocation.' },

    // Italy
    { id: 'vogue_italia', label: 'Vogue Italia', prompt: 'Vogue Italia cover style. Dramatic cinematic fashion photography. High emotional intensity and sculptural composition.' },
    { id: 'luomo_vogue', label: 'L’Uomo Vogue', prompt: 'L’Uomo Vogue cover style. Artistic masculine elegance, strong shadow play. Sculptural poses and refined intensity.' },

    // Germany
    { id: 'sleek', label: 'Sleek', prompt: 'Sleek magazine cover style. Minimalist avant-garde fashion, architectural framing. Sharp contrast and futuristic editorial tension.' },

    // Japan
    { id: 'ginza', label: 'Ginza', prompt: 'Ginza cover style. Urban minimal fashion, modern Tokyo aesthetic. Understated confidence and clean composition.' },
    { id: 'spur', label: 'Spur', prompt: 'Spur cover style. Soft contemporary fashion, refined feminine elegance. Gentle posture and balanced emotional tone.' },
    { id: 'popeye', label: 'Popeye', prompt: 'Popeye cover style. Casual lifestyle fashion, relaxed youthful attitude. Street-meets-editorial visual language.' },

    // Korea
    { id: 'w_korea', label: 'W Korea', prompt: 'W Magazine cover style. Bold avant-garde fashion, striking composition. Strong poses and fashion-forward presence.' },

    // Australia
    { id: 'russh', label: 'Russh', prompt: 'Russh magazine cover style. Indie fashion editorial, artistic minimalism. Natural light feeling, raw yet refined storytelling.' },

    // Scandinavia
    { id: 'vogue_scandinavia', label: 'Vogue Scandinavia', prompt: 'Vogue Scandinavia cover style. Nordic minimalism, clean tones, natural textures. Calm modern luxury and sustainable aesthetic.' }
];

export const EDITORIAL_POSES = [
  { value: "Upright neutral standing posture, weight evenly distributed, relaxed shoulders.", label: "中性編輯站姿 (Neutral Standing)", prompt: "Upright neutral standing posture, weight evenly distributed, relaxed shoulders." },
  { value: "Classic contrapposto stance, weight shifted naturally to one leg, subtle hip angle.", label: "經典重心轉移站姿 (Contrapposto)", prompt: "Classic contrapposto stance, weight shifted naturally to one leg, subtle hip angle." },
  { value: "One foot stepping slightly forward, natural walking pause, controlled motion.", label: "自然前跨一步 (Step Forward)", prompt: "One foot stepping slightly forward, natural walking pause, controlled motion." },
  { value: "Firm grounded stance, feet shoulder-width apart, stable and confident posture.", label: "穩定力量站姿 (Power Stand)", prompt: "Firm grounded stance, feet shoulder-width apart, stable and confident posture." },
  { value: "Body gently leaning against an invisible vertical plane, relaxed yet intentional.", label: "輕靠式放鬆站姿 (Leaning)", prompt: "Body gently leaning against an invisible vertical plane, relaxed yet intentional." },
  { value: "Torso subtly rotated while hips remain forward, creating natural garment tension.", label: "上身微轉角度 (Torso Twist)", prompt: "Torso subtly rotated while hips remain forward, creating natural garment tension." },
  { value: "Minimal seated posture, straight spine, controlled leg positioning.", label: "極簡坐姿 (Minimal Seated)", prompt: "Minimal seated posture, straight spine, controlled leg positioning." },
  { value: "Standing with ankles loosely crossed, casual editorial balance.", label: "自然交叉腳站姿 (Crossed Legs)", prompt: "Standing with ankles loosely crossed, casual editorial balance." },
  { value: "One arm softly framing the torso without blocking garment structure.", label: "單臂框線姿勢 (Arm Frame)", prompt: "One arm softly framing the torso without blocking garment structure." },
  { value: "One hand resting naturally inside pocket, relaxed and understated.", label: "單手口袋姿勢 (Hand in Pocket)", prompt: "One hand resting naturally inside pocket, relaxed and understated." },
  { value: "Weight shifted slightly backward, elongating front garment lines.", label: "後移重心站姿 (Weight Back)", prompt: "Weight shifted slightly backward, elongating front garment lines." },
  { value: "Body aligned diagonally to camera, creating visual depth without distortion.", label: "斜向身體線條 (Diagonal Alignment)", prompt: "Body aligned diagonally to camera, creating visual depth without distortion." },
  { value: "Mid-step walking posture frozen in a natural editorial moment.", label: "行走定格瞬間 (Walking Pose)", prompt: "Mid-step walking posture frozen in a natural editorial moment." },
  { value: "One shoulder slightly lowered, breaking symmetry naturally.", label: "單肩微下姿勢 (Shoulder Drop)", prompt: "One shoulder slightly lowered, breaking symmetry naturally." },
  { value: "Still, sculptural posture inspired by architectural balance and symmetry.", label: "建築感靜態姿勢 (Architectural)", prompt: "Still, sculptural posture inspired by architectural balance and symmetry." }
];

export const EDITORIAL_EXPRESSIONS = [
  { value: "Neutral expression, relaxed facial muscles, no visible emotion.", label: "中性編輯表情 (Neutral Expression)", prompt: "Neutral expression, relaxed facial muscles, no visible emotion." },
  { value: "Eyes softly focused, calm gaze, minimal facial tension.", label: "柔和專注眼神 (Soft Focus)", prompt: "Eyes softly focused, calm gaze, minimal facial tension." },
  { value: "Looking slightly past the camera, detached and composed.", label: "視線略過鏡頭 (Looking Past)", prompt: "Looking slightly past the camera, detached and composed." },
  { value: "Direct eye contact with calm, controlled presence.", label: "冷靜直視鏡頭 (Direct Gaze)", prompt: "Direct eye contact with calm, controlled presence." },
  { value: "Lips gently closed, subtle confidence without tension.", label: "閉唇自信表情 (Confident Smileless)", prompt: "Lips gently closed, subtle confidence without tension." },
  { value: "Chin slightly raised, controlled authority without dominance.", label: "下巴微抬 (Chin Up)", prompt: "Chin slightly raised, controlled authority without dominance." },
  { value: "Eyes gently lowered, introspective but neutral mood.", label: "柔和下視眼神 (Downward Gaze)", prompt: "Eyes gently lowered, introspective but neutral mood." },
  { value: "Serious expression without frown, composed and intentional.", label: "編輯感嚴肅表情 (Serious Editorial)", prompt: "Serious expression without frown, composed and intentional." },
  { value: "Jaw relaxed, facial structure clearly visible.", label: "放鬆下顎線條 (Relaxed Jaw)", prompt: "Jaw relaxed, facial structure clearly visible." },
  { value: "Slight intensity in eyes, restrained and editorial.", label: "低調強度眼神 (Subtle Intensity)", prompt: "Slight intensity in eyes, restrained and editorial." },
  { value: "Quiet confidence conveyed through still facial expression.", label: "內斂自信表情 (Quiet Confidence)", prompt: "Quiet confidence conveyed through still facial expression." },
  { value: "Emotionless, cool editorial expression, minimalist fashion mood.", label: "冷感雜誌表情 (Cool Editorial)", prompt: "Emotionless, cool editorial expression, minimalist fashion mood." },
  { value: "Eyes alert but calm, aware presence without emotion.", label: "柔和警覺感 (Alert & Calm)", prompt: "Eyes alert but calm, aware presence without emotion." },
  { value: "Natural resting face, no posing or exaggeration.", label: "自然靜止表情 (Resting Face)", prompt: "Natural resting face, no posing or exaggeration." },
  { value: "Blank, adaptable expression suitable for multiple editorial contexts.", label: "編輯用空白表情 (Blank Canvas)", prompt: "Blank, adaptable expression suitable for multiple editorial contexts." }
];

export const MICRO_VARIATION_POOL = {
    head_tilt: ["Head tilt -5 degrees", "Head tilt 0 degrees", "Head tilt +5 degrees"],
    eye_focus: ["Eyes focused on direct lens", "Eyes slightly off lens"],
    shoulder_offset: ["Left shoulder lower", "Shoulders neutral", "Right shoulder lower"],
    hand_tension: ["Hands relaxed", "Hands semi-tensed"]
};

export const MAGAZINE_RECOMMENDATIONS: Record<string, { pose: string, expression: string }> = {
    vogue: { pose: "Upright neutral standing posture, weight evenly distributed, relaxed shoulders.", expression: "Direct eye contact with calm, controlled presence." },
    harpers_bazaar: { pose: "Classic contrapposto stance, weight shifted naturally to one leg, subtle hip angle.", expression: "Looking slightly past the camera, detached and composed." },
    marie_claire: { pose: "Body aligned diagonally to camera, creating visual depth without distortion.", expression: "Eyes softly focused, calm gaze, minimal facial tension." },
    gq: { pose: "Still, sculptural posture inspired by architectural balance and symmetry.", expression: "Chin slightly raised, controlled authority without dominance." },
    the_face: { pose: "Mid-step walking posture frozen in a natural editorial moment.", expression: "Direct eye contact with calm, controlled presence." },
    purple: { pose: "Minimal seated posture, straight spine, controlled leg positioning.", expression: "Eyes gently lowered, introspective but neutral mood." },
    dazed: { pose: "One shoulder slightly lowered, breaking symmetry naturally.", expression: "Emotionless, cool editorial expression, minimalist fashion mood." },
    w_korea: { pose: "One arm softly framing the torso without blocking garment structure.", expression: "Neutral expression, relaxed facial muscles, no visible emotion." },
    numero: { pose: "Still, sculptural posture inspired by architectural balance and symmetry.", expression: "Emotionless, cool editorial expression, minimalist fashion mood." },
    cr_fashion: { pose: "Torso subtly rotated while hips remain forward, creating natural garment tension.", expression: "Neutral expression, relaxed facial muscles, no visible emotion." },
    another: { pose: "Still, sculptural posture inspired by architectural balance and symmetry.", expression: "Blank, adaptable expression suitable for multiple editorial contexts." },
    sleek: { pose: "Body aligned diagonally to camera, creating visual depth without distortion.", expression: "Quiet confidence conveyed through still facial expression." },
    i_d: { pose: "One foot stepping slightly forward, natural walking pause, controlled motion.", expression: "Eyes alert but calm, aware presence without emotion." },
    popeye: { pose: "One hand resting naturally inside pocket, relaxed and understated.", expression: "Natural resting face, no posing or exaggeration." },
    ginza: { pose: "Standing with ankles loosely crossed, casual editorial balance.", expression: "Eyes alert but calm, aware presence without emotion." },
    russh: { pose: "Body gently leaning against an invisible vertical plane, relaxed yet intentional.", expression: "Eyes softly focused, calm gaze, minimal facial tension." },
    elle: { pose: "Classic contrapposto stance, weight shifted naturally to one leg, subtle hip angle.", expression: "Neutral expression, relaxed facial muscles, no visible emotion." },
    spur: { pose: "Weight shifted slightly backward, elongating front garment lines.", expression: "Lips gently closed, subtle confidence without tension." },
    vogue_italia: { pose: "Classic contrapposto stance, weight shifted naturally to one leg, subtle hip angle.", expression: "Chin slightly raised, controlled authority without dominance." },
    vanity_fair: { pose: "Still, sculptural posture inspired by architectural balance and symmetry.", expression: "Serious expression without frown, composed and intentional." },
    new_yorker: { pose: "Minimal seated posture, straight spine, controlled leg positioning.", expression: "Looking slightly past the camera, detached and composed." },
    cosmopolitan: { pose: "One shoulder slightly lowered, breaking symmetry naturally.", expression: "Lips gently closed, subtle confidence without tension." },
    love: { pose: "Classic contrapposto stance, weight shifted naturally to one leg, subtle hip angle.", expression: "Slight intensity in eyes, restrained and editorial." },
    lofficiel: { pose: "Still, sculptural posture inspired by architectural balance and symmetry.", expression: "Serious expression without frown, composed and intentional." },
    luomo_vogue: { pose: "Still, sculptural posture inspired by architectural balance and symmetry.", expression: "Chin slightly raised, controlled authority without dominance." },
    vogue_scandinavia: { pose: "Upright neutral standing posture, weight evenly distributed, relaxed shoulders.", expression: "Neutral expression, relaxed facial muscles, no visible emotion." },
};
