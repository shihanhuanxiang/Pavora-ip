import { getGeminiClient } from "../../../shared/services/core/geminiClient";
import { sanitizeFinalPrompt } from "../../../shared/services/promptSanitizer";
import type { Model, DiaryEntry, OutfitV2, ExtendedScene, NonVisualPersona } from "../../../shared/types/types";
import { LOCALIZED_SCENES, getScenesByCity } from "../constants/localizedScenes";

import { OUTFIT_SEEDS_V2 } from "../constants/outfitSeeds";
import { ALLOWED_KEYWORDS_V2, BANNED_KEYWORDS_V2, SUBSTITUTION_TABLE_V2 } from "../constants/promptRules";
import { ALL_EXTENDED_SCENES } from "../constants/extendedScenes";
import { NON_VISUAL_PERSONAS } from "../constants/nonVisualPersonas";
import { DEPTH_MODULES } from "../constants/depthModules";
import { COMPOSER_INJECTION_RULES } from "../constants/injectionRules";
import { WardrobeService } from "./wardrobeService";
import { getPresetById } from '../constants/visualPresets';

/**
 * 將 Visual Preset 的值填入 model 的對應欄位
 * 這是「一鍵填充」函式，Preset 是起點，使用者之後可以繼續手動微調
 */
export const applyVisualPreset = (
    model: Model,
    presetId: string,
    onUpdate: (updates: Partial<Model>) => void
): void => {
    const preset = getPresetById(presetId);
    if (!preset) return;

    onUpdate({
        visualConstants: {
            ...model.visualConstants,
            signaturePoses: preset.visualConstants.signaturePoses,
            stylingFilters: preset.visualConstants.stylingFilters,
            expressionStyle: preset.visualConstants.expressionStyle,
            colorTone: preset.visualConstants.colorTone,
            poseEnergy: preset.visualConstants.poseEnergy,
            catchlightPreference: preset.visualConstants.catchlightPreference,
        },
        preferences: {
            ...model.preferences,
            preferred_archetypes: preset.preferences.preferred_archetypes,
            aesthetic_tier_min: preset.preferences.aesthetic_tier_min,
            aesthetic_tier_max: preset.preferences.aesthetic_tier_max,
            visual_preset_id: presetId,
        }
    });
};

/**
 * Picks an appropriate outfit based on character and scene context.
 */
const pickOutfit = (model: Model, contextInput: string | string[], targetTier: number): OutfitV2 => {
    const contextIds = Array.isArray(contextInput) ? contextInput : [contextInput];

    // 0. Manual override: 使用者鎖定服裝時直接返回
    if (model.preferences?.active_outfit_id) {
        const userOutfits = WardrobeService.getUserOutfits();
        const found = [...OUTFIT_SEEDS_V2, ...userOutfits].find(
            o => o.outfit_id === model.preferences?.active_outfit_id
        );
        if (found) return found;
    }

    // 1. 建立候選池
    const userOutfits = WardrobeService.getUserOutfits();
    const fullPool = [...OUTFIT_SEEDS_V2, ...userOutfits];

    // 2. 硬性篩選：性別
    const genderFiltered = fullPool.filter(o =>
        o.gender === model.gender?.charAt(0).toUpperCase() || o.gender === 'U'
    );

    // 3. 硬性篩選：場景（最高優先，防止西裝出現在海邊）
    const contextFiltered = genderFiltered.filter(o =>
        contextIds.some(contextId => o.compatible_contexts.includes(contextId))
    );

    // Fallback：場景篩選後無結果，放寬到性別篩選
    const candidatePool = contextFiltered.length > 0 ? contextFiltered : genderFiltered;

    // Fallback：候選池仍為空，返回預設
    if (candidatePool.length === 0) return OUTFIT_SEEDS_V2[0];

    // 4. 評分制選擇
    const preferred = model.preferences?.preferred_archetypes || [];
    const recentIds = model.preferences?.recent_outfit_ids || [];

    // 判斷當前季節（台灣月份）
    const currentMonth = new Date().getMonth() + 1; // 1-12
    let currentSeason: string;
    if (currentMonth >= 5 && currentMonth <= 10) {
        currentSeason = 'summer';
    } else if (currentMonth >= 12 || currentMonth <= 2) {
        currentSeason = 'winter';
    } else {
        currentSeason = 'spring_autumn';
    }

    const scored = candidatePool.map(o => {
        let score = 0;

        // 風格吻合（+40分）：style_archetype 在偏好列表裡
        if (preferred.length > 0 && preferred.includes(o.style_archetype)) {
            score += 40;
        }

        // Tier 吻合（+30分）：完全符合目標 Tier
        if (o.aesthetic_tier === targetTier) {
            score += 30;
        }
        // Tier 接近（+15分）：差距 1
        else if (Math.abs(o.aesthetic_tier - targetTier) === 1) {
            score += 15;
        }

        // 季節吻合（+25分）
        const outfitSeason = (o as any).season || 'all';
        if (outfitSeason === 'all') {
            score += 15; // 四季通用給基本分
        } else if (outfitSeason === currentSeason) {
            score += 25; // 完全吻合給高分
        } else if (
            (outfitSeason === 'spring_autumn' && currentSeason !== 'winter') ||
            (outfitSeason === 'summer' && currentSeason === 'spring_autumn')
        ) {
            score += 5; // 相鄰季節給小分
        } else {
            score -= 30; // 季節不符給懲罰分
        }

        // 新鮮獎勵（+10分）：完全沒在最近使用清單裡
        if (!recentIds.includes(o.outfit_id)) {
            score += 10;
        }

        // 冷卻懲罰（-50分）：最近使用過
        if (recentIds.includes(o.outfit_id)) {
            score -= 50;
        }

        return { outfit: o, score };
    });

    // 找最高分
    const maxScore = Math.max(...scored.map(s => s.score));

    // 從最高分的服裝中隨機抽一套（避免每次都選同一套）
    const topCandidates = scored.filter(s => s.score === maxScore);
    const chosen = topCandidates[Math.floor(Math.random() * topCandidates.length)];

    return chosen.outfit;
};

/**
 * Cleans the prompt from banned keywords and applies substitutions.
 */
const cleanPromptV2 = (prompt: string): string => {
    let cleaned = prompt;
    // Apply substitutions
    Object.entries(SUBSTITUTION_TABLE_V2).forEach(([key, sub]) => {
        const regex = new RegExp(key, 'gi');
        cleaned = cleaned.replace(regex, sub);
    });
    // Final hard filter for banned keywords
    BANNED_KEYWORDS_V2.forEach(banned => {
        const regex = new RegExp(`\\b${banned}\\b`, 'gi');
        cleaned = cleaned.replace(regex, '');
    });
    return cleaned;
};

/**
 * Helper to get non-visual traces (Layer 6).
 */
const getNonVisualTraces = (relationshipId: string | null): string => {
    if (!relationshipId) return "";
    const persona = NON_VISUAL_PERSONAS.find(p => p.persona_id === relationshipId);
    if (!persona || persona.visual_traces.length === 0) return "";
    
    // Pick 1-2 random traces
    const traces = [...persona.visual_traces]
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 2) + 1);
    
    return traces.join(', ');
};

/**
 * 手部狀態機率引擎 (QA PATCH #002 Section 4)
 */
const injectHandOccupation = (outfit: OutfitV2): string => {
    const roll = Math.random();
    if (roll < 0.6) { // 60% 一手忙
        return outfit.hand_occupation.left_hand || "one hand holding phone";
    } else if (roll < 0.65) { // 5% 雙手忙
        return outfit.hand_occupation.both_busy ? "both hands occupied with items" : "carrying bags in both hands";
    } else if (roll < 0.9) { // 25% 自然狀態
        return "hands in natural relaxed pose";
    } else { // 10% 極致細節
        return "extreme close-up on fingers touching a texture";
    }
};

/**
 * 材質安全守衛 (QA PATCH #002 Section 3.2)
 */
const getFabricSafeguard = (outfit: OutfitV2): string => {
    if (outfit.fabric_difficulty === 'hard') {
        return ", highly detailed textile weave, sharp garment edges";
    }
    return "";
};

/**
 * Builds the final prompt structure based on v1.1 10-layer拼接規點.
 */
const buildFinalVisualPromptV11 = (
    model: Model, 
    scene: ExtendedScene | any, 
    outfit: OutfitV2, 
    tier: number,
    options?: { isPOV?: boolean }
): string => {
    // Layer 1: character_token
    const vc = model.visualConstants;
    const facialDesc = vc?.facialBoneStructure ? `, ${vc.facialBoneStructure}` : '';
    const professionDesc = model.persona?.profession 
        ? `, works as ${model.persona.profession}` 
        : '';
    const layer1 = model.persona?.locked_descriptor 
        ? `${model.persona.locked_descriptor}${professionDesc}${facialDesc}`
        : `${model.name}, ${model.gender === 'M' ? 'Asian man' : 'Asian woman'}, ${model.age}yo, ${model.persona?.coreVibe || ''}${professionDesc}${facialDesc}`;
    
    // Layer 2: depth_module_scene (if extended)
    const layer2 = (scene && scene.depth_module_id) ? scene.event : "";
    
    // Layer 3: outfit_token
    // POV 模式下跳過 hand_occupation 注入，避免與 Layer 8 衝突
    const handAction = options?.isPOV === true ? "" : injectHandOccupation(outfit);
    const fabricSafe = getFabricSafeguard(outfit);
    const wearStateText = `wear state: ${outfit.wear_state.replace('_', ' ')}`;
    
    // 根據 interests 偶爾加入標誌性道具（30% 機率，POV 模式跳過）
    let interestProp = '';
    const interests = model.lifeCircuit?.interests || [];
    if (interests.length > 0 && Math.random() < 0.3 && !options?.isPOV) {
        const interestPropMap: Record<string, string> = {
            '攝影': 'holding a film camera or mirrorless camera',
            '咖啡': 'holding a specialty coffee cup',
            '閱讀': 'with a paperback book nearby',
            '音樂': 'with wireless earbuds or headphones',
            '瑜珈': 'with a rolled yoga mat nearby',
            '旅行': 'with a travel journal or map',
            '繪畫': 'with a sketchbook nearby',
            '健身': 'with a water bottle',
            '烹飪': 'with a reusable grocery bag',
            '寵物': 'with a pet leash or pet toy visible'
        };
        const matchedInterest = interests.find(i => interestPropMap[i]);
        if (matchedInterest) {
            interestProp = `, ${interestPropMap[matchedInterest]}`;
        }
    }
    
    // iconicItems 視覺簽名（永遠出現，這是 IP 的標誌）
    const iconicItemsDesc = (model.worldAnchors?.iconicItems || [])
        .slice(0, 2) // 最多取前兩個，避免 prompt 過長
        .map(item => item.description || item.name)
        .join(', ');
    const iconicSuffix = iconicItemsDesc ? `, signature items: ${iconicItemsDesc}` : '';

    const layer3 = `${outfit.prompt_skeleton}, ${wearStateText}, ${handAction}${fabricSafe}${interestProp}${iconicSuffix}`;
    
    // Layer 4: scene_token
    const layer4 = scene.promptSkeleton || scene.prompt_skeleton || "";
    
    // Layer 5: festival_layer (stub for now or check category)
    const layer5 = scene.category === "節慶儀式" ? `traditional festival atmosphere` : "";
    
    // Layer 6: non_visual_persona_traces
    const layer6 = getNonVisualTraces(scene.flags?.relationship_layer);
    
    // Layer 7: warmth_phrases (random stub)
    const warmthPhrases = ["gentle heartbeat", "soft breath", "traces of warmth", "subtle human touch"];
    const layer7 = warmthPhrases[Math.floor(Math.random() * warmthPhrases.length)];
    
    // Layer 7_5: visual_dna（IP 視覺 DNA 注入，強制約束語氣）
    let layer7_5 = "";
    const vc7 = model.visualConstants;
    if (vc7) {
        const rules: string[] = [];
        if (vc7.expressionStyle) 
            rules.push(`EXPRESSION MUST BE: ${vc7.expressionStyle}`);
        if (vc7.poseEnergy) 
            rules.push(`POSE ENERGY MUST BE: ${vc7.poseEnergy}`);
        if (vc7.colorTone) 
            rules.push(`COLOR TONE MUST BE: ${vc7.colorTone}`);
        if (vc7.catchlightPreference) 
            rules.push(`LIGHTING STYLE: ${vc7.catchlightPreference}`);

        // 從 persona.toneOfVoice 補充表情能量
        const toneOfVoice = model.persona?.toneOfVoice;
        if (toneOfVoice && !vc7.expressionStyle) {
            rules.push(`EXPRESSION ENERGY: ${toneOfVoice}`);
        }
        if (rules.length > 0) layer7_5 = rules.join('. ');
    }

    // Layer 7_5_BOOST: 強制具體表情動作（避免「無表情看鏡頭」預設值）
    const facialActions = [
        // 喜悅類 (8 個)
        "FACIAL ACTION REQUIRED: bright open-mouth laugh with teeth showing, eyes crinkled into crescents, head slightly tilted back, NOT static smile",
        "FACIAL ACTION REQUIRED: gentle closed-mouth smile with one corner slightly raised, soft warm gaze, NOT serious expression",
        "FACIAL ACTION REQUIRED: eye-smile (eye-crescent) with mouth slightly closed, peaceful joyful energy, NOT wide stare",
        "FACIAL ACTION REQUIRED: mid-laugh single moment caught, mouth open showing joy, eyes squinted naturally, NOT posed smile",
        "FACIAL ACTION REQUIRED: subtle inward smile with lips pressed together happily, cheeks slightly raised, NOT neutral mouth",
        "FACIAL ACTION REQUIRED: warm soft grin with relaxed eyes looking at camera, lived-in happiness, NOT dramatic expression",
        "FACIAL ACTION REQUIRED: silent giggle with one hand half-covering smile, eyes bright, NOT plain pose",
        "FACIAL ACTION REQUIRED: contented closed-eye smile, head slightly down, peaceful energy, NOT eye contact pose",

        // 撒嬌可愛類 (7 個)
        "FACIAL ACTION REQUIRED: pouty kiss face with lips pushed forward gently, soft eyes, NOT neutral expression",
        "FACIAL ACTION REQUIRED: small puffed cheeks puffed-out playfully, lips closed, cute aegyo energy, NOT relaxed face",
        "FACIAL ACTION REQUIRED: head tilted to one side with soft smile, gentle eye contact, NOT straight-on pose",
        "FACIAL ACTION REQUIRED: peace sign V held near cheek with playful smile, classic Asian girl pose, NOT plain standing",
        "FACIAL ACTION REQUIRED: cheek-to-palm with one hand, head leaning into palm, dreamy soft expression, NOT hands at sides",
        "FACIAL ACTION REQUIRED: looking up at camera from slightly lowered head, doe-eyed soft expression, NOT direct level gaze",
        "FACIAL ACTION REQUIRED: subtle finger heart gesture near face with soft smile, K-pop influenced cute pose, NOT bare-handed pose",

        // 害羞內斂類 (6 個)
        "FACIAL ACTION REQUIRED: soft bite on lower lip with relaxed jaw, slightly shy gaze off-camera, NOT confident stare",
        "FACIAL ACTION REQUIRED: hand half-covering mouth as if hiding small laugh, eyes bright, NOT open mouth pose",
        "FACIAL ACTION REQUIRED: looking down with small smile, eyelashes prominent, contemplative shy mood, NOT direct gaze",
        "FACIAL ACTION REQUIRED: hair tucking behind ear with soft expression, gentle natural moment, NOT static pose",
        "FACIAL ACTION REQUIRED: subtle blush with averted eyes and slight smile, demure soft energy, NOT bold expression",
        "FACIAL ACTION REQUIRED: hands gently on face near jaw, looking down softly, vulnerable cute moment, NOT hands at sides",

        // 思考發呆類 (5 個)
        "FACIAL ACTION REQUIRED: gazing into distance with lips slightly parted, lost-in-thought mood, NOT direct eye contact",
        "FACIAL ACTION REQUIRED: looking up and to the side as if remembering something, eyes soft and unfocused, NOT alert gaze",
        "FACIAL ACTION REQUIRED: chin resting on hand thoughtfully, slight gentle smile, NOT direct camera engagement",
        "FACIAL ACTION REQUIRED: closed eyes with serene expression, head slightly tilted back, peaceful moment, NOT open-eye pose",
        "FACIAL ACTION REQUIRED: half-profile gaze with calm distant expression, hair partially covering one eye, NOT frontal pose",

        // 互動驚喜類 (5 個)
        "FACIAL ACTION REQUIRED: wide-eyed surprised mouth in soft O shape, fresh delight energy, NOT calm composed face",
        "FACIAL ACTION REQUIRED: caught mid-eating soft serve or food, lips on food candidly, mid-bite moment, NOT empty hands pose",
        "FACIAL ACTION REQUIRED: lifting eyebrows with parted lips as if reacting to something, expressive moment caught, NOT static face",
        "FACIAL ACTION REQUIRED: turned head toward camera caught mid-action, slight smile starting to form, NOT prepared pose",
        "FACIAL ACTION REQUIRED: holding a drink or snack near mouth with playful eye contact, NOT bare-mouth gaze",

        // 動態瞬間類 (5 個)
        "FACIAL ACTION REQUIRED: hair caught mid-toss or wind sweep, mouth slightly open in motion, dynamic energy, NOT still pose",
        "FACIAL ACTION REQUIRED: laughing while looking down, body language relaxed and unposed, NOT camera-aware pose",
        "FACIAL ACTION REQUIRED: turning toward camera mid-walk with surprised soft smile, candid moment, NOT static stance",
        "FACIAL ACTION REQUIRED: closing eyes mid-smile against soft sunlight, peaceful golden moment, NOT eyes-open pose",
        "FACIAL ACTION REQUIRED: blowing soft kiss toward camera with eyes squinted in smile, K-IG signature gesture, NOT plain expression"
    ];
    const forcedAction = facialActions[Math.floor(Math.random() * facialActions.length)];

    // Layer 7_5_BODY: 肢體姿勢池(獨立於表情,提供身體動作維度)
    const bodyPoses = [
        // 坐姿類 (5 個)
        "BODY POSE REQUIRED: sitting cross-legged on floor with one hand resting on knee, relaxed casual posture, NOT standing straight",
        "BODY POSE REQUIRED: sitting on bed with knees pulled up to chest, arms wrapped around legs, cozy intimate posture, NOT formal sitting",
        "BODY POSE REQUIRED: sitting sideways on chair with one arm draped over chair back, casual relaxed energy, NOT stiff posing",
        "BODY POSE REQUIRED: sitting on stairs or curb with elbows on knees, candid street snap moment, NOT studio standing",
        "BODY POSE REQUIRED: sitting with legs to one side mermaid-style, body twisted toward camera, soft feminine pose, NOT direct frontal",

        // 蹲姿類 (3 個)
        "BODY POSE REQUIRED: squatting low with arms wrapped around knees, looking up at camera, playful low-angle moment, NOT standing pose",
        "BODY POSE REQUIRED: crouching down petting cat or dog, hand reaching out to animal, candid interaction, NOT facing camera directly",
        "BODY POSE REQUIRED: half-crouched looking at something on ground, body curved naturally, exploratory moment, NOT static stance",

        // 站姿動態類 (6 個)
        "BODY POSE REQUIRED: hands tucked into front pockets, weight on one leg, casual confident stance, NOT both-feet-flat pose",
        "BODY POSE REQUIRED: one hand on hip while other hand adjusts hair, mid-action gesture caught, NOT both-arms-down pose",
        "BODY POSE REQUIRED: leaning back against wall with one knee bent foot pressed on wall, urban candid posture, NOT free-standing",
        "BODY POSE REQUIRED: walking past with body slightly turned away, looking back over shoulder, motion energy, NOT facing camera",
        "BODY POSE REQUIRED: arms slightly raised in mid-spin, dress or hair caught in motion, dynamic frozen moment, NOT static stillness",
        "BODY POSE REQUIRED: stretching arms upward with body slightly arched, awakening energy, NOT slumped posture",

        // 手部互動類 (5 個)
        "BODY POSE REQUIRED: both hands gently holding hot drink cup near chest, warm cozy gesture, NOT empty-handed pose",
        "BODY POSE REQUIRED: one hand touching railing or counter while body leans on it, environmental anchor, NOT free-floating stance",
        "BODY POSE REQUIRED: hands organizing or holding small object like phone or keychain, looking down at hands, NOT face-to-camera pose",
        "BODY POSE REQUIRED: one hand pulling hair tie or fixing ponytail behind head, mid-grooming candid moment, NOT done-up pose",
        "BODY POSE REQUIRED: holding shopping bag or small bag with both hands in front, slight forward lean, casual carry pose, NOT empty hands",

        // 互動環境類 (5 個)
        "BODY POSE REQUIRED: leaning forearms on table from standing position, body angled toward camera, café candid feel, NOT direct standing",
        "BODY POSE REQUIRED: lying sideways on bed propping head with hand, soft intimate angle, bedroom candid, NOT seated pose",
        "BODY POSE REQUIRED: kneeling on floor or grass with one hand on ground for support, relaxed exploring posture, NOT standing height",
        "BODY POSE REQUIRED: leaning against motorcycle, scooter, or vehicle with hand on it, urban prop interaction, NOT empty-space pose",
        "BODY POSE REQUIRED: arms wrapped around self in slight chill or shy gesture, body language inward, NOT open-arms confidence pose"
    ];
    const forcedBodyPose = bodyPoses[Math.floor(Math.random() * bodyPoses.length)];
    
    layer7_5 = layer7_5 
        ? `${layer7_5}. ${forcedAction}. ${forcedBodyPose}` 
        : `${forcedAction}. ${forcedBodyPose}`;
    
    // Layer 8: pov_mode_inject
    let layer8: string;
    if (options?.isPOV === true) {
        // 第一人稱：強制手機外伸自拍構圖
        layer8 = "phone-held-out selfie taken by the subject herself, subject's face and upper body fill the frame, single arm extending from subject's body holding the phone toward camera, exactly two hands total in entire image (both belonging to the subject), close-up to medium shot framing, subject is the only person in the photo, no second pair of hands, no mirror, no reflection, no third-person observer angle, no full body shot, no other people";
    } else if (options?.isPOV === false) {
        // 第三人稱：強制注入旁觀視角
        layer8 = "third-person observer perspective, full or half body shot of subject, candid documentary framing, captured by another person, MUST NOT show subject's own arms reaching toward camera, MUST NOT be mirror selfie or phone-held-out angle";
    } else {
        // 未指定（fallback）：保留原本的隨機行為
        const povModes = scene.pov_modes || ["candid_50", "selfie_front"];
        layer8 = povModes[Math.floor(Math.random() * povModes.length)];
    }
    
    // Layer 8_5: composition_diversity（構圖多樣化）
    // 當 isPOV 為 true 時跳過（自拍有自己的構圖邏輯）
    let layer8_5 = "";
    if (options?.isPOV !== true) {
        const compositionPool = [
            // 近距離特寫類(對標高頻,提升至 12 個)
            "COMPOSITION MUST BE: extreme close-up selfie, face fills 85% of frame, 85mm compression, dewy skin and makeup detail visible, eyes sharp",
            "COMPOSITION MUST BE: close portrait, 85mm compression, face fills 75% of frame, eyes sharp, background completely bokeh, shooting distance 50cm",
            "COMPOSITION MUST BE: tight portrait, 135mm telephoto compression, face fills 70% of frame, skin texture visible, dreamy background",
            "COMPOSITION MUST BE: extreme close-up upper face and eyes, 135mm, lower face cropped at lips, micro-detail eye makeup visible",
            "COMPOSITION MUST BE: close-up three-quarter portrait, 85mm, face fills 65% of frame, expression dominant, soft background",
            "COMPOSITION MUST BE: ultra close cheek and lip detail, 100mm, blush and lip gloss prominent, hair strands visible",
            "COMPOSITION MUST BE: phone-distance selfie close-up, 50mm, face fills 70% of frame, casual unposed angle, candid energy",
            "COMPOSITION MUST BE: pouty lip close-up shot, 85mm, lower face emphasized, glossy lip detail prominent",
            "COMPOSITION MUST BE: close-up laughing face caught mid-laugh, 85mm, teeth visible, eyes crinkled, genuine joy",
            "COMPOSITION MUST BE: cheek-to-palm close portrait, 85mm, hand against face, playful tilt, intimate distance",
            "COMPOSITION MUST BE: close-up bite-lip expression, 85mm, soft pout caught, glossy lip with teeth indent",
            "COMPOSITION MUST BE: wide-eyed surprised close-up, 85mm, mouth slightly open, exaggerated expression captured",

            // 半身構圖類(8 個)
            "COMPOSITION MUST BE: half-body candid laugh shot, 85mm, head tilted back mid-laugh, hair messy from movement",
            "COMPOSITION MUST BE: waist-up shot biting lower lip softly, 85mm, looking off-camera shyly, dewy skin shine",
            "COMPOSITION MUST BE: half body from slightly above, 50mm natural, subject looking down at hands or phone, intimate overhead",
            "COMPOSITION MUST BE: medium shot chest to head, 85mm portrait compression, subject fills 60% of frame, three-quarter angle",
            "COMPOSITION MUST BE: half-body candid with food or cup partially in frame, 50mm, mouth full or mid-bite expression",
            "COMPOSITION MUST BE: waist-up cheek squish gesture, 85mm, both hands on cheeks playfully, exaggerated cute energy",
            "COMPOSITION MUST BE: half-body shot from low angle, 50mm slightly upward, subject looking down at camera with playful smile",
            "COMPOSITION MUST BE: medium shot from behind, subject turning head back surprised, 85mm, hair caught in movement",

            // 動態抓拍類(6 個,強調 candid)
            "COMPOSITION MUST BE: subject mid-laugh genuine candid, 85mm, caught in real moment, eyes squinted from laughter",
            "COMPOSITION MUST BE: subject turning around mid-motion, 85mm, hair caught in sweep, surprised expression",
            "COMPOSITION MUST BE: candid eating drinking moment, 50mm, mouth full or sipping, unaware of camera energy",
            "COMPOSITION MUST BE: subject mid-jump or mid-skip, 35mm, motion blur on edges, joyful spontaneous energy",
            "COMPOSITION MUST BE: subject covering face partial-laugh, 85mm, hand half-blocking mouth, embarrassed-happy mood",
            "COMPOSITION MUST BE: subject pointing at something off-camera, 50mm, surprised face caught mid-point, narrative moment",

            // 全身構圖類(縮減為 4 個,且全部要求動感)
            "COMPOSITION MUST BE: full body candid mid-stride walking past, 35mm, motion energy, environment tells story",
            "COMPOSITION MUST BE: full body from low angle, 35mm slight upward tilt, subject mid-action not posed",
            "COMPOSITION MUST BE: full body mirror selfie close to mirror, 35mm, phone and pose visible, casual energy",
            "COMPOSITION MUST BE: full body crouching or sitting candid, 35mm, relaxed unposed posture",

            // 環境敘事類(縮減為 2 個)
            "COMPOSITION MUST BE: subject partially framed by foreground element, 85mm, foreground out of focus, natural framing",
            "COMPOSITION MUST BE: subject leaning against wall, 85mm, relaxed casual posture, looking at phone or pondering",
        ];
        // 如果 IP 有設定招牌姿勢，90% 機率優先使用
        const signaturePoses = model.visualConstants?.signaturePoses || [];
        if (signaturePoses.length > 0 && Math.random() < 0.9) {
            layer8_5 = signaturePoses[Math.floor(Math.random() * signaturePoses.length)];
        } else {
            layer8_5 = compositionPool[Math.floor(Math.random() * compositionPool.length)];
        }
    }
    
    // Layer 9: spicy_modifiers (Aesthetic Tier logic)
    let layer9 = "";
    if (tier >= 3) {
        const count = 3 + (tier - 3);
        const extra = [...ALLOWED_KEYWORDS_V2]
            .sort(() => 0.5 - Math.random())
            .slice(0, count);
        layer9 += extra.join(', ');
    }
    if (tier >= 4) {
        const masters = ["candid iPhone photography", "Korean IG influencer aesthetic", "Japanese street snap style", "Y2K disposable camera feel"];
        const master = masters[Math.floor(Math.random() * masters.length)];
        layer9 += `, ${master}, spontaneous moment captured, youthful energy`;
    }
    if (tier === 5) {
        const obscurers = ["long flowing hair", "morning mist", "sheer curtain", "back turned to camera", "classical drapery", "dappled shadow"];
        const obscure = obscurers[Math.floor(Math.random() * obscurers.length)];
        layer9 += `, implied not shown, mood-based composition, subject partially obscured by ${obscure}`;
    }
    // M9 Safeguard
    if (scene.depth_module_id === 9 || scene.flags?.intimacy_emotional) {
        layer9 += ", --no nudity --no nipple --no underwear";
    }

    // Layer 10: negative_prompt
    let layer10 = scene.negative_prompt || "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers, no phone visible in frame, no second phone in mirror, no selfie stick, no studio lighting, no model pose, no readable text in background, no store signs, no neon signs with text, no street signs, no Chinese characters on signs, no subtitles, no billboards, no shop name boards";
    
    // Hard Fabric / Rain Safeguard
    if (outfit.fabric_difficulty === 'hard') {
        layer10 += ", melted fabric, fused clothes, messy textile";
    }

    // Stitching 1->10
    const parts = [
        `[Subject]: ${layer1}`,
        `[Depth]: ${layer2}`,
        `[Apparel]: ${layer3}`,
        `[Scene]: ${layer4}`,
        `[Festival]: ${layer5}`,
        `[Traces]: ${layer6}`,
        `[Warmth]: ${layer7}`,
        `[VisualDNA]: ${layer7_5}`,
        `[POV]: ${layer8}`,
        `[Composition]: ${layer8_5}`,
        `[Style]: ${[layer9, ...(model.visualConstants?.stylingFilters || [])].filter(Boolean).join(', ')}`,
        `[Negative]: ${layer10}`
    ].filter(p => !p.endsWith(': '));

    const rawPrompt = cleanPromptV2(parts.join('\n'));
    const sanitized = sanitizeFinalPrompt(rawPrompt);

    if (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('PAVORA_DEBUG_PROMPT') === '1') {
        console.info('[PAVORA_DEBUG_PROMPT]', {
            source: 'buildFinalVisualPromptV11',
            rawPrompt,
            finalPrompt: sanitized.prompt,
            sanitizerReport: sanitized.report
        });
    }

    return sanitized.prompt;
};

/**
 * Builds the final prompt structure based on Aesthetic Tier rules (Legacy).
 */
const buildPromptByTier = (outfit: OutfitV2, tier: number): string => {
    let prompt = outfit.prompt_skeleton;

    // Tier 3+ Injection
    if (tier >= 3) {
        const count = 3 + (tier - 3);
        const extra = [...ALLOWED_KEYWORDS_V2]
            .sort(() => 0.5 - Math.random())
            .slice(0, count);
        prompt += `, ${extra.join(', ')}`;
    }

    // Tier 4-5 Art Direction Injection
    if (tier >= 4) {
        const masters = ["candid iPhone photography", "Korean IG influencer aesthetic", "Japanese street snap style", "Y2K disposable camera feel"];
        const master = masters[Math.floor(Math.random() * masters.length)];
        prompt += `, ${master}, spontaneous moment captured, youthful energy`;
    }

    if (tier === 5) {
        const obscurers = ["long flowing hair", "morning mist", "sheer curtain", "back turned to camera", "classical drapery", "dappled shadow"];
        const obscure = obscurers[Math.floor(Math.random() * obscurers.length)];
        prompt += `, implied not shown, mood-based composition, subject partially obscured by ${obscure}`;
    }

    return cleanPromptV2(prompt);
};

/**
 * Generates a creative, dynamic event trigger based on the model's persona, life circuit, and previous events (Legacy Wrapper).
 */
export const generateDynamicEvent = async (model: Model, lastEntry?: { content?: string, mood?: string }): Promise<string> => {
    const result = await generateDynamicEventWithScene(model, lastEntry);
    return result.text;
};

/**
 * Generates a dynamic event with a scene ID for consistency (AI Generated version).
 */
export const generateDynamicEventWithScene = async (model: Model, lastEntry?: { content?: string, mood?: string }): Promise<{ text: string, sceneId?: string }> => {
    const client = await getGeminiClient(true) as any;
    
    // 1. Identify Target Location
    const targetCity = model.lifeCircuit?.primaryCity || '台北市';
    const targetDistrict = model.lifeCircuit?.primaryDistrict || '';

    // 2. Scene Selection Strategy (Prioritize Extended Scenes for better depth integration)
    let candidates: (ExtendedScene | any)[] = ALL_EXTENDED_SCENES.filter(s => 
        ((s as any).district && targetDistrict.includes((s as any).district)) || 
        (s.city && (s.city === targetCity || targetCity.includes(s.city))) ||
        s.city === "any"
    );

    // Fallback if city/district matches are scarce
    if (candidates.length < 3) {
        const cityFallback = getScenesByCity(targetCity);
        candidates = [...candidates, ...cityFallback];
    }

    const scene = candidates[Math.floor(Math.random() * candidates.length)] || LOCALIZED_SCENES[0];
    const sceneId = (scene as any).scene_id || (scene as any).id;

    const identityHeader = `
【!!! 人格心理憲法 (Psychological Core) !!!】
- IP 姓名：${model.name}
- MBTI 人格：${model.persona?.mbti || 'ISTP'}
- 核心氛圍：${model.persona?.coreVibe || '自然真實'}
- 職業身份：${model.persona?.profession || '未設定'}
- 語氣風格：${model.persona?.toneOfVoice || '自然隨性'}
- 長期記憶：${(model.worldAnchors?.longTermMemories ?? []).length 
    ? `${(model.worldAnchors?.longTermMemories ?? []).join('、')}。`
    : '無特別記憶'}
`;

    const contextHeader = lastEntry ? `
【時空連貫 (Timeline Context)】
- 上一則動態：“${lastEntry.content}”
    ` : '【新故事線起始】';

    // 準備場景數據，避免直接暴露英文 prompt 素材給 AI 直接複製
    const sceneEvent = (scene as any).name_zh || scene.event;
    const sceneSensory = Array.isArray(scene.sensory) ? scene.sensory.join('、') : scene.sensory;
    const sceneNoise = Array.isArray(scene.visualNoise) ? scene.visualNoise.join('、') : scene.visualNoise;

    const prompt = `
        ${identityHeader}
        ${contextHeader}
        你現在是這名數位 IP 的【靈體編導】。請根據其人格與上一則動態，在【${targetCity}】策劃一則生活靈感。
        
        【場景設定】
        - 地點與事件：${sceneEvent}
        - 氛圍標籤：${sceneSensory}
        - 生活細節：${sceneNoise}
        
        【任務】
        1. 文字長度：60 - 120 字。
        2. 結構：[感官氣息] -> [主體微小動作] -> [深刻生活碎屑]。
        3. 注入 20% 的不完美感（例如：汗水、凌亂、或是一點疲累）。
        4. **語言：繁體中文**。嚴禁輸出英文 prompt 素材，確保文字像真實的人類生活紀錄。

        直接輸出內容，不要前言。
    `;

    try {
        const resultResponse = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });
        const resultText = (resultResponse.text || "").trim();
        
        if (resultText.length < 30) throw new Error("Output too short");
        return { text: resultText, sceneId };
    } catch (e) {
        console.warn("AI generation failed, using fallback:", e);
        const fallback = generateRandomEventWithScene(model);
        return { text: fallback.text, sceneId: fallback.sceneId };
    }
};

/**
 * Generates a deeply immersive narrative diary and visual prompt based on the persona base.
 */
export const generateIPDiary = async (model: Model, event: string, options?: { isPOV?: boolean, lastEntry?: { content?: string, mood?: string }, forcedSceneId?: string }): Promise<Partial<DiaryEntry>> => {
    const client = await getGeminiClient(true) as any;

    // 1. Context and Scene Selection
    const primaryCity = model.lifeCircuit?.primaryCity || '台北市';
    const primaryDistrict = model.lifeCircuit?.primaryDistrict || '';
    
    let sceneContext: ExtendedScene | any = null;

    if (options?.forcedSceneId) {
        // Forced Scene override (Highest Priority)
        sceneContext = ALL_EXTENDED_SCENES.find(s => s.scene_id === options.forcedSceneId);
        if (!sceneContext) {
            // Check legacy scenes if not in extended
            sceneContext = LOCALIZED_SCENES.find((s: any) => s.id === options.forcedSceneId);
        }
    }

    if (!sceneContext) {
        // TIER 1: 符合角色生活圈的場景 (City & District Matching)
        let candidates = ALL_EXTENDED_SCENES.filter(s => {
            const cityMatch = s.city && (s.city === primaryCity || primaryCity.includes(s.city) || s.city.includes(primaryCity));
            const districtMatch = primaryDistrict && (
                ((s as any).district && (primaryDistrict.includes((s as any).district) || (s as any).district.includes(primaryDistrict))) ||
                (s.event && s.event.includes(primaryDistrict)) ||
                (s.name_zh && s.name_zh.includes(primaryDistrict)) ||
                (s.category && s.category.includes(primaryDistrict))
            );
            return cityMatch || districtMatch;
        });

        // TIER 2: 通用場景 (region: all / city: any)
        if (candidates.length === 0) {
            candidates = ALL_EXTENDED_SCENES.filter(s => s.region === 'all' || s.city === 'any');
        }

        // TIER 3: ALL_EXTENDED_SCENES 全池
        if (candidates.length === 0) {
            candidates = ALL_EXTENDED_SCENES;
        }

        if (candidates.length > 0) {
            // 加權處理：若有行政區匹配，優先從中抽選
            if (primaryDistrict) {
                const districtMatches = candidates.filter(s => 
                    ((s as any).district && (primaryDistrict.includes((s as any).district) || (s as any).district.includes(primaryDistrict))) ||
                    (s.event && s.event.includes(primaryDistrict)) ||
                    (s.name_zh && s.name_zh.includes(primaryDistrict))
                );
                if (districtMatches.length > 0) {
                    sceneContext = districtMatches[Math.floor(Math.random() * districtMatches.length)];
                }
            }
            if (!sceneContext) {
                sceneContext = candidates[Math.floor(Math.random() * candidates.length)];
            }
        }
        
        // TIER 4: 最後才 fallback 到 LOCALIZED_SCENES / getScenesByCity
        if (!sceneContext) {
            const localKnowledge = getScenesByCity(primaryCity);
            sceneContext = localKnowledge[Math.floor(Math.random() * localKnowledge.length)] || LOCALIZED_SCENES[0];
        }
    }

    const location = event || sceneContext.event;
    
    // 依月份隨機抽台灣天氣(避免永遠下雨)
    const month = new Date().getMonth() + 1;
    let weatherPool: string[];
    if (month >= 6 && month <= 9) {
        // 夏季:晴天為主,偶有午後雷陣雨
        weatherPool = ['晴天', '晴天', '晴天', '晴朗多雲', '午後雷陣雨', '悶熱晴天'];
    } else if (month >= 12 || month <= 2) {
        // 冬季:多雲、偶陰雨
        weatherPool = ['多雲', '陰天', '陰天偶陣雨', '冬日晴朗', '濕冷多雲'];
    } else if (month >= 3 && month <= 5) {
        // 春季:多變
        weatherPool = ['晴朗', '多雲', '春雨綿綿', '陽光普照', '微風晴天'];
    } else {
        // 秋季:涼爽舒適
        weatherPool = ['秋高氣爽', '晴朗微涼', '多雲', '舒適晴天', '秋日金黃陽光'];
    }
    const weather = weatherPool[Math.floor(Math.random() * weatherPool.length)];
    
    const activity = event;

    // 2. Selection of Aesthetic Tier and Outfit
    const rawMinTier = model.preferences?.aesthetic_tier_min || 1;
    const rawMaxTier = model.preferences?.aesthetic_tier_max || 2;
    const minTier = Math.min(rawMinTier, rawMaxTier);
    const maxTier = Math.max(rawMinTier, rawMaxTier);
    const targetTier = Math.floor(Math.random() * (maxTier - minTier + 1)) + minTier;
    
    // Map activity to context
    let contextId = "urban_street";
    if (sceneContext.depth_module_id === 1) contextId = "home_cozy";
    else if (sceneContext.depth_module_id === 2) contextId = "travel_journey";

    // 根據 primaryDistrict 調整 contextId 的預設傾向
    const district = model.lifeCircuit?.primaryDistrict || '';
    if (!sceneContext.depth_module_id) {
        if (district.includes('信義') || district.includes('101') || district.includes('商業')) {
            contextId = 'office_pro';
        } else if (district.includes('東區') || district.includes('忠孝') || district.includes('逛街')) {
            contextId = 'shopping_random';
        } else if (district.includes('大安') || district.includes('師大') || district.includes('文青')) {
            contextId = 'urban_street';
        }
    }

    const lowerEvent = event.toLowerCase();
    if (
        lowerEvent.includes("家") || lowerEvent.includes("宅") || 
        lowerEvent.includes("房間") || lowerEvent.includes("房") ||
        lowerEvent.includes("沙發") || lowerEvent.includes("床") ||
        lowerEvent.includes("客廳") || lowerEvent.includes("浴室") ||
        lowerEvent.includes("廚房") || lowerEvent.includes("陽台") ||
        lowerEvent.includes("窩") || lowerEvent.includes("在家")
    ) contextId = "home_cozy";
    else if (
        lowerEvent.includes("上班") || lowerEvent.includes("公司") || 
        lowerEvent.includes("會議") || lowerEvent.includes("辦公") ||
        lowerEvent.includes("開會") || lowerEvent.includes("工作") ||
        lowerEvent.includes("同事") || lowerEvent.includes("老闆")
    ) contextId = "office_pro";
    else if (
        lowerEvent.includes("逛") || lowerEvent.includes("買") || 
        lowerEvent.includes("店") || lowerEvent.includes("市場") ||
        lowerEvent.includes("超商") || lowerEvent.includes("超市") ||
        lowerEvent.includes("購物") || lowerEvent.includes("賣場") ||
        lowerEvent.includes("便利") || lowerEvent.includes("7-11") ||
        lowerEvent.includes("全家") || lowerEvent.includes("shopping")
    ) contextId = "shopping_random";
    else if (
        lowerEvent.includes("機場") || lowerEvent.includes("飛") || 
        lowerEvent.includes("旅") || lowerEvent.includes("出發") ||
        lowerEvent.includes("搭車") || lowerEvent.includes("火車") ||
        lowerEvent.includes("高鐵") || lowerEvent.includes("台鐵") ||
        lowerEvent.includes("出差") || lowerEvent.includes("行李") ||
        lowerEvent.includes("登機") || lowerEvent.includes("抵達")
    ) contextId = "travel_journey";
    else if (
        lowerEvent.includes("捷運") || lowerEvent.includes("公車") ||
        lowerEvent.includes("等") || lowerEvent.includes("街") ||
        lowerEvent.includes("路上") || lowerEvent.includes("外出") ||
        lowerEvent.includes("散步") || lowerEvent.includes("走路") ||
        lowerEvent.includes("騎車") || lowerEvent.includes("開車") ||
        lowerEvent.includes("咖啡廳") || lowerEvent.includes("咖啡店") ||
        lowerEvent.includes("餐廳") || lowerEvent.includes("公園")
    ) contextId = "urban_street";

    const sceneOutfitFilters = (sceneContext as any).outfit_filter as string[] | undefined;
    const sceneContextId = (sceneContext as any).scene_context_id as string | undefined;
    const contextCandidates = sceneOutfitFilters?.length
        ? sceneOutfitFilters
        : sceneContextId
            ? [sceneContextId]
            : [contextId];
    contextId = contextCandidates[0] || contextId;

    const outfit = pickOutfit(model, contextCandidates, targetTier);
    
    // Update recent_outfit_ids cooldown (keep last 5)
    if (!model.preferences) (model as any).preferences = {};
    const recentIds = model.preferences?.recent_outfit_ids || [];
    const updatedRecent = [
        outfit.outfit_id,
        ...recentIds.filter((id: string) => id !== outfit.outfit_id)
    ].slice(0, 5);
    if (model.preferences) model.preferences.recent_outfit_ids = updatedRecent;
    
    // 3. V1.1 Layered Prompt Composition
    const finalVisualPrompt = buildFinalVisualPromptV11(model, sceneContext, outfit, targetTier, options);

    // 有寵物時，偶爾在場景描述加入寵物（15% 機率，限居家場景）
    let petNote = '';
    const pet = model.worldAnchors?.pet;
    if (pet && contextId === 'home_cozy' && Math.random() < 0.15) {
        petNote = ` [PET VISIBLE: A ${pet.breed} named ${pet.name} visible in the background or nearby]`;
    }

    // M9 Routing Restriction
    const platformRestriction = (sceneContext.depth_module_id === 9 || sceneContext.flags?.intimacy_emotional) 
        ? ["X", "Fanvue", "OnlyFans"] 
        : ["Instagram", "Threads", "TikTok", "Facebook"];

    const prompt = `
你是一位高級數位內容編導與靈魂敘事者（Creative Director & Soul Narrator）。
你的任務是為 IP 角色 ${model.name} 生成一篇極具「台灣體溫」且「去 AI 化」的生活紀錄。

[角色核心 DNA]
- 性別: ${model.gender} / 年齡: ${model.age}
- MBTI/性格: ${model.persona?.mbti} / ${model.persona?.coreVibe}
- 職業身份：${model.persona?.profession || '未設定'}
- 語氣風格：${model.persona?.toneOfVoice || '自然隨性'}
- 口頭禪：${model.persona?.catchphrase ? `偶爾在日記中自然帶入「${model.persona.catchphrase}」` : '無特定口頭禪'}
- 常駐地區：${model.lifeCircuit?.primaryDistrict || model.lifeCircuit?.primaryCity || '台北市'}
- 興趣標籤：${(model.lifeCircuit?.interests ?? []).join('、') || '未設定'}
- 寵物：${model.worldAnchors?.pet ? `${model.worldAnchors.pet.name}（${model.worldAnchors.pet.breed}），${model.worldAnchors.pet.description}` : '無寵物'}
- 標誌性物品：${(model.worldAnchors?.iconicItems?.map(i => i.name) ?? []).join('、') || '無特定物品'}

[今日情境]
- 地點: ${primaryCity} ${location}
- 天氣: ${weather}
- 活動: ${activity}

[視覺風格規範：Aesthetic Tier ${targetTier}]
1. 穿搭細節 (MUST FOLLOW EXACTLY):
   - 上身: ${outfit.pillars.top}
   - 下身: ${outfit.pillars.bottom}
   - 鞋履: ${outfit.pillars.shoes}
   - 配件: ${(outfit.pillars.accessories ?? []).join(', ')}
   - 道具/手部狀態: ${(outfit.pillars.props ?? []).join(', ')} (左手: ${outfit.hand_occupation.left_hand}, 右手: ${outfit.hand_occupation.right_hand})
2. 生理寫實協議 v2.2 (去除「痣」):
   - 強調微觀皮膚質地 (Micro-pores)、細微的不對稱性 (Asymmetry)。
   - 髮絲必須有散亂感 (Flyaways)，拒絕完美的 AI 頭盔感。
3. 提示詞架構 (Visual Prompt):
   - 核心提示詞預設值: ${finalVisualPrompt}
   - 你必須產出英文提示詞，並將其拆分為以下模塊格式：
     [Subject]: (包含生理寫實細節)
     [Apparel]: (包含本次指定的完整穿搭)
     [Environment]: (包含 ${primaryCity} 的場景碎屑與雜訊)
     [Lighting]: (包含對應天氣與 Tier 的光影語法)
     [Camera]: (包含對應 Tier 的攝影機設定與術語)

[輸出要求]
請直接回傳一個符合以下格式的 JSON 字串，不要有任何 Markdown 標籤：
{
  "content": "第一人稱的生活碎念（繁體中文），約 150-200 字，充滿生活雜訊與微情緒",
  "mood": "一個精確的情緒關鍵字",
  "visualPrompt": "[Subject]: ...\\n[Apparel]: ...\\n[Environment]: ...\\n[Lighting]: ...\\n[Camera]: ...",
  "visualPromptZH": "[主體]: ...\\n[穿搭]: ...\\n[環境]: ...\\n[光影]: ...\\n[鏡頭]: ...",
  "meta": {
    "outfit_id": "${outfit.outfit_id}",
    "aesthetic_tier": ${targetTier},
    "context": "${contextId}"
  }
}
`;

    try {
        const resultResponse = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });
        const text = (resultResponse.text || "").trim();
        
        // --- Robust JSON Extraction ---
        let jsonStr = text;
        const jsonBlockMatch = text.match(/```json\s?([\s\S]*?)\s?```/);
        if (jsonBlockMatch) {
            jsonStr = jsonBlockMatch[1];
        } else {
            const rawJsonMatch = text.match(/\{[\s\S]*\}/);
            if (rawJsonMatch) {
                jsonStr = rawJsonMatch[0];
            }
        }

        const data = JSON.parse(jsonStr.replace(/^[^{]*/, "").replace(/[^}]*$/, ""));

        const ensurePromptSection = (
            promptValue: unknown,
            sectionPattern: RegExp,
            fallbackLine: string,
            insertBeforePattern: RegExp
        ) => {
            const promptText = typeof promptValue === 'string' ? promptValue.trim() : '';
            if (!promptText) return fallbackLine;
            if (sectionPattern.test(promptText)) return promptText;

            const lines = promptText.split('\n');
            const insertIndex = lines.findIndex(line => insertBeforePattern.test(line.trim()));

            if (insertIndex >= 0) {
                lines.splice(insertIndex, 0, fallbackLine);
                return lines.join('\n');
            }

            return `${promptText}\n${fallbackLine}`;
        };

        const repairedVisualPrompt = ensurePromptSection(
            data.visualPrompt,
            /^\s*(\[Lighting\]|【Lighting】|Lighting)\s*[:：]/im,
            `[Lighting]: natural ${weather} lighting matching ${primaryCity} ${location}, realistic ambient shadows, no studio lighting`,
            /^\s*(\[Camera\]|【Camera】|Camera)\s*[:：]/im
        );

        const repairedVisualPromptZH = ensurePromptSection(
            data.visualPromptZH,
            /^\s*(\[光影\]|【光影】|光影)\s*[:：]/m,
            `[光影]: 呼應${weather}與${primaryCity}${location}的自然光影、環境陰影與真實現場光感，避免棚拍燈感`,
            /^\s*(\[鏡頭\]|【鏡頭】|鏡頭)\s*[:：]/m
        );

        const repairApparelSection = (promptText: string) => {
            const outfitParts = [
                outfit.pillars.top,
                outfit.pillars.bottom,
                outfit.pillars.shoes,
                ...(outfit.pillars.accessories ?? []),
                ...(outfit.pillars.props ?? [])
            ].filter((part): part is string => Boolean(part && part.trim()));

            if (outfitParts.length === 0) return promptText;

            const lines = promptText.split('\n');
            const apparelIndex = lines.findIndex(line => /^\s*(\[Apparel\]|【Apparel】|Apparel)\s*[:：]/i.test(line.trim()));
            const apparelLine = apparelIndex >= 0 ? lines[apparelIndex] : '';

            const missingParts = outfitParts.filter(part => !apparelLine.toLowerCase().includes(part.toLowerCase()));
            if (missingParts.length === 0) return promptText;

            const missingText = missingParts.join(', ');

            if (apparelIndex >= 0) {
                lines[apparelIndex] = `${apparelLine.trim()} ${missingText}`;
                return lines.join('\n');
            }

            const environmentIndex = lines.findIndex(line => /^\s*(\[Environment\]|【Environment】|Environment)\s*[:：]/i.test(line.trim()));
            const apparelFallbackLine = `[Apparel]: ${missingText}`;

            if (environmentIndex >= 0) {
                lines.splice(environmentIndex, 0, apparelFallbackLine);
                return lines.join('\n');
            }

            return `${promptText}\n${apparelFallbackLine}`;
        };

        const repairedApparelVisualPrompt = repairApparelSection(repairedVisualPrompt);
        const sanitizedVisualPrompt = sanitizeFinalPrompt(repairedApparelVisualPrompt).prompt;
        const sanitizedVisualPromptZH = sanitizeFinalPrompt(repairedVisualPromptZH).prompt;
        
        return {
            content: data.content,
            mood: data.mood,
            visualPrompt: sanitizedVisualPrompt,
            visualPromptZH: sanitizedVisualPromptZH,
            meta: {
                ...data.meta,
                petNote,
                depth_module_id: sceneContext.depth_module_id || 0,
                story_arc_id: sceneContext.flags?.story_arc_id,
                identity_thread_id: sceneContext.flags?.identity_thread_id,
                non_visual_persona: sceneContext.flags?.relationship_layer,
                platform_restriction: platformRestriction
            }
        };
    } catch (e) {
        console.error("Diary generation critical failure:", e);
        return {
            content: "（視線漫無目的地掃過城市的皺摺，那些瑣碎的聲音與氣味在空氣中凝結。此刻的真實，往往藏在那些最不起眼的雜訊裡...）",
            mood: "沉浸",
            visualPrompt: finalVisualPrompt,
            visualPromptZH: "基本的視覺提示詞備援"
        };
    }
};

/**
 * Extracts potential new memory fragments from a generated narrative.
 */
export const extractNewMemories = async (model: Model, diaryContent: string): Promise<string[]> => {
    const client = await getGeminiClient(true) as any;
    const existingMems = model.worldAnchors?.longTermMemories || [];
    
    const prompt = `
        你是一個記憶管理員，負責為虛擬 IP 提取值得長期保留的記憶。
        
        分析以下日記，提取 1-3 個對「未來日記連貫性」有意義的記憶點。
        
        好的記憶應該是：
        - 具體的事件或決定（#買了第一台底片相機、#搬去大安區新家）
        - 情感轉折點（#那天開始不再聯絡某人、#決定認真學攝影）
        - 習慣或偏好的確立（#發現自己喜歡一個人吃早餐）
        
        不好的記憶是：
        - 太泛泛（#今天很開心）
        - 重複已有的記憶（已有記憶：${existingMems.join(', ')}）
        
        【日記內容】: "${diaryContent}"
        【已有記憶】: ${existingMems.length > 0 ? existingMems.join(', ') : '（尚無記憶）'}
        
        僅輸出 JSON 數組格式，不要其他文字：["#記憶1", "#記憶2"]
        如果沒有值得提取的記憶，輸出空數組：[]
    `;

    try {
        const resultResponse = await client.models.generateContent({
             model: "gemini-3-flash-preview",
             contents: prompt
        });
        const text = resultResponse.text || "";
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (e) {
        return [];
    }
};

/**
 * Synchronizes prompts between ZH and EN.
 * Preserves the [Key]: Value structure if present.
 */
export const syncPrompts = async (text: string, from: 'ZH' | 'EN'): Promise<{ZH: string, EN: string}> => {
    const client = await getGeminiClient(true) as any;
    const prompt = `
        你是一個資深攝影提示詞翻譯官。請將以下提示詞進行中英對齊。
        
        【要求】
        1. 保持專業攝影術語（如 Bokeh, Rim Light, Chromatic Aberration）。
        2. 如果輸入包含 [Key]: Value 的結構，請務必在輸出中保留該結構。
        3. 輸出必須為純 JSON 格式。
        
        【待處內容】
        ${text}
        
        【輸出格式】
        { "ZH": "對齊後的中文內容", "EN": "對齊後的英文內容" }
    `;

    try {
        const resultResponse = await client.models.generateContent({
             model: "gemini-3-flash-preview",
             contents: prompt
        });
        const resultText = resultResponse.text || "";
        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found");
        return JSON.parse(jsonMatch[0]);
    } catch (e) {
        console.error("Sync prompts failed:", e);
        return { ZH: text, EN: text };
    }
};

/**
 * Generates a random event with a scene ID for consistency.
 */
export const generateRandomEventWithScene = (model: Model): { text: string; sceneId?: string } => {
    const baseCity = model.lifeCircuit?.primaryCity || '台北市';
    
    // 跨縣市「移動感」演算法 (30% chance)
    const isTraveling = Math.random() < 0.3;
    let targetCity = baseCity;
    if (isTraveling) {
        const otherCities = [
            "台北市", "新北市", "基隆市", "桃園市", "新竹市", "宜蘭縣",
            "苗栗縣", "台中市", "彰化縣", "南投縣", "雲林縣",
            "嘉義市", "台南市", "高雄市", "屏東縣",
            "花蓮縣", "台東縣", "澎湖縣", "金門縣", "連江縣"
        ];
        targetCity = otherCities[Math.floor(Math.random() * otherCities.length)];
    }

    const extendedScenes = ALL_EXTENDED_SCENES.filter(s =>
        s.city === targetCity ||
        s.city === "any" ||
        targetCity.includes(s.city || "") ||
        (s.city && s.city.includes(targetCity))
    );

    const fallbackScenes = getScenesByCity(targetCity);
    const scenePool = extendedScenes.length > 0 ? extendedScenes : fallbackScenes;
    const scene = scenePool[Math.floor(Math.random() * scenePool.length)];
    
    const sceneTextForContext = `${scene.category || ""} ${(scene as any).context_id || ""} ${scene.name_zh || ""} ${scene.event || ""} ${scene.city || ""}`;

    const pickOne = (items: string[]) => items[Math.floor(Math.random() * items.length)];

    const inferRandomEventContext = () => {
        if (/家|宅|房間|客廳|臥室|沙發|床|廚房|陽台|home|cozy/i.test(sceneTextForContext)) return "home";
        if (/咖啡|咖啡廳|cafe|茶|甜點|brunch/i.test(sceneTextForContext)) return "cafe";
        if (/辦公|公司|會議|工作|coworking|office/i.test(sceneTextForContext)) return "office";
        if (/捷運|車站|高鐵|台鐵|公車|通勤|機場|airport|train|station|travel/i.test(sceneTextForContext)) return "commute";
        if (/超商|便利|7-11|全家|商場|百貨|更衣|逛街|shopping|store|mall/i.test(sceneTextForContext)) return "shopping";
        if (/夜市|小吃|餐廳|食物|市場|food|restaurant|snack/i.test(sceneTextForContext)) return "food";
        if (/海|山|湖|步道|公園|戶外|草地|河|beach|park|trail|outdoor|nature/i.test(sceneTextForContext)) return "outdoor";
        return "urban";
    };

    const contextKey = inferRandomEventContext();

    const commonActions = [
        "低頭確認手機訊息",
        "把耳邊的碎髮撥到耳後",
        "抬頭看了一眼遠處",
        "停下來整理肩上的包包",
        "把外套袖口往上推了一點",
        "伸手接住快滑落的杯子",
        "忽然笑了一下又低頭",
        "把手機螢幕按暗",
        "用手背輕輕碰了一下臉頰",
        "站在原地等下一個空檔",
        "把手插進外套口袋",
        "側身讓人群先經過",
        "低頭看鞋尖沾到的灰",
        "把包包背帶重新拉正",
        "拿起飲料又放回桌上",
        "盯著窗外出神幾秒",
        "一邊走一邊回頭看",
        "把髮圈套回手腕",
        "用指尖敲了敲杯緣",
        "深呼吸後重新打起精神"
    ];

    const contextActions: Record<string, string[]> = {
        home: [
            "盤腿坐在地毯上翻找遙控器",
            "靠在沙發扶手旁滑手機",
            "把洗好的衣服從椅背拿起來",
            "站在冰箱前猶豫要喝什麼",
            "坐在床邊整理耳機線",
            "把抱枕拍鬆後又靠回去",
            "趴在桌邊看未回完的訊息",
            "在廚房流理台旁等水燒開",
            "把拖鞋踢回腳邊",
            "對著鏡子隨手整理瀏海"
        ],
        cafe: [
            "用湯匙攪著快融化的冰塊",
            "把杯墊往桌邊推了一點",
            "低頭看菜單又抬頭看窗外",
            "把筆記本翻到空白頁",
            "用手指擦掉杯壁水珠",
            "拿起叉子又忘了吃甜點",
            "把托特包從椅背拉回膝上",
            "對著咖啡表面的奶泡發呆",
            "把收據夾進書頁裡",
            "側身避開隔壁桌經過的人"
        ],
        office: [
            "盯著會議筆記停頓幾秒",
            "把筆電螢幕角度調低",
            "用指尖按住快翹起的便利貼",
            "拿起馬克杯走向茶水間",
            "把識別證翻回正面",
            "對著未送出的訊息猶豫",
            "把文件夾抱在胸前",
            "用筆在紙角畫了兩條線",
            "揉了揉眉心再看螢幕",
            "把椅子往桌邊拉近"
        ],
        commute: [
            "扶著欄杆看車窗倒影",
            "低頭確認下一班車時間",
            "把票卡捏在指尖",
            "在人群中側身讓出通道",
            "拖著行李箱停在指示牌前",
            "把耳機塞回充電盒",
            "站在月台邊線後等待",
            "看著玻璃反光整理表情",
            "把登機證對折收進包裡",
            "在電扶梯上握緊扶手"
        ],
        shopping: [
            "站在貨架前比較兩個顏色",
            "把購物袋換到另一隻手",
            "看著鏡子調整衣角",
            "低頭確認電子發票",
            "把試穿號碼牌拿在手上",
            "在超商冷藏櫃前停住",
            "拿起一瓶飲料又放回去",
            "把零錢收回小包夾層",
            "站在店門口等朋友回訊息",
            "側身避開推車經過"
        ],
        food: [
            "吹了吹湯匙上的熱氣",
            "把筷子停在碗邊",
            "低頭看醬汁有沒有滴到衣服",
            "拿紙巾壓住杯底水痕",
            "排隊時把菜單折起來",
            "把小吃袋拎高避開人群",
            "咬了一口又忍不住笑",
            "看著攤位燈光發呆",
            "把吸管戳進封膜裡",
            "手裡拿著號碼牌等叫號"
        ],
        outdoor: [
            "抬手遮了一下刺眼的陽光",
            "把被風吹亂的頭髮壓回耳後",
            "踩過樹影停下來看天空",
            "蹲下來綁鬆掉的鞋帶",
            "站在欄杆旁看遠方",
            "把外套拉鍊拉高一點",
            "伸手接住落在肩上的葉子",
            "在風裡停下腳步",
            "把水壺從包側拿出來",
            "回頭確認朋友有沒有跟上"
        ],
        urban: [
            "停在騎樓下等紅燈",
            "靠著牆看街角的人流",
            "把手機放回包包外袋",
            "低頭避開突然吹來的風",
            "穿過斑馬線時回頭看了一眼",
            "在便利貼般的霓虹光裡停住",
            "站在路邊整理外套下擺",
            "把手搓熱後拿起飲料",
            "抬頭看招牌又低頭確認地址",
            "沿著人行道慢慢往前走"
        ]
    };

    const commonDebris = [
        "包包外袋露出一角發票",
        "手機螢幕上還停著未讀訊息",
        "耳機盒躺在掌心旁",
        "口紅蓋子沒有完全蓋緊",
        "一張小票被壓在杯底下",
        "髮夾卡在包包背帶上",
        "濕紙巾包裝被折到皺起來",
        "悠遊卡露在手機殼後面",
        "外套吊牌還沒完全剪乾淨",
        "指尖沾到一點杯壁水珠",
        "透明傘套被塞在腳邊",
        "小鏡子邊緣留下指紋",
        "護唇膏滾到桌角",
        "鑰匙圈掛著一個褪色小吊飾",
        "髮圈套在手腕上勒出淡淡痕跡",
        "紙袋邊角被雨水沾濕",
        "手機充電線繞成一小團",
        "包包拉鍊停在半開的位置",
        "袖口沾到一點灰塵",
        "飲料封膜上有一圈水痕"
    ];

    const contextDebris: Record<string, string[]> = {
        home: [
            "沙發邊放著折到一半的薄毯",
            "茶几上有半包打開的蘇打餅",
            "拖鞋一隻在地毯上一隻在門邊",
            "洗衣籃裡露出白色襯衫袖口",
            "水杯旁有一顆剝到一半的橘子",
            "電視遙控器卡在抱枕縫裡",
            "床邊放著翻開的小說",
            "桌上有一碗吃到一半的地瓜",
            "窗台邊放著快枯掉的小盆栽",
            "廚房紙巾被撕得不太整齊"
        ],
        cafe: [
            "拿鐵杯緣留著淡淡唇印",
            "可頌屑掉在小盤子旁",
            "手沖咖啡濾紙放在托盤角落",
            "蛋糕叉子斜靠在盤邊",
            "冰美式杯壁凝著水珠",
            "菜單邊角被壓在手機下",
            "肉桂捲的糖霜沾到紙巾",
            "桌上放著一張集點卡",
            "玻璃水瓶旁有兩個空杯",
            "紙吸管套被揉成小小一團"
        ],
        office: [
            "便當盒蓋子還沒完全扣緊",
            "便利貼貼在筆電邊框上",
            "咖啡杯旁放著一支紅筆",
            "會議資料夾露出彩色標籤",
            "鍵盤旁有一包海苔飯糰包裝",
            "識別證掛繩垂在桌邊",
            "茶水間紙杯堆在托盤角落",
            "便條紙上寫著沒完成的待辦",
            "滑鼠墊旁有一顆茶葉蛋殼",
            "抽屜夾縫露出一包堅果"
        ],
        commute: [
            "票卡被捏得有點彎",
            "行李箱輪子卡著一片小葉子",
            "車票收據露在外套口袋",
            "便利商店飯糰包裝摺在包裡",
            "紙杯咖啡套在手上有點鬆",
            "耳機線從圍巾下方露出來",
            "登機證邊角被折了一道",
            "月台地面反著冷白燈光",
            "雨傘尖端滴著水",
            "背包側袋塞著半瓶礦泉水"
        ],
        shopping: [
            "試穿號碼牌掛在手指上",
            "購物袋裡露出一角吊牌",
            "電子發票存在手機畫面上",
            "超商茶葉蛋袋子放在收銀台旁",
            "手搖杯貼紙寫著半糖少冰",
            "小包濕紙巾壓在口紅旁",
            "更衣間門上的掛鉤晃了一下",
            "衣架尺寸標籤翻到背面",
            "紙袋提繩勒出一道痕",
            "收銀台旁放著一排薄荷糖"
        ],
        food: [
            "鹽酥雞紙袋邊緣沾到椒鹽",
            "滷味袋裡的竹籤露出一小截",
            "蛋餅盒蓋子被熱氣蒸出水珠",
            "飯糰海苔包裝撕到一半",
            "便當盒旁放著一小包辣椒醬",
            "珍奶封膜上有一圈水痕",
            "地瓜紙袋還帶著溫熱霧氣",
            "臭豆腐泡菜盒角落沾到湯汁",
            "雞排紙袋被壓出油痕",
            "豆漿杯蓋上貼著早餐店貼紙"
        ],
        outdoor: [
            "鞋尖沾到一點草屑",
            "水壺外側有細小刮痕",
            "防曬乳蓋子卡在包包側袋",
            "風把地圖摺角吹起來",
            "小毛巾搭在背包肩帶上",
            "葉子落在鞋邊",
            "太陽眼鏡掛在領口",
            "門票收據被夾在手機殼後",
            "礦泉水瓶被曬得有點溫",
            "帽簷下有一小片陰影"
        ],
        urban: [
            "外帶咖啡杯套被捏出摺痕",
            "機車鑰匙掛在指尖晃著",
            "雨傘靠在騎樓柱子旁",
            "路邊發票被風吹到鞋邊",
            "手機導航停在下一個轉角",
            "超商袋子裡露出一瓶無糖茶",
            "口罩被折好收進外套口袋",
            "街邊燈箱反光落在包包扣環上",
            "手搖杯杯底有一圈水痕",
            "斑馬線旁的風把髮尾吹亂"
        ]
    };

    const atmospheres = [
        "慵懶", "隨性", "沉靜", "生活感", "溫度", "鬆弛", "真實", "微微疲憊", "剛好的混亂", "低調的可愛",
        "一點點狼狽", "安靜的專注", "午後的恍神", "剛醒的慢半拍", "不小心流露的情緒", "城市裡的停頓",
        "自然的凌亂", "沒有修飾的日常", "柔軟的空白", "被生活打斷的節奏"
    ];

    const envDetails = [
        "傍晚的光影折射",
        "窗外透進來的微光",
        "遠處模糊的車聲",
        "冷氣機輕微的運轉聲",
        "葉片在風中晃動的影子",
        "空氣中帶點乾糙的氣息",
        "玻璃反射出一層淡淡光暈",
        "遠方人聲像被壓低了一樣",
        "地面反著一點潮濕亮光",
        "門口風鈴短短響了一聲",
        "日光被窗框切成幾塊",
        "牆面留著午後偏黃的光",
        "背景裡有一點不清楚的招牌光",
        "空氣裡混著咖啡和雨水的味道",
        "椅腳摩擦地面的聲音很輕",
        "遠處傳來機車停下的聲音",
        "桌面陰影剛好壓住手邊小物",
        "風把布料吹出一點皺褶",
        "室內燈和自然光混在一起",
        "背景被淺景深柔柔地推遠"
    ];

    const action = pickOne([...(contextActions[contextKey] ?? contextActions.urban), ...commonActions]);
    const debris = pickOne([...(contextDebris[contextKey] ?? contextDebris.urban), ...commonDebris]);
    const atmos = pickOne(atmospheres);
    const detail = pickOne(envDetails);
    
    const travelNote = isTraveling ? `這次離開熟悉的${baseCity}，跑到${targetCity}讓自己換一種節奏。` : "";
    const rawSceneLabel = scene.name_zh || scene.event || "";
    const rawActivityLabel = scene.event || scene.name_zh || "日常片刻";
    const sceneCity = scene.city && scene.city !== "any" ? scene.city : targetCity;

    const nonPlaceTerms = [
        "等待", "滴到", "燒焦", "初學", "手沖", "外送", "Uber", "Eats",
        "發票", "饅頭", "充電線", "外送袋", "紙巾", "手機殼", "包包拉鍊", "髮圈"
    ];

    const isLikelyNonPlace = (label: string) => {
        return nonPlaceTerms.some(term => label.includes(term));
    };

    const placeLabel = rawSceneLabel && !isLikelyNonPlace(rawSceneLabel)
        ? `${sceneCity}${rawSceneLabel}`
        : `${sceneCity}的生活角落`;

    const activityLabel = rawActivityLabel && rawActivityLabel !== rawSceneLabel
        ? rawActivityLabel
        : (isLikelyNonPlace(rawSceneLabel) ? rawSceneLabel : "一段沒有被刻意安排的日常");

    // 5. 模板組合
    const templates = [
        // 模板 A
        `${travelNote}這次鏡頭落在${placeLabel}，${action}。${debris}，空氣裡有一點${atmos}，反而讓畫面不像被安排好的。`,
        // 模板 B
        `${travelNote}人在${placeLabel}，剛好遇上${activityLabel}。${action}，${debris}，這些不太整齊的小痕跡，讓今天看起來更像真的發生過。`,
        // 模板 C
        `${travelNote}畫面停在${placeLabel}，${activityLabel}被留在背景裡。${action}，旁邊${debris}，視線一角還有${detail}。`
    ];

    let finalResult = templates[Math.floor(Math.random() * templates.length)];

    // 六、防呆檢查：禁止物件或事件被當成地點使用
    const badLocationPhrases = [
        "Uber Eats 玄關等待裡",
        "食物滴到白衣裡",
        "初學手沖燒焦裡",
        "人在饅頭",
        "人在發票",
        "人在充電線",
        "人在外送袋",
        "人在光影",
        "人在生活碎屑",
        "人在鍵盤",
        "人在杯套",
        "人在紙巾",
        "人在手機殼",
        "人在包包拉鍊",
        "人在髮圈"
    ];

    const hasBadLocationPhrase = badLocationPhrases.some(phrase => finalResult.includes(phrase));
    if (hasBadLocationPhrase) {
        finalResult = `${travelNote}這次鏡頭落在${sceneCity}的生活角落，${action}。${debris}，空氣裡有一點${atmos}，反而讓畫面不像被安排好的。`;
    }

    return {
        text: finalResult,
        sceneId: scene.scene_id
    };
};

/**
 * Generates a random event based on the character's footprints and vibe (Legacy Wrapper).
 */
export const generateRandomEvent = (model: Model): string => {
    return generateRandomEventWithScene(model).text;
};
