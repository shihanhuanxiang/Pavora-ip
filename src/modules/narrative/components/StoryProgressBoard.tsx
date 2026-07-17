import React from 'react';
import { motion } from 'motion/react';
import type { Model, StoryArc, IdentityThread, ContentCategory } from '../../../shared/types/types';
import { STORY_ARCS, IDENTITY_THREADS } from '../constants/storyElements';

interface StoryProgressBoardProps {
    model: Model;
    onSelectArc?: (arcId: string) => void;
    onInitializeThread?: () => void;
}

export const StoryProgressBoard: React.FC<StoryProgressBoardProps> = ({ model, onInitializeThread }) => {
    const isArcEnabled = model.preferences?.enable_story_arcs !== false;
    const isThreadsEnabled = model.preferences?.enable_identity_threads !== false;

    const activeArcId = isArcEnabled ? model.preferences?.active_arc_id : null;
    const activeThreads = isThreadsEnabled ? (model.preferences?.active_threads || []) : [];

    const allArcs = [...STORY_ARCS, ...(model.preferences?.custom_story_arcs || [])];
    const allThreads = [...IDENTITY_THREADS, ...(model.preferences?.custom_identity_threads || [])];

    const activeArc = allArcs.find(a => a.arc_id === activeArcId);
    const arcPhaseIdx = model.preferences?.active_arc_phase_index || 0;

    const galleryEntries = model.gallery || [];
    const contentCategories: ContentCategory[] = ['lifestyle', 'curve', 'drama'];
    const styleTargets = model.styleBible?.contentTargets || {};
    const categoryMeta: Record<ContentCategory, { label: string; target: number; color: string; glow: string }> = {
        lifestyle: { label: '生活感', target: styleTargets.lifestyle ?? 50, color: 'bg-[var(--color-steel)]', glow: '' },
        curve: { label: '曲線感', target: styleTargets.curve ?? 30, color: 'bg-[var(--color-brass)]', glow: '' },
        drama: { label: '戲劇張力', target: styleTargets.drama ?? 20, color: 'bg-[var(--color-wine)]', glow: '' }
    };
    const targetLabel = contentCategories.map(category => categoryMeta[category].target).join(' / ');
    const categorizedTotal = galleryEntries.filter(item => Boolean(item.contentCategory)).length;
    const uncategorizedTotal = Math.max(galleryEntries.length - categorizedTotal, 0);
    const categoryRows = contentCategories.map(category => {
        const count = galleryEntries.filter(item => item.contentCategory === category).length;
        const percent = categorizedTotal > 0 ? Math.round((count / categorizedTotal) * 100) : 0;
        return {
            category,
            count,
            percent,
            ...categoryMeta[category]
        };
    });

    return (
        <div className="space-y-3">
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 space-y-3 relative overflow-hidden"
            >
                <div className="absolute -top-8 -left-8 w-24 h-24 bg-[var(--color-steel)]/[0.03] rounded-full blur-[50px]"></div>
                <div className="relative z-10 flex items-center justify-between gap-2">
                    <h4 className="text-[9px] font-black text-[var(--color-brass)] uppercase tracking-[0.3em]">內容比例 // {targetLabel}</h4>
                    <span className="text-[8px] text-gray-600 font-bold">{categorizedTotal} 張已分類</span>
                </div>

                <div className="relative z-10 space-y-2">
                    {categoryRows.map(row => (
                        <div key={row.category} className="space-y-1">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${row.color} ${row.glow}`}></span>
                                    <span className="text-[10px] text-[var(--color-text-title)] font-black tracking-[0.2em] uppercase">{row.label}</span>
                                </div>
                                <span className="text-[10px] text-gray-400 font-black tabular-nums">{row.percent}% / 目標 {row.target}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-[var(--color-bg-input)] rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(row.percent, 100)}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className={`h-full rounded-full ${row.color}`}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Story Arc Section */}
            {!isArcEnabled ? (
                <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[2rem] p-6 text-center opacity-40 group hover:opacity-60 transition-all">
                    <p className="text-[10px] text-gray-500 tracking-[0.4em] font-black">故事弧引擎</p>
                </div>
            ) : activeArc && (
                <motion.div 
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 space-y-3 overflow-hidden"
                >
                    {/* Background glow accent */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--color-brass)]/5 rounded-full blur-[60px] group-hover:bg-[var(--color-brass)]/10 transition-all duration-700"></div>

                    <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-brass)] animate-pulse"></div>
                            <h4 className="text-[10px] font-black text-[var(--color-brass)] tracking-[0.4em]">核心故事弧</h4>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-full">
                            <span className="text-[9px] text-gray-500 font-black uppercase tracking-tighter">環節</span>
                            <span className="text-[9px] text-[var(--color-text-main)] font-black">{arcPhaseIdx + 1} / {activeArc.phases.length}</span>
                        </div>
                    </div>
                    
                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <h5 className="text-2xl font-black text-[var(--color-text-title)] tracking-tight uppercase leading-none">{activeArc.name_zh}</h5>
                                <p className="text-[10px] text-[var(--color-brass)] font-bold tracking-[0.2em] uppercase opacity-70">{activeArc.arc_id.replace(/_/g, ' ')}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-[var(--color-text-title)] font-black tracking-widest bg-[var(--color-bg-input)] px-4 py-1.5 rounded-full border border-[var(--color-border)]">{activeArc.phases[arcPhaseIdx]}</span>
                            </div>
                        </div>
                        
                        {/* Advanced Progress Matrix */}
                        <div className="flex gap-2.5 h-1.5 w-full">
                            {activeArc.phases.map((_, i) => (
                                <div key={i} className="flex-1 relative group/phase">
                                    <div 
                                        className={`absolute inset-0 rounded-full transition-all duration-700 ${
                                            i <= arcPhaseIdx
                                            ? 'bg-[var(--color-brass)]'
                                            : 'bg-[var(--color-bg-input)]'
                                        }`}
                                    />
                                    {i === arcPhaseIdx && (
                                        <div className="absolute inset-0 bg-white animate-ping opacity-20 rounded-full"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="relative pt-2">
                        <div className="absolute left-0 top-2 bottom-0 w-1 bg-gradient-to-b from-[var(--color-brass)]/40 to-transparent rounded-full"></div>
                        <p className="text-[11px] text-gray-400 leading-relaxed italic ml-5 font-medium tracking-wide">
                            「{activeArc.rationale}」
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Identity Threads Section */}
            {!isThreadsEnabled ? (
                <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[2rem] p-6 text-center opacity-40">
                    <p className="text-[10px] text-gray-500 tracking-[0.4em] font-black">身分線程引擎</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeThreads.map((threadState, idx) => {
                        const thread = allThreads.find(t => t.thread_id === threadState.thread_id);
                        if (!thread) return null;
                        
                        const progress = ((threadState.current_milestone_index + 1) / thread.milestones.length) * 100;
                        
                        return (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-3 space-y-3 relative group overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-sage)]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                <div className="flex justify-between items-start relative z-10">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-sage)] animate-pulse"></div>
                                            <span className="text-[9px] font-black text-[var(--color-sage)] uppercase tracking-[0.3em]">身分發展線</span>
                                        </div>
                                        <h6 className="text-lg font-black text-[var(--color-text-title)] tracking-tight uppercase leading-none">{thread.name_zh}</h6>
                                    </div>
                                    <div className="px-3 py-1 bg-[var(--color-sage)]/10 border border-[var(--color-sage)]/20 rounded-full">
                                        <span className="text-[9px] text-[var(--color-sage)] font-black tracking-widest">LV.{threadState.current_milestone_index + 1}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 relative z-10">
                                    <p className="text-[10px] text-gray-400 font-medium tracking-wide line-clamp-1 border-l-2 border-[var(--color-sage)]/20 pl-3 italic">
                                        {thread.milestones[threadState.current_milestone_index]}
                                    </p>
                                    
                                    <div className="relative h-1.5 w-full bg-[var(--color-bg-input)] rounded-full overflow-hidden shadow-inner">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--color-sage)] to-[var(--color-sage)]/60 rounded-full"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}

                    {/* Empty State / Call to Action */}
                    {activeThreads.length < 2 && (
                        <motion.div 
                            whileHover={{ scale: 1.02, backgroundColor: 'var(--color-bg-input)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onInitializeThread}
                            className="bg-[var(--color-bg-card)] border border-dashed border-[var(--color-border)] rounded-xl p-3 flex items-center gap-2.5 opacity-50 hover:opacity-90 transition-all cursor-pointer group"
                        >
                            <div className="w-6 h-6 rounded-md bg-[var(--color-bg-input)] border border-[var(--color-border)] flex items-center justify-center font-black group-hover:bg-[var(--color-wine)] group-hover:text-white transition-all shrink-0 text-sm text-gray-400">+</div>
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] group-hover:text-white transition-colors">啟動新的身份線</span>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
};
