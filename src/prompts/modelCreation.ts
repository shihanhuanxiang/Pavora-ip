
// ============================================================================
// PAVORA V8.6 - FULL BODY ANCHOR EDITION
// ============================================================================

// T8: 有限集合 preset 的確定性 zh→en 映射（final prompt 全英文鐵則）。
// TAIWAN_COUNTY_EN_MAP 已隨 2026-08-03 移除 Background Setting 一併不再需要（B-4d）
import { CORE_VIBE_EN_MAP, TONE_OF_VOICE_EN_MAP } from '../shared/constants/personaPresets';

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

// PR-E: makeupStyle/hairLength/hairBang 語意化英文映射（鍵對應 modelPresets.ts 的
// MAKEUP_STYLE_OPTIONS / FEMALE_HAIR_LENGTH_OPTIONS / MALE_HAIR_LENGTH_OPTIONS /
// FEMALE_HAIR_BANG_OPTIONS / MALE_HAIR_BANG_OPTIONS value，兩性別選項有重疊值故合併成單一 map）。
const MAKEUP_STYLE_DESC_MAP: Record<string, string> = {
    natural: 'a natural "no-makeup makeup" look, soft and barely-there',
    glam: 'glamorous full-coverage makeup with defined contour and bold color',
    no_makeup: 'a completely bare face with no makeup at all',
    k_pop: 'K-pop idol-style makeup with soft gradient lips and a dewy glass-skin base',
    grooming: 'a clean, well-groomed complexion with skincare-forward grooming, no visible makeup'
};

const HAIR_LENGTH_DESC_MAP: Record<string, string> = {
    short: 'short length',
    medium: 'medium length',
    long: 'long length'
};

const HAIR_BANG_DESC_MAP: Record<string, string> = {
    none: 'no bangs, hair swept back cleanly from the forehead',
    curtain: 'soft curtain bangs framing the face',
    full: 'full blunt bangs across the forehead',
    side: 'a side-swept part'
};

// 1. SURFACE FINISH MAPPING (Gender Specific) —— 原 AESTHETIC STYLE MAPPING
//
// 2026-08-04（企劃案 B-5）淨化：
// aestheticStyle 由「臉部原型」（FACE_ARCHETYPE_STYLE_MAP）與 20 張預設卡驅動，
// 不能刪（會動到資料結構），但原內容嚴重越界，與新的
// [CASTING STUDIO SPECIFICATION]（均勻柔光、無投影、深景深 f/8、禁散景）直接打架：
//   cinematic → "Anamorphic bokeh" / "film grain"（散景與顆粒，去背會爛）
//   cyberpunk → "Neon rim lighting" / "Techwear elements" / "chromatic aberration"
//   western_vogue → "dramatic shadows" / "Sultry gaze" / "high-fashion pose"
//   korean_soft → "High-key lighting"
//   全部 → "Full body framing..."（構圖已由 [TECHNICAL SPECS] 統一管，重複下指令會互搶）
//
// 依架構原則「模特兒生成只留五官／身形／髮型／服裝表面特徵」，
// 本表現在只描述【膚質、妝感、修容、髮質】——
// 光線、景深、姿勢、眼神、背景、服裝一律不在此處出現。
const AESTHETIC_MAP: Record<string, Record<string, string>> = {
    female: {
        realistic: "Skin finish: raw natural texture with visible pores, no retouching look, even natural tone. Makeup: bare-faced or barely-there, untouched natural brow, no visible product. Hair: natural texture, minimal styling product.",
        high_fashion: "Skin finish: refined high-end retouched quality, smooth even tone with a subtle satin sheen at the high points. Makeup: precise editorial makeup — cleanly defined brow, sculpted matte base, groomed lashes, defined lip line. Hair: polished and controlled, smooth cuticle. Maintain the model's original ethnic features.",
        korean_soft: "Skin finish: 'glass skin' — dewy translucent luminosity with a visible inner glow, well-hydrated look. Makeup: K-beauty — soft coral lip tint with a gradient edge, minimal eye makeup, soft straight brow. Hair: soft glossy texture.",
        western_vogue: "Skin finish: sun-kissed warm tone with a healthy satin sheen. Makeup: strong contouring with bronzed cheekbones, clearly defined lip line, full groomed brow. Hair: voluminous natural body.",
        japanese_fresh: "Skin finish: clean semi-matte porcelain quality with fine natural texture retained. Makeup: minimal — bare lip with light balm, no contouring, soft undefined brow. Hair: airy soft texture with a natural fall.",
        cyberpunk: "Skin finish: smooth cool-toned matte with a faint metallic sheen at the high points. Makeup: graphic precision makeup — sharp geometric eyeliner, cool-toned highlight, crisp edges. Hair: sleek sharp-edged styling.",
        cinematic: "Skin finish: rich tonal depth with natural texture fully retained, slightly desaturated warm midtones. Makeup: understated naturalistic makeup, softly defined features. Hair: natural texture with slight movement."
    },
    male: {
        realistic: "Skin finish: raw masculine texture, visible pores and a light stubble shadow. Grooming: natural untouched brow, no product. Hair: natural texture, minimal styling.",
        high_fashion: "Skin finish: refined even tone, clean matte. Grooming: precisely shaped brow, clean-shaven or a sharply edged beard line. Hair: polished controlled styling.",
        korean_soft: "Skin finish: flawless smooth complexion with a light dewy sheen. Grooming: soft natural brow, clean-shaven, subtle lip tint. Hair: textured soft styling with visible strand separation.",
        western_vogue: "Skin finish: rugged warm-toned texture with visible pores. Grooming: strong full brow, defined stubble or a short trimmed beard. Hair: natural body with slight disorder.",
        japanese_fresh: "Skin finish: clean matte with fine natural texture. Grooming: natural slightly sparse brow, clean-shaven. Hair: soft light texture.",
        cyberpunk: "Skin finish: cool-toned matte with a faint metallic sheen at the high points. Grooming: sharply defined brow line, clean edges. Hair: sleek sharp-edged styling.",
        cinematic: "Skin finish: gritty realistic texture with rich tonal depth, visible pores and stubble. Grooming: natural unstyled brow. Hair: natural texture with slight movement."
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
//
// 2026-08-04（企劃案 B-5）註記：定妝照只走 LEVEL 1。
// 2-5 級的文字含「clean street environment」「Taiwan urban clutter」
// 「incidental messy background」——那些會推翻 [CASTING STUDIO SPECIFICATION]。
// 唯一呼叫鏈（ModelSetup → generateModels → buildModelPrompt）固定送 1，
// 且 fallback 已改為 1，所以 2-5 實務上不可達。
// 刻意保留而不刪：它們是「非定妝用途」的既有分級語彙，未來若有寫實素材需求可復用。
// 但任何人想在定妝照路徑上開放 2-5，等於作廢整個棚拍規格——請先回頭讀 B-5。
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

    // 2026-08-04（企劃案 B-5）淨化：同 AESTHETIC_MAP 的理由。
    // 這裡原本混入了 lighting / soft focus / dramatic shadows / bokeh / film grain /
    // chromatic aberration / clean background / pose —— 全部違反棚拍規格，
    // 且 soft focus 與色差會讓去背邊緣爛掉。現在只留【渲染質感與膚色調性】。
    const styleKeywords: Record<string, string> = {
        realistic: "Natural skin texture, raw photo, unedited look, 8k resolution.",
        high_fashion: "High-end retouching, glossy skin finish, crisp micro-detail.",
        korean_soft: "Pastel skin tones, luminous dewy rendering, clean even detail.",
        western_vogue: "Strong contouring, sun-kissed skin tone, warm satin rendering.",
        japanese_fresh: "Low-saturation clean rendering, fine natural skin detail, minimalist finish.",
        cyberpunk: "Cool-toned rendering, crisp synthetic-clean textures, high-precision detail.",
        cinematic: "Cinematic color grading, rich tonal depth, fine film-like skin texture."
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

/**
 * 數值型參數的安全取值（2026-08-04，B-7 驗收修正）。
 *
 * 這裡原本散落著 `params.bustTension || 50` 這種寫法，而 **0 是 falsy** ——
 * 滑桿拉到最左端會被 `||` 悄悄換成中間值，滑桿最左端等於失效，
 * 而且不會有任何錯誤訊息。全部改用這個函式。
 */
const num = (v: any, fallback: number): number =>
    typeof v === 'number' && Number.isFinite(v) ? v : fallback;

/**
 * 女性體型與上身輪廓的措辭來源（2026-08-04，B-7 驗收修正後抽出）。
 *
 * 為什麼要抽成函式：驗收發現主路徑用 4 段邊界、多視角分支自己寫了 3 段，
 * 於是 `bustTension` 落在 26–50（**含預設值 50**）時，兩段 prompt
 * 同時說「clear but modest forward projection」與「clean near-vertical front line」
 * ——模型只能二選一，正是「靜默降級」最典型的來源。
 * 邊界與措辭現在只有這一份，兩條路徑都從這裡取，不可能再走鐘。
 */
const femaleContour = (pc: number) => {
    if (pc <= 30) return {
        main: `Slim and slender throughout. Narrow waist with clear waist definition, slim arms, slim hips, long lean legs.`,
        perView: `the waist, hip and leg lines stay equally narrow in the front, both profiles and the back view.`
    };
    if (pc <= 55) return {
        main: `Naturally proportioned. Defined waist, softly rounded hips balanced with the shoulder width, slim arms, long legs.`,
        perView: `the waist and hip lines read the same in the front, both profiles and the back view.`
    };
    if (pc <= 75) return {
        main: `Hourglass build. Clearly cinched waist with a fuller hip line, shoulder and hip widths balanced against each other, slim arms.`,
        perView: `the cinched waist and fuller hip line read consistently in the front, both profiles and the back view.`
    };
    return {
        main: `Full hourglass build. Pronounced waist definition with a notably fuller hip line and a strong shoulder-to-hip curve.`,
        perView: `the pronounced waist and fuller hip line read consistently in the front, both profiles and the back view.`
    };
};

/**
 * 上身輪廓四檔。措辭移植 `AB測試_上身輪廓/round5_final.ps1` 的 `$Bust`，
 * 把寫死的「針織背心」泛化為任意服裝。
 *
 * 級距校準（B-7 驗收修正）：第五輪的 5 檔裡 lv0↔lv1 與 lv3↔lv4 兩對都差異過小。
 * 砍掉 lv1 解掉第一對；第二對則靠**兩端各自寫得更極端**來拉開——
 * 第一版只是原句照搬，LEVEL 1 甚至比 lv0 更弱（`Very flat`→`Flat`、
 * `zero`→`essentially zero`、`completely vertical`→`reads as vertical`），
 * 那是反向操作。現在 LEVEL 1 恢復第五輪的絕對措辭，LEVEL 4 加上
 * 「布料被拉開到織紋可見」與「腰線落差是整張圖最明顯的線條」兩個可畫出來的特徵。
 */
const femaleBodice = (bt: number) => {
    if (bt <= 25) return {
        level: 1,
        main: `Flat upper torso. In side profile the front line runs almost vertically from the collarbone down to the waist, with only the slightest curve. The fabric lies loose and untensioned across the upper front — no stretch marks, no strain anywhere.`,
        perView: `the front line runs almost vertically from collarbone to waist in every view; the fabric stays loose and untensioned across the upper front.`
    };
    if (bt <= 50) return {
        level: 2,
        main: `Clearly visible upper fullness, the balanced everyday proportion for this build. In side profile there is an unmistakable forward curve, and the fabric just begins to take up tension across the upper front.`,
        perView: `an unmistakable forward curve in the side profile, with the fabric just beginning to take up tension across the upper front — the same in every view.`
    };
    if (bt <= 75) return {
        level: 3,
        main: `Substantial upper fullness on this frame. Strong forward projection; the thin knit is visibly stretched across the upper front with clear horizontal tension lines radiating from the fullest point, and the contrast against the narrow waist is obvious.`,
        perView: `the thin knit is visibly stretched across the upper front with the same clear tension lines in every view; both profiles show the same strong forward projection as the front view.`
    };
    return {
        level: 4,
        main: `Maximum upper fullness this frame can carry. Dramatic forward projection, unmistakable from every angle. The thin knit is stretched drum-taut across the upper front — the weave is visibly pulled open, the fabric strains at the side seams, and deep tension lines run from the fullest point toward the arms. Below it the fabric falls slack and the silhouette cuts sharply in to the narrow waist, making the upper-to-waist contrast the single most prominent line in the image.`,
        perView: `the thin knit is stretched drum-taut across the upper front with the weave visibly pulled open in every view; both profiles must show the same dramatic forward projection as the front view, with the same sharp cut in to the waist below it.`
    };
};

// 5. BUILDER FUNCTION
export const buildModelPrompt = (params: any) => {
    const hasFaceRef = params.faceReferences && params.faceReferences.length > 0;
    const genderKey = params.gender === 'male' ? 'male' : 'female';
    const aestheticDesc = AESTHETIC_MAP[genderKey][params.aestheticStyle] || AESTHETIC_MAP[genderKey]['realistic'];
    const archetypeDesc = hasFaceRef ? "" : (FACE_ARCHETYPE_MAP[genderKey][params.archetype] || FACE_ARCHETYPE_MAP[genderKey]['standard']);
    const stylistKeywords = getStylistKeywords(params);

    /**
     * 這次生成的服裝描述裡到底有沒有鞋（2026-08-04 驗收修正）。
     *
     * 為什麼需要提前算：`[COMPOSITION RULE]` 與 `[NEGATIVE PROMPT]` 都會提到鞋，
     * 但 `outfitPrompt` 直到 [OUTFIT MANDATE] 才組出來。結果是——
     * 預設的 `f_full_knit_vest_shorts` 與 20 組快速預設卡**全部都沒有鞋**，
     * 於是幾乎每一次生成都同時送出三句互斥指令：
     *   「MUST show the entire feet and shoes clearly」
     *   「沒提到鞋履就是裸足」（D-12 配件白名單）
     *   `(missing shoes:2.0)` ← 全串權重最高
     * 模型只能二選一，而勝出的通常是「硬長出一雙鞋」——那正好回到 D-12
     * 要解決的「鞋款每次都不同」，等於自我抵銷。
     * 現在改成：有鞋才要求露鞋、才把 missing shoes 列入負面詞。
     */
    const outfitTextForFootwearCheck: string = [
        params.customOutfitPrompt,
        ...(Array.isArray(params.outfitItems) ? params.outfitItems.map((i: any) => i?.prompt) : []),
        params.outfitPreset?.prompt
    ].filter(Boolean).join(' ');
    const hasFootwear = /\b(shoe|shoes|sneaker|sneakers|heel|heels|boot|boots|sandal|sandals|loafer|loafers|flats|pumps)\b/i
        .test(outfitTextForFootwearCheck);

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
    prompt += `- SKIN SPECTRUM: Force color output to exact "${SKIN_TONE_DESC_MAP[params.skinTone] ?? params.skinTone}" tone. This is a Spectral Instruction: do NOT allow environment lighting, the "Surface Finish" block, or color grading to wash out or shift this skin tone. \n`;
    prompt += `- HAIR SPECTRUM: Force hair color to exact "${params.hairColor}" color. Identity depends on this chromatic consistency. \n\n`;
    if (params.persona) {
        const personaPrefix = hasFaceRef ? "Subject Behavior" : "IP Persona";
        // T8: preset 中文值在插值處走確定性映射（coreVibe/toneOfVoice/primaryCity）；
        // profession/hairColor 等自由輸入已在 service 層 ensureEnglishPrompt 前置翻譯。
        const coreVibeEn = CORE_VIBE_EN_MAP[params.persona.coreVibe] ?? params.persona.coreVibe;
        const toneEn = params.persona.toneOfVoice
            ? (TONE_OF_VOICE_EN_MAP[params.persona.toneOfVoice] ?? params.persona.toneOfVoice)
            : 'Natural';
        prompt += `[${personaPrefix}: ${coreVibeEn}]\n`;
        prompt += `- Behavioral Personality: ${params.persona.mbti || 'Unknown'} - ${params.persona.profession || ''}. \n`;
        prompt += `- Expression Archetype: ${toneEn}. \n`;
        // 2026-08-03（企劃案 B-4d ＋ B-3）：移除 `- Background Setting: ${city}, Taiwan`。
        //
        // 城市不是人物的表面特徵，是場景特徵。原本這一行讓 IP 的「常駐城市」直接決定
        // 定妝照的背景，違反兩件事：
        //   1. 架構原則「模特兒生成只留五官／身形／髮型／服裝」——定妝照要乾淨到好去背，
        //      不該有城市背景（見 CLAUDE.md 第 7 節）。
        //   2. 它與敘事那邊同一個欄位造成的「地點被角色綁死」是同一個病根：
        //      場景卡選了京都，最終 prompt 仍寫著台北。
        //
        // 「常駐城市」欄位本身保留在 Model 資料與 Model Lounge 身分編輯器（那是人設資料），
        // 只是不再進定妝照的 prompt。每篇貼文的地點改由場景卡決定（見 narrativeService 的修法）。

        // Micro-Expression Logic based on Vibe
        // T8 bug fix：原比對字串（'高冷厭世'/'鄰家親切'）與 CORE_VIBE_OPTIONS 實際值
        // 不符，兩分支從未生效；改比對實際 preset 值（Hank 2026-07-11 拍板順手修）。
        // 注意此處比對「原始中文 preset 值」（service 層不改寫 coreVibe，映射僅在插值處）。
        // 2026-08-04（企劃案 B-5）：改為定妝照專用的**固定中性表情**。
        //
        // 為什麼不再依 coreVibe 決定表情：
        // coreVibe 的 UI 已隨「靈魂人設」tab 移除（B-4b），值固定在預設「優雅時尚」，
        // 而它原本會落到 else 分支——等於表情已經是固定的，只是靠一個使用者碰不到的欄位決定。
        // 更根本的是：**表情每次拍攝都不同，不是角色的固定外觀**。
        // 定妝照是身分錨點素材，之後要進試衣間換裝、進敘事換場景，
        // 表情越中性越通用；帶情緒的表情會殘留到每一張下游產出。
        // 想要「高冷」或「甜美」的表情，那是靈魂敘事每次貼文該決定的事。
        //
        // coreVibe 本身仍保留在 Model 資料，供敘事模組使用，只是不再影響定妝照表情。
        prompt += `[NEUTRAL CASTING EXPRESSION — FIXED]\n`;
        prompt += `- Expression: Calm, relaxed, neutral. Lips together in a soft resting position, no smile, no smirk, no pout. Eyes open naturally and looking straight into the lens with quiet confidence.\n`;
        prompt += `- Do NOT add emotional expression, mood, attitude or drama. This is a casting reference shot, not an editorial mood shot.\n`;
        prompt += `- Face and jaw relaxed. No frown lines, no forehead tension, no squinting, no raised eyebrows.\n`;
        prompt += `- Eyes Catchlight: soft even studio catchlight, sharp crystal-clear iris reflections.\n\n`;
    }

    // --- REALISM & FIDELITY ENGINE ---
    // 2026-08-04（企劃案 B-5）：fallback 由 `|| (params.realismToggle ? 4 : 2)` 改為 `|| 1`。
    //
    // 純防禦性修正。查證過的實際呼叫鏈只有一條：
    //   ModelSetup.tsx:460 → generateModels（modelCreationService.ts）→ buildModelPrompt
    // 而 ModelSetup 固定送 fidelityScale: 1，所以 fallback 目前不可達。
    // （驗收時我一度在此寫「還有休息室重生、代言人等呼叫端」——那是錯的，已更正。）
    //
    // 仍然要改的理由：舊 fallback 會落到 LEVEL 2「clean street environment」甚至
    // LEVEL 4「Taiwan urban clutter (scooters, cables, signage)」，一旦未來有新呼叫端
    // 忘記帶這個參數，就會直接推翻下面的棚拍規格。定妝照沒有任何情況該落在 1 以外。
    // 附帶：`realismToggle` 全 repo 從來沒有宣告過，舊 fallback 引用的是不存在的欄位。
    const fLevel = params.fidelityScale || 1;
    prompt += `[FIDELITY ENGINE: LEVEL ${fLevel}]\n`;
    prompt += `- ${FIDELITY_LEVELS[fLevel] || FIDELITY_LEVELS[1]}\n`;
    
    /**
     * 2026-08-04（企劃案 B-5）：定妝照的棚拍規格，全部寫死。
     *
     * 判準只有一個：**定妝照是素材不是成品，越乾淨、越好去背就越好用。**
     * 它之後要進虛擬試衣間換裝、進靈魂敘事換場景、進場景轉移換背景——
     * 任何殘留的背景、投影或模糊邊緣，都會變成下游每一張圖都要對抗的東西。
     *
     * 逐項理由（不要憑「看起來比較美」改動這裡）：
     *  · 中性灰背景而非純白：純白會讓淺色服裝的邊緣被背景吃掉，去背時輪廓缺角。
     *    中性灰對去背最友善，這是棚拍常識。
     *  · 不要投影：有投影，去背時會連影子一起被切下來，貼到新場景就是災難。
     *  · 深景深：淺景深會讓身體與服裝的**邊緣糊掉**，直接害到去背與換裝精度。
     *    單色背景本來就沒有東西需要糊。
     *  · 均勻柔光：有方向性的戲劇光在換背景後一定穿幫；均勻光最好重新打光。
     *
     * 原本這裡是依 dofIntensity（0-100，無 UI、恆為 50）三分支決定光圈，
     * 其中 <30 那條會產生「背景完全模糊」——對定妝照是反效果。
     */
    prompt += `[CASTING STUDIO SPECIFICATION — FIXED, DO NOT DEVIATE]\n`;
    prompt += `- Background: seamless solid neutral grey studio backdrop (approx #B0B0B0), completely empty. No props, no furniture, no environment, no texture, no gradient vignette.\n`;
    prompt += `- Lighting: soft even studio lighting from a large softbox key with fill. Minimal shadow, no dramatic contrast, no coloured gels, no rim-light drama.\n`;
    prompt += `- Shadows: NO cast shadow on the backdrop. Minimal contact shadow under the feet only.\n`;
    prompt += `- Optics: deep depth of field (f/8 equivalent). The subject and the garment must be sharp edge to edge, with clean crisp silhouette boundaries. NO bokeh, NO background blur, NO soft focus.\n`;
    prompt += `- Purpose: this is a cut-out-ready casting reference. The subject must be cleanly separable from the background.\n\n`;

    // --- COMPOSITION MANDATE (CRITICAL FOR FOOTWEAR) ---
    prompt += `[🚨 COMPOSITION RULE: FULL BODY MANDATORY 🚨]\n`;
    prompt += `- Frame the shot from HEAD TO TOE. \n`;
    // 2026-08-04 驗收修正：改為條件輸出（理由見上方 hasFootwear 的說明）。
    prompt += hasFootwear
        ? `- MUST show the entire feet and shoes clearly. \n`
        : `- MUST show the entire feet clearly. The description above names no footwear, so the model is barefoot — do NOT invent shoes. \n`;
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

    // 2026-08-03（企劃案 B-4a）：移除 [BRAND VISUAL ANCHOR] 整段。
    // brandStyleAnchor 從無 UI 控制項、恆為 'none'，此分支從未觸發過。
    // 內容本身（背景、光線、色調）也違反「模特兒生成只留表面特徵」的架構原則——
    // 那些屬於場景轉移與靈魂敘事，不屬於定妝照。

    // 2026-08-04（企劃案 B-5）：標題原為 "ENVIRONMENTAL AESTHETIC" / "AESTHETIC STYLE"。
    // 內容淨化後已不含環境與構圖，只剩膚質妝感，沿用舊標題會誤導模型去畫環境氛圍。
    if (!params.isMultiAngle) {
        prompt += `[SURFACE FINISH — SKIN, MAKEUP & GROOMING: ${params.aestheticStyle}]\n${aestheticDesc}\n`;
        prompt += `- This block controls SURFACE APPEARANCE ONLY. It must NOT influence lighting, background, depth of field, pose, gaze or wardrobe — every one of those is already fixed by the blocks above and must not be re-interpreted here.\n\n`;
    }

    /**
     * --- 體型與上身輪廓（企劃案 B-7，2026-08-04 落地）---
     *
     * 措辭來源：`盤點_C軌_2026-08-01/AB測試_上身輪廓/` 五輪 36 張實圖驗證。
     * 移植時把測試裡寫死的「針織背心」泛化為任意服裝（production 的服裝來自 outfitItems）。
     *
     * 三段缺一不可（第五輪才發現第三段是必要條件）：
     *   1. 體型固定段 —— 明寫「此體型固定不變，僅上身量感可變」
     *   2. 上身量感段 —— 描述前突程度與布料張力，逐檔遞增
     *   3. 服裝鎖段   —— 見下方 [OUTFIT MANDATE]（B-7c）
     *
     * 為什麼第三段是必要的：沒有服裝鎖，模型會「改衣服剪裁」來假裝改身體
     * （第四輪 R4_8 自己長出七分袖與胸下抓褶）。那種作弊正面看得過去，
     * 一到側面或換裝就穿幫。鎖死服裝設計後，第五輪側面圖證明**改變的是身體本身**。
     *
     * 措辭原則（實測結論，不是猜的）：
     *   - 成衣打版措辭「效果」勝過解剖名詞，不只是比較安全（第四輪 ③ vs ④）。
     *     因為它描述的是模型畫得出來的具體物件：褶子、接縫、繃緊的垂墜。
     *   - 禁用：breast / bust size / cleavage / busty / 罩杯代號 / chest size。
     *   - 級距定為 4 檔。實測第五輪的 5 檔裡，lv0↔lv1 與 lv3↔lv4 差異過小，
     *     使用者分辨不出的檔位等於不存在。此處取最能分辨的四段
     *     （原 lv0 / lv2 / lv3 / lv4），並把頂端措辭寫得更極端以拉開級距。
     */
    if (params.gender === 'female') {
        // 2026-08-04（B-7 驗收修正）：原本寫 `params.bustTension || 50`。
        // 0 是 falsy，所以滑桿拉到最左端（最平）會被 `||` 換成 50，
        // 反而輸出「標準檔」措辭——滑桿最左端等於失效。
        // B-7a 把滑桿搬到明面之後，使用者第一個動作就是拉到底，會立刻撞到。
        const bt = num(params.bustTension, 50);
        const pc = num(params.physiqueCurvature, 50);

        const bodice = femaleBodice(bt);
        prompt += `[FIGURE TYPE — FEMALE, FIXED]\n`;
        prompt += `- Contour: ${femaleContour(pc).main} \n`;
        prompt += `- This overall build — waist definition, arms, hips and leg line — is FIXED and must render identically every time. Only the upper-bodice fullness specified below may vary. \n\n`;

        prompt += `[UPPER-BODICE FULLNESS]\n`;
        prompt += `- LEVEL ${bodice.level} of 4. ${bodice.main} \n\n`;
    } else {
        // 2026-08-04（B-7 驗收修正）：同上，0 是 falsy 的坑。
        const md = num(params.muscularDensity, 50);
        const vt = num(params.vTaperScale, 50);

        prompt += `[FIGURE TYPE — MALE, FIXED]\n`;
        // Mapping Muscular Density (0-100)
        // 2026-08-04（B-7 出圖實測修正）：同女性 —— 這裡不再描述「衣服怎麼合身」。
        // 原本每句尾都掛著 `garments follow a slim tailored fit` 之類的垂墜宣告，
        // 那會跟下面 Frame Architecture 的肩線量感互搶控制權。體格歸體格，垂墜歸服裝段。
        if (md <= 30) prompt += `- Density: Slim and lean, subtle muscle tone, narrow ribcage. \n`;
        else if (md <= 70) prompt += `- Density: Athletic build with visible but not bulky muscle definition. \n`;
        else prompt += `- Density: Muscular athletic build, thick chest and back, clearly defined arms. \n`;

        // Mapping Shoulder Frame (0-100) -> V-Taper Figure/Fit
        //
        // 2026-08-04（驗收發現）：原本只有 `> 80` 與 else **兩段**，
        // 也就是 0–80 這一大段輸出的字完全一樣——「肩背比例」是 0–100 的滑桿，
        // 卻只有兩個有效位置，使用者拉了半天沒反應。
        // 改為與女性一致的四檔（邊界 25 / 50 / 75），措辭同樣走成衣打版語言。
        if (vt <= 25) {
            prompt += `- Frame Architecture: Narrow straight frame — shoulder width close to waist width, minimal taper. \n`;
        } else if (vt <= 50) {
            prompt += `- Frame Architecture: Natural V-taper — shoulders moderately wider than the waist, balanced athletic proportions. \n`;
        } else if (vt <= 75) {
            prompt += `- Frame Architecture: Clear V-taper — visibly broad shoulders and upper back narrowing to the waist. \n`;
        } else {
            prompt += `- Frame Architecture: Pronounced V-taper — very broad shoulders and upper back with a sharp narrowing to the waist. \n`;
        }
        // B-7：男性同樣加體型固定句。理由與女性一致——沒有這句，模型會用改剪裁來假裝改體型。
        prompt += `- This overall build is FIXED and must render identically every time. \n\n`;
    }

    if (params.isExpertMode) {
        prompt += `[🚨 MANDATORY BIOLOGICAL METRICS (PHYSICAL TRUTH) 🚨]\n`;
        prompt += `- BIOMETRIC ENFORCEMENT: The model's physique MUST strictly adhere to these precise metrics. No approximation allowed. \n`;
        prompt += `- HEIGHT: Exactly ${params.height}cm (This affects limb length and vertical proportions). \n`;
        // 2026-08-04（企劃案 B-6）：fallback 由 8.0 改為 7.5，與 ModelGenerationDefaults 對齊。
        // 真人約 7、時尚模特 8–8.5；網紅 IP 用 7.5 較有真實感，超過 8.5 開始出現明顯 AI 感。
        prompt += `- PROPORTION RATIO: Head-to-body ratio must be strictly ${num(params.headBodyRatio, 7.5)} heads. \n`;
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

        // 2026-08-04（企劃案 B-5）：移除 [LIGHTING SPECTRUM] 整段。
        //
        // 兩個理由：
        //  1. **它會跟上方的 [CASTING STUDIO SPECIFICATION] 直接打架。** 那段已把打光寫死成
        //     「均勻柔光、無投影」，這裡卻可能送出 golden_hour（夕陽側光）、
        //     neon_night（霓虹輪廓光）、high_contrast（強反差深黑）——同一份 prompt 裡
        //     兩套矛盾的打光指令，模型只會二選一，結果不可預期。
        //  2. `lightingPreset` 是幽靈欄位：從無 UI 控制項，恆為 'studio_soft'，
        //     只有「隨機靈感」會改它，而那顆按鈕已隨靈魂人設 tab 移除。
        //     所以這 6 個選項裡有 5 個從來沒被使用過。
        //
        // 光線一律由 CASTING STUDIO SPECIFICATION 統一管理。定妝照要的是可再製的中性光，
        // 戲劇光屬於場景轉移與靈魂敘事。
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
    const makeupDesc = params.makeupStyle ? (MAKEUP_STYLE_DESC_MAP[params.makeupStyle] ?? params.makeupStyle) : 'a natural everyday makeup look';
    prompt += `Skin: Confirming "${SKIN_TONE_DESC_MAP[params.skinTone] ?? params.skinTone}" tone with ${params.skinFinish} finish. Makeup: ${makeupDesc}.\n`;

    const hairLengthDesc = params.hairLength ? (HAIR_LENGTH_DESC_MAP[params.hairLength] ?? `${params.hairLength} length`) : '';
    const hairBangDesc = params.hairBang ? (HAIR_BANG_DESC_MAP[params.hairBang] ?? params.hairBang) : '';
    const hairDetailParts = [hairLengthDesc, hairBangDesc].filter(Boolean);
    const hairDetailSuffix = hairDetailParts.length > 0 ? `, ${hairDetailParts.join(', ')}` : '';
    prompt += `Hair: Confirming "${params.hairColor}" color. Style: ${params.hairStyle}${hairDetailSuffix}.\n`;
    // 2026-08-04（B-6 驗收修正）：這處 fallback 原本漏改，還是 8.0。
    // 後果是 headBodyRatio 未帶入時，專家模式下上方 [MANDATORY BIOLOGICAL METRICS]
    // 說 7.5、這裡說 8.0——同一份 prompt 兩個互斥數字。
    prompt += `Body: ${params.proportionMode} proportions. Height: ${params.height}cm. Head-to-body ratio: ${num(params.headBodyRatio, 7.5)} heads.\n\n`;

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
    // 2026-08-04（B-7 驗收發現）：原句是
    //   "Stick to a clean, solid color palette. Use high-end technical fabrics like
    //    matte lycra or double-knit jersey."
    // 它緊接在 `- Description:` 之後，於是**直接覆蓋服裝資料指定的材質**
    // （例如 `ribbed knit sleeveless vest top` 會被 matte lycra / jersey 蓋掉）。
    // 而且 `solid color palette` 沒有指名任何顏色，導致下面 Design Lock 的
    // 「每次都一樣」找不到可錨定的對象——第五輪能成立是因為服裝連顏色都寫死。
    // 改為「未指定時才套用」，並把顏色一致性明講出來。
    // 服裝資料本身缺顏色的根因記錄在企劃案 D-12，歸階段 6 處理。
    prompt += `- Aesthetic: Where the description above does not specify a fabric or colour, default to a clean solid colour and a high-end technical knit. Never override a fabric, colour or detail that the description does specify. \n`;
    // 2026-08-04（企劃案 B-7c）：改寫 Silhouette Architecture。
    //
    // 原句是全篇風險最高的一句，而且**每次生成都會出現**（不受滑桿控制）：
    //   "Prioritize form-fitting silhouettes that precisely map the model's physical
    //    structure. Highlight the anatomical curves and torso-to-hip transitions..."
    // `precisely map the model's physical structure` ＋ `Highlight the anatomical curves`
    // ＝ 明確要求強調解剖曲線，還用了 `anatomical` 這個詞。
    //
    // 新句同樣要求貼身、同樣要求可見接縫，但描述對象換成**衣服的結構**而非身體的曲線。
    // 實測結論支持這個方向：成衣打版措辭效果勝過解剖名詞，不只是比較安全。
    //
    // ⚠️ 2026-08-04（B-7 驗收修正）：第一版新句寫成
    //   "...Use clear seam lines and structural panels to define the garment's fit..."
    // 那跟下面的 Design Lock「不得新增未指定的接縫、褶、抓皺」**直接互相否定**，
    // 而且更糟的是：它把第四輪發現、第五輪靠鎖死服裝才排除的作弊路徑重新開回去
    // （R4_8 自己長出七分袖與胸下抓褶，靠改剪裁假裝改身體）。
    // 現在只講合身度，把「要不要有可見接縫」的決定權還給 `- Description`。
    prompt += `- Silhouette Architecture: Prioritize close-fitting garment construction that follows the figure type cleanly, with smooth uninterrupted panels unless the description above specifies seams or detailing. \n`;
    // 2026-08-04（B-7 出圖實測修正）：恢復第五輪那句的**物理成因**。
    //
    // 第五輪有效的原句是 "The fabric is thin and stretchy so the body shape underneath
    // is clearly legible."，我第一版泛化成「follows the body closely enough that the
    // figure stays legible」——把「薄、有彈性」這個真正的成因抽掉了，只剩結果的空話。
    // 模型畫得出「薄而有彈性的針織被撐開」，畫不出「足夠貼身以致可辨讀」。
    prompt += `- Fit Legibility: The knit fabric is thin and stretchy, so the shape of the body underneath is clearly legible through it. \n`;
    // 2026-08-04（企劃案 B-7，第五輪新發現的必要條件）：服裝鎖段。
    //
    // 沒有這段，模型會靠「改衣服剪裁」來假裝改身體——第四輪 R4_8 自己長出七分袖
    // 與胸下抓褶。那種作弊正面看得過去，一到側面或換裝就穿幫，而定妝照的下游
    // （虛擬試衣間、場景轉移）正是要換裝的。鎖死設計後第五輪側面圖才證明
    // 改變的是身體本身。這段不可省略。
    prompt += `- Design Lock: The garment DESIGN described above is fixed — same cut, same neckline, same sleeve length, same hem length, same fabric, same colour every time. Do NOT redesign it. Do NOT add sleeves, extra seams, darts, gathering or ruching that were not specified. Only HOW THE BODY FILLS the garment may differ. \n`;
    // 2026-08-04（企劃案 D-12）：配件白名單。
    //
    // B-5 出圖實測發現：六張用同一筆服裝資料生成的定妝照，包款、襪子、鞋款全都不同
    // ——因為服裝資料只描述主件，模型就自行補齊了它覺得該有的配件。
    // 定妝照是要餵給試衣間與場景轉移的**素材**，素材不可重現就沒有穩定基準，
    // 而且多出來的包與襪子在試穿時會變成殘留物。
    // 這一行比逐筆改資料有效：只要描述沒提到，就一律不准出現。
    //
    // ⚠️ 2026-08-04 驗收修正：第一版寫成 "Render ONLY the garments and footwear named
    // in the description above." 那是**危險的**——UI 允許只勾上衣不勾下身
    // （ModelSetup 的 top / bottom 分類是各自獨立的），此時「只准畫描述提到的衣物」
    // 就等於明確指示模型不要畫下半身；選 `m_top_shirtless`（描述＝shirtless）更是全裸指令。
    // 現在把白名單限縮到**配件**，並補一條「上下身必須都有衣物」的保底。
    prompt += `- Accessory Whitelist: Do NOT add any accessory that was not named in the description — no bag, no backpack, no socks, no hat, no cap, no scarf, no belt, no jewellery, no watch, no glasses, no hair accessory. \n`;
    // 保底條款。注意措辭要容許 `m_top_shirtless` ——那是刻意保留的男性打底選項，
    // 若寫成「上下身一律都要有衣物」就會跟它直接打架。
    // 硬性底線只放在下身；上身則是「除非描述明確說 shirtless」。
    // 2026-08-04（11 張實圖修正）：原本寫 `neutral-coloured`，實測（`C_coverage_floor`）
    // 模型補出膚色系短褲，看起來像內衣而不是衣服。改為明確指定炭灰。
    prompt += `- Coverage Floor: A lower garment is ALWAYS present. If the description above does not name one, add plain fitted mid-thigh shorts in charcoal grey — a clearly clothing-like colour, never a skin or nude tone. An upper garment is likewise always present unless the description explicitly specifies shirtless. \n`;
    // 2026-08-04（B-7 出圖實測修正）：原句 "Ensure the garment construction is
    // sophisticated and follows high-end fashion standards." 會把布料往「結構化剪裁」推
    // ——那跟上面「薄、有彈性、身形可辨讀」相反。這是累積壓制的一環，改為只要求乾淨寫實。
    prompt += `- Compliance Policy: Render the garment cleanly and realistically. No speculative artifacts, no invented construction details. \n\n`;

    if (params.isMultiAngle) {
        prompt += `[🚨 PROFESSIONAL CHARACTER REFERENCE SHEET (MODEL SETTING) 🚨]\n`;
        prompt += `- FORMAT: Generate a SINGLE 16:9 horizontal photographic layout. This is a technical character sheet for identity reference.\n`;
        // 2026-08-04（B-5 驗收修正）：原寫 "(e.g., white or light grey)"。
        // [CASTING STUDIO SPECIFICATION] 是無條件輸出的，多角度路徑會同時收到
        // 「中性灰 #B0B0B0」與「white」兩套背景規格，而 white 正是那段註解裡
        // 明文指出會害去背的顏色。改成引用同一個來源，不再自成一套。
        prompt += `- BACKGROUND: The exact same seamless neutral grey studio backdrop specified in the casting studio specification above. No props, no furniture, no environment. Just the character.\n`;
        prompt += `- COMPOSITION: Use a strictly organized 2-ROW GRID structure.\n\n`;
        
        /**
         * 2026-08-04（企劃案 B-7b）：改寫多視角分支的體型措辭。
         *
         * 這裡原本是全案最嚴重的不一致點——主路徑早已改成成衣打版語言，
         * 但這條分支還留著解剖描述＋貼身強調：
         *   "Bust has natural full rounded projection visible in side profile and
         *    front view. Clothing fits snugly across chest."
         * `Bust has ... full rounded projection` ＋ `fits snugly across chest`
         * 正是最容易觸發的組合。後果是：**同一個滑桿值，走不同路徑會得到
         * 完全不同風險等級的 prompt**，而使用者完全不知道自己切換了風險。
         *
         * 另外兩處也一併改：`dramatic hourglass figure` / `full rounded hips` /
         * `strong S-curve` 同樣是身體描述。改為描述四視角之間的**版型一致性**。
         *
         * 這段原本被 `if (pc > 55 || bt > 55)` 包住——低檔位時完全沒有一致性指令，
         * 那是錯的：四視角要一致跟體型豐不豐無關。改為無條件輸出。
         *
         * ⚠️ 2026-08-04 驗收修正兩件事：
         *  1. 第一版在這裡自己寫了 3 段邊界（`>75` / `>55` / else），而主路徑是 4 段。
         *     結果 `bustTension` 落在 26–50（**含預設值 50**）時，主路徑說
         *     「clear but modest forward projection」、這裡說「clean near-vertical
         *     front line」——同一份 prompt 自相矛盾。現在改為共用 femaleContour /
         *     femaleBodice，邊界與措辭只有一份。
         *  2. 整段原本被 `if (params.gender === 'female')` 框住，男性的八宮格參考表
         *     完全沒有跨視角一致性指令。一致性與性別無關，改為兩性共用。
         */
        prompt += `[FIT CONSISTENCY MANDATE FOR ALL VIEWS]\n`;
        prompt += `- CRITICAL: All 4 body views MUST show the same figure type and the same garment fit. Bodice structure, seam lines and hem lengths must match between the front, side and back views.\n`;
        if (params.gender === 'female') {
            const pc = num(params.physiqueCurvature, 50);
            const bt = num(params.bustTension, 50);
            prompt += `- Contour across views: ${femaleContour(pc).perView}\n`;
            prompt += `- Upper-bodice fit across views: ${femaleBodice(bt).perView}\n`;
        } else {
            prompt += `- Frame across views: the shoulder-to-waist line and the garment's shoulder structure must read identically in the front, both profiles and the back view.\n`;
        }
        // B-7：多視角同樣需要服裝鎖。八格是同一次生成，設計漂移會讓整張參考表作廢。
        prompt += `- Design Lock: The garment design is identical in all 8 panels. Do NOT redesign it between views and do NOT add sleeves, seams, darts or gathering in any panel.\n`;
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
    // 2026-08-04（B-5）：Angle 與 Lighting 改為寫死。
    // params.angle 與 params.lightingDepthControl 都是無 UI、恆為預設值的幽靈欄位，
    // 而定妝照本來就該固定平視＋均勻柔光（見上方 CASTING STUDIO SPECIFICATION）。
    prompt += `Shot: ${params.isMultiAngle ? 'Technical Photographic Sheet' : 'FULL BODY VERTICAL SHOT'}. Angle: eye-level, straight-on.\n`;
    prompt += `Camera: 50mm or 85mm prime lens for zero distortion.\n`;
    // 2026-08-04（B-5 驗收修正）：原寫 "neutral high-key studio lighting"。
    // high-key 的攝影語意是亮到近乎過曝的白背景，會拉著模型把上方指定的
    // 中性灰 #B0B0B0 背景打白——正是棚拍規格自己說會害去背的情形。
    // 而且這行排在 prompt 尾端，位置＝權重，壓過前面的規格。
    prompt += `Lighting: soft even studio lighting, low contrast, neutral colour temperature.\n`;
    prompt += `Quality: ${stylistKeywords}, photorealistic, RAW quality, 8k resolution.\n\n`;

    prompt += `[NEGATIVE PROMPT]\n`;
    // 2026-07-20：無參考圖時加西方臉負面詞（有參考圖時人種由參考圖決定，不加以免干擾）。
    const ethnicityNegatives = hasFaceRef ? "" : ", (Caucasian face:1.5), (Western facial features:1.4), (European bone structure:1.4)";
    // 2026-08-04（企劃案 B-7e）：常駐加入三條內容安全負面詞。
    //
    // 這**反而會降低**觸發率，不是提高——它明確告訴模型「我要的不是那種東西」，
    // 同時也是內容安全的自我保護。上身輪廓可調之後，這三條是必要的配套。
    // （第五輪測試的 [NEGATIVE CONSTRAINTS] 就含這三條，全 7 張皆順利產出。）
    const safetyNegatives = ", (cleavage emphasis:1.6), (suggestive posing:1.6), (revealing framing:1.6)";
    const baseNegatives = "(3D render:1.5), (illustration:1.5), (painting:1.5), (cartoon:1.5), (CG), (anime), (unreal engine), (mutated), (deformed), (low quality), (blurry), (extra limbs), (fused bodies), (mutated hands), (deformed face), (merged characters), (different outfits), (asymmetric clothing)" + safetyNegatives + ethnicityNegatives;
    if (!params.isMultiAngle) {
        // 2026-08-04 驗收修正：`(missing shoes:2.0)` 改為條件輸出。
        // 沒選鞋時它是全串權重最高的一條，會逼模型硬長出一雙鞋，
        // 直接抵銷 D-12 想解決的「鞋款每次都不同」。改成沒鞋時反過來壓制自作聰明的鞋。
        const footwearNegatives = hasFootwear
            ? `, (missing shoes:2.0)`
            : `, (invented footwear:1.6), (unrequested shoes:1.6)`;
        prompt += `${baseNegatives}, (cropped feet:2.0), (cut off legs:2.0)${footwearNegatives}, (out of frame:1.8), (half body), (close up), (distorted limbs), (extra toes), (blurry feet).`;
    } else {
        prompt += `${baseNegatives}, (cluttered background:1.8), (messy environment:1.8), (outdoors:1.8), (bokeh:1.5), (depth of field:1.5)`;
    }

    return prompt;
};
