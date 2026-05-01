import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OutfitV2, Model } from '../../../shared/types/types';
import { useWardrobe } from '../../../shared/hooks/useWardrobe';
import Card from '../../../shared/components/common/Card';
import Button from '../../../shared/components/common/Button';
import { OUTFIT_SEEDS_V2 } from '../constants/outfitSeeds';

interface WardrobeManagerProps {
    model: Model;
    onUpdate: (updates: Partial<Model>) => void;
}

export const WardrobeManager: React.FC<WardrobeManagerProps> = ({ model, onUpdate }) => {
    const { userOutfits, addCustomOutfit, removeCustomOutfit } = useWardrobe();
    const [showForm, setShowForm] = useState(false);
    const [viewMode, setViewMode] = useState<'all' | 'user' | 'seeds'>('all');
    
    const allOutfits = [...OUTFIT_SEEDS_V2, ...userOutfits].filter(o => 
        o.gender === model.gender?.charAt(0).toUpperCase() || o.gender === 'U'
    );

    const filteredOutfits = viewMode === 'all' ? allOutfits : 
                           viewMode === 'user' ? userOutfits : 
                           OUTFIT_SEEDS_V2.filter(o => o.gender === model.gender?.charAt(0).toUpperCase() || o.gender === 'U');
    
    const [newOutfit, setNewOutfit] = useState<Partial<OutfitV2>>({
        gender: model.gender?.charAt(0).toUpperCase() as any || 'F',
        style_archetype: 'feminine_sweet',
        context_id: 'urban_street',
        aesthetic_tier: 1,
        pillars: {
            layer_inner: '',
            top: '',
            layer_outer: '',
            bottom: '',
            shoes: '',
            accessories: [],
            props: []
        },
        fabric_difficulty: 'safe',
        wear_state: 'well_loved',
        layering_count: 1,
        compatible_contexts: ['urban_street'],
        hand_occupation: {
            left_hand: 'natural',
            right_hand: 'natural',
            both_busy: false
        },
        prompt_skeleton: ''
    });

    const handleSave = () => {
        if (!newOutfit.outfit_id) {
            alert('請輸入穿搭 ID');
            return;
        }
        addCustomOutfit(newOutfit as OutfitV2);
        setShowForm(false);
    };

    const handleSelectOutfit = (outfitId: string) => {
        const currentActive = model.preferences?.active_outfit_id;
        onUpdate({
            preferences: {
                ...model.preferences,
                active_outfit_id: currentActive === outfitId ? null : outfitId
            }
        });
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6">
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[var(--color-border)]"
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-5 bg-[var(--color-gold)] rounded-full shadow-[0_0_15px_rgba(212,175,55,0.4)]"></div>
                            <h3 className="text-2xl font-black text-[var(--color-text-title)] tracking-[0.3em] uppercase">
                                角色劇組衣櫃 <span className="opacity-30 ml-2 font-light">WARDROBE</span>
                            </h3>
                        </div>
                        <p className="text-[10px] text-[var(--color-gold)] font-bold uppercase tracking-[0.5em] ml-5 italic opacity-70">
                            角色數位資產矩陣 // ENTITY VISUAL ASSETS
                        </p>
                    </div>

                    {/* View Filters */}
                    <div className="flex bg-[var(--color-bg-input)] p-1 rounded-xl w-fit ml-5">
                        {[
                            { id: 'all', label: '全部' },
                            { id: 'seeds', label: '內建資源' },
                            { id: 'user', label: '自定義' }
                        ].map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => setViewMode(mode.id as any)}
                                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                    viewMode === mode.id 
                                    ? 'bg-[var(--color-gold)] text-black shadow-lg shadow-[var(--color-gold)]/20' 
                                    : 'text-gray-500 hover:text-white'
                                }`}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={() => setShowForm(true)}
                    className="group relative px-8 py-3 overflow-hidden rounded-2xl bg-[var(--color-bg-card)] text-[var(--color-text-main)] border border-[var(--color-border)] font-black text-xs transition-all hover:bg-[var(--color-gold)] hover:text-black hover:border-[var(--color-gold)] active:scale-95 shadow-xl"
                >
                    <span className="relative z-10 uppercase tracking-widest">+ 新增穿搭資產</span>
                </button>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                    {filteredOutfits.map((outfit, index) => {
                        const isActive = model.preferences?.active_outfit_id === outfit.outfit_id;
                        const isSeed = OUTFIT_SEEDS_V2.some(s => s.outfit_id === outfit.outfit_id);
                        const isCritical = ['worn', 'distressed'].includes(outfit.wear_state);
                        
                        return (
                            <motion.div
                                key={outfit.outfit_id}
                                layout
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ delay: index * 0.05 }}
                className={`cursor-pointer transition-all duration-500 ${isCritical ? 'grayscale-[0.6] hover:grayscale-0' : ''}`}
                            >
                                <div 
                                    className={`group relative bg-[var(--color-bg-card)] border rounded-[2.5rem] p-8 transition-all shadow-2xl overflow-hidden h-full flex flex-col active:scale-[0.98] cursor-pointer select-none ${
                                        isActive 
                                        ? 'border-[var(--color-gold)] bg-[var(--color-bg-card)] shadow-[0_20px_50px_rgba(212,175,55,0.15)] ring-1 ring-[var(--color-gold)]/30 scale-[1.02]' 
                                        : 'border-[var(--color-border)] hover:border-[var(--color-gold)]/30'
                                    }`}
                                    onClick={() => handleSelectOutfit(outfit.outfit_id)}
                                >
                                    {/* Selection Glow */}
                                    {isActive && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-gold)]/5 to-transparent pointer-events-none"></div>
                                    )}
                                    
                                    {!isSeed && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); removeCustomOutfit(outfit.outfit_id); }}
                                            className="absolute top-6 right-6 p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 z-20"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    )}

                                    <div className="space-y-6 relative z-10 flex-1 pointer-events-none">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-[var(--color-gold)] animate-pulse shadow-[0_0_8px_rgba(212,175,55,1)]' : 'bg-[var(--color-bg-input)]'}`}></div>
                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{outfit.outfit_id}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className={`px-3 py-1 bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[9px] font-black rounded-full uppercase tracking-tighter ${isActive ? 'text-[var(--color-gold)]' : 'text-gray-500'}`}>美學階層 // TIER {outfit.aesthetic_tier}</span>
                                                {isSeed && <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-bold rounded-md uppercase tracking-tighter">系統核心 // CORE</span>}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <h4 className={`font-display font-black text-lg tracking-tight leading-none uppercase italic transition-colors ${isActive ? 'text-[var(--color-gold)]' : 'text-[var(--color-text-title)]'}`}>
                                                {outfit.style_archetype === 'feminine_sweet' ? '甜美少女風格 // SWEET' : 
                                                 outfit.style_archetype === 'feminine_mature' ? '成熟御姐風格 // MATURE' : 
                                                 outfit.style_archetype === 'feminine_office' ? '職場精英風格 // OFFICE' :
                                                 outfit.style_archetype === 'masculine_clean' ? '清爽簡約風格 // CLEAN' :
                                                 outfit.style_archetype === 'masculine_rugged' ? '硬朗粗獷風格 // RUGGED' :
                                                 outfit.style_archetype === 'masculine_formal' ? '商務正裝風格 // FORMAL' :
                                                 outfit.style_archetype === 'dandy_refined' ? '雅痞紳士風格 // DANDY' :
                                                 outfit.style_archetype === 'street_edgy' ? '街頭酷感風格 // EDGY' :
                                                 outfit.style_archetype === 'sporty_active' ? '動感活力風格 // SPORTY' :
                                                 outfit.style_archetype === 'cultural_traditional' ? '文化深蘊風格 // CULTURAL' :
                                                 outfit.style_archetype === 'tomboy' ? '率性中性風格 // TOMBOY' :
                                                 outfit.style_archetype === 'minimalist' ? '極簡主義風格 // MINIMALIST' :
                                                 outfit.style_archetype === 'vintage_retro' ? '復古懷舊風格 // VINTAGE' :
                                                 outfit.style_archetype === 'street_techwear' ? '街頭機能風格 // TECHWEAR' :
                                                 outfit.style_archetype.replace('_', ' ')}
                                            </h4>
                                            <div className={`h-0.5 w-8 rounded-full transition-all duration-500 ${isActive ? 'bg-[var(--color-gold)] w-16' : 'bg-[var(--color-border)]'}`}></div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-[11px]">
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <p className="text-gray-400 dark:text-gray-600 font-bold uppercase text-[8px] tracking-widest">上裝 // TOP</p>
                                                    <p className="text-gray-800 dark:text-white font-medium line-clamp-1">{outfit.pillars.top || '---'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-gray-400 dark:text-gray-600 font-bold uppercase text-[8px] tracking-widest">鞋履 // SHOES</p>
                                                    <p className="text-gray-800 dark:text-white font-medium line-clamp-1">{outfit.pillars.shoes || '---'}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <p className="text-gray-400 dark:text-gray-600 font-bold uppercase text-[8px] tracking-widest">下裝 // BOTTOM</p>
                                                    <p className="text-gray-800 dark:text-white font-medium line-clamp-1">{outfit.pillars.bottom || '---'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <p className="text-gray-600 font-bold uppercase text-[8px] tracking-widest">物理磨損狀態 // CONDITION</p>
                                                        <span className={`text-[8px] font-black uppercase ${
                                                            ['worn', 'distressed'].includes(outfit.wear_state) ? 'text-red-500' : 'text-[var(--color-gold)]'
                                                        }`}>
                                                            {outfit.wear_state === 'mint' ? '完美 // MINT' : 
                                                             outfit.wear_state === 'fresh' ? '優良 // FRESH' : 
                                                             outfit.wear_state === 'slightly_worn' ? '輕微 // SLIGHT' : 
                                                             outfit.wear_state === 'worn' ? '顯著 // WORN' : '廢棄 // DISTRESSED'}
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-1 bg-[var(--color-bg-input)] rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ 
                                                                width: outfit.wear_state === 'mint' ? '100%' : 
                                                                       outfit.wear_state === 'fresh' ? '85%' : 
                                                                       outfit.wear_state === 'slightly_worn' ? '60%' : 
                                                                       outfit.wear_state === 'worn' ? '30%' : '15%' 
                                                            }}
                                                            className={`h-full rounded-full ${
                                                                ['worn', 'distressed'].includes(outfit.wear_state) ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-[var(--color-gold)] shadow-[0_0_8px_rgba(212,175,55,0.4)]'
                                                            }`}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-8 pt-4 border-t border-[var(--color-border)] flex items-center justify-between pointer-events-none">
                                        <div className="flex items-center gap-2">
                                            <div className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${isActive ? 'bg-[var(--color-gold)] text-black' : 'bg-[var(--color-bg-input)] text-gray-500'}`}>
                                                {isActive ? '當前著裝方案 // ACTIVE SCHEME' : '庫存保管中 // IN STORAGE'}
                                            </div>
                                        </div>
                                        <span className="text-[8px] text-gray-400 dark:text-gray-600 font-bold uppercase tracking-[0.3em]">
                                            {outfit.gender === 'F' ? '女性模組 // FEMALE' : outfit.gender === 'M' ? '男性模組 // MALE' : '全性別適用 // UNISEX'}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-[var(--color-bg-deep)]/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-8">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 40 }} 
                        animate={{ scale: 1, opacity: 1, y: 0 }} 
                        className="w-full max-w-4xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[3rem] p-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden"
                    >
                        {/* Background Accents */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-gold)]/5 blur-[100px] -mr-32 -mt-32"></div>
                        
                        <div className="flex justify-between items-start mb-10 relative z-10">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-[var(--color-text-title)] tracking-widest uppercase italic">新增矩陣穿搭 <span className="text-[var(--color-gold)]">// Asset Creation</span></h3>
                                <p className="text-[10px] text-gray-500 font-bold tracking-[0.4em] uppercase">配置您的 AI 數位模組視覺組件 // CONFIG COMPONENTS</p>
                            </div>
                            <button onClick={() => setShowForm(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 relative z-10 custom-scrollbar max-h-[70vh] overflow-y-auto pr-4">
                            <div className="md:col-span-8 space-y-10">
                                {/* Basic Config Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1 h-3 bg-white/20 rounded-full"></div>
                                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">基礎識別 (IDENTITY)</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="group space-y-2">
                                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest group-focus-within:text-[var(--color-gold)] transition-colors">穿搭編碼 (Outfit UID)</label>
                                            <input 
                                                type="text" 
                                                className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-2xl px-5 py-3 text-xs text-[var(--color-text-main)] focus:border-[var(--color-gold)]/50 transition-all outline-none"
                                                placeholder="UID_STREET_001"
                                                value={newOutfit.outfit_id || ''}
                                                onChange={e => setNewOutfit({ ...newOutfit, outfit_id: e.target.value })}
                                            />
                                        </div>
                                        <div className="group space-y-2">
                                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">風格原型 (Archetype)</label>
                                            <select 
                                                className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-2xl px-5 py-3 text-xs text-[var(--color-text-main)] focus:border-[var(--color-gold)]/50 outline-none appearance-none cursor-pointer"
                                                value={newOutfit.style_archetype}
                                                onChange={e => setNewOutfit({ ...newOutfit, style_archetype: e.target.value })}
                                            >
                                                <option value="feminine_sweet">甜美少女風格 // FEMININE SWEET</option>
                                                <option value="feminine_mature">成熟御姐風格 // FEMININE MATURE</option>
                                                <option value="masculine_clean">清爽簡約風格 // MASCULINE CLEAN</option>
                                                <option value="masculine_rugged">硬朗粗獷風格 // MASCULINE RUGGED</option>
                                                <option value="masculine_formal">商務正裝風格 // MASCULINE FORMAL</option>
                                                <option value="tomboy">率性中性風格 // TOMBOY</option>
                                                <option value="minimalist">極簡主義風格 // MINIMALIST</option>
                                                <option value="vintage_retro">復古懷舊風格 // VINTAGE</option>
                                                <option value="street_techwear">街頭機能風格 // TECHWEAR</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Pillars Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1 h-3 bg-white/20 rounded-full"></div>
                                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">穿搭四大支柱 (COMPONENTS)</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        {[
                                            { label: '上身單品 (TOP)', key: 'top', placeholder: '例如：寬鬆奶油色針織衫...' },
                                            { label: '下身單品 (BOTTOM)', key: 'bottom', placeholder: '例如：高腰亞麻寬褲...' },
                                            { label: '鞋履配備 (SHOES)', key: 'shoes', placeholder: '例如：極簡皮革涼鞋...' },
                                            { label: '外層疊穿 (OUTER)', key: 'layer_outer', placeholder: '例如：長版絲質長袍...' }
                                        ].map((pillar) => (
                                            <div key={pillar.label} className="group space-y-2">
                                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{pillar.label}</label>
                                                <input 
                                                    type="text" 
                                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-3 text-xs text-white focus:border-[var(--color-gold)]/50 transition-all outline-none"
                                                    placeholder={pillar.placeholder}
                                                    value={(newOutfit.pillars as any)[pillar.key] || ''}
                                                    onChange={e => setNewOutfit({ ...newOutfit, pillars: { ...newOutfit.pillars!, [pillar.key]: e.target.value } })}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Physics & Wear Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-3 bg-white/20 rounded-full"></div>
                                            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">物理細節：磨損與質地 (PHYSICS)</h4>
                                        </div>
                                        <span className="text-[8px] text-[var(--color-gold)] font-mono animate-pulse tracking-widest">寫實渲染引擎已啟動 // REALISM ENGINE ON</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { id: 'pristine', label: '零磨損・極致平整', desc: '極致正式 // HIGH FORMAL' },
                                            { id: 'crisp', label: '骨幹感・挺括材質', desc: '結構化版型 // STRUCTURED' },
                                            { id: 'well_loved', label: '生活感・自然褶皺', desc: '寫實主義 // REALISM' },
                                            { id: 'store_fresh', label: '開箱感・工廠摺痕', desc: '全新狀態 // FACTORY FRESH' }
                                        ].map(state => (
                                            <motion.button
                                                key={state.id}
                                                whileHover={{ y: -2 }}
                                                whileTap={{ scale: 0.98 }}
                                                type="button"
                                                onClick={() => setNewOutfit({ ...newOutfit, wear_state: state.id })}
                                                className={`p-5 rounded-[2rem] text-left transition-all border flex flex-col gap-2 ${
                                                    newOutfit.wear_state === state.id 
                                                    ? 'bg-[var(--color-gold)]/[0.08] border-[var(--color-gold)]/40 shadow-[0_10px_25px_rgba(212,175,55,0.1)]' 
                                                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                                                }`}
                                            >
                                                <span className={`text-[10px] font-black tracking-wider ${newOutfit.wear_state === state.id ? 'text-[var(--color-gold)]' : 'text-white'}`}>{state.label}</span>
                                                <span className="text-[8px] text-gray-500 font-bold tracking-widest uppercase">{state.desc}</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-4 space-y-10 border-l border-white/5 pl-10">
                                {/* Aesthetic Tier Selector */}
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">美學階層 // AESTHETIC TIER</h4>
                                    <div className="space-y-4">
                                        {[
                                            { id: 1, label: '階層 1：日常 // DAILY', desc: '日常寫實' },
                                            { id: 2, label: '階層 2：流行 // POP', desc: '精緻流行' },
                                            { id: 3, label: '階層 3：攝影 // STUDIO', desc: '商業棚拍' },
                                            { id: 4, label: '階層 4：奢華 // LUXE', desc: '奢華美學' },
                                            { id: 5, label: '階層 5：雜誌 // VOGUE', desc: '雜誌封面' }
                                        ].map(tier => (
                                            <button
                                                key={tier.id}
                                                type="button"
                                                onClick={() => setNewOutfit({ ...newOutfit, aesthetic_tier: tier.id })}
                                                className={`w-full p-4 rounded-2xl text-left transition-all border flex flex-col gap-1 relative overflow-hidden group ${
                                                    newOutfit.aesthetic_tier === tier.id 
                                                    ? 'bg-white/10 border-white/30' 
                                                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                                                }`}
                                            >
                                                <span className={`text-[10px] font-black tracking-widest ${newOutfit.aesthetic_tier === tier.id ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>{tier.label}</span>
                                                <span className="text-[8px] text-gray-600 font-bold uppercase">{tier.desc}</span>
                                                {newOutfit.aesthetic_tier === tier.id && (
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[var(--color-gold)] rounded-full shadow-[0_0_10px_rgba(212,175,55,1)]"></div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Summary / Tips */}
                                <div className="p-6 bg-[var(--color-gold)]/[0.03] border border-[var(--color-gold)]/10 rounded-[2rem] space-y-4">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <span className="text-[10px] text-[var(--color-gold)] font-black uppercase tracking-widest">矩陣建議 // TIPS</span>
                                    </div>
                                    <p className="text-[9px] text-gray-400 leading-relaxed font-medium">
                                        {newOutfit.aesthetic_tier && newOutfit.aesthetic_tier >= 4 
                                            ? "高階層穿搭將自動啟動鏡頭光斑與次表面散射模擬，適合正式場合。" 
                                            : "基礎層次將強化自然環境光交互與微小瑕疵，提升角色真實感。"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-white/5 flex gap-6 relative z-10">
                            <button 
                                onClick={() => setShowForm(false)} 
                                className="flex-1 py-4 bg-white/[0.03] hover:bg-white/[0.08] text-white/60 hover:text-white transition-all rounded-2xl font-black text-[10px] tracking-widest uppercase border border-white/5 italic"
                            >
                                取消變更 // CANCEL
                            </button>
                            <button 
                                onClick={handleSave} 
                                className="flex-[2] py-4 bg-[var(--color-gold)] hover:bg-[var(--color-gold)]/90 text-black transition-all rounded-2xl font-black text-xs tracking-[0.3em] uppercase shadow-[0_20px_50px_rgba(212,175,55,0.3)] active:scale-[0.98] italic"
                            >
                                儲存衣櫃資產 // SAVE ASSET
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};
