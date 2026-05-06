import React, { useState } from 'react';
import type { Model, DiaryEntry } from '../../shared/types/types';
import Button from '../../shared/components/common/Button';
import Loader from '../../shared/components/common/Loader';
import { generateIPDiary, generateRandomEvent, syncPrompts, generateDynamicEvent, extractNewMemories } from './services/narrativeService';
import { OrchestratorService } from './services/orchestratorService';
import { transformImage } from '../../shared/services/geminiService';
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

const NarrativeWorkflow: React.FC<NarrativeWorkflowProps> = ({ model: propModel, onClose, onConfirm }) => {
    const { addNotification } = useNotification();
    const { updateModelGallery, updateModel, models } = useModelStore();
    
    // Ensure we are using the latest model data from the store for reactivity
    const model = models.find(m => m.id === propModel.id) || propModel;
    
    const [previewingImage, setPreviewingImage] = useState<{images: string[], startIndex: number} | null>(null);
    const [eventInput, setEventInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingDynamicEvent, setIsGeneratingDynamicEvent] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isExtractingMem, setIsExtractingMem] = useState(false);
    const [diary, setDiary] = useState<Partial<DiaryEntry> | null>(null);
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
    
    // Advanced Controls
    const [aspectRatio, setAspectRatio] = useState('9:16');
    const [quality, setQuality] = useState('HD');
    const [isPOV, setIsPOV] = useState(true);
    const [editablePrompt, setEditablePrompt] = useState('');
    const [editablePromptZH, setEditablePromptZH] = useState('');
    const [activePromptLang, setActivePromptLang] = useState<'ZH' | 'EN'>('ZH');

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

    const handleGenerateDiary = async () => {
        if (!eventInput.trim()) return;
        setIsGenerating(true);
        setGeneratedImageUrl(null);
        
        // Get context from last gallery entry
        const lastEntry = model.gallery?.[model.gallery.length - 1];
        const context = lastEntry ? { content: lastEntry.narrativeContent, mood: lastEntry.mood } : undefined;

        try {
            const result = await generateIPDiary(model, eventInput, { 
                isPOV, 
                lastEntry: context,
                forcedSceneId: selectedBrief?.sceneId
            });
            setDiary(result);
            setSelectedBrief(null); // Reset after use
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
            const sourceImageData = await imageUrlToimageData(model.imageUrl);
            
            const imageConfig: any = {
                aspectRatio: aspectRatio,
            };

            // HD: 1K, CINEMATIC: 2K, PRO: 4K
            let resolutionTier = '1K';
            if (quality === 'Cinematic') resolutionTier = '2K';
            else if (quality === 'Pro') resolutionTier = '4K';
            imageConfig.imageSize = resolutionTier;

            // PRO 模式啟動「身份強化」flag,由 transformImage 內部處理
            const url = await transformImage(
                sourceImageData,
                editablePrompt,
                [],
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
            addNotification({ type: 'success', message: '靈魂視覺化成功 (Visualization Success)', description: '影像已生成並包含身分內碼 (Image generated with identity metadata).' });
        } catch (e) {
            console.error(e);
            addNotification({ type: 'error', message: '影像生成失敗 (Generation Failed)', description: 'AI 算力調度異常，請稍後再試 (AI engine error, please try again later).' });
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleRandomEvent = () => {
        const randomEvent = generateRandomEvent(model);
        setEventInput(randomEvent);
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
            const lastEntry = model.gallery?.[model.gallery.length - 1];
            const context = lastEntry ? { content: lastEntry.narrativeContent, mood: lastEntry.mood } : undefined;

            const event = await generateDynamicEvent(model, context);
            setEventInput(event);
            addNotification({ type: 'success', message: '靈魂與現世已對齊 (Context Aligned)', description: '及時場景與故事弧邏輯已啟動 (Real-time scene and story arc logic active).' });
        } catch (e) {
            addNotification({ type: 'error', message: '靈感獲取失敗' });
        } finally {
            setIsGeneratingDynamicEvent(false);
        }
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
                    visualPromptZH: editablePromptZH
                });

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

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[var(--color-bg-deep)]/90 backdrop-blur-3xl" 
                onClick={() => onClose()} 
            />
            {previewingImage && <ImagePreviewModal {...previewingImage} onClose={() => setPreviewingImage(null)} />}
            
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="relative w-full max-w-6xl h-[90vh] bg-[var(--color-bg-surface)]/80 backdrop-blur-3xl border border-[var(--color-border)] rounded-[3rem] overflow-hidden shadow-2xl flex"
            >
                {/* Lateral Navigation - Phase 3 Optimization */}
                <div className="w-20 border-r border-[var(--color-border)] flex flex-col items-center py-10 gap-8 bg-black/5 dark:bg-black/20">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-gold)] flex items-center justify-center mb-10 shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                       <span className="text-black text-[8px] font-black italic">AV</span>
                    </div>
                    
                    <NavIconButton 
                        active={!showWardrobe && !showSettings && !showPlan} 
                        onClick={() => { setShowWardrobe(false); setShowSettings(false); setShowPlan(false); }}
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                        label="敘事首頁 // HOME"
                    />
                    
                    <NavIconButton 
                        active={showPlan} 
                        onClick={handleGeneratePlan}
                        isLoading={isGeneratingPlan}
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                        label="週計畫 // PLAN"
                    />

                    <NavIconButton 
                        active={showWardrobe} 
                        onClick={() => { setShowWardrobe(true); setShowSettings(false); setShowPlan(false); }}
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                        label="劇組衣櫃 // WARDROBE"
                    />

                    <NavIconButton 
                        active={showSettings} 
                        onClick={() => { setShowSettings(true); setShowWardrobe(false); setShowPlan(false); }}
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.754 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                        label="系統設定 // SETTINGS"
                    />

                    <div className="mt-auto pb-8">
                        <button onClick={onClose} className="p-3 text-gray-600 hover:text-white transition-colors bg-white/5 hover:bg-red-500/20 rounded-full group">
                            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
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
                                                        setEventInput(brief.title);
                                                        setShowPlan(false);
                                                        addNotification({ type: 'success', message: '靈魂與計畫對齊', description: '生成引擎已載入此劇本矩陣設定。' });
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
                                    initial={{ opacity: 0, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, filter: 'blur(10px)' }}
                                    className="p-12 space-y-10 relative min-h-full overflow-y-auto custom-scrollbar"
                                >
                                    {/* Ambient Matrix Grid - Phase 3 Visual */}
                                    <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
                                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:45px_45px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
                                        <motion.div 
                                            animate={{ y: [0, 1000] }}
                                            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                                            className="absolute top-0 left-0 right-0 h-[250px] bg-gradient-to-b from-transparent via-[var(--color-gold)]/5 to-transparent opacity-40 shadow-[0_40px_40px_rgba(212,175,55,0.02)]"
                                        />
                                    </div>

                                    <div className="relative z-10 space-y-12 pb-16 text-left">
                                        <motion.div
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            <StoryProgressBoard 
                                                model={model} 
                                                onInitializeThread={() => setShowSettings(true)}
                                            />
                                        </motion.div>
                                        
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="grid grid-cols-2 lg:grid-cols-4 gap-8 p-8 bg-[var(--color-bg-card)]/40 rounded-[3rem] border border-[var(--color-border)] backdrop-blur-xl shadow-2xl"
                                        >
                                            <div className="space-y-1.5 border-r border-[var(--color-border)] pr-6">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">人格內核 // MBTI</p>
                                                <p className="text-base text-[var(--color-gold)] font-black italic">{model.persona?.mbti || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-1.5 border-r border-[var(--color-border)] px-6">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">核心氛圍 // VIBE</p>
                                                <p className="text-base text-[var(--color-text-title)] font-black uppercase tracking-tight">{model.persona?.coreVibe || 'Standard'}</p>
                                            </div>
                                            <div className="space-y-1.5 border-r border-[var(--color-border)] px-6">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">主力足跡 // CITY</p>
                                                <p className="text-base text-[var(--color-text-title)] font-bold">{model.lifeCircuit?.primaryCity || 'Global'}</p>
                                            </div>
                                            <div className="space-y-1.5 pl-6">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">生理對齊 // PHYS-SYNC</p>
                                                <p className="text-base text-emerald-500 font-black flex items-center gap-3">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)] animate-pulse"></span>
                                                    已上線 // ACTIVE
                                                </p>
                                            </div>
                                        </motion.div>

                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-16 pt-4">
                                            <div className="space-y-10">
                                                <motion.div 
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.3 }}
                                                    className="space-y-8"
                                                >
                                                    <div className="space-y-6">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-3 bg-white/20 rounded-full"></div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">
                                                當下敘事起點 // EVENT TRIGGER
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex gap-6 pb-1">
                                        <motion.button 
                                            whileHover={{ scale: 1.05, y: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleAIGenerateEvent}
                                            disabled={isGeneratingDynamicEvent}
                                            className="text-[10px] text-[var(--color-gold)] font-black uppercase tracking-[0.2em] border-b border-[var(--color-gold)]/30 hover:border-[var(--color-gold)] transition-all flex items-center gap-2 disabled:opacity-30"
                                        >
                                            <span className="animate-pulse">{isGeneratingDynamicEvent ? '○' : '✨'}</span>
                                            {isGeneratingDynamicEvent ? '感應靈魂中...' : 'AI 劇本啟發'}
                                        </motion.button>
                                        <motion.button 
                                            whileHover={{ scale: 1.05, y: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleRandomEvent}
                                            className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] border-b border-white/10 hover:text-white transition-all flex items-center gap-2"
                                        >
                                            <span>🎲</span> 隨機場景 
                                        </motion.button>
                                    </div>
                                </div>
                                <div className="group relative">
                                    <textarea 
                                        className="w-full h-36 bg-black/5 dark:bg-black/40 border border-black/5 dark:border-white/5 rounded-[2.5rem] p-6 text-sm text-gray-800 dark:text-gray-200 focus:border-[var(--color-gold)]/30 focus:shadow-[0_0_40px_rgba(212,175,55,0.05)] transition-all resize-none font-medium leading-relaxed outline-none shadow-inner"
                                        placeholder="描繪此刻的情境... 靈魂敘事將以此為軸心展開。"
                                        value={eventInput}
                                        onChange={(e) => setEventInput(e.target.value)}
                                    />
                                    <div className="absolute bottom-6 right-6 w-12 h-0.5 bg-gradient-to-r from-transparent to-[var(--color-gold)]/20 opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                                </div>
                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleGenerateDiary} 
                                    isLoading={isGenerating} 
                                    disabled={!eventInput.trim() || isGenerating}
                                    className="w-full py-5 bg-[var(--color-gold)] text-black text-[12px] font-black tracking-[0.5em] uppercase rounded-3xl shadow-[0_20px_40px_rgba(212,175,55,0.15)] hover:shadow-[0_25px_50px_rgba(212,175,55,0.25)] transition-all disabled:opacity-30"
                                >
                                    {isGenerating ? '正在編織命運線 (SYNCING...)' : '同步靈魂敘事 // SYNCHRONIZE'}
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

                                            {/* Right: Visual Generation */}
                                            <motion.div 
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.4 }}
                                                className="space-y-8 lg:border-l lg:border-white/5 lg:pl-10"
                                            >
                                                <div className="space-y-6">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">視覺轉化控制 (Visual Control)</h3>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">構圖比例 // ASPECT RATIO</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { id: '9:16', label: '直式短影 // REELS' },
                                                    { id: '4:5', label: '社群貼文 // POST' },
                                                    { id: '1:1', label: '方型 // SQ' },
                                                    { id: '16:9', label: '寬螢幕 // CINEMA' }
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
                                第一人稱 (POV)
                            </button>
                            <button 
                                onClick={() => setIsPOV(false)}
                                className={`flex-1 py-3 text-[9px] font-bold rounded-lg transition-all ${!isPOV ? 'bg-[var(--color-gold)]/20 text-[var(--color-gold)] shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                第三人稱 (3RD)
                            </button>
                        </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">畫質與光影預設 // QUALITY PRESET</label>
                                            <div className="grid grid-cols-1 gap-2">
                                                {[
                                                    { id: 'HD', label: '高解析度還原 // HD', desc: '日常產出 1K // DAILY' },
                                                    { id: 'Cinematic', label: '電影製片級 // CINEMATIC', desc: '精緻細節 2K // DETAIL' },
                                                    { id: 'Pro', label: '極致還原 // PRO', desc: '臉部鎖定 4K // FIDELITY' }
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
                                        <button 
                                            onClick={handleSyncPrompt}
                                            disabled={isSyncing || !diary}
                                            className="text-[9px] font-bold text-[var(--color-gold)] uppercase tracking-widest flex items-center gap-2 hover:opacity-80 disabled:opacity-30"
                                        >
                                            {isSyncing ? '同步中...' : '🔄 雙語同步 (Sync)'}
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="relative">
                                            {activePromptLang === 'ZH' ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between px-2">
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">分段式編輯 (Modular Edit Mode)</span>
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500/50 animate-pulse"></div>
                                                    </div>
                                                    {editablePromptZH.includes('[') && editablePromptZH.includes(']: ') ? (
                                                        <div className="grid grid-cols-1 gap-2.5">
                                                            {editablePromptZH.split('\n').filter(l => l.trim().includes(']:')).map((line, i) => {
                                                                const [key, ...val] = line.split(']: ');
                                                                const displayKey = key.replace('[', '').replace(']', '');
                                                                return (
                                                                    <div key={i} className="group flex flex-col bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-3 hover:border-[var(--color-gold)]/30 transition-all shadow-sm">
                                                                        <div className="flex justify-between items-center mb-1">
                                                                            <span className="text-[8px] font-black text-[var(--color-gold)] uppercase tracking-widest pl-1">
                                                                                {displayKey}
                                                                            </span>
                                                                            <div className="w-1 h-1 rounded-full bg-[var(--color-gold)]/20 group-hover:bg-[var(--color-gold)] transition-colors"></div>
                                                                        </div>
                                                                        <textarea 
                                                                            className="w-full bg-transparent border-none p-0 text-[11px] text-[var(--color-text-main)] focus:ring-0 resize-none min-h-[40px] outline-none leading-relaxed placeholder-gray-500"
                                                                            value={val.join(']: ')}
                                                                            onChange={(e) => {
                                                                                const lines = editablePromptZH.split('\n');
                                                                                const lineIdx = lines.findIndex(l => l.startsWith(key + ']:'));
                                                                                if (lineIdx !== -1) {
                                                                                    lines[lineIdx] = `${key}]: ${e.target.value}`;
                                                                                    setEditablePromptZH(lines.join('\n'));
                                                                                }
                                                                            }}
                                                                        />
                                                                    </div>
                                                                );
                                                            })}
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
                                                    {editablePrompt.includes('[') && editablePrompt.includes(']: ') ? (
                                                        <div className="grid grid-cols-1 gap-2.5">
                                                            {editablePrompt.split('\n').map((line, i) => {
                                                                const [key, ...val] = line.split(']: ');
                                                                if (!key || val.length === 0) return null;
                                                                const displayKey = key.replace('[', '').replace(']', '');
                                                                return (
                                                                    <div key={i} className="group flex flex-col bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-3 hover:border-blue-500/20 transition-all">
                                                                        <span className="text-[8px] font-mono font-bold text-blue-400/40 uppercase tracking-widest mb-1 pl-1">
                                                                            {displayKey}
                                                                        </span>
                                                                        <textarea 
                                                                            className="w-full bg-transparent border-none p-0 text-[10px] font-mono text-gray-400 focus:ring-0 resize-none min-h-[45px] outline-none leading-tight"
                                                                            value={val.join(']: ')}
                                                                            onChange={(e) => {
                                                                                const lines = editablePrompt.split('\n');
                                                                                lines[i] = `[${displayKey}]: ${e.target.value}`;
                                                                                setEditablePrompt(lines.join('\n'));
                                                                            }}
                                                                        />
                                                                    </div>
                                                                );
                                                            }).filter(Boolean)}
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

                                <Button 
                                    onClick={handleGenerateImage} 
                                    isLoading={isGeneratingImage} 
                                    disabled={!diary || !editablePrompt || isGeneratingImage}
                                    variant="primary"
                                    className="w-full py-4 text-[11px] font-bold tracking-[0.4em] uppercase shadow-xl shadow-[var(--color-gold)]/10"
                                >
                                    {generatedImageUrl ? '重新生成影像 (Regenerate)' : '生成敘事影像 (Generate)'}
                                </Button>
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
                                                            <Loader className="mb-4" />
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
                        <Button variant="secondary" onClick={onClose} className="px-8 border-white/10 text-[10px] tracking-widest font-black uppercase italic">取消 // CANCEL</Button>
                        <Button 
                            onClick={handleFinish} 
                            disabled={!diary || isExtractingMem}
                            isLoading={isExtractingMem}
                            className="px-10 text-[11px] font-bold tracking-[0.4em] uppercase italic"
                        >
                            完成佈署 // FINISH
                        </Button>
                    </div>
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
