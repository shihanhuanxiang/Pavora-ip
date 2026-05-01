import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Model } from '../types/types';
import { imageDB, base64ToBlob } from '../services/imageDB';
import { saveModelToCloud, getMyCloudModels, deleteModelFromCloud } from '../services/firebase/modelService';
import { embedMetadata } from '../utils/metadataUtils';

interface ModelState {
  models: Model[];
  activeModelId: string | null;
  addModel: (model: Model, skipCloud?: boolean) => Promise<void>;
  syncWithCloud: () => Promise<void>;
  removeModels: (ids: string[]) => Promise<void>;
  setActiveModel: (id: string | null) => void;
  getActiveModel: () => Model | undefined;
  updateModel: (modelId: string, updates: Partial<Model>) => Promise<void>;
  updateModelGallery: (modelId: string, item: { 
    url: string; 
    narrativeContent?: string;
    visualPrompt?: string;
    visualPromptZH?: string;
  }) => Promise<void>;
  removeFromModelGallery: (modelId: string, itemIds: string[]) => Promise<void>;
}

export const useModelStore = create<ModelState>()(
  persist(
    (set, get) => ({
      models: [],
      activeModelId: null,

      removeFromModelGallery: async (modelId, itemIds) => {
        const model = get().models.find(m => m.id === modelId);
        if (!model || !model.gallery) return;

        const itemsToDelete = model.gallery.filter(item => itemIds.includes(item.id));
        
        // Cleanup IDB locally
        for (const item of itemsToDelete) {
            if (item.url.startsWith('idb://')) {
                await imageDB.delete(item.url);
            }
        }

        const updatedGallery = model.gallery.filter(item => !itemIds.includes(item.id));
        
        // Update local state
        set((state) => ({
          models: state.models.map(m => m.id === modelId ? { ...m, gallery: updatedGallery } : m)
        }));

        // Update cloud if needed
        try {
            const { auth } = await import('../services/firebase/firebaseConfig');
            const user = auth.currentUser;
            if (user) {
                const { doc, updateDoc } = await import('firebase/firestore');
                const { db } = await import('../services/firebase/firebaseConfig');
                const modelRef = doc(db, `users/${user.uid}/models`, modelId);
                await updateDoc(modelRef, { gallery: updatedGallery });
            }
        } catch (e) {
            console.error("Cloud gallery update failed", e);
        }
      },

      syncWithCloud: async () => {
        try {
          const cloudModels = await getMyCloudModels();
          if (cloudModels.length === 0) return;

          const localModels = get().models;
          const merged = [...localModels];

          cloudModels.forEach(cm => {
            if (!merged.find(lm => lm.id === cm.id)) {
              merged.push(cm);
            }
          });

          set({ models: merged });
        } catch (e) {
          console.error("Cloud sync failed", e);
        }
      },

      updateModel: async (modelId, updates) => {
        set((state) => ({
          models: state.models.map((m) => (m.id === modelId ? { ...m, ...updates } : m)),
        }));
        
        try {
          const { auth } = await import('../services/firebase/firebaseConfig');
          const user = auth.currentUser;
          if (user) {
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('../services/firebase/firebaseConfig');
            const modelRef = doc(db, `users/${user.uid}/models`, modelId);
            await updateDoc(modelRef, updates);
          }
        } catch (e) {
          console.error("Cloud update failed", e);
        }
      },

      updateModelGallery: async (modelId, item) => {
        const currentModel = get().models.find(m => m.id === modelId);
        let finalImageUrl = item.url;
        
        // Identity Inheritance Hook: Embed model metadata into new gallery items (base64)
        if (item.url.startsWith('data:') && currentModel) {
            const { wrapImageWithIdentity } = await import('../utils/metadataUtils');
            finalImageUrl = wrapImageWithIdentity(item.url, currentModel);
        }

        if (finalImageUrl.startsWith('data:')) {
            try {
                const blob = await base64ToBlob(finalImageUrl);
                finalImageUrl = await imageDB.save(blob);
            } catch (e) {
                console.error("Failed to save gallery image to DB", e);
            }
        }

        set((state) => ({
          models: state.models.map(m => {
            if (m.id === modelId) {
                const gallery = m.gallery || [];
                const newItem = { 
                    id: `gal-${Date.now()}`, 
                    url: finalImageUrl, 
                    timestamp: Date.now(), 
                    narrativeContent: item.narrativeContent,
                    visualPrompt: item.visualPrompt,
                    visualPromptZH: item.visualPromptZH
                };
                return {
                    ...m,
                    gallery: [newItem, ...gallery]
                };
            }
            return m;
          })
        }));

        // Cloud sync for gallery (if user logged in)
        try {
            const { auth } = await import('../services/firebase/firebaseConfig');
            const user = auth.currentUser;
            if (user) {
                const { doc, updateDoc, arrayUnion } = await import('firebase/firestore');
                const { db } = await import('../services/firebase/firebaseConfig');
                const modelRef = doc(db, `users/${user.uid}/models`, modelId);
                const updatedModel = get().models.find(m => m.id === modelId);
                if (updatedModel && updatedModel.gallery) {
                    await updateDoc(modelRef, { gallery: updatedModel.gallery });
                }
            }
        } catch (e) {
            console.error("Cloud gallery sync failed", e);
        }
      },

      addModel: async (model, skipCloud = false) => {
        // 1. Embed metadata into the image if it's base64
        let processedImageUrl = model.imageUrl;
        if (model.imageUrl.startsWith('data:')) {
            const { id, name, gender, age, persona, lifeCircuit, stats, type } = model;
            const metadata = { 
                id, name, gender, age, persona, lifeCircuit, stats, type, 
                exportedAt: new Date().toISOString() 
            };
            processedImageUrl = embedMetadata(model.imageUrl, metadata);
        }

        // 2. Process Image: Save to IDB and get reference
        let finalImageUrl = processedImageUrl;
        if (processedImageUrl.startsWith('data:')) {
            try {
                const blob = await base64ToBlob(processedImageUrl);
                finalImageUrl = await imageDB.save(blob);
            } catch (e) {
                console.error("Failed to save image to DB", e);
            }
        }

        const newModel = { ...model, imageUrl: finalImageUrl };

        // 3. Save to Cloud if requested and not skipped
        if (!skipCloud) {
            try {
                await saveModelToCloud(newModel);
            } catch (e) {
                console.warn("Could not save to cloud, will stay local only", e);
            }
        }

        set((state) => ({
          models: [newModel, ...state.models],
          activeModelId: newModel.id
        }));
      },

      removeModels: async (ids) => {
        const currentModels = get().models;
        const modelsToDelete = currentModels.filter(m => ids.includes(m.id));
        
        // Clean up IDB and Cloud
        for (const m of modelsToDelete) {
            if (m.imageUrl.startsWith('idb://')) {
                await imageDB.delete(m.imageUrl);
            }
            try {
                await deleteModelFromCloud(m.id);
            } catch (e) {
                console.error("Failed to delete from cloud", e);
            }
        }

        set((state) => ({
          models: state.models.filter((m) => !ids.includes(m.id)),
          activeModelId: state.activeModelId && ids.includes(state.activeModelId) ? null : state.activeModelId
        }));
      },

      setActiveModel: (id) => set({ activeModelId: id }),
      
      getActiveModel: () => {
          const { models, activeModelId } = get();
          return models.find(m => m.id === activeModelId);
      }
    }),
    {
      name: 'pavora-models-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist metadata, images are in IDB linked by URL
    }
  )
);
