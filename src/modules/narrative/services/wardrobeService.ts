import { OutfitV2 } from "../../../shared/types/types";

// Key for local storage
const STORAGE_KEY = 'pavora_user_wardrobe';

/**
 * Service to manage user-defined outfits.
 */
export const WardrobeService = {
  /**
   * Get all user-defined outfits from localStorage.
   */
  getUserOutfits(): OutfitV2[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to load user wardrobe:", e);
      return [];
    }
  },

  /**
   * Add a new outfit to user wardrobe.
   */
  addOutfit(outfit: OutfitV2): void {
    const list = this.getUserOutfits();
    list.push(outfit);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  },

  /**
   * Remove an outfit from user wardrobe.
   */
  removeOutfit(outfitId: string): void {
    const list = this.getUserOutfits();
    const filtered = list.filter(o => o.outfit_id !== outfitId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
};
