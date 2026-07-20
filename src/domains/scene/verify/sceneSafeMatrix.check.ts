// PAVORA verify script — scene-safe matrix 最小版（包 C3）
// 執行：node --experimental-strip-types src/domains/scene/verify/sceneSafeMatrix.check.ts
// 不依賴任何套件，純 node 執行。失敗時 process.exit(1)。
//
// 覆蓋：
// 1. PITFALLS #5 四個荒謬組合 → 斷言 ok === false
// 2. 三個正常組合（在家喝咖啡 / 公園散步 / 咖啡廳看書）→ 斷言 ok === true（反向誤殺守門，最重要）

import { isSceneCombinationSafe } from "../sceneSafeMatrix";
import { ALL_EXTENDED_SCENES } from "../../../modules/narrative/constants/extendedScenes";

interface Fixture {
  name: string;
  scene: Record<string, unknown> | null;
  action?: string;
  prop?: string;
  expectOk: boolean;
}

// 居家 12 場景（2026-07-20 新增，safe_matrix 首批實填）自檢：直接讀取 ALL_EXTENDED_SCENES 裡的真實
// entry（而非另外手刻 fixture），確保測的是實際落地資料，不會跟資料檔案漂移。
function findHomeScene(sceneId: string): Record<string, unknown> {
  const scene = ALL_EXTENDED_SCENES.find((s) => s.scene_id === sceneId);
  if (!scene) {
    throw new Error(`居家場景自檢找不到 scene_id="${sceneId}"，資料檔可能被誤改或搬移`);
  }
  return scene as unknown as Record<string, unknown>;
}

const homeSceneFixtures: Fixture[] = [
  // 1. TW-COMMON-HOME-001（home_bedside_morning）
  { name: "居家-臥室床邊剛睡醒 正常組合(checking_phone+phone)", scene: findHomeScene("TW-COMMON-HOME-001"), action: "checking_phone", prop: "phone", expectOk: true },
  { name: "居家-臥室床邊剛睡醒 荒謬組合(hiking)", scene: findHomeScene("TW-COMMON-HOME-001"), action: "hiking", expectOk: false },
  // 2. TW-COMMON-HOME-002（home_sofa_series）
  { name: "居家-沙發追劇零食毯子 正常組合(sitting+blanket)", scene: findHomeScene("TW-COMMON-HOME-002"), action: "sitting", prop: "blanket", expectOk: true },
  { name: "居家-沙發追劇零食毯子 荒謬組合(swimming)", scene: findHomeScene("TW-COMMON-HOME-002"), action: "swimming", expectOk: false },
  // 3. TW-COMMON-HOME-003（home_desk_wfh）
  { name: "居家-書桌工作筆電咖啡 正常組合(typing+laptop)", scene: findHomeScene("TW-COMMON-HOME-003"), action: "typing", prop: "laptop", expectOk: true },
  { name: "居家-書桌工作筆電咖啡 荒謬組合(running)", scene: findHomeScene("TW-COMMON-HOME-003"), action: "running", expectOk: false },
  // 4. TW-COMMON-HOME-004（home_bathroom_skincare，高風險：另加 prop 規則測試）
  { name: "居家-浴室鏡前護膚刷牙 正常組合(brushing_teeth+toothbrush)", scene: findHomeScene("TW-COMMON-HOME-004"), action: "brushing_teeth", prop: "toothbrush", expectOk: true },
  { name: "居家-浴室鏡前護膚刷牙 荒謬組合(hiking)", scene: findHomeScene("TW-COMMON-HOME-004"), action: "hiking", expectOk: false },
  // 2026-07-20 改：原 fixture（prop=laptop 不在 prop_pool → false）依賴白名單拒絕，
  // 該行為已裁決移除（白名單僅供參考，黑名單才強制），改測黑名單案例。
  { name: "居家-浴室鏡前護膚刷牙 荒謬組合(prop=lingerie 在 forbidden_outfit_pool)", scene: findHomeScene("TW-COMMON-HOME-004"), prop: "lingerie", expectOk: false },
  // 5. TW-COMMON-HOME-005（home_vanity_makeup）
  { name: "居家-梳妝台化妝準備出門 正常組合(applying_makeup+lipstick)", scene: findHomeScene("TW-COMMON-HOME-005"), action: "applying_makeup", prop: "lipstick", expectOk: true },
  { name: "居家-梳妝台化妝準備出門 荒謬組合(hiking)", scene: findHomeScene("TW-COMMON-HOME-005"), action: "hiking", expectOk: false },
  // 6. TW-COMMON-HOME-006（home_entry_ootd）
  { name: "居家-玄關全身鏡出門前穿搭 正常組合(looking_mirror+bag)", scene: findHomeScene("TW-COMMON-HOME-006"), action: "looking_mirror", prop: "bag", expectOk: true },
  { name: "居家-玄關全身鏡出門前穿搭 荒謬組合(swimming)", scene: findHomeScene("TW-COMMON-HOME-006"), action: "swimming", expectOk: false },
  // 7. TW-COMMON-HOME-007（home_kitchen_breakfast）
  { name: "居家-廚房早餐吧台做早餐 正常組合(cooking+frying_pan)", scene: findHomeScene("TW-COMMON-HOME-007"), action: "cooking", prop: "frying_pan", expectOk: true },
  { name: "居家-廚房早餐吧台做早餐 荒謬組合(hiking)", scene: findHomeScene("TW-COMMON-HOME-007"), action: "hiking", expectOk: false },
  // 8. TW-COMMON-HOME-008（home_window_rainy）
  { name: "居家-窗邊雨天熱飲發呆 正常組合(staring_outside+mug)", scene: findHomeScene("TW-COMMON-HOME-008"), action: "staring_outside", prop: "mug", expectOk: true },
  { name: "居家-窗邊雨天熱飲發呆 荒謬組合(running)", scene: findHomeScene("TW-COMMON-HOME-008"), action: "running", expectOk: false },
  // 9. TW-COMMON-HOME-009（home_balcony_plants）
  { name: "居家-老公寓陽台鐵窗植物晾衣 正常組合(watering_plants+watering_can)", scene: findHomeScene("TW-COMMON-HOME-009"), action: "watering_plants", prop: "watering_can", expectOk: true },
  { name: "居家-老公寓陽台鐵窗植物晾衣 荒謬組合(hiking)", scene: findHomeScene("TW-COMMON-HOME-009"), action: "hiking", expectOk: false },
  // 10. TW-COMMON-HOME-010（home_midnight_fridge）
  { name: "居家-深夜冰箱前宵夜泡麵 正常組合(eating_snack+instant_noodle_cup)", scene: findHomeScene("TW-COMMON-HOME-010"), action: "eating_snack", prop: "instant_noodle_cup", expectOk: true },
  { name: "居家-深夜冰箱前宵夜泡麵 荒謬組合(swimming)", scene: findHomeScene("TW-COMMON-HOME-010"), action: "swimming", expectOk: false },
  // 11. TW-COMMON-HOME-011（home_yoga_mat）
  { name: "居家-客廳地毯瑜伽墊居家運動 正常組合(stretching+yoga_mat)", scene: findHomeScene("TW-COMMON-HOME-011"), action: "stretching", prop: "yoga_mat", expectOk: true },
  { name: "居家-客廳地毯瑜伽墊居家運動 荒謬組合(running)", scene: findHomeScene("TW-COMMON-HOME-011"), action: "running", expectOk: false },
  // 12. TW-COMMON-HOME-012（home_room_tidy）
  { name: "居家-租屋套房整理房間生活感 正常組合(folding_laundry+folded_clothes)", scene: findHomeScene("TW-COMMON-HOME-012"), action: "folding_laundry", prop: "folded_clothes", expectOk: true },
  { name: "居家-租屋套房整理房間生活感 荒謬組合(swimming)", scene: findHomeScene("TW-COMMON-HOME-012"), action: "swimming", expectOk: false },
];

// --- Production 路徑回歸（2026-07-20 fresh-context 驗收抓到的誤殺案）---
// narrativeService confirmScene 路徑把 outfit_filter[0]（contextId，如 "home_cozy"）當 action 傳入。
// 曾因 allowed_actions 白名單拒絕導致 12 張居家卡全數被自己的矩陣擋死（check 全綠、production 全炸）。
// 此組 fixture 直接模擬該呼叫形態：12 張卡 × action=contextId 必須全部 ok:true。
const productionPathFixtures: Fixture[] = [
  ...Array.from({ length: 12 }, (_, i) => {
    const id = `TW-COMMON-HOME-${String(i + 1).padStart(3, "0")}`;
    return {
      name: `Production路徑-${id} (action=home_cozy contextId)`,
      scene: findHomeScene(id),
      action: "home_cozy",
      expectOk: true,
    } as Fixture;
  }),
  { name: "Production路徑-TW-COMMON-HOME-006 (action=urban_street 第二 contextId)", scene: findHomeScene("TW-COMMON-HOME-006"), action: "urban_street", expectOk: true },
];

const fixtures: Fixture[] = [
  // --- PITFALLS #5 荒謬組合（expectOk: false） ---
  {
    name: "人在饅頭裡（食物道具當容器）",
    scene: { category: "生活碎片", event: "在饅頭裡拍照", name_zh: "巨大饅頭場景" },
    action: "inside",
    prop: "steamed_bun",
    expectOk: false,
  },
  {
    name: "躺在便利商店",
    scene: { category: "日常", event: "在便利商店", name_zh: "深夜超商" },
    action: "lying_down",
    expectOk: false,
  },
  {
    name: "更衣間用筆電吃饅頭",
    scene: { category: "室內", event: "在更衣間", name_zh: "百貨更衣室" },
    prop: "laptop",
    expectOk: false,
  },
  {
    name: "Uber Eats 玄關等待裡",
    scene: { category: "居家", event: "在玄關等待外送", name_zh: "玄關" },
    action: "delivery_waiting",
    expectOk: false,
  },

  // --- 正常組合（expectOk: true，反向誤殺守門） ---
  {
    name: "在家喝咖啡",
    scene: { category: "居家", event: "在家喝咖啡", name_zh: "客廳早晨" },
    action: "home_cozy",
    prop: "coffee_cup",
    expectOk: true,
  },
  {
    name: "公園散步",
    scene: { category: "戶外", event: "公園散步", name_zh: "河濱公園" },
    action: "urban_street",
    expectOk: true,
  },
  {
    name: "咖啡廳看書",
    scene: { category: "日常", event: "咖啡廳看書", name_zh: "巷口咖啡廳" },
    action: "cafe_aesthetic",
    prop: "book",
    expectOk: true,
  },

  // --- 居家 12 場景（2026-07-20 新增）safe_matrix 首批實填自檢 ---
  ...homeSceneFixtures,

  // --- Production 呼叫形態回歸（action=contextId 不得被誤殺） ---
  ...productionPathFixtures,
];

let failed = 0;

for (const fx of fixtures) {
  const result = isSceneCombinationSafe(fx.scene as any, fx.action, fx.prop);
  const pass = result.ok === fx.expectOk;
  const status = pass ? "PASS" : "FAIL";
  console.log(`[${status}] ${fx.name} -> ok=${result.ok} expect=${fx.expectOk}${result.reason ? ` reason="${result.reason}"` : ""}`);
  if (!pass) failed++;
}

if (failed > 0) {
  console.error(`\n${failed} / ${fixtures.length} fixtures FAILED`);
  process.exit(1);
} else {
  console.log(`\nAll ${fixtures.length} fixtures passed.`);
  process.exit(0);
}
