import { CompositionInjectionRule } from "../../../shared/types/types";

export const COMPOSER_INJECTION_RULES: CompositionInjectionRule[] = [
  {
    "rule_id": "RULE-RELATIONSHIP",
    "depth_module_id": 1,
    "description": "每週至少 1 篇關係層,優先選擇 best_friend_kiki / pet_mantou,grandma 較稀少(每月 1-2 次)",
    "weekly_quota": {
      "min": 1,
      "max": 2
    },
    "probability_per_post": 0.18,
    "persona_weight": {
      "best_friend_kiki": 0.45,
      "pet_mantou": 0.4,
      "grandma_southern": 0.1,
      "family_father": 0.05
    },
    "compatible_with_modules": [2, 3, 4, 5, 6, 7, 8],
    "exclusive_with_modules": [9],
    "prompt_injection_position": "after_scene_token"
  },
  {
    "rule_id": "RULE-INBETWEEN",
    "depth_module_id": 2,
    "description": "中間場域是『日常感』主力,每週 2-3 篇,平衡掉太多『目的地』場景",
    "weekly_quota": {
      "min": 2,
      "max": 3
    },
    "probability_per_post": 0.3,
    "compatible_with_modules": [1, 3, 5, 6, 7],
    "exclusive_with_modules": [],
    "prompt_injection_position": "scene_replacement"
  },
  {
    "rule_id": "RULE-VULNERABILITY",
    "depth_module_id": 3,
    "description": "脆弱瞬間 engagement 最高但不能太多 — 每週最多 1 篇,避免角色變成『總是受害者』",
    "weekly_quota": {
      "min": 0,
      "max": 1
    },
    "probability_per_post": 0.1,
    "compatible_with_modules": [1, 2, 5, 7],
    "exclusive_with_modules": [9],
    "prompt_injection_position": "scene_replacement"
  },
  {
    "rule_id": "RULE-STORY-ARC",
    "depth_module_id": 4,
    "description": "故事弧由 Orchestrator 主動規劃。每月選 1 條 arc,scenes 按 spacing_days 分散排程",
    "weekly_quota": {
      "min": 0,
      "max": 2
    },
    "compatible_with_modules": [1, 2, 5, 8],
    "exclusive_with_modules": [],
    "prompt_injection_position": "structured_replacement"
  },
  {
    "rule_id": "RULE-OBJECT-FOCUS",
    "depth_module_id": 5,
    "description": "物品中心(無臉貼文)— 對 Threads 友善、對 IG Reels 不適合,排程時自動跳過 IG video slot",
    "weekly_quota": {
      "min": 1,
      "max": 2
    },
    "probability_per_post": 0.15,
    "prefer_platforms": ["threads"],
    "avoid_platforms": ["instagram_reels"],
    "compatible_with_modules": [1, 4, 7, 8],
    "exclusive_with_modules": [9],
    "prompt_injection_position": "scene_replacement"
  },
  {
    "rule_id": "RULE-DIGITAL",
    "depth_module_id": 6,
    "description": "數位生活痕跡,讓 IP 跟粉絲是『同代人』,週 1-2 篇即足",
    "weekly_quota": {
      "min": 1,
      "max": 2
    },
    "probability_per_post": 0.15,
    "compatible_with_modules": [1, 2, 3, 7, 8],
    "exclusive_with_modules": [],
    "prompt_injection_position": "scene_replacement"
  },
  {
    "rule_id": "RULE-WEATHER",
    "depth_module_id": 7,
    "description": "天氣事件由 weather API 觸發。寒流 / 颱風 / 熱浪等真實天氣事件發生 24h 內必排 1 篇",
    "weekly_quota": {
      "min": 0,
      "max": 1
    },
    "trigger": "weather_api_event",
    "compatible_with_modules": [1, 2, 3, 5, 6],
    "exclusive_with_modules": [9],
    "prompt_injection_position": "scene_replacement"
  },
  {
    "rule_id": "RULE-IDENTITY-THREAD",
    "depth_module_id": 8,
    "description": "身份線是長期敘事 — 每週 1-2 篇推進。每位 Operator 至少選定 1 條 thread,可跑 12-24 週",
    "weekly_quota": {
      "min": 1,
      "max": 2
    },
    "compatible_with_modules": [1, 2, 5, 6],
    "exclusive_with_modules": [],
    "prompt_injection_position": "structured_replacement"
  },
  {
    "rule_id": "RULE-EMOTIONAL-INTIMACY",
    "depth_module_id": 9,
    "description": "情緒撩 — X / 付費牆專用,IG 完全跳過。每週 1-2 篇,均勻分散到付費平台",
    "weekly_quota": {
      "min": 1,
      "max": 2
    },
    "probability_per_post": 0.18,
    "prefer_platforms": ["x", "fanvue", "onlyfans"],
    "avoid_platforms": ["instagram", "threads"],
    "compatible_with_modules": [],
    "exclusive_with_modules": [1, 3, 7],
    "prompt_injection_position": "scene_replacement"
  }
];
