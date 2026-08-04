/**
 * ⚠️ 2026-08-04（企劃案 D-1）：**這個 store 全 repo 零引用。**
 *
 * grep `useWardrobeStore` 只命中下面這一行宣告，沒有任何元件在用它。
 * 它是當初為「統一三套衣櫥」而建的，但**從未接線**——三套衣櫥
 * （靈魂敘事 / 服裝設計 / 虛擬試衣間）目前各自管自己的資料。
 *
 * 為什麼保留而不刪：統一衣櫥是企劃案 A-1／A-3（階段 4／階段 6）的正式待辦，
 * 屆時這個 store 的 schema 與 IndexedDB 接法可以直接沿用。
 *
 * ⛳ 但請不要因為看到這個檔案就以為衣櫥已經統一了 —— 它還沒有。
 *    現況與規劃見 `盤點_C軌_2026-08-01/規劃_衣櫥架構與PR-G_2026-08-01.md`。
 */
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
