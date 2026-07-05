import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Model, ContentCategory } from '../types/types';
import { imageDB, base64ToBlob } from '../services/imageDB';
import { 
    saveModelToCloud, 
    getMyCloudModels, 
    deleteModelFromCloud,
    saveGalleryItemToCloud,
    deleteGalleryItemFromCloud
} from '../services/firebase/modelService';
import { checkGoogleDriveStatus, syncToGoogleDrive, listDriveFolders, createDriveFolder } from '../services/googleDriveService';
import { getDriveSettings } from '../services/storageService';
import { embedMetadata } from '../utils/metadataUtils';

// Firestore 同步為 best-effort 外掛：失敗時不阻擋本地操作，只降級狀態供 UI 讀取（不再噴 console.error）。
export type CloudSyncStatus = 'idle' | 'syncing' | 'ok' | 'degraded';

interface ModelState {
  models: Model[];
  activeModelId: string | null;
  cloudSyncStatus: CloudSyncStatus;
  lastSyncError?: string;
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
    contentCategory?: ContentCategory;
    styleTags?: string[];
  }) => Promise<void>;
  removeFromModelGallery: (modelId: string, itemIds: string[]) => Promise<void>;
}

const toGalleryMeta = (item: any) => ({
  id: item.id,
  timestamp: item.timestamp,
  driveFileId: item.driveFileId ?? null,
  driveLink: item.driveLink ?? null,
  driveSyncedAt: item.driveSyncedAt ?? null,
  contentCategory: item.contentCategory ?? null,
  styleTags: item.styleTags ?? null,
});

export const useModelStore = create<ModelState>()(
  persist(
    (set, get) => ({
      models: [],
      activeModelId: null,
      cloudSyncStatus: 'idle',
      lastSyncError: undefined,

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
            if (auth.currentUser) {
                for (const itemId of itemIds) {
                    await deleteGalleryItemFromCloud(modelId, itemId);
                }
                set({ cloudSyncStatus: 'ok', lastSyncError: undefined });
            }
        } catch (e) {
            set({ cloudSyncStatus: 'degraded', lastSyncError: e instanceof Error ? e.message : String(e) });
            console.warn("Cloud gallery item deletion failed", e);
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

          set({ models: merged, cloudSyncStatus: 'ok', lastSyncError: undefined });
        } catch (e) {
          set({ cloudSyncStatus: 'degraded', lastSyncError: e instanceof Error ? e.message : String(e) });
          console.warn("Cloud sync failed", e);
        }
      },

      updateModel: async (modelId, updates) => {
        // 自動上傳 base64 臉部基準圖到 Drive
        if (updates.preferences?.face_reference_urls) {
            try {
                const driveConnected = await checkGoogleDriveStatus();
                if (driveConnected) {
                    const model = get().models.find(m => m.id === modelId);
                    const modelName = (model?.name || modelId).replace(/[^a-zA-Z0-9_\u4e00-\u9fff]/g, '_');
                    const uploadedUrls = await Promise.all(
                        updates.preferences.face_reference_urls.map(async (url, i) => {
                            if (!url || !url.startsWith('data:')) return url || '';
                            const match = url.match(/^data:([^;]+);base64,(.+)$/);
                            if (!match) return url;
                            const result = await syncToGoogleDrive(
                                `FaceRef_${modelName}_${i}_${Date.now()}.jpg`,
                                match[2],
                                match[1],
                                'Pavora_Face_References'
                            );
                            return result.success && result.fileId
                                ? `drive://${result.fileId}`
                                : url; // 上傳失敗保留原始 base64（session 用）
                        })
                    );
                    updates = {
                        ...updates,
                        preferences: {
                            ...updates.preferences,
                            face_reference_urls: uploadedUrls
                        }
                    };
                }
            } catch (e) {
                console.warn('Face reference Drive upload failed, using in-memory fallback', e);
            }
        }

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
            
            // CRITICAL: Explicitly exclude gallery and other large fields from the main document update
            // to prevent "exceeds maximum allowed size" errors.
            const { gallery, ...safeUpdates } = updates as any;
            
            // Only update if there are fields left
            if (Object.keys(safeUpdates).length > 0) {
              // Ensure we don't accidentally update with an empty object causing issues if no other fields changed
              await updateDoc(modelRef, safeUpdates);
            }
            set({ cloudSyncStatus: 'ok', lastSyncError: undefined });
          }
        } catch (e) {
          set({ cloudSyncStatus: 'degraded', lastSyncError: e instanceof Error ? e.message : String(e) });
          console.warn("Cloud update failed", e);
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

        const galleryItemTimestamp = Date.now();
        let driveFileId: string | undefined;
        let driveLink: string | undefined;
        let driveSyncedAt: string | undefined;

        try {
            const isDriveConnected = await checkGoogleDriveStatus();
            if (isDriveConnected) {
                let syncData = finalImageUrl;
                if (imageDB.isIdbUrl(syncData)) {
                    const blob = await imageDB.get(syncData);
                    if (blob) syncData = await imageDB.blobToBase64(blob);
                }

                const settings = getDriveSettings();
                
                let rootFolderId = settings.modelsFolderId;
                if (!rootFolderId) {
                    const rootFolders = await listDriveFolders({ parentId: 'root' });
                    const existingRootFolder = rootFolders.folders.find(folder => folder.name === 'Pavora_Model_Gallery');
                    const rootFolder = existingRootFolder || await createDriveFolder('Pavora_Model_Gallery');
                    rootFolderId = rootFolder?.id;
                }

                let modelFolderId = rootFolderId;
                if (rootFolderId && currentModel?.name) {
                    const modelFolderName = currentModel.name.trim() || modelId;
                    const modelFolders = await listDriveFolders({ parentId: rootFolderId });
                    const existingModelFolder = modelFolders.folders.find(folder => folder.name === modelFolderName);
                    const modelFolder = existingModelFolder || await createDriveFolder(modelFolderName, rootFolderId);
                    modelFolderId = modelFolder?.id || rootFolderId;
                }

                const driveResult = await syncToGoogleDrive(
                    `ModelGallery_${modelId}_${galleryItemTimestamp}.png`,
                    syncData,
                    'image/png',
                    'Pavora_Model_Gallery',
                    modelFolderId
                );

                if (driveResult.success && driveResult.fileId) {
                    driveFileId = driveResult.fileId;
                    driveLink = driveResult.link;
                    driveSyncedAt = new Date().toISOString();
                }
            }
        } catch (e) {
            console.error("Gallery auto-sync to Google Drive failed", e);
        }

        set((state) => ({
          models: state.models.map(m => {
            if (m.id === modelId) {
                const gallery = m.gallery || [];
                const newItem = { 
                    id: `gal-${galleryItemTimestamp}`, 
                    url: finalImageUrl, 
                    timestamp: galleryItemTimestamp, 
                    narrativeContent: item.narrativeContent,
                    visualPrompt: item.visualPrompt,
                    visualPromptZH: item.visualPromptZH,
                    contentCategory: item.contentCategory,
                    styleTags: item.styleTags,
                    driveFileId,
                    driveLink,
                    driveSyncedAt
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
            if (auth.currentUser) {
                const updatedModel = get().models.find(m => m.id === modelId);
                const newItem = updatedModel?.gallery?.find(i => i.id === `gal-${galleryItemTimestamp}`);
                if (newItem) {
                    await saveGalleryItemToCloud(modelId, newItem);
                    set({ cloudSyncStatus: 'ok', lastSyncError: undefined });
                }
            }
        } catch (e) {
            set({ cloudSyncStatus: 'degraded', lastSyncError: e instanceof Error ? e.message : String(e) });
            console.warn("Cloud gallery item sync failed", e);
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
                set({ cloudSyncStatus: 'ok', lastSyncError: undefined });
            } catch (e) {
                set({ cloudSyncStatus: 'degraded', lastSyncError: e instanceof Error ? e.message : String(e) });
                console.warn("Failed to delete from cloud", e);
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
      partialize: (state) => ({
        activeModelId: state.activeModelId,
        models: state.models.map((model) => ({
          ...model,
          preferences: model.preferences ? {
            ...model.preferences,
            // 只保留 drive:// 小字串，過濾掉 base64 大圖（避免 localStorage 配額超出）
            face_reference_urls: (model.preferences.face_reference_urls || [])
                .map(url => (url && !url.startsWith('data:')) ? url : '')
          } : model.preferences,
          gallery: (model.gallery || []).slice(0, 20).map((item) => ({
            id: item.id,
            url: item.url,
            timestamp: item.timestamp,
            narrativeContent: item.narrativeContent ? item.narrativeContent.slice(0, 300) : undefined,
            visualPrompt: item.visualPrompt ? item.visualPrompt.slice(0, 1200) : undefined,
            visualPromptZH: item.visualPromptZH ? item.visualPromptZH.slice(0, 800) : undefined,
            contentCategory: item.contentCategory,
            styleTags: item.styleTags,
            driveFileId