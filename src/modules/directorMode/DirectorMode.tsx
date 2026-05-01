
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateVideo, getFriendlyErrorMessage, extractVideoFrames, fileToBase64, imageUrlToimageData, constructDirectorPrompt, generateVideoPromptFromImage, analyzeImageForDirector, generateStoryboardFromScript, generateImageAsset } from '../../shared/services/geminiService';
import { savePortfolioItem } from '../../shared/services/storageService';
import type { DirectorScene } from '../../shared/types/types';
import { DIRECTOR_STYLES, LENS_LANGUAGES, ACTION_RHYTHMS, LIGHTING_VIBES, COMPOSITION_FOCUSES, CAMERA_MOVEMENTS, SUBJECT_ACTIONS, TRANSITION_STYLES, MASTER_PRESETS } from '../../shared/constants/constants';
import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
import Loader from '../../shared/components/common/Loader';
import PhotoIcon from '../../shared/assets/icons/PhotoIcon';
import VideoPreviewModal from '../../shared/components/common/VideoPreviewModal';
import Select from '../../shared/components/common/Select';
import ReplaceIcon from '../../shared/assets/icons/ReplaceIcon';
import DownloadIcon from '../../shared/assets/icons/DownloadIcon';
import SparklesIcon from '../../shared/assets/icons/SparklesIcon';
import ImagePreviewModal from '../../shared/components/common/ImagePreviewModal';
import { downloadImage } from '../../shared/utils/imageUtils';
import { useBrandStore } from '../../shared/stores/useBrandStore';
import VideoPlayer from '../../shared/components/common/VideoPlayer';

import { useNotificationStore } from '../../shared/stores/useNotificationStore';

interface DirectorModeProps {
  onGoHome: () => void;
  initialImage?: { url: string; fileData: { data: string; mimeType: string; } } | null;
  initialPrompt?: string;
}

// --- Blob Video Player Component (Enhanced for Aspect Ratio) ---
const BlobVideoPlayer: React.FC<{ src: string, aspectRatio: '16:9' | '9:16' | '1:1', className?: string }> = ({ src, aspectRatio, className }) => {
    // Determine Container Aspect Ratio Class
    const containerAspectClass = aspectRatio === '16:9' ? 'aspect-video' : aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-square';

    return (
        <div className={`relative w-full ${containerAspectClass} bg-[var(--color-bg-deep)] rounded-md overflow-hidden ${className}`}>
            <VideoPlayer 
                src={src} 
                className="absolute inset-0 w-full h-full object-contain" 
                autoPlay 
                loop 
                muted 
            />
        </div>
    );
};

const createNewScene = (): DirectorScene => ({
    id: `scene-${Date.now()}`,
    directorStyle: DIRECTOR_STYLES?.[0]?.value || '',
    lensLanguage: LENS_LANGUAGES?.[0]?.value || '',
    actionRhythm: ACTION_RHYTHMS?.[0]?.value || '',
    lightingVibe: LIGHTING_VIBES?.[0]?.value || '',
    compositionFocus: COMPOSITION_FOCUSES?.[0]?.value || '',
    cameraMovement: CAMERA_MOVEMENTS?.[0]?.value || '',
    subjectAction: SUBJECT_ACTIONS?.[0]?.value || '',
    customPrompt: '',
    customDescriptionPrompt: '',
    generationMode: 'single',
    transitionStyle: 'morph', // Default transition
    resolution: '720p',
    aspectRatio: '16:9', // Default 16:9
    referenceImageUrls: [],
    referenceFramesFileData: [],
    motionBlurIntensity: 50,
    filmGrainIntensity: 20,
    halationIntensity: 10,
    generationCount: 1,
});

interface DirectorOptionSelectProps {
    label: string;
    options: { value: string; label: string; prompt: string }[];
    value: string;
    customValue?: string;
    onValueChange: (value: string) => void;
    onCustomValueChange: (value: string) => void;
    disabled?: boolean;
}

const DirectorOptionSelect: React.FC<DirectorOptionSelectProps & { options: { value: string; label: string; prompt: string; description?: string }[] }> = ({
    label, options, value, customValue, onValueChange, onCustomValueChange, disabled,
}) => {
    const selectedOption = options.find(o => o.value === value);
    
    return (
        <div className="group/select relative">
            <div className="flex justify-between items-end mb-1">
                <label className="text-xs font-bold text-[var(--color-text-dim)] uppercase tracking-wider">{label}</label>
                {selectedOption && (
                    <span className="text-[10px] text-[var(--color-gold)] font-mono opacity-0 group-hover/select:opacity-100 transition-opacity">
                        {selectedOption.value.toUpperCase()}
                    </span>
                )}
            </div>
            <Select
                options={options?.map(o => ({ value: o.value, label: o.label })) || []}
                value={value}
                onChange={e => onValueChange(e.target.value)}
                disabled={disabled}
                className="border-[var(--color-border)] hover:border-[var(--color-gold)] transition-colors"
            />
            {selectedOption?.description && (
                <p className="text-[10px] text-[var(--color-text-dim)] mt-1 ml-1 italic leading-tight">
                    {selectedOption.description}
                </p>
            )}
            {value === 'custom' && (
                <textarea
                    value={customValue || ''}
                    onChange={e => onCustomValueChange(e.target.value)}
                    placeholder={`自訂${label}...`}
                    className="w-full bg-[var(--color-bg-input)] p-2 rounded text-sm mt-2 border border-[var(--color-border)] focus:border-[var(--color-gold)] outline-none"
                    rows={2}
                    disabled={disabled}
                />
            )}
        </div>
    );
};

const DirectorMode: React.FC<DirectorModeProps> = ({ onGoHome, initialImage, initialPrompt }) => {
    if (!DIRECTOR_STYLES || DIRECTOR_STYLES.length === 0) {
        return <div className="text-center text-red-400 py-20">資料載入錯誤</div>;
    }

    const [storyboard, setStoryboard] = useState<DirectorScene[]>(() => {
        const scene = createNewScene();
        if (initialPrompt) {
            scene.customPrompt = initialPrompt;
            scene.directorStyle = 'custom';
        }
        return [scene];
    });
    const [activeSceneIndex, setActiveSceneIndex] = useState(0);
    const [baseImage, setBaseImage] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(null);
    
    // Locked aspect ratio state derived from base image
    const [lockedAspectRatio, setLockedAspectRatio] = useState<'16:9' | '9:16' | '1:1' | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    const [previewingVideo, setPreviewingVideo] = useState<string | null>(null);
    const [previewingImage, setPreviewingImage] = useState<{images: string[], startIndex: number} | null>(null);
    const [styleIntensity, setStyleIntensity] = useState(80);
    const [selectedPresetId, setSelectedPresetId] = useState<string>('');

    const baseFileInputRef = useRef<HTMLInputElement>(null);
    const endFrameFileInputRef = useRef<HTMLInputElement>(null);
    const refImagesFileInputRef = useRef<HTMLInputElement>(null);

    const activeScene = storyboard[activeSceneIndex];
    
    useEffect(() => {
        if (initialImage && !baseImage) {
            setBaseImageFromFileObject(initialImage);
        }
    }, [initialImage, baseImage]);

    // Helper to determine aspect ratio from image
    const detectAndLockAspectRatio = (url: string) => {
        const img = new Image();
        img.onload = () => {
            const w = img.naturalWidth;
            const h = img.naturalHeight;
            let ratio: '16:9' | '9:16' | '1:1' = '16:9';
            
            const diff = Math.abs(w - h) / Math.max(w, h);
            if (diff < 0.05) {
                ratio = '1:1';
            } else if (w > h) {
                ratio = '16:9';
            } else {
                ratio = '9:16';
            }
            
            setLockedAspectRatio(ratio);
            
            // Update all existing scenes to match this ratio
            setStoryboard(prev => prev.map(s => ({ ...s, aspectRatio: ratio })));
        };
        img.src = url;
    };

    const setBaseImageFromFileObject = async (imgObj: { url: string; fileData: { data: string; mimeType: string; } }) => {
        setBaseImage(imgObj);
        setStoryboard([createNewScene()]); // Reset storyboard on new image
        detectAndLockAspectRatio(imgObj.url);
    };

    const setBaseImageFromFile = async (file: File) => {
        setIsLoading(true); setLoadingMessage('正在處理圖片...');
        try {
            const fileData = await fileToBase64(file);
            const url = URL.createObjectURL(file);
            const imgObj = { url, fileData };
            setBaseImage(imgObj);
            setStoryboard([createNewScene()]);
            detectAndLockAspectRatio(url);
        } catch (err) { setError(getFriendlyErrorMessage(err)); } 
        finally { setIsLoading(false); }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'base' | 'end' | 'ref') => {
        if (!e.target.files || e.target.files.length === 0) return;
        const files = Array.from(e.target.files);

        if (type === 'base') {
            setBaseImageFromFile(files[0] as File);
        } else if (type === 'end') {
            const file = files[0] as File;
            fileToBase64(file).then(fileData => {
                updateScene(activeSceneIndex, {
                    endFrameUrl: URL.createObjectURL(file),
                    endFrameFileData: fileData,
                });
            });
        } else if (type === 'ref') {
            Promise.all(files.map(async (file: File) => {
                const fileData = await fileToBase64(file);
                return { url: URL.createObjectURL(file), fileData };
            })).then(newRefs => {
                const currentUrls = activeScene.referenceImageUrls || [];
                const currentData = activeScene.referenceFramesFileData || [];
                
                const updatedUrls = [...currentUrls, ...newRefs.map(r => r.url)];
                const updatedFileData = [...currentData, ...newRefs.map(r => r.fileData)];
                
                // Limit to 3
                updateScene(activeSceneIndex, {
                    referenceImageUrls: updatedUrls.slice(0, 3),
                    referenceFramesFileData: updatedFileData.slice(0, 3),
                });
            });
        }
    };

    const removeReferenceImage = (index: number) => {
        const updatedUrls = [...(activeScene.referenceImageUrls || [])];
        const updatedData = [...(activeScene.referenceFramesFileData || [])];
        updatedUrls.splice(index, 1);
        updatedData.splice(index, 1);
        updateScene(activeSceneIndex, {
            referenceImageUrls: updatedUrls,
            referenceFramesFileData: updatedData
        });
    };

    const updateScene = useCallback((index: number, newSceneData: Partial<DirectorScene>) => {
        setStoryboard(prev => {
            const newStoryboard = [...prev];
            const updatedScene = { ...newStoryboard[index], ...newSceneData };
            const { prompt, explanation } = constructDirectorPrompt(updatedScene);
            newStoryboard[index] = { ...updatedScene, prompt, promptExplanation: explanation };
            return newStoryboard;
        });
    }, []);

    // Enforcement Logic for Restricted Modes & Aspect Ratio
    useEffect(() => {
        if (!activeScene) return;
        let updates: Partial<DirectorScene> = {};
        
        const isRestrictedMode = activeScene.generationMode === 'multi-reference' || activeScene.generationMode === 'extension';
        
        // 1. Force Resolution for Advanced Modes
        if (isRestrictedMode) {
            if (activeScene.resolution !== '720p') updates.resolution = '720p';
        }

        // 2. Force Aspect Ratio Logic
        if (lockedAspectRatio && activeScene.aspectRatio !== lockedAspectRatio) {
            updates.aspectRatio = lockedAspectRatio;
        } else if (isRestrictedMode && !lockedAspectRatio) {
             if (activeScene.aspectRatio !== '16:9') updates.aspectRatio = '16:9';
        }
        
        if (Object.keys(updates).length > 0) updateScene(activeSceneIndex, updates);
    }, [activeScene.generationMode, activeScene.resolution, activeScene.aspectRatio, activeSceneIndex, updateScene, lockedAspectRatio]);
    
    const addScene = () => {
        if (storyboard.length >= 5) return;
        const newScene = createNewScene();
        // Inherit aspect ratio from lock
        if (lockedAspectRatio) newScene.aspectRatio = lockedAspectRatio;
        setStoryboard(prev => [...prev, newScene]);
        setActiveSceneIndex(storyboard.length);
    };

    const removeScene = (index: number) => {
        setStoryboard(prev => prev.filter((_, i) => i !== index));
        if (activeSceneIndex >= index) {
            setActiveSceneIndex(prev => Math.max(0, prev - 1));
        }
    };

    const handleGeneratePreview = async () => {
        const isMultiRef = activeScene.generationMode === 'multi-reference';
        if (!isMultiRef && !baseImage) { setError('請先上傳初始模型圖片。'); return; }
        if (isMultiRef && (!activeScene.referenceFramesFileData || activeScene.referenceFramesFileData.length === 0)) {
            setError('請至少上傳一張參考圖片。'); return;
        }

        const { prompt } = constructDirectorPrompt(activeScene);
        if (!prompt) { setError("提示詞為空。"); return; }
        
        const count = activeScene.generationCount || 1;
        setIsLoading(true); setLoadingMessage(`正在生成分鏡 ${activeSceneIndex + 1} 的靜態預覽 (${count} 張)...`); setError(null);
        
        try {
            const staticPrompt = prompt.replace(/^A video of/, "A cinematic photo of").replace(/^Captured in/, "Cinematic shot,");
            const primaryImage = isMultiRef ? activeScene.referenceFramesFileData![0] : baseImage!.fileData;
            const refs = isMultiRef ? activeScene.referenceFramesFileData : [];

            const tasks = Array(count).fill(0).map(() => generateImageAsset(staticPrompt, activeScene.aspectRatio || '16:9', primaryImage, refs));
            const previewUrls = await Promise.all(tasks);
            
            updateScene(activeSceneIndex, { 
                storyboardPreviewUrl: previewUrls[0],
                storyboardPreviewUrls: previewUrls
            });
        } catch (err) { setError(getFriendlyErrorMessage(err)); } finally { setIsLoading(false); }
    };

    const handleCaptureStartFrame = async () => {
        if (!activeScene.generatedVideoUrl) return;
        setIsLoading(true);
        setLoadingMessage('正在擷取起始幀...');
        try {
            const url = await extractVideoFrames(activeScene.generatedVideoUrl, 'first');
            updateScene(activeSceneIndex, { firstFrameUrl: url });
            setPreviewingImage({ images: [url], startIndex: 0 });
        } catch (e) {
            setError(getFriendlyErrorMessage(e));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadVideo = async () => {
        if (!activeScene.generatedVideoUrl) return;
        
        if (activeScene.generatedVideoUrl.startsWith('blob:')) {
            const a = document.createElement('a');
            a.href = activeScene.generatedVideoUrl;
            a.download = `scene_${activeScene.id}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            savePortfolioItem({ imageUrl: activeScene.generatedVideoUrl, sourceModule: 'DirectorMode' });
            return;
        }

        try {
            setLoadingMessage('準備下載中...');
            setIsLoading(true);
            const response = await fetch(activeScene.generatedVideoUrl, {
                headers: {
                    'x-goog-api-key': process.env.API_KEY || ''
                }
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `scene_${activeScene.id}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            savePortfolioItem({ imageUrl: activeScene.generatedVideoUrl, sourceModule: 'DirectorMode' });
        } catch (e) {
            console.error("Download error", e);
            const { addNotification } = useNotificationStore.getState();
            addNotification({
                type: 'error',
                title: '下載失敗',
                message: '下載失敗，請檢查網路連線或稍後再試。'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = useCallback(async () => {
        const isMultiRef = activeScene.generationMode === 'multi-reference';
        if (!isMultiRef && !baseImage) { 
            setError('請先上傳初始模型圖片 (單圖/轉場模式必要)。'); 
            return; 
        }
        if (isMultiRef && (!activeScene.referenceFramesFileData || activeScene.referenceFramesFileData.length === 0)) {
            setError('請至少上傳一張參考圖片 (多圖參考模式)。'); 
            return;
        }

        setIsLoading(true); setError(null);
        const count = activeScene.generationCount || 1;
        const onProgress = (msg: string) => setLoadingMessage(`[分鏡 ${activeSceneIndex + 1}] ${msg} (${count} 部)`);
        
        try {
            const { prompt } = constructDirectorPrompt(activeScene);
            if (!prompt) throw new Error("提示詞為空，請選擇選項或填寫自定義描述。");

            let startImageData = undefined;
            if (baseImage) startImageData = baseImage.fileData;
            
            if (activeScene.overrideStartFrameUrl) startImageData = await imageUrlToimageData(activeScene.overrideStartFrameUrl);
            else if (activeScene.storyboardPreviewUrl) {
                startImageData = await imageUrlToimageData(activeScene.storyboardPreviewUrl);
            } else if (activeSceneIndex > 0 && storyboard[activeSceneIndex - 1].lastFrameUrl) {
                startImageData = await imageUrlToimageData(storyboard[activeSceneIndex - 1].lastFrameUrl!);
            }

            let previousVideoOp;
            if (activeScene.generationMode === 'extension' && activeScene.previousSceneId) {
                const prevScene = storyboard.find(s => s.id === activeScene.previousSceneId);
                previousVideoOp = prevScene?.generatedOperation?.response?.generatedVideos?.[0]?.video;
                if (!previousVideoOp) throw new Error("找不到可延長的影片。");
            }

            const tasks = Array(count).fill(0).map(() => generateVideo({
                prompt, 
                image: isMultiRef ? undefined : startImageData, 
                resolution: activeScene.resolution, 
                aspectRatio: activeScene.aspectRatio, 
                lastFrame: activeScene.generationMode === 'start-to-end' ? activeScene.endFrameFileData : undefined,
                referenceImages: activeScene.generationMode === 'multi-reference' ? activeScene.referenceFramesFileData : undefined,
                previousVideo: previousVideoOp, 
            }, onProgress));

            const results = await Promise.all(tasks);
            const videoUrls = results.map(r => r.videoUrl);
            const operations = results.map(r => r.operation);

            updateScene(activeSceneIndex, { 
                generatedVideoUrl: videoUrls[0], 
                generatedVideoUrls: videoUrls,
                generatedOperation: operations[0] 
            });

            onProgress('影片生成成功！正在背景擷取縮圖...');
            try {
                const firstFrameUrl = await extractVideoFrames(videoUrls[0], 'first');
                const lastFrameUrl = await extractVideoFrames(videoUrls[0], 'last');
                updateScene(activeSceneIndex, { firstFrameUrl, lastFrameUrl });
            } catch (e) { console.warn("Frame extraction warning", e); }

        } catch (err) { 
            setError(getFriendlyErrorMessage(err)); 
        } finally { 
            setIsLoading(false); 
        }
    }, [baseImage, activeScene, activeSceneIndex, storyboard, updateScene]);

    const handleAiPromptPlan = useCallback(async () => {
        const isMultiRef = activeScene.generationMode === 'multi-reference';
        if (!isMultiRef && !baseImage) { setError("請先上傳初始模型圖片。"); return; }
        if (isMultiRef && (!activeScene.referenceFramesFileData || activeScene.referenceFramesFileData.length === 0)) {
            setError("請至少上傳一張參考圖片。"); return;
        }

        setIsLoading(true); setLoadingMessage('AI 正在分析圖片並規劃提示詞...'); setError(null);
        try {
            const images = isMultiRef ? activeScene.referenceFramesFileData! : [baseImage!.fileData];
            const { prompt_en, explanation_zh } = await generateVideoPromptFromImage(images);
            updateScene(activeSceneIndex, { customDescriptionPrompt: prompt_en, promptExplanation: explanation_zh });
        } catch (err) { setError(getFriendlyErrorMessage(err)); } finally { setIsLoading(false); }
    }, [baseImage, activeScene, activeSceneIndex, updateScene]);

    const handleSmartMatch = useCallback(async () => {
        const isMultiRef = activeScene.generationMode === 'multi-reference';
        if (!isMultiRef && !baseImage) { setError("請先上傳初始模型圖片。"); return; }
        if (isMultiRef && (!activeScene.referenceFramesFileData || activeScene.referenceFramesFileData.length === 0)) {
            setError("請至少上傳一張參考圖片。"); return;
        }

        setIsLoading(true); setLoadingMessage('AI 視覺大腦正在分析影像 DNA...'); setError(null);
        try {
            const images = isMultiRef ? activeScene.referenceFramesFileData! : [baseImage!.fileData];
            const result = await analyzeImageForDirector(images);
            const preset = MASTER_PRESETS.find(p => p.id === result.suggestedPresetId);
            
            if (preset) {
                // Apply preset and fine-tune params
                const finalParams = { 
                    ...preset.params, 
                    ...result.fineTuneParams,
                    // Ensure we reset custom fields if AI provides specific values
                    customDirectorStyle: '',
                    customLensLanguage: '',
                    customActionRhythm: '',
                    customLightingVibe: '',
                    customCompositionFocus: '',
                    customCameraMovement: '',
                    customSubjectAction: '',
                    customDescriptionPrompt: ''
                };
                updateScene(activeSceneIndex, finalParams);
                setSelectedPresetId(result.suggestedPresetId);
                
                const { addNotification } = useNotificationStore.getState();
                addNotification({
                    type: 'success',
                    title: 'AI 智慧配對成功',
                    message: `分析結果：${result.reasoning_zh}`
                });
            }
        } catch (err) { 
            setError(getFriendlyErrorMessage(err)); 
        } finally { 
            setIsLoading(false); 
        }
    }, [baseImage, activeScene, activeSceneIndex, updateScene]);

    const handleExtendScene = () => {
        if (storyboard.length >= 5) {
            const { addNotification } = useNotificationStore.getState();
            addNotification({
                type: 'warning',
                title: '分鏡上限',
                message: '最多支援 5 個分鏡。'
            });
            return;
        }
        const newScene = createNewScene();
        newScene.generationMode = 'extension'; 
        newScene.resolution = '720p'; 
        newScene.aspectRatio = activeScene.aspectRatio || lockedAspectRatio || '16:9'; 
        newScene.previousSceneId = activeScene.id;
        newScene.customPrompt = "Continue the action...";
        setStoryboard(prev => [...prev, newScene]); setActiveSceneIndex(storyboard.length);
    };

    const isPanelDisabled = !!activeScene.customDescriptionPrompt;
    const isMultiRef = activeScene.generationMode === 'multi-reference';
    const isExtension = activeScene.generationMode === 'extension';
    const isStartToEnd = activeScene.generationMode === 'start-to-end';
    const isRestrictedMode = isMultiRef || isExtension;
    
    return (
        <div className="container mx-auto p-4 md:p-8 max-w-[120rem] animate-fade-in">
             {isLoading && <Loader message={loadingMessage} />}
             {previewingVideo && <VideoPreviewModal videoUrl={previewingVideo} onClose={() => setPreviewingVideo(null)} />}
             {previewingImage && <ImagePreviewModal images={previewingImage.images} startIndex={previewingImage.startIndex} onClose={() => setPreviewingImage(null)} />}
             
             <input type="file" ref={baseFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'base')} />
             <input type="file" ref={endFrameFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'end')} />
             <input type="file" ref={refImagesFileInputRef} className="hidden" accept="image/*" multiple onChange={(e) => handleFileChange(e, 'ref')} />

            {/* Header */}
            <div className="sticky top-[140px] z-30 glass-panel border-x-0 border-t-0 px-6 py-4 mb-8">
                <div className="max-w-[110rem] mx-auto flex justify-between items-center">
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-display font-bold uppercase tracking-[0.3em] text-[var(--color-text-main)]">導演模式</h2>
                        <span className="text-[9px] uppercase tracking-[0.5em] text-[var(--color-gold)] font-light">Director Mode V5.0 Pro-Cine</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {onGoHome && <Button onClick={onGoHome} variant="secondary" className="text-[10px] font-bold tracking-widest">返回首頁</Button>}
                    </div>
                </div>
            </div>
            {error && <div className="text-center text-red-500 p-3 bg-red-500/10 border border-red-500/20 rounded-md mb-6">{error}</div>}
             
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <Card><h3 className="text-xl font-bold mb-3 text-[var(--color-text-title)]">1. 初始模型</h3>
                    {baseImage ? (
                        <div className="relative group w-full"><img src={baseImage.url} alt="Base" className="w-full object-cover rounded-md" /><div className="absolute inset-0 bg-[var(--color-bg-deep)]/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2"><Button onClick={() => baseFileInputRef.current?.click()} className="w-4/5 flex items-center justify-center"><ReplaceIcon className="w-5 h-5 mr-2" />本地更換</Button></div>
                        </div>
                        ) : <div className="space-y-4"><Button onClick={() => baseFileInputRef.current?.click()} className="w-full"><PhotoIcon className="w-5 h-5 mr-2" />本地上傳</Button></div>}
                    </Card>
                    
                    <Card className="flex-grow">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xl font-bold text-[var(--color-text-title)]">2. 導演面板 (分鏡 {activeSceneIndex + 1})</h3>
                        </div>
                        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                            {/* AI Visual Intuition System */}
                            <div className="mb-4 p-4 bg-gradient-to-br from-[var(--color-bg-surface)] to-[var(--color-bg-deep)] rounded-lg border border-[var(--color-gold)]/40 shadow-inner">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-xs font-bold text-[var(--color-gold)] uppercase tracking-widest flex items-center">
                                        <SparklesIcon className="w-3 h-3 mr-1" /> AI 視覺直覺系統 (V5.0)
                                    </label>
                                    <span className="text-[10px] text-[var(--color-text-dim)]">Beta</span>
                                </div>
                                
                                <Button 
                                    onClick={handleSmartMatch} 
                                    isLoading={isLoading && loadingMessage.includes('影像 DNA')} 
                                    disabled={!baseImage || isLoading} 
                                    className="w-full mb-3 bg-[var(--color-gold)] text-[var(--color-bg-deep)] hover:bg-white transition-all font-bold py-2 shadow-lg"
                                >
                                    一鍵智慧配對 (Smart Match)
                                </Button>

                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] text-[var(--color-text-dim)] uppercase">風格強度 (Style Intensity)</label>
                                        <span className="text-[10px] font-mono text-[var(--color-gold)]">{styleIntensity}%</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="100" 
                                        value={styleIntensity} 
                                        onChange={(e) => setStyleIntensity(parseInt(e.target.value))}
                                        className="w-full h-1 bg-[var(--color-bg-input)] rounded-lg appearance-none cursor-pointer accent-[var(--color-gold)]"
                                    />
                                </div>
                            </div>

                            {/* Master Presets Selection - Dropdown */}
                            <div className="mb-6 p-4 bg-[var(--color-bg-surface)] rounded-lg border border-[var(--color-gold)]/20">
                                <label className="block text-xs font-bold text-[var(--color-gold)] uppercase tracking-[0.2em] mb-2">大師典藏系列 (Master Presets)</label>
                                <Select
                                    options={[
                                        { value: '', label: '-- 選擇大師預設 --' },
                                        ...MASTER_PRESETS.map(p => ({ value: p.id, label: p.name }))
                                    ]}
                                    value={selectedPresetId}
                                    onChange={e => {
                                        const presetId = e.target.value;
                                        setSelectedPresetId(presetId);
                                        const preset = MASTER_PRESETS.find(p => p.id === presetId);
                                        if (preset) {
                                            updateScene(activeSceneIndex, preset.params);
                                            const { addNotification } = useNotificationStore.getState();
                                            addNotification({
                                                type: 'success',
                                                title: '已套用大師預設',
                                                message: `已成功套用「${preset.name}」配置。`
                                            });
                                        }
                                    }}
                                    className="border-[var(--color-gold)]/50 text-sm py-2"
                                />
                                <p className="text-[10px] text-[var(--color-text-dim)] mt-2 italic">提示：套用預設將自動配置下方所有專業參數。</p>
                            </div>

                            <Button onClick={handleAiPromptPlan} isLoading={isLoading && loadingMessage.includes('規劃')} disabled={!baseImage || isLoading} className="w-full mb-2" variant="secondary"><SparklesIcon className="w-5 h-5 mr-2" />AI 單鏡頭規劃</Button>
                            <textarea value={activeScene.customDescriptionPrompt || ''} onChange={e => updateScene(activeSceneIndex, { customDescriptionPrompt: e.target.value })} placeholder="自定義描述提示詞 (將覆蓋下方所有選項)" className="w-full bg-[var(--color-bg-input)] p-2 rounded text-sm mt-2 border border-[var(--color-gold)] text-[var(--color-text-main)]" rows={3}/>
                            <div className={isPanelDisabled ? "opacity-50 pointer-events-none" : ""}>
                                <Select label="生成模式" options={[{value: 'single', label: '單圖生成'}, {value: 'start-to-end', label: '起訖幀轉場'}, {value: 'multi-reference', label: '多圖參考'}]} value={activeScene.generationMode} onChange={e => updateScene(activeSceneIndex, { generationMode: e.target.value as any })} />
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    <Select 
                                        label="畫質" 
                                        options={[{value: '720p', label: '720p'}, {value: '1080p', label: '1080p (Pro)'}]} 
                                        value={activeScene.resolution} 
                                        onChange={e => updateScene(activeSceneIndex, { resolution: e.target.value as any })}
                                        disabled={isRestrictedMode}
                                    />
                                    <div className="relative">
                                        <Select 
                                            label="比例" 
                                            options={[
                                                {value: '16:9', label: '16:9 (橫式)'}, 
                                                {value: '9:16', label: '9:16 (直式)'},
                                                {value: '1:1', label: '1:1 (方格)'}
                                            ]} 
                                            value={activeScene.aspectRatio} 
                                            onChange={e => updateScene(activeSceneIndex, { aspectRatio: e.target.value as any })}
                                            disabled={!!lockedAspectRatio || isRestrictedMode}
                                        />
                                        {lockedAspectRatio ? (
                                            <div className="absolute top-0 right-0 bg-amber-500/20 text-amber-600 text-[10px] px-1 rounded border border-amber-500/30">已鎖定 ({lockedAspectRatio})</div>
                                        ) : isMultiRef ? (
                                            <div className="absolute top-0 right-0 bg-blue-500/20 text-blue-600 text-[10px] px-1 rounded border border-blue-500/30">限制 16:9</div>
                                        ) : null}
                                    </div>
                                </div>
                                {isRestrictedMode && <p className="text-xs text-amber-600 mt-1 ml-1">* 進階模式僅支援 720p</p>}
                                
                                {activeScene.generationMode === 'start-to-end' && (
                                    <>
                                        <div className="mt-2">
                                            {activeScene.endFrameUrl ? (
                                                <div className="relative mt-2">
                                                    <img src={activeScene.endFrameUrl} className="w-full h-24 object-cover rounded" />
                                                    <button onClick={() => updateScene(activeSceneIndex, {endFrameUrl: undefined, endFrameFileData: undefined})} className="absolute top-1 right-1 bg-red-600 rounded-full w-5 h-5 text-xs">&times;</button>
                                                </div>
                                            ) : (
                                                <Button onClick={()=>endFrameFileInputRef.current?.click()} className="w-full mt-2 text-sm">上傳結束畫面 (End Frame)</Button>
                                            )}
                                        </div>
                                        {/* New Transition Style Selector */}
                                        <div className="mt-2">
                                            <Select 
                                                label="轉場物理邏輯 (Transition Logic)" 
                                                options={TRANSITION_STYLES}
                                                value={activeScene.transitionStyle || 'morph'}
                                                onChange={e => updateScene(activeSceneIndex, { transitionStyle: e.target.value })}
                                            />
                                        </div>
                                    </>
                                )}
                                
                                {activeScene.generationMode === 'multi-reference' && (
                                    <div className="mt-2 p-2 bg-[var(--color-bg-input)] rounded border border-[var(--color-border)]">
                                        <label className="text-xs text-[var(--color-text-dim)] mb-2 block font-bold">參考圖片 (最多 3 張) - 點擊圖片移除</label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {activeScene.referenceImageUrls?.map((url, i) => (
                                                <div key={i} className="relative group w-16 h-16">
                                                    <img src={url} className="w-full h-full object-cover rounded border border-[var(--color-border)]" />
                                                    <button 
                                                        onClick={() => removeReferenceImage(i)}
                                                        className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
                                            ))}
                                            {(activeScene.referenceImageUrls?.length || 0) < 3 && (
                                                <button onClick={() => refImagesFileInputRef.current?.click()} className="w-16 h-16 border-2 border-dashed border-[var(--color-border)] rounded flex flex-col items-center justify-center text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] hover:border-[var(--color-gold)] transition-colors">
                                                    <span className="text-xl">+</span>
                                                </button>
                                            )}
                                        </div>
                                        <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded mb-2">
                                            <p className="text-[10px] text-amber-600 leading-tight">
                                                ⚠️ 說明：多選功能僅針對「同一產品/人物」的多角度圖片，不支援多個不同產品或人物。
                                            </p>
                                        </div>
                                        <p className="text-[10px] text-[var(--color-text-dim)]">提示：多圖參考模式下，將優先使用這些圖片生成，可能會忽略初始模型。僅支援 16:9。</p>
                                    </div>
                                )}
                            </div>

                            {/* Generation Count Selector */}
                            <div className="mt-4 p-3 bg-[var(--color-bg-surface)] rounded-lg border border-[var(--color-border)]">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold text-[var(--color-text-dim)] uppercase tracking-wider">生成數量 (Count)</label>
                                    <span className="text-xs font-mono text-[var(--color-gold)]">{activeScene.generationCount || 1} 張/部</span>
                                </div>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4].map(num => (
                                        <button
                                            key={num}
                                            onClick={() => updateScene(activeSceneIndex, { generationCount: num })}
                                            className={`flex-1 py-1 rounded text-xs font-bold transition-all ${
                                                (activeScene.generationCount || 1) === num 
                                                ? 'bg-[var(--color-gold)] text-[var(--color-bg-deep)]' 
                                                : 'bg-[var(--color-bg-input)] text-[var(--color-text-dim)] hover:bg-[var(--color-bg-surface)]'
                                            }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={`space-y-4 mt-4 ${isPanelDisabled ? "opacity-50 pointer-events-none" : ""}`}>
                                <DirectorOptionSelect label="導演風格 (Director Style)" options={DIRECTOR_STYLES} value={activeScene.directorStyle} customValue={activeScene.customDirectorStyle} onValueChange={v => { updateScene(activeSceneIndex, { directorStyle: v }); setSelectedPresetId(''); }} onCustomValueChange={v => updateScene(activeSceneIndex, { customDirectorStyle: v })} />
                                <DirectorOptionSelect label="鏡頭語言 (Lens Language)" options={LENS_LANGUAGES} value={activeScene.lensLanguage} customValue={activeScene.customLensLanguage} onValueChange={v => { updateScene(activeSceneIndex, { lensLanguage: v }); setSelectedPresetId(''); }} onCustomValueChange={v => updateScene(activeSceneIndex, { customLensLanguage: v })} />
                                <DirectorOptionSelect label="動作節奏 (Action Rhythm)" options={ACTION_RHYTHMS} value={activeScene.actionRhythm} customValue={activeScene.customActionRhythm} onValueChange={v => { updateScene(activeSceneIndex, { actionRhythm: v }); setSelectedPresetId(''); }} onCustomValueChange={v => updateScene(activeSceneIndex, { customActionRhythm: v })} />
                                <DirectorOptionSelect label="燈光氛圍 (Lighting Vibe)" options={LIGHTING_VIBES} value={activeScene.lightingVibe} customValue={activeScene.customLightingVibe} onValueChange={v => { updateScene(activeSceneIndex, { lightingVibe: v }); setSelectedPresetId(''); }} onCustomValueChange={v => updateScene(activeSceneIndex, { customLightingVibe: v })} />
                                <DirectorOptionSelect label="構圖焦點 (Composition Focus)" options={COMPOSITION_FOCUSES} value={activeScene.compositionFocus} customValue={activeScene.customCompositionFocus} onValueChange={v => { updateScene(activeSceneIndex, { compositionFocus: v }); setSelectedPresetId(''); }} onCustomValueChange={v => updateScene(activeSceneIndex, { customCompositionFocus: v })} />
                                <DirectorOptionSelect label="運鏡方式 (Camera Movement)" options={CAMERA_MOVEMENTS} value={activeScene.cameraMovement} customValue={activeScene.customCameraMovement} onValueChange={v => { updateScene(activeSceneIndex, { cameraMovement: v }); setSelectedPresetId(''); }} onCustomValueChange={v => updateScene(activeSceneIndex, { customCameraMovement: v })} />
                                <DirectorOptionSelect label="主體動作 (Subject Action)" options={SUBJECT_ACTIONS} value={activeScene.subjectAction} customValue={activeScene.customSubjectAction} onValueChange={v => { updateScene(activeSceneIndex, { subjectAction: v }); setSelectedPresetId(''); }} onCustomValueChange={v => updateScene(activeSceneIndex, { customSubjectAction: v })} />
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <Button onClick={handleSmartMatch} disabled={(!baseImage && activeScene.generationMode !== 'multi-reference') || isLoading} variant="secondary" className="text-xs py-2 bg-[var(--color-bg-input)] border border-[var(--color-gold)]/30 text-[var(--color-gold)] hover:bg-[var(--color-gold)]/10">
                                        <SparklesIcon className="w-3 h-3 mr-1" /> AI 智慧配對
                                    </Button>
                                    <Button onClick={handleGeneratePreview} disabled={(!baseImage && activeScene.generationMode !== 'multi-reference') || isLoading} variant="secondary" className="text-xs py-2 bg-[var(--color-bg-input)] border border-[var(--color-gold)]/30 text-[var(--color-gold)] hover:bg-[var(--color-gold)]/10">
                                        <PhotoIcon className="w-3 h-3 mr-1" /> 生成靜態預覽
                                    </Button>
                                </div>

                                {/* Advanced Technical Parameters */}
                                <div className="pt-4 border-t border-[var(--color-border)]">
                                    <label className="block text-[10px] font-bold text-[var(--color-gold)] uppercase tracking-widest mb-4">進階技術參數 (Technical Specs)</label>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-[var(--color-text-dim)] uppercase">動態模糊 (Motion Blur)</span>
                                                <span className="text-[var(--color-gold)]">{activeScene.motionBlurIntensity || 50}%</span>
                                            </div>
                                            <input type="range" min="0" max="100" value={activeScene.motionBlurIntensity || 50} onChange={e => updateScene(activeSceneIndex, { motionBlurIntensity: parseInt(e.target.value) })} className="w-full h-1 bg-[var(--color-bg-input)] rounded-lg appearance-none cursor-pointer accent-[var(--color-gold)]" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-[var(--color-text-dim)] uppercase">底片顆粒 (Film Grain)</span>
                                                <span className="text-[var(--color-gold)]">{activeScene.filmGrainIntensity || 20}%</span>
                                            </div>
                                            <input type="range" min="0" max="100" value={activeScene.filmGrainIntensity || 20} onChange={e => updateScene(activeSceneIndex, { filmGrainIntensity: parseInt(e.target.value) })} className="w-full h-1 bg-[var(--color-bg-input)] rounded-lg appearance-none cursor-pointer accent-[var(--color-gold)]" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-[var(--color-text-dim)] uppercase">光暈強度 (Halation)</span>
                                                <span className="text-[var(--color-gold)]">{activeScene.halationIntensity || 10}%</span>
                                            </div>
                                            <input type="range" min="0" max="100" value={activeScene.halationIntensity || 10} onChange={e => updateScene(activeSceneIndex, { halationIntensity: parseInt(e.target.value) })} className="w-full h-1 bg-[var(--color-bg-input)] rounded-lg appearance-none cursor-pointer accent-[var(--color-gold)]" />
                                        </div>
                                    </div>
                                </div>

                                <div><label className="block text-sm text-[var(--color-text-dim)] mb-1">額外描述</label><textarea value={activeScene.customPrompt || ''} onChange={e => updateScene(activeSceneIndex, { customPrompt: e.target.value })} placeholder="例如: 手持紅色雨傘..." className="w-full bg-[var(--color-bg-input)] p-2 rounded text-sm border border-[var(--color-border)] text-[var(--color-text-main)]" rows={2}/></div>
                            </div>
                        </div>
                    </Card>
                    <Button onClick={handleGenerate} isLoading={isLoading && !loadingMessage.includes('預覽')} disabled={(!baseImage && activeScene.generationMode !== 'multi-reference') || isLoading} className="w-full text-xl py-4 uppercase">生成影片</Button>
                </div>

                <div className="lg:col-span-8">
                    <Card className="h-full min-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4"><h3 className="text-2xl font-bold text-[var(--color-text-title)] text-center">分鏡預覽</h3><div className="flex gap-2"><Button onClick={addScene} disabled={storyboard.length >= 5} variant="secondary" className="text-sm">+ 新增分鏡</Button>{storyboard.length > 1 && <Button onClick={() => removeScene(activeSceneIndex)} variant="secondary" className="text-sm bg-red-900/50 text-red-300">刪除分鏡</Button>}</div></div>
                        <div className="flex gap-4 overflow-x-auto pb-4 mb-4 border-b border-[var(--color-border)]">
                            {storyboard.map((scene, index) => (
                                <div key={scene.id} onClick={() => setActiveSceneIndex(index)} className={`flex-shrink-0 w-40 cursor-pointer relative rounded-md border-2 transition-all ${activeSceneIndex === index ? 'border-[var(--color-gold)]' : 'border-transparent hover:border-[var(--color-border)]'}`}>
                                    <div className="aspect-video bg-[var(--color-bg-input)] rounded-t-md overflow-hidden relative">
                                         {scene.generatedVideoUrl ? (
                                             <BlobVideoPlayer src={scene.generatedVideoUrl} aspectRatio={scene.aspectRatio} className="w-full h-full pointer-events-none" />
                                         ) : scene.storyboardPreviewUrl ? (<img src={scene.storyboardPreviewUrl} className="w-full h-full object-cover opacity-80" />) : (<div className="w-full h-full flex items-center justify-center text-xs text-[var(--color-text-dim)]">{index === 0 ? '起始分鏡' : '待設定'}</div>)}
                                         <div className="absolute top-1 left-1 bg-[var(--color-bg-deep)]/70 text-white text-[10px] px-1.5 rounded-full">#{index + 1}</div>
                                    </div>
                                    <div className="bg-[var(--color-bg-surface)] p-2 rounded-b-md">
                                        <p className="text-xs text-[var(--color-text-dim)] truncate">
                                            {scene.directorStyle === 'custom' ? '自訂風格' : DIRECTOR_STYLES.find(s => s.value === scene.directorStyle)?.label}
                                        </p>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className={`text-[10px] px-1 rounded ${scene.generatedVideoUrl ? 'bg-emerald-500/20 text-emerald-600' : 'bg-[var(--color-bg-input)] text-[var(--color-text-dim)]'}`}>
                                                {scene.generatedVideoUrl ? '已生成' : '草稿'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {storyboard.length < 5 && (
                                <button onClick={addScene} className="flex-shrink-0 w-40 aspect-[4/3] bg-[var(--color-bg-input)]/50 border-2 border-dashed border-[var(--color-border)] rounded-md flex flex-col items-center justify-center hover:border-[var(--color-gold)] hover:bg-[var(--color-bg-input)] transition-colors text-[var(--color-text-dim)]">
                                    <span className="text-2xl">+</span>
                                    <span className="text-xs mt-1">新增分鏡</span>
                                </button>
                            )}
                        </div>
                        
                        <div className="flex-grow bg-[var(--color-bg-deep)]/50 rounded-lg flex items-center justify-center relative overflow-hidden">
                             {activeScene.generatedVideoUrl ? (
                                 <div className="relative w-full h-full flex items-center justify-center group p-4">
                                     <BlobVideoPlayer key={activeScene.generatedVideoUrl} src={activeScene.generatedVideoUrl} aspectRatio={activeScene.aspectRatio} className="shadow-lg h-full" />
                                     <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                                         {activeScene.generatedVideoUrls && activeScene.generatedVideoUrls.length > 1 && (
                                             <div className="flex gap-1 bg-[var(--color-bg-deep)]/60 p-1 rounded-md backdrop-blur-sm">
                                                 {activeScene.generatedVideoUrls.map((url, idx) => (
                                                     <button 
                                                         key={idx}
                                                         onClick={() => updateScene(activeSceneIndex, { generatedVideoUrl: url })}
                                                         className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-all ${activeScene.generatedVideoUrl === url ? 'bg-[var(--color-gold)] text-[var(--color-bg-deep)]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                                     >
                                                         {idx + 1}
                                                     </button>
                                                 ))}
                                             </div>
                                         )}
                                     </div>
                                     <Button onClick={() => setPreviewingVideo(activeScene.generatedVideoUrl!)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" variant="secondary">全螢幕</Button>
                                </div>
                            ) : activeScene.storyboardPreviewUrl ? (
                                <div className="relative w-full h-full flex items-center justify-center group">
                                    <img src={activeScene.storyboardPreviewUrl} className="max-h-full max-w-full object-contain rounded shadow-lg opacity-80" />
                                    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                                         {activeScene.storyboardPreviewUrls && activeScene.storyboardPreviewUrls.length > 1 && (
                                             <div className="flex gap-1 bg-[var(--color-bg-deep)]/60 p-1 rounded-md backdrop-blur-sm">
                                                 {activeScene.storyboardPreviewUrls.map((url, idx) => (
                                                     <button 
                                                         key={idx}
                                                         onClick={() => updateScene(activeSceneIndex, { storyboardPreviewUrl: url })}
                                                         className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-all ${activeScene.storyboardPreviewUrl === url ? 'bg-[var(--color-gold)] text-[var(--color-bg-deep)]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                                     >
                                                         {idx + 1}
                                                     </button>
                                                 ))}
                                             </div>
                                         )}
                                     </div>
                                    <div className="absolute bottom-4 bg-[var(--color-bg-deep)]/80 px-4 py-2 rounded-full text-sm text-white font-bold border border-white/20 shadow-xl backdrop-blur-md">
                                        靜態預覽 (Preview)
                                    </div>
                                </div>
                            ) : (<div className="text-center text-[var(--color-text-dim)]"><PhotoIcon className="w-16 h-16 mx-auto mb-4" /><p className="text-lg">選擇分鏡並點擊生成影片</p></div>)}
                        </div>
                        <div className="mt-4 flex justify-center gap-4">
                            <Button onClick={handleCaptureStartFrame} variant="secondary" disabled={!activeScene.generatedVideoUrl}>擷取起始幀</Button>
                            <Button onClick={handleExtendScene} variant="secondary" disabled={!activeScene.generatedVideoUrl}>延長此片段 (+5s)</Button>
                             {activeScene.generatedVideoUrl && (
                                <Button 
                                    onClick={handleDownloadVideo} 
                                    className="bg-[var(--color-bg-surface)] text-[var(--color-text-main)] border border-[var(--color-border)] hover:border-[var(--color-gold)] shadow-md"
                                >
                                    <DownloadIcon className="w-5 h-5 mr-2" /> 下載影片
                                </Button>
                             )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DirectorMode;
