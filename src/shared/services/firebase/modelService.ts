
import { 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    deleteDoc, 
    serverTimestamp,
    Timestamp
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

const COLLECTION_NAME = 'models';

/**
 * Save a model configuration to the cloud.
 */
export const saveModelToCloud = async (model: Model) => {
    if (!auth.currentUser) throw new Error("User not authenticated");

    const path = `${COLLECTION_NAME}/${model.id}`;
    try {
        // We exclude the gallery for now as it can be large, or save it separately
        const { ...modelData } = model;
        
        await setDoc(doc(db, COLLECTION_NAME, model.id), {
            ...modelData,
            createdBy: auth.currentUser.uid,
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

    const path = COLLECTION_NAME;
    try {
        const q = query(collection(db, COLLECTION_NAME), where("createdBy", "==", auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        
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

    const path = `${COLLECTION_NAME}/${modelId}`;
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, modelId));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
    }
};
