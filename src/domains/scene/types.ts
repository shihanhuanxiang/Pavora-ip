// PAVORA domain: scene
// Stage A4 — 統一 scene schema 落點。詳見 handoff_docs/PAVORA_A4_SCENE_MERGE_PLAN.md
//
// 本檔採 base + 擴充分層：
// - SceneBase / SceneSafeMatrix：新設共用交集 + scene-safe matrix 預留骨架（全 optional，本階段不填值）。
// - NarrativeScene / NarrativeSceneExtended：narrative 場景實體（= 舊 LocalizedScene / ExtendedScene 一字不改），舊名 alias 相容。
// - FantasyScene：Fantasy 場景 preset（= 舊 ScenePresetV8 一字不改），舊名 alias 相容。
//
// 明確不 extends：NarrativeScene / FantasyScene 均不 extends SceneBase（保護既有讀取端型別，見計畫 §2.5）。

export interface SceneSafeMatrix {
  allowed_actions?: string[];      // 允許動作池（此場景可做的動作）
  forbidden_actions?: string[];    // 禁止動作池
  prop_pool?: string[];            // 道具池
  time_slots?: string[];           // 時段（沿用 narrative time_of_day 語意；預留供 BG/Fantasy 補）
  outfit_pool?: string[];          // 允許穿搭池（收斂 narrative outfit_suggestion/outfit_filter 語意）
  forbidden_outfit_pool?: string[];// 禁止穿搭池（收斂 forbidden_outfit_contexts）
  intensity_cap?: number;          // 強度上限（收斂 spicy_level 語意的上界）
}

export interface SceneBase {
  id?: string;             // 主鍵（narrative 舊資料另有 scene_id，見 NarrativeScene 相容）
  name_zh?: string;        // 中文名（Fantasy labelZh / SceneGen name 對位）
  name_en?: string;        // 英文名
  category?: string;       // 分類
  environment?: string;    // 環境/場景描述片段（Fantasy environment / SceneGen keyword 對位）
  safe_matrix?: SceneSafeMatrix;  // scene-safe matrix 預留（本階段不填值，只留欄位）
}

export interface NarrativeScene {
  id?: string;
  scene_id?: string;
  name_zh?: string;
  name_en?: string;
  city: string;
  region: "north" | "central" | "south" | "east" | "islands" | "all";
  category: string;
  event: string;
  sensory: string | any;
  visualNoise: string | any;
  promptSkeleton?: string;
  emotions?: string[];
}

export interface NarrativeSceneExtended extends NarrativeScene {
  depth_module_id: number;
  event_type_ref?: number[];
  season?: string[];
  time_of_day?: string[];
  outfit_hint?: string;
  outfit_filter?: string[];
  outfit_suggestion?: string[];
  forbidden_outfit_contexts?: string[];
  scene_context_id?: string;
  spicy_level?: number;
  pov_modes?: string[];
  negative_prompt?: string;
  visual_noise?: string[]; // Alternative naming in v1.1
  prompt_skeleton?: string; // Alternative naming in v1.1
  safe_matrix?: SceneSafeMatrix; // 居家 12 場景首批填值（2026-07-20）；沿用 SceneSafeMatrix，NarrativeSceneExtended 仍不 extends SceneBase，僅補此欄位供 checkAgainstSceneMatrix 讀取
  flags: {
    relationship_layer: string | null;
    story_arc_id: string | null;
    arc_phase: string | null;
    identity_thread_id: string | null;
    thread_milestone: string | null;
    object_focus: boolean;
    digital_layer: boolean;
    intimacy_emotional: boolean;
    in_between_location: boolean;
    vulnerability_tag: string | null;
    weather_event: string | null;
  };
}

// 舊名 alias（域內相容，見 PAVORA_A4_SCENE_MERGE_PLAN.md §2.2）
export type LocalizedScene = NarrativeScene;
export type ExtendedScene = NarrativeSceneExtended;

export interface FantasyScene {
  id: string;
  name?: string;
  labelZh: string;
  category: string;
  environment: string;
  lightingRig: string;
  atmosphere?: string;
}

// 舊名 alias（域內相容，見 PAVORA_A4_SCENE_MERGE_PLAN.md §2.3）
export type ScenePresetV8 = FantasyScene;
