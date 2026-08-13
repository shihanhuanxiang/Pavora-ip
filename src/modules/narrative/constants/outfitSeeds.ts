import { OutfitV2 } from "../../../shared/types/types";
import OUTFITS_F from "./outfitsV2_F.json";
import OUTFITS_M from "./outfitsV2_M.json";
import OUTFITS_TW_F from "./outfitsV2_TW_F_EXT.json";
import OUTFITS_TW_M from "./outfitsV2_TW_M_EXT.json";
/**
 * 2026-08-13（企劃案 A-1／階段 6 的 W-4 主件擴寫）：`model_photoshoot` 場合的 117 筆。
 *
 * 來源是 `data/` 的 140 筆正式款，扣掉 Hank 第三關判死的 3 筆
 * （亞麻套裝／單色成套／工裝連身褲）、jewelry 15 筆（屬 W-5 配件池）、
 * 以及婚紗裡的 5 筆純配件與外搭（教堂頭紗／指尖頭紗／新娘手套／肩披／小外套，
 * 它們穿在已在池子裡的婚紗**外面**，做成獨立 outfit 只會產生近重複的婚紗）。
 * 逐筆對照見 `盤點_C軌_2026-08-01/階段6_資料大批次/W4_id對照表.json`。
 *
 * ⚠️ **為什麼是 .json 不是 .ts**：既有 seed 都帶 `season` 這個
 * `WardrobeOutfit` interface 裡**沒有**的欄位。寫成 typed `.ts` 物件字面值會被
 * excess property check 擋下；JSON 走 `as any[]` 沒這個問題，也完全避開 CRLF 風險
 * （PITFALL 13）。新增服裝資料請沿用這個做法。
 *
 * ⚠️ **`pillars` 五欄必填，不可只寫 `prompt_skeleton`**：
 * `narrativeService` 的 `repairApparelSection` 是唯一一道服裝強制層，
 * 而它逐一比對的是 `pillars.top/bottom/shoes/accessories/props`。
 * `pillars` 空著那道防線就是關著的，LLM 會把服裝規格改寫成摘要版
 * （2026-08-13 第三關實測：領口的深度限定與結構詞整組被丟掉）。
 */
import OUTFITS_SHOOT from "./outfitsV2_SHOOT.json";

export const OUTFIT_SEEDS_V2: OutfitV2[] = [
  ...(OUTFITS_F as any[]),
  ...(OUTFITS_M as any[]),
  ...(OUTFITS_TW_F as any[]),
  ...(OUTFITS_TW_M as any[]),
  ...(OUTFITS_SHOOT as any[])
] as OutfitV2[];
