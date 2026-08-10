// PAVORA domain: wardrobe
// Migrated from src/shared/types/types.ts (integrated outfit / single apparel item).
// Migration basis: handoff_docs/PAVORA_A3_WARDROBE_MERGE_PLAN.md package 1.
// Body copied verbatim; confirm impact scope before changing semantics.

export interface WardrobeOutfit {
    outfit_id: string;
    gender: 'F' | 'M' | 'U';
    style_archetype: string;
    context_id: string;
    aesthetic_tier: number;
    pillars: {
        layer_inner: string | null;
        top: string;
        layer_outer: string | null;
        bottom: string;
        shoes: string;
        accessories: string[];
        props: string[];
    };
    fabric_difficulty: 'safe' | 'medium' | 'hard';
    wear_state: string;
    layering_count: number;
    compatible_contexts: string[];
    hand_occupation: {
        left_hand: string;
        right_hand: string;
        both_busy: boolean;
    };
    prop_light_emit?: string[];
    prompt_skeleton: string;
}
export type OutfitV2 = WardrobeOutfit;

/**
 * `isWhiteBackground`（2026-08-09，企劃案 A-3／5-4 修重複去背）：
 * 這張圖已經是白底平拍圖，試衣間套用時可以跳過 AI 去背那一步。
 * 服裝設計產出的平拍圖本來就被要求 `#FFFFFF` 底（`prompts/apparel.ts` 的 PACKSHOT_SUFFIX），
 * 再跑一次去背等於讓模型把乾淨的圖重繪一遍，白白耗損品質。
 * 沒有這個旗標（undefined）＝維持原本行為，一律去背。
 */
export interface WardrobeItem { id: string; name: string; imageUrl: string; category: string; schemaVersion?: string; analysis?: any; tags?: string[]; color?: string; isWhiteBackground?: boolean; }
export type StoredApparelItem = WardrobeItem;

export interface OutfitPreset { id: string; label: string; prompt: string; category: string; gender: 'male' | 'female'; }
