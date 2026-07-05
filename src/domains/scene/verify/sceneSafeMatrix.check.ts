// PAVORA verify script — scene-safe matrix 最小版（包 C3）
// 執行：node --experimental-strip-types src/domains/scene/verify/sceneSafeMatrix.check.ts
// 不依賴任何套件，純 node 執行。失敗時 process.exit(1)。
//
// 覆蓋：
// 1. PITFALLS #5 四個荒謬組合 → 斷言 ok === false
// 2. 三個正常組合（在家喝咖啡 / 公園散步 / 咖啡廳看書）→ 斷言 ok === true（反向誤殺守門，最重要）

import { isSceneCombinationSafe } from "../sceneSafeMatrix";

interface Fixture {
  name: string;
  scene: Record<string, unknown> | null;
  action?: string;
  prop?: string;
  expectOk: boolean;
}

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
