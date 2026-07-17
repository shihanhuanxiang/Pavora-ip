
import React, { useState, useRef } from 'react';
import {
    analyzeEGenProduct,
    defineEGenStyle,
    generateEGenCopy,
    transformImage,
    getFriendlyErrorMessage,
    fileToBase64,
    confirmPaidFeature
} from '../../shared/services/geminiService';
import { EGEN_MATRIX_CELLS, buildEGenSingleGridPrompt, buildEGenBatchPrompt } from '../../prompts/eGen';
import { downloadImage } from '../../shared/utils/imageUtils';
import type { EGenAnalysis, EGenStyleDefinition, EGenPoster } from '../../shared/types/types';
import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
import Loader from '../../shared/components/common/Loader';
import PhotoIcon from '../../shared/assets/icons/PhotoIcon';
import EGenIcon from '../../shared/assets/icons/EGenIcon';
import SparklesIcon from '../../shared/assets/icons/SparklesIcon';
import DownloadIcon from '../../shared/assets/icons/DownloadIcon';
import ExpandIcon from '../../shared/assets/icons/ExpandIcon';
import CloseIcon from '../../shared/assets/icons/CloseIcon';
import ReplaceIcon from '../../shared/assets/icons/ReplaceIcon';
import ImagePreviewModal from '../../shared/components/common/ImagePreviewModal';
import Select from '../../shared/components/common/Select';

interface EGenStudioProps {
  onGoHome: () => void;
}

interface SourceImage {
    id: string;
    url: string;
    label: string;
    fileData: { data: string; mimeType: string; };
}

type QualityLevel = 'standard' | 'high';

const DEFAULT_ANGLES = ['正面', '背面', '側面', '特寫'];

const EGenStudio: React.FC<EGenStudioProps> = ({ onGoHome }) => {
    const [sourceImages, setSourceImages] = useState<(SourceImage | null)[]>(DEFAULT_ANGLES.map(() => null));
    const [analysis, setAnalysis] = useState<EGenAnalysis | any>(null);
    const [style, setStyle] = useState<EGenStyleDefinition | null>(null);

    // 生成結果狀態
    const [singleGridResult, setSingleGridResult] = useState<string | null>(null);
    const [batchPosters, setBatchPosters] = useState<EGenPoster[]>([]);

    const [manualDescription, setManualDescription] = useState('');
    const [brandAtmosphere, setBrandAtmosphere] = useState<'default' | 'luxury' | 'minimalist' | 'vibrant' | 'tech'>('default');
    const [isBatchMode, setIsBatchMode] = useState(false);
    const [quality, setQuality] = useState<QualityLevel>('standard');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeSlotRef = useRef<number | null>(null);

    const handleSlotClick = (index: number) => {
        activeSlotRef.current = index;
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && activeSlotRef.current !== null) {
            const file = e.target.files[0];
            const index = activeSlotRef.current;
            setIsLoading(true);
            setLoadingMessage('正在處理圖片...');
            try {
                const fileData = await fileToBase64(file);
                const url = URL.createObjectURL(file);
                setSourceImages(prev => {
                    const next = [...prev];
                    next[index] = { id: `img-${Date.now()}`, url, label: DEFAULT_ANGLES[index], fileData };
                    return next;
                });
                resetResults();
            } catch (err) {
                setError(getFriendlyErrorMessage(err));
            } finally {
                setIsLoading(false);
                if (e.target) e.target.value = '';
            }
        }
    };

    const resetResults = () => {
        setSingleGridResult(null);
        setBatchPosters([]);
        setAnalysis(null);
        setStyle(null);
        setError(null);
    };

    const removeImage = (index: number) => {
        setSourceImages(prev => {
            const next = [...prev];
            next[index] = null;
            return next;
        });
        resetResults();
    };

    const clearAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("確定要刪除所有已上傳的圖片與設定嗎？")) {
            setSourceImages(DEFAULT_ANGLES.map(() => null));
            setManualDescription('');
            resetResults();
        }
    };

    const handleLabelChange = (index: number, newLabel: string) => {
        setSourceImages(prev => {
            const next = [...prev];
            const item = next[index];
            if (item) next[index] = { ...item, label: newLabel };
            return next;
        });
    };

    const handleRetryPoster = async (posterId: number) => {
        const poster = batchPosters.find(p => p.id === posterId);
        const validImages = sourceImages.filter(img => img !== null) as SourceImage[];
        if (!poster || !analysis || !style || validImages.length === 0) return;

        setBatchPosters(prev => prev.map(p => p.id === posterId ? { ...p, status: 'loading' } : p));

        try {
            const allFileData = validImages.map(img => img.fileData);
            const anchorsContext = validImages.map(img => `${img.label}視圖`).join(', ');

            // 修正：動態判斷是否使用 Pro 模型
            const usePro = quality === 'high';
            const url = await transformImage(allFileData, poster.prompt, [], undefined, {
                usePro,
                imageConfig: {
                    aspectRatio: '9:16',
                    ...(usePro ? { imageSize: '2K' } : {})
                }
            });
            setBatchPosters(prev => prev.map(p => p.id === posterId ? { ...p, imageUrl: url, status: 'success' } : p));
        } catch (e) {
            setBatchPosters(prev => prev.map(p => p.id === posterId ? { ...p, status: 'error' } : p));
        }
    };

    const runEGenWorkflow = async () => {
        const validImages = sourceImages.filter(img => img !== null) as SourceImage[];
        if (validImages.length === 0) return;

        const usePro = quality === 'high';
        if (usePro) {
            const confirmed = await confirmPaidFeature();
            if (!confirmed) return;
        }

        setIsLoading(true); setError(null);
        setSingleGridResult(null);
        setBatchPosters([]);

        try {
            const allFileData = validImages.map(img => img.fileData);
            const anchorsContext = validImages.map(img => `${img.label}視圖`).join(', ');

            // Phase 1: Analysis
            setLoadingMessage('Phase 1: 正在鎖定產品細節、LOGO 與材質 DNA...');
            const analysisResult = await analyzeEGenProduct(allFileData);
            setAnalysis(analysisResult);

            // Phase 2: Style
            setLoadingMessage('Phase 2: 正在規劃品牌級視覺系統與背景佈光...');
            const styleResult = await defineEGenStyle(JSON.stringify(analysisResult), brandAtmosphere);
            setStyle(styleResult);

            // Phase 3: Copywriting
            setLoadingMessage('Phase 3: 正在同步生成營銷文案...');
            const copyResult = await generateEGenCopy(JSON.stringify(analysisResult));

            if (!isBatchMode) {
                // 模式 A: 單張九宮格海報
                setLoadingMessage('Phase 4: 正在渲染 3x3 九宮格 Lookbook 海報...');
                const prompt = buildEGenSingleGridPrompt(analysisResult, styleResult, anchorsContext, manualDescription);
                const resultUrl = await transformImage(allFileData, prompt, [], undefined, {
                    usePro,
                    imageConfig: {
                        aspectRatio: '3:4',
                        ...(usePro ? { imageSize: '4K' } : {})
                    }
                });
                setSingleGridResult(resultUrl);
            } else {
                // 模式 B: 獨立 9 張圖片
                const initialBatch: EGenPoster[] = EGEN_MATRIX_CELLS.map((cell, i) => ({
                    id: i,
                    type: cell.id,
                    title_zh: cell.label,
                    prompt: buildEGenBatchPrompt(cell, analysisResult, styleResult, anchorsContext, manualDescription),
                    copy: (copyResult as any)[`poster_${i+1}`],
                    status: 'loading'
                }));
                setBatchPosters(initialBatch);

                let count = 1;
                for (const poster of initialBatch) {
                    setLoadingMessage(`Phase 4: 正在渲染素材 ${count}/9 (${poster.title_zh})...`);
                    try {
                        const url = await transformImage(allFileData, poster.prompt, [], undefined, {
                            usePro,
                            imageConfig: {
                                aspectRatio: '9:16',
                                ...(usePro ? { imageSize: '2K' } : {})
                            }
                        });
                        setBatchPosters(prev => prev.map(p => p.id === poster.id ? { ...p, imageUrl: url, status: 'success' } : p));
                    } catch (e) {
                        setBatchPosters(prev => prev.map(p => p.id === poster.id ? { ...p, status: 'error' } : p));
                    }
                    count++;
                    await new Promise(r => setTimeout(r, 500));
                }
            }
            setLoadingMessage('Pavora 電商全鏈路自動生成已完成！');

        } catch (err) {
            setError(getFriendlyErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadAllBatch = () => {
        batchPosters.forEach((p, i) => {
            if (p.imageUrl) {
                setTimeout(() => downloadImage(p.imageUrl!, `pavora_egen_${p.type}_${Date.now()}.jpg`, 'EGen'), i * 400);
            }
        });
    };

    const uploadedCount = sourceImages.filter(img => img !== null).length;

    return (
        <div className="container mx-auto p-4 lg:p-8 max-w-[1600px] animate-fade-in pb-24">
            {isLoading && !singleGridResult && batchPosters.length === 0 && <Loader message={loadingMessage} />}
            {previewImage && <ImagePreviewModal images={[previewImage]} startIndex={0} onClose={() => setPreviewImage(null)} />}

            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* 控制面板 */}
                <div className="lg:col-span-3 flex flex-col gap-6 h-full">
                    <Card className={`home-card flex flex-col ${!analysis ? 'flex-grow' : ''}`}>
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-2xl font-bold text-[var(--home-ink)]">1. 商品角度錨點</h3>
                            {uploadedCount > 0 && (
                                <button
                                    type="button"
                                    onClick={clearAll}
                                    className="text-[10px] text-danger hover:opacity-70 font-bold uppercase tracking-widest px-2 py-1 border border-danger/20 rounded transition-all"
                                >
                                    全部刪除
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {sourceImages.map((img, index) => (
                                <div key={index} className="flex flex-col gap-2">
                                    <div
                                        onClick={() => !img && handleSlotClick(index)}
                                        className={`relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all group overflow-hidden ${img ? 'home-card-sub' : 'border-dashed border-brass/40 hover:bg-brass/10 bg-white/30 cursor-pointer'}`}
                                    >
                                        {img ? (
                                            <>
                                                <img src={img.url} className="w-full h-full object-contain" alt={img.label} />
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                                                    className="absolute top-1 right-1 bg-[var(--color-bg-deep)]/60 text-[var(--color-text-title)] p-1 rounded-full hover:text-danger transition-colors"
                                                >
                                                    <CloseIcon className="w-3 h-3" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <PhotoIcon className="w-8 h-8 text-brass/50 mb-1" />
                                                <span className="text-[10px] text-brass font-bold uppercase">{DEFAULT_ANGLES[index]}</span>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        value={img ? img.label : DEFAULT_ANGLES[index]}
                                        onChange={(e) => handleLabelChange(index, e.target.value)}
                                        placeholder="角度標籤"
                                        className="bg-transparent border-b border-[var(--home-line)] text-[11px] text-center text-[var(--home-muted)] focus:outline-none focus:border-brass/60 transition-colors py-1"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2 mb-6">
                            <label className="block text-[10px] font-bold text-[var(--home-muted)] uppercase tracking-widest">
                                商品詳細規格 (選填)
                            </label>
                            <textarea
                                value={manualDescription}
                                onChange={(e) => setManualDescription(e.target.value)}
                                placeholder="可填寫：材質、品牌、特徵描述、貨號等..."
                                className="w-full bg-white/50 border border-[var(--home-line)] rounded-lg p-3 text-sm text-[var(--home-ink)] placeholder-[var(--home-muted)]/60 focus:outline-none focus:border-brass/60 transition-all resize-none"
                                rows={4}
                            />
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex items-center justify-between p-3 home-card-sub">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-[var(--home-ink)]">產出獨立圖片</span>
                                    <span className="text-[10px] text-[var(--home-muted)]">嚴格順序生成模式</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={isBatchMode}
                                    onChange={(e) => setIsBatchMode(e.target.checked)}
                                    className="w-6 h-6 rounded bg-white/60 border-[var(--home-line)] accent-wine"
                                />
                            </div>

                            <Select
                                label="生成品質"
                                options={[
                                    { value: 'standard', label: '標準（Flash）' },
                                    { value: 'high', label: '高品質（Pro 4K）[付費]' }
                                ]}
                                value={quality}
                                onChange={(e) => setQuality(e.target.value as QualityLevel)}
                            />

                            <Select
                                label="品牌氛圍"
                                options={[
                                    { value: 'default', label: '自動匹配' },
                                    { value: 'luxury', label: '奢華黑金' },
                                    { value: 'minimalist', label: '北歐極簡' },
                                    { value: 'vibrant', label: '活力色彩' },
                                    { value: 'tech', label: '硬核科技' }
                                ]}
                                value={brandAtmosphere}
                                onChange={(e) => setBrandAtmosphere(e.target.value as any)}
                            />
                        </div>

                        <div className="flex-grow" />
                        <Button
                            onClick={runEGenWorkflow}
                            isLoading={isLoading}
                            disabled={uploadedCount === 0 || isLoading}
                            className="w-full text-xl py-5 home-btn-primary"
                        >
                            <SparklesIcon className="w-6 h-6 mr-2" />
                            {isBatchMode ? '開始生成全案' : '生成九宮格海報'}
                        </Button>
                    </Card>

                    {analysis && (
                        <Card className="home-card-sub animate-fade-in flex-grow">
                            <h3 className="text-xl font-bold text-wine mb-5 flex items-center gap-2"><SparklesIcon className="w-5 h-5"/> 核心特徵解構</h3>
                            <div className="space-y-5">
                                <div><span className="text-xs font-bold text-[var(--home-muted)] uppercase tracking-widest block mb-1">鎖定品類</span><p className="text-[var(--home-ink)] text-base font-medium">{analysis.basic_info?.color} {analysis.basic_info?.category}</p></div>
                                <div><span className="text-xs font-bold text-[var(--home-muted)] uppercase tracking-widest block mb-1">材質 DNA</span><p className="text-[var(--home-ink)] text-base font-medium">{analysis.basic_info?.material}</p></div>
                                <div><span className="text-xs font-bold text-[var(--home-muted)] uppercase tracking-widest block mb-1">光學屬性</span><p className="text-brass text-sm font-bold">{analysis.basic_info?.optical || '自動分析中...'}</p></div>
                                {style && (
                                    <>
                                        <div className="pt-2 border-t border-[var(--home-line)]">
                                            <span className="text-xs font-bold text-[var(--home-muted)] uppercase tracking-widest block mb-1">建議佈光</span>
                                            <p className="text-[var(--home-ink)] text-xs leading-relaxed">{style.lighting_protocol}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-[var(--home-muted)] uppercase tracking-widest block mb-1">材質響應</span>
                                            <p className="text-[var(--home-ink)] text-xs leading-relaxed">{style.material_response}</p>
                                        </div>
                                    </>
                                )}
                                <div><span className="text-xs font-bold text-[var(--home-muted)] uppercase tracking-widest block mb-2">關鍵特徵</span><ul className="space-y-2">{analysis.physical_traits?.map((p: string, i: number) => <li key={i} className="text-sm text-[var(--home-muted)] flex gap-2"><span className="text-brass">•</span>{p}</li>)}</ul></div>
                            </div>
                        </Card>
                    )}
                </div>

                <div className="lg:col-span-9">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 border-b border-[var(--home-line)] pb-6">
                        <div className="flex flex-col">
                            <h3 className="text-2xl font-display font-bold tracking-[0.2em] text-[var(--home-ink)]">視覺輸出矩陣</h3>
                            <span className="text-[11px] tracking-wide text-brass font-bold">商品全案自動產出</span>
                        </div>
                        {batchPosters.some(p => p.imageUrl) && (
                            <Button onClick={handleDownloadAllBatch} variant="secondary" className="text-sm font-bold px-6 home-btn-secondary">
                                <DownloadIcon className="w-5 h-5 mr-2" /> 批次下載全案素材
                            </Button>
                        )}
                        {singleGridResult && (
                             <Button onClick={() => downloadImage(singleGridResult, 'pavora_egen_lookbook.jpg', 'EGen')} variant="secondary" className="text-sm font-bold px-6 home-btn-secondary">
                                <DownloadIcon className="w-5 h-5 mr-2" /> 下載九宮格海報
                            </Button>
                        )}
                    </div>

                    {!isBatchMode ? (
                        <div className="flex justify-center items-start pt-4">
                            {singleGridResult ? (
                                <div className="w-full max-w-2xl group relative home-card p-4 animate-fade-in">
                                    <img src={singleGridResult} alt="E-Gen Lookbook Grid" className="w-full h-auto object-contain rounded" />
                                    <div className="absolute inset-0 bg-[var(--color-bg-deep)]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                        <button type="button" onClick={() => setPreviewImage(singleGridResult)} className="bg-[var(--color-bg-surface)] p-3 rounded-full text-[var(--color-text-main)] hover:scale-110 transition-all"><ExpandIcon className="w-6 h-6"/></button>
                                        <button type="button" onClick={() => downloadImage(singleGridResult, 'lookbook.jpg', 'EGen')} className="bg-[var(--color-bg-surface)] p-3 rounded-full text-[var(--color-text-main)] hover:scale-110 transition-all"><DownloadIcon className="w-6 h-6"/></button>
                                    </div>
                                    <div className="mt-4 text-center">
                                        <span className="text-[10px] text-[var(--home-muted)]">九宮格已完成，可放大或下載</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-[60vh] w-full flex flex-col items-center justify-center border-4 border-dashed border-brass/40 rounded-3xl text-[var(--home-muted)] bg-white/20">
                                    <PhotoIcon className={`w-32 h-32 mb-6 ${isLoading ? 'animate-pulse text-brass' : 'opacity-20'}`} />
                                    <p className="text-2xl font-black text-[var(--home-ink)] tracking-tighter">
                                        {isLoading ? '正在渲染九宮格...' : '尚未生成'}
                                    </p>
                                    <p className="text-sm mt-3 text-center px-12 text-[var(--home-muted)]">
                                        {isLoading ? '正在編排九宮格版面...' : '請完成左側設定並點擊開始生成'}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {batchPosters.length > 0 ? batchPosters.map(poster => (
                                <Card key={poster.id} className="p-0 flex flex-col home-card overflow-hidden hover:border-brass/50 transition-all group">
                                    <div className="aspect-[9/16] bg-[var(--color-bg-deep)]/40 relative flex items-center justify-center">
                                        {poster.status === 'loading' && (
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-12 h-12 border-4 border-brass border-t-transparent rounded-full animate-spin"/>
                                                <span className="text-xs text-[var(--color-text-dim)] font-bold uppercase tracking-widest">生成中...</span>
                                            </div>
                                        )}
                                        {poster.status === 'success' && poster.imageUrl && (
                                            <>
                                                <img src={poster.imageUrl} alt={poster.title_zh} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-[var(--color-bg-deep)]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                    <button type="button" onClick={() => setPreviewImage(poster.imageUrl!)} className="bg-[var(--color-bg-surface)] p-3 rounded-full text-[var(--color-text-main)] hover:scale-110 transition-all shadow-2xl"><ExpandIcon className="w-6 h-6"/></button>
                                                    <button type="button" onClick={() => downloadImage(poster.imageUrl!, `${poster.title_zh}.jpg`, 'EGen')} className="bg-[var(--color-bg-surface)] p-3 rounded-full text-[var(--color-text-main)] hover:scale-110 transition-all shadow-2xl"><DownloadIcon className="w-6 h-6"/></button>
                                                </div>
                                                <div className="absolute top-4 left-4 bg-[var(--color-bg-deep)]/70 text-brass text-[10px] px-3 py-1.5 rounded-lg border border-brass/30 backdrop-blur-md font-black shadow-lg">
                                                    {poster.title_zh}
                                                </div>
                                            </>
                                        )}
                                        {poster.status === 'error' && (
                                            <div className="flex flex-col items-center gap-4 p-6">
                                                <div className="text-danger text-sm font-bold">渲染失敗</div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRetryPoster(poster.id)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface)]/80 text-[var(--color-text-title)] rounded-full border border-[var(--color-border)] transition-all"
                                                >
                                                    <ReplaceIcon className="w-4 h-4" /> 重新生成
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6 border-t border-[var(--home-line)] flex-grow">
                                        {poster.copy ? (
                                            <div className="space-y-4">
                                                <h4 className="text-[var(--home-ink)] font-bold text-lg leading-tight">{poster.copy.title}</h4>
                                                <p className="text-xs text-brass font-bold uppercase tracking-wider opacity-80">{poster.copy.subtitle}</p>
                                                <div className="pt-4 border-t border-[var(--home-line)] space-y-1.5">
                                                    {poster.copy.bullets.map((b, i) => (
                                                        <p key={i} className="text-[11px] text-[var(--home-muted)] flex gap-2"><span>•</span>{b}</p>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : <div className="h-20 flex items-center justify-center text-[var(--home-muted)] text-xs italic">等待文案生成...</div>}
                                    </div>
                                </Card>
                            )) : (
                                <div className="col-span-full h-[60vh] flex flex-col items-center justify-center border-4 border-dashed border-brass/40 rounded-3xl text-[var(--home-muted)] bg-white/20">
                                    <EGenIcon className="w-32 h-32 mb-6 opacity-20 text-brass" />
                                    <p className="text-2xl font-black text-[var(--home-ink)] tracking-tighter">獨立圖片模式就緒</p>
                                    <p className="text-sm mt-3 text-center px-12 text-[var(--home-muted)]">點擊開始生成，系統將自動按順序產出 9 張高品質素材</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EGenStudio;
