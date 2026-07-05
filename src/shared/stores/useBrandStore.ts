import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { BrandAmbassador, BrandPreset } from '../types/types';
import { imageDB, base64ToBlob } from '../services/imageDB';

interface BrandState {
  ambassadors: BrandAmbassador[];
  presets: BrandPreset[];
  activeAmbassadorId: string | null;
  
  addAmbassador: (ambassador: BrandAmbassador) => Promise<void>;
  removeAmbassadors: (ids: string[]) => Promise<void>;
  updateAmbassador: (id: string, updates: Partial<BrandAmbassador>) => void;
  setActiveAmbassador: (id: string | null) => void;
  
  addPreset: (preset: BrandPreset) => void;
  removePresets: (ids: string[]) => void;
}

export const useBrandStore = create<BrandState>()(
  persist(
    (set, get) => ({
      ambassadors: [],
      presets: [],
      activeAmbassadorId: null,

      addAmbassador: async (ambassador) => {
        let finalImageUrl = ambassador.imageUrl;
        if (ambassador.imageUrl.startsWith('data:')) {
          try {
            const blob = await base64ToBlob(ambassador.imageUrl);
            finalImageUrl = await imageDB.save(blob);
          } catch (e) {
            console.error("Failed to save ambassador image", e);
          }
        }
        const newAmbassador = { ...ambassador, imageUrl: finalImageUrl };
        set((state) => ({
          ambassadors: [newAmbassador, ...state.ambassadors],
          activeAmbassadorId: newAmbassador.id
        }));
      },

      removeAmbassadors: async (ids) => {
        const current = get().ambassadors;
        const toDelete = current.filter(a => ids.includes(a.id));
        for (const a of toDelete) {
          if (a.imageUrl.startsWith('idb://')) {
            await imageDB.delete(a.imageUrl);
          }
        }
        set((state) => ({
          ambassadors: state.ambassadors.filter(a => !ids.includes(a.id)),
          activeAmbassadorId: state.activeAmbassadorId && ids.includes(state.activeAmbassadorId) ? null : state.activeAmbassadorId
        }));
      },

      updateAmbassador: (id, updates) => set((state) => ({
        ambassadors: state.ambassadors.map(a => a.id === id ? { ...a, ...updates } : a)
      })),

      setActiveAmbassador: (id) => set({ activeAmbassadorId: id }),

      addPreset: (preset) => set((state) => ({
        presets: [preset, ...state.presets]
      })),

      removePresets: (ids) => set((state) => ({
        presets: state.presets.filter(p => !ids.includes(p.id))
      })),
    }),
    {
      name: 'pavora-brand-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
