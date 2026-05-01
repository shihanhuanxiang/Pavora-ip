import { DepthModule } from "../../../shared/types/types";

export const DEPTH_MODULES: DepthModule[] = [
  {
    "id": 1,
    "code": "RELATIONSHIP",
    "name_zh": "關係層",
    "name_en": "Relationship Depth",
    "purpose": "讓粉絲感覺『她有別的人在生活裡』",
    "tag_field": "relationship_layer",
    "typical_quota_per_week": [1, 2]
  },
  {
    "id": 2,
    "code": "IN_BETWEEN",
    "name_zh": "中間場域",
    "name_en": "In-between Locations",
    "purpose": "移動 / 等待中的非精修瞬間,提升『日常感』",
    "tag_field": "in_between_location",
    "typical_quota_per_week": [2, 3]
  },
  {
    "id": 3,
    "code": "VULNERABILITY",
    "name_zh": "脆弱瞬間",
    "name_en": "Vulnerability Moments",
    "purpose": "微弱不順 → 最高 engagement,粉絲感覺『她也跟我一樣狼狽』",
    "tag_field": "vulnerability_tag",
    "typical_quota_per_week": [1, 1]
  },
  {
    "id": 4,
    "code": "STORY_ARC",
    "name_zh": "跨日故事弧",
    "name_en": "Cross-Day Story Arcs",
    "purpose": "同一物件 / 場景跨 3-4 篇連續貼文,讓粉絲 binge",
    "tag_field": "story_arc_id",
    "typical_quota_per_week": [0, 1]
  },
  {
    "id": 5,
    "code": "OBJECT_FOCUS",
    "name_zh": "物品中心敘事",
    "name_en": "Object-First Narrative",
    "purpose": "鏡頭從『她』移到『她身邊的東西』,Threads 友善",
    "tag_field": "object_focus",
    "typical_quota_per_week": [1, 2]
  },
  {
    "id": 6,
    "code": "DIGITAL_LIFE",
    "name_zh": "數位生活痕跡",
    "name_en": "Digital Life Layer",
    "purpose": "屏幕世代日常,讓 IP 跟粉絲同代",
    "tag_field": "digital_layer",
    "typical_quota_per_week": [1, 2]
  },
  {
    "id": 7,
    "code": "WEATHER_EVENT",
    "name_zh": "天氣 / 季節事件",
    "name_en": "Weather & Seasonal Events",
    "purpose": "跟『真實台灣天氣』同步,粉絲今天淋雨明天看你淋雨",
    "tag_field": "weather_event",
    "typical_quota_per_week": [0, 1]
  },
  {
    "id": 8,
    "code": "IDENTITY_THREAD",
    "name_zh": "身份線",
    "name_en": "Identity Threads",
    "purpose": "跨季的副業 / 興趣 / 健康儀式,讓粉絲『追進度』",
    "tag_field": "identity_thread_id",
    "typical_quota_per_week": [1, 2]
  },
  {
    "id": 9,
    "code": "EMOTIONAL_INTIMACY",
    "name_zh": "情緒撩(進階微辣)",
    "name_en": "Emotional Intimacy",
    "purpose": "不靠露點,靠情緒張力撩,X / 付費牆高 ARPU",
    "tag_field": "intimacy_emotional",
    "typical_quota_per_week": [1, 2]
  }
];
