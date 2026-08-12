import { ExtendedScene } from "../../../shared/types/types";
import { EXTENDED_SCENES_PART1 } from "./extendedScenesPart1";
import { EXTENDED_SCENES_PART2 } from "./extendedScenesPart2";
import { EXTENDED_SCENES_PART3 } from "./extendedScenesPart3";
import { TAIWAN_NORTH_SCENES } from "./taiwanScenesNorth";
import { TAIWAN_CENTRAL_SCENES } from "./taiwanScenesCentral";
import { TAIWAN_SOUTH_SCENES } from "./taiwanScenesSouth";
import { TAIWAN_EAST_SCENES } from "./taiwanScenesEast";
import { TAIWAN_ISLANDS_SCENES } from "./taiwanScenesIslands";
import { TAIWAN_COMMON_SCENES } from "./taiwanScenesCommon";
// 2026-08-13（階段 6）：模特兒攝影場景池 46 個。漏了這個 import／展開，
// 新場合的卡片在 Step1 就是空的——即使 chip 與 STEP1_CATEGORY_CONTEXTS 都補了也一樣。
import { TAIWAN_PHOTOSHOOT_SCENES } from "./taiwanScenesPhotoshoot";

/**
 * Combined collection of all Narrative v1.1 scenes.
 */
export const ALL_EXTENDED_SCENES: ExtendedScene[] = [
  ...EXTENDED_SCENES_PART1,
  ...EXTENDED_SCENES_PART2,
  ...EXTENDED_SCENES_PART3,
  ...TAIWAN_NORTH_SCENES,
  ...TAIWAN_CENTRAL_SCENES,
  ...TAIWAN_SOUTH_SCENES,
  ...TAIWAN_EAST_SCENES,
  ...TAIWAN_ISLANDS_SCENES,
  ...TAIWAN_COMMON_SCENES,
  ...TAIWAN_PHOTOSHOOT_SCENES
];

/**
 * Filter scenes by module ID.
 */
export const getExtendedScenesByModule = (moduleId: number): ExtendedScene[] => {
  return ALL_EXTENDED_SCENES.filter(s => s.depth_module_id === moduleId);
};
