
export interface DriveSyncResponse {
  success: boolean;
  fileId?: string;
  link?: string;
  error?: string;
}

export const checkGoogleDriveStatus = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/status');
    const data = await response.json();
    return data.connected;
  } catch (error) {
    console.error('Error checking Google Drive status:', error);
    return false;
  }
};

export const syncToGoogleDrive = async (
  fileName: string,
  fileData: string,
  mimeType: string,
  folderName: string = 'Pavora_Assets',
  folderId?: string
): Promise<DriveSyncResponse> => {
  try {
    const response = await fetch('/api/drive/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName,
        fileData,
        mimeType,
        folderName,
        folderId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error };
    }

    return await response.json();
  } catch (error) {
    console.error('Error syncing to Google Drive:', error);
    return { success: false, error: 'Network error' };
  }
};

export const listDriveFolders = async (options: { search?: string; parentId?: string; pageToken?: string } = {}): Promise<{ folders: { id: string; name: string }[]; nextPageToken?: string }> => {
  try {
    const params = new URLSearchParams();
    if (options.search) params.append('search', options.search);
    if (options.parentId) params.append('parentId', options.parentId);
    if (options.pageToken) params.append('pageToken', options.pageToken);
    
    const response = await fetch(`/api/drive/folders?${params.toString()}`);
    if (!response.ok) return { folders: [] };
    const data = await response.json();
    return { 
      folders: data.folders || [], 
      nextPageToken: data.nextPageToken 
    };
  } catch (error) {
    console.error('Error listing Drive folders:', error);
    return { folders: [] };
  }
};

export const createDriveFolder = async (
  name: string,
  parentId?: string
): Promise<{ id: string; name: string } | null> => {
  try {
    const response = await fetch('/api/drive/folders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, parentId }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.folder;
  } catch (error) {
    console.error('Error creating Drive folder:', error);
    return null;
  }
};

export const getOrCreateDriveFolder = async (
  name: string,
  parentId?: string
): Promise<{ id: string; name: string } | null> => {
  try {
    const result = await listDriveFolders({ parentId: parentId || 'root' });
    const existingFolder = result.folders.find(folder => folder.name === name);
    if (existingFolder) return existingFolder;

    return await createDriveFolder(name, parentId);
  } catch (error) {
    console.error('Error getting or creating Drive folder:', error);
    return null;
  }
};

export const listDriveFiles = async (folderId: string): Promise<any[]> => {
  try {
    const response = await fetch(`/api/drive/files?folderId=${folderId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Error listing Drive files:', error);
    return [];
  }
};

export const getDriveFileContent = async (fileId: string): Promise<{ dataUrl: string; name: string; mimeType: string } | null> => {
  try {
    const response = await fetch(`/api/drive/file/${fileId}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error getting Drive file content:', error);
    throw error;
  }
};

export const connectGoogleDrive = async (): Promise<void> => {
  try {
    const response = await fetch('/api/auth/google/url');
    const { url } = await response.json();
    
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const authWindow = window.open(
      url,
      'google_oauth_popup',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!authWindow) {
      alert('彈出視窗被封鎖，請允許此網站顯示彈出視窗。');
    }
  } catch (error) {
    console.error('Error getting Google OAuth URL:', error);
  }
};

export const disconnectGoogleDrive = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/logout', { method: 'POST' });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error disconnecting Google Drive:', error);
    return false;
  }
};
