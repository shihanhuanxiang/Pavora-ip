import { ExtendedScene } from "../../../shared/types/types";
import { PHOTOSHOOT_SAFE_MATRIX } from "./taiwanScenesPhotoshoot.safeMatrix";

/**
 * `model_photoshoot`「模特兒攝影」場景池（2026-08-13，企劃案 A-1／階段 6）。
 *
 * 這是婚紗 29／Cosplay 34／傳統 15 共 78 件正式款服裝的**唯一落點**。
 * Hank 2026-08-12 拍板：用一個「模特兒攝影」場合取代原本規劃的三個
 * （婚禮／傳統節慶／Cosplay 攝影棚）——IP 穿婚紗出現在「婚禮」得編故事，
 * 出現在「外拍」她就是在拍照的模特兒，那正是她的真實身分。
 *
 * 七大類 46 個場景：A 正統棚拍 8／B 有陳設搭景 6／C 室內自然光 8／
 * D 戶外都市 8／E 戶外自然 8／F 古蹟文化 5／G 教堂白紗 3。
 * 場景數刻意做多：78 件衣服全掛同一個場合，場景不夠就會產出「同一面白牆前的 78 種穿搭」。
 *
 * ⚠️ 三個刻意的設計，改之前先想清楚：
 * 1. `outfit_filter: ["model_photoshoot"]` 是**實際的服裝閘門**
 *    （`narrativeService` 先讀 outfit_filter，才退到 scene_context_id）。兩個都寫是為了雙保險。
 * 2. **B04 的描述刻意不寫「更衣室」**，寫「掛衣區／試裝」——「更衣」二字會誤觸既有的
 *    `fitting_room_office_food` 安全規則（企劃案 A-1 陷阱 3）。
 * 3. F01 宮廟的 promptSkeleton 明寫 `--no deity statue`：拍到神像是宗教敏感，不是美感問題。
 *
 * ⚠️ `MIN_POOL_SIZE = 12`：本場合的服裝池有 78 件，遠超門檻，
 *    不會觸發「自動補入 urban_street 日常服湊數」那個災難。
 */
const RAW_PHOTOSHOOT_SCENES: ExtendedScene[] = [
  {
    "scene_id": "TW-SHOOT-A01",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "純白棚拍無限背景",
    "name_en": "White Infinity Studio",
    "city": "any",
    "region": "all",
    "category": "棚內攝影",
    "event": "純白背景棚拍",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "afternoon"
    ],
    "sensory": "閃燈回電聲、地板膠帶味、空調風",
    "visualNoise": "無限白牆、棚燈、反光板",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 1,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} in a seamless pure white studio (#FFFFFF) infinity background, even soft studio light, clean shadowless backdrop, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-A02",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "純黑背景單側硬光",
    "name_en": "Black Backdrop Side Light",
    "city": "any",
    "region": "all",
    "category": "棚內攝影",
    "event": "黑底輪廓棚拍",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "evening"
    ],
    "sensory": "靜電聲、燈頭高溫味",
    "visualNoise": "黑背景紙、單燈、蜂巢罩",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} against a pure black studio backdrop with a single hard side light carving the silhouette, deep falloff, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-A03",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "中灰背景棚拍",
    "name_en": "Mid Grey Studio",
    "city": "any",
    "region": "all",
    "category": "棚內攝影",
    "event": "中灰背景膚色基準拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "afternoon"
    ],
    "sensory": "快門聲、腳架金屬碰撞",
    "visualNoise": "中灰背景紙、灰卡",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 1,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} against a mid-grey (about 70% brightness) seamless studio backdrop, neutral colour-accurate lighting, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-A04",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "色紙背景棚拍",
    "name_en": "Coloured Paper Backdrop",
    "city": "any",
    "region": "all",
    "category": "棚內攝影",
    "event": "莫蘭迪色紙背景拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "afternoon"
    ],
    "sensory": "紙捲摩擦聲、涼空調",
    "visualNoise": "莫蘭迪粉／鼠尾草綠／奶油黃背景紙",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 1,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} against a muted Morandi-tone coloured paper backdrop (dusty pink, sage green or butter yellow), soft even light, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-A05",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "大柔光箱平光",
    "name_en": "Large Softbox Flat Light",
    "city": "any",
    "region": "all",
    "category": "棚內攝影",
    "event": "商品導向平光棚拍",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "afternoon"
    ],
    "sensory": "風扇聲、柔光布抖動",
    "visualNoise": "八角柔光箱、白牆",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 1,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} under a large frontal softbox giving flat even light that reveals every garment detail, catalogue lighting, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-A06",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "硬光高反差棚拍",
    "name_en": "Hard Light High Contrast",
    "city": "any",
    "region": "all",
    "category": "棚內攝影",
    "event": "雜誌感硬光棚拍",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "evening"
    ],
    "sensory": "裸燈高溫、地板反光",
    "visualNoise": "裸燈頭、黑旗、水泥地",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} under a single bare hard light creating high-contrast editorial shadows, crisp specular highlights, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-A07",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "無縫弧面全身棚拍",
    "name_en": "Seamless Curve Full Body",
    "city": "any",
    "region": "all",
    "category": "棚內攝影",
    "event": "背景紙捲地全身棚拍",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "afternoon"
    ],
    "sensory": "紙捲展開聲、鞋底摩擦",
    "visualNoise": "背景紙捲至地面、無縫弧面",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 1,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} on a seamless paper sweep curving from wall to floor, full-length framing including footwear, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-A08",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "鏡面地板棚拍",
    "name_en": "Mirror Floor Studio",
    "city": "any",
    "region": "all",
    "category": "棚內攝影",
    "event": "鏡面地板反射棚拍",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "evening"
    ],
    "sensory": "玻璃震動、腳步回音",
    "visualNoise": "鏡面地板、鏡牆、燈架倒影",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} on a mirrored studio floor with a clean reflection doubling the silhouette, useful for capes and long hems, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-B01",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "白紗簾午後斜光",
    "name_en": "Sheer Curtain Afternoon",
    "city": "any",
    "region": "all",
    "category": "棚內搭景",
    "event": "白紗簾搭景拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "afternoon"
    ],
    "sensory": "紗簾摩擦、午後暖風",
    "visualNoise": "白紗簾、硬地板、光斑",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} in a studio set with white sheer curtains and hard flooring, late afternoon raking sunlight through the fabric, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-B02",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "老木地板復古椅",
    "name_en": "Vintage Chair Wood Floor",
    "city": "any",
    "region": "all",
    "category": "棚內搭景",
    "event": "老木地板單椅搭景",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "afternoon"
    ],
    "sensory": "木頭吱呀、灰塵味",
    "visualNoise": "老木地板、單張復古扶手椅",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} in a studio set with aged wooden flooring and a single vintage armchair, warm directional light, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-B03",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "水泥粉光牆鐵框窗",
    "name_en": "Concrete Wall Steel Window",
    "city": "any",
    "region": "all",
    "category": "棚內搭景",
    "event": "水泥牆鐵窗搭景",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "afternoon"
    ],
    "sensory": "水泥涼意、金屬敲擊",
    "visualNoise": "水泥粉光牆、鐵框窗、灰塵光束",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} in a studio set with polished concrete walls and a steel-framed window, cool directional daylight, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-B04",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "掛衣區試裝搭景",
    "name_en": "Wardrobe Rail Fitting Area",
    "city": "any",
    "region": "all",
    "category": "棚內搭景",
    "event": "掛衣區試裝拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "afternoon"
    ],
    "sensory": "衣架滑動、布料摩擦",
    "visualNoise": "大面落地鏡、掛衣桿、成排服裝",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} in a studio fitting area with a full-length mirror and garment rails, soft practical lighting, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-B05",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "淺水面反射搭景",
    "name_en": "Shallow Water Reflection",
    "city": "any",
    "region": "all",
    "category": "棚內搭景",
    "event": "濕地板反射搭景",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "evening"
    ],
    "sensory": "水滴聲、潮濕空氣",
    "visualNoise": "淺水面、濕地板、漣漪反光",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} on a shallow water surface in studio, rippling reflections under controlled light, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-B06",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "乾冰薄霧逆光",
    "name_en": "Dry Ice Haze Backlight",
    "city": "any",
    "region": "all",
    "category": "棚內搭景",
    "event": "乾冰薄霧逆光拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "evening"
    ],
    "sensory": "乾冰白霧、低溫、機器嗡鳴",
    "visualNoise": "乾冰薄霧、逆光光束",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} in studio haze from dry ice with strong backlight creating visible light beams and rim glow, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-C01",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "老屋窗邊自然光",
    "name_en": "Old House Window Light",
    "city": "any",
    "region": "all",
    "category": "室內自然光",
    "event": "老屋窗邊自然光拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "morning"
    ],
    "sensory": "木頭味、磨石子涼意、麻雀聲",
    "visualNoise": "磨石子地、木窗框、白紗簾",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} by the window of an old Taiwanese house with terrazzo flooring and wooden window frames, soft directional daylight, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-C02",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "咖啡廳靠窗座",
    "name_en": "Cafe Window Seat",
    "city": "any",
    "region": "all",
    "category": "室內自然光",
    "event": "咖啡廳靠窗拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "morning"
    ],
    "sensory": "咖啡香、磨豆機聲、瓷杯碰撞",
    "visualNoise": "木桌、綠植、拿鐵、窗外街景",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} at a cafe window seat with wooden tables and plants, natural window light, Taiwan cafe atmosphere, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-C03",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "獨立書店書牆",
    "name_en": "Indie Bookstore Wall",
    "city": "any",
    "region": "all",
    "category": "室內自然光",
    "event": "書店書牆前拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "afternoon"
    ],
    "sensory": "紙張味、翻書聲、木地板",
    "visualNoise": "滿牆書架、暖黃吊燈",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 1,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} in front of a floor-to-ceiling bookshelf in an independent bookstore, warm ambient light, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-C04",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "圖書館長桌挑高窗",
    "name_en": "Library Long Table",
    "city": "any",
    "region": "all",
    "category": "室內自然光",
    "event": "圖書館挑高窗拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "afternoon"
    ],
    "sensory": "安靜、椅腳摩擦、紙頁聲",
    "visualNoise": "長木桌、綠罩檯燈、挑高窗",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 1,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} at a long reading table in a library with tall windows, high clean daylight, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-C05",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "日式老宅榻榻米",
    "name_en": "Japanese Tatami Room",
    "city": "any",
    "region": "all",
    "category": "室內自然光",
    "event": "日式老宅榻榻米拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "morning"
    ],
    "sensory": "榻榻米草香、木頭、風鈴",
    "visualNoise": "榻榻米、障子門、木廊",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} in a Japanese-style old house on tatami with shoji sliding doors, diffused paper-filtered light, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-C06",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "溫室花房玻璃屋",
    "name_en": "Greenhouse Conservatory",
    "city": "any",
    "region": "all",
    "category": "室內自然光",
    "event": "溫室花房拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "morning"
    ],
    "sensory": "濕土味、葉片水氣、玻璃反光",
    "visualNoise": "玻璃屋頂、大量綠植、鐵架",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} inside a glass greenhouse dense with plants, humid diffused daylight through glass panels, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-C07",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "藝廊白盒空間",
    "name_en": "Gallery White Cube",
    "city": "any",
    "region": "all",
    "category": "室內自然光",
    "event": "藝廊白盒空間拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "afternoon"
    ],
    "sensory": "空調聲、腳步回音",
    "visualNoise": "白牆、木地板、軌道燈",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 1,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} in a white-cube gallery space with wooden floors and track lighting, clean minimal environment, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-C08",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "旅館房間窗邊",
    "name_en": "Hotel Room Window",
    "city": "any",
    "region": "all",
    "category": "室內自然光",
    "event": "旅館房間窗邊拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "morning"
    ],
    "sensory": "乾淨織品味、空調、窗外車聲",
    "visualNoise": "整理過的床鋪、窗簾、床頭燈",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} seated by the window of a tidy hotel room, soft daylight, upper-body and seated framing only, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-D01",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "老公寓磁磚外牆",
    "name_en": "Tiled Apartment Facade",
    "city": "any",
    "region": "all",
    "category": "戶外都市",
    "event": "老公寓磁磚牆前拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "afternoon"
    ],
    "sensory": "機車引擎、冷氣滴水、曬衣粉味",
    "visualNoise": "二丁掛磁磚、鐵窗花、電表箱",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} in front of a Taipei old apartment facade with mosaic tiles and iron window grilles, flat overcast daylight, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-D02",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "大稻埕街屋立面",
    "name_en": "Dadaocheng Shophouse",
    "city": "any",
    "region": "all",
    "category": "戶外都市",
    "event": "大稻埕街屋前拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "afternoon"
    ],
    "sensory": "中藥香、車聲、鐵捲門",
    "visualNoise": "巴洛克式街屋立面、廊柱、招牌",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} in front of a Dadaocheng historic shophouse facade with baroque ornament and arcade columns, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-D03",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "天橋斑馬線俯角",
    "name_en": "Footbridge Crosswalk",
    "city": "any",
    "region": "all",
    "category": "戶外都市",
    "event": "天橋俯角拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "afternoon"
    ],
    "sensory": "車流、風壓、鐵板震動",
    "visualNoise": "天橋鐵欄、斑馬線、車流",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} on a pedestrian footbridge shooting down at zebra crossings and traffic below, high-angle urban framing, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-D04",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "停車場屋頂",
    "name_en": "Rooftop Car Park",
    "city": "any",
    "region": "all",
    "category": "戶外都市",
    "event": "停車場屋頂拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "afternoon"
    ],
    "sensory": "水泥熱氣、風、遠處喇叭",
    "visualNoise": "水泥地坪、車道標線、乾淨天空",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} on an open rooftop car park with bare concrete and clean open sky, strong natural top light, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-D05",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "老公寓樓梯間",
    "name_en": "Old Apartment Stairwell",
    "city": "any",
    "region": "all",
    "category": "戶外都市",
    "event": "老公寓樓梯間拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "afternoon"
    ],
    "sensory": "水泥涼氣、回音、木扶手味",
    "visualNoise": "磨石子階梯、鐵扶手、天井頂光",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} in an old apartment stairwell with terrazzo steps and iron handrails, shaft light falling from above, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-D06",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "頂樓水塔曬衣繩",
    "name_en": "Rooftop Water Tank",
    "city": "any",
    "region": "all",
    "category": "戶外都市",
    "event": "頂樓水塔曬衣繩拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "evening"
    ],
    "sensory": "曬衣粉味、風、鐵鏽",
    "visualNoise": "不鏽鋼水塔、曬衣繩、女兒牆",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} on a residential rooftop among stainless water tanks and washing lines, strong backlight silhouette, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-D07",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "河堤自行車道",
    "name_en": "Riverside Bike Path",
    "city": "any",
    "region": "all",
    "category": "戶外都市",
    "event": "河堤草坡拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "afternoon"
    ],
    "sensory": "草味、風、遠處球場聲",
    "visualNoise": "河堤草坡、自行車道、堤壁彩繪",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} on a riverside bike path with grass embankments, open sky and long even daylight, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-D08",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "都市夜景霓虹",
    "name_en": "Neon City Night",
    "city": "any",
    "region": "all",
    "category": "戶外都市",
    "event": "夜間霓虹街拍",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "night"
    ],
    "sensory": "機車聲、招牌電流、油煙",
    "visualNoise": "霓虹招牌、濕柏油反光、人流",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} on a neon-lit Taiwanese night street with dense signage, wet asphalt reflections, mixed colour practical light, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-E01",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "海邊沙灘黃金時刻",
    "name_en": "Golden Hour Beach",
    "city": "any",
    "region": "all",
    "category": "戶外自然",
    "event": "海邊沙灘黃金時刻拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "evening"
    ],
    "sensory": "海風鹹味、浪聲、細沙",
    "visualNoise": "沙灘、浪花、逆光",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} on a sandy beach at golden hour, warm backlight, sea breeze moving fabric, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-E02",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "消波塊防風林",
    "name_en": "Breakwater Windbreak",
    "city": "any",
    "region": "all",
    "category": "戶外自然",
    "event": "消波塊防風林拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "afternoon"
    ],
    "sensory": "海腥味、風聲、木麻黃",
    "visualNoise": "消波塊、防風林、灰白天空",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} among concrete breakwater blocks beside a coastal windbreak forest, overcast diffused light, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-E03",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "山區產業道路芒草",
    "name_en": "Mountain Road Silvergrass",
    "city": "any",
    "region": "all",
    "category": "戶外自然",
    "event": "山區芒草產業道路拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "afternoon"
    ],
    "sensory": "芒草沙沙、山風、柏油味",
    "visualNoise": "芒草、產業道路、遠山稜線",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} on a mountain service road surrounded by silvergrass, hazy layered ridgelines behind, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-E04",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "竹林小徑漫射光",
    "name_en": "Bamboo Path",
    "city": "any",
    "region": "all",
    "category": "戶外自然",
    "event": "竹林小徑拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "morning"
    ],
    "sensory": "竹葉沙沙、濕土、鳥鳴",
    "visualNoise": "竹林、石階、綠色漫射光",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} on a narrow path through a bamboo grove, green diffused light filtering through leaves, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-E05",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "茶園梯田",
    "name_en": "Tea Terrace",
    "city": "any",
    "region": "all",
    "category": "戶外自然",
    "event": "茶園梯田拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "morning"
    ],
    "sensory": "茶葉清香、山霧、蟲聲",
    "visualNoise": "梯田茶壟、山霧、遠山",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 1,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} on tea plantation terraces with neat rows of tea bushes and mountain mist, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-E06",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "花海田區",
    "name_en": "Flower Field",
    "city": "any",
    "region": "all",
    "category": "戶外自然",
    "event": "花海田區拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "morning"
    ],
    "sensory": "花香、蜜蜂、泥土",
    "visualNoise": "波斯菊／向日葵花海、田埂",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} in a field of cosmos or sunflowers, soft natural light; keep floral background from clashing with garment print, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-E07",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "溪流石灘",
    "name_en": "River Stone Bed",
    "city": "any",
    "region": "all",
    "category": "戶外自然",
    "event": "溪流石灘拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "afternoon"
    ],
    "sensory": "水聲、涼氣、石頭味",
    "visualNoise": "溪流、白色石灘、清水",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} on a river stone bed beside clear flowing water, bright natural light with water sparkle, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-E08",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "田間小路稻浪",
    "name_en": "Rice Paddy Path",
    "city": "any",
    "region": "all",
    "category": "戶外自然",
    "event": "田間稻浪拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "afternoon"
    ],
    "sensory": "稻香、青蛙、風",
    "visualNoise": "稻浪、田埂、遠處農舍",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 1,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} on a narrow path between rice paddies with wind moving the crop, wide open sky, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-F01",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "宮廟前廊紅柱",
    "name_en": "Temple Red Colonnade",
    "city": "any",
    "region": "all",
    "category": "古蹟文化",
    "event": "宮廟前廊拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "morning"
    ],
    "sensory": "線香味、誦經聲、石階涼意",
    "visualNoise": "紅柱、石獅、燈籠、剪黏",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 1,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} in the front colonnade of a Taiwanese temple with red pillars and lanterns, no deity statues in frame, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-F02",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "老街紅磚拱廊",
    "name_en": "Old Street Brick Arcade",
    "city": "any",
    "region": "all",
    "category": "古蹟文化",
    "event": "老街紅磚拱廊拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "afternoon"
    ],
    "sensory": "舊木頭、香氣、遊客交談",
    "visualNoise": "紅磚拱廊、洗石子柱、老招牌",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 1,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} under the red-brick arcade of a Taiwanese old street, warm reflected light from the brickwork, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-F03",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "日式木造迴廊",
    "name_en": "Japanese Wooden Corridor",
    "city": "any",
    "region": "all",
    "category": "古蹟文化",
    "event": "日式木造建築迴廊拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "morning"
    ],
    "sensory": "檜木香、木板聲、庭院鳥鳴",
    "visualNoise": "木造迴廊、緣側、拉門、庭院",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 1,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} along the wooden verandah corridor of a Japanese-era building, soft light from the garden side, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-F04",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "中式庭園月洞門",
    "name_en": "Chinese Garden Moon Gate",
    "city": "any",
    "region": "all",
    "category": "古蹟文化",
    "event": "中式庭園月洞門拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "morning"
    ],
    "sensory": "水池、鳥鳴、石頭涼氣",
    "visualNoise": "月洞門、水池、假山、垂柳",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 1,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} framed by a circular moon gate in a Chinese garden with a pond and rockery behind, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-F05",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "廢棄糖廠工業遺構",
    "name_en": "Abandoned Sugar Mill",
    "city": "any",
    "region": "all",
    "category": "古蹟文化",
    "event": "廢棄糖廠工業遺構拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "afternoon"
    ],
    "sensory": "鐵鏽味、鳥聲、風穿廠房",
    "visualNoise": "鏽蝕鋼構、破窗、蔓生植物",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} inside an abandoned sugar mill with rusted steel structure, broken windows and creeping vegetation, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-G01",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "教堂長廊彩繪玻璃",
    "name_en": "Church Nave Stained Glass",
    "city": "any",
    "region": "all",
    "category": "教堂白紗",
    "event": "教堂內部長廊拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "morning"
    ],
    "sensory": "石材涼氣、回音、蠟燭",
    "visualNoise": "彩繪玻璃、拱廊、長椅",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 1,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} in a church nave with stained-glass windows casting coloured light down the aisle, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-G02",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "草地大樹下",
    "name_en": "Under a Large Tree",
    "city": "any",
    "region": "all",
    "category": "教堂白紗",
    "event": "草地大樹下拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "afternoon"
    ],
    "sensory": "草味、蟬聲、樹蔭涼風",
    "visualNoise": "大樹樹蔭、草地、光斑",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 1,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} under a large tree on open lawn, dappled shade with bright surrounding grass, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  },
  {
    "scene_id": "TW-SHOOT-G03",
    "scene_context_id": "model_photoshoot",
    "depth_module_id": 2,
    "name_zh": "海景平台",
    "name_en": "Ocean View Deck",
    "city": "any",
    "region": "all",
    "category": "教堂白紗",
    "event": "海景平台拍攝",
    "event_type_ref": [
      4
    ],
    "season": [
      "all-year"
    ],
    "time_of_day": [
      "afternoon"
    ],
    "sensory": "海風、浪聲、木頭曝曬",
    "visualNoise": "木平台、海平線、白色欄杆",
    "outfit_filter": [
      "model_photoshoot"
    ],
    "outfit_suggestion": [
      "photoshoot_wardrobe"
    ],
    "spicy_level": 2,
    "pov_modes": [
      "candid_side",
      "wide_landscape",
      "selfie_front"
    ],
    "promptSkeleton": "{subject} on a wooden deck overlooking the ocean horizon, strong sea breeze and bright open light, professional model photoshoot context, Taiwan influencer photography --no deity statue --no text overlay",
    "negative_prompt": "plastic skin, doll-like face, perfect symmetry, airbrushed, oversaturated, HDR, fake bokeh, instagram filter, watermark, text, logo, deformed hand, extra fingers",
    "emotions": [
      "專注",
      "自信",
      "放鬆"
    ],
    "flags": {
      "relationship_layer": null,
      "story_arc_id": null,
      "arc_phase": null,
      "identity_thread_id": null,
      "thread_milestone": null,
      "object_focus": false,
      "digital_layer": false,
      "intimacy_emotional": false,
      "in_between_location": false,
      "vulnerability_tag": null,
      "weather_event": null
    }
  }
];

/**
 * 2026-08-13（企劃案 A-1／階段 6 的 W-6）：把 46 個場景的 `safe_matrix` 掛上來。
 *
 * 為什麼在這裡 map 而不是寫進上面 46 個物件裡：那是 2510 行的資料檔，
 * 逐一插入 46 段等於 46 次編輯，而用腳本改 `.ts` 會毀掉行尾（PITFALL 13）。
 * 規則本體放在隔壁 `taiwanScenesPhotoshoot.safeMatrix.ts`，要調規則看那一份就夠。
 *
 * ⚠️ `safe_matrix` **有填就會取代內建 deny-list**（`sceneSafeMatrix.ts` 的
 * `checkAgainstSceneMatrix` 優先讀場景自帶規則）。所以像 B04 掛衣區這種
 * 原本靠 `fitting_room_office_food` deny rule 保護的場景，
 * 必須在自己的 `forbidden_actions` 裡把 `undressing` / `changing_clothes` 補回去——
 * 那份對照表已經做了，改動它之前先讀該檔的檔頭說明。
 */
export const TAIWAN_PHOTOSHOOT_SCENES: ExtendedScene[] = RAW_PHOTOSHOOT_SCENES.map(
  (scene) => {
    const matrix = PHOTOSHOOT_SAFE_MATRIX[scene.scene_id];
    return matrix ? { ...scene, safe_matrix: matrix } : scene;
  }
);
