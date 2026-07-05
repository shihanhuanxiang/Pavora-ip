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
