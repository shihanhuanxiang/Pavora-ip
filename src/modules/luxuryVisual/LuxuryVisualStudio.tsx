
import React, { useState, useRef } from 'react';
import {
    getFriendlyErrorMessage,
    transformImage,
    confirmPaidFeature,
    fileToBase64,
    analyzeLuxuryProduct
} from '../../shared/services/geminiService';
import { savePortfolioItem } from '../../shared/services/storageService';
import { buildLuxuryVisualPrompt } from '../../prompts/luxuryVisual';
import { downloadImage } from '../../shared/utils/imageUtils';
import type { LuxuryVisualParams, LuxuryVisualMode, LuxuryMasterStyle } from '../../shared/types/types';

import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
import Loader from '../../shared/components/common/Loader';
import Select from '../../shared/components/common/Select';
import Slider from '../../shared/components/common/Slider';
import LuxuryVisualIcon from '../../shared/assets/icons/LuxuryVisualIcon';
import SparklesIcon from '../../shared/assets/icons/SparklesIcon';
import DownloadIcon from '../../shared/assets/icons/DownloadIcon';
import ExpandIcon from '../../shared/assets/icons/ExpandIcon';
import PhotoIcon from '../../shared/assets/icons/PhotoIcon';
import DiceIcon from '../../shared/assets/icons/DiceIcon';
import ImagePreviewModal from '../../shared/components/common/ImagePreviewModal';

import { useNotificationStore } from '../../shared/stores/useNotificationStore';

interface LuxuryVisualStudioProps {
  onGoHome: () => void;
  initialImage?: { url: string; fileData: { data: string; mimeType: string; } } | null;
}

const MODES = [
  { value: 'LUXURY_POSTER', label: '奢華主視覺 (Hero Mode)' },
  { value: 'EDITORIAL_FASHION', label: '時尚雜誌風 (Editorial)' },
  { value: 'BEAUTY_FOCUS', label: '美妝特寫 (Beauty Focus)' },
  { value: 'INGREDIENT_EXPLOSION', label: '成分爆炸 (Zero-G)' },
  { value: 'STILL_LIFE_ZEN', label: '靜物禪意 (Zen)' },
  { value: 'AVANT_GARDE_SURREAL', label: '前衛超現實 (Surrealist)' },
  { value: 'LIFESTYLE_LUXE', label: '奢華生活感 (Lifestyle)' },
  { value: 'ARCHITECTURAL_VOID', label: '建築負空間 (Architectural)' },
  { value: 'LIQUID_DYNAMICS', label: '液態動力學 (Liquid)' },
  { value: 'PRISM_REFRACTION', label: '稜鏡虹光 (Prism)' },
  { value: 'MUSEUM_DISPLAY', label: '博物館陳列 (Museum)' },
  { value: 'URBAN_TECH_RUN', label: '賽博機能 (Urban Tech)' },
  { value: 'BOTANICAL_STUDY', label: '異域生機 (Botanical)' },
  { value: 'GEOMETRIC_PLAY', label: '幾何解構 (Geometric)' },
  { value: 'DESERT_MIRAGE', label: '荒漠幻影 (Mirage)' },
  { value: 'AQUATIC_VOYAGE', label: '水感旅程 (Aquatic)' },
  { value: 'CELESTIAL_SPACE', label: '星際軌域 (Celestial)' },
  { value: 'INDUSTRIAL_GRIT', label: '工業粗獷 (Industrial)' },
  { value: 'RETRO_CINEMA', label: '復古底片 (Retro Cinema)' },
  { value: 'HIGH_KEY_INTERIOR', label: '高調白模 (High-Key)' },
  { value: 'SHADOW_NARRATIVE', label: '光影敘事 (Shadow Narrative)' }
];

const MASTER_STYLES = [
  { value: 'NONE', label: '標準渲染 (Standard)' },
  { value: 'OBSIDIAN_NOIR', label: '曜石黑調 (Obsidian Noir)' },
  { value: 'GOLDEN_HOUR', label: '黃金時刻 (Golden Hour)' },
  { value: 'HIGH_KEY', label: '高調藝廊 (High-Key)' },
  { value: 'CYBER_AD', label: '賽博廣告 (Cyber Luxe)' },
  { value: 'QUIET_LUXURY', label: '靜謐老錢風 (Quiet Luxe)' },
  { value: 'RETRO_VOGUE', label: '90s 復古 (Retro Vogue)' },
  { value: 'METALLIC_CHROME', label: '液態鉻金 (Metallic)' },
  { value: 'ORGANIC_SHADOW', label: '自然光影 (Organic)' },
  { value: 'BAROQUE_CRIMSON', label: '巴洛克深紅 (Baroque)' },
  { value: 'ANTWERP_AVANT', label: '安特衛普前衛 (Antwerp)' },
  { value: 'MORANDI_MUTED', label: '莫蘭迪灰 (Morandi)' },
  { value: 'EGEAN_SAPPHIRE', label: '愛琴海藍 (Sapphire)' },
  { value: 'SAHARA_EARTH', label: '撒哈拉土色 (Sahara)' },
  { value: 'ARCTIC_CRYSTAL', label: '極地晶冷 (Arctic)' },
  { value: 'LIMESTONE_RAW', label: '萊姆石原色 (Limestone)' },
  { value: 'HOLOGRAPHIC_IRID', label: '全息虹彩 (Holographic)' },
  { value: 'COPPER_OXIDE', label: '氧化銅綠 (Patina)' },
  { value: 'POWDER_PASTEL', label: '粉彩夢境 (Pastel)' },
  { value: 'VINTAGE_SEPIA', label: '復古懷舊 (Sepia)' },
  { value: 'DEEP_EMERALD', label: '深邃祖母綠 (Emerald)' }
];

const FOCAL_LENGTHS = [
    { value: '24mm', label: '廣角 (24mm)' },
    { value: '50mm', label: '標準 (50mm)' },
    { value: '100mm', label: '望遠 (100mm)' }
];

const LuxuryVisualStudio: React.FC<LuxuryVisualStudioProps> = ({ onGoHome, initialImage }) => {
    const [subjectImage, setSubjectImage] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(initialImage || null);

    const [params, setParams] = useState<LuxuryVisualParams>({
        mode: 'LUXURY_POSTER',
        level: 'FAST',
        masterStyle: 'NONE',
        subject: {
            category: 'clothing',
            material: 'leather',
            color_palette: '未分析',
            brand: '未分析',
            logo_visibility: 'subtle',
            texture_detail: 'high',
            transparency_level: 100
        },
        ingredients_composition: '',
        camera: {
            focal_length: '50mm',
            dof_intensity: 60,
            composition: 'centered'
        },
        effect: {
            organic: 'silk_ribbons',
            particle: 'sparkle',
            intensity: 50
        },
        background: 'luxury_black_marble',
        lighting: 'cinematic_soft_box',
        ratio: '3:4',
        custom_prompt: ''
    });

    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const subjectInputRef = useRef<HTMLInputElement>(null);

    const resetResults = () => {
        setResultUrl(null);
        setError(null);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsLoading(true);
            setLoadingMessage('正在載入影像...');
            try {
                const file = e.target.files[0];
                const fileData = await fileToBase64(file);
                const url = URL.createObjectURL(file);
                setSubjectImage({ url, fileData });
                setResultUrl(null);
            } catch (err) {
                setError("無法讀取圖片檔案");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSmartAnalysis = async () => {
        if (!subjectImage) return;
        setIsAnalyzing(true);
        setLoadingMessage('AI 正在解構產品 DNA (類別、材質、顏色、品牌)...');
        try {
            const result = await analyzeLuxuryProduct(subjectImage.fileData);

            // 品類映射
            let cat = (result.category || '').toLowerCase();
            if (cat.includes('shoe') || cat.includes('sneaker') || cat.includes('heel') || cat.includes('鞋')) cat = 'clothing';
            if (cat.includes('backpack') || cat.includes('bag') || cat.includes('包')) cat = 'bag';
            if (cat.includes('perfume') || cat.includes('bottle') || cat.includes('香水')) cat = 'perfume';
            if (cat.includes('jewelry') || cat.includes('ring') || cat.includes('necklace') || cat.includes('飾品')) cat = 'jewelry';
            if (cat.includes('beauty') || cat.includes('cream') || cat.includes('美妝')) cat = 'beauty';
            if (cat.includes('watch') || cat.includes('錶')) cat = 'watch';

            // 材質映射
            const rawMat = (result.material || '').toLowerCase();
            let mappedMat: 'leather' | 'glass' | 'metal' | 'fabric' | 'suede' = params.subject.material;

            if (rawMat.includes('leather') || rawMat.includes('皮')) mappedMat = 'leather';
            if (rawMat.includes('suede') || rawMat.includes('麂皮')) mappedMat = 'suede';
            if (rawMat.includes('glass') || rawMat.includes('玻') || rawMat.includes('crystal')) mappedMat = 'glass';
            if (rawMat.includes('metal') || rawMat.includes('金屬') || rawMat.includes('steel') || rawMat.includes('gold')) mappedMat = 'metal';
            if (rawMat.includes('fabric') || rawMat.includes('織') || rawMat.includes('silk') || rawMat.includes('cotton')) mappedMat = 'fabric';

            setParams(p => ({
                ...p,
                subject: {
                    ...p.subject,
                    category: (cat || p.subject.category) as any,
                    material: mappedMat,
                    color_palette: result.colors || '未偵測',
                    brand: result.brand || '未知'
                }
            }));
            setLoadingMessage('分析完成，DNA 已注入面板！');
            setTimeout(() => setLoadingMessage(''), 1500);
        } catch (err) {
            setError(getFriendlyErrorMessage(err));
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleRandomizeStyle = () => {
        const randomMode = MODES[Math.floor(Math.random() * MODES.length)].value as LuxuryVisualMode;
        const randomStyle = MASTER_STYLES[Math.floor(Math.random() * MASTER_STYLES.length)].value as LuxuryMasterStyle;

        setParams(p => ({
            ...p,
            mode: randomMode,
            masterStyle: randomStyle
        }));
    };

    const handleGenerate = async () => {
        if (!subjectImage) {
            setError("請先上傳產品參考圖");
            return;
        }

        const usePro = params.level === 'MAX';
        if (usePro) {
            const confirmed = await confirmPaidFeature();
            if (!confirmed) return;
        }

        setIsLoading(true); setError(null);
        setLoadingMessage(usePro ? '正在進行 4K 物理光影追蹤渲染...' : '正在生成快速視覺草圖...');

        try {
            const prompt = buildLuxuryVisualPrompt(params);
            const result = await transformImage(
                subjectImage.fileData,
                prompt,
                [subjectImage.fileData],
                setLoadingMessage,
                { usePro, imageConfig: { aspectRatio: params.ratio, imageSize: usePro ? '4K' : '1K' } }
            );
            setResultUrl(result);
        } catch (err) {
            setError(getFriendlyErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleFillPerfumePyramid = () => {
        setParams(p => ({
            ...p,
            ingredients_composition: "前調: 佛手柑、甜橙、粉紅胡椒 / 中調: 大馬士革玫瑰、格拉斯茉莉 / 後調: 廣藿香、白麝香、檀香木"
        }));
    };

    const SectionHeader = ({ num, title, onDiceClick }: { num: string, title: string, onDiceClick?: () => void }) => (
        <div className="flex items-center gap-3 mb-6 mt-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full mf-step-badge-active text-[var(--home-paper)] text-[10px] font-black">{num}</span>
            <h3 className="text-sm font-bold text-[var(--home-ink)] tracking-[0.2em]">{title}</h3>
            <div className="h-px bg-[var(--home-line)] flex-grow"></div>
            {onDiceClick && (
                <button
                    onClick={onDiceClick}
                    className="p-1.5 rounded-full border border-brass/40 text-brass hover:text-wine transition-all group"
                    title="隨機美學組合"
                >
                    <DiceIcon className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                </button>
            )}
        </div>
    );

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-[1500px] animate-fade-in pb-24">
            {(isLoading || isAnalyzing) && <Loader message={loadingMessage} />}
            {isPreviewOpen && resultUrl && <ImagePreviewModal images={[resultUrl]} startIndex={0} onClose={() => setIsPreviewOpen(false)} />}

            <input type="file" ref={subjectInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-4 flex flex-col gap-6 max-h-[85vh] overflow-y-auto pr-4 custom-scrollbar">

                    <div id="section-upload">
                        <SectionHeader num="01" title="產品與智能分析" />
                        <Card className="home-card-sub space-y-4">
                            {subjectImage ? (
                                <>
                                    <div className="relative group aspect-video rounded-lg overflow-hidden border border-[var(--home-line)] bg-[var(--color-bg-deep)]">
                                        <img src={subjectImage.url} alt="Subject" className="w-full h-full object-contain" />
                                        <div className="absolute inset-0 bg-[var(--color-bg-deep)]/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                            <Button onClick={() => subjectInputRef.current?.click()} variant="secondary" className="text-xs py-1 px-3 home-btn-secondary">更換圖片</Button>
                                            <button onClick={() => { setSubjectImage(null); resetResults(); }} className="text-[10px] text-danger hover:underline">移除參考</button>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleSmartAnalysis}
                                        isLoading={isAnalyzing}
                                        className="w-full home-btn-secondary font-bold tracking-widest"
                                    >
                                        <SparklesIcon className="w-4 h-4 mr-2" /> 執行 AI 智能分析
                                    </Button>
                                </>
                            ) : (
                                <div
                                    onClick={() => subjectInputRef.current?.click()}
                                    className="w-full aspect-video border-2 border-dashed border-brass/40 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-brass/10 transition-all group"
                                >
                                    <PhotoIcon className="w-10 h-10 text-brass/60 group-hover:text-brass mb-2" />
                                    <span className="text-[10px] text-brass group-hover:text-wine font-bold uppercase tracking-widest">點擊上傳商品照片</span>
                                </div>
                            )}
                        </Card>
                    </div>

                    <div>
                        <SectionHeader num="02" title="視覺母型設定" onDiceClick={handleRandomizeStyle} />
                        <Card className="space-y-6 home-card-sub">
                            <div className="space-y-1">
                                <Select label="渲染模式" options={MODES} value={params.mode} onChange={e => setParams(p => ({...p, mode: e.target.value as LuxuryVisualMode}))} />
                                <p className="text-[10px] text-[var(--home-muted)] italic pl-1">決定畫面中有什麼以及如何擺放</p>
                            </div>
                            <div className="space-y-1">
                                <Select label="美學風格" options={MASTER_STYLES} value={params.masterStyle} onChange={e => setParams(p => ({...p, masterStyle: e.target.value as LuxuryMasterStyle}))} />
                                <p className="text-[10px] text-[var(--home-muted)] italic pl-1">決定照明風格、色調與表面反射</p>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-[var(--home-muted)] uppercase tracking-widest">算力調度等級</label>
                                <div className="flex gap-2">
                                    <button onClick={() => setParams(p => ({...p, level: 'FAST'}))} className={`flex-1 py-3 text-[10px] font-bold rounded border transition-all ${params.level === 'FAST' ? 'bg-wine text-[var(--home-paper)] border-wine' : 'bg-white/40 text-[var(--home-muted)] border-[var(--home-line)] hover:border-[var(--home-line-strong)]'}`}>FAST（快速）</button>
                                    <button onClick={() => setParams(p => ({...p, level: 'MAX'}))} className={`flex-1 py-3 text-[10px] font-bold rounded border transition-all ${params.level === 'MAX' ? 'bg-wine text-[var(--home-paper)] border-wine' : 'bg-white/40 text-[var(--home-muted)] border-[var(--home-line)] hover:border-[var(--home-line-strong)]'}`}>MAX（4K 精緻）</button>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div>
                        <SectionHeader num="03" title="商品物理 DNA" />
                        <Card className="space-y-6 home-card-sub">
                            <div className="grid grid-cols-2 gap-4">
                                <Select label="產品類別" options={[{value:'perfume',label:'頂級香水'},{value:'bag',label:'皮革精品'},{value:'jewelry',label:'珠寶首飾'},{value:'beauty',label:'美妝護理'},{value:'watch',label:'鐘錶配件'},{value:'clothing',label:'鞋履與服飾'}]} value={params.subject.category} onChange={e => setParams(p => ({...p, subject: {...p.subject, category: e.target.value as any}}))} />
                                <Select label="主體材質" options={[{value:'glass',label:'晶透玻璃'},{value:'metal',label:'拋光金屬'},{value:'leather',label:'高級皮革'},{value:'fabric',label:'奢華織物'},{value:'suede',label:'麂皮質感'}]} value={params.subject.material} onChange={e => setParams(p => ({...p, subject: {...p.subject, material: e.target.value as any}}))} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-[var(--home-muted)] uppercase tracking-widest">鎖定品牌</label>
                                    <input value={params.subject.brand} onChange={e => setParams(p => ({...p, subject: {...p.subject, brand: e.target.value}}))} className="w-full bg-white/50 p-2.5 rounded text-xs text-[var(--home-ink)] border border-[var(--home-line)] outline-none focus:border-brass/60" placeholder="品牌名稱" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-[var(--home-muted)] uppercase tracking-widest">鎖定色調</label>
                                    <div className="w-full bg-white/50 p-2.5 rounded text-xs text-[var(--home-muted)] border border-[var(--home-line)] truncate">
                                        {params.subject.color_palette}
                                    </div>
                                </div>
                            </div>

                            {params.mode === 'INGREDIENT_EXPLOSION' && (
                                <div className="space-y-2 p-4 bg-brass/5 border border-brass/20 rounded-lg animate-fade-in">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-[10px] font-bold text-brass uppercase tracking-widest">
                                            爆炸成分組成
                                        </label>
                                        {params.subject.category === 'perfume' && (
                                            <button
                                                onClick={handleFillPerfumePyramid}
                                                className="text-[9px] bg-brass/20 text-brass px-2 py-0.5 rounded border border-brass/30 hover:text-wine transition-all"
                                            >
                                                香氛金字塔助手
                                            </button>
                                        )}
                                    </div>
                                    <textarea
                                        value={params.ingredients_composition}
                                        onChange={e => setParams(p => ({...p, ingredients_composition: e.target.value}))}
                                        placeholder={params.subject.category === 'perfume' ? "例如：前調: 佛手柑 / 中調: 玫瑰 / 後調: 檀香" : "例如：玫瑰花瓣、金箔、清透水滴..."}
                                        className="w-full bg-white/50 p-3 rounded text-sm text-[var(--home-ink)] border border-brass/30 focus:border-brass outline-none h-20"
                                    />
                                    <p className="text-[9px] text-[var(--home-muted)] italic">提示：AI 會根據成分順序由外向內、由上向下編排層次感。</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 items-end">
                                <Select label="品牌標識顯示" options={[{value:'subtle',label:'隱約浮水印'},{value:'on',label:'清晰 LOGO'},{value:'off',label:'無識別標示'}]} value={params.subject.logo_visibility} onChange={e => setParams(p => ({...p, subject: {...p.subject, logo_visibility: e.target.value as any}}))} />
                                <div className="pb-1"><Slider label="紋理細節" min={0} max={100} value={params.subject.texture_detail === 'high' ? 100 : 50} onChange={e => setParams(p => ({...p, subject: {...p.subject, texture_detail: parseInt(e.target.value) > 70 ? 'high' : 'medium'}}))} unit="%" /></div>
                            </div>
                        </Card>
                    </div>

                    <div>
                        <SectionHeader num="04" title="鏡頭與光影工程" />
                        <Card className="space-y-6 home-card-sub">
                            <Select label="專業焦段" options={FOCAL_LENGTHS} value={params.camera.focal_length} onChange={e => setParams(p => ({...p, camera: {...p.camera, focal_length: e.target.value as any}}))} />
                            <Slider label="背景虛化" min={0} max={100} value={params.camera.dof_intensity} onChange={e => setParams(p => ({...p, camera: {...p.camera, dof_intensity: parseInt(e.target.value)}}))} unit="%" />
                            <Select label="輸出比例" options={[{value:'3:4',label:'3:4 (Portrait)'},{value:'9:16',label:'9:16 (Story)'},{value:'1:1',label:'1:1 (Post)'},{value:'16:9',label:'16:9 (Landscape)'}]} value={params.ratio} onChange={e => setParams(p => ({...p, ratio: e.target.value}))} />
                        </Card>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[var(--home-line)] pb-10">
                        <Button
                            onClick={handleGenerate}
                            isLoading={isLoading}
                            disabled={!subjectImage || isAnalyzing}
                            className="w-full text-xl py-6 font-black home-btn-primary"
                        >
                            <SparklesIcon className="w-6 h-6 mr-3" /> 啟動廣告級渲染
                        </Button>
                    </div>
                </div>

                <div className="lg:col-span-8">
                    <Card className="h-full min-h-[85vh] flex flex-col items-center bg-[var(--color-bg-deep)] relative overflow-y-auto custom-scrollbar group border-2 border-[var(--color-border)] rounded-2xl shadow-inner">
                        <div className="w-full px-8 py-6 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]/5 flex justify-between items-center">
                            <div className="flex flex-col">
                                <h3 className="text-xl font-display font-bold tracking-[0.2em] text-[var(--color-text-title)]">視覺輸出預覽</h3>
                                <span className="text-[11px] tracking-wide text-brass font-bold">廣告級渲染引擎</span>
                            </div>
                        </div>

                        {resultUrl ? (
                            <div className="w-full flex flex-col items-center animate-fade-in py-8">
                                <div className="flex-grow w-full flex items-center justify-center p-4">
                                    <img src={resultUrl} alt="Render Result" className="max-w-full h-auto object-contain rounded shadow-[0_40px_80px_rgba(0,0,0,0.8)] transition-all duration-700" />
                                </div>
                                <div className="mt-8 p-6 bg-[var(--color-bg-deep)]/80 backdrop-blur-2xl rounded-xl flex flex-wrap justify-center gap-6 border border-[var(--color-border)] sticky bottom-4 z-10 shadow-2xl">
                                    <Button onClick={() => setIsPreviewOpen(true)} variant="secondary" className="px-10"><ExpandIcon className="w-5 h-5 mr-2" /> 放大</Button>
                                    <Button onClick={() => downloadImage(resultUrl, `pavora_${Date.now()}.jpg`, 'LuxuryVisual')} variant="light" className="px-10"><DownloadIcon className="w-5 h-5 mr-2" /> 下載</Button>
                                    <Button onClick={async () => {
                                        const { addNotification } = useNotificationStore.getState();
                                        downloadImage(resultUrl, `pavora_luxury_${Date.now()}.jpg`, 'LuxuryVisual');
                                        addNotification({
                                            type: 'success',
                                            title: '儲存成功',
                                            message: '已成功儲存並下載至作品集！'
                                        });
                                    }} variant="secondary">儲存至資產庫</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-grow flex flex-col items-center justify-center py-40">
                                <div className="text-center opacity-10 group-hover:opacity-20 transition-all duration-1000">
                                    <LuxuryVisualIcon className="w-64 h-64 mx-auto mb-6 text-brass" />
                                    <p className="text-3xl font-display tracking-[0.4em] text-[var(--color-text-title)]">渲染引擎待命中</p>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default LuxuryVisualStudio;
