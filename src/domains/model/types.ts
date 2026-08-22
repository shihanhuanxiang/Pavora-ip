// PAVORA domain: model
// 從 src/shared/types/types.ts 搬遷而來的 Model 域型別（模特兒身份、外觀、鎖定）。
// 搬遷依據：handoff_docs/PAVORA_CONVERGENCE_BLUEPRINT_2026-07-04.md Stage A（Model 域收斂）。
// 型別內容為一字不改的搬移，若需修改語意請先確認影響範圍。

import type { ModelData, StoryArc, IdentityThread, ContentCategory } from '../../shared/types/types';

export interface IPPersona {
    coreVibe: string;
    mbti?: string;
    profession?: string;
    socialStatus?: string;
    catchphrase?: string;
    postingHabit?: string;
    toneOfVoice?: string;
    locked_descriptor?: string;
}

export interface IPVisualConstants {
    catchlightPreference?: string;
    signaturePoses?: string[];
    stylingFilters?: string[];
    facialBoneStructure?: string;
    expressionStyle?: string;
    colorTone?: string;
    poseEnergy?: string;
}

export interface IPLifeCircuit {
    primaryCity?: string;
    primaryDistrict?: string;
    interests?: string[];
    relationships?: string[];
}

export interface IPStyleBible {
    referenceId?: string;
    contentTargets?: Record<ContentCategory, number>;
    visualKeywords?: string[];
    signatureScenes?: string[];
    signatureOutfits?: string[];
    signaturePoses?: string[];
    expressionPalette?: string[];
    cameraLanguage?: string[];
    colorPalette?: string[];
    captionTone?: string[];
    avoid?: string[];
    notes?: string;
    updatedAt?: number;
}

export interface AdvancedPhysiqueStats {
    bustTension: number;
    physiqueCurvature: number;
    muscularDensity: number;
    vTaperScale: number;
    /**
     * 頭身比（2026-08-04 新增，企劃案 B-6）。
     *
     * 為什麼要進 advancedStats：B-6 新增了頭身比滑桿，但這個欄位原本不在任何
     * 持久化結構裡——調完生成一次是對的，可是存檔、繼承、休息室重生之後
     * 會**靜默回到預設 7.5**，使用者完全不會察覺自己的設定被丟掉了。
     *
     * optional 是為了向後相容：既有的 Model 資料沒有這個欄位，
     * 讀取端一律用 `?? 7.5` 兜底。
     */
    headBodyRatio?: number;
}

export interface WorldAnchors {
    pet?: {
        breed: string;
        name: string;
        description: string;
        traits: string[];
    };
    relationships?: {
        name: string;
        relation: string;
        personality: string;
        memo: string;
    }[];
    iconicItems?: {
        name: string;
        description: string;
        significance: string;
    }[];
    longTermMemories?: string[];
}

export interface VisualIdentityHint {
  subjectDescriptor: string;
  facialLineageHint: string;
  styleReferenceHint: string;
  hairMakeupHint: string;
}

export interface Model {
    id: string;
    name: string;
    imageUrl: string;
    type: 'standard' | 'custom';
    schemaVersion?: string;
    /**
     * 2026-08-14（階段 7 · A3）：**`isAmbassador` 已移除。**
     *
     * 沿革：專案原本有兩套平行的「人」——`Model`（IP）與 `BrandAmbassador`
     * （`useBrandStore.ambassadors`）。B-8（2026-08-05）把它們併成一套，
     * 做法是在 `Model` 上加這個布林旗標。
     *
     * 現在整個「代言人」概念都不要了。Hank 2026-08-14 裁決原文：
     * 「把代言人移除，那是靈魂敘事這個功能還沒做之前的瑕疵版」。
     * 臉部來源一律取全站唯一的當前 IP（`useModelStore.getActiveModel()`），
     * 各模組用自己的「鎖定當前 IP 臉部」開關決定要不要餵進生圖，預設不鎖。
     *
     * ⚠️ 存量資料裡殘留的 `isAmbassador: true` 不必清——沒有任何讀取端，
     *    留著是無害的死欄位；動使用者存量資料的風險大於留著它。
     */
    /**
     * 建立這個 IP 時實際送出的生成參數（2026-08-14，Hank 裁決「存」）。
     *
     * 為什麼要存：2026-08-14 查 Kai 為什麼出圖是白人臉時，發現
     * **完全無法回溯他當初選了哪個臉部原型**——`Model` 只存結果不存輸入，
     * 而 24 個原型裡有 20 個沒有東亞錨定，選到哪一個決定了臉會不會漂。
     * 那次只能從 `locked_descriptor` 的措辭反推「高度疑似 mixed_aesthetic」，
     * 這種追查方式不可靠也不該重複。
     *
     * ⚠️ 全部 optional：既有 IP 沒有這個欄位，讀取端必須容忍 undefined。
     *    這是純診斷用途，**不要拿它當生圖輸入**——生圖的權威來源是
     *    `persona.locked_descriptor` 與 `visualIdentityHint`。
     */
    creationParams?: {
        archetype?: string;
        skinTone?: string;
        proportionMode?: string;
        netRedLevel?: number;
        hairStyle?: string;
        hairLength?: string;
        makeupStyle?: string;
        /** 建立當下的時間戳，用來對齊 prompt 版本 */
        createdAtMs?: number;
    };
    persona?: IPPersona;
    visualIdentityHint?: VisualIdentityHint;
    visualConstants?: IPVisualConstants;
    lifeCircuit?: IPLifeCircuit;
    worldAnchors?: WorldAnchors;
    styleBible?: IPStyleBible;
    stats?: ModelData['stats'];
    advancedStats?: AdvancedPhysiqueStats;
    gender?: string;
    age?: number;
    preferences?: {
        preferred_archetypes?: string[];
        aesthetic_tier_min?: number;
        aesthetic_tier_max?: number;
        active_arc_id?: string | null;
        active_arc_phase_index?: number;
        active_outfit_id?: string | null;
        /**
         * 2026-08-14：`active_outfit_id` 是誰寫的。
         *
         * `true`  = 使用者在衣櫥手動點「設為當前造型」，是刻意的鎖定，要一直黏著。
         * `false` = 產圖流程 `confirmSceneOutfit()` 順手記下的「上次挑的那套」，
         *           使用者下次按「略過，自動搭配」時應該被清掉。
         * `undefined` = 舊資料（本欄位之前寫入的），一律視同 `false`。
         *
         * 為什麼需要這個欄位：在此之前兩種來源共用同一格，而流程只寫不清，
         * 結果挑過一次衣服後每一次「略過，自動搭配」都在沿用那套舊衣服，
         * 換場景不換衣服，服裝自帶的 props 還會跟場景打架
         * （W-7 黃金測試：G03 房間床邊出現夜市食物竹籤）。
         */
        active_outfit_pinned?: boolean;
        recent_outfit_ids?: string[];
        visual_preset_id?: string | null;
        face_reference_urls?: string[];
        manual_wear_state?: string | null;
        active_threads?: {
            thread_id: string;
            current_milestone_index: number;
            last_update_timestamp: number;
        }[];
        persona_extension?: {
            best_friend_name?: string;
            pet_name?: string;
            hometown?: string;
        };
        enable_story_arcs?: boolean;
        enable_identity_threads?: boolean;
        custom_story_arcs?: StoryArc[];
        custom_identity_threads?: IdentityThread[];
    };
    gallery?: {
        id: string;
        url: string;
        timestamp: number;
        narrativeContent?: string;
        visualPrompt?: string;
        visualPromptZH?: string;
        contentCategory?: ContentCategory;
        styleTags?: string[];
        driveFileId?: string;
        driveLink?: string;
        driveSyncedAt?: string;
    }[];
}
