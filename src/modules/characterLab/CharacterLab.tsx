
import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { transformImage, processTasksInParallel, fileToBase64, getFriendlyErrorMessage, imageUrlToimageData, confirmPaidFeature, analyzeStoryboard } from '../../shared/services/geminiService';
import { MATRIX_MODES, CHARACTER_NORMALIZATION_PROMPT, MatrixModeKey, MAGAZINE_LAYOUT_DNA, MAGAZINE_NEGATIVE_GUARD } from '../../prompts/character';
import { GLOBAL_FASHION_MAGAZINES, MAGAZINE_RECOMMENDATIONS, EDITORIAL_POSES, EDITORIAL_EXPRESSIONS, MICRO_VARIATION_POOL } from '../../shared/constants/constants';
import { savePortfolioItem } from '../../shared/services/storageService';
import { downloadImage } from '../../shared/utils/imageUtils';
import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
import Loader from '../../shared/components/common/Loader';
import ImagePreviewModal from '../../shared/components/common/ImagePreviewModal';
import Select from '../../shared/components/common/Select';
import Face3DIcon from '../../shared/assets/icons/Face3DIcon';
import DiceIcon from '../../shared/assets/icons/DiceIcon';
import SparklesIcon from '../../shared/assets/icons/SparklesIcon';
import DownloadIcon from '../../shared/assets/icons/DownloadIcon';
import ReplaceIcon from '../../shared/assets/icons/ReplaceIcon';
import PhotoIcon from '../../shared/assets/icons/PhotoIcon';
// FIX: Added missing icon imports used in JSX
import ExpandIcon from '../../shared/assets/icons/ExpandIcon';
import CloseIcon from '../../shared/assets/icons/CloseIcon';

import TuneIcon from '../../shared/assets/icons/TuneIcon';
import CheckIcon from '../../shared/assets/icons/CheckIcon';
import { useNotificationStore } from '../../shared/stores/useNotificationStore';

interface CharacterLabProps {
  onGoHome: () => void;
  initialImage?: { url: string; fileData: { data: string; mimeType: string; } } | null;
}

type QualityLevel = 'standard' | 'high';

interface MagazineCellData {
    magazineId: string;
    pose: string;
    expression: string;
}

const SLOT_TO_GRID_COORD = [
    "Row 1 Col 1 (Top Left)", 
    "Row 1 Col 2 (Top Center)", 
    "Row 1 Col 3 (Top Right)",
    "Row 2 Col 1 (Mid Left)", 
    "Row 2 Col 3 (Mid Right)",
    "Row 3 Col 1 (Bottom Left)", 
    "Row 3 Col 2 (Bottom Center)", 
    "Row 3泡沫環繞視圖 (Orbit)", 
];

const MAGAZINE_SLOT_LABELS = [
    "1. Top-Left (左上)", 
    "2. Top-Center (中上)", 
    "3. Top-Right (右上)",
    "4. Mid-Left (左中)", 
    "5. Mid-Right (右中)",
    "6. Bottom-Left (左下)", 
    "7. Bottom-Center (中下)", 
    "8. Bottom-Right (右下)"
];

const CharacterLab: React.FC<CharacterLabProps> = ({ onGoHome, initialImage }) => {
    const [baseImage, setBaseImage] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(null);
    const [faceAnchors, setFaceAnchors] = useState<{ url: string; fileData: { data: string; mimeType: string; } }[]>([]);
    const [gridImages, setGridImages] = useState<(string | null)[]>(Array(9).fill(null));
    const [progressStatus, setProgressStatus] = useState<string[]>(Array(9).fill('等待中'));
    const [singleResultImage, setSingleResultImage] = useState<string | null>(null);
    const [cellOverrides, setCellOverrides] = useState<string[]>(Array(9).fill(''));
    const [magazineGrid, setMagazineGrid] = useState<MagazineCellData[]>(Array(8).fill({ magazineId: '', pose: '', expression: '' }));
    const [customStylePrompt, setCustomStylePrompt] = useState('');
    const [selectedCells, setSelectedCells] = useState<Set<number>>(new Set());
    const [matrixMode, setMatrixMode] = useState<MatrixModeKey>('orbit');
    const [quality, setQuality] = useState<QualityLevel>('standard');
    const [isAdvancedMode, setIsAdvancedMode] = useState(false);
    const [isBatchMode, setIsBatchMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [previewingIndex, setPreviewingIndex] = useState<number | null>(null);
    const [previewingSingle, setPreviewingSingle] = useState(false);
    const [activeTab, setActiveTab] = useState<'identity' | 'strategy' | 'output'>('identity');
    const [characterDna, setCharacterDna] = useState<string>('');
    const [editingCellIndex, setEditingCellIndex] = useState<number | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const faceAnchorInputRef = useRef<HTMLInputElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const [phase1Image, setPhase1Image] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(null);
    const [storyboardScript, setStoryboardScript] = useState<{ story_breakdown: string; frames: { id: string; label: string; prompt: string; translation: string; }[] } | null>(null);

    const randomizeMagazines = () => {
        const shuffledMags = [...GLOBAL_FASHION_MAGAZINES].sort(() => 0.5 - Math.random());
        const shuffledPoses = [...EDITORIAL_POSES].sort(() => 0.5 - Math.random());
        const shuffledExprs = [...EDITORIAL_EXPRESSIONS].sort(() => 0.5 - Math.random());

        const selected = Array(8).fill(null).map((_, i) => {
            const mag = shuffledMags[i % shuffledMags.length];
            return {
                magazineId: mag.id,
                pose: shuffledPoses[i].value,
                expression: shuffledExprs[i].value
            };
        });
        setMagazineGrid(selected);
    };
    
    const updateMagazineCell = (index: number, magazineId: string) => {
        setMagazineGrid(prev => {
            const newGrid = [...prev];
            const rec = MAGAZINE_RECOMMENDATIONS[magazineId];
            newGrid[index] = {
                magazineId,
                pose: rec?.pose || EDITORIAL_POSES[0].value,
                expression: rec?.expression || EDITORIAL_EXPRESSIONS[0].value
            };
            return newGrid;
        });
    };

    const updatePoseExpression = (index: number, field: 'pose' | 'expression', value: string) => {
        setMagazineGrid(prev => {
             const newGrid = [...prev];
             newGrid[index] = { ...newGrid[index], [field]: value };
             return newGrid;
        });
    };

    useEffect(() => {
        if (initialImage) {
            setBaseImage(initialImage);
            resetGridState();
        }
    }, [initialImage]);

    useEffect(() => {
        if (baseImage) {
            resetGridState(false);
        }
        if (matrixMode === 'editorial_popout') {
            randomizeMagazines();
        }
        if (matrixMode !== 'outfit') {
            setIsBatchMode(false);
        }
    }, [matrixMode, baseImage]);

    const resetGridState = (fullReset = true) => {
        const newGrid = Array(9).fill(null);
        setGridImages(newGrid);
        setSingleResultImage(null);
        const newStatus = Array(9).fill('等待中');
        setStoryboardScript(null);
        
        if (matrixMode === 'outfit' || matrixMode === 'storyboard') {
             newStatus.fill('準備生成');
             if (baseImage && matrixMode === 'outfit') {
                 newGrid[4] = baseImage.url;
                 newStatus[4] = '原始圖片';
             }
        } else if (matrixMode === 'editorial_popout') {
        } else {
             newStatus[4] = '準備標準化';
        }
        
        setProgressStatus(newStatus);
        setCellOverrides(Array(9).fill('')); 
        if (fullReset) {
            setPhase1Image(null);
        } else if (phase1Image && matrixMode !== 'outfit' && matrixMode !== 'storyboard' && matrixMode !== 'editorial_popout') {
             setGridImages(prev => { const n = [...prev]; n[4] = phase1Image.url; return n; });
             setProgressStatus(prev => { const n = [...prev]; n[4] = '標準化完成'; return n; });
        }
        setSelectedCells(new Set());
    };

    const setBaseImageFromFile = async (file: File) => {
        setIsLoading(true); setLoadingMessage('處理圖片...');
        try {
            const fileData = await fileToBase64(file);
            const url = URL.createObjectURL(file);
            const base = { url, fileData };
            setBaseImage(base);
            resetGridState(true);
             if (matrixMode === 'outfit') {
                 setGridImages(prev => { const n = [...prev]; n[4] = url; return n; });
                 setProgressStatus(prev => { const n = [...prev]; n[4] = '原始圖片'; return n; });
            }
        } catch (err) { setError(getFriendlyErrorMessage(err)); } 
        finally { setIsLoading(false); }
    };

    const handleBaseImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) setBaseImageFromFile(e.target.files[0]);
    };

    const handleFaceAnchorUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            try {
                const fileData = await fileToBase64(file);
                const url = URL.createObjectURL(file);
                setFaceAnchors(prev => [...prev, { url, fileData }]);
                event.target.value = '';
            } catch (err) {
                setError(getFriendlyErrorMessage(err));
            }
        }
    };

    const removeFaceAnchor = (index: number) => {
        setFaceAnchors(prev => prev.filter((_, i) => i !== index));
    };
    
    const analyzeCharacterDna = async (fileData: { data: string; mimeType: string }) => {
        try {
            setLoadingMessage('正在分析角色視覺基因 (Extracting Visual DNA)...');
            const prompt = `
                Act as a Professional Character Designer. Analyze the provided images and extract the "Visual DNA" of the person.
                Focus on:
                1. Ethnicity and specific facial features (eye shape, nose bridge, lip fullness).
                2. Hair color, texture, and style.
                3. Skin tone and unique textures (freckles, pores, etc.).
                4. Overall vibe and bone structure.
                
                Output a concise 2-3 sentence description in English that can be used as a prompt prefix to maintain 100% identity consistency.
                Example: "A Caucasian female in her mid-20s, sharp jawline, almond-shaped green eyes, wavy auburn hair, fair skin with subtle freckles."
            `;
            const refs = faceAnchors.length > 0 ? faceAnchors.map(a => a.fileData) : [fileData];
            const dna = await transformImage(fileData, prompt, refs, undefined, { isTextOnly: true } as any);
            setCharacterDna(dna || '');
            return dna;
        } catch (e) {
            console.error("DNA Analysis failed", e);
            return '';
        }
    };

    const executePhase1 = async (): Promise<{ url: string; fileData: { data: string; mimeType: string; } } | null> => {
        if (!baseImage) return null;
        setLoadingMessage('Phase 1: 角色標準化與去背處理...');
        setProgressStatus(prev => { const n = [...prev]; n[4] = '標準化中...'; return n; });
        
        const refs = faceAnchors.length > 0 ? faceAnchors.map(a => a.fileData) : [baseImage.fileData];
        
        try {
            const resultUrl = await transformImage(baseImage.fileData, CHARACTER_NORMALIZATION_PROMPT, refs, undefined, {});
            setGridImages(prev => { const n = [...prev]; n[4] = resultUrl; return n; });
            setProgressStatus(prev => { const n = [...prev]; n[4] = '標準化完成'; return n; });
            const response = await fetch(resultUrl);
            const blob = await response.blob();
            const file = new File([blob], "normalized.jpg", { type: "image/jpeg" });
            const fileData = await fileToBase64(file);
            const p1Data = { url: resultUrl, fileData };
            setPhase1Image(p1Data);
            return p1Data;
        } catch (e) {
            console.error("Phase 1 failed", e);
            setProgressStatus(prev => { const n = [...prev]; n[4] = '標準化失敗'; return n; });
            setError("角色標準化失敗，請重試。");
            return null;
        }
    };

    const getPhase2Task = (index: number, referenceImage: { data: string; mimeType: string }) => async () => {
        setProgressStatus(prev => { const n = [...prev]; n[index] = '生成中...'; return n; });
        const currentConfig = MATRIX_MODES[matrixMode];
        
        let cellConfig = currentConfig.prompts[index];
        if (matrixMode === 'storyboard' && storyboardScript) {
            const frame = storyboardScript.frames.find(f => f.id === cellConfig.id);
            if (frame) {
                cellConfig = { ...cellConfig, prompt: frame.prompt, label: frame.label };
            }
        }

        try {
            let prompt = '';
            let negativePrompt = '';
            const usePro = quality === 'high';
            const config = { usePro, imageConfig: { aspectRatio: '9:16', ...(usePro ? { imageSize: '2K' } : {}) } };
            const specific_prompt_content = (cellOverrides[index] && cellOverrides[index].trim() !== '') ? cellOverrides[index] : cellConfig.prompt;

            const dnaPrefix = characterDna ? `[CHARACTER DNA]: ${characterDna}\n` : '';
            const identityLock = `[IDENTITY LOCK]: Absolute 1:1 facial reconstruction. Maintain exact bone structure and features from reference images.\n`;

            if (matrixMode === 'orbit') {
                 prompt = `${dnaPrefix}${identityLock}[Role] You are a technical 3D artist. [Task] Generate a Close-up Headshot based on the Reference Image. [Target Angle] ${specific_prompt_content}`;
                 negativePrompt = `(upside down:1.5), (inverted:1.5), (rotated:1.5), (full body:1.3), (standing pose), (legs), (knees), (gray background), (shadows), (gradient), complex background`;
            } else if (matrixMode === 'expression') {
                 prompt = `${dnaPrefix}${identityLock}[Role] Senior Character Artist. [Task] Generate a Waist-up Portrait based on the Reference Image. [Target Emotion] ${specific_prompt_content}`;
                 negativePrompt = `(gender change), (bad hands:1.5), (extra fingers:1.5), (gray background), (shadows), (gradient), complex background`;
            } else if (matrixMode === 'lighting') {
                 prompt = `${dnaPrefix}${identityLock}Generate a photorealistic portrait based on the Reference Image. TARGET: ${specific_prompt_content}`;
                 negativePrompt = `multiple views, split screen, collage, bad anatomy`;
            } else if (matrixMode === 'outfit') {
                 prompt = `${dnaPrefix}${identityLock}[Fashion Lookbook Generation] ${specific_prompt_content} ${customStylePrompt ? `User Style Note: ${customStylePrompt}` : ''} [CRITICAL REQUIREMENTS] 1. IDENTITY & OUTFIT LOCK: Must match the reference image exactly (same person, same clothes). 2. PHOTOREALISM: 8k resolution, high fashion photography texture.`;
                 negativePrompt = `(cartoon), (anime), (illustration), (3d render), (low quality), (blur), (distorted face)`;
            } else if (matrixMode === 'storyboard') {
                 prompt = `${dnaPrefix}${identityLock}[Cinematic Storyboard Generation] ${specific_prompt_content} ${customStylePrompt ? `Director's Note: ${customStylePrompt}` : ''}`;
                 negativePrompt = `(cartoon), (anime), (illustration), (text), (UI), (watermark)`;
            }
            
            prompt += `\nNegative Prompt: ${negativePrompt}`;
            const refs = [referenceImage];
            if (faceAnchors.length > 0) {
                faceAnchors.forEach(a => refs.push(a.fileData));
            }
            const resultUrl = await transformImage(referenceImage, prompt, refs, undefined, config);
            setGridImages(prev => { const n = [...prev]; n[index] = resultUrl; return n; });
            setProgressStatus(prev => { const n = [...prev]; n[index] = '完成'; return n; });
            return resultUrl;
        } catch (e: any) {
            setProgressStatus(prev => { const n = [...prev]; n[index] = '失敗'; return n; });
            return null;
        }
    };
    
    const executePhase2 = async (anchorImage: { url: string; fileData: { data: string; mimeType: string; } }) => {
        setLoadingMessage('Phase 2: 矩陣衍生生成中...');
        const tasks = MATRIX_MODES[matrixMode].prompts.map((config, index) => {
            if (index === 4) return null;
            return getPhase2Task(index, anchorImage.fileData);
        }).filter(Boolean) as (() => Promise<string | null>)[];
        try { await processTasksInParallel(tasks, 1, 3500, (msg) => setLoadingMessage(msg)); } 
        catch (err) { setError("生成過程中發生錯誤，部分圖片可能未完成。"); }
    };


    const generateMatrix = async () => {
        if (!baseImage) return;
        
        const usePro = quality === 'high';
        if (usePro) {
             try { const confirmed = await confirmPaidFeature(); if (!confirmed) return; } catch (e) { return; }
        }
        setIsLoading(true); setError(null);

        // Phase 2: DNA Analysis
        let dna = characterDna;
        if (!dna) {
            dna = await analyzeCharacterDna(baseImage.fileData);
        }
        
        const currentModeDefLocal = MATRIX_MODES[matrixMode];
        const effectiveSingleImage = currentModeDefLocal.isSingleImage || (matrixMode === 'outfit' && !isBatchMode);

        if (effectiveSingleImage) {
            setLoadingMessage('正在渲染單張拼貼海報...');
            try {
                const config = (matrixMode === 'outfit') ? currentModeDefLocal.prompts[9] : currentModeDefLocal.prompts[0];
                let prompt = `[Character DNA]: ${characterDna}\n${config.prompt}`;
                
                if (matrixMode === 'editorial_popout') {
                    let magazineSection = '';
                    const coords = SLOT_TO_GRID_COORD;
                    const getRandomMicroVariations = () => {
                        const pool = MICRO_VARIATION_POOL;
                        const keys = Object.keys(pool) as Array<keyof typeof pool>;
                        const num = Math.random() > 0.5 ? 2 : 3;
                        const shuffledKeys = keys.sort(() => 0.5 - Math.random()).slice(0, num);
                        return shuffledKeys.map(k => {
                            const options = pool[k];
                            return options[Math.floor(Math.random() * options.length)];
                        }).join(', ');
                    };

                    magazineGrid.forEach((cell, idx) => {
                        if (idx < coords.length && cell.magazineId) {
                            const mag = GLOBAL_FASHION_MAGAZINES.find(m => m.id === cell.magazineId);
                            if (mag) {
                                const cleanTitle = mag.label.split(' ')[0].replace(/[^a-zA-Z]/g, '').toUpperCase();
                                const exprObj = EDITORIAL_EXPRESSIONS.find(e => e.value === cell.expression);
                                const poseObj = EDITORIAL_POSES.find(p => p.value === cell.pose);
                                const exprPrompt = exprObj ? exprObj.prompt : cell.expression; 
                                const posePrompt = poseObj ? poseObj.prompt : cell.pose;
                                const micros = getRandomMicroVariations();
                                const layoutDna = MAGAZINE_LAYOUT_DNA[mag.id] || MAGAZINE_LAYOUT_DNA.default;
                                const cellPrompt = `**Title Masthead**: "${cleanTitle}". **Pose**: ${posePrompt}. **Expression**: ${exprPrompt}. **Details**: ${micros}. **Layout DNA**: ${layoutDna}. Visual Mood: ${mag.prompt}`;
                                magazineSection += `  - ${coords[idx]} Cell: ${cellPrompt}\n`;
                            }
                        }
                    });
                    
                    if (magazineSection) {
                         prompt = prompt.replace('{{MAGAZINE_GRID}}', magazineSection);
                    } else {
                         prompt = prompt.replace('{{MAGAZINE_GRID}}', '  - Use diverse high-fashion magazine wallpaper styles for all cells.');
                    }
                    prompt += `\n\n[NEGATIVE GUARD]: ${MAGAZINE_NEGATIVE_GUARD}`;
                }
                
                if (customStylePrompt) { prompt += `\n\n[USER STYLE OVERRIDE]: ${customStylePrompt}`; }
                
                const refs = [];
                if (faceAnchors.length > 0) {
                    faceAnchors.forEach(a => refs.push(a.fileData));
                } else {
                    refs.push(baseImage.fileData);
                }
                
                // ...
                
                const genConfig = { 
                    usePro,
                    imageConfig: {
                        aspectRatio: '9:16' as any,
                        ...(usePro ? { imageSize: '4K' } : {})
                    }
                };

                const resultUrl = await transformImage(baseImage.fileData, prompt, refs, setLoadingMessage, genConfig);
                setSingleResultImage(resultUrl);
                
            } catch (err) { setError(getFriendlyErrorMessage(err)); } 
            finally { setIsLoading(false); }
            return;
        }

        if (matrixMode === 'outfit' || matrixMode === 'storyboard') {
            const isStoryboard = matrixMode === 'storyboard';
            setLoadingMessage(isStoryboard ? '正在分析圖片並規劃分鏡腳本...' : '正在並行生成 8 張獨立穿搭圖檔...');
            
            if (isStoryboard) {
                try {
                    const script = await analyzeStoryboard(baseImage.fileData);
                    setStoryboardScript(script);
                } catch (e) {
                    console.error("Storyboard analysis failed", e);
                    setError("分鏡腳本分析失敗，將使用預設分鏡。");
                }
            }

            const tasks = MATRIX_MODES[matrixMode].prompts.slice(0, 9).map((config, index) => {
                if (matrixMode === 'outfit' && index === 4) {
                     setGridImages(prev => { const n = [...prev]; n[4] = baseImage.url; return n; });
                     setProgressStatus(prev => { const n = [...prev]; n[4] = '原始圖片'; return n; });
                     return null;
                }
                return getPhase2Task(index, baseImage.fileData);
            }).filter(Boolean) as (() => Promise<string | null>)[];
            
            try { await processTasksInParallel(tasks, 1, 3500, (msg) => setLoadingMessage(msg)); } 
            catch (err) { setError("生成失敗"); }
        } else {
            const anchor = await executePhase1();
            if (anchor) await executePhase2(anchor);
        }
        
        setIsLoading(false);
    };

    const regenerateCell = async (index: number) => {
        if (!baseImage) return;
        if (quality === 'high') { try { const confirmed = await confirmPaidFeature(); if (!confirmed) return; } catch (e) { return; } }
        
        let refImage = null;
        if (matrixMode === 'outfit' || matrixMode === 'storyboard') {
             refImage = baseImage.fileData;
        } else {
            if (index === 4) {
                setIsLoading(true);
                const anchor = await executePhase1();
                setIsLoading(false);
                if (anchor) {
                    const { addNotification } = useNotificationStore.getState();
                    addNotification({
                        type: 'info',
                        title: '錨點已更新',
                        message: '中心錨點已更新。建議重新生成整個矩陣。'
                    });
                }
                return;
            }
            if (!phase1Image) {
                setIsLoading(true);
                const anchor = await executePhase1();
                if (!anchor) { setIsLoading(false); return; }
                refImage = anchor.fileData;
            } else {
                refImage = phase1Image.fileData;
            }
        }
        
        if (refImage) {
            setIsLoading(true); setLoadingMessage(`正在重新嘗試生成格子 #${index + 1}...`);
            const task = getPhase2Task(index, refImage);
            await task();
            setIsLoading(false);
        }
    };

    const handleDownloadSingle = (url: string, suffix: string) => {
        downloadImage(url, `char_${matrixMode}_${suffix}_${Date.now()}.jpg`, 'CharacterLab');
    };

    const handleDownloadSheet = async () => {
        if (!gridRef.current) return;
        setIsLoading(true);
        try {
            const canvas = await html2canvas(gridRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const link = document.createElement('a');
            link.download = `character_matrix_${matrixMode}_sheet_${Date.now()}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.9);
            link.click();
            savePortfolioItem({ imageUrl: link.href, sourceModule: 'CharacterLab' });
        } catch (e) { setError("下載失敗"); } 
        finally { setIsLoading(false); }
    };

    const toggleCellSelection = (index: number) => {
        if (!gridImages[index]) return;
        setSelectedCells(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const handleBatchDownload = () => {
        if (selectedCells.size === 0) return;
        selectedCells.forEach((index) => {
            const url = gridImages[index];
            if (url) {
                const label = MATRIX_MODES[matrixMode].prompts[index].label.replace(/\s|\/|\\/g, '_');
                setTimeout(() => handleDownloadSingle(url, label), index * 300);
            }
        });
    };

    const handleCellOverrideChange = (index: number, value: string) => {
        setCellOverrides(prev => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    };
    
    // FIX: currentModeDef was used in render without definition
    const currentModeDef = MATRIX_MODES[matrixMode];
    const displayAsSingleImage = currentModeDef.isSingleImage || (matrixMode === 'outfit' && !isBatchMode);

    return (
        <div className="container mx-auto p-8 max-w-8xl animate-fade-in">
            {isLoading && <Loader message={loadingMessage} />}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleBaseImageUpload} />
            <input type="file" ref={faceAnchorInputRef} className="hidden" accept="image/*" onChange={handleFaceAnchorUpload} />
            
            {previewingIndex !== null && gridImages[previewingIndex] && (
                <ImagePreviewModal
                    images={gridImages.filter(Boolean) as string[]}
                    startIndex={gridImages.filter(Boolean).indexOf(gridImages[previewingIndex] as string)}
                    onClose={() => setPreviewingIndex(null)}
                    srcId={gridImages[previewingIndex]!}
                />
            )}
            
            {previewingSingle && singleResultImage && (
                <ImagePreviewModal
                    images={[singleResultImage]}
                    startIndex={0}
                    onClose={() => setPreviewingSingle(false)}
                    srcId={singleResultImage}
                />
            )}

            {editingCellIndex !== null && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--color-bg-deep)]/80 backdrop-blur-md animate-fade-in">
                    <Card className="w-full max-w-lg border-[var(--color-gold)]/30 shadow-2xl animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[var(--color-gold)]/10 flex items-center justify-center">
                                    <TuneIcon className="w-6 h-6 text-[var(--color-gold)]" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[var(--color-text-title)]">格位精確指令 (Cell Override)</h3>
                                    <p className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-widest">Editing Slot #{editingCellIndex + 1}: {MATRIX_MODES[matrixMode].prompts[editingCellIndex]?.label}</p>
                                </div>
                            </div>
                            <button onClick={() => setEditingCellIndex(null)} className="p-2 hover:bg-[var(--color-bg-surface)] rounded-full transition-colors">
                                <CloseIcon className="w-5 h-5 text-[var(--color-text-dim)]" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border)]">
                                <p className="text-[10px] text-[var(--color-gold)] font-black uppercase tracking-widest mb-2">預設指令 (Default Prompt)</p>
                                <p className="text-xs text-[var(--color-text-dim)] leading-relaxed italic">
                                    {MATRIX_MODES[matrixMode].prompts[editingCellIndex]?.prompt}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-[var(--color-text-dim)] uppercase tracking-widest">
                                    覆蓋指令 (Override Instruction)
                                </label>
                                <textarea 
                                    value={cellOverrides[editingCellIndex]} 
                                    onChange={e => {
                                        const newVal = e.target.value;
                                        setCellOverrides(prev => {
                                            const n = [...prev];
                                            n[editingCellIndex!] = newVal;
                                            return n;
                                        });
                                    }} 
                                    placeholder="輸入此格專屬的微調指令，例如：'閉上雙眼'、'光線從左側射入'..." 
                                    className="w-full bg-[var(--color-bg-surface)] p-4 rounded-xl text-sm border border-[var(--color-border)] focus:border-[var(--color-gold)] text-[var(--color-text-main)] transition-all resize-none h-32" 
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button 
                                    onClick={() => {
                                        setCellOverrides(prev => {
                                            const n = [...prev];
                                            n[editingCellIndex!] = '';
                                            return n;
                                        });
                                    }} 
                                    variant="secondary" 
                                    className="flex-1"
                                >
                                    清除重置
                                </Button>
                                <Button 
                                    onClick={() => {
                                        setEditingCellIndex(null);
                                        regenerateCell(editingCellIndex!);
                                    }} 
                                    className="flex-1"
                                >
                                    <CheckIcon className="w-4 h-4 mr-2" /> 保存並重新生成
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Header */}
            <div className="sticky top-[80px] z-30 glass-panel border-x-0 border-t-0 px-6 py-4 mb-8">
                <div className="max-w-[110rem] mx-auto flex justify-between items-center">
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-display font-bold uppercase tracking-[0.3em] text-[var(--color-text-main)] flex items-center gap-3">
                            <Face3DIcon className="w-8 h-8" />
                            角色矩陣
                        </h2>
                        <span className="text-[9px] uppercase tracking-[0.5em] text-[var(--color-gold)] font-light">Character Matrix Lab</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {onGoHome && <Button onClick={onGoHome} variant="secondary" className="text-[10px] font-bold tracking-widest">返回首頁</Button>}
                    </div>
                </div>
            </div>
            <p className="text-center text-[var(--color-text-dim)] mb-8">生成角色全方位臉部圖譜、穿搭 Lookbook 或雜誌風格海報。</p>
            
            {error && <div className="text-center text-red-500 p-3 bg-red-500/10 border border-red-500/20 rounded-md mb-6">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Sidebar Tabs */}
                    <div className="flex bg-[var(--color-bg-surface)] p-1 rounded-xl border border-[var(--color-border)] mb-2">
                        {(['identity', 'strategy'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                    activeTab === tab 
                                    ? 'bg-[var(--color-gold)] text-[var(--color-bg-deep)] shadow-lg' 
                                    : 'text-[var(--color-text-dim)] hover:text-[var(--color-text-main)]'
                                }`}
                            >
                                {tab === 'identity' ? '1. 角色身份' : '2. 矩陣策略'}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'identity' && (
                        <Card className="animate-slide-up">
                            <div className="flex items-center gap-2 mb-4">
                                <PhotoIcon className="w-5 h-5 text-[var(--color-gold)]" />
                                <h3 className="text-xl font-bold text-[var(--color-text-title)]">核心角色定義</h3>
                            </div>
                            {baseImage ? (
                                <div className="relative group w-full aspect-[3/4] rounded-xl overflow-hidden border border-[var(--color-border)] shadow-2xl">
                                    <img src={baseImage.url} alt="Base model" className="w-full h-full object-cover object-top" />
                                    <div className="absolute inset-0 bg-[var(--color-bg-deep)]/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                                        <Button onClick={() => fileInputRef.current?.click()} variant="secondary" className="w-3/4">更換參考圖</Button>
                                    </div>
                                    <div className="absolute top-3 right-3 w-24 h-24 bg-[var(--color-bg-deep)]/80 backdrop-blur-md border border-[var(--color-gold)]/30 rounded-xl overflow-hidden shadow-2xl group/face">
                                        {faceAnchors.length > 0 ? (
                                            <>
                                                <img src={faceAnchors[0].url} alt="Face Anchor" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <span className="text-[10px] font-black text-white">{faceAnchors.length} 張鎖定</span>
                                                </div>
                                                <div className="absolute bottom-0 left-0 right-0 bg-[var(--color-gold)] text-[var(--color-bg-deep)] text-[9px] text-center py-0.5 font-black uppercase tracking-tighter">Identity Locked</div>
                                            </>
                                        ) : (
                                            <div 
                                                className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--color-gold)]/10 transition-colors" 
                                                onClick={(e) => { e.stopPropagation(); faceAnchorInputRef.current?.click(); }}
                                            >
                                                <Face3DIcon className="w-8 h-8 text-[var(--color-gold)] mb-1 opacity-50" />
                                                <span className="text-[9px] text-[var(--color-gold)] font-black uppercase tracking-tighter">鎖定臉部</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full aspect-[3/4] border-2 border-dashed border-[var(--color-border)] rounded-xl flex flex-col items-center justify-center gap-4 hover:border-[var(--color-gold)] transition-all cursor-pointer bg-[var(--color-bg-surface)]/30"
                                >
                                    <div className="w-16 h-16 rounded-full bg-[var(--color-bg-surface)] flex items-center justify-center shadow-inner">
                                        <PhotoIcon className="w-8 h-8 text-[var(--color-text-dim)]" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-[var(--color-text-main)]">點擊上傳角色正面照</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)] mt-1 uppercase tracking-widest">Recommended: High Resolution</p>
                                    </div>
                                </div>
                            )}

                            {faceAnchors.length > 0 && (
                                <div className="mt-6 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-gold)]">臉部原型庫 (Face Prototypes)</span>
                                        <button 
                                            onClick={() => faceAnchorInputRef.current?.click()}
                                            className="text-[9px] font-bold text-[var(--color-gold)] hover:underline"
                                        >
                                            + 新增參考
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        {faceAnchors.map((anchor, idx) => (
                                            <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-[var(--color-border)] relative group">
                                                <img src={anchor.url} alt={`Face ${idx}`} className="w-full h-full object-cover" />
                                                <button 
                                                    onClick={() => removeFaceAnchor(idx)}
                                                    className="absolute top-0.5 right-0.5 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {characterDna && (
                                <div className="mt-6 p-4 bg-[var(--color-bg-deep)]/50 rounded-xl border border-[var(--color-gold)]/20 animate-fade-in">
                                    <div className="flex items-center gap-2 mb-2">
                                        <SparklesIcon className="w-4 h-4 text-[var(--color-gold)]" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-gold)]">Character DNA Locked</span>
                                    </div>
                                    <p className="text-xs text-[var(--color-text-dim)] leading-relaxed italic">
                                        "{characterDna}"
                                    </p>
                                    <button 
                                        onClick={() => setCharacterDna('')}
                                        className="mt-3 text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-dim)] hover:text-[var(--color-gold)] transition-colors"
                                    >
                                        [ 重新分析基因 ]
                                    </button>
                                </div>
                            )}
                            <div className="mt-6 p-4 bg-[var(--color-gold)]/5 rounded-xl border border-[var(--color-gold)]/10">
                                <p className="text-[10px] text-[var(--color-gold)] font-black uppercase tracking-widest mb-2">Pro Tip</p>
                                <p className="text-xs text-[var(--color-text-dim)] leading-relaxed">
                                    上傳清晰的正面肖像可獲得最佳的一致性。使用「臉部鎖定」功能可強制 AI 在不同角度下維持五官特徵。
                                </p>
                            </div>
                        </Card>
                    )}
                    
                    {activeTab === 'strategy' && (
                        <Card className="animate-slide-up">
                            <div className="flex items-center gap-2 mb-6">
                                <SparklesIcon className="w-5 h-5 text-[var(--color-gold)]" />
                                <h3 className="text-xl font-bold text-[var(--color-text-title)]">矩陣生成策略</h3>
                            </div>
                            <div className="space-y-6">
                                 <Select 
                                    label="矩陣模式 (Matrix Mode)" 
                                    options={[
                                        { value: 'orbit', label: `🔭 ${MATRIX_MODES.orbit.label}` },
                                        { value: 'expression', label: `🎭 ${MATRIX_MODES.expression.label}` },
                                        { value: 'lighting', label: `💡 ${MATRIX_MODES.lighting.label}` },
                                        { value: 'outfit', label: `👗 ${MATRIX_MODES.outfit.label}` },
                                        { value: 'storyboard', label: `🎬 ${MATRIX_MODES.storyboard.label}` },
                                        { value: 'editorial_popout', label: `📖 ${MATRIX_MODES.editorial_popout.label}` }
                                    ]} 
                                    value={matrixMode} 
                                    onChange={(e) => setMatrixMode(e.target.value as MatrixModeKey)} 
                                 />
                                 
                                 <div className="p-4 bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border)] shadow-inner">
                                     <p className="font-bold text-[var(--color-gold)] text-sm mb-1">{MATRIX_MODES[matrixMode].label}</p>
                                     <p className="text-xs text-[var(--color-text-dim)] leading-relaxed">{MATRIX_MODES[matrixMode].description}</p>
                                 </div>

                                 {matrixMode === 'outfit' && (
                                     <div className="p-4 bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border)] flex items-center justify-between group hover:border-[var(--color-gold)] transition-all">
                                         <div className="flex flex-col">
                                             <span className="text-sm font-bold text-[var(--color-text-title)]">產出獨立圖片</span>
                                             <span className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-tighter">Batch Generation Mode</span>
                                         </div>
                                         <input 
                                            type="checkbox" 
                                            checked={isBatchMode} 
                                            onChange={(e) => { 
                                                setIsBatchMode(e.target.checked); 
                                                setSingleResultImage(null); 
                                                setGridImages(Array(9).fill(null)); 
                                                if (baseImage && !e.target.checked) setGridImages(prev => { const n = [...prev]; n[4] = baseImage.url; return n; }); 
                                            }} 
                                            className="w-6 h-6 rounded-lg bg-[var(--color-bg-deep)] border-[var(--color-border)] text-[var(--color-gold)] focus:ring-[var(--color-gold)] cursor-pointer" 
                                         />
                                     </div>
                                 )}

                                 {(matrixMode === 'outfit' || matrixMode === 'storyboard' || matrixMode === 'editorial_popout') && (
                                     <div className="space-y-2">
                                         <label className="block text-[10px] font-black text-[var(--color-text-dim)] uppercase tracking-widest">
                                             {matrixMode === 'storyboard' ? '導演備註 (Director Note)' : '額外風格指令 (Style Note)'}
                                         </label>
                                         <textarea 
                                            value={customStylePrompt} 
                                            onChange={e => setCustomStylePrompt(e.target.value)} 
                                            placeholder={matrixMode === 'storyboard' ? "例如：賽博龐克風格、雨夜氛圍..." : "例如：更溫暖的色調、底片質感..."} 
                                            className="w-full bg-[var(--color-bg-surface)] p-3 rounded-xl text-sm border border-[var(--color-border)] focus:border-[var(--color-gold)] text-[var(--color-text-main)] transition-all resize-none" 
                                            rows={3}
                                         />
                                     </div>
                                 )}

                                 {matrixMode === 'editorial_popout' && (
                                     <div className="bg-[var(--color-bg-surface)] p-4 rounded-xl border border-[var(--color-border)] space-y-4">
                                         <div className="flex justify-between items-center">
                                             <div className="flex items-center gap-2">
                                                 <label className="text-xs font-black text-[var(--color-gold)] uppercase tracking-widest">封面推薦引擎</label>
                                                 <button 
                                                    onClick={() => setIsAdvancedMode(!isAdvancedMode)} 
                                                    className={`text-[9px] px-2 py-0.5 rounded-full border transition-all ${isAdvancedMode ? 'bg-[var(--color-gold)] text-[var(--color-bg-deep)] border-[var(--color-gold)]' : 'bg-transparent text-[var(--color-text-dim)] border-[var(--color-border)]'}`}
                                                 >
                                                     {isAdvancedMode ? 'ADVANCED' : 'BASIC'}
                                                 </button>
                                             </div>
                                             <Button variant="secondary" className="!py-1 !px-3 text-[10px]" onClick={randomizeMagazines}>
                                                 <DiceIcon className="w-3 h-3 mr-1" />隨機推薦
                                             </Button>
                                         </div>
                                         <div className="grid grid-cols-1 gap-3 max-h-72 overflow-y-auto custom-scrollbar pr-2">
                                             {MAGAZINE_SLOT_LABELS.map((slotLabel, index) => (
                                                 <div key={index} className="p-3 bg-[var(--color-bg-deep)]/40 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-gold)]/50 transition-all">
                                                     <div className="flex justify-between items-center mb-2">
                                                         <span className="text-[10px] font-black text-[var(--color-gold)] tracking-widest">{slotLabel.split(' ')[0]}</span>
                                                         <span className="text-[9px] text-[var(--color-text-dim)] font-bold uppercase">{slotLabel.split(' ').slice(1).join(' ')}</span>
                                                     </div>
                                                     <select 
                                                        value={magazineGrid[index]?.magazineId || ''} 
                                                        onChange={(e) => updateMagazineCell(index, e.target.value)} 
                                                        className="bg-[var(--color-bg-deep)] border border-[var(--color-border)] text-[var(--color-text-main)] text-xs rounded-lg block w-full p-2 focus:border-[var(--color-gold)] outline-none transition-all"
                                                     >
                                                         <option value="" disabled>-- 選擇雜誌風格 --</option>
                                                         {GLOBAL_FASHION_MAGAZINES.map(mag => (<option key={mag.id} value={mag.id}>{mag.label}</option>))}
                                                     </select>
                                                     {isAdvancedMode && magazineGrid[index]?.magazineId && (
                                                         <div className="grid grid-cols-2 gap-2 mt-2">
                                                             <select value={magazineGrid[index].pose} onChange={(e) => updatePoseExpression(index, 'pose', e.target.value)} className="bg-[var(--color-bg-deep)] text-[10px] p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-dim)]">
                                                                 {EDITORIAL_POSES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                                             </select>
                                                             <select value={magazineGrid[index].expression} onChange={(e) => updatePoseExpression(index, 'expression', e.target.value)} className="bg-[var(--color-bg-deep)] text-[10px] p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-dim)]">
                                                                 {EDITORIAL_EXPRESSIONS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                                                             </select>
                                                         </div>
                                                     )}
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                 )}
                                 
                                 <div className="p-4 bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border)] mb-2">
                                     <Select 
                                         label="渲染品質 (Quality)" 
                                         options={[
                                             { value: 'standard', label: '標準 (Flash - 快速)' },
                                             { value: 'high', label: '高品質 (Pro 2K - 精細) [付費]' }
                                         ]} 
                                         value={quality} 
                                         onChange={(e) => setQuality(e.target.value as QualityLevel)} 
                                     />
                                     <p className="text-[9px] text-[var(--color-text-dim)] mt-2 uppercase tracking-tight">
                                         * 高品質模式將使用 Pro 模型進行 2K/4K 渲染。
                                     </p>
                                 </div>

                                 <Button 
                                    onClick={generateMatrix} 
                                    isLoading={isLoading} 
                                    disabled={!baseImage} 
                                    className="w-full text-xl py-5 shadow-2xl shadow-[var(--color-gold)]/20"
                                 >
                                     <SparklesIcon className="w-6 h-6 mr-2" />
                                     {displayAsSingleImage ? '生成拼貼海報' : '生成矩陣圖譜'}
                                 </Button>
                             </div>
                         </Card>
                     )}
                </div>
                <div className="lg:col-span-8">
                    <Card className="h-full min-h-[80vh] flex flex-col justify-center items-center bg-[var(--color-bg-deep)] border-[var(--color-border)] relative overflow-hidden">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent opacity-30" />
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent opacity-30" />
                        
                        {displayAsSingleImage ? (
                            <div className="w-full max-w-lg p-6 bg-[var(--color-bg-surface)] rounded-2xl shadow-2xl animate-fade-in border border-[var(--color-border)]">
                                {singleResultImage ? (
                                    <div className="relative aspect-[3/4] w-full group cursor-pointer overflow-hidden rounded-xl" onClick={() => setPreviewingSingle(true)}>
                                        <img src={singleResultImage} alt="Editorial Poster" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-[var(--color-bg-deep)]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                            <div className="bg-[var(--color-bg-surface)]/90 p-4 rounded-full shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300">
                                                <ExpandIcon className="w-8 h-8 text-[var(--color-text-main)]" />
                                            </div>
                                        </div>
                                        <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                            <Button onClick={(e) => { e.stopPropagation(); generateMatrix(); }} variant="secondary" className="!py-2 !px-4 text-[10px] font-black bg-[var(--color-bg-surface)]/90 backdrop-blur-md">RETRY</Button>
                                            <Button onClick={(e) => { e.stopPropagation(); handleDownloadSingle(singleResultImage, 'poster'); }} className="!py-2 !px-4 text-[10px] font-black">DOWNLOAD</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="aspect-[3/4] w-full border-2 border-dashed border-[var(--color-border)] rounded-xl flex flex-col items-center justify-center text-[var(--color-text-dim)] bg-[var(--color-bg-deep)]/20">
                                        {isLoading ? (
                                            <>
                                                <div className="relative mb-6">
                                                    <Face3DIcon className="w-20 h-20 animate-pulse text-[var(--color-gold)]" />
                                                    <div className="absolute inset-0 animate-ping opacity-20"><Face3DIcon className="w-20 h-20 text-[var(--color-gold)]" /></div>
                                                </div>
                                                <p className="text-lg font-black uppercase tracking-[0.2em] text-[var(--color-gold)]">Rendering Poster...</p>
                                                <p className="text-[10px] mt-2 opacity-60 uppercase tracking-widest">3:4 Editorial Layout</p>
                                            </>
                                        ) : (
                                            <>
                                                <PhotoIcon className="w-20 h-20 mb-4 opacity-10" />
                                                <p className="font-black uppercase tracking-widest opacity-30">Poster Standby</p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div ref={gridRef} className="grid grid-cols-3 gap-3 p-6 bg-[var(--color-bg-surface)] rounded-2xl shadow-2xl w-full max-w-4xl border border-[var(--color-border)] animate-fade-in">
                                {gridImages.map((imgUrl, index) => (
                                    <div key={index} className="relative aspect-square bg-[var(--color-bg-deep)] rounded-xl overflow-hidden group border border-[var(--color-border)] hover:border-[var(--color-gold)]/50 transition-all shadow-lg">
                                        {imgUrl ? (
                                            <>
                                                <div 
                                                    className="w-full h-full cursor-pointer transition-transform duration-500 group-hover:scale-110 bg-cover bg-center bg-no-repeat" 
                                                    style={{ 
                                                        backgroundImage: `url(${imgUrl})`, 
                                                        backgroundPosition: index === 4 ? 'center 20%' : 'center' 
                                                    }} 
                                                    onClick={() => setPreviewingIndex(index)} 
                                                />
                                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-[var(--color-bg-deep)]/60 via-transparent to-transparent pointer-events-none">
                                                    <div className="absolute top-3 left-3 pointer-events-auto">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={selectedCells.has(index)} 
                                                            onChange={() => toggleCellSelection(index)} 
                                                            className="w-5 h-5 rounded-md bg-[var(--color-bg-surface)]/80 border-[var(--color-border)] text-[var(--color-gold)] focus:ring-[var(--color-gold)] cursor-pointer" 
                                                        />
                                                    </div>
                                                    <div className="absolute top-3 right-3 flex gap-1.5 pointer-events-auto">
                                                        <button onClick={(e) => { e.stopPropagation(); setEditingCellIndex(index); }} className="p-2 bg-[var(--color-bg-surface)]/90 hover:bg-[var(--color-gold)] hover:text-[var(--color-bg-deep)] text-[var(--color-text-main)] rounded-lg shadow-xl transition-all" title="編輯此格提示詞"><TuneIcon className="w-4 h-4" /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); regenerateCell(index); }} className="p-2 bg-[var(--color-bg-surface)]/90 hover:bg-[var(--color-gold)] hover:text-[var(--color-bg-deep)] text-[var(--color-text-main)] rounded-lg shadow-xl transition-all" title="重新生成此格"><ReplaceIcon className="w-4 h-4" /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); const label = MATRIX_MODES[matrixMode].prompts[index].label.replace(/\s|\/|\\/g, '_'); handleDownloadSingle(imgUrl, label); }} className="p-2 bg-[var(--color-bg-surface)]/90 hover:bg-[var(--color-gold)] hover:text-[var(--color-bg-deep)] text-[var(--color-text-main)] rounded-lg shadow-xl transition-all" title="下載此圖"><DownloadIcon className="w-4 h-4" /></button>
                                                    </div>
                                                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                                        <div className="text-[9px] font-black text-white uppercase tracking-widest truncate drop-shadow-lg">
                                                            {MATRIX_MODES[matrixMode].prompts[index]?.label}
                                                        </div>
                                                        {cellOverrides[index] && (
                                                            <div className="w-2 h-2 rounded-full bg-[var(--color-gold)] shadow-[0_0_8px_var(--color-gold)]" title="已套用自定義指令" />
                                                        )}
                                                        {characterDna && (
                                                            <div className="flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded-full bg-[var(--color-gold)]/20 border border-[var(--color-gold)]/30" title="DNA 鎖定中">
                                                                <SparklesIcon className="w-2 h-2 text-[var(--color-gold)]" />
                                                                <span className="text-[7px] font-black text-[var(--color-gold)]">DNA</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {matrixMode === 'storyboard' && storyboardScript && (
                                                    <div className="absolute bottom-0 left-0 right-0 bg-[var(--color-bg-deep)]/80 backdrop-blur-md p-2 text-[9px] text-[var(--color-text-title)] leading-tight border-t border-[var(--color-gold)]/20">
                                                        {storyboardScript.frames.find(f => f.id === MATRIX_MODES.storyboard.prompts[index].id)?.translation}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-text-dim)] p-4">
                                                {progressStatus[index] === '失敗' ? (
                                                    <button onClick={(e) => { e.stopPropagation(); regenerateCell(index); }} className="flex flex-col items-center gap-2 group/retry pointer-events-auto">
                                                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/30 group-hover/retry:bg-red-500/20 transition-all duration-300">
                                                            <ReplaceIcon className="w-6 h-6 text-red-400" />
                                                        </div>
                                                        <span className="text-[10px] text-red-400 font-black uppercase tracking-widest">Retry</span>
                                                    </button>
                                                ) : (
                                                    <>
                                                        <div className="relative mb-3">
                                                            <Face3DIcon className={`w-10 h-10 ${progressStatus[index].includes('中') ? 'animate-spin-slow text-[var(--color-gold)]' : 'opacity-20'}`} />
                                                            {progressStatus[index].includes('中') && <div className="absolute inset-0 animate-ping opacity-20"><Face3DIcon className="w-10 h-10 text-[var(--color-gold)]" /></div>}
                                                        </div>
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-center">{progressStatus[index]}</span>
                                                    </>
                                                )}
                                                <span className="text-[9px] mt-2 opacity-40 text-center px-2 font-medium uppercase tracking-tighter">{MATRIX_MODES[matrixMode].prompts[index]?.label}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                {matrixMode === 'storyboard' && storyboardScript && (
                    <div className="w-full max-w-3xl mt-8 p-6 bg-[var(--color-bg-input)] rounded-xl border border-[var(--color-border)]">
                        <h3 className="text-xl font-bold text-[var(--color-gold)] mb-4 flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5" />
                            完整故事拆解 (Story Breakdown)
                        </h3>
                        <div className="text-[var(--color-text-dim)] text-sm leading-relaxed whitespace-pre-wrap">
                            {storyboardScript.story_breakdown}
                        </div>
                    </div>
                )}
            </Card></div>
            </div>
        </div>
    );
};

export default CharacterLab;
