import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OutfitV2, Model } from '../../../shared/types/types';
import { useWardrobe } from '../../../shared/hooks/useWardrobe';
import Card from '../../../shared/components/common/Card';
import Button from '../../../shared/components/common/Button';
import { OUTFIT_SEEDS_V2 } from '../constants/outfitSeeds';

const ATOM_DICT = {
    // 顏色
    colors: {
        "white": "白色", "black": "黑色", "cream": "奶油白", "ivory": "象牙白",
        "grey": "灰色", "gray": "灰色", "pink": "粉色", "dusty pink": "霧粉色",
        "red": "紅色", "rust red": "紅褐色", "scarlet": "猩紅色", "blue": "藍色",
        "navy": "海軍藍", "green": "綠色", "teal green": "藍綠色", "olive": "橄欖綠",
        "brown": "棕色", "beige": "米色", "charcoal": "炭灰色", "oatmeal": "燕麥色",
        "nude": "裸色", "gold": "金色", "silver": "銀色", "deep green": "深綠色",
        "dark olive": "深橄欖綠", "dark brown": "深棕色", "teal": "藍綠色", "light blue": "淺藍色"
    },
    // 材質
    materials: {
        "silk": "絲質", "cotton": "棉質", "linen": "亞麻", "knit": "針織",
        "ribbed": "羅紋", "lace": "蕾絲", "sheer": "透膚", "mesh": "網紗",
        "fleece": "刷毛", "wool": "羊毛", "denim": "丹寧", "leather": "皮革",
        "suede": "麂皮", "satin": "緞面", "cashmere": "羊絨", "nylon": "尼龍",
        "waffle": "鬆餅紋", "corduroy": "燈芯絨", "flannel": "法蘭絨", "technical": "機能性",
        "waterproof": "防水", "velvet": "天鵝絨"
    },
    // 版型 / 長度
    fits: {
        "fitted": "合身", "oversized": "寬鬆", "loose": "寬鬆", "slim": "修身",
        "cropped": "短版", "crop": "短版", "long": "長版", "short": "極短",
        "mini": "迷你", "midi": "中長", "knee length": "及膝", "high-waist": "高腰",
        "wide-leg": "寬褲", "tapered": "錐形", "straight": "直筒", "baggy": "寬鬆",
        "relaxed": "寬鬆", "tight": "緊身", "unstructured": "無結構", "tailored": "剪裁",
        "open": "敞開", "zip-up": "拉鍊"
    },
    // 單品核心
    items: {
        "slip dress": "吊帶洋裝", "kimono-style robe": "和服式罩袍", "robe": "罩袍",
        "dress": "洋裝", "tank top": "背心", "tank": "背心", "tee": "T恤", "t-shirt": "T恤", 
        "sports bra": "運動內衣", "bra top": "運動背心", "crop top": "短版上衣", 
        "jacket": "外套", "windbreaker": "風衣", "hoodie": "連帽上衣",
        "cardigan": "開襟衫", "blouse": "上衣", "shirt": "襯衫", "button-up": "排扣襯衫",
        "button-down": "扣領襯衫", "jersey": "球衣", "sweatshirt": "衛衣", "pullover": "套頭衫",
        "blazer": "西裝外套", "coat": "大衣", "trench coat": "風衣大衣", "bomber": "飛行外套",
        "harrington": "哈靈頓外套", "varsity jacket": "棒球夾克", "track jacket": "運動夾克",
        "henley": "亨利衫",
        "dolphin shorts": "真理褲", "biker shorts": "單車褲", "sweat shorts": "運動短褲", "shorts": "短褲",
        "leggings": "內搭褲", "tights": "褲襪", "sweatpants": "運動長褲", "joggers": "慢跑褲",
        "pants": "長褲", "trousers": "長褲", "chinos": "卡其褲", "jeans": "牛仔褲", 
        "mini skirt": "迷你裙", "pleated skirt": "百褶裙", "pencil skirt": "鉛筆裙", "skirt": "裙",
        "running sneakers": "運動跑鞋", "sneakers": "休閒鞋", "ankle boots": "短靴", "boots": "靴",
        "high-top": "高筒鞋", "low-top": "低筒鞋", "heels": "高跟鞋", "loafers": "樂福鞋",
        "oxfords": "牛津鞋", "brogues": "雕花鞋", "derbies": "德比鞋", "slides": "拖鞋",
        "slippers": "室內拖", "sandals": "涼鞋", "socks": "襪", "barefoot": "赤腳"
    },
    // 特徵 / 細節
    details: {
        "spaghetti strap": "細肩帶", "delicate strap": "細肩帶", "v-neckline": "V 領", "v-neck": "V 領", "round neck": "圓領",
        "crew neck": "圓領", "mock-neck": "半高領", "turtleneck": "高領", "halter neck": "繞頸",
        "off-shoulder": "露肩", "pushed up": "捲袖", "rolled": "捲起", "zipped": "拉鍊", "zip": "拉鍊",
        "zip-up": "拉鍊", "buttoned": "排扣", "drawstring": "抽繩", "pleated": "百褶",
        "ribbon": "緞帶", "detail": "細節", "piping": "滾邊", "gingham check": "格紋",
        "plaid": "格紋", "houndstooth": "千鳥格", "distress": "破洞", "wash": "水洗",
        "graphic": "圖案", "logo": "圖標", "lace-up": "綁帶", "strappy": "細帶",
        "print": "印花", "vintage": "復古", "faded": "褪色", "performance": "機能性", "halfway": "半開",
        "sleeveless": "無袖", "sleeves rolled": "捲袖", "backless": "露背", "low-back": "露背",
        "platform": "厚底", "chunky": "厚底", "polished": "拋光", "suede": "麂皮",
        "opaque": "不透膚", "sheer": "透膚", "double-breasted": "雙排扣"
    }
};

const TERM_DICT: Record<string, string> = {
    // ==== 完整片語 (優先比對) ====
    "barefoot": "赤腳",
    "dress doubles as bottom": "洋裝兼下身",
    "slip dress doubles as bottom": "吊帶洋裝兼下身",
    "running sneakers": "運動跑鞋",
    "kimono-style robe": "和服式罩袍",
    "spaghetti strap": "細肩帶",
    "delicate strap": "細肩帶",
    "v-neckline": "V 領",
    "knee length": "及膝"
};

/**
 * 結構化解析與拼裝
 */
export const buildStructuredOutfitLabel = (value: string, type: string): string => {
    const raw = value.toLowerCase().trim();
    if (!raw || raw === "---") return "";

    // 0. 完整片語優先
    if (TERM_DICT[raw]) return TERM_DICT[raw];

    // 1. 原子特徵擷取
    const found: Record<string, string[]> = {
        color: [],
        material: [],
        fit: [],
        item: [],
        detail: []
    };

    // 輔助函式：按長度排序並移除包含關係，避免 shorts 匹配到 short
    const matchAtom = (dict: Record<string, string>, target: string[]) => {
        const sorted = Object.keys(dict).sort((a, b) => b.length - a.length);
        let remaining = raw;
        for (const en of sorted) {
            // 使用邊界檢查或確保不重複匹配
            const regex = new RegExp(`\\b${en.replace('-', '\\-')}\\b`, 'g');
            if (regex.test(remaining)) {
                target.push(dict[en]);
                remaining = remaining.replace(regex, " ".repeat(en.length));
            }
        }
    };

    matchAtom(ATOM_DICT.colors, found.color);
    matchAtom(ATOM_DICT.materials, found.material);
    matchAtom(ATOM_DICT.fits, found.fit);
    matchAtom(ATOM_DICT.items, found.item);
    matchAtom(ATOM_DICT.details, found.detail);

    // 2. 拼裝策略：顏色 + 材質 + 特徵 + 版型 + 單品
    const resultParts = [
        ...new Set(found.color),
        ...new Set(found.material),
        ...new Set(found.detail),
        ...new Set(found.fit),
        ...new Set(found.item)
    ];

    let final = resultParts.join("");

    // 3. 特殊處理：doubles as bottom
    if (raw.includes("doubles as bottom")) {
        const base = final.replace("兼下身", "").trim();
        return base.includes("洋裝") ? `${base}兼下身` : `${base} (兼下身)`;
    }

    // 4. 如果最終完全沒抓到單品詞，且有英文殘留，嘗試 fallback 到一個更直觀的名稱
    if (found.item.length === 0 && final.length > 0) {
        // 如果抓到了材質或顏色，補一個預設單品詞
        const fallbackItems: Record<string, string> = {
            top: "上衣",
            bottom: "下身",
            shoes: "鞋履",
            accessory: "單品",
            layer: "罩衫"
        };
        final += (fallbackItems[type] || "");
    }

    return final || value; // 真的抓不到就吐原文字，由上層處理
};



export const STYLE_ARCHETYPE_MAP: Record<string, string> = {
    'feminine_sweet': '甜美少女風格 // SWEET',
    'feminine_mature': '成熟御姐風格 // MATURE',
    'korean_chic': '韓系時髦風格 // KOREAN CHIC',
    'street_edgy': '街頭辣妹風格 // STREET',
    'sporty_active': '運動元氣風格 // SPORTY',
    'vintage_retro': '復古懷舊風格 // VINTAGE',
    'minimalist': '極簡清爽風格 // MINIMAL',
    'tomboy': '率性中性風格 // TOMBOY',
    'masculine_clean': '清爽男友風格 // CLEAN',
    'masculine_rugged': '硬朗戶外風格 // RUGGED',
    'masculine_formal': '都會正裝風格 // FORMAL',
    'feminine_office': '職場精英風格 // OFFICE',
    'dandy_refined': '雅痞紳士風格 // DANDY',
    'cultural_traditional': '文化深蘊風格 // CULTURAL',
    'street_techwear': '街頭機能風格 // TECHWEAR'
};

const WEAR_STATE_MAP: Record<string, { label: string, width: string }> = {
    'barely_worn': { label: '近全新', width: '90%' },
    'styled_daily': { label: '精心日常', width: '70%' },
    'well_loved': { label: '常穿自然', width: '55%' },
    'worn_in': { label: '明顯磨損', width: '20%' }
};

const isLowQualityDisplayText = (text: string, type: string): boolean => {
    // 嚴禁 fallback 到這些極短或模糊的詞 (除非它真的是單一單品且長度夠)
    const genericFallbacks = ["造型上裝單品", "造型下身單品", "造型鞋履", "造型配件"];
    if (genericFallbacks.includes(text)) return true;

    const forbiddenOnly = ["絲質", "棉質", "針織", "蕾絲", "紅色", "黑色", "白色", "寬鬆", "合身", "短褲", "長褲", "衣服", "外套拉鍊"];
    if (forbiddenOnly.includes(text)) return true;
    
    // 長度檢查 (太短的通常有問題，但單獨的「洋裝」「外套」OK)
    if (text.length < 2) return true;

    // 類型特徵檢查 (必須包含核心單品詞，放寬限制以減少過度 fallback)
    const topKeywords = ["衣", "上衣", "背心", "襯衫", "外套", "洋裝", "罩袍", "球衣", "衛衣", "連帽", "袍", "大衣", "恤", "夾克", "衫", "開襟"];
    const bottomKeywords = ["裙", "褲", "短褲", "長褲", "下身", "洋裝"];
    const shoeKeywords = ["鞋", "靴", "涼鞋", "拖鞋", "赤腳", "襪"];

    if (type === 'top') return !topKeywords.some(kw => text.includes(kw));
    if (type === 'bottom') return !bottomKeywords.some(kw => text.includes(kw));
    if (type === 'shoes') return !shoeKeywords.some(kw => text.includes(kw));
    
    return false;
};

const getOutfitDisplayText = (value: string | null | undefined, type: 'top' | 'bottom' | 'shoes' | 'generic' = 'generic'): string => {
    const fallbacks = {
        top: "造型上裝單品",
        bottom: "造型下身單品",
        shoes: "造型鞋履",
        generic: "造型配件"
    };

    if (!value || value === "---") return fallbacks[type];

    // 1. 結構化翻譯優先 (內部已包含 TERM_DICT 優先權)
    const structured = buildStructuredOutfitLabel(value, type);

    // 2. 品質檢查
    if (isLowQualityDisplayText(structured, type)) {
        // 如果結構化結果品質低，但包含英文，則保持結構化結果（至少比 fallback 好）
        // 除非原始值真的沒東西
        if (structured && structured !== value && !/[a-zA-Z]/.test(structured)) {
            return structured;
        }
    }
    
    // 3. 最後防線：若 structured 含有英文或為空，才進入 fallback
    if (!structured || structured === "" || /[a-zA-Z]/.test(structured)) {
        return fallbacks[type];
    }

    return structured;
};


const getTopDisplayText = (outfit: OutfitV2): string => {
    const top = outfit.pillars.top;
    const inner = outfit.pillars.layer_inner;
    const outer = outfit.pillars.layer_outer;

    const translateGarment = (val: string | null | undefined): string | null => {
        if (!val || val === "---") return null;
        const res = getOutfitDisplayText(val, 'top');
        // 過濾掉明顯是下身的詞，除非是洋裝
        const forbidden = ["裙", "褲", "短褲", "長褲", "鞋", "靴", "拖鞋", "襪", "涼鞋"];
        if (res !== "造型上裝單品" && !res.includes("洋裝") && forbidden.some(kw => res.includes(kw))) {
            return null;
        }
        return (res === "造型上裝單品") ? null : res;
    };

    const t = translateGarment(top);
    const i = translateGarment(inner);
    const o = translateGarment(outer);

    // 優先序策略：組合最外層的兩件，或顯示最外層
    // M-URBAN-T1-CLEAN-062: top(tee) + outer(jacket) -> tee + jacket
    if (o) {
        const base = t || i;
        if (base) return `${base} + ${o}`;
        return o;
    }
    
    if (t) {
        // M-HOME-T2-CLEAN-052: inner(tee) + top(shirt) -> shirt (因為 shirt 是 top 層，tee 是 inner)
        // 但如果想要更豐富，可以組合 i + t
        if (i) return `${i} + ${t}`;
        return t;
    }

    if (i) return i;

    // 最後保險：如果 top 有字但沒翻譯出來（可能包含英文或品質低），強制再試一次不帶過濾的翻譯
    if (top && top !== "---") {
        const raw = getOutfitDisplayText(top, 'top');
        if (raw !== "造型上裝單品") return raw;
    }

    return "造型上裝單品";
};

const translateOutfitTerm = (text: string | null | undefined): string => {
    if (!text) return "";
    let result = text;
    // 依字長排序，先翻長詞才不會被短詞先吃掉
    const sortedKeys = Object.keys(TERM_DICT).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
        const regex = new RegExp(`\\b${key}\\b`, 'gi');
        result = result.replace(regex, TERM_DICT[key]);
    }
    return result;
};

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

            {/* 使用提示橫幅 // USAGE TIPS BANNER */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="ml-5 px-6 py-4 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20 rounded-2xl flex items-center gap-4 text-[var(--color-text-main)]"
            >
                <div className="flex-shrink-0 w-6 h-6 rounded-full border border-[var(--color-gold)]/40 flex items-center justify-center text-[10px] font-bold text-[var(--color-gold)]">
                    i
                </div>
                <div className="flex flex-col gap-0.5">
                    <p className="text-xs font-bold tracking-wide">
                        點擊任一服裝卡片以鎖定為當前生圖目標，再次點擊解除鎖定
                    </p>
                    <p className="text-[9px] opacity-60 font-medium uppercase tracking-wider">
                        Click any outfit card to lock as current generation target. Click again to unlock.
                    </p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                    {filteredOutfits.map((outfit, index) => {
                        const isActive = model.preferences?.active_outfit_id === outfit.outfit_id;
                        const isSeed = OUTFIT_SEEDS_V2.some(s => s.outfit_id === outfit.outfit_id);
                        const isCritical = outfit.wear_state === 'worn_in';
                        
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

                                    {/* Hover Hint: Click to Lock */}
                                    {!isActive && (
                                        <div className="absolute top-6 right-8 opacity-0 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none">
                                            <span className="text-[9px] font-bold tracking-widest uppercase text-gray-500 leading-none">
                                                點擊鎖定 // CLICK TO LOCK
                                            </span>
                                        </div>
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
                                                {STYLE_ARCHETYPE_MAP[outfit.style_archetype] || outfit.style_archetype.replace('_', ' ')}
                                            </h4>
                                            <div className={`h-0.5 w-8 rounded-full transition-all duration-500 ${isActive ? 'bg-[var(--color-gold)] w-16' : 'bg-[var(--color-border)]'}`}></div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-[11px]">
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <p className="text-gray-400 dark:text-gray-600 font-bold uppercase text-[8px] tracking-widest">上裝 // TOP</p>
                                                    <p className="text-gray-800 dark:text-white font-medium line-clamp-1">{getTopDisplayText(outfit)}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-gray-400 dark:text-gray-600 font-bold uppercase text-[8px] tracking-widest">鞋履 // SHOES</p>
                                                    <p className="text-gray-800 dark:text-white font-medium line-clamp-1">{getOutfitDisplayText(outfit.pillars.shoes, 'shoes')}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <p className="text-gray-400 dark:text-gray-600 font-bold uppercase text-[8px] tracking-widest">下裝 // BOTTOM</p>
                                                    <p className="text-gray-800 dark:text-white font-medium line-clamp-1">{getOutfitDisplayText(outfit.pillars.bottom, 'bottom')}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <p className="text-gray-600 font-bold uppercase text-[8px] tracking-widest">物理磨損狀態 // CONDITION</p>
                                                        <span className={`text-[8px] font-black uppercase ${
                                                        outfit.wear_state === 'worn_in' ? 'text-red-500' : 'text-[var(--color-gold)]'
                                                        }`}>
                                                            {WEAR_STATE_MAP[outfit.wear_state]?.label || '未知狀態'}
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-1 bg-[var(--color-bg-input)] rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ 
                                                                width: WEAR_STATE_MAP[outfit.wear_state]?.width || '50%'
                                                            }}
                                                            className={`h-full rounded-full ${
                                                                outfit.wear_state === 'worn_in' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-[var(--color-gold)] shadow-[0_0_8px_rgba(212,175,55,0.4)]'
                                                            }`}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-8 pt-4 border-t border-[var(--color-border)] flex items-center justify-between pointer-events-none">
                                        <div className="flex items-center gap-2">
                                            <div className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all ${
                                                isActive 
                                                ? 'bg-[var(--color-gold)] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)] animate-pulse' 
                                                : 'bg-[var(--color-bg-input)] text-gray-500'
                                            }`}>
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
                                            { id: 'barely_worn', label: '幾乎全新・極致平整', desc: '極致正式 // PRISTINE' },
                                            { id: 'well_loved', label: '穿過・自然褶皺', desc: '寫實主義 // WELL LOVED' },
                                            { id: 'worn_in', label: '略舊・明顯磨損', desc: '明顯磨損 // WORN IN' }
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
