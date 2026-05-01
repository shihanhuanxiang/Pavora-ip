import { useState, useEffect } from 'react';
import { OutfitV2 } from '../../shared/types/types';
import { OUTFIT_SEEDS_V2 } from '../../modules/narrative/constants/outfitSeeds';
import { WardrobeService } from '../../modules/narrative/services/wardrobeService';

/**
 * Hook to manage combined wardrobe (Seeds + User Custom).
 */
export function useWardrobe() {
  const [userOutfits, setUserOutfits] = useState<OutfitV2[]>([]);
  const [allOutfits, setAllOutfits] = useState<OutfitV2[]>(OUTFIT_SEEDS_V2);

  useEffect(() => {
    const custom = WardrobeService.getUserOutfits();
    setUserOutfits(custom);
    setAllOutfits([...OUTFIT_SEEDS_V2, ...custom]);
  }, []);

  const addCustomOutfit = (outfit: OutfitV2) => {
    WardrobeService.addOutfit(outfit);
    const updated = WardrobeService.getUserOutfits();
    setUserOutfits(updated);
    setAllOutfits([...OUTFIT_SEEDS_V2, ...updated]);
  };

  const removeCustomOutfit = (id: string) => {
    WardrobeService.removeOutfit(id);
    const updated = WardrobeService.getUserOutfits();
    setUserOutfits(updated);
    setAllOutfits([...OUTFIT_SEEDS_V2, ...updated]);
  };

  return {
    userOutfits,
    allOutfits,
    addCustomOutfit,
    removeCustomOutfit
  };
}
