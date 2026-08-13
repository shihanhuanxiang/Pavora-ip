import type { SceneSafeMatrix } from "../../../domains/scene/types";

/**
 * `model_photoshoot` 46 個場景的 `safe_matrix`（2026-08-13，企劃案 A-1／階段 6 的 W-6）。
 *
 * ⚠️ **為什麼獨立一個檔案而不是寫進 46 個場景物件裡**：
 * `taiwanScenesPhotoshoot.ts` 是 2510 行的資料檔，逐一插入 46 段等於 46 次編輯，
 * 而用腳本改 `.ts` 會毀掉行尾（PITFALL 13，2026-08-04 一晚踩三次）。
 * 拆成「純資料對照表 ＋ 匯出時 map 一次」是同樣的效果、遠低的風險，
 * 而且要調哪一條場景的規則時看這一份就夠，不用在 2510 行裡找。
 *
 * ⚠️ **只有 `forbidden_actions` 與 `forbidden_outfit_pool` 具強制力**
 * （`sceneSafeMatrix.ts:125-142`，2026-07-20 `652762e` 之後的裁決）。
 * `allowed_actions` / `prop_pool` / `outfit_pool` / `time_slots` / `intensity_cap`
 * 目前是**文件用途**，供 prompt 組裝參考，不做「不在名單即拒絕」。
 * 所以下面每一條的重點都在 `forbidden_*`，其餘欄位是給未來的人看的意圖說明。
 *
 * ⛔ **絕對不要把 `evening_gown` / `wedding_gown` 放進任何 `forbidden_outfit_pool`。**
 * Hank 2026-08-12 明確拍板：「這是模特兒攝影模式，**穿婚紗在任何場景拍照都是合理的**」——
 * 海邊、老街、廢棄糖廠的婚紗外拍都是真實存在的商業案。
 * 居家 12 場景（`taiwanScenesCommon.ts`）的 `forbidden_outfit_pool` 有 `evening_gown`，
 * 照抄過來會直接違反那條裁決。這是刻意的差異，不是漏填。
 *
 * 共用的三條底線（每一個場景都有，因為它是品牌 register 而不是場景特性）：
 *   `undressing` / `lingerie_posing` / `provocative_posing`
 * 這對齊「橙燈已是實測下限、紅燈禁止新增」那條打底裝原則。
 */

/** 所有 46 個場景共用的禁止動作（品牌 register 底線，與場景無關）。 */
const BASE_FORBIDDEN: string[] = ["undressing", "lingerie_posing", "provocative_posing"];

/** 棚內共用：棚拍是乾淨可控環境，戶外動作與飲食都不該出現。 */
const STUDIO_FORBIDDEN: string[] = [
  ...BASE_FORBIDDEN,
  "hiking",
  "swimming",
  "cycling",
  "eating_meal",
  "sleeping",
];

/** 戶外共用：不睡不游泳，其餘放寬。 */
const OUTDOOR_FORBIDDEN: string[] = [...BASE_FORBIDDEN, "sleeping", "swimming"];

const m = (
  forbidden_actions: string[],
  extra?: Partial<SceneSafeMatrix>
): SceneSafeMatrix => ({
  forbidden_actions,
  allowed_actions: ["standing", "walking", "leaning", "sitting", "turning", "adjusting_garment", "looking_away", "smiling"],
  ...extra,
});

export const PHOTOSHOOT_SAFE_MATRIX: Record<string, SceneSafeMatrix> = {
  // --- A 正統棚拍 8：最乾淨可控，只擋戶外動作與飲食 -------------------------
  "TW-SHOOT-A01": m(STUDIO_FORBIDDEN, { prop_pool: ["reflector", "light_stand"], time_slots: ["afternoon"] }),
  "TW-SHOOT-A02": m(STUDIO_FORBIDDEN, { prop_pool: ["single_hard_light"], time_slots: ["afternoon"] }),
  "TW-SHOOT-A03": m(STUDIO_FORBIDDEN, { prop_pool: ["seamless_backdrop"], time_slots: ["afternoon"] }),
  "TW-SHOOT-A04": m(STUDIO_FORBIDDEN, { prop_pool: ["coloured_paper_backdrop"], time_slots: ["afternoon"] }),
  "TW-SHOOT-A05": m(STUDIO_FORBIDDEN, { prop_pool: ["large_softbox"], time_slots: ["afternoon"] }),
  "TW-SHOOT-A06": m(STUDIO_FORBIDDEN, { prop_pool: ["bare_bulb_light"], time_slots: ["afternoon"] }),
  "TW-SHOOT-A07": m(STUDIO_FORBIDDEN, { prop_pool: ["paper_roll_backdrop"], time_slots: ["afternoon"] }),
  // A08 鏡面地板：鏡子會把「未指定的角度」也照出來，明確禁止對鏡整裝與脫換動作
  "TW-SHOOT-A08": m([...STUDIO_FORBIDDEN, "changing_clothes"], { prop_pool: ["mirror_floor", "mirror_wall"], time_slots: ["afternoon"] }),

  // --- B 有陳設搭景 6 --------------------------------------------------------
  "TW-SHOOT-B01": m(STUDIO_FORBIDDEN, { prop_pool: ["sheer_curtain", "hard_floor"], time_slots: ["afternoon"] }),
  "TW-SHOOT-B02": m(STUDIO_FORBIDDEN, { prop_pool: ["vintage_armchair", "wood_floor"], time_slots: ["afternoon"] }),
  "TW-SHOOT-B03": m(STUDIO_FORBIDDEN, { prop_pool: ["concrete_wall", "steel_window"], time_slots: ["afternoon"] }),
  /**
   * B04 掛衣區試裝搭景 —— 這一條是**整份對照表裡最重要的一筆**。
   * 場景名稱刻意避開「更衣室」字樣（會誤觸既有的 `fitting_room_office_food` deny rule），
   * 但語意上它就是一個掛滿衣服的試裝空間，`undressing` / `changing_clothes` 的風險是真的。
   * 這裡把它寫成**場景自帶的 forbidden_actions**：一旦場景有 safe_matrix，
   * `checkAgainstSceneMatrix` 就優先用它而不是內建 deny-list，所以這條必須自己擋住。
   * 順帶沿用那條 deny rule 的另一半意圖：不要混入辦公道具與飲食。
   */
  "TW-SHOOT-B04": m([...STUDIO_FORBIDDEN, "changing_clothes", "trying_on_behind_curtain"], {
    prop_pool: ["clothing_rack", "full_length_mirror"],
    forbidden_outfit_pool: ["lingerie", "swimwear"],
    time_slots: ["afternoon"],
  }),
  "TW-SHOOT-B05": m([...STUDIO_FORBIDDEN, "swimming", "wading_deep"], { prop_pool: ["shallow_water_floor"], time_slots: ["afternoon"] }),
  "TW-SHOOT-B06": m(STUDIO_FORBIDDEN, { prop_pool: ["dry_ice_haze", "backlight"], time_slots: ["afternoon"] }),

  // --- C 室內自然光 8 -------------------------------------------------------
  "TW-SHOOT-C01": m([...BASE_FORBIDDEN, "swimming", "hiking"], { prop_pool: ["terrazzo_floor", "wooden_window_frame"], time_slots: ["morning", "afternoon"] }),
  "TW-SHOOT-C02": m([...BASE_FORBIDDEN, "swimming", "hiking", "sleeping"], { prop_pool: ["coffee_cup", "wooden_table", "potted_plant"], time_slots: ["morning", "afternoon"] }),
  "TW-SHOOT-C03": m([...BASE_FORBIDDEN, "swimming", "hiking", "sleeping"], { prop_pool: ["bookshelf", "paperback"], time_slots: ["afternoon"] }),
  "TW-SHOOT-C04": m([...BASE_FORBIDDEN, "swimming", "hiking", "sleeping"], { prop_pool: ["long_table", "tall_window"], time_slots: ["afternoon"] }),
  /**
   * C05 榻榻米 —— 席地空間，`lying_down` 在這裡會直接變成臥姿。
   * 品牌 register 是「完整穿著、合身、露腿」的微性感，不是臥床，所以擋掉躺臥。
   * 坐姿（正坐／盤腿）是允許的，第三關第五輪那張浴衣就是坐姿。
   */
  "TW-SHOOT-C05": m([...BASE_FORBIDDEN, "lying_down", "sleeping", "swimming", "hiking"], {
    prop_pool: ["tatami_mat", "shoji_door"],
    time_slots: ["morning", "afternoon"],
  }),
  "TW-SHOOT-C06": m([...BASE_FORBIDDEN, "swimming", "hiking", "sleeping"], { prop_pool: ["glass_house", "green_plants"], time_slots: ["morning", "afternoon"] }),
  "TW-SHOOT-C07": m([...BASE_FORBIDDEN, "swimming", "hiking", "sleeping", "eating_meal"], { prop_pool: ["white_cube_wall", "track_lighting"], time_slots: ["afternoon"] }),
  /**
   * C08 旅館房間窗邊 —— 場景清單原本就註明「只取上半身與坐姿」。
   * 房間＋床是這批 46 個場景裡唯一有臥室語意的，臥姿與床上動作一律擋掉，
   * 否則同一套服裝在這個場景會滑出商業攝影的 register。
   */
  "TW-SHOOT-C08": m([...BASE_FORBIDDEN, "lying_down", "sleeping", "bed_posing", "swimming", "hiking"], {
    prop_pool: ["window_seat", "made_bed"],
    forbidden_outfit_pool: ["lingerie", "swimwear"],
    time_slots: ["morning", "afternoon"],
  }),

  // --- D 戶外都市 8 ---------------------------------------------------------
  "TW-SHOOT-D01": m(OUTDOOR_FORBIDDEN, { prop_pool: ["tiled_wall", "window_grille"], time_slots: ["morning", "afternoon"] }),
  "TW-SHOOT-D02": m(OUTDOOR_FORBIDDEN, { prop_pool: ["street_house_facade", "arcade_column"], time_slots: ["morning", "afternoon"] }),
  // D03 天橋俯角：欄杆是真實墜落風險，明確禁止攀爬與坐在欄杆上
  "TW-SHOOT-D03": m([...OUTDOOR_FORBIDDEN, "climbing_railing", "sitting_on_railing", "leaning_over_edge"], { prop_pool: ["footbridge", "zebra_crossing"], time_slots: ["afternoon"] }),
  // D04 停車場屋頂：同上，屋頂邊緣
  "TW-SHOOT-D04": m([...OUTDOOR_FORBIDDEN, "sitting_on_ledge", "leaning_over_edge"], { prop_pool: ["concrete_rooftop", "open_sky"], time_slots: ["afternoon", "evening"] }),
  "TW-SHOOT-D05": m(OUTDOOR_FORBIDDEN, { prop_pool: ["terrazzo_handrail", "stairwell"], time_slots: ["morning", "afternoon"] }),
  // D06 頂樓水塔曬衣繩：屋頂＋晾曬中的衣物，禁止觸碰他人衣物與邊緣動作
  "TW-SHOOT-D06": m([...OUTDOOR_FORBIDDEN, "sitting_on_ledge", "leaning_over_edge", "touching_hanging_laundry"], { prop_pool: ["water_tank", "clothes_line"], time_slots: ["afternoon"] }),
  "TW-SHOOT-D07": m(OUTDOOR_FORBIDDEN, { prop_pool: ["bike_path", "grass_slope"], time_slots: ["afternoon", "evening"] }),
  "TW-SHOOT-D08": m(OUTDOOR_FORBIDDEN, { prop_pool: ["neon_sign", "night_street"], time_slots: ["night"] }),

  // --- E 戶外自然 8 ---------------------------------------------------------
  /**
   * E01 海邊沙灘 —— 海邊是整批場景裡最容易滑向泳裝語意的地點。
   * 我們的 117 筆服裝池裡沒有泳裝，但 `forbidden_outfit_pool` 還是明寫，
   * 因為未來 W-7 之後若有人把 `swimwear.json` 併進來，這條就是唯一的防線。
   */
  "TW-SHOOT-E01": m([...OUTDOOR_FORBIDDEN, "swimming", "wading_deep", "sunbathing"], {
    prop_pool: ["sand", "shoreline"],
    forbidden_outfit_pool: ["lingerie", "swimwear"],
    time_slots: ["evening"],
  }),
  "TW-SHOOT-E02": m([...OUTDOOR_FORBIDDEN, "climbing_breakwater"], { prop_pool: ["breakwater_block", "windbreak_forest"], time_slots: ["afternoon"] }),
  "TW-SHOOT-E03": m(OUTDOOR_FORBIDDEN, { prop_pool: ["silvergrass", "mountain_road"], time_slots: ["afternoon"] }),
  "TW-SHOOT-E04": m(OUTDOOR_FORBIDDEN, { prop_pool: ["bamboo_path", "diffused_green_light"], time_slots: ["morning", "afternoon"] }),
  "TW-SHOOT-E05": m(OUTDOOR_FORBIDDEN, { prop_pool: ["tea_terrace"], time_slots: ["morning"] }),
  // E06 花海：明確禁止踩踏與採摘（真實場地的規範，也避免畫面出現破壞行為）
  "TW-SHOOT-E06": m([...OUTDOOR_FORBIDDEN, "trampling_flowers", "picking_flowers"], { prop_pool: ["cosmos_field", "sunflower_field"], time_slots: ["morning", "afternoon"] }),
  "TW-SHOOT-E07": m([...OUTDOOR_FORBIDDEN, "swimming", "wading_deep"], { prop_pool: ["stream", "pebble_bank"], time_slots: ["afternoon"] }),
  "TW-SHOOT-E08": m([...OUTDOOR_FORBIDDEN, "trampling_crops"], { prop_pool: ["rice_paddy", "field_path"], time_slots: ["morning", "afternoon"] }),

  // --- F 古蹟文化 5 ---------------------------------------------------------
  /**
   * F01 宮廟前廊紅柱 —— **宗教敏感，不是美感問題**（場景資料的 promptSkeleton
   * 已經帶 `--no deity statue`，這裡是第二道防線）。
   * 擋的是「把宗教儀式當成拍攝道具」：參拜、上香、跪拜、觸碰神像。
   * 場景本身（紅柱、廊道、燈籠）完全可以拍。
   */
  "TW-SHOOT-F01": m([...OUTDOOR_FORBIDDEN, "worshipping", "praying", "burning_incense", "kneeling_at_altar", "touching_deity_statue"], {
    prop_pool: ["red_pillar", "temple_corridor", "hanging_lantern"],
    time_slots: ["morning", "afternoon"],
  }),
  "TW-SHOOT-F02": m(OUTDOOR_FORBIDDEN, { prop_pool: ["red_brick_arcade"], time_slots: ["morning", "afternoon"] }),
  "TW-SHOOT-F03": m([...OUTDOOR_FORBIDDEN, "lying_down"], { prop_pool: ["wooden_corridor", "engawa"], time_slots: ["morning", "afternoon"] }),
  "TW-SHOOT-F04": m([...OUTDOOR_FORBIDDEN, "wading_deep"], { prop_pool: ["moon_gate", "garden_pond"], time_slots: ["morning", "afternoon"] }),
  // F05 廢棄糖廠：工業遺構有真實危險，禁止攀爬與進入管制區
  "TW-SHOOT-F05": m([...OUTDOOR_FORBIDDEN, "climbing_ruins", "entering_restricted_area", "touching_rusted_machinery"], { prop_pool: ["industrial_ruin", "rusted_beam"], time_slots: ["afternoon"] }),

  // --- G 教堂與白紗外景 3 ---------------------------------------------------
  /**
   * G01 教堂長廊彩繪玻璃 —— 同 F01 的原則：場景可拍，**宗教儀式不可當道具**。
   * 擋的是扮演神職人員、主持儀式、觸碰祭壇。穿婚紗走長廊本身完全 OK。
   */
  "TW-SHOOT-G01": m([...BASE_FORBIDDEN, "officiating_ceremony", "praying", "touching_altar", "impersonating_clergy", "swimming", "hiking"], {
    prop_pool: ["stained_glass", "church_aisle", "wooden_pew"],
    time_slots: ["morning", "afternoon"],
  }),
  "TW-SHOOT-G02": m(OUTDOOR_FORBIDDEN, { prop_pool: ["large_tree", "lawn"], time_slots: ["afternoon"] }),
  "TW-SHOOT-G03": m([...OUTDOOR_FORBIDDEN, "swimming", "wading_deep", "leaning_over_edge"], { prop_pool: ["sea_view_deck", "sea_breeze"], time_slots: ["evening"] }),
};
