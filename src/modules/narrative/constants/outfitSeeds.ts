import { OutfitV2 } from "../../../shared/types/types";
import OUTFITS_F from "./outfitsV2_F.json";
import OUTFITS_M from "./outfitsV2_M.json";

export const OUTFIT_SEEDS_V2: OutfitV2[] = [
  ...(OUTFITS_F as any[]),
  ...(OUTFITS_M as any[])
] as OutfitV2[];
