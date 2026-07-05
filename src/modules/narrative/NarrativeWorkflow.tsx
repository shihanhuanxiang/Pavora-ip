import React, { useState } from 'react';
import type { Model, DiaryEntry } from '../../shared/types/types';
import Button from '../../shared/components/common/Button';
import Loader from '../../shared/components/common/Loader';
import { generateIPDiary, generateRandomEvent, syncPrompts, generateDynamicEvent, extractNewMemories, generateRandomEventWithScene, generateDynamicEventWithScene, previewShootConfig, getOutfitOptionsForScene, generateIPDiaryCaption, generatePlatformCaption, generateCarouselVariation } from './services/narrativeService';
import { buildStructuredOutfitLabel, STYLE_ARCHETYPE_MAP } from './components/WardrobeManager';
import { ALL_EXTENDED_SCENES } from './constants/extendedScenes';
import { OrchestratorService } from './services/orchestratorService';
import { transformImage } from '../../shared/services/geminiService';
import { validatePromptText } from '../../shared/services/promptSanitizer';
import { motion, AnimatePresence } from 'motion/react';
import { useNotification } from '../../shared/context/NotificationContext';
import { useModelStore } from '../../shared/stores/useModelStore';
import { imageUrlToimageData } from '../../shared/utils/imageUtils';
import { recordGeneration, checkQuota } from '../../domains/ipContent/usageRecorder';

import ImagePreviewModal from '../../shared/components/common/ImagePreviewModal';
import { WardrobeManager } from './components/WardrobeManager';
import { StoryProgressBoard } from './components/StoryProgressBoard';
import { NarrativeSettings } from './components/NarrativeSettings';
import type { WeeklyPlanBrief } from '../../shared/types/types';
import pavoraLogoIcon from '../../shared/assets/brand/pavora_logo_icon_codex.svg';

interface NarrativeWorkflowProps {
    model: Model;
    onClose: () => void;
    onGoHome: () => void;
    onConfirm: (diary: Partial<DiaryEntry>, generatedImageUrl?: string) => void;
}

type EventSource = 'manual' | 'random' | 'ai' | 'weekly' | 'none';

// IP coreVibe 英文 → 繁體中文對照（處理舊 IP 或 AI 生成的英文值）
const CORE_VIBE_EN_TO_ZH: Record<string, string> = {
    'elegant fashion': '優雅時尚',
    'vibrant street': '活力街頭',
    'pure & sweet': '清純鄰家',
    'pure sweet': '清純鄰家',
    'high cold': '高冷超模',
    'retro artsy': '文藝復古',
    'tech future': '機能未來',
    'bookish softness': '文藝書卷',
    'gentle witty tone': '溫柔機智',
    'soft editorial': '柔焦編輯',
    'dark romantic': '暗調浪漫',
};
const getCoreVibeZH = (raw: string): string => {
    if (!raw) return '';
    if (/[\u4e00-\u9fff]/.test(raw)) return raw;           // 已是中文，直接回傳
    return CORE_VIBE_EN_TO_ZH[raw.toLowerCase()] || raw;  // 查表，查不到保留原文
};

// 服裝描述英→中翻譯 helper
const CLOTHING_EN_ZH: Record<string, string> = {
    'baby blue':'寶藍','navy blue':'深藍','navy':'深藍','black':'黑色','white':'白色',
    'gray':'灰色','grey':'灰色','charcoal':'炭灰','dark':'深色','light':'淺色',
    'ivory':'象牙白','cream':'米白','beige':'米色','brown':'棕色',
    'red':'紅色','pink':'粉色','coral':'珊瑚紅','rust':'鐵鏽紅','maroon':'暗紅',
    'green':'綠色','sage':'灰綠','olive':'橄欖綠','yellow':'黃色','orange':'橘色',
    'purple':'紫色','lavender':'薰衣草','gold':'金色','silver':'銀色',
    'floral':'碎花','stripe':'條紋','plaid':'格紋','polka dot':'圓點',
    'hoodie':'帽T','sweater':'毛衣','cardigan':'開衫','turtleneck':'高領',
    'shirt':'襯衫','t-shirt':'T恤','tee':'T恤','blouse':'上衣','camisole':'吊帶衫',
    'tank top':'背心','crop top':'短版上衣','top':'上衣',
    'jacket':'外套','blazer':'西裝外套','coat':'大衣','trench coat':'風衣',
    'dress':'洋裝','jumpsuit':'連身褲',
    'skirt':'裙','mini skirt':'迷你裙','maxi skirt':'長裙',
    'shorts':'短褲','jeans':'牛仔褲','pants':'長褲','trousers':'長褲','leggings':'內搭褲',
    'sneakers':'運動鞋','heels':'高跟鞋','pumps':'高跟鞋','flats':'平底鞋',
    'loafers':'樂福鞋','boots':'靴子','ankle boots':'踝靴','sandals':'涼鞋','mules':'穆勒鞋',
    'tote bag':'托特包','crossbody bag':'斜背包','shoulder bag':'肩背包',
    'backpack':'後背包','clutch':'手拿包','bag':'包',
    'earrings':'耳環','necklace':'項鍊','bracelet':'手鍊','ring':'戒指',
    'hat':'帽子','cap':'棒球帽','beret':'貝雷帽','scarf':'圍巾','belt':'腰帶',
    'sunglasses':'墨鏡','hair clip':'髮夾','hair tie':'髮圈',
    'oversized':'寬版','fitted':'合身','slim':'修身','loose':'寬鬆','cropped':'短版',
    'high-waist':'高腰','wide-leg':'寬褲腳','straight':'直筒',
    'pleated':'百褶','flared':'喇叭型','ribbed':'羅紋','knit':'針織',
    'denim':'丹寧','linen':'亞麻','silk':'絲質','cotton':'棉質','velvet':'天鵝絨',
    'leather':'皮革','mesh':'網眼','platform':'厚底','chunky':'粗跟','strappy':'繫帶',
    'mini':'迷你','maxi':'長版','midi':'中長',
};
const translateClothing = (text: any): string => {
    if (!text) return '';
    
    // 如果 text 是陣列 (例如 accessories)，將其合併，或者安全處理
    let actualText = '';
    if (Array.isArray(text)) {
        if (text.length === 0) return '';
        actualText = text.join(', ');
    } else if (typeof text === 'string') {
        actualText = text;
    } else {
        actualText = String(text);
    }
    
    if (/[一-鿿]/.test(actualText)) return actualText;
    // 安全簡單替換：按長度排序，用 indexOf 找到就替換
    let result = actualText.toLowerCase();
    const sorted = Object.entries(CLOTHING_EN_ZH).sort((a, b) => b[0].length - a[0].length);
    for (const [en, zh] of sorted) {
        if (result.includes(en)) {
            result = result.split(en).join(zh);
        }
    }
    // 移除剩餘英文字母
    result = result.replace(/[a-zA-Z]+/g, ' ').replace(/\s+/g, '').replace(/[,;.()\/\-]+/g, '').trim();
    if (!result || result.length < 1) return actualText.slice(0, 12);
    return result.slice(0, 18);
};

const NARRATIVE_STAGE_META = [
    { step: 1, label: '場景定錨', caption: 'Scene' },
    { step: 2, label: '造型選角', caption: 'Wardrobe' },
    { step: 3, label: '敘事編排', caption: 'Script' },
    { step: 4, label: '鏡頭審閱', caption: 'Review' },
    { step: 5, label: '發布交付', caption: 'Deliver' },
] as const;

const NarrativeWorkflow: React.FC<NarrativeWorkflowProps> = ({ model: propModel, onClose, onGoHome, onConfirm }) => {
    const { addNotification } = useNotification();
    const { updateModelGallery, updateModel, models } = useModelStore();
    
    // Ensure we are using the latest model data from the store for reactivity
    const model = models.find(m => m.id === propModel.id) || propModel;
    
    const [previewingImage, setPreviewingImage] = useState<{images: string[], startIndex: number} | null>(null);
    const [eventInput, setEventInput] = useState('');
    const [randomSceneId, setRandomSceneId] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingDynamicEvent, setIsGeneratingDynamicEvent] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isExtractingMem, setIsExtractingMem] = useState(false);
    const [narrativeStep, setNarrativeStep] = useState<1|2|3|4|5>(1);
    const [showLightbox, setShowLightbox] = useState(false);
    const [diary, setDiary] = useState<Partial<DiaryEntry> | null>(null);
    const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [selectedPreviewImageUrl, setSelectedPreviewImageUrl] = useState<string | null>(null);
    const [newMemories, setNewMemories] = useState<string[]>([]);
    const [showMemoryConfirm, setShowMemoryConfirm] = useState(false);
    // D3(b)：是否已完成入庫（handleFinish 成功後才會是 true）。用於推導「已生成但未儲存」的離開攔截。
    const [hasFinished, setHasFinished] = useState(false);
    // D3(b)：未儲存離開攔截 modal 狀態；pendingLeaveAction 記住要執行的原離開動作
    const [showUnsavedLeaveConfirm, setShowUnsavedLeaveConfirm] = useState(false);
    const [pendingLeaveAction, setPendingLeaveAction] = useState<(() => void) | null>(null);
    // D3(c)：FINISH 防誤點——記錄影像生成完成的時間戳，短時間內忽略 FINISH 點擊
    const [imageReadyAt, setImageReadyAt] = useState<number | null>(null);
    // D3(c)：FINISH 冷卻中（生成完成後 1.8 秒內）——true 時 FINISH 按鈕 disabled，避免誤點
    const [isFinishCooldown, setIsFinishCooldown] = useState(false);

    // UI state
    const [showWardrobe, setShowWardrobe] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showPlan, setShowPlan] = useState(false);
    const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlanBrief[] | null>(null);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [selectedBrief, setSelectedBrief] = useState<WeeklyPlanBrief | null>(null);
    
    // 是否有任何任務進行中（防呆用）
    const isAnyTaskRunning = isGenerating || isGeneratingDynamicEvent || isGeneratingImage || isSyncing || isExtractingMem || isGeneratingPlan;

    // D3(b)：是否有「已生成但尚未入庫」的產出——離開攔截的 dirty 判定
    const hasUnsavedGeneration = Boolean(generatedImageUrl) && !hasFinished;

    // D3(b)：離開出口統一入口。若有未儲存產出先彈確認 modal，否則直接執行原離開動作。
    const requestLeave = (action: () => void) => {
        if (isAnyTaskRunning) return; // 生成中既有攔截保留不動
        if (hasUnsavedGeneration) {
            setPendingLeaveAction(() => action);
            setShowUnsavedLeaveConfirm(true);
            return;
        }
        action();
    };

    // Advanced Controls
    const [aspectRatio, setAspectRatio] = useState('9:16');
    const [quality, setQuality] = useState('HD');
    const [isPOV, setIsPOV] = useState(true);
    const [editablePrompt, setEditablePrompt] = useState('');
    const [editablePromptZH, setEditablePromptZH] = useState('');
    const [activePromptLang, setActivePromptLang] = useState<'ZH' | 'EN'>('ZH');
    const [eventSource, setEventSource] = useState<EventSource>('none');
    const [previewScene, setPreviewScene] = useState<any>(null);
    const [previewOutfit, setPreviewOutfit] = useState<any>(null);

    // ── Scene Picker Modal ────────────────────────────────────────
    // Step 1：場景選擇
    const [pickerRegion, setPickerRegion] = useState<string | null>(null);
    const [pickerCategory, setPickerCategory] = useState<string | null>(null);
    const [pickerSceneCards, setPickerSceneCards] = useState<Array<{scene: any; eventText: string}>>([]);
    const [pickerAICardScene, setPickerAICardScene] = useState<any | null>(null);
    const [pickerAICardText, setPickerAICardText] = useState<string>('');
    const [isAICardLoading, setIsAICardLoading] = useState(false);
    // Step 1→2：確認的場景
    const [confirmedScene, setConfirmedScene] = useState<any | null>(null);
    // Step 2：服裝選項（getOutfitOptionsForScene 結果）
    const [pickerOutfitOptions, setPickerOutfitOptions] = useState<{topPick: any; alternatives: any[]} | null>(null);
    // Step 2→3：確認的服裝 ID（避免 updateModel async stale state）
    const [confirmedOutfitId, setConfirmedOutfitId] = useState<string | null>(null);
    // Step 5：平台發文
    const [igCaption, setIgCaption] = useState<string>('');
    const [fbCaption, setFbCaption] = useState<string>('');
    const [threadsCaption, setThreadsCaption] = useState<string>('');
    const [selectedPlatform, setSelectedPlatform] = useState<'ig' | 'fb' | 'threads'>('ig');
    const [isLoadingCaption, setIsLoadingCaption] = useState(false);
    // Step 5：輪播模式
    const [carouselMode, setCarouselMode] = useState(false);
    const [carouselImages, setCarouselImages] = useState<string[]>([]);
    const [isGeneratingVariation, setIsGeneratingVariation] = useState(false);

    // 動態等待訊息（Stage 04 / 05 生成用）
    const STAGE04_WAIT_MESSAGES = [
        '靈魂轉譯中，請稍候...',
        '捕捉光影質感...',
        '編織視覺故事...',
        '身份 DNA 對位中...',
        'AI 正在聆聽敘事指令...',
        '渲染細節紋理...',
        '時光凝固一瞬間...',
    ] as const;
    const STAGE05_WAIT_MESSAGES = [
        '輪播變化生成中...',
        '重新構圖，換個角度...',
        'AI 調整姿態中...',
        '豐富你的故事集...',
    ] as const;
    const [stage04MsgIdx, setStage04MsgIdx] = React.useState(0);
    const [stage05MsgIdx, setStage05MsgIdx] = React.useState(0);
    React.useEffect(() => {
        if (!isGeneratingImage) { setStage04MsgIdx(0); return; }
        const t = setInterval(() => setStage04MsgIdx(i => (i + 1) % STAGE04_WAIT_MESSAGES.length), 2800);
        return () => clearInterval(t);
    }, [isGeneratingImage]);
    React.useEffect(() => {
        if (!isGeneratingVariation) { setStage05MsgIdx(0); return; }
        const t = setInterval(() => setStage05MsgIdx(i => (i + 1) % STAGE05_WAIT_MESSAGES.length), 2500);
        return () => clearInterval(t);
    }, [isGeneratingVariation]);

    // D3(c)：影像生成完成後 1.8 秒內，FINISH 按鈕維持 disabled，避免與「生成故事影像」按鈕誤點重疊
    React.useEffect(() => {
        if (!imageReadyAt) { setIsFinishCooldown(false); return; }
        setIsFinishCooldown(true);
        const t = setTimeout(() => setIsFinishCooldown(false), 1800);
        return () => clearTimeout(t);
    }, [imageReadyAt]);

    const previewImages = React.useMemo(
        () => (generatedImageUrl ? [generatedImageUrl, ...carouselImages].slice(0, 5) : []),
        [generatedImageUrl, carouselImages]
    );
    const activePreviewImageUrl = selectedPreviewImageUrl && previewImages.includes(selectedPreviewImageUrl)
        ? selectedPreviewImageUrl
        : generatedImageUrl;

    // Preview: debounced update on eventInput change
    React.useEffect(() => {
        if (!eventInput.trim()) {
            setPreviewScene(null);
            setPreviewOutfit(null);
            return;
        }
        const timer = setTimeout(() => {
            const forcedId = randomSceneId || currentSceneId || undefined;
            const config = previewShootConfig(model, eventInput, forcedId);
            setPreviewScene(config.scene);
            setPreviewOutfit(config.outfit);
        }, 400);
        return () => clearTimeout(timer);
    }, [eventInput, model.id]);

    // Preview: immediate update when randomSceneId is set
    React.useEffect(() => {
        if (randomSceneId && eventInput.trim()) {
            const config = previewShootConfig(model, eventInput, randomSceneId);
            setPreviewScene(config.scene);
            setPreviewOutfit(config.outfit);
        }
    }, [randomSceneId]);

    // P2-3: 內容比例建議邏輯
    const contentSuggestion = (() => {
        if (!model.gallery || model.gallery.length === 0) return null;
        
        const counts = { lifestyle: 0, curve: 0, drama: 0 };
        model.gallery.forEach(item => {
            if (item.contentCategory === 'lifestyle') counts.lifestyle++;
            else if (item.contentCategory === 'curve') counts.curve++;
            else if (item.contentCategory === 'drama') counts.drama++;
        });

        const total = model.gallery.length;
        const targets = { lifestyle: 0.5, curve: 0.3, drama: 0.2 };
        
        const deviations = [
            { key: 'lifestyle', label: '生活日常', gap: (counts.lifestyle / total) - targets.lifestyle },
            { key: 'curve', label: '曲線魅力', gap: (counts.curve / total) - targets.curve },
            { key: 'drama', label: '戲劇張力', gap: (counts.drama / total) - targets.drama },
        ];

        // 找出「實際佔比 - 目標佔比」差距最大 (最負) 的類別
        const mostNeeded = deviations.reduce((prev, curr) => prev.gap < curr.gap ? prev : curr);
        return `📊 內容建議：目前 ${mostNeeded.key} 偏少，建議本次選擇${mostNeeded.label}場景`;
    })();

    type PromptSection = {
        label: string;
        value: string;
        lineIndex: number;
        prefix: string;
        separator: string;
    };

    const normalizePromptSectionLabel = (label: string) => {
        const cleaned = label.trim().replace(/^\[|\]$/g, '').replace(/^【|】$/g, '').trim();
        const normalized = cleaned.toLowerCase().replace(/[\s_-]/g, '');

        const labelMap: Record<string, string> = {
            subject: 'SUBJECT',
            主體: 'SUBJECT',
            人物: 'SUBJECT',
            模特兒: 'SUBJECT',
            apparel: 'APPAREL',
            outfit: 'APPAREL',
            clothing: 'APPAREL',
            服裝: 'APPAREL',
            穿搭: 'APPAREL',
            environment: 'ENVIRONMENT',
            scene: 'ENVIRONMENT',
            location: 'ENVIRONMENT',
            環境: 'ENVIRONMENT',
            場景: 'ENVIRONMENT',
            地點: 'ENVIRONMENT',
            lighting: 'LIGHTING',
            light: 'LIGHTING',
            光線: 'LIGHTING',
            燈光: 'LIGHTING',
            光影: 'LIGHTING',
            camera: 'CAMERA',
            shot: 'CAMERA',
            composition: 'CAMERA',
            鏡頭: 'CAMERA',
            構圖: 'CAMERA'
        };

        return labelMap[normalized] || null;
    };

    const normalizeInlinePromptSections = (prompt: string): string => {
        const sectionLabelPattern = /(\[[^\]]+\]|【[^】]+】|Subject|Apparel|Environment|Lighting|Camera|主體|穿搭|環境|光影|鏡頭)\s*([:：])/g;

        return prompt
            .replace(sectionLabelPattern, '\n$1$2')
            .replace(/^\n/, '')
            .replace(/\n{2,}/g, '\n')
            .trim();
    };

    const parseStructuredPrompt = (prompt: string): PromptSection[] => {
        const normalizedPrompt = normalizeInlinePromptSections(prompt);

        return normalizedPrompt.split('\n').map((line, lineIndex) => {
            const match = line.match(/^\s*(\[[^\]]+\]|【[^】]+】|[A-Za-z][A-Za-z\s_-]*|[\u4e00-\u9fff]{1,12})\s*([:：])\s*(.*)$/);
            if (!match) return null;

            const label = normalizePromptSectionLabel(match[1]);
            if (!label) return null;

            return {
                label,
                value: match[3],
                lineIndex,
                prefix: match[1].trim(),
                separator: match[2]
            };
        }).filter((section): section is PromptSection => Boolean(section));
    };

    const promptSectionsZH = parseStructuredPrompt(editablePromptZH);
    const promptSectionsEN = parseStructuredPrompt(editablePrompt);
    const hasStructuredPromptZH = promptSectionsZH.length >= 2;
    const hasStructuredPromptEN = promptSectionsEN.length >= 2;
    const reviewPromptLabels = ['SUBJECT', 'APPAREL', 'ENVIRONMENT', 'LIGHTING', 'CAMERA'];

    const getReviewPromptSections = (lang: 'ZH' | 'EN') => {
        const sections = lang === 'ZH' ? promptSectionsZH : promptSectionsEN;
        return reviewPromptLabels.map(label => sections.find(section => section.label === label) || {
            label,
            value: '',
            lineIndex: -1,
            prefix: lang === 'ZH' ? getPromptSectionDisplayLabel(label, 'ZH') : label,
            separator: ':'
        });
    };

    const updateReviewPromptSection = (lang: 'ZH' | 'EN', section: PromptSection, value: string) => {
        const currentPrompt = lang === 'ZH' ? editablePromptZH : editablePrompt;
        const lines = currentPrompt.split('\n');

        if (section.lineIndex >= 0) {
            lines[section.lineIndex] = `${section.prefix}${section.separator} ${value}`;
        } else {
            const prefix = lang === 'ZH' ? getPromptSectionDisplayLabel(section.label, 'ZH') : section.label;
            lines.push(`${prefix}: ${value}`);
        }

        if (lang === 'ZH') setEditablePromptZH(lines.join('\n'));
        else setEditablePrompt(lines.join('\n'));
    };

    const getPromptSectionDisplayLabel = (label: string, lang: 'ZH' | 'EN') => {
        if (lang === 'EN') return label;

        const zhLabels: Record<string, string> = {
            SUBJECT: '主體',
            APPAREL: '穿搭',
            ENVIRONMENT: '環境',
            LIGHTING: '光影',
            CAMERA: '鏡頭'
        };

        return zhLabels[label] || label;
    };

    // Narrative Helpers
    const getEventSourceLabel = (source: EventSource) => {
        const labels: Record<EventSource, string> = {
            none: '尚未設定',
            manual: '手動輸入',
            random: '隨機場景',
            ai: 'AI 推薦',
            weekly: '週計畫任務'
        };
        return labels[source];
    };

    const getLockedSceneId = () => selectedBrief?.sceneId || randomSceneId || undefined;

    const getSceneLockLabel = () => {
        if (selectedBrief?.sceneId) return '週計畫鎖定';
        if (randomSceneId && eventSource === 'random') return '隨機場景鎖定';
        if (randomSceneId && eventSource === 'ai') return 'AI 劇本場景鎖定';
        return '自動抽選';
    };

    const getActiveOutfitLabel = () => {
        const outfitId = model.preferences?.active_outfit_id;
        return outfitId ? `已鎖定：${outfitId}` : '依場景自動搭配';
    };

    const getShootingPurposeLabel = () => {
        if (aspectRatio === '9:16') return '直式短影音 / Reels';
        if (aspectRatio === '1:1') return '社群貼文 / Post';
        if (aspectRatio === '4:5') return 'IG 直式貼文';
        return '自訂素材';
    };

    const buildPromptDebugHash = (value: string): string => {
        let hash = 5381;
        for (let i = 0; i < value.length; i += 1) {
            hash = ((hash << 5) + hash) + value.charCodeAt(i);
            hash = hash >>> 0;
        }
        return hash.toString(16).padStart(8, '0').slice(-10);
    };

    const writeActualImagePromptDebugSnapshot = (
        finalImagePrompt: string,
        details: {
            faceReferenceCount: number;
            additionalReferenceCount: number;
            hasPetNote: boolean;
            hasSecondaryRefNote: boolean;
        }
    ) => {
        if (typeof window === 'undefined' || !window.localStorage || window.localStorage.getItem('PAVORA_DEBUG_PROMPT') !== '1') {
            return;
        }

        const debugSnapshot = {
            source: 'NarrativeWorkflow.handleGenerateImage',
            timestamp: new Date().toISOString(),
            promptHash: buildPromptDebugHash(finalImagePrompt),
            finalLength: finalImagePrompt.length,
            sanitizerReport: validatePromptText(finalImagePrompt),
            finalPrompt: finalImagePrompt,
            aspectRatio,
            quality,
            isPOV,
            ...details
        };

        window.localStorage.setItem('PAVORA_LAST_FINAL_PROMPT_DEBUG', JSON.stringify(debugSnapshot));
        console.info('[PAVORA_DEBUG_PROMPT]', debugSnapshot);
    };

    const faceReferenceCount = (model.preferences?.face_reference_urls || []).filter(Boolean).length;
    const getFaceReferenceStatusLabel = () => {
        if (faceReferenceCount >= 4) return '4-angle identity lock';
        if (faceReferenceCount >= 2) return `${faceReferenceCount}-angle identity reference`;
        if (faceReferenceCount === 1) return 'single face reference';
        return 'model cover image fallback';
    };

    const FinalShootCard = () => {
        const [isExpanded, setIsExpanded] = React.useState(false);
        return (
        <div className="bg-white/[0.03] border border-[var(--color-border)] rounded-[1.5rem] backdrop-blur-md overflow-hidden">
            <button onClick={() => setIsExpanded(v => !v)} className="w-full flex justify-between items-center px-5 py-3 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2.5">
                    <div className="w-1 h-3 bg-[var(--color-gold)] rounded-full"></div>
                    <span className="text-[9px] font-black text-[var(--color-gold)] tracking-[0.3em] uppercase">拍攝卡</span>
                    {diary && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]"></span>}
                </div>
                <div className="flex items-center gap-2">
                    {!isExpanded && diary && <span className="text-[8px] text-gray-500 font-mono">{aspectRatio} · {quality} · {isPOV ? '第一人稱' : '第三人稱'}</span>}
                    <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                </div>
            </button>
            {isExpanded && (
            <div className="px-5 pb-5 pt-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {/* 1. MATERIAL */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <p className="text-[9px] text-[var(--color-gold)] font-black uppercase tracking-widest pl-2 border-l-2 border-[var(--color-gold)]">素材</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 pl-3">
                        <div className="space-y-1">
                            <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">角色</p>
                            <p className="text-[10px] text-white font-medium">{model.name}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">城市</p>
                            <p className="text-[10px] text-white font-medium">{model.lifeCircuit?.primaryCity || model.lifeCircuit?.primaryDistrict || '未設定'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">用途</p>
                            <p className="text-[10px] text-white font-medium leading-tight">{getShootingPurposeLabel()}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">規格</p>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-white font-mono">{aspectRatio}</span>
                                <span className="text-[10px] text-white/30">/</span>
                                <span className="text-[10px] text-white font-mono">{quality}</span>
                            </div>
                        </div>
                        <div className="space-y-1 col-span-2">
                            <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">臉部基準圖</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${faceReferenceCount > 0 ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-white/10 bg-white/5 text-gray-500'}`}>
                                    {faceReferenceCount}/4
                                </span>
                                <span className={`text-[9px] font-medium ${faceReferenceCount > 0 ? 'text-white' : 'text-gray-500'}`}>
                                    {getFaceReferenceStatusLabel()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. SCENE */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <p className="text-[9px] text-[var(--color-gold)] font-black uppercase tracking-widest pl-2 border-l-2 border-[var(--color-gold)]">場景</p>
                        {getLockedSceneId() && <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>}
                    </div>
                    <div className="space-y-3 pl-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">來源</p>
                                <p className={`text-[10px] font-black italic ${eventSource === 'none' ? 'text-gray-600' : 'text-[var(--color-gold)]'}`}>
                                    {getEventSourceLabel(eventSource)}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">鎖定狀態</p>
                                <p className={`text-[10px] font-medium ${getSceneLockLabel() === '自動抽選' ? 'text-gray-500' : 'text-white'}`}>
                                    {getSceneLockLabel()}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">場景識別碼</p>
                            <p className={`text-[9px] font-mono truncate ${getLockedSceneId() ? 'text-[var(--color-gold)]' : 'text-gray-600'}`}>
                                {getLockedSceneId() || '系統自動抽選'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">敘事摘要</p>
                            <p className={`text-[9px] leading-relaxed italic line-clamp-1 ${eventInput ? 'text-gray-300' : 'text-gray-600'}`}>
                                {eventInput ? (eventInput.length > 80 ? eventInput.substring(0, 80) + '...' : eventInput) : '等待敘事起點注入'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. STYLING */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <p className="text-[9px] text-[var(--color-gold)] font-black uppercase tracking-widest pl-2 border-l-2 border-[var(--color-gold)]">造型</p>
                        {model.preferences?.active_outfit_id && <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>}
                    </div>
                    <div className="pl-3 space-y-1">
                        <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">服裝鎖定策略</p>
                        <p className={`text-[10px] font-mono ${model.preferences?.active_outfit_id ? 'text-white' : 'text-gray-500'}`}>
                            {getActiveOutfitLabel()}
                        </p>
                    </div>
                </div>

                {/* 4. RENDER */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <p className="text-[9px] text-[var(--color-gold)] font-black uppercase tracking-widest pl-2 border-l-2 border-[var(--color-gold)]">生成</p>
                        {diary && <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>}
                    </div>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-4 pl-3">
                        <div className="space-y-1">
                            <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">相機 POV</p>
                            <p className="text-[9px] text-white font-medium">{isPOV ? '第一人稱' : '第三人稱'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">流派敘事</p>
                            <p className={`text-[9px] font-medium ${diary?.mood ? 'text-white' : 'text-gray-600'}`}>
                                {diary?.mood || '待產生'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">審美層次</p>
                            <p className={`text-[9px] font-medium ${diary?.meta?.aesthetic_tier ? 'text-white' : 'text-gray-600'}`}>
                                {diary?.meta?.aesthetic_tier || '自動評估'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">提示詞狀態</p>
                            <p className={`text-[9px] font-medium ${editablePrompt ? 'text-emerald-500' : 'text-gray-600'}`}>
                                {editablePrompt ? '已準備生成' : '尚未同步'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            </div>
            )}
        </div>
        );
    };

    // UI Helper Components
    const NavIconButton = ({ active, onClick, icon, label, isLoading }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, isLoading?: boolean }) => (
        <motion.button
            whileHover={{ scale: 1.08, x: 3 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            className={`narrative-nav-button relative p-3 rounded-2xl transition-all duration-300 group ${active ? 'is-active' : ''}`}
        >
            {isLoading ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : icon}
            <div className="narrative-nav-tooltip absolute left-full ml-4 px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[70]">
                {label}
            </div>
            {active && (
                <motion.div 
                    layoutId="active-indicator"
                    className="absolute -left-1 top-2 bottom-2 w-1 bg-[#c79b4b] rounded-full shadow-[0_0_10px_rgba(199,155,75,0.55)]"
                />
            )}
        </motion.button>
    );

    const handleGenerateDiary = async (forcedId?: string, forcedEventText?: string, forcedOutfitId?: string) => {
        if (isGenerating) return;
        const effectiveEvent = forcedEventText || eventInput;
        if (!effectiveEvent.trim()) return;
        setIsGenerating(true);
        setGeneratedImageUrl(null);
        setSelectedPreviewImageUrl(null);
        
        // Get context from last gallery entry
        const lastEntry = model.gallery?.[0];
        const context = lastEntry ? { content: lastEntry.narrativeContent, mood: lastEntry.mood } : undefined;

        // Determine which scene to use
        let sceneIdToUse = forcedId || selectedBrief?.sceneId || randomSceneId || currentSceneId || undefined;
        
        // If still undefined (manual input case), pick a random one to ensure transparency
        if (!sceneIdToUse) {
            const city = model.lifeCircuit?.primaryCity || '台北市';
            const pool = ALL_EXTENDED_SCENES.filter(s => s.city === city || s.city === 'any');
            const targetPool = pool.length > 0 ? pool : ALL_EXTENDED_SCENES;
            sceneIdToUse = targetPool[Math.floor(Math.random() * targetPool.length)].scene_id;
        }

        try {
            const result = await generateIPDiary(model, effectiveEvent, { 
                isPOV, 
                lastEntry: context,
                forcedSceneId: sceneIdToUse,
                forcedOutfitId
            });
            
            // P2-4: 獲取最新的服裝 ID (可能由 service 更新至 store)
            // 由於 generateIPDiary 會更新 model.preferences.recent_outfit_ids，
            // 且 React 會重新渲染，因此當我們設置 diary 時，理論上可以獲取最新值。
            setDiary({
                ...result,
                sceneId: sceneIdToUse,
                outfitId: model.preferences?.active_outfit_id || model.preferences?.recent_outfit_ids?.[0]
            } as any);
            
            setCurrentSceneId(sceneIdToUse || null);
            setNarrativeStep(4);
            setSelectedBrief(null); // Reset after use
            setRandomSceneId(null); // Reset after use
            // Handle new direct prompt structure
            if (result.visualPrompt) {
                setEditablePrompt(result.visualPrompt);
            }
            if (result.visualPromptZH) {
                setEditablePromptZH(result.visualPromptZH);
            }
        } catch (e) {
            console.error(e);
            addNotification({ type: 'error', message: '靈魂同步失敗', description: '無法提取敘事數據，請重試。' });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSyncPrompt = async () => {
        if (!editablePromptZH && !editablePrompt) return;
        setIsSyncing(true);
        try {
            const textToSync = activePromptLang === 'ZH' ? editablePromptZH : editablePrompt;
            const result = await syncPrompts(textToSync, activePromptLang);
            setEditablePrompt(result.EN);
            setEditablePromptZH(result.ZH);
            addNotification({ type: 'success', message: '提示詞雙語同步完成 (Sync Complete)' });
        } catch (e) {
            addNotification({ type: 'error', message: '同步失敗 (Sync Failed)' });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleGenerateImage = async () => {
        if (isGeneratingImage) return;
        if (!diary || !editablePrompt) return;
        // Stage E / E3 quota skeleton: reuses App.tsx's existing
        // imagenQuotaExceeded listener (see src/shell/App.tsx) instead of a
        // new notification path, so the existing QuotaErrorModal UI fires.
        const quota = checkQuota();
        if (!quota.allowed) {
            window.dispatchEvent(new Event('imagenQuotaExceeded'));
            return;
        }
        setIsGeneratingImage(true);
        try {
            const faceRefs = (model.preferences?.face_reference_urls || []).filter(Boolean);
            const primaryRef = faceRefs.length > 0 ? faceRefs[0] : model.imageUrl;
            const sourceImageData = await imageUrlToimageData(primaryRef);

            // 把其餘角度圖轉成 imageData 格式，作為 references 傳給 Gemini
            const additionalRefs: { data: string; mimeType: string }[] = [];
            if (faceRefs.length > 1) {
                for (const refUrl of faceRefs.slice(1)) {
                    try {
                        const refData = await imageUrlToimageData(refUrl);
                        additionalRefs.push(refData);
                    } catch (e) {
                        console.warn('Failed to load face reference:', e);
                    }
                }
            }

            // 根據角度數量生成說明指令
            let secondaryRefNote = '';
            if (faceRefs.length >= 4) {
                secondaryRefNote = ' [IDENTITY REFERENCE: 4-angle head reference images provided (front, side, 45-degree, back). All reference images show the SAME person. Use ALL provided images to accurately reconstruct facial features, hairstyle structure, and head shape. Maintain 100% identity consistency.]';
            } else if (faceRefs.length === 3) {
                secondaryRefNote = ' [IDENTITY REFERENCE: 3-angle head reference images provided. All show the SAME person. Maintain consistent facial identity.]';
            } else if (faceRefs.length === 2) {
                secondaryRefNote = ' [IDENTITY REFERENCE: Front and side reference images provided for the same person. Maintain consistent facial identity.]';
            }
            
            const imageConfig: any = {
                aspectRatio: aspectRatio,
            };

            // HD: 1K, CINEMATIC: 2K, PRO: 4K
            let resolutionTier = '1K';
            if (quality === 'Cinematic') resolutionTier = '2K';
            else if (quality === 'Pro') resolutionTier = '4K';
            imageConfig.imageSize = resolutionTier;

            // PRO 模式啟動「身份強化」flag,由 transformImage 內部處理
            const finalImagePrompt = editablePrompt + (diary?.meta?.petNote || '') + secondaryRefNote;
            writeActualImagePromptDebugSnapshot(finalImagePrompt, {
                faceReferenceCount: faceRefs.length,
                additionalReferenceCount: additionalRefs.length,
                hasPetNote: Boolean(diary?.meta?.petNote),
                hasSecondaryRefNote: Boolean(secondaryRefNote)
            });

            // HD → gemini-2.5-flash-image（快速）；Cinematic / Pro → gemini-3.1-flash-image-preview（高保真）
            const url = await transformImage(
                sourceImageData,
                finalImagePrompt,
                additionalRefs,
                undefined,
                {
                    usePro: quality === 'Cinematic' || quality === 'Pro',
                    imageConfig,
                    identityBoost: quality === 'Pro'
                }
            );

            // Embed model identity (DNA) into the generated image
            const { wrapImageWithIdentity } = await import('../../shared/utils/metadataUtils');
            const resultImageData = await imageUrlToimageData(url);
            const fullDataUrl = `data:${resultImageData.mimeType};base64,${resultImageData.data}`;
            const finalImageWithMetadata = wrapImageWithIdentity(fullDataUrl, model, { scene_id: diary?.meta?.scene_id, prompt_snapshot: finalImagePrompt.slice(0, 200) });

            setGeneratedImageUrl(finalImageWithMetadata);
            setSelectedPreviewImageUrl(finalImageWithMetadata);
            setNarrativeStep(5);
            setHasFinished(false); // D3(b)：新影像生成後視為尚未入庫，重新開啟未儲存攔截
            setImageReadyAt(Date.now()); // D3(c)：記錄生成完成時間，供 FINISH 防誤點判斷
            addNotification({ type: 'success', message: '靈魂視覺化成功 (Visualization Success)', description: '影像已生成並包含身分內碼 (Image generated with identity metadata).' });
            recordGeneration({ module: 'narrative', kind: 'image', model_id: model.id, ok: true });
        } catch (e) {
            console.error(e);
            addNotification({ type: 'error', message: '影像生成失敗 (Generation Failed)', description: 'AI 算力調度異常，請稍後再試 (AI engine error, please try again later).' });
            recordGeneration({ module: 'narrative', kind: 'image', model_id: model.id, ok: false });
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleRandomEvent = () => {
        const randomEvent = generateRandomEventWithScene(model);
        setEventInput(randomEvent.text);
        setRandomSceneId(randomEvent.sceneId || null);
        setCurrentSceneId(randomEvent.sceneId || null);
        setSelectedBrief(null);
        setEventSource('random');
    };

    const handleAIGenerateEvent = async () => {
        setIsGeneratingDynamicEvent(true);
        try {
            // Check for next plan item first
            if (model.preferences?.active_arc_id || (model.preferences?.active_threads || []).length > 0) {
                // Future: Force arc/thread event if it's "that day"
                // For now, normal dynamic event is fine but we'll flag it
            }

            // Get context from last gallery entry
            const lastEntry = model.gallery?.[0];
            const context = lastEntry ? { content: lastEntry.narrativeContent, mood: lastEntry.mood } : undefined;

            const result = await generateDynamicEventWithScene(model, context);
            setEventInput(result.text);
            setRandomSceneId(result.sceneId || null);
            setCurrentSceneId(result.sceneId || null);
            setSelectedBrief(null);
            setEventSource('ai');

            addNotification({ type: 'success', message: '靈魂與現世已對齊 (Context Aligned)', description: '及時場景與故事弧邏輯已啟動 (Real-time scene and story arc logic active).' });
        } catch (e) {
            addNotification({ type: 'error', message: '靈感獲取失敗' });
        } finally {
            setIsGeneratingDynamicEvent(false);
        }
    };

    // ── Scene Picker helpers ──────────────────────────────────────

    // 確認場景 + 服裝 ID，跳至 Step 3（不等待 updateModel async）
    const confirmSceneOutfit = (scene: any, outfitId: string | null) => {
        const eventText = (scene as any).event || scene.name_zh || '';
        setConfirmedScene(scene);
        setConfirmedOutfitId(outfitId);
        setEventInput(eventText);
        setRandomSceneId(scene.scene_id);
        setCurrentSceneId(scene.scene_id);
        setEventSource('random');
        setSelectedBrief(null);
        setDiary(null);
        setNarrativeStep(3);
        if (outfitId) {
            updateModel(model.id, {
                preferences: { ...model.preferences, active_outfit_id: outfitId }
            });
        }
    };

    // Step 1 → Step 2：確認場景，載入服裝選項
    const confirmScene = (scene: any) => {
        setConfirmedScene(scene);
        const options = getOutfitOptionsForScene(model, scene.scene_id);
        setPickerOutfitOptions(options);
        setNarrativeStep(2);
    };

    // Step 1：隨機 3 張場景卡（篩選變更時重新抽）
    const STEP1_CATEGORY_CONTEXTS: Record<string, string[]> = {
        urban:   ['urban_street', 'shopping_random', 'night_market'],
        cafe:    ['cafe_aesthetic', 'home_cozy', 'office_pro', 'travel_journey'],
        beach:   ['beach_island'],
        mountain:['mountain_outdoor', 'rural_field'],
        culture: ['temple_old_town', 'festival_event'],
    };

    const refreshRandomCards = React.useCallback(() => {
        const pool = ALL_EXTENDED_SCENES.filter(s => {
            const sceneRegion = (s as any).region as string;
            if (pickerRegion && sceneRegion !== pickerRegion && sceneRegion !== 'all') return false;
            if (pickerCategory) {
                const of = (s as any).outfit_filter as string[] | undefined;
                if (!of?.length) return false;
                const contexts = STEP1_CATEGORY_CONTEXTS[pickerCategory] || [];
                if (contexts.length > 0) {
                    const nonUrban = of.filter((ctx: string) => ctx !== 'urban_street');
                    const effective = nonUrban.length > 0 ? nonUrban : of;
                    if (!effective.some((ctx: string) => contexts.includes(ctx))) return false;
                }
            }
            return true;
        });
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        setPickerSceneCards(shuffled.slice(0, 3).map(s => ({
            scene: s,
            eventText: (s as any).event || s.name_zh || '',
        })));
    }, [pickerRegion, pickerCategory]);

    // 篩選變更時自動更新隨機卡
    React.useEffect(() => {
        refreshRandomCards();
    }, [refreshRandomCards]);

    // Step 1：AI 卡懶載入（點擊才呼叫 API）
    const handleLoadAICard = async () => {
        setIsAICardLoading(true);
        setPickerAICardScene(null);
        setPickerAICardText('');
        try {
            const result = await generateDynamicEventWithScene(model);
            if (result?.sceneId) {
                const aiScene = ALL_EXTENDED_SCENES.find(s => s.scene_id === result.sceneId);
                if (aiScene) {
                    setPickerAICardScene(aiScene);
                    setPickerAICardText(result.text);
                }
            }
        } catch { setPickerAICardScene(null); }
        finally { setIsAICardLoading(false); }
    };

    // ── Lightbox refs ──────────────────────────────────────────
    const lbContainerRef = React.useRef<HTMLDivElement>(null);
    const lbImgRef = React.useRef<HTMLImageElement>(null);
    const lbState = React.useRef({ tx: 0, ty: 0, scale: 1, isDragging: false, startX: 0, startY: 0 });

    const applyLightboxTransform = React.useCallback(() => {
        const img = lbImgRef.current;
        if (!img) return;
        const { tx, ty, scale } = lbState.current;
        img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
        img.style.transformOrigin = '0 0';
    }, []);

    const initLightboxCenter = React.useCallback(() => {
        const c = lbContainerRef.current;
        const img = lbImgRef.current;
        if (!c || !img) return;
        lbState.current.tx = (c.offsetWidth - img.offsetWidth) / 2;
        lbState.current.ty = (c.offsetHeight - img.offsetHeight) / 2;
        lbState.current.scale = 1;
        applyLightboxTransform();
    }, [applyLightboxTransform]);

    React.useEffect(() => {
        if (!showLightbox) return;
        const img = lbImgRef.current;
        if (img?.complete) initLightboxCenter();
        else if (img) img.onload = initLightboxCenter;
        const c = lbContainerRef.current;
        if (!c) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const s = lbState.current;
            const rect = c.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const ns = Math.min(Math.max(0.3, s.scale * (e.deltaY > 0 ? 0.88 : 1.14)), 8);
            s.tx = mx - (mx - s.tx) * (ns / s.scale);
            s.ty = my - (my - s.ty) * (ns / s.scale);
            s.scale = ns;
            applyLightboxTransform();
        };
        const onMouseDown = (e: MouseEvent) => {
            const s = lbState.current;
            s.isDragging = true;
            s.startX = e.clientX - s.tx;
            s.startY = e.clientY - s.ty;
        };
        const onMouseMove = (e: MouseEvent) => {
            const s = lbState.current;
            if (!s.isDragging) return;
            s.tx = e.clientX - s.startX;
            s.ty = e.clientY - s.startY;
            applyLightboxTransform();
        };
        const onMouseUp = () => { lbState.current.isDragging = false; };
        c.addEventListener('wheel', onWheel, { passive: false });
        c.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            c.removeEventListener('wheel', onWheel);
            c.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [showLightbox, initLightboxCenter, applyLightboxTransform]);

    // ── Step 5 handlers ────────────────────────────────────────
    const handleGenerateIGCaption = React.useCallback(async () => {
        if (!diary || igCaption) return;
        setIsLoadingCaption(true);
        try {
            const caption = await generateIPDiaryCaption(model, diary);
            setIgCaption(caption);
        } catch (e) {
            console.error('IG caption failed:', e);
        } finally {
            setIsLoadingCaption(false);
        }
    }, [diary, igCaption, model]);

    React.useEffect(() => {
        if (narrativeStep === 5 && diary && !igCaption) {
            void handleGenerateIGCaption();
        }
    }, [narrativeStep]);

    const handleCaptionTabClick = async (platform: 'ig' | 'fb' | 'threads') => {
        setSelectedPlatform(platform);
        if (platform === 'ig') return;
        const existing = platform === 'fb' ? fbCaption : threadsCaption;
        if (existing || !igCaption) return;
        setIsLoadingCaption(true);
        try {
            const caption = await generatePlatformCaption(model, igCaption, platform === 'fb' ? 'facebook' : 'threads');
            if (platform === 'fb') setFbCaption(caption);
            else setThreadsCaption(caption);
        } catch (e) {
            console.error('Platform caption failed:', e);
        } finally {
            setIsLoadingCaption(false);
        }
    };

    const handleGenerateCarouselVariation = async (variationType: 'pose' | 'expression' | 'angle' | 'surprise') => {
        if (!generatedImageUrl || isGeneratingVariation) return;
        setIsGeneratingVariation(true);
        try {
            const newImg = await generateCarouselVariation(model, generatedImageUrl, variationType, editablePrompt);
            setCarouselImages(prev => [...prev, newImg]);
            setSelectedPreviewImageUrl(newImg);
            setCarouselMode(true);
        } catch (e) {
            console.error('Carousel variation failed:', e);
            addNotification({ type: 'error', message: '輪播生成失敗，請重試' });
        } finally {
            setIsGeneratingVariation(false);
        }
    };

    const handleChangeScene = () => {
        const city = model.lifeCircuit?.primaryCity || '台北市';
        const pool = ALL_EXTENDED_SCENES.filter(s => s.city === city || s.city === 'any');
        const targetPool = pool.length > 0 ? pool : ALL_EXTENDED_SCENES;

        // 排除目前場景，優先換不同 category
        const currentCategory = ALL_EXTENDED_SCENES.find(s => s.scene_id === currentSceneId)?.category;
        let nextScene = targetPool.find(s => s.scene_id !== currentSceneId && s.category !== currentCategory)
            || targetPool.find(s => s.scene_id !== currentSceneId)
            || targetPool[Math.floor(Math.random() * targetPool.length)];

        // 用新場景的名稱作為敘事起點，確保日記內容真正更換
        const newEventText = nextScene.name_zh || nextScene.event || '新的場景';

        setCurrentSceneId(nextScene.scene_id);
        setEventInput(newEventText);
        setDiary(null);
        setEditablePrompt('');
        setEditablePromptZH('');
        setGeneratedImageUrl(null);
        setSelectedPreviewImageUrl(null);
        setNarrativeStep(1);
        handleGenerateDiary(nextScene.scene_id, newEventText);
    };

    const handleSwapScene = () => {
        const city = model.lifeCircuit?.primaryCity || '台北市';
        const pool = ALL_EXTENDED_SCENES.filter(s => s.city === city || s.city === 'any');
        const targetPool = pool.length > 0 ? pool : ALL_EXTENDED_SCENES;
        const currentCat = previewScene?.category;
        const nextScene =
            targetPool.find(s => s.scene_id !== previewScene?.scene_id && s.category !== currentCat) ||
            targetPool.find(s => s.scene_id !== previewScene?.scene_id) ||
            targetPool[Math.floor(Math.random() * targetPool.length)];
        setPreviewScene(nextScene);
        setRandomSceneId(nextScene.scene_id);
        setCurrentSceneId(nextScene.scene_id);
        setEventSource('random');
        const newConfig = previewShootConfig(model, eventInput, nextScene.scene_id, previewOutfit?.outfit_id);
        setPreviewOutfit(newConfig.outfit);
    };

    const handleSwapOutfit = () => {
        const config = previewShootConfig(model, eventInput, previewScene?.scene_id, previewOutfit?.outfit_id);
        setPreviewOutfit(config.outfit);
    };

    const handleResetToStep1 = () => {
        setDiary(null);
        setGeneratedImageUrl(null);
        setSelectedPreviewImageUrl(null);
        setEventInput('');
        setCurrentSceneId(null);
        setSelectedBrief(null);
        setRandomSceneId(null);
        setEditablePrompt('');
        setEditablePromptZH('');
        setNarrativeStep(1);
    };

    const handleGeneratePlan = async () => {
        setIsGeneratingPlan(true);
        try {
            const plan = await OrchestratorService.generateWeeklyPlan(model);
            setWeeklyPlan(plan);
            setShowPlan(true);
        } catch (e) {
            addNotification({ type: 'error', message: '計畫獲取失敗 (Plan Failed)' });
        } finally {
            setIsGeneratingPlan(false);
        }
    };

    const handleFinish = async () => {
        // Guard: 防止重複點擊與無 diary 狀態下執行
        if (!diary || isExtractingMem) return;

        setIsExtractingMem(true); // 立即鎖定按鈕，給予視覺回饋
        try {
            // 0. Progression Advancement
            if (diary.meta?.story_arc_id) {
                const update = OrchestratorService.advanceStoryArc(model);
                if (update.preferences) await updateModel(model.id, update as any);
            }
            if (diary.meta?.identity_thread_id) {
                const update = OrchestratorService.advanceIdentityThread(model, diary.meta.identity_thread_id);
                if (update.preferences) await updateModel(model.id, update as any);
            }

            if (generatedImageUrl) {
                // 1. 儲存主圖與所有輪播圖到作品集
                const allImages = previewImages.length > 0 ? previewImages : [generatedImageUrl];
                for (let idx = 0; idx < allImages.length; idx++) {
                    await updateModelGallery(model.id, {
                        url: allImages[idx],
                        narrativeContent: idx === 0 ? diary.content : undefined,
                        visualPrompt: idx === 0 ? editablePrompt : undefined,
                        visualPromptZH: idx === 0 ? editablePromptZH : undefined,
                        contentCategory: diary.contentCategory,
                        styleTags: diary.contentCategory ? [diary.contentCategory] : undefined,
                        sceneId: (diary as any).sceneId || currentSceneId,
                        outfitId: (diary as any).outfitId || model.preferences?.active_outfit_id || model.preferences?.recent_outfit_ids?.[0]
                    } as any);
                }
                const imgCount = allImages.length;
                addNotification({
                    type: 'success',
                    message: `${imgCount} 張作品已存入 ${model.name} 的作品集`,
                    description: diary.contentCategory
                        ? `類別：${diary.contentCategory === 'lifestyle' ? '生活日常' : diary.contentCategory === 'curve' ? '曲線魅力' : '戲劇張力'} · 返回 IP 休息室可查看最新作品`
                        : '返回 IP 休息室可查看最新作品與內容比例'
                });

                // 2. 自動萃取並儲存記憶（不阻擋流程）
                try {
                    const extracted = await extractNewMemories(model, diary.content || '');
                    if (extracted.length > 0) {
                        const currentMems = model.worldAnchors?.longTermMemories || [];
                        await updateModel(model.id, {
                            worldAnchors: { ...model.worldAnchors, longTermMemories: [...currentMems, ...extracted] }
                        } as any);
                        setNewMemories(extracted);
                    }
                } catch (e) {
                    console.error("Memory extraction failed (non-blocking):", e);
                }
            }
            setHasFinished(true); // D3(b)：入庫成功，解除未儲存離開攔截
            onConfirm(diary, generatedImageUrl || undefined);
        } finally {
            setIsExtractingMem(false);
        }
    };

    const handleConfirmMemories = async (selectedMems: string[]) => {
        try {
            if (selectedMems.length > 0) {
                const currentMems = model.worldAnchors?.longTermMemories || [];
                await updateModel(model.id, {
                    worldAnchors: {
                        ...model.worldAnchors,
                        longTermMemories: [...currentMems, ...selectedMems]
                    }
                } as any);
                addNotification({ type: 'success', message: '核心記憶已存儲 (Memory Stored)', description: '模特兒的靈魂一致性得到加固 (Model consistency reinforced).' });
            }
            setShowMemoryConfirm(false);
            if (diary) onConfirm(diary, generatedImageUrl || undefined);
        } finally {
            setIsExtractingMem(false); // 無論成功或失敗都解鎖
        }
    };

    const isConfigLocked = Boolean(randomSceneId) || Boolean(selectedBrief?.sceneId);
    const isOutfitCooling = (model.preferences?.recent_outfit_ids || []).includes(previewOutfit?.outfit_id || '');

    const goToPreviousStage = () => {
        if (narrativeStep <= 1) return;
        setNarrativeStep((prev) => Math.max(1, prev - 1));
    };

    const goToNextStage = () => {
        if (narrativeStep === 1) {
            if (confirmedScene) setNarrativeStep(2);
            else if (pickerSceneCards[0]?.scene) confirmScene(pickerSceneCards[0].scene);
            return;
        }
        if (narrativeStep === 2) {
            if (confirmedScene && pickerOutfitOptions) {
                confirmSceneOutfit(confirmedScene, pickerOutfitOptions.topPick?.outfit_id || null);
            }
            return;
        }
        if (narrativeStep === 3) {
            if (diary) setNarrativeStep(4);
            else void handleGenerateDiary(confirmedScene?.scene_id, eventInput, confirmedOutfitId || model.preferences?.active_outfit_id);
            return;
        }
        if (narrativeStep === 4) {
            void handleGenerateImage();
        }
    };

    const isNextDisabled =
        (narrativeStep === 1 && !confirmedScene && !pickerSceneCards[0]?.scene) ||
        (narrativeStep === 2 && (!confirmedScene || !pickerOutfitOptions)) ||
        (narrativeStep === 3 && (!eventInput.trim() || isGenerating)) ||
        (narrativeStep === 4 && (!diary || isGeneratingImage));
    
    // 直接使用 WardrobeManager 的統一對照表，確保全站一致
    
    const ShootConfigCard = () => (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={`rounded-2xl border px-4 py-3 space-y-2.5 transition-all ${
                isConfigLocked
                    ? 'border-[var(--color-gold)]/30 bg-[var(--color-gold)]/[0.03]'
                    : 'border-white/5 bg-white/[0.02]'
            }`}
        >
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-gray-600">今日拍攝配置</p>
            <div className="flex items-center justify-between">
                <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-600 uppercase tracking-wider shrink-0">場景</span>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isConfigLocked ? 'bg-[var(--color-gold)] shadow-[0_0_6px_rgba(212,175,55,0.4)]' : 'bg-white/20'}`} />
                        <span className="text-[12px] font-bold text-white truncate">{previewScene?.name_zh || previewScene?.scene_id || '—'}</span>
                    </div>
                    <p className="text-[10px] text-gray-600 pl-6 truncate">
                        {previewScene?.city && previewScene.city !== 'any' ? previewScene.city : (model.lifeCircuit?.primaryCity || '台北市')}
                        {previewScene?.category ? ` · ${previewScene.category}` : ''}{' · '}{isConfigLocked ? '已鎖定' : '推測'}
                    </p>
                </div>
                <button onClick={handleSwapScene} className="shrink-0 ml-3 flex items-center gap-1 text-[11px] text-gray-500 hover:text-[var(--color-gold)] transition-colors group">
                    <svg className="w-3 h-3 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    換
                </button>
            </div>
            <div className="border-t border-white/5" />
            <div className="flex items-center justify-between">
                <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-600 uppercase tracking-wider shrink-0">服裝</span>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOutfitCooling ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                        <span className="text-[12px] font-bold text-white truncate">{STYLE_ARCHETYPE_MAP[previewOutfit?.style_archetype || ''] || previewOutfit?.style_archetype || '—'}</span>
                    </div>
                    {previewOutfit?.pillars && (() => {
                        const parts = [
                            buildStructuredOutfitLabel(previewOutfit.pillars.top || '', 'top'),
                            buildStructuredOutfitLabel(previewOutfit.pillars.bottom || '', 'bottom'),
                            buildStructuredOutfitLabel(previewOutfit.pillars.shoes || '', 'shoes'),
                        ].filter(s => s && s.trim());
                        return parts.length > 0 ? (
                            <p className="text-[10px] text-gray-400 pl-6 line-clamp-2">{parts.join('・')}</p>
                        ) : null;
                    })()}
                    <p className="text-[10px] text-gray-600 pl-6">{isOutfitCooling ? '冷卻中（最近使用）' : '可用'}</p>
                </div>
                <button onClick={handleSwapOutfit} className="shrink-0 ml-3 flex items-center gap-1 text-[11px] text-gray-500 hover:text-[var(--color-gold)] transition-colors group">
                    <svg className="w-3 h-3 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    換
                </button>
            </div>
        </motion.div>
    );

    const selectedCaptionText = selectedPlatform === 'ig' ? igCaption : selectedPlatform === 'fb' ? fbCaption : threadsCaption;

    return (
        <div className="narrative-workbench animate-fade-in">
            {previewingImage && <ImagePreviewModal {...previewingImage} onClose={() => setPreviewingImage(null)} />}
            <div className="hidden">
                <div className="max-w-[110rem] mx-auto flex justify-between items-center gap-4">
                    <div className="flex flex-col min-w-0">
                        <h2 className="text-2xl font-display font-bold uppercase tracking-[0.3em] text-[var(--color-text-main)]">靈魂敘事</h2>
                        <span className="text-[9px] uppercase tracking-[0.5em] text-[var(--color-gold)] font-light truncate">敘事流程：{model.name}</span>
                    </div>
                    <button
                        onClick={() => requestLeave(onClose)}
                        disabled={isAnyTaskRunning}
                        className={`px-4 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
                            isAnyTaskRunning
                                ? 'border-white/5 text-gray-600 opacity-40 cursor-not-allowed'
                                : 'border-white/10 text-gray-400 hover:text-white hover:border-[var(--color-gold)]/50'
                        }`}
                    >
                        返回首頁
                    </button>
                </div>
            </div>
            
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="narrative-studio relative overflow-hidden flex"
            >
                {/* Lateral Navigation */}
                <div className="narrative-rail flex flex-col items-center py-8 gap-6">
                    <div className="narrative-brand mb-8">
                       <img src={pavoraLogoIcon} alt="PAVORA" className="w-12 h-12 object-contain" />
                       <span>PAVORA</span>
                    </div>
                    <NavIconButton active={!showWardrobe && !showSettings && !showPlan} onClick={() => { setShowWardrobe(false); setShowSettings(false); setShowPlan(false); }} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>} label="敘事首頁" />
                    <NavIconButton active={showPlan} onClick={() => handleGeneratePlan()} isLoading={isGeneratingPlan} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>} label="週計畫" />
                    <NavIconButton active={showWardrobe} onClick={() => { setShowWardrobe(true); setShowSettings(false); setShowPlan(false); }} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>} label="劇組衣櫃" />
                    <NavIconButton active={showSettings} onClick={() => { setShowSettings(true); setShowWardrobe(false); setShowPlan(false); }} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.754 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-.940-1.543.826-3.31 2.37-2.37a1.724 1.724 0 001.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.940-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>} label="系統設定" />
                    <div className="mt-auto pb-8">
                        <button onClick={() => requestLeave(onClose)} disabled={isAnyTaskRunning} title={isAnyTaskRunning ? "生圖進行中，請稍候..." : "返回首頁"} className={`p-3 transition-colors rounded-full group ${isAnyTaskRunning ? "opacity-30 cursor-not-allowed bg-white/5 text-gray-600" : "text-gray-600 hover:text-white bg-white/5 hover:bg-[var(--color-gold)]/20"}`}>
                            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                </div>

                {/* Main Content Hub */}
                <div className="narrative-workspace flex-1 flex flex-col min-w-0">
                    <div className="narrative-topbar">
                        <div className="narrative-topbar-title min-w-0">
                            <p className="narrative-eyebrow">靈魂敘事工作台</p>
                            <h2>靈魂敘事工作台</h2>
                            <p className="truncate">敘事流程：{model.name}</p>
                        </div>
                        <div className="narrative-stage-track" aria-label="靈魂敘事五階段進度">
                            {NARRATIVE_STAGE_META.map((stage) => (
                                <div
                                    key={stage.step}
                                    className={`narrative-stage-node ${narrativeStep === stage.step ? 'is-active' : ''} ${narrativeStep > stage.step ? 'is-done' : ''}`}
                                >
                                    <span className="narrative-stage-index">{stage.step}</span>
                                    <span className="narrative-stage-copy">
                                        <strong>{stage.label}</strong>
                                        <em>{stage.caption}</em>
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <span className="narrative-status-pill">{narrativeStep}/5</span>
                            <span className="narrative-status-pill">引擎運作中</span>
                            <button
                                onClick={() => requestLeave(onGoHome)}
                                disabled={isAnyTaskRunning}
                                className={`narrative-back-button ${isAnyTaskRunning ? 'opacity-40 cursor-not-allowed' : ''}`}
                            >
                                返回首頁
                            </button>
                        </div>
                    </div>
                    <div className="narrative-page flex-1 custom-scrollbar relative">
                        <AnimatePresence mode="wait">
                            {showPlan && weeklyPlan ? 
                                <motion.div 
                                    key="weekly-plan"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="narrative-inner space-y-10"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-4 bg-[var(--color-gold)] rounded-full shadow-[0_0_12px_rgba(var(--color-gold-rgb),0.4)]"></div>
                                                <h3 className="text-2xl font-black text-narrative-ink tracking-[0.3em] uppercase italic">靈魂週計畫</h3>
                                            </div>
                                            <p className="text-[10px] text-[#bf8d23] font-black uppercase tracking-[0.6em] ml-4 italic px-1">Predictive Narrative Architecture</p>
                                        </div>
                                        <button onClick={() => setShowPlan(false)} className="text-[10px] text-narrative-ink-soft hover:text-narrative-ink transition-colors uppercase tracking-widest font-black border-b border-narrative-ink/20 pb-1">返回敘事</button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                                        {weeklyPlan.map((brief, idx) => (
                                            <motion.div 
                                                key={idx}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className={`p-8 rounded-[2.5rem] border transition-all relative overflow-hidden group shadow-sm ${
                                                    brief.isArcScene 
                                                    ? 'bg-[var(--color-gold)]/[0.08] border-[var(--color-gold)]/40' 
                                                    : brief.isThreadScene 
                                                    ? 'bg-emerald-500/[0.08] border-emerald-500/40' 
                                                    : 'bg-white border-narrative-mist hover:border-narrative-ink/30'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start mb-6">
                                                    <div>
                                                        <p className="text-[10px] text-narrative-ink-soft/80 font-black uppercase tracking-widest leading-none mb-1">第 {idx + 1} 天</p>
                                                        <h4 className="text-sm font-black text-narrative-ink uppercase tracking-tight italic">{brief.title}</h4>
                                                    </div>
                                                    {brief.isArcScene && <span className="px-2 py-1 bg-[var(--color-gold)] text-black text-[8px] font-black rounded-md">故事環節</span>}
                                                    {brief.isThreadScene && <span className="px-2 py-1 bg-emerald-500 text-black text-[8px] font-black rounded-md">發展線</span>}
                                                </div>

                                                <div className="space-y-4 mb-8">
                                                    <div className="space-y-2">
                                                        {brief.scripts.map((script, sIdx) => (
                                                            <div key={sIdx} className="flex gap-3 items-start group/line">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-narrative-ink-soft/30 mt-1.5 group-hover/line:bg-[var(--color-gold)] transition-colors"></div>
                                                                <span className="text-[11px] text-narrative-ink-soft font-medium leading-normal italic group-hover/line:text-narrative-ink">{script}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    
                                                    {brief.strategy_tags && brief.strategy_tags.length > 0 && (
                                                        <div className="pt-4 border-t border-narrative-mist flex flex-wrap gap-2">
                                                            {brief.strategy_tags.map((tag, tIdx) => (
                                                                <span key={tIdx} className="px-2 py-0.5 bg-narrative-mist/40 border border-narrative-mist rounded text-[8px] font-black text-narrative-ink-soft/90 uppercase tracking-tighter">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <motion.button 
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => {
                                                        setSelectedBrief(brief);
                                                        setEventSource('weekly');
                                                        const scriptLines = (brief.scripts && brief.scripts.length > 0)
                                                            ? brief.scripts.map(s => `・${s}`).join('\n')
                                                            : '';
                                                        const fullEvent = scriptLines
                                                            ? `${brief.title}\n${scriptLines}`
                                                            : brief.title;
                                                        setEventInput(fullEvent);
                                                        setShowPlan(false);
                                                        addNotification({ type: 'success', message: '靈魂與計畫對齊', description: '生成引擎已載入劇本標題與子任務。' });
                                                    }}
                                                    className={`w-full py-4.5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.25em] transition-all relative z-10 ${
                                                        brief.isArcScene 
                                                        ? 'bg-[var(--color-gold)] text-black shadow-xl shadow-[var(--color-gold)]/20 hover:bg-[var(--color-gold)]/90' 
                                                        : brief.isThreadScene 
                                                        ? 'bg-emerald-500 text-black shadow-xl shadow-emerald-500/20 hover:bg-emerald-500/90' 
                                                        : 'bg-transparent text-[var(--narrative-ink-soft)] border border-[var(--narrative-ink)]/20 hover:bg-[var(--narrative-ink)] hover:text-white hover:border-[var(--narrative-ink)]'
                                                    }`}
                                                >
                                                    對齊計畫
                                                </motion.button>
                                                
                                                <div className="absolute top-0 right-0 w-24 h-[1px] bg-gradient-to-l from-[var(--narrative-ink)]/5 to-transparent"></div>
                                                <div className="absolute bottom-0 left-0 w-[1px] h-24 bg-gradient-to-t from-[var(--narrative-ink)]/5 to-transparent"></div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            : showSettings ? 
                                <motion.div 
                                    key="settings"
                                    initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
                                    className="narrative-inner space-y-10 custom-scrollbar overflow-y-auto h-full"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-4 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.4)]"></div>
                                                <h3 className="text-2xl font-black text-[var(--narrative-ink)] tracking-[0.3em] uppercase italic">敘事矩陣設定</h3>
                                            </div>
                                            <p className="text-[10px] text-[#bf8d23] font-black uppercase tracking-[0.6em] ml-4 italic">Persona Parameter Control</p>
                                        </div>
                                    </div>
                                    <NarrativeSettings model={model} onUpdate={(u) => updateModel(model.id, u)} />
                                </motion.div>
                            : showWardrobe ? 
                                <motion.div 
                                    key="wardrobe"
                                    initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
                                    className="narrative-inner custom-scrollbar overflow-y-auto h-full"
                                >
                                    <WardrobeManager model={model} onUpdate={(u) => updateModel(model.id, u)} />
                                </motion.div>
                            : 
                                <motion.div
                                    key="main-workflow"
                                    initial={{ opacity: 0, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, filter: 'blur(10px)' }}
                                    className="narrative-inner space-y-10 min-h-full overflow-y-auto custom-scrollbar"
                                >
                                    {/* ── Step 1：選場景 ─────────────────────────────── */}
                                    {narrativeStep === 1 && (
                                        <div className={`narrative-flow-overlay narrative-step-shell absolute inset-0 backdrop-blur-sm overflow-y-auto z-20 flex flex-col ${isGeneratingImage ? 'is-stage-locked' : ''}`}>
                                            {/* Header */}
                                            <div className="narrative-step-header narrative-screen-head px-8 py-5 border-b border-white/10 shrink-0">
                                                <div>
                                                    <p className="text-[12px] font-black text-[var(--color-gold)] uppercase tracking-[0.5em]">Stage 01 · Scene Casting</p>
                                                    <h2>先替今天的靈魂<br />選一個真實現場</h2>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">地區 / 類別篩選、固定場景卡、AI 感應場景、換一批。點擊場景後進入服裝搭配。</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => pickerSceneCards[0]?.scene && confirmScene(pickerSceneCards[0].scene)}
                                                    disabled={!pickerSceneCards[0]?.scene}
                                                    className="narrative-screen-cta"
                                                >
                                                    確認場景 →
                                                </button>
                                            </div>
                                            {/* Filters */}
                                            <div className="px-8 py-4 border-b border-white/5 space-y-3 shrink-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[10px] text-gray-600 uppercase tracking-widest w-8 shrink-0">地區</span>
                                                    {([
                                                        { label: '全台', value: null },
                                                        { label: '北部', value: 'north' },
                                                        { label: '中部', value: 'central' },
                                                        { label: '南部', value: 'south' },
                                                        { label: '東部', value: 'east' },
                                                        { label: '外島', value: 'islands' },
                                                    ] as Array<{label: string; value: string | null}>).map(r => (
                                                        <button key={String(r.value)}
                                                            onClick={() => setPickerRegion(r.value)}
                                                            className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wide transition-all ${pickerRegion === r.value ? 'bg-[var(--color-gold)] text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                                                            {r.label}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[10px] text-gray-600 uppercase tracking-widest w-8 shrink-0">類別</span>
                                                    {([
                                                        { label: '全部',   value: null },
                                                        { label: '城市街頭', value: 'urban' },
                                                        { label: '咖啡日常', value: 'cafe' },
                                                        { label: '海岸泳池', value: 'beach' },
                                                        { label: '山林田野', value: 'mountain' },
                                                        { label: '文化廟町', value: 'culture' },
                                                    ] as Array<{label: string; value: string | null}>).map(c => (
                                                        <button key={String(c.value)}
                                                            onClick={() => setPickerCategory(c.value)}
                                                            className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wide transition-all ${pickerCategory === c.value ? 'bg-[var(--color-gold)] text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                                                            {c.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            {/* Cards */}
                                            <div className="flex-1 overflow-y-auto px-8 py-6">
                                                <div className="narrative-card-grid grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                    {pickerSceneCards.map((card) => {
                                                        const of = (card.scene as any).outfit_filter as string[] || [];
                                                        const nonUrban = of.filter((x: string) => x !== 'urban_street');
                                                        const primaryCtx = nonUrban[0] || of[0] || '';
                                                        const ctxLabel: Record<string,string> = {
                                                            beach_island:'海岸泳池', mountain_outdoor:'山林田野', rural_field:'田野',
                                                            cafe_aesthetic:'咖啡日常', temple_old_town:'文化廟町', festival_event:'節慶',
                                                            urban_street:'城市街頭', shopping_random:'購物', night_market:'夜市',
                                                            travel_journey:'旅途移動', home_cozy:'居家', office_pro:'職場',
                                                        };
                                                        const regionLabel: Record<string,string> = { north:'北部', central:'中部', south:'南部', east:'東部', islands:'外島', all:'全台' };
                                                        return (
                                                            <div key={card.scene.scene_id}
                                                                onClick={() => confirmScene(card.scene)}
                                                                className="narrative-choice-card bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[14px] p-3.5 flex flex-col cursor-pointer hover:border-[var(--color-gold)]/40 hover:bg-white/5 transition-all active:scale-[0.98] min-h-[240px]">
                                                                {/* 頂部 badge 區 */}
                                                                <div className="flex gap-1.5 flex-wrap mb-3">
                                                                    <span className="text-[9px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{regionLabel[(card.scene as any).region] || '全台'}</span>
                                                                    {ctxLabel[primaryCtx] && <span className="text-[9px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{ctxLabel[primaryCtx]}</span>}
                                                                </div>
                                                                {/* 場景名稱（靠上，推底部往下） */}
                                                                <p className="text-[16px] font-black text-white leading-tight mb-auto">{card.scene.name_zh}</p>
                                                                {/* 分隔線 + 事件描述（完整內容） */}
                                                                <div className="mt-4">
                                                                    <div className="border-t border-[var(--color-gold)]/10 mb-3" />
                                                                    <p className="text-[11px] text-gray-400 leading-relaxed mb-3">{card.eventText}</p>
                                                                    <p className="text-[9px] text-[var(--color-gold)]/50 font-bold uppercase tracking-widest">{ctxLabel[primaryCtx] || primaryCtx}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {/* AI Card（懶載入，點擊才呼叫 API） */}
                                                    <div className="narrative-choice-card is-featured bg-[var(--color-bg-card)] border border-[var(--color-gold)]/30 rounded-[14px] p-3.5 flex flex-col cursor-pointer hover:border-[var(--color-gold)]/60 hover:bg-white/5 transition-all active:scale-[0.98] min-h-[240px]"
                                                        onClick={() => {
                                                            if (pickerAICardScene) confirmScene(pickerAICardScene);
                                                            else if (!isAICardLoading) void handleLoadAICard();
                                                        }}>
                                                        <span className="text-[9px] font-black text-[var(--color-gold)] uppercase tracking-widest mb-3">✦ AI 感應</span>
                                                        {isAICardLoading ? (
                                                            <div className="flex-1 space-y-2 animate-pulse">
                                                                <div className="h-2.5 bg-white/10 rounded-full w-3/4"/>
                                                                <div className="h-2 bg-white/5 rounded-full w-full"/>
                                                                <div className="h-2 bg-white/5 rounded-full w-2/3"/>
                                                            </div>
                                                        ) : pickerAICardScene ? (
                                                            <>
                                                                <p className="text-[16px] font-black text-white leading-tight mb-auto">{pickerAICardScene.name_zh}</p>
                                                                <div className="mt-4">
                                                                    <div className="border-t border-[var(--color-gold)]/10 mb-3" />
                                                                    <p className="text-[11px] text-gray-400 leading-relaxed mb-3">{pickerAICardText}</p>
                                                                    <p className="text-[9px] text-[var(--color-gold)]/50 font-bold uppercase tracking-widest">靈魂導向</p>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
                                                                    <span className="text-[28px] text-[var(--color-gold)]/15">✦</span>
                                                                    <p className="text-[11px] text-gray-500 italic leading-relaxed">點擊讓<br/>AI 感應</p>
                                                                </div>
                                                                <p className="text-[9px] text-[var(--color-gold)]/30 font-bold uppercase tracking-widest">靈魂導向</p>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Refresh random cards */}
                                                <div className="flex justify-end mt-4">
                                                    <button onClick={refreshRandomCards}
                                                        className="text-[9px] text-gray-500 hover:text-white font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                                                        <span>↺</span> 換一批
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── Step 2：選服裝 ─────────────────────────────── */}
                                    {narrativeStep === 2 && pickerOutfitOptions && (
                                        <div className="narrative-flow-overlay narrative-step-shell absolute inset-0 backdrop-blur-sm overflow-y-auto z-20 flex flex-col">
                                            {/* Header */}
                                            <div className="narrative-step-header narrative-screen-head px-8 py-5 border-b border-white/10 shrink-0 flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black text-[var(--color-gold)] uppercase tracking-[0.5em]">Stage 02 · Wardrobe Casting</p>
                                                    <h2>服裝不是裝飾，<br />是角色今天的語氣</h2>
                                                    <p className="text-[9px] text-gray-400 mt-0.5">{confirmedScene?.name_zh} · 場景適配穿搭、AI top pick、替代方案與自動搭配。</p>
                                                </div>
                                                <div className="narrative-screen-actions">
                                                    <button onClick={() => setNarrativeStep(1)}
                                                        className="narrative-screen-link">
                                                        ← 返回場景
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => confirmSceneOutfit(confirmedScene, pickerOutfitOptions.topPick?.outfit_id || null)}
                                                        className="narrative-screen-cta"
                                                    >
                                                        選定造型 →
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Outfit Cards */}
                                            <div className="flex-1 overflow-y-auto px-8 py-6">
                                                <div className="narrative-card-grid grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                    {pickerOutfitOptions.alternatives.map((outfit: any) => (
                                                        <div key={outfit.outfit_id}
                                                            onClick={() => confirmSceneOutfit(confirmedScene, outfit.outfit_id)}
                                                            className="narrative-choice-card bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[14px] p-3.5 flex flex-col cursor-pointer hover:border-[var(--color-gold)]/40 hover:bg-white/5 transition-all active:scale-[0.98] min-h-[240px]">
                                                            <p className="text-[16px] font-black text-white leading-tight mb-2">
                                                                {STYLE_ARCHETYPE_MAP[outfit.style_archetype] || outfit.style_archetype}
                                                            </p>
                                                            <div className="border-t border-[var(--color-gold)]/10 mt-1 mb-3" />
                                                            <div className="flex flex-col gap-1.5 flex-1">
                                                                {(['top','bottom','shoes','accessories'] as const).map(k =>
                                                                    outfit.pillars?.[k] ? (
                                                                        <div key={k} className="flex items-start gap-1.5">
                                                                            <span className="text-[9px] font-bold text-[var(--color-gold)]/60 shrink-0 w-6">
                                                                                {k === 'top' ? '上身' : k === 'bottom' ? '下身' : k === 'shoes' ? '鞋款' : '配件'}
                                                                            </span>
                                                                            <span className="text-[10px] text-gray-400 leading-relaxed">{translateClothing(outfit.pillars[k])}</span>
                                                                        </div>
                                                                    ) : null
                                                                )}
                                                            </div>
                                                            <p className="text-[9px] text-[var(--color-gold)]/50 font-bold uppercase tracking-widest mt-3">
                                                                {outfit.season?.toLowerCase() === 'summer' ? '夏季' :
                                                                 outfit.season?.toLowerCase() === 'winter' ? '冬季' :
                                                                 outfit.season?.toLowerCase() === 'spring' ? '春季' :
                                                                 (outfit.season?.toLowerCase() === 'fall' || outfit.season?.toLowerCase() === 'autumn' || outfit.season?.toLowerCase() === 'spring_autumn') ? '秋季' :
                                                                 outfit.season?.toLowerCase() === 'all' ? '全年' : outfit.season}
                                                            </p>
                                                        </div>
                                                    ))}
                                                    {/* AI 推薦（topPick） */}
                                                    <div
                                                        onClick={() => confirmSceneOutfit(confirmedScene, pickerOutfitOptions.topPick.outfit_id)}
                                                        className="narrative-choice-card is-featured bg-[var(--color-bg-card)] border border-[var(--color-gold)]/30 rounded-[14px] p-3.5 flex flex-col cursor-pointer hover:border-[var(--color-gold)]/60 hover:bg-white/5 transition-all active:scale-[0.98] min-h-[240px]">
                                                        <span className="text-[9px] font-black text-[var(--color-gold)] uppercase tracking-widest mb-2">✦ AI 推薦</span>
                                                        <p className="text-[16px] font-black text-white leading-tight mb-2">
                                                            {STYLE_ARCHETYPE_MAP[pickerOutfitOptions.topPick.style_archetype] || pickerOutfitOptions.topPick.style_archetype}
                                                        </p>
                                                        <div className="border-t border-[var(--color-gold)]/10 mt-1 mb-3" />
                                                        <div className="flex flex-col gap-1.5 flex-1">
                                                            {(['top','bottom','shoes','accessories'] as const).map(k =>
                                                                pickerOutfitOptions.topPick.pillars?.[k] ? (
                                                                    <div key={k} className="flex items-start gap-1.5">
                                                                        <span className="text-[9px] font-bold text-[var(--color-gold)]/60 shrink-0 w-6">
                                                                            {k === 'top' ? '上身' : k === 'bottom' ? '下身' : k === 'shoes' ? '鞋款' : '配件'}
                                                                        </span>
                                                                        <span className="text-[10px] text-gray-400 leading-relaxed">{translateClothing(pickerOutfitOptions.topPick.pillars[k])}</span>
                                                                    </div>
                                                                ) : null
                                                            )}
                                                        </div>
                                                        <p className="text-[9px] text-[var(--color-gold)]/50 font-bold uppercase tracking-widest mt-3">
                                                            {pickerOutfitOptions.topPick.season?.toLowerCase() === 'summer' ? '夏季' :
                                                             pickerOutfitOptions.topPick.season?.toLowerCase() === 'winter' ? '冬季' :
                                                             pickerOutfitOptions.topPick.season?.toLowerCase() === 'spring' ? '春季' :
                                                             (pickerOutfitOptions.topPick.season?.toLowerCase() === 'fall' || pickerOutfitOptions.topPick.season?.toLowerCase() === 'autumn' || pickerOutfitOptions.topPick.season?.toLowerCase() === 'spring_autumn') ? '秋季' :
                                                             pickerOutfitOptions.topPick.season?.toLowerCase() === 'all' ? '全年' : pickerOutfitOptions.topPick.season}
                                                        </p>
                                                    </div>
                                                </div>
                                                {/* Skip */}
                                                <div className="flex justify-center mt-6">
                                                    <button onClick={() => confirmSceneOutfit(confirmedScene, null)}
                                                        className="text-[9px] text-gray-600 hover:text-gray-400 transition-colors">
                                                        略過，自動搭配
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── Step 4：劇本審閱 ─────────────────────────────── */}
                                    {narrativeStep === 4 && diary && (
                                        <div className="narrative-flow-overlay narrative-step-shell absolute inset-0 backdrop-blur-sm overflow-y-auto z-20 flex flex-col">
                                            {/* Header */}
                                            <div className="narrative-step-header narrative-screen-head px-8 py-5 border-b border-white/10 shrink-0 flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black text-[var(--color-gold)] uppercase tracking-[0.5em]">Stage 04 · Prompt Review</p>
                                                    <h2>雙語提示詞審片台</h2>
                                                    <p className="text-[8px] text-gray-500 uppercase tracking-widest mt-0.5">中文提示詞、英文 final prompt、分段模組、雙向同步與生成影像 CTA。</p>
                                                </div>
                                                <div className="narrative-screen-actions">
                                                    <button onClick={() => setNarrativeStep(3)}
                                                        disabled={isGeneratingImage}
                                                        className="narrative-screen-link">
                                                        ← 調整設定
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleGenerateImage()}
                                                        disabled={!diary || isGeneratingImage}
                                                        className="narrative-screen-cta"
                                                    >
                                                        {isGeneratingImage ? '生成中...' : '生成敘事影像 →'}
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Two-column prompts */}
                                            <div className="flex-1 overflow-y-auto px-8 py-6">
                                                <div className="narrative-review-toolbar">
                                                    <div>
                                                        <p className="narrative-deliver-section-label">同步提示詞</p>
                                                        <strong>將 Step 3 的比例、畫質、POV、服裝與場景設定同步到中英文 prompt</strong>
                                                    </div>
                                                    <div className="narrative-review-actions">
                                                        <button
                                                            type="button"
                                                            onClick={() => addNotification({ type: 'success', message: '差異檢查完成', description: '目前可於左右欄比對中文與英文提示詞內容。' })}
                                                            disabled={isGeneratingImage}
                                                        >
                                                            檢查差異
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSyncPrompt()}
                                                            disabled={isSyncing || isGeneratingImage}
                                                        >
                                                            {isSyncing ? '同步中...' : '⇄ 雙向同步'}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="narrative-review-grid grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                    {/* ZH Column */}
                                                    <div className="space-y-3">
                                                        <p className="text-[9px] font-black text-[var(--color-gold)] uppercase tracking-widest">中文提示詞</p>
                                                        {hasStructuredPromptZH ? (
                                                            <div className="space-y-2">
                                                                {getReviewPromptSections('ZH').map((section) => (
                                                                    <div key={`zh-${section.label}-${section.lineIndex}`}
                                                                        className="flex flex-col bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-3 hover:border-[var(--color-gold)]/30 transition-all">
                                                                        <span className="text-[8px] font-black text-[var(--color-gold)] uppercase tracking-widest mb-1 pl-1">
                                                                            {getPromptSectionDisplayLabel(section.label, 'ZH')}
                                                                        </span>
                                                                        <textarea
                                                                            className="w-full bg-transparent border-none p-0 text-[11px] text-[var(--color-text-main)] focus:ring-0 resize-none min-h-[36px] outline-none leading-relaxed"
                                                                            value={section.value}
                                                                            onChange={(e) => updateReviewPromptSection('ZH', section, e.target.value)}
                                                                            disabled={isGeneratingImage}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <textarea
                                                                className="w-full h-48 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-2xl p-4 text-[10px] text-[var(--color-text-main)] focus:border-[var(--color-gold)]/50 transition-all resize-none outline-none leading-relaxed"
                                                                value={editablePromptZH}
                                                                onChange={(e) => setEditablePromptZH(e.target.value)}
                                                                disabled={isGeneratingImage}
                                                            />
                                                        )}
                                                    </div>
                                                    {/* EN Column */}
                                                    <div className="space-y-3">
                                                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">English Prompt</p>
                                                        {hasStructuredPromptEN ? (
                                                            <div className="space-y-2">
                                                                {getReviewPromptSections('EN').map((section) => (
                                                                    <div key={`en-${section.label}-${section.lineIndex}`}
                                                                        className={`flex flex-col bg-[var(--color-bg-card)] border rounded-2xl p-3 transition-all ${section.value ? 'border-[var(--color-border)] hover:border-blue-500/20' : 'border-dashed border-blue-400/20'}`}>
                                                                        <span className="text-[8px] font-mono font-bold text-blue-400/50 uppercase tracking-widest mb-1 pl-1">
                                                                            {section.label}
                                                                        </span>
                                                                        <textarea
                                                                            className="w-full bg-transparent border-none p-0 text-[10px] font-mono text-gray-400 focus:ring-0 resize-none min-h-[36px] outline-none leading-tight"
                                                                            value={section.value}
                                                                            onChange={(e) => updateReviewPromptSection('EN', section, e.target.value)}
                                                                            disabled={isGeneratingImage}
                                                                            placeholder={section.value === '' ? `No ${section.label.toLowerCase()} content — run ⇄ Sync to populate` : ''}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <textarea
                                                                className="w-full h-48 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-2xl p-4 text-[10px] font-mono text-[var(--color-text-main)] focus:border-blue-500/50 transition-all resize-none outline-none leading-relaxed"
                                                                value={editablePrompt}
                                                                onChange={(e) => setEditablePrompt(e.target.value)}
                                                                disabled={isGeneratingImage}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Shoot config summary row */}
                                                <div className="narrative-shoot-summary mt-6 grid grid-cols-5 gap-2 p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl">
                                                    {[
                                                        { label: '場景', value: confirmedScene?.name_zh || '—' },
                                                        { label: '服裝', value: confirmedOutfitId ? '已選' : '自動' },
                                                        { label: '比例', value: aspectRatio },
                                                        { label: '畫質', value: quality },
                                                        { label: '視角', value: isPOV ? '第一人稱' : '第三人稱' },
                                                    ].map(cell => (
                                                        <div key={cell.label} className="narrative-shoot-summary-cell flex flex-col items-center gap-1">
                                                            <span>{cell.label}</span>
                                                            <strong>{cell.value}</strong>
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* CTA */}
                                                <button
                                                    onClick={() => handleGenerateImage()}
                                                    disabled={!diary || isGeneratingImage}
                                                    className={`w-full mt-6 py-5 text-[12px] font-black tracking-[0.5em] uppercase rounded-3xl transition-all duration-300 ${
                                                        !diary || isGeneratingImage
                                                            ? 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed opacity-50'
                                                            : 'bg-emerald-500 text-black shadow-[0_20px_40px_rgba(16,185,129,0.15)] hover:shadow-[0_25px_50px_rgba(16,185,129,0.25)]'
                                                    }`}
                                                >
                                                    {isGeneratingImage ? '正在捕捉靈魂切片...' : '生成敘事影像'}
                                                </button>
                                            </div>
                                            {isGeneratingImage && (
                                                <div className="narrative-stage-lock-overlay" aria-live="polite">
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{ display: 'flex', gap: '5px' }}>
                                                            {[0,1,2].map(i => (
                                                                <span key={i} style={{
                                                                    width: 7, height: 7, borderRadius: '50%',
                                                                    background: '#fff',
                                                                    animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`
                                                                }} />
                                                            ))}
                                                        </div>
                                                        <span>{STAGE04_WAIT_MESSAGES[stage04MsgIdx]}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ── Step 5：出圖結果 ─────────────────────────────── */}
                                    {narrativeStep === 5 && generatedImageUrl && (
                                        <div className="narrative-flow-overlay narrative-step-shell narrative-result-shell absolute inset-0 z-20 flex flex-col overflow-hidden">
                                            <div className="narrative-deliver-layout flex-1 overflow-hidden">
                                                <div className="narrative-deliver-preview">
                                                    <div className="narrative-deliver-preview-toolbar">
                                                        <span>Image Preview</span>
                                                        <button onClick={() => setShowLightbox(true)}>↗ 放大</button>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowLightbox(true)}
                                                        className="narrative-deliver-image"
                                                        aria-label="放大預覽影像"
                                                    >
                                                        <img src={activePreviewImageUrl || generatedImageUrl} alt="generated" />
                                                    </button>
                                                    <div className="narrative-deliver-thumbs">
                                                        {previewImages.map((img, i) => (
                                                            <button
                                                                type="button"
                                                                key={`${img}-${i}`}
                                                                onClick={() => setSelectedPreviewImageUrl(img)}
                                                                className={img === activePreviewImageUrl ? 'is-active' : ''}
                                                                aria-label={i === 0 ? '主圖' : `輪播圖 ${i}`}
                                                            >
                                                                <img src={img} alt={i === 0 ? 'main' : `variation-${i}`} />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="narrative-deliver-panel">
                                                    <p className="narrative-deliver-kicker">Stage 05 · Delivery Desk</p>
                                                    <h2 className="narrative-deliver-heading">影像已生成，準備發布</h2>
                                                    {(model.persona?.coreVibe || model.persona?.mbti) && (
                                                        <p className="narrative-deliver-persona">
                                                            {[getCoreVibeZH(model.persona?.coreVibe || ''), model.persona?.mbti].filter(Boolean).join(' · ')}
                                                        </p>
                                                    )}

                                                    <div className="narrative-deliver-micro-grid">
                                                        {[
                                                            { label: '場景', value: confirmedScene?.name_zh || '未指定' },
                                                            { label: '服裝', value: confirmedOutfitId ? '已選造型' : '自動搭配' },
                                                            { label: '比例', value: aspectRatio },
                                                            { label: '畫質', value: quality },
                                                        ].map(c => (
                                                            <div key={c.label} className="narrative-deliver-micro">
                                                                <span>{c.label}</span>
                                                                <strong>{c.value}</strong>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="narrative-deliver-section">
                                                        <div className="narrative-platform-tabs">
                                                            {(['ig', 'fb', 'threads'] as const).map(p => (
                                                                <button
                                                                    key={p}
                                                                    onClick={() => void handleCaptionTabClick(p)}
                                                                    className={selectedPlatform === p ? 'is-active' : ''}
                                                                >
                                                                    {p === 'ig' ? 'Instagram' : p === 'fb' ? 'Facebook' : 'Threads'}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        {isLoadingCaption ? (
                                                            <div className="narrative-caption-loading">
                                                                <span />
                                                                <span />
                                                                <span />
                                                            </div>
                                                        ) : (
                                                            <textarea
                                                                value={selectedCaptionText}
                                                                onChange={(e) => {
                                                                    if (selectedPlatform === 'ig') setIgCaption(e.target.value);
                                                                    else if (selectedPlatform === 'fb') setFbCaption(e.target.value);
                                                                    else setThreadsCaption(e.target.value);
                                                                }}
                                                                className="narrative-caption-editor"
                                                                placeholder={selectedPlatform === 'ig' ? 'IG 文案生成中...' : '點擊上方標籤生成平台文案'}
                                                            />
                                                        )}
                                                    </div>

                                                    <div className="narrative-deliver-section">
                                                        <p className="narrative-deliver-section-label">回到流程</p>
                                                        <div className="narrative-deliver-option-grid">
                                                        <button onClick={() => { setNarrativeStep(1); setDiary(null); setGeneratedImageUrl(null); setSelectedPreviewImageUrl(null); setIgCaption(''); setFbCaption(''); setThreadsCaption(''); setCarouselImages([]); setCarouselMode(false); }}>換場景</button>
                                                            <button onClick={() => setNarrativeStep(2)}>換服裝</button>
                                                        <button onClick={() => { setNarrativeStep(3); setDiary(null); setSelectedPreviewImageUrl(null); setIgCaption(''); setFbCaption(''); setThreadsCaption(''); setCarouselImages([]); setCarouselMode(false); }}>換敘事</button>
                                                            <button onClick={() => void handleGenerateCarouselVariation('surprise')} disabled={isGeneratingVariation}>{isGeneratingVariation ? '生成中' : '再生一張'}</button>
                                                        </div>
                                                    </div>

                                                    <div className="narrative-deliver-section">
                                                        <p className="narrative-deliver-section-label">輪播變化方向</p>
                                                        <div className="narrative-deliver-option-grid">
                                                            {([
                                                                { type: 'pose', label: '換姿勢' },
                                                                { type: 'expression', label: '換表情' },
                                                                { type: 'angle', label: '換角度' },
                                                                { type: 'surprise', label: 'AI 隨機' },
                                                            ] as const).map(v => (
                                                                <button
                                                                    key={v.type}
                                                                    onClick={() => void handleGenerateCarouselVariation(v.type)}
                                                                    disabled={isGeneratingVariation}
                                                                >
                                                                    {v.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="narrative-deliver-action-grid">
                                                        <button onClick={() => { const a = document.createElement('a'); a.href = generatedImageUrl!; a.download = `${model.name || 'pavora'}-${Date.now()}.jpg`; a.click(); }}>
                                                            ↓ 儲存影像
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (!selectedCaptionText.trim()) return;
                                                                void navigator.clipboard?.writeText(selectedCaptionText);
                                                                addNotification({ type: 'success', message: '文案已複製' });
                                                            }}
                                                        >
                                                            複製文案
                                                        </button>
                                                        <button onClick={() => void handleGenerateCarouselVariation('surprise')} disabled={isGeneratingVariation}>
                                                            {isGeneratingVariation ? '生成中...' : '再生一張'}
                                                        </button>
                                                        <button className="is-primary" onClick={() => handleFinish()} disabled={isExtractingMem || isFinishCooldown} title={isFinishCooldown ? '影像剛生成，請稍候片刻再確認送出' : undefined}>
                                                            {isExtractingMem ? '記憶中...' : '完成佈署 →'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Stage 05：輪播生成 lock overlay */}
                                            {isGeneratingVariation && (
                                                <div className="narrative-stage-lock-overlay" aria-live="polite">
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{ display: 'flex', gap: '5px' }}>
                                                            {[0,1,2].map(i => (
                                                                <span key={i} style={{
                                                                    width: 7, height: 7, borderRadius: '50%',
                                                                    background: '#fff',
                                                                    animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`
                                                                }} />
                                                            ))}
                                                        </div>
                                                        <span>{STAGE05_WAIT_MESSAGES[stage05MsgIdx]}</span>
                                                    </div>
                                                </div>
                                            )}
                                            {/* Lightbox */}
                                            {showLightbox && (
                                                <div className="fixed inset-0 z-50 bg-black/95"
                                                    onClick={(e) => { if (e.target === e.currentTarget) setShowLightbox(false); }}>
                                                    <button onClick={() => setShowLightbox(false)}
                                                        className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white text-2xl font-light w-10 h-10 flex items-center justify-center transition-colors">✕</button>
                                                    <button onClick={initLightboxCenter}
                                                        className="absolute bottom-4 right-4 z-10 text-[8px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-colors">重置</button>
                                                    <div ref={lbContainerRef}
                                                        className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none">
                                                        <img ref={lbImgRef} src={activePreviewImageUrl || generatedImageUrl} alt="lightbox"
                                                            className="absolute left-0 top-0 max-w-none"
                                                            style={{ transformOrigin: '0 0' }}
                                                            draggable={false} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Ambient Matrix Grid - Phase 3 Visual */}
                                    <div className={`${narrativeStep === 3 ? 'absolute inset-0 pointer-events-none opacity-20 overflow-hidden' : 'hidden'}`}>
                                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:45px_45px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
                                        <motion.div 
                                            animate={{ y: [0, 1000] }}
                                            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                                            className="absolute top-0 left-0 right-0 h-[250px] bg-gradient-to-b from-transparent via-[var(--color-gold)]/5 to-transparent opacity-40 shadow-[0_40px_40px_rgba(212,175,55,0.02)]"
                                        />
                                    </div>

                                    <div className={`${narrativeStep === 3 ? 'narrative-script-stage relative z-10 flex flex-col gap-8 pb-16 text-left' : 'hidden'}`}>
                                        <div className="narrative-screen-head narrative-script-head">
                                            <div>
                                                <p className="text-[10px] font-black text-[var(--color-gold)] uppercase tracking-[0.5em]">Stage 03 · Narrative Script</p>
                                                <h2>把場景變成<br />一段可拍攝的生活</h2>
                                                <p>事件描述、場景 / 服裝確認卡、生成日記、拍攝設定與視覺控制。</p>
                                            </div>
                                        </div>
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="narrative-script-summary grid grid-cols-2 lg:grid-cols-4 gap-8 p-8 bg-[var(--color-bg-card)]/40 rounded-[3rem] border border-[var(--color-border)] backdrop-blur-xl shadow-2xl"
                                        >
                                            <div className="space-y-1.5 border-r border-[var(--color-border)] pr-6">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">人格內核</p>
                                                <p className="text-base text-[var(--color-gold)] font-black italic">{model.persona?.mbti || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-1.5 border-r border-[var(--color-border)] px-6">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">核心氛圍</p>
                                                <p className="text-base text-[var(--color-text-title)] font-black uppercase tracking-tight">{model.persona?.coreVibe || 'Standard'}</p>
                                            </div>
                                            <div className="space-y-1.5 border-r border-[var(--color-border)] px-6">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">主力足跡</p>
                                                <p className="text-base text-[var(--color-text-title)] font-bold">{model.lifeCircuit?.primaryCity || 'Global'}</p>
                                            </div>
                                            <div className="space-y-1.5 pl-6">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">生理對齊</p>
                                                <p className="text-base text-emerald-500 font-black flex items-center gap-3">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)] animate-pulse"></span>
                                                    已上線
                                                </p>
                                            </div>
                                        </motion.div>


                                        <div className="narrative-script-grid order-1 grid grid-cols-1 xl:grid-cols-2 gap-8 pt-0">
                                            {/* Left: Narrative Decision 敘事決策區 */}
                                            <div className="narrative-script-panel space-y-10">
                                                <motion.div 
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.3 }}
                                                className="space-y-8"
                                            >
                                                    <div className="narrative-stage3-metrics">
                                                        {[
                                                            { label: '場景', value: confirmedScene?.name_zh || '未指定' },
                                                            { label: '造型', value: confirmedOutfitId ? (STYLE_ARCHETYPE_MAP[([...(pickerOutfitOptions?.alternatives || []), pickerOutfitOptions?.topPick].find((o: any) => o?.outfit_id === confirmedOutfitId) as any)?.style_archetype || ''] || '已選服裝') : '自動搭配' },
                                                            { label: '人格', value: model.persona?.mbti || 'N/A' },
                                                            { label: '狀態', value: eventInput.trim() ? '可生成' : '待輸入' },
                                                        ].map(metric => (
                                                            <div key={metric.label} className="narrative-stage3-metric">
                                                                <small>{metric.label}</small>
                                                                <strong>{metric.value}</strong>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="space-y-6">
                                                        <div className="flex justify-between items-end">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1 h-3 bg-white/20 rounded-full"></div>
                                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">
                                                                        當下敘事起點
                                                                    </label>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-6 pb-1">
                                                                <motion.button
                                                                    whileHover={{ scale: 1.05, y: -2 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    onClick={() => setNarrativeStep(1)}
                                                                    className="text-[10px] text-[var(--color-gold)] font-black uppercase tracking-[0.2em] border-b border-[var(--color-gold)]/40 hover:border-[var(--color-gold)] transition-all flex items-center gap-2"
                                                                >
                                                                    <span>✨</span> {eventInput.trim() ? '更換場景' : '選場景'}
                                                                </motion.button>
                                                            </div>
                                                        </div>

                                                        {/* Step 3 確認卡：場景 + 服裝雙列 */}
                                        {confirmedScene && (
                                            <div className="narrative-stage3-confirm-card border border-[var(--color-border)] rounded-2xl overflow-hidden mb-2">
                                                {/* 場景列 */}
                                                <div className="flex items-stretch border-b border-[var(--color-border)]">
                                                    <div className="narrative-stage3-confirm-label w-12 flex items-center justify-center bg-[var(--color-gold)]/8 border-r border-[var(--color-border)] shrink-0">
                                                        <span className="text-[8px] font-black text-[var(--color-gold)] uppercase tracking-widest">場景</span>
                                                    </div>
                                                    <div className="flex-1 px-4 py-2.5">
                                                        <p className="text-[13px] font-black text-[var(--color-text-title)] leading-tight">{confirmedScene.name_zh}</p>
                                                        <p className="text-[10px] text-gray-500 mt-0.5">
                                                            {(confirmedScene as any).city !== 'any' ? (confirmedScene as any).city : '全台通用'}
                                                        </p>
                                                    </div>
                                                    <button onClick={() => setNarrativeStep(1)}
                                                        className="px-4 text-[9px] text-gray-600 hover:text-[var(--color-gold)] font-black transition-colors border-l border-[var(--color-border)] shrink-0">
                                                        ← 換
                                                    </button>
                                                </div>
                                                {/* 服裝列 */}
                                                <div className="flex items-stretch">
                                                    <div className="narrative-stage3-confirm-label w-12 flex items-center justify-center bg-blue-500/5 border-r border-[var(--color-border)] shrink-0">
                                                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">服裝</span>
                                                    </div>
                                                    <div className="flex-1 px-4 py-2.5">
                                                        {confirmedOutfitId ? (
                                                            <>
                                                                <p className="text-[12px] font-black text-[var(--color-text-title)] leading-tight">
                                                                    {STYLE_ARCHETYPE_MAP[([...(pickerOutfitOptions?.alternatives || []), pickerOutfitOptions?.topPick].find((o: any) => o?.outfit_id === confirmedOutfitId) as any)?.style_archetype || ''] || '已選服裝'}
                                                                </p>
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {(() => {
                                                                        const outfit = [...(pickerOutfitOptions?.alternatives || []), pickerOutfitOptions?.topPick].find((o: any) => o?.outfit_id === confirmedOutfitId) as any;
                                                                        if (!outfit?.pillars) return null;
                                                                        const items = [outfit.pillars.top, outfit.pillars.bottom, outfit.pillars.shoes, ...(outfit.pillars.accessories || [])].filter(Boolean).slice(0, 5);
                                                                        return items.map((item: string, i: number) => (
                                                                            <span key={i} className="text-[9px] text-gray-500 bg-white/5 border border-white/10 rounded px-1.5 py-0.5">{translateClothing(item)}</span>
                                                                        ));
                                                                    })()}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <p className="text-[12px] text-gray-500 py-0.5">自動搭配</p>
                                                        )}
                                                    </div>
                                                    <button onClick={() => setNarrativeStep(2)}
                                                        className="px-4 text-[9px] text-gray-600 hover:text-blue-400 font-black transition-colors border-l border-[var(--color-border)] shrink-0">
                                                        ← 換
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                                        <div className="group relative">
                                                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-2">事件描述（可調整）</label>
                                                            <textarea 
                                                                className="w-full min-h-[220px] bg-black/5 dark:bg-black/40 border border-black/5 dark:border-white/5 rounded-[2.5rem] p-6 text-sm text-gray-800 dark:text-gray-200 focus:border-[var(--color-gold)]/30 focus:shadow-[0_0_40px_rgba(212,175,55,0.05)] transition-all resize-vertical font-medium leading-relaxed outline-none shadow-inner"
                                                                placeholder="描繪此刻的情境... 靈魂敘事將以此為軸心展開。"
                                                                value={eventInput}
                                                                onChange={(e) => {
                                                                    setEventInput(e.target.value);
                                                                    setRandomSceneId(null);
                                                                    setSelectedBrief(null);
                                                                    setEventSource('manual');
                                                                }}
                                                            />
                                                            <div className="absolute bottom-6 right-6 w-12 h-0.5 bg-gradient-to-r from-transparent to-[var(--color-gold)]/20 opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                                        </div>
                                        <motion.button 
                                            whileHover={!eventInput.trim() || isGenerating ? {} : { scale: 1.02 }}
                                            whileTap={!eventInput.trim() || isGenerating ? {} : { scale: 0.98 }}
                                            onClick={() => handleGenerateDiary(confirmedScene?.scene_id, eventInput, confirmedOutfitId || model.preferences?.active_outfit_id)} 
                                            disabled={!eventInput.trim() || isGenerating}
                                                            className={`w-full py-5 text-[12px] font-black tracking-[0.5em] uppercase rounded-3xl transition-all duration-300 ${
                                                                !eventInput.trim() || isGenerating
                                                                    ? 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed opacity-50'
                                                                    : 'bg-[var(--color-gold)] text-black shadow-[0_20px_40px_rgba(212,175,55,0.15)] hover:shadow-[0_25px_50px_rgba(212,175,55,0.25)]'
                                                            }`}
                                                        >
                                                            {isGenerating ? '正在編織命運線...' : '建立拍攝劇本'}
                                                        </motion.button>
                                                    </div>

                                                    <AnimatePresence>
                                                        {diary && (
                                                            <motion.div 
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className="space-y-4"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)] animate-pulse"></div>
                                                                    <span className="text-[10px] font-bold text-[var(--color-gold)] uppercase tracking-[0.3em]">{model.name} 的敘事日記 (Narrative Diary)</span>
                                                                </div>
                                                                
                                                                {currentSceneId && (
                                                                    <div className="flex items-center justify-between px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[11px] text-white/90">
                                                                                🎬 今日場景：{ALL_EXTENDED_SCENES.find(s => s.scene_id === currentSceneId)?.name_zh || currentSceneId}
                                                                                <span className="text-gray-500 ml-1">（{ALL_EXTENDED_SCENES.find(s => s.scene_id === currentSceneId)?.category || '一般'}）</span>
                                                                            </span>
                                                                        </div>
                                                                        <button 
                                                                            onClick={() => handleChangeScene()}
                                                                            disabled={isGenerating}
                                                                            className="text-[9px] text-[var(--color-gold)] font-bold uppercase tracking-widest hover:underline flex items-center gap-1 disabled:opacity-30"
                                                                        >
                                                                            {isGenerating ? '切換中...' : '🔄 換一個場景'}
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                <div className="bg-[var(--color-bg-input)] p-8 rounded-[2.5rem] border border-[var(--color-border)] font-serif italic text-[var(--color-text-main)] leading-relaxed text-base whitespace-pre-wrap shadow-xl">
                                                                    「{diary.content}」
                                                                </div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    <span className="px-3 py-1 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20 rounded-full text-[9px] font-bold text-[var(--color-gold)] uppercase">
                                                                        情緒狀態 (Mood): {diary.mood}
                                                                    </span>
                                                                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold text-gray-400 uppercase">
                                                                        場景類型 (Scene): {diary.generatedPromptParams?.locationType}
                                                                    </span>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            </div>

                                            {/* Right: Visual Production 生成控制區 */}
                                            <motion.div 
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.4 }}
                                                className="narrative-control-panel space-y-8 lg:border-l lg:border-white/5 lg:pl-10"
                                            >
                                                {/* P3-3: Step 3 CTA — 影像就緒行動區 */}
                                                {narrativeStep === 5 && generatedImageUrl && (
                                                    <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-3">
                                                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest text-center">影像就緒</p>
                                                        <Button
                                                            onClick={() => handleFinish()}
                                                            disabled={isExtractingMem || isFinishCooldown}
                                                            isLoading={isExtractingMem}
                                                            title={isFinishCooldown ? '影像剛生成，請稍候片刻再確認送出' : undefined}
                                                            className="w-full py-4 text-[10px] font-black tracking-widest uppercase"
                                                        >
                                                            完成並前往 IP 休息室 →
                                                        </Button>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <button
                                                                onClick={() => handleGenerateImage()}
                                                                disabled={isGeneratingImage}
                                                                className="py-3 text-[9px] font-bold rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all disabled:opacity-30"
                                                            >
                                                                🔄 再生一張
                                                            </button>
                                                            <button
                                                                onClick={() => handleResetToStep1()}
                                                                className="py-3 text-[9px] font-bold rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all"
                                                            >
                                                                📝 繼續敘事
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="space-y-6">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">視覺轉化控制 (Visual Control)</h3>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">構圖比例</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { id: '9:16', label: '直式短影' },
                                                    { id: '4:5', label: '社群貼文' },
                                                    { id: '1:1', label: '方型' },
                                                    { id: '16:9', label: '寬螢幕' }
                                                ].map(r => (
                                                    <button
                                                        key={r.id}
                                                        onClick={() => setAspectRatio(r.id)}
                                                        className={`py-3 text-[9px] font-bold rounded-xl border transition-all ${aspectRatio === r.id ? 'bg-[var(--color-gold)]/20 border-[var(--color-gold)] text-[var(--color-gold)] shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'border-white/5 text-gray-500 hover:border-white/20 hover:bg-white/5'}`}
                                                    >
                                                        {r.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">鏡頭控制 (Camera Optic POV)</label>
                        <div className="flex bg-[var(--color-bg-card)] p-1 rounded-xl border border-[var(--color-border)]">
                            <button 
                                onClick={() => setIsPOV(true)}
                                className={`flex-1 py-3 text-[9px] font-bold rounded-lg transition-all ${isPOV ? 'bg-[var(--color-gold)]/20 text-[var(--color-gold)] shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                第一人稱
                            </button>
                            <button 
                                onClick={() => setIsPOV(false)}
                                className={`flex-1 py-3 text-[9px] font-bold rounded-lg transition-all ${!isPOV ? 'bg-[var(--color-gold)]/20 text-[var(--color-gold)] shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                第三人稱
                            </button>
                        </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">畫質與光影預設</label>
                                            <div className="grid grid-cols-1 gap-2">
                                                {[
                                                    { id: 'HD', label: '高解析度還原', desc: '日常產出 1K' },
                                                    { id: 'Cinematic', label: '電影製片級', desc: '精緻細節 2K' },
                                                    { id: 'Pro', label: '極致還原', desc: '臉部鎖定 4K' }
                                                ].map(q => (
                                                    <button
                                                        key={q.id}
                                                        onClick={() => setQuality(q.id)}
                                                        className={`flex flex-col items-center justify-center py-2.5 rounded-xl border transition-all ${quality === q.id ? 'bg-white/10 border-white/40 text-white shadow-xl shadow-white/5' : 'border-white/5 text-gray-500 hover:border-white/20 hover:bg-white/5'}`}
                                                    >
                                                        <span className="text-[9px] font-bold uppercase tracking-wider">{q.label}</span>
                                                        <span className="text-[7px] opacity-40 mt-0.5 tracking-widest">{q.desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {diary && (
                                <div className="space-y-3 group">
                                    <div className="flex justify-between items-center px-1">
                                        <div className="flex gap-4">
                                            <button 
                                                onClick={() => setActivePromptLang('ZH')}
                                                className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${activePromptLang === 'ZH' ? 'text-[var(--color-gold)] underline' : 'text-gray-500 hover:text-gray-300'}`}
                                            >
                                                中文提示詞 (ZH)
                                            </button>
                                            <button 
                                                onClick={() => setActivePromptLang('EN')}
                                                className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${activePromptLang === 'EN' ? 'text-[var(--color-gold)] underline' : 'text-gray-500 hover:text-gray-300'}`}
                                            >
                                                英文提示詞 (EN)
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="relative">
                                            {activePromptLang === 'ZH' ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between px-2">
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">分段式編輯 (Modular Edit Mode)</span>
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500/50 animate-pulse"></div>
                                                    </div>
                                                    {hasStructuredPromptZH ? (
                                                        <div className="grid grid-cols-1 gap-2.5">
                                                            {promptSectionsZH.map((section) => (
                                                                <div key={`${section.label}-${section.lineIndex}`} className="group flex flex-col bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-3 hover:border-[var(--color-gold)]/30 transition-all shadow-sm">
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <span className="text-[8px] font-black text-[var(--color-gold)] uppercase tracking-widest pl-1">
                                                                            {getPromptSectionDisplayLabel(section.label, 'ZH')}
                                                                        </span>
                                                                        <div className="w-1 h-1 rounded-full bg-[var(--color-gold)]/20 group-hover:bg-[var(--color-gold)] transition-colors"></div>
                                                                    </div>
                                                                    <textarea 
                                                                        className="w-full bg-transparent border-none p-0 text-[11px] text-[var(--color-text-main)] focus:ring-0 resize-none min-h-[40px] outline-none leading-relaxed placeholder-gray-500"
                                                                        value={section.value}
                                                                        onChange={(e) => {
                                                                            const lines = editablePromptZH.split('\n');
                                                                            lines[section.lineIndex] = `${section.prefix}${section.separator} ${e.target.value}`;
                                                                            setEditablePromptZH(lines.join('\n'));
                                                                        }}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <textarea 
                                                            className="w-full h-40 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-2xl p-5 text-[10px] font-medium text-[var(--color-text-main)] focus:border-[var(--color-gold)]/50 transition-all resize-none outline-none leading-relaxed"
                                                            value={editablePromptZH}
                                                            onChange={(e) => setEditablePromptZH(e.target.value)}
                                                            disabled={!diary}
                                                            placeholder={diary ? "修改中文提示詞..." : "同步敘事後產出"}
                                                        />
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between px-2">
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Visual DNA Editor (Modular)</span>
                                                        <div className="w-2 h-2 rounded-full bg-blue-500/50 animate-pulse"></div>
                                                    </div>
                                                    {hasStructuredPromptEN ? (
                                                        <div className="grid grid-cols-1 gap-2.5">
                                                            {promptSectionsEN.map((section) => (
                                                                <div key={`${section.label}-${section.lineIndex}`} className="group flex flex-col bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-3 hover:border-blue-500/20 transition-all">
                                                                    <span className="text-[8px] font-mono font-bold text-blue-400/40 uppercase tracking-widest mb-1 pl-1">
                                                                        {section.label}
                                                                    </span>
                                                                    <textarea 
                                                                        className="w-full bg-transparent border-none p-0 text-[10px] font-mono text-gray-400 focus:ring-0 resize-none min-h-[45px] outline-none leading-tight"
                                                                        value={section.value}
                                                                        onChange={(e) => {
                                                                            const lines = editablePrompt.split('\n');
                                                                            lines[section.lineIndex] = `${section.prefix}${section.separator} ${e.target.value}`;
                                                                            setEditablePrompt(lines.join('\n'));
                                                                        }}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <textarea 
                                                            className="w-full h-40 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-2xl p-5 text-[10px] font-mono text-[var(--color-text-main)] focus:border-[var(--color-gold)]/50 transition-all resize-none outline-none leading-relaxed"
                                                            value={editablePrompt}
                                                            onChange={(e) => setEditablePrompt(e.target.value)}
                                                            disabled={!diary}
                                                            placeholder={diary ? "Edit English prompt..." : "Waiting for narrative..."}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex justify-end gap-2 mt-2">
                                                <div className="px-2 py-1 bg-[var(--color-bg-input)] rounded-md text-[7px] text-gray-500 border border-[var(--color-border)] uppercase tracking-tighter">
                                                    結構化編輯模式 // STRUCTURED EDIT
                                                </div>
                                                <div className="px-2 py-1 bg-[var(--color-bg-input)] rounded-md text-[7px] text-gray-500 border border-[var(--color-border)] uppercase tracking-tighter">
                                                    字數統計: {activePromptLang === 'ZH' ? editablePromptZH.length : editablePrompt.length}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                )}
                                <motion.button 
                                    whileHover={!diary || isGeneratingImage ? {} : { scale: 1.02 }}
                                    whileTap={!diary || isGeneratingImage ? {} : { scale: 0.98 }}
                                    onClick={() => handleGenerateImage()} 
                                    disabled={!diary || isGeneratingImage}
                                    className={`w-full py-5 text-[12px] font-black tracking-[0.5em] uppercase rounded-3xl transition-all duration-300 ${
                                        !diary || isGeneratingImage
                                            ? 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed opacity-50'
                                            : 'bg-emerald-500 text-black shadow-[0_20px_40px_rgba(16,185,129,0.15)] hover:shadow-[0_25px_50px_rgba(16,185,129,0.25)]'
                                    }`}
                                >
                                    {isGeneratingImage ? '正在捕捉靈魂切片 (RENDERING...)' : (generatedImageUrl ? '重新生成影像 // REGENERATE' : '生成故事影像 // GENERATE IMAGE')}
                                </motion.button>
                            </div>

                            {/* Image Preview Result */}
                            <div className="aspect-[3/4] rounded-[2rem] overflow-hidden bg-[var(--color-bg-card)] border border-[var(--color-border)] relative group">
                                                <AnimatePresence mode="wait">
                                                    {isGeneratingImage ? (
                                                        <motion.div 
                                                            key="loader"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[var(--color-bg-input)]"
                                                        >
                                                            <Loader message="正在生成視覺影像..." />
                                                            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] animate-pulse">正在物化意識與光影...</p>
                                                        </motion.div>
                                                    ) : generatedImageUrl ? (
                                                        <div className="relative w-full h-full">
                                                            <motion.img 
                                                                key="image"
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                src={generatedImageUrl}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute bottom-4 right-4 flex gap-2">
                                                                <button 
                                                                    onClick={() => setPreviewingImage({images: [generatedImageUrl], startIndex: 0})}
                                                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-bg-surface)]/60 hover:bg-white text-[var(--color-text-main)] hover:text-black transition-all backdrop-blur-md border border-[var(--color-border)]"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                                                                </button>
                                                                <button 
                                                                    onClick={() => {
                                                                        const link = document.createElement('a');
                                                                        link.href = generatedImageUrl;
                                                                        link.download = `narrative_${model.name}_${Date.now()}.jpg`;
                                                                        link.click();
                                                                    }}
                                                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-bg-surface)]/60 hover:bg-[var(--color-gold)] text-[var(--color-text-main)] hover:text-black transition-all backdrop-blur-md border border-[var(--color-border)]"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-[var(--color-bg-input)]">
                                                            <svg className="w-12 h-12 text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">影像尚未生成 // READY</p>
                                                        </div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>
                        }
                    </AnimatePresence>
                </div>

    {/* Footer and Finish - Sticky at the bottom of Content Hub */}
    <div className="p-8 bg-[var(--color-bg-surface)]/60 border-t border-[var(--color-border)] flex justify-between items-center backdrop-blur-md">
                    <span className="text-[8px] text-gray-600 uppercase tracking-[0.5em] font-light">
                        Antigravity 靈魂視覺引擎已上線 // ENGINE ACTIVE
                    </span>
                    <div className="flex gap-4">
                        <Button
                            variant="secondary"
                            onClick={() => requestLeave(onClose)}
                            disabled={isAnyTaskRunning}
                            title={isAnyTaskRunning ? "生圖進行中，請稍候..." : ""}
                            className={`px-8 border-white/10 text-[10px] tracking-widest font-black uppercase italic ${
                                isAnyTaskRunning ? "opacity-30 cursor-not-allowed" : ""
                            }`}
                        >
                            取消 // CANCEL
                        </Button>
                        <Button
                            onClick={() => handleFinish()}
                            disabled={!diary || isExtractingMem || isFinishCooldown}
                            isLoading={isExtractingMem}
                            title={isFinishCooldown ? '影像剛生成，請稍候片刻再確認送出' : undefined}
                            className="px-10 text-[11px] fon