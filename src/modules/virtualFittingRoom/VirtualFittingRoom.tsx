
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { applyApparel, restoreIdentity, refineGarmentDetails, applyMultiAngleMatrix } from './services/fittingService';
import { 
    fileToBase64, 
    getFriendlyErrorMessage, 
    transformImage, 
    imageUrlToimageData, 
    confirmPaidFeature,
    detectMultiAngleLayout
} from '../../shared/services/geminiService';
import { downloadImage, cropImage, stitchImages } from '../../shared/utils/imageUtils';
import { useModelStore } from '../../shared/stores/useModelStore';
import ManualCropModal from '../../shared/components/business/ManualCropModal';
import type { StoredApparelItem, TaxonomyEntry, ApparelMainCategory } from '../../shared/types/types';
import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
import Loader from '../../shared/components/common/Loader';
import PhotoIcon from '../../shared/assets/icons/PhotoIcon';
import ImagePreviewModal from '../../shared/components/common/ImagePreviewModal';
import { useHistoryState } from '../../shared/hooks/useHistoryState';
import ImageCompareSlider from '../../shared/components/common/ImageCompareSlider';
import { useTaxonomy } from '../../shared/hooks/useTaxonomy';
import Select from '../../shared/components/common/Select';
import FittingRoomIcon from '../../shared/assets/icons/FittingRoomIcon'; 
import View360Icon from '../../shared/assets/icons/View360Icon'; 
import { autoFaceCrop } from '../../shared/utils/vision/faceCrop';
import SparklesIcon from '../../shared/assets/icons/SparklesIcon';
import { useBrandStore } from '../../shared/stores/useBrandStore';
import AsyncImage from '../../shared/components/common/AsyncImage';

interface VirtualFittingRoomProps {
  onGoBack?: () => void;
  onGoHome?: () => void;
  onAdvancedEdit?: (imageUrl: string, destination: string) => void;
  initialImage?: { url: string; fileData: { data: string; mimeType: string; } } | null;
  masterTaxonomy?: TaxonomyEntry[];
  apparelStructure?: ApparelMainCategory[];
}

type QualityLevel = 'standard' | 'high' | 'ultra';
type AspectRatio = '9:16' | '3:4' | '1:1' | '4:3' | '16:9';

interface AngleSlot {
    id: string;
    label: string;
    url: string | null;
    fileData: { data: string; mimeType: string } | null;
    status: 'idle' | 'processing' | 'completed' | 'error';
    cropBox?: [number, number, number, number];
}

const MODEL_ANGLES = [
    { id: 'front', label: '正面 (Front)' },
    { id: 'side', label: '側面 (Side)' },
    { id: 'angle', label: '45度角 (45°)' },
    { id: 'back', label: '背面 (Back)' },
];

const APPAREL_ANGLES = [
    { id: 'front', label: '正面 (Front)' },
    { id: 'back', label: '背面 (Back)' },
    { id: 'angle', label: '45度角 (45°)' },
    { id: 'detail', label: '特寫/側面 (Detail)' },
];

const VTO_MAIN_CATEGORIES = [
    { id: 'tops', name: '上衣', icon: '👕', keywords: ['tops', '上身', '衣', '衫'] },
    { id: 'bottoms', name: '褲/裙', icon: '👖', keywords: ['bottoms', '下身', '褲', '裙'] },
    { id: 'outerwear', name: '外套', icon: '🧥', keywords: ['outerwear', '外套', '夾克'] },
    { id: 'one-piece', name: '套裝/洋裝', icon: '👗', keywords: ['dresses', 'jumpsuits', 'sets', '洋裝', '連身', '套裝'] },
    { id: 'bags', name: '包/袋', icon: '👜', keywords: ['bags', '包', '袋'] },
    { id: 'shoes', name: '鞋子', icon: '👟', keywords: ['footwear', '鞋'] },
    { id: 'accessories', name: '帽子/眼鏡', icon: '👓', keywords: ['headwear', 'jewelry', 'accessories', '帽', '鏡', '飾'] },
];

import SimpleVTOCategorySelector from '../../shared/components/business/SimpleVTOCategorySelector';

const VirtualFittingRoom: React.FC<VirtualFittingRoomProps> = ({ 
    onGoBack, 
    onGoHome, 
    onAdvancedEdit, 
    initialImage, 
    masterTaxonomy: propTaxonomy, 
    apparelStructure: propStructure 
}) => {
    const { masterTaxonomy: hookTaxonomy, apparelStructure: hookStructure, loading: taxonomyLoading } = useTaxonomy();
    const masterTaxonomy = propTaxonomy || hookTaxonomy;
    const apparelStructure = propStructure || hookStructure;

    const [baseImage, setBaseImage] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(null);
    const [faceAnchor, setFaceAnchor] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(null);
    const [masterModelImage, setMasterModelImage] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(null);
    
    // Multi-Angle Matrix State
    const [isAdvancedMode, setIsAdvancedMode] = useState(false);
    const [modelMatrix, setModelMatrix] = useState<Record<string, AngleSlot>>(
        MODEL_ANGLES.reduce((acc, angle) => ({ ...acc, [angle.id]: { ...angle, url: null, fileData: null, status: 'idle' } }), {})
    );
    const [apparelMatrix, setApparelMatrix] = useState<Record<string, AngleSlot>>(
        APPAREL_ANGLES.reduce((acc, angle) => ({ ...acc, [angle.id]: { ...angle, url: null, fileData: null, status: 'idle' } }), {})
    );
    
    const {
        state: matrixResults,
        setState: setMatrixResults,
        undo: undoMatrix,
        redo: redoMatrix,
        canUndo: canUndoMatrix,
        canRedo: canRedoMatrix,
        reset: resetMatrixHistory,
        history: matrixHistory,
        cursor: matrixCursor
    } = useHistoryState<Record<string, string | null>>({ 
        initial: MODEL_ANGLES.reduce((acc, angle) => ({ ...acc, [angle.id]: null }), {}),
        max: 10 
    });

    const [matrixProgress, setMatrixProgress] = useState<Record<string, string>>(
        MODEL_ANGLES.reduce((acc, angle) => ({ ...acc, [angle.id]: '' }), {})
    );
    const [isCompareMode, setIsCompareMode] = useState(false);
    const [globalSliderPosition, setGlobalSliderPosition] = useState(50);

    // Crop System State
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [cropSourceImage, setCropSourceImage] = useState<{ url: string; fileData: { data: string; mimeType: string } } | null>(null);
    const [detectedBoxes, setDetectedBoxes] = useState<any[]>([]);

    const [targetAspectRatio, setTargetAspectRatio] = useState<AspectRatio>("9:16");
    
    const [affectedCategories, setAffectedCategories] = useState<Set<string>>(new Set());

    const {
        state: generatedLook,
        setState: setGeneratedLook,
        undo,
        redo,
        canUndo,
        canRedo,
        reset: resetHistory,
        history,
        cursor
    } = useHistoryState<string | null>({ initial: null, max: 10 });
    
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    
    const [previewingImage, setPreviewingImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const baseImageInputRef = useRef<HTMLInputElement>(null);
    const faceAnchorInputRef = useRef<HTMLInputElement>(null);
    const apparelSectionRef = useRef<HTMLDivElement>(null);
    const [selectedVtoCategory, setSelectedVtoCategory] = useState<string | null>(null);
    // T13: 快速模式檔案上傳的待套用分類。存 ref 而非閉包——舊寫法在點分類當下賦值
    // input.onchange，閉包抓到過期的 handleApplyApparel（baseImage=null），造成
    // 「先點分類→後傳模特→選服飾」誤報「請先選擇或上傳一位模特兒」。
    const pendingVtoCategoryRef = useRef<{ category: string; subCategory?: string } | null>(null);
    
    const [quality, setQuality] = useState<QualityLevel>('standard');
    const [restorationModel, setRestorationModel] = useState<'flash' | 'pro'>('pro');
    const [lastApparelImage, setLastApparelImage] = useState<{ data: string; mimeType: string } | null>(null);
    
    const [mobileTab, setMobileTab] = useState<'settings' | 'preview'>('settings');
    const [zoom, setZoom] = useState(1);
    const [wardrobe, setWardrobe] = useState<{ id: string; url: string; fileData: { data: string; mimeType: string }; category: string }[]>([]);
    const [activeLayers, setActiveLayers] = useState<{ id: string; category: string; url: string }[]>([]);
    const [tuckStatus, setTuckStatus] = useState<'tucked' | 'untucked'>('untucked');
    const [lightingPreset, setLightingPreset] = useState<string>('original');
    const [isGhostMode, setIsGhostMode] = useState(false);

    const { ambassadors, activeAmbassadorId, setActiveAmbassador } = useBrandStore();
    const activeAmbassador = useMemo(() => ambassadors.find(a => a.id === activeAmbassadorId), [ambassadors, activeAmbassadorId]);

    // Collapsible Sections State
    const [openSections, setOpenSections] = useState<Set<string>>(new Set(['model', 'apparel', 'settings']));

    const toggleSection = (sectionId: string) => {
        setOpenSections(prev => {
            const next = new Set(prev);
            if (next.has(sectionId)) next.delete(sectionId);
            else next.add(sectionId);
            return next;
        });
    };

    const analyzeAndLockModel = useCallback(async (imgObj: { url: string; fileData: { data: string; mimeType: string; } }) => {
        setIsLoading(true);
        setLoadingMessage('正在執行 AI 身份鎖定與比例分析...');
        try {
            setBaseImage(imgObj);
            const img = new Image();
            // 使用 base64 數據而不是原始 URL，以確保能正確解碼（特別是 idb:// URL）
            img.src = `data:${imgObj.fileData.mimeType};base64,${imgObj.fileData.data}`;
            await img.decode();
            const ratio = img.naturalWidth / img.naturalHeight;
            if (ratio > 1.2) setTargetAspectRatio("16:9");
            else if (ratio > 0.8) setTargetAspectRatio("1:1");
            else if (ratio > 0.6) setTargetAspectRatio("3:4");
            else setTargetAspectRatio("9:16");

            const cropData = await autoFaceCrop(imgObj.fileData);
            const cropUrl = `data:${cropData.mimeType};base64,${cropData.data}`;
            setFaceAnchor({ url: cropUrl, fileData: cropData });
            resetHistory(null);
            setAffectedCategories(new Set());
        } catch (err) {
            console.error("Identity Lock failed:", err);
            setError(`身份鎖定失敗：${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsLoading(false);
        }
    }, [resetHistory]);

    useEffect(() => {
        if (initialImage && !baseImage) {
            analyzeAndLockModel(initialImage);
        }
    }, [initialImage, baseImage, analyzeAndLockModel]);

    const handleBaseImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            fileToBase64(file).then(fileData => {
                const url = URL.createObjectURL(file);
                analyzeAndLockModel({ url, fileData });
            });
        }
    };

    const handleModelSlotUpload = async (angleId: string, event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const fileData = await fileToBase64(file);
            const url = URL.createObjectURL(file);
            
            if (isAdvancedMode && angleId === 'front') {
                // Trigger Auto-Detection for multi-angle image
                setCropSourceImage({ url, fileData });
                setMasterModelImage({ url, fileData });
                setIsLoading(true);
                setLoadingMessage('正在分析多角度佈局...');
                try {
                    const boxes = await detectMultiAngleLayout(fileData);
                    // Even if 1 box is detected, we open the modal for the user to confirm/adjust
                    setDetectedBoxes(boxes.map((b: any, i: number) => ({ ...b, id: `auto-${i}` })));
                    setIsCropModalOpen(true);
                } catch (e) {
                    console.error("Auto-detection failed", e);
                    // Fallback: open modal with empty boxes or just set as front
                    setDetectedBoxes([]);
                    setIsCropModalOpen(true);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setModelMatrix(prev => ({
                    ...prev,
                    [angleId]: { ...prev[angleId], url, fileData, status: 'idle' }
                }));
            }
            
            // If this is the first one, also set as baseImage for legacy compatibility
            if (!baseImage && angleId === 'front') {
                analyzeAndLockModel({ url, fileData });
            }
        }
    };

    const handleDeleteModelSlot = (angleId: string) => {
        setModelMatrix(prev => ({
            ...prev,
            [angleId]: { ...prev[angleId], url: null, fileData: null, status: 'idle' }
        }));
        if (angleId === 'front') {
            setBaseImage(null);
            setFaceAnchor(null);
            setMasterModelImage(null);
        }
    };

    const handleClearModelMatrix = () => {
        setModelMatrix(MODEL_ANGLES.reduce((acc, angle) => ({ ...acc, [angle.id]: { ...angle, url: null, fileData: null, status: 'idle' } }), {}));
        setBaseImage(null);
        setFaceAnchor(null);
        setMasterModelImage(null);
    };

    const handleManualCropSave = async (boxes: any[]) => {
        if (!cropSourceImage) return;
        
        setIsLoading(true);
        setIsCropModalOpen(false);
        
        try {
            const newMatrix = { ...modelMatrix };
            for (const box of boxes) {
                const cropped = await cropImage(cropSourceImage.fileData, box.box_2d);
                const url = URL.createObjectURL(new Blob([Uint8Array.from(atob(cropped.data), c => c.charCodeAt(0))], { type: cropped.mimeType }));
                
                if (newMatrix[box.angle]) {
                    newMatrix[box.angle] = {
                        ...newMatrix[box.angle],
                        url,
                        fileData: cropped,
                        status: 'idle',
                        cropBox: box.box_2d
                    };
                }
            }
            setModelMatrix(newMatrix);
        } catch (e) {
            console.error("Cropping failed", e);
        } finally {
            setIsLoading(false);
            // We keep cropSourceImage if it's the master image
            setDetectedBoxes([]);
        }
    };

    const handleMatrixGenerate = async () => {
        if (!isAdvancedMode) return;
        
        const activeAngles = MODEL_ANGLES.filter(a => modelMatrix[a.id].url);
        if (activeAngles.length === 0) return;

        setIsLoading(true);
        setLoadingMessage('正在啟動多角度矩陣生成引擎...');
        
        // Reset progress
        setMatrixProgress(MODEL_ANGLES.reduce((acc, angle) => ({ ...acc, [angle.id]: '' }), {}));

        try {
            const matrixData = activeAngles.map(a => ({
                angleId: a.id,
                // Use existing result as base if available, otherwise use original model image
                modelImage: { 
                    url: matrixResults[a.id] || modelMatrix[a.id].url!, 
                    fileData: modelMatrix[a.id].fileData! 
                },
                apparelImage: apparelMatrix[a.id]?.fileData || apparelMatrix['front']?.fileData || null
            }));

            const results = await applyMultiAngleMatrix(
                matrixData,
                selectedVtoCategory || 'tops',
                (angleId, msg) => {
                    setMatrixProgress(prev => ({ ...prev, [angleId]: msg }));
                },
                { usePro: true }
            );

            setMatrixResults(prev => ({
                ...prev,
                ...results
            }));
            setLoadingMessage('矩陣生成完成！');
        } catch (e) {
            console.error("Matrix generation failed", e);
            setLoadingMessage(`生成失敗: ${getFriendlyErrorMessage(e)}`);
        } finally {
            setIsLoading(false);
            // Clear progress after a short delay
            setTimeout(() => setMatrixProgress(MODEL_ANGLES.reduce((acc, angle) => ({ ...acc, [angle.id]: '' }), {})), 3000);
        }
    };

    const handleSingleAngleRegenerate = async (angleId: string) => {
        if (!isAdvancedMode || !modelMatrix[angleId].url) return;

        setIsLoading(true);
        setLoadingMessage(`正在重新生成 ${angleId} 角度...`);
        setMatrixProgress(prev => ({ ...prev, [angleId]: '重新生成中...' }));

        try {
            const apparelImage = apparelMatrix[angleId]?.fileData || apparelMatrix['front']?.fileData;
            if (!apparelImage) throw new Error("缺少服飾素材");

            let weightInstruction = "";
            if (angleId === 'side' || angleId === 'angle' || angleId === 'back') {
                weightInstruction = `
                [🔥 HIGH WEIGHT ANGLE]: This is a ${angleId} view. 
                STRICTLY FOCUS on the garment's silhouette, ${angleId === 'back' ? 'rear details (back of the garment)' : 'side profile'}, and structural drape from Asset 2. 
                Ensure the transition between different views of the garment is seamless and matches the 3D structure of the model.`;
            }

            // Use existing result as base if available
            const currentBaseUrl = matrixResults[angleId] || modelMatrix[angleId].url;

            const result = await applyApparel(
                currentBaseUrl!,
                apparelImage,
                selectedVtoCategory || 'tops',
                true,
                (msg) => setMatrixProgress(prev => ({ ...prev, [angleId]: msg })),
                undefined,
                { usePro: true, isFirstTime: !matrixResults[angleId], customInstruction: weightInstruction }
            );

            setMatrixResults(prev => ({ ...prev, [angleId]: result }));
            setLoadingMessage('單角度生成完成！');
        } catch (e) {
            console.error("Single angle generation failed", e);
            setLoadingMessage(`生成失敗: ${getFriendlyErrorMessage(e)}`);
        } finally {
            setIsLoading(false);
            setTimeout(() => setMatrixProgress(prev => ({ ...prev, [angleId]: '' })), 3000);
        }
    };

    const handleFaceRestoreMatrix = async () => {
        if (!faceAnchor) {
            alert("請先上傳或設定臉部錨點");
            return;
        }

        setIsLoading(true);
        setLoadingMessage('正在執行全角度臉部還原...');
        
        try {
            const results: Record<string, string> = { ...matrixResults };
            const activeAngles = MODEL_ANGLES.filter(a => matrixResults[a.id]);

            for (const angle of activeAngles) {
                setMatrixProgress(prev => ({ ...prev, [angle.id]: '正在還原臉部細節...' }));
                const restored = await restoreIdentity(
                    matrixResults[angle.id]!,
                    faceAnchor.fileData,
                    () => {},
                    true
                );
                results[angle.id] = restored;
                setMatrixProgress(prev => ({ ...prev, [angle.id]: '' }));
            }

            setMatrixResults(results);
            setLoadingMessage('臉部還原完成！');
        } catch (error: any) {
            console.error("Face restoration failed", error);
            alert(`還原失敗: ${error.message || '未知錯誤'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStitchedDownload = async (layout: '2x2' | '1x4', ratio: '1:1' | '16:9') => {
        const urls = MODEL_ANGLES.map(a => matrixResults[a.id]).filter(url => url !== null) as string[];
        if (urls.length === 0) return;

        setIsLoading(true);
        setLoadingMessage('正在生成拼接大圖...');
        try {
            const stitchedUrl = await stitchImages(urls, layout, ratio);
            downloadImage(stitchedUrl, `matrix-${layout}-${Date.now()}.jpg`, 'VirtualFittingRoom');
        } catch (e) {
            console.error("Stitching failed", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadAll = () => {
        MODEL_ANGLES.forEach(angle => {
            const url = matrixResults[angle.id];
            if (url) {
                downloadImage(url, `vto-${angle.id}-${Date.now()}.jpg`, 'VirtualFittingRoom');
            }
        });
    };

    const handleApparelSlotUpload = async (angleId: string, event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const fileData = await fileToBase64(file);
            const url = URL.createObjectURL(file);
            setApparelMatrix(prev => ({
                ...prev,
                [angleId]: { ...prev[angleId], url, fileData, status: 'idle' }
            }));
        }
    };

    const handleDeleteApparelSlot = (angleId: string) => {
        setApparelMatrix(prev => ({
            ...prev,
            [angleId]: { ...prev[angleId], url: null, fileData: null, status: 'idle' }
        }));
    };

    const handleClearApparelMatrix = () => {
        setApparelMatrix(APPAREL_ANGLES.reduce((acc, angle) => ({ ...acc, [angle.id]: { ...angle, url: null, fileData: null, status: 'idle' } }), {}));
    };

    const handleAmbassadorSelect = async (ambassadorId: string) => {
        const ambassador = ambassadors.find(a => a.id === ambassadorId);
        if (ambassador) {
            setActiveAmbassador(ambassadorId);
            try {
                const fileData = await imageUrlToimageData(ambassador.imageUrl);
                const imgObj = { url: ambassador.imageUrl, fileData };
                
                // 如果尚未上傳模特兒，則將代言人作為基礎模特兒
                if (!baseImage) {
                    await analyzeAndLockModel(imgObj);
                } else {
                    setFaceAnchor(imgObj);
                }
            } catch (err) {
                setError('載入代言人資料失敗。');
            }
        }
    };

    const handleApplyApparel = useCallback(async (apparelImage: { data: string; mimeType: string }, category: string, safeMode: boolean = false) => {
        setError(null); 
        const currentLookUrl = generatedLook || baseImage?.url;
        if (!currentLookUrl) {
            setError('請先選擇或上傳一位模特兒。');
            return;
        }

        // Add to wardrobe if not already there
        const isDuplicate = wardrobe.some(item => item.fileData.data === apparelImage.data);
        const imageUrl = `data:${apparelImage.mimeType};base64,${apparelImage.data}`;
        if (!isDuplicate) {
            const newItem = {
                id: `item-${Date.now()}`,
                url: imageUrl,
                fileData: apparelImage,
                category
            };
            setWardrobe(prev => [newItem, ...prev].slice(0, 20)); // Keep last 20 items
        }

        const isFirstTime = !affectedCategories.has(category);
        if (window.innerWidth < 1024) setMobileTab('preview');
        setIsLoading(true);
        setLoadingMessage(isFirstTime ? '正在清理原始衣物區域...' : '正在融合新穿搭...');
        
        try {
            const onProgress = (message: string) => setLoadingMessage(message);
            const { models, activeModelId } = useModelStore.getState();
            const activeModel = models.find((m: any) => m.id === activeModelId);
            const modelIdentityHint = activeModel?.persona?.locked_descriptor?.trim()
                ? `[MODEL IDENTITY CONTEXT]: The model in this session is "${activeModel.name}". Their locked visual identity is: "${activeModel.persona.locked_descriptor}". Maintain this specific identity consistently in all generated results.`
                : undefined;

            const config = {
                usePro: quality !== 'standard',
                resolution: quality === 'ultra' ? '4K' : '2K' as '2K' | '4K',
                aspectRatio: targetAspectRatio,
                isFirstTime,
                tuckStatus: category.toLowerCase().includes('上衣') || category.toLowerCase().includes('top') ? tuckStatus : undefined,
                lightingPreset,
                isGhostMode,
                customInstruction: modelIdentityHint
            };
            const resultUrl = await applyApparel(
                currentLookUrl, 
                apparelImage, 
                category, 
                safeMode, 
                onProgress,
                faceAnchor?.fileData, 
                config
            );
            setGeneratedLook(resultUrl);
            setLastApparelImage(apparelImage);
            setAffectedCategories(prev => new Set(prev).add(category));
            setActiveLayers(prev => [...prev, { id: `layer-${Date.now()}`, category, url: imageUrl }]);
        } catch (err) {
            console.error("VTO Error:", err);
            setError(getFriendlyErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, [baseImage, faceAnchor, generatedLook, setGeneratedLook, quality, targetAspectRatio, affectedCategories, wardrobe, tuckStatus]);

    const handleRestoreIdentity = async () => {
        if (!generatedLook || !faceAnchor) return;
        setError(null);
        const usePro = restorationModel === 'pro';
        if (usePro) {
            const confirmed = await confirmPaidFeature();
            if (!confirmed) return;
        }
        setIsLoading(true);
        setLoadingMessage(usePro ? '正在施展 Pro 級身份修復術...' : '正在執行標準身份對齊...');
        try {
            const resultUrl = await restoreIdentity(generatedLook, faceAnchor.fileData, (msg) => setLoadingMessage(msg), usePro);
            setGeneratedLook(resultUrl);
        } catch (err) {
            setError(getFriendlyErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefineDetails = async () => {
        if (!generatedLook || !lastApparelImage) return;
        setError(null);
        const confirmed = await confirmPaidFeature();
        if (!confirmed) return;
        
        setIsLoading(true);
        setLoadingMessage('正在執行服飾細節增強與紋理修復...');
        try {
            const resultUrl = await refineGarmentDetails(
                generatedLook, 
                lastApparelImage, 
                (msg) => setLoadingMessage(msg), 
                true // Always use Pro for refinement
            );
            setGeneratedLook(resultUrl);
        } catch (err) {
            setError(getFriendlyErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const vtoStructure = useMemo(() => {
        if (!apparelStructure || !masterTaxonomy) return [];
        
        // Group taxonomy into the 7 core categories
        const grouped = VTO_MAIN_CATEGORIES.map(vtoCat => {
            const children: { id: string, name: string, safeMode: boolean }[] = [];
            
            apparelStructure.forEach(mainCat => {
                const isMatch = vtoCat.keywords.some(kw => 
                    mainCat.mainCategoryKey?.toLowerCase().includes(kw) || 
                    mainCat.mainCategory.toLowerCase().includes(kw)
                );
                
                if (isMatch) {
                    mainCat.groups.forEach(group => {
                        const firstItemDef = group.items[0];
                        const representativeItem = masterTaxonomy.find(item => item.id === firstItemDef.id);
                        children.push({ 
                            id: group.groupName, 
                            name: group.groupName, 
                            safeMode: representativeItem?.category === 'intimates' || representativeItem?.category === 'swimwear' 
                        });
                    });
                }
            });

            return {
                ...vtoCat,
                children: children.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i) // Unique groups
            };
        });

        return grouped.filter(g => g.children.length > 0);
    }, [apparelStructure, masterTaxonomy]);

    const handleDownload = useCallback(() => { if (generatedLook) downloadImage(generatedLook, `pavora-look-${Date.now()}.jpg`, 'VirtualFittingRoom'); }, [generatedLook]);
    const beforeImage = history[cursor - 1] || baseImage?.url;

    return (
        <div className="container mx-auto p-4 lg:p-8 max-w-8xl animate-fade-in pb-24 lg:pb-8">
            {isLoading && <Loader message={loadingMessage} />}
            {previewingImage && <ImagePreviewModal images={[previewingImage]} startIndex={0} onClose={() => setPreviewingImage(null)} />}
            {isCropModalOpen && cropSourceImage && (
                <ManualCropModal 
                    imageUrl={cropSourceImage.url}
                    initialBoxes={detectedBoxes}
                    angles={MODEL_ANGLES}
                    onSave={handleManualCropSave}
                    onClose={() => {
                        setIsCropModalOpen(false);
                        setDetectedBoxes([]);
                    }}
                    onResetToAI={async () => {
                        if (!cropSourceImage) return;
                        try {
                            const boxes = await detectMultiAngleLayout(cropSourceImage.fileData);
                            setDetectedBoxes(boxes.map((b: any, i: number) => ({ ...b, id: `auto-${Date.now()}-${i}` })));
                        } catch (e) {
                            console.error("AI Reset failed", e);
                        }
                    }}
                />
            )}
            <input type="file" ref={baseImageInputRef} className="hidden" accept="image/*" onChange={handleBaseImageUpload} />
            <input type="file" ref={faceAnchorInputRef} className="hidden" accept="image/*" onChange={async (e) => {
                if (e.target.files?.[0]) {
                    const file = e.target.files[0];
                    const fileData = await fileToBase64(file);
                    setFaceAnchor({ url: URL.createObjectURL(file), fileData });
                }
            }} />

            {/* Header */}
            <div className="sticky top-[80px] z-30 glass-panel border-x-0 border-t-0 px-6 py-4 mb-8">
                <div className="max-w-[110rem] mx-auto flex justify-between items-center">
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-display font-bold uppercase tracking-[0.3em] text-[var(--color-text-main)]">虛擬試衣間</h2>
                        <span className="text-[9px] uppercase tracking-[0.5em] text-[var(--color-gold)] font-light">Virtual Fitting Room Studio</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${!isAdvancedMode ? 'text-[var(--color-gold)]' : 'text-gray-500'}`}>標準模式</span>
                            <button 
                                onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                                className={`w-10 h-5 rounded-full relative transition-colors ${isAdvancedMode ? 'bg-[var(--color-gold)]' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isAdvancedMode ? 'right-1' : 'left-1'}`}></div>
                            </button>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isAdvancedMode ? 'text-[var(--color-gold)]' : 'text-gray-500'}`}>多角度矩陣</span>
                        </div>
                        {onGoHome && <Button onClick={onGoHome} variant="secondary" className="text-[10px] font-bold tracking-widest">返回首頁</Button>}
                    </div>
                </div>
            </div>
            
            {error && (
                <div className="max-w-2xl mx-auto text-center text-red-600 p-4 bg-red-900/10 border border-red-500/30 rounded-md mb-6 animate-pulse">
                    <p className="font-bold">穿搭執行失敗</p>
                    <p className="text-sm opacity-80">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className={`lg:col-span-4 flex flex-col gap-6 ${mobileTab === 'settings' ? 'block' : 'hidden lg:flex'}`}>
                    <Card className="p-0 overflow-hidden">
                        <div 
                            onClick={() => toggleSection('model')}
                            className="w-full flex justify-between items-center p-5 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSection('model'); }}
                        >
                            <h3 className="text-lg font-bold text-[var(--color-text-title)] tracking-widest uppercase flex items-center gap-3">
                                <span className="w-1 h-5 bg-[var(--color-gold)]"></span>
                                1. 模特兒與身份
                            </h3>
                            <div className="flex items-center gap-3 mr-4">
                                {isAdvancedMode && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleClearModelMatrix(); }}
                                        className="text-[9px] text-red-500 hover:text-red-400 uppercase font-bold transition-colors"
                                    >
                                        清空模特兒
                                    </button>
                                )}
                                <span className={`transition-transform duration-500 ${openSections.has('model') ? 'rotate-180' : ''}`}>
                                    <svg className="w-5 h-5 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </span>
                            </div>
                        </div>

                        <div className={`collapsible-content ${openSections.has('model') ? 'open p-6' : ''}`}>
                            {isAdvancedMode ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-3">
                                        {MODEL_ANGLES.map(angle => (
                                            <div key={angle.id} className="space-y-2">
                                                <label className="block text-[10px] font-bold text-[var(--color-text-dim)] uppercase tracking-tighter">{angle.label}</label>
                                                <div 
                                                    onClick={() => document.getElementById(`model-upload-${angle.id}`)?.click()}
                                                    className="aspect-[3/4] bg-white/5 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[var(--color-gold)] transition-all overflow-hidden relative group"
                                                >
                                                    {modelMatrix[angle.id].url ? (
                                                        <>
                                                            <img src={modelMatrix[angle.id].url!} className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity">
                                                                <span className="text-[10px] font-bold text-white uppercase">更換圖片</span>
                                                                <div className="flex gap-1">
                                                                    <button 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setCropSourceImage({ url: modelMatrix[angle.id].url!, fileData: modelMatrix[angle.id].fileData! });
                                                                            setDetectedBoxes([{ id: 'manual-0', angle: angle.id, box_2d: modelMatrix[angle.id].cropBox || [0,0,1000,1000] }]);
                                                                            setIsCropModalOpen(true);
                                                                        }}
                                                                        className="px-3 py-1 bg-[var(--color-gold)] text-black text-[9px] font-bold rounded-full hover:bg-white transition-colors"
                                                                    >
                                                                        裁切
                                                                    </button>
                                                                    <button 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteModelSlot(angle.id);
                                                                        }}
                                                                        className="px-3 py-1 bg-red-600 text-white text-[9px] font-bold rounded-full hover:bg-red-500 transition-colors"
                                                                    >
                                                                        刪除
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <PhotoIcon className="w-6 h-6 text-gray-600 mb-1" />
                                                            <span className="text-[10px] text-gray-600 font-bold uppercase">點擊上傳</span>
                                                        </>
                                                    )}
                                                    <input 
                                                        type="file" 
                                                        id={`model-upload-${angle.id}`} 
                                                        className="hidden" 
                                                        accept="image/*" 
                                                        onChange={(e) => handleModelSlotUpload(angle.id, e)} 
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-4 bg-[var(--color-gold)]/5 border border-[var(--color-gold)]/20 rounded-lg space-y-3">
                                        <p className="text-[10px] text-[var(--color-gold)] font-medium leading-relaxed">
                                            💡 提示：您可以上傳一張包含多角度的長圖至「正面」槽位，系統將自動嘗試裁切，或手動為每個角度上傳獨立圖檔。
                                        </p>
                                        {masterModelImage && (
                                            <Button 
                                                onClick={() => {
                                                    setCropSourceImage(masterModelImage);
                                                    const currentBoxes = (Object.values(modelMatrix) as AngleSlot[])
                                                        .filter(m => m.url && m.cropBox)
                                                        .map((m, i) => ({ 
                                                            id: `manual-${i}`, 
                                                            angle: m.id, 
                                                            box_2d: m.cropBox!
                                                        }));
                                                    setDetectedBoxes(currentBoxes);
                                                    setIsCropModalOpen(true);
                                                }}
                                                variant="secondary" 
                                                className="w-full text-[10px] py-2 flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                重新編輯大圖裁切
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-6">
                                        <label className="block text-[11px] font-bold text-[var(--color-text-dim)] mb-3 uppercase tracking-widest">選擇品牌代言人 (選填)</label>
                                        <div className="grid grid-cols-4 gap-2 mb-4">
                                            {ambassadors.map(ambassador => (
                                                <button 
                                                    key={ambassador.id}
                                                    onClick={() => handleAmbassadorSelect(ambassador.id)}
                                                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${activeAmbassadorId === ambassador.id ? 'border-[var(--color-gold)] scale-105 shadow-[0_0_10px_rgba(212,175,55,0.4)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                                >
                                                    <AsyncImage src={ambassador.imageUrl} className="w-full h-full object-cover" />
                                                    {activeAmbassadorId === ambassador.id && (
                                                        <div className="absolute inset-0 bg-[var(--color-gold)]/10 flex items-center justify-center">
                                                            <div className="bg-[var(--color-gold)] text-black text-[8px] font-bold px-1 rounded">ACTIVE</div>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                            <button 
                                                onClick={() => baseImageInputRef.current?.click()}
                                                className="aspect-square rounded-lg border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center text-[var(--color-text-dim)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-all"
                                            >
                                                <span className="text-xl">+</span>
                                                <span className="text-[8px] font-bold">上傳</span>
                                            </button>
                                        </div>
                                    </div>

                                    {baseImage ? (
                                        <div className="relative group w-full">
                                            <AsyncImage src={baseImage.url} alt="Base model" className="w-full h-96 object-cover object-top rounded-md" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                <Button onClick={() => baseImageInputRef.current?.click()} variant="secondary" className="w-4/5">更換模特兒</Button>
                                            </div>
                                            <div className="absolute top-2 right-2 w-24 h-24 bg-[var(--color-bg-deep)] border-2 border-[var(--color-gold)] rounded-md overflow-hidden shadow-2xl">
                                                {faceAnchor ? (
                                                    <>
                                                        <AsyncImage src={faceAnchor.url} alt="Face Anchor" className="w-full h-full object-cover" />
                                                        <button onClick={(e) => { e.stopPropagation(); setFaceAnchor(null); }} className="absolute top-0 right-0 bg-red-600 text-[var(--color-text-title)] w-5 h-5 flex items-center justify-center text-xs">&times;</button>
                                                        <div className="absolute bottom-0 left-0 right-0 bg-[var(--color-gold)] text-[10px] text-center text-black font-bold uppercase">身份鎖定中</div>
                                                    </>
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700/20" onClick={(e) => { e.stopPropagation(); faceAnchorInputRef.current?.click(); }}>
                                                        <span className="text-xl text-[var(--color-text-dim)]">+</span>
                                                        <span className="text-[10px] text-[var(--color-text-dim)]">分析中...</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="relative w-full h-48 bg-[var(--color-bg-input)] rounded-lg border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center overflow-hidden">
                                                {faceAnchor ? (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                                                        <AsyncImage src={faceAnchor.url} className="w-16 h-16 rounded-full border-2 border-[var(--color-gold)] object-cover mb-2" />
                                                        <p className="text-center text-[var(--color-text-dim)] text-[10px] font-bold uppercase tracking-widest">已鎖定面部身份</p>
                                                        <p className="text-center text-[var(--color-text-dim)] text-[10px] mt-1 italic">請上傳全身照以開始試衣</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <PhotoIcon className="w-8 h-8 text-[var(--color-text-dim)] mb-2" />
                                                        <p className="text-center text-[var(--color-text-dim)] text-[10px] font-bold uppercase tracking-widest">尚未上傳模特兒</p>
                                                    </>
                                                )}
                                            </div>
                                            <Button onClick={() => baseImageInputRef.current?.click()} variant="secondary" className="w-full">從電腦上傳全身照</Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </Card>

                    <Card className="p-0 overflow-hidden flex-grow">
                        <div 
                            onClick={() => toggleSection('apparel')}
                            className="w-full flex justify-between items-center p-5 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSection('apparel'); }}
                        >
                            <h3 className="text-lg font-bold text-[var(--color-text-title)] tracking-widest uppercase flex items-center gap-3">
                                <span className="w-1 h-5 bg-[var(--color-gold)]"></span>
                                2. 選擇服飾
                            </h3>
                            <span className={`transition-transform duration-500 ${openSections.has('apparel') ? 'rotate-180' : ''}`}>
                                <svg className="w-5 h-5 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </div>

                        <div ref={apparelSectionRef} className={`collapsible-content ${openSections.has('apparel') ? 'open p-6' : ''}`}>
                            <div className="space-y-6">
                                {/* Category Selector is ALWAYS shown first now */}
                                <div className={isAdvancedMode ? "pb-6 border-b border-white/5" : ""}>
                                    <SimpleVTOCategorySelector 
                                        selectedCategory={selectedVtoCategory}
                                        onSelect={async (category, subCategory) => {
                                            // 2026-07-11 Hank 拍板：快速模式下沒有模特時，點分類不跳選檔窗，
                                            // 先提示上傳模特（避免選了服飾檔才吃到錯誤）。
                                            if (!isAdvancedMode && !generatedLook && !baseImage?.url) {
                                                setError('請先選擇或上傳一位模特兒，再選擇服飾分類。');
                                                return;
                                            }
                                            setSelectedVtoCategory(category);
                                            
                                            // Scroll to upload section
                                            if (apparelSectionRef.current) {
                                                apparelSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }

                                            if (!isAdvancedMode) {
                                                // T13 fix: 不再 imperative 賦值 onchange（stale closure 源頭）。
                                                // 分類存 ref，由 input 的 React onChange 讀取當下最新 handler。
                                                pendingVtoCategoryRef.current = { category, subCategory };
                                                fileInputRef.current?.click();
                                            }
                                        }}
                                    />
                                </div>

                                {isAdvancedMode ? (
                                    selectedVtoCategory ? (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-[var(--color-gold)] uppercase tracking-widest">當前類別:</span>
                                                    <span className="text-[10px] font-bold text-white uppercase px-2 py-0.5 bg-white/10 rounded">{selectedVtoCategory}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button 
                                                        onClick={handleClearApparelMatrix}
                                                        className="text-[9px] text-red-500 hover:text-red-400 uppercase font-bold transition-colors"
                                                    >
                                                        清空所有服飾
                                                    </button>
                                                    <button 
                                                        onClick={() => setSelectedVtoCategory('')}
                                                        className="text-[9px] text-gray-500 hover:text-[var(--color-gold)] uppercase font-bold transition-colors"
                                                    >
                                                        重選類別
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {APPAREL_ANGLES.map(angle => (
                                                    <div key={angle.id} className="space-y-2">
                                                        <label className="block text-[10px] font-bold text-[var(--color-text-dim)] uppercase tracking-tighter">{angle.label}</label>
                                                        <div 
                                                            onClick={() => document.getElementById(`apparel-upload-${angle.id}`)?.click()}
                                                            className="aspect-[3/4] bg-white/5 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[var(--color-gold)] transition-all overflow-hidden relative group"
                                                        >
                                                            {apparelMatrix[angle.id].url ? (
                                                                <>
                                                                    <img src={apparelMatrix[angle.id].url!} className="w-full h-full object-cover" />
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                        <span className="text-[10px] font-bold text-white uppercase">更換圖片</span>
                                                                    </div>
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); handleDeleteApparelSlot(angle.id); }}
                                                                        className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <PhotoIcon className="w-6 h-6 text-gray-600 mb-1" />
                                                                    <span className="text-[10px] text-gray-600 font-bold uppercase">點擊上傳</span>
                                                                </>
                                                            )}
                                                            <input 
                                                                type="file" 
                                                                id={`apparel-upload-${angle.id}`} 
                                                                className="hidden" 
                                                                accept="image/*" 
                                                                onChange={(e) => handleApparelSlotUpload(angle.id, e)} 
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                                                <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                                                    💡 提示：上傳多個角度的服飾參考圖能顯著提升生成的一致性。特別是「特寫/側面」圖將用於強化細節與紋理。
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">請先選擇上方服飾類別</p>
                                        </div>
                                    )
                                ) : (
                                    <>
                                        <input
                                            type="file"
                                            id="apparel-file-input"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                // T13: React 受控 onChange——每次 render 綁最新 handleApplyApparel，無 stale closure。
                                                const f = e.target.files?.[0];
                                                e.target.value = ''; // 清空 value，讓下次重選同一檔案仍觸發 change（2026-07-11 實測坑）
                                                const pending = pendingVtoCategoryRef.current;
                                                if (!f || !pending) return;
                                                const base64 = await fileToBase64(f);
                                                const fullCategory = pending.subCategory ? `${pending.category} (${pending.subCategory})` : pending.category;
                                                handleApplyApparel(base64, fullCategory, true);
                                            }}
                                        />
                                        
                                        {wardrobe.length > 0 && (
                                            <div className="mt-4">
                                                <label className="block text-[11px] font-bold text-[var(--color-text-dim)] mb-3 uppercase tracking-widest">我的視覺衣櫥 (Wardrobe)</label>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {wardrobe.map(item => (
                                                        <button 
                                                            key={item.id}
                                                            onClick={() => handleApplyApparel(item.fileData, item.category, true)}
                                                            className="relative aspect-[3/4] rounded-lg overflow-hidden border border-white/10 hover:border-[var(--color-gold)] transition-all group"
                                                        >
                                                            <img src={item.url} className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                <span className="text-[8px] font-bold text-white uppercase">試穿</span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card className="p-0 overflow-hidden">
                        <div 
                            onClick={() => toggleSection('settings')}
                            className="w-full flex justify-between items-center p-5 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSection('settings'); }}
                        >
                            <h3 className="text-lg font-bold text-[var(--color-text-title)] tracking-widest uppercase flex items-center gap-3">
                                <span className="w-1 h-5 bg-[var(--color-gold)]"></span>
                                3. 造型與設定
                            </h3>
                            <span className={`transition-transform duration-500 ${openSections.has('settings') ? 'rotate-180' : ''}`}>
                                <svg className="w-5 h-5 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </div>

                        <div className={`collapsible-content ${openSections.has('settings') ? 'open p-6' : ''}`}>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--color-text-dim)] mb-3 uppercase tracking-widest">上衣穿法 (Tuck Style)</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => setTuckStatus('untucked')}
                                            className={`py-2 px-4 rounded border text-xs font-bold transition-all ${tuckStatus === 'untucked' ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)]' : 'bg-white/5 text-gray-400 border-white/10'}`}
                                        >
                                            自然垂放
                                        </button>
                                        <button 
                                            onClick={() => setTuckStatus('tucked')}
                                            className={`py-2 px-4 rounded border text-xs font-bold transition-all ${tuckStatus === 'tucked' ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)]' : 'bg-white/5 text-gray-400 border-white/10'}`}
                                        >
                                            紮進褲/裙
                                        </button>
                                    </div>
                                </div>

                                <Select label="渲染品質" options={[{value: 'standard', label: '標準 (Flash)'}, {value: 'high', label: '高品質 (2K)'}, {value: 'ultra', label: '超高畫質 (4K)'}]} value={quality} onChange={e => setQuality(e.target.value as QualityLevel)} />
                                <Select label="圖片比例" options={[{value: '9:16', label: '9:16 (直式手機)'}, {value: '3:4', label: '3:4 (時尚人像)'}, {value: '1:1', label: '1:1 (正方形)'}, {value: '4:3', label: '4:3 (標準橫式)'}, {value: '16:9', label: '16:9 (寬螢幕)'}]} value={targetAspectRatio} onChange={e => setTargetAspectRatio(e.target.value as AspectRatio)} />
                                
                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--color-text-dim)] mb-3 uppercase tracking-widest">環境光影模板 (Lighting)</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'original', name: '原始光影' },
                                            { id: 'studio', name: '專業攝影棚' },
                                            { id: 'sunlight', name: '午後陽光' },
                                            { id: 'cinematic', name: '電影質感' },
                                            { id: 'neon', name: '都市霓虹' }
                                        ].map(preset => (
                                            <button 
                                                key={preset.id}
                                                onClick={() => setLightingPreset(preset.id)}
                                                className={`py-2 px-3 rounded border text-[10px] font-bold transition-all ${lightingPreset === preset.id ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)]' : 'bg-white/5 text-gray-400 border-white/10'}`}
                                            >
                                                {preset.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">隱形模特兒模式</span>
                                        <span className="text-[8px] text-gray-500 uppercase">Ghost Mannequin Mode</span>
                                    </div>
                                    <button 
                                        onClick={() => setIsGhostMode(!isGhostMode)}
                                        className={`w-10 h-5 rounded-full relative transition-colors ${isGhostMode ? 'bg-[var(--color-gold)]' : 'bg-gray-700'}`}
                                    >
                                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isGhostMode ? 'right-1' : 'left-1'}`}></div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {activeLayers.length > 0 && (
                        <Card className="p-5">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-bold text-[var(--color-text-dim)] uppercase tracking-widest">已應用層次 (Layers)</h3>
                                <button 
                                    onClick={() => { setGeneratedLook(null); setAffectedCategories(new Set()); setLastApparelImage(null); setActiveLayers([]); }}
                                    className="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase"
                                >
                                    全部清空
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {activeLayers.map((layer, idx) => (
                                    <div key={layer.id} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full pl-1 pr-3 py-1">
                                        <img src={layer.url} className="w-6 h-6 rounded-full object-cover" />
                                        <span className="text-[10px] text-gray-300 font-medium">{layer.category}</span>
                                        {idx === activeLayers.length - 1 && (
                                            <button onClick={undo} className="text-gray-500 hover:text-white ml-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>

                <div className={`lg:col-span-8 ${mobileTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
                    <Card className="h-full min-h-[70vh] flex flex-col p-0 overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-mono text-[var(--color-text-dim)] bg-black/40 px-3 py-1 rounded-full border border-white/5 uppercase tracking-widest">Virtual Fitting // 虛擬試衣</span>
                                <div className="flex items-center gap-2 bg-black/40 rounded-lg p-1 border border-white/5">
                                    <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="p-1 hover:bg-white/10 rounded text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
                                    </button>
                                    <span className="text-[9px] font-mono text-gray-500 min-w-[30px] text-center">{Math.round(zoom * 100)}%</span>
                                    <button onClick={() => setZoom(Math.min(2, zoom + 0.1))} className="p-1 hover:bg-white/10 rounded text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold tracking-[0.2em] uppercase text-[var(--color-text-title)]">預覽結果</h3>
                        </div>
                        <div className="flex-grow bg-black flex items-center justify-center relative overflow-hidden">
                             {isAdvancedMode ? (
                                 <div className="w-full h-full p-4 overflow-y-auto custom-scrollbar">
                                     <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
                                         {MODEL_ANGLES.map(angle => {
                                             const result = matrixResults[angle.id];
                                             const previousResult = matrixHistory[matrixCursor - 1]?.[angle.id] || modelMatrix[angle.id].url;
                                             
                                             return (
                                                 <div key={angle.id} className="relative aspect-[9/16] bg-white/5 rounded-xl border border-white/10 overflow-hidden group">
                                                     {result ? (
                                                         isCompareMode && previousResult ? (
                                                             <ImageCompareSlider 
                                                                beforeImage={previousResult} 
                                                                afterImage={result} 
                                                                controlledPosition={globalSliderPosition}
                                                                onChange={setGlobalSliderPosition}
                                                                zoom={zoom}
                                                             />
                                                         ) : (
                                                             <img 
                                                                src={result} 
                                                                className="w-full h-full object-cover transition-transform duration-300" 
                                                                style={{ transform: `scale(${zoom})` }}
                                                             />
                                                         )
                                                     ) : modelMatrix[angle.id].url ? (
                                                         <div className="w-full h-full relative">
                                                             <img 
                                                                src={modelMatrix[angle.id].url!} 
                                                                className="w-full h-full object-cover opacity-30 grayscale transition-transform duration-300" 
                                                                style={{ transform: `scale(${zoom})` }}
                                                             />
                                                             <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                                                                 <div className="w-10 h-10 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin mb-3"></div>
                                                                 <span className="text-[10px] font-bold text-[var(--color-gold)] uppercase tracking-widest">{matrixProgress[angle.id] || '等待生成...'}</span>
                                                             </div>
                                                         </div>
                                                     ) : (
                                                         <div className="w-full h-full flex flex-col items-center justify-center text-gray-700">
                                                             <PhotoIcon className="w-12 h-12 mb-2 opacity-10" />
                                                             <span className="text-[10px] font-bold uppercase tracking-widest opacity-20">{angle.label}</span>
                                                         </div>
                                                     )}
                                                     
                                                     <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded text-[9px] font-bold text-white uppercase tracking-widest z-10">
                                                         {angle.label}
                                                     </div>
                                                     
                                                     {result && (
                                                         <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                             <button 
                                                                 onClick={() => setPreviewingImage(result)}
                                                                 className="p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full hover:bg-[var(--color-gold)] hover:text-black transition-all"
                                                                 title="放大預覽"
                                                             >
                                                                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" /></svg>
                                                             </button>
                                                             <button 
                                                                 onClick={() => handleSingleAngleRegenerate(angle.id)}
                                                                 className="p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full hover:bg-[var(--color-gold)] hover:text-black transition-all"
                                                                 title="重新生成此角度"
                                                             >
                                                                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                                                             </button>
                                                         </div>
                                                     )}
                                                 </div>
                                             );
                                         })}
                                     </div>
                                 </div>
                             ) : beforeImage && generatedLook ? (
                                <div style={{ transform: `scale(${zoom})`, transition: 'transform 0.3s ease' }} className="w-full h-full flex items-center justify-center">
                                    <ImageCompareSlider beforeImage={beforeImage} afterImage={generatedLook} />
                                </div>
                            ) : generatedLook || baseImage?.url ? (
                                <img 
                                    src={generatedLook || baseImage?.url} 
                                    alt="Preview" 
                                    className="max-h-full max-w-full object-contain transition-transform duration-300" 
                                    style={{ transform: `scale(${zoom})` }}
                                />
                            ) : (
                                <div className="text-center text-[var(--color-text-dim)]">
                                    <PhotoIcon className="w-24 h-24 mx-auto mb-4 opacity-20" />
                                    <p className="text-xl font-display uppercase tracking-widest opacity-20">Waiting for model</p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 bg-[var(--color-bg-panel)] border-t border-white/5 flex flex-wrap justify-center gap-4">
                            {isAdvancedMode ? (
                                <div className="flex flex-col gap-4 w-full">
                                    <div className="flex flex-wrap justify-center gap-2 w-full">
                                        {(canUndoMatrix || canRedoMatrix) && (
                                            <div className="flex gap-2">
                                                <Button onClick={undoMatrix} disabled={!canUndoMatrix} variant="secondary" className="px-4 text-[10px]">上一步</Button>
                                                <Button onClick={redoMatrix} disabled={!canRedoMatrix} variant="secondary" className="px-4 text-[10px]">下一步</Button>
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => setIsCompareMode(!isCompareMode)}
                                            className={`px-4 py-2 rounded border text-[10px] font-bold transition-all flex items-center gap-2 ${isCompareMode ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)]' : 'bg-white/5 text-gray-400 border-white/10'}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
                                            對比模式 {isCompareMode ? 'ON' : 'OFF'}
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-2 w-full">
                                        <Button 
                                            onClick={handleMatrixGenerate}
                                            variant="primary" 
                                            className="flex-1 min-w-[200px] shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                                            disabled={isLoading || !MODEL_ANGLES.some(a => modelMatrix[a.id].url)}
                                        >
                                            <SparklesIcon className="w-4 h-4 mr-2" /> 開始矩陣生成 (Multi-Angle)
                                        </Button>
                                        {Object.values(matrixResults).some(r => r !== null) && (
                                            <div className="flex flex-col gap-2 w-full">
                                                <Button 
                                                    onClick={handleFaceRestoreMatrix} 
                                                    variant="secondary" 
                                                    className="w-full border-[var(--color-gold)]/30 text-[var(--color-gold)]"
                                                    disabled={isLoading || !faceAnchor}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></svg>
                                                    全角度臉部還原 (Identity Restore)
                                                </Button>
                                                <div className="flex gap-2 w-full">
                                                    <Button onClick={() => handleStitchedDownload('2x2', '1:1')} variant="secondary" className="flex-1">拼接下載 (1:1)</Button>
                                                    <Button onClick={() => handleStitchedDownload('1x4', '16:9')} variant="secondary" className="flex-1">拼接下載 (16:9)</Button>
                                                    <Button onClick={handleDownloadAll} variant="light" className="flex-1">全部單張下載</Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {(canUndo || canRedo) && (
                                        <div className="flex gap-2">
                                            <Button onClick={undo} disabled={!canUndo} variant="secondary" className="px-4">上一步</Button>
                                            <Button onClick={redo} disabled={!canRedo} variant="secondary" className="px-4">下一步</Button>
                                        </div>
                                    )}
                                    {generatedLook && (
                                        <div className="flex flex-wrap justify-center gap-2 w-full">
                                            {faceAnchor && (
                                                <Button onClick={handleRestoreIdentity} variant="primary" className="flex-1 min-w-[140px] shadow-lg">
                                                    <SparklesIcon className="w-4 h-4 mr-2" /> 身份修復
                                                </Button>
                                            )}
                                            {lastApparelImage && (
                                                <Button onClick={handleRefineDetails} variant="secondary" className="flex-1 min-w-[140px] border-[var(--color-gold)] text-[var(--color-gold)]">
                                                    <SparklesIcon className="w-4 h-4 mr-2" /> 細節增強
                                                </Button>
                                            )}
                                            <Button onClick={() => setPreviewingImage(generatedLook)} variant="secondary" className="flex-1 min-w-[100px]">放大</Button>
                                            <Button onClick={handleDownload} variant="light" className="flex-1 min-w-[100px]">下載結果</Button>
                                            <Button onClick={() => { setGeneratedLook(null); setAffectedCategories(new Set()); setLastApparelImage(null); }} variant="secondary" className="text-red-500 hover:text-red-400 flex-1 min-w-[100px]">清空</Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default VirtualFittingRoom;
