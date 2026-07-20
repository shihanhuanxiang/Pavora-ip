import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Model, PortfolioItem } from '../../shared/types/types';
import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
import ImagePreviewModal from '../../shared/components/common/ImagePreviewModal';
import { useModelStore } from '../../shared/stores/useModelStore';
import { useBrandStore } from '../../shared/stores/useBrandStore';
import { STORY_ARCS } from '../narrative/constants/storyElements';
import AsyncImage from '../../shared/components/common/AsyncImage';
import PortfolioSelectModal from '../../components/PortfolioSelectModal';
import { User } from 'firebase/auth';
import { extractMetadataFromFile, hasPavoraMetadata, embedMetadata } from '../../shared/utils/metadataUtils';
import { downloadImage, cropImage, fileToBase64 } from '../../shared/utils/imageUtils';
import ManualCropModal from '../../shared/components/business/ManualCropModal';
import { detectMultiAngleLayout } from '../../shared/services/geminiService';
import { useNotification } from '../../shared/context/NotificationContext';
import { useAuth } from '../../shared/context/AuthContext';
import Loader from '../../shared/components/common/Loader';
import { checkGoogleDriveStatus, syncToGoogleDrive, getOrCreateDriveFolder } from '../../shared/services/googleDriveService';
import DriveFilePickerModal from '../../components/DriveFilePickerModal';

import ModelIdentityEditor from './ModelIdentityEditor';
import ModelActionMenu from './components/ModelActionMenu';

interface ModelLoungeProps {
  onGoHome: () => void;
  onModelSelect: (model: Model, destination: string) => void;
  isHubMode?: boolean;
  initialPortfolioModelId?: string | null;
  focusPortfolioAssets?: boolean;
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

const ModelLounge: React.FC<ModelLoungeProps> = ({ onGoHome, onModelSelect, isHubMode, initialPortfolioModelId, focusPortfolioAssets }) => {
  const { models, removeModels, addModel, updateModel, syncWithCloud } = useModelStore();
  const { addAmbassador, ambassadors } = useBrandStore();
  const { addNotification } = useNotification();
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [previewingImage, setPreviewingImage] = useState<{images: string[], startIndex: number} | null>(null);
  const [showPortfolioImport, setShowPortfolioImport] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [viewingPortfolioModelId, setViewingPortfolioModelId] = useState<string | null>(initialPortfolioModelId || null);
  const portfolioAssetsRef = useRef<HTMLDivElement | null>(null);
  
  const { user: currentUser, signInWithGoogle, signOutUser } = useAuth();
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
  const [isConsistencyView, setIsConsistencyView] = useState(false);
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
    if (initialPortfolioModelId) {
      setViewingPortfolioModelId(initialPortfolioModelId);
    }
  }, [initialPortfolioModelId]);

  useEffect(() => {
    if (!focusPortfolioAssets || !portfolioModel) return;
    const timer = window.setTimeout(() => {
      portfolioAssetsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [focusPortfolioAssets, portfolioModel?.id, portfolioModel?.gallery?.length]);

  useEffect(() => {
    if (currentUser) {
        syncWithCloud();
    }
  }, [currentUser, syncWithCloud]);

  useEffect(() => {
    checkGoogleDriveStatus().then(setDriveConnected);
  }, []);

  const handleLogin = async () => {
    try {
        await signInWithGoogle();
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
                addNotification({ type: 'success', message: `成功識別並載入模特兒: ${metadata.name}` });
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

  const handlePromoteToAmbassador = async (model: Model) => {
    if (ambassadors.length >= 5) {
      addNotification({ type: 'warning', message: '品牌代言人上限為 5 位，請先移除現有代言人。' });
      return;
    }

    const normalizedGenderRaw = (model.gender || '').toString().trim().toUpperCase();
    const normalizedGender: 'male' | 'female' | 'non-binary' =
      normalizedGenderRaw === 'M' || normalizedGenderRaw === 'MALE'
        ? 'male'
        : normalizedGenderRaw === 'F' || normalizedGenderRaw === 'FEMALE'
        ? 'female'
        : 'non-binary';

    await addAmbassador({
      id: `amb_${Date.now()}`,
      name: model.name,
      imageUrl: model.imageUrl,
      gender: normalizedGender,
      // TODO(P2): Model 型別尚無 ethnicity/bodyType 欄位，下游目前零消費；待資料模型補欄位後改讀 model 實際值（待 Hank 裁決是否新增欄位）
      ethnicity: 'Asian',
      // TODO(P2): Model 型別尚無 ethnicity/bodyType 欄位，下游目前零消費；待資料模型補欄位後改讀 model 實際值（待 Hank 裁決是否新增欄位）
      bodyType: 'Standard',
      createdAt: new Date().toISOString()
    });
    addNotification({ type: 'success', message: '已成功晉升為品牌代言人！' });
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
        <div className={`home-workbench min-h-screen font-sans pb-20 ${isHubMode ? 'pt-8' : ''}`}>
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
                            className="absolute inset-0 bg-black/50 backdrop-blur-md"
                            onClick={() => setReadingDiary(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg home-card rounded-3xl p-10 overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brass/10 blur-3xl -z-10"></div>
                            <h3 className="text-xl font-display font-bold text-wine tracking-[0.2em] mb-6 uppercase">
                                {readingDiary.name} 的靈魂敘事
                            </h3>
                            <div className="max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar space-y-6">
                                <div className="text-[var(--home-ink)] font-serif leading-relaxed text-base whitespace-pre-wrap border-l-2 border-brass/30 pl-6">
                                    {readingDiary.content}
                                </div>

                                {(readingDiary.visualPrompt || readingDiary.visualPromptZH) && (
                                    <div className="pt-6 border-t border-[var(--home-line)] space-y-6">
                                        <h4 className="text-[10px] font-bold text-[var(--home-muted)] uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-wine"></span>
                                            視覺轉化參數
                                        </h4>

                                        {readingDiary.visualPromptZH && (
                                            <div className="space-y-3">
                                                <div className="text-[8px] text-wine font-bold uppercase tracking-tighter opacity-70">中文敘事對齊</div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {readingDiary.visualPromptZH.split('\n').map((line, i) => {
                                                        const [key, ...val] = line.split(': ');
                                                        return (
                                                            <div key={i} className="home-card-sub p-3 flex gap-3 items-start">
                                                                <span className="text-[9px] font-bold text-wine/80 whitespace-nowrap pt-0.5">{key}</span>
                                                                <p className="text-[11px] text-[var(--home-muted)] leading-relaxed">{(val ?? []).join(': ')}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {readingDiary.visualPrompt && (
                                            <div className="space-y-3">
                                                <div className="text-[8px] text-steel font-bold uppercase tracking-tighter opacity-70">英文視覺指令</div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {readingDiary.visualPrompt.split('\n').map((line, i) => {
                                                        const [key, ...val] = line.split(': ');
                                                        return (
                                                            <div key={i} className="home-card-sub p-3 flex gap-3 items-start">
                                                                <span className="text-[9px] font-mono font-bold text-steel/80 whitespace-nowrap pt-0.5">{key}</span>
                                                                <p className="text-[10px] font-mono text-[var(--home-muted)] leading-relaxed">{(val ?? []).join(': ')}</p>
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
                                className="home-btn-primary w-full mt-10 py-4 text-xs font-bold tracking-[0.3em] uppercase"
                            >
                                關閉
                            </Button>
                        </motion.div>
                    </div>
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
                <div className="mf-subheader sticky top-[80px] z-30 px-6 py-4 mb-8">
                    <div className="max-w-[110rem] mx-auto flex justify-between items-center">
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-display font-bold uppercase tracking-[0.3em] text-[var(--home-ink)]">模特兒休息室</h2>
                        </div>
                        <div className="flex items-center gap-4">
                            {currentUser ? (
                                <div className="flex items-center gap-2 bg-ok/10 border border-ok/20 px-3 py-1 rounded-full">
                                    <div className="w-1.5 h-1.5 bg-ok rounded-full animate-pulse"></div>
                                    <span className="text-[10px] font-bold text-ok">{currentUser.displayName || '已登入'}</span>
                                    <button onClick={() => signOutUser()} className="text-[9px] text-[var(--home-muted)] hover:text-[var(--home-ink)] ml-2 transition-colors">登出</button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleLogin}
                                    className="home-btn-secondary px-4 py-1.5 rounded-full text-[10px] font-bold transition-all"
                                >
                                    連接雲端存檔
                                </button>
                            )}
                            {onGoHome && <Button onClick={onGoHome} variant="secondary" className="home-btn-secondary text-[10px] font-bold tracking-widest">返回首頁</Button>}
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-[110rem] mx-auto px-6 lg:px-12">
                {/* Toolbar */}
                <div className="home-card rounded-2xl p-4 mb-10 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative w-5 h-5 border border-[var(--home-line)] rounded flex items-center justify-center transition-all group-hover:border-wine">
                                <input
                                    type="checkbox"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    checked={models.length > 0 && selectedModels.size === models.length}
                                    onChange={handleSelectAll}
                                />
                                {models.length > 0 && selectedModels.size === models.length && (
                                    <div className="w-2.5 h-2.5 bg-wine rounded-sm"></div>
                                )}
                            </div>
                            <span className="text-[12px] font-bold uppercase tracking-widest text-[var(--home-muted)] group-hover:text-[var(--home-ink)] transition-colors">全選</span>
                        </label>

                        <div className="h-4 w-px bg-[var(--home-line)]"></div>

                        <span className="text-[12px] font-mono tracking-widest text-wine">
                            {selectedModels.size} / {models.length} 已選擇
                        </span>
                    </div>

                    <div className="flex gap-4">
                        <label className="cursor-pointer">
                            <input type="file" className="hidden" accept="image/*" onChange={handleManualUpload} />
                            <div className="px-6 py-2 bg-[rgba(255,255,255,.5)] border border-[var(--home-line)] rounded-xl text-[12px] font-bold tracking-widest text-[var(--home-ink)] hover:border-brass transition-all flex items-center gap-2">
                                手動上傳舊照片 (自動讀取)
                            </div>
                        </label>
                        <Button
                            onClick={() => setShowPortfolioImport(true)}
                            variant="primary"
                            className="home-btn-primary text-[10px] font-bold tracking-widest"
                        >
                            從作品集錦匯入
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={selectedModels.size === 0}
                            variant="secondary"
                            className="text-[10px] font-bold tracking-widest text-danger disabled:opacity-30"
                            style={{ background: 'rgba(155,61,54,0.1)', borderColor: 'rgba(155,61,54,0.3)' }}
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
                            className="space-y-5"
                        >
                            {/* Portfolio Header */}
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="w-1/4 aspect-[3/4] rounded-3xl overflow-hidden border border-[var(--home-line)]">
                                    <AsyncImage src={portfolioModel.imageUrl} className="w-full h-full object-cover" />
                                </div>
                                    <div className="flex-1 space-y-5 pt-2">
                                        <div>
                                            <button
                                                onClick={() => setViewingPortfolioModelId(null)}
                                                className="text-[12px] text-wine font-bold tracking-widest uppercase mb-3 flex items-center gap-2 hover:underline"
                                            >
                                                ← 返回模特兒清單
                                            </button>
                                            <h1 className="text-4xl font-display font-bold tracking-widest text-[var(--home-ink)] uppercase">{portfolioModel.name}</h1>
                                            <div className="flex items-center justify-between mt-4 gap-4 flex-wrap">
                                                <div className="flex gap-3">
                                                    <span className="px-4 py-1.5 bg-wine/10 border border-wine/20 rounded-full text-[12px] font-bold text-wine uppercase">
                                                        MBTI: {portfolioModel.persona?.mbti || 'N/A'}
                                                    </span>
                                                    <span className="px-4 py-1.5 bg-[rgba(255,255,255,.5)] border border-[var(--home-line)] rounded-full text-[12px] font-bold text-[var(--home-muted)] uppercase">
                                                        調性：{portfolioModel.persona?.coreVibe || '專業'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {isPortfolioDeleteMode ? (
                                                        <>
                                                            <Button
                                                                onClick={handleDeleteGalleryItems}
                                                                disabled={selectedGalleryItems.size === 0}
                                                                variant="secondary"
                                                                className="px-6 py-3 text-[10px] tracking-widest disabled:opacity-30"
                                                                style={{ background: 'var(--color-danger)', borderColor: 'var(--color-danger)', color: '#fffaf2' }}
                                                            >
                                                                確定刪除 ({selectedGalleryItems.size})
                                                            </Button>
                                                            <Button onClick={() => { setIsPortfolioDeleteMode(false); setSelectedGalleryItems(new Set()); }} variant="secondary" className="home-btn-secondary px-6 py-3 text-[10px] tracking-widest">
                                                                取消
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <button
                                                                onClick={() => setIsConsistencyView(v => !v)}
                                                                title={isConsistencyView ? '離開一致性預覽' : '一致性預覽'}
                                                                className={`h-10 px-3 rounded-lg border text-[11px] font-bold whitespace-nowrap transition-all ${isConsistencyView ? 'text-steel' : 'text-[var(--home-muted)] hover:text-[var(--home-ink)]'}`}
                                                                style={isConsistencyView
                                                                    ? { background: 'rgba(70,90,112,0.14)', borderColor: 'rgba(70,90,112,0.4)' }
                                                                    : { background: 'rgba(255,255,255,.5)', borderColor: 'var(--home-line)' }}
                                                            >
                                                                {isConsistencyView ? '離開預覽' : '一致性預覽'}
                                                            </button>
                                                            <button
                                                                onClick={() => setIsPortfolioDeleteMode(true)}
                                                                className="h-10 px-3 rounded-lg border text-[11px] font-bold whitespace-nowrap text-[var(--home-muted)] hover:text-danger transition-all"
                                                                style={{ background: 'rgba(255,255,255,.5)', borderColor: 'var(--home-line)' }}
                                                            >
                                                                批量刪除
                                                            </button>
                                                            {driveConnected && (
                                                                <>
                                                                    <button
                                                                        onClick={handleSyncGalleryToDrive}
                                                                        disabled={isDriveSyncing}
                                                                        className="h-10 px-3 rounded-lg border text-[11px] font-bold whitespace-nowrap text-steel transition-all disabled:opacity-30"
                                                                        style={{ background: 'rgba(255,255,255,.5)', borderColor: 'var(--home-line)' }}
                                                                    >
                                                                        {isDriveSyncing ? '同步中...' : '同步到 Drive'}
                                                                    </button>
                                                                    <button
                                                                        onClick={handleOpenDriveImport}
                                                                        disabled={isDriveImporting}
                                                                        className="h-10 px-3 rounded-lg border text-[11px] font-bold whitespace-nowrap text-[var(--home-muted)] hover:text-[var(--home-ink)] transition-all disabled:opacity-30"
                                                                        style={{ background: 'rgba(255,255,255,.5)', borderColor: 'var(--home-line)' }}
                                                                    >
                                                                        {isDriveImporting ? '匯入中...' : '從 Drive 匯入'}
                                                                    </button>
                                                                </>
                                                            )}
                                                            <Button onClick={() => setEditingModel(portfolioModel)} variant="secondary" className="home-btn-secondary h-10 px-3 text-[9px] font-bold whitespace-nowrap tracking-normal">
                                                                編輯身份
                                                            </Button>
                                                            <Button onClick={() => onModelSelect(portfolioModel, 'narrative')} className="home-btn-primary h-10 px-4 text-[9px] font-bold whitespace-nowrap tracking-normal">
                                                                啟動靈魂敘事
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    
                                        <div className="flex items-start p-4 bg-[rgba(255,255,255,.5)] rounded-xl border border-[var(--home-line)] divide-x divide-[var(--home-line)]">
                                            <div className="pr-4 shrink-0 text-center min-w-[56px]">
                                                <p className="text-[12px] text-[var(--home-muted)] uppercase font-bold tracking-widest mb-1">作品數量</p>
                                                <p className="text-[26px] text-[var(--home-ink)] font-mono">{(portfolioModel.gallery?.length || 0) + 1}</p>
                                            </div>
                                            <div className="flex-1 px-4">
                                                <p className="text-[12px] text-[var(--home-muted)] uppercase font-bold tracking-widest mb-1.5">主體情緒</p>
                                                <p className="text-[15px] text-[var(--home-ink)] leading-relaxed">{portfolioModel.persona?.toneOfVoice || '自然'}</p>
                                            </div>
                                            <div className="pl-4 shrink-0 text-right min-w-[120px]">
                                                <p className="text-[12px] text-[var(--home-muted)] uppercase font-bold tracking-widest mb-1">三圍 / 身高</p>
                                                <p className="text-[14px] text-[var(--home-muted)] font-mono whitespace-nowrap">
                                                    {portfolioModel.stats?.bust}-{portfolioModel.stats?.waist}-{portfolioModel.stats?.hip} // {portfolioModel.stats?.height}cm
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-stretch gap-2">
                                            {/* UX-INLINE: 內容比例 + IP完整度 → 單行摘要 */}
                                            {(() => {
                                            const gallery = portfolioModel.gallery || [];
                                            const lifestyle = gallery.filter((i: any) => i.contentCategory === 'lifestyle').length;
                                            const curve = gallery.filter((i: any) => i.contentCategory === 'curve').length;
                                            const drama = gallery.filter((i: any) => i.contentCategory === 'drama').length;
                                            const total = lifestyle + curve + drama;
                                            const desc = portfolioModel.persona?.locked_descriptor || '';
                                            const faceCount = (portfolioModel.preferences?.face_reference_urls || []).filter(Boolean).length;
                                            const hasArc = !!portfolioModel.preferences?.active_arc_id;
                                            const ratioOk = total === 0 ? null : (() => {
                                                const pcts = [lifestyle/total*100, curve/total*100, drama/total*100];
                                                const targets = [50, 30, 20];
                                                return pcts.every((p, i) => Math.abs(p - targets[i]) < 15);
                                            })();
                                            return (
                                                <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 bg-[rgba(255,255,255,.5)] rounded-lg border border-[var(--home-line)] text-[11px]">
                                                    {total > 0 && (
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className="text-[var(--home-muted)] uppercase tracking-wider font-bold">比例</span>
                                                            {[{label:'生活', count:lifestyle, color:'bg-steel'},{label:'曲線', count:curve, color:'bg-wine'},{label:'戲劇', count:drama, color:'bg-sage'}].map(({label, count, color}) => (
                                                                <div key={label} className="flex items-center gap-1">
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${color} shrink-0`}></span>
                                                                    <span className="text-[var(--home-muted)]">{label} <span className="text-[var(--home-ink)] font-bold">{Math.round(count/total*100)}%</span></span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="text-[var(--home-muted)] uppercase tracking-wider font-bold">IP</span>
                                                        <span title="人格描述" className={desc.length > 20 ? 'text-ok' : desc.length > 0 ? 'text-brass' : 'text-danger'}>{desc.length > 20 ? '✓' : desc.length > 0 ? '!' : '✗'}</span>
                                                        <span title="臉部參考圖" className={faceCount >= 4 ? 'text-ok' : faceCount > 0 ? 'text-brass' : 'text-danger'}>{faceCount >= 4 ? '✓' : faceCount > 0 ? '!' : '✗'} 臉部</span>
                                                        {ratioOk !== null && <span title="內容比例" className={ratioOk ? 'text-ok' : 'text-brass'}>{ratioOk ? '✓' : '!'} 比例</span>}
                                                        <span title="故事線" className={hasArc ? 'text-ok' : 'text-[var(--home-muted)]'}>{hasArc ? '✓' : '—'} 故事</span>
                                                    </div>
                                                </div>
                                            );
                                        })() }
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
                                                    <div className="shrink-0 p-6 bg-[rgba(255,255,255,.5)] rounded-2xl border border-[var(--home-line)] border-dashed flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--home-muted)]"></div>
                                                            <p className="text-[12px] text-[var(--home-muted)] uppercase tracking-widest font-black">尚無進行中的故事線</p>
                                                        </div>
                                                        <button
                                                            onClick={() => onModelSelect(portfolioModel, 'narrative')}
                                                            className="text-[11px] text-wine font-bold uppercase tracking-widest hover:underline"
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
                                                <div className="shrink-0 home-card p-6 space-y-5 relative overflow-hidden group/arc">
                                                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-brass/10 blur-3xl rounded-full group-hover/arc:bg-brass/20 transition-all duration-700"></div>

                                                    <div className="flex justify-between items-center relative z-10">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-wine animate-pulse"></div>
                                                            <h4 className="text-[12px] font-black text-wine uppercase tracking-[0.4em]">核心故事進度</h4>
                                                        </div>
                                                        <div className="px-3 py-1 bg-[rgba(255,255,255,.5)] border border-[var(--home-line)] rounded-full">
                                                            <span className="text-[11px] text-[var(--home-muted)] font-black uppercase tracking-tighter mr-2">里程碑</span>
                                                            <span className="text-[11px] text-[var(--home-ink)] font-black">{currentPhaseIdx + 1} / {totalPhases}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                                                        <div className="flex-1 space-y-3">
                                                            <div className="space-y-1">
                                                                <h5 className="text-[22px] font-black text-[var(--home-ink)] tracking-tight uppercase leading-none">{activeArc.name_zh}</h5>
                                                                <p className="text-[11px] text-[var(--home-muted)] font-bold tracking-widest uppercase opacity-70">{activeArc.arc_id}</p>
                                                            </div>
                                                            <div className="h-2 w-full bg-[rgba(255,255,255,.5)] rounded-full overflow-hidden border border-[var(--home-line)]">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-wine to-brass transition-all duration-1000 ease-out"
                                                                    style={{ width: `${progress}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <Button
                                                            onClick={() => onModelSelect(portfolioModel, 'narrative')}
                                                            className="home-btn-primary px-8 py-3 text-[12px] font-black tracking-[0.2em]"
                                                        >
                                                            繼續故事線
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        <div className="shrink-0 flex items-center justify-between px-4 py-3 rounded-2xl border border-brass/20 bg-brass/5">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-brass">臉部基準圖</span>
                                                <span className="text-[11px] text-[var(--home-muted)]">{faceReferenceCount}/4 已設定</span>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${faceReferenceCount >= 2 ? 'border-ok/30 bg-ok/10 text-ok' : 'border-[var(--home-line)] bg-[rgba(255,255,255,.5)] text-[var(--home-muted)]'}`}>
                                                {faceReferenceCount >= 2 ? '已就緒' : '尚未設定'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                            {/* Assets Grid */}
                            <div ref={portfolioAssetsRef} className="space-y-6">
                                <div className="flex items-center justify-between border-b border-[var(--home-line)] pb-4">
                                    <h3 className="text-[13px] font-bold text-[var(--home-ink)] uppercase tracking-[0.4em]">
                                        {isConsistencyView ? '臉部一致性預覽' : '模特兒作品集與衍生資產'}
                                    </h3>
                                    {isConsistencyView && (
                                        <span className="text-[11px] text-steel font-bold uppercase tracking-widest">
                                            最近 {Math.min((portfolioModel.gallery || []).length, 6)} 張並排 · 確認臉型辨識度
                                        </span>
                                    )}
                                </div>

                                {/* 一致性預覽模式 */}
                                {isConsistencyView ? (
                                    (() => {
                                        const last6 = (portfolioModel.gallery || []).slice(0, 6);
                                        if (last6.length === 0) return (
                                            <p className="text-[12px] text-[var(--home-muted)] text-center py-12">作品集尚無內容，請先生成靈魂敘事圖片</p>
                                        );
                                        return (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-3 gap-3">
                                                    {last6.map((item, idx) => (
                                                        <div key={item.id} className="relative rounded-2xl overflow-hidden border border-[var(--home-line)] hover:border-steel/40 transition-all group/ci">
                                                            <div
                                                                className="aspect-square cursor-pointer"
                                                                onClick={() => setPreviewingImage({ images: last6.map((g: any) => g.url), startIndex: idx })}
                                                            >
                                                                <AsyncImage
                                                                    src={item.url}
                                                                    className="w-full h-full object-cover object-top group-hover/ci:scale-105 transition-transform duration-500"
                                                                />
                                                            </div>
                                                            <div className="absolute bottom-0 inset-x-0 px-2 py-1.5 bg-black/70 text-[10px] text-gray-300 text-center font-mono">
                                                                #{(portfolioModel.gallery?.length || 0) - idx}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-[11px] text-[var(--home-muted)] text-center">點擊可放大 · 並排比對臉型、髮型、膚色是否飄移</p>
                                            </div>
                                        );
                                    })()
                                ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {/* Original Image */}
                                    <div className="group relative home-card home-card-accent rounded-2xl overflow-hidden">
                                        <div className="aspect-[3/4]">
                                            {/* 臉部基準圖 2x2 Grid */}
                                            <div className="w-full h-full grid grid-cols-2 gap-0.5 bg-black/40 p-1">
                                                {[
                                                    { id: 'front', label: '正面', index: 0 },
                                                    { id: 'side', label: '側面', index: 1 },
                                                    { id: 'angle45', label: '45°', index: 2 },
                                                    { id: 'back', label: '背面', index: 3 }
                                                ].map(slot => {
                                                    const url = (portfolioModel.preferences?.face_reference_urls || [])[slot.index];
                                                    return (
                                                        <div
                                                            key={slot.id}
                                                            onClick={() => document.getElementById(`face-ref-${portfolioModel.id}-${slot.id}`)?.click()}
                                                            className="relative overflow-hidden rounded-sm cursor-pointer
                                                                bg-black/60 border border-white/5 hover:border-brass/50
                                                                transition-all group/slot flex items-center justify-center"
                                                        >
                                                            {url ? (
                                                                <>
                                                                    <img
                                                                        src={url.startsWith('drive://') ? `/api/drive/image/${url.replace('drive://', '')}` : url}
                                                                        className="w-full h-full object-cover"
                                                                        alt={slot.label}
                                                                    />
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
                                                                            className="px-2 py-0.5 text-white
                                                                                text-[7px] font-black rounded-full"
                                                                            style={{ background: 'rgba(155,61,54,0.85)' }}
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
                                                        ? 'bg-brass/20 text-brass animate-pulse'
                                                        : 'bg-black/60 text-gray-400 hover:bg-brass/20 hover:text-brass'
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
                                        <div className="absolute top-3 left-3 px-2 py-1 bg-brass rounded text-[8px] font-bold text-black uppercase tracking-widest">
                                            臉部基準圖
                                        </div>
                                    </div>
                                    
                                    {/* Gallery Items */}
                                    {portfolioModel.gallery?.map((item, idx) => (
                                        <div key={item.id} className="group relative home-card rounded-2xl overflow-hidden transition-all">
                                            {selectedGalleryItems.has(item.id) && (
                                                <div className="absolute inset-0 rounded-2xl pointer-events-none z-10" style={{ boxShadow: '0 0 0 2px var(--color-danger)' }}></div>
                                            )}
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
                                                        <div
                                                            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${selectedGalleryItems.has(item.id) ? 'scale-110' : 'bg-black/60 border-white/20'}`}
                                                            style={selectedGalleryItems.has(item.id) ? { background: 'var(--color-danger)', borderColor: 'var(--color-danger)' } : undefined}
                                                        >
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
                                                        <p className="text-[12px] text-gray-300 font-serif mb-2">「{item.narrativeContent}」</p>
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
                                                            className="text-[11px] text-brass font-bold uppercase tracking-widest opacity-0 group-hover/diary:opacity-100 transition-opacity bg-black/40 px-3 py-1 rounded-full border border-brass/30 hover:text-white"
                                                        >
                                                            閱讀完整日記
                                                        </button>
                                                    </div>
                                                )}
                                                {!isPortfolioDeleteMode && (
                                                    <div className="absolute top-3 right-3 flex gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setActivePortfolioItemId(item.id); }}
                                                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-black/60 text-white hover:text-brass transition-all border border-white/10"
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
                                                        onModelSelect(model, dest);
                                                    }}
                                                    isGalleryItem={true}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        /* MAIN MODELS LIST VIEW */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                            {models.map((model, index) => (
                                <div
                                    key={model.id}
                                    className="group relative home-card rounded-3xl overflow-hidden transition-all duration-700 hover:-translate-y-2"
                                >
                                    {/* Selection Checkbox */}
                                    <div className="absolute top-4 left-4 z-20">
                                        <label className="cursor-pointer">
                                            <div
                                                className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${selectedModels.has(model.id) ? '' : 'bg-black/40 border-white/10 hover:border-brass'}`}
                                                style={selectedModels.has(model.id) ? { background: 'var(--color-wine)', borderColor: 'var(--color-wine)' } : undefined}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    checked={selectedModels.has(model.id)}
                                                    onChange={(e) => { e.stopPropagation(); toggleSelection(model.id); }}
                                                />
                                                {selectedModels.has(model.id) && (
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white" className="w-3.5 h-3.5">
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
                                            <div className="w-12 h-12 rounded-full border border-brass flex items-center justify-center text-brass">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                            </div>
                                            <p className="text-[11px] font-bold text-white uppercase tracking-[0.3em]">進入作品集總部</p>
                                        </div>
                                    </div>

                                    {/* Info Strip */}
                                    <div className="p-5 bg-[rgba(255,255,255,.6)] border-t border-[var(--home-line)] flex justify-between items-center group/info">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-display font-bold text-[var(--home-ink)] tracking-widest uppercase">{model.name}</span>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-[8px] px-1.5 py-0.5 bg-[rgba(255,255,255,.6)] rounded-sm text-[var(--home-muted)] uppercase tracking-tighter">{model.persona?.mbti || '??'}</span>
                                                <span className="text-[8px] px-1.5 py-0.5 bg-brass/10 rounded-sm text-brass uppercase tracking-tighter">{(model.gallery?.length || 0) + 1} 作品</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setActiveMenuId(model.id); }}
                                                className="w-8 h-8 flex items-center justify-center rounded-xl transition-all text-[var(--home-muted)] hover:text-[var(--home-ink)]"
                                                style={{ background: 'rgba(255,255,255,.5)', border: '1px solid var(--home-line)' }}
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
                                            onModelSelect(model, dest);
                                        }}
                                        onPromote={handlePromoteToAmbassador}
                                    />
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    <div className="home-card rounded-3xl p-20 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 rounded-full bg-[var(--home-paper-2)] flex items-center justify-center mb-8 animate-pulse">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 text-[var(--home-muted)]">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-display font-bold uppercase tracking-[0.3em] text-[var(--home-ink)] mb-4">您的模特兒休息室是空的</h3>
                        <p className="text-sm text-[var(--home-muted)] max-w-md leading-relaxed">請先至「模特兒生成」創建您的專屬模特兒。創建後，您可以在此管理並快速啟動其他創意流程。</p>
                                                <Button onClick={() => onModelSelect({} as any, 'model_setup')} variant="primary" className="home-btn-primary mt-10 text-[10px] font-bold tracking-widest">前往模特兒生成</Button>
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
