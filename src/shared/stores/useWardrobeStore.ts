import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StoredApparelItem } from '../types/types';
import { imageDB, base64ToBlob } from '../services/imageDB';

interface WardrobeState {
  items: StoredApparelItem[];
  addItem: (item: StoredApparelItem) => Promise<void>;
  addItems: (items: StoredApparelItem[]) => Promise<void>;
  removeItems: (ids: string[]) => Promise<void>;
}

export const useWardrobeStore = create<WardrobeState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: async (item) => {
        let finalImageUrl = item.imageUrl;
        if (item.imageUrl.startsWith('data:')) {
            try {
                const blob = await base64ToBlob(item.imageUrl);
                finalImageUrl = await imageDB.save(blob);
            } catch (e) {
                console.error("Failed to save apparel image to DB", e);
            }
        }
        const newItem = { ...item, imageUrl: finalImageUrl };
        set((state) => ({ items: [newItem, ...state.items] }));
      },

      addItems: async (newItems) => {
          const processedItems = await Promise.all(newItems.map(async (item) => {
              let finalImageUrl = item.imageUrl;
              if (item.imageUrl.startsWith('data:')) {
                  try {
                      const blob = await base64ToBlob(item.imageUrl);
                      finalImageUrl = await imageDB.save(blob);
                  } catch (e) {
                      console.error("Failed to save apparel image", e);
                  }
              }
              return { ...item, imageUrl: finalImageUrl };
          }));
          set((state) => ({ items: [...processedItems, ...state.items] }));
      },

      removeItems: async (ids) => {
        const currentItems = get().items;
        const toDelete = currentItems.filter(i => ids.includes(i.id));
        
        for (const item of toDelete) {
            if (item.imageUrl.startsWith('idb://')) {
                await imageDB.delete(item.imageUrl);
            }
        }

        set((state) => ({
          items: state.items.filter((i) => !ids.includes(i.id))
        }));
      },
    }),
    {
      name: 'pavora-wardrobe-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
