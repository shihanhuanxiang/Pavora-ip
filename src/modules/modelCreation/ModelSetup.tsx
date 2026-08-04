
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Model, WorldAnchors } from '../../shared/types/types';
import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
import Select from '../../shared/components/common/Select';
import Loader from '../../shared/components/common/Loader';
import TabBar, { type TabItem } from '../../shared/components/common/TabBar';
import { generateModels } from './services/modelCreationService';
import { getFriendlyErrorMessage, fileToBase64 } from '../../shared/services/geminiService';
import { downloadImage } from '../../shared/utils/imageUtils';
import PhotoIcon from '../../shared/assets/icons/PhotoIcon';
import ImagePreviewModal from '../../shared/components/common/ImagePreviewModal';
import { useModelStore } from '../../shared/stores/useModelStore';
import { useBrandStore } from '../../shared/stores/useBrandStore';
import AsyncImage from '../../shared/components/common/AsyncImage';
import DownloadIcon from '../../shared/assets/icons/DownloadIcon';
import ModelIcon from '../../shared/assets/icons/ModelIcon';
import View360Icon from '../../shared/assets/icons/View360Icon';
import { useNotification } from '../../shared/context/NotificationContext';
import { embedMetadata } from '../../shared/utils/metadataUtils';
import { motion, AnimatePresence } from 'motion/react';
import {
    GENDER_PRESETS, APPAREL_CATEGORIES, APPAREL_ITEMS,
    FACE_ARCHETYPES, FACE_ARCHETYPE_STYLE_MAP, SKIN_TONE_OPTIONS, SKIN_FINISH_OPTIONS, MAKEUP_STYLE_OPTIONS,
    PROPORTION_MODE_OPTIONS, PROPORTION_DEFAULTS,
    FEMALE_HAIR_LENGTH_OPTIONS, FEMALE_HAIR_STYLE_OPTIONS, FEMALE_HAIR_BANG_OPTIONS,
    MALE_HAIR_LENGTH_OPTIONS, MALE_HAIR_STYLE_OPTIONS, MALE_HAIR_BANG_OPTIONS,
    SMART_SUGGEST_PRESETS, ModelGenerationDefaults, EYE_SHAPE_OPTIONS, IP_NAME_POOL
} from '../../shared/constants/constants';

import { useTaxonomy } from '../../shared/hooks/useTaxonomy';
import Slider from '../../shared/components/common/Slider';

// 2026-08-03（企劃案 B-4a）已移除兩項死代碼：
// 1. `import DeepApparelSelector` —— 只 import、從未渲染。
// 2. `const DESTINATIONS` —— 本檔宣告後從未使用。
//    （ModelLounge.tsx 與 ModelActionMenu.tsx 各有自己的同名常數，那兩份是活的；
//     未來要收斂成一份請走 navRegistry，見 C 區 00-17。）

// 2026-08-03（企劃案 B-4b）：'soul' 已移除，四個頁籤縮為三個。
type ModelSetupTabKey = 'face' | 'body' | 'apparel';

/** 主頁籤。「基礎穿著」＝打底裝，刻意極簡貼身，見 CLAUDE.md 第 7 節架構原則第 3 條。 */
const MODEL_SETUP_TABS: readonly TabItem<ModelSetupTabKey>[] = [
    { key: 'face', label: '臉部' },
    { key: 'body', label: '身形' },
    { key: 'apparel', label: '基礎穿著' },
];

/** 基礎穿著分頁內的分類子頁籤。label 沿用原本的 `split(' (')[0]`，只顯示中文段。 */
const APPAREL_CAT_TABS: readonly TabItem<string>[] = APPAREL_CATEGORIES.map(cat => ({
    key: cat.id,
    label: cat.label.split(' (')[0],
}));

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
  // 2026-08-02：原本這裡解構了 projectMode，但整個檔案從未使用它（死變數）。
  // 隨「商業／IP 創作模式」一併移除。

  // 2026-08-03（企劃案 B-4a）：只保留 loading 旗標。
  // masterTaxonomy / apparelStructure 在本檔解構後從未被使用——它們是給
  // DeepApparelSelector 用的，而那個元件在這裡只被 import、從未渲染（已一併移除 import）。
  const { loading: taxonomyLoading } = useTaxonomy();

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
      // 2026-08-03（企劃案 B-4a）：移除 lockToAmbassador。
      // 它在 ApparelDesign / SceneGeneration 是活的，但在本檔宣告後從未被讀取。
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
      // 2026-08-03（企劃案 B-4c）：固定在最乾淨的影棚檔（原本預設 3 ＝街頭）。
      // 定妝照是素材不是成品，越乾淨越好去背、越好重新打光。滑桿已移除。
      fidelityScale: 1,
      dofIntensity: 50,
      // 2026-08-03（企劃案 B-4a）：移除 sceneAnchor。
      // 全 repo 僅此一處出現，沒有任何讀取端，也不進 prompt——純垃圾。
  });

  const [isExpertMode, setIsExpertMode] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showFaceAdvanced, setShowFaceAdvanced] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState('custom');
  const [faceReferences, setFaceReferences] = useState<File[]>([]);
  const [faceReferencePreviews, setFaceReferencePreviews] = useState<string[]>([]);
  const [highlightedFields, setHighlightedFields] = useState<Set<string>>(new Set());
  const [generationQuality, setGenerationQuality] = useState<QualityLevel>('standard');
  const [mobileTab, setMobileTab] = useState<'settings' | 'preview'>('settings');
  const [activeTab, setActiveTab] = useState<ModelSetupTabKey>('face');
  const [isPresetBannerOpen, setIsPresetBannerOpen] = useState(false);
  const [activeApparelCat, setActiveApparelCat] = useState('full_set');

  // A7: Use a ref to track the latest formState to avoid stale closures in async callbacks (like setTimeout)
  const formStateRef = useRef(formState);
  useEffect(() => {
    formStateRef.current = formState;
  }, [formState]);

  /**
   * 滑桿數值的視覺分級。
   *
   * 2026-08-04（企劃案 B-7 驗收修正）：門檻改為對齊 prompt 的實際檔位邊界。
   *
   * 原本 bustTension 是 `>85 紅 / >65 黃`，而 prompt 的四檔邊界是 25/50/75。
   * 兩者對不上的後果：`bt=60` 與 `bt=70` 送出的 prompt **逐字元完全相同**
   * （都落 LEVEL 3），UI 卻一個綠一個黃——那是在教使用者一個不存在的因果。
   * physiqueCurvature 同病（原 >90/>75，實際邊界 30/55/75）。
   *
   * 另外把語意改對：這兩支滑桿的高檔位**不代表危險**。第五輪測試最高檔
   * 7/7 全部順利產出（見企劃案 B-7 實測結論），把它染紅並暗示「會被擋」
   * 與唯一的實測證據相反。現在顏色只表示「檔位高低」，
   * 對應的說明文字也不再做任何風險承諾。
   */
  const getSafetyStatus = useCallback((field: string, value: number): 'safe' | 'warning' | 'risky' => {
      // 2026-08-04：移除 `field === 'bust'` 分支（原 105/95 門檻）。
      // 三圍數字自 2026-07-19（P2①）起已不進 prompt，也沒有對應滑桿，
      // 這個分支全檔零呼叫端——現在只有 physiqueCurvature 與 bustTension 兩個呼叫點。

      // 對齊 prompts/modelCreation.ts 的 femaleBodice 四檔邊界（25 / 50 / 75）
      if (field === 'bustTension') {
          if (value > 75) return 'risky';   // LEVEL 4
          if (value > 50) return 'warning'; // LEVEL 3
      }
      // 對齊 femaleContour 的四段邊界（30 / 55 / 75）
      if (field === 'physiqueCurvature') {
          if (value > 75) return 'risky';
          if (value > 55) return 'warning';
      }
      return 'safe';
  }, []);

  /**
   * 2026-08-04（企劃案 B-7f 驗收修正）：滑桿的檔位標籤。
   *
   * 邊界必須與 `prompts/modelCreation.ts` 的 `femaleBodice`（25／50／75）
   * 與 `femaleContour`（30／55／75）完全一致 —— 兩者邊界不同，不能共用一份。
   * 顯示「第 N 檔 / 4」比顏色可靠：同一檔內移動不會改變 prompt，使用者看得到。
   */
  const getTierLabel = useCallback((field: string, value: number): string | undefined => {
      if (field === 'bustTension') {
          const t = value <= 25 ? 1 : value <= 50 ? 2 : value <= 75 ? 3 : 4;
          return `第 ${t} 檔 / 4`;
      }
      if (field === 'physiqueCurvature') {
          const t = value <= 30 ? 1 : value <= 55 ? 2 : value <= 75 ? 3 : 4;
          return `第 ${t} 檔 / 4`;
      }
      return undefined;
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
            vTaperScale: inheritedModel.advancedStats?.vTaperScale ?? prev.vTaperScale,
            // 2026-08-04（企劃案 B-6）：頭身比回填。舊資料沒有此欄位，`??` 會落回現值。
            headBodyRatio: inheritedModel.advancedStats?.headBodyRatio ?? prev.headBodyRatio
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

  // ── 以下區塊已於 2026-08-03 移除（企劃案 D-10 / B-4b 收尾）──────────────
  // 「靈魂人設」tab 的 JSX 在同日被移除後，這批函式全部失去呼叫端。
  // 依 fresh-context agent 產出的完整呼叫圖逐一確認為零引用後切除：
  //   handlePersonaUpdate / handlePetAnchorUpdate / handleIconicItemsUpdate /
  //   handleCircuitUpdate / handleAutoGeneratePersona / handleGenerateLockedDescriptor /
  //   handleRandomize，以及 parsePetAnchor 與 isGeneratingPersona /
  //   isGeneratingDescriptor 兩組從未被 JSX 消費的 state。
  //
  // 去向（Hank 2026-08-03 拍板）：
  //   ·「AI 草擬身分盒」(handleGenerateLockedDescriptor) → 直接刪除。
  //     它產出的 locked_descriptor 在生成完成後會被 generateFacialDescriptor
  //     依實際生成的臉重新分析並覆寫，是設計上的矛盾。
  //   ·「隨機靈感」(handleRandomize) → 搬到 ModelLounge 的 ModelIdentityEditor，
  //     只保留人設那半（核心氛圍／MBTI／語氣／發文習慣／生活圈），
  //     並帶走 handleAutoGeneratePersona（AI 深度人設補完）——少了它隨機靈感
  //     只是亂數填空。外觀那半（臉部原型／美學風格／服裝／髮色／體型）不搬，
  //     因為那些屬於模特兒生成的保留範圍，未來若要在此重建隨機化再議。
  // ────────────────────────────────────────────────────────────────────
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
                    // 2026-08-04（企劃案 B-6）：頭身比一併從嵌入的中繼資料還原。
                    headBodyRatio: meta.advancedStats?.headBodyRatio ?? prev.headBodyRatio,
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
        // 服裝對應：PR-D（2026-08-01）後，20 組 SMART_SUGGEST_PRESETS 的 outfitPresetId
        // 已全數對得上 APPAREL_ITEMS 的實際 id，正常情況下都會走 matchedOutfit 分支。
        // 下方 find 保留為防禦性檢查：日後新增預設卡若填錯 id，只跳過服裝欄位、其餘欄位照套，不整組失效。
        const { outfitPresetId, label: _presetLabel, ...presetFields } = preset;
        const matchedOutfit = APPAREL_ITEMS.find(item => item.id === outfitPresetId);

        setFormState(prev => ({
            ...prev,
            ...presetFields,
            ...(matchedOutfit ? { outfitItems: [matchedOutfit.id] } : {}),
            // 資料 bug 修正 (b)：套用預設不覆蓋核心身分列的姓名，姓名維持使用者輸入
            name: prev.name
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
        <div className={`lg:col-span-5 xl:col-span-4 space-y-6 pb-28 ${mobileTab === 'settings' ? 'block' : 'hidden lg:block'}`}>

            {/* 核心身分列 (常駐：不論切到哪個 tab 都顯示，姓名/性別/年齡從靈魂藍圖卡搬出；瘦身為單行緊湊排列) */}
            <Card className="p-0 overflow-hidden border-none home-card">
              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                <div className={getFieldClass('name')}>
                    <label className="block text-[11px] font-bold text-[var(--home-muted)] mb-1.5 flex justify-between items-center font-display tracking-[0.2em] text-left">
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
                    <input type="text" className="w-full bg-[rgba(255,255,255,.5)] border border-[var(--home-line)] rounded-xl p-2.5 text-sm focus:border-brass focus:ring-1 focus:ring-[var(--color-brass)]/20 focus:outline-none transition-all placeholder:text-[var(--home-muted)]" placeholder="輸入 IP 角色姓名" value={formState.name} onChange={e => handleFormChange('name', e.target.value)} />
                </div>
                <Select label="生理性別 (GENDER)" options={GENDER_PRESETS} value={formState.gender} onChange={e => handleGenderChange(e.target.value)} />
                <div className={getFieldClass('age')}>
                    <Slider
                        label="年齡 (AGE)"
                        unit="歲"
                        min={20}
                        max={60}
                        value={formState.age}
                        onChange={e => handleFormChange('age', Number(e.target.value))}
                    />
                </div>
              </div>
            </Card>

            {/* 快速預設橫幅 (SMART_SUGGEST_PRESETS 20 組，可摺疊) */}
            <Card className="p-0 overflow-hidden border-none home-card">
              <button
                type="button"
                onClick={() => setIsPresetBannerOpen(prev => !prev)}
                className="w-full p-5 border-b border-[var(--home-line)] bg-gradient-to-r from-[var(--color-brass)]/5 to-transparent flex justify-between items-center group"
              >
                <h3 className="text-sm font-bold text-[var(--home-ink)] tracking-[0.2em] flex items-center gap-3">
                  <div className="w-1 h-4 bg-brass"></div>
                  <span className="group-hover:text-[var(--color-brass)] transition-colors">快速預設</span>
                </h3>
                <span className="text-[10px] text-[var(--color-brass)] font-bold">{isPresetBannerOpen ? '收合 ▲' : '展開 ▼'}</span>
              </button>
              <AnimatePresence>
                {isPresetBannerOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {Object.entries(SMART_SUGGEST_PRESETS).map(([presetKey, preset]) => (
                                <button
                                    key={presetKey}
                                    onClick={() => applyBasePreset(presetKey)}
                                    className={`p-3 rounded-xl border text-left transition-all ${selectedPresetId === presetKey ? 'bg-brass text-black border-brass shadow-[0_4px_20px_rgba(var(--color-brass-rgb),0.3)]' : 'bg-[rgba(255,255,255,.4)] border-[var(--home-line)] text-[var(--home-muted)] hover:border-brass/50'}`}
                                >
                                    <span className="text-[10px] font-bold leading-tight block">{(preset as any).label}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Tab 列 (臉部 / 身形 / 靈魂人設 / 基礎穿著) */}
            <TabBar
                tabs={MODEL_SETUP_TABS}
                active={activeTab}
                onChange={setActiveTab}
                layoutId="model-setup-tab-glare"
                size="md"
                sticky
            />

            {/* ===== TAB: 臉部 ===== */}
            {activeTab === 'face' && (
              <>
                {/* 0. 臉部來源 (Face Source) */}
                <Card className="p-0 overflow-hidden border-none home-card">
                  <div className="p-5 border-b border-[var(--home-line)] bg-gradient-to-r from-[var(--color-brass)]/5 to-transparent flex justify-between items-center group">
                    <h3 className="text-sm font-bold text-[var(--home-ink)] tracking-[0.2em] flex items-center gap-3">
                      <div className="w-1 h-4 bg-brass"></div>
                      <span className="group-hover:text-[var(--color-brass)] transition-colors">臉部來源</span>
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
                  </div>
                </Card>

                {/* 膚色與髮色 (原生理特徵卡搬移至臉部 tab) */}
                <Card className="p-0 overflow-hidden border-none home-card">
                  <div className="p-5 border-b border-[var(--home-line)] bg-gradient-to-r from-[var(--color-brass)]/5 to-transparent flex justify-between items-center group">
                    <h3 className="text-sm font-bold text-[var(--home-ink)] tracking-[0.2em] flex items-center gap-3">
                      <div className="w-1 h-4 bg-brass"></div>
                      <span className="group-hover:text-[var(--color-brass)] transition-colors">膚色與髮色</span>
                    </h3>
                  </div>
                  <div className="p-6 space-y-7">
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
                    <Select
                        label="髮型 (Hair Style)"
                        options={formState.gender === 'male' ? MALE_HAIR_STYLE_OPTIONS : FEMALE_HAIR_STYLE_OPTIONS}
                        value={formState.hairStyle}
                        onChange={e => handleFormChange('hairStyle', e.target.value)}
                    />
                  </div>
                </Card>

                {/* 進階微調：眼型／髮長／瀏海／膚質妝感／妝容風格 */}
                <Card className="p-0 overflow-hidden border-none home-card">
                  <div className="p-6">
                    <button
                        type="button"
                        onClick={() => setShowFaceAdvanced(!showFaceAdvanced)}
                        className="w-full flex justify-between items-center py-1 group"
                    >
                        <span className="text-[11px] font-bold text-[var(--home-ink)] tracking-[0.2em] group-hover:text-[var(--color-brass)] transition-colors">進階微調</span>
                        <span className="text-[10px] font-bold text-[var(--color-brass)]">{showFaceAdvanced ? '收合 ▲' : '展開 ▼'}</span>
                    </button>
                    {showFaceAdvanced && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 overflow-hidden pt-5">
                          <div className="grid grid-cols-2 gap-4">
                              <Select
                                  label="眼型 (Eye Shape)"
                                  options={EYE_SHAPE_OPTIONS}
                                  value={formState.eyeShape}
                                  onChange={e => handleFormChange('eyeShape', e.target.value)}
                              />
                              <Select
                                  label="髮長 (Hair Length)"
                                  options={formState.gender === 'male' ? MALE_HAIR_LENGTH_OPTIONS : FEMALE_HAIR_LENGTH_OPTIONS}
                                  value={formState.hairLength}
                                  onChange={e => handleFormChange('hairLength', e.target.value)}
                              />
                              <Select
                                  label="瀏海 (Bangs)"
                                  options={formState.gender === 'male' ? MALE_HAIR_BANG_OPTIONS : FEMALE_HAIR_BANG_OPTIONS}
                                  value={formState.hairBang}
                                  onChange={e => handleFormChange('hairBang', e.target.value)}
                              />
                              <Select
                                  label="膚質妝感 (Skin Finish)"
                                  options={formState.gender === 'male' ? SKIN_FINISH_OPTIONS.male : SKIN_FINISH_OPTIONS.female}
                                  value={formState.skinFinish}
                                  onChange={e => handleFormChange('skinFinish', e.target.value)}
                              />
                              <Select
                                  label="妝容風格 (Makeup Style)"
                                  options={formState.gender === 'male' ? MAKEUP_STYLE_OPTIONS.male : MAKEUP_STYLE_OPTIONS.female}
                                  value={formState.makeupStyle}
                                  onChange={e => handleFormChange('makeupStyle', e.target.value)}
                              />
                          </div>
                      </motion.div>
                    )}
                  </div>
                </Card>
              </>
            )}

            {/* ===== TAB: 身形 ===== */}
            {activeTab === 'body' && (
              <Card className="p-0 overflow-hidden border-none home-card">
                <div className="p-5 border-b border-[var(--home-line)] bg-gradient-to-r from-[var(--color-brass)]/5 to-transparent flex justify-between items-center group">
                  <h3 className="text-sm font-bold text-[var(--home-ink)] tracking-[0.2em] flex items-center gap-3">
                    <div className="w-1 h-4 bg-brass"></div>
                    <span className="group-hover:text-[var(--color-brass)] transition-colors">體態與比例</span>
                  </h3>
                </div>
                <div className="p-6 space-y-7">
                    <div className="space-y-4">
                        <Select label="體態選項 (Physique)" options={PROPORTION_MODE_OPTIONS} value={formState.proportionMode} onChange={e => handlePhysiqueChange(e.target.value)} />
                        <Slider label="身高 (Height)" min={150} max={200} unit="cm" value={formState.height} onChange={e => handleFormChange('height', Number(e.target.value))} />
                        {/* 2026-08-04（企劃案 B-6）：新增頭身比滑桿。
                            預設 7.5、範圍 6.5–8.5。真人約 7、時尚模特 8–8.5；
                            網紅 IP 用 7.5 較有真實感，超過 8.5 開始出現明顯 AI 感。
                            原本這個欄位只有預設值、完全沒有 UI，改也改不動。 */}
                        <Slider
                            label="頭身比 (Head-to-Body)"
                            tooltip="數字越大身材越修長。真人約 7 頭身、時尚模特 8–8.5。網紅 IP 建議 7.5，超過 8.5 會開始出現明顯的 AI 感。"
                            min={6.5}
                            max={8.5}
                            step={0.5}
                            unit="頭身"
                            value={formState.headBodyRatio}
                            onChange={e => handleFormChange('headBodyRatio', Number(e.target.value))}
                        />
                    </div>

                    {/* ===== 2026-08-04（企劃案 B-7a）：身材滑桿移出「進階微調」摺疊區 =====
                        原本這兩支滑桿藏在預設收合的摺疊區裡，使用者以為根本沒有這個功能。
                        上身輪廓經五輪 36 張實圖驗證確認可控（見企劃案 B-7 實測結論），
                        它是服裝試穿與網紅 IP 的核心需求，不該藏起來。 */}
                    <div className="pt-5 border-t border-[var(--home-line)] space-y-4">
                        <div>
                            <div className="text-[11px] font-bold text-[var(--home-ink)] tracking-[0.2em]">體型微調</div>
                            <p className="text-[9px] text-[var(--home-muted)] mt-1.5 leading-relaxed">
                                {formState.gender === 'female'
                                    ? '「體態曲線」決定腰臀線條，「上身輪廓」決定上身版型的飽滿程度。兩者分開控制：調整上身時，整體體型會被鎖住不變。'
                                    : '「肌肉線條」決定體格厚度，「肩背比例」決定肩寬與腰身的落差。'}
                            </p>
                        </div>
                        <div className="space-y-4">
                            {formState.gender === 'female' ? (
                                <>
                                    <Slider
                                        label="體態曲線"
                                        tooltip="腰臀線條的明顯程度。往右走腰線越明顯、肩臀落差越大。"
                                        min={0}
                                        max={100}
                                        unit="%"
                                        value={formState.physiqueCurvature}
                                        safetyStatus={getSafetyStatus('physiqueCurvature', formState.physiqueCurvature)}
                                        tierLabel={getTierLabel('physiqueCurvature', formState.physiqueCurvature)}
                                        onChange={e => handleFormChange('physiqueCurvature', Number(e.target.value))}
                                    />
                                    <Slider
                                        label="上身輪廓"
                                        tooltip="上身版型的飽滿程度，共四檔。系統會用服裝版型與布料張力的方式描述，不會動到整體體型。"
                                        min={0}
                                        max={100}
                                        unit="%"
                                        value={formState.bustTension}
                                        safetyStatus={getSafetyStatus('bustTension', formState.bustTension)}
                                        tierLabel={getTierLabel('bustTension', formState.bustTension)}
                                        onChange={e => handleFormChange('bustTension', Number(e.target.value))}
                                    />
                                </>
                            ) : (
                                <>
                                    <Slider
                                        label="肌肉線條"
                                        tooltip="體格厚度與肌肉輪廓的明顯程度。"
                                        min={0}
                                        max={100}
                                        unit="%"
                                        value={formState.muscularDensity}
                                        onChange={e => handleFormChange('muscularDensity', Number(e.target.value))}
                                    />
                                    <Slider
                                        label="肩背比例"
                                        tooltip="肩寬與腰身的落差。往右走肩線越寬、倒三角越明顯。"
                                        min={0}
                                        max={100}
                                        unit="%"
                                        value={formState.vTaperScale}
                                        onChange={e => handleFormChange('vTaperScale', Number(e.target.value))}
                                    />
                                </>
                            )}
                        </div>
                        {/* 2026-08-04（企劃案 B-7f）：補上滑桿變色的說明。
                            getSafetyStatus 早就會讓滑桿數值變黃變紅，但從來沒告訴使用者那代表什麼。
                            驗收修正：門檻已改為對齊 prompt 的四個檔位，文字也不再宣稱「會被擋」——
                            第五輪最高檔 7/7 全部順利產出，原本的風險警語與實測證據相反。 */}
                        {formState.gender === 'female' && (
                            <p className="text-[9px] text-[var(--home-muted)] leading-relaxed pt-1">
                                兩支滑桿各分四檔，數值方塊會直接顯示目前是<span className="font-bold">第幾檔</span>。
                                <span className="font-bold">同一檔內移動不會改變生成結果</span>，要看到差異請跨過檔位邊界。
                                兩者的邊界不同：上身輪廓在 25 / 50 / 75 分檔，體態曲線在 30 / 55 / 75 分檔。
                            </p>
                        )}
                    </div>

                    {/* 進階微調摺疊區：網美等級 + 精確體型約束開關（身材滑桿已於 B-7a 移出） */}
                    <div className="pt-4 border-t border-[var(--home-line)]">
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="w-full flex justify-between items-center py-1 group"
                        >
                            <span className="text-[11px] font-bold text-[var(--home-ink)] tracking-[0.2em] group-hover:text-[var(--color-brass)] transition-colors">進階微調</span>
                            <span className="text-[10px] font-bold text-[var(--color-brass)]">{showAdvanced ? '收合 ▲' : '展開 ▼'}</span>
                        </button>

                        {showAdvanced && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6 overflow-hidden pt-5">
                              {/* 網美等級（原本被 isExpertMode gate，改收進進階區） */}
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

                              {/* 精確體型約束（isExpertMode）：純顯示的 showAdvanced 不影響它，需使用者另外開啟 */}
                              <div className="pt-4 border-t border-[var(--home-line)] flex items-start justify-between gap-4">
                                  <div>
                                      <div className="text-[11px] font-bold text-[var(--home-ink)] tracking-[0.2em]">精確體型約束（專家）</div>
                                      <p className="text-[9px] text-[var(--home-muted)] mt-1.5 leading-relaxed">開啟後將嚴格套用上方體型設定進行生成，關閉時 AI 保有自然發揮空間。</p>
                                  </div>
                                  <button
                                      type="button"
                                      onClick={() => setIsExpertMode(!isExpertMode)}
                                      className={`shrink-0 px-4 py-1.5 rounded-full border text-[10px] font-bold transition-all ${isExpertMode ? 'bg-brass text-black border-brass' : 'border-[var(--home-line)] text-[var(--home-muted)] hover:border-brass'}`}
                                  >
                                      {isExpertMode ? '已開啟' : '已關閉'}
                                  </button>
                              </div>
                          </motion.div>
                        )}
                    </div>
                </div>
              </Card>
            )}

            {/* ===== 「靈魂人設」tab 已於 2026-08-03 整個移除（企劃案 B-4b／B-4f） =====
                Hank 拍板的保留標準：模特兒生成「只留對五官／身形／髮型／服裝這種表面特徵有影響的選項」。
                原本這個 tab 的 13 個欄位沒有一個符合——它們是人設資料與場景資料，不是外觀。

                為什麼可以直接移除而不是搬家：
                Model Lounge 的 ModelIdentityEditor 早就有這批欄位的**更完整版本**——
                寵物有品種/名字/描述三欄（這裡只有一個合併文字框）、標誌物支援多筆增刪
                （這裡只能編第一筆）、人際關係與長期記憶更是只存在於那邊。
                也就是說這批資料本來就是「生成時填一次、Lounge 又能改一次」的雙重入口，
                移除這一份不會遺失任何能力。

                連帶處理：
                - `preferredArchetypes`（風格原型偏好）：本來就是斷鏈欄位（勾了不會寫進 Model，
                  下游穿搭路由讀不到），且不屬於表面特徵 → 一併移除，不修復（企劃案 B-4e）。
                - `locked_descriptor`（身份鎖定描述）：手動輸入的內容在生成完成後會被
                  `generateFacialDescriptor` 依實際生成的臉重新分析並覆寫，填了等於白填
                  → 移除手動輸入欄（企劃案 B-4f）。它作為下游身份錨點的用途不受影響。

                資料本身仍會被建立（formState 的預設值照舊），只是不再從這裡編輯。
            */}

            {/* ===== TAB: 基礎穿著（打底裝，刻意極簡貼身） ===== */}
            {activeTab === 'apparel' && (
              <Card className="p-0 overflow-hidden border-none home-card">
                <div className="p-5 border-b border-[var(--home-line)] bg-gradient-to-r from-[var(--color-brass)]/5 to-transparent">
                  <h3 className="text-sm font-bold text-[var(--home-ink)] tracking-[0.2em] flex items-center gap-3">
                    <div className="w-1 h-4 bg-brass"></div>
                    <span className="group-hover:text-[var(--color-brass)] transition-colors">基礎穿著</span>
                  </h3>
                  {/*
                    刻意設計，不是缺陷：這裡只提供極簡貼身的打底裝。
                    越貼身簡潔，之後在虛擬試衣間換裝時殘留越少。
                    正式服裝（洋裝／西裝／禮服）屬於試衣間與靈魂敘事，不歸這裡。
                    詳見 CLAUDE.md 第 7 節架構原則第 3 條。
                  */}
                  <p className="mt-2 text-[11px] leading-relaxed text-[var(--home-muted)]">
                    這裡選的是模特兒的<span className="font-bold text-[var(--home-ink)]">基礎穿著</span>。越貼身簡潔，之後在試衣間換裝越乾淨。
                    <br />
                    想要正式服裝或造型變化，請到<span className="font-bold text-[var(--home-ink)]">虛擬試衣間</span>或<span className="font-bold text-[var(--home-ink)]">靈魂敘事</span>。
                  </p>
                </div>
                <div className="p-6 space-y-6">
                    {/* 分類 Tab */}
                    <TabBar
                        tabs={APPAREL_CAT_TABS}
                        active={activeApparelCat}
                        onChange={setActiveApparelCat}
                        layoutId="apparel-tab-glare"
                        size="sm"
                        className="mb-4"
                    />

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
                              { value: 'standard', label: '草稿 (1K)' },
                              { value: 'high', label: '標準 (2K)' },
                              { value: 'ultra', label: '商業級 (4K)' }
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

                    {/* 「生活感強度」滑桿已於 2026-08-03 移除（企劃案 B-4c）。
                        它的內容是「影棚乾淨 → 街頭 → 隨手拍」的**場景寫實度**
                        （最高檔會加入「台灣街頭雜訊：機車、電線、招牌」），
                        是拍攝情境而非人物表面特徵，卻擺在服裝分頁底下。

                        定妝照一律固定在最乾淨的影棚檔（fidelityScale = 1），理由是它是**素材不是成品**：
                        之後要進試衣間換裝、進敘事換場景，背景越乾淨越好去背、越好重新打光。
                        想要街拍或隨手拍的生活感，那是靈魂敘事該問的事。

                        formState.fidelityScale 的預設值已改為 1，資料仍會送出，只是不再可調。
                    */}
                </div>
              </Card>
            )}

            {/* Sticky wrapper：讓生成按鈕常駐可見，切 tab 時不消失、不用捲到底才能按。
                上緣用 home-paper 漸層墊出淡出區，避免內容捲動時從按鈕上方穿透。 */}
            <div className="sticky bottom-4 z-20 pt-6 -mx-1 px-1 bg-gradient-to-t from-[var(--home-paper)] via-[var(--home-paper)] to-transparent">
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
            </div>
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
