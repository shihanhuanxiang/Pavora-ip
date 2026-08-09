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
     * 這個 IP 是否同時是「品牌代言人」（2026-08-05 新增，企劃案 B-8 步驟 1）。
     *
     * 背景：專案原本有**兩套平行的「人」**——`Model`（IP）與 `BrandAmbassador`
     * （`useBrandStore.ambassadors`）。Hank 拍板合併成一套。
     *
     * 盤點（`盤點_C軌_2026-08-01/盤點_B8_合併代言人_2026-08-05.md`）證明合併可行且低風險：
     *   - `BrandAmbassador` 是 `Model` 的**貧化子集**。它多出來的 3 個欄位裡，
     *     `ethnicity`／`bodyType` 是硬寫死值（'Asian'／'Standard'）、`faceAnchorParams` 零讀取。
     *   - 全 repo 的生圖身份錨點只讀 `imageUrl`（10 處）與 `name`（3 處），
     *     **沒有任何一處讀那 3 個獨有欄位**——而 Model 兩者都有。
     *   - 圖片兩者都存在同一個 IndexedDB（`idb://` URL），合併時零遷移。
     *
     * ⚠️ 步驟 1 只是**新增**這個欄位與對應的 store API，`useBrandStore` 完全不動、
     * 兩套並存，現有行為零改變。真正把讀取端切過來是步驟 2，資料遷移是步驟 3。
     */
    isAmbassador?: boolean;
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
