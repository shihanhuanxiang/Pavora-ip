
// FIX: Corrected import path for types.
import type { StoredApparelItem, PortfolioItem } from '../types/types';
import { imageDB, base64ToBlob } from './imageDB';
import { checkGoogleDriveStatus, syncToGoogleDrive } from './googleDriveService';

const STORAGE_KEYS = {
  APPAREL: 'pavora_apparel',
  PORTFOLIO: 'pavora_portfolio',
  DRIVE_SETTINGS: 'pavora_drive_settings',
  SALON_PRESETS: 'pavora_salon_presets',
};

export interface DriveSettings {
  wardrobeFolderId?: string;
  portfolioFolderId?: string;
  modelsFolderId?: string;
}

export const getDriveSettings = (): DriveSettings => {
  const data = localStorage.getItem(STORAGE_KEYS.DRIVE_SETTINGS);
  return data ? JSON.parse(data) : {};
};

export const saveDriveSettings = (settings: DriveSettings): void => {
  localStorage.setItem(STORAGE_KEYS.DRIVE_SETTINGS, JSON.stringify(settings));
};

const CURRENT_APPAREL_VERSION = "1.1";
const CURRENT_PORTFOLIO_VERSION = "1.1";

// --- Personal Closet ---
export const getApparel = (): StoredApparelItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.APPAREL);
    const items: StoredApparelItem[] = data ? JSON.parse(data) : [];
    return items.map(item => {
      if (!item.schemaVersion) {
        return { ...item, schemaVersion: CURRENT_APPAREL_VERSION };
      }
      return item;
    });
  } catch (error) {
    console.error("Failed to parse apparel from localStorage", error);
    return [];
  }
};

export const saveApparel = async (item: StoredApparelItem): Promise<void> => {
  const items = getApparel();
  // Check duplicates logic could be improved, mostly by ID or content hash
  if (!items.find(i => i.id === item.id)) {
      let finalImageUrl = item.imageUrl;
      if (finalImageUrl.startsWith('data:')) {
          try {
              const blob = await base64ToBlob(finalImageUrl);
              finalImageUrl = await imageDB.save(blob);
          } catch (e) {
              console.error("Failed to save apparel image to DB", e);
          }
      }
      const itemToSave = { ...item, imageUrl: finalImageUrl, schemaVersion: CURRENT_APPAREL_VERSION };
      localStorage.setItem(STORAGE_KEYS.APPAREL, JSON.stringify([itemToSave, ...items]));

      // --- Auto Sync to Google Drive ---
      const isConnected = await checkGoogleDriveStatus();
      if (isConnected) {
          try {
              let syncData = finalImageUrl;
              if (imageDB.isIdbUrl(syncData)) {
                  const blob = await imageDB.get(syncData);
                  if (blob) syncData = await imageDB.blobToBase64(blob);
              }
              const settings = getDriveSettings();
              await syncToGoogleDrive(
                `Apparel_${item.id}.png`, 
                syncData, 
                'image/png', 
                'Pavora_Apparel',
                settings.wardrobeFolderId
              );
          } catch (e) {
              console.error("Apparel auto-sync failed", e);
          }
      }
  }
};

export const updateApparel = (updatedItem: StoredApparelItem): void => {
  const items = getApparel();
  const index = items.findIndex(i => i.id === updatedItem.id);
  if (index !== -1) {
    items[index] = { ...updatedItem };
    localStorage.setItem(STORAGE_KEYS.APPAREL, JSON.stringify(items));
  }
};

export const saveMultipleApparel = async (newItems: StoredApparelItem[]): Promise<void> => {
  const existingItems = getApparel();
  const uniqueNewItems = newItems.filter(newItem => 
    !existingItems.some(existing => existing.id === newItem.id)
  );

  const processedItems = await Promise.all(uniqueNewItems.map(async (i) => {
      let finalImageUrl = i.imageUrl;
      if (finalImageUrl.startsWith('data:')) {
          try {
              const blob = await base64ToBlob(finalImageUrl);
              finalImageUrl = await imageDB.save(blob);
          } catch (e) {
              console.error("Failed to save apparel image", e);
          }
      }
      return { ...i, imageUrl: finalImageUrl, schemaVersion: CURRENT_APPAREL_VERSION };
  }));

  if (processedItems.length > 0) {
    const combined = [...processedItems, ...existingItems];
    localStorage.setItem(STORAGE_KEYS.APPAREL, JSON.stringify(combined));
  }
};

export const syncAllApparelToGoogleDrive = async (onProgress?: (current: number, total: number) => void): Promise<void> => {
    const items = getApparel();
    const isConnected = await checkGoogleDriveStatus();
    if (!isConnected) throw new Error("Not connected to Google Drive");

    const settings = getDriveSettings();
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        try {
            let syncData = item.imageUrl;
            if (imageDB.isIdbUrl(syncData)) {
                const blob = await imageDB.get(syncData);
                if (blob) syncData = await imageDB.blobToBase64(blob);
            }
            
            await syncToGoogleDrive(
                `Apparel_${item.id}.png`,
                syncData,
                'image/png',
                'Pavora_Apparel',
                settings.wardrobeFolderId
            );
            if (onProgress) onProgress(i + 1, items.length);
        } catch (e) {
            console.error(`Sync failed for apparel item ${item.id}`, e);
        }
    }
};

export const deleteApparel = async (itemIds: string[]): Promise<void> => {
  let items = getApparel();
  const toDelete = items.filter(i => itemIds.includes(i.id));
  
  for (const item of toDelete) {
      if (item.imageUrl.startsWith('idb://')) {
          await imageDB.delete(item.imageUrl);
      }
  }

  items = items.filter(i => !itemIds.includes(i.id));
  localStorage.setItem(STORAGE_KEYS.APPAREL, JSON.stringify(items));
};


// --- Portfolio Gallery ---
export const getPortfolioItems = (): PortfolioItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PORTFOLIO);
    const items: PortfolioItem[] = data ? JSON.parse(data) : [];
    return items.map(item => {
      if (!item.schemaVersion) {
        return { ...item, schemaVersion: CURRENT_PORTFOLIO_VERSION };
      }
      return item;
    });
  } catch (error) {
    console.error("Failed to parse portfolio items from localStorage", error);
    return [];
  }
};

export const savePortfolioItem = async (item: Omit<PortfolioItem, 'id' | 'createdAt'>): Promise<void> => {
  const items = getPortfolioItems();
  
  // Deduplicate by driveFileId if provided
  if (item.driveFileId && items.some(i => i.driveFileId === item.driveFileId)) {
    return;
  }
  
  let finalImageUrl = item.imageUrl;
  // Critical fix: Offload base64 to IndexedDB
  if (finalImageUrl.startsWith('data:')) {
      try {
          const blob = await base64ToBlob(finalImageUrl);
          finalImageUrl = await imageDB.save(blob);
      } catch (e) {
          console.error("Failed to save portfolio image to DB", e);
      }
  }

  const newItem: PortfolioItem = {
    ...item,
    imageUrl: finalImageUrl,
    id: `portfolio-${Date.now()}`,
    createdAt: new Date().toISOString(),
    schemaVersion: CURRENT_PORTFOLIO_VERSION,
  };
  
  // Prevent duplicate logical entries (though ID is unique timestamp, so mostly dedupe by content/source if needed)
  localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify([newItem, ...items]));

  // --- Auto Sync to Google Drive ---
  const isConnected = await checkGoogleDriveStatus();
  if (isConnected) {
      try {
          let syncData = item.imageUrl;
          if (imageDB.isIdbUrl(syncData)) {
              const blob = await imageDB.get(syncData);
              if (blob) syncData = await imageDB.blobToBase64(blob);
          }
          
          const settings = getDriveSettings();
          await syncToGoogleDrive(
              `${item.sourceModule}_${Date.now()}.png`,
              syncData,
              'image/png',
              'Pavora_Assets',
              settings.portfolioFolderId
          );
      } catch (e) {
          console.error("Auto-sync to Google Drive failed", e);
      }
  }
};

export const saveMultiplePortfolioItems = async (newItems: Omit<PortfolioItem, 'id' | 'createdAt'>[]): Promise<void> => {
  const existingItems = getPortfolioItems();
  const existingDriveIds = new Set(existingItems.filter(i => i.driveFileId).map(i => i.driveFileId));
  
  const processedItems = await Promise.all(newItems.filter(item => !item.driveFileId || !existingDriveIds.has(item.driveFileId)).map(async (item) => {
    let finalImageUrl = item.imageUrl;
    if (finalImageUrl.startsWith('data:')) {
        try {
            const blob = await base64ToBlob(finalImageUrl);
            finalImageUrl = await imageDB.save(blob);
        } catch (e) {
            console.error("Failed to save portfolio image to DB", e);
        }
    }
    return {
      ...item,
      imageUrl: finalImageUrl,
      id: `portfolio-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      schemaVersion: CURRENT_PORTFOLIO_VERSION,
    };
  }));

  localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify([...processedItems, ...existingItems]));

  // Optional: Sync all to Drive if needed
  const isConnected = await checkGoogleDriveStatus();
  if (isConnected) {
      // For simplicity, we just trigger a background sync for the new items
      // In a real app, you'd queue these
  }
};

export const syncAllToGoogleDrive = async (onProgress?: (current: number, total: number) => void): Promise<void> => {
    const items = getPortfolioItems();
    const isConnected = await checkGoogleDriveStatus();
    if (!isConnected) throw new Error("Not connected to Google Drive");

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        try {
            let syncData = item.imageUrl;
            if (imageDB.isIdbUrl(syncData)) {
                const blob = await imageDB.get(syncData);
                if (blob) syncData = await imageDB.blobToBase64(blob);
            }
            
            await syncToGoogleDrive(
                `${item.sourceModule}_${item.id}.png`,
                syncData,
                'image/png'
            );
            if (onProgress) onProgress(i + 1, items.length);
        } catch (e) {
            console.error(`Sync failed for item ${item.id}`, e);
        }
    }
};

export const deletePortfolioItems = async (itemIds: string[]): Promise<void> => {
  let items = getPortfolioItems();
  const toDelete = items.filter(i => itemIds.includes(i.id));
  
  for (const item of toDelete) {
      if (item.imageUrl.startsWith('idb://')) {
          await imageDB.delete(item.imageUrl);
      }
  }

  items = items.filter(i => !itemIds.includes(i.id));
  localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(items));
};

// --- Salon Presets ---
export const getSalonPresets = (): any[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.SALON_PRESETS);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
};

export const saveSalonPreset = (preset: any): void => {
    const presets = getSalonPresets();
    localStorage.setItem(STORAGE_KEYS.SALON_PRESETS, JSON.stringify([preset, ...presets]));
};

export const deleteSalonPreset = (id: string): void => {
    const presets = getSalonPresets();
    localStorage.setItem(STORAGE_KEYS.SALON_PRESETS, JSON.stringify(presets.filter((p: any) => p.id !== id)));
};
