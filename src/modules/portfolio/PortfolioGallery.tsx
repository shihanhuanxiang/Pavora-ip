
import React, { useState, useEffect } from 'react';
import { getPortfolioItems, deletePortfolioItems, syncAllToGoogleDrive, getDriveSettings, saveDriveSettings, savePortfolioItem } from '../../shared/services/storageService';
import { checkGoogleDriveStatus, connectGoogleDrive, disconnectGoogleDrive, listDriveFolders, listDriveFiles, getDriveFileContent, createDriveFolder } from '../../shared/services/googleDriveService';
import type { PortfolioItem } from '../../shared/types/types';
import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
import ImagePreviewModal from '../../shared/components/common/ImagePreviewModal';
import DriveFolderPickerModal from '../../components/DriveFolderPickerModal';
import DriveFilePickerModal from '../../components/DriveFilePickerModal';
import AsyncImage from '../../shared/components/common/AsyncImage';
import { useNotification } from '../../shared/context/NotificationContext';

interface PortfolioGalleryProps {
  onGoHome: () => void;
  onAdvancedEdit: (imageUrl: string, destination: string) => void;
}

const PortfolioGallery: React.FC<PortfolioGalleryProps> = ({ onGoHome, onAdvancedEdit }) => {
  const { addNotification, addTask, updateTask } = useNotification();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [previewingImage, setPreviewingImage] = useState<{images: string[], startIndex: number} | null>(null);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isFoldersLoading, setIsFoldersLoading] = useState(false);
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [selectedFolderName, setSelectedFolderName] = useState<string>('');
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);

  useEffect(() => {
    setItems(getPortfolioItems());
    checkDrive();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        checkDrive();
        addNotification({
          type: 'success',
          message: 'Google Drive 已連接',
          description: '您現在可以同步作品至雲端。'
        });
      } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
        addNotification({
          type: 'error',
          message: '連接失敗',
          description: event.data.error === 'auth_failed' ? '授權失敗，請重試。' : `錯誤: ${event.data.error}`
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addNotification]);

  const checkDrive = async () => {
    const status = await checkGoogleDriveStatus();
    setIsDriveConnected(status);
    if (status) {
      setIsFoldersLoading(true);
      try {
        const result = await listDriveFolders();
        setFolders(result.folders);
        const settings = getDriveSettings();
        if (settings.portfolioFolderId) {
          setSelectedFolderId(settings.portfolioFolderId);
        }
      } finally {
        setIsFoldersLoading(false);
      }
    }
  };

  const handleFolderSelect = (id: string, name: string) => {
    setSelectedFolderId(id);
    setSelectedFolderName(name);
    const settings = getDriveSettings();
    saveDriveSettings({ ...settings, portfolioFolderId: id });
    setShowFolderPicker(false);
    // Automatically open file picker after folder selection
    setTimeout(() => setShowFilePicker(true), 300);
  };

  const handleImportFromDrive = async (selectedFiles?: any[]) => {
    if (!selectedFolderId) return;
    
    // If no files provided, show the picker
    if (!selectedFiles) {
      setShowFilePicker(true);
      return;
    }

    setShowFilePicker(false);
    setIsImporting(true);
    const taskId = addTask({ name: "從 Google Drive 匯入作品" });
    
    try {
      const driveFiles = selectedFiles;
      console.log('Starting import for files:', driveFiles);
      const existingItems = getPortfolioItems();
      const existingDriveIds = new Set(existingItems.filter(i => i.driveFileId).map(i => i.driveFileId));
      
      let importCount = 0;
      for (let i = 0; i < driveFiles.length; i++) {
        const file = driveFiles[i];
        console.log(`Processing file ${i+1}/${driveFiles.length}:`, file.name);
        updateTask(taskId, { progress: Math.round((i / driveFiles.length) * 100), status: 'processing' });
        
        // Skip if already imported by driveFileId
        if (existingDriveIds.has(file.id)) {
          console.log(`File ${file.name} already imported, skipping.`);
          continue;
        }
        
        const content = await getDriveFileContent(file.id);
        if (content) {
          await savePortfolioItem({
            imageUrl: content.dataUrl,
            sourceModule: 'CloudImport',
            driveFileId: file.id
          });
          importCount++;
        } else {
          console.error(`Failed to get content for file: ${file.name}`);
        }
      }
      
      // Refresh items from storage after all imports
      const updatedItems = getPortfolioItems();
      setItems(updatedItems);
      
      updateTask(taskId, { status: 'completed', progress: 100 });
      if (importCount > 0) {
        setItems(getPortfolioItems());
        addNotification({
          type: 'success',
          message: '匯入完成',
          description: `成功從雲端匯入 ${importCount} 件作品。`
        });
      } else {
        addNotification({
          type: 'info',
          message: '匯入完成',
          description: '雲端資料夾中沒有新的作品。'
        });
      }
    } catch (e: any) {
      console.error('Import error details:', e);
      updateTask(taskId, { status: 'failed', error: e.message || '匯入失敗' });
      addNotification({
        type: 'error',
        message: '匯入失敗',
        description: `錯誤詳情: ${e.message || '未知錯誤'}。請檢查雲端權限或儲存空間。`
      });
    } finally {
      setIsImporting(false);
    }
  };

  const toggleSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) newSet.delete(itemId);
      else newSet.add(itemId);
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
        setSelectedItems(new Set());
    } else {
        setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const handleDelete = async () => {
    if (selectedItems.size > 0) {
      await deletePortfolioItems(Array.from(selectedItems));
      setItems(getPortfolioItems());
      setSelectedItems(new Set());
    }
  };
  
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    setPreviewingImage({images: items.map(i => i.imageUrl), startIndex: index});
  };

  const handleSyncAll = async () => {
    if (!isDriveConnected) {
        connectGoogleDrive();
        return;
    }

    setIsSyncing(true);
    const taskId = addTask({ name: "同步作品集至 Google Drive" });
    
    try {
        await syncAllToGoogleDrive((current, total) => {
            updateTask(taskId, { progress: Math.round((current / total) * 100), status: 'processing' });
        });
        updateTask(taskId, { status: 'completed', progress: 100 });
        addNotification({
            type: 'success',
            message: '同步完成',
            description: '所有作品已成功備份至 Google Drive。'
        });
    } catch (e) {
        updateTask(taskId, { status: 'failed', error: '同步失敗' });
        addNotification({
            type: 'error',
            message: '同步失敗',
            description: '請檢查網路連線或重新登入 Google 帳號。'
        });
    } finally {
        setIsSyncing(false);
    }
  };

  const handleToggleDrive = async () => {
    if (isDriveConnected) {
        const success = await disconnectGoogleDrive();
        if (success) {
            setIsDriveConnected(false);
            setFolders([]);
            setSelectedFolderId('');
            addNotification({ type: 'info', message: '已斷開 Google Drive 連接' });
        }
    } else {
        connectGoogleDrive();
    }
  };


    return (
        <div className="min-h-screen bg-[var(--color-bg-deep)] text-[var(--color-text-main)] font-sans pb-20">
            {previewingImage && (
                <ImagePreviewModal 
                    {...previewingImage} 
                    onClose={() => setPreviewingImage(null)}
                    actions={
                        <Button onClick={() => onAdvancedEdit(items[previewingImage.startIndex].imageUrl, 'portfolio_optimization')} variant="primary" className="text-[10px] font-bold tracking-widest">
                            進入作品優化 &rarr;
                        </Button>
                    }
                />
            )}

            {/* Header */}
            <div className="sticky top-[80px] z-30 glass-panel border-x-0 border-t-0 px-6 py-4 mb-8">
                <div className="max-w-[110rem] mx-auto flex justify-between items-center">
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-display font-bold uppercase tracking-[0.3em] text-[var(--color-text-main)]">作品集錦</h2>
                        <span className="text-[9px] uppercase tracking-[0.5em] text-[var(--color-gold)] font-light">Portfolio Gallery</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {isDriveConnected && (
                          <div className="flex items-center gap-2">
                            <div 
                              onClick={() => setShowFolderPicker(true)}
                              className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:border-[var(--color-gold)] text-[9px] uppercase tracking-widest font-bold rounded-full px-6 py-2 outline-none cursor-pointer transition-all flex items-center gap-3 group"
                            >
                              <svg className="w-3 h-3 text-[var(--color-gold)]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                              <span className="truncate max-w-[120px]">
                                {selectedFolderId ? (folders.find(f => f.id === selectedFolderId)?.name || selectedFolderName || '已選擇資料夾') : '選擇資料夾'}
                              </span>
                            </div>
                            <Button 
                              onClick={handleImportFromDrive}
                              disabled={!selectedFolderId || isImporting}
                              isLoading={isImporting}
                              variant="secondary"
                              className="text-[10px] font-bold tracking-widest"
                            >
                              從雲端匯入
                            </Button>
                            <button onClick={checkDrive} className="p-2 text-gray-500 hover:text-[var(--color-gold)]" title="重新整理">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </button>
                            <button onClick={handleToggleDrive} className="p-2 text-gray-500 hover:text-red-400 transition-colors" title="斷開連結">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                            <div className={`w-2 h-2 rounded-full ${isDriveConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-[9px] uppercase tracking-widest font-bold text-[var(--color-text-dim)]">
                                {isDriveConnected ? 'Google Drive 已連接' : 'Google Drive 未連接'}
                            </span>
                        </div>
                        <Button 
                            onClick={handleSyncAll} 
                            disabled={isSyncing || (isDriveConnected && items.length === 0)}
                            variant="secondary" 
                            className="text-[10px] font-bold tracking-widest border-[var(--color-gold)]/30 text-[var(--color-gold)]"
                        >
                            {isSyncing ? '同步中...' : (isDriveConnected ? '立即同步雲端' : '連接 Google Drive')}
                        </Button>
                        {onGoHome && <Button onClick={onGoHome} variant="secondary" className="text-[10px] font-bold tracking-widest">返回首頁</Button>}
                    </div>
                </div>
            </div>

            <main className="max-w-[110rem] mx-auto px-6 lg:px-12">
                {/* Toolbar */}
                <div className="glass-panel rounded-2xl p-4 mb-10 flex flex-wrap justify-between items-center gap-4 border border-[var(--color-border)]">
                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative w-5 h-5 border border-[var(--color-border)] rounded flex items-center justify-center transition-all group-hover:border-[var(--color-gold)]">
                                <input 
                                    type="checkbox" 
                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                    checked={items.length > 0 && selectedItems.size === items.length} 
                                    onChange={handleSelectAll} 
                                />
                                {items.length > 0 && selectedItems.size === items.length && (
                                    <div className="w-2.5 h-2.5 bg-[var(--color-gold)] rounded-sm"></div>
                                )}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-dim)] group-hover:text-[var(--color-text-main)] transition-colors">全選</span>
                        </label>
                        
                        <div className="h-4 w-px bg-[var(--color-border)]"></div>
                        
                        <span className="text-[10px] font-mono tracking-widest text-[var(--color-gold)]">
                            {selectedItems.size} / {items.length} 已選擇
                        </span>
                    </div>

                    <div className="flex gap-4">
                        <Button 
                            onClick={handleDelete} 
                            disabled={selectedItems.size === 0} 
                            variant="secondary" 
                            className="text-[10px] font-bold tracking-widest bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20 disabled:opacity-30"
                        >
                            刪除已選
                        </Button>
                    </div>
                </div>

                {items.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                        {items.map((item, index) => (
                            <div 
                                key={item.id} 
                                className="group relative glass-panel rounded-2xl overflow-hidden border border-[var(--color-border)] transition-all duration-700 hover:-translate-y-2 hover:border-[var(--color-gold)] hover:shadow-2xl"
                                onContextMenu={e => handleContextMenu(e, index)}
                            >
                                {/* Selection Checkbox */}
                                <div className="absolute top-4 left-4 z-20">
                                    <label className="cursor-pointer">
                                        <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${selectedItems.has(item.id) ? 'bg-[var(--color-gold)] border-[var(--color-gold)]' : 'bg-black/40 border-white/20 hover:border-white/40'}`}>
                                            <input
                                                type="checkbox"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                checked={selectedItems.has(item.id)}
                                                onChange={() => toggleSelection(item.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            {selectedItems.has(item.id) && (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="black" className="w-3.5 h-3.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                                </svg>
                                            )}
                                        </div>
                                    </label>
                                </div>

                                {/* Image */}
                                <div className="aspect-[3/4] overflow-hidden bg-[var(--color-bg-surface)]">
                                    <AsyncImage 
                                        src={item.imageUrl} 
                                        alt={item.sourceModule} 
                                        className="w-full h-full object-cover object-top transition-transform duration-1000 group-hover:scale-110" 
                                    />
                                </div>

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-8 gap-6 z-10">
                                    <div className="text-center space-y-2">
                                        <span className="text-[9px] uppercase tracking-[0.4em] text-[var(--color-gold)] font-bold">Source Module</span>
                                        <h4 className="text-sm font-display font-bold uppercase tracking-widest text-[var(--color-text-title)]">{item.sourceModule}</h4>
                                    </div>
                                    
                                    <div className="flex flex-col w-full gap-3">
                                        <Button 
                                            onClick={(e) => { e.stopPropagation(); onAdvancedEdit(item.imageUrl, 'portfolio_optimization')}}
                                            variant="primary"
                                            className="w-full text-[10px] font-bold tracking-widest"
                                        >
                                            作品優化 &rarr;
                                        </Button>
                                        <Button 
                                            onClick={() => setPreviewingImage({images: items.map(i => i.imageUrl), startIndex: index})}
                                            variant="secondary"
                                            className="w-full text-[10px] font-bold tracking-widest"
                                        >
                                            全螢幕預覽
                                        </Button>
                                    </div>
                                    
                                    <div className="mt-auto text-[9px] font-mono text-[var(--color-text-dim)] tracking-tighter">
                                        {new Date(item.createdAt).toLocaleDateString()} // {new Date(item.createdAt).toLocaleTimeString()}
                                    </div>
                                </div>
                                
                                {/* Info Strip */}
                                <div className="p-4 bg-[var(--color-bg-surface)] border-t border-[var(--color-border)] flex justify-between items-center">
                                    <span className="text-[9px] font-mono text-[var(--color-text-dim)] uppercase tracking-widest">{item.sourceModule}</span>
                                    <div className="w-1 h-1 rounded-full bg-[var(--color-gold)] opacity-50"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="glass-panel rounded-3xl p-20 flex flex-col items-center justify-center text-center border border-[var(--color-border)]">
                        <div className="w-24 h-24 rounded-full bg-[var(--color-bg-surface)] flex items-center justify-center mb-8 animate-pulse">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 text-[var(--color-text-dim)]">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-display font-bold uppercase tracking-[0.3em] text-[var(--color-text-main)] mb-4">您的作品集是空的</h3>
                        <p className="text-sm text-[var(--color-text-dim)] max-w-md leading-relaxed">從任何創意模組導出或儲存的作品都會顯示在此。開始您的時尚創作之旅吧。</p>
                        <Button onClick={onGoHome} variant="primary" className="mt-10 text-[10px] font-bold tracking-widest">開始創作</Button>
                    </div>
                )}
            </main>
            {/* Drive Folder Picker Modal */}
            <DriveFolderPickerModal 
                isOpen={showFolderPicker}
                onClose={() => setShowFolderPicker(false)}
                onSelect={handleFolderSelect}
                initialFolderId={selectedFolderId}
            />

            {/* Drive File Picker Modal */}
            <DriveFilePickerModal 
                isOpen={showFilePicker}
                onClose={() => setShowFilePicker(false)}
                onConfirm={(files) => handleImportFromDrive(files)}
                folderId={selectedFolderId}
                folderName={selectedFolderName}
            />
        </div>
    );

};

export default PortfolioGallery;
