import { ExtendedScene } from "../../../shared/types/types";
import { EXTENDED_SCENES_PART1 } from "./extendedScenesPart1";
import { EXTENDED_SCENES_PART2 } from "./extendedScenesPart2";
import { EXTENDED_SCENES_PART3 } from "./extendedScenesPart3";

/**
 * Combined collection of all Narrative v1.1 scenes.
 */
export const ALL_EXTENDED_SCENES: ExtendedScene[] = [
  ...EXTENDED_SCENES_PART1,
  ...EXTENDED_SCENES_PART2,
  ...EXTENDED_SCENES_PART3
];

/**
 * Filter scenes by module ID.
 */
export const getExtendedScenesByModule = (moduleId: number): ExtendedScene[] => {
  return ALL_EXTENDED_SCENES.filter(s => s.depth_module_id === moduleId);
};
