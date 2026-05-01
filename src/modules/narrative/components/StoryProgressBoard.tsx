import React from 'react';
import { motion } from 'motion/react';
import type { Model, StoryArc, IdentityThread } from '../../../shared/types/types';
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

    return (
        <div className="space-y-8">
            {/* Story Arc Section */}
            {!isArcEnabled ? (
                <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[2rem] p-6 text-center opacity-40 group hover:opacity-60 transition-all">
                    <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em] font-black italic">故事弧引擎 // STORY ARC ENGINE OFFLINE</p>
                </div>
            ) : activeArc && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[2.5rem] p-8 space-y-6 shadow-2xl overflow-hidden group"
                >
                    {/* Background glow accent */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--color-gold)]/5 rounded-full blur-[60px] group-hover:bg-[var(--color-gold)]/10 transition-all duration-700"></div>

                    <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)] animate-pulse shadow-[0_0_10px_rgba(212,175,55,1)]"></div>
                            <h4 className="text-[10px] font-black text-[var(--color-gold)] uppercase tracking-[0.4em] italic">核心故事弧 // ACTIVE ARC</h4>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-full">
                            <span className="text-[9px] text-gray-500 font-black uppercase tracking-tighter">環節 // PHASE</span>
                            <span className="text-[9px] text-[var(--color-text-main)] font-black">{arcPhaseIdx + 1} / {activeArc.phases.length}</span>
                        </div>
                    </div>
                    
                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <h5 className="text-2xl font-black text-[var(--color-text-title)] tracking-tight uppercase leading-none">{activeArc.name_zh}</h5>
                                <p className="text-[10px] text-[var(--color-gold)] font-bold tracking-[0.2em] uppercase opacity-70">{activeArc.arc_id.replace(/_/g, ' ')}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-[var(--color-text-title)] font-black italic tracking-widest bg-[var(--color-bg-input)] px-4 py-1.5 rounded-full border border-[var(--color-border)]">{activeArc.phases[arcPhaseIdx]}</span>
                            </div>
                        </div>
                        
                        {/* Advanced Progress Matrix */}
                        <div className="flex gap-2.5 h-1.5 w-full">
                            {activeArc.phases.map((_, i) => (
                                <div key={i} className="flex-1 relative group/phase">
                                    <div 
                                        className={`absolute inset-0 rounded-full transition-all duration-700 ${
                                            i <= arcPhaseIdx 
                                            ? 'bg-[var(--color-gold)] shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
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
                        <div className="absolute left-0 top-2 bottom-0 w-1 bg-gradient-to-b from-[var(--color-gold)]/40 to-transparent rounded-full"></div>
                        <p className="text-[11px] text-gray-400 leading-relaxed italic ml-5 font-medium tracking-wide">
                            「{activeArc.rationale}」
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Identity Threads Section */}
            {!isThreadsEnabled ? (
                <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[2rem] p-6 text-center opacity-40">
                    <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em] font-black italic">身分線程引擎 // IDENTITY THREADS DISABLED</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[2.5rem] p-6 space-y-6 relative group overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]"></div>
                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em]">身分發展線 // IDENTITY THREAD</span>
                                        </div>
                                        <h6 className="text-lg font-black text-[var(--color-text-title)] tracking-tight uppercase leading-none">{thread.name_zh}</h6>
                                    </div>
                                    <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                        <span className="text-[9px] text-emerald-500 font-black tracking-widest uppercase italic">LV.{threadState.current_milestone_index + 1}</span>
                                    </div>
                                </div>
                                    
                                <div className="space-y-3 relative z-10">
                                    <p className="text-[10px] text-gray-400 font-medium tracking-wide line-clamp-1 border-l-2 border-emerald-500/20 pl-3 italic">
                                        {thread.milestones[threadState.current_milestone_index]}
                                    </p>
                                    
                                    <div className="relative h-1.5 w-full bg-[var(--color-bg-input)] rounded-full overflow-hidden shadow-inner">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"
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
                            className="bg-[var(--color-bg-card)] border border-dashed border-[var(--color-border)] rounded-[2.5rem] p-8 flex flex-col items-center justify-center space-y-4 opacity-70 hover:opacity-100 transition-all cursor-pointer group"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-[var(--color-bg-input)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-title)] text-xl font-black group-hover:bg-[var(--color-gold)] group-hover:text-black transition-all shadow-xl">
                                <span className="transform group-hover:rotate-90 transition-transform">+</span>
                            </div>
                            <div className="text-center space-y-1">
                                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] group-hover:text-gray-900 dark:group-hover:text-white transition-colors">啟動新的身份線</span>
                                <p className="text-[8px] text-gray-400 dark:text-gray-600 font-bold uppercase tracking-widest">INITIALIZE IP MATRIX</p>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
};
