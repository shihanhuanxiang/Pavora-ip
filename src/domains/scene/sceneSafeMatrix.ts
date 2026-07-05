// PAVORA domain: scene — scene-safe matrix 最小版（warn-only 階段）
// Stage C 包 C3。詳見 handoff_docs/PAVORA_C_SERVICE_LAYER_PLAN.md §3 包 C3。
//
// 目的：擋掉「地點 x 活動 x 動作 x 道具」的不合理笛卡爾積（PITFALLS #5 四類荒謬組合範例：
// 人在饅頭 / 躺在便利商店 / 更衣間用筆電吃饅頭 / Uber Eats 玄關等待裡）。
//
// 設計原則（寧漏擋不誤殺）：
// - 這是「執行期合理性檢查」的偵測層，本階段只回傳 { ok, reason }，呼叫端自行決定要不要動作
//   （C3 本包的呼叫端只 console.warn，不 re-roll、不 throw、不擋生成）。
// - deny-list 刻意小而準：只擋 PITFALLS #5 明確列出的荒謬類型，不追求覆蓋全部可能性。
// - 若 scene 的 SceneBase.safe_matrix（見 ./types.ts）已填值，優先用該場景自帶的
//   forbidden_actions / forbidden_outfit_pool 規則；未填值則走本檔內建 deny-list（向後相容）。
// - 比對鍵一律用穩定英文 id/tag（三層語言邊界：內部 ID 永遠英文）。

import type { SceneBase, SceneSafeMatrix } from "./types";

export interface SceneSafeCheckResult {
  ok: boolean;
  reason?: string;
}

/**
 * scene 參數採寬鬆型別：narrative 模組的 ExtendedScene / LocalizedScene 都不 extends SceneBase，
 * 這裡用 duck-typing 讀取常見欄位（category / event / name_zh / depth_module_id / scene_context_id /
 * outfit_filter），讓本函式可以直接吃 narrativeService.ts 現有的 sceneContext 物件，不強制轉型。
 */
interface SceneLike {
  id?: string;
  scene_id?: string;
  category?: string;
  event?: string;
  name_zh?: string;
  name_en?: string;
  depth_module_id?: number;
  scene_context_id?: string;
  outfit_filter?: string[];
  safe_matrix?: SceneSafeMatrix;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// 內建 deny-list（未填 safe_matrix 時的 fallback）
// 依 PITFALLS #5 四類荒謬組合分類，每條規則用「location 標籤」+「action/prop 標籤」比對。
// location 標籤由 scene 的 category/event/name_zh/name_en/scene_context_id 內文比對關鍵字取得，
// action/prop 標籤由呼叫端傳入的 action / prop 字串（或 contextId 近似值）比對。
// ---------------------------------------------------------------------------

interface DenyRule {
  id: string; // 規則英文 id，供 log/追蹤
  // location 關鍵字（中英皆可，出現在 scene 文字欄位中任一即視為命中該 location 類別）
  locationKeywords: string[];
  // 與該 location 不相容的 action 關鍵字（比對 action 參數）
  forbiddenActionKeywords?: string[];
  // 與該 location 不相容的 prop 關鍵字（比對 prop 參數）
  forbiddenPropKeywords?: string[];
  reason: string;
}

const DENY_RULES: DenyRule[] = [
  {
    // 「人在饅頭」類：食物道具被誤用成場景容器/主體，而非手持食用道具
    id: "food_as_container",
    locationKeywords: ["饅頭", "steamed_bun", "steamed bun"],
    forbiddenActionKeywords: ["inside", "裡面", "躺", "坐進", "in_side_of"],
    reason: "食物道具不可作為場景容器/主體（人不可在饅頭裡）",
  },
  {
    // 「躺在便利商店」類：便利商店只能是短暫路過/購物的場景，不可作長時間躺臥的地點
    id: "convenience_store_reclining",
    locationKeywords: ["便利商店", "超商", "convenience_store", "convenience store", "7-11", "全家"],
    forbiddenActionKeywords: ["躺", "睡", "reclining", "lying_down", "lying down", "sleep"],
    reason: "便利商店不適合躺臥動作（短暫路過場景，非休憩場景）",
  },
  {
    // 「更衣間用筆電吃饅頭」類：更衣室是換裝專用私密空間，不可混入辦公/用餐道具
    id: "fitting_room_office_food",
    locationKeywords: ["更衣間", "更衣室", "試衣間", "fitting_room", "changing_room", "dressing_room"],
    forbiddenPropKeywords: ["筆電", "laptop", "notebook_computer", "饅頭", "steamed_bun", "食物", "food", "eating"],
    reason: "更衣間為換裝專用空間，不可混入辦公道具或飲食動作",
  },
  {
    // 「Uber Eats 玄關等待裡」類：語意重複堆疊（玄關本身就是等待點），常見於粗糙隨機拼接
    id: "entryway_delivery_waiting_redundant",
    locationKeywords: ["玄關", "entryway", "entrance_hall"],
    forbiddenActionKeywords: ["uber_eats", "外送等待", "delivery_waiting", "玄關等待"],
    reason: "玄關等待外送的語意重複堆疊，屬粗糙隨機拼接組合",
  },
];

// ---------------------------------------------------------------------------
// 正常組合的最小豁免（非阻擋名單，僅供内部文件化參考，不影響邏輯）：
// - 在家喝咖啡 / 公園散步 / 咖啡廳看書 等日常場景不含任何上列關鍵字，deny-list 不會命中。
// ---------------------------------------------------------------------------

function collectSceneText(scene: SceneLike): string {
  const parts = [
    scene.category,
    scene.event,
    scene.name_zh,
    scene.name_en,
    scene.scene_context_id,
    scene.id,
    scene.scene_id,
    ...(Array.isArray(scene.outfit_filter) ? scene.outfit_filter : []),
  ];
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function includesKeyword(haystack: string, keywords: string[]): boolean {
  return keywords.some((kw) => haystack.includes(kw.toLowerCase()));
}

/**
 * 用場景自帶的 safe_matrix（若已填值）檢查 action / prop 是否被明確禁止或不在允許池中。
 * 未填值的欄位視為「不限制」（向後相容：A4 的 7 個 optional 欄位目前全域未填值）。
 */
function checkAgainstSceneMatrix(
  matrix: SceneSafeMatrix,
  action?: string,
  prop?: string
): SceneSafeCheckResult | null {
  if (action) {
    if (matrix.forbidden_actions?.some((a) => a.toLowerCase() === action.toLowerCase())) {
      return { ok: false, reason: `action "${action}" 在此場景的 forbidden_actions 名單中` };
    }
    if (matrix.allowed_actions?.length && !matrix.allowed_actions.some((a) => a.toLowerCase() === action.toLowerCase())) {
      return { ok: false, reason: `action "${action}" 不在此場景的 allowed_actions 名單中` };
    }
  }
  if (prop) {
    if (matrix.forbidden_outfit_pool?.some((p) => p.toLowerCase() === prop.toLowerCase())) {
      return { ok: false, reason: `prop "${prop}" 在此場景的 forbidden_outfit_pool 名單中` };
    }
    if (matrix.prop_pool?.length && !matrix.prop_pool.some((p) => p.toLowerCase() === prop.toLowerCase())) {
      return { ok: false, reason: `prop "${prop}" 不在此場景的 prop_pool 名單中` };
    }
  }
  return null; // 無法從 safe_matrix 判定不合理 → 交給 deny-list 或視為合理
}

/**
 * 檢查 scene + action + prop 組合是否合理。
 *
 * 本階段（warn-only）呼叫端只用回傳結果記錄 console.warn，不 throw、不改變生成流程。
 *
 * @param scene 場景物件（narrative ExtendedScene / LocalizedScene 或 domains SceneBase 皆可，duck-typing 讀取）
 * @param action 動作/活動的穩定英文 id 或近似值（如 contextId："home_cozy"、"shopping_random"）；未提供則只檢查 scene 本身
 * @param prop 道具的穩定英文 id 或近似值；未提供則不檢查道具維度
 */
export function isSceneCombinationSafe(
  scene: SceneLike | null | undefined,
  action?: string,
  prop?: string
): SceneSafeCheckResult {
  if (!scene) {
    return { ok: true }; // 無場景可判定 → 不阻擋（寧漏擋不誤殺）
  }

  // 1. 場景自帶 safe_matrix 優先
  if (scene.safe_matrix) {
    const matrixResult = checkAgainstSceneMatrix(scene.safe_matrix, action, prop);
    if (matrixResult) return matrixResult;
  }

  // 2. 內建 deny-list fallback
  const sceneText = collectSceneText(scene);
  const actionText = (action || "").toLowerCase();
  const propText = (prop || "").toLowerCase();

  for (const rule of DENY_RULES) {
    if (!includesKeyword(sceneText, rule.locationKeywords)) continue;

    if (rule.forbiddenActionKeywords && actionText && includesKeyword(actionText, rule.forbiddenActionKeywords)) {
      return { ok: false, reason: `[${rule.id}] ${rule.reason}` };
    }
    if (rule.forbiddenPropKeywords && propText && includesKeyword(propText, rule.forbiddenPropKeywords)) {
      return { ok: false, reason: `[${rule.id}] ${rule.reason}` };
    }
    // 特例：規則同時命中 location 關鍵字本身即包含「動作」語意（如「躺在便利商店」整句就是 event 文字），
    // 這種情況 location 關鍵字命中即代表荒謬組合本身已經寫在 scene 文字裡。
    if (!rule.forbiddenActionKeywords && !rule.forbiddenPropKeywords) {
      return { ok: false, reason: `[${rule.id}] ${rule.reason}` };
    }
    // 若 location 命中，但 action/prop 關鍵字也直接出現在 sceneText 本身（例如荒謬描述整句塞在 event 欄位）
    if (rule.forbiddenActionKeywords && includesKeyword(sceneText, rule.forbiddenActionKeywords)) {
      return { ok: false, reason: `[${rule.id}] ${rule.reason}` };
    }
    if (rule.forbiddenPropKeywords && includesKeyword(sceneText, rule.forbiddenPropKeywords)) {
      return { ok: false, reason: `[${rule.id}] ${rule.reason}` };
    }
  }

  return { ok: true };
}
