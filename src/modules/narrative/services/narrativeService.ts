import { getGeminiClient } from "../../../shared/services/core/geminiClient";
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
const pickOutfit = (model: Model, contextId: string, targetTier: number): OutfitV2 => {
    // 0. Manual override if active_outfit_id is set
    if (model.preferences?.active_outfit_id) {
        const userOutfits = WardrobeService.getUserOutfits();
        const found = [...OUTFIT_SEEDS_V2, ...userOutfits].find(o => o.outfit_id === model.preferences?.active_outfit_id);
        if (found) return found;
    }

    // 1. Get combined pool (Seeds + User custom)
    const userOutfits = WardrobeService.getUserOutfits();
    const fullPool = [...OUTFIT_SEEDS_V2, ...userOutfits];

    // 2. Filter by gender (M/F matching or Unisex)
    let pool = fullPool.filter(o => 
        o.gender === model.gender?.charAt(0).toUpperCase() || o.gender === 'U'
    );

    // 2. Filter by context (e.g., home_cozy, urban_street)
    pool = pool.filter(o => o.compatible_contexts.includes(contextId));

    // 3. Filter by archetype if characters has preferences
    const preferred = model.preferences?.preferred_archetypes || [];
    if (preferred.length > 0) {
        const archetypeFiltered = pool.filter(o => preferred.includes(o.style_archetype));
        if (archetypeFiltered.length > 0) pool = archetypeFiltered;
    }

    // 4. Filter by target tier
    const tierFiltered = pool.filter(o => o.aesthetic_tier === targetTier);
    if (tierFiltered.length > 0) pool = tierFiltered;

    // Fallback: Pick anything if pool is empty after all filters
    if (pool.length === 0) return OUTFIT_SEEDS_V2[0];

    // 5. Cooldown filter: exclude recently used outfits
    const recentIds: string[] = model.preferences?.recent_outfit_ids || [];
    const cooledPool = pool.filter(o => !recentIds.includes(o.outfit_id));

    // Fallback: if cooldown makes pool empty, allow repeats
    const finalPool = cooledPool.length > 0 ? cooledPool : pool;

    // Random pick
    return finalPool[Math.floor(Math.random() * finalPool.length)];
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
    const layer1 = model.persona?.locked_descriptor 
        ? `${model.persona.locked_descriptor}${facialDesc}`
        : `${model.name}, ${model.gender === 'M' ? 'Asian man' : 'Asian woman'}, ${model.age}yo, ${model.persona?.coreVibe || ''}${facialDesc}`;
    
    // Layer 2: depth_module_scene (if extended)
    const layer2 = (scene && scene.depth_module_id) ? scene.event : "";
    
    // Layer 3: outfit_token
    // POV 模式下跳過 hand_occupation 注入，避免與 Layer 8 衝突
    const handAction = options?.isPOV === true ? "" : injectHandOccupation(outfit);
    const fabricSafe = getFabricSafeguard(outfit);
    const wearStateText = `wear state: ${outfit.wear_state.replace('_', ' ')}`;
    const layer3 = `${outfit.prompt_skeleton}, ${wearStateText}, ${handAction}${fabricSafe}`;
    
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
        if (rules.length > 0) layer7_5 = rules.join('. ');
    }
    
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
            // 全身構圖類
            "full body shot, natural standing posture, slight weight shift to one side, candid street photography",
            "full body candid, mid-stride walking, motion captured naturally, subject unaware",
            "full body from slight low angle, subject looking ahead, documentary style",
            "full body reflected in shop window or mirror, subject seen from behind",
            
            // 半身構圖類
            "medium shot from chest up, three-quarter angle, slight head tilt, soft background bokeh",
            "medium shot, subject looking slightly off-frame at something, candid expression",
            "half body shot from slightly above, subject looking downward, intimate mood",
            "medium shot from behind slightly, subject turning head, hair movement visible",
            
            // 特寫構圖類
            "close-up on face and shoulders, shallow depth of field, bokeh background, golden hour light",
            "portrait close-up, three-quarter profile, natural window light on one cheek",
            "extreme close-up on eyes and upper face only, lower face cropped out",
            "close-up on neck collarbone and shoulder, face partially visible at edge",
            
            // 低角度類（對標帳號高頻）
            "low angle from below waist height, legs and lower body prominent, subject looking down at camera",
            "very low angle from floor level, full legs visible, urban background in upper frame",
            "low angle upward shot emphasizing legs and outfit from knee down",
            
            // 俯角類
            "overhead slightly, subject seated, looking up at camera with relaxed expression, no photographer hand visible, no camera in frame, as if camera is floating",
            "bird's eye view, subject lying on bed or floor, full body from above, no photographer hand visible, no camera in frame, floating camera perspective",
            "slight overhead angle, subject looking down at something in hands, no photographer hand visible, no extra hands in frame",
            
            // 環境融入類
            "wide shot with subject as smaller element in larger environment, sense of scale",
            "subject partially obscured by foreground element, framed naturally",
            "side profile full body, subject in motion, cinematic horizontal crop",
            
            // 細節與局部類
            "extreme close-up on hands holding object, face softly visible in background",
            "detail shot focusing on outfit texture and accessories, face partially cropped",
            "close-up on feet and shoes, legs visible above, ground texture prominent",
            
            // 坐姿類
            "seated candid, three-quarter angle, crossed legs visible, relaxed posture",
            "seated at table or counter, upper body leaning slightly forward, natural gesture",
            
            // 動態類
            "subject mid-laugh or candid expression, caught in natural moment",
            "subject in motion turning around, hair caught in movement, dynamic energy",
        ];
        // 如果 IP 有設定招牌姿勢，70% 機率優先使用
        const signaturePoses = model.visualConstants?.signaturePoses || [];
        if (signaturePoses.length > 0 && Math.random() < 0.7) {
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
        const masters = ["Annie Leibovitz", "Peter Lindbergh", "Helmut Newton"];
        const master = masters[Math.floor(Math.random() * masters.length)];
        layer9 += `, shot in style of ${master}, Renaissance portrait composition, fine art photography`;
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

    return cleanPromptV2(parts.join('\n'));
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
        const masters = ["Annie Leibovitz", "Peter Lindbergh", "Helmut Newton"];
        const master = masters[Math.floor(Math.random() * masters.length)];
        prompt += `, shot in style of ${master}, Renaissance portrait composition, fine art photography`;
    }

    if (tier === 5) {
        const obscurers = ["long flowing hair", "morning mist", "sheer curtain", "back turned to camera", "classical drapery", "dappled shadow"];
        const obscure = obscurers[Math.floor(Math.random() * obscurers.length)];
        prompt += `, implied not shown, mood-based composition, subject partially obscured by ${obscure}`;
    }

    return cleanPromptV2(prompt);
};

/**
 * Generates a creative, dynamic event trigger based on the model's persona, life circuit, and previous events.
 */
export const generateDynamicEvent = async (model: Model, lastEntry?: { content?: string, mood?: string }): Promise<string> => {
    const client = await getGeminiClient(true) as any;
    const relationshipJson = JSON.stringify(model.worldAnchors?.relationships || []);
    
    // Retrieve city-specific knowledge
    const city = model.lifeCircuit?.primaryCity || '台北市';
    let localKnowledge = getScenesByCity(city);
    
    // Diversity Injection: 40% chance to look "elsewhere" or use a broader pool if city Knowledge is sparse
    if (localKnowledge.length < 5 || Math.random() < 0.4) {
        localKnowledge = LOCALIZED_SCENES;
    }
    
    const scene = localKnowledge[Math.floor(Math.random() * localKnowledge.length)];

    const identityHeader = `
【!!! 人格心理憲法 (Psychological Core) !!!】
- IP 姓名：${model.name}
- 性別代詞：${model.gender === 'female' ? 'She/Her' : 'He/Him'} (絕對禁止錯亂)
- MBTI 人格：${model.persona?.mbti || 'ISTP'}
- 核心氛圍：${model.persona?.coreVibe || '自然真實'}
- 長期記憶：${model.worldAnchors?.longTermMemories?.join('、') || '無特別記憶'}
`;

    const contextHeader = lastEntry ? `
【時空連貫 (Timeline Context)】
- 上一則動態：“${lastEntry.content}”
- 該事件對心理的延續影響：請從這裡延伸，確保角色生活在流動的時間裡。
    ` : '【新故事線起始】目前尚無前置事件，請創造一個令人驚艷的開場。';

    const prompt = `
        ${identityHeader}
        ${contextHeader}
        你現在是這名數位 IP 的【靈體編導兼微文學作家】。請根據其人格底座，在【${city}】策劃一則具備「台灣體溫」且能引起粉絲強烈共鳴的敘事靈感。
        
        【待處現場 (Liminal/City DNA)】
        - 事件原型：${scene.event}
        - 原始感官標籤：${scene.sensory}
        - 原始生活雜訊：${scene.visualNoise}
        - 可選情緒維度：${scene.emotions.join('、')}
        
        【任務：靈魂敘事轉化 (Creative Transformation)】
        1. **心理主動權**：不要隨機選擇情緒。請根據 ${model.name} 的 MBTI (${model.persona?.mbti}) 與「上一則動態」，主動從可選維度中鎖定一個最合理的心理切入點。
        2. **解鎖文字張力**：
           - **嚴禁**輸出 40 字以下的短句。
           - **長度區間**：60 - 120 字。
           - **強結構化**：敘述必須嚴格遵循 [環境冷暖/氣息描述] -> [此刻的主體微小動態] -> [一個深刻的生活碎屑（如揉皺的發票、捷運進站的風壓）]。
        3. **脆弱性注入**：在生活中加入 20% 的不完美（例如：因為腳痛稍微調整了高跟鞋、被雨淋濕的狼狽感、或戴著口罩悶熱的呼吸）。
        4. **語言風格**：繁體中文。帶有一點孤獨但優雅的現代都市質感。

        直接輸出內容，不需任何前言或引號。
    `;

    try {
        const resultResponse = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });
        const resultText = (resultResponse.text || "").trim();
        
        // Fallback for very short outputs
        if (resultText.length < 30) throw new Error("Output too short, entering fallback");
        return resultText;
    } catch (e) {
        console.warn("Pro brain generation failed, using random engine:", e);
        return generateRandomEvent(model);
    }
};

/**
 * Generates a deeply immersive narrative diary and visual prompt based on the persona base.
 */
export const generateIPDiary = async (model: Model, event: string, options?: { isPOV?: boolean, lastEntry?: { content?: string, mood?: string }, forcedSceneId?: string }): Promise<Partial<DiaryEntry>> => {
    const client = await getGeminiClient(true) as any;

    // 1. Context and Scene Selection
    const city = model.lifeCircuit?.primaryCity || '台北市';
    
    // Forced Scene override
    let sceneContext: ExtendedScene | any;
    if (options?.forcedSceneId) {
        sceneContext = ALL_EXTENDED_SCENES.find(s => s.scene_id === options.forcedSceneId) || LOCALIZED_SCENES[0];
    } else {
        // Choose between base scenes and extended scenes
        // 60% chance for extended depth module scenes if any
        const useExtended = Math.random() < 0.6;
        if (useExtended) {
            const localExtended = ALL_EXTENDED_SCENES.filter(s => s.city === city || s.city === "any");
            sceneContext = localExtended[Math.floor(Math.random() * localExtended.length)] || LOCALIZED_SCENES[0];
        } else {
            const localKnowledge = getScenesByCity(city);
            sceneContext = localKnowledge[Math.floor(Math.random() * localKnowledge.length)] || LOCALIZED_SCENES[0];
        }
    }

    const location = event || sceneContext.event;
    const weather = "陰天偶陣雨"; 
    const activity = event;

    // 2. Selection of Aesthetic Tier and Outfit
    const minTier = model.preferences?.aesthetic_tier_min || 1;
    const maxTier = model.preferences?.aesthetic_tier_max || 2;
    const targetTier = Math.floor(Math.random() * (maxTier - minTier + 1)) + minTier;
    
    // Map activity to context
    let contextId = "urban_street";
    if (sceneContext.depth_module_id === 1) contextId = "home_cozy";
    else if (sceneContext.depth_module_id === 2) contextId = "travel_journey";

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

    const outfit = pickOutfit(model, contextId, targetTier);
    
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
- 語氣風格: ${model.persona?.toneOfVoice}

[今日情境]
- 地點: ${city} ${location}
- 天氣: ${weather}
- 活動: ${activity}

[視覺風格規範：Aesthetic Tier ${targetTier}]
1. 穿搭細節 (MUST FOLLOW EXACTLY):
   - 上身: ${outfit.pillars.top}
   - 下身: ${outfit.pillars.bottom}
   - 鞋履: ${outfit.pillars.shoes}
   - 配件: ${outfit.pillars.accessories.join(', ')}
   - 道具/手部狀態: ${outfit.pillars.props.join(', ')} (左手: ${outfit.hand_occupation.left_hand}, 右手: ${outfit.hand_occupation.right_hand})
2. 生理寫實協議 v2.2 (去除「痣」):
   - 強調微觀皮膚質地 (Micro-pores)、細微的不對稱性 (Asymmetry)。
   - 髮絲必須有散亂感 (Flyaways)，拒絕完美的 AI 頭盔感。
3. 提示詞架構 (Visual Prompt):
   - 核心提示詞預設值: ${finalVisualPrompt}
   - 你必須產出英文提示詞，並將其拆分為以下模塊格式：
     [Subject]: (包含生理寫實細節)
     [Apparel]: (包含本次指定的完整穿搭)
     [Environment]: (包含 ${city} 的場景碎屑與雜訊)
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
        
        return {
            content: data.content,
            mood: data.mood,
            visualPrompt: data.visualPrompt,
            visualPromptZH: data.visualPromptZH,
            meta: {
                ...data.meta,
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
        分析日記紀錄，提取出 1-3 個對未來連貫性有意義的記憶點（如：#買了某物、#去了某地）。
        【日記】: "${diaryContent}"
        【已有記憶】: ${existingMems.join(', ')}
        僅輸出 JSON 數組格式：["#標籤1", "#標籤2"]
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
 * Generates a random event based on the character's footprints and vibe.
 * Implements Phase 3: Dynamic sensory stitching and vulnerability filter.
 */
export const generateRandomEvent = (model: Model): string => {
    const baseCity = model.lifeCircuit?.primaryCity || '台北市';
    
    // 3.3 跨縣市「移動感」演算法 (30% chance)
    const isTraveling = Math.random() < 0.3;
    let targetCity = baseCity;
    if (isTraveling) {
        const otherCities = ["台北市", "新北市", "台中市", "台南市", "高雄市", "宜蘭縣", "花蓮縣", "屏東縣", "台東縣", "瑪祖"];
        targetCity = otherCities[Math.floor(Math.random() * otherCities.length)];
    }

    const localScenes = getScenesByCity(targetCity);
    const scene = localScenes[Math.floor(Math.random() * localScenes.length)];
    const emotion = scene.emotions[Math.floor(Math.random() * scene.emotions.length)];
    
    // 3.1 & 3.2 敘事深度拼接與脆弱性注入
    const sensory = scene.sensory.split('、');
    const noise = scene.visualNoise.split('、');
    const s = sensory[Math.floor(Math.random() * sensory.length)];
    const n = noise[Math.floor(Math.random() * noise.length)];

    const vulnerabilities = [
        "這時候領口的白色絲綢上，偏偏暈開了剛才忙亂中滴落的焦糖色咖啡痕跡，讓人有點心煩",
        "午後突如其來的地雷陣雨，讓原本細心整理的髮絲此刻有些狼狽地黏在發燙的臉頰上",
        "新買的海鹽拿鐵濺濕了桌上的筆記本邊緣，墨水在紙上緩緩化開，像是一場小小的事故",
        "高跟鞋磨得腳踝隱隱作痛，在繁華的街道上，每一步似乎都在挑戰社交禮儀的邊界",
        "因為感冒戴著厚重的口罩，呼吸間全是侷促的熱氣，視線似乎也跟著變得有些模糊"
    ];
    const vulnerability = Math.random() < 0.25 ? `。${vulnerabilities[Math.floor(Math.random() * vulnerabilities.length)]}` : "";

    const travelNote = isTraveling ? `這週末特地離開了熟悉的${baseCity}，獨自在${targetCity}隨意晃蕩。` : "";
    
    const narrativeTemplates = [
        `${travelNote}${emotion === '沉浸' ? '這瞬間，世界似乎安靜得只剩下細節。' : ''}人在${scene.event}，空氣裡全被${s}填滿了。視線一角是${n}${vulnerability}，這種真實的生活碎屑，反而讓人感覺活得踏實。`,
        `${travelNote}${emotion === '脆弱' ? '在大城市的縫隙裡，偶爾會感覺自己出奇地渺小。' : ''}此刻正待在${scene.event}，看著${n}發呆。聞得到${s}的氣息${vulnerability}，這就是都市特有的、帶著一點溫度的日常吧。`,
        `${travelNote}在${targetCity}的節奏裡，${scene.event}顯得格外清晰。鼻尖縈繞著${s}，身旁${n}在晃動${vulnerability}。${emotion === '釋然' ? '就把那些煩人的工作暫時忘在腦後吧。' : '這種平凡的時刻，其實最難得。'}`
    ];

    return narrativeTemplates[Math.floor(Math.random() * narrativeTemplates.length)];
};
