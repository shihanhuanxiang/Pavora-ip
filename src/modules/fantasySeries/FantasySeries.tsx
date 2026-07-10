
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
/* FIX: Removed non-existent filterPosesV8 import from geminiService */
import { buildPromptV8, getFriendlyErrorMessage, fileToBase64, transformImage, confirmPaidFeature } from '../../shared/services/geminiService';
import { getGeminiClient } from '../../shared/services/core/geminiClient';
import { savePortfolioItem } from '../../shared/services/storageService';
import { downloadImage } from '../../shared/utils/imageUtils';
import { runPromptPipeline } from '../../promptPipeline';
import type { FantasyPresetV8, FxLevel, GarmentEraser, ScenePresetV8, PoseV8, FantasyExpressionV8, BgMode, FantasyRace, FantasyJob, FantasyLightingV4, FantasyCompositionV4 } from '../../shared/types/types';
import { 
    FANTASY_RACES_V8, FANTASY_JOBS_V8, FANTASY_SCENES_V8, POSE_LIBRARY_V8, 
    FANTASY_EXPRESSIONS_V8
} from '../../shared/constants/constants';
import { FANTASY_RACES_V4, FANTASY_JOBS_V4, FANTASY_POSES_V4, FANTASY_EXPRESSIONS_V4, FANTASY_SCENES_V4, FANTASY_LIGHTING_V4, FANTASY_COMPOSITION_V4, FANTASY_CELESTIALS_V4, FANTASY_ATMOS_V4, FANTASY_MAGIC_CIRCLES_V4, FANTASY_COMPANIONS_V4 } from '../../shared/constants/fantasyData';
import { Modality, GenerateContentResponse } from "@google/genai";
import { autoFaceCrop } from '../../shared/utils/vision/faceCrop';

import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
import Loader from '../../shared/components/common/Loader';
import PhotoIcon from '../../shared/assets/icons/PhotoIcon';
import DiceIcon from '../../shared/assets/icons/DiceIcon';
import ImagePreviewModal from '../../shared/components/common/ImagePreviewModal';
import Select from '../../shared/components/common/Select';
import DownloadIcon from '../../shared/assets/icons/DownloadIcon';
import Face3DIcon from '../../shared/assets/icons/Face3DIcon';
import ExpandIcon from '../../shared/assets/icons/ExpandIcon';
import SparklesIcon from '../../shared/assets/icons/SparklesIcon';

interface FantasySeriesProps {
  onGoHome: () => void;
  initialImage?: { url: string; fileData: { data: string; mimeType: string; } } | null;
  onContinueEditing: (imageUrl: string, destination: string) => void;
}

// Define QualityLevel
type QualityLevel = 'fast' | 'balanced' | 'high';

const FantasySeries: React.FC<FantasySeriesProps> = ({ onGoHome, initialImage, onContinueEditing }) => {
    // 1. 安全初始化預設值
    const safeRaces = FANTASY_RACES_V4.length ? FANTASY_RACES_V4 : [] as FantasyRace[];
    const safeJobs = FANTASY_JOBS_V4.length ? FANTASY_JOBS_V4 : [] as FantasyJob[];
    const safeScenes = FANTASY_SCENES_V4.length ? FANTASY_SCENES_V4 : [] as ScenePresetV8[];
    const safePoses = FANTASY_POSES_V4.length ? FANTASY_POSES_V4 : [] as PoseV8[];
    const safeExpressions = FANTASY_EXPRESSIONS_V4.length ? FANTASY_EXPRESSIONS_V4 : [] as FantasyExpressionV8[];
    const safeLightings = FANTASY_LIGHTING_V4.length ? FANTASY_LIGHTING_V4 : [] as FantasyLightingV4[];
    const safeCompositions = FANTASY_COMPOSITION_V4.length ? FANTASY_COMPOSITION_V4 : [] as FantasyCompositionV4[];

    const hasData = safeRaces.length > 0 && safeScenes.length > 0;

    const formatEnglishName = (name: string) => {
        return name
            .replace('_f', '')
            .replace('_m', '')
            .replace('_u', '')
            .split('_')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
    };

    // 2. 狀態初始化
    const [baseImage, setBaseImage] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(null);
    const [faceCrop, setFaceCrop] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    
    const [gender, setGender] = useState<'male' | 'female'>('female');
    
    // 性別過濾選單
    const availableRaces = useMemo(() => {
        return safeRaces.filter(r => r.gender === gender || r.gender === 'universal');
    }, [gender, safeRaces]);

    const availableJobs = useMemo(() => {
        return safeJobs.filter(j => j.gender === gender || j.gender === 'universal');
    }, [gender, safeJobs]);

    const filteredGroupedRaces = useMemo(() => {
        const groups: Record<string, { label: string; options: any[] }> = {};
        availableRaces.forEach(r => {
            const cat = r.category || 'Other';
            if (!groups[cat]) groups[cat] = { label: cat, options: [] };
            groups[cat].options.push({ 
                value: r.name, 
                label: `${r.labelZh} (${formatEnglishName(r.name)})` 
            });
        });

        const sortedGroups = Object.entries(groups).sort(([a], [b]) => {
            const bottomCats = ['通用系', '基礎', '其他'];
            const isABottom = bottomCats.includes(a);
            const isBBottom = bottomCats.includes(b);
            if (isABottom && !isBBottom) return 1;
            if (!isABottom && isBBottom) return -1;
            return a.localeCompare(b);
        });

        return sortedGroups.map(([_, group]) => group);
    }, [availableRaces]);

    const filteredGroupedJobs = useMemo(() => {
        const groups: Record<string, { label: string; options: any[] }> = {};
        availableJobs.forEach(j => {
            const cat = j.type || 'Other';
            if (!groups[cat]) groups[cat] = { label: cat, options: [] };
            groups[cat].options.push({ 
                value: j.name, 
                label: `${j.labelZh} (${formatEnglishName(j.name)})` 
            });
        });

        const sortedGroups = Object.entries(groups).sort(([a], [b]) => {
            const bottomCats = ['通用系', '特殊能力'];
            const isABottom = bottomCats.includes(a);
            const isBBottom = bottomCats.includes(b);
            if (isABottom && !isBBottom) return 1;
            if (!isABottom && isBBottom) return -1;
            return a.localeCompare(b);
        });

        return sortedGroups.map(([_, group]) => group);
    }, [availableJobs]);

    const filteredGroupedScenes = useMemo(() => {
        const groups: Record<string, { label: string; options: any[] }> = {};
        safeScenes.forEach(s => {
            const cat = s.category || 'Other';
            if (!groups[cat]) groups[cat] = { label: cat, options: [] };
            groups[cat].options.push({ value: s.id, label: s.labelZh });
        });

        const sortedGroups = Object.entries(groups).sort(([a], [b]) => {
            const bottomCats = ['通用系', '基本環境', '其他'];
            const isABottom = bottomCats.includes(a);
            const isBBottom = bottomCats.includes(b);
            if (isABottom && !isBBottom) return 1;
            if (!isABottom && isBBottom) return -1;
            return a.localeCompare(b);
        });

        return sortedGroups.map(([_, group]) => group);
    }, [safeScenes]);

    const [race, setRace] = useState<FantasyRace>(availableRaces[0] || {} as FantasyRace);
    const [job, setJob] = useState<FantasyJob>(availableJobs[0] || {} as FantasyJob);

    const [sceneId, setSceneId] = useState(safeScenes[0]?.id || '');
    const [lightingId, setLightingId] = useState(safeLightings[0]?.id || '');
    const [compositionId, setCompositionId] = useState(safeCompositions[0]?.id || '');
    const [poseId, setPoseId] = useState(safePoses[0]?.id || '');
    const [expressionId, setExpressionId] = useState(safeExpressions[0]?.id || '');

    // --- 動態過濾 Pose (按類別分組) ---
    const filteredGroupedPoses = useMemo(() => {
        const groups: Record<string, { label: string; options: any[] }> = {};

        safePoses.forEach(p => {
            const cat = p.category || 'Other';
            
            // 過濾邏輯：1. 一般攝影全選。 2. 若無需求限制則全選。 3. 有需求限制則必須符合才顯示。
            const hasReq = (p.requirements?.race?.length || 0) > 0 || (p.requirements?.job?.length || 0) > 0;
            const isMatch = p.requirements?.race?.includes(race.name) || p.requirements?.job?.includes(job.name);
            
            if (cat !== '一般攝影' && hasReq && !isMatch) {
                return; 
            }

            if (!groups[cat]) {
                groups[cat] = { label: cat, options: [] };
            }
            groups[cat].options.push({ 
                value: p.id, 
                label: p.label
            });
        });

        const sortedGroups = Object.entries(groups).sort(([a], [b]) => {
            const bottomCats = ['一般攝影', '通用系', '基礎動作'];
            const isABottom = bottomCats.includes(a);
            const isBBottom = bottomCats.includes(b);
            if (isABottom && !isBBottom) return 1;
            if (!isABottom && isBBottom) return -1;
            return a.localeCompare(b);
        });

        return sortedGroups.map(([_, group]) => group);
    }, [safePoses, race.name, job.name]);

    // --- 動態過濾 Expression (按類別分組) ---
    const filteredGroupedExpressions = useMemo(() => {
        const groups: Record<string, { label: string; options: any[] }> = {};

        safeExpressions.forEach(e => {
            const cat = e.category || 'Other';
            
            const hasReq = (e.requirements?.race?.length || 0) > 0 || (e.requirements?.job?.length || 0) > 0;
            const isMatch = e.requirements?.race?.includes(race.name) || e.requirements?.job?.includes(job.name);

            // 表情也進行類似過濾，但僅過濾掉有明確限制且不符合的（通用系不在此限）
            if (cat !== '通用系' && cat !== '情緒系' && cat !== '反應系' && hasReq && !isMatch) {
                return;
            }

            if (!groups[cat]) {
                groups[cat] = { label: cat, options: [] };
            }
            groups[cat].options.push({ 
                value: e.id, 
                label: e.label
            });
        });

        const sortedGroups = Object.entries(groups).sort(([a], [b]) => {
            const bottomCats = ['通用系', '情緒系', '反應系'];
            const isABottom = bottomCats.includes(a);
            const isBBottom = bottomCats.includes(b);
            if (isABottom && !isBBottom) return 1;
            if (!isABottom && isBBottom) return -1;
            return a.localeCompare(b);
        });

        return sortedGroups.map(([_, group]) => group);
    }, [safeExpressions, race.name, job.name]);

    // 當性別切換時，自動校正選擇值，確保符合該性別過濾範圍
    useEffect(() => {
        if (!availableRaces.find(r => r.name === race.name)) {
            setRace(availableRaces[0] || {} as FantasyRace);
        }
        if (!availableJobs.find(j => j.name === job.name)) {
            setJob(availableJobs[0] || {} as FantasyJob);
        }
        
        // 校正動作與表情 (確保符合新職業/種族的需求)
        const allFilteredPoses = filteredGroupedPoses.flatMap((g: any) => g.options);
        if (!allFilteredPoses.find(p => p.value === poseId)) {
            setPoseId(allFilteredPoses[0]?.value || '');
        }
        
        const allFilteredExprs = filteredGroupedExpressions.flatMap((g: any) => g.options);
        if (!allFilteredExprs.find(e => e.value === expressionId)) {
            setExpressionId(allFilteredExprs[0]?.value || '');
        }
    }, [gender, availableRaces, availableJobs, race.name, job.name, filteredGroupedPoses, filteredGroupedExpressions, poseId, expressionId]);
    
    const identityLock = 100;
    const [customScenePrompt, setCustomScenePrompt] = useState(''); 
    
    const [bgMode, setBgMode] = useState<BgMode>('ai_lite');
    const [bgReferenceImage, setBgReferenceImage] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(null);
    const [quality, setQuality] = useState<QualityLevel>('high');
    
    const photoLock = true; 

    const [aspectRatio, setAspectRatio] = useState<string>('3:4');
    const [fxPractical, setFxPractical] = useState<FxLevel>('med');
    const [fxParticles, setFxParticles] = useState<FxLevel>('med');
    const [fxEnergy, setFxEnergy] = useState<FxLevel>('med');
    const [fxTint, setFxTint] = useState<string>('#FFFFFF');
    const [garmentEraser, setGarmentEraser] = useState<GarmentEraser>({ enabled: true, targets: [], dilatePx: 8, strength: 0.85 });
    
    // Fantasy 3.0 New States
    const [battleDamage, setBattleDamage] = useState<number>(0);
    const [companion, setCompanion] = useState<string>('none');
    
    // Phase 3: Atmospheric States
    const [atmosTyndall, setAtmosTyndall] = useState<'off' | 'low' | 'high'>('off');
    const [manaParticles, setManaParticles] = useState<'off' | 'low' | 'high'>('off');
    const [celestialEvent, setCelestialEvent] = useState<'none' | 'blood_moon' | 'aurora' | 'eclipse' | 'starlight'>('none');
    const [magicCircle, setMagicCircle] = useState<string>('none');
    
    // --- 幻想系列 5.5: 推薦項置頂邏輯 (Recommended Items Optimization) ---
    const companionOptions = useMemo(() => {
        const options = FANTASY_COMPANIONS_V4.map(c => {
            const isRecommended = c.job === job?.name;
            return {
                value: c.id,
                label: isRecommended ? `${c.label} ⭐` : c.label,
                isRecommended
            };
        });
        
        // 將推薦項置頂
        return [...options].sort((a, b) => (b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0));
    }, [job?.name]);

    const magicCircleOptions = useMemo(() => {
        const options = FANTASY_MAGIC_CIRCLES_V4.map(m => {
            const isRecommended = m.job === job?.name;
            return {
                value: m.id,
                label: isRecommended ? `${m.label} ⭐` : m.label,
                isRecommended
            };
        });
        
        // 將推薦項置頂
        return [...options].sort((a, b) => (b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0));
    }, [job?.name]);

    const [faceAnchor, setFaceAnchor] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(null);

    // --- 幻想系列 5.0: 職業聯動硬核集成 (Stage 5: 隨從與魔法陣推薦) ---
    useEffect(() => {
        if (!race || !job) return;

        // 1. 動作與表情推薦 (原有邏輯)
        const recommendedPose = FANTASY_POSES_V4.find(p => 
            p.requirements?.race?.includes(race.name) || 
            p.requirements?.job?.includes(job.name)
        );
        if (recommendedPose) setPoseId(recommendedPose.id);

        const recommendedExpr = FANTASY_EXPRESSIONS_V4.find(e => 
            e.requirements?.race?.includes(race.name) || 
            e.requirements?.job?.includes(job.name)
        );
        if (recommendedExpr) setExpressionId(recommendedExpr.id);
        
        // 2. 隨從推薦 (1:1 映射)
        const recommendedCompanion = FANTASY_COMPANIONS_V4.find(c => c.job === job.name);
        if (recommendedCompanion) {
            setCompanion(recommendedCompanion.id);
        }

        // 3. 魔法陣推薦 (1:1 映射)
        const recommendedCircle = FANTASY_MAGIC_CIRCLES_V4.find(m => m.job === job.name);
        if (recommendedCircle) {
            setMagicCircle(recommendedCircle.id);
        }

        // 4. 特例修正 (翅膀類)
        if (race.name === 'angel' || race.name === 'devil') {
             const wingPose = FANTASY_POSES_V4.find(p => p.category === '翼系' && p.requirements?.race?.includes(race.name));
             if (wingPose) setPoseId(wingPose.id);
        }

    }, [race.name, job.name]);

    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [previewingImage, setPreviewingImage] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bgRefFileInputRef = useRef<HTMLInputElement>(null);
    const faceAnchorInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (initialImage) {
            setBaseImageAndCrop(initialImage);
        }
    }, [initialImage]);

    if (!hasData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center text-red-400">
                <h3 className="text-xl font-bold mb-2">Pavora 系統維護中</h3>
                <p>無法載入幻想系列設定資料。</p>
                <Button onClick={onGoHome} className="mt-4">返回首頁</Button>
            </div>
        );
    }

    // --- 動態過濾 Pose --- (已移至上方)

    const setBaseImageAndCrop = async (img: { url: string, fileData: { data: string, mimeType: string }}) => {
        setBaseImage(img);
        setGeneratedImage(null);
        setIsLoading(true);
        setLoadingMessage('正在進行 Pavora AI 臉部裁切...');
        try {
            const cropData = await autoFaceCrop(img.fileData);
            const cropUrl = `data:${cropData.mimeType};base64,${cropData.data}`;
            setFaceCrop({ url: cropUrl, fileData: cropData });
        } catch (err) {
            setFaceCrop(img);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!baseImage || !faceCrop) { setError('請先上傳模特兒圖片。'); return; }
        
        const usePro = quality !== 'fast';
        if (usePro) {
            const confirmed = await confirmPaidFeature();
            if (!confirmed) return;
        }

        setIsLoading(true); setLoadingMessage('正在施展【100% 真實幻術】，轉化角色中...'); setError(null);
        
        try {
            const faceCropData = faceAnchor ? faceAnchor.fileData : faceCrop.fileData;
            
            const characterPrompt = buildPromptV8({
                gender, race, job, sceneId, lightingId, compositionId, poseId, expressionId, identityLock, realism: 1.0,
                fxPractical, fxParticles, fxEnergy, fxTint,
                bgMode: bgMode === 'pbl' ? 'photo_ref' : 'ai_lite', 
                photoLock, garmentEraser, customScenePrompt,
                battleDamage, companion,
                atmosTyndall, manaParticles, celestialEvent,
                materialFidelity: quality === 'high' ? 'high' : 'standard', magicCircle,
                aspectRatio,
                version: 'v4' // 指示使用 V4 邏輯 (強化五官與材質)
            });
            // Stage 1b-T9: customScenePrompt is dormant (no setter, no UI binding — always ''); if it is ever wired to UI, it MUST go through ensureEnglishPrompt first.
            // enforce here intentionally strips preset Chinese: race/job labelZh (e.g.「人類 (Human)」→ "(Human)") and lighting/composition zh descriptions — those are UI helper strings; the English .prompt/.prompt_en fields carry the real instructions and are preserved.
            const pipelinedCharacterPrompt = runPromptPipeline(characterPrompt, { source: 'fantasySeries:transformImage', mode: 'enforce' }).prompt;

            const config = { 
                usePro: quality === 'fast' ? false : true, 
                resolution: quality === 'high' ? '4K' : '2K',
                imageConfig: {
                    aspectRatio: aspectRatio
                }
            };
            const result = await transformImage(
                baseImage.fileData, 
                pipelinedCharacterPrompt, 
                [faceCropData], 
                setLoadingMessage, 
                config
            );
            setGeneratedImage(result);
        } catch (err) {
            setError(getFriendlyErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    // --- 隨機設定邏輯 (Stage 2: 隨機化邏輯強化) ---
    const handleRandomize = () => {
        const newRace = FANTASY_RACES_V4[Math.floor(Math.random() * FANTASY_RACES_V4.length)];
        const newJob = FANTASY_JOBS_V4[Math.floor(Math.random() * FANTASY_JOBS_V4.length)];
        const newScene = FANTASY_SCENES_V4[Math.floor(Math.random() * FANTASY_SCENES_V4.length)];
        
        setRace(newRace);
        setJob(newJob);
        setSceneId(newScene.id);
        
        // 優先挑選推薦的動作與表情
        const recommendedPoses = FANTASY_POSES_V4.filter(p => 
            p.requirements?.race?.includes(newRace.name) || 
            p.requirements?.job?.includes(newJob.name)
        );
        const randomPose = recommendedPoses.length > 0 && Math.random() > 0.3 
            ? recommendedPoses[Math.floor(Math.random() * recommendedPoses.length)]
            : FANTASY_POSES_V4[Math.floor(Math.random() * FANTASY_POSES_V4.length)];
        setPoseId(randomPose.id);

        const recommendedExprs = FANTASY_EXPRESSIONS_V4.filter(e => 
            e.requirements?.race?.includes(newRace.name) || 
            e.requirements?.job?.includes(newJob.name)
        );
        const randomExpr = recommendedExprs.length > 0 && Math.random() > 0.3
            ? recommendedExprs[Math.floor(Math.random() * recommendedExprs.length)]
            : FANTASY_EXPRESSIONS_V4[Math.floor(Math.random() * FANTASY_EXPRESSIONS_V4.length)];
        setExpressionId(randomExpr.id);

        setCompanion(FANTASY_COMPANIONS_V4[Math.floor(Math.random() * FANTASY_COMPANIONS_V4.length)].id);
        setBattleDamage(Math.floor(Math.random() * 4) as any);
        
        const ratios = ['1:1', '3:4', '9:16', '4:3', '16:9'];
        setAspectRatio(ratios[Math.floor(Math.random() * ratios.length)]);
    };

    const handleBaseImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try { 
                const url = URL.createObjectURL(e.target.files[0]); 
                const fileData = await fileToBase64(e.target.files[0]);
                setBaseImageAndCrop({ url, fileData });
            } 
            catch (err) { setError(getFriendlyErrorMessage(err)); } 
        }
    };

    const handleBgRefImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const fileData = await fileToBase64(e.target.files[0]);
                setBgReferenceImage({ url: URL.createObjectURL(e.target.files[0]), fileData });
            } catch (err) { setError(getFriendlyErrorMessage(err)); }
        }
    };

    const handleFaceAnchorUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const fileData = await fileToBase64(e.target.files[0]);
                setFaceAnchor({ url: URL.createObjectURL(e.target.files[0]), fileData });
            } catch (err) { setError(getFriendlyErrorMessage(err)); }
        }
    };

    const handleDownload = () => {
        if (generatedImage) {
            downloadImage(generatedImage, `pavora_fantasy_${Date.now()}.jpg`, 'FantasySeries');
        }
    };

    const FX_LEVEL_OPTIONS: { value: FxLevel, label: string }[] = [{ value: 'off', label: '關閉' },{ value: 'low', label: '低' },{ value: 'med', label: '中' },{ value: 'high', label: '高' }];

    return (
        <div className="container mx-auto p-4 lg:p-8 max-w-8xl animate-fade-in pb-24">
            {isLoading && <Loader message={loadingMessage} />}
            {previewingImage && <ImagePreviewModal images={[previewingImage]} startIndex={0} onClose={() => setPreviewingImage(null)} />}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleBaseImageUpload} />
            <input type="file" ref={bgRefFileInputRef} className="hidden" accept="image/*" onChange={handleBgRefImageUpload} />
            <input type="file" ref={faceAnchorInputRef} className="hidden" accept="image/*" onChange={handleFaceAnchorUpload} />

            {/* Header */}
            <div className="sticky top-[80px] z-30 glass-panel border-x-0 border-t-0 px-6 py-4 mb-8">
                <div className="max-w-[110rem] mx-auto flex justify-between items-center">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-display font-bold uppercase tracking-[0.3em] text-[var(--color-text-main)]">幻想系列</h2>
                            <div className="hidden sm:flex items-center gap-2 px-2 py-0.5 rounded border border-[var(--color-success)]/30 bg-[var(--color-success)]/5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-success)]"></span>
                                </span>
                                <span className="text-[9px] font-mono text-[var(--color-success)] uppercase tracking-tighter">Morph Engine // Online</span>
                            </div>
                        </div>
                        <span className="text-[9px] uppercase tracking-[0.5em] text-[var(--color-gold)] font-light mt-1">Fantasy Morph Studio · Enterprise Edition</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {onGoHome && <Button onClick={onGoHome} variant="secondary" className="text-[10px] font-bold tracking-widest">返回首頁</Button>}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* 控制面板 */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <Card className="border-l-4 border-l-[var(--color-gold)]">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1.5 h-6 bg-[var(--color-gold)] rounded-full"></div>
                            <h3 className="text-sm font-mono font-bold text-[var(--color-text-title)] uppercase tracking-[0.2em]">01. 生成模式 // Mode</h3>
                        </div>
                        <div className="flex gap-2 mb-4">
                            <Button onClick={() => setBgMode('ai_lite')} variant={bgMode === 'ai_lite' ? 'light' : 'secondary'} className="flex-1">AI 自由構圖</Button>
                            <Button onClick={() => setBgMode('pbl')} variant={bgMode === 'pbl' ? 'light' : 'secondary'} className="flex-1">PBL 背景鎖定</Button>
                        </div>
                        {bgMode === 'pbl' && (
                            <div className="p-3 bg-[var(--color-bg-input)] rounded-lg border border-[var(--color-border)] mb-2">
                                <label className="block text-sm text-[var(--color-text-dim)] mb-2">背景參考圖</label>
                                {bgReferenceImage ? (
                                    <div className="relative group w-full">
                                        <img src={bgReferenceImage.url} className="w-full h-32 object-cover rounded-md" />
                                        <button onClick={() => setBgReferenceImage(null)} className="absolute top-1 right-1 bg-red-600 rounded-full w-5 h-5 text-white flex items-center justify-center text-xs">&times;</button>
                                    </div>
                                ) : (
                                    <Button onClick={() => bgRefFileInputRef.current?.click()} className="w-full text-sm" variant="secondary">上傳背景圖</Button>
                                )}
                            </div>
                        )}
                    </Card>

                    <Card className="border-l-4 border-l-[var(--color-gold)]">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1.5 h-6 bg-[var(--color-gold)] rounded-full"></div>
                            <h3 className="text-sm font-mono font-bold text-[var(--color-text-title)] uppercase tracking-[0.2em]">02. 角色身份 // ID</h3>
                        </div>
                        {baseImage ? (
                            <div className="relative group w-full border border-[var(--color-border)] rounded-lg overflow-hidden">
                                <img src={baseImage.url} alt="Base" className="w-full h-64 object-cover object-top" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                                    <Button onClick={() => fileInputRef.current?.click()} className="w-4/5">更換來源圖</Button>
                                </div>
                                <div className="absolute top-2 right-2 w-24 h-24 bg-[var(--color-bg-surface)] border-2 border-[var(--color-gold)] rounded-lg overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.4)] group/face transition-transform hover:scale-105 active:scale-95">
                                    {faceAnchor ? (
                                        <>
                                            <img src={faceAnchor.url} alt="Face Anchor" className="w-full h-full object-cover" />
                                            <button onClick={(e) => { e.stopPropagation(); setFaceAnchor(null); }} className="absolute top-0 right-0 bg-red-600/80 hover:bg-red-600 text-[var(--color-text-title)] w-6 h-6 flex items-center justify-center text-xs transition-colors">&times;</button>
                                            <div className="absolute bottom-0 left-0 right-0 bg-[var(--color-gold)] text-[9px] text-center text-black font-mono font-bold py-0.5 tracking-tighter uppercase">Identity Lock</div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--color-gold)]/10 transition-colors group/anchor" onClick={(e) => { e.stopPropagation(); faceAnchorInputRef.current?.click(); }}>
                                            <span className="text-2xl text-[var(--color-gold)] group-hover/anchor:scale-125 transition-transform">+</span>
                                            <span className="text-[9px] font-mono text-[var(--color-text-dim)] font-bold uppercase tracking-tighter">Lock Profile</span>
                                        </div>
                                    )}
                                </div>
                                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded border border-white/10">
                                    <span className="text-[8px] font-mono text-white/60 tracking-widest uppercase">Scanner Active</span>
                                </div>
                            </div>
                        ) : (
                            <div onClick={() => fileInputRef.current?.click()} className="w-full h-48 border-2 border-dashed border-[var(--color-border)] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[var(--color-gold)]/50 transition-all hover:bg-[var(--color-gold)]/5 group">
                                <PhotoIcon className="w-10 h-10 text-[var(--color-text-dim)] mb-2 group-hover:text-[var(--color-gold)] transition-colors" />
                                <span className="text-[var(--color-text-dim)] text-xs font-mono uppercase tracking-widest group-hover:text-[var(--color-gold)]">Upload Subject Card</span>
                            </div>
                        )}
                    </Card>

                    <Card className="border-l-4 border-l-[var(--color-gold)]">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-[var(--color-gold)] rounded-full"></div>
                                <h3 className="text-sm font-mono font-bold text-[var(--color-text-title)] uppercase tracking-[0.2em]">03. 系列配置 // Config</h3>
                            </div>
                            <button 
                                onClick={handleRandomize} 
                                className="flex items-center gap-2 px-3 py-1.5 text-[9px] font-mono font-bold rounded border border-[var(--color-gold)]/40 text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-black transition-all shadow-[0_0_15px_rgba(212,175,55,0.1)] active:scale-95 uppercase tracking-widest"
                                title="隨機生成靈感"
                            >
                                <DiceIcon className="w-3.5 h-3.5" /> Randomize
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <Select 
                                    label="生理性別" 
                                    options={[{value: 'female', label: '女性'}, {value: 'male', label: '男性'}]} 
                                    value={gender} 
                                    onChange={e => setGender(e.target.value as 'female' | 'male')} 
                                />
                                
                                <Select 
                                    label="幻想種族" 
                                    options={filteredGroupedRaces}
                                    value={race?.name || ''} 
                                    onChange={e => setRace(availableRaces.find(r => r.name === e.target.value) || availableRaces[0])}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Select 
                                    label="角色職業" 
                                    options={filteredGroupedJobs}
                                    value={job?.name || ''} 
                                    onChange={e => setJob(availableJobs.find(j => j.name === e.target.value) || availableJobs[0])}
                                />
                                <Select 
                                    label="環境場景" 
                                    options={filteredGroupedScenes}
                                    value={sceneId} 
                                    onChange={e => setSceneId(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Select label="光影構圖 (Lighting)" options={safeLightings.map(l => ({value: l.id, label: l.label}))} value={lightingId} onChange={e => setLightingId(e.target.value)} />
                                <Select label="鏡頭構圖 (Camera)" options={safeCompositions.map(c => ({value: c.id, label: c.label}))} value={compositionId} onChange={e => setCompositionId(e.target.value)} />
                            </div>

                            {/* 敘事與隨從系統 (Stage 5) */}
                            <div className="border-t border-dashed border-[var(--color-border)] pt-4 mt-2">
                                <h4 className="text-[10px] font-mono font-bold text-[var(--color-gold)] mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <SparklesIcon className="w-3 h-3" /> Narrative & Companion
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <Select 
                                        label="戰損程度" 
                                        options={[
                                            {value: '0', label: '完好無損 (Pristine)'}, 
                                            {value: '1', label: '輕微擦傷 (Light)'}, 
                                            {value: '2', label: '激戰痕跡 (Moderate)'}, 
                                            {value: '3', label: '力竭戰損 (Heavy)'}
                                        ]} 
                                        value={battleDamage.toString()} 
                                        onChange={e => setBattleDamage(Number(e.target.value))} 
                                    />
                                    <Select 
                                        label="隨從系統" 
                                        options={companionOptions} 
                                        value={companion} 
                                        onChange={e => setCompanion(e.target.value)} 
                                    />
                                </div>
                            </div>
                            
                            {/* 動作姿勢 */}
                            <Select 
                                label="動作姿勢" 
                                options={filteredGroupedPoses} 
                                value={poseId} 
                                onChange={e => setPoseId(e.target.value)} 
                            />

                            {/* 面部表情 */}
                            <Select 
                                label="面部表情" 
                                options={filteredGroupedExpressions} 
                                value={expressionId} 
                                onChange={e => setExpressionId(e.target.value)} 
                            />
                            
                            <div className="border-t border-dashed border-[var(--color-border)] pt-4 mt-2">
                                 <h4 className="text-[10px] font-mono font-bold text-[var(--color-gold)] mb-3 uppercase tracking-[0.2em]">Visual Effects // FX</h4>
                                 <div className="grid grid-cols-3 gap-2 mb-4">
                                     <Select label="煙霧" options={FX_LEVEL_OPTIONS} value={fxPractical} onChange={e => setFxPractical(e.target.value as any)} />
                                     <Select label="粒子" options={FX_LEVEL_OPTIONS} value={fxParticles} onChange={e => setFxParticles(e.target.value as any)} />
                                     <Select label="能量" options={FX_LEVEL_OPTIONS} value={fxEnergy} onChange={e => setFxEnergy(e.target.value as any)} />
                                 </div>

                                 <h4 className="text-[10px] font-mono font-bold text-[var(--color-gold)] mb-3 uppercase tracking-[0.2em]">Atmospheric Optics</h4>
                                 <div className="grid grid-cols-2 gap-2 mb-4">
                                     <Select 
                                        label="丁達爾光柱" 
                                        options={FANTASY_ATMOS_V4.tyndall.map(t => ({ value: t.id, label: t.label }))} 
                                        value={atmosTyndall} 
                                        onChange={e => setAtmosTyndall(e.target.value as any)} 
                                     />
                                     <Select 
                                        label="魔力環境" 
                                        options={FANTASY_ATMOS_V4.mana.map(m => ({ value: m.id, label: m.label }))} 
                                        value={manaParticles} 
                                        onChange={e => setManaParticles(e.target.value as any)} 
                                     />
                                 </div>
                                 <Select 
                                    label="極端天象 (Celestial)" 
                                    options={FANTASY_CELESTIALS_V4.map(c => ({ value: c.id, label: c.label }))} 
                                    value={celestialEvent} 
                                    onChange={e => setCelestialEvent(e.target.value as any)} 
                                 />
                                 <Select 
                                    label="腳底魔法陣" 
                                    options={magicCircleOptions} 
                                    value={magicCircle} 
                                    onChange={e => setMagicCircle(e.target.value as any)} 
                                 />
                             </div>
                             <div className="grid grid-cols-2 gap-2">
                                <Select 
                                    label="圖片比例" 
                                    options={[
                                        {value: '1:1', label: '1:1 正方形'}, 
                                        {value: '3:4', label: '3:4 肖像'}, 
                                        {value: '9:16', label: '9:16 豎屏'}, 
                                        {value: '4:3', label: '4:3 寬屏'}, 
                                        {value: '16:9', label: '16:9 電影'}
                                    ]} 
                                    value={aspectRatio} 
                                    onChange={e => setAspectRatio(e.target.value)} 
                                />
                                <Select 
                                    label="渲染品質" 
                                    options={[
                                        {value: 'fast', label: '快速 (Fast)'}, 
                                        {value: 'balanced', label: '平衡 (Balanced)'}, 
                                        {value: 'high', label: '高品質 (High)'}
                                    ]} 
                                    value={quality} 
                                    onChange={e => setQuality(e.target.value as QualityLevel)} 
                                />
                            </div>
                        </div>
                    </Card>
                    <div className="relative group mt-4">
                        {/* 始終存在的微弱呼吸光暈 - 確保按鈕在任何時候都可見 */}
                        <div className="absolute -inset-0.5 bg-[var(--color-gold)] rounded-xl blur-md opacity-20 group-hover:opacity-60 transition-opacity duration-700"></div>
                        
                        <Button 
                            onClick={handleGenerate} 
                            isLoading={isLoading} 
                            disabled={!baseImage || isLoading} 
                            className={`relative w-full py-5 rounded-lg flex flex-col items-center justify-center overflow-hidden transition-all duration-500 active:scale-[0.98] border-2
                                ${isLoading 
                                    ? 'bg-neutral-900 border-white/10 cursor-wait' 
                                    : 'bg-black border-[var(--color-gold)]/60 hover:bg-[var(--color-gold)] hover:border-[var(--color-gold)] shadow-[0_4px_25px_rgba(0,0,0,0.6)] group-hover:shadow-[0_0_50px_rgba(212,175,55,0.5)]'
                                } 
                                disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed`}
                        >
                            {/* 內部流光層 - 增加亮度 */}
                            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-30deg]"></div>

                            {/* 主體內容容器 */}
                            <div className="flex flex-col items-center gap-1.5 relative z-10">
                                <div className="flex items-center gap-3">
                                    <SparklesIcon className={`w-5 h-5 transition-all duration-700 ${isLoading ? 'animate-spin text-white' : 'text-[var(--color-gold)] group-hover:text-black group-hover:rotate-180'}`} /> 
                                    <span className={`text-xl font-display font-black uppercase tracking-[0.35em] transition-all duration-500 whitespace-nowrap
                                        ${isLoading ? 'text-white animate-pulse' : 'text-white group-hover:text-black drop-shadow-[0_2px_8px_rgba(212,175,55,0.3)]'}`}>
                                        啟動終極轉化
                                    </span>
                                </div>
                                
                                <span className={`text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all duration-500
                                    ${isLoading ? 'text-white/40' : 'text-[var(--color-gold)] group-hover:text-black/70'}`}>
                                    {isLoading ? 'PROTOCOL V8.5 // ACTIVE' : 'INITIALIZE MORPH SEQUENCE'}
                                </span>
                            </div>

                            {/* 高亮邊角 - 強化幾何感 */}
                            <div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--color-gold)] transition-all duration-500 group-hover:border-black/40`}></div>
                            <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[var(--color-gold)] transition-all duration-500 group-hover:border-black/40`}></div>
                        </Button>
                    </div>
                </div>

                    {/* 預覽區域 */}
                <div className="lg:col-span-8">
                    <Card className="h-full min-h-[80vh] flex flex-col relative overflow-hidden bg-[var(--color-bg-deep)] border border-[var(--color-border)] shadow-2xl">
                        {/* Technical Decoration Frame */}
                        <div className="absolute inset-0 pointer-events-none border-[12px] border-transparent">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-[var(--color-gold)]/40"></div>
                            <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-[var(--color-gold)]/40"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-[var(--color-gold)]/40"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-[var(--color-gold)]/40"></div>
                        </div>

                        <div className="absolute top-6 left-6 z-10 flex flex-col gap-1">
                            <span className="text-[10px] font-mono text-[var(--color-gold)] uppercase tracking-[0.3em] bg-black/60 px-3 py-1 rounded border border-[var(--color-gold)]/20 backdrop-blur-md">
                                Pavora Morph Engine // V4.5 Enterprise
                            </span>
                            <div className="flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-sm rounded border border-white/5 w-fit">
                                <div className="w-1 h-1 rounded-full bg-[var(--color-success)] animate-pulse"></div>
                                <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest">Signal Locked // Render Quality: 4K High Fidelity</span>
                            </div>
                        </div>

                        <div className="absolute bottom-6 left-6 z-10 hidden sm:flex flex-col gap-0.5 opacity-40">
                            <span className="text-[8px] font-mono text-white tracking-[0.2em] uppercase">Auth: shihanhuanxiang@gmail.com</span>
                            <span className="text-[8px] font-mono text-white tracking-[0.2em] uppercase">Target: {race?.labelZh?.split('(')[1]?.replace(')', '') || 'UNKNOWN'}.{job?.labelZh?.split('(')[1]?.replace(')', '') || 'UNKNOWN'}</span>
                            <span className="text-[8px] font-mono text-white tracking-[0.2em] uppercase">Resolution: 3840 x 2160 PXL</span>
                        </div>

                        <div className="flex-grow flex items-center justify-center relative p-8">
                             {generatedImage ? (
                                <div className="relative group/img max-h-full max-w-full">
                                    <img src={generatedImage} alt="Fantasy Character" className="max-h-full max-w-full object-contain rounded-md shadow-2xl transition-all duration-700" />
                                    {/* Scan Line Detail */}
                                    {isLoading && (
                                        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-md">
                                            <div className="w-full h-[2px] bg-[var(--color-gold)] shadow-[0_0_15px_var(--color-gold)] animate-[scan_2s_linear_infinite] absolute top-0"></div>
                                            <div className="absolute inset-0 bg-[var(--color-gold)]/5 animate-pulse"></div>
                                        </div>
                                    )}
                                    {/* Corners */}
                                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[var(--color-gold)] opacity-0 group-hover/img:opacity-100 transition-opacity"></div>
                                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[var(--color-gold)] opacity-0 group-hover/img:opacity-100 transition-opacity"></div>
                                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[var(--color-gold)] opacity-0 group-hover/img:opacity-100 transition-opacity"></div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[var(--color-gold)] opacity-0 group-hover/img:opacity-100 transition-opacity"></div>
                                </div>
                             ) : baseImage ? (
                                <div className="relative max-h-full max-w-full">
                                    <img src={baseImage.url} alt="Reference" className="max-h-full max-w-full object-contain rounded-md opacity-30 grayscale sepia" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                                        <div className="text-center">
                                            <div className="w-16 h-16 border-2 border-[var(--color-gold)]/40 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                            <p className="text-[10px] font-mono text-[var(--color-gold)] uppercase tracking-[0.4em]">Standby // Ready to Morph</p>
                                        </div>
                                    </div>
                                </div>
                             ) : (
                                <div className="text-center text-[var(--color-text-dim)]">
                                    <Face3DIcon className="w-32 h-32 mx-auto mb-4 opacity-20" />
                                    <p className="text-xl font-display uppercase tracking-widest italic opacity-50 text-[var(--color-text-main)]">Character Standby</p>
                                </div>
                             )}
                        </div>
                        {generatedImage && (
                            <div className="mt-4 p-4 bg-[var(--color-bg-surface)]/80 backdrop-blur-md flex flex-wrap justify-center gap-4 border-t border-[var(--color-border)]">
                                <Button onClick={() => { downloadImage(generatedImage, `pavora_fantasy_${Date.now()}.jpg`, 'FantasySeries'); alert('已儲存並下載至作品集！'); }} variant="light">儲存作品</Button>
                                <Button onClick={handleDownload} variant="secondary" className="flex items-center gap-2"><DownloadIcon className="w-4 h-4" /> 下載 JPG</Button>
                                <Button onClick={() => setPreviewingImage(generatedImage)} variant="secondary" className="flex items-center gap-2"><ExpandIcon className="w-4 h-4" /> 放大</Button>
                                <Button onClick={() => onContinueEditing(generatedImage, 'scene')} variant="secondary" className="border-[var(--color-gold)] text-[var(--gold-color)]">前往場景轉移 &rarr;</Button>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default FantasySeries;
