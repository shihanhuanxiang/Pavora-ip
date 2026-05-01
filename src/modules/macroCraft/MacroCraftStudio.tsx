
import React, { useState, useRef } from 'react';
import { analyzeMacroProduct, generateMacroCraftScene, fileToBase64, getFriendlyErrorMessage } from '../../shared/services/geminiService';
import { savePortfolioItem } from '../../shared/services/storageService';
import { downloadImage } from '../../shared/utils/imageUtils';
import type { MacroCraftParams, MacroAnalysis } from '../../shared/types/types';
import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
import Loader from '../../shared/components/common/Loader';
import PhotoIcon from '../../shared/assets/icons/PhotoIcon';
import MacroCraftIcon from '../../shared/assets/icons/MacroCraftIcon';
import Select from '../../shared/components/common/Select';
import ExpandIcon from '../../shared/assets/icons/ExpandIcon';
import DownloadIcon from '../../shared/assets/icons/DownloadIcon';
import ImagePreviewModal from '../../shared/components/common/ImagePreviewModal';

interface MacroCraftStudioProps {
  onGoHome: () => void;
}

const MODES = [
    { value: 'build', label: '建構中 (Build)' },
    { value: 'repair', label: '維修中 (Repair)' },
    { value: 'upgrade', label: '結構升級 (Upgrade)' },
    { value: 'structure', label: '內在結構 (Inner Structure)' },
    { value: 'material', label: '材質世界 (Material World)' }
];

const SCALES = [
    { value: 'subtle', label: '輕度呈現 (Subtle)' },
    { value: 'balanced', label: '平衡敘事 (Balanced)' },
    { value: 'dominant', label: '世界觀等級 (Dominant)' }
];

const PRODUCT_TYPES = [
    { value: 'top', label: '上衣 (Garment)' },
    { value: 'outerwear', label: '外套／大衣 (Outerwear)' },
    { value: 'tailored', label: '結構型服裝 (Tailored)' },
    { value: 'sneaker', label: '運動鞋 (Footwear)' },
    { value: 'boot', label: '皮鞋／靴類 (Footwear)' },
    { value: 'bag', label: '包袋 (Accessory)' },
    { value: 'belt', label: '皮帶 (Accessory)' },
    { value: 'acc', label: '其它配件 (Accessory)' }
];

const MacroCraftStudio: React.FC<MacroCraftStudioProps> = ({ onGoHome }) => {
    const [image, setImage] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(null);
    const [analysis, setAnalysis] = useState<MacroAnalysis | null>(null);
    const [params, setParams] = useState<MacroCraftParams>({
        mode: 'build',
        scale: 'balanced',
        productType: 'sneaker',
        quality: 'standard'
    });
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsLoading(true); setLoadingMessage('分析產品結構中...');
            setError(null);
            try {
                const fileData = await fileToBase64(file);
                const url = URL.createObjectURL(file);
                setImage({ url, fileData });
                
                // Step 1 & 2: 分析結構邊界與材質
                const result = await analyzeMacroProduct(fileData);
                setAnalysis(result);
                setResultUrl(null);
            } catch (err) {
                setError(getFriendlyErrorMessage(err));
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleGenerate = async () => {
        if (!image || !analysis) return;
        setIsLoading(true); setError(null);
        try {
            // Step 3 & 4 & 5: 套用路徑並生成
            const result = await generateMacroCraftScene(image.fileData, params, analysis, (msg: string) => setLoadingMessage(msg));
            setResultUrl(result);
        } catch (err) {
            setError(getFriendlyErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (resultUrl) {
            downloadImage(resultUrl, `macro_craft_${Date.now()}.jpg`, 'MacroCraft');
            alert('已成功儲存並下載至作品集！');
        }
    };

    return (
        <div className="container mx-auto p-8 max-w-[1400px] animate-fade-in pb-20">
            {isLoading && <Loader message={loadingMessage} />}
            {previewImage && <ImagePreviewModal images={[previewImage]} startIndex={0} onClose={() => setPreviewImage(null)} />}
            
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

            {/* Header */}
            <div className="sticky top-[80px] z-30 glass-panel border-x-0 border-t-0 px-6 py-4 mb-8">
                <div className="max-w-[110rem] mx-auto flex justify-between items-center">
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-display font-bold uppercase tracking-[0.3em] text-[var(--color-text-main)] flex items-center gap-3">
                            <MacroCraftIcon className="w-8 h-8 text-[var(--color-gold)]" />
                            微觀工藝
                        </h2>
                        <span className="text-[9px] uppercase tracking-[0.5em] text-[var(--color-gold)] font-light">MacroCraft Studio</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {onGoHome && <Button onClick={onGoHome} variant="secondary" className="text-[10px] font-bold tracking-widest">返回首頁</Button>}
                    </div>
                </div>
            </div>
            
            <div className="text-center mb-10 max-w-2xl mx-auto space-y-2">
                <p className="text-[var(--color-gold)] text-xs font-bold tracking-[0.3em] uppercase">工藝敘事引擎 // Creative Lab</p>
                <p className="text-[var(--color-text-dim)] text-sm font-sans leading-relaxed">
                    將產品轉化為「微觀地形」，呈現建構、維修與材質演化的工藝價值。
                </p>
            </div>

            {error && <div className="text-center text-red-500 p-3 bg-red-900/20 rounded-md mb-6">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Controls */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <Card>
                        <h3 className="text-xl font-bold text-[var(--color-text-title)] mb-4">1. 產品輸入</h3>
                        {image ? (
                            <div className="relative group w-full mb-2">
                                <img src={image.url} alt="Product" className="w-full h-48 object-contain rounded-md bg-[var(--color-bg-deep)]/40" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button onClick={() => fileInputRef.current?.click()} variant="secondary">更換產品圖</Button>
                                </div>
                            </div>
                        ) : (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-48 border-2 border-dashed border-[var(--color-border)] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[var(--color-gold)] transition-all bg-[var(--color-bg-surface)]/20"
                            >
                                <PhotoIcon className="w-10 h-10 text-[var(--color-text-dim)] mb-2" />
                                <span className="text-[var(--color-text-dim)]">上傳產品（鞋履、包袋、服裝）</span>
                            </div>
                        )}
                        {analysis && (
                            <div className="mt-4 p-3 bg-[var(--color-bg-deep)]/50 rounded border border-[var(--color-border)]">
                                <h4 className="text-xs font-bold text-[var(--color-gold)] uppercase mb-2">已建立工藝節點 (Analysis Complete)</h4>
                                <div className="flex flex-wrap gap-1">
                                    {analysis.structureNodes.map(node => (
                                        <span key={node} className="text-[10px] bg-[var(--color-bg-surface)] px-2 py-0.5 rounded text-[var(--color-text-dim)] border border-[var(--color-border)]">{node}</span>
                                    ))}
                                </div>
                                <p className="text-[10px] text-[var(--color-text-dim)] mt-2 italic">{analysis.materialProperties}</p>
                            </div>
                        )}
                    </Card>

                    <Card>
                        <h3 className="text-xl font-bold text-[var(--color-text-title)] mb-4">2. 敘事邏輯配置</h3>
                        <div className="space-y-4">
                            <Select 
                                label="敘事模式" 
                                options={MODES} 
                                value={params.mode} 
                                onChange={e => setParams(p => ({...p, mode: e.target.value as any}))} 
                            />
                            <Select 
                                label="敘事強度 (Scale Level)" 
                                options={SCALES} 
                                value={params.scale} 
                                onChange={e => setParams(p => ({...p, scale: e.target.value as any}))} 
                            />
                            <Select 
                                label="產品定義 (Logic Guard)" 
                                options={PRODUCT_TYPES} 
                                value={params.productType} 
                                onChange={e => setParams(p => ({...p, productType: e.target.value as any}))} 
                            />
                            <div>
                                <label className="block text-[10px] font-bold text-[var(--color-text-dim)] mb-2 uppercase tracking-[0.1em]">額外敘事細節 (Optional)</label>
                                <textarea 
                                    value={params.customInstruction || ''}
                                    onChange={e => setParams(p => ({...p, customInstruction: e.target.value}))}
                                    placeholder="例如：強調縫線交界處的焊接光芒..."
                                    className="w-full bg-[var(--color-bg-input)] border-b border-[var(--color-border)] p-2 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-gold)]"
                                    rows={2}
                                />
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <h3 className="text-xl font-bold text-[var(--color-text-title)] mb-4">3. 生成設定</h3>
                        <Select 
                            label="渲染等級" 
                            options={[{value: 'standard', label: '標準敘事 (Flash)'}, {value: 'high', label: '極致細節 (Pro 4K)'}]} 
                            value={params.quality} 
                            onChange={e => setParams(p => ({...p, quality: e.target.value as any}))} 
                        />
                    </Card>

                    <Button 
                        onClick={handleGenerate} 
                        isLoading={isLoading} 
                        disabled={!image || !analysis} 
                        className="w-full text-xl py-4"
                    >
                        生成敘事場景
                    </Button>
                </div>

                {/* Right: Preview Area */}
                <div className="lg:col-span-8">
                    <Card className="h-full min-h-[70vh] flex flex-col items-center justify-center bg-[var(--color-bg-deep)] relative overflow-hidden">
                        {resultUrl ? (
                            <div className="w-full h-full flex flex-col items-center">
                                <div className="flex-grow w-full flex items-center justify-center p-4">
                                    <img 
                                        src={resultUrl} 
                                        alt="MacroCraft Result" 
                                        className="max-h-full max-w-full object-contain rounded-lg shadow-2xl" 
                                    />
                                </div>
                                <div className="w-full p-4 flex justify-center gap-4 bg-[var(--color-bg-surface)]/50 backdrop-blur-md">
                                    <Button onClick={() => setPreviewImage(resultUrl)} variant="secondary" className="flex items-center gap-2">
                                        <ExpandIcon className="w-4 h-4" /> 全螢幕預覽
                                    </Button>
                                    <Button onClick={() => downloadImage(resultUrl, `macro_craft_${Date.now()}.jpg`, 'MacroCraft')} variant="secondary" className="flex items-center gap-2">
                                        <DownloadIcon className="w-4 h-4" /> 下載高畫質
                                    </Button>
                                    <Button onClick={handleSave} variant="light">
                                        儲存至作品集
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-[var(--color-text-dim)] opacity-60">
                                <MacroCraftIcon className="w-32 h-32 mx-auto mb-4 text-[var(--color-text-dim)]" />
                                <p className="text-2xl font-display uppercase tracking-widest italic text-[var(--color-text-title)]">Narrative Studio Initializing</p>
                                <p className="text-sm mt-2 font-sans tracking-widest text-[var(--color-text-main)]">請完成左側設定並點擊「生成敘事場景」</p>
                            </div>
                        )}
                        
                        <div className="absolute top-4 left-4 text-[10px] font-mono text-[var(--color-text-main)] uppercase tracking-widest bg-black/60 px-3 py-1 rounded-full border border-[var(--color-border)]">
                            Engine: MacroCraft Core v1.0 // Pavora Lab
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MacroCraftStudio;
