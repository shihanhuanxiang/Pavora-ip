
import { 
    collection, 
    doc, 
    setDoc, 
    getDocs, 
    deleteDoc, 
    serverTimestamp,
    query,
    orderBy,
    limit,
} from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import type { Model } from '../../types/types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const getUserModelsCollectionPath = (uid: string) => `users/${uid}/models`;
const getGalleryCollectionPath = (uid: string, modelId: string) => `users/${uid}/models/${modelId}/gallery`;

/**
 * Save a model configuration to the cloud.
 */
export const saveModelToCloud = async (model: Model) => {
    if (!auth.currentUser) throw new Error("User not authenticated");

    const userId = auth.currentUser.uid;
    const collectionPath = getUserModelsCollectionPath(userId);
    const path = `${collectionPath}/${model.id}`;
    try {
        // CRITICAL: Exclude gallery and other internal state that shouldn't be in the main document.
        // We only save the core model identity metadata here.
        const { gallery, ...modelData } = model;
        
        // Remove any base64 data that might have escaped into the main model document
        // specifically checking for the main imageUrl if it's still base64 (which shouldn't happen but let's be safe)
        const sanitizedModelData = {
            ...modelData,
            imageUrl: modelData.imageUrl?.startsWith('data:') ? 'idb://local-image-sync-pending' : modelData.imageUrl
        };
        
        const docData = {
            ...sanitizedModelData,
            createdBy: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        // Remove any undefined values that Firestore doesn't like
        Object.keys(docData).forEach(key => (docData as any)[key] === undefined && delete (docData as any)[key]);

        await setDoc(doc(db, collectionPath, model.id), docData);

        // If there's a gallery, sync it to the subcollection independently
        if (gallery && gallery.length > 0) {
            const galleryPath = getGalleryCollectionPath(userId, model.id);
            // Limit to syncing the most recent items or handle incrementally
            // For now, let's just use the subcollection pattern which is safe for size
            for (const item of gallery) {
                if (item.id) {
                    await setDoc(doc(db, galleryPath, item.id), item);
                }
            }
        }
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
    }
};

/**
 * Save a single gallery item to the cloud.
 */
export const saveGalleryItemToCloud = async (modelId: string, item: any) => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    const userId = auth.currentUser.uid;
    const path = getGalleryCollectionPath(userId, modelId);
    try {
        await setDoc(doc(db, path, item.id), item);
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `${path}/${item.id}`);
    }
};

/**
 * Delete a gallery item from the cloud.
 */
export const deleteGalleryItemFromCloud = async (modelId: string, itemId: string) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    const path = getGalleryCollectionPath(userId, modelId);
    try {
        await deleteDoc(doc(db, path, itemId));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${path}/${itemId}`);
    }
};

/**
 * Fetch all models created by the current user.
 */
export const getMyCloudModels = async (): Promise<Model[]> => {
    if (!auth.currentUser) return [];

    const userId = auth.currentUser.uid;
    const path = getUserModelsCollectionPath(userId);
    try {
        const querySnapshot = await getDocs(collection(db, path));
        
        const models = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
            const data = docSnapshot.data();
            const modelId = docSnapshot.id;
            
            // Optionally fetch gallery items (limiting to avoid massive reads on initial load)
            const galleryPath = getGalleryCollectionPath(userId, modelId);
            const gallerySnapshot = await getDocs(query(collection(db, galleryPath), orderBy('timestamp', 'desc'), limit(50)));
            const gallery = gallerySnapshot.docs.map(d => d.data() as any);

            return {
                ...data,
                id: modelId,
                gallery
            } as Model;
        }));

        return models;
    } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
    }
};

/**
 * Delete a model from the cloud.
 */
export const deleteModelFromCloud = async (modelId: string) => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    const collectionPath = getUserModelsCollectionPath(userId);
    const path = `${collectionPath}/${modelId}`;
    try {
        await deleteDoc(doc(db, collectionPath, modelId));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
    }
};
