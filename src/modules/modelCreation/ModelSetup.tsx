
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { Model, OutfitPreset } from '../../shared/types/types';
import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
import Select from '../../shared/components/common/Select';
import Loader from '../../shared/components/common/Loader';
import { generateModels } from './services/modelCreationService';
import { generatePersonaTraits } from './services/personaService';
import { getFriendlyErrorMessage, fileToBase64 } from '../../shared/services/geminiService';
import { downloadImage, imageUrlToimageData } from '../../shared/utils/imageUtils';
import PhotoIcon from '../../shared/assets/icons/PhotoIcon';
import ImagePreviewModal from '../../shared/components/common/ImagePreviewModal';
import { useModelStore } from '../../shared/stores/useModelStore';
import { useBrandStore } from '../../shared/stores/useBrandStore';
import AsyncImage from '../../shared/components/common/AsyncImage';
import DownloadIcon from '../../shared/assets/icons/DownloadIcon';
import ModelIcon from '../../shared/assets/icons/ModelIcon';
import View360Icon from '../../shared/assets/icons/View360Icon';
import ExpandIcon from '../../shared/assets/icons/ExpandIcon';
import { useNotification } from '../../shared/context/NotificationContext';
import { useAppStore } from '../../shared/stores/useAppStore';
import { embedMetadata } from '../../shared/utils/metadataUtils';
import { motion, AnimatePresence } from 'motion/react';
import { 
    GENDER_PRESETS, APPAREL_CATEGORIES, APPAREL_ITEMS,
    FACE_ARCHETYPES, SKIN_TONE_OPTIONS, SKIN_FINISH_OPTIONS, MAKEUP_STYLE_OPTIONS,
    PROPORTION_MODE_OPTIONS, PROPORTION_DEFAULTS,
    FEMALE_HAIR_LENGTH_OPTIONS, FEMALE_HAIR_STYLE_OPTIONS, FEMALE_HAIR_BANG_OPTIONS,
    MALE_HAIR_LENGTH_OPTIONS, MALE_HAIR_STYLE_OPTIONS, MALE_HAIR_BANG_OPTIONS,
    AESTHETIC_STYLES, SMART_SUGGEST_PRESETS, ModelGenerationDefaults,
    LIGHTING_PRESETS, EYE_SHAPE_OPTIONS, BRAND_STYLE_ANCHORS,
    MBTI_OPTIONS, TAIWAN_COUNTIES, INTEREST_OPTIONS, TONE_OPTIONS, POSTING_HABITS,
    TAIWAN_DISTRICT_DATA, TAIWAN_LOCATION_GROUPED_OPTIONS, CORE_VIBE_OPTIONS, IP_NAME_POOL,
    STYLE_ARCHETYPES
} from '../../shared/constants/constants';

import { useTaxonomy } from '../../shared/hooks/useTaxonomy';
import DeepApparelSelector from '../../shared/components/business/DeepApparelSelector';
import Slider from '../../shared/components/common/Slider';

const DESTINATIONS = [
    { key: 'fitting_room', label: '虛擬試衣間 (Fitting Room)' },
    { key: 'scene', label: '場景轉移 (Scene Swap)' },
    { key: 'composite_card', label: '模特兒合輯卡 (Model Composite)' },
    { key: 'salon', label: '髮型沙龍 (Hair Salon)' },
];

interface ModelSetupProps {
  onModelSelect: (model: Model, destination: string) => void;
  onGoBack: () => void;
  onGoHome: () => void;
  inheritedModel?: Model | null;
  initialNarrativeData?: { model: Model; diary: any } | null;
  onClearNarrative?: () => void;
}

type QualityLevel = 'standard' | 'high' | 'ultra';

const ModelSetup: React.FC<ModelSetupProps> = ({ 
    onModelSelect, onGoHome, onGoBack, 
    inheritedModel, initialNarrativeData, onClearNarrative 
}) => {
  const { projectMode } = useAppStore();
  const { masterTaxonomy, apparelStructure, loading: taxonomyLoading } = useTaxonomy();

  const [generatedModels, setGeneratedModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewingModelIndex, setPreviewingModelIndex] = useState<number | null>(null);
  
  const { addModel, updateModelGallery } = useModelStore();
  const { addAmbassador, ambassadors, activeAmbassadorId } = useBrandStore();
  const { addNotification } = useNotification();
  const activeAmbassador = useMemo(() => ambassadors.find(a => a.id === activeAmbassadorId), [ambassadors, activeAmbassadorId]);

  const [formState, setFormState] = useState({
      ...ModelGenerationDefaults,
      name: '',
      netRedLevel: 2,
      customOutfitPrompt: '',
      lockToAmbassador: false,
      persona: {
          coreVibe: '優雅時尚',
          mbti: '',
          profession: '',
          catchphrase: '',
          postingHabit: '',
          toneOfVoice: '',
          locked_descriptor: ''
      },
      lifeCircuit: {
          primaryCity: '台北市',
          primaryDistrict: '大安區',
          interests: [] as string[]
      },
      preferredArchetypes: [] as string[],
      fidelityScale: 3,
      dofIntensity: 50,
      sceneAnchor: 'none'
  });

  const [isGeneratingPersona, setIsGeneratingPersona] = useState(false);
  const [isExpertMode, setIsExpertMode] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState('custom');
  const [faceReferences, setFaceReferences] = useState<File[]>([]);
  const [faceReferencePreviews, setFaceReferencePreviews] = useState<string[]>([]);
  const [highlightedFields, setHighlightedFields] = useState<Set<string>>(new Set());
  const [generationQuality, setGenerationQuality] = useState<QualityLevel>('standard');
  const [mobileTab, setMobileTab] = useState<'settings' | 'preview'>('settings');
  const [activeApparelCat, setActiveApparelCat] = useState('full_set');

  // Safety Matrix for Parameters
  const getSafetyStatus = useCallback((field: string, value: number): 'safe' | 'warning' | 'risky' => {
      if (field === 'bust') {
          if (value > 105) return 'risky';
          if (value > 95) return 'warning';
      }
      if (field === 'bustTension') {
          if (value > 85) return 'risky';
          if (value > 65) return 'warning';
      }
      if (field === 'physiqueCurvature') {
          if (value > 90) return 'risky';
          if (value > 75) return 'warning';
      }
      return 'safe';
  }, []);

  useEffect(() => {
    if (inheritedModel && !initialNarrativeData) {
        setFormState(prev => ({
            ...prev,
            name: inheritedModel.name || prev.name,
            gender: inheritedModel.gender || prev.gender,
            age: inheritedModel.age ? Number(inheritedModel.age) : prev.age,
            persona: {
                ...prev.persona,
                ...inheritedModel.persona
            },
            lifeCircuit: {
                ...prev.lifeCircuit,
                ...inheritedModel.lifeCircuit
            },
            preferredArchetypes: inheritedModel.preferred_archetypes || prev.preferredArchetypes,
            height: inheritedModel.stats?.height ? Number(inheritedModel.stats.height) : prev.height,
            bust: inheritedModel.stats?.bust ? Number(inheritedModel.stats.bust) : prev.bust,
            waist: inheritedModel.stats?.waist ? Number(inheritedModel.stats.waist) : prev.waist,
            hip: inheritedModel.stats?.hip ? Number(inheritedModel.stats.hip) : prev.hip,
            hairColor: inheritedModel.stats?.hair || prev.hairColor,
            eyeShape: inheritedModel.stats?.eyes || prev.eyeShape,
            bustTension: inheritedModel.advancedStats?.bustTension ?? prev.bustTension,
            physiqueCurvature: inheritedModel.advancedStats?.physiqueCurvature ?? prev.physiqueCurvature,
            muscularDensity: inheritedModel.advancedStats?.muscularDensity ?? prev.muscularDensity,
            vTaperScale: inheritedModel.advancedStats?.vTaperScale ?? prev.vTaperScale
        }));
        
        addNotification({
            type: 'info',
            message: '📑 品牌資產繼承成功',
            description: `已載入 ${inheritedModel.name} 的核心身分與比例參數。`
        });
    }
  }, [inheritedModel, initialNarrativeData, addNotification]);

  // Narrative Sync Logic
  useEffect(() => {
    if (initialNarrativeData) {
        const { model, diary } = initialNarrativeData;
        const diaryParams = diary.generatedPromptParams || {};
        
        setFormState(prev => ({
            ...prev,
            name: model.name || prev.name,
            gender: model.gender || 'female',
            persona: model.persona || prev.persona,
            lifeCircuit: model.lifeCircuit || prev.lifeCircuit,
            preferredArchetypes: model.preferred_archetypes || prev.preferredArchetypes,
            lightingPreset: diaryParams.recommendedLighting || prev.lightingPreset,
            customOutfitPrompt: diaryParams.suggestedOutfit ? `Wearing ${diaryParams.suggestedOutfit}` : prev.customOutfitPrompt,
            outfitItems: diaryParams.suggestedOutfit ? [] : prev.outfitItems
        }));
        
        addNotification({
            type: 'success',
            message: '🎬 敘事數據同步成功',
            description: `已載入 ${model.name} 的日記背景與氛圍指令。`
        });
    }
  }, [initialNarrativeData, addNotification]);

  // Prevent environment-specific WebSocket noise from bubbling to UI
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
        const msg = String(event.reason?.message || event.reason || '');
        if (msg.includes('websocket') || msg.includes('WebSocket')) {
            event.preventDefault();
            console.warn("Caught and suppressed environment WebSocket rejection:", msg);
        }
    };
    window.addEventListener('unhandledrejection', handleRejection);
    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, []);

  const handlePersonaUpdate = (field: string, value: any) => {
    setFormState(prev => ({
        ...prev,
        persona: { ...prev.persona, [field]: value }
    }));
  };

  const handleCircuitUpdate = (field: string, value: any) => {
    setFormState(prev => {
        const newCircuit = { ...prev.lifeCircuit, [field]: value };
        if (field === 'primaryCity') {
            const districts = TAIWAN_DISTRICT_DATA[value] || [];
            newCircuit.primaryDistrict = districts[0] || '';
        }
        return { ...prev, lifeCircuit: newCircuit };
    });
    setSelectedPresetId('custom');
  };

  const handleFormChange = (field: string, value: any) => {
    setFormState(prev => {
        let newState = { ...prev, [field]: value };
        
        // 多視角與比例聯動
        if (field === 'isMultiAngle') {
            if (value === true) {
                newState.ratio = '16:9';
            }
        }
        
        return newState;
    });
    
    // 如果修改了關鍵數值，重置預設集顯示
    if (['bust', 'waist', 'hip', 'height', 'proportionMode', 'skinFinish', 'makeupStyle'].includes(field)) {
        setSelectedPresetId('custom');
    }

    setHighlightedFields(prev => {
        const next = new Set(prev);
        next.add(field);
        return next;
    });
  };
  
  const handleAutoGeneratePersona = useCallback(async () => {
    setIsGeneratingPersona(true);
    try {
        const traits = await generatePersonaTraits({
            name: formState.name || '未命名',
            gender: formState.gender,
            coreVibe: formState.persona.coreVibe,
            profession: formState.persona.profession,
            location: `${formState.lifeCircuit.primaryCity}${formState.lifeCircuit.primaryDistrict}`
        });

        setFormState(prev => ({
            ...prev,
            persona: {
                ...prev.persona,
                mbti: traits.mbti || prev.persona.mbti,
                catchphrase: traits.catchphrase || prev.persona.catchphrase,
                postingHabit: traits.postingHabit || prev.persona.postingHabit,
                toneOfVoice: traits.toneOfVoice || prev.persona.toneOfVoice
            },
            lifeCircuit: {
                ...prev.lifeCircuit,
                interests: traits.interests || prev.lifeCircuit.interests
            }
        }));
        addNotification({ type: 'success', message: '✨ IP 人設補完成功' });
    } catch (e) {
        addNotification({ type: 'error', message: '人設生成失敗' });
    } finally { setIsGeneratingPersona(false); }
  }, [formState.name, formState.gender, formState.persona, formState.lifeCircuit, addNotification]);

  const handleRandomize = useCallback(() => {
    // 鎖定當前性別
    const currentGender = formState.gender;
    const isMale = currentGender === 'male';

    // 依性別選取名字
    const namePool = isMale ? IP_NAME_POOL.male : IP_NAME_POOL.female;
    const randomName = namePool[Math.floor(Math.random() * namePool.length)];

    const randomArchetype = FACE_ARCHETYPES[Math.floor(Math.random() * FACE_ARCHETYPES.length)].value;
    const randomStyle = AESTHETIC_STYLES[Math.floor(Math.random() * AESTHETIC_STYLES.length)].value;
    
    const presets = APPAREL_ITEMS.filter(i => i.category === 'full_set' && (i.gender === 'both' || i.gender === currentGender));
    const randomOutfit = [presets[Math.floor(Math.random() * presets.length)].id];

    const randomCity = TAIWAN_COUNTIES[Math.floor(Math.random() * TAIWAN_COUNTIES.length)].value;
    const districts = TAIWAN_DISTRICT_DATA[randomCity] || [];
    const randomDistrict = districts[Math.floor(Math.random() * districts.length)] || '';

    const randomMBTI = MBTI_OPTIONS[Math.floor(Math.random() * MBTI_OPTIONS.length)].value;
    const randomVibe = CORE_VIBE_OPTIONS[Math.floor(Math.random() * CORE_VIBE_OPTIONS.length)].value;
    const randomInterest = INTEREST_OPTIONS[Math.floor(Math.random() * INTEREST_OPTIONS.length)].value;
    const randomTone = TONE_OPTIONS[Math.floor(Math.random() * TONE_OPTIONS.length)].value;
    const randomHabit = POSTING_HABITS[Math.floor(Math.random() * POSTING_HABITS.length)].value;

    const randomState = {
        name: randomName,
        gender: currentGender,
        aestheticStyle: randomStyle,
        archetype: randomArchetype,
        outfitItems: randomOutfit,
        hairColor: ['black', 'brown', 'blonde', 'silver', 'red'][Math.floor(Math.random() * 5)],
        lightingPreset: LIGHTING_PRESETS[Math.floor(Math.random() * LIGHTING_PRESETS.length)].value,
        ...PROPORTION_DEFAULTS[currentGender as 'female' | 'male'].standard,
        lifeCircuit: {
            ...formState.lifeCircuit,
            primaryCity: randomCity,
            primaryDistrict: randomDistrict
        },
        persona: {
            ...formState.persona,
            coreVibe: randomVibe,
            mbti: randomMBTI,
            interests: [randomInterest],
            toneOfVoice: randomTone,
            postingHabit: randomHabit
        }
    };

    setFormState(prev => ({ ...prev, ...randomState }));
    setHighlightedFields(new Set(Object.keys(randomState)));
    
    // 延遲執行 AI 補完以確保基本數據已寫入
    setTimeout(() => {
        handleAutoGeneratePersona();
    }, 200);
    
    addNotification({
        type: 'success',
        message: '✨ 隨機靈感已套用 (含深度人設)',
        description: `已鎖定${isMale ? '男性' : '女性'}性別，並同步產生全套 IP 屬性。`
    });
  }, [formState.gender, addNotification, handleAutoGeneratePersona]);

  useEffect(() => {
    if (highlightedFields.size > 0) {
        const timer = setTimeout(() => { setHighlightedFields(new Set()); }, 1500);
        return () => clearTimeout(timer);
    }
  }, [highlightedFields]);
  
  const getFieldClass = (fieldName: string) => {
    return `transition-all duration-300 ${highlightedFields.has(fieldName) ? 'ring-2 ring-[var(--color-gold)] ring-offset-2 ring-offset-gray-900 rounded-lg p-1' : ''}`;
  };

  const handleFaceReferenceChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
        const newFiles = Array.from(event.target.files) as File[];
        
        // Metadata extraction for Re-import
        const { extractMetadataFromFile } = await import('../../shared/utils/metadataUtils');
        for (const file of newFiles) {
            const meta = await extractMetadataFromFile(file);
            if (meta && (meta.advancedStats || meta.stats)) {
                setFormState(prev => ({
                    ...prev,
                    name: meta.name || prev.name,
                    gender: meta.gender || prev.gender,
                    age: meta.age || prev.age,
                    height: meta.stats?.height || prev.height,
                    bust: meta.stats?.bust || prev.bust,
                    waist: meta.stats?.waist || prev.waist,
                    hip: meta.stats?.hip || prev.hip,
                    bustTension: meta.advancedStats?.bustTension ?? prev.bustTension,
                    physiqueCurvature: meta.advancedStats?.physiqueCurvature ?? prev.physiqueCurvature,
                    muscularDensity: meta.advancedStats?.muscularDensity ?? prev.muscularDensity,
                    vTaperScale: meta.advancedStats?.vTaperScale ?? prev.vTaperScale,
                }));
                addNotification({
                    type: 'success',
                    message: '🧬 偵測到 Pavora 協議',
                    description: `已從圖片內碼還原生理參數與身分數據。`
                });
            }
        }

        const totalFiles = [...faceReferences, ...newFiles].slice(0, 10);
        setFaceReferences(totalFiles);
        faceReferencePreviews.forEach(url => URL.revokeObjectURL(url));
        const newPreviews = totalFiles.map(file => URL.createObjectURL(file));
        setFaceReferencePreviews(newPreviews);
    }
  };

  const removeFaceReference = (index: number) => {
      const newFiles = [...faceReferences];
      newFiles.splice(index, 1);
      setFaceReferences(newFiles);
      const newPreviews = [...faceReferencePreviews];
      URL.revokeObjectURL(newPreviews[index]);
      newPreviews.splice(index, 1);
      setFaceReferencePreviews(newPreviews);
  };

  const filteredFaceArchetypes = useMemo(() => {
    return FACE_ARCHETYPES.filter(a => (a as any).gender === 'both' || (a as any).gender === formState.gender);
  }, [formState.gender]);

  const handleGenderChange = (value: string) => {
    const isMale = value === 'male';
    const presets = APPAREL_ITEMS.filter(i => i.category === 'full_set' && (i.gender === 'both' || i.gender === value));
    const namePool = isMale ? IP_NAME_POOL.male : IP_NAME_POOL.female;
    const randomName = namePool[Math.floor(Math.random() * namePool.length)];

    setFormState(prev => ({
        ...prev,
        name: randomName,
        gender: value,
        outfitItems: [presets[0]?.id || ''],
        archetype: 'standard',
        hairLength: isMale ? 'short' : 'long',
        ...PROPORTION_DEFAULTS[value as 'female' | 'male'].standard
    }));
  };

  const applyBasePreset = (presetKey: string) => {
    setSelectedPresetId(presetKey);
    if (presetKey === 'custom') return;
    
    const preset = (SMART_SUGGEST_PRESETS as any)[presetKey];
    if (preset) {
        setFormState(prev => ({
            ...prev,
            ...preset
        }));
        addNotification({ type: 'success', message: `✨ 已套用 ${presetKey.includes('female') ? '女性' : '男性'} 預設配置，生理參數已同步` });
    }
  };

  const handlePhysiqueChange = (value: string) => {
    const gender = formState.gender as 'female' | 'male';
    const defaults = (PROPORTION_DEFAULTS as any)[gender]?.[value];
    
    setFormState(prev => ({
      ...prev,
      proportionMode: value,
      ...(defaults || {})
    }));
    
    setSelectedPresetId('custom');
  };

  const handleGenerate = useCallback(async () => {
    if (window.innerWidth < 1024) setMobileTab('preview');
    setIsLoading(true); setError(null);
    try {
      const selectedItems = APPAREL_ITEMS.filter(item => formState.outfitItems.includes(item.id));
      const finalFaceRefs = faceReferences.length > 0 ? await Promise.all(faceReferences.map(f => fileToBase64(f))) : undefined;
      
      const models = await generateModels({
        ...formState,
        generationQuality,
        outfitItems: selectedItems,
        faceReferences: finalFaceRefs,
        preferred_archetypes: formState.preferredArchetypes,
      });
      setGeneratedModels(prev => [...models, ...prev]);
    } catch (err) { setError(getFriendlyErrorMessage(err)); } 
    finally { setIsLoading(false); }
  }, [formState, faceReferences, generationQuality]);

  const handleSaveToLounge = async (model: Model) => {
      await addModel(model);
      addNotification({
          type: 'success',
          message: '身份存檔成功',
          description: `模特兒 ${model.name} 的生理參數已同步至雲端。`
      });
  };

  const handleDownload = (model: Model) => {
      // For download, we ensure metadata is embedded
      const { id, name, gender, age, persona, lifeCircuit, stats, advancedStats, type } = model;
      const metadata = { id, name, gender, age, persona, lifeCircuit, stats, advancedStats, type };
      
      const enrichedImageUrl = model.imageUrl.startsWith('data:') 
          ? embedMetadata(model.imageUrl, metadata)
          : model.imageUrl;
      
      downloadImage(enrichedImageUrl, `${name || 'model'}.jpg`, 'ModelSetup');
  };

  return (
    <div className="container mx-auto p-4 lg:p-8 max-w-[110rem] animate-fade-in pb-24 lg:pb-8">
      {isLoading && <Loader message="時空傳送中..." />}
      
      {/* Mobile Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-bg-deep)] border-t border-[var(--color-border)] z-40 flex justify-around p-2 pb-safe">
          <button onClick={() => setMobileTab('settings')} className={`flex flex-col items-center p-2 w-1/2 ${mobileTab === 'settings' ? 'text-[var(--color-gold)] bg-white/5' : 'text-gray-500'}`}>
              <ModelIcon className="w-6 h-6" /><span className="text-[10px] font-bold">參數設定</span>
          </button>
          <button onClick={() => setMobileTab('preview')} className={`flex flex-col items-center p-2 w-1/2 ${mobileTab === 'preview' ? 'text-[var(--color-gold)] bg-white/5' : 'text-gray-500'}`}>
              <View360Icon className="w-6 h-6" /><span className="text-[10px] font-bold">生成結果</span>
          </button>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-display font-bold uppercase tracking-widest text-white">模特兒生成 (Model Creation)</h2>
            <p className="text-[10px] text-[var(--color-gold)] tracking-[0.4em] uppercase opacity-70">Model Creation Studio</p>
          </div>
          <div className="flex gap-3">
              <button 
                onClick={() => setIsExpertMode(!isExpertMode)}
                className={`px-4 py-1.5 rounded-full border text-[10px] font-bold transition-all ${isExpertMode ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)]' : 'border-[var(--color-border)] text-gray-400 hover:border-[var(--color-gold)]'}`}
              >
                  {isExpertMode ? (
                      <div className="flex flex-col items-center">
                        <span>專家模式 ON</span>
                        <span className="text-[9px] font-normal opacity-70">(Expert Mode: ON)</span>
                      </div>
                  ) : (
                      <div className="flex flex-col items-center">
                        <span>切換專家模式</span>
                        <span className="text-[9px] font-normal opacity-70">(Switch to Expert)</span>
                      </div>
                  )}
              </button>
              {onGoHome && (
                  <Button onClick={onGoHome} variant="secondary" className="px-3 py-1">
                      <div className="flex flex-col items-center">
                          <span className="text-[10px] font-bold">返回首頁</span>
                          <span className="text-[8px] font-normal opacity-60">(Home)</span>
                      </div>
                  </Button>
              )}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Settings */}
        <div className={`lg:col-span-5 xl:col-span-4 space-y-6 ${mobileTab === 'settings' ? 'block' : 'hidden lg:block'}`}>
            
            {/* 1. 靈魂藍圖 */}
            <Card className="p-0 overflow-hidden border-none bg-white/[0.03] backdrop-blur-xl group/card">
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-[var(--color-gold)]/5 to-transparent transition-all group-hover/card:from-[var(--color-gold)]/10">
                <h3 className="text-sm font-bold text-white tracking-[0.2em] uppercase flex items-center gap-3">
                  <div className="w-1 h-4 bg-[var(--color-gold)] shadow-[0_0_10px_rgba(var(--color-gold-rgb),0.5)]"></div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="group-hover/card:text-[var(--color-gold)] transition-colors">靈魂藍圖</span>
                    <span className="text-[10px] opacity-40 font-normal normal-case tracking-normal">(Soul Blueprint)</span>
                  </div>
                </h3>
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRandomize} 
                    className="bg-white/5 hover:bg-white/10 border border-white/5 py-1 px-4 rounded-full transition-all group"
                >
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-[var(--color-gold)]">✨ 隨機靈感</span>
                        <span className="text-[8px] font-normal opacity-40 text-white">(Randomize)</span>
                    </div>
                </motion.button>
              </div>
              <div className="p-6 space-y-7">
                <div className={getFieldClass('name')}>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-3 flex justify-between min-h-[2.5rem] items-center font-display tracking-[0.2em] text-left">
                        <div className="flex flex-col">
                            <span className="block text-white mb-0.5">IP 姓名</span>
                            <span className="block text-[9px] opacity-40 font-normal normal-case tracking-normal">(Identity Name)</span>
                        </div>
                        <button 
                            onClick={() => {
                                const namePool = formState.gender === 'male' ? IP_NAME_POOL.male : IP_NAME_POOL.female;
                                const randomName = namePool[Math.floor(Math.random() * namePool.length)];
                                handleFormChange('name', randomName);
                                addNotification({ type: 'info', message: '🎲 已隨機選取姓名' });
                            }}
                            className="group flex flex-col items-end transition-all hover:opacity-100"
                        >
                            <span className="text-[9px] text-[var(--color-gold)] font-bold mb-0.5 group-hover:underline">隨機換名</span>
                            <span className="text-[8px] text-gray-600 font-normal">(Roll Name)</span>
                        </button>
                    </label>
                    <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/20 focus:outline-none transition-all placeholder:text-gray-700" placeholder="輸入 IP 角色姓名" value={formState.name} onChange={e => handleFormChange('name', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-5">
                    <Select label="生理性別 (GENDER)" options={GENDER_PRESETS} value={formState.gender} onChange={e => handleGenderChange(e.target.value)} />
                    <div className={getFieldClass('age')}>
                        <Slider 
                            label="年齡 (AGE)"
                            unit="歲"
                            min={20} 
                            max={90} 
                            value={formState.age} 
                            onChange={e => handleFormChange('age', Number(e.target.value))} 
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-5 py-2">
                    <Select label="核心氛圍 (VIBE)" options={CORE_VIBE_OPTIONS} value={formState.persona.coreVibe} onChange={e => handlePersonaUpdate('coreVibe', e.target.value)} />
                    <Select label="MBTI (PERSONALITY)" options={MBTI_OPTIONS} value={formState.persona.mbti} onChange={e => handlePersonaUpdate('mbti', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                    <Select label="主力語氣 (TONE OF VOICE)" options={TONE_OPTIONS} value={formState.persona.toneOfVoice} onChange={e => handlePersonaUpdate('toneOfVoice', e.target.value)} />
                    <div className="flex items-end justify-center pb-1">
                        <p className="text-[9px] text-gray-500 italic opacity-60">人設細節將隨「隨機靈感」自動生成 (Persona details auto-generated)</p>
                    </div>
                </div>

                {/* Style Archetypes (矩陣 v2.0) */}
                <div className="pt-4 border-t border-white/5">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-3 flex justify-between items-center font-display tracking-[0.2em]">
                        <div className="flex flex-col">
                            <span className="text-white mb-0.5">風格原型偏好</span>
                            <span className="text-[9px] opacity-40 font-normal normal-case">(Style Archetypes)</span>
                        </div>
                        <span className="text-[9px] text-[var(--color-gold)] opacity-60">用於智慧穿搭路由</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {STYLE_ARCHETYPES.filter(a => a.gender.includes(formState.gender as any) || a.gender.includes('unisex')).map(archetype => {
                            const isSelected = formState.preferredArchetypes.includes(archetype.value);
                            return (
                                <button
                                    key={archetype.value}
                                    onClick={() => {
                                        setFormState(prev => {
                                            const current = prev.preferredArchetypes;
                                            const next = current.includes(archetype.value)
                                                ? current.filter(v => v !== archetype.value)
                                                : [...current, archetype.value];
                                            return { ...prev, preferredArchetypes: next };
                                        });
                                    }}
                                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                                        isSelected 
                                        ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)] shadow-[0_0_15px_rgba(var(--color-gold-rgb),0.3)]' 
                                        : 'bg-white/5 text-gray-400 border-white/10 hover:border-[var(--color-gold)]/50'
                                    }`}
                                >
                                    {archetype.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
              </div>
            </Card>

            {/* 2. 生理特徵 (Physiological Features) */}
            <Card className="p-0 overflow-hidden border-none bg-white/[0.03] backdrop-blur-xl">
              <div className="p-5 border-b border-white/5 bg-gradient-to-r from-[var(--color-gold)]/5 to-transparent flex justify-between items-center group">
                <h3 className="text-sm font-bold text-white tracking-[0.2em] uppercase flex items-center gap-3">
                  <div className="w-1 h-4 bg-[var(--color-gold)] shadow-[0_0_10px_rgba(var(--color-gold-rgb),0.5)]"></div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="group-hover:text-[var(--color-gold)] transition-colors">生理特徵</span>
                    <span className="text-[9px] opacity-40 font-normal normal-case tracking-normal">(Biometric Blueprint)</span>
                  </div>
                </h3>
              </div>
              <div className="p-6 space-y-7">
                    <div className={getFieldClass('archetype')}>
                        <div className="flex justify-between items-center mb-4 min-h-[2.5rem]">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] text-left flex flex-col leading-tight">
                                <span className="text-white mb-0.5">臉部原型</span>
                                <span className="text-[9px] opacity-40 font-normal normal-case tracking-normal">(Biometric Identity)</span>
                            </label>
                            {faceReferences.length > 0 && (
                                <motion.div 
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="flex items-center gap-2 bg-[var(--color-gold)]/20 border border-[var(--color-gold)]/40 px-4 py-1.5 rounded-full font-bold shadow-[0_0_25px_rgba(var(--color-gold-rgb),0.2)]"
                                >
                                    <div className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-gold)] opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-gold)]"></span>
                                    </div>
                                    <span className="text-[10px] text-[var(--color-gold)] tracking-widest">IDENTITY LOCKED</span>
                                </motion.div>
                            )}
                        </div>
                        <div className="relative group">
                            {faceReferences.length > 0 && (
                                <div className="absolute inset-0 z-20 cursor-not-allowed bg-black/40 backdrop-blur-[2px] rounded-xl flex items-center justify-center border border-[var(--color-gold)]/20">
                                   <span className="text-[10px] text-[var(--color-gold)] font-bold tracking-widest opacity-80">參考圖優先模式已開啟</span>
                                </div>
                            )}
                            <Select 
                                options={filteredFaceArchetypes} 
                                value={faceReferences.length > 0 ? 'identity_lock' : formState.archetype} 
                                onChange={e => handleFormChange('archetype', e.target.value)} 
                                disabled={faceReferences.length > 0} 
                            />
                        </div>
                    </div>
                
                {/* 智慧展開：面部特徵參考圖 */}
                <AnimatePresence>
                  {(formState.archetype === 'identity_lock' || faceReferences.length > 0) && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3 overflow-hidden"
                    >
                        <div className="flex justify-between items-start">
                            <label className="text-[10px] font-bold text-[var(--color-gold)] uppercase tracking-wider text-left flex flex-col leading-tight">
                                <span>面部特徵參考圖</span>
                                <span className="opacity-50 font-normal normal-case">(Identity Lock)</span>
                            </label>
                            <span className="text-[10px] text-gray-500 font-mono pt-1">{faceReferences.length}/10</span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                            {faceReferencePreviews.map((url, idx) => (
                                <div key={idx} className="relative min-w-[70px] h-[70px] rounded-lg overflow-hidden border border-white/10 group flex-shrink-0">
                                    <img src={url} className="w-full h-full object-cover" />
                                    <button onClick={() => removeFaceReference(idx)} className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">&times;</button>
                                </div>
                            ))}
                            {faceReferences.length < 10 && (
                                <label htmlFor="face-ref-final" className="min-w-[70px] h-[70px] bg-black/40 border border-dashed border-white/10 rounded-lg flex items-center justify-center cursor-pointer hover:border-[var(--color-gold)] transition-all flex-shrink-0">
                                    <PhotoIcon className="w-5 h-5 text-gray-600" />
                                </label>
                            )}
                        </div>
                        <input id="face-ref-final" type="file" className="hidden" accept="image/*" multiple onChange={handleFaceReferenceChange} />
                        <p className="text-[9px] text-gray-500 italic text-center">建議上傳多角度清晰正臉照，以獲得最佳特徵鎖定效果 (Upload multiple clear front-facing photos for best Identity Lock results)</p>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {isExpertMode && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6 overflow-hidden">
                    <Select 
                        label="基礎人型預設 (Base Preset)" 
                        options={[
                            { value: 'custom', label: '自定義 (Custom)' },
                            ...Object.keys(SMART_SUGGEST_PRESETS)
                                .filter(key => key.startsWith(formState.gender))
                                .map(key => ({
                                    value: key,
                                    label: SMART_SUGGEST_PRESETS[key].label || key
                                }))
                        ]} 
                        value={selectedPresetId} 
                        onChange={(e) => applyBasePreset(e.target.value)} 
                    />
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <Select label="眼型與面部細節 (Eye & Face Details)" options={EYE_SHAPE_OPTIONS} value={formState.eyeShape} onChange={e => handleFormChange('eyeShape', e.target.value)} />
                        <Select label="妝感風格 (Makeup Style)" options={(MAKEUP_STYLE_OPTIONS as any)[formState.gender] || []} value={formState.makeupStyle} onChange={e => handleFormChange('makeupStyle', e.target.value)} />
                    </div>
                    <div className="space-y-3 pt-2">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] flex flex-col leading-tight">
                            <span className="text-white mb-0.5">網美等級</span>
                            <span className="text-[9px] opacity-40 font-normal normal-case tracking-normal">(Photogenic Level)</span>
                        </label>
                        <div className="flex gap-2">
                            {[
                                { level: 1, label: '自然路人', sublabel: 'Natural' },
                                { level: 2, label: '天然網美', sublabel: 'Influencer' },
                                { level: 3, label: '精修偶像', sublabel: 'Idol' }
                            ].map(({ level, label, sublabel }) => (
                                <button
                                    key={level}
                                    onClick={() => handleFormChange('netRedLevel', level)}
                                    className={`flex-1 py-2.5 rounded-xl border text-center transition-all ${
                                        formState.netRedLevel === level
                                            ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)] shadow-xl shadow-[var(--color-gold)]/20'
                                            : 'bg-black/20 text-gray-400 border-white/10 hover:border-white/30'
                                    }`}
                                >
                                    <div className="text-[11px] font-bold">{label}</div>
                                    <div className="text-[9px] opacity-60 mt-0.5">{sublabel}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <Select label="膚色 (Skin Tone)" options={SKIN_TONE_OPTIONS} value={formState.skinTone} onChange={e => handleFormChange('skinTone', e.target.value)} />
                    <Select 
                        label="髮色 (Hair Color)" 
                        options={[
                            { value: 'black', label: '黑色 (Black)' },
                            { value: 'brown', label: '棕色 (Brown)' },
                            { value: 'blonde', label: '金髮 (Blonde)' },
                            { value: 'silver', label: '銀髮 (Silver)' },
                            { value: 'red', label: '紅髮 (Red)' }
                        ]} 
                        value={formState.hairColor} 
                        onChange={e => handleFormChange('hairColor', e.target.value)} 
                    />
                </div>

                {isExpertMode && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6 pt-2 border-t border-white/5 overflow-hidden">
                    <Select label="體態選項 (Physique)" options={PROPORTION_MODE_OPTIONS} value={formState.proportionMode} onChange={e => handlePhysiqueChange(e.target.value)} />
                    
                      <div className="space-y-5 bg-white/5 p-4 rounded-xl border border-white/5">
                      <div className="flex justify-between items-start mb-4">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left flex flex-col leading-tight">
                              <span>精確參數</span>
                              <span className="opacity-50 font-normal normal-case">(Physical Metrics)</span>
                          </label>
                          <span className="text-[9px] text-[var(--color-gold)] opacity-60 pt-1 text-right max-w-[150px]">自動同步由體態選項連動 (Auto-synced with physique selection)</span>
                      </div>
                      
                      {/* Standard Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <Slider label="身高 (Height)" min={150} max={200} step={1} unit="cm" value={formState.height} onChange={e => handleFormChange('height', Number(e.target.value))} />
                        <Slider label="胸圍 (Bust)" min={70} max={120} step={1} unit="cm" value={formState.bust} safetyStatus={getSafetyStatus('bust', formState.bust)} onChange={e => handleFormChange('bust', Number(e.target.value))} />
                        <Slider label="腰圍 (Waist)" min={50} max={100} step={1} unit="cm" value={formState.waist} onChange={e => handleFormChange('waist', Number(e.target.value))} />
                        <Slider label="臀圍 (Hip)" min={70} max={130} step={1} unit="cm" value={formState.hip} onChange={e => handleFormChange('hip', Number(e.target.value))} />
                      </div>

                      {/* Advanced Physiological Controls */}
                      <div className="pt-4 mt-2 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        {formState.gender === 'female' ? (
                          <>
                            <Slider 
                                label="上圍體積感 (Bust Volume)" 
                                min={0} max={100} unit="%" 
                                value={formState.bustTension} 
                                safetyStatus={getSafetyStatus('bustTension', formState.bustTension)}
                                onChange={e => handleFormChange('bustTension', Number(e.target.value))} 
                            />
                            <Slider 
                                label="身型曲線弧度 (Physique Contour)" 
                                min={0} max={100} unit="%" 
                                value={formState.physiqueCurvature} 
                                safetyStatus={getSafetyStatus('physiqueCurvature', formState.physiqueCurvature)}
                                onChange={e => handleFormChange('physiqueCurvature', Number(e.target.value))} 
                            />
                          </>
                        ) : (
                          <>
                            <Slider 
                                label="肌肉品質定義 (Muscular Definition)" 
                                min={0} max={100} unit="%" 
                                value={formState.muscularDensity} 
                                onChange={e => handleFormChange('muscularDensity', Number(e.target.value))} 
                            />
                            <Slider 
                                label="肩甲骨架比例 (Shoulder Frame)" 
                                min={0} max={100} unit="%" 
                                value={formState.vTaperScale} 
                                onChange={e => handleFormChange('vTaperScale', Number(e.target.value))} 
                            />
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Select label="皮膚紋理 (Skin Texture)" options={(SKIN_FINISH_OPTIONS as any)[formState.gender] || []} value={formState.skinFinish} onChange={e => handleFormChange('skinFinish', e.target.value)} />
                      <Slider label="自然瑕疵強度 (Blemishes)" min={0} max={100} unit="%" value={formState.imperfectionLevel || 20} onChange={e => handleFormChange('imperfectionLevel', Number(e.target.value))} />
                    </div>
                  </motion.div>
                )}

                {!isExpertMode && (
                  <div className="pt-2">
                      <Slider label="身高 (Height)" min={150} max={200} unit="cm" value={formState.height} onChange={e => handleFormChange('height', Number(e.target.value))} />
                  </div>
                )}
              </div>
            </Card>

            {/* 3. 環境與足跡 (Life Circuit) */}
            <Card className="p-0 overflow-hidden border-none bg-white/[0.03] backdrop-blur-xl">
              <div className="p-5 border-b border-white/5 bg-gradient-to-r from-[var(--color-gold)]/5 to-transparent group">
                <h3 className="text-sm font-bold text-white tracking-[0.2em] uppercase flex items-center gap-3">
                  <div className="w-1 h-4 bg-[var(--color-gold)] shadow-[0_0_10px_rgba(var(--color-gold-rgb),0.5)]"></div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="group-hover:text-[var(--color-gold)] transition-colors">環境與足跡</span>
                    <span className="text-[9px] opacity-40 font-normal normal-case tracking-normal">(Life Circuit)</span>
                  </div>
                </h3>
              </div>
              <div className="p-6 space-y-7">
                <div className="grid grid-cols-2 gap-5">
                    <Select 
                        label="IP 活動縣市 (CITY)" 
                        options={TAIWAN_COUNTIES} 
                        value={formState.lifeCircuit.primaryCity} 
                        onChange={e => handleCircuitUpdate('primaryCity', e.target.value)} 
                    />
                    <Select 
                        label="具體區域 (DISTRICT)" 
                        options={(TAIWAN_DISTRICT_DATA[formState.lifeCircuit.primaryCity] || []).map(d => ({ value: d, label: d }))} 
                        value={formState.lifeCircuit.primaryDistrict} 
                        onChange={e => handleCircuitUpdate('primaryDistrict', e.target.value)} 
                    />
                </div>
                <div className="grid grid-cols-2 gap-5">
                    <div className={getFieldClass('profession')}>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase mb-3 min-h-[2.5rem] font-display tracking-[0.2em] leading-tight text-left">
                            <span className="block text-white mb-0.5">職業身分</span>
                            <span className="block text-[9px] opacity-40 font-normal normal-case tracking-normal">(Profession)</span>
                        </label>
                        <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-[var(--color-gold)] focus:outline-none transition-all" placeholder="如: 藝術家 (e.g. Creator)" value={formState.persona.profession} onChange={e => handlePersonaUpdate('profession', e.target.value)} />
                    </div>
                    <Select label="核心興趣 (INTERESTS)" options={INTEREST_OPTIONS} value={formState.lifeCircuit.interests?.[0] || ''} onChange={e => handleCircuitUpdate('interests', [e.target.value])} />
                </div>
              </div>
            </Card>

            {/* 4. 專業服裝系統 (Apparel Curation) */}
            <Card className="p-0 overflow-hidden border-none bg-white/[0.03] backdrop-blur-xl">
              <div className="p-5 border-b border-white/5 bg-gradient-to-r from-[var(--color-gold)]/5 to-transparent">
                <h3 className="text-sm font-bold text-white tracking-[0.2em] uppercase flex items-center gap-3">
                  <div className="w-1 h-4 bg-[var(--color-gold)] shadow-[0_0_10px_rgba(var(--color-gold-rgb),0.5)]"></div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="group-hover:text-[var(--color-gold)] transition-colors">專業服裝系統</span>
                    <span className="text-[9px] opacity-40 font-normal normal-case tracking-normal">(Apparel Curation)</span>
                  </div>
                </h3>
              </div>
              <div className="p-6 space-y-6">
                  {/* 分類 Tab */}
                  <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 mb-4">
                      {APPAREL_CATEGORIES.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => setActiveApparelCat(cat.id)}
                            className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all duration-300 relative overflow-hidden ${activeApparelCat === cat.id ? 'bg-[var(--color-gold)] text-black shadow-[0_4px_20px_rgba(var(--color-gold-rgb),0.3)]' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                          >
                              <span className="relative z-10">{cat.label.split(' (')[0]}</span>
                              {activeApparelCat === cat.id && (
                                  <motion.div 
                                    layoutId="apparel-tab-glare" 
                                    className="absolute inset-0 bg-white/20 blur-xl pointer-events-none" 
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                  />
                              )}
                          </button>
                      ))}
                  </div>

                  {/* 選項列表 - 加入動畫容器 */}
                  <div className="max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                    <motion.div 
                        key={activeApparelCat}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-2 gap-3"
                    >
                      {APPAREL_ITEMS
                        .filter(i => (i.gender === 'both' || i.gender === formState.gender) && i.category === activeApparelCat)
                        .map((item, idx) => {
                            const isSelected = formState.outfitItems.includes(item.id);
                            return (
                                <motion.button
                                    key={item.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.03 }}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        let newItems = [...formState.outfitItems];
                                        if (item.category === 'full_set') {
                                            newItems = [item.id];
                                        } else {
                                            newItems = newItems.filter(id => {
                                                const found = APPAREL_ITEMS.find(ai => id === ai.id);
                                                return found?.category !== 'full_set';
                                            });
                                            newItems = newItems.filter(id => {
                                                const found = APPAREL_ITEMS.find(ai => id === ai.id);
                                                return found?.category !== item.category;
                                            });
                                            if (!isSelected) newItems.push(item.id);
                                        }
                                        handleFormChange('outfitItems', newItems);
                                    }}
                                    className={`p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group/item flex flex-col justify-between h-[82px] ${isSelected ? 'bg-[var(--color-gold)]/15 border-[var(--color-gold)]/60 text-[var(--color-gold)] ring-1 ring-[var(--color-gold)]/30' : 'bg-white/[0.03] border-white/5 text-gray-400 hover:border-white/20 hover:bg-white/5'}`}
                                >
                                    <div className="flex flex-col gap-0.5 relative z-10">
                                        <span className={`text-[11px] font-bold tracking-tight leading-tight ${isSelected ? 'text-white' : ''}`}>{item.label.split(' (')[0]}</span>
                                        <p className="text-[8px] opacity-40 font-normal uppercase tracking-wider truncate w-full">{item.label.split(' (')[1]?.replace(')', '')}</p>
                                    </div>
                                    
                                    <div className="flex justify-between items-center mt-auto relative z-10">
                                       <span className="text-[7px] text-gray-600 font-mono uppercase">VTO-{item.category.toUpperCase().slice(0,3)}-{item.id.split('_').pop()}</span>
                                       {isSelected && (
                                            <motion.div 
                                                layoutId={`check-${item.id}`}
                                                className="w-1.5 h-1.5 bg-[var(--color-gold)] rounded-full shadow-[0_0_10px_var(--color-gold)]"
                                            />
                                       )}
                                    </div>

                                    {/* 裝飾線條 */}
                                    <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-white/10 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none -mr-8 -mt-8 rotate-45`} />

                                    {isSelected && (
                                        <motion.div 
                                            layoutId={`bg-active-${item.id}`}
                                            className="absolute inset-0 bg-gradient-to-t from-[var(--color-gold)]/10 to-transparent pointer-events-none" 
                                        />
                                    )}
                                </motion.button>
                            );
                        })
                      }
                    </motion.div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                      <Select 
                        label="影像比例 (Aspect Ratio)" 
                        options={[
                            { value: '1:1', label: '1:1 (Square)' },
                            { value: '4:5', label: '4:5 (Portrait)' },
                            { value: '9:16', label: '9:16 (Tall)' },
                            { value: '16:9', label: '16:9 (Wide)' }
                        ]} 
                        value={formState.isMultiAngle ? '16:9' : (formState.ratio || '1:1')} 
                        onChange={e => !formState.isMultiAngle && handleFormChange('ratio', e.target.value)} 
                        disabled={formState.isMultiAngle}
                      />
                      <Select 
                        label="畫質階級 (Quality Level)" 
                        options={[
                            { value: 'standard', label: '標準 (Standard)' },
                            { value: 'high', label: '高畫質 (Pro 2K)' },
                            { value: 'ultra', label: '超高畫質 (Pro 4K)' }
                        ]} 
                        value={generationQuality} 
                        onChange={e => setGenerationQuality(e.target.value as QualityLevel)} 
                      />
                  </div>
                  
                  <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${formState.isMultiAngle ? 'bg-[var(--color-gold)]/10 border-[var(--color-gold)]/30' : 'bg-white/5 border-white/5'}`}>
                      <div className="flex flex-col items-start text-left">
                          <span className="text-[11px] font-bold text-white uppercase tracking-wider mb-0.5">多視角同步生成</span>
                          <span className="text-[10px] font-normal normal-case opacity-50 leading-tight">(Matrix Mode)</span>
                          <span className="text-[9px] text-gray-500 mt-1 italic">一次產出 4-6 個不同角度的同型人物 (Generate 4-6 angles simultaneously)</span>
                      </div>
                      <button 
                        onClick={() => handleFormChange('isMultiAngle', !formState.isMultiAngle)}
                        className={`w-12 h-6 rounded-full transition-all relative ${formState.isMultiAngle ? 'bg-[var(--color-gold)]' : 'bg-white/10'}`}
                      >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formState.isMultiAngle ? 'left-7 shadow-lg' : 'left-1'}`}></div>
                      </button>
                  </div>

                  <div className="space-y-4">
                      <div className="flex justify-between items-start">
                          <h4 className="text-[10px] font-bold text-gray-500 uppercase flex flex-col items-start leading-tight">
                              <span>生活感強度</span>
                              <span className="opacity-50 font-normal normal-case">(Lifestyle Fidelity)</span>
                          </h4>
                          <span className="text-[10px] font-bold text-[var(--color-gold)] pt-1">LV.{formState.fidelityScale}</span>
                      </div>
                      <div className="flex gap-2">
                          {[1,2,3,4,5].map(lvl => (
                              <button key={lvl} onClick={() => handleFormChange('fidelityScale', lvl)} className={`flex-1 h-10 rounded-xl border text-[10px] font-bold transition-all ${formState.fidelityScale === lvl ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)] shadow-xl shadow-[var(--color-gold)]/20' : 'bg-black/20 text-gray-400 border-white/10'}`}>
                                  {lvl === 1 ? '影棚 (Studio)' : lvl === 3 ? '街頭 (Urban)' : lvl === 5 ? '隨手 (Casual)' : lvl}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
            </Card>

            <motion.button 
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate} 
                disabled={isLoading}
                className="w-full py-5 rounded-2xl bg-[var(--color-gold)] text-black shadow-2xl shadow-[var(--color-gold)]/20 flex flex-col items-center gap-1 group relative overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
                <span className="text-base font-black tracking-widest uppercase relative z-10 flex items-center gap-2">
                    {isLoading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                            <span>時空傳送中 (Constructing)...</span>
                        </>
                    ) : (
                        '開啟時空膠囊 (Generate Model)'
                    )}
                </span>
                <span className="text-[9px] opacity-60 tracking-[0.3em] font-light relative z-10">CONSTRUCT THE PERSONA</span>
                
                {isLoading && (
                   <motion.div 
                     initial={{ scaleX: 0 }}
                     animate={{ scaleX: 1 }}
                     transition={{ duration: 3, ease: "easeInOut" }}
                     className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 origin-left"
                   />
                )}
            </motion.button>
        </div>

        {/* Right Column: Preview */}
        <div className={`lg:col-span-7 xl:col-span-8 flex flex-col gap-6 ${mobileTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
            {error && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex flex-col gap-2"
                >
                    <div className="flex items-center gap-2 font-bold uppercase tracking-tight">
                        <span className="text-lg">⚠️</span> 
                        <span>傳送發生異常 (Transmission Error)</span>
                    </div>
                    <p className="opacity-80 leading-relaxed font-mono text-[11px] bg-black/20 p-3 rounded-lg border border-white/5">{error}</p>
                    <button 
                        onClick={() => setError(null)}
                        className="text-[10px] uppercase font-bold text-red-400/60 hover:text-red-400 self-end mt-1 underline"
                    >
                        [ 關閉提示 Dismiss ]
                    </button>
                </motion.div>
            )}
            
            <Card className="flex-1 min-h-[500px] border-none bg-white/[0.02] p-8">
               <div className="flex justify-between items-start mb-8 border-b border-white/5 pb-4">
                  <h3 className="text-xl font-bold tracking-widest uppercase text-white flex flex-col items-start leading-tight">
                    <span>結果預覽</span>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-normal normal-case opacity-50">(Preview Results)</span>
                        <span className="text-[10px] font-light text-gray-500 tracking-normal normal-case">Digital Replicas</span>
                    </div>
                  </h3>
                  <div className="text-[10px] text-gray-500 font-mono pt-2">COUNT: {generatedModels.length}</div>
               </div>
               
               {generatedModels.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       <AnimatePresence>
                           {generatedModels.map((model, idx) => (
                               <motion.div key={model.id} initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="group relative">
                                   <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/5 bg-black/40">
                                       <AsyncImage src={model.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end gap-3 translate-y-4 group-hover:translate-y-0 transition-transform">
                                          <Button onClick={() => handleSaveToLounge(model)} variant="primary" className="w-full py-2 text-[10px] font-bold">儲存休息室 (Save to Lounge)</Button>
                                          <div className="flex gap-2">
                                              <button onClick={() => setPreviewingModelIndex(idx)} className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-[10px] font-bold text-white transition-colors">放大 (Zoom)</button>
                                              <button onClick={() => handleDownload(model)} className="px-3 bg-white/10 hover:bg-white/20 rounded-lg text-white"><DownloadIcon className="w-3 h-3" /></button>
                                          </div>
                                       </div>
                                   </div>
                               </motion.div>
                           ))}
                       </AnimatePresence>
                   </div>
               ) : (
                   <div className="h-[400px] flex flex-col items-center justify-center border border-dashed border-white/5 rounded-3xl opacity-30">
                       <PhotoIcon className="w-16 h-16 mb-4 text-white" />
                       <p className="text-lg uppercase tracking-widest text-white">等待初始化 (Awaiting Input)...</p>
                       <p className="text-xs mt-2">請於左側面板設定參數後點擊生成 (Set parameters and click generate)</p>
                   </div>
               )}
            </Card>
        </div>
      </div>

      {previewingModelIndex !== null && (
        <ImagePreviewModal
          images={generatedModels.map(m => m.imageUrl)}
          startIndex={previewingModelIndex}
          onClose={() => setPreviewingModelIndex(null)}
        />
      )}
    </div>
  );
};

export default ModelSetup;
