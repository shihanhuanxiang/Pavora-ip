import React, { useState } from 'react';
import type { Model } from '../../shared/types/types';
import Button from '../../shared/components/common/Button';
import Slider from '../../shared/components/common/Slider';
import { motion, AnimatePresence } from 'motion/react';
import { useModelStore } from '../../shared/stores/useModelStore';
import { useNotification } from '../../shared/context/NotificationContext';
// 2026-08-03（企劃案 D-10）：「隨機靈感」從 ModelSetup 搬來，需要這批人設選項常數。
import {
    MBTI_OPTIONS, CORE_VIBE_OPTIONS, TONE_OPTIONS, POSTING_HABITS,
    TAIWAN_COUNTIES, TAIWAN_DISTRICT_DATA, INTEREST_OPTIONS
} from '../../shared/constants/constants';
import { generatePersonaTraits } from '../modelCreation/services/personaService';

interface ModelIdentityEditorProps {
    model: Model;
    onClose: () => void;
}

const ModelIdentityEditor: React.FC<ModelIdentityEditorProps> = ({ model, onClose }) => {
    const { updateModel } = useModelStore();
    const { addNotification } = useNotification();
    const [formData, setFormData] = useState({
        name: model.name,
        age: model.age || '',
        gender: model.gender || 'female',
        persona: {
            mbti: model.persona?.mbti || '',
            coreVibe: model.persona?.coreVibe || '',
            toneOfVoice: model.persona?.toneOfVoice || '',
            profession: model.persona?.profession || '',
            locked_descriptor: model.persona?.locked_descriptor || '',
            // 2026-08-03：這兩個欄位刻意沒有輸入框——維持改版前的行為
            // （在 ModelSetup 時它們也只能由「隨機靈感」或 AI 補完寫入，從無手動 UI）。
            // 加進 formData 是為了讓隨機／AI 寫入的值能被保存，不會在儲存時被丟掉。
            catchphrase: model.persona?.catchphrase || '',
            postingHabit: model.persona?.postingHabit || ''
        },
        lifeCircuit: {
            primaryCity: model.lifeCircuit?.primaryCity || '',
            primaryDistrict: model.lifeCircuit?.primaryDistrict || '',
            interests: model.lifeCircuit?.interests || []
        },
        stats: {
            bust: model.stats?.bust || '',
            waist: model.stats?.waist || '',
            hip: model.stats?.hip || '',
            height: model.stats?.height || ''
        },
        advancedStats: {
            bustTension: model.advancedStats?.bustTension ?? 50,
            physiqueCurvature: model.advancedStats?.physiqueCurvature ?? 50,
            muscularDensity: model.advancedStats?.muscularDensity ?? 50,
            vTaperScale: model.advancedStats?.vTaperScale ?? 50
        },
        worldAnchors: {
            pet: model.worldAnchors?.pet || { breed: '', name: '', description: '', traits: [] },
            relationships: model.worldAnchors?.relationships || [],
            iconicItems: model.worldAnchors?.iconicItems || [],
            longTermMemories: model.worldAnchors?.longTermMemories || []
        }
    });

    const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);
    const [isRandomizing, setIsRandomizing] = useState(false);

    /**
     * 「隨機靈感」—— 2026-08-03 從 ModelSetup 搬來（企劃案 D-10，Hank 拍板）。
     *
     * 為什麼搬：原本它在模特兒生成的「靈魂人設」tab，那個 tab 依「只留表面特徵」
     * 的架構原則被整個移除，這顆按鈕跟著陪葬。但「一鍵起草人設」是真的省時間的功能
     * （填人設是最花時間的事），所以搬到真正管人設的地方。
     *
     * 與原版的三個差異：
     *   1. **不隨機姓名**。原版會連名字一起亂數。這裡編輯的是**既有** IP，
     *      亂改它的名字不合理。
     *   2. **不隨機外觀**（臉部原型／美學風格／服裝／髮色／體型）。
     *      那些屬於模特兒生成的保留範圍，這個編輯器也沒有那些欄位。
     *   3. 高亮動畫沒搬（本檔無該機制），改用 notification 告知。
     *
     * 保留的部分：亂數填完之後會呼叫 `generatePersonaTraits` 做 AI 深度補完
     * ——少了這步，「隨機靈感」只是亂數填空，那才是原版真正有價值的地方。
     */
    const handleRandomPersona = async () => {
        setIsRandomizing(true);
        try {
            const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

            const randomCity = pick(TAIWAN_COUNTIES).value;
            const districts = TAIWAN_DISTRICT_DATA[randomCity] || [];
            const randomDistrict = districts.length ? pick(districts) : '';

            const seeded = {
                mbti: pick(MBTI_OPTIONS).value,
                coreVibe: pick(CORE_VIBE_OPTIONS).value,
                toneOfVoice: pick(TONE_OPTIONS).value,
                postingHabit: pick(POSTING_HABITS).value,
            };
            const seededCircuit = {
                primaryCity: randomCity,
                primaryDistrict: randomDistrict,
                interests: [pick(INTEREST_OPTIONS).value],
            };

            // 先寫入亂數種子，讓使用者立刻看到變化（AI 補完可能要幾秒）
            setFormData(prev => ({
                ...prev,
                persona: { ...prev.persona, ...seeded },
                lifeCircuit: { ...prev.lifeCircuit, ...seededCircuit },
            }));

            // AI 深度補完：用剛才的種子產出更連貫的人設。
            // 依 personaService 的 PersonaSeed 型別傳參（name/gender/age/profession/coreVibe/location），
            // 回傳只有 catchphrase / postingHabit / toneOfVoice / mbti / interests——沒有 profession，
            // 所以職業維持使用者原本填的值，不被覆寫。
            try {
                const parsedAge = Number(formData.age);
                const traits = await generatePersonaTraits({
                    name: formData.name,
                    gender: String(formData.gender),
                    age: Number.isFinite(parsedAge) && parsedAge > 0 ? parsedAge : undefined,
                    profession: formData.persona.profession || undefined,
                    coreVibe: seeded.coreVibe,
                    location: randomCity,
                });
                if (traits) {
                    /**
                     * 2026-08-03 實測發現並修正：AI 會把 `toneOfVoice` 回傳成一整段散文
                     * （例如「充滿活力、率真且隨性，說話帶點街頭酷感，常使用『派』『Chill』…」），
                     * 但這個欄位在下游是要**查英文對照表**的：
                     *   `TONE_OF_VOICE_EN_MAP[toneOfVoice] ?? toneOfVoice`
                     * 查不到就退回原值 → 中文進 prompt → 被 enforce 的 stripChinese 整段清空，
                     * 結果這個欄位的資訊實際上是**消失**而不是生效（與企劃案 D-9 同一種病）。
                     *
                     * 所以只接受落在 TONE_OPTIONS 受控詞彙內的值；AI 給散文就保留亂數種子。
                     * （這是既有行為的修正，原版 handleRandomize 也有同樣問題。）
                     */
                    const toneIsControlled = TONE_OPTIONS.some(o => o.value === traits.toneOfVoice);
                    // MBTI 只接受 4 個大寫字母，避免 AI 回傳「ESFP 表演者」這類帶說明的字串
                    const mbtiIsValid = /^[A-Z]{4}$/.test((traits.mbti || '').trim());

                    setFormData(prev => ({
                        ...prev,
                        persona: {
                            ...prev.persona,
                            mbti: mbtiIsValid ? traits.mbti.trim() : prev.persona.mbti,
                            toneOfVoice: toneIsControlled ? traits.toneOfVoice : prev.persona.toneOfVoice,
                            // catchphrase / postingHabit 是自由文字欄位，不進英文對照表，散文沒問題
                            catchphrase: traits.catchphrase || prev.persona.catchphrase,
                            postingHabit: traits.postingHabit || prev.persona.postingHabit,
                        },
                        lifeCircuit: {
                            ...prev.lifeCircuit,
                            interests: traits.interests?.length ? traits.interests : prev.lifeCircuit.interests,
                        },
                    }));
                    addNotification({
                        type: 'success',
                        message: '隨機靈感已套用（含 AI 深度人設）',
                        description: '姓名與外觀未變動。確認後請按下方儲存。',
                    });
                    return;
                }
            } catch {
                // AI 補完失敗不算失敗——亂數種子已經寫進去了，仍然可用。
            }

            addNotification({
                type: 'success',
                message: '隨機靈感已套用',
                description: 'AI 深度補完未成功，已套用基本亂數人設。姓名與外觀未變動。',
            });
        } finally {
            setIsRandomizing(false);
        }
    };

    const handleSave = async (withDownload = false) => {
        try {
            await updateModel(model.id, formData);
            addNotification({ type: 'success', message: '身份更新成功', description: '模特兒數據已同步至雲端核心。' });
            
            if (withDownload) {
                const { embedMetadata } = await import('../../shared/utils/metadataUtils');
                const { downloadImage } = await import('../../shared/utils/imageUtils');
                
                const metadata = { ...model, ...formData, exportedAt: new Date().toISOString() };
                const finalUrl = model.imageUrl.startsWith('data:') 
                    ? embedMetadata(model.imageUrl, metadata) 
                    : model.imageUrl;
                
                downloadImage(finalUrl, `${formData.name || 'model'}.jpg`);
            }
            
            onClose();
        } catch (e) {
            addNotification({ type: 'error', message: '存檔失敗', description: '發生技術性錯誤，請稍後再試。' });
        }
    };

    const addRelationship = () => {
        setFormData(prev => ({
            ...prev,
            worldAnchors: {
                ...prev.worldAnchors,
                relationships: [...prev.worldAnchors.relationships, { name: '', relation: '', personality: '', memo: '' }]
            }
        }));
    };

    const removeRelationship = (index: number) => {
        setFormData(prev => ({
            ...prev,
            worldAnchors: {
                ...prev.worldAnchors,
                relationships: prev.worldAnchors.relationships.filter((_, i) => i !== index)
            }
        }));
    };

    const addIconicItem = () => {
        setFormData(prev => ({
            ...prev,
            worldAnchors: {
                ...prev.worldAnchors,
                iconicItems: [...prev.worldAnchors.iconicItems, { name: '', description: '', significance: '' }]
            }
        }));
    };

    const removeIconicItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            worldAnchors: {
                ...prev.worldAnchors,
                iconicItems: prev.worldAnchors.iconicItems.filter((_, i) => i !== index)
            }
        }));
    };

    const handleAdvancedChange = (key: keyof typeof formData.advancedStats, value: number) => {
        setFormData(prev => ({
            ...prev,
            advancedStats: {
                ...prev.advancedStats,
                [key]: value
            }
        }));
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/90 backdrop-blur-xl" 
                onClick={onClose} 
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-xl bg-[var(--color-bg-surface)] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
                <div className="p-8 space-y-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-display font-bold tracking-[0.2em] uppercase text-[var(--color-gold)]">編輯品牌身份 (Identity)</h2>
                            <p className="text-[9px] text-gray-500 uppercase mt-1 tracking-[0.3em]">IP Management Core // ID: {model.id}</p>
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-500 hover:text-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">姓名 (Name)</label>
                                <input 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--color-gold)] outline-none transition-all"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">年齡 (Age)</label>
                                <input 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--color-gold)] outline-none transition-all"
                                    value={formData.age}
                                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Persona */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between gap-3">
                                <label className="text-[11px] font-bold text-[var(--color-gold)] uppercase tracking-[0.2em]">靈魂組態 (Persona)</label>
                                {/* 「隨機靈感」2026-08-03 從 ModelSetup 搬來（企劃案 D-10）。
                                    只隨機人設欄位，不動姓名與外觀——這裡編輯的是既有 IP，
                                    亂改它的名字或長相不合理。 */}
                                <button
                                    onClick={handleRandomPersona}
                                    disabled={isRandomizing}
                                    className="text-[9px] text-[var(--color-gold)] border border-[var(--color-gold)]/30 px-3 py-1 rounded-full hover:bg-[var(--color-gold)] hover:text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="隨機產生一套人設（不會改動姓名與外觀）"
                                >
                                    {isRandomizing ? '產生中…' : '🎲 隨機靈感'}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-[9px]">MBTI</label>
                                    <input 
                                        placeholder="例如: INTJ, ENFP"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--color-gold)] outline-none"
                                        value={formData.persona.mbti}
                                        onChange={(e) => setFormData({...formData, persona: {...formData.persona, mbti: e.target.value}})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-[9px]">職業身分 (Profession)</label>
                                    <input 
                                        placeholder="如: 時尚攝影師, 數位原住民"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--color-gold)] outline-none"
                                        value={formData.persona.profession}
                                        onChange={(e) => setFormData({...formData, persona: {...formData.persona, profession: e.target.value}})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-[9px]">主力語氣 (Tone)</label>
                                    <input 
                                        placeholder="例如: 溫柔, 疏離"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--color-gold)] outline-none"
                                        value={formData.persona.toneOfVoice}
                                        onChange={(e) => setFormData({...formData, persona: {...formData.persona, toneOfVoice: e.target.value}})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-[9px]">人格核心氛圍 (Vibe)</label>
                                    <input 
                                        placeholder="例如: 賽博龐克執法官"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--color-gold)] outline-none"
                                        value={formData.persona.coreVibe}
                                        onChange={(e) => setFormData({...formData, persona: {...formData.persona, coreVibe: e.target.value}})}
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-[9px]">
                                        臉部鎖定描述 (Locked Descriptor)
                                        <span className="ml-2 text-[9px] text-gray-500 normal-case tracking-normal">
                                            — Layer 1 注入,鎖定臉部特徵以提升一致性
                                        </span>
                                    </label>
                                    <textarea 
                                        placeholder="例如: female virtual IP model, 25 years old, dark brown hair with darker roots, large expressive brown eyes with double eyelids, soft round face with defined jawline, natural minimal makeup with dewy skin, small lips with natural glossy color"
                                        rows={4}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--color-gold)] outline-none resize-none leading-relaxed"
                                        value={formData.persona.locked_descriptor}
                                        onChange={(e) => setFormData({...formData, persona: {...formData.persona, locked_descriptor: e.target.value}})}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Life Circuit (New) */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <label className="text-[11px] font-bold text-[var(--color-gold)] uppercase tracking-[0.2em]">地理與興趣 (Life Circuit)</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">活動縣市 (City)</label>
                                    <input 
                                        placeholder="如: 台北市, 東京"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--color-gold)] outline-none"
                                        value={formData.lifeCircuit.primaryCity}
                                        onChange={(e) => setFormData({...formData, lifeCircuit: {...formData.lifeCircuit, primaryCity: e.target.value}})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">具體區域 (District)</label>
                                    <input 
                                        placeholder="如: 信義區, 澀谷"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--color-gold)] outline-none"
                                        value={formData.lifeCircuit.primaryDistrict}
                                        onChange={(e) => setFormData({...formData, lifeCircuit: {...formData.lifeCircuit, primaryDistrict: e.target.value}})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">核心興趣 (Interests)</label>
                                <div className="flex flex-wrap gap-2">
                                    {formData.lifeCircuit.interests?.map((interest, idx) => (
                                        <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full group transition-all hover:border-[var(--color-gold)]/50">
                                            <span className="text-[10px] text-gray-300">{interest}</span>
                                            <button 
                                                onClick={() => {
                                                    const newInterests = formData.lifeCircuit.interests?.filter((_, i) => i !== idx);
                                                    setFormData({...formData, lifeCircuit: {...formData.lifeCircuit, interests: newInterests}});
                                                }}
                                                className="text-gray-600 hover:text-red-500 transition-colors"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                    <input 
                                        placeholder="+ 新增興趣 (Enter)"
                                        className="bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 px-3 py-1 rounded-full outline-none text-[10px] text-[var(--color-gold)] placeholder-[var(--color-gold)]/50 w-32"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = (e.target as HTMLInputElement).value.trim();
                                                if (val) {
                                                    const current = formData.lifeCircuit.interests || [];
                                                    setFormData({...formData, lifeCircuit: {...formData.lifeCircuit, interests: [...current, val]}});
                                                    (e.target as HTMLInputElement).value = '';
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* World Anchors (New) */}
                        <div className="space-y-6 pt-4 border-t border-white/5">
                            <label className="text-[11px] font-bold text-[var(--color-gold)] uppercase tracking-[0.2em]">世界觀與靈魂錨點 (Soul Anchors)</label>
                            
                            {/* Pet Section */}
                            <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">🐾</span>
                                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">生活夥伴 (Pet Registry)</h5>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] text-gray-500 font-bold uppercase">品種 (Breed)</label>
                                        <input 
                                            placeholder="如: 橘色米克斯, 暹羅貓"
                                            className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-xs focus:border-[var(--color-gold)] outline-none"
                                            value={formData.worldAnchors.pet?.breed}
                                            onChange={(e) => setFormData({
                                                ...formData, 
                                                worldAnchors: { ...formData.worldAnchors, pet: { ...formData.worldAnchors.pet!, breed: e.target.value } }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] text-gray-500 font-bold uppercase">名字 (Name)</label>
                                        <input 
                                            placeholder="如: 饅頭"
                                            className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-xs focus:border-[var(--color-gold)] outline-none"
                                            value={formData.worldAnchors.pet?.name}
                                            onChange={(e) => setFormData({
                                                ...formData, 
                                                worldAnchors: { ...formData.worldAnchors, pet: { ...formData.worldAnchors.pet!, name: e.target.value } }
                                            })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] text-gray-500 font-bold uppercase">性格與痕跡 (Traits & Signs)</label>
                                    <textarea 
                                        placeholder="如: 超愛吃肉泥、會在沙發留下爪印、喜歡跳到鍵盤上"
                                        className="w-full h-20 bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-xs focus:border-[var(--color-gold)] outline-none resize-none"
                                        value={formData.worldAnchors.pet?.description}
                                        onChange={(e) => setFormData({
                                            ...formData, 
                                            worldAnchors: { ...formData.worldAnchors, pet: { ...formData.worldAnchors.pet!, description: e.target.value } }
                                        })}
                                    />
                                </div>
                            </div>

                            {/* Relationships Section */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">👥</span>
                                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">關係鏈 (Human Relations)</h5>
                                    </div>
                                    <button onClick={addRelationship} className="text-[9px] text-[var(--color-gold)] border border-[var(--color-gold)]/30 px-3 py-1 rounded-full hover:bg-[var(--color-gold)] hover:text-black transition-all">+ 新增關係人</button>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {formData.worldAnchors.relationships.map((rel, idx) => (
                                        <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3 relative group">
                                            <button onClick={() => removeRelationship(idx)} className="absolute top-3 right-3 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                            <div className="grid grid-cols-2 gap-3">
                                                <input 
                                                    placeholder="姓名"
                                                    className="bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs outline-none focus:border-[var(--color-gold)]"
                                                    value={rel.name}
                                                    onChange={(e) => {
                                                        const newRels = [...formData.worldAnchors.relationships];
                                                        newRels[idx].name = e.target.value;
                                                        setFormData({...formData, worldAnchors: {...formData.worldAnchors, relationships: newRels}});
                                                    }}
                                                />
                                                <input 
                                                    placeholder="關係 (如: 閨蜜, 媽媽)"
                                                    className="bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs outline-none focus:border-[var(--color-gold)]"
                                                    value={rel.relation}
                                                    onChange={(e) => {
                                                        const newRels = [...formData.worldAnchors.relationships];
                                                        newRels[idx].relation = e.target.value;
                                                        setFormData({...formData, worldAnchors: {...formData.worldAnchors, relationships: newRels}});
                                                    }}
                                                />
                                            </div>
                                            <input 
                                                placeholder="性格或口頭禪"
                                                className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs outline-none focus:border-[var(--color-gold)]"
                                                value={rel.personality}
                                                onChange={(e) => {
                                                    const newRels = [...formData.worldAnchors.relationships];
                                                    newRels[idx].personality = e.target.value;
                                                    setFormData({...formData, worldAnchors: {...formData.worldAnchors, relationships: newRels}});
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Iconic Items Section */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">💍</span>
                                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">標誌性物品 (Iconic Items)</h5>
                                    </div>
                                    <button onClick={addIconicItem} className="text-[9px] text-[var(--color-gold)] border border-[var(--color-gold)]/30 px-3 py-1 rounded-full hover:bg-[var(--color-gold)] hover:text-black transition-all">+ 新增物品</button>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {formData.worldAnchors.iconicItems.map((item, idx) => (
                                        <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3 relative group">
                                            <button onClick={() => removeIconicItem(idx)} className="absolute top-3 right-3 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                            <input 
                                                placeholder="物品名稱 (如: 斷裂的後照鏡, 阿嬤的玉鐲)"
                                                className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs outline-none focus:border-[var(--color-gold)]"
                                                value={item.name}
                                                onChange={(e) => {
                                                    const newItems = [...formData.worldAnchors.iconicItems];
                                                    newItems[idx].name = e.target.value;
                                                    setFormData({...formData, worldAnchors: {...formData.worldAnchors, iconicItems: newItems}});
                                                }}
                                            />
                                            <input 
                                                placeholder="視覺描述 (如: 銀色金屬、霧面質感)"
                                                className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs outline-none focus:border-[var(--color-gold)]"
                                                value={item.description}
                                                onChange={(e) => {
                                                    const newItems = [...formData.worldAnchors.iconicItems];
                                                    newItems[idx].description = e.target.value;
                                                    setFormData({...formData, worldAnchors: {...formData.worldAnchors, iconicItems: newItems}});
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Core Memories (New Phase 1) */}
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">🧠</span>
                                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">核心記憶庫 (Core Memory Bank)</h5>
                                    </div>
                                </div>
                                <div className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-3">
                                    <p className="text-[8px] text-gray-500 uppercase tracking-widest leading-relaxed">
                                        這些碎片構成模特兒的長期記憶與劇情一致性。AI 會在生成時優先提取這些關鍵資訊。
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.worldAnchors.longTermMemories?.map((mem, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full group">
                                                <span className="text-[10px] text-gray-300"># {mem}</span>
                                                <button 
                                                    onClick={() => {
                                                        const newMems = formData.worldAnchors.longTermMemories?.filter((_, i) => i !== idx);
                                                        setFormData({...formData, worldAnchors: {...formData.worldAnchors, longTermMemories: newMems}});
                                                    }}
                                                    className="text-gray-600 hover:text-red-500 transition-colors"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        ))}
                                        <input 
                                            placeholder="+ 新增記憶碎片"
                                            className="bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 px-3 py-1.5 rounded-full outline-none text-[10px] text-[var(--color-gold)] placeholder-[var(--color-gold)]/50 w-24"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const val = (e.target as HTMLInputElement).value.trim();
                                                    if (val) {
                                                        const currentMem = formData.worldAnchors.longTermMemories || [];
                                                        setFormData({...formData, worldAnchors: {...formData.worldAnchors, longTermMemories: [...currentMem, val]}});
                                                        (e.target as HTMLInputElement).value = '';
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <label className="text-[11px] font-bold text-[var(--color-gold)] uppercase tracking-[0.2em]">物理參數 (Physical Stats)</label>
                            <div className="grid grid-cols-4 gap-3">
                                {['bust', 'waist', 'hip', 'height'].map(stat => (
                                    <div key={stat} className="space-y-2">
                                        <label className="text-[9px] font-bold text-gray-500 uppercase text-center block tracking-tighter">{stat.toUpperCase()}</label>
                                        <input 
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-center focus:border-[var(--color-gold)] outline-none"
                                            value={(formData.stats as any)[stat]}
                                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, [stat]: e.target.value}})}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Advanced Physiological Controls */}
                            <div className="pt-4 mt-2 border-t border-white/5 space-y-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-1 h-3 bg-[var(--color-gold)] rounded-full"></div>
                                    <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">生理特徵精密控制 (Physio-Logic)</h4>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {formData.gender === 'female' ? (
                                        <>
                                            <Slider 
                                                label="上圍體積感 (Bust Volume / Gravity)" 
                                                min={0} max={100} unit="%" 
                                                value={formData.advancedStats.bustTension} 
                                                onChange={e => handleAdvancedChange('bustTension', Number(e.target.value))} 
                                            />
                                            <Slider 
                                                label="身型曲線弧度 (Physique Curvature)" 
                                                min={0} max={100} unit="%" 
                                                value={formData.advancedStats.physiqueCurvature} 
                                                onChange={e => handleAdvancedChange('physiqueCurvature', Number(e.target.value))} 
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <Slider 
                                                label="肌肉品質定義 (Muscle Quality / Definition)" 
                                                min={0} max={100} unit="%" 
                                                value={formData.advancedStats.muscularDensity} 
                                                onChange={e => handleAdvancedChange('muscularDensity', Number(e.target.value))} 
                                            />
                                            <Slider 
                                                label="肩甲骨架比例 (Shoulder Frame / V-Taper)" 
                                                min={0} max={100} unit="%" 
                                                value={formData.advancedStats.vTaperScale} 
                                                onChange={e => handleAdvancedChange('vTaperScale', Number(e.target.value))} 
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button variant="secondary" onClick={onClose} className="flex-1 py-4 border-white/10 opacity-50 hover:opacity-100 uppercase tracking-widest text-[10px]">取消</Button>
                        <Button onClick={() => setShowDownloadPrompt(true)} className="flex-[2] py-4 uppercase tracking-[0.2em] text-[11px]">儲存並同步更新身份</Button>
                    </div>
                </div>

                {/* Download Prompt Modal */}
                <AnimatePresence>
                    {showDownloadPrompt && (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            className="absolute inset-0 bg-black/95 backdrop-blur-md z-30 flex items-center justify-center p-6 text-center"
                        >
                            <div className="max-w-xs space-y-6">
                                <div className="space-y-2">
                                    <h4 className="text-base font-bold text-white tracking-widest uppercase">身份內碼更新 (Metadata Sync)</h4>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        身份已完成更新。您是否需要同步下載包含新身份 Metadata 的圖片？<br/>
                                        <span className="text-[var(--color-gold)] mt-2 block">這能確保圖片物理內碼與資料庫同步。</span>
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <Button onClick={() => handleSave(true)} className="w-full py-3.5 text-[10px] font-bold uppercase tracking-widest">
                                        更新並下載 (新內碼) 📥
                                    </Button>
                                    <Button variant="secondary" onClick={() => handleSave(false)} className="w-full py-3 text-[10px] uppercase border-white/10">
                                        僅更新資料庫資料
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

export default ModelIdentityEditor;
