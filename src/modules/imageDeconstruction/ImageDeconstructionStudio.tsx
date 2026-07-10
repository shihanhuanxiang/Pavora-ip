
import React, { useState, useRef, useEffect } from 'react';
import { analyzeImageForPrompt, extractAssetsFromImage, fileToBase64, getFriendlyErrorMessage, generateImageAsset } from '../../shared/services/geminiService';
import { saveMultipleApparel, saveApparel } from '../../shared/services/storageService';
import { downloadImage } from '../../shared/utils/imageUtils';
import type { DeconstructedPrompt, ExtractedAsset, StoredApparelItem } from '../../shared/types/types';
import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
import Loader from '../../shared/components/common/Loader';
import PhotoIcon from '../../shared/assets/icons/PhotoIcon';
import DeconstructIcon from '../../shared/assets/icons/DeconstructIcon';
import DownloadIcon from '../../shared/assets/icons/DownloadIcon';
import SparklesIcon from '../../shared/assets/icons/SparklesIcon';
import ImagePreviewModal from '../../shared/components/common/ImagePreviewModal';
import Select from '../../shared/components/common/Select';

interface ImageDeconstructionStudioProps {
  onGoBack: () => void;
  onGoHome: () => void;
}

type QualityLevel = 'standard' | 'high';

const ImageDeconstructionStudio: React.FC<ImageDeconstructionStudioProps> = ({ onGoBack, onGoHome }) => {
    const [image, setImage] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(null);
    const [promptResult, setPromptResult] = useState<DeconstructedPrompt | null>(null);
    const [assetResult, setAssetResult] = useState<{ assets: ExtractedAsset[], notes: any, spriteUrl: string | null } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
    const [previewingAsset, setPreviewingAsset] = useState<{ assets: ExtractedAsset[], startIndex: number } | null>(null);
    const [customTarget, setCustomTarget] = useState('');
    const [quality, setQuality] = useState<QualityLevel>('standard');
    const [reimaginedImage, setReimaginedImage] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsLoading(true); setLoadingMessage('正在載入圖片...');
            try {
                const fileData = await fileToBase64(file);
                setImage({ url: URL.createObjectURL(file), fileData });
                setPromptResult(null); setAssetResult(null); setReimaginedImage(null); setSelectedAssets(new Set());
            } catch (err) { setError(getFriendlyErrorMessage(err)); }
            finally { setIsLoading(false); }
        }
    };

    const handleAnalyzePrompt = async () => {
        if (!image) return;
        setIsLoading(true); setLoadingMessage('正在進行詠唱分析...'); setError(null);
        setReimaginedImage(null);
        try {
            const result = await analyzeImageForPrompt(image.fileData);
            setPromptResult(result); setAssetResult(null); setSelectedAssets(new Set());
        } catch (err) { setError(getFriendlyErrorMessage(err)); }
        finally { setIsLoading(false); }
    };
    
    const handleExtractAssets = async () => {
        if (!image) return;
        setIsLoading(true); setLoadingMessage('提取中...'); setError(null);
        setReimaginedImage(null);
        try {
            // 修正：傳遞品質參數
            const result = await extractAssetsFromImage(image.fileData, { oneClick: true, portraitHead: true, usePro: quality === 'high' }, setLoadingMessage);
            setAssetResult(result); setPromptResult(null); setSelectedAssets(new Set());
        } catch (err) { setError(getFriendlyErrorMessage(err)); }
        finally { setIsLoading(false); }
    };
    
    const handleCustomExtract = async () => {
        if (!image || !customTarget.trim()) return;
        setIsLoading(true); setLoadingMessage('自訂提取中...'); setError(null);
        setReimaginedImage(null);
        try {
            const result = await extractAssetsFromImage(image.fileData, { oneClick: false, target: customTarget, portraitHead: false, usePro: quality === 'high' }, setLoadingMessage);
            setAssetResult(result); setPromptResult(null); setSelectedAssets(new Set());
        } catch (err) { setError(getFriendlyErrorMessage(err)); }
        finally { setIsLoading(false); }
    };

    const handleSaveAssets = () => {
        if (!assetResult) return;
        const newItems: StoredApparelItem[] = assetResult.assets.map(asset => ({ id: `apparel-${Date.now()}-${Math.random()}`, name: asset.name_zh || asset.name, imageUrl: asset.pngTransparentUrl, category: 'extracted' }));
        saveMultipleApparel(newItems);
        
        // Also save to portfolio and download
        assetResult.assets.forEach(asset => {
            downloadImage(asset.pngTransparentUrl, `${asset.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`, 'ImageDeconstruction');
        });
        
        alert(`已儲存 ${newItems.length} 件物品至個人衣櫥，並同步至作品集與下載。`);
    };
    
    const handleDownloadAsset = (asset: ExtractedAsset) => { downloadImage(asset.pngTransparentUrl, `${asset.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`, 'ImageDeconstruction'); };
    const handleDownloadSelected = () => {
        if (selectedAssets.size === 0 || !assetResult) return;
        const assetsToDownload = assetResult.assets.filter(asset => selectedAssets.has(asset.id));
        assetsToDownload.forEach((asset, index) => { setTimeout(() => handleDownloadAsset(asset), index * 300); });
    };

    const handleGenerateReimagined = async (prompt: string) => {
        setIsLoading(true); setLoadingMessage('正在依照提示詞重繪...'); setError(null);
        try {
            const url = await generateImageAsset(prompt, '3:4');
            setReimaginedImage(url);
        } catch (err) { setError(getFriendlyErrorMessage(err)); } finally { setIsLoading(false); }
    };

    const handleSaveReimagined = () => {
        if (!reimaginedImage) return;
        const newItem: StoredApparelItem = { id: `reimagined-${Date.now()}`, name: `AI Reimagined Look`, imageUrl: reimaginedImage, category: 'generated' };
        saveApparel(newItem);
        downloadImage(reimaginedImage, 'reimagined.jpg', 'ImageDeconstruction');
        alert('已成功儲存並下載至衣櫥與作品集！');
    };

    return (
        <div className="container mx-auto p-8 max-w-7xl animate-fade-in">
            {isLoading && <Loader message={loadingMessage} />}
            {previewingAsset && ( <ImagePreviewModal images={previewingAsset.assets.map(a => a.pngTransparentUrl)} startIndex={previewingAsset.startIndex} onClose={() => setPreviewingAsset(null)} actions={ <Button onClick={() => handleDownloadAsset(previewingAsset.assets[previewingAsset.startIndex])}> <DownloadIcon className="w-5 h-5 mr-2" /> 下載此素材 </Button> } /> )}
            {reimaginedImage && ( <ImagePreviewModal images={[reimaginedImage]} startIndex={0} onClose={() => {}} actions={ <> <Button onClick={() => setReimaginedImage(null)} variant="secondary">關閉</Button> <Button onClick={handleSaveReimagined} variant="secondary">儲存至衣櫥</Button> <Button onClick={() => downloadImage(reimaginedImage, 'reimagined.jpg', 'ImageDeconstruction')}>下載圖片</Button> </> } /> )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            {/* Header */}
            <div className="sticky top-[80px] z-30 glass-panel border-x-0 border-t-0 px-6 py-4 mb-8">
                <div className="max-w-[110rem] mx-auto flex justify-between items-center">
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-display font-bold uppercase tracking-[0.3em] text-[var(--color-text-main)]">影像解構</h2>
                        <span className="text-[9px] uppercase tracking-[0.5em] text-[var(--color-gold)] font-light">Image Deconstruction Studio</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {onGoHome && <Button onClick={onGoHome} variant="secondary" className="text-[10px] font-bold tracking-widest">返回首頁</Button>}
                    </div>
                </div>
            </div>
            {error && <div className="text-center text-red-500 p-3 bg-red-900/20 rounded-md mb-6">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div><Card className="h-full p-0 overflow-hidden">
                    <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]/50 flex justify-between items-center">
                        <div className="flex flex-col">
                            <h3 className="text-xl font-display font-bold uppercase tracking-[0.2em] text-[var(--color-text-title)]">上傳圖片</h3>
                            <span className="text-[9px] uppercase tracking-[0.4em] text-[var(--color-gold)] font-light">Step 1 // Upload Source</span>
                        </div>
                    </div>
                    <div className="p-6">
                        {image ? ( <div className="relative group w-full"><img src={image.url} alt="Input" className="w-full max-h-[60vh] object-contain rounded-md" /><div className="absolute inset-0 bg-[var(--color-bg-deep)]/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2"><Button onClick={() => fileInputRef.current?.click()}>更換圖片</Button></div></div> ) : ( <div onClick={() => fileInputRef.current?.click()} className="w-full bg-[var(--color-bg-input)]/50 border-2 border-dashed border-[var(--color-border)] rounded-lg p-16 text-center cursor-pointer hover:border-[var(--color-gold)] flex flex-col items-center justify-center"><PhotoIcon className="w-16 h-16 text-[var(--color-text-dim)] mb-4" /><p className="text-lg text-[var(--color-text-dim)]">點擊上傳圖片</p></div> )}
                        {image && (<div className="mt-4 space-y-4">
                            <Button onClick={handleAnalyzePrompt} disabled={isLoading} className="text-lg py-3 w-full"><DeconstructIcon className="w-6 h-6 mr-2" />詠唱分析 (Prompt Analysis)</Button>
                            <div className="p-4 bg-[var(--color-bg-surface)] rounded-lg border border-[var(--color-border)]">
                                <div className="flex justify-between items-center mb-4"><h4 className="text-sm font-bold text-[var(--color-gold)] uppercase tracking-widest">提取設定</h4><Select label="" options={[{value: 'standard', label: '標準 (Flash)'}, {value: 'high', label: '高品質 (Pro) [付費]'}]} value={quality} onChange={e => setQuality(e.target.value as any)} /></div>
                                <Button onClick={handleExtractAssets} disabled={isLoading} className="text-lg py-3 w-full mb-4"><SparklesIcon className="w-6 h-6 mr-2" />一鍵智慧提取 (Asset Extraction)</Button>
                                <div className="border-t border-[var(--color-border)] pt-4"><label className="text-xs font-bold text-[var(--color-text-dim)] mb-2 block uppercase tracking-widest">自訂目標提取</label><div className="flex gap-2"><input type="text" value={customTarget} onChange={e => setCustomTarget(e.target.value)} placeholder="例如：提取圖片中的上衣" className="w-full bg-[var(--color-bg-input)] p-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-[var(--color-gold)]" /><Button onClick={handleCustomExtract} disabled={isLoading || !customTarget.trim()}>提取</Button></div></div>
                            </div>
                        </div>)}
                    </div>
                </Card></div>
                <div><Card className="h-full p-0 overflow-hidden">
                    <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]/50 flex justify-between items-center">
                        <div className="flex flex-col">
                            <h3 className="text-xl font-display font-bold uppercase tracking-[0.2em] text-[var(--color-text-title)]">解構結果</h3>
                            <span className="text-[9px] uppercase tracking-[0.4em] text-[var(--color-gold)] font-light">Step 2 // Analysis Results</span>
                        </div>
                    </div>
                    <div className="p-6 h-full max-h-[70vh] overflow-y-auto">
                        {promptResult && <PromptResultDisplay result={promptResult} onGenerate={handleGenerateReimagined} isLoading={isLoading} />}
                        {assetResult && <AssetResultDisplay result={assetResult} onSave={handleSaveAssets} onDownload={handleDownloadAsset} selectedAssets={selectedAssets} onToggleSelect={id => setSelectedAssets(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; })} onSelectAll={() => { if (assetResult && selectedAssets.size === assetResult.assets.length) setSelectedAssets(new Set()); else setSelectedAssets(new Set(assetResult.assets.map(a => a.id))); }} onDownloadSelected={handleDownloadSelected} onPreview={id => { const start = assetResult.assets.findIndex(a => id === a.id); if (start !== -1) setPreviewingAsset({ assets: assetResult.assets, startIndex: start }); }} />}
                        {!promptResult && !assetResult && <div className="text-center text-[var(--color-text-dim)] pt-16">分析結果將顯示於此</div>}
                    </div>
                </Card></div>
            </div>
        </div>
    );
};

const PromptResultDisplay: React.FC<{ result: DeconstructedPrompt; onGenerate: (prompt: string) => void; isLoading: boolean; }> = ({ result, onGenerate, isLoading }) => {
    const [editablePrompt, setEditablePrompt] = useState(result.prompt_en);
    useEffect(() => { setEditablePrompt(result.prompt_en); }, [result]);
    return ( <div className="space-y-4 text-sm"><div><div className="flex justify-between items-center mb-1"><h4 className="font-semibold text-[var(--color-text-main)]">英文提示詞 (可編輯)</h4><span className="text-[10px] text-[var(--color-text-dim)]">修改下方文字以重繪</span></div><textarea value={editablePrompt} onChange={(e) => setEditablePrompt(e.target.value)} className="w-full bg-[var(--color-bg-input)] p-2 rounded text-xs border border-[var(--color-border)] focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] transition-all text-[var(--color-text-title)]" rows={6} /><Button onClick={() => onGenerate(editablePrompt)} disabled={isLoading || !editablePrompt.trim()} className="w-full mt-2" variant="secondary"><SparklesIcon className="w-4 h-4 mr-2" />使用此提示詞重繪 (Reimagine)</Button></div><div><h4 className="font-semibold text-[var(--color-text-main)]">中文提示詞</h4><textarea readOnly value={result.prompt_zh} className="w-full bg-[var(--color-bg-input)] p-2 rounded mt-1 text-xs text-[var(--color-text-title)]" rows={4} /></div>{result.spec.style_tags && result.spec.style_tags.length > 0 && ( <div><h4 className="font-semibold text-[var(--color-text-main)]">風格標籤</h4><div className="flex flex-wrap gap-2 mt-1">{result.spec.style_tags.map(tag => <span key={tag} className="bg-[var(--color-bg-input)] px-2 py-1 rounded-full text-xs text-[var(--color-text-title)]">{tag}</span>)}</div></div> )}{result.spec.color_palette && result.spec.color_palette.length > 0 && ( <div><h4 className="font-semibold text-[var(--color-text-main)]">主要色盤</h4><div className="flex flex-wrap gap-2 mt-1">{result.spec.color_palette.map(color => ( <div key={color.hex} className="flex items-center gap-2 bg-[var(--color-bg-input)] px-2 py-1 rounded-full text-xs text-[var(--color-text-title)]"><div className="w-3 h-3 rounded-full border border-[var(--color-border)]" style={{ backgroundColor: color.hex }}></div><span>{color.name} ({color.hex})</span></div> ))}</div></div> )}<div><h4 className="font-semibold text-[var(--color-text-main)]">結構化分析</h4><div className="bg-[var(--color-bg-input)] p-3 rounded mt-1 space-y-2 text-xs text-[var(--color-text-title)]"><pre className="whitespace-pre-wrap font-sans">{JSON.stringify(result.spec, null, 2)}</pre></div></div></div> );
};

const AssetResultDisplay: React.FC<{ result: { assets: ExtractedAsset[], notes: any, spriteUrl: string | null }, onSave: () => void, onDownload: (asset: ExtractedAsset) => void, selectedAssets: Set<string>, onToggleSelect: (assetId: string) => void, onSelectAll: () => void, onDownloadSelected: () => void, onPreview: (assetId: string) => void, }> = ({ result, onSave, onDownload, selectedAssets, onToggleSelect, onSelectAll, onDownloadSelected, onPreview }) => {
    const allSelected = result.assets.length > 0 && selectedAssets.size === result.assets.length;
    return ( <div><div className="flex flex-wrap gap-2 mb-4"><Button onClick={onSave} className="flex-1">全部儲存至衣櫥</Button><Button onClick={onDownloadSelected} variant="secondary" className="flex-1" disabled={selectedAssets.size === 0}> <DownloadIcon className="w-5 h-5 mr-2" /> 下載已選 ({selectedAssets.size}) </Button></div><div className="flex items-center mb-4"><input type="checkbox" id="select-all-assets" className="h-4 w-4 rounded bg-[var(--color-bg-input)] border-[var(--color-border)] text-[var(--color-text-title)]" checked={allSelected} onChange={onSelectAll} /><label htmlFor="select-all-assets" className="ml-2 text-sm text-[var(--color-text-main)]">全選</label></div><div className="grid grid-cols-2 md:grid-cols-3 gap-4">{result.assets.map(asset => ( <Card key={asset.id} className="p-2 group relative" onClick={() => onPreview(asset.id)}><img src={asset.pngTransparentUrl} alt={asset.name} className="w-full h-32 object-contain rounded-md pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none'%3e%3cpath d='M0 0h16v16H0z' fill='%234a5568'/%3e%3cpath d='M16 16h16v16H16z' fill='%234a5568'/%3e%3c/svg%3e")` }} /><input type="checkbox" className="absolute top-2 left-2 h-5 w-5 rounded z-10 bg-[var(--color-bg-deep)]/40 border-[var(--color-border)]" checked={selectedAssets.has(asset.id)} onChange={(e) => onToggleSelect(asset.id)} onClick={(e) => e.stopPropagation()} /><p className="text-xs text-center mt-1 truncate pointer-events-none text-[var(--color-text-title)]" title={asset.name_zh || asset.name}>{asset.name_zh || asset.name}</p><div className="absolute inset-0 bg-[var(--color-bg-deep)]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><button onClick={(e) => { e.stopPropagation(); onDownload(asset); }} className="text-[var(--color-text-title)] p-2 bg-[var(--color-bg-deep)]/50 rounded-full"><DownloadIcon className="w-6 h-6" /></button></div></Card> ))}</div></div> );
};

export default ImageDeconstructionStudio;
