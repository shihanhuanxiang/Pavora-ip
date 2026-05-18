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

import ImagePreviewModal from '../../shared/components/common/ImagePreviewModal';
import { WardrobeManager } from './components/WardrobeManager';
import { StoryProgressBoard } from './components/StoryProgressBoard';
import { NarrativeSettings } from './components/NarrativeSettings';
import type { WeeklyPlanBrief } from '../../shared/types/types';

interface NarrativeWorkflowProps {
    model: Model;
    onClose: () => void;
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

const NarrativeWorkflow: React.FC<NarrativeWorkflowProps> = ({ model: propModel, onClose, onConfirm }) => {
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
    const [newMemories, setNewMemories] = useState<string[]>([]);
    const [showMemoryConfirm, setShowMemoryConfirm] = useState(false);
    
    // UI state
    const [showWardrobe, setShowWardrobe] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showPlan, setShowPlan] = useState(false);
    const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlanBrief[] | null>(null);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [selectedBrief, setSelectedBrief] = useState<WeeklyPlanBrief | null>(null);
    
    // 是否有任何任務進行中（防呆用）
    const isAnyTaskRunning = isGenerating || isGeneratingDynamicEvent || isGeneratingImage || isSyncing || isExtractingMem || isGeneratingPlan;
    
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
                    <span className="text-[9px] font-black text-[var(--color-gold)] tracking-[0.3em] uppercase">拍攝卡 // BRIEF</span>
                    {diary && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]"></span>}
                </div>
                <div className="flex items-center gap-2">
                    {!isExpanded && diary && <span className="text-[8px] text-gray-500 font-mono">{aspectRatio} · {quality} · {isPOV ? 'POV' : '3RD'}</span>}
                    <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                </div>
            </button>
            {isExpanded && (
            <div className="px-5 pb-5 pt-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {/* 1. MATERIAL */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <p className="text-[9px] text-[var(--color-gold)] font-black uppercase tracking-widest pl-2 border-l-2 border-[var(--color-gold)]">素材 // MATERIAL</p>
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
                        <p className="text-[9px] text-[var(--color-gold)] font-black uppercase tracking-widest pl-2 border-l-2 border-[var(--color-gold)]">場景 // SCENE</p>
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
                            <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">SCENE_ID</p>
                            <p className={`text-[9px] font-mono truncate ${getLockedSceneId() ? 'text-[var(--color-gold)]' : 'text-gray-600'}`}>
                                {getLockedSceneId() || 'SYS_AUTO_PENDING'}
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
                        <p className="text-[9px] text-[var(--color-gold)] font-black uppercase tracking-widest pl-2 border-l-2 border-[var(--color-gold)]">造型 // STYLING</p>
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
                        <p className="text-[9px] text-[var(--color-gold)] font-black uppercase tracking-widest pl-2 border-l-2 border-[var(--color-gold)]">生成 // RENDER</p>
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
                                {diary?.mood || 'PENDING'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">審美層次</p>
                            <p className={`text-[9px] font-medium ${diary?.meta?.aesthetic_tier ? 'text-white' : 'text-gray-600'}`}>
                                {diary?.meta?.aesthetic_tier || 'AUTO_EVAL'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">提示詞狀態</p>
                            <p className={`text-[9px] font-medium ${editablePrompt ? 'text-emerald-500' : 'text-gray-600'}`}>
                                {editablePrompt ? 'READY_TO_GEN' : 'NOT_SYNCED'}
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
            whileHover={{ scale: 1.1, x: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            className={`relative p-3 rounded-2xl transition-all duration-300 group ${active ? 'bg-[var(--color-gold)] text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
        >
            {isLoading ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : icon}
            <div className="absolute left-full ml-4 px-3 py-1 bg-black/80 backdrop-blur-md rounded-md text-[8px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 z-[70]">
                {label}
            </div>
            {active && (
                <motion.div 
                    layoutId="active-indicator"
                    className="absolute -left-1 top-2 bottom-2 w-1 bg-[var(--color-gold)] rounded-full shadow-[0_0_10px_rgba(212,175,55,0.8)]"
                />
            )}
        </motion.button>
    );

    const handleGenerateDiary = async (forcedId?: string, forcedEventText?: string, forcedOutfitId?: string) => {
        const effectiveEvent = forcedEventText || eventInput;
        if (!effectiveEvent.trim()) return;
        setIsGenerating(true);
        setGeneratedImageUrl(null);
        
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
            addNotification({ type: 'error', message: '靈魂同步失敗 (Soul Sync Failed)', description: '無法提取敘事數據，請重試 (Failed to extract narrative data, please try again).' });
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
        if (!diary || !editablePrompt) return;
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

            const url = await transformImage(
                sourceImageData,
                finalImagePrompt,
                additionalRefs,
                undefined,
                { 
                    usePro: true,  // 三個選項都啟用 Pro Fidelity Mode
                    imageConfig,
                    identityBoost: quality === 'Pro'  // PRO 模式才注入額外身份指令
                }
            );

            // Embed model identity (DNA) into the generated image
            const { wrapImageWithIdentity } = await import('../../shared/utils/metadataUtils');
            const resultImageData = await imageUrlToimageData(url);
            const fullDataUrl = `data:${resultImageData.mimeType};base64,${resultImageData.data}`;
            const finalImageWithMetadata = wrapImageWithIdentity(fullDataUrl, model);

            setGeneratedImageUrl(finalImageWithMetadata);
            setNarrativeStep(5);
            addNotification({ type: 'success', message: '靈魂視覺化成功 (Visualization Success)', description: '影像已生成並包含身分內碼 (Image generated with identity metadata).' });
        } catch (e) {
            console.error(e);
            addNotification({ type: 'error', message: '影像生成失敗 (Generation Failed)', description: 'AI 算力調度異常，請稍後再試 (AI engine error, please try again later).' });
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
        if (diary) {
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
                // 1. Save to gallery
                await updateModelGallery(model.id, {
                    url: generatedImageUrl,
                    narrativeContent: diary.content,
                    visualPrompt: editablePrompt,
                    visualPromptZH: editablePromptZH,
                    contentCategory: diary.contentCategory,
                    styleTags: diary.contentCategory ? [diary.contentCategory] : undefined,
                    // P2-4: 存入院線場景與穿搭 ID 以供分析
                    sceneId: (diary as any).sceneId || currentSceneId,
                    outfitId: (diary as any).outfitId || model.preferences?.active_outfit_id || model.preferences?.recent_outfit_ids?.[0]
                } as any);
                addNotification({ type: 'success', message: `作品已加入 ${model.name} 的作品集`, description: diary.contentCategory ? `類別：${diary.contentCategory === 'lifestyle' ? '生活日常' : diary.contentCategory === 'curve' ? '曲線魅力' : '戲劇張力'} · 返回 IP 休息室可查看內容比例` : '返回 IP 休息室可查看最新作品與內容比例' });

                // 2. Extract potential memories
                setIsExtractingMem(true);
                try {
                    const extracted = await extractNewMemories(model, diary.content || '');
                    if (extracted.length > 0) {
                        setNewMemories(extracted);
                        setShowMemoryConfirm(true);
                        return; // Wait for user to confirm memories
                    }
                } catch (e) {
                    console.error("Memory extraction failed", e);
                } finally {
                    setIsExtractingMem(false);
                }
            }
            onConfirm(diary, generatedImageUrl || undefined);
        }
    };

    const handleConfirmMemories = async (selectedMems: string[]) => {
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
    };

    const isConfigLocked = Boolean(randomSceneId) || Boolean(selectedBrief?.sceneId);
    const isOutfitCooling = (model.preferences?.recent_outfit_ids || []).includes(previewOutfit?.outfit_id || '');
    
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
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-gray-600">今日拍攝配置 // SHOOT CONFIG</p>
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

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[var(--color-bg-deep)]/90 backdrop-blur-3xl" 
                onClick={() => { if (!isAnyTaskRunning) onClose(); }} 
            />
            {previewingImage && <ImagePreviewModal {...previewingImage} onClose={() => setPreviewingImage(null)} />}
            
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="relative w-full max-w-6xl h-[90vh] bg-[var(--color-bg-surface)]/80 backdrop-blur-3xl border border-[var(--color-border)] rounded-[3rem] overflow-hidden shadow-2xl flex"
            >
                {/* Lateral Navigation */}
                <div className="w-20 border-r border-[var(--color-border)] flex flex-col items-center py-10 gap-8 bg-black/5 dark:bg-black/20">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-gold)] flex items-center justify-center mb-10 shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                       <span className="text-black text-[8px] font-black italic">AV</span>
                    </div>
                    <NavIconButton active={!showWardrobe && !showSettings && !showPlan} onClick={() => { setShowWardrobe(false); setShowSettings(false); setShowPlan(false); }} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>} label="敘事首頁 // HOME" />
                    <NavIconButton active={showPlan} onClick={() => handleGeneratePlan()} isLoading={isGeneratingPlan} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>} label="週計畫 // PLAN" />
                    <NavIconButton active={showWardrobe} onClick={() => { setShowWardrobe(true); setShowSettings(false); setShowPlan(false); }} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>} label="劇組衣櫃 // WARDROBE" />
                    <NavIconButton active={showSettings} onClick={() => { setShowSettings(true); setShowWardrobe(false); setShowPlan(false); }} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.754 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 001.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>} label="系統設定 // SETTINGS" />
                    <div className="mt-auto pb-8">
                        <button onClick={() => { if (!isAnyTaskRunning) onClose(); }} disabled={isAnyTaskRunning} title={isAnyTaskRunning ? "生圖進行中，請稍候..." : "關閉"} className={`p-3 transition-colors rounded-full group ${isAnyTaskRunning ? "opacity-30 cursor-not-allowed bg-white/5 text-gray-600" : "text-gray-600 hover:text-white bg-white/5 hover:bg-red-500/20"}`}>
                            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                </div>

                {/* Main Content Hub */}
                <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-transparent to-black/20">
                    <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                        <AnimatePresence mode="wait">
                            {showPlan && weeklyPlan ? 
                                <motion.div 
                                    key="weekly-plan"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="p-10 space-y-10"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-4 bg-[var(--color-gold)] rounded-full shadow-[0_0_15px_rgba(212,175,55,0.4)]"></div>
                                                <h3 className="text-2xl font-black text-white dark:text-white tracking-[0.3em] uppercase italic">靈魂週計畫 // WEEKLY ARCHITECTURE</h3>
                                            </div>
                                            <p className="text-[10px] text-[var(--color-gold)]/60 font-black uppercase tracking-[0.6em] ml-4 italic px-1">Predictive Narrative Architecture</p>
                                        </div>
                                        <button onClick={() => setShowPlan(false)} className="text-[10px] text-gray-500 hover:text-white transition-colors uppercase tracking-widest font-black border-b border-white/10 pb-1">返回敘事 // BACK</button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                                        {weeklyPlan.map((brief, idx) => (
                                            <motion.div 
                                                key={idx}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className={`p-8 rounded-[2.5rem] border transition-all relative overflow-hidden group ${
                                                    brief.isArcScene 
                                                    ? 'bg-[var(--color-gold)]/5 border-[var(--color-gold)]/30' 
                                                    : brief.isThreadScene 
                                                    ? 'bg-emerald-500/5 border-emerald-500/30' 
                                                    : 'bg-black/20 dark:bg-white/5 border-black/5 dark:border-white/5 hover:border-white/10'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start mb-6">
                                            <div>
                                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-none mb-1">第 {idx + 1} 天 // DAY</p>
                                                        <h4 className="text-sm font-black text-white dark:text-white uppercase tracking-tight italic">{brief.title}</h4>
                                                    </div>
                                                    {brief.isArcScene && <span className="px-2 py-1 bg-[var(--color-gold)] text-black text-[8px] font-black rounded-md">故事環節 // ARC PHASE</span>}
                                                    {brief.isThreadScene && <span className="px-2 py-1 bg-emerald-500 text-black text-[8px] font-black rounded-md">發展線 // THREAD</span>}
                                                </div>

                                                <div className="space-y-4 mb-8">
                                                    <div className="space-y-2">
                                                        {brief.scripts.map((script, sIdx) => (
                                                            <div key={sIdx} className="flex gap-3 items-start group/line">
                                                                <div className="w-1 h-1 rounded-full bg-black/10 dark:bg-white/20 mt-1.5 group-hover/line:bg-[var(--color-gold)] transition-colors"></div>
                                                                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-normal italic group-hover/line:text-gray-900 dark:group-hover/line:text-gray-200">{script}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    
                                                    {brief.strategy_tags && brief.strategy_tags.length > 0 && (
                                                        <div className="pt-4 border-t border-black/5 dark:border-white/5 flex flex-wrap gap-2">
                                                            {brief.strategy_tags.map((tag, tIdx) => (
                                                                <span key={tIdx} className="px-2 py-0.5 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded text-[8px] font-black text-gray-400 uppercase tracking-tighter">
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
                                                        ? 'bg-[var(--color-gold)] text-black shadow-xl shadow-[var(--color-gold)]/20' 
                                                        : brief.isThreadScene 
                                                        ? 'bg-emerald-500 text-black shadow-xl shadow-emerald-500/20' 
                                                        : 'bg-white/5 dark:bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                                                    }`}
                                                >
                                                    對齊計畫 // SYNC
                                                </motion.button>
                                                
                                                <div className="absolute top-0 right-0 w-24 h-[1px] bg-gradient-to-l from-white/10 to-transparent"></div>
                                                <div className="absolute bottom-0 left-0 w-[1px] h-24 bg-gradient-to-t from-white/10 to-transparent"></div>
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
                                    className="p-10 space-y-10 custom-scrollbar overflow-y-auto h-full"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-4 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.4)]"></div>
                                                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-[0.3em] uppercase italic">敘事矩陣設定 // MATRIX SETTINGS</h3>
                                            </div>
                                            <p className="text-[10px] text-blue-500/60 font-black uppercase tracking-[0.6em] ml-4 italic">Persona Parameter Control</p>
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
                                    className="p-10 custom-scrollbar overflow-y-auto h-full"
                                >
                                    <WardrobeManager model={model} onUpdate={(u) => updateModel(model.id, u)} />
                                </motion.div>
                            : 
                                <motion.div
                                    key="main-workflow"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="p-12 space-y-10 relative min-h-full overflow-y-auto custom-scrollbar"
                                >
                                    {/* ── Step 1：選場景 ─────────────────────────────── */}
                                    {/* ── 步驟進度條（Step 3 可見，其他 Step overlay 蓋住） ── */}
                                    <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 shrink-0">
                                        <div className="flex items-center gap-1.5">
                                            {[
                                                { step: 1, label: '選場景' },
                                                { step: 2, label: '選服裝' },
                                                { step: 3, label: '確認設定' },
                                                { step: 4, label: '劇本審閱' },
                                                { step: 5, label: '出圖結果' }
                                            ].map((s, i) => (
                                                <div key={s.step} className="flex items-center">
                                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${narrativeStep === s.step ? 'bg-[var(--color-gold)]/10 text-[var(--color-gold)]' : (narrativeStep > s.step ? 'text-emerald-500' : 'text-gray-600')}`}>
                                                        <span className="text-[10px] font-black italic">{s.step < narrativeStep ? '✓' : `0${s.step}`}</span>
                                                        <span className="text-[9px] font-black uppercase tracking-widest">{s.label}</span>
                                                    </div>
                                                    {i < 4 && <div className="w-2 h-px bg-white/5 mx-1" />}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="h-4 w-px bg-white/10" />
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">靈魂敘事系統 // V1.0</p>
                                        </div>
                                    </div>

                                    {narrativeStep === 1 && (
                                        <div className="absolute inset-0 bg-[var(--color-bg-surface)]/98 backdrop-blur-sm overflow-y-auto z-20 flex flex-col">
                                            {/* Header */}
                                            <div className="px-8 py-5 border-b border-white/10 shrink-0">
                                                <p className="text-[12px] font-black text-[var(--color-gold)] uppercase tracking-[0.5em]">選場景 // SCENE SELECT</p>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">選擇今日拍攝場景，點擊場景卡進入服裝搭配</p>
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
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                                                                className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[14px] p-3.5 flex flex-col cursor-pointer hover:border-[var(--color-gold)]/40 hover:bg-white/5 transition-all active:scale-[0.98] min-h-[240px]">
                                                                {/* 頂部 badge 區 */}
                                                                <div className="flex gap-1.5 flex-wrap mb-3">
                                                                    <span className="text-[9px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{regionLabel[(card.scene as any).region] || '全台'}</span>
                                                                    {ctxLabel[primaryCtx] && <span className="text-[9px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{ctxLabel[primaryCtx]}</span>}
                                                                </div>
                                                                {/* 場景名稱 */}
                                                                <p className="text-[16px] font-black text-white leading-tight mb-2">{card.scene.name_zh}</p>
                                                                {/* 分隔線 */}
                                                                <div className="border-t border-[var(--color-gold)]/10 mt-1 mb-3" />
                                                                {/* 事件描述：無內容或等同標題時顯示佔位 */}
                                                                <p className="text-[11px] text-gray-400 leading-relaxed flex-1">
                                                                    {card.eventText && card.eventText !== card.scene.name_zh
                                                                        ? card.eventText
                                                                        : <span className="text-gray-600 italic">✦ 點擊進入場景</span>
                                                                    }
                                                                </p>
                                                                <p className="text-[9px] text-[var(--color-gold)]/50 font-bold uppercase tracking-widest mt-3">{ctxLabel[primaryCtx] || primaryCtx}</p>
                                                            </div>
                                                        );
                                                    })}
                                                    {/* AI Card（懶載入，點擊才呼叫 API） */}
                                                    <div className="bg-[var(--color-bg-card)] border border-[var(--color-gold)]/30 rounded-[14px] p-3.5 flex flex-col cursor-pointer hover:border-[var(--color-gold)]/60 hover:bg-white/5 transition-all active:scale-[0.98] min-h-[240px]"
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
                                                                <p className="text-[16px] font-black text-white leading-tight mb-2">{pickerAICardScene.name_zh}</p>
                                                                <div className="border-t border-[var(--color-gold)]/10 mt-1 mb-3" />
                                                                <p className="text-[11px] text-gray-400 leading-relaxed flex-1">{pickerAICardText}</p>
                                                                <p className="text-[9px] text-[var(--color-gold)]/50 font-bold uppercase tracking-widest mt-3">靈魂導向</p>
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
                                        <div className="absolute inset-0 bg-[var(--color-bg-surface)]/98 backdrop-blur-sm overflow-y-auto z-20 flex flex-col">
                                            {/* Header */}
                                            <div className="px-8 py-5 border-b border-white/10 shrink-0 flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black text-[var(--color-gold)] uppercase tracking-[0.5em]">選服裝 // OUTFIT SELECT</p>
                                                    <p className="text-[9px] text-gray-400 mt-0.5">{confirmedScene?.name_zh}</p>
                                                </div>
                                                <button onClick={() => setNarrativeStep(1)}
                                                    className="text-[9px] text-gray-400 hover:text-white font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                                                    ← 返回場景
                                                </button>
                                            </div>
                                            {/* Outfit Cards */}
                                            <div className="flex-1 overflow-y-auto px-8 py-6">
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                    {pickerOutfitOptions.alternatives.map((outfit: any) => (
                                                        <div key={outfit.outfit_id}
                                                            onClick={() => confirmSceneOutfit(confirmedScene, outfit.outfit_id)}
                                                            className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[14px] p-3.5 flex flex-col cursor-pointer hover:border-[var(--color-gold)]/40 hover:bg-white/5 transition-all active:scale-[0.98] min-h-[240px]">
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
                                                                            <span className="text-[10px] text-gray-400 leading-relaxed">{outfit.pillars[k]}</span>
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
                                                        className="bg-[var(--color-bg-card)] border border-[var(--color-gold)]/30 rounded-[14px] p-3.5 flex flex-col cursor-pointer hover:border-[var(--color-gold)]/60 hover:bg-white/5 transition-all active:scale-[0.98] min-h-[240px]">
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
                                                                        <span className="text-[10px] text-gray-400 leading-relaxed">{pickerOutfitOptions.topPick.pillars[k]}</span>
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
                                        <div className="absolute inset-0 bg-[var(--color-bg-surface)]/98 backdrop-blur-sm overflow-y-auto z-20 flex flex-col">
                                            {/* Header */}
                                            <div className="px-8 py-5 border-b border-white/10 shrink-0 flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black text-[var(--color-gold)] uppercase tracking-[0.5em]">劇本審閱 // SHOOT BRIEF</p>
                                                    <p className="text-[8px] text-gray-500 uppercase tracking-widest mt-0.5">確認提示詞後生成敘事影像</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => handleSyncPrompt()}
                                                        disabled={isSyncing}
                                                        className="text-[9px] font-black text-[var(--color-gold)] uppercase tracking-widest flex items-center gap-1.5 hover:opacity-80 disabled:opacity-30 transition-opacity border border-[var(--color-gold)]/30 px-3 py-1.5 rounded-full"
                                                    >
                                                        {isSyncing ? '同步中...' : '⇄ 雙向同步'}
                                                    </button>
                                                    <button onClick={() => setNarrativeStep(3)}
                                                        className="text-[9px] text-gray-400 hover:text-white font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                                                        ← 調整設定
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Two-column prompts */}
                                            <div className="flex-1 overflow-y-auto px-8 py-6">
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                    {/* ZH Column */}
                                                    <div className="space-y-3">
                                                        <p className="text-[9px] font-black text-[var(--color-gold)] uppercase tracking-widest">中文提示詞</p>
                                                        {hasStructuredPromptZH ? (
                                                            <div className="space-y-2">
                                                                {promptSectionsZH.map((section) => (
                                                                    <div key={`zh-${section.label}-${section.lineIndex}`}
                                                                        className="flex flex-col bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-3 hover:border-[var(--color-gold)]/30 transition-all">
                                                                        <span className="text-[8px] font-black text-[var(--color-gold)] uppercase tracking-widest mb-1 pl-1">
                                                                            {getPromptSectionDisplayLabel(section.label, 'ZH')}
                                                                        </span>
                                                                        <textarea
                                                                            className="w-full bg-transparent border-none p-0 text-[11px] text-[var(--color-text-main)] focus:ring-0 resize-none min-h-[36px] outline-none leading-relaxed"
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
                                                                className="w-full h-48 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-2xl p-4 text-[10px] text-[var(--color-text-main)] focus:border-[var(--color-gold)]/50 transition-all resize-none outline-none leading-relaxed"
                                                                value={editablePromptZH}
                                                                onChange={(e) => setEditablePromptZH(e.target.value)}
                                                            />
                                                        )}
                                                    </div>
                                                    {/* EN Column */}
                                                    <div className="space-y-3">
                                                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">English Prompt</p>
                                                        {hasStructuredPromptEN ? (
                                                            <div className="space-y-2">
                                                                {promptSectionsEN.map((section) => (
                                                                    <div key={`en-${section.label}-${section.lineIndex}`}
                                                                        className="flex flex-col bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-3 hover:border-blue-500/20 transition-all">
                                                                        <span className="text-[8px] font-mono font-bold text-blue-400/50 uppercase tracking-widest mb-1 pl-1">
                                                                            {section.label}
                                                                        </span>
                                                                        <textarea
                                                                            className="w-full bg-transparent border-none p-0 text-[10px] font-mono text-gray-400 focus:ring-0 resize-none min-h-[36px] outline-none leading-tight"
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
                                                                className="w-full h-48 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-2xl p-4 text-[10px] font-mono text-[var(--color-text-main)] focus:border-blue-500/50 transition-all resize-none outline-none leading-relaxed"
                                                                value={editablePrompt}
                                                                onChange={(e) => setEditablePrompt(e.target.value)}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Shoot config summary row */}
                                                <div className="mt-6 grid grid-cols-5 gap-2 p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl">
                                                    {[
                                                        { label: '場景', value: confirmedScene?.name_zh || '—' },
                                                        { label: '服裝', value: confirmedOutfitId ? '已選' : '自動' },
                                                        { label: '比例', value: aspectRatio },
                                                        { label: '畫質', value: quality },
                                                        { label: '視角', value: isPOV ? 'POV' : '3RD' },
                                                    ].map(cell => (
                                                        <div key={cell.label} className="flex flex-col items-center gap-1">
                                                            <span className="text-[7px] text-gray-600 font-black uppercase tracking-widest">{cell.label}</span>
                                                            <span className="text-[9px] text-white font-bold truncate max-w-full px-1">{cell.value}</span>
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
                                                    {isGeneratingImage ? '正在捕捉靈魂切片 (RENDERING...)' : '生成敘事影像 // GENERATE IMAGE'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── Step 5：出圖結果 ─────────────────────────────── */}
                                    {narrativeStep === 5 && generatedImageUrl && (
                                        <div className="absolute inset-0 bg-[var(--color-bg-surface)]/98 backdrop-blur-sm z-20 flex flex-col overflow-hidden">
                                            {/* Header */}
                                            <div className="px-8 py-4 border-b border-white/10 shrink-0 flex items-center justify-between">
                                                <p className="text-[10px] font-black text-[var(--color-gold)] uppercase tracking-[0.5em]">出圖結果 // RESULT</p>
                                                <div className="flex gap-4">
                                                    <button onClick={() => { setNarrativeStep(1); setDiary(null); setGeneratedImageUrl(null); setIgCaption(''); setFbCaption(''); setThreadsCaption(''); setCarouselImages([]); setCarouselMode(false); }}
                                                        className="text-[8px] text-gray-600 hover:text-gray-400 transition-colors">← 換場景</button>
                                                    <button onClick={() => setNarrativeStep(2)}
                                                        className="text-[8px] text-gray-600 hover:text-gray-400 transition-colors">← 換服裝</button>
                                                    <button onClick={() => { setNarrativeStep(3); setDiary(null); setIgCaption(''); setFbCaption(''); setThreadsCaption(''); }}
                                                        className="text-[8px] text-gray-600 hover:text-gray-400 transition-colors">← 換設定</button>
                                                </div>
                                            </div>
                                            {/* 50/50 split */}
                                            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
                                                {/* Left: image */}
                                                <div className="relative flex items-center justify-center bg-black/30 overflow-hidden min-h-[300px] lg:min-h-0">
                                                    <img src={generatedImageUrl} alt="generated"
                                                        className="max-w-full max-h-full object-contain" />
                                                    <button onClick={() => setShowLightbox(true)}
                                                        className="absolute top-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-[8px] font-black text-white uppercase tracking-widest hover:bg-black/80 transition-colors">
                                                        ↗ 放大
                                                    </button>
                                                    {carouselImages.length > 0 && (
                                                        <div className="absolute bottom-0 left-0 right-0 flex gap-2 overflow-x-auto px-4 py-3 bg-black/60 backdrop-blur-sm">
                                                            {carouselImages.map((img, i) => (
                                                                <img key={i} src={img} alt={`v${i+1}`}
                                                                    className="h-14 w-10 object-cover rounded-lg border border-white/20 shrink-0 cursor-pointer hover:border-[var(--color-gold)] transition-all" />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Right: info panel */}
                                                <div className="flex flex-col gap-4 p-6 border-l border-white/5 overflow-y-auto">
                                                    {/* IP vibe badge */}
                                                    {(model.persona?.coreVibe || model.persona?.mbti) && (
                                                        <p className="text-[9px] font-black text-[var(--color-gold)]/70 uppercase tracking-widest -mb-2">
                                                            ✦ {[getCoreVibeZH(model.persona?.coreVibe || ''), model.persona?.mbti].filter(Boolean).join(' · ')}
                                                        </p>
                                                    )}
                                                    {/* Platform caption tabs */}
                                                    <div className="space-y-2">
                                                        <div className="flex gap-2">
                                                            {(['ig', 'fb', 'threads'] as const).map(p => (
                                                                <button key={p}
                                                                    onClick={() => void handleCaptionTabClick(p)}
                                                                    className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${selectedPlatform === p ? 'bg-[var(--color-gold)] text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                                                                    {p === 'ig' ? 'Instagram' : p === 'fb' ? 'Facebook' : 'Threads'}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        {isLoadingCaption ? (
                                                            <div className="space-y-2 animate-pulse p-3 bg-white/5 rounded-xl">
                                                                <div className="h-2 bg-white/10 rounded w-3/4"/>
                                                                <div className="h-2 bg-white/10 rounded w-full"/>
                                                                <div className="h-2 bg-white/10 rounded w-2/3"/>
                                                            </div>
                                                        ) : (
                                                            <textarea
                                                                value={selectedPlatform === 'ig' ? igCaption : selectedPlatform === 'fb' ? fbCaption : threadsCaption}
                                                                onChange={(e) => {
                                                                    if (selectedPlatform === 'ig') setIgCaption(e.target.value);
                                                                    else if (selectedPlatform === 'fb') setFbCaption(e.target.value);
                                                                    else setThreadsCaption(e.target.value);
                                                                }}
                                                                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-3 text-[10px] text-gray-200 resize-none outline-none focus:border-[var(--color-gold)]/50 transition-all leading-relaxed"
                                                                placeholder={selectedPlatform === 'ig' ? 'IG 文案生成中...' : '點擊上方標籤生成平台文案'}
                                                            />
                                                        )}
                                                    </div>
                                                    {/* Outfit */}
                                                    {confirmedOutfitId && (
                                                        <div className="space-y-1">
                                                            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">服裝造型</p>
                                                            <p className="text-[10px] font-black text-white">
                                                                {STYLE_ARCHETYPE_MAP[([...(pickerOutfitOptions?.alternatives || []), pickerOutfitOptions?.topPick].find((o: any) => o?.outfit_id === confirmedOutfitId) as any)?.style_archetype || ''] || '已選服裝'}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {/* Shoot specs */}
                                                    <div className="grid grid-cols-4 gap-2 p-3 bg-white/5 rounded-xl">
                                                        {[
                                                            { label: '比例', value: aspectRatio },
                                                            { label: '畫質', value: quality },
                                                            { label: '視角', value: isPOV ? 'POV' : '3RD' },
                                                            { label: '場景', value: (confirmedScene?.name_zh || '—').slice(0,5) },
                                                        ].map(c => (
                                                            <div key={c.label} className="flex flex-col items-center gap-1">
                                                                <span className="text-[7px] text-gray-600 font-black uppercase tracking-widest">{c.label}</span>
                                                                <span className="text-[9px] text-white font-bold truncate w-full text-center">{c.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {/* 2×2 action buttons */}
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button onClick={() => { const a = document.createElement('a'); a.href = generatedImageUrl!; a.download = `${model.name || 'pavora'}-${Date.now()}.jpg`; a.click(); }}
                                                            className="py-3 text-[9px] font-black uppercase tracking-widest rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 transition-all">
                                                            ↓ 儲存影像
                                                        </button>
                                                        <button
                                                            onClick={() => void handleGenerateCarouselVariation('surprise')}
                                                            disabled={isGeneratingVariation}
                                                            className="py-3 text-[9px] font-black uppercase tracking-widest rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:border-white/30 disabled:opacity-40 transition-all">
                                                            {isGeneratingVariation ? '生成中...' : '↺ 再生一張'}
                                                        </button>
                                                        <button
                                                            onClick={() => { setNarrativeStep(3); setDiary(null); setIgCaption(''); setFbCaption(''); setThreadsCaption(''); setCarouselImages([]); setCarouselMode(false); }}
                                                            className="py-3 text-[9px] font-black uppercase tracking-widest rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:border-white/30 transition-all">
                                                            ✎ 繼續故事
                                                        </button>
                                                        <button onClick={() => handleFinish()} disabled={isExtractingMem}
                                                            className="py-3 text-[9px] font-black uppercase tracking-widest rounded-xl bg-[var(--color-gold)]/20 border border-[var(--color-gold)]/50 text-[var(--color-gold)] hover:bg-[var(--color-gold)]/30 disabled:opacity-40 transition-all">
                                                            {isExtractingMem ? '記憶中...' : '→ IP 休息室'}
                                                        </button>
                                                    </div>
                                                    {/* 完成佈署 全寬按鈕 */}
                                                    <button onClick={handleFinish} disabled={isExtractingMem}
                                                        className="w-full py-3 text-[9px] font-black uppercase tracking-widest rounded-xl bg-[var(--color-gold)] text-black hover:opacity-90 disabled:opacity-40 transition-all">
                                                        {isExtractingMem ? '記憶中...' : '完成佈署 // FINISH'}
                                                    </button>
                                                    {/* Carousel variation selector */}
                                                    {carouselMode && (
                                                        <div className="space-y-2">
                                                            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">輪播變化方向</p>
                                                            <div className="grid grid-cols-4 gap-1.5">
                                                                {([
                                                                    { type: 'pose', label: '換姿勢' },
                                                                    { type: 'expression', label: '換表情' },
                                                                    { type: 'angle', label: '換角度' },
                                                                    { type: 'surprise', label: 'AI 隨機' },
                                                                ] as const).map(v => (
                                                                    <button key={v.type}
                                                                        onClick={() => void handleGenerateCarouselVariation(v.type)}
                                                                        disabled={isGeneratingVariation}
                                                                        className="py-2 text-[8px] font-black uppercase rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:border-[var(--color-gold)]/40 hover:text-white disabled:opacity-40 transition-all">
                                                                        {v.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── Step 3：核心敘事編寫 (當非 Overlay 時呈現) ── */}
                                    {narrativeStep === 3 && (
                                        <div className="relative z-10 flex flex-col gap-6 p-8 flex-1 overflow-y-auto">
                                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                                                <div className="lg:col-span-3 space-y-6">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {/* 場景確認 */}
                                                        <div className="group relative bg-[var(--color-bg-card)]/40 border border-[var(--color-border)] rounded-[2rem] p-5 hover:border-[var(--color-gold)]/30 transition-all">
                                                            <div className="flex justify-between items-start mb-3">
                                                                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">當前場景 // SCENE</span>
                                                                <button onClick={() => setNarrativeStep(1)} className="text-[8px] font-black text-[var(--color-gold)] uppercase tracking-widest hover:underline">← 更換</button>
                                                            </div>
                                                            <p className="text-[15px] font-black text-white leading-tight mb-1">{confirmedScene?.name_zh || '尚未選擇'}</p>
                                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                                                                {(confirmedScene as any)?.city === 'any' ? '全台通用' : (confirmedScene as any)?.city || '—'} · {(confirmedScene as any)?.category || '一般'}
                                                            </p>
                                                        </div>

                                                        {/* 服裝確認 */}
                                                        <div className="group relative bg-[var(--color-bg-card)]/40 border border-[var(--color-border)] rounded-[2rem] p-5 hover:border-blue-500/20 transition-all">
                                                            <div className="flex justify-between items-start mb-3">
                                                                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">當前服裝 // OUTFIT</span>
                                                                <button onClick={() => setNarrativeStep(2)} className="text-[8px] font-black text-blue-400 uppercase tracking-widest hover:underline">← 更換</button>
                                                            </div>
                                                            <p className="text-[15px] font-black text-white leading-tight mb-1">
                                                                {confirmedOutfitId ? (STYLE_ARCHETYPE_MAP[([...(pickerOutfitOptions?.alternatives || []), pickerOutfitOptions?.topPick].find((o: any) => o?.outfit_id === confirmedOutfitId) as any)?.style_archetype || ''] || '已選服裝') : '自動搭配'}
                                                            </p>
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {(() => {
                                                                    const outfit = [...(pickerOutfitOptions?.alternatives || []), pickerOutfitOptions?.topPick].find((o: any) => o?.outfit_id === confirmedOutfitId) as any;
                                                                    if (!outfit?.pillars) return <span className="text-[10px] text-gray-600">自動匹配中...</span>;
                                                                    return [outfit.pillars.top, outfit.pillars.bottom].filter(Boolean).map((item: string, i: number) => (
                                                                        <span key={i} className="text-[9px] text-gray-500 bg-white/5 border border-white/10 rounded px-1.5 py-0.5">{item}</span>
                                                                    ));
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 事件描述 textarea */}
                                                    <div className="group relative">
                                                        <div className="flex justify-between items-end mb-3 px-1">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">敘事起點 // EVENT TRIGGER</label>
                                                            <span className="text-[8px] text-gray-600 font-mono italic">AI-ASSISTED</span>
                                                        </div>
                                                        <textarea
                                                            className="w-full min-h-[180px] bg-black/5 dark:bg-black/40 border border-black/5 dark:border-white/5 rounded-[2.5rem] p-6 text-sm text-gray-200 focus:border-[var(--color-gold)]/30 transition-all resize-vertical leading-relaxed outline-none"
                                                            placeholder="描繪此刻的情境..."
                                                            value={eventInput}
                                                            onChange={(e) => { setEventInput(e.target.value); setRandomSceneId(null); setSelectedBrief(null); setEventSource('manual'); }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Right: Visual Production */}
                                                <div className="space-y-8 lg:border-l lg:border-white/5 lg:pl-10">
                                                    <div className="space-y-6">
                                                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">視覺轉化控制 (Visual Control)</h3>
                                                        <div className="space-y-6">
                                                            {/* Ratio */}
                                                            <div className="space-y-2">
                                                                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">比例 // RATIO</label>
                                                                <div className="grid grid-cols-4 gap-2">
                                                                    {['9:16', '4:5', '1:1', '16:9'].map(id => (
                                                                        <button key={id} onClick={() => setAspectRatio(id)}
                                                                            className={`py-3 text-[9px] font-bold rounded-xl border transition-all ${aspectRatio === id ? 'bg-[var(--color-gold)]/20 border-[var(--color-gold)] text-[var(--color-gold)]' : 'border-white/5 text-gray-500'}`}>
                                                                            {id}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* POV Section */}
                                                            <div className="space-y-2">
                                                                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">鏡頭視角 // PERSPECTIVE</label>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    {[
                                                                        { id: true, label: '第一人稱 (POV)' },
                                                                        { id: false, label: '第三人稱 (3RD)' }
                                                                    ].map(v => (
                                                                        <button key={String(v.id)} onClick={() => setIsPOV(v.id)}
                                                                            className={`py-3 text-[9px] font-bold rounded-xl border transition-all ${isPOV === v.id ? 'bg-[var(--color-gold)]/20 border-[var(--color-gold)] text-[var(--color-gold)]' : 'border-white/5 text-gray-500'}`}>
                                                                            {v.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Quality/Preset */}
                                                            <div className="space-y-2">
                                                                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">預設 // PRESET</label>
                                                                <div className="grid grid-cols-3 gap-2">
                                                                    {['HD', 'Cinematic', 'Pro'].map(id => (
                                                                        <button key={id} onClick={() => setQuality(id)}
                                                                            className={`py-2.5 rounded-xl border text-[9px] font-bold transition-all ${quality === id ? 'bg-white/10 border-white/40 text-white' : 'border-white/5 text-gray-500'}`}>
                                                                            {id}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            }
                        </AnimatePresence>
                    </div>

                    {/* Footer and Finish - Sticky at the bottom of Content Hub */}
                    <div className="px-8 py-5 border-t border-white/5 bg-[var(--color-bg-surface)] shrink-0 flex items-center justify-between gap-4">
                        {narrativeStep === 3 && !diary ? (
                            <>
                                <button
                                    onClick={() => setNarrativeStep(2)}
                                    className="px-6 py-3 rounded-[1.5rem] text-[11px] font-black tracking-[0.3em] uppercase bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all border border-white/5">
                                    ← 換服裝
                                </button>
                                <button
                                    onClick={() => handleGenerateDiary(confirmedScene?.scene_id, eventInput, confirmedOutfitId)}
                                    disabled={!eventInput.trim() || isGenerating}
                                    className={`px-8 py-3 rounded-[1.5rem] text-[11px] font-black tracking-[0.3em] uppercase transition-all ${!eventInput.trim() || isGenerating ? 'bg-white/5 text-gray-600 cursor-not-allowed' : 'bg-[var(--color-gold)] text-black hover:bg-[var(--color-gold)]/90'}`}>
                                    {isGenerating ? '正在編織...' : '建立拍攝劇本 →'}
                                </button>
                            </>
                        ) : (
                            <>
                                <span className="text-[8px] text-gray-600 uppercase tracking-[0.5em] font-light">
                                    Antigravity 靈魂視覺引擎已上線 // ENGINE ACTIVE
                                </span>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => { if (!isAnyTaskRunning) onClose(); }}
                                        disabled={isAnyTaskRunning}
                                        className="px-8 py-3 rounded-[1.5rem] text-[10px] tracking-widest font-black uppercase italic border border-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-30">
                                        取消 // CANCEL
                                    </button>
                                    <button
                                        onClick={() => handleFinish()}
                                        disabled={!diary || isExtractingMem}
                                        className="px-8 py-3 rounded-[1.5rem] text-[11px] font-black tracking-[0.3em] uppercase bg-[var(--color-gold)] text-black hover:bg-[var(--color-gold)]/90 transition-all disabled:opacity-50">
                                        {isExtractingMem ? '完成中...' : '完成佈署 // FINISH'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

            {/* Memory Confirmation Modal */}
                <AnimatePresence>
                    {showMemoryConfirm && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-[var(--color-bg-deep)]/95 backdrop-blur-md z-[100] flex items-center justify-center p-6"
                        >
                            <div className="max-w-sm w-full bg-[var(--color-bg-surface)] border border-[var(--color-gold)]/20 p-8 rounded-[2.5rem] space-y-6 shadow-2xl">
                                <div className="text-center space-y-2">
                                    <h4 className="text-sm font-bold text-[var(--color-gold)] uppercase tracking-[0.2em] font-display">核心記憶同步 // CORE MEMORY SYNC</h4>
                                    <p className="text-[10px] text-gray-400 font-medium">
                                        系統偵測到了新的生活細節與記憶碎片。是否要將這些內容永久存入其靈魂底座？
                                    </p>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {newMemories.map((mem, i) => (
                                        <div key={i} className="px-4 py-2 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded-xl text-[10px] text-[var(--color-gold)] font-bold">
                                            {mem}
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-3 pt-4">
                                    <Button onClick={() => handleConfirmMemories(newMemories)} className="w-full py-4 text-[10px] tracking-widest uppercase italic">
                                        存入長期記憶 // SAVE MEMORY 🧠
                                    </Button>
                                    <Button variant="secondary" onClick={() => handleConfirmMemories([])} className="w-full py-3 text-[10px] border-white/10 opacity-60 uppercase italic tracking-widest">
                                        不儲存跳過 // SKIP
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>


        </div>
    );
};

export default NarrativeWorkflow;
