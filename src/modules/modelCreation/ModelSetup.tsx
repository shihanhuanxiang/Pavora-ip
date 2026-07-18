
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Model, OutfitPreset, WorldAnchors } from '../../shared/types/types';
import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
import Select from '../../shared/components/common/Select';
import Loader from '../../shared/components/common/Loader';
import { generateModels } from './services/modelCreationService';
import { generatePersonaTraits } from './services/personaService';
import { getFriendlyErrorMessage, fileToBase64 } from '../../shared/services/geminiService';
import { getGeminiClient } from '../../shared/services/core/geminiClient';
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
    FACE_ARCHETYPES, FACE_ARCHETYPE_STYLE_MAP, SKIN_TONE_OPTIONS, SKIN_FINISH_OPTIONS, MAKEUP_STYLE_OPTIONS,
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

type ModelCreationWorldAnchors = {
    pet: NonNullable<WorldAnchors['pet']>;
    relationships: NonNullable<WorldAnchors['relationships']>;
    iconicItems: NonNullable<WorldAnchors['iconicItems']>;
    longTermMemories: string[];
};

const createEmptyWorldAnchors = (): ModelCreationWorldAnchors => ({
    pet: { breed: '', name: '', description: '', traits: [] },
    relationships: [],
    iconicItems: [],
    longTermMemories: []
});

const toModelCreationWorldAnchors = (anchors?: WorldAnchors): ModelCreationWorldAnchors => ({
    pet: anchors?.pet || { breed: '', name: '', description: '', traits: [] },
    relationships: anchors?.relationships || [],
    iconicItems: anchors?.iconicItems || [],
    longTermMemories: anchors?.longTermMemories || []
});

const formatPetAnchor = (pet?: WorldAnchors['pet']) => {
    if (!pet) return '';
    return [pet.breed, pet.name].filter(Boolean).join(' ') || pet.description || '';
};

const parsePetAnchor = (value: string, current: ModelCreationWorldAnchors['pet']): ModelCreationWorldAnchors['pet'] => {
    const trimmed = value.trim();
    if (!trimmed) return { breed: '', name: '', description: '', traits: [] };

    const parts = trimmed.split(/[、,，/]/).map(part => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
        return {
            ...current,
            breed: parts[0],
            name: parts.slice(1).join(' '),
            description: current.description || trimmed,
            traits: current.traits || []
        };
    }

    return {
        ...current,
        name: trimmed,
        description: current.description || trimmed,
        traits: current.traits || []
    };
};

const normalizeWorldAnchorsForModel = (anchors: ModelCreationWorldAnchors): WorldAnchors => {
    const result: WorldAnchors = {};
    const petHasContent = Boolean(anchors.pet.breed || anchors.pet.name || anchors.pet.description || anchors.pet.traits.length);
    const iconicItems = anchors.iconicItems.filter(item => item.name || item.description || item.significance);

    if (petHasContent) result.pet = anchors.pet;
    if (anchors.relationships.length) result.relationships = anchors.relationships;
    if (iconicItems.length) result.iconicItems = iconicItems;
    if (anchors.longTermMemories.length) result.longTermMemories = anchors.longTermMemories;

    return result;
};

const getDefaultVisualIdentityHint = (gender: string) => {
    const isMale = gender === 'M' || gender === 'male';
    return {
        subjectDescriptor: isMale ? 'male virtual IP model' : 'female virtual IP model',
        facialLineageHint: 'East Asian facial features',
        styleReferenceHint: isMale
            ? 'Korean Instagram lifestyle style'
            : 'Korean Instagram lifestyle beauty',
        hairMakeupHint: isMale
            ? 'clean natural grooming, black hair'
            : 'soft natural makeup, clean black hair'
    };
};

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
  const [savedModelIds, setSavedModelIds] = useState<Set<string>>(new Set());
  
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
      visualIdentityHint: getDefaultVisualIdentityHint(ModelGenerationDefaults.gender || 'female'),
      persona: {
          coreVibe: '優雅時尚',
          mbti: '',
          profession: '',
          catchphrase: '',
          postingHabit: '',
          toneOfVoice: '',
          locked_descriptor: ''
      },
      worldAnchors: createEmptyWorldAnchors(),
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
  const [isGeneratingDescriptor, setIsGeneratingDescriptor] = useState(false);
  const [isExpertMode, setIsExpertMode] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState('custom');
  const [faceReferences, setFaceReferences] = useState<File[]>([]);
  const [faceReferencePreviews, setFaceReferencePreviews] = useState<string[]>([]);
  const [highlightedFields, setHighlightedFields] = useState<Set<string>>(new Set());
  const [generationQuality, setGenerationQuality] = useState<QualityLevel>('standard');
  const [mobileTab, setMobileTab] = useState<'settings' | 'preview'>('settings');
  const [wizardMode, setWizardMode] = useState(true);
  const [wizardStep, setWizardStep] = useState<1|2|3|4>(1);
  const [activeApparelCat, setActiveApparelCat] = useState('full_set');

  // A7: Use a ref to track the latest formState to avoid stale closures in async callbacks (like setTimeout)
  const formStateRef = useRef(formState);
  useEffect(() => {
    formStateRef.current = formState;
  }, [formState]);

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
            worldAnchors: toModelCreationWorldAnchors(inheritedModel.worldAnchors || prev.worldAnchors),
            visualIdentityHint: inheritedModel.visualIdentityHint || prev.visualIdentityHint,
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
            message: '品牌資產繼承成功',
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
            worldAnchors: toModelCreationWorldAnchors(model.worldAnchors || prev.worldAnchors),
            visualIdentityHint: model.visualIdentityHint || prev.visualIdentityHint,
            preferredArchetypes: model.preferred_archetypes || prev.preferredArchetypes,
            lightingPreset: diaryParams.recommendedLighting || prev.lightingPreset,
            customOutfitPrompt: diaryParams.suggestedOutfit ? `Wearing ${diaryParams.suggestedOutfit}` : prev.customOutfitPrompt,
            outfitItems: diaryParams.suggestedOutfit ? [] : prev.outfitItems
        }));
        
        addNotification({
            type: 'success',
            message: '敘事數據同步成功',
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

  const handlePetAnchorUpdate = (value: string) => {
    setFormState(prev => ({
        ...prev,
        worldAnchors: {
            ...prev.worldAnchors,
            pet: parsePetAnchor(value, prev.worldAnchors.pet)
        }
    }));
  };

  const handleIconicItemsUpdate = (value: string) => {
    setFormState(prev => ({
        ...prev,
        worldAnchors: {
            ...prev.worldAnchors,
            iconicItems: value.trim()
                ? [{ ...(prev.worldAnchors.iconicItems[0] || { description: '', significance: '' }), name: value }]
                : []
        }
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
    const currentForm = formStateRef.current;
    try {
        const traits = await generatePersonaTraits({
            name: currentForm.name || '未命名',
            gender: currentForm.gender,
            coreVibe: currentForm.persona.coreVibe,
            profession: currentForm.persona.profession,
            location: `${currentForm.lifeCircuit.primaryCity}${currentForm.lifeCircuit.primaryDistrict}`
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
        addNotification({ type: 'success', message: 'IP 人設補完成功' });
    } catch (e) {
        addNotification({ type: 'error', message: '人設生成失敗' });
    } finally { setIsGeneratingPersona(false); }
  }, [addNotification]);

  const handleGenerateLockedDescriptor = async () => {
    setIsGeneratingDescriptor(true);
    try {
      const client = await getGeminiClient(true) as any;
      
      const { profession, coreVibe, mbti, toneOfVoice } = formState.persona;
      const { visualIdentityHint } = formState;
      const { primaryCity, interests } = formState.lifeCircuit;

      const prompt = `
        You are a digital identity architect for PAVORA (high-end fashion IP agency). 
        Based on the character profile below, draft a 2nd/3rd-person English "Identity Locked Descriptor". 
        This string will be used as a master prompt anchor to ensure facial and structural consistency in AI image generation.

        Character Profile:
        - Profession: ${profession || 'Virtual Model'}
        - Core Vibe: ${coreVibe}
        - Personality (MBTI): ${mbti || 'N/A'}
        - Tone of Voice: ${toneOfVoice || 'N/A'}
        - Visual Identity Hints: ${JSON.stringify(visualIdentityHint)}
        - Location Base: ${primaryCity}
        - Personal Interests: ${interests.join(', ')}
        - Selected Appearance Presets (the description MUST stay consistent with these): skin tone preset = ${formState.skinTone}, hair color = ${formState.hairColor}, face archetype = ${formState.archetype}

        Requirements for Output:
        1. Length: Exactly 2-3 sentences.
        2. Content: Focus on precise facial architecture (e.g., eye shape, bone structure), specific gaze aura (e.g., distant, sharp, warm), and a signature style anchor.
        3. Language: PURE ENGLISH. No headers, no JSON, no Markdown.
        4. Quality: Sophisticated, editorial, and technical for AI image synthesis.
        5. AESTHETIC BASELINE: This is the face of a premium commercial fashion IP — it must align with contemporary Taiwanese beauty standards (refined harmonious features, bright expressive eyes, luminous complexion). FORBIDDEN: aging markers (nasolabial folds, crow's feet, wrinkles), unflattering features (wide nostrils, sagging), moles/freckles/spots/marks, and any skin tone wording that conflicts with the selected skin tone preset (e.g. do NOT write olive, tan, or dusky undertones when the preset is fair or medium).
      `;

      const response = await client.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      const text = (response.text || "").trim().replace(/^["']|["']$/g, '');
      
      if (text) {
        handlePersonaUpdate('locked_descriptor', text);
        addNotification({ 
            type: 'success', 
            message: '身份鎖定描述已草擬於身分盒',
            description: '核心視覺特徵已根據當前設定完成鎖定。'
        });
      }
    } catch (e) {
      addNotification({ 
        type: 'error', 
        message: '身份鎖定描述生成失敗',
        description: getFriendlyErrorMessage(e)
      });
    } finally {
      setIsGeneratingDescriptor(false);
    }
  };

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
        visualIdentityHint: getDefaultVisualIdentityHint(currentGender),
        aestheticStyle: randomStyle,
        archetype: randomArchetype,
        outfitItems: randomOutfit,
        hairColor: ['black', 'brown', 'blonde', 'silver', 'red'][Math.floor(Math.random() * 5)],
        lightingPreset: LIGHTING_PRESETS[Math.floor(Math.random() * LIGHTING_PRESETS.length)].value,
        ...PROPORTION_DEFAULTS[currentGender as 'female' | 'male'].standard,
        lifeCircuit: {
            ...formState.lifeCircuit,
            primaryCity: randomCity,
            primaryDistrict: randomDistrict,
            interests: [randomInterest]
        },
        persona: {
            ...formState.persona,
            coreVibe: randomVibe,
            mbti: randomMBTI,
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
        message: '隨機靈感已套用（含深度人設）',
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
    return `transition-all duration-300 ${highlightedFields.has(fieldName) ? 'ring-2 ring-[var(--color-brass)] ring-offset-2 ring-offset-gray-900 rounded-lg p-1' : ''}`;
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
                    message: '偵測到 Pavora 協議',
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
        visualIdentityHint: getDefaultVisualIdentityHint(value),
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
        addNotification({ type: 'success', message: `已套用 ${presetKey.includes('female') ? '女性' : '男性'} 預設配置，生理參數已同步` });
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
        isExpertMode,
        generationQuality,
        worldAnchors: normalizeWorldAnchorsForModel(formState.worldAnchors),
        outfitItems: selectedItems,
        faceReferences: finalFaceRefs,
        preferred_archetypes: formState.preferredArchetypes,
      });
      setGeneratedModels(prev => [...models, ...prev]);
    } catch (err) { setError(getFriendlyErrorMessage(err)); } 
    finally { setIsLoading(false); }
  }, [formState, faceReferences, generationQuality, isExpertMode]);

  const handleSaveToLounge = async (model: Model) => {
      await addModel(model);
      setSavedModelIds(prev => {
          const next = new Set(prev);
          next.add(model.id);
          return next;
      });
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
    <div className="home-workbench model-setup min-h-screen font-sans container mx-auto p-4 lg:p-8 max-w-[110rem] animate-fade-in pb-24 lg:pb-8">
      {isLoading && <Loader message="時空傳送中..." />}
      
      {/* Mobile Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--home-paper)] border-t border-[var(--home-line)] z-40 flex justify-around p-2 pb-safe">
          <button onClick={() => setMobileTab('settings')} className={`flex flex-col items-center p-2 w-1/2 ${mobileTab === 'settings' ? 'text-[var(--color-brass)] bg-[rgba(255,255,255,.4)]' : 'text-[var(--home-muted)]'}`}>
              <ModelIcon className="w-6 h-6" /><span className="text-[10px] font-bold">參數設定</span>
          </button>
          <button onClick={() => setMobileTab('preview')} className={`flex flex-col items-center p-2 w-1/2 ${mobileTab === 'preview' ? 'text-[var(--color-brass)] bg-[rgba(255,255,255,.4)]' : 'text-[var(--home-muted)]'}`}>
              <View360Icon className="w-6 h-6" /><span className="text-[10px] font-bold">生成結果</span>
          </button>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-display font-bold tracking-widest text-[var(--home-ink)]">模特兒生成</h2>
          </div>
          <div className="flex gap-3">
              <button
                onClick={() => setWizardMode(v => !v)}
                className={`px-4 py-1.5 rounded-full border text-[10px] font-bold transition-all ${wizardMode ? 'bg-brass text-black border-brass' : 'home-btn-secondary'}`}
              >
                {wizardMode ? '精靈模式' : '完整表單'}
              </button>
              <button
                onClick={() => setIsExpertMode(!isExpertMode)}
                className={`px-4 py-1.5 rounded-full border text-[10px] font-bold transition-all ${isExpertMode ? 'bg-brass text-black border-brass' : 'border-[var(--home-line)] text-[var(--home-muted)] hover:border-brass'}`}
              >
                  {isExpertMode ? '專家模式 已開啟' : '切換專家模式'}
              </button>
              {onGoHome && (
                  <Button onClick={onGoHome} variant="secondary" className="home-btn-secondary px-3 py-1 text-[10px] font-bold">
                      返回首頁
                  </Button>
              )}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Settings */}
        <div className={`lg:col-span-5 xl:col-span-4 space-y-6 ${mobileTab === 'settings' ? 'block' : 'hidden lg:block'}`}>
            
            
            {/* P3-1: Wizard Mode — Progress Indicator */}
            {wizardMode && (
                <div className="flex items-center gap-2 mb-1">
                    {([
                        { n: 1 as const, label: '基本設定' },
                        { n: 2 as const, label: '外觀建立' },
                        { n: 3 as const, label: 'AI 人設' },
                        { n: 4 as const, label: '身份鎖定' }
                    ]).map(({ n, label }, i) => (
                        <React.Fragment key={n}>
                            <button onClick={() => setWizardStep(n)} className={`flex flex-col items-center gap-1 ${wizardStep >= n ? 'text-[var(--color-brass)]' : 'text-[var(--home-muted)]'}`}>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${wizardStep === n ? 'bg-brass text-black border-brass' : wizardStep > n ? 'bg-brass/20 border-brass/40 text-[var(--color-brass)]' : 'bg-[rgba(255,255,255,.4)] border-[var(--home-line)] text-[var(--home-muted)]'}`}>
                                    {wizardStep > n ? '✓' : n}
                                </div>
                                <span className="text-[8px] font-bold uppercase tracking-widest hidden sm:block">{label}</span>
                            </button>
                            {i < 3 && <div className={`flex-1 h-px transition-all ${wizardStep > n ? 'bg-brass/40' : 'bg-[rgba(255,255,255,.5)]'}`} />}
                        </React.Fragment>
                    ))}
                </div>
            )}

            {/* P3-1: Wizard Mode — Step Content */}
            {wizardMode && (
                <div className="space-y-5">
                    {/* STEP 1: 基本設定 */}
                    {wizardStep === 1 && (
                        <Card className="p-0 overflow-hidden border-none home-card">
                            <div className="p-5 border-b border-[var(--home-line)] bg-gradient-to-r from-[var(--color-brass)]/5 to-transparent">
                                <h3 className="text-sm font-bold text-[var(--home-ink)] tracking-[0.2em] uppercase flex items-center gap-3">
                                    <div className="w-1 h-4 bg-brass"></div>
                                    <div className="flex flex-col items-start leading-tight">
                                        <span>基本設定</span>
                                        <span className="text-[9px] opacity-40 font-normal normal-case">步驟 1 — 不到 1 分鐘</span>
                                    </div>
                                </h3>
                            </div>
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--home-muted)] mb-2 tracking-widest">IP 姓名</label>
                                    <div className="flex gap-2">
                                        <input type="text" className="flex-1 bg-[rgba(255,255,255,.5)] border border-[var(--home-line)] rounded-xl p-3 text-sm focus:border-brass focus:outline-none transition-all placeholder:text-[var(--home-muted)]" placeholder="輸入 IP 角色姓名" value={formState.name} onChange={e => handleFormChange('name', e.target.value)} />
                                        <button onClick={() => { const p = formState.gender === 'male' ? IP_NAME_POOL.male : IP_NAME_POOL.female; handleFormChange('name', p[Math.floor(Math.random() * p.length)]); }} className="px-3 bg-[rgba(255,255,255,.4)] border border-[var(--home-line)] rounded-xl text-[var(--home-muted)] hover:text-[var(--home-ink)] hover:border-[var(--home-line-strong)] transition-all text-[11px] font-bold">隨機</button>
                                    </div>
                                </div>
                                <Select label="生理性別 (GENDER)" options={GENDER_PRESETS} value={formState.gender} onChange={e => handleGenderChange(e.target.value)} />
                                <Slider label="年齡 (AGE)" min={18} max={45} unit="歲" value={formState.age} onChange={e => handleFormChange('age', Number(e.target.value))} />
                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--home-muted)] mb-2 tracking-widest">職業</label>
                                    <input type="text" className="w-full bg-[rgba(255,255,255,.5)] border border-[var(--home-line)] rounded-xl p-3 text-sm focus:border-brass focus:outline-none transition-all placeholder:text-[var(--home-muted)]" placeholder="例：攝影師、咖啡師、設計師..." value={formState.persona.profession} onChange={e => handlePersonaUpdate('profession', e.target.value)} />
                                </div>
                                <Select label="主力城市 (City)" options={TAIWAN_COUNTIES} value={formState.lifeCircuit.primaryCity} onChange={e => handleCircuitUpdate('primaryCity', e.target.value)} />
                            </div>
                        </Card>
                    )}
                    {/* STEP 2: 外觀建立 */}
                    {wizardStep === 2 && (
                        <Card className="p-0 overflow-hidden border-none home-card">
                            <div className="p-5 border-b border-[var(--home-line)] bg-gradient-to-r from-[var(--color-brass)]/5 to-transparent">
                                <h3 className="text-sm font-bold text-[var(--home-ink)] tracking-[0.2em] uppercase flex items-center gap-3">
                                    <div className="w-1 h-4 bg-brass"></div>
                                    <div className="flex flex-col items-start leading-tight">
                                        <span>外觀建立</span>
                                        <span className="text-[9px] opacity-40 font-normal normal-case">步驟 2 — 選臉型與外觀方向</span>
                                    </div>
                                </h3>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--home-muted)] mb-3 tracking-widest">臉型風格</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {STYLE_ARCHETYPES.filter(a => a.gender.includes(formState.gender as any) || a.gender.includes('unisex')).slice(0, 6).map(a => (
                                            <button key={a.value} onClick={() => handleFormChange('archetype', a.value)} className={`py-2.5 px-2 rounded-xl border text-[9px] font-bold transition-all text-center ${formState.archetype === a.value ? 'bg-brass/20 border-brass text-[var(--color-brass)]' : 'border-[var(--home-line)] text-[var(--home-muted)] hover:border-[var(--home-line-strong)]'}`}>{a.label}</button>
                                        ))}
                                    </div>
                                </div>
                                <Select label="膚色 (Skin Tone)" options={SKIN_TONE_OPTIONS} value={formState.skinTone} onChange={e => handleFormChange('skinTone', e.target.value)} />
                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--home-muted)] mb-2 tracking-widest">髮色</label>
                                    <input type="text" className="w-full bg-[rgba(255,255,255,.5)] border border-[var(--home-line)] rounded-xl p-3 text-sm focus:border-brass focus:outline-none transition-all placeholder:text-[var(--home-muted)]" placeholder="例：黑色直髮、棕色捲髮..." value={formState.hairColor} onChange={e => handleFormChange('hairColor', e.target.value)} />
                                </div>
                                <div className="pt-2 border-t border-[var(--home-line)] space-y-3">
                                    <p className="text-[9px] text-[var(--home-muted)] uppercase tracking-widest">生活細節（選填）</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-[var(--home-muted)] mb-1.5">寵物</label>
                                            <input type="text" className="w-full bg-[rgba(255,255,255,.5)] border border-[var(--home-line)] rounded-xl p-2.5 text-xs focus:border-brass focus:outline-none transition-all placeholder:text-[var(--home-muted)]" placeholder="品種/名字" value={formatPetAnchor(formState.worldAnchors.pet)} onChange={e => handlePetAnchorUpdate(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-[var(--home-muted)] mb-1.5">標誌物品</label>
                                            <input type="text" className="w-full bg-[rgba(255,255,255,.5)] border border-[var(--home-line)] rounded-xl p-2.5 text-xs focus:border-brass focus:outline-none transition-all placeholder:text-[var(--home-muted)]" placeholder="例：相機、特定飾品" value={formState.worldAnchors.iconicItems[0]?.name || ''} onChange={e => handleIconicItemsUpdate(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                    {/* STEP 3: AI 人設生成 */}
                    {wizardStep === 3 && (
                        <Card className="p-0 overflow-hidden border-none home-card">
                            <div className="p-5 border-b border-[var(--home-line)] bg-gradient-to-r from-[var(--color-brass)]/5 to-transparent">
                                <h3 className="text-sm font-bold text-[var(--home-ink)] tracking-[0.2em] uppercase flex items-center gap-3">
                                    <div className="w-1 h-4 bg-brass"></div>
                                    <div className="flex flex-col items-start leading-tight">
                                        <span>AI 人設生成</span>
                                        <span className="text-[9px] opacity-40 font-normal normal-case">步驟 3 — 一鍵 AI 或手動填入</span>
                                    </div>
                                </h3>
                            </div>
                            <div className="p-6 space-y-5">
                                <button onClick={handleAutoGeneratePersona} disabled={isGeneratingPersona} className={`w-full py-3.5 rounded-2xl border text-[11px] font-black tracking-widest transition-all ${isGeneratingPersona ? 'opacity-50 cursor-not-allowed border-[var(--home-line)] text-[var(--home-muted)]' : 'border-brass/40 text-[var(--color-brass)] hover:bg-brass/10'}`}>
                                    {isGeneratingPersona ? 'AI 人設生成中...' : 'AI 一鍵生成人設'}
                                </button>
                                <Select label="核心氛圍 (VIBE)" options={CORE_VIBE_OPTIONS} value={formState.persona.coreVibe} onChange={e => handlePersonaUpdate('coreVibe', e.target.value)} />
                                <Select label="MBTI (PERSONALITY)" options={MBTI_OPTIONS} value={formState.persona.mbti} onChange={e => handlePersonaUpdate('mbti', e.target.value)} />
                                <Select label="主力語氣 (TONE OF VOICE)" options={TONE_OPTIONS} value={formState.persona.toneOfVoice} onChange={e => handlePersonaUpdate('toneOfVoice', e.target.value)} />
                            </div>
                        </Card>
                    )}
                    {/* STEP 4: 身份鎖定 */}
                    {wizardStep === 4 && (
                        <Card className="p-0 overflow-hidden border-none home-card">
                            <div className="p-5 border-b border-[var(--home-line)] bg-gradient-to-r from-[var(--color-brass)]/5 to-transparent">
                                <h3 className="text-sm font-bold text-[var(--home-ink)] tracking-[0.2em] uppercase flex items-center gap-3">
                                    <div className="w-1 h-4 bg-brass"></div>
                                    <div className="flex flex-col items-start leading-tight">
                                        <span>身份鎖定</span>
                                        <span className="text-[9px] opacity-40 font-normal normal-case">步驟 4 — AI 草擬後確認生成</span>
                                    </div>
                                </h3>
                            </div>
                            <div className="p-6 space-y-5">
                                <button onClick={handleGenerateLockedDescriptor} disabled={isGeneratingDescriptor} className={`w-full py-3.5 rounded-2xl border text-[11px] font-black tracking-widest transition-all ${isGeneratingDescriptor ? 'opacity-50 cursor-not-allowed border-[var(--home-line)] text-[var(--home-muted)]' : 'border-brass/40 text-[var(--color-brass)] hover:bg-brass/10'}`}>
                                    {isGeneratingDescriptor ? '草擬中...' : 'AI 草擬身份鎖定'}
                                </button>
                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--home-muted)] mb-2 tracking-widest">身份鎖定描述</label>
                                    <textarea className="w-full h-28 bg-[rgba(255,255,255,.5)] border border-[var(--home-line)] rounded-xl p-3 text-xs font-mono focus:border-brass focus:outline-none transition-all resize-none placeholder:text-[var(--home-muted)]" placeholder="AI 草擬後在此確認或微調..." value={formState.persona.locked_descriptor} onChange={e => handlePersonaUpdate('locked_descriptor', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--home-muted)] mb-2 tracking-widest">生成品質</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {([
                                            { id: 'standard' as const, label: '標準' },
                                            { id: 'high' as const, label: '高品質' },
                                            { id: 'ultra' as const, label: 'Ultra' }
                                        ]).map(q => (
                                            <button key={q.id} onClick={() => setGenerationQuality(q.id)} className={`py-2.5 rounded-xl border text-[9px] font-bold transition-all ${generationQuality === q.id ? 'bg-brass/20 border-brass text-[var(--color-brass)]' : 'border-[var(--home-line)] text-[var(--home-muted)] hover:border-[var(--home-line-strong)]'}`}>{q.label}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                    {/* Step Navigation */}
                    <div className="flex items-center justify-between gap-3">
                        <button onClick={() => setWizardStep(s => Math.max(1, s - 1) as 1|2|3|4)} disabled={wizardStep === 1} className="px-5 py-3 border border-[var(--home-line)] rounded-xl text-[10px] font-bold text-[var(--home-muted)] hover:text-[var(--home-ink)] hover:border-[var(--home-line-strong)] transition-all disabled:opacity-20 disabled:cursor-not-allowed">← 上一步</button>
                        <span className="text-[9px] text-[var(--home-muted)] tracking-widest">{wizardStep} / 4</span>
                        {wizardStep < 4 ? (
                            <button onClick={() => setWizardStep(s => Math.min(4, s + 1) as 1|2|3|4)} className="px-5 py-3 bg-[rgba(255,255,255,.5)] border border-[var(--home-line-strong)] rounded-xl text-[10px] font-bold text-[var(--home-ink)] hover:bg-brass/20 hover:border-brass/40 hover:text-[var(--color-brass)] transition-all">下一步 →</button>
                        ) : (
                            <Button onClick={handleGenerate} isLoading={isLoading} disabled={isLoading} className="home-btn-primary px-6 py-3 text-[10px] font-black tracking-widest">生成 IP</Button>
                        )}
                    </div>
                </div>
            )}

            {/* Existing full form — hidden in wizard mode */}
            {!wizardMode && (<>

            {/* 1. 靈魂藍圖 */}
            <Card className="p-0 overflow-hidden border-none home-card group/card">
              <div className="p-5 border-b border-[var(--home-line)] flex justify-between items-center bg-gradient-to-r from-[var(--color-brass)]/5 to-transparent transition-all group-hover/card:from-[var(--color-brass)]/10">
                <h3 className="text-sm font-bold text-[var(--home-ink)] tracking-[0.2em] flex items-center gap-3">
                  <div className="w-1 h-4 bg-brass"></div>
                  <span className="group-hover/card:text-[var(--color-brass)] transition-colors">靈魂藍圖</span>
                </h3>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRandomize}
                    className="bg-[rgba(255,255,255,.4)] hover:bg-[rgba(255,255,255,.5)] border border-[var(--home-line)] py-1.5 px-4 rounded-full transition-all group"
                >
                    <span className="text-[10px] font-bold text-[var(--color-brass)]">隨機靈感</span>
                </motion.button>
              </div>
              <div className="p-6 space-y-7">
                <div className={getFieldClass('name')}>
                    <label className="block text-[11px] font-bold text-[var(--home-muted)] mb-3 flex justify-between min-h-[2.5rem] items-center font-display tracking-[0.2em] text-left">
                        <span className="block text-[var(--home-ink)]">IP 姓名</span>
                        <button
                            onClick={() => {
                                const namePool = formState.gender === 'male' ? IP_NAME_POOL.male : IP_NAME_POOL.female;
                                const randomName = namePool[Math.floor(Math.random() * namePool.length)];
                                handleFormChange('name', randomName);
                                addNotification({ type: 'info', message: '已隨機選取姓名' });
                            }}
                            className="group flex items-center transition-all hover:opacity-100"
                        >
                            <span className="text-[9px] text-[var(--color-brass)] font-bold group-hover:underline">隨機換名</span>
                        </button>
                    </label>
                    <input type="text" className="w-full bg-[rgba(255,255,255,.5)] border border-[var(--home-line)] rounded-xl p-3 text-sm focus:border-brass focus:ring-1 focus:ring-[var(--color-brass)]/20 focus:outline-none transition-all placeholder:text-[var(--home-muted)]" placeholder="輸入 IP 角色姓名" value={formState.name} onChange={e => handleFormChange('name', e.target.value)} />
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
                        <p className="text-[9px] text-[var(--home-muted)] opacity-60">人設細節將隨「隨機靈感」自動生成</p>
                    </div>
                </div>

                {/* 身份鎖定描述 - 靈魂核心 */}
                <div className="pt-4 border-t border-[var(--home-line)] space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="block text-[11px] font-bold text-[var(--home-muted)] font-display tracking-[0.2em] leading-tight text-left">
                            <span className="block text-[var(--home-ink)]">身份鎖定描述</span>
                        </label>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleGenerateLockedDescriptor}
                            disabled={isGeneratingDescriptor}
                            className="text-[10px] text-[var(--color-brass)] font-bold flex items-center gap-2 hover:opacity-80 transition-all disabled:opacity-30"
                        >
                            {isGeneratingDescriptor ? (
                                <div className="w-3 h-3 border-2 border-brass border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <span className="flex items-center gap-1.5 underline decoration-[0.5px] underline-offset-4">AI 草擬身分盒</span>
                            )}
                        </motion.button>
                    </div>
                    <textarea 
                        className="w-full h-24 bg-[rgba(255,255,255,.5)] border border-[var(--home-line)] rounded-xl p-3 text-[11px] text-[var(--home-muted)] focus:border-brass focus:outline-none transition-all resize-none leading-relaxed placeholder:text-[var(--home-muted)] font-mono scrollbar-none"
                        placeholder="描述這個 IP 的核心視覺特徵（英文），例如面部細節、骨架神韻等，這是維持生圖一致性的關鍵。"
                        value={formState.persona.locked_descriptor}
                        onChange={e => handlePersonaUpdate('locked_descriptor', e.target.value)}
                    />
                    <p className="text-[9px] text-[var(--home-muted)] leading-relaxed">
                        * 身份鎖定是維護 IP 視覺一致性的最高級位字串。建議使用 AI 根據目前設定草擬後，再進行手動精煉。
                    </p>
                </div>

                {/* Style Archetypes (矩陣 v2.0) */}
                <div className="pt-4 border-t border-[var(--home-line)]">
                    <label className="block text-[11px] font-bold text-[var(--home-muted)] mb-3 flex justify-between items-center font-display tracking-[0.2em]">
                        <span className="text-[var(--home-ink)]">風格原型偏好</span>
                        <span className="text-[9px] text-[var(--color-brass)] opacity-60">用於智慧穿搭路由</span>
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
                                        ? 'bg-brass text-black border-brass shadow-[0_0_15px_rgba(var(--color-brass-rgb),0.3)]' 
                                        : 'bg-[rgba(255,255,255,.4)] text-[var(--home-muted)] border-[var(--home-line)] hover:border-brass/50'
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
            <Card className="p-0 overflow-hidden border-none home-card">
              <div className="p-5 border-b border-[var(--home-line)] bg-gradient-to-r from-[var(--color-brass)]/5 to-transparent flex justify-between items-center group">
                <h3 className="text-sm font-bold text-[var(--home-ink)] tracking-[0.2em] flex items-center gap-3">
                  <div className="w-1 h-4 bg-brass"></div>
                  <span className="group-hover:text-[var(--color-brass)] transition-colors">生理特徵</span>
                </h3>
              </div>
              <div className="p-6 space-y-7">
                    <div className={getFieldClass('archetype')}>
                        <div className="flex justify-between items-center mb-4 min-h-[2.5rem]">
                            <label className="text-[11px] font-bold text-[var(--home-muted)] tracking-[0.2em] text-left flex flex-col leading-tight">
                                <span className="text-[var(--home-ink)]">臉部原型</span>
                            </label>
                            {faceReferences.length > 0 && (
                                <motion.div 
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="flex items-center gap-2 bg-brass/20 border border-brass/40 px-4 py-1.5 rounded-full font-bold shadow-[0_0_25px_rgba(var(--color-brass-rgb),0.2)]"
                                >
                                    <div className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brass opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-brass"></span>
                                    </div>
                                    <span className="text-[10px] text-[var(--color-brass)] tracking-widest">身份已鎖定</span>
                                </motion.div>
                            )}
                        </div>
                        <div className="relative group">
                            {faceReferences.length > 0 && (
                                <div className="absolute inset-0 z-20 cursor-not-allowed bg-[rgba(255,250,242,.9)] rounded-xl flex items-center justify-center border border-brass/20">
                                   <span className="text-[10px] text-[var(--color-brass)] font-bold tracking-widest opacity-80">參考圖優先模式已開啟</span>
                                </div>
                            )}
                            <Select 
                                options={filteredFaceArchetypes} 
                                value={faceReferences.length > 0 ? 'identity_lock' : formState.archetype} 
                                onChange={e => {
                                    const newArchetype = e.target.value;
                                    const styleMap = FACE_ARCHETYPE_STYLE_MAP[newArchetype];
                                    if (styleMap && newArchetype !== 'identity_lock') {
                                        setFormState(prev => ({
                                            ...prev,
                                            archetype: newArchetype,
                                            aestheticStyle: styleMap.aestheticStyle,
                                            skinFinish: styleMap.skinFinish,
                                            makeupStyle: styleMap.makeupStyle
                                        }));
                                    } else {
                                        handleFormChange('archetype', newArchetype);
                                    }
                                }} 
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
                        className="p-4 bg-[rgba(255,255,255,.4)] rounded-xl border border-[var(--home-line)] space-y-3 overflow-hidden"
                    >
                        <div className="flex justify-between items-start">
                            <label className="text-[10px] font-bold text-[var(--color-brass)] tracking-wider text-left flex flex-col leading-tight">
                                <span>面部特徵參考圖</span>
                            </label>
                            <span className="text-[10px] text-[var(--home-muted)] font-mono pt-1">{faceReferences.length}/10</span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                            {faceReferencePreviews.map((url, idx) => (
                                <div key={idx} className="relative min-w-[70px] h-[70px] rounded-lg overflow-hidden border border-[var(--home-line)] group flex-shrink-0">
                                    <img src={url} className="w-full h-full object-cover" />
                                    <button onClick={() => removeFaceReference(idx)} className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[var(--home-ink)] transition-opacity">&times;</button>
                                </div>
                            ))}
                            {faceReferences.length < 10 && (
                                <label htmlFor="face-ref-final" className="min-w-[70px] h-[70px] bg-[rgba(255,255,255,.5)] border border-dashed border-[var(--home-line)] rounded-lg flex items-center justify-center cursor-pointer hover:border-brass transition-all flex-shrink-0">
                                    <PhotoIcon className="w-5 h-5 text-[var(--home-muted)]" />
                                </label>
                            )}
                        </div>
                        <input id="face-ref-final" type="file" className="hidden" accept="image/*" multiple onChange={handleFaceReferenceChange} />
                        <p className="text-[9px] text-[var(--home-muted)] text-center">建議上傳多角度清晰正臉照，以獲得最佳特徵鎖定效果</p>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {isExpertMode && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6 overflow-hidden">
                    <div className="space-y-3">
                        <label className="block text-[11px] font-bold text-[var(--home-muted)] tracking-[0.2em] flex flex-col leading-tight">
                            <span className="text-[var(--home-ink)]">網美等級</span>
                        </label>
                        <div className="flex gap-2">
                            {[
                                { level: 1, label: '自然路人' },
                                { level: 2, label: '天然網美' },
                                { level: 3, label: '精修偶像' }
                            ].map(({ level, label }) => (
                                <button
                                    key={level}
                                    onClick={() => handleFormChange('netRedLevel', level)}
                                    className={`flex-1 py-2.5 rounded-xl border text-center transition-all ${
                                        formState.netRedLevel === level
                                            ? 'bg-brass text-black border-brass shadow-xl shadow-[var(--color-brass)]/20'
                                            : 'bg-[rgba(255,255,255,.4)] text-[var(--home-muted)] border-[var(--home-line)] hover:border-[var(--home-line-strong)]'
                                    }`}
                                >
                                    <div className="text-[11px] font-bold">{label}</div>
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

                <div className="space-y-4 pt-2 border-t border-[var(--home-line)]">
                    <Select label="體態選項 (Physique)" options={PROPORTION_MODE_OPTIONS} value={formState.proportionMode} onChange={e => handlePhysiqueChange(e.target.value)} />
                    <Slider label="身高 (Height)" min={150} max={200} unit="cm" value={formState.height} onChange={e => handleFormChange('height', Number(e.target.value))} />
                </div>
              </div>
            </Card>

            {/* 3. 環境與足跡 (Life Circuit) */}
            <Card className="p-0 overflow-hidden border-none home-card">
              <div className="p-5 border-b border-[var(--home-line)] bg-gradient-to-r from-[var(--color-brass)]/5 to-transparent group">
                <h3 className="text-sm font-bold text-[var(--home-ink)] tracking-[0.2em] flex items-center gap-3">
                  <div className="w-1 h-4 bg-brass"></div>
                  <span className="group-hover:text-[var(--color-brass)] transition-colors">環境與足跡</span>
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
                        <label className="block text-[11px] font-bold text-[var(--home-muted)] mb-3 min-h-[2.5rem] font-display tracking-[0.2em] leading-tight text-left">
                            <span className="block text-[var(--home-ink)]">職業身分</span>
                        </label>
                        <input type="text" className="w-full bg-[rgba(255,255,255,.5)] border border-[var(--home-line)] rounded-xl p-3 text-sm focus:border-brass focus:outline-none transition-all" placeholder="如：藝術家、創作者" value={formState.persona.profession} onChange={e => handlePersonaUpdate('profession', e.target.value)} />
                    </div>
                    <Select label="核心興趣 (INTERESTS)" options={INTEREST_OPTIONS} value={formState.lifeCircuit.interests?.[0] || ''} onChange={e => handleCircuitUpdate('interests', [e.target.value])} />
                </div>
              </div>
            </Card>

            {/* 生活細節 (Life Details) - 選填 */}
            <Card className="p-0 overflow-hidden border-none home-card">
              <div className="p-5 border-b border-[var(--home-line)] bg-gradient-to-r from-[var(--color-brass)]/5 to-transparent group">
                <h3 className="text-sm font-bold text-[var(--home-ink)] tracking-[0.2em] flex items-center gap-3">
                  <div className="w-1 h-4 bg-brass"></div>
                  <span className="group-hover:text-[var(--color-brass)] transition-colors">生活細節（選填）</span>
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-5">
                    <div className={getFieldClass('pet')}>
                        <label className="block text-[11px] font-bold text-[var(--home-muted)] mb-3 min-h-[2.5rem] font-display tracking-[0.2em] leading-tight text-left">
                            <span className="block text-[var(--home-ink)]">寵物</span>
                        </label>
                        <input 
                            type="text" 
                            className="w-full bg-[rgba(255,255,255,.5)] border border-[var(--home-line)] rounded-xl p-3 text-sm focus:border-brass focus:outline-none transition-all placeholder:text-[var(--home-muted)]" 
                            placeholder="例：橘貓 Mochi、柴犬 Koko" 
                            value={formatPetAnchor(formState.worldAnchors?.pet)} 
                            onChange={e => handlePetAnchorUpdate(e.target.value)} 
                        />
                    </div>
                    <div className={getFieldClass('iconicItems')}>
                        <label className="block text-[11px] font-bold text-[var(--home-muted)] mb-3 min-h-[2.5rem] font-display tracking-[0.2em] leading-tight text-left">
                            <span className="block text-[var(--home-ink)]">標誌性物品</span>
                        </label>
                        <input 
                            type="text" 
                            className="w-full bg-[rgba(255,255,255,.5)] border border-[var(--home-line)] rounded-xl p-3 text-sm focus:border-brass focus:outline-none transition-all placeholder:text-[var(--home-muted)]" 
                            placeholder="例：總是帶著的底片相機、特定款式耳環" 
                            value={formState.worldAnchors?.iconicItems[0]?.name || ''} 
                            onChange={e => handleIconicItemsUpdate(e.target.value)} 
                        />
                    </div>
                </div>
              </div>
            </Card>

            {/* 4. 專業服裝系統 (Apparel Curation) */}
            <Card className="p-0 overflow-hidden border-none home-card">
              <div className="p-5 border-b border-[var(--home-line)] bg-gradient-to-r from-[var(--color-brass)]/5 to-transparent">
                <h3 className="text-sm font-bold text-[var(--home-ink)] tracking-[0.2em] flex items-center gap-3">
                  <div className="w-1 h-4 bg-brass"></div>
                  <span className="group-hover:text-[var(--color-brass)] transition-colors">專業服裝系統</span>
                </h3>
              </div>
              <div className="p-6 space-y-6">
                  {/* 分類 Tab */}
                  <div className="flex gap-2 bg-[rgba(255,255,255,.5)] p-1.5 rounded-2xl border border-[var(--home-line)] mb-4">
                      {APPAREL_CATEGORIES.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => setActiveApparelCat(cat.id)}
                            className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all duration-300 relative overflow-hidden ${activeApparelCat === cat.id ? 'bg-brass text-black shadow-[0_4px_20px_rgba(var(--color-brass-rgb),0.3)]' : 'text-[var(--home-muted)] hover:text-[var(--home-muted)] hover:bg-[rgba(255,255,255,.4)]'}`}
                          >
                              <span className="relative z-10">{cat.label.split(' (')[0]}</span>
                              {activeApparelCat === cat.id && (
                                  <motion.div
                                    layoutId="apparel-tab-glare"
                                    className="absolute inset-0 bg-[rgba(255,255,255,.25)] pointer-events-none"
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
                                    className={`p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group/item flex flex-col justify-between h-[82px] ${isSelected ? 'bg-brass/15 border-brass/60 text-[var(--color-brass)] ring-1 ring-[var(--color-brass)]/30' : 'bg-[rgba(255,255,255,.4)] border-[var(--home-line)] text-[var(--home-muted)] hover:border-[var(--home-line-strong)] hover:bg-[rgba(255,255,255,.55)]'}`}
                                >
                                    <div className="flex flex-col gap-0.5 relative z-10">
                                        <span className={`text-[11px] font-bold tracking-tight leading-tight ${isSelected ? 'text-[var(--home-ink)]' : ''}`}>{item.label.split(' (')[0]}</span>
                                    </div>

                                    <div className="flex justify-end items-center mt-auto relative z-10">
                                       {isSelected && (
                                            <motion.div
                                                layoutId={`check-${item.id}`}
                                                className="w-1.5 h-1.5 bg-brass rounded-full shadow-[0_0_10px_var(--color-brass)]"
                                            />
                                       )}
                                    </div>

                                    {/* 裝飾線條 */}
                                    <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-white/10 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none -mr-8 -mt-8 rotate-45`} />

                                    {isSelected && (
                                        <motion.div 
                                            layoutId={`bg-active-${item.id}`}
                                            className="absolute inset-0 bg-gradient-to-t from-[var(--color-brass)]/10 to-transparent pointer-events-none" 
                                        />
                                    )}
                                </motion.button>
                            );
                        })
                      }
                    </motion.div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--home-line)]">
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
                  
                  <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${formState.isMultiAngle ? 'bg-brass/10 border-brass/30' : 'bg-[rgba(255,255,255,.4)] border-[var(--home-line)]'}`}>
                      <div className="flex flex-col items-start text-left">
                          <span className="text-[11px] font-bold text-[var(--home-ink)] tracking-wider">多視角同步生成</span>
                          <span className="text-[9px] text-[var(--home-muted)] mt-1">一次產出 4-6 個不同角度的同型人物</span>
                      </div>
                      <button 
                        onClick={() => handleFormChange('isMultiAngle', !formState.isMultiAngle)}
                        className={`w-12 h-6 rounded-full transition-all relative ${formState.isMultiAngle ? 'bg-brass' : 'bg-[rgba(255,255,255,.5)]'}`}
                      >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formState.isMultiAngle ? 'left-7 shadow-lg' : 'left-1'}`}></div>
                      </button>
                  </div>

                  <div className="space-y-4">
                      <div className="flex justify-between items-start">
                          <h4 className="text-[10px] font-bold text-[var(--home-muted)] flex flex-col items-start leading-tight">
                              <span>生活感強度</span>
                          </h4>
                          <span className="text-[10px] font-bold text-[var(--color-brass)] pt-1">LV.{formState.fidelityScale}</span>
                      </div>
                      <div className="flex gap-2">
                          {[1,2,3,4,5].map(lvl => (
                              <button key={lvl} onClick={() => handleFormChange('fidelityScale', lvl)} className={`flex-1 h-10 rounded-xl border text-[10px] font-bold transition-all ${formState.fidelityScale === lvl ? 'bg-brass text-black border-brass shadow-xl shadow-[var(--color-brass)]/20' : 'bg-[rgba(255,255,255,.4)] text-[var(--home-muted)] border-[var(--home-line)]'}`}>
                                  {lvl === 1 ? '影棚' : lvl === 3 ? '街頭' : lvl === 5 ? '隨手' : lvl}
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
                className="home-btn-primary w-full py-5 rounded-2xl flex flex-col items-center gap-1 group relative overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(255,255,255,.2)] to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
                <span className="text-base font-black tracking-widest relative z-10 flex items-center gap-2">
                    {isLoading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-[rgba(255,250,242,.4)] border-t-[var(--home-paper)] rounded-full animate-spin"></div>
                            <span>時空傳送中...</span>
                        </>
                    ) : (
                        '開啟時空膠囊'
                    )}
                </span>
                <span className="text-[9px] opacity-70 tracking-[0.3em] font-light relative z-10">建構專屬 IP 人格</span>

                {isLoading && (
                   <motion.div
                     initial={{ scaleX: 0 }}
                     animate={{ scaleX: 1 }}
                     transition={{ duration: 3, ease: "easeInOut" }}
                     className="absolute bottom-0 left-0 right-0 h-1 bg-[rgba(255,255,255,.3)] origin-left"
                   />
                )}
            </motion.button>
            </>)}
        </div>

        {/* Right Column: Preview */}
        <div className={`lg:col-span-7 xl:col-span-8 flex flex-col gap-6 ${mobileTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-[rgba(155,61,54,0.08)] border border-danger/20 rounded-2xl text-danger text-sm flex flex-col gap-2"
                >
                    <div className="flex items-center gap-2 font-bold tracking-tight">
                        <span>傳送發生異常</span>
                    </div>
                    <p className="opacity-80 leading-relaxed font-mono text-[11px] bg-[rgba(255,255,255,.4)] p-3 rounded-lg border border-[var(--home-line)]">{error}</p>
                    <button
                        onClick={() => setError(null)}
                        className="text-[10px] font-bold text-danger/70 hover:text-danger self-end mt-1 underline"
                    >
                        關閉提示
                    </button>
                </motion.div>
            )}
            
            <Card className="flex-1 min-h-[500px] border-none home-card p-8">
               <div className="flex justify-between items-start mb-8 border-b border-[var(--home-line)] pb-4">
                  <h3 className="text-xl font-bold tracking-widest text-[var(--home-ink)] flex flex-col items-start leading-tight">
                    <span>結果預覽</span>
                  </h3>
                  <div className="text-[10px] text-[var(--home-muted)] font-mono pt-2">數量：{generatedModels.length}</div>
               </div>
               
               {generatedModels.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       <AnimatePresence>
                           {generatedModels.map((model, idx) => (
                               <motion.div key={model.id} initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="group relative">
                                   <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-[var(--home-line)] bg-[rgba(255,255,255,.5)]">
                                       <AsyncImage src={model.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end gap-3 translate-y-4 group-hover:translate-y-0 transition-transform">
                                          <Button
                                            onClick={() => handleSaveToLounge(model)}
                                            variant="primary"
                                            className="w-full py-2 text-[10px] font-bold"
                                            disabled={savedModelIds.has(model.id)}
                                          >
                                            {savedModelIds.has(model.id) ? '已儲存' : '儲存休息室'}
                                          </Button>

                                          {savedModelIds.has(model.id) && (
                                            <motion.button
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                onClick={onGoHome}
                                                className="w-full py-2 bg-white/10 hover:bg-brass text-[10px] font-bold text-[var(--color-brass)] hover:text-black rounded-lg border border-brass/20 transition-all"
                                            >
                                                前往 IP 休息室
                                            </motion.button>
                                          )}

                                          <div className="flex gap-2">
                                              <button onClick={() => setPreviewingModelIndex(idx)} className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-[10px] font-bold text-white transition-colors">放大</button>
                                              <button onClick={() => handleDownload(model)} className="px-3 bg-white/10 hover:bg-white/20 rounded-lg text-white"><DownloadIcon className="w-3 h-3" /></button>
                                          </div>
                                       </div>
                                   </div>
                               </motion.div>
                           ))}
                       </AnimatePresence>
                   </div>
               ) : (
                   <div className="h-[400px] flex flex-col items-center justify-center border border-dashed border-[var(--home-line)] rounded-3xl opacity-30">
                       <PhotoIcon className="w-16 h-16 mb-4 text-[var(--home-ink)]" />
                       <p className="text-lg tracking-widest text-[var(--home-ink)]">等待初始化...</p>
                       <p className="text-xs mt-2">請於左側面板設定參數後點擊生成</p>
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
