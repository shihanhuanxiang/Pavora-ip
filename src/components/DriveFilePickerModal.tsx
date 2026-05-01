import React, { useState, useEffect } from 'react';
import { listDriveFiles } from '../shared/services/googleDriveService';
import Button from '../shared/components/common/Button';
import { motion } from 'motion/react';

interface DriveFilePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedFiles: any[]) => void;
  folderId: string;
  folderName: string;
}

const DriveFilePickerModal: React.FC<DriveFilePickerModalProps> = ({ isOpen, onClose, onConfirm, folderId, folderName }) => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen && folderId) {
      fetchFiles();
    }
  }, [isOpen, folderId]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const result = await listDriveFiles(folderId);
      setFiles(result);
      // Default to select all
      setSelectedIds(new Set(result.map((f: any) => f.id)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFile = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === files.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(files.map(f => f.id)));
    }
  };

  const handleConfirm = () => {
    const selectedFiles = files.filter(f => selectedIds.has(f.id));
    onConfirm(selectedFiles);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-bg-main)]">
          <div>
            <h3 className="text-xl font-display font-bold uppercase tracking-widest text-[var(--color-text-main)]">選擇要匯入的檔案</h3>
            <p className="text-[10px] text-[var(--color-gold)] uppercase tracking-widest mt-1">Select Files from: {folderName}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 bg-[var(--color-bg-surface)] border-b border-[var(--color-border)] flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSelectAll}
              className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-gold)] hover:underline"
            >
              {selectedIds.size === files.length ? '取消全選' : '全選所有檔案'}
            </button>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest">
              已選擇 {selectedIds.size} / {files.length} 個檔案
            </span>
          </div>
        </div>

        {/* File Grid */}
        <div className="flex-grow overflow-y-auto p-6 custom-scrollbar min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-20">
              <div className="w-8 h-8 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500">讀取檔案中...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-gray-500">
              <p className="text-[10px] uppercase tracking-widest">此資料夾中沒有可匯入的圖片或影片</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {files.map(file => (
                <div 
                  key={file.id}
                  onClick={() => toggleFile(file.id)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all group ${selectedIds.has(file.id) ? 'border-[var(--color-gold)]' : 'border-transparent hover:border-white/20'}`}
                >
                  {file.thumbnailLink ? (
                    <img 
                      src={file.thumbnailLink.replace('=s220', '=s400')} 
                      alt={file.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      {file.mimeType.includes('video') ? (
                        <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                      ) : (
                        <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" /></svg>
                      )}
                    </div>
                  )}
                  
                  {/* Selection Overlay */}
                  <div className={`absolute inset-0 bg-black/40 flex flex-col items-center justify-center transition-opacity ${selectedIds.has(file.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <div className="flex flex-col gap-3 items-center">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${selectedIds.has(file.id) ? 'bg-[var(--color-gold)] border-[var(--color-gold)] scale-110' : 'bg-black/40 border-white hover:scale-110'}`}>
                        {selectedIds.has(file.id) ? (
                          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <span className="text-[8px] text-white font-bold uppercase">選取</span>
                        )}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewFile(file);
                        }}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md transition-all border border-white/20"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        <span className="text-[10px] text-white font-bold uppercase tracking-widest">放大預覽</span>
                      </button>
                    </div>
                  </div>

                  {/* Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-[8px] text-white truncate font-medium">{file.name}</p>
                    {file.mimeType.includes('video') && (
                      <span className="text-[7px] text-[var(--color-gold)] uppercase font-bold">Video</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-[var(--color-bg-main)] border-t border-[var(--color-border)] flex justify-end gap-4">
          <Button variant="secondary" onClick={onClose} className="text-[10px] px-8">取消</Button>
          <Button 
            variant="primary" 
            onClick={handleConfirm} 
            disabled={selectedIds.size === 0}
            className="text-[10px] px-10"
          >
            確認匯入 ({selectedIds.size})
          </Button>
        </div>

        {/* Full Screen Preview Modal */}
        {previewFile && (
          <div className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-4" onClick={() => setPreviewFile(null)}>
            <div className="relative max-w-5xl max-h-full" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => setPreviewFile(null)}
                className="absolute -top-12 right-0 text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              {previewFile.thumbnailLink ? (
                <img 
                  src={previewFile.thumbnailLink.replace('=s220', '=s1280')} 
                  alt={previewFile.name}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-[600px] h-[400px] bg-white/5 rounded-2xl flex flex-col items-center justify-center gap-4">
                  <svg className="w-20 h-20 text-gray-700" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" /></svg>
                  <p className="text-gray-500 font-display uppercase tracking-widest text-xs">預覽不可用</p>
                </div>
              )}
              <div className="mt-6 text-center">
                <h4 className="text-white font-display uppercase tracking-[0.2em] text-sm mb-2">{previewFile.name}</h4>
                <p className="text-[var(--color-gold)] text-[10px] uppercase tracking-widest">{previewFile.mimeType}</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default DriveFilePickerModal;
