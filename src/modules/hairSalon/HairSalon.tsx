
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { transformHairAndMakeup, getFriendlyErrorMessage, imageUrlToimageData, getAIStyleAnalysis, getStylistFeedback, tuneImageDetail, detectMultiAngleLayout } from '../../shared/services/geminiService';
import { buildSalonPrompt, STYLE_ANALYSIS_PROMPT } from '../../prompts/hair';
import { runPromptPipeline } from '../../promptPipeline';
import { ensureEnglishPrompt } from '../../shared/services/promptTranslation';
import { savePortfolioItem, getSalonPresets, saveSalonPreset, deleteSalonPreset } from '../../shared/services/storageService';
import { downloadImage, stitchImages, cropImage, fileToBase64 } from '../../shared/utils/imageUtils';
import ManualCropModal from '../../shared/components/business/ManualCropModal';
import type { HairstyleParams, MakeupParams, SavedPreset, StylistFeedback } from '../../shared/types/types';
import { HAIRSTYLE_PRESETS, MAKEUP_PRESETS, BEARD_PRESETS, GRADIENT_PLACEMENT_PATTERNS, HIGHLIGHT_PATTERNS } from '../../shared/constants/constants';
import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
import Loader from '../../shared/components/common/Loader';
import PhotoIcon from '../../shared/assets/icons/PhotoIcon';
import DiceIcon from '../../shared/assets/icons/DiceIcon';
import ExpandIcon from '../../shared/assets/icons/ExpandIcon';
import ImagePreviewModal from '../../shared/components/common/ImagePreviewModal';
import Select from '../../shared/components/common/Select';
import Slider from '../../shared/components/common/Slider';
import ColorPicker from '../../shared/components/common/ColorPicker';
import ImageCompareSlider from '../../shared/components/common/ImageCompareSlider';
import ChevronLeftIcon from '../../shared/assets/icons/ChevronLeftIcon';
import ChevronRightIcon from '../../shared/assets/icons/ChevronRightIcon';
import DownloadIcon from '../../shared/assets/icons/DownloadIcon';
import TuneIcon from '../../shared/assets/icons/TuneIcon';
import ReplaceIcon from '../../shared/assets/icons/ReplaceIcon';
import { Sparkles, Copy, Check, RotateCcw, Maximize2, Save, Trash2, Layers } from 'lucide-react';
import { useHistoryState } from '../../shared/hooks/useHistoryState';
import { useNotification } from '../../shared/context/NotificationContext';
import MaskEditor from '../../shared/components/common/MaskEditor';

type QualityLevel = 'standard' | 'high' | 'ultra';

interface HairAndMakeupStudioProps {
  onGoHome: () => void;
  initialImage?: { url: string; fileData: { data: string; mimeType: string; } } | null;
  onContinueEditing: (imageUrl: string, destination: string) => void;
}
interface ColorStop {
  id: number;
  hex: string;
}

const MODEL_ANGLES = [
    { id: 'front', label: '正面', en: 'Full front view, looking at camera, centered composition' },
    { id: 'side', label: '側面', en: 'Profile side view, 90-degree angle, centered composition' },
    { id: 'angle', label: '斜側', en: 'Three-quarter view, 45-degree angle, looking slightly away, centered composition' },
    { id: 'back', label: '背面', en: 'Full back view, facing away from camera, perfectly centered composition' }
];

const HairAndMakeupStudio: React.FC<HairAndMakeupStudioProps> = ({ onGoHome, initialImage, onContinueEditing }) => {
    const [baseImage, setBaseImage] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(initialImage || null);
    const [faceAnchor, setFaceAnchor] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(null);
    
    // Multi-angle Matrix State
    const [isMultiAngleMode, setIsMultiAngleMode] = useState(false);
    const [salonMatrix, setSalonMatrix] = useState<Record<string, { id: string; label: string; url: string | null; fileData: { data: string; mimeType: string } | null }>>(
        MODEL_ANGLES.reduce((acc, angle) => ({ ...acc, [angle.id]: { ...angle, url: null, fileData: null } }), {})
    );
    const [multiAngleResults, setMultiAngleResults] = useState<Record<string, string | null>>({});
    const [isRegenerating, setIsRegenerating] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const { addNotification } = useNotification();

    const { state: generatedImage, setState: setGeneratedImage, undo, redo, canUndo, canRedo, reset: resetHistory, history, cursor } = useHistoryState<string | null>({ initial: null, max: 10 });
    const [gender, setGender] = useState<'female' | 'male'>('female');
    const [activeTab, setActiveTab] = useState<'hair' | 'makeup'>('hair');
    const [selectedPresetId, setSelectedPresetId] = useState(HAIRSTYLE_PRESETS.female[0].id);
    const [hairstyleParams, setHairstyleParams] = useState<HairstyleParams>(HAIRSTYLE_PRESETS.female[0].params);
    const [hairColor, setHairColor] = useState('#5c4033');
    const [hairColorMode, setHairColorMode] = useState<'color' | 'gradient' | 'highlight'>('color');
    const [colorStops, setColorStops] = useState<ColorStop[]>([ { id: Date.now(), hex: '#6b1e9a' }, { id: Date.now() + 1, hex: '#a3d2f2' }, ]);
    const [gradientPlacement, setGradientPlacement] = useState('roots-to-ends');
    const [gradientCoverage, setGradientCoverage] = useState(70);
    const [highlightPattern, setHighlightPattern] = useState('face-framing');
    const [highlightDensity, setHighlightDensity] = useState(30);
    const [customHairstyleDescription, setCustomHairstyleDescription] = useState('');
    const [hairstyleRefImage, setHairstyleRefImage] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(null);
    const [selectedMakeupPresetId, setSelectedMakeupPresetId] = useState(MAKEUP_PRESETS.female[0].id);
    const [beardStyleId, setBeardStyleId] = useState('none');
    const [beardColor, setBeardColor] = useState('#000000');
    const [makeupIntensity, setMakeupIntensity] = useState(50);
    const [makeupParams, setMakeupParams] = useState<MakeupParams>({
        lipstick_intensity: 80,
        eyeshadow_intensity: 60,
        blush_intensity: 40
    });
    const [quality, setQuality] = useState<QualityLevel>('standard');
    const [isExpertMode, setIsExpertMode] = useState(false);
    const [isSelfieMode, setIsSelfieMode] = useState(false);
    const [compareMode, setCompareMode] = useState<'slider' | 'side-by-side' | 'quad'>('slider');
    const [detectedRatio, setDetectedRatio] = useState<'1:1' | '3:4' | '4:3' | '9:16' | '16:9'>('1:1');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [previewingImage, setPreviewingImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hairstyleRefImageInputRef = useRef<HTMLInputElement>(null);
    const faceAnchorInputRef = useRef<HTMLInputElement>(null);
    const [aiAnalysis, setAiAnalysis] = useState<{ summary: string; recommendations: any } | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [stylistFeedback, setStylistFeedback] = useState<StylistFeedback | null>(null);
    const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
    const [isSavingPreset, setIsSavingPreset] = useState(false);
    const [isPrecisionMode, setIsPrecisionMode] = useState(false);
    const [isSalonCropModalOpen, setIsSalonCropModalOpen] = useState(false);
    const [salonCropSource, setSalonCropSource] = useState<{ url: string; fileData: { data: string; mimeType: string } } | null>(null);
    const [salonDetectedBoxes, setSalonDetectedBoxes] = useState<any[]>([]);
    const [isSalonDetecting, setIsSalonDetecting] = useState(false);

    useEffect(() => {
        setSavedPresets(getSalonPresets());
    }, []);

    useEffect(() => { 
        if (initialImage) { 
            setBaseImage(initialImage); 
            resetHistory(null); 
            setAiAnalysis(null);
            
            // Detect aspect ratio for initial image
            const img = new Image();
            img.onload = () => {
                const ratio = img.width / img.height;
                const supported = [
                    { val: '1:1', r: 1 },
                    { val: '3:4', r: 3/4 },
                    { val: '4:3', r: 4/3 },
                    { val: '9:16', r: 9/16 },
                    { val: '16:9', r: 16/9 }
                ];
                const closest = supported.reduce((prev, curr) => 
                    Math.abs(curr.r - ratio) < Math.abs(prev.r - ratio) ? curr : prev
                );
                setDetectedRatio(closest.val as any);
            };
            img.src = initialImage.url;
        } 
    }, [initialImage, resetHistory]);
    useEffect(() => {
        const newPresets = gender === 'male' ? HAIRSTYLE_PRESETS.male : HAIRSTYLE_PRESETS.female;
        setSelectedPresetId(newPresets[0].id);
        setHairstyleParams(newPresets[0].params);

        const newMakeupPresets = MAKEUP_PRESETS[gender];
        setSelectedMakeupPresetId(newMakeupPresets[0].id);

        if (gender === 'female') {
            setBeardStyleId('none');
        }
    }, [gender]);
    
    const setBaseImageFromFile = async (file: File) => {
        setIsLoading(true); setLoadingMessage('正在處理圖片...');
        try {
          const fileData = await fileToBase64(file);
          const url = URL.createObjectURL(file);
          setBaseImage({ url, fileData }); resetHistory(null); setAiAnalysis(null);
          
          // Detect aspect ratio
          const img = new Image();
          img.onload = () => {
              const ratio = img.width / img.height;
              const supported = [
                  { val: '1:1', r: 1 },
                  { val: '3:4', r: 3/4 },
                  { val: '4:3', r: 4/3 },
                  { val: '9:16', r: 9/16 },
                  { val: '16:9', r: 16/9 }
              ];
              const closest = supported.reduce((prev, curr) => 
                  Math.abs(curr.r - ratio) < Math.abs(prev.r - ratio) ? curr : prev
              );
              setDetectedRatio(closest.val as any);
          };
          img.src = url;
        } catch (err) { setError(getFriendlyErrorMessage(err)); } 
        finally { setIsLoading(false); }
    };
    
    const handleBaseImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) { setBaseImageFromFile(e.target.files[0]); }
    };

    const handleHairstyleRefImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const fileData = await fileToBase64(file);
            setHairstyleRefImage({ url: URL.createObjectURL(file), fileData });
        }
    };
    
    const handleFaceAnchorUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            try {
                const fileData = await fileToBase64(file);
                const url = URL.createObjectURL(file);
                setFaceAnchor({ url, fileData });
            } catch (err) { setError(getFriendlyErrorMessage(err)); }
        }
    };

    const handleColorStopChange = (id: number, hex: string) => { setColorStops(stops => stops.map(stop => stop.id === id ? { ...stop, hex } : stop)); };
    const handleAddColorStop = () => { if (colorStops.length < 5) { setColorStops(stops => [...stops, { id: Date.now(), hex: '#ffffff' }]); } };
    const handleRemoveColorStop = (id: number) => { if (colorStops.length > 2) { setColorStops(stops => stops.filter(stop => stop.id !== id)); } };

    const constructPrompt = useCallback(async () => {
        const makeupPresets = MAKEUP_PRESETS[gender];
        const makeupPreset = makeupPresets.find(p => p.id === selectedMakeupPresetId);
        const makeupKeyword = makeupPreset?.keyword || selectedMakeupPresetId;
        
        const beardPreset = BEARD_PRESETS.find(p => p.id === beardStyleId);
        const beardPrompt = beardPreset?.prompt || '';

        const basePrompt = buildSalonPrompt(
            hairstyleParams,
            hairColor,
            hairColorMode,
            colorStops,
            gradientCoverage,
            highlightPattern,
            highlightDensity,
            selectedPresetId === 'keep-current',
            makeupKeyword,
            makeupIntensity,
            makeupParams,
            isSelfieMode,
            beardPrompt,
            beardColor
        );
        // Stage 1b-T10: the 'custom' preset has empty params/prompt, so the user's description is the ONLY hairstyle instruction — it was previously never wired in (dead textarea). Translate ZH→EN here; the three pipeline exits downstream are already enforce.
        if (selectedPresetId === 'custom' && customHairstyleDescription.trim()) {
            const customEn = await ensureEnglishPrompt(customHairstyleDescription, 'a desired hairstyle description');
            return `${basePrompt} Desired custom hairstyle: ${customEn}.`;
        }
        return basePrompt;
    }, [selectedPresetId, hairstyleParams, hairColor, hairColorMode, colorStops, gradientCoverage, highlightPattern, highlightDensity, selectedMakeupPresetId, makeupIntensity, makeupParams, isSelfieMode, gender, beardStyleId, beardColor, customHairstyleDescription]);

    const handleCopy = async (url: string, id: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ [blob.type]: blob })
            ]);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
            addNotification({ type: 'success', message: '已複製圖片到剪貼簿' });
        } catch (err) {
            console.error('Failed to copy image:', err);
            addNotification({ type: 'error', message: '複製失敗' });
        }
    };

    const handleMatrixUpload = async (angleId: string, file: File) => {
        try {
            const fileData = await fileToBase64(file);
            const url = URL.createObjectURL(file);
            setSalonMatrix(prev => ({
                ...prev,
                [angleId]: { ...prev[angleId], url, fileData }
            }));
            
            // If uploading front image, also set as base image for standard mode compatibility
            if (angleId === 'front') {
                setBaseImage({ url, fileData });
            }
        } catch (err) {
            setError(getFriendlyErrorMessage(err));
        }
    };

    const handleRegenerateAngle = async (angleId: string) => {
        const angle = MODEL_ANGLES.find(a => a.id === angleId);
        if (!angle) return;

        setIsRegenerating(angleId);
        try {
            const prompt = await constructPrompt();
            const rawAnglePrompt = `${prompt}, ${angle.en}`;
            // Stage 1b batch 3: English-only preset chain (prompt/keyword/en fields) — safe to enforce.
            const anglePrompt = runPromptPipeline(rawAnglePrompt, { source: 'hairSalon:transformHairAndMakeup:regenerateAngle' }).prompt;
            
            const matrixImages = (Object.values(salonMatrix) as any[])
                .filter(m => m.fileData)
                .map(m => m.fileData!);

            const personData = matrixImages.length > 0 ? matrixImages : baseImage?.fileData;
            const primaryPerson = matrixImages.length > 0 ? matrixImages[0] : baseImage?.fileData;
            const identityRef = faceAnchor ? faceAnchor.fileData : primaryPerson;

            const config = { 
                usePro: quality !== 'standard', 
                imageConfig: {
                    aspectRatio: detectedRatio,
                    imageSize: quality === 'ultra' ? '4K' : (quality === 'high' ? '2K' : '1K'),
                    seed: Math.floor(Math.random() * 1000000)
                }
            };

            const result = await transformHairAndMakeup(personData, identityRef, anglePrompt, config, () => {}, hairstyleRefImage?.fileData);
            setMultiAngleResults(prev => ({ ...prev, [angleId]: result }));
            
            if (angleId === 'front') {
                setGeneratedImage(result);
            }

            addNotification({
                type: 'success',
                message: `${angle.label} 重新生成完成`,
            });
        } catch (err: any) {
            setError(err.message || '重新生成失敗');
        } finally {
            setIsRegenerating(null);
        }
    };

    const handleGenerate = useCallback(async () => {
        if (!baseImage && !isMultiAngleMode) { setError('請先上傳或選擇一張基礎模特兒圖片。'); return; }
        if (isMultiAngleMode && !(Object.values(salonMatrix) as any[]).some(m => m.fileData)) {
            setError('請至少上傳一張模特兒照片。');
            return;
        }

        setIsLoading(true); setLoadingMessage('正在啟動寫實渲染引擎...'); setError(null);
        try {
          setLoadingMessage('正在分析原圖光影與皮膚紋理...');
          const prompt = await constructPrompt();
          
          const matrixImages = isMultiAngleMode 
            ? (Object.values(salonMatrix) as any[])
                .filter(m => m.fileData)
                .map(m => m.fileData!)
            : null;

          const personData = isMultiAngleMode ? matrixImages : baseImage?.fileData;
          const primaryPerson = isMultiAngleMode ? (matrixImages as any[])[0] : baseImage?.fileData;
          const identityRef = faceAnchor ? faceAnchor.fileData : primaryPerson;

          const config = { 
            usePro: quality !== 'standard', 
            imageConfig: {
                aspectRatio: detectedRatio,
                imageSize: quality === 'ultra' ? '4K' : (quality === 'high' ? '2K' : '1K')
            }
          };

          if (isMultiAngleMode) {
              setLoadingMessage("正在執行多角度矩陣生成 (1/4)...");
              const results: Record<string, string> = {};
              const generationSeed = Math.floor(Math.random() * 1000000);
              
              for (let i = 0; i < MODEL_ANGLES.length; i++) {
                  const angle = MODEL_ANGLES[i];
                  setLoadingMessage(`正在生成角度: ${angle.label} (${i+1}/4)...`);
                  
                  const rawAnglePrompt = `${prompt}, ${angle.en}`;
                  // Stage 1b batch 3: English-only preset chain — safe to enforce.
                  const anglePrompt = runPromptPipeline(rawAnglePrompt, { source: 'hairSalon:transformHairAndMakeup:multiAngle' }).prompt;
                  const angleConfig = {
                      ...config,
                      imageConfig: {
                          ...config.imageConfig,
                          seed: generationSeed
                      }
                  };

                  const result = await transformHairAndMakeup(personData, identityRef, anglePrompt, angleConfig, setLoadingMessage, hairstyleRefImage?.fileData);
                  results[angle.id] = result;
                  setMultiAngleResults(prev => ({ ...prev, [angle.id]: result }));
              }
              
              setGeneratedImage(results['front']);
              addNotification({
                  type: 'success',
                  message: '多角度生成完成！',
                  description: '已切換至 4 宮格預覽模式。'
              });
          } else {
              setLoadingMessage('正在執行髮絲微觀渲染與妝容融合...');
              // Stage 1b batch 3: English-only preset chain — safe to enforce.
              // (customHairstyleDescription is wired into constructPrompt as of Stage 1b-T10, translated via ensureEnglishPrompt.)
              const pipelinedPrompt = runPromptPipeline(prompt, { source: 'hairSalon:transformHairAndMakeup:single' }).prompt;
              const result = await transformHairAndMakeup(baseImage!.fileData, identityRef, pipelinedPrompt, config, setLoadingMessage, hairstyleRefImage?.fileData);
              setGeneratedImage(result);
              
              // Phase 3: Get Stylist Feedback
              try {
                  const feedback = await getStylistFeedback({ data: result.split(',')[1], mimeType: 'image/jpeg' });
                  setStylistFeedback(feedback);
              } catch (e) {
                  console.warn("Failed to get stylist feedback", e);
              }
          }
        } catch (err) { setError(getFriendlyErrorMessage(err)); } 
        finally { setIsLoading(false); }
    }, [baseImage, isMultiAngleMode, salonMatrix, constructPrompt, hairstyleRefImage, setGeneratedImage, faceAnchor, quality, detectedRatio]);

    const handleAnalyze = async () => {
        if (!baseImage) return;
        setIsAnalyzing(true); setError(null);
        try {
            const result = await getAIStyleAnalysis(baseImage.fileData, gender);
            setAiAnalysis({ summary: result.summary, recommendations: result.recommendations });
            let typedRecs = result.recommendations as { hairstyle_id: string; hair_color_description: string; makeup_id: string; makeup_intensity: number; };
            const isCasualOutfit = result.context?.outfit_type === 'casual-daily';
            const isHeavyMakeup = ['stage-glam', 'party-sparkle', 'smokey-eyes', 'haute-couture'].includes(typedRecs.makeup_id);
            if (isCasualOutfit && isHeavyMakeup && typedRecs.makeup_intensity > 75) {
                const fallbackMakeup = Math.random() > 0.5 ? 'daily-chic' : 'k-beauty-dewy';
                typedRecs.makeup_id = fallbackMakeup;
                typedRecs.makeup_intensity = Math.floor(Math.random() * 11) + 50; 
                setAiAnalysis(prev => ({ ...(prev!), summary: prev!.summary + "\n(為搭配日常服飾，已自動將妝容調整為更合適的日常風格並降低強度。)" }));
            }
            const recommendedPreset = HAIRSTYLE_PRESETS[gender].find(p => p.id === typedRecs.hairstyle_id);
            if (recommendedPreset) {
                setSelectedPresetId(recommendedPreset.id); setHairstyleParams(recommendedPreset.params); setCustomHairstyleDescription('');
            } else {
                setSelectedPresetId('custom'); setCustomHairstyleDescription(typedRecs.hairstyle_id);
            }
            
            // Smart color mapping
            if (typedRecs.hair_color_description) {
                const colorMap: {[key: string]: string} = {
                    'black': '#000000', 'brown': '#5c4033', 'blonde': '#faf0be', 'red': '#8b0000', 'silver': '#c0c0c0', 'gold': '#ffd700'
                };
                const found = Object.keys(colorMap).find(k => typedRecs.hair_color_description.toLowerCase().includes(k));
                if (found) {
                    setHairColorMode('color');
                    setHairColor(colorMap[found]);
                }
            }
            
            const recommendedMakeup = MAKEUP_PRESETS[gender].find(p => p.id === typedRecs.makeup_id);
            setSelectedMakeupPresetId(recommendedMakeup ? recommendedMakeup.id : MAKEUP_PRESETS[gender][0].id);
            setMakeupIntensity(typedRecs.makeup_intensity || 60);
        } catch (err) { setError(getFriendlyErrorMessage(err)); } 
        finally { setIsAnalyzing(false); }
    };
    
    const handleSave = async () => {
        if (generatedImage) {
            try {
                await savePortfolioItem({
                    imageUrl: generatedImage,
                    sourceModule: 'HairSalon'
                });
                addNotification({ type: 'success', message: '已儲存至作品集' });
            } catch (err) {
                console.error('Failed to save portfolio item:', err);
                addNotification({ type: 'error', message: '儲存失敗' });
            }
        }
    };

    const handleClear = () => {
        setGeneratedImage(null);
        setMultiAngleResults({});
        setStylistFeedback(null);
        setAiAnalysis(null);
        resetHistory(null);
        addNotification({ type: 'info', message: '已重置所有生成結果' });
    };

    const handleStitchedDownload = async (layout: '2x2' | '1x4', ratio: '1:1' | '16:9') => {
        const urls = MODEL_ANGLES.map(a => multiAngleResults[a.id]).filter(url => url !== null) as string[];
        if (urls.length === 0) return;

        setIsLoading(true);
        setLoadingMessage('正在生成拼接大圖...');
        try {
            const stitchedUrl = await stitchImages(urls, layout, ratio);
            downloadImage(stitchedUrl, `pavora_salon_matrix_${layout}_${Date.now()}.jpg`, 'HairSalon');
        } catch (e) {
            console.error("Stitching failed", e);
            addNotification({ type: 'error', message: '拼接失敗' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadAll = () => {
        MODEL_ANGLES.forEach(angle => {
            const url = multiAngleResults[angle.id];
            if (url) {
                downloadImage(url, `pavora_salon_${angle.id}_${Date.now()}.jpg`, 'HairSalon');
            }
        });
        addNotification({ type: 'success', message: '已開始批次下載所有角度' });
    };

    const handleDownload = () => {
        if (isMultiAngleMode && Object.keys(multiAngleResults).length > 0) {
            Object.entries(multiAngleResults).forEach(([id, url]) => {
                if (url && typeof url === 'string') {
                    downloadImage(url, `pavora_hair_${id}_${Date.now()}.jpg`, 'HairSalon');
                }
            });
            return;
        }
        if (generatedImage) {
            downloadImage(generatedImage, `pavora_salon_${Date.now()}.jpg`, 'HairSalon');
        }
    };

    const handleSavePreset = () => {
        const name = prompt("請輸入造型方案名稱:");
        if (!name) return;
        
        const newPreset: SavedPreset = {
            id: `preset-${Date.now()}`,
            name,
            hairstyle: hairstyleParams,
            makeup: makeupParams,
            beardStyleId,
            beardColor,
            hairColor,
            hairColorMode,
            colorStops: colorStops.map(s => ({ hex: s.hex })),
            gradientPlacement,
            gradientCoverage,
            highlightPattern,
            highlightDensity,
            createdAt: new Date().toISOString()
        };
        
        saveSalonPreset(newPreset);
        setSavedPresets(getSalonPresets());
    };

    const handleLoadPreset = (preset: SavedPreset) => {
        setHairstyleParams(preset.hairstyle);
        setMakeupParams(preset.makeup);
        if (preset.beardStyleId) setBeardStyleId(preset.beardStyleId);
        if (preset.beardColor) setBeardColor(preset.beardColor);
        setHairColor(preset.hairColor);
        setHairColorMode(preset.hairColorMode);
        setColorStops(preset.colorStops.map((s, i) => ({ id: Date.now() + i, hex: s.hex })));
        setGradientPlacement(preset.gradientPlacement);
        setGradientCoverage(preset.gradientCoverage);
        setHighlightPattern(preset.highlightPattern);
        setHighlightDensity(preset.highlightDensity);
    };

    const displayImage = generatedImage || baseImage?.url;
    const beforeImage = history[cursor - 1] ?? (generatedImage ? baseImage?.url : null);
    const currentHairstylePresets = HAIRSTYLE_PRESETS[gender];
    const hairstyleOptions = useMemo(() => {
        const special = currentHairstylePresets.filter(p => p.category === 'special').map(p => ({ value: p.id, label: p.name }));
        const short = currentHairstylePresets.filter(p => p.category === 'short').map(p => ({ value: p.id, label: p.name }));
        const medium = currentHairstylePresets.filter(p => p.category === 'medium').map(p => ({ value: p.id, label: p.name }));
        const long = currentHairstylePresets.filter(p => p.category === 'long').map(p => ({ value: p.id, label: p.name }));

        return [
            ...special,
            { label: '短髮系列 (Short)', options: short },
            { label: '中長髮系列 (Medium)', options: medium },
            { label: '長髮系列 (Long)', options: long }
        ];
    }, [currentHairstylePresets]);

    return (
        <div className="min-h-screen bg-[var(--color-bg-deep)] text-[var(--color-text-main)] font-sans pb-20">
             {isSalonCropModalOpen && salonCropSource && (
                <ManualCropModal
                    imageUrl={salonCropSource.url}
                    initialBoxes={salonDetectedBoxes}
                    angles={MODEL_ANGLES.map(a => ({ id: a.id, label: a.label, en: a.en }))}
                    onSave={async (boxes) => {
                        try {
                            setIsLoading(true);
                            setLoadingMessage('正在套用裁切...');
                            for (const box of boxes) {
                                const cropped = await cropImage(salonCropSource.fileData, box.box_2d);
                                const url = `data:${cropped.mimeType};base64,${cropped.data}`;
                                setSalonMatrix(prev => ({
                                    ...prev,
                                    [box.angle]: { 
                                        ...prev[box.angle], 
                                        url, 
                                        fileData: cropped 
                                    }
                                }));
                                if (box.angle === 'front') {
                                    setBaseImage({ url, fileData: cropped });
                                }
                            }
                            addNotification({ type: 'success', message: '多角度裁切已完成並套用' });
                        } catch (err) {
                            console.error('Salon crop save failed:', err);
                            addNotification({ type: 'error', message: '裁切套用失敗' });
                        } finally {
                            setIsLoading(false);
                            setIsSalonCropModalOpen(false);
                            setSalonCropSource(null);
                            setSalonDetectedBoxes([]);
                        }
                    }}
                    onClose={() => {
                        setIsSalonCropModalOpen(false);
                        setSalonCropSource(null);
                        setSalonDetectedBoxes([]);
                    }}
                    onResetToAI={async () => {
                        if (!salonCropSource) return;
                        try {
                            const boxes = await detectMultiAngleLayout(salonCropSource.fileData);
                            setSalonDetectedBoxes(boxes.map((b: any, i: number) => ({ 
                                ...b, id: `salon-auto-${Date.now()}-${i}` 
                            })));
                        } catch (e) {
                            console.error('AI Reset failed', e);
                        }
                    }}
                />
            )}
             {isLoading && <Loader message={loadingMessage} />}
             {previewingImage && (
                <ImagePreviewModal 
                    images={isMultiAngleMode ? MODEL_ANGLES.map(a => multiAngleResults[a.id]).filter(Boolean) as string[] : [previewingImage]} 
                    startIndex={isMultiAngleMode ? (MODEL_ANGLES.map(a => multiAngleResults[a.id]).filter(Boolean) as string[]).indexOf(previewingImage) : 0} 
                    onClose={() => setPreviewingImage(null)} 
                />
             )}
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleBaseImageUpload} />
             <input type="file" ref={hairstyleRefImageInputRef} className="hidden" accept="image/*" onChange={handleHairstyleRefImageUpload} />
             <input type="file" ref={faceAnchorInputRef} className="hidden" accept="image/*" onChange={handleFaceAnchorUpload} />

            {/* Header */}
            <div className="sticky top-[80px] z-30 glass-panel border-x-0 border-t-0 px-6 py-4 mb-8">
                <div className="max-w-[110rem] mx-auto flex justify-between items-center">
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-display font-bold uppercase tracking-[0.3em] text-[var(--color-text-main)]">妝髮設計</h2>
                        <span className="text-[9px] uppercase tracking-[0.5em] text-[var(--color-gold)] font-light">Beauty & Hair Salon Studio</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded-full animate-pulse">
                            <span className="w-1.5 h-1.5 bg-[var(--color-gold)] rounded-full"></span>
                            <span className="text-[9px] font-bold text-[var(--color-gold)] uppercase tracking-tighter">Realism Engine v1.0 Active</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-blue-400">
                                <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3A5.25 5.25 0 0 0 12 1.5Zm-3.25 5.25a3.25 3.25 0 0 1 6.5 0v3h-6.5v-3Z" clipRule="evenodd" />
                            </svg>
                            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter">Identity Lock Active</span>
                        </div>
                        {onGoHome && <Button onClick={onGoHome} variant="secondary" className="text-[10px] font-bold tracking-widest">返回首頁</Button>}
                    </div>
                </div>
            </div>

            <main className="max-w-[110rem] mx-auto px-6 lg:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Left Panel: Parameters */}
                    <div className="lg:col-span-4 flex flex-col space-y-6 h-full">
                        {/* 1. 初始模型 */}
                        <CollapsibleCard title="1. 初始模型" defaultOpen={true} icon={<PhotoIcon className="w-4 h-4" />}>
                            <div className="space-y-4">
                                {isMultiAngleMode ? (
                                    <div className="space-y-4">
                                        <div className="mb-2">
                                            <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl 
                                                text-[9px] font-black uppercase tracking-widest cursor-pointer 
                                                border transition-all w-full justify-center
                                                ${isSalonDetecting 
                                                    ? 'border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 text-[var(--color-gold)] animate-pulse cursor-not-allowed' 
                                                    : 'border-white/10 bg-white/[0.02] text-gray-400 hover:border-[var(--color-gold)]/50 hover:text-[var(--color-gold)]'
                                                }`}>
                                                {isSalonDetecting ? '⚡ AI 偵測中...' : '📷 上傳合照並自動裁切到四個視角'}
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    disabled={isSalonDetecting}
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        setIsSalonDetecting(true);
                                                        try {
                                                            const fileData = await fileToBase64(file);
                                                            const url = URL.createObjectURL(file);
                                                            const boxes = await detectMultiAngleLayout(fileData);
                                                            setSalonDetectedBoxes(boxes.map((b: any, i: number) => ({ 
                                                                ...b, id: `salon-auto-${i}` 
                                                            })));
                                                            setSalonCropSource({ url, fileData });
                                                            setIsSalonCropModalOpen(true);
                                                        } catch (err) {
                                                            console.error('Salon face detect failed:', err);
                                                            const reader = new FileReader();
                                                            reader.onload = (ev) => {
                                                                const dataUrl = ev.target?.result as string;
                                                                if (dataUrl) {
                                                                    setSalonCropSource({ 
                                                                        url: URL.createObjectURL(file), 
                                                                        fileData: { data: dataUrl.split(',')[1], mimeType: file.type }
                                                                    });
                                                                    setSalonDetectedBoxes([]);
                                                                    setIsSalonCropModalOpen(true);
                                                                }
                                                            };
                                                            reader.readAsDataURL(file);
                                                        } finally {
                                                            setIsSalonDetecting(false);
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                        {MODEL_ANGLES.map(angle => (
                                            <div key={angle.id} className="relative aspect-[3/4] bg-[var(--color-bg-input)] rounded-xl border border-[var(--color-border)] overflow-hidden group">
                                                {salonMatrix[angle.id].url ? (
                                                    <>
                                                        <img src={salonMatrix[angle.id].url!} alt={angle.label} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <button 
                                                                onClick={() => {
                                                                    const input = document.createElement('input');
                                                                    input.type = 'file';
                                                                    input.accept = 'image/*';
                                                                    input.onchange = (e) => {
                                                                        const file = (e.target as HTMLInputElement).files?.[0];
                                                                        if (file) handleMatrixUpload(angle.id, file);
                                                                    };
                                                                    input.click();
                                                                }}
                                                                className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all"
                                                            >
                                                                更換
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <button 
                                                        onClick={() => {
                                                            const input = document.createElement('input');
                                                            input.type = 'file';
                                                            input.accept = 'image/*';
                                                            input.onchange = (e) => {
                                                                const file = (e.target as HTMLInputElement).files?.[0];
                                                                if (file) handleMatrixUpload(angle.id, file);
                                                            };
                                                            input.click();
                                                        }}
                                                        className="w-full h-full flex flex-col items-center justify-center gap-2 text-[var(--color-text-dim)] hover:text-[var(--color-gold)] transition-colors"
                                                    >
                                                        <span className="text-xl">+</span>
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">{angle.label}</span>
                                                    </button>
                                                )}
                                                <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded text-[8px] font-bold text-white uppercase tracking-widest">
                                                    {angle.label}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                ) : baseImage ? (
                                    <div className="relative group rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-surface)]">
                                        <img src={baseImage.url} alt="Base model" className="w-full h-96 object-cover object-top" />
                                        <div className="absolute inset-0 bg-[var(--color-bg-deep)]/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                                            <Button onClick={() => fileInputRef.current?.click()} className="w-3/4">更換本地圖片</Button>
                                        </div>
                                        
                                        {/* Face Anchor Slot */}
                                        <div className="absolute top-4 right-4 w-24 h-24 glass-panel rounded-xl overflow-hidden border border-[var(--color-border)] shadow-2xl group/face">
                                            {faceAnchor ? (
                                                <div className="relative w-full h-full">
                                                    <img src={faceAnchor.url} alt="Face Anchor" className="w-full h-full object-cover" />
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setFaceAnchor(null); }} 
                                                        className="absolute top-1 right-1 bg-red-500/80 text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px] hover:bg-red-500 transition-colors"
                                                    >
                                                        &times;
                                                    </button>
                                                    <div className="absolute bottom-0 left-0 right-0 bg-[var(--color-bg-deep)]/70 text-[8px] uppercase tracking-widest py-1 text-center text-[var(--color-text-title)]">臉部錨定</div>
                                                </div>
                                            ) : (
                                                <div 
                                                    className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--color-bg-input)] transition-colors gap-1" 
                                                    onClick={(e) => { e.stopPropagation(); faceAnchorInputRef.current?.click(); }}
                                                >
                                                    <span className="text-xl text-[var(--color-gold)]">+</span>
                                                    <span className="text-[8px] uppercase tracking-tighter text-[var(--color-text-dim)]">臉部錨定</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full h-64 border-2 border-dashed border-[var(--color-border)] rounded-2xl flex flex-col items-center justify-center gap-3 text-[var(--color-text-dim)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-all group"
                                    >
                                        <PhotoIcon className="w-10 h-10 opacity-50 group-hover:scale-110 transition-transform" />
                                        <span className="text-xs font-bold uppercase tracking-[0.2em]">上傳模特兒照片</span>
                                    </button>
                                )}
                            </div>
                        </CollapsibleCard>

                        {/* Phase 3: Mood Board */}
                        <CollapsibleCard title="造型方案管理 (Mood Board)" defaultOpen={false} icon={<Sparkles className="w-4 h-4" />}>
                            <div className="space-y-4">
                                <Button onClick={handleSavePreset} variant="secondary" className="w-full text-xs font-bold tracking-widest">
                                    + 儲存當前造型方案
                                </Button>
                                
                                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {savedPresets.length === 0 ? (
                                        <p className="text-[10px] text-[var(--color-text-dim)] text-center py-4 italic">尚無儲存的方案</p>
                                    ) : (
                                        savedPresets.map(preset => (
                                            <div key={preset.id} className="p-3 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl flex justify-between items-center group/preset hover:border-[var(--color-gold)]/50 transition-all">
                                                <div className="flex flex-col cursor-pointer flex-1" onClick={() => handleLoadPreset(preset)}>
                                                    <span className="text-xs font-bold text-[var(--color-text-main)] group-hover/preset:text-[var(--color-gold)] transition-colors">{preset.name}</span>
                                                    <span className="text-[9px] text-[var(--color-text-dim)]">{new Date(preset.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        deleteSalonPreset(preset.id);
                                                        setSavedPresets(getSalonPresets());
                                                    }}
                                                    className="p-1.5 text-[var(--color-text-dim)] hover:text-red-500 opacity-0 group-hover/preset:opacity-100 transition-all"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </CollapsibleCard>

                        {/* 2. 造型設定 */}
                        <CollapsibleCard title="2. 造型設定" defaultOpen={true}>
                            <div className="space-y-6">
                                {/* Global Controls Integrated at the top of Styling section */}
                                <div className="p-4 bg-[var(--color-bg-input)] rounded-xl border border-[var(--color-border)] flex items-center justify-between gap-4 mb-2">
                                    <Button 
                                        onClick={handleAnalyze} 
                                        isLoading={isAnalyzing} 
                                        disabled={!baseImage} 
                                        variant="secondary" 
                                        className="flex-1 text-[13px] font-bold tracking-widest flex items-center justify-center gap-2 py-3.5"
                                    >
                                        <DiceIcon className="w-4 h-4"/> AI 智慧分析
                                    </Button>
                                    <div className="flex flex-col items-center gap-1 px-4 border-l border-[var(--color-border)]">
                                        <span className="text-[13px] font-bold uppercase tracking-widest text-[var(--color-gold)]">矩陣模式</span>
                                        <button 
                                            onClick={() => setIsMultiAngleMode(!isMultiAngleMode)}
                                            className={`w-10 h-5 rounded-full transition-all relative ${isMultiAngleMode ? 'bg-[var(--color-gold)]' : 'bg-[var(--color-bg-input)] border border-[var(--color-border)]'}`}
                                        >
                                            <motion.div 
                                                animate={{ x: isMultiAngleMode ? 20 : 0 }}
                                                className="absolute top-1 left-1 w-3 h-3 rounded-full bg-white shadow-sm"
                                            />
                                        </button>
                                    </div>
                                    <div className="flex flex-col items-center gap-1 px-4 border-l border-[var(--color-border)]">
                                        <span className="text-[13px] font-bold uppercase tracking-widest text-[var(--color-text-dim)]">自拍模式</span>
                                        <button 
                                            onClick={() => setIsSelfieMode(!isSelfieMode)}
                                            className={`w-10 h-5 rounded-full transition-all relative ${isSelfieMode ? 'bg-[var(--color-gold)]' : 'bg-[var(--color-bg-input)] border border-[var(--color-border)]'}`}
                                        >
                                            <motion.div 
                                                animate={{ x: isSelfieMode ? 20 : 0 }}
                                                className="absolute top-1 left-1 w-3 h-3 rounded-full bg-white shadow-sm"
                                            />
                                        </button>
                                    </div>
                                    <div className="flex flex-col items-center gap-1 px-4 border-l border-[var(--color-border)]">
                                        <span className="text-[13px] font-bold uppercase tracking-widest text-[var(--color-text-dim)]">專家模式</span>
                                        <button 
                                            onClick={() => setIsExpertMode(!isExpertMode)}
                                            className={`w-10 h-5 rounded-full transition-all relative ${isExpertMode ? 'bg-[var(--color-gold)]' : 'bg-[var(--color-bg-input)] border border-[var(--color-border)]'}`}
                                        >
                                            <motion.div 
                                                animate={{ x: isExpertMode ? 20 : 0 }}
                                                className="absolute top-1 left-1 w-3 h-3 rounded-full bg-white shadow-sm"
                                            />
                                        </button>
                                    </div>
                                </div>

                                {aiAnalysis && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 bg-[var(--color-gold)]/5 border border-[var(--color-gold)]/20 rounded-xl space-y-2 relative overflow-hidden group"
                                    >
                                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Sparkles className="w-12 h-12 text-[var(--color-gold)]" />
                                        </div>
                                        <div className="flex items-center gap-2 text-[var(--color-gold)]">
                                            <Sparkles className="w-4 h-4" />
                                            <span className="text-[11px] font-bold uppercase tracking-widest">AI 造型師建議</span>
                                        </div>
                                        <p className="text-xs text-[var(--color-text-main)] leading-relaxed italic">
                                            "{aiAnalysis.summary}"
                                        </p>
                                        <div className="pt-2 flex gap-2">
                                            <span className="px-2 py-0.5 bg-[var(--color-gold)]/10 text-[9px] font-bold text-[var(--color-gold)] rounded border border-[var(--color-gold)]/20 uppercase">
                                                適合您的臉型
                                            </span>
                                            <span className="px-2 py-0.5 bg-[var(--color-gold)]/10 text-[9px] font-bold text-[var(--color-gold)] rounded border border-[var(--color-gold)]/20 uppercase">
                                                專業推薦
                                            </span>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Tabs */}
                                <div className="flex p-1 bg-[var(--color-bg-input)] rounded-xl border border-[var(--color-border)]">
                                    <button 
                                        onClick={() => setActiveTab('hair')} 
                                        className={`flex-1 py-3 text-[14px] font-bold uppercase tracking-[0.2em] rounded-lg transition-all ${activeTab === 'hair' ? 'bg-[var(--color-bg-surface)] text-[var(--color-gold)] shadow-sm' : 'text-[var(--color-text-dim)] hover:text-[var(--color-text-main)]'}`}
                                    >
                                        髮型設計
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('makeup')} 
                                        className={`flex-1 py-3 text-[14px] font-bold uppercase tracking-[0.2em] rounded-lg transition-all ${activeTab === 'makeup' ? 'bg-[var(--color-bg-surface)] text-[var(--color-gold)] shadow-sm' : 'text-[var(--color-text-dim)] hover:text-[var(--color-text-main)]'}`}
                                    >
                                        妝容設計
                                    </button>
                                </div>

                                <AnimatePresence mode="wait">
                                    {activeTab === 'hair' ? (
                                        <motion.div 
                                            key="hair"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className="space-y-6"
                                        >
                                            <div className="space-y-4">
                                                <Select label="性別" options={[{value: 'female', label: '女'}, {value: 'male', label: '男'}]} value={gender} onChange={e => setGender(e.target.value as 'female' | 'male')} />
                                                
                                                <div className={`grid ${gender === 'male' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                                                    <div className={`transition-all duration-500 ${aiAnalysis?.recommendations?.hairstyle_id ? 'ring-2 ring-[var(--color-gold)] ring-offset-2 ring-offset-[var(--color-bg-deep)] rounded-lg' : ''}`}>
                                                        <Select label="髮型預設" options={hairstyleOptions} value={selectedPresetId} onChange={e => { const id = e.target.value; setSelectedPresetId(id); setHairstyleParams(currentHairstylePresets.find(p=>p.id === id)?.params || {}); }} />
                                                    </div>
                                                    {gender === 'male' && (
                                                        <Select 
                                                            label="鬍型預設" 
                                                            options={BEARD_PRESETS.map(p => ({value: p.id, label: p.name}))} 
                                                            value={beardStyleId} 
                                                            onChange={e => setBeardStyleId(e.target.value)} 
                                                        />
                                                    )}
                                                </div>

                                                {/* Beard Color adjustment for Male */}
                                                {gender === 'male' && beardStyleId !== 'none' && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        className="p-3 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl flex items-center justify-between"
                                                    >
                                                        <label className="text-[11px] uppercase tracking-widest font-bold text-[var(--color-text-dim)]">鬍型顏色</label>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-mono text-[var(--color-text-dim)]">{beardColor.toUpperCase()}</span>
                                                            <input 
                                                                type="color" 
                                                                value={beardColor} 
                                                                onChange={e => setBeardColor(e.target.value)} 
                                                                className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                                                                title="手動調整鬍色 (不與髮色同步)"
                                                            />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>

                                            {selectedPresetId !== 'keep-current' && selectedPresetId !== 'custom' && (
                                                <div className="space-y-4 p-4 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <Slider label="蓬鬆度" min={0} max={100} value={hairstyleParams.volume || 50} onChange={e => setHairstyleParams(prev => ({...prev, volume: Number(e.target.value)}))} unit="%" />
                                                        <Slider label="捲曲度" min={0} max={100} value={hairstyleParams.curliness || 0} onChange={e => setHairstyleParams(prev => ({...prev, curliness: Number(e.target.value)}))} unit="%" />
                                                    </div>
                                                </div>
                                            )}

                                            {isExpertMode && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="grid grid-cols-2 gap-4 p-4 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl overflow-hidden"
                                                >
                                                    <Slider label="髮量密度" min={0} max={100} value={hairstyleParams.density || 50} onChange={e => setHairstyleParams(prev => ({...prev, density: Number(e.target.value)}))} unit="%" />
                                                    <Slider label="光澤強度" min={0} max={100} value={hairstyleParams.shine || 50} onChange={e => setHairstyleParams(prev => ({...prev, shine: Number(e.target.value)}))} unit="%" />
                                                    <Slider label="凌亂度" min={0} max={100} value={hairstyleParams.flyaways || 10} onChange={e => setHairstyleParams(prev => ({...prev, flyaways: Number(e.target.value)}))} unit="%" />
                                                    <Slider label="髮根支撐" min={0} max={100} value={hairstyleParams.root_lift || 50} onChange={e => setHairstyleParams(prev => ({...prev, root_lift: Number(e.target.value)}))} unit="%" />
                                                    <Slider label="胎毛修飾" min={0} max={100} value={hairstyleParams.baby_hair || 0} onChange={e => setHairstyleParams(prev => ({...prev, baby_hair: Number(e.target.value)}))} unit="%" />
                                                    <Slider label="層次高度" tooltip="控制髮尾的虛實與重量感。高層次顯得輕盈羽毛感，低層次顯得厚實重感。" min={0} max={100} value={hairstyleParams.layering || 30} onChange={e => setHairstyleParams(prev => ({...prev, layering: Number(e.target.value)}))} unit="%" />
                                                    <Slider label="量感調節" tooltip="模擬設計師打薄動作。減少髮絲密度，讓造型更具空氣感與線條感。" min={0} max={100} value={hairstyleParams.texturizing || 20} onChange={e => setHairstyleParams(prev => ({...prev, texturizing: Number(e.target.value)}))} unit="%" />
                                                    <Select label="髮尾處理" tooltip="鈍剪適合俐落線條，點剪適合柔和過渡，羽毛剪則追求極致輕盈。" options={[{value: 'blunt', label: '鈍剪 (俐落)'}, {value: 'point', label: '點剪 (柔和)'}, {value: 'feathered', label: '羽毛剪 (輕盈)'}]} value={hairstyleParams.edge_finish || 'point'} onChange={e => setHairstyleParams(prev => ({...prev, edge_finish: e.target.value as any}))} />
                                                    <Select label="髮絲質感" options={[{value: 'matte', label: '霧面'}, {value: 'silk', label: '絲綢'}, {value: 'wet', label: '濕髮'}]} value={hairstyleParams.finish || 'silk'} onChange={e => setHairstyleParams(prev => ({...prev, finish: e.target.value as any}))} />
                                                    <Select label="分線位置" options={[{value: 'center', label: '中分'}, {value: 'left', label: '左分'}, {value: 'right', label: '右分'}, {value: 'zigzag', label: 'Z字分'}]} value={hairstyleParams.parting || 'center'} onChange={e => setHairstyleParams(prev => ({...prev, parting: e.target.value as any}))} />
                                                    <Select label="瀏海風格" options={[{value: 'none', label: '無'}, {value: 'wispy', label: '空氣瀏海'}, {value: 'blunt', label: '齊瀏海'}, {value: 'curtain', label: '八字瀏海'}]} value={hairstyleParams.bangs_style || 'none'} onChange={e => setHairstyleParams(prev => ({...prev, bangs_style: e.target.value as any}))} />
                                                </motion.div>
                                            )}

                                        {selectedPresetId === 'custom' && (
                                            <div className="space-y-4 p-4 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl animate-fade-in">
                                                <textarea 
                                                    value={customHairstyleDescription} 
                                                    onChange={e => setCustomHairstyleDescription(e.target.value)} 
                                                    placeholder="描述您想要的髮型，例如：'Voluminous Hollywood waves with deep side part'..." 
                                                    className="w-full bg-transparent text-sm outline-none resize-none min-h-[80px]" 
                                                />
                                                <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
                                                    <Button onClick={() => hairstyleRefImageInputRef.current?.click()} variant="secondary" className="text-[9px] font-bold tracking-widest">上傳參考圖</Button>
                                                    {hairstyleRefImage && (
                                                        <div className="relative group w-12 h-12 rounded-lg overflow-hidden border border-[var(--color-border)]">
                                                            <img src={hairstyleRefImage.url} className="w-full h-full object-cover" />
                                                            <button onClick={() => setHairstyleRefImage(null)} className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">&times;</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[12px] uppercase tracking-[0.2em] font-bold text-[var(--color-text-dim)]">色彩系統</h4>
                                                <div className="flex gap-2">
                                                    {['color', 'gradient', 'highlight'].map(mode => (
                                                        <button 
                                                            key={mode}
                                                            onClick={() => setHairColorMode(mode as any)} 
                                                            className={`text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded transition-all ${hairColorMode === mode ? 'text-[var(--color-gold)] border-b border-[var(--color-gold)]' : 'text-[var(--color-text-dim)] opacity-50 hover:opacity-100'}`}
                                                        >
                                                            {mode === 'color' ? '單色' : mode === 'gradient' ? '漸層' : '挑染'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {hairColorMode === 'color' ? (
                                                <div className="p-4 bg-[var(--color-bg-input)] rounded-xl border border-[var(--color-border)]">
                                                    <ColorPicker color={hairColor} onChange={setHairColor} />
                                                </div>
                                            ) : (
                                                <div className="space-y-6 p-4 bg-[var(--color-bg-input)] rounded-xl border border-[var(--color-border)] animate-fade-in">
                                                    {hairColorMode === 'gradient' && (
                                                        <div className="space-y-4">
                                                            <Select label="漸層位置" options={GRADIENT_PLACEMENT_PATTERNS} value={gradientPlacement} onChange={e => setGradientPlacement(e.target.value)} />
                                                            <Slider label="覆蓋範圍" min={10} max={100} value={gradientCoverage} onChange={e => setGradientCoverage(Number(e.target.value))} unit="%" />
                                                        </div>
                                                    )}
                                                    {hairColorMode === 'highlight' && (
                                                        <div className="space-y-4">
                                                            <Select label="挑染模式" options={HIGHLIGHT_PATTERNS} value={highlightPattern} onChange={e => setHighlightPattern(e.target.value)} />
                                                            <Slider label="挑染密度" min={10} max={100} value={highlightDensity} onChange={e => setHighlightDensity(Number(e.target.value))} unit="%" />
                                                        </div>
                                                    )}
                                                    
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-[12px] uppercase tracking-widest font-bold text-[var(--color-text-dim)]">顏色層級 (2-5)</label>
                                                            {colorStops.length < 5 && (
                                                                <button onClick={handleAddColorStop} className="text-[var(--color-gold)] text-[11px] font-bold hover:underline">+ 新增</button>
                                                            )}
                                                        </div>
                                                        <div className="space-y-2">
                                                            {colorStops.map((stop) => (
                                                                <div key={stop.id} className="flex items-center gap-3 p-2 bg-[var(--color-bg-surface)] rounded-lg border border-[var(--color-border)] group">
                                                                    <div className="relative w-8 h-8 rounded-md overflow-hidden border border-[var(--color-border)]">
                                                                        <input type="color" value={stop.hex} onChange={e => handleColorStopChange(stop.id, e.target.value)} className="absolute inset-[-10px] w-[200%] h-[200%] cursor-pointer"/>
                                                                    </div>
                                                                    <span className="text-xs font-mono text-[var(--color-text-dim)] flex-grow">{stop.hex.toUpperCase()}</span>
                                                                    <button onClick={() => handleRemoveColorStop(stop.id)} className="text-red-500/50 hover:text-red-500 transition-colors px-2 opacity-0 group-hover:opacity-100">&times;</button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div 
                                            key="makeup"
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="space-y-6"
                                        >
                                            <div className="space-y-4">
                                                <div className={`transition-all duration-500 ${aiAnalysis?.recommendations?.makeup_id ? 'ring-2 ring-[var(--color-gold)] ring-offset-2 ring-offset-[var(--color-bg-deep)] rounded-lg' : ''}`}>
                                                    <Select label="妝容預設" options={MAKEUP_PRESETS[gender].map(p => ({value: p.id, label: p.name}))} value={selectedMakeupPresetId} onChange={e => setSelectedMakeupPresetId(e.target.value)} />
                                                </div>
                                                <Slider label="整體妝容強度" min={0} max={100} value={makeupIntensity} onChange={e => setMakeupIntensity(Number(e.target.value))} unit="%" />
                                            </div>

                                            <div className="space-y-4 p-4 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl">
                                                <div className="pt-2 space-y-5">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[11px] uppercase tracking-widest font-bold text-[var(--color-text-dim)]">唇彩顏色</label>
                                                        <div className="flex items-center gap-3">
                                                            {isExpertMode && (
                                                                <div className="flex gap-2">
                                                                    <select 
                                                                        value={makeupParams.lipstick_blending || 'defined'} 
                                                                        onChange={e => setMakeupParams(prev => ({...prev, lipstick_blending: e.target.value as any}))}
                                                                        className="bg-[var(--color-bg-surface)] text-[10px] uppercase tracking-tighter border border-[var(--color-border)] rounded px-2 py-1 outline-none"
                                                                    >
                                                                        <option value="defined">俐落 (Defined)</option>
                                                                        <option value="gradient">咬唇 (Gradient)</option>
                                                                        <option value="overlined">擴唇 (Overlined)</option>
                                                                    </select>
                                                                    <select 
                                                                        value={makeupParams.lipstick_texture || 'glossy'} 
                                                                        onChange={e => setMakeupParams(prev => ({...prev, lipstick_texture: e.target.value as any}))}
                                                                        className="bg-[var(--color-bg-surface)] text-[10px] uppercase tracking-tighter border border-[var(--color-border)] rounded px-2 py-1 outline-none"
                                                                    >
                                                                        <option value="matte">霧面</option>
                                                                        <option value="glossy">水光</option>
                                                                        <option value="velvet">絲絨</option>
                                                                    </select>
                                                                </div>
                                                            )}
                                                            <input type="color" value={makeupParams.lipstick_color || '#ff0000'} onChange={e => setMakeupParams(prev => ({...prev, lipstick_color: e.target.value}))} className="w-7 h-7 rounded cursor-pointer bg-transparent border-none"/>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[11px] uppercase tracking-widest font-bold text-[var(--color-text-dim)]">眼影顏色</label>
                                                        <input type="color" value={makeupParams.eyeshadow_color || '#888888'} onChange={e => setMakeupParams(prev => ({...prev, eyeshadow_color: e.target.value}))} className="w-7 h-7 rounded cursor-pointer bg-transparent border-none"/>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[11px] uppercase tracking-widest font-bold text-[var(--color-text-dim)]">瞳孔顏色 (隱眼)</label>
                                                        <input type="color" value={makeupParams.contact_lens_color || '#442200'} onChange={e => setMakeupParams(prev => ({...prev, contact_lens_color: e.target.value}))} className="w-7 h-7 rounded cursor-pointer bg-transparent border-none"/>
                                                    </div>

                                                    {isExpertMode && (
                                                        <motion.div 
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            transition={{ duration: 0.3 }}
                                                            className="pt-4 border-t border-[var(--color-border)] space-y-5 overflow-hidden"
                                                        >
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="space-y-2">
                                                                    <label className="text-[11px] uppercase tracking-widest font-bold text-[var(--color-text-dim)]">底妝質感</label>
                                                                    <select 
                                                                        value={makeupParams.foundation_finish || 'satin'} 
                                                                        onChange={e => setMakeupParams(prev => ({...prev, foundation_finish: e.target.value as any}))}
                                                                        className="w-full bg-[var(--color-bg-input)] text-[11px] uppercase tracking-widest border border-[var(--color-border)] rounded-lg px-3 py-2.5 outline-none"
                                                                    >
                                                                        <option value="dewy">水光 (Dewy)</option>
                                                                        <option value="matte">霧面 (Matte)</option>
                                                                        <option value="satin">緞面 (Satin)</option>
                                                                    </select>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="text-[11px] uppercase tracking-widest font-bold text-[var(--color-text-dim)]">眉型設計</label>
                                                                    <select 
                                                                        value={makeupParams.eyebrow_style || 'natural'} 
                                                                        onChange={e => setMakeupParams(prev => ({...prev, eyebrow_style: e.target.value as any}))}
                                                                        className="w-full bg-[var(--color-bg-input)] text-[11px] uppercase tracking-widest border border-[var(--color-border)] rounded-lg px-3 py-2.5 outline-none"
                                                                    >
                                                                        <option value="natural">自然 (Natural)</option>
                                                                        <option value="bold">英氣 (Bold)</option>
                                                                        <option value="feathered">野生眉 (Feathered)</option>
                                                                        <option value="arched">挑眉 (Arched)</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <Slider label="睫毛長度" min={0} max={100} value={makeupParams.eyelash_length || 50} onChange={e => setMakeupParams(prev => ({...prev, eyelash_length: Number(e.target.value)}))} unit="%" />
                                                            <Slider label="臥蠶強度" tooltip="亞洲妝容靈魂。在眼下增加微光與陰影，讓雙眼更有神且具親和力。" min={0} max={100} value={makeupParams.aegyo_sal_intensity || 0} onChange={e => setMakeupParams(prev => ({...prev, aegyo_sal_intensity: Number(e.target.value)}))} unit="%" />
                                                            <Slider label="鼻影精修" tooltip="精細調整鼻樑與鼻頭陰影，打造立體骨相。" min={0} max={100} value={makeupParams.nose_sculpt || 30} onChange={e => setMakeupParams(prev => ({...prev, nose_sculpt: Number(e.target.value)}))} unit="%" />
                                                            <Slider label="下顎線條" tooltip="強化臉部輪廓邊緣，視覺上達到瘦臉與俐落感。" min={0} max={100} value={makeupParams.jawline_definition || 20} onChange={e => setMakeupParams(prev => ({...prev, jawline_definition: Number(e.target.value)}))} unit="%" />
                                                            <Slider label="眼頭打亮" tooltip="在眼頭點綴高光，增加眼神光與開眼角效果。" min={0} max={100} value={makeupParams.inner_corner_pop || 40} onChange={e => setMakeupParams(prev => ({...prev, inner_corner_pop: Number(e.target.value)}))} unit="%" />
                                                            <Slider label="截斷眼妝" tooltip="歐美專業技法 (Cut Crease)。強化眼窩深邃度，適合戲劇化妝效。" min={0} max={100} value={makeupParams.cut_crease || 0} onChange={e => setMakeupParams(prev => ({...prev, cut_crease: Number(e.target.value)}))} unit="%" />
                                                            <Slider label="皮膚紋理" tooltip="保留真實毛孔與微小細節，避免過度磨皮導致的假臉感。" min={0} max={100} value={makeupParams.skin_texture_intensity || 30} onChange={e => setMakeupParams(prev => ({...prev, skin_texture_intensity: Number(e.target.value)}))} unit="%" />
                                                            <Slider label="眼線銳利度" min={0} max={100} value={makeupParams.eyeliner_sharpness || 80} onChange={e => setMakeupParams(prev => ({...prev, eyeliner_sharpness: Number(e.target.value)}))} unit="%" />
                                                            <Slider label="修容強度" min={0} max={100} value={makeupParams.contour_intensity || 40} onChange={e => setMakeupParams(prev => ({...prev, contour_intensity: Number(e.target.value)}))} unit="%" />
                                                            <Slider label="高光亮度" min={0} max={100} value={makeupParams.highlight_intensity || 50} onChange={e => setMakeupParams(prev => ({...prev, highlight_intensity: Number(e.target.value)}))} unit="%" />
                                                            <Slider label="雀斑細節" min={0} max={100} value={makeupParams.freckles || 0} onChange={e => setMakeupParams(prev => ({...prev, freckles: Number(e.target.value)}))} unit="%" />
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </CollapsibleCard>

                        {/* 3. 畫質設定 */}
                        <CollapsibleCard title="3. 畫質設定" defaultOpen={false}>
                            <div className="space-y-4">
                                <Select 
                                    label="生成品質" 
                                    options={[
                                        {value: 'standard', label: '標準 (Flash)'}, 
                                        {value: 'high', label: '高品質 (Pro 2K)'}, 
                                        {value: 'ultra', label: '超高畫質 (Pro 4K)'}
                                    ]} 
                                    value={quality} 
                                    onChange={e => setQuality(e.target.value as QualityLevel)} 
                                />
                                <Select 
                                    label="圖片比例 (自動偵測)" 
                                    options={[
                                        {value: '1:1', label: '1:1 (正方形)'},
                                        {value: '3:4', label: '3:4 (人像)'},
                                        {value: '4:3', label: '4:3 (風景)'},
                                        {value: '9:16', label: '9:16 (長版人像)'},
                                        {value: '16:9', label: '16:9 (寬螢幕)'}
                                    ]} 
                                    value={detectedRatio} 
                                    disabled={true} 
                                    onChange={() => {}} 
                                />
                                <p className="text-[10px] text-[var(--color-text-dim)] mt-1 italic">
                                    * 系統已自動偵測並鎖定最接近原圖的比例，以確保生成穩定性。
                                </p>
                            </div>
                        </CollapsibleCard>

                        <button 
                            onClick={handleGenerate} 
                            disabled={isLoading || !baseImage}
                            className="btn-primary w-full py-5 rounded-xl flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                                    <span>正在渲染新造型...</span>
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:scale-125 transition-transform">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.456-2.455L18 2.25l.259 1.036a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.456 2.455L18 9.75Z" />
                                    </svg>
                                    <span className="text-lg">套用新造型</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Right Panel: Preview */}
                    <div className="lg:col-span-8">
                         <div className="glass-panel h-full min-h-[80vh] rounded-3xl flex flex-col p-8 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-gold),transparent_70%)] opacity-5 blur-3xl pointer-events-none"></div>
                            
                            <div className="p-6 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)] flex justify-between items-center relative z-10">
                                <div className="flex flex-col">
                                    <h3 className="text-2xl font-display font-bold uppercase tracking-widest text-[var(--color-text-main)]">造型預覽</h3>
                                    <span className="text-[11px] text-[var(--color-text-dim)] uppercase tracking-[0.3em]">Visual Preview</span>
                                </div>
                                
                                <div className="flex items-center gap-6">
                                    <div className="flex p-1.5 bg-[var(--color-bg-input)] rounded-xl border border-[var(--color-border)]">
                                        {(['slider', 'side-by-side', 'quad'] as const).map(m => (
                                            <button 
                                                key={m}
                                                onClick={() => setCompareMode(m)}
                                                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${compareMode === m ? 'bg-[var(--color-gold)] text-black shadow-lg' : 'text-[var(--color-text-dim)] hover:text-[var(--color-text-main)]'}`}
                                            >
                                                {m === 'slider' ? '滑動' : m === 'side-by-side' ? '並排' : '四格'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-grow bg-[var(--color-bg-surface)] rounded-2xl flex items-center justify-center relative overflow-hidden border border-[var(--color-border)] shadow-inner">
                                {isMultiAngleMode ? (
                                    <div className="w-full max-w-4xl grid grid-cols-2 gap-4 p-4">
                                        {MODEL_ANGLES.map(angle => {
                                            const result = multiAngleResults[angle.id];
                                            return (
                                                <div key={angle.id} className={`relative aspect-[3/4] bg-white/5 rounded-2xl border border-white/10 overflow-hidden group ${isLoading && !result ? 'animate-pulse' : ''}`}>
                                                    {result ? (
                                                        <img 
                                                            src={result} 
                                                            className={`w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 ${isRegenerating === angle.id ? 'opacity-50 grayscale' : ''}`} 
                                                            alt={angle.label}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-700">
                                                            <div className="relative">
                                                                <PhotoIcon className="w-12 h-12 mb-2 opacity-10" />
                                                                {isLoading && (
                                                                    <motion.div 
                                                                        animate={{ rotate: 360 }}
                                                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                                        className="absolute -top-1 -right-1"
                                                                    >
                                                                        <Sparkles className="w-4 h-4 text-[var(--color-gold)] opacity-40" />
                                                                    </motion.div>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-20">{angle.label}</span>
                                                            <span className="text-[8px] uppercase tracking-widest opacity-10 mt-1">
                                                                {isLoading ? '正在渲染細節...' : '等待生成'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {isRegenerating === angle.id && (
                                                        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/20 backdrop-blur-[2px]">
                                                            <Loader message="正在重新生成此角度..." />
                                                        </div>
                                                    )}
                                                    <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded text-[9px] font-bold text-white uppercase tracking-widest z-10">
                                                        {angle.label}
                                                    </div>
                                                    {result && !isRegenerating && (
                                                        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 z-10">
                                                            <button 
                                                                onClick={() => handleCopy(result, angle.id)}
                                                                className="p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full hover:bg-[var(--color-gold)] hover:text-black transition-all"
                                                                title="複製圖片"
                                                            >
                                                                {copiedId === angle.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                            </button>
                                                            <button 
                                                                onClick={() => handleRegenerateAngle(angle.id)}
                                                                className="p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full hover:bg-[var(--color-gold)] hover:text-black transition-all"
                                                                title="重新生成此角度"
                                                            >
                                                                <DiceIcon className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button 
                                                                onClick={() => setPreviewingImage(result)}
                                                                className="p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full hover:bg-[var(--color-gold)] hover:text-black transition-all"
                                                                title="放大預覽"
                                                            >
                                                                <ExpandIcon className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : beforeImage && generatedImage ? (
                                    <ImageCompareSlider beforeImage={beforeImage} afterImage={generatedImage} mode={compareMode} history={history.filter((h): h is string => h !== null)} />
                                ) : displayImage ? (
                                    <img src={displayImage} alt="Final look" className="max-h-full max-w-full object-contain rounded-md transition-all duration-700 animate-fade-in" />
                                ) : (
                                    <div className="text-center text-[var(--color-text-dim)] space-y-4">
                                        <div className="w-20 h-20 mx-auto rounded-full bg-[var(--color-bg-surface)] flex items-center justify-center animate-pulse">
                                            <PhotoIcon className="w-10 h-10" />
                                        </div>
                                        <p className="text-lg font-display tracking-widest uppercase">等待造型套用</p>
                                    </div>
                                )}
                            </div>

                            {isPrecisionMode && (generatedImage || baseImage?.url) && (
                                <MaskEditor 
                                    imageSrc={generatedImage || baseImage!.url} 
                                    onConfirm={async (mask, instr) => {
                                        setIsPrecisionMode(false);
                                        setIsLoading(true);
                                        setLoadingMessage('執行精密修復...');
                                        try {
                                            const baseData = await imageUrlToimageData(generatedImage || baseImage!.url);
                                            const maskData = await imageUrlToimageData(mask);
                                            const result = await tuneImageDetail(baseData, maskData, instr, [baseImage!.fileData], setLoadingMessage, { 
                                                usePro: quality !== 'standard', 
                                                resolution: quality === 'ultra' ? '4K' : '2K'
                                            });
                                            setGeneratedImage(result);
                                            addNotification({ type: 'success', message: '細節修正完成' });
                                        } catch (e) { 
                                            setError(getFriendlyErrorMessage(e)); 
                                            addNotification({ type: 'error', message: '修正失敗' });
                                        }
                                        finally { setIsLoading(false); }
                                    }} 
                                    onCancel={() => setIsPrecisionMode(false)} 
                                />
                            )}

                            {/* 專業造型師回饋 - 移至功能欄上方 */}
                            {stylistFeedback && (
                                <div className="px-6 py-4 border-t border-white/5 bg-black/20 backdrop-blur-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-[var(--color-gold)]/10 flex items-center justify-center border border-[var(--color-gold)]/20">
                                            <Sparkles className="w-5 h-5 text-[var(--color-gold)]" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-[var(--color-gold)] uppercase tracking-widest">專業造型師回饋</h4>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">AI Stylist Analysis</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">整體評價</span>
                                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed">{stylistFeedback.overall_critique}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">髮型分析</span>
                                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed">{stylistFeedback.hair_analysis}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">妝容建議</span>
                                            <p className="text-sm text-[var(--color-text-main)] leading-relaxed">{stylistFeedback.makeup_analysis}</p>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex flex-wrap gap-2">
                                        {stylistFeedback.professional_tips.map((tip, i) => (
                                            <div key={i} className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] text-gray-400">
                                                • {tip}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 專業級 UI/UX 重新設計：智慧型懸浮中控台 */}
                            <div className="p-6 bg-[var(--color-bg-panel)] border-t border-[var(--color-border)] flex flex-col gap-6 relative z-20">
                                
                                {/* Main Action Dock - 使用 Grid 佈局確保對齊且不超出邊界 */}
                                <div className="flex flex-col md:grid md:grid-cols-[1fr_auto_1fr] items-center gap-4 bg-black/20 p-2 rounded-2xl border border-white/5 backdrop-blur-sm w-full">
                                    
                                    {/* Left Group: Management & History */}
                                    <div className="flex items-center gap-1 justify-start w-full">
                                        <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/5 mr-2">
                                            <button 
                                                onClick={() => undo()} 
                                                disabled={!canUndo}
                                                className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-all"
                                                title="上一步"
                                            >
                                                <ChevronLeftIcon className="w-4 h-4" />
                                            </button>
                                            <div className="w-px h-4 bg-white/10 mx-1"></div>
                                            <button 
                                                onClick={() => redo()} 
                                                disabled={!canRedo}
                                                className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-all"
                                                title="下一步"
                                            >
                                                <ChevronRightIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        
                                        <Button 
                                            onClick={handleClear} 
                                            variant="secondary"
                                            className="h-10 px-3 border-transparent hover:border-red-500/30 text-gray-500 hover:text-red-400 transition-all whitespace-nowrap"
                                            title="清空所有設定"
                                        >
                                            <RotateCcw className="w-4 h-4 mr-2" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">重置</span>
                                        </Button>
                                    </div>

                                    {/* Center Group: Core AI Action */}
                                    <div className="flex justify-center">
                                        {generatedImage && (
                                            <Button 
                                                onClick={() => setIsPrecisionMode(true)} 
                                                variant="secondary" 
                                                className="h-12 px-10 text-[var(--color-gold)] border-[var(--color-gold)]/30 font-bold flex items-center gap-3 bg-[var(--color-gold)]/5 hover:bg-[var(--color-gold)]/10 shadow-[0_0_30px_rgba(212,175,55,0.15)] rounded-full transition-all duration-500 group whitespace-nowrap"
                                            >
                                                <TuneIcon className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" /> 
                                                <span className="tracking-[0.25em] uppercase text-xs">局部細節修正</span>
                                            </Button>
                                        )}
                                    </div>

                                    {/* Right Group: Output & Export */}
                                    <div className="flex items-center gap-2 justify-end w-full">
                                        {generatedImage && (
                                            <>
                                                <button 
                                                    onClick={() => setPreviewingImage(generatedImage)}
                                                    className="p-3 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
                                                    title="放大預覽"
                                                >
                                                    <Maximize2 className="w-4 h-4" />
                                                </button>
                                                <Button 
                                                    onClick={handleSave} 
                                                    variant="secondary"
                                                    className="h-11 px-5 text-xs font-bold tracking-widest border-gray-800 hover:border-white/20 whitespace-nowrap flex-shrink-0"
                                                >
                                                    <Save className="w-4 h-4 mr-2 opacity-60" />
                                                    儲存作品
                                                </Button>
                                                <Button 
                                                    onClick={handleDownload} 
                                                    variant="light"
                                                    className="h-11 px-6 text-xs font-bold tracking-widest shadow-2xl flex items-center gap-2 bg-white text-black hover:bg-gray-200 whitespace-nowrap flex-shrink-0"
                                                >
                                                    <DownloadIcon className="w-4 h-4"/> 下載結果
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Matrix Mode: Batch Export Tray */}

                                {/* Mobile/Small Screen AI Button Fallback */}
                                {generatedImage && (
                                    <div className="xl:hidden flex justify-center">
                                        <Button 
                                            onClick={() => setIsPrecisionMode(true)} 
                                            variant="secondary" 
                                            className="w-full h-11 text-[var(--color-gold)] border-[var(--color-gold)]/30 font-bold flex items-center justify-center gap-3 bg-[var(--color-gold)]/5"
                                        >
                                            <TuneIcon className="w-4 h-4" /> 局部細節修正
                                        </Button>
                                    </div>
                                )}

                                {/* Matrix Mode: Batch Export Tray */}
                                <AnimatePresence>
                                    {isMultiAngleMode && Object.keys(multiAngleResults).length > 0 && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="flex flex-col gap-4 p-5 bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl border border-white/5"
                                        >
                                            <div className="flex items-center gap-3 mb-1">
                                                <Layers className="w-4 h-4 text-[var(--color-gold)] opacity-70" />
                                                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">矩陣批次導出 (Batch Export)</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <Button 
                                                    onClick={() => handleStitchedDownload('2x2', '1:1')} 
                                                    variant="secondary" 
                                                    className="flex-1 h-10 text-[10px] font-bold tracking-widest border-gray-800 hover:border-white/20 hover:bg-white/5"
                                                >
                                                    拼接下載 (1:1)
                                                </Button>
                                                <Button 
                                                    onClick={() => handleStitchedDownload('1x4', '16:9')} 
                                                    variant="secondary" 
                                                    className="flex-1 h-10 text-[10px] font-bold tracking-widest border-gray-800 hover:border-white/20 hover:bg-white/5"
                                                >
                                                    拼接下載 (16:9)
                                                </Button>
                                                <Button 
                                                    onClick={handleDownloadAll} 
                                                    variant="secondary" 
                                                    className="flex-1 h-10 text-[10px] font-bold tracking-widest border-gray-800 hover:border-white/20 hover:bg-white/5"
                                                >
                                                    全部單張下載
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Bottom Row: Workflow Navigation */}
                                {generatedImage && (
                                    <div className="flex justify-center pt-2">
                                        <Button 
                                            onClick={() => onContinueEditing(generatedImage, 'scene')} 
                                            variant="secondary" 
                                            className="h-12 px-12 border-[var(--color-gold)]/20 hover:border-[var(--color-gold)]/50 text-[var(--color-gold)]/80 hover:text-[var(--color-gold)] transition-all group relative overflow-hidden rounded-full"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-gold)]/0 via-[var(--color-gold)]/10 to-[var(--color-gold)]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                            <ReplaceIcon className="w-4 h-4 mr-3 group-hover:rotate-12 transition-transform relative z-10" /> 
                                            <span className="text-xs font-bold tracking-[0.25em] uppercase relative z-10">繼續編輯場景 (Continue to Scene)</span>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

// --- Helper Components ---

const CollapsibleCard: React.FC<{ 
    title: string; 
    children: React.ReactNode; 
    defaultOpen?: boolean;
    icon?: React.ReactNode;
}> = ({ title, children, defaultOpen = true, icon }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="glass-panel rounded-2xl overflow-hidden border border-[var(--color-border)] transition-all duration-500">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--color-bg-input)] transition-colors group"
            >
                <div className="flex items-center gap-3">
                    {icon && <span className="text-[var(--color-gold)] opacity-70 group-hover:opacity-100 transition-all">{icon}</span>}
                    <h3 className="text-[15px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-main)]">{title}</h3>
                </div>
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={2} 
                    stroke="currentColor" 
                    className={`w-4 h-4 text-[var(--color-text-dim)] transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
            </button>
            <div className={`collapsible-content ${isOpen ? 'open' : ''}`}>
                <div className="px-6 pb-6 pt-2">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default HairAndMakeupStudio;
