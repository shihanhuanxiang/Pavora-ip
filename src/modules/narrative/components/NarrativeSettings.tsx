import React, { useState, useEffect } from 'react';
import { Model, StoryArc, IdentityThread } from '../../../shared/types/types';
import { STORY_ARCS, IDENTITY_THREADS } from '../constants/storyElements';
import { VISUAL_PRESETS, getPresetById } from '../constants/visualPresets';
import { applyVisualPreset } from '../services/narrativeService';
import { motion, AnimatePresence } from 'motion/react';

interface NarrativeSettingsProps {
    model: Model;
    onUpdate: (updates: Partial<Model>) => void;
}

export const NarrativeSettings: React.FC<NarrativeSettingsProps> = ({ model, onUpdate }) => {
    const [extensions, setExtensions] = useState(model.preferences?.persona_extension || {});
    const [isAddingArc, setIsAddingArc] = useState(false);
    const [isAddingThread, setIsAddingThread] = useState(false);
    
    // Custom Creation Temp State
    const [newArc, setNewArc] = useState<Partial<StoryArc>>({ name_zh: '', name_en: '', duration_days: 7, rationale: '' });
    const [newThread, setNewThread] = useState<Partial<IdentityThread>>({ name_zh: '', name_en: '', duration_weeks: 12, rationale: '' });

    // Sync extensions state when model prop updates
    useEffect(() => {
        setExtensions(model.preferences?.persona_extension || {});
    }, [model.preferences?.persona_extension]);

    const handleSaveExtensions = () => {
        onUpdate({
            preferences: {
                ...model.preferences,
                persona_extension: extensions
            }
        });
    };

    const handleDeleteArc = (arcId: string) => {
        const isActive = model.preferences?.active_arc_id === arcId;
        onUpdate({
            preferences: {
                ...model.preferences,
                active_arc_id: isActive ? null : model.preferences?.active_arc_id,
                custom_story_arcs: (model.preferences?.custom_story_arcs || []).filter(a => a.arc_id !== arcId)
            }
        });
    };

    const handleAddCustomArc = () => {
        if (!newArc.name_zh) return;
        const arc: StoryArc = {
            arc_id: `CUSTOM-ARC-${Date.now()}`,
            name_zh: newArc.name_zh,
            name_en: newArc.name_en || 'Custom Arc',
            duration_days: newArc.duration_days || 7,
            phases: ['Phase 1', 'Phase 2', 'Phase 3'], // Default phases for custom
            spacing_days: [0, 3, 7],
            scenes: [],
            rationale: newArc.rationale || ''
        };
        onUpdate({
            preferences: {
                ...model.preferences,
                custom_story_arcs: [...(model.preferences?.custom_story_arcs || []), arc]
            }
        });
        setIsAddingArc(false);
        setNewArc({ name_zh: '', name_en: '', duration_days: 7, rationale: '' });
    };

    const toggleMaster = (key: 'enable_story_arcs' | 'enable_identity_threads') => {
        const currentPrefs = model.preferences || {};
        const currentValue = currentPrefs[key] !== false;
        const nextValue = !currentValue;

        onUpdate({
            preferences: {
                ...currentPrefs,
                [key]: nextValue
            }
        });
    };

    const handleToggleArc = (arcId: string) => {
        if (model.preferences?.enable_story_arcs === false) return;
        const isActive = model.preferences?.active_arc_id === arcId;
        onUpdate({
            preferences: {
                ...model.preferences,
                active_arc_id: isActive ? null : arcId,
                active_arc_phase_index: 0
            }
        });
    };

    const handleToggleThread = (threadId: string) => {
        if (model.preferences?.enable_identity_threads === false) return;
        const currentThreads = model.preferences?.active_threads || [];
        const exists = currentThreads.find(t => t.thread_id === threadId);
        
        let newThreads;
        if (exists) {
            newThreads = currentThreads.filter(t => t.thread_id !== threadId);
        } else if (currentThreads.length < 2) {
            newThreads = [...currentThreads, {
                thread_id: threadId,
                current_milestone_index: 0,
                last_update_timestamp: Date.now()
            }];
        } else {
            return; // Max 2
        }

        onUpdate({
            preferences: {
                ...model.preferences,
                active_threads: newThreads
            }
        });
    };

    const handleDeleteThread = (threadId: string) => {
        onUpdate({
            preferences: {
                ...model.preferences,
                active_threads: (model.preferences?.active_threads || []).filter(t => t.thread_id !== threadId),
                custom_identity_threads: (model.preferences?.custom_identity_threads || []).filter(t => t.thread_id !== threadId)
            }
        });
    };

    const handleAddCustomThread = () => {
        if (!newThread.name_zh) return;
        const thread: IdentityThread = {
            thread_id: `CUSTOM-TH-${Date.now()}`,
            name_zh: newThread.name_zh,
            name_en: newThread.name_en || 'Custom Thread',
            duration_weeks: newThread.duration_weeks || 12,
            cadence_weekly: 1,
            milestones: ['Milestone 1', 'Milestone 2', 'Milestone 3'],
            scenes: [],
            rationale: newThread.rationale || ''
        };
        onUpdate({
            preferences: {
                ...model.preferences,
                custom_identity_threads: [...(model.preferences?.custom_identity_threads || []), thread]
            }
        });
        setIsAddingThread(false);
        setNewThread({ name_zh: '', name_en: '', duration_weeks: 12, rationale: '' });
    };

    const allArcs = [...STORY_ARCS, ...(model.preferences?.custom_story_arcs || [])];
    const allThreads = [...IDENTITY_THREADS, ...(model.preferences?.custom_identity_threads || [])];

    const currentPreset = getPresetById(model.preferences?.visual_preset_id);
    const genderPresets = VISUAL_PRESETS.filter(
        p => p.gender === model.gender?.charAt(0).toUpperCase() || p.gender === 'U'
    );

    return (
        <div className="space-y-12 p-10 bg-black/5 dark:bg-black/40 border border-black/5 dark:border-white/10 rounded-[3rem] backdrop-blur-xl">
            {/* Visual Presets Selection */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-4 bg-[var(--color-gold)] rounded-full shadow-[0_0_12px_rgba(var(--color-gold-rgb),0.4)]"></div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-[var(--color-text-main)]">
                        視覺風格預設 // VISUAL PRESET
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* CUSTOM / NONE Option */}
                    <button
                        onClick={() => onUpdate({
                            preferences: {
                                ...model.preferences,
                                visual_preset_id: null
                            }
                        })}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                            !model.preferences?.visual_preset_id
                                ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/10'
                                : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                        }`}
                    >
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">自訂 // CUSTOM</div>
                        <div className="text-[9px] text-gray-500">不套用預設，手動設定所有選項</div>
                    </button>

                    {/* Preset Cards */}
                    {genderPresets.map(preset => {
                        const isActive = model.preferences?.visual_preset_id === preset.preset_id;
                        return (
                            <button
                                key={preset.preset_id}
                                onClick={() => applyVisualPreset(model, preset.preset_id, onUpdate)}
                                className={`p-4 rounded-2xl border text-left transition-all ${
                                    isActive
                                        ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/10 shadow-[0_0_20px_rgba(var(--color-gold-rgb),0.15)]'
                                        : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-main)]">{preset.label_zh}</div>
                                    {isActive && (
                                        <div className="text-[8px] font-black text-[var(--color-gold)] uppercase tracking-widest animate-pulse">ACTIVE</div>
                                    )}
                                </div>
                                <div className="text-[9px] text-gray-500 line-clamp-2">
                                    {preset.description}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Preset Summary */}
                {currentPreset && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-4 rounded-2xl bg-[var(--color-gold)]/5 border border-[var(--color-gold)]/20 text-[9px] text-gray-400 space-y-1 overflow-hidden"
                    >
                        <div><span className="text-[var(--color-gold)] font-black">色調</span>：{currentPreset.visualConstants.colorTone}</div>
                        <div><span className="text-[var(--color-gold)] font-black">表情</span>：{currentPreset.visualConstants.expressionStyle}</div>
                        <div><span className="text-[var(--color-gold)] font-black">姿勢能量</span>：{currentPreset.visualConstants.poseEnergy}</div>
                        <div className="pt-1 text-[8px] italic opacity-50 italic">此預設已優化層次：Layer 1, 7.5, 8.5, 9</div>
                    </motion.div>
                )}
            </motion.div>

            <hr className="border-white/5" />

            {/* Persona Extension */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-4 bg-[var(--color-gold)] rounded-full shadow-[0_0_12px_rgba(var(--color-gold-rgb),0.4)]"></div>
                    <h4 className="text-[11px] font-black text-[var(--color-gold)] uppercase tracking-[0.3em]">角色擴展設定 (Persona Extensions)</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: '出生地 // HOMETOWN', key: 'hometown', placeholder: '例如：台南市 (Tainan City)' },
                        { label: '寵物稱呼 // PET NAME', key: 'pet_name', placeholder: '例如：饅頭 (Mantou)' },
                        { label: '閨蜜稱呼 // BESTIE NAME', key: 'best_friend_name', placeholder: '例如：Kiki' }
                    ].map((item) => (
                        <div key={item.key} className="space-y-2 group">
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest group-focus-within:text-[var(--color-gold)] transition-colors inline-block">{item.label}</label>
                            <input 
                                value={(extensions as any)[item.key] || ''} 
                                onChange={e => setExtensions({...extensions, [item.key]: e.target.value})}
                                placeholder={item.placeholder}
                                className="w-full bg-black/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-2xl px-5 py-3 text-xs text-gray-800 dark:text-white focus:border-[var(--color-gold)]/50 focus:bg-black/10 dark:focus:bg-white/[0.05] transition-all outline-none shadow-inner"
                            />
                        </div>
                    ))}
                </div>
                
                <div className="flex justify-end pt-2">
                    <button 
                        onClick={handleSaveExtensions}
                        className="px-8 py-3 bg-black/5 dark:bg-white/5 text-gray-700 dark:text-white border border-black/10 dark:border-white/10 text-[10px] font-black rounded-full hover:bg-[var(--color-gold)] hover:text-black hover:border-[var(--color-gold)] hover:scale-105 active:scale-95 transition-all uppercase tracking-widest shadow-xl italic"
                    >
                        儲存敘事設定 // SAVE CONTINUITY
                    </button>
                </div>
            </motion.div>

            <hr className="border-white/5" />

            {/* Aesthetic Parameter Control */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-4 bg-purple-500 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.4)]"></div>
                    <h4 className="text-[11px] font-black text-purple-400 uppercase tracking-[0.3em]">美學參數對齊 (Aesthetic Matrix Control)</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">美學階層區間 // TIER RANGE</label>
                            <span className="text-[10px] font-mono font-bold text-purple-400 truncate">
                                TIER {model.preferences?.aesthetic_tier_min || 1} - {model.preferences?.aesthetic_tier_max || 5}
                            </span>
                        </div>
                        <div className="space-y-6 pt-2">
                            <div className="flex flex-col gap-2">
                                <span className="text-[9px] text-gray-600 dark:text-gray-400 uppercase font-black">Min Tier (最小階層)</span>
                                <input 
                                    type="range" min="1" max="5" 
                                    value={model.preferences?.aesthetic_tier_min || 1}
                                    onChange={(e) => {
                                        const newMin = parseInt(e.target.value);
                                        const currentMax = model.preferences?.aesthetic_tier_max || 5;
                                        onUpdate({ 
                                            preferences: { 
                                                ...model.preferences, 
                                                aesthetic_tier_min: newMin,
                                                aesthetic_tier_max: Math.max(newMin, currentMax)
                                            } 
                                        });
                                    }}
                                    className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-[9px] text-gray-600 dark:text-gray-400 uppercase font-black">Max Tier (最大階層)</span>
                                <input 
                                    type="range" min="1" max="5" 
                                    value={model.preferences?.aesthetic_tier_max || 5}
                                    onChange={(e) => {
                                        const newMax = parseInt(e.target.value);
                                        const currentMin = model.preferences?.aesthetic_tier_min || 1;
                                        onUpdate({ 
                                            preferences: { 
                                                ...model.preferences, 
                                                aesthetic_tier_max: newMax,
                                                aesthetic_tier_min: Math.min(newMax, currentMin)
                                            } 
                                        });
                                    }}
                                    className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <p className="text-[10px] text-gray-400 font-medium italic leading-relaxed uppercase">
                            系統將根據「氣場階層」自動切換提示詞引擎：<br/>
                            <span className="text-purple-400/80">Tier 1-2</span>: 日常抓拍、寫實氛圍<br/>
                            <span className="text-purple-400/80">Tier 3-4</span>: 時尚大片、專業佈光<br/>
                            <span className="text-purple-400/80">Tier 5</span>: 藝術核心、極致氛圍、靈魂敘事特寫
                        </p>
                    </div>
                </div>
            </motion.div>

            <hr className="border-white/5" />

            {/* Story Arcs */}
            <div className="space-y-6 text-left">
                <div className="flex justify-between items-center bg-white/[0.02] p-6 rounded-[2rem] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center gap-8 relative z-10">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-4 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]"></div>
                                <h4 className="text-sm font-black text-white uppercase tracking-[0.3em]">
                                    故事弧管理 <span className="opacity-30 font-light ml-1 font-sans">STORY ARCS</span>
                                </h4>
                            </div>
                            <p className="text-[9px] text-blue-400/60 font-bold uppercase tracking-[0.4em] ml-4 italic">Narrative Matrix Architecture</p>
                        </div>
                        <div className="flex items-center gap-4 pl-8 border-l border-white/5">
                            <button 
                                type="button"
                                onClick={() => toggleMaster('enable_story_arcs')}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-500 focus:outline-none cursor-pointer group/toggle ${model.preferences?.enable_story_arcs !== false ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.5)]' : 'bg-white/10'}`}
                            >
                                <motion.span 
                                    layout
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xl ${model.preferences?.enable_story_arcs !== false ? 'translate-x-6' : 'translate-x-1'}`} 
                                />
                            </button>
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${model.preferences?.enable_story_arcs !== false ? 'text-blue-400' : 'text-gray-600'}`}>
                                {model.preferences?.enable_story_arcs !== false ? '已啟動 // ENGAGED' : '已離線 // OFFLINE'}
                            </span>
                        </div>
                    </div>
                    {model.preferences?.enable_story_arcs !== false && (
                        <motion.button 
                            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsAddingArc(!isAddingArc)}
                            className="group relative px-6 py-2.5 overflow-hidden rounded-sm bg-white/5 border border-white/10 transition-all hover:border-blue-500/50"
                        >
                            <span className="relative z-10 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                                {isAddingArc ? 'Close // 關閉' : '+ New Arc // 新增弧線'}
                            </span>
                            {/* Matrix logic decoration */}
                            <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-blue-500/50 group-hover:border-blue-500"></div>
                            <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-blue-500/50 group-hover:border-blue-500"></div>
                        </motion.button>
                    )}
                </div>

                <div className={`transition-all duration-700 ${model.preferences?.enable_story_arcs === false ? 'opacity-20 grayscale pointer-events-none scale-[0.98] blur-[4px]' : 'opacity-100'}`}>
                    <AnimatePresence mode="wait">
                        {isAddingArc && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-8 bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] space-y-6 mb-8 shadow-2xl relative"
                            >
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest">故事名稱 (ZH)</label>
                                        <input 
                                            placeholder="例如：銀河邊際的誓言" 
                                            value={newArc.name_zh}
                                            onChange={e => setNewArc({...newArc, name_zh: e.target.value})}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-5 py-3 text-xs text-white focus:border-blue-500/50 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest">故事英文名稱 // ARC NAME (EN)</label>
                                        <input 
                                            placeholder="Galaxy Edge Oath" 
                                            value={newArc.name_en}
                                            onChange={e => setNewArc({...newArc, name_en: e.target.value})}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-5 py-3 text-xs text-white focus:border-blue-500/50 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest">故事背景動機 // RATIONALE</label>
                                    <textarea 
                                        placeholder="描述此故事弧的發展計畫與角色動機..."
                                        value={newArc.rationale}
                                        onChange={e => setNewArc({...newArc, rationale: e.target.value})}
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-5 py-3 text-xs text-white h-24 outline-none focus:border-blue-500/50 resize-none"
                                    />
                                </div>
                                <button 
                                    onClick={handleAddCustomArc}
                                    className="w-full py-4 bg-blue-600 text-white text-[11px] font-black rounded-2xl uppercase tracking-[0.3em] shadow-[0_15px_30px_rgba(37,99,235,0.3)] active:scale-[0.98] transition-transform"
                                >
                                    注入故事矩陣 (CONFIRM CREATION)
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode="popLayout">
                            {allArcs.map(arc => {
                                const isActive = model.preferences?.active_arc_id === arc.arc_id;
                                const isCustom = arc.arc_id.startsWith('CUSTOM');
                                return (
                                    <motion.div 
                                        key={arc.arc_id}
                                        layout
                                        whileHover={{ y: -5, borderColor: 'rgba(59, 130, 246, 0.4)' }}
                                        className={`group cursor-pointer p-8 rounded-[2.5rem] border transition-all relative overflow-hidden flex flex-col h-full ${
                                            isActive 
                                            ? 'bg-blue-500/[0.08] border-blue-500/40 shadow-[0_25px_60px_rgba(0,0,0,0.4)] ring-1 ring-blue-500/20' 
                                            : 'bg-white/[0.02] border-white/5 opacity-60 hover:opacity-100'
                                        }`}
                                        onClick={() => handleToggleArc(arc.arc_id)}
                                    >
                                        <div className="absolute top-0 right-0 p-6 z-20">
                                            {isActive ? (
                                                <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(96,165,250,1)]"></div>
                                            ) : (
                                                <div className="w-2 h-2 border-2 border-white/20 rounded-full"></div>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-4 mb-auto">
                                            <div className="space-y-1">
                                                <h5 className={`text-lg font-black tracking-tight leading-tight uppercase italic transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{arc.name_zh}</h5>
                                                <p className="text-[10px] text-blue-500/40 font-mono font-black uppercase tracking-[0.2em]">{arc.arc_id.split('-')[0]} // IP CORE</p>
                                            </div>
                                            
                                            <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3 font-medium italic group-hover:text-gray-300 transition-colors">「{arc.rationale}」</p>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex gap-1">
                                                {arc.phases.map((_, i) => (
                                                    <div key={i} className={`w-3 h-1 rounded-full ${isActive ? 'bg-blue-500' : 'bg-white/10'}`} />
                                                ))}
                                            </div>
                                            {isCustom && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteArc(arc.arc_id); }}
                                                    className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <hr className="border-white/5 mx-6" />

            {/* Identity Threads */}
            <div className="space-y-6 text-left">
                <div className="flex justify-between items-center bg-white/[0.02] p-6 rounded-[2rem] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl group">
                    <div className="flex items-center gap-8 relative z-10">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-4 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.6)]"></div>
                                <h4 className="text-sm font-black text-white uppercase tracking-[0.3em]">
                                    身份線管理 <span className="opacity-30 font-light ml-1 font-sans">IDENTITY THREADS</span>
                                </h4>
                            </div>
                            <p className="text-[9px] text-emerald-400/60 font-bold uppercase tracking-[0.4em] ml-4 italic">Continuous Evolution Matrix</p>
                        </div>
                        <div className="flex items-center gap-4 pl-8 border-l border-white/5">
                            <button 
                                type="button"
                                onClick={() => toggleMaster('enable_identity_threads')}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-500 focus:outline-none cursor-pointer group/toggle ${model.preferences?.enable_identity_threads !== false ? 'bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-white/10'}`}
                            >
                                <motion.span 
                                    layout
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xl ${model.preferences?.enable_identity_threads !== false ? 'translate-x-6' : 'translate-x-1'}`} 
                                />
                            </button>
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${model.preferences?.enable_identity_threads !== false ? 'text-emerald-400' : 'text-gray-600'}`}>
                                {model.preferences?.enable_identity_threads !== false ? '已啟動 // ENGAGED' : '已離線 // OFFLINE'}
                            </span>
                        </div>
                    </div>
                    {model.preferences?.enable_identity_threads !== false && (
                        <motion.button 
                            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(16,185,129,0.3)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsAddingThread(!isAddingThread)}
                            className="group relative px-6 py-2.5 overflow-hidden rounded-sm bg-white/5 border border-white/10 transition-all hover:border-emerald-500/50"
                        >
                            <span className="relative z-10 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                                {isAddingThread ? 'Close // 關閉' : '+ New Thread // 開發線'}
                            </span>
                            {/* Matrix logic decoration */}
                            <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-emerald-500/50 group-hover:border-emerald-500"></div>
                            <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-emerald-500/50 group-hover:border-emerald-500"></div>
                        </motion.button>
                    )}
                </div>

                <div className={`space-y-6 transition-all duration-700 ${model.preferences?.enable_identity_threads === false ? 'opacity-20 grayscale pointer-events-none scale-[0.98] blur-[4px]' : 'opacity-100'}`}>
                    <AnimatePresence mode="wait">
                        {isAddingThread && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-8 bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] space-y-6 mb-8 shadow-2xl relative"
                            >
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest">身份線名稱 (ZH)</label>
                                        <input 
                                            placeholder="例如：冷酷殺手、溫柔咖啡師" 
                                            value={newThread.name_zh}
                                            onChange={e => setNewThread({...newThread, name_zh: e.target.value})}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-5 py-3 text-xs text-white focus:border-emerald-500/50 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest">身份線英文名稱 // THREAD NAME (EN)</label>
                                        <input 
                                            placeholder="Coldest Killer / Gentle Barista" 
                                            value={newThread.name_en}
                                            onChange={e => setNewThread({...newThread, name_en: e.target.value})}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-5 py-3 text-xs text-white focus:border-emerald-500/50 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest">長期演進動機 // RATIONALE</label>
                                    <textarea 
                                        placeholder="描述此身份線如何影響角色的長期行為與核心設定..."
                                        value={newThread.rationale}
                                        onChange={e => setNewThread({...newThread, rationale: e.target.value})}
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-5 py-3 text-xs text-white h-24 outline-none focus:border-emerald-500/50 resize-none"
                                    />
                                </div>
                                <button 
                                    onClick={handleAddCustomThread}
                                    className="w-full py-4 bg-emerald-600 text-white text-[11px] font-black rounded-2xl uppercase tracking-[0.3em] shadow-[0_15px_30px_rgba(16,185,129,0.3)] active:scale-[0.98] transition-transform"
                                >
                                    啟動人格演進 (START EVOLUTION)
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode="popLayout">
                            {allThreads.map(thread => {
                                const isActive = model.preferences?.active_threads?.some(t => t.thread_id === thread.thread_id);
                                const isCustom = thread.thread_id.startsWith('CUSTOM');
                                return (
                                    <motion.div 
                                        key={thread.thread_id}
                                        layout
                                        whileHover={{ y: -5, borderColor: 'rgba(16, 185, 129, 0.4)' }}
                                        className={`group cursor-pointer p-8 rounded-[2.5rem] border transition-all relative overflow-hidden flex flex-col h-full ${
                                            isActive 
                                            ? 'bg-emerald-500/[0.08] border-emerald-500/40 shadow-[0_25px_60px_rgba(0,0,0,0.4)] ring-1 ring-emerald-500/20' 
                                            : 'bg-white/[0.02] border-white/5 opacity-60 hover:opacity-100'
                                        }`}
                                        onClick={() => handleToggleThread(thread.thread_id)}
                                    >
                                        <div className="absolute top-0 right-0 p-6 z-20">
                                            {isActive ? (
                                                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(52,211,153,1)]"></div>
                                            ) : (
                                                <div className="w-2 h-2 border-2 border-white/20 rounded-full"></div>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-4 mb-auto">
                                            <div className="space-y-1">
                                                <h5 className={`text-lg font-black tracking-tight leading-tight uppercase italic transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{thread.name_zh}</h5>
                                                <p className="text-[10px] text-emerald-500/40 font-mono font-black uppercase tracking-[0.2em]">{thread.thread_id.split('-')[0]} // IP EVOLUTION</p>
                                            </div>
                                            
                                            <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3 font-medium italic group-hover:text-gray-300 transition-colors">「{thread.rationale}」</p>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-600'}`}>
                                                    {thread.duration_weeks} 週 // WEEKS
                                                </div>
                                            </div>
                                            {isCustom && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteThread(thread.thread_id); }}
                                                    className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};
