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

export interface WardrobeItem { id: string; name: string; imageUrl: string; category: string; schemaVersion?: string; analysis?: any; tags?: string[]; color?: string; }
export type StoredApparelItem = WardrobeItem;

export interface OutfitPreset { id: string; label: string; prompt: string; category: string; gender: 'male' | 'female'; }
