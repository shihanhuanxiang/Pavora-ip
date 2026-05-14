
import { 
    collection, 
    doc, 
    setDoc, 
    getDocs, 
    deleteDoc, 
    serverTimestamp,
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

/**
 * Save a model configuration to the cloud.
 */
export const saveModelToCloud = async (model: Model) => {
    if (!auth.currentUser) throw new Error("User not authenticated");

    const userId = auth.currentUser.uid;
    const collectionPath = getUserModelsCollectionPath(userId);
    const path = `${collectionPath}/${model.id}`;
    try {
        // Exclude gallery from Firestore model documents because generated images can exceed document size limits.
        const { gallery, ...modelData } = model;
        
        await setDoc(doc(db, collectionPath, model.id), {
            ...modelData,
            createdBy: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
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
        
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
            } as Model;
        });
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
