import { openDB, DBSchema } from 'idb';

interface PavoraDB extends DBSchema {
  images: {
    key: string;
    value: Blob;
  };
}

const DB_NAME = 'pavora-assets-db';
const STORE_NAME = 'images';

const dbPromise = openDB<PavoraDB>(DB_NAME, 1, {
  upgrade(db) {
    db.createObjectStore(STORE_NAME);
  },
});

export const imageDB = {
  async save(blob: Blob): Promise<string> {
    const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const db = await dbPromise;
    await db.put(STORE_NAME, blob, id);
    return `idb://${id}`;
  },

  async get(id: string): Promise<Blob | undefined> {
    const key = id.replace('idb://', '');
    const db = await dbPromise;
    return db.get(STORE_NAME, key);
  },

  async getUrl(id: string): Promise<string | undefined> {
    if (!id.startsWith('idb://')) return id; // Return original if not an IDB ID
    const blob = await this.get(id);
    if (blob) {
      return URL.createObjectURL(blob);
    }
    return undefined;
  },
  
  async delete(id: string): Promise<void> {
    const key = id.replace('idb://', '');
    const db = await dbPromise;
    await db.delete(STORE_NAME, key);
  },

  isIdbUrl(url: string): boolean {
    return url.startsWith('idb://');
  },

  async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
};

// Utility to convert Base64 string to Blob for storage
export const base64ToBlob = async (base64: string): Promise<Blob> => {
  const response = await fetch(base64);
  return await response.blob();
};
