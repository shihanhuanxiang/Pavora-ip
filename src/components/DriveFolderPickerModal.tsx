import React, { useState, useEffect } from 'react';
import { listDriveFolders, createDriveFolder, listDriveFiles } from '../shared/services/googleDriveService';
import Button from '../shared/components/common/Button';
import { motion, AnimatePresence } from 'motion/react';

interface DriveFolderPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (folderId: string, folderName: string) => void;
  initialFolderId?: string;
}

const DriveFolderPickerModal: React.FC<DriveFolderPickerModalProps> = ({ isOpen, onClose, onSelect, initialFolderId }) => {
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [path, setPath] = useState<{ id: string; name: string }[]>([{ id: 'root', name: '我的雲端硬碟' }]);
  const [showCreate, setShowCreate] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const [currentFiles, setCurrentFiles] = useState<any[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);

  const currentFolder = path[path.length - 1];

  const fetchFolders = async (reset = true, token?: string) => {
    setLoading(true);
    try {
      const result = await listDriveFolders({
        parentId: searchQuery ? undefined : currentFolder.id,
        search: searchQuery || undefined,
        pageToken: token
      });
      
      if (reset) {
        setFolders(result.folders);
      } else {
        setFolders(prev => [...prev, ...result.folders]);
      }
      setNextPageToken(result.nextPageToken);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    if (currentFolder.id === 'root') {
      setCurrentFiles([]);
      return;
    }
    setFilesLoading(true);
    try {
      const result = await listDriveFiles(currentFolder.id);
      setCurrentFiles(result);
    } catch (err) {
      console.error(err);
    } finally {
      setFilesLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFolders();
      fetchFiles();
    }
  }, [isOpen, path, searchQuery]);

  const handleNavigate = (id: string, name: string) => {
    setSearchQuery('');
    setPath(prev => [...prev, { id, name }]);
  };

  const handleBack = (index: number) => {
    setSearchQuery('');
    setPath(prev => prev.slice(0, index + 1));
  };

  const handleCreate = async () => {
    if (!newFolderName.trim()) return;
    setCreating(true);
    try {
      const folder = await createDriveFolder(newFolderName.trim());
      if (folder) {
        setNewFolderName('');
        setShowCreate(false);
        fetchFolders();
      }
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-bg-main)]">
          <div>
            <h3 className="text-xl font-display font-bold uppercase tracking-widest text-[var(--color-text-main)]">選擇雲端資料夾</h3>
            <p className="text-[10px] text-[var(--color-gold)] uppercase tracking-widest mt-1">Select Google Drive Folder</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Path / Breadcrumbs */}
        <div className="px-6 py-3 bg-[var(--color-bg-surface)] border-b border-[var(--color-border)] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {path.map((p, i) => (
            <React.Fragment key={p.id}>
              {i > 0 && <span className="text-gray-600 text-xs">/</span>}
              <button 
                onClick={() => handleBack(i)}
                className={`text-[10px] uppercase tracking-widest font-bold whitespace-nowrap ${i === path.length - 1 ? 'text-[var(--color-gold)]' : 'text-gray-400 hover:text-white'}`}
              >
                {p.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="p-4 flex gap-3 border-b border-[var(--color-border)]">
          <div className="relative flex-grow">
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜尋資料夾名稱..."
              className="w-full bg-[var(--color-bg-main)] border border-[var(--color-border)] rounded-full px-10 py-2.5 text-sm outline-none focus:border-[var(--color-gold)] transition-all"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <Button 
            onClick={() => setShowCreate(!showCreate)}
            variant="secondary"
            className="whitespace-nowrap text-xs px-6"
          >
            {showCreate ? '取消' : '+ 新增'}
          </Button>
        </div>

        {/* Create Folder Form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 py-4 bg-[var(--color-bg-main)] border-b border-[var(--color-border)] overflow-hidden"
            >
              <div className="flex gap-3">
                <input 
                  type="text"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="輸入新資料夾名稱..."
                  className="flex-grow bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm outline-none focus:border-[var(--color-gold)]"
                />
                <Button onClick={handleCreate} isLoading={creating} disabled={!newFolderName.trim()}>建立資料夾</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Folder List & File Preview */}
        <div className="flex-grow overflow-hidden flex flex-col md:flex-row min-h-[400px]">
          {/* Left: Folders */}
          <div className="flex-grow overflow-y-auto p-4 space-y-1 custom-scrollbar border-r border-[var(--color-border)] md:w-1/2">
            <h4 className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-4 px-2">子資料夾</h4>
            {loading && folders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                <div className="w-6 h-6 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-[8px] uppercase tracking-[0.2em]">讀取中...</p>
              </div>
            ) : folders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                <p className="text-[8px] uppercase tracking-[0.2em]">無子資料夾</p>
              </div>
            ) : (
              <>
                {folders.map(folder => (
                  <div 
                    key={folder.id}
                    className="group flex items-center justify-between p-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer"
                    onClick={() => handleNavigate(folder.id, folder.name)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[var(--color-gold)]">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                      </div>
                      <span className="text-xs font-medium text-white group-hover:text-[var(--color-gold)] transition-colors truncate max-w-[150px]">{folder.name}</span>
                    </div>
                    <svg className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </div>
                ))}
                
                {nextPageToken && (
                  <div className="pt-4 flex justify-center">
                    <Button 
                      variant="ghost" 
                      onClick={() => fetchFolders(false, nextPageToken)}
                      isLoading={loading}
                      className="text-[8px] px-4"
                    >
                      載入更多
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right: File Preview */}
          <div className="flex-grow overflow-y-auto p-4 bg-black/20 custom-scrollbar md:w-1/2">
            <h4 className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-4 px-2">檔案預覽 ({currentFolder.name})</h4>
            {filesLoading ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                <div className="w-6 h-6 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-[8px] uppercase tracking-[0.2em]">讀取檔案中...</p>
              </div>
            ) : currentFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-500 text-center">
                <svg className="w-8 h-8 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="text-[8px] uppercase tracking-[0.2em]">此資料夾中沒有圖片或影片</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {currentFiles.slice(0, 12).map(file => (
                  <div 
                    key={file.id} 
                    className="aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10 cursor-pointer hover:border-[var(--color-gold)] transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(currentFolder.id, currentFolder.name);
                    }}
                  >
                    {file.thumbnailLink ? (
                      <img 
                        src={file.thumbnailLink.replace('=s220', '=s150')} 
                        alt={file.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" /></svg>
                      </div>
                    )}
                  </div>
                ))}
                {currentFiles.length > 12 && (
                  <div className="aspect-square rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <span className="text-[10px] text-gray-500 font-bold">+{currentFiles.length - 12}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[var(--color-bg-main)] border-t border-[var(--color-border)] flex justify-between items-center">
          <p className="text-[9px] text-gray-500 uppercase tracking-widest">
            {folders.length} 個資料夾已載入
          </p>
          <div className="flex gap-3">
            <Button 
              variant="primary" 
              disabled={currentFolder.id === 'root'}
              onClick={() => onSelect(currentFolder.id, currentFolder.name)}
              className="text-[10px] px-6"
            >
              選擇當前目錄 ({currentFolder.name})
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DriveFolderPickerModal;
