import React, { useState, useEffect, useRef } from 'react';
import { getApparel, deleteApparel, saveApparel, savePortfolioItem, updateApparel, syncAllApparelToGoogleDrive } from '../../shared/services/storageService';
import type { StoredApparelItem, ApparelMainCategory } from '../../shared/types/types';
import { fileToBase64, getFriendlyErrorMessage, generateImageAsset, analyzeApparelItem, imageUrlToimageData } from '../../shared/services/geminiService';
import { checkGoogleDriveStatus, listDriveFolders, listDriveFiles, getDriveFileContent, connectGoogleDrive, disconnectGoogleDrive, createDriveFolder } from '../../shared/services/googleDriveService';
import { getDriveSettings, saveDriveSettings } from '../../shared/services/storageService';
import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
import ImagePreviewModal from '../../shared/components/common/ImagePreviewModal';
import DriveFolderPickerModal from '../../components/DriveFolderPickerModal';
import DriveFilePickerModal from '../../components/DriveFilePickerModal';
import SparklesIcon from '../../shared/assets/icons/SparklesIcon';
import { useTaxonomy } from '../../shared/hooks/useTaxonomy';
import AsyncImage from '../../shared/components/common/AsyncImage';

interface PersonalWardrobeProps {
  onGoHome?: () => void;
  apparelStructure?: ApparelMainCategory[];
}

const PersonalWardrobe: React.FC<PersonalWardrobeProps> = ({ onGoHome, apparelStructure: propStructure }) => {
  // Phase 3: Self-Sufficiency Logic
  const { apparelStructure: hookStructure, loading: taxonomyLoading } = useTaxonomy();
  const apparelStructure = propStructure || hookStructure;
  const isDataReady = propStructure || (!taxonomyLoading && apparelStructure.length > 0);

  const [items, setItems] = useState<StoredApparelItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewingImage, setPreviewingImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadCategory, setUploadCategory] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [generatedAsset, setGeneratedAsset] = useState<{ url: string; prompt: string } | null>(null);

  // Editing state
  const [editingItem, setEditingItem] = useState<StoredApparelItem | null>(null);
  const [newTag, setNewTag] = useState('');

  // New state for smart features
  const [enableAutoTagging, setEnableAutoTagging] = useState(true);

  // Drive states
  const [isConnected, setIsConnected] = useState(false);
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [selectedFolderName, setSelectedFolderName] = useState<string>('');
  const [isFoldersLoading, setIsFoldersLoading] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<any[]>([]);

  useEffect(() => {
    setItems(getApparel());
    checkDrive();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        checkDrive();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkDrive = async () => {
    const status = await checkGoogleDriveStatus();
    setIsConnected(status);
    if (status) {
      setIsFoldersLoading(true);
      try {
        const result = await listDriveFolders();
        setFolders(result.folders);
        const settings = getDriveSettings();
        if (settings.wardrobeFolderId) {
          setSelectedFolderId(settings.wardrobeFolderId);
        }
      } finally {
        setIsFoldersLoading(false);
      }
    }
  };

  const handleConnectDrive = async () => {
    await connectGoogleDrive();
  };

  const handleDisconnectDrive = async () => {
    const success = await disconnectGoogleDrive();
    if (success) {
      setIsConnected(false);
      setFolders([]);
      setSelectedFolderId('');
    }
  };

  const handleFolderSelect = (id: string, name: string) => {
    setSelectedFolderId(id);
    setSelectedFolderName(name);
    const settings = getDriveSettings();
    saveDriveSettings({ ...settings, wardrobeFolderId: id });
    setShowFolderPicker(false);
  };

  const handleSyncFromDrive = async (selectedFiles?: any[]) => {
    if (!selectedFolderId) return;
    
    // If no files provided, show the picker
    if (!selectedFiles) {
      setShowFilePicker(true);
      return;
    }

    setShowFilePicker(false);
    setIsSyncing(true);
    setError(null);
    try {
      const driveFiles = selectedFiles;
      const existingItems = getApparel();
      const existingDriveIds = new Set(existingItems.map(i => i.id.replace('drive-', '')));
      
      let syncCount = 0;
      for (const file of driveFiles) {
        if (existingDriveIds.has(file.id)) continue;

        const content = await getDriveFileContent(file.id);
        if (content) {
          const newItem: StoredApparelItem = {
            id: `drive-${file.id}`,
            name: content.name,
            category: 'unknown',
            imageUrl: content.dataUrl,
          };
          
          if (enableAutoTagging) {
            try {
              const result = await analyzeApparelItem(content.dataUrl);
              newItem.category = result.category;
              newItem.tags = result.tags;
              newItem.analysis = {
                color: result.color,
                material: result.material,
                occasion: result.occasion,
                season: result.season,
              };
            } catch (e) {
              console.warn("Auto-tagging failed for drive item", e);
            }
          }
          
          await saveApparel(newItem);
          syncCount++;
        }
      }
      
      if (syncCount > 0) {
        setItems(getApparel());
        alert(`成功從雲端同步 ${syncCount} 件服飾！`);
      } else {
        alert("雲端資料夾中沒有新的服飾。");
      }
    } catch (err) {
      console.error("Sync error:", err);
      setError("同步失敗，請檢查網路連線或雲端權限。");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportToDrive = async () => {
    if (!isConnected) {
        handleConnectDrive();
        return;
    }
    
    setIsSyncing(true);
    setError(null);
    try {
        await syncAllApparelToGoogleDrive((current, total) => {
            // Optional: update progress UI if needed
        });
        alert("所有服飾已成功匯出至 Google Drive！");
    } catch (err) {
        console.error("Export error:", err);
        setError("匯出失敗，請檢查網路連線或雲端權限。");
    } finally {
        setIsSyncing(false);
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
    if (selectedItems.size === filteredItems.length) {
        setSelectedItems(new Set());
    } else {
        setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  const handleDelete = () => {
    if (selectedItems.size > 0) {
      deleteApparel(Array.from(selectedItems));
      setItems(getApparel());
      setSelectedItems(new Set());
    }
  };

  const handleUploadClick = () => {
      if (!uploadCategory && !enableAutoTagging) {
          alert("請先選擇要上傳的服裝類別");
          return;
      }
      fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0]) {
          const file = event.target.files[0];
          setIsLoading(true);
          setError(null);
          try {
              const { data, mimeType } = await fileToBase64(file);
              const baseCategory = uploadCategory || 'unknown';
              
              let analysisData = undefined;
              let aiTags: string[] = [];

              if (enableAutoTagging) {
                  try {
                      const result = await analyzeApparelItem({ data, mimeType });
                      analysisData = {
                          color: result.color,
                          material: result.material,
                          occasion: result.occasion,
                          season: result.season,
                      };
                      aiTags = result.tags;
                  } catch (e) {
                      console.warn("Auto-tagging failed, continuing with basic upload.", e);
                  }
              }

              const newItem: StoredApparelItem = {
                  id: `apparel-${Date.now()}`,
                  name: file.name,
                  category: baseCategory,
                  imageUrl: `data:${mimeType};base64,${data}`,
                  analysis: analysisData,
                  tags: aiTags,
              };
              saveApparel(newItem);
              setItems(getApparel()); // Refresh list
          } catch(err) {
              setError(getFriendlyErrorMessage(err));
          } finally {
              setIsLoading(false);
          }
      }
  };

  const handleGenerateAsset = async () => {
    if (!generationPrompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
        const url = await generateImageAsset(generationPrompt, '1:1');
        setGeneratedAsset({ url, prompt: generationPrompt });
    } catch(err) {
        setError(getFriendlyErrorMessage(err));
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSaveGeneratedAsset = () => {
    if (!generatedAsset) return;
    const newItem: StoredApparelItem = {
      id: `apparel-${Date.now()}`,
      name: generatedAsset.prompt.substring(0, 20),
      category: 'accessories', // Default category for generated assets
      imageUrl: generatedAsset.url,
    };
    saveApparel(newItem);
    savePortfolioItem({ imageUrl: generatedAsset.url, sourceModule: 'PersonalWardrobe' });
    setItems(getApparel());
    setGeneratedAsset(null);
    setGenerationPrompt('');
    alert('已成功儲存至個人衣櫥與作品集！');
  };

  const handleUpdateItem = () => {
    if (editingItem) {
      updateApparel(editingItem);
      setItems(getApparel());
      setEditingItem(null);
    }
  };

  const handleAiAnalyzeItem = async (item: StoredApparelItem) => {
    setIsLoading(true);
    setError(null);
    try {
        const imageData = await imageUrlToimageData(item.imageUrl);
        const result = await analyzeApparelItem(imageData);
        setEditingItem({
            ...item,
            category: result.category !== 'unknown' ? result.category : item.category,
            tags: Array.from(new Set([...(item.tags || []), ...result.tags])),
            analysis: {
                color: result.color,
                material: result.material,
                occasion: result.occasion,
                season: result.season,
            }
        });
    } catch (e) {
        setError(getFriendlyErrorMessage(e));
    } finally {
        setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && editingItem) {
        setEditingItem({
            ...editingItem,
            tags: Array.from(new Set([...(editingItem.tags || []), newTag.trim()]))
        });
        setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (editingItem) {
        setEditingItem({
            ...editingItem,
            tags: editingItem.tags?.filter(t => t !== tagToRemove)
        });
    }
  };

  const filteredItems = items.filter(item => {
      const matchesCategory = filter === 'all' || item.category === filter;
      if (!matchesCategory) return false;
      
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      const matchesName = item.name.toLowerCase().includes(query);
      const matchesTags = item.tags?.some(tag => tag.toLowerCase().includes(query));
      const matchesAnalysis = item.analysis && (
          item.analysis.color.toLowerCase().includes(query) ||
          item.analysis.material.toLowerCase().includes(query) ||
          item.analysis.occasion.toLowerCase().includes(query)
      );
      
      return matchesName || matchesTags || matchesAnalysis;
  });

  return (
    <div className="container mx-auto p-8 max-w-7xl animate-fade-in">
        {previewingImage && <ImagePreviewModal images={[previewingImage]} startIndex={0} onClose={() => setPreviewingImage(null)} />}
        
        {/* Edit Item Modal */}
        {editingItem && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
                <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-[var(--color-text-title)]">編輯服飾資訊</h3>
                        <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="aspect-square bg-white/5 rounded-lg overflow-hidden border border-gray-700">
                                <AsyncImage src={editingItem.imageUrl} className="w-full h-full object-contain" />
                            </div>
                            <Button 
                                onClick={() => handleAiAnalyzeItem(editingItem)} 
                                isLoading={isLoading} 
                                variant="secondary" 
                                className="w-full text-xs"
                            >
                                <SparklesIcon className="w-4 h-4 mr-2" />
                                AI 重新分析標籤
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">名稱</label>
                                <input 
                                    type="text" 
                                    value={editingItem.name} 
                                    onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                                    className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">分類</label>
                                <select 
                                    value={editingItem.category} 
                                    onChange={e => setEditingItem({...editingItem, category: e.target.value})}
                                    className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-sm"
                                >
                                    {apparelStructure.map(cat => <option key={cat.mainCategory} value={cat.mainCategory}>{cat.mainCategory}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">標籤 (Tags)</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {editingItem.tags?.map(tag => (
                                        <span key={tag} className="flex items-center bg-gray-600 px-2 py-1 rounded text-xs text-gray-200">
                                            #{tag}
                                            <button onClick={() => handleRemoveTag(tag)} className="ml-1 text-gray-400 hover:text-red-400">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={newTag} 
                                        onChange={e => setNewTag(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && handleAddTag()}
                                        placeholder="新增標籤..."
                                        className="flex-grow bg-gray-700 border-gray-600 rounded-md p-2 text-sm"
                                    />
                                    <Button onClick={handleAddTag} variant="secondary" className="px-3">新增</Button>
                                </div>
                            </div>

                            {editingItem.analysis && (
                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-700">
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">顏色</label>
                                        <p className="text-sm text-gray-300">{editingItem.analysis.color}</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">材質</label>
                                        <p className="text-sm text-gray-300">{editingItem.analysis.material}</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">場合</label>
                                        <p className="text-sm text-gray-300">{editingItem.analysis.occasion}</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">季節</label>
                                        <p className="text-sm text-gray-300">{editingItem.analysis.season}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8 pt-6 border-t border-gray-700">
                        <Button onClick={() => setEditingItem(null)} variant="secondary" className="flex-1">取消</Button>
                        <Button onClick={handleUpdateItem} className="flex-1">儲存變更</Button>
                    </div>
                </Card>
            </div>
        )}

        {generatedAsset && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setGeneratedAsset(null)}>
                <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold mb-4 text-[var(--color-text-title)]">AI 生成結果</h3>
                    <img src={generatedAsset.url} alt={generatedAsset.prompt} className="w-full aspect-square object-contain rounded-md bg-white/10" />
                    <div className="flex gap-4 mt-4">
                        <Button onClick={() => setGeneratedAsset(null)} variant="secondary" className="flex-1">關閉</Button>
                        <Button onClick={handleSaveGeneratedAsset} className="flex-1">儲存至衣櫥</Button>
                    </div>
                </Card>
            </div>
        )}
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

        {/* Header */}
        <div className="sticky top-[80px] z-30 glass-panel border-x-0 border-t-0 px-6 py-4 mb-8">
            <div className="max-w-[110rem] mx-auto flex justify-between items-center">
                <div className="flex flex-col">
                    <h2 className="text-2xl font-display font-bold uppercase tracking-[0.3em] text-[var(--color-text-main)]">智慧衣櫥</h2>
                    <span className="text-[9px] uppercase tracking-[0.5em] text-[var(--color-gold)] font-light">Smart Wardrobe Studio</span>
                </div>
                <div className="flex items-center gap-4">
                    {onGoHome && <Button onClick={onGoHome} variant="secondary" className="text-[10px] font-bold tracking-widest">返回首頁</Button>}
                </div>
            </div>
        </div>
        {error && <div className="text-center text-red-500 p-3 bg-red-900/50 rounded-md mb-6">{error}</div>}
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
             <Card>
                <h3 className="text-lg font-bold mb-3 text-[var(--color-text-title)] flex items-center"><SparklesIcon className="w-5 h-5 mr-2 text-[var(--color-gold)]"/> AI 智慧上傳</h3>
                <div className="flex items-center mb-4">
                     <input type="checkbox" id="auto-tag" checked={enableAutoTagging} onChange={e => setEnableAutoTagging(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-[var(--color-gold)] focus:ring-0" />
                     <label htmlFor="auto-tag" className="ml-2 text-sm text-gray-300">啟用 AI 自動標註</label>
                </div>
                <div className="flex gap-2 mb-2">
                     <select 
                        value={uploadCategory} 
                        onChange={e => setUploadCategory(e.target.value)} 
                        className="bg-gray-700 border-gray-600 text-[var(--color-text-title)] rounded-md p-2 text-sm flex-grow"
                        disabled={!isDataReady}
                     >
                        <option value="">{isDataReady ? "-- 選擇類別 (可選) --" : "載入中..."}</option>
                        {apparelStructure.map(cat => <option key={cat.mainCategory} value={cat.mainCategory}>{cat.mainCategory}</option>)}
                     </select>
                </div>
                <Button onClick={handleUploadClick} isLoading={isLoading} className="w-full">{isLoading ? 'AI 分析中...' : '上傳新服飾'}</Button>
            </Card>

            <Card>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold text-[var(--color-text-title)] flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" /></svg>
                    雲端同步
                  </h3>
                  {isConnected && (
                    <button onClick={checkDrive} className="text-[10px] text-gray-500 hover:text-[var(--color-gold)] uppercase tracking-widest">重新整理</button>
                  )}
                </div>
                {!isConnected ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-gray-400 mb-4">連結 Google Drive 以同步雲端資料夾</p>
                    <Button onClick={handleConnectDrive} variant="secondary" className="w-full text-xs">連結雲端硬碟</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">同步資料夾</label>
                      <div 
                        onClick={() => setShowFolderPicker(true)}
                        className="w-full bg-gray-700 border border-gray-600 hover:border-[var(--color-gold)] rounded-md p-3 cursor-pointer transition-all flex justify-between items-center group"
                      >
                        <div className="flex items-center gap-3">
                          <svg className="w-4 h-4 text-[var(--color-gold)]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                          <span className="text-xs font-bold truncate max-w-[150px]">
                            {selectedFolderId ? (folders.find(f => f.id === selectedFolderId)?.name || selectedFolderName || '已選擇資料夾') : '點擊選擇雲端資料夾'}
                          </span>
                        </div>
                        <svg className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSyncFromDrive} 
                        disabled={!selectedFolderId || isSyncing} 
                        isLoading={isSyncing}
                        className="flex-grow text-xs"
                        variant="secondary"
                      >
                        {isSyncing ? '同步中...' : '從雲端匯入'}
                      </Button>
                      <Button 
                        onClick={handleExportToDrive} 
                        disabled={!selectedFolderId || isSyncing} 
                        isLoading={isSyncing}
                        className="flex-grow text-xs"
                      >
                        匯出至雲端
                      </Button>
                      <button onClick={handleDisconnectDrive} className="p-2 text-gray-500 hover:text-red-400 transition-colors" title="斷開連結">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      </button>
                    </div>
                  </div>
                )}
            </Card>

            <Card>
                <h3 className="text-lg font-bold mb-3 text-[var(--color-text-title)]">AI 配件生成</h3>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={generationPrompt} 
                        onChange={e => setGenerationPrompt(e.target.value)}
                        placeholder="例如：金色珍珠項鍊..."
                        className="w-full bg-gray-700 p-2 rounded-md text-sm"
                        disabled={isGenerating}
                    />
                    <Button onClick={handleGenerateAsset} isLoading={isGenerating} disabled={!generationPrompt.trim()} className="whitespace-nowrap">生成</Button>
                </div>
            </Card>
            
            <Card>
                 <h3 className="text-lg font-bold mb-3 text-[var(--color-text-title)]">智慧搜尋</h3>
                 <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    placeholder="搜尋標籤 (如: 紅色, 絲綢)..." 
                    className="w-full bg-gray-700 p-2 rounded-md text-sm mb-2"
                 />
                 <div className="flex justify-between text-xs text-gray-400">
                    <span>{filteredItems.length} 件物品</span>
                    <button onClick={() => setSearchQuery('')} className="hover:text-white">清除</button>
                 </div>
            </Card>
        </div>

        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-4">
            <div className="flex items-center gap-4">
                <input type="checkbox" id="select-all" className="h-5 w-5" checked={filteredItems.length > 0 && selectedItems.size === filteredItems.length} onChange={handleSelectAll} />
                <label htmlFor="select-all">全選</label>
                <Button onClick={handleDelete} disabled={selectedItems.size === 0} variant="secondary" className="bg-red-800/80 hover:bg-red-700/80 py-1 px-3 text-sm">刪除已選 ({selectedItems.size})</Button>
            </div>
            <div className="flex items-center gap-2">
                 <label htmlFor="category-filter" className="text-sm">類別:</label>
                 <select id="category-filter" value={filter} onChange={e => setFilter(e.target.value)} disabled={!isDataReady} className="bg-gray-700 border-gray-600 text-[var(--color-text-title)] rounded-md p-1 text-sm">
                    <option value="all">全部</option>
                    {apparelStructure.map(cat => <option key={cat.mainCategory} value={cat.mainCategory}>{cat.mainCategory}</option>)}
                 </select>
            </div>
        </div>


        {items.length > 0 ? (
            filteredItems.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredItems.map(item => (
                        <Card key={item.id} className="p-2 group relative cursor-pointer hover:bg-gray-700 transition-colors">
                             <input
                                type="checkbox"
                                aria-label={`Select item ${item.name}`}
                                checked={selectedItems.has(item.id)}
                                onChange={() => toggleSelection(item.id)}
                                onClick={e => e.stopPropagation()}
                                className="absolute top-3 left-3 z-10 h-5 w-5 rounded bg-gray-900/50 border-2 border-gray-500 text-blue-400 focus:ring-blue-500"
                            />
                            <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setEditingItem(item); }}
                                    className="p-1.5 bg-gray-900/80 rounded-full text-white hover:text-[var(--color-gold)]"
                                    title="編輯"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setPreviewingImage(item.imageUrl); }}
                                    className="p-1.5 bg-gray-900/80 rounded-full text-white hover:text-[var(--color-gold)]"
                                    title="預覽"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </button>
                            </div>
                            <div className="aspect-square w-full bg-white/5 rounded-md mb-2 relative overflow-hidden" onClick={() => setPreviewingImage(item.imageUrl)}>
                                <AsyncImage src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                                {item.analysis && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-[10px] text-gray-300 flex justify-around backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span>{item.analysis.material}</span>
                                        <span>{item.analysis.occasion}</span>
                                    </div>
                                )}
                            </div>
                            <div className="px-1">
                                <p className="font-bold text-sm truncate">{item.name}</p>
                                <p className="text-xs text-gray-400 mb-1">{item.category}</p>
                                {item.tags && item.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {item.tags.slice(0, 3).map(tag => (
                                            <span key={tag} className="text-[10px] bg-gray-600 px-1.5 rounded-sm text-gray-200">#{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-500 py-16">沒有符合搜尋條件的物品。</p>
            )
        ) : (
            <p className="text-center text-gray-400 py-16">您的個人衣櫥是空的。請先至「服裝設計」或「影像解構」添加物品，或直接上傳。</p>
        )}
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
        onConfirm={(files) => handleSyncFromDrive(files)}
        folderId={selectedFolderId}
        folderName={selectedFolderName}
      />
    </div>
  );
};

export default PersonalWardrobe;
