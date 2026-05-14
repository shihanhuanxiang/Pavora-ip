
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { 
    getFriendlyErrorMessage, 
    fileToBase64, 
    imageUrlToimageData,
    analyzeSceneAndSubject,
    generateScene,
    tuneImageDetail,
    confirmPaidFeature,
    detectMultiAngleLayout
} from '../../shared/services/geminiService';
import { downloadImage, cropImage } from '../../shared/utils/imageUtils';
import ManualCropModal from '../../shared/components/business/ManualCropModal';
import { PosePreset, ExpressionPreset } from '../../shared/types/types';
import type { 
    ScenePhysics, SceneTimeSlot, SceneWeatherType 
} from '../../shared/types/types';

// 導入完全隔離的 UI 選項常數檔案
import { BACKGROUND_PRESETS } from '../../shared/constants/backgroundPresets';
import { FRAMING_PRESETS } from '../../shared/constants/framingPresets';
import { POSE_PRESETS } from '../../shared/constants/posePresets';
import { EXPRESSION_PRESETS } from '../../shared/constants/expressionPresets';
import { EXCLUSIVE_PRESETS } from '../../shared/constants/exclusivePresets';
import { TIME_OPTIONS } from '../../shared/constants/timePresets';
import { WEATHER_OPTIONS, WEATHER_INTENSITIES } from '../../shared/constants/weatherPresets';
import { SUPERMODEL_POSES } from '../../shared/constants/supermodelPoses';
import { FANTASY_RACES_V3, FANTASY_JOBS_V3 } from '../../shared/constants/fantasyData';

import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
import Loader from '../../shared/components/common/Loader';
import PhotoIcon from '../../shared/assets/icons/PhotoIcon';
import SceneTransferIcon from '../../shared/assets/icons/SceneTransferIcon'; 
import ImagePreviewModal from '../../shared/components/common/ImagePreviewModal';
import { useHistoryState } from '../../shared/hooks/useHistoryState';
import ImageCompareSlider from '../../shared/components/common/ImageCompareSlider';
import DownloadIcon from '../../shared/assets/icons/DownloadIcon';
import SparklesIcon from '../../shared/assets/icons/SparklesIcon';
import Select from '../../shared/components/common/Select';
import ReplaceIcon from '../../shared/assets/icons/ReplaceIcon';
import DiceIcon from '../../shared/assets/icons/DiceIcon';
import Slider from '../../shared/components/common/Slider';
import MaskEditor from '../../shared/components/common/MaskEditor';
import TuneIcon from '../../shared/assets/icons/TuneIcon';
import ChevronLeftIcon from '../../shared/assets/icons/ChevronLeftIcon';
import ChevronRightIcon from '../../shared/assets/icons/ChevronRightIcon';
import ExpandIcon from '../../shared/assets/icons/ExpandIcon';

import { useBrandStore } from '../../shared/stores/useBrandStore';
import { useModelStore } from '../../shared/stores/useModelStore';
import AsyncImage from '../../shared/components/common/AsyncImage';
import { useNotification } from '../../shared/context/NotificationContext';

interface SceneGenerationProps {
  onGoHome: () => void;
  initialImage?: { url: string; fileData: { data: string; mimeType: string; } } | null;
  onContinueEditing: (imageUrl: string, destination: string) => void;
  selectedModel?: any | null;
}

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

type QualityLevel = 'standard' | 'high' | 'ultra';
type AspectRatio = '9:16' | '3:4' | '1:1' | '4:3' | '16:9';

const SceneGeneration: React.FC<SceneGenerationProps> = ({ onGoHome, initialImage, onContinueEditing, selectedModel }) => {
    const [originalBaseImage, setOriginalBaseImage] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(initialImage || null);
    const [faceAnchor, setFaceAnchor] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(initialImage ? initialImage : null);

    // Matrix Mode State
    const [isMatrixMode, setIsMatrixMode] = useState(false);
    const [modelMatrix, setModelMatrix] = useState<Record<string, { id: string; label: string; url: string | null; fileData: { data: string; mimeType: string } | null }>>({
        'front': { id: 'front', label: '正面 (Front)', url: null, fileData: null },
        'side': { id: 'side', label: '側面 (Side)', url: null, fileData: null },
        'angle': { id: 'angle', label: '45度角 (45°)', url: null, fileData: null },
        'back': { id: 'back', label: '背面 (Back)', url: null, fileData: null },
    });
    const [isMultiAngleGen, setIsMultiAngleGen] = useState(false);

    const [isSceneCropModalOpen, setIsSceneCropModalOpen] = useState(false);
    const [sceneCropSource, setSceneCropSource] = useState<{ url: string; fileData: { data: string; mimeType: string } } | null>(null);
    const [sceneDetectedBoxes, setSceneDetectedBoxes] = useState<any[]>([]);
    const [isSceneDetecting, setIsSceneDetecting] = useState(false);

    const { 
        state: currentImage, push, history, undo, redo, canUndo, canRedo, reset: resetHistory, cursor
    } = useHistoryState<string>({ initial: initialImage?.url || '', max: 15 });

    const [gender, setGender] = useState<string>(selectedModel?.gender || 'female'); 
    const [fantasyGenderMode, setFantasyGenderMode] = useState<'auto' | 'female' | 'male'>('auto');

    useEffect(() => {
        if (initialImage) {
            setOriginalBaseImage(initialImage);
            setFaceAnchor(initialImage);
            resetHistory(initialImage.url);
        }
    }, [initialImage, resetHistory]);

    useEffect(() => {
        if (selectedModel?.gender) {
            setGender(selectedModel.gender);
        }
    }, [selectedModel]);

    const [selectedFantasyRace, setSelectedFantasyRace] = useState<string>('');
    const [selectedFantasyJob, setSelectedFantasyJob] = useState<string>('');
    const [battleDamage, setBattleDamage] = useState<number>(0);
    const [companion, setCompanion] = useState<string>('none');

    const [background, setBackground] = useState('');
    const [backgroundCategory, setBackgroundCategory] = useState<string>('');
    const [backgroundSupplement, setBackgroundSupplement] = useState('');
    const [pose, setPose] = useState('');
    const [supermodelPose, setSupermodelPose] = useState<string | null>(null);
    const [poseIntensity, setPoseIntensity] = useState(50);
    const [framing, setFraming] = useState('');
    const [expression, setExpression] = useState('');
    
    const [physics, setPhysics] = useState<ScenePhysics>({
        time: 'auto',
        weather: 'auto',
        intensity: '標準',
        stability: 'high',
        shadowIntensity: 50,
        ugcIntensity: 50,
        selfieCameraType: 'front',
        lightHardness: 'balanced',
        colorTemperature: 'neutral',
        lensFocalLength: '50mm',
        dofIntensity: 50
    });

    const [backgroundImage, setBackgroundImage] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(null);
    
    const [quality, setQuality] = useState<QualityLevel>('standard');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
    const [lockToAmbassador, setLockToAmbassador] = useState(false);
    const { addNotification } = useNotification();

    const PRESETS = [
        { id: 'cinematic', name: '電影感 (Cinematic)', icon: '🎬', physics: { time: 'evening', lightHardness: 'chiaroscuro', colorTemperature: 'golden_hour', lensFocalLength: '85mm', dofIntensity: 85, shadowIntensity: 40 }, quality: 'standard', aspectRatio: '9:16' },
        { id: 'studio', name: '棚拍感 (Studio)', icon: '📸', physics: { time: 'auto', lightHardness: 'balanced', colorTemperature: 'neutral', lensFocalLength: '50mm', dofIntensity: 30, shadowIntensity: 50 }, quality: 'standard', aspectRatio: '9:16' },
        { id: 'street', name: '街頭感 (Street)', icon: '🏙️', physics: { time: 'auto', lightHardness: 'hard', colorTemperature: 'neutral', lensFocalLength: '35mm', dofIntensity: 50, shadowIntensity: 70 }, quality: 'standard', aspectRatio: '9:16' },
        { id: 'editorial', name: '雜誌感 (Editorial)', icon: '💎', physics: { time: 'auto', lightHardness: 'soft', colorTemperature: 'neutral', lensFocalLength: '85mm', dofIntensity: 70, shadowIntensity: 30 }, quality: 'standard', aspectRatio: '9:16' },
        { id: 'cyberpunk', name: '賽博感 (Cyberpunk)', icon: '🏮', physics: { time: 'night', lightHardness: 'rim_only', colorTemperature: 'neon_cyber', lensFocalLength: '24mm', dofIntensity: 60, shadowIntensity: 80 }, quality: 'standard', aspectRatio: '9:16' },
        { id: 'dreamy', name: '夢幻感 (Dreamy)', icon: '✨', physics: { time: 'morning', lightHardness: 'ultra_soft', colorTemperature: 'warm', lensFocalLength: '50mm', dofIntensity: 90, shadowIntensity: 20 }, quality: 'standard', aspectRatio: '9:16' },
    ];

    const applyPreset = (preset: any) => {
        setPhysics(prev => ({ ...prev, ...preset.physics }));
        setQuality(preset.quality);
        setAspectRatio(preset.aspectRatio);
        addNotification({
            type: 'success',
            message: `已套用 ${preset.name} 預設`,
            description: '環境參數已自動優化。'
        });
    };

    const { ambassadors, activeAmbassadorId, setActiveAmbassador } = useBrandStore();
    const activeAmbassador = useMemo(() => ambassadors.find(a => a.id === activeAmbassadorId), [ambassadors, activeAmbassadorId]);

    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [previewingImage, setPreviewingImage] = useState<string | null>(null);
    const [isPrecisionMode, setIsPrecisionMode] = useState(false);
    const [multiAngleResults, setMultiAngleResults] = useState<Record<string, string | null>>({});
    const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
    const [isRegenerating, setIsRegenerating] = useState<string | null>(null);

    // Collapsible Sections State
    const [openSections, setOpenSections] = useState<Set<string>>(new Set(['subject']));

    const MODEL_ANGLES = [
        { id: 'front', label: '正面主鏡', en: 'Front cinematic view' },
        { id: 'side', label: '側顏氣質', en: 'Elegant profile' },
        { id: 'selfie_high', label: '生活自拍(高)', en: 'High-angle POV selfie' },
        { id: 'selfie_pov', label: '第一人稱親密', en: 'First-person intimate POV' }
    ];

    const steps = [
        { id: 'subject', label: '上傳角色', completed: !!originalBaseImage },
        { id: 'background', label: '場景配置', completed: !!(background || backgroundImage) },
        { id: 'settings', label: '參數微調', completed: !!(pose && expression) },
        { id: 'generate', label: '執行融合', completed: !!currentImage }
    ];

    const toggleSection = (sectionId: string) => {
        setOpenSections(prev => {
            const next = new Set(prev);
            if (next.has(sectionId)) next.delete(sectionId);
            else next.add(sectionId);
            return next;
        });
    };
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const backgroundFileInputRef = useRef<HTMLInputElement>(null);
    const faceAnchorInputRef = useRef<HTMLInputElement>(null);

    const exclusiveData = useMemo(() => {
        if (!backgroundCategory || !EXCLUSIVE_PRESETS[backgroundCategory]) return { poses: [], expressions: [] };
        return EXCLUSIVE_PRESETS[backgroundCategory];
    }, [backgroundCategory]);

    const filteredGroupedPoses = useMemo(() => {
        const groups: Record<string, {id: string, name: string, keyword: string}[]> = {};
        
        // 1. 場景專屬推薦
        if (exclusiveData.poses && exclusiveData.poses.length > 0) {
            groups['✨ 當前場景專屬推薦'] = exclusiveData.poses;
        }

        // 2. 自拍聯動推薦 (Category Linking)
        const isSelfie = framing.toLowerCase().includes('selfie');
        if (isSelfie) {
            const selfieCat = POSE_PRESETS.find(c => c.category === '社群自拍 (Social Selfie)');
            if (selfieCat) {
                groups['✨ 自拍推薦 (Selfie Focus)'] = selfieCat.items;
            }
        }

        // 3. 一般分類
        POSE_PRESETS.forEach(cat => {
            // Only show Social Selfie if framing is selfie
            if (cat.category === '社群自拍 (Social Selfie)' && !isSelfie) return;
            
            // Avoid duplication: if it's already in the "✨ 自拍推薦" section, skip it here
            if (cat.category === '社群自拍 (Social Selfie)' && isSelfie) return;

            const items = cat.items.filter(item => 
                item.genderTag === '通用' || 
                (gender === 'female' && item.genderTag === '女性') ||
                (gender === 'male' && item.genderTag === '男性') ||
                gender === 'auto'
            );
            if (items.length > 0) groups[cat.category] = items;
        });

        // 4. 超模姿態庫 (Supermodel Pose Gallery)
        if (SUPERMODEL_POSES && SUPERMODEL_POSES.length > 0) {
            const allSupermodelItems = SUPERMODEL_POSES.flatMap(cat => cat.items);
            groups['超模姿態庫 (Supermodel Pose Gallery)'] = allSupermodelItems;
        }

        return groups;
    }, [gender, exclusiveData, framing]);

    const filteredGroupedExpressions = useMemo(() => {
        const groups: Record<string, {id: string, name: string, keyword: string}[]> = {};
        
        // 1. 場景專屬推薦
        if (exclusiveData.expressions && exclusiveData.expressions.length > 0) {
            groups['✨ 當前場景專屬推薦'] = exclusiveData.expressions;
        }

        // 2. 自拍聯動推薦 (Category Linking)
        const isSelfie = framing.toLowerCase().includes('selfie');
        if (isSelfie) {
            const selfieCat = EXPRESSION_PRESETS.find(c => c.category === '社群自拍 (Social Selfie)');
            if (selfieCat) {
                groups['✨ 自拍推薦 (Selfie Focus)'] = selfieCat.items;
            }
        }

        // 3. 一般分類
        EXPRESSION_PRESETS.forEach(cat => {
            // Only show Social Selfie if framing is selfie
            if (cat.category === '社群自拍 (Social Selfie)' && !isSelfie) return;

            // Avoid duplication: if it's already in the "✨ 自拍推薦" section, skip it here
            if (cat.category === '社群自拍 (Social Selfie)' && isSelfie) return;

            const items = cat.items.filter(item => 
                item.genderTag === '通用' || 
                (gender === 'female' && item.genderTag === '女性') ||
                (gender === 'male' && item.genderTag === '男性') ||
                gender === 'auto'
            );
            if (items.length > 0) groups[cat.category] = items;
        });
        return groups;
    }, [gender, exclusiveData, framing]);

    const handleBackgroundChange = (keyword: string) => {
        setBackground(keyword);
        if (keyword !== '') {
            // 如果選擇了預設背景，清空手動上傳的背景圖以避免邏輯衝突
            setBackgroundImage(null);
        }
        
        const found = BACKGROUND_PRESETS.find(cat => cat.items.some(item => item.keyword === keyword));
        if (found) {
            setBackgroundCategory(found.category);
            setPose('');
            setExpression('');
            
            // Smart Linking: Auto-adjust physics based on background
            const selectedItem = found.items.find(i => i.keyword === keyword);
            if (selectedItem) {
                const kw = selectedItem.keyword.toLowerCase();
                let newPhysics = { ...physics };
                
                // Time mapping
                if (kw.includes('morning') || kw.includes('dawn')) newPhysics.time = 'morning';
                else if (kw.includes('sunset') || kw.includes('dusk')) newPhysics.time = 'sunset';
                else if (kw.includes('night') || kw.includes('neon')) newPhysics.time = 'night';
                else if (kw.includes('afternoon')) newPhysics.time = 'afternoon';
                
                // Weather mapping
                if (kw.includes('misty') || kw.includes('fog')) newPhysics.weather = 'misty';
                else if (kw.includes('rain')) newPhysics.weather = 'rainy';
                else if (kw.includes('snow')) newPhysics.weather = 'snowy';
                else if (kw.includes('overcast') || kw.includes('cloudy')) newPhysics.weather = 'cloudy';
                else if (kw.includes('sun') || kw.includes('bright')) newPhysics.weather = 'clear';
                
                setPhysics(newPhysics);
            }
        } else {
            setBackgroundCategory('');
        }
    };

    const handleReset = () => {
        if (originalBaseImage) resetHistory(originalBaseImage.url);
    };

    const handleNavigate = (destination: string) => {
        // Placeholder for navigation if needed
    };

    const handleModelSlotUpload = async (angleId: string, event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const fileData = await fileToBase64(file);
            const url = URL.createObjectURL(file);
            
            setModelMatrix(prev => ({
                ...prev,
                [angleId]: { ...prev[angleId], url, fileData }
            }));
            
            // If this is the first one or front, also set as originalBaseImage for compatibility
            if (angleId === 'front') {
                setOriginalBaseImage({ url, fileData });
                resetHistory(url);
            }
        }
    };

    const handleDeleteModelSlot = (angleId: string) => {
        setModelMatrix(prev => ({
            ...prev,
            [angleId]: { ...prev[angleId], url: null, fileData: null }
        }));
        if (angleId === 'front') {
            setOriginalBaseImage(null);
            setFaceAnchor(null);
        }
    };

    const handleClearModelMatrix = () => {
        setModelMatrix({
            'front': { id: 'front', label: '正面 (Front)', url: null, fileData: null },
            'side': { id: 'side', label: '側面 (Side)', url: null, fileData: null },
            'angle': { id: 'angle', label: '45度角 (45°)', url: null, fileData: null },
            'back': { id: 'back', label: '背面 (Back)', url: null, fileData: null },
        });
        setOriginalBaseImage(null);
        setFaceAnchor(null);
    };

    const handleRegenerateAngle = async (angleId: string) => {
        const angle = MODEL_ANGLES.find(a => a.id === angleId);
        if (!angle) return;

        setIsRegenerating(angleId);
        try {
            // IP 模特兒身份注入邏輯
            const activeModel = useModelStore.getState().getActiveModel?.() || useModelStore.getState().models.find(m => m.id === useModelStore.getState().activeModelId);
            const modelIdentityHint = activeModel?.persona?.locked_descriptor 
                ? `Subject identity: ${activeModel.persona.locked_descriptor}` 
                : undefined;

            const config = { 
                usePro: quality !== 'standard', 
                resolution: quality === 'ultra' ? '4K' : '2K' as '2K' | '4K',
                imageConfig: { aspectRatio },
                customInstruction: modelIdentityHint
            };
            const options = {
                poseExpression: {
                    posePreset: (pose || 'stand') as any,
                    expressionPreset: (expression || 'neutral') as any,
                    supermodelPose: supermodelPose || undefined,
                    poseIntensity
                },
                physics,
                backgroundPreset: background === 'custom_manual' ? "" : background,
                backgroundSupplement,
                gender,
                framing: framing || '',
                fantasyRace: FANTASY_RACES_V3.find(r => r.name === selectedFantasyRace),
                fantasyJob: FANTASY_JOBS_V3.find(j => j.name === selectedFantasyJob),
                battleDamage,
                companion
            };

            const matrixImages = isMatrixMode 
                ? Object.values(modelMatrix).filter((m: any) => m.fileData).map((m: any) => ({
                    label: m.label,
                    fileData: m.fileData
                }))
                : null;
            const personData = isMatrixMode ? matrixImages : originalBaseImage?.fileData;
            const primaryPerson = isMatrixMode ? (matrixImages![0] as any).fileData : originalBaseImage?.fileData;
            const identityRef = (lockToAmbassador && activeAmbassador) 
                ? await imageUrlToimageData(activeAmbassador.imageUrl) 
                : (faceAnchor ? faceAnchor.fileData : primaryPerson);

            const isSelfieMode = (framing || '').toLowerCase().includes('selfie');
            const angleOptions = {
                ...options,
                framing: isSelfieMode ? `Social Selfie (${angle.en})` : angle.en
            };
            
            const freshSeed = Math.floor(Math.random() * 1000000);
            const angleConfig = {
                ...config,
                imageConfig: {
                    ...config.imageConfig,
                    seed: freshSeed
                }
            };

            const result = await generateScene(personData, backgroundImage?.fileData || null, angleOptions, angleConfig, () => {}, identityRef);
            setMultiAngleResults(prev => ({ ...prev, [angleId]: result }));
            
            if (angleId === 'front') {
                push(result);
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
        if (!originalBaseImage && !isMatrixMode) { setError('請先上傳模特兒。'); return; }
        
        // Collect matrix images if in matrix mode
        const matrixImages = isMatrixMode 
            ? Object.values(modelMatrix).filter((m: any) => m.fileData).map((m: any) => ({
                label: m.label,
                fileData: m.fileData
            }))
            : null;

        if (isMatrixMode && (!matrixImages || matrixImages.length === 0)) {
            setError('請至少上傳一張矩陣照片。');
            return;
        }

        if (background === 'custom_manual' && !backgroundSupplement.trim()) {
            setError('【自訂描述模式】下必須填寫場景細節。');
            return;
        }
        if (!backgroundImage && !background) { setError('請選擇或上傳背景環境。'); return; }

        if (quality !== 'standard') {
            const confirmed = await confirmPaidFeature();
            if (!confirmed) return;
        }

        setIsLoading(true); 
        setError(null);
        setMultiAngleResults({});
        setLoadingMessage("正在初始化 Pavora 渲染引擎...");

        try {
            // IP 模特兒身份注入邏輯
            const activeModel = useModelStore.getState().getActiveModel?.() || useModelStore.getState().models.find(m => m.id === useModelStore.getState().activeModelId);
            const modelIdentityHint = activeModel?.persona?.locked_descriptor 
                ? `Subject identity: ${activeModel.persona.locked_descriptor}` 
                : undefined;

            const config = { 
                usePro: quality !== 'standard', 
                resolution: quality === 'ultra' ? '4K' : '2K' as '2K' | '4K',
                imageConfig: { aspectRatio },
                customInstruction: modelIdentityHint
            };
            const options = {
                poseExpression: {
                    posePreset: (pose || 'stand') as any,
                    expressionPreset: (expression || 'neutral') as any,
                    supermodelPose: supermodelPose || undefined,
                    poseIntensity
                },
                physics,
                backgroundPreset: background === 'custom_manual' ? "" : background,
                backgroundSupplement,
                gender,
                framing: framing || '',
                fantasyRace: FANTASY_RACES_V3.find(r => r.name === selectedFantasyRace),
                fantasyJob: FANTASY_JOBS_V3.find(j => j.name === selectedFantasyJob),
                battleDamage,
                companion
            };

            const personData = isMatrixMode ? matrixImages : originalBaseImage?.fileData;
            const primaryPerson = isMatrixMode ? (matrixImages![0] as any).fileData : originalBaseImage?.fileData;

            const identityRef = (lockToAmbassador && activeAmbassador) 
                ? await imageUrlToimageData(activeAmbassador.imageUrl) 
                : (faceAnchor ? faceAnchor.fileData : primaryPerson);
            
            if (isMultiAngleGen) {
                setLoadingMessage("正在執行多角度矩陣生成 (1/4)...");
                const angles = [
                    { id: 'front', label: '正面', en: 'Front view' },
                    { id: 'side', label: '側面', en: 'Side view' },
                    { id: 'angle', label: '斜側', en: 'Angle view' },
                    { id: 'back', label: '背面', en: 'Back view' }
                ];
                const results: Record<string, string> = {};
                const generationSeed = Math.floor(Math.random() * 1000000); // Lock seed for consistency
                
                const isSelfieMode = (framing || '').toLowerCase().includes('selfie');

                for (let i = 0; i < angles.length; i++) {
                    setLoadingMessage(`正在生成角度: ${angles[i].label} (${i+1}/4)...`);
                    const angleOptions = {
                        ...options,
                        framing: isSelfieMode ? `Social Selfie (${angles[i].en})` : angles[i].en
                    };
                    const angleConfig = {
                        ...config,
                        imageConfig: {
                            ...config.imageConfig,
                            seed: generationSeed
                        }
                    };
                    const result = await generateScene(personData, backgroundImage?.fileData || null, angleOptions, angleConfig, setLoadingMessage, identityRef);
                    results[angles[i].id] = result;
                    setMultiAngleResults(prev => ({ ...prev, [angles[i].id]: result }));
                }
                
                push(results['front']);
                addNotification({
                    type: 'success',
                    message: '多角度生成完成！',
                    description: '已切換至 4 宮格預覽模式，您可以在歷史紀錄中查看。'
                });
            } else {
                const result = await generateScene(personData, backgroundImage?.fileData || null, options, config, setLoadingMessage, identityRef);
                push(result); 
            }
        } catch (err) { 
            setError(getFriendlyErrorMessage(err)); 
        } finally { 
            setIsLoading(false); 
            setLoadingMessage("");
        }
    }, [originalBaseImage, isMatrixMode, modelMatrix, backgroundImage, background, backgroundSupplement, pose, framing, expression, physics, faceAnchor, quality, aspectRatio, push, gender, lockToAmbassador, activeAmbassador, isMultiAngleGen, addNotification, supermodelPose, poseIntensity, selectedFantasyRace, selectedFantasyJob, battleDamage, companion]);

    const handleAmbassadorSelect = async (ambassadorId: string) => {
        const ambassador = ambassadors.find(a => a.id === ambassadorId);
        if (ambassador) {
            setActiveAmbassador(ambassadorId);
            setLockToAmbassador(true);
            try {
                const fileData = await imageUrlToimageData(ambassador.imageUrl);
                setFaceAnchor({ url: ambassador.imageUrl, fileData });
                
                // 如果尚未上傳模特兒，則將代言人作為基礎模特兒
                if (!originalBaseImage) {
                    setOriginalBaseImage({ url: ambassador.imageUrl, fileData });
                    resetHistory(ambassador.imageUrl);
                }
            } catch (err) {
                setError('載入代言人資料失敗。');
            }
        }
    };

    const handleRandomize = () => {
        // 1. 隨機選取背景
        const randomCat = getRandomItem(BACKGROUND_PRESETS);
        const randomBg = getRandomItem(randomCat.items);
        
        // 更新背景相關狀態
        setBackground(randomBg.keyword);
        setBackgroundCategory(randomCat.category);
        setBackgroundImage(null); // 隨機背景時清空參考圖

        // 2. 隨機選取物理環境
        const randomTime = getRandomItem(TIME_OPTIONS.filter(o => o.value !== 'auto')).value as SceneTimeSlot;
        const randomWeather = getRandomItem(WEATHER_OPTIONS.filter(o => o.value !== 'auto')).value as SceneWeatherType;
        const intensities = WEATHER_INTENSITIES[randomWeather];
        const randomIntensity = getRandomItem(intensities);

        setPhysics(p => ({
            ...p,
            time: randomTime,
            weather: randomWeather,
            intensity: randomIntensity,
            shadowIntensity: Math.floor(Math.random() * 101),
            ugcIntensity: Math.floor(Math.random() * 101),
            selfieCameraType: getRandomItem(['front', 'rear']) as 'front' | 'rear',
            selfieAngle: getRandomItem(['high', 'eye', 'low']) as 'high' | 'eye' | 'low'
        }));

        // 3. 核心修正：直接根據 randomCat.category 計算出可選的動作與表情，避免依賴 memo 的延遲
        const currentExclusive = EXCLUSIVE_PRESETS[randomCat.category] || { poses: [], expressions: [] };
        
        // 構建臨時的可選 Pose 清單
        const tempPoses: any[] = [...currentExclusive.poses];
        POSE_PRESETS.forEach(cat => {
            const items = cat.items.filter(item => 
                item.genderTag === '通用' || 
                (gender === 'female' && item.genderTag === '女性') ||
                (gender === 'male' && item.genderTag === '男性') ||
                gender === 'auto'
            );
            tempPoses.push(...items);
        });

        // 構建臨時的可選 Expression 清單
        const tempExpressions: any[] = [...currentExclusive.expressions];
        EXPRESSION_PRESETS.forEach(cat => {
            const items = cat.items.filter(item => 
                item.genderTag === '通用' || 
                (gender === 'female' && item.genderTag === '女性') ||
                (gender === 'male' && item.genderTag === '男性') ||
                gender === 'auto'
            );
            tempExpressions.push(...items);
        });

        // 執行隨機選取
        if (tempPoses.length > 0) {
            setPose(getRandomItem(tempPoses).keyword);
        }
        if (tempExpressions.length > 0) {
            setExpression(getRandomItem(tempExpressions).keyword);
        }
    };

    const handleDownloadAll = () => {
        if (isMultiAngleGen && Object.keys(multiAngleResults).length > 0) {
            Object.entries(multiAngleResults).forEach(([id, url]) => {
                if (url && typeof url === 'string') {
                    downloadImage(url, `pavora_scene_${id}_all_${Date.now()}.jpg`, 'SceneGeneration');
                }
            });
        } else if (currentImage) {
            downloadImage(currentImage, `pavora_scene_result_${Date.now()}.jpg`, 'SceneGeneration');
        }
    };

    const handleDownloadSelected = () => {
        if (isMultiAngleGen && selectedResults.size > 0) {
            Array.from(selectedResults).forEach(id => {
                const url = multiAngleResults[id];
                if (url && typeof url === 'string') {
                    downloadImage(url, `pavora_scene_${id}_selected_${Date.now()}.jpg`, 'SceneGeneration');
                }
            });
        } else {
            handleDownloadAll();
        }
    };

    const toggleResultSelection = (id: string) => {
        setSelectedResults(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const beforeImage = history && history.length > 1 ? history[cursor - 1] : null;

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-[1400px] animate-fade-in pb-20">
            {isSceneCropModalOpen && sceneCropSource && (
                <ManualCropModal
                    imageUrl={sceneCropSource.url}
                    initialBoxes={sceneDetectedBoxes}
                    angles={[
                        { id: 'front', label: '正面 (Front)', en: 'Front' },
                        { id: 'side', label: '側面 (Side)', en: 'Side' },
                        { id: 'angle', label: '45度角 (45°)', en: 'Angle' },
                        { id: 'back', label: '背面 (Back)', en: 'Back' }
                    ]}
                    onSave={async (boxes) => {
                        try {
                            setIsLoading(true);
                            setLoadingMessage('正在套用裁切...');
                            for (const box of boxes) {
                                const cropped = await cropImage(sceneCropSource.fileData, box.box_2d);
                                const url = `data:${cropped.mimeType};base64,${cropped.data}`;
                                setModelMatrix(prev => ({
                                    ...prev,
                                    [box.angle]: { 
                                        ...prev[box.angle], 
                                        url, 
                                        fileData: cropped 
                                    }
                                }));
                                if (box.angle === 'front') {
                                    setOriginalBaseImage({ url, fileData: cropped });
                                    resetHistory(url);
                                }
                            }
                            addNotification({ type: 'success', message: '多角度裁切已完成並套用' });
                        } catch (err) {
                            console.error('Scene crop save failed:', err);
                            addNotification({ type: 'error', message: '裁切套用失敗' });
                        } finally {
                            setIsLoading(false);
                            setIsSceneCropModalOpen(false);
                            setSceneCropSource(null);
                            setSceneDetectedBoxes([]);
                        }
                    }}
                    onClose={() => {
                        setIsSceneCropModalOpen(false);
                        setSceneCropSource(null);
                        setSceneDetectedBoxes([]);
                    }}
                    onResetToAI={async () => {
                        if (!sceneCropSource) return;
                        try {
                            const boxes = await detectMultiAngleLayout(sceneCropSource.fileData);
                            setSceneDetectedBoxes(boxes.map((b: any, i: number) => ({ 
                                ...b, id: `scene-auto-${Date.now()}-${i}` 
                            })));
                        } catch (e) {
                            console.error('AI Reset failed', e);
                        }
                    }}
                />
            )}
            {isLoading && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
                    <div className="relative w-64 h-64 mb-8">
                        {/* Tech Scanning Animation */}
                        <div className="absolute inset-0 border-2 border-[var(--color-gold)]/20 rounded-full animate-spin" style={{ animationDuration: '10s' }}></div>
                        <div className="absolute inset-4 border border-[var(--color-gold)]/40 rounded-full animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }}></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-32 h-32 bg-[var(--color-gold)]/10 rounded-full flex items-center justify-center">
                                <div className="w-16 h-16 border-4 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        </div>
                        {/* Scanning Line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-gold)] shadow-[0_0_15px_var(--color-gold)] animate-[scan_3s_ease-in-out_infinite] opacity-50"></div>
                    </div>
                    <div className="text-center space-y-3">
                        <h3 className="text-xl font-display font-bold text-[var(--color-gold)] uppercase tracking-[0.3em] animate-pulse">
                            系統融合中...
                        </h3>
                        <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium">
                            {loadingMessage || "Ray-Tracing Fusion & 8K Detail Reconstruction in Progress"}
                        </p>
                        <div className="flex gap-1 justify-center mt-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="w-1 h-4 bg-[var(--color-gold)]/20 rounded-full overflow-hidden">
                                    <div className="w-full h-full bg-[var(--color-gold)] animate-[loading_1.5s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.1}s` }}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {previewingImage && (
                <ImagePreviewModal 
                    images={isMultiAngleGen ? MODEL_ANGLES.map(a => multiAngleResults[a.id]).filter(Boolean) as string[] : [previewingImage]} 
                    startIndex={isMultiAngleGen ? (MODEL_ANGLES.map(a => multiAngleResults[a.id]).filter(Boolean) as string[]).indexOf(previewingImage) : 0} 
                    onClose={() => setPreviewingImage(null)} 
                />
            )}
            
            {isPrecisionMode && (currentImage || originalBaseImage?.url) && (
                <MaskEditor 
                    imageSrc={currentImage || originalBaseImage!.url} 
                    onConfirm={async (mask, instr) => {
                        setIsPrecisionMode(false);
                        setIsLoading(true);
                        setLoadingMessage('執行精密修復...');
                        try {
                            const baseData = await imageUrlToimageData(currentImage || originalBaseImage!.url);
                            const maskData = await imageUrlToimageData(mask);
                            const result = await tuneImageDetail(baseData, maskData, instr, [originalBaseImage!.fileData], setLoadingMessage, { 
                                usePro: quality !== 'standard', 
                                resolution: quality === 'ultra' ? '4K' : '2K'
                            });
                            push(result);
                        } catch (e) { setError(getFriendlyErrorMessage(e)); }
                        finally { setIsLoading(false); }
                    }} 
                    onCancel={() => setIsPrecisionMode(false)} 
                />
            )}

            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={async (e) => {
                if (e.target.files?.[0]) {
                    const data = await fileToBase64(e.target.files[0]);
                    const url = URL.createObjectURL(e.target.files[0]);
                    setOriginalBaseImage({ url, fileData: data });
                    resetHistory(url);
                }
            }} />
            <input type="file" ref={backgroundFileInputRef} className="hidden" accept="image/*" onChange={async (e) => {
                if (e.target.files?.[0]) {
                    const data = await fileToBase64(e.target.files[0]);
                    setBackgroundImage({ url: URL.createObjectURL(e.target.files[0]), fileData: data });
                    setBackground('');
                    setBackgroundCategory('');
                }
            }} />
            <input type="file" ref={faceAnchorInputRef} className="hidden" accept="image/*" onChange={async (e) => {
                if (e.target.files?.[0]) {
                    const data = await fileToBase64(e.target.files[0]);
                    setFaceAnchor({ url: URL.createObjectURL(e.target.files[0]), fileData: data });
                }
            }} />

            {/* Header */}
            <div className="sticky top-[80px] z-30 glass-panel border-x-0 border-t-0 px-6 py-4 mb-8">
                <div className="max-w-[110rem] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-display font-bold uppercase tracking-[0.3em] text-[var(--color-text-main)]">場景轉移</h2>
                        <span className="text-[9px] uppercase tracking-[0.5em] text-[var(--color-gold)] font-light">Scene Transfer Studio</span>
                    </div>

                    {/* Step Indicator */}
                    <div className="flex items-center gap-2 md:gap-4">
                        {steps.map((step, idx) => (
                            <React.Fragment key={step.id}>
                                <div className="flex flex-col items-center gap-1">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                                        openSections.has(step.id) 
                                            ? 'border-[var(--color-gold)] bg-[var(--color-gold)] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                                            : step.completed 
                                                ? 'border-[var(--color-gold)] text-[var(--color-gold)] bg-[var(--color-gold)]/10' 
                                                : 'border-gray-800 text-gray-600'
                                    }`}>
                                        {step.completed && !openSections.has(step.id) ? (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                        ) : (
                                            <span className="text-xs font-bold">{idx + 1}</span>
                                        )}
                                    </div>
                                    <span className={`text-[9px] font-bold uppercase tracking-widest ${openSections.has(step.id) ? 'text-[var(--color-gold)]' : 'text-gray-600'}`}>
                                        {step.label}
                                    </span>
                                </div>
                                {idx < steps.length - 1 && (
                                    <div className={`w-4 md:w-8 h-[2px] mb-4 transition-colors duration-500 ${step.completed ? 'bg-[var(--color-gold)]/50' : 'bg-gray-800'}`}></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${!isMatrixMode ? 'text-[var(--color-gold)]' : 'text-gray-500'}`}>單角度</span>
                            <button 
                                onClick={() => setIsMatrixMode(!isMatrixMode)}
                                className={`w-10 h-5 rounded-full relative transition-colors ${isMatrixMode ? 'bg-[var(--color-gold)]' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isMatrixMode ? 'right-1' : 'left-1'}`}></div>
                            </button>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isMatrixMode ? 'text-[var(--color-gold)]' : 'text-gray-500'}`}>多角度矩陣</span>
                        </div>
                        {onGoHome && <Button onClick={onGoHome} variant="secondary" className="text-[10px] font-bold tracking-widest px-6 border-gray-800 hover:border-[var(--color-gold)]">返回首頁</Button>}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* 1. 模特兒與身份 */}
                    <Card className="p-0 overflow-hidden border-gray-800/50 hover:border-[var(--color-gold)]/30 transition-all duration-500">
                        <div 
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleSection('subject')}
                            onKeyDown={(e) => e.key === 'Enter' && toggleSection('subject')}
                            className={`w-full flex justify-between items-center p-5 cursor-pointer transition-all duration-500 ${openSections.has('subject') ? 'bg-[var(--color-gold)]/5 text-black' : 'bg-transparent text-gray-400 hover:bg-white/5'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all duration-500 ${openSections.has('subject') ? 'bg-[var(--color-gold)] border-[var(--color-gold)] text-black' : 'bg-gray-900 border-gray-800 text-gray-500'}`}>
                                    <PhotoIcon className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h3 className={`text-sm font-bold tracking-[0.15em] uppercase ${openSections.has('subject') ? 'text-[var(--color-gold)]' : 'text-gray-300'}`}>
                                        01. 模特兒與身份
                                    </h3>
                                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">Subject & Identity Lock</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 mr-4">
                                {isMatrixMode && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleClearModelMatrix(); }}
                                        className="text-[9px] text-red-500 hover:text-red-400 uppercase font-bold transition-colors"
                                    >
                                        清空矩陣
                                    </button>
                                )}
                                <span className={`transition-transform duration-500 ${openSections.has('subject') ? 'rotate-180 text-[var(--color-gold)]' : 'text-gray-600'}`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </span>
                            </div>
                        </div>

                        <div className={`collapsible-content ${openSections.has('subject') ? 'open p-6' : ''}`}>
                            {isMatrixMode ? (
                                <div className="space-y-6 mb-6">
                                    <label className="block text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-[0.2em]">多角度矩陣上傳 (虛擬試衣間模式)</label>
                                    
                                    <div className="mb-4">
                                        <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl 
                                            text-[9px] font-black uppercase tracking-widest cursor-pointer 
                                            border transition-all w-full justify-center
                                            ${isSceneDetecting 
                                                ? 'border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 text-[var(--color-gold)] animate-pulse cursor-not-allowed' 
                                                : 'border-white/10 bg-white/[0.02] text-gray-400 hover:border-[var(--color-gold)]/50 hover:text-[var(--color-gold)]'
                                            }`}>
                                            {isSceneDetecting ? '⚡ AI 偵測中...' : '📷 上傳合照並自動裁切到四個視角'}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                disabled={isSceneDetecting}
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    setIsSceneDetecting(true);
                                                    try {
                                                        const fileData = await fileToBase64(file);
                                                        const url = URL.createObjectURL(file);
                                                        const boxes = await detectMultiAngleLayout(fileData);
                                                        setSceneDetectedBoxes(boxes.map((b: any, i: number) => ({ 
                                                            ...b, id: `scene-auto-${i}` 
                                                        })));
                                                        setSceneCropSource({ url, fileData });
                                                        setIsSceneCropModalOpen(true);
                                                    } catch (err) {
                                                        console.error('Scene detect failed:', err);
                                                        const reader = new FileReader();
                                                        reader.onload = (ev) => {
                                                            const dataUrl = ev.target?.result as string;
                                                            if (dataUrl) {
                                                                setSceneCropSource({ 
                                                                    url: URL.createObjectURL(file), 
                                                                    fileData: { data: dataUrl.split(',')[1], mimeType: file.type }
                                                                });
                                                                setSceneDetectedBoxes([]);
                                                                setIsSceneCropModalOpen(true);
                                                            }
                                                        };
                                                        reader.readAsDataURL(file);
                                                    } finally {
                                                        setIsSceneDetecting(false);
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {(Object.values(modelMatrix) as any[]).map(angle => (
                                            <div key={angle.id} className="space-y-2">
                                                <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-tighter">{angle.label}</label>
                                                <div 
                                                    onClick={() => document.getElementById(`model-upload-${angle.id}`)?.click()}
                                                    className="aspect-[3/4] bg-black/40 border-2 border-dashed border-gray-800 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[var(--color-gold)] transition-all overflow-hidden relative group"
                                                >
                                                    {angle.url ? (
                                                        <>
                                                            <AsyncImage src={angle.url} className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity">
                                                                <span className="text-[10px] font-bold text-white uppercase">更換圖片</span>
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
                                                        </>
                                                    ) : (
                                                        <>
                                                            <PhotoIcon className="w-6 h-6 text-gray-700 mb-1" />
                                                            <span className="text-[9px] text-gray-700 font-bold uppercase">點擊上傳</span>
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
                                    <div className="p-3 bg-[var(--color-gold)]/5 border border-[var(--color-gold)]/20 rounded-lg">
                                        <p className="text-[9px] text-[var(--color-gold)] font-medium leading-relaxed">
                                            💡 提示：上傳多個角度可幫助 AI 在融合背景時更精準地還原模特兒的 3D 結構與服飾細節。
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-6">
                                    <label className="block text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-[0.2em]">選擇品牌代言人 (鎖定面部)</label>
                                    <div className="grid grid-cols-4 gap-2 mb-4">
                                        {ambassadors.map(ambassador => (
                                            <button 
                                                key={ambassador.id}
                                                onClick={() => handleAmbassadorSelect(ambassador.id)}
                                                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 ${activeAmbassadorId === ambassador.id && lockToAmbassador ? 'border-[var(--color-gold)] scale-105 shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'border-gray-800 opacity-60 hover:opacity-100'}`}
                                            >
                                                <AsyncImage src={ambassador.imageUrl} className="w-full h-full object-cover" />
                                                {activeAmbassadorId === ambassador.id && lockToAmbassador && (
                                                    <div className="absolute inset-0 bg-[var(--color-gold)]/10 flex items-center justify-center">
                                                        <div className="bg-[var(--color-gold)] text-black text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest">Locked</div>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                        <button 
                                            onClick={() => faceAnchorInputRef.current?.click()}
                                            className="aspect-square rounded-xl border-2 border-dashed border-gray-800 flex flex-col items-center justify-center text-gray-500 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-all bg-black/20"
                                        >
                                            <span className="text-xl mb-1">+</span>
                                            <span className="text-[8px] font-bold uppercase tracking-widest">上傳</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-6">
                                {!isMatrixMode && (
                                    <div className="relative aspect-square bg-black/40 rounded-2xl border border-gray-800 overflow-hidden group">
                                        {originalBaseImage ? (
                                            <AsyncImage src={originalBaseImage.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Model"/>
                                        ) : (
                                            <div onClick={() => fileInputRef.current?.click()} className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-center p-8 group">
                                                <div className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-4 group-hover:border-[var(--color-gold)] group-hover:bg-[var(--color-gold)]/5 transition-all duration-500">
                                                    <PhotoIcon className="w-8 h-8 text-gray-600 group-hover:text-[var(--color-gold)] transition-colors" />
                                                </div>
                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] group-hover:text-gray-300 transition-colors">上傳人物照片 (作為主角錨點)</span>
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3 w-20 h-20 bg-black border border-[var(--color-gold)]/50 rounded-xl shadow-2xl overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-300" onClick={() => faceAnchorInputRef.current?.click()}>
                                            {faceAnchor ? <AsyncImage src={faceAnchor.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[9px] text-[var(--color-gold)] text-center p-2 font-bold uppercase tracking-widest leading-tight">臉部<br/>鎖定</div>}
                                        </div>
                                    </div>
                                )}
                                <div className="mt-4">
                                    <label className="block text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-[0.2em]">
                                        <span>主角性別鎖定</span>
                                        <span className="block text-[8px] opacity-70 font-normal tracking-normal">Subject Gender Lock</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <button onClick={() => setGender('female')} className={`py-3 text-[10px] font-bold uppercase tracking-[0.2em] rounded-lg border transition-all duration-300 ${gender === 'female' ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)] shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-600'}`}>女性 (Female)</button>
                                        <button onClick={() => setGender('male')} className={`py-3 text-[10px] font-bold uppercase tracking-[0.2em] rounded-lg border transition-all duration-300 ${gender === 'male' ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)] shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-600'}`}>男性 (Male)</button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-[0.2em] min-h-[32px] flex flex-col justify-end">
                                                <span>光影硬度</span>
                                                <span className="block text-[8px] opacity-70 font-normal tracking-normal">Light Hardness</span>
                                            </label>
                                            <select 
                                                value={physics.lightHardness} 
                                                onChange={e => setPhysics(prev => ({ ...prev, lightHardness: e.target.value as any }))} 
                                                className="w-full bg-black/40 border border-gray-800 text-xs rounded-lg py-3 px-3 focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/20 outline-none transition-all text-gray-300"
                                            >
                                                <option value="balanced">標準平衡 (Balanced)</option>
                                                <option value="soft">柔和擴散 (Soft/Diffused)</option>
                                                <option value="ultra_soft">極致柔焦 (Ultra Soft/Glow)</option>
                                                <option value="hard">硬朗直射 (Hard/Direct)</option>
                                                <option value="chiaroscuro">強烈明暗 (Chiaroscuro)</option>
                                                <option value="rim_only">僅輪廓光 (Rim Only)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-[0.2em] min-h-[32px] flex flex-col justify-end">
                                                <span>色溫偏好</span>
                                                <span className="block text-[8px] opacity-70 font-normal tracking-normal">Color Temp</span>
                                            </label>
                                            <select 
                                                value={physics.colorTemperature} 
                                                onChange={e => setPhysics(prev => ({ ...prev, colorTemperature: e.target.value as any }))} 
                                                className="w-full bg-black/40 border border-gray-800 text-xs rounded-lg py-3 px-3 focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/20 outline-none transition-all text-gray-300"
                                            >
                                                <option value="neutral">中性自然 (Neutral)</option>
                                                <option value="warm">溫暖金黃 (Warm/Amber)</option>
                                                <option value="golden_hour">黃金時段 (Golden Hour)</option>
                                                <option value="cool">冷冽清透 (Cool/Blue)</option>
                                                <option value="teal_orange">電影青橙 (Teal & Orange)</option>
                                                <option value="neon_cyber">賽博霓虹 (Cyber Neon)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-[0.2em] min-h-[32px] flex flex-col justify-end">
                                                <span>鏡頭焦段</span>
                                                <span className="block text-[8px] opacity-70 font-normal tracking-normal">Lens Focal Length</span>
                                            </label>
                                            <select 
                                                value={physics.lensFocalLength} 
                                                onChange={e => setPhysics(prev => ({ ...prev, lensFocalLength: e.target.value as any }))} 
                                                className="w-full bg-black/40 border border-gray-800 text-xs rounded-lg py-3 px-3 focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/20 outline-none transition-all text-gray-300"
                                            >
                                                <option value="14mm">14mm 超廣角 (Ultra Wide)</option>
                                                <option value="24mm">24mm 廣角 (Wide Angle)</option>
                                                <option value="35mm">35mm 人文 (Street)</option>
                                                <option value="50mm">50mm 標準 (Standard)</option>
                                                <option value="85mm">85mm 人像 (Portrait)</option>
                                                <option value="135mm">135mm 望遠 (Telephoto)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5 pt-1">
                                            <Slider 
                                                label={
                                                    <div className="min-h-[32px] flex flex-col justify-end">
                                                        <span>景深強度</span>
                                                        <span className="block text-[8px] opacity-70 font-normal tracking-normal">DoF Intensity</span>
                                                    </div>
                                                } 
                                                min={0} 
                                                max={100} 
                                                value={physics.dofIntensity || 50} 
                                                onChange={e => setPhysics(prev => ({ ...prev, dofIntensity: Number(e.target.value) }))} 
                                                unit="%" 
                                            />
                                        </div>
                                    </div>

                                    {/* 快速風格預設 (Presets) - Moved here */}
                                    <div className="pt-4 border-t border-gray-800/50">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-3 block">
                                            <span>快速風格預設</span>
                                            <span className="block text-[8px] opacity-70 font-normal tracking-normal">Presets</span>
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {PRESETS.map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => applyPreset(p)}
                                                    className="flex items-center gap-3 p-4 bg-black/40 border border-gray-800 rounded-xl hover:border-[var(--color-gold)] hover:bg-[var(--color-gold)]/5 transition-all group relative overflow-hidden"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-gold)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                    <span className="text-2xl group-hover:scale-110 transition-transform relative z-10">{p.icon}</span>
                                                    <div className="text-left relative z-10">
                                                        <p className="text-[13px] font-bold text-gray-300 group-hover:text-[var(--color-gold)] transition-colors">{p.name}</p>
                                                        <p className="text-[9px] text-gray-600 uppercase tracking-tighter">Apply Settings</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                    {/* 2. 場景、姿勢與表情 */}
                    <Card className="p-0 overflow-hidden border-gray-800/50 hover:border-[var(--color-gold)]/30 transition-all duration-500">
                        <div 
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleSection('background')}
                            onKeyDown={(e) => e.key === 'Enter' && toggleSection('background')}
                            className={`w-full flex justify-between items-center p-5 cursor-pointer transition-all duration-500 ${openSections.has('background') ? 'bg-[var(--color-gold)]/5 text-black' : 'bg-transparent text-gray-400 hover:bg-white/5'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all duration-500 ${openSections.has('background') ? 'bg-[var(--color-gold)] border-[var(--color-gold)] text-black' : 'bg-gray-900 border-gray-800 text-gray-500'}`}>
                                    <SceneTransferIcon className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h3 className={`text-sm font-bold tracking-[0.15em] uppercase ${openSections.has('background') ? 'text-[var(--color-gold)]' : 'text-gray-300'}`}>
                                        02. 場景、姿勢與表情
                                    </h3>
                                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">Environment & Pose</p>
                                </div>
                            </div>
                            <span className={`transition-transform duration-500 ${openSections.has('background') ? 'rotate-180 text-[var(--color-gold)]' : 'text-gray-600'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </div>

                        <div className={`collapsible-content ${openSections.has('background') ? 'open p-6' : ''}`}>
                            <div className="flex justify-end mb-4">
                                <button onClick={handleRandomize} className="p-1.5 rounded-full bg-[var(--color-bg-input)] border border-[var(--color-gold)]/40 text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-black transition-all duration-300" title="隨機生成場景配置"><DiceIcon className="w-4 h-4" /></button>
                            </div>
                            <div className="space-y-5">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-[0.2em] min-h-[32px] flex flex-col justify-end">
                                            <span>背景環境</span>
                                            <span className="block text-[8px] opacity-70 font-normal tracking-normal">Background</span>
                                        </label>
                                        {backgroundImage ? (
                                            <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-800 mb-3 bg-black group">
                                                <AsyncImage src={backgroundImage.url} className="w-full h-full object-contain" />
                                                <button onClick={() => { setBackgroundImage(null); setBackgroundCategory(''); }} className="absolute top-2 right-2 bg-black/60 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">&times;</button>
                                            </div>
                                        ) : (
                                            <Button onClick={() => backgroundFileInputRef.current?.click()} variant="secondary" className="w-full text-[10px] font-bold tracking-widest border-gray-800 hover:border-[var(--color-gold)] py-3">上傳自定義背景參考圖</Button>
                                        )}
                                        <select 
                                            value={background} 
                                            onChange={e => handleBackgroundChange(e.target.value)} 
                                            className="w-full bg-black/40 border border-gray-800 text-xs p-3.5 rounded-lg mt-3 outline-none focus:border-[var(--color-gold)] transition-all text-gray-300"
                                        >
                                            <option value="">-- 選擇官方預設場景 --</option>
                                            {BACKGROUND_PRESETS.map(cat => (
                                                <optgroup label={cat.category} key={cat.category}>
                                                    {cat.items.map(item => <option key={item.id} value={item.keyword}>{item.name} {item.perspective}</option>)}
                                                </optgroup>
                                            ))}
                                            <option value="custom_manual" className="font-bold text-[var(--color-gold)]">✨ 自訂場景描述 (純文字手寫)</option>
                                        </select>
                                    </div>
                                <div className="animate-fade-in">
                                    <label className={`block text-[10px] font-bold uppercase tracking-[0.2em] mb-2 transition-colors duration-300 min-h-[32px] flex flex-col justify-end ${background === 'custom_manual' ? 'text-[var(--color-gold)]' : 'text-gray-500'}`}>
                                        <div className="flex items-center">
                                            <span>場景細節補充</span>
                                            {background === 'custom_manual' ? <span className="text-red-500 ml-1 text-[8px]">(必填)</span> : <span className="opacity-50 ml-1 text-[8px]">(選填推薦)</span>}
                                        </div>
                                        <span className="block text-[8px] opacity-70 font-normal tracking-normal">Background Supplement</span>
                                    </label>
                                    <textarea value={backgroundSupplement} onChange={e => setBackgroundSupplement(e.target.value)} placeholder={background === 'custom_manual' ? "請詳細描述您想像中的場景..." : "可在預設背景基礎上，增加細節補充..."} className={`w-full bg-black/40 border rounded-xl p-4 text-xs text-gray-300 focus:outline-none transition-all h-32 leading-relaxed ${background === 'custom_manual' ? 'border-[var(--color-gold)] shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'border-gray-800 focus:border-[var(--color-gold)]'}`} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Select label={
                                        <div className="min-h-[32px] flex flex-col justify-end">
                                            <span>環境時間</span>
                                            <span className="block text-[8px] opacity-70 font-normal tracking-normal">Time</span>
                                        </div>
                                    } options={TIME_OPTIONS} value={physics.time} onChange={e => setPhysics(p => ({...p, time: e.target.value as SceneTimeSlot}))} />
                                    <Select label={
                                        <div className="min-h-[32px] flex flex-col justify-end">
                                            <span>天氣物理</span>
                                            <span className="block text-[8px] opacity-70 font-normal tracking-normal">Weather</span>
                                        </div>
                                    } options={WEATHER_OPTIONS} value={physics.weather} onChange={e => setPhysics(p => ({...p, weather: e.target.value as SceneWeatherType, intensity: WEATHER_INTENSITIES[e.target.value]?.[1] || '標準'}))} />
                                </div>

                                {physics.weather !== 'auto' && WEATHER_INTENSITIES[physics.weather] && (
                                    <div className="p-3 bg-black/40 rounded-xl border border-gray-800/50">
                                        <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-[0.2em]">
                                            <span>天氣強度</span>
                                            <span className="block text-[8px] opacity-70 font-normal tracking-normal">Weather Intensity</span>
                                        </label>
                                        <div className="flex gap-2">
                                            {WEATHER_INTENSITIES[physics.weather].map(level => (
                                                <button key={level} onClick={() => setPhysics(p => ({...p, intensity: level}))} className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${physics.intensity === level ? 'bg-[var(--color-gold)] text-black' : 'bg-gray-900 text-gray-500 hover:bg-gray-800'}`}>{level}</button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 items-end">
                                    <div className="pt-1">
                                        <Slider label={
                                            <div className="min-h-[32px] flex flex-col justify-end">
                                                <span>陰影強度</span>
                                                <span className="block text-[8px] opacity-70 font-normal tracking-normal">Shadow Intensity</span>
                                            </div>
                                        } min={0} max={100} value={physics.shadowIntensity} onChange={e => setPhysics(p => ({...p, shadowIntensity: Number(e.target.value)}))} unit="%" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-[0.2em] flex flex-col justify-end min-h-[32px]">
                                            <div className="flex items-center gap-2">
                                                <ExpandIcon className="w-3 h-3 mb-0.5" />
                                                <span>鏡頭構圖</span>
                                            </div>
                                            <span className="block text-[8px] opacity-70 font-normal tracking-normal">Framing</span>
                                        </label>
                                        <select value={framing} onChange={e => setFraming(e.target.value)} className="w-full bg-black/40 border border-gray-800 text-xs rounded-lg py-3 px-3 focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/20 outline-none transition-all text-gray-300">
                                            <option value="">-- 預設 (依場景建議) --</option>
                                            {FRAMING_PRESETS.map(cat => (
                                                <optgroup label={cat.category} key={cat.category}>
                                                    {cat.items.map(item => <option key={item.id} value={item.keyword}>{item.name}</option>)}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {framing.toLowerCase().includes('selfie') && (
                                    <div className="p-4 bg-[var(--color-gold)]/5 rounded-xl border border-[var(--color-gold)]/10 animate-fade-in space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                                                    <span>自拍鏡頭類型</span>
                                                    <span className="block text-[8px] opacity-70 font-normal tracking-normal">Camera Type</span>
                                                </label>
                                                <div className="flex gap-2">
                                                    {[
                                                        { id: 'front', name: '前置', en: 'Front' },
                                                        { id: 'rear', name: '後置', en: 'Rear' }
                                                    ].map(type => (
                                                        <button 
                                                            key={type.id}
                                                            onClick={() => setPhysics(p => ({...p, selfieCameraType: type.id as 'front' | 'rear'}))}
                                                            className={`flex-1 py-2 rounded-lg border transition-all duration-300 flex flex-col items-center justify-center gap-0.5 ${
                                                                (physics.selfieCameraType || 'front') === type.id 
                                                                ? 'bg-[var(--color-gold)]/20 border-[var(--color-gold)] text-[var(--color-gold)]' 
                                                                : 'bg-black/20 border-gray-800 text-gray-500 hover:border-gray-700'
                                                            }`}
                                                        >
                                                            <span className="text-[10px] font-bold">{type.name}</span>
                                                            <span className="text-[7px] opacity-60 uppercase tracking-tighter">{type.en}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                                                    <span>自拍角度</span>
                                                    <span className="block text-[8px] opacity-70 font-normal tracking-normal">Angle</span>
                                                </label>
                                                <div className="flex gap-1.5">
                                                    {[
                                                        { id: 'high', name: '俯拍', en: 'High' },
                                                        { id: 'eye', name: '平視', en: 'Eye' },
                                                        { id: 'low', name: '仰拍', en: 'Low' }
                                                    ].map(angle => (
                                                        <button 
                                                            key={angle.id}
                                                            onClick={() => setPhysics(p => ({...p, selfieAngle: angle.id as 'high' | 'eye' | 'low'}))}
                                                            className={`flex-1 py-2 rounded-lg border transition-all duration-300 flex flex-col items-center justify-center gap-0.5 ${
                                                                (physics.selfieAngle || 'eye') === angle.id 
                                                                ? 'bg-[var(--color-gold)]/20 border-[var(--color-gold)] text-[var(--color-gold)]' 
                                                                : 'bg-black/20 border-gray-800 text-gray-500 hover:border-gray-700'
                                                            }`}
                                                        >
                                                            <span className="text-[10px] font-bold">{angle.name}</span>
                                                            <span className="text-[7px] opacity-60 uppercase tracking-tighter">{angle.en}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <Slider 
                                            label={
                                                <div className="min-h-[32px] flex flex-col justify-end">
                                                    <span>生活感強度</span>
                                                    <span className="block text-[8px] opacity-70 font-normal tracking-normal">Lifestyle Intensity</span>
                                                </div>
                                            } 
                                            min={0} 
                                            max={100} 
                                            value={physics.ugcIntensity || 50} 
                                            onChange={e => setPhysics(p => ({...p, ugcIntensity: Number(e.target.value)}))} 
                                            unit="%" 
                                        />
                                        <p className="text-[9px] text-gray-500 mt-2 font-medium">
                                            {physics.ugcIntensity! > 70 ? "✨ 高強度：隨性背景、明顯噪點，極致真實 UGC 質感。" : 
                                             physics.ugcIntensity! > 30 ? "✨ 中強度：自然光影、輕微噪點，平衡品牌感與真實感。" : 
                                             "✨ 低強度：乾淨畫面、精緻光影，適合高端品牌形象。"}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] min-h-[32px] flex flex-col justify-end">
                                                <span>姿勢</span>
                                                <span className="block text-[8px] opacity-70 font-normal tracking-normal">Pose</span>
                                            </label>
                                        </div>
                                        <select value={pose} onChange={e => { setPose(e.target.value); setSupermodelPose(null); }} className="w-full bg-black/40 border border-gray-800 text-xs rounded-lg py-3 px-3 focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/20 outline-none transition-all text-gray-300">
                                            <option value="">-- 請選擇姿勢 --</option>
                                            {Object.entries(filteredGroupedPoses).map(([category, items]) => (
                                                <optgroup label={category} key={category}>
                                                    {(items as any[]).map(item => <option key={item.id} value={item.keyword}>{item.name}</option>)}
                                                </optgroup>
                                            ))}
                                        </select>
                                        {supermodelPose && (
                                            <div className="mt-2 p-2 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded-lg flex justify-between items-center">
                                                <span className="text-[9px] text-[var(--color-gold)] font-bold tracking-widest">已套用：超模姿態</span>
                                                <button onClick={() => setSupermodelPose(null)} className="text-[9px] text-red-400 font-bold">取消</button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-[0.2em] min-h-[32px] flex flex-col justify-end">
                                            <span>表情</span>
                                            <span className="block text-[8px] opacity-70 font-normal tracking-normal">Expression</span>
                                        </label>
                                        <select value={expression} onChange={e => setExpression(e.target.value)} className="w-full bg-black/40 border border-gray-800 text-xs rounded-lg py-3 px-3 focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/20 outline-none transition-all text-gray-300">
                                            <option value="">-- 請選擇表情 --</option>
                                            {Object.entries(filteredGroupedExpressions).map(([category, items]) => (
                                                <optgroup label={category} key={category}>
                                                    {(items as any[]).map(item => <option key={item.id} value={item.keyword}>{item.name}</option>)}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {supermodelPose && (
                                    <div className="p-4 bg-[var(--color-gold)]/5 rounded-xl border border-[var(--color-gold)]/10 animate-fade-in">
                                        <Slider 
                                            label="姿態強度 (Pose Intensity)" 
                                            min={0} 
                                            max={100} 
                                            value={poseIntensity} 
                                            onChange={e => setPoseIntensity(Number(e.target.value))} 
                                            unit="%" 
                                        />
                                        <p className="text-[9px] text-gray-500 mt-2 font-medium">
                                            {poseIntensity > 70 ? "✨ 高強度：完全重塑骨架，展現極致張力。" : 
                                             poseIntensity > 30 ? "✨ 中強度：平衡原始特徵與專業姿態。" : 
                                             "✨ 低強度：僅微調肢體角度，保持自然感。"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* 3. 渲染品質與比例 */}
                    <Card className="p-0 overflow-hidden border-gray-800/50 hover:border-[var(--color-gold)]/30 transition-all duration-500">
                        <div 
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleSection('settings')}
                            onKeyDown={(e) => e.key === 'Enter' && toggleSection('settings')}
                            className={`w-full flex justify-between items-center p-5 cursor-pointer transition-all duration-500 ${openSections.has('settings') ? 'bg-[var(--color-gold)]/5 text-black' : 'bg-transparent text-gray-400 hover:bg-white/5'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all duration-500 ${openSections.has('settings') ? 'bg-[var(--color-gold)] border-[var(--color-gold)] text-black' : 'bg-gray-900 border-gray-800 text-gray-500'}`}>
                                    <TuneIcon className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h3 className={`text-sm font-bold tracking-[0.15em] uppercase ${openSections.has('settings') ? 'text-[var(--color-gold)]' : 'text-gray-300'}`}>
                                        03. 渲染品質與比例
                                    </h3>
                                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">Quality & Aspect Ratio</p>
                                </div>
                            </div>
                            <span className={`transition-transform duration-500 ${openSections.has('settings') ? 'rotate-180 text-[var(--color-gold)]' : 'text-gray-600'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </div>

                        <div className={`collapsible-content ${openSections.has('settings') ? 'open p-6' : ''}`}>
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <Select label={
                                        <div className="min-h-[32px] flex flex-col justify-end">
                                            <span>渲染品質</span>
                                            <span className="block text-[8px] opacity-70 font-normal tracking-normal">Quality</span>
                                        </div>
                                    } options={[
                                        { value: 'standard', label: '標準 (Standard)' },
                                        { value: 'high', label: '高清 (HD)' },
                                        { value: 'ultra', label: '極致 (4K Ultra)' }
                                    ]} value={quality} onChange={e => setQuality(e.target.value as QualityLevel)} />
                                    <Select label={
                                        <div className="min-h-[32px] flex flex-col justify-end">
                                            <span>畫幅比例</span>
                                            <span className="block text-[8px] opacity-70 font-normal tracking-normal">Aspect Ratio</span>
                                        </div>
                                    } options={[
                                        { value: '9:16', label: '9:16 (手機直式)' },
                                        { value: '3:4', label: '3:4 (社群貼文)' },
                                        { value: '1:1', label: '1:1 (正方形)' },
                                        { value: '4:3', label: '4:3 (傳統螢幕)' },
                                        { value: '16:9', label: '16:9 (寬螢幕)' }
                                    ]} value={aspectRatio} onChange={e => setAspectRatio(e.target.value as AspectRatio)} />
                                </div>
                                <div className="pt-2">
                                    <div className="flex items-center justify-between p-3 bg-black/40 border border-gray-800 rounded-xl">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">多角度生成</span>
                                            <span className="text-[8px] text-gray-500 uppercase">Multi-angle Generation</span>
                                        </div>
                                        <button 
                                            onClick={() => setIsMultiAngleGen(!isMultiAngleGen)}
                                            className={`w-10 h-5 rounded-full relative transition-colors ${isMultiAngleGen ? 'bg-[var(--color-gold)]' : 'bg-gray-700'}`}
                                        >
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isMultiAngleGen ? 'right-1' : 'left-1'}`}></div>
                                        </button>
                                    </div>
                                    {isMultiAngleGen && (
                                        <p className="text-[8px] text-[var(--color-gold)] mt-2 italic opacity-80">
                                            * 啟用後將生成相同背景/姿勢/表情，但不同角度的一組圖片。
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Button onClick={handleGenerate} isLoading={isLoading} disabled={!originalBaseImage} className="w-full text-xl py-5 shadow-2xl tracking-widest uppercase btn-primary">
                        <SparklesIcon className="w-6 h-6 mr-2" /> 執行場景融合
                    </Button>
                </div>

                {/* 右側：結果預覽與核心控制列 */}
                <div className="lg:col-span-8">
                    <Card className="h-full min-h-[85vh] flex flex-col p-0 overflow-hidden">
                        <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)] flex justify-between items-center">
                            <span className="text-[10px] font-mono text-[var(--color-text-dim)] bg-[var(--color-bg-deep)]/40 px-3 py-1 rounded-full border border-[var(--color-border)] uppercase tracking-widest">Pavora Engine // Identity Lock</span>
                            <h3 className="text-xl font-bold tracking-[0.2em] uppercase text-[var(--color-text-title)]">Preview // 預覽結果</h3>
                        </div>
                        <div className="flex-grow bg-black flex items-center justify-center relative overflow-hidden">
                            {error && (
                                <div className="absolute top-4 left-4 right-4 z-50 p-4 bg-red-500/90 backdrop-blur-md border border-red-500/20 rounded-xl flex items-center gap-3 text-white animate-shake shadow-2xl">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    <span className="text-sm font-bold tracking-wider">{error}</span>
                                    <button onClick={() => setError(null)} className="ml-auto hover:scale-110 transition-transform">✕</button>
                                </div>
                            )}
                            
                            {isMultiAngleGen ? (
                                <div className="w-full h-full p-4 overflow-y-auto custom-scrollbar">
                                    <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
                                        {MODEL_ANGLES.map(angle => {
                                            const result = multiAngleResults[angle.id];
                                            const isSelected = selectedResults.has(angle.id);
                                            return (
                                                <div 
                                                    key={angle.id} 
                                                    className={`relative aspect-[9/16] bg-white/5 rounded-xl border transition-all duration-300 overflow-hidden group cursor-pointer ${isSelected ? 'border-[var(--color-gold)] ring-2 ring-[var(--color-gold)]/30' : 'border-white/10'}`}
                                                    onClick={() => result && toggleResultSelection(angle.id)}
                                                >
                                                    {result ? (
                                                        <img 
                                                            src={result} 
                                                            className={`w-full h-full object-cover transition-transform duration-300 ${isRegenerating === angle.id ? 'opacity-50 grayscale' : ''} ${isSelected ? 'scale-105' : 'group-hover:scale-110'}`} 
                                                            alt={angle.label}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-700">
                                                            <PhotoIcon className="w-12 h-12 mb-2 opacity-10" />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-20">{angle.label}</span>
                                                            <span className="text-[8px] uppercase tracking-widest opacity-10 mt-1">Waiting for generation</span>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Selection Overlay Checkbox */}
                                                    {result && (
                                                        <div className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all z-20 ${isSelected ? 'bg-[var(--color-gold)] border-[var(--color-gold)] text-black' : 'bg-black/40 border-white/30 text-transparent'}`}>
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                        </div>
                                                    )}

                                                    {isRegenerating === angle.id && (
                                                        <div className="absolute inset-0 flex items-center justify-center z-20">
                                                            <Loader className="w-8 h-8 text-[var(--color-gold)]" />
                                                        </div>
                                                    )}
                                                    <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded text-[9px] font-bold text-white uppercase tracking-widest z-10">
                                                        {angle.label}
                                                    </div>
                                                    {result && !isRegenerating && (
                                                        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleRegenerateAngle(angle.id); }}
                                                                className="p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full hover:bg-[var(--color-gold)] hover:text-black transition-all"
                                                                title="重新生成此角度"
                                                            >
                                                                <ReplaceIcon className="w-3 h-3" />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setPreviewingImage(result); }}
                                                                className="p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full hover:bg-[var(--color-gold)] hover:text-black transition-all"
                                                                title="放大預覽"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" /></svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : beforeImage && currentImage ? (
                                <ImageCompareSlider beforeImage={beforeImage} afterImage={currentImage} />
                            ) : currentImage ? (
                                <img src={currentImage} className="max-h-full max-w-full object-contain transition-all duration-700" alt="Result" />
                            ) : (
                                <div className="text-center opacity-20">
                                    <SceneTransferIcon className="w-40 h-40 mx-auto mb-4" />
                                    <p className="text-xl font-display uppercase tracking-widest italic text-white">Character Standby</p>
                                </div>
                            )}
                        </div>
                        
                        {/* 專業影像控制面板 - 修復版 (UI/UX Revision) */}
                        <div className="p-4 bg-[var(--color-bg-panel)] border-t border-[var(--color-border)] flex flex-col gap-5">
                            {/* 第一列：主要操作與歷史 (Primary Logic Row) */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                {/* 歷史紀錄 (左側) */}
                                <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 shrink-0 shadow-inner">
                                    <Button 
                                        onClick={undo} 
                                        disabled={!canUndo} 
                                        variant="secondary" 
                                        className="px-4 h-10 border-transparent hover:bg-white/5 disabled:opacity-20 transition-all whitespace-nowrap"
                                    >
                                        <ChevronLeftIcon className="w-4 h-4 mr-1.5" /> <span className="text-[10px] font-bold tracking-widest">UNDO</span>
                                    </Button>
                                    <div className="w-[1px] h-4 bg-white/15 mx-1"></div>
                                    <Button 
                                        onClick={redo} 
                                        disabled={!canRedo} 
                                        variant="secondary" 
                                        className="px-4 h-10 border-transparent hover:bg-white/5 disabled:opacity-20 transition-all whitespace-nowrap"
                                    >
                                        <span className="text-[10px] font-bold tracking-widest">REDO</span> <ChevronRightIcon className="w-4 h-4 ml-1.5" />
                                    </Button>
                                </div>

                                {/* 核心修復與流程工具 (中央) */}
                                <div className="flex items-center gap-3">
                                    {(currentImage || originalBaseImage) && (
                                        <Button 
                                            onClick={() => setIsPrecisionMode(true)} 
                                            variant="secondary" 
                                            className="h-10 px-6 text-[var(--color-gold)] border-[var(--color-gold)]/30 font-bold flex items-center gap-2.5 bg-[var(--color-gold)]/5 hover:bg-[var(--color-gold)]/15 shadow-[0_0_20px_rgba(212,175,55,0.08)] transition-all group whitespace-nowrap"
                                        >
                                            <TuneIcon className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" /> 
                                            <span className="tracking-[0.15em] uppercase text-[11px]">局部細節修正</span>
                                        </Button>
                                    )}
                                    {currentImage && (
                                        <Button 
                                            onClick={() => onContinueEditing(currentImage, 'fitting')} 
                                            variant="secondary" 
                                            className="h-10 px-6 border-white/10 hover:border-[var(--color-gold)]/40 text-gray-400 hover:text-white transition-all group whitespace-nowrap"
                                        >
                                            <ReplaceIcon className="w-4 h-4 mr-2.5 group-hover:rotate-12 transition-transform" /> 
                                            <span className="text-[11px] font-bold tracking-[0.15em] uppercase">繼續試衣流程</span>
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* 第二列：輸出與導出工具 (Export Row) */}
                            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-white/5">
                                {currentImage && (
                                    <div className="flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-end">
                                        <Button 
                                            onClick={() => setPreviewingImage(currentImage)} 
                                            variant="secondary"
                                            className="h-10 px-5 text-[11px] font-bold tracking-[0.2em] border-white/10 hover:border-white/30 whitespace-nowrap uppercase"
                                        >
                                            全螢幕預覽
                                        </Button>
                                        
                                        <div className="flex h-11 bg-black/50 rounded-xl border border-white/15 overflow-hidden shadow-2xl group/btn">
                                            {isMultiAngleGen && (
                                                <Button 
                                                    onClick={handleDownloadAll} 
                                                    variant="secondary"
                                                    className="h-full px-6 text-[11px] font-bold tracking-[0.2em] border-none hover:bg-white/10 rounded-none transition-colors border-r border-white/10 whitespace-nowrap uppercase"
                                                >
                                                    下載全部 (ALL)
                                                </Button>
                                            )}
                                            <Button 
                                                onClick={handleDownloadSelected} 
                                                variant="light"
                                                className="h-full px-8 text-[11px] font-bold tracking-[0.2em] rounded-none shadow-gold hover:brightness-110 transition-all whitespace-nowrap uppercase"
                                            >
                                                {isMultiAngleGen && selectedResults.size > 0 
                                                    ? `匯出選中 (${selectedResults.size})` 
                                                    : isMultiAngleGen ? '下載當前圖片' : '下載結果 (EXPORT)'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SceneGeneration;
