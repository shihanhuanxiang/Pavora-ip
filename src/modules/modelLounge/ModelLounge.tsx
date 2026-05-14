import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Model, PortfolioItem, DiaryEntry } from '../../shared/types/types';
import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
import ImagePreviewModal from '../../shared/components/common/ImagePreviewModal';
import { useModelStore } from '../../shared/stores/useModelStore';
import { useBrandStore } from '../../shared/stores/useBrandStore';
import { STORY_ARCS } from '../narrative/constants/storyElements';
import AsyncImage from '../../shared/components/common/AsyncImage';
import PortfolioSelectModal from '../../components/PortfolioSelectModal';
import NarrativeWorkflow from '../narrative/NarrativeWorkflow';
import { auth } from '../../shared/services/firebase/firebaseConfig';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { extractMetadataFromFile, hasPavoraMetadata, embedMetadata } from '../../shared/utils/metadataUtils';
import { downloadImage, cropImage, fileToBase64 } from '../../shared/utils/imageUtils';
import ManualCropModal from '../../shared/components/business/ManualCropModal';
import { detectMultiAngleLayout } from '../../shared/services/geminiService';
import { useNotification } from '../../shared/context/NotificationContext';
import Loader from '../../shared/components/common/Loader';
import { checkGoogleDriveStatus, syncToGoogleDrive, getOrCreateDriveFolder } from '../../shared/services/googleDriveService';
import DriveFilePickerModal from '../../components/DriveFilePickerModal';

import ModelIdentityEditor from './ModelIdentityEditor';
import ModelActionMenu from './components/ModelActionMenu';

interface ModelLoungeProps {
  onGoHome: () => void;
  onModelSelect: (model: Model, destination: string) => void;
  isHubMode?: boolean;
}

export const handleDownload = (model: Model) => {
    const { id, name, gender, age, persona, lifeCircuit, type, stats } = model;
    const metadata = { id, name, gender, age, persona, lifeCircuit, type, stats, exportedAt: new Date().toISOString() };
    
    const imageUrl = model.imageUrl;
    if (imageUrl.startsWith('data:')) {
        const enriched = embedMetadata(imageUrl, metadata);
        downloadImage(enriched, `${name || 'model'}.jpg`, 'ModelLounge');
    } else {
        downloadImage(imageUrl, `${name || 'model'}.jpg`, 'ModelLounge');
    }
};

const DESTINATIONS = [
    { key: 'fitting_room', label: '虛擬試衣間 (Fitting)' },
    { key: 'scene', label: '場景轉移 (Scene)' },
    { key: 'narrative', label: '靈魂敘事 (Narrative) ✨' },
    { key: 'salon', label: '髮型沙龍 (Salon)' },
];

const ModelLounge: React.FC<ModelLoungeProps> = ({ onGoHome, onModelSelect, isHubMode }) => {
  const { models, removeModels, addModel, updateModel, syncWithCloud } = useModelStore();
  const { addAmbassador, ambassadors } = useBrandStore();
  const { addNotification } = useNotification();
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [previewingImage, setPreviewingImage] = useState<{images: string[], startIndex: number} | null>(null);
  const [showPortfolioImport, setShowPortfolioImport] = useState(false);
  const [selectedModelForNarrative, setSelectedModelForNarrative] = useState<Model | null>(null);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [viewingPortfolioModelId, setViewingPortfolioModelId] = useState<string | null>(null);
  
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [isUploading, setIsUploading] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activePortfolioItemId, setActivePortfolioItemId] = useState<string | null>(null);
  const [readingDiary, setReadingDiary] = useState<{
    name: string, 
    content: string, 
    visualPrompt?: string, 
    visualPromptZH?: string 
  } | null>(null);
  const [selectedGalleryItems, setSelectedGalleryItems] = useState<Set<string>>(new Set());
  const [isPortfolioDeleteMode, setIsPortfolioDeleteMode] = useState(false);
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [isDriveImporting, setIsDriveImporting] = useState(false);
  const [showDriveFilePicker, setShowDriveFilePicker] = useState(false);
  const [driveImportFolder, setDriveImportFolder] = useState<{ id: string; name: string } | null>(null);
  const [driveConnected, setDriveConnected] = useState(false);

  const [isFaceCropModalOpen, setIsFaceCropModalOpen] = useState(false);
  const [faceCropSource, setFaceCropSource] = useState<{ url: string; fileData: { data: string; mimeType: string } } | null>(null);
  const [faceDetectedBoxes, setFaceDetectedBoxes] = useState<any[]>([]);
  const [isFaceDetecting, setIsFaceDetecting] = useState(false);

  const { removeFromModelGallery } = useModelStore();

  const portfolioModel = viewingPortfolioModelId ? models.find(m => m.id === viewingPortfolioModelId) : null;
  const faceReferenceCount = (portfolioModel?.preferences?.face_reference_urls || []).filter(Boolean).length;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        if (user) {
            syncWithCloud();
        }
    });
    return () => unsubscribe();
  }, [syncWithCloud]);

  useEffect(() => {
    checkGoogleDriveStatus().then(setDriveConnected);
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        addNotification({ type: 'success', message: '已成功連接雲端' });
    } catch (e) {
        console.error("Login failed", e);
        addNotification({ type: 'error', message: '雲端連接失敗' });
    }
  };

  const handleManualUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    const file = event.target.files[0];
    setIsUploading(true);

    try {
        const metadata = await extractMetadataFromFile(file);
        if (metadata) {
            // It has our specific metadata!
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = reader.result as string;
                await addModel({
                    ...metadata,
                    imageUrl: base64, // We use the uploaded file's base64, addModel will handle storage
                }, true); // Do NOT sync back to cloud immediately, it might be a duplicate or just local reference
                addNotification({ type: 'success', message: `✨ 成功識別並載入模特兒: ${metadata.name}` });
            };
            reader.readAsDataURL(file);
        } else {
            // Regular image, just import as basic model
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = reader.result as string;
                await addModel({
                    id: `manual-${Date.now()}`,
                    name: `手動上傳 ${file.name.split('.')[0]}`,
                    imageUrl: base64,
                    type: 'custom'
                });
                addNotification({ type: 'info', message: '已載入影像，但未發現 Pavora 身份 Metadata。' });
            };
            reader.readAsDataURL(file);
        }
    } catch (e) {
        addNotification({ type: 'error', message: '讀取檔案失敗' });
    } finally {
        setIsUploading(false);
        event.target.value = ''; // clear input
    }
  };

  const toggleSelection = (modelId: string) => {
    setSelectedModels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(modelId)) newSet.delete(modelId);
      else newSet.add(modelId);
      return newSet;
    });
  };
  
  const handleSelectAll = () => {
    if (selectedModels.size === models.length) setSelectedModels(new Set());
    else setSelectedModels(new Set(models.map(m => m.id)));
  };

  const handleDelete = () => {
    if (selectedModels.size > 0) {
      removeModels(Array.from(selectedModels));
      setSelectedModels(new Set());
      addNotification({ type: 'success', message: '模特兒人物已成功刪除' });
    }
  };

  const handleNarrativeConfirm = (diary: Partial<DiaryEntry>, generatedImageUrl?: string) => {
      if (!selectedModelForNarrative) return;
      
      // Just refresh the data locally via the store (NarrativeWorkflow already calls updateModelGallery)
      setSelectedModelForNarrative(null);
      addNotification({ type: 'success', message: '靈魂敘事已同步至模特兒作品集' });
  };

  const handlePromoteToAmbassador = async (model: Model) => {
    if (ambassadors.length >= 5) {
      alert('品牌代言人上限為 5 位，請先移除現有代言人。');
      return;
    }
    
    await addAmbassador({
      id: `amb_${Date.now()}`,
      name: model.name,
      imageUrl: model.imageUrl,
      gender: 'female', // Default, should ideally be from model data
      ethnicity: 'Asian',
      bodyType: 'Standard',
      createdAt: new Date().toISOString()
    });
    alert('已成功晉升為品牌代言人！');
  };

  const handlePortfolioImport = async (selectedItems: PortfolioItem[]) => {
    for (const item of selectedItems) {
      await addModel({
        id: `model-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: `Imported ${item.sourceModule}`,
        imageUrl: item.imageUrl,
        type: 'custom'
      });
    }
  };

  const toggleGallerySelection = (itemId: string) => {
    setSelectedGalleryItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) newSet.delete(itemId);
      else newSet.add(itemId);
      return newSet;
    });
  };

  const handleDeleteGalleryItems = async () => {
    if (!viewingPortfolioModelId || selectedGalleryItems.size === 0) return;
    
    await removeFromModelGallery(viewingPortfolioModelId, Array.from(selectedGalleryItems));
    setSelectedGalleryItems(new Set());
    setIsPortfolioDeleteMode(false);
    addNotification({ type: 'success', message: '圖片已成功刪除' });
  };

  const handleSyncGalleryToDrive = async () => {
    if (!viewingPortfolioModelId) return;
    const model = models.find(m => m.id === viewingPortfolioModelId);
    if (!model?.gallery?.length) return;

    const unsynced = model.gallery.filter(item => !item.driveFileId);
    if (unsynced.length === 0) {
      addNotification({ type: 'info', message: '所有圖片已同步至 Google Drive' });
      return;
    }

    setIsDriveSyncing(true);
    let successCount = 0;
    let updatedGallery = model.gallery;

    const rootFolder = await getOrCreateDriveFolder('Pavora_Model_Gallery');
    if (!rootFolder) {
      addNotification({ type: 'error', message: '無法取得或建立 Drive 根資料夾' });
      setIsDriveSyncing(false);
      return;
    }
    const modelFolderName = model.name?.trim() || viewingPortfolioModelId;
    const modelFolder = await getOrCreateDriveFolder(modelFolderName, rootFolder.id);
    if (!modelFolder) {
      addNotification({ type: 'error', message: '無法取得或建立模特兒 Drive 資料夾' });
      setIsDriveSyncing(false);
      return;
    }

    for (const item of unsynced) {
      try {
        let fileData = item.url;
        if (item.url.startsWith('idb://')) {
          const { imageDB } = await import('../../shared/services/imageDB');
          const blob = await imageDB.get(item.url);
          if (blob) fileData = await imageDB.blobToBase64(blob);
        }

        const result = await syncToGoogleDrive(
          `ModelGallery_${viewingPortfolioModelId}_${item.timestamp}.png`,
          fileData,
          'image/png',
          modelFolderName,
          modelFolder.id
        );

        if (result.success && result.fileId) {
          const driveSyncedAt = new Date().toISOString();
          updatedGallery = updatedGallery.map(g =>
            g.id === item.id
              ? { ...g, driveFileId: result.fileId, driveLink: result.link, driveSyncedAt }
              : g
          );
          successCount++;
        }
      } catch (e) {
        console.error('Drive sync failed for item', item.id, e);
      }
    }

    if (successCount > 0) {
      await updateModel(viewingPortfolioModelId, { gallery: updatedGallery });
    }

    setIsDriveSyncing(false);
    addNotification({
      type: successCount > 0 ? 'success' : 'error',
      message: successCount > 0
        ? `已同步 ${successCount} 張圖片至 Google Drive`
        : '同步失敗，請確認 Google Drive 已連線'
    });
  };

  const handleOpenDriveImport = async () => {
    if (!portfolioModel) return;

    setIsDriveImporting(true);
    try {
      const rootFolder = await getOrCreateDriveFolder('Pavora_Model_Gallery');
      if (!rootFolder) {
        addNotification({ type: 'error', message: '無法開啟 Drive 資料夾' });
        return;
      }

      const modelFolderName = portfolioModel.name?.trim() || portfolioModel.id;
      const modelFolder = await getOrCreateDriveFolder(modelFolderName, rootFolder.id);
      if (!modelFolder) {
        addNotification({ type: 'error', message: '無法開啟模特兒 Drive 資料夾' });
        return;
      }

      setDriveImportFolder(modelFolder);
      setShowDriveFilePicker(true);
    } catch (error) {
      console.error('Open Drive import failed:', error);
      addNotification({ type: 'error', message: 'Drive 匯入準備失敗' });
    } finally {
      setIsDriveImporting(false);
    }
  };

  const handleConfirmDriveImport = async (selectedFiles: any[]) => {
    if (!portfolioModel) return;

    const existingDriveFileIds = new Set(
      (portfolioModel.gallery || [])
        .map(item => item.driveFileId)
        .filter(Boolean)
    );

    const now = Date.now();
    const importedItems = selectedFiles
      .filter(file => file.mimeType?.startsWith('image/'))
      .filter(file => !existingDriveFileIds.has(file.id))
      .map((file, index) => ({
        id: `drive-${file.id}`,
        url: `/api/drive/image/${file.id}`,
        timestamp: now + index,
        driveFileId: file.id,
        driveLink: file.webViewLink,
        driveSyncedAt: new Date().toISOString()
      }));

    if (importedItems.length === 0) {
      setShowDriveFilePicker(false);
      addNotification({ type: 'info', message: '沒有新的 Drive 圖片可匯入' });
      return;
    }

    await updateModel(portfolioModel.id, {
      gallery: [...importedItems, ...(portfolioModel.gallery || [])]
    } as Partial<Model>);

    setShowDriveFilePicker(false);
    setDriveImportFolder(null);
    addNotification({
      type: 'success',
      message: `已從 Drive 匯入 ${importedItems.length} 張圖片`
    });
  };

    return (
        <div className={`min-h-screen bg-[var(--color-bg-deep)] text-[var(--color-text-main)] font-sans pb-20 ${isHubMode ? 'pt-8' : ''}`}>
            {isFaceCropModalOpen && faceCropSource && portfolioModel && (
                <ManualCropModal
                    imageUrl={faceCropSource.url}
                    initialBoxes={faceDetectedBoxes}
                    angles={[
                        { id: 'front', label: '正面 (FRONT)' },
                        { id: 'side', label: '側面 (SIDE)' },
                        { id: 'angle45', label: '45度角 (45°)' },
                        { id: 'back', label: '背面 (BACK)' }
                    ]}
                    onSave={async (boxes) => {
                        const newRefs = [...(portfolioModel.preferences?.face_reference_urls || ['', '', '', ''])];
                        const slotMap: Record<string, number> = { 
                            'front': 0, 'side': 1, 'angle45': 2, 'back': 3 
                        };
                        
                        setIsFaceDetecting(true); // Reuse as saving state
                        try {
                            for (const box of boxes) {
                                const idx = slotMap[box.angle];
                                if (idx !== undefined) {
                                    const cropped = await cropImage(faceCropSource.fileData, box.box_2d);
                                    newRefs[idx] = `data:${cropped.mimeType};base64,${cropped.data}`;
                                }
                            }
                            
                            updateModel(portfolioModel.id, {
                                preferences: {
                                    ...portfolioModel.preferences,
                                    face_reference_urls: newRefs
                                }
                            });
                            addNotification({ type: 'success', message: '多角度裁切已完成並套用' });
                        } catch (err) {
                            console.error('Apply crops failed:', err);
                            addNotification({ type: 'error', message: '裁切套用失敗' });
                        } finally {
                            setIsFaceDetecting(false);
                            setIsFaceCropModalOpen(false);
                            setFaceCropSource(null);
                            setFaceDetectedBoxes([]);
                        }
                    }}
                    onClose={() => {
                        setIsFaceCropModalOpen(false);
                        setFaceCropSource(null);
                        setFaceDetectedBoxes([]);
                    }}
                    onResetToAI={async () => {
                        if (!faceCropSource) return;
                        try {
                            const boxes = await detectMultiAngleLayout(faceCropSource.fileData);
                            setFaceDetectedBoxes(boxes.map((b: any, i: number) => ({ 
                                ...b, id: `face-auto-${Date.now()}-${i}` 
                            })));
                        } catch (e) {
                            console.error('AI Reset failed', e);
                        }
                    }}
                />
            )}

            {previewingImage && <ImagePreviewModal {...previewingImage} onClose={() => setPreviewingImage(null)} />}
            
            <AnimatePresence>
                {readingDiary && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md" 
                            onClick={() => setReadingDiary(null)} 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-[var(--color-bg-surface)] border border-[var(--color-gold)]/30 rounded-3xl p-10 shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-gold)]/5 blur-3xl -z-10"></div>
                            <h3 className="text-xl font-display font-bold text-[var(--color-gold)] tracking-[0.2em] mb-6 uppercase">
                                {readingDiary.name} 的靈魂敘事
                            </h3>
                            <div className="max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar space-y-6">
                                <div className="text-gray-300 font-serif italic leading-relaxed text-base whitespace-pre-wrap border-l-2 border-[var(--color-gold)]/20 pl-6">
                                    {readingDiary.content}
                                </div>
                                
                                {(readingDiary.visualPrompt || readingDiary.visualPromptZH) && (
                                    <div className="pt-6 border-t border-white/5 space-y-6">
                                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)]"></span>
                                            視覺轉化參數 (Structured Visual Manifest)
                                        </h4>
                                        
                                        {readingDiary.visualPromptZH && (
                                            <div className="space-y-3">
                                                <div className="text-[8px] text-[var(--color-gold)] font-bold uppercase tracking-tighter opacity-60">中文敘事對齊 (ZH)</div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {readingDiary.visualPromptZH.split('\n').map((line, i) => {
                                                        const [key, ...val] = line.split(': ');
                                                        return (
                                                            <div key={i} className="bg-white/5 p-3 rounded-lg border border-white/5 flex gap-3 items-start">
                                                                <span className="text-[9px] font-bold text-[var(--color-gold)]/70 whitespace-nowrap pt-0.5">{key}</span>
                                                                <p className="text-[11px] text-gray-400 leading-relaxed">{(val ?? []).join(': ')}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {readingDiary.visualPrompt && (
                                            <div className="space-y-3">
                                                <div className="text-[8px] text-blue-400 font-bold uppercase tracking-tighter opacity-60">英文視覺指令 (EN)</div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {readingDiary.visualPrompt.split('\n').map((line, i) => {
                                                        const [key, ...val] = line.split(': ');
                                                        return (
                                                            <div key={i} className="bg-black/40 p-3 rounded-lg border border-white/5 flex gap-3 items-start">
                                                                <span className="text-[9px] font-mono font-bold text-blue-400/70 whitespace-nowrap pt-0.5">{key}</span>
                                                                <p className="text-[10px] font-mono text-gray-500 leading-relaxed">{(val ?? []).join(': ')}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <Button 
                                onClick={() => setReadingDiary(null)}
                                className="w-full mt-10 py-4 text-xs font-bold tracking-[0.3em] uppercase"
                            >
                                關閉 (CLOSE)
                            </Button>
                        </motion.div>
                    </div>
                )}
                {selectedModelForNarrative && (
                    <NarrativeWorkflow 
                        model={selectedModelForNarrative}
                        onClose={() => setSelectedModelForNarrative(null)}
                        onConfirm={handleNarrativeConfirm}
                    />
                )}
                {editingModel && (
                    <ModelIdentityEditor 
                        model={editingModel}
                        onClose={() => setEditingModel(null)}
                    />
                )}
            </AnimatePresence>

            <PortfolioSelectModal 
              isOpen={showPortfolioImport}
              onClose={() => setShowPortfolioImport(false)}
              onConfirm={handlePortfolioImport}
            />

            {/* Header */}
            {!isHubMode && (
                <div className="sticky top-[80px] z-30 glass-panel border-x-0 border-t-0 px-6 py-4 mb-8">
                    <div className="max-w-[110rem] mx-auto flex justify-between items-center">
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-display font-bold uppercase tracking-[0.3em] text-[var(--color-text-main)]">模特兒休息室</h2>
                            <span className="text-[9px] uppercase tracking-[0.5em] text-[var(--color-gold)] font-light">Model Lounge Studio</span>
                        </div>
                        <div className="flex items-center gap-4">
                            {currentUser ? (
                                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-[10px] font-bold text-green-500">{currentUser.displayName || '已登入'}</span>
                                    <button onClick={() => auth.signOut()} className="text-[9px] text-gray-500 hover:text-white ml-2 transition-colors">登出</button>
                                </div>
                            ) : (
                                <button 
                                    onClick={handleLogin}
                                    className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-[var(--color-gold)] hover:bg-[var(--color-gold)]/10 hover:border-[var(--color-gold)] transition-all"
                                >
                                    ☁️ 連接雲端存檔
                                </button>
                            )}
                            {onGoHome && <Button onClick={onGoHome} variant="secondary" className="text-[10px] font-bold tracking-widest">返回首頁</Button>}
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-[110rem] mx-auto px-6 lg:px-12">
                {/* Toolbar */}
                <div className="glass-panel rounded-2xl p-4 mb-10 flex flex-wrap justify-between items-center gap-4 border border-[var(--color-border)]">
                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative w-5 h-5 border border-[var(--color-border)] rounded flex items-center justify-center transition-all group-hover:border-[var(--color-gold)]">
                                <input 
                                    type="checkbox" 
                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                    checked={models.length > 0 && selectedModels.size === models.length} 
                                    onChange={handleSelectAll} 
                                />
                                {models.length > 0 && selectedModels.size === models.length && (
                                    <div className="w-2.5 h-2.5 bg-[var(--color-gold)] rounded-sm"></div>
                                )}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-dim)] group-hover:text-[var(--color-text-main)] transition-colors">全選</span>
                        </label>
                        
                        <div className="h-4 w-px bg-[var(--color-border)]"></div>
                        
                        <span className="text-[10px] font-mono tracking-widest text-[var(--color-gold)]">
                            {selectedModels.size} / {models.length} 已選擇
                        </span>
                    </div>

                    <div className="flex gap-4">
                        <label className="cursor-pointer">
                            <input type="file" className="hidden" accept="image/*" onChange={handleManualUpload} />
                            <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold tracking-widest text-white hover:bg-white/10 hover:border-[var(--color-gold)] transition-all flex items-center gap-2">
                                📤 手動上傳舊照片 (自動讀取)
                            </div>
                        </label>
                        <Button 
                            onClick={() => setShowPortfolioImport(true)}
                            variant="primary"
                            className="text-[10px] font-bold tracking-widest"
                        >
                            從作品集錦匯入
                        </Button>
                        <Button 
                            onClick={handleDelete} 
                            disabled={selectedModels.size === 0} 
                            variant="secondary" 
                            className="text-[10px] font-bold tracking-widest bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20 disabled:opacity-30"
                        >
                            刪除已選
                        </Button>
                    </div>
                </div>

                {models.length > 0 ? (
                    portfolioModel ? (
                        /* MODEL PORTFOLIO VIEW (HUB) */
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-12"
                        >
                            {/* Portfolio Header */}
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="w-1/4 aspect-[3/4] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                                    <AsyncImage src={portfolioModel.imageUrl} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 space-y-6 pt-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <button 
                                                onClick={() => setViewingPortfolioModelId(null)}
                                                className="text-[10px] text-[var(--color-gold)] font-bold tracking-widest uppercase mb-4 flex items-center gap-2 hover:underline"
                                            >
                                                ← 返回模特兒清單
                                            </button>
                                            <h1 className="text-4xl font-display font-bold tracking-widest text-white uppercase">{portfolioModel.name}</h1>
                                            <div className="flex gap-3 mt-4">
                                                <span className="px-4 py-1.5 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20 rounded-full text-[10px] font-bold text-[var(--color-gold)] uppercase">
                                                    MBTI: {portfolioModel.persona?.mbti || 'N/A'}
                                                </span>
                                                <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-gray-400 uppercase">
                                                    Vibe: {portfolioModel.persona?.coreVibe || 'Professional'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            {isPortfolioDeleteMode ? (
                                                <>
                                                    <Button 
                                                        onClick={handleDeleteGalleryItems} 
                                                        disabled={selectedGalleryItems.size === 0}
                                                        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white border-0 text-[10px] tracking-widest disabled:opacity-30"
                                                    >
                                                        確定刪除 ({selectedGalleryItems.size})
                                                    </Button>
                                                    <Button onClick={() => { setIsPortfolioDeleteMode(false); setSelectedGalleryItems(new Set()); }} variant="secondary" className="px-6 py-3 border-white/10 text-[10px] tracking-widest">
                                                        取消
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <button 
                                                        onClick={() => setIsPortfolioDeleteMode(true)}
                                                        className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold tracking-widest text-gray-400 hover:text-white transition-all hover:border-red-500/50"
                                                    >
                                                        🗑️ 批量刪除模式
                                                    </button>
                                                    {driveConnected && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={handleSyncGalleryToDrive}
                                                                disabled={isDriveSyncing}
                                                                className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold tracking-widest text-sky-400 hover:text-white transition-all hover:border-sky-500/50 disabled:opacity-30"
                                                            >
                                                                {isDriveSyncing ? '同步中...' : '☁️ 同步圖片到 Drive'}
                                                            </button>
                                                            <Button
                                                                onClick={handleOpenDriveImport}
                                                                disabled={isDriveImporting}
                                                                isLoading={isDriveImporting}
                                                                variant="secondary"
                                                                className="text-[10px] font-bold tracking-widest"
                                                            >
                                                                從 Drive 匯入
                                                            </Button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            <Button onClick={() => setEditingModel(portfolioModel)} variant="secondary" className="px-6 py-3 border-white/10 text-[10px] tracking-widest">
                                                編輯身份 (Edit Identity)
                                            </Button>
                                            <Button onClick={() => setSelectedModelForNarrative(portfolioModel)} className="px-8 py-3 text-[10px] tracking-[0.2em]">
                                                啟動靈魂敘事 (START NARRATIVE)
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white/5 rounded-3xl border border-white/5">
                                        <div>
                                            <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1">作品數量</p>
                                            <p className="text-xl text-white font-mono">{(portfolioModel.gallery?.length || 0) + 1}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1">主導情緒</p>
                                            <p className="text-xl text-white font-mono">{portfolioModel.persona?.toneOfVoice || '自然'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1">物理參數 (Stats)</p>
                                            <p className="text-xs text-gray-400 font-mono">
                                                {portfolioModel.stats?.bust}-{portfolioModel.stats?.waist}-{portfolioModel.stats?.hip} // {portfolioModel.stats?.height}cm
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Content Category Ratio */}
                            {(() => {
                                const gallery = portfolioModel.gallery || [];
                                const lifestyle = gallery.filter((i: any) => i.contentCategory === 'lifestyle').length;
                                const curve = gallery.filter((i: any) => i.contentCategory === 'curve').length;
                                const drama = gallery.filter((i: any) => i.contentCategory === 'drama').length;
                                const total = lifestyle + curve + drama;
                                if (total === 0) return null;
                                return (
                                    <div className="p-5 bg-white/5 rounded-2xl border border-white/5 mb-0">
                                        <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-3">內容比例 / Content Ratio</p>
                                        <div className="space-y-2.5">
                                            {[
                                                { label: '生活日常 Lifestyle', count: lifestyle, color: 'bg-blue-400', target: 50 },
                                                { label: '曲線魅力 Curve', count: curve, color: 'bg-rose-400', target: 30 },
                                                { label: '戲劇張力 Drama', count: drama, color: 'bg-purple-400', target: 20 },
                                            ].map(({ label, count, color, target }) => {
                                                const pct = Math.round((count / total) * 100);
                                                return (
                                                    <div key={label}>
                                                        <div className="flex justify-between text-[9px] text-gray-400 mb-1">
                                                            <span>{label}</span>
                                                            <span>{count} 張 · {pct}% <span className="text-gray-600">（目標 {target}%）</span></span>
                                                        </div>
                                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                            <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* IP 完整度 (Completeness) */}
                            <div className="p-5 bg-white/5 rounded-2xl border border-white/5 mb-0 mt-4">
                                <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-4">IP 完整度 / Completeness</p>
                                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                    {/* 1. locked_descriptor */}
                                    <div className="flex items-center gap-3">
                                        {(() => {
                                            const desc = portfolioModel.persona?.locked_descriptor || "";
                                            if (desc.length > 20) return <span className="text-emerald-400">✅</span>;
                                            if (desc.length > 0) return <span className="text-amber-400">⚠️</span>;
                                            return <span className="text-rose-500">❌</span>;
                                        })()}
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">人格描述 (Descriptor)</span>
                                    </div>

                                    {/* 2. face_reference_urls */}
                                    <div className="flex items-center gap-3">
                                        {(() => {
                                            const count = (portfolioModel.preferences?.face_reference_urls || []).filter(Boolean).length;
                                            if (count >= 4) return <span className="text-emerald-400">✅</span>;
                                            if (count > 0) return <span className="text-amber-400">⚠️</span>;
                                            return <span className="text-rose-500">❌</span>;
                                        })()}
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">臉部參考圖 (Face Ref)</span>
                                    </div>

                                    {/* 3. worldAnchors.pet */}
                                    <div className="flex items-center gap-3">
                                        {portfolioModel.worldAnchors?.pet ? <span className="text-emerald-400">✅</span> : <span className="text-gray-600">—</span>}
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">寵物設定 (Pet)</span>
                                    </div>

                                    {/* 4. worldAnchors.iconicItems */}
                                    <div className="flex items-center gap-3">
                                        {portfolioModel.worldAnchors?.iconicItems?.length ? <span className="text-emerald-400">✅</span> : <span className="text-gray-600">—</span>}
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">標誌物品 (Iconic Item)</span>
                                    </div>

                                    {/* 5. contentCategory 分佈 */}
                                    <div className="flex items-center gap-3">
                                        {(() => {
                                            const gallery = portfolioModel.gallery || [];
                                            if (gallery.length === 0) return <span className="text-gray-600">—</span>;
                                            const total = gallery.length;
                                            const lifestyle = gallery.filter(i => i.contentCategory === 'lifestyle').length;
                                            const curve = gallery.filter(i => i.contentCategory === 'curve').length;
                                            const drama = gallery.filter(i => i.contentCategory === 'drama').length;
                                            const pcts = [
                                                { actual: (lifestyle / total) * 100, target: 50 },
                                                { actual: (curve / total) * 100, target: 30 },
                                                { actual: (drama / total) * 100, target: 20 }
                                            ];
                                            const isDrifting = pcts.some(p => Math.abs(p.actual - p.target) >= 15);
                                            return isDrifting ? <span className="text-amber-400">⚠️</span> : <span className="text-emerald-400">✅</span>;
                                        })()}
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">內容比例 (Ratio)</span>
                                    </div>

                                    {/* 6. storyArcs */}
                                    <div className="flex items-center gap-3">
                                        {portfolioModel.preferences?.active_arc_id ? <span className="text-emerald-400">✅</span> : <span className="text-gray-600">—</span>}
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">故事線 (Story Arc)</span>
                                    </div>
                                </div>
                            </div>

                            {/* P2-5: 故事進度小卡 */}
                            {(() => {
                                const isArcEnabled = portfolioModel.preferences?.enable_story_arcs !== false;
                                if (!isArcEnabled) return null;

                                const allArcs = [...STORY_ARCS, ...(portfolioModel.preferences?.custom_story_arcs || [])];
                                const activeArcId = portfolioModel.preferences?.active_arc_id;
                                const activeArc = allArcs.find(a => a.arc_id === activeArcId);
                                
                                if (!activeArc) {
                                    return (
                                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10 border-dashed flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">尚無進行中的故事線 // NO ACTIVE STORY ARC</p>
                                            </div>
                                            <button 
                                                onClick={() => setSelectedModelForNarrative(portfolioModel)}
                                                className="text-[9px] text-[var(--color-gold)] font-bold uppercase tracking-widest hover:underline"
                                            >
                                                前往靈魂敘事開啟新篇章 →
                                            </button>
                                        </div>
                                    );
                                }

                                const currentPhaseIdx = portfolioModel.preferences?.active_arc_phase_index || 0;
                                const totalPhases = activeArc.phases.length;
                                const progress = ((currentPhaseIdx + 1) / totalPhases) * 100;

                                return (
                                    <div className="p-6 bg-[var(--color-bg-surface)] rounded-3xl border border-[var(--color-gold)]/20 shadow-xl space-y-5 relative overflow-hidden group/arc">
                                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[var(--color-gold)]/5 blur-3xl rounded-full group-hover/arc:bg-[var(--color-gold)]/10 transition-all duration-700"></div>
                                        
                                        <div className="flex justify-between items-center relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)] animate-pulse shadow-[0_0_10px_rgba(212,175,55,1)]"></div>
                                                <h4 className="text-[10px] font-black text-[var(--color-gold)] uppercase tracking-[0.4em] italic">核心故事進度 // STORY PROGRESS</h4>
                                            </div>
                                            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                                                <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter mr-2">里程碑</span>
                                                <span className="text-[9px] text-white font-black">{currentPhaseIdx + 1} / {totalPhases}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                                            <div className="flex-1 space-y-3">
                                                <div className="space-y-1">
                                                    <h5 className="text-xl font-black text-white tracking-tight uppercase leading-none">{activeArc.name_zh}</h5>
                                                    <p className="text-[9px] text-gray-500 font-bold tracking-widest uppercase opacity-60 italic">{activeArc.arc_id}</p>
                                                </div>
                                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-[var(--color-gold)] to-[#FFD700] transition-all duration-1000 ease-out" 
                                                        style={{ width: `${progress}%` }} 
                                                    />
                                                </div>
                                            </div>
                                            <Button 
                                                onClick={() => setSelectedModelForNarrative(portfolioModel)}
                                                className="px-8 py-3 text-[10px] font-black tracking-[0.2em] shadow-lg shadow-[var(--color-gold)]/10"
                                            >
                                                繼續故事線 (CONTINUE STORY)
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="rounded-3xl border border-[var(--color-gold)]/15 bg-[var(--color-gold)]/5 p-5 md:p-6">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--color-gold)]">
                                            Identity Reference Setup
                                        </p>
                                        <h3 className="text-xl font-bold text-white">
                                            臉部基準圖：{faceReferenceCount}/4 已設定
                                        </h3>
                                        <p className="text-sm text-gray-400 leading-relaxed max-w-3xl">
                                            下方 2x2 Face Reference 會作為靈魂敘事生圖的身份參考。建議補齊 FRONT / SIDE / 45° / BACK，讓同一個 IP 在不同日常場景中維持臉型、髮型與辨識度。
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-start md:items-end gap-2 text-[10px] font-bold uppercase tracking-widest">
                                        <span className={`px-3 py-1 rounded-full border ${faceReferenceCount >= 2 ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-white/10 bg-white/5 text-gray-400'}`}>
                                            {faceReferenceCount >= 2 ? 'Reference Ready' : 'Add Face References'}
                                        </span>
                                        <span className="text-gray-500">
                                            點擊下方格子單張上傳，或使用自動裁切
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Assets Grid */}
                            <div className="space-y-6">
                                <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.4em] border-b border-white/5 pb-4">
                                    模特兒作品集與衍生資產 (Portfolio & Assets)
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {/* Original Image */}
                                    <div className="group relative glass-panel rounded-2xl overflow-hidden border border-[var(--color-gold)] shadow-lg">
                                        <div className="aspect-[3/4]">
                                            {/* 臉部基準圖 2x2 Grid */}
                                            <div className="w-full h-full grid grid-cols-2 gap-0.5 bg-black/40 p-1">
                                                {[
                                                    { id: 'front', label: 'FRONT', index: 0 },
                                                    { id: 'side', label: 'SIDE', index: 1 },
                                                    { id: 'angle45', label: '45°', index: 2 },
                                                    { id: 'back', label: 'BACK', index: 3 }
                                                ].map(slot => {
                                                    const url = (portfolioModel.preferences?.face_reference_urls || [])[slot.index];
                                                    return (
                                                        <div
                                                            key={slot.id}
                                                            onClick={() => document.getElementById(`face-ref-${portfolioModel.id}-${slot.id}`)?.click()}
                                                            className="relative overflow-hidden rounded-sm cursor-pointer 
                                                                bg-black/60 border border-white/5 hover:border-[var(--color-gold)]/50 
                                                                transition-all group/slot flex items-center justify-center"
                                                        >
                                                            {url ? (
                                                                <>
                                                                    <img src={url} className="w-full h-full object-cover" alt={slot.label} />
                                                                    <div className="absolute inset-0 bg-black/60 opacity-0 
                                                                        group-hover/slot:opacity-100 flex items-center justify-center 
                                                                        transition-opacity">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                const current = [...(portfolioModel.preferences?.face_reference_urls || [])];
                                                                                current[slot.index] = '';
                                                                                updateModel(portfolioModel.id, {
                                                                                    preferences: {
                                                                                        ...portfolioModel.preferences,
                                                                                        face_reference_urls: current
                                                                                    }
                                                                                });
                                                                            }}
                                                                            className="px-2 py-0.5 bg-red-600/80 text-white 
                                                                                text-[7px] font-black rounded-full hover:bg-red-500"
                                                                        >
                                                                            刪除
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <div className="flex flex-col items-center gap-0.5">
                                                                    <svg className="w-3 h-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                                                                            d="M12 4v16m8-8H4"/>
                                                                    </svg>
                                                                    <span className="text-[6px] text-gray-700 font-black uppercase tracking-widest">
                                                                        {slot.label}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <input
                                                                type="file"
                                                                id={`face-ref-${portfolioModel.id}-${slot.id}`}
                                                                className="hidden"
                                                                accept="image/*"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (!file) return;
                                                                    const reader = new FileReader();
                                                                    reader.onload = (ev) => {
                                                                        const dataUrl = ev.target?.result as string;
                                                                        if (!dataUrl) return;
                                                                        const current = [...(portfolioModel.preferences?.face_reference_urls || ['', '', '', ''])];
                                                                        while (current.length <= slot.index) current.push('');
                                                                        current[slot.index] = dataUrl;
                                                                        updateModel(portfolioModel.id, {
                                                                            preferences: {
                                                                                ...portfolioModel.preferences,
                                                                                face_reference_urls: current
                                                                            }
                                                                        });
                                                                    };
                                                                    reader.readAsDataURL(file);
                                                                }}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            
                                            {/* AI Multi-Angle Upload */}
                                            <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                                                <label className={`px-3 py-1 rounded-full text-[7px] font-black uppercase 
                                                    tracking-widest cursor-pointer transition-all border border-white/10
                                                    ${isFaceDetecting 
                                                        ? 'bg-[var(--color-gold)]/20 text-[var(--color-gold)] animate-pulse' 
                                                        : 'bg-black/60 text-gray-400 hover:bg-[var(--color-gold)]/20 hover:text-[var(--color-gold)]'
                                                    }`}>
                                                    {isFaceDetecting ? 'AI 偵測中...' : '+ 上傳並自動裁切'}
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        disabled={isFaceDetecting}
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            setIsFaceDetecting(true);
                                                            try {
                                                                const fileData = await fileToBase64(file);
                                                                const url = URL.createObjectURL(file);
                                                                
                                                                // AI 自動偵測多角度位置
                                                                const boxes = await detectMultiAngleLayout(fileData);
                                                                setFaceDetectedBoxes(boxes.map((b: any, i: number) => ({ 
                                                                    ...b, id: `face-auto-${i}` 
                                                                })));
                                                                setFaceCropSource({ url, fileData });
                                                                setIsFaceCropModalOpen(true);
                                                            } catch (err) {
                                                                console.error('Face detect failed:', err);
                                                                // AI 失敗時直接開啟裁切視窗（無預設框）
                                                                const reader = new FileReader();
                                                                reader.onload = async () => {
                                                                    const dataUrl = reader.result as string;
                                                                    if (dataUrl) {
                                                                        setFaceCropSource({ 
                                                                            url: URL.createObjectURL(file), 
                                                                            fileData: { data: dataUrl.split(',')[1], mimeType: file.type }
                                                                        });
                                                                        setFaceDetectedBoxes([]);
                                                                        setIsFaceCropModalOpen(true);
                                                                    }
                                                                };
                                                                reader.readAsDataURL(file);
                                                            } finally {
                                                                setIsFaceDetecting(false);
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                        <div className="absolute top-3 left-3 px-2 py-1 bg-[var(--color-gold)] rounded text-[8px] font-bold text-black uppercase tracking-widest">
                                            Face Reference
                                        </div>
                                    </div>
                                    
                                    {/* Gallery Items */}
                                    {portfolioModel.gallery?.map((item, idx) => (
                                        <div key={item.id} className={`group relative glass-panel rounded-2xl overflow-hidden border transition-all ${selectedGalleryItems.has(item.id) ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'border-white/5 hover:border-white/20'}`}>
                                            <div 
                                                className="aspect-[3/4] cursor-pointer" 
                                                onClick={() => {
                                                    if (isPortfolioDeleteMode) {
                                                        toggleGallerySelection(item.id);
                                                    } else {
                                                        setPreviewingImage({images: portfolioModel.gallery!.map(g => g.url), startIndex: idx})
                                                    }
                                                }}
                                            >
                                                <AsyncImage src={item.url} className={`w-full h-full object-cover transition-opacity ${selectedGalleryItems.has(item.id) ? 'opacity-50' : 'opacity-100'}`} />
                                                
                                                {isPortfolioDeleteMode && (
                                                    <div className="absolute top-3 left-3 z-20">
                                                        <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${selectedGalleryItems.has(item.id) ? 'bg-red-500 border-red-500 shadow-lg scale-110' : 'bg-black/60 border-white/20'}`}>
                                                            {selectedGalleryItems.has(item.id) && (
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white" className="w-3.5 h-3.5">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {!isPortfolioDeleteMode && item.narrativeContent && (
                                                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 to-transparent group/diary">
                                                        <p className="text-[10px] text-gray-300 line-clamp-1 italic font-serif mb-2">「{item.narrativeContent}」</p>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setReadingDiary({ 
                                                                    name: portfolioModel.name, 
                                                                    content: item.narrativeContent || '',
                                                                    visualPrompt: item.visualPrompt,
                                                                    visualPromptZH: item.visualPromptZH
                                                                });
                                                            }}
                                                            className="text-[9px] text-[var(--color-gold)] font-bold uppercase tracking-widest opacity-0 group-hover/diary:opacity-100 transition-opacity bg-black/40 px-3 py-1 rounded-full border border-[var(--color-gold)]/30 hover:bg-[var(--color-gold)] hover:text-black"
                                                        >
                                                            📖 閱讀完整日記 (READ DIARY)
                                                        </button>
                                                    </div>
                                                )}
                                                {!isPortfolioDeleteMode && (
                                                    <div className="absolute top-3 right-3 flex gap-2">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setActivePortfolioItemId(item.id); }}
                                                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-black/60 hover:bg-[var(--color-gold)] text-white hover:text-black transition-all border border-white/10"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {!isPortfolioDeleteMode && (
                                                <ModelActionMenu 
                                                    model={portfolioModel}
                                                    imageUrl={item.url}
                                                    isOpen={activePortfolioItemId === item.id}
                                                    onClose={() => setActivePortfolioItemId(null)}
                                                    onModelSelect={(model, dest) => {
                                                        if (dest === 'narrative') {
                                                            setSelectedModelForNarrative(model);
                                                        } else {
                                                            onModelSelect(model, dest);
                                                        }
                                                    }}
                                                    isGalleryItem={true}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        /* MAIN MODELS LIST VIEW */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                            {models.map((model, index) => (
                                <div 
                                    key={model.id} 
                                    className="group relative glass-panel rounded-3xl overflow-hidden border border-white/5 transition-all duration-700 hover:-translate-y-2 hover:border-[var(--color-gold)]/50 hover:shadow-2xl"
                                >
                                    {/* Selection Checkbox */}
                                    <div className="absolute top-4 left-4 z-20">
                                        <label className="cursor-pointer">
                                            <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${selectedModels.has(model.id) ? 'bg-[var(--color-gold)] border-[var(--color-gold)]' : 'bg-black/40 border-white/10 hover:border-[var(--color-gold)]'}`}>
                                                <input
                                                    type="checkbox"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    checked={selectedModels.has(model.id)}
                                                    onChange={(e) => { e.stopPropagation(); toggleSelection(model.id); }}
                                                />
                                                {selectedModels.has(model.id) && (
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="black" className="w-3.5 h-3.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                                    </svg>
                                                )}
                                            </div>
                                        </label>
                                    </div>

                                    {/* Image & Click Area (Go to Hub) */}
                                    <div 
                                        className="aspect-[3/4] overflow-hidden bg-[var(--color-bg-surface)] cursor-pointer group"
                                        onClick={() => setViewingPortfolioModelId(model.id)}
                                    >
                                        <AsyncImage 
                                            src={model.imageUrl} 
                                            alt={model.name} 
                                            className="w-full h-full object-cover object-top transition-transform duration-1000 group-hover:scale-105" 
                                        />
                                        
                                        {/* Portfolio Hover State */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-6 text-center space-y-4">
                                            <div className="w-12 h-12 rounded-full border border-[var(--color-gold)] flex items-center justify-center text-[var(--color-gold)]">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                            </div>
                                            <p className="text-[11px] font-bold text-white uppercase tracking-[0.3em]">進入作品集總部 (Brand Hub)</p>
                                        </div>
                                    </div>

                                    {/* Info Strip */}
                                    <div className="p-5 bg-black/40 border-t border-white/5 flex justify-between items-center group/info">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-display font-bold text-white tracking-widest uppercase">{model.name}</span>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-[8px] px-1.5 py-0.5 bg-white/5 rounded-sm text-gray-500 uppercase tracking-tighter">{model.persona?.mbti || '??'}</span>
                                                <span className="text-[8px] px-1.5 py-0.5 bg-[var(--color-gold)]/10 rounded-sm text-[var(--color-gold)] uppercase tracking-tighter">{(model.gallery?.length || 0) + 1} 作品</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setActiveMenuId(model.id); }}
                                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-all text-gray-400 hover:text-white border border-white/5"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Action Menu Overlay */}
                                    <ModelActionMenu 
                                        model={model}
                                        isOpen={activeMenuId === model.id}
                                        onClose={() => setActiveMenuId(null)}
                                        onModelSelect={(model, dest) => {
                                            if (dest === 'narrative') {
                                                setSelectedModelForNarrative(model);
                                            } else {
                                                onModelSelect(model, dest);
                                            }
                                        }}
                                        onPromote={handlePromoteToAmbassador}
                                    />
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    <div className="glass-panel rounded-3xl p-20 flex flex-col items-center justify-center text-center border border-[var(--color-border)]">
                        <div className="w-24 h-24 rounded-full bg-[var(--color-bg-surface)] flex items-center justify-center mb-8 animate-pulse">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 text-[var(--color-text-dim)]">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-display font-bold uppercase tracking-[0.3em] text-[var(--color-text-main)] mb-4">您的模特兒休息室是空的</h3>
                        <p className="text-sm text-[var(--color-text-dim)] max-w-md leading-relaxed">請先至「模特兒生成」創建您的專屬模特兒。創建後，您可以在此管理並快速啟動其他創意流程。</p>
                        <Button onClick={() => onModelSelect({} as any, 'model_setup')} variant="primary" className="mt-10 text-[10px] font-bold tracking-widest">前往模特兒生成</Button>
                    </div>
                )}
            </main>

            {driveImportFolder && (
                <DriveFilePickerModal
                    isOpen={showDriveFilePicker}
                    onClose={() => {
                        setShowDriveFilePicker(false);
                        setDriveImportFolder(null);
                    }}
                    onConfirm={handleConfirmDriveImport}
                    folderId={driveImportFolder.id}
                    folderName={driveImportFolder.name}
                />
            )}
        </div>
    );

};

export default ModelLounge;
