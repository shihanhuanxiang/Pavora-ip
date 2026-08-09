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

/**
 * 品牌代言人上限（2026-08-05，企劃案 B-8 步驟 1）。
 *
 * 原本是硬寫在 `ModelLounge.tsx:193` 的魔術數字 `5`，沒有常數也沒有說明。
 * 搬到這裡讓它只有一個定義處。B-8 步驟 2 把讀取端切過來後，
 * `ModelLounge` 那個字面量就會被這個常數取代。
 */
export const AMBASSADOR_LIMIT = 5;

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
  /**
   * 品牌代言人 API（2026-08-05 新增，企劃案 B-8 步驟 1）。
   *
   * ⚠️ 這一步只是**把 API 建起來**，還沒有任何呼叫端 —— `useBrandStore` 照舊運作，
   * 兩套並存、現有行為零改變。把 11 處讀取端切過來是步驟 2。
   * 這樣拆是為了讓每一步都能獨立進版而不破壞功能。
   */
  getAmbassadorModels: () => Model[];
  setAmbassador: (modelId: string, isAmbassador: boolean) => Promise<void>;
  /**
   * 目前鎖定身份用的代言人（2026-08-05，企劃案 B-8 步驟 2）。
   *
   * ⚠️ 這**不等於** `activeModelId`。兩者是不同概念：
   *   `activeModelId`        = 使用者目前在操作哪個 IP（Header 的 IP 選擇器，階段 2 加的）
   *   `activeAmbassadorId`   = 生圖時要鎖定哪張臉當身份錨點
   * 例如：在場景轉移裡，使用者可以一邊以 IP-A 為當前角色，一邊選 IP-B 的臉來鎖定。
   *
   * 合併這兩個指標是 UX 決策，不屬於 B-8 的搬遷範圍——所以這裡刻意複製
   * `useBrandStore` 的同名 API，讓 11 處讀取端**只改 import 來源、其餘一字不動**，
   * 確保步驟 2 是行為等價的替換而不是功能重寫。
   */
  activeAmbassadorId: string | null;
  setActiveAmbassador: (id: string | null) => void;
  /**
   * 把舊的 `pavora-brand-store` 代言人併進 `models[].isAmbassador`（B-8 步驟 2）。
   *
   * **非破壞性**：只讀舊 key、只寫新欄位，**不刪除任何舊資料**。
   * 舊的 localStorage key 原封不動留著當備份，確認無誤後才由步驟 3 清除。
   *
   * 為什麼要現在做而不是等步驟 3：步驟 2 把讀取端切到 `isAmbassador` 之後，
   * 現有使用者沒有任何 Model 帶這個標記，代言人會**從畫面上消失**直到遷移跑完。
   * 那等於破壞現有功能，違反「每一步都不破壞功能」的原則。
   *
   * fail-safe：整批包在 try/catch 裡，任何一步出錯就整批放棄並保留舊資料，
   * 不做部分成功——半套遷移比不遷移更難救。
   */
  migrateAmbassadorsFromBrandStore: () => Promise<{ matched: number; orphans: number; skipped: boolean }>;
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
      },

      // ── 品牌代言人（企劃案 B-8 步驟 1，2026-08-05）─────────────────────────
      // 目前零呼叫端。步驟 2 才會把 11 處讀取端從 useBrandStore 切過來。

      activeAmbassadorId: null,

      setActiveAmbassador: (id) => set({ activeAmbassadorId: id }),

      migrateAmbassadorsFromBrandStore: async () => {
        const DONE_KEY = 'pavora-b8-ambassador-migrated';
        const NOOP = { matched: 0, orphans: 0, skipped: true };
        try {
          if (typeof localStorage === 'undefined') return NOOP;
          if (localStorage.getItem(DONE_KEY) === '1') return NOOP;

          const raw = localStorage.getItem('pavora-brand-store');
          if (!raw) { localStorage.setItem(DONE_KEY, '1'); return NOOP; }

          const parsed = JSON.parse(raw);
          const oldAmbs: any[] = parsed?.state?.ambassadors ?? [];
          const oldActiveId: string | null = parsed?.state?.activeAmbassadorId ?? null;
          if (!Array.isArray(oldAmbs) || oldAmbs.length === 0) {
            localStorage.setItem(DONE_KEY, '1');
            return NOOP;
          }

          const models = get().models;
          const nextModels = models.map(m => ({ ...m }));
          const orphans: any[] = [];
          let matched = 0;
          let newActiveId: string | null = null;

          for (const amb of oldAmbs) {
            // 舊代言人唯一的建立途徑是「從 Model 晉升」，所以 imageUrl 必然相同。
            // name 只是保險：使用者若換過圖，imageUrl 會變但名字通常還在。
            const hit = nextModels.find(m => m.imageUrl && m.imageUrl === amb.imageUrl)
                     ?? nextModels.find(m => m.name && m.name === amb.name);
            if (hit) {
              hit.isAmbassador = true;
              matched++;
              if (oldActiveId && amb.id === oldActiveId) newActiveId = hit.id;
            } else {
              orphans.push(amb);
            }
          }

          // 孤兒 = 晉升成代言人之後，對應的 Model 被刪掉了。
          // 反向補建成 Model 而不是丟掉 —— 使用者的資料不該因為我們重構而消失。
          // 缺的欄位留空即可，生圖只需要 name 與 imageUrl。
          for (const amb of orphans) {
            const revived: Model = {
              id: amb.id,
              name: amb.name,
              imageUrl: amb.imageUrl,
              type: 'custom',
              gender: amb.gender,
              isAmbassador: true
            } as Model;
            nextModels.push(revived);
            if (oldActiveId && amb.id === oldActiveId) newActiveId = revived.id;
          }

          set({
            models: nextModels,
            activeAmbassadorId: newActiveId ?? get().activeAmbassadorId
          });
          localStorage.setItem(DONE_KEY, '1');
          // 刻意不刪 `pavora-brand-store` —— 留著當備份，由步驟 3 確認無誤後才清除。
          return { matched, orphans: orphans.length, skipped: false };
        } catch (e) {
          // fail-safe：整批放棄，舊資料原封不動，下次啟動會再試一次。
          console.error('[B-8] 代言人遷移失敗，已放棄本次並保留舊資料：', e);
          return NOOP;
        }
      },

      getAmbassadorModels: () => get().models.filter(m => m.isAmbassador === true),

      setAmbassador: async (modelId, isAmbassador) => {
        // 上限沿用既有規則（原本硬寫在 ModelLounge.tsx:193 的魔術數字 5）。
        // 搬進 store 是為了讓「上限」只有一個定義處，未來要改不必翻 UI。
        if (isAmbassador) {
          const current = get().models.filter(m => m.isAmbassador === true && m.id !== modelId);
          if (current.length >= AMBASSADOR_LIMIT) {
            throw new Error(`品牌代言人上限為 ${AMBASSADOR_LIMIT} 位，請先移除現有代言人。`);
          }
        }
        // 走既有的 updateModel，才能沿用它的雲端同步與 Drive 上傳邏輯，
        // 不要在這裡自己 set()——那會繞過同步，變成本地與雲端不一致。
        await get().updateModel(modelId, { isAmbassador });
      }
    }),
    {
      name: 'pavora-models-store',
      storage: createJSONStorage(() => localStorage),
      /**
       * 資料版本（2026-08-05 新增，企劃案 B-8 步驟 1）。
       *
       * 在此之前**兩個 store 都完全沒有版本機制**——沒有 `version`、沒有 `migrate`。
       * 這代表過去每次動資料模型都只能靠「新欄位設 optional」硬撐，
       * 而真正需要搬資料的改動（例如 B-8 步驟 3 要把 `useBrandStore.ambassadors`
       * 併進 `models[].isAmbassador`）根本無處可掛。
       *
       * version 1 = 建立基準點。此版本不做任何轉換：
       * `isAmbassador` 是 optional，舊資料讀進來是 undefined，
       * `getAmbassadorModels()` 用 `=== true` 比對，undefined 自然被排除，行為正確。
       *
       * B-8 步驟 3 會加 version 2 的分支去做實際遷移。
       */
      version: 1,
      migrate: (persistedState: any, fromVersion: number) => {
        // fromVersion 0 = 這個機制建立之前存下的資料。
        // 不需要任何轉換（理由見上），原樣返回即可。
        // ⚠️ 未來新增遷移分支時務必 fail-safe：任何一筆轉換失敗就整批跳過並
        //    在 console 留明確訊息，不要部分成功——半套遷移比不遷移更難救。
        if (fromVersion < 1) return persistedState;
        return persistedState;
      },
      partialize: (state) => ({
        activeModelId: state.activeModelId,
        // B-8 步驟 2：代言人指標也要持久化，否則重整後身份鎖定會消失
        // （原本存在 useBrandStore 的 pavora-brand-store 裡）。
        activeAmbassadorId: state.activeAmbassadorId,
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
            driveFileId: item.driveFileId,
            driveLink: item.driveLink,
            driveSyncedAt: item.driveSyncedAt
          }))
        }))
      }),
      // Only persist metadata, images are in IDB linked by URL
    }
  )
);
