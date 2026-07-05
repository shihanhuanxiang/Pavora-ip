import { OutfitV2 } from "../../../shared/types/types";
import OUTFITS_F from "./outfitsV2_F.json";
import OUTFITS_M from "./outfitsV2_M.json";
import OUTFITS_TW_F from "./outfitsV2_TW_F_EXT.json";
import OUTFITS_TW_M from "./outfitsV2_TW_M_EXT.json";

export const OUTFIT_SEEDS_V2: OutfitV2[] = [
  ...(OUTFITS_F as any[]),
  ...(OUTFITS_M as any[]),
  ...(OUTFITS_TW_F as any[]),
  ...(OUTFITS_TW_M as any[])
] as OutfitV2[];
