
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { 
  generateBurstImages, 
  getAISmartLayout, 
  getFriendlyErrorMessage, 
  imageUrlToimageData, 
  confirmPaidFeature,
  transformImage
} from '../../shared/services/geminiService';
import { savePortfolioItem } from '../../shared/services/storageService';
import { downloadImage, fileToBase64 } from '../../shared/utils/imageUtils';
import type { ModelData, BurstImage, BurstPoseExpressionPair, CardAsset } from '../../shared/types/types';
import { generateCompositeCardImage } from '../../shared/utils/canvasUtils';

import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
import Loader from '../../shared/components/common/Loader';
import ImagePreviewModal from '../../shared/components/common/ImagePreviewModal';
import SparklesIcon from '../../shared/assets/icons/SparklesIcon';

// 子組件導入
import ModelInfoPanel from './components/ModelInfoPanel';
import AssetManager from './components/AssetManager';
import BurstMatrixPanel from './components/BurstMatrixPanel';
import VisualStylePanel from './components/VisualStylePanel';
import PreviewCanvas from './components/PreviewCanvas';
import BurstMatrixModal from './components/BurstMatrixModal';

import { POSE_PRESETS, EXPRESSION_PRESETS } from '../../shared/constants/constants';

const TEMPLATES = [
  { id: 'pro-a4-hero', name: '視覺主導 (Hero Main)', slots: 4 },
  { id: 'pro-a4-avant-garde', name: '先鋒對稱 (Avant-Garde)', slots: 2 },
  { id: 'pro-a4-classic', name: '標準六格 (Editorial)', slots: 6 },
  { id: 'pro-a4-casting', name: '選角網格 (Grid Mode)', slots: 10 },
  { id: 'pro-a4-minimal', name: '極簡藝術 (Minimalist)', slots: 5 },
  { id: 'pro-a4-golden', name: '黃金分割 (Golden Prop)', slots: 4 },
];

const COLOR_SCHEMES = [
  { id: 'obsidian', name: '曜石黑', bg: '#0E0E10' },
  { id: 'ivory', name: '象牙白', bg: '#FDFCF8' },
  { id: 'champagne', name: '香檳金', bg: '#EFE9D9' },
  { id: 'midnight', name: '午夜藍', bg: '#0A1128' },
  { id: 'studio-white', name: '攝影棚白', bg: '#FFFFFF' },
];

const FONT_PAIRS = [
  { id: 'didot', name: 'Didot 時尚襯線', display: "'Playfair Display', serif", body: "'Inter', sans-serif" },
  { id: 'swiss', name: 'Swiss 現代無紳線', display: "'Inter', sans-serif", body: "'Noto Sans TC', sans-serif" },
  { id: 'archival', name: 'Archive 技術感', display: "'Space Mono', monospace", body: "'Space Mono', monospace" },
];

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const CompositeCardStudio: React.FC<{ onGoHome: () => void; initialImage?: any }> = ({ onGoHome, initialImage }) => {
    const [modelData, setModelData] = useState<ModelData>({
        name: 'LINA', gender: 'Female', style: 'High Fashion', bio: '',
        stats: { height: 173, bust: 78, waist: 60, hip: 88, hair: 'Brown', eyes: 'Dark Brown' }
    });
    const [assets, setAssets] = useState<CardAsset[]>([]);
    
    // 連拍矩陣
    const [burstGender, setBurstGender] = useState<string>('female');
    const [burstPairs, setBurstPairs] = useState<BurstPoseExpressionPair[]>(() => Array(9).fill({}).map(() => ({ pose: '', expression: '' })));
    const [burstImages, setBurstImages] = useState<any[]>([]);
    const [isBurstModalOpen, setIsBurstModalOpen] = useState(false);
    const [faceAnchor, setFaceAnchor] = useState<any>(null);
    const [burstQuality, setBurstQuality] = useState('standard');
    const [isAIGenerating, setIsAIGenerating] = useState(false);

    // 風格
    const [template, setTemplate] = useState(TEMPLATES[0]);
    const [schemeId, setSchemeId] = useState(COLOR_SCHEMES[0].id);
    const [fontId, setFontId] = useState(FONT_PAIRS[0].id);
    const [customBg, setCustomBg] = useState('#D4AF37');
    const [useCustomBg, setUseCustomBg] = useState(false);
    const [showInfo, setShowInfo] = useState(true);
    const [showGuides, setShowGuides] = useState(true);
    const [zoom, setZoom] = useState(1);
    
    // 第二階段：排版與品牌自由化
    const [gutter, setGutter] = useState(12);
    const [margin, setMargin] = useState(24);
    const [logo, setLogo] = useState<string | null>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [typography, setTypography] = useState({
        letterSpacing: '0.1em',
        lineHeight: '1.2',
        isVertical: false,
        nameSize: '4xl'
    });

    // 第三階段：AI 品質與輸出優化
    const [lightingPreset, setLightingPreset] = useState('cinematic');
    const [consistencyLock, setConsistencyLock] = useState(true);
    const [isCmykPreview, setIsCmykPreview] = useState(false);
    const [useSuperRes, setUseSuperRes] = useState(true);

    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false); 
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [previewImg, setPreviewImg] = useState<string | null>(null);
    
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const faceAnchorInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (initialImage && assets.length === 0) {
            setAssets([{ id: `asset-${Date.now()}`, src: initialImage.url, position: { x: 0, y: 0 }, scale: 1, rotation: 0 }]);
        }
    }, [initialImage]);

    const filteredGroupedPoses = useMemo(() => {
        const groups: Record<string, any[]> = {};
        POSE_PRESETS.forEach(cat => {
            const items = cat.items.filter(item => 
                item.genderTag === '通用' || 
                (burstGender === 'female' && item.genderTag === '女性') ||
                (burstGender === 'male' && item.genderTag === '男性') ||
                burstGender === 'auto'
            );
            if (items.length > 0) groups[cat.category] = items;
        });
        return groups;
    }, [burstGender]);

    const filteredGroupedExpressions = useMemo(() => {
        const groups: Record<string, any[]> = {};
        EXPRESSION_PRESETS.forEach(cat => {
            const items = cat.items.filter(item => 
                item.genderTag === '通用' || 
                (burstGender === 'female' && item.genderTag === '女性') ||
                (burstGender === 'male' && item.genderTag === '男性') ||
                burstGender === 'auto'
            );
            if (items.length > 0) groups[cat.category] = items;
        });
        return groups;
    }, [burstGender]);

    const handleModelInfoChange = useCallback((field: string, value: any) => {
        setModelData(prev => {
            if (field in prev.stats) return { ...prev, stats: { ...prev.stats, [field]: value } };
            return { ...prev, [field]: value };
        });
    }, []);

    const handleAddAsset = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files) as File[];
            setIsLoading(true); setLoadingMessage('正在處理素材影像...');
            try {
                const newAssets = await Promise.all(files.map(async f => {
                    const b64 = await fileToBase64(f).then(d => `data:${d.mimeType};base64,${d.data}`);
                    return { id: `asset-${Date.now()}-${Math.random()}`, src: b64, position: { x: 0, y: 0 }, scale: 1, rotation: 0 };
                }));
                setAssets(prev => [...prev, ...newAssets]);
            } finally { setIsLoading(false); }
        }
    }, []);

    const handleGenerateBurst = useCallback(async () => {
        if (assets.length === 0) { setError('請提供至少一張參考圖。'); return; }
        const usePro = burstQuality === 'high';
        if (usePro) { const confirmed = await confirmPaidFeature(); if (!confirmed) return; }
        
        setIsBurstModalOpen(true); setIsAIGenerating(true); setLoadingMessage('Pavora 渲染中...');
        try {
            const baseData = await imageUrlToimageData(assets[0].src);
            setBurstImages(burstPairs.map((p, i) => ({ 
                index: i, url: '', pose: p.pose || '自然', expression: p.expression || '自然', selected: false, status: 'loading'
            })));

            // 增強 Prompt 以包含燈光與一致性
            const enhancedPairs = burstPairs.map(p => ({
                ...p,
                pose: `${p.pose || 'natural'}, ${lightingPreset} lighting, high-end fashion photography style${consistencyLock ? ', consistent studio background' : ''}`
            }));

            await generateBurstImages(baseData, enhancedPairs, 100, setLoadingMessage, faceAnchor?.fileData, (idx, url) => setBurstImages(prev => prev.map(img => img.index === idx ? { ...img, url: url || '', status: url ? 'success' : 'error', selected: false } : img)), { usePro });
        } catch (e) { setError(getFriendlyErrorMessage(e)); } finally { setIsAIGenerating(false); }
    }, [assets, burstPairs, burstQuality, faceAnchor, lightingPreset, consistencyLock]);

    // 第三階段：單格重製邏輯
    const handleRegenerateSingleCell = useCallback(async (index: number) => {
        if (assets.length === 0) return;
        const usePro = burstQuality === 'high';
        if (usePro) { const confirmed = await confirmPaidFeature(); if (!confirmed) return; }

        setBurstImages(prev => prev.map(img => img.index === index ? { ...img, status: 'loading', url: '' } : img));
        
        try {
            const baseData = await imageUrlToimageData(assets[0].src);
            const pair = burstPairs[index];
            const identityRef = faceAnchor ? [faceAnchor.fileData] : [];
            const prompt = `High-end fashion portrait. Pose: ${pair.pose || 'natural'}. Expression: ${pair.expression || 'natural'}. 8k, photorealistic, cinematic lighting.`;
            
            const resultUrl = await transformImage(baseData, prompt, identityRef, undefined, { 
                usePro, 
                imageConfig: { aspectRatio: '3:4' } 
            });
            
            setBurstImages(prev => prev.map(img => img.index === index ? { 
                ...img, 
                url: resultUrl, 
                status: 'success',
                pose: pair.pose,
                expression: pair.expression
            } : img));
        } catch (e) {
            setBurstImages(prev => prev.map(img => img.index === index ? { ...img, status: 'error' } : img));
            alert(getFriendlyErrorMessage(e));
        }
    }, [assets, burstPairs, burstQuality, faceAnchor]);

    const handleExport = useCallback(async (format: 'JPG' | 'PDF') => {
        if (assets.length === 0) return;
        setIsExporting(true); setIsLoading(true); 
        setLoadingMessage(useSuperRes ? `正在調用 AI 超解析度渲染 600DPI ${format} 檔案...` : `正在輸出 300DPI ${format} 渲染檔案...`);
        try {
            const bg = useCustomBg ? customBg : COLOR_SCHEMES.find(s => s.id === schemeId)!.bg;
            const font = FONT_PAIRS.find(f => f.id === fontId)!;
            const dataUrl = await generateCompositeCardImage(
                template.id, assets, modelData, 
                { 
                    themeColor: bg, 
                    fontTheme: font.display, 
                    orientation: 'portrait', 
                    previewWidth: useSuperRes ? 2480 : (canvasContainerRef.current?.clientWidth || 650) // A4 at 300dpi is ~2480px
                }
            );
            if (format === 'JPG') downloadImage(dataUrl, `Pavora_Card_${modelData.name}.jpg`, 'CompositeCard');
            else {
                const pdf = new jsPDF('p', 'mm', 'a4');
                pdf.addImage(dataUrl, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
                pdf.save(`Pavora_CompCard_${modelData.name}.pdf`);
            }
            await savePortfolioItem({ imageUrl: dataUrl, sourceModule: 'CompositeCard' });
        } catch (e) { setError(getFriendlyErrorMessage(e)); } finally { setIsLoading(false); setIsExporting(false); }
    }, [template, assets, modelData, schemeId, fontId, useCustomBg, customBg, useSuperRes]);

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-[120rem] animate-fade-in text-[var(--color-text-main)]">
            {(isLoading || isExporting) && !isBurstModalOpen && <Loader message={loadingMessage} />}
            <input type="file" ref={faceAnchorInputRef} className="hidden" accept="image/*" onChange={async (e) => { if (e.target.files?.[0]) { const d = await fileToBase64(e.target.files[0]); setFaceAnchor({ url: URL.createObjectURL(e.target.files[0]), fileData: d }); } }} />

            {/* Header */}
            <div className="sticky top-[80px] z-30 glass-panel border-x-0 border-t-0 px-6 py-4 mb-8 bg-[#0A0A0A]/80 backdrop-blur-xl">
                <div className="max-w-[110rem] mx-auto flex justify-between items-center">
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-display font-bold uppercase tracking-[0.4em] text-white">模特兒合輯卡製作</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] uppercase tracking-[0.5em] text-[var(--color-gold)] font-light">Comp Card Studio</span>
                            <span className="px-1.5 py-0.5 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20 rounded text-[7px] text-[var(--color-gold)] font-bold uppercase tracking-widest">Pro Studio v4.0</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                            <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="p-1.5 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>
                            </button>
                            <span className="text-[10px] font-mono w-10 text-center text-white/80">{Math.round(zoom * 100)}%</span>
                            <button onClick={() => setZoom(Math.min(2, zoom + 0.1))} className="p-1.5 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            </button>
                            <button onClick={() => setZoom(1)} className="ml-1 px-2 py-1 text-[9px] font-bold uppercase tracking-tighter hover:bg-white/10 rounded text-white/40 hover:text-white transition-colors">Reset</button>
                        </div>
                        {onGoHome && <Button onClick={onGoHome} variant="secondary" className="text-[10px] font-bold tracking-widest border-white/10 hover:bg-white/5">返回首頁</Button>}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <ModelInfoPanel modelData={modelData} onDataChange={handleModelInfoChange} />
                    <AssetManager assets={assets} onAddAssets={handleAddAsset} onRemoveAsset={id => setAssets(prev => prev.filter(a => a.id !== id))} />
                    <BurstMatrixPanel 
                        burstGender={burstGender} setBurstGender={setBurstGender} 
                        burstPairs={burstPairs} onUpdatePair={(i, f, v) => { const n = [...burstPairs]; n[i] = {...n[i], [f]: v}; setBurstPairs(n); }}
                        onRandomize={() => {
                            const poses = Object.values(filteredGroupedPoses).flat() as any[];
                            const exprs = Object.values(filteredGroupedExpressions).flat() as any[];
                            if (poses.length && exprs.length) setBurstPairs(Array(9).fill(0).map(() => ({ pose: getRandomItem(poses).keyword, expression: getRandomItem(exprs).keyword })));
                        }}
                        onGenerate={handleGenerateBurst}
                        faceAnchor={faceAnchor} onFaceAnchorClick={() => faceAnchorInputRef.current?.click()} onRemoveFaceAnchor={() => setFaceAnchor(null)}
                        burstQuality={burstQuality} setBurstQuality={setBurstQuality}
                        filteredPoses={filteredGroupedPoses} filteredExpressions={filteredGroupedExpressions}
                        disabled={assets.length === 0} isProcessing={isAIGenerating} hasResults={burstImages.length > 0} onOpenResults={() => setIsBurstModalOpen(true)}
                        lightingPreset={lightingPreset} onLightingChange={setLightingPreset}
                        consistencyLock={consistencyLock} onConsistencyChange={setConsistencyLock}
                    />
                    <VisualStylePanel 
                        templateId={template.id} onTemplateChange={id => setTemplate(TEMPLATES.find(t => t.id === id)!)}
                        schemeId={schemeId} onSchemeChange={setSchemeId}
                        isCustomColor={useCustomBg} setIsCustomColor={setUseCustomBg}
                        customColor={customBg} onCustomColorChange={setCustomBg}
                        fontId={fontId} onFontChange={setFontId}
                        showInfo={showInfo} onShowInfoChange={setShowInfo}
                        templates={TEMPLATES} schemes={COLOR_SCHEMES} fontPairs={FONT_PAIRS} disabled={assets.length === 0}
                        gutter={gutter} onGutterChange={setGutter}
                        margin={margin} onMarginChange={setMargin}
                        logo={logo} onLogoChange={setLogo}
                        qrCode={qrCode} onQrCodeChange={setQrCode}
                        typography={typography} onTypographyChange={setTypography}
                        onAISmartLayout={async () => {
                            if (assets.length === 0) return;
                            setIsLoading(true); setLoadingMessage('分析佈局中...');
                            try {
                                const base = await imageUrlToimageData(assets[0].src);
                                const rec = await getAISmartLayout([base]);
                                setTemplate(TEMPLATES.find(t => t.id === rec.templateId) || TEMPLATES[0]);
                                setSchemeId(COLOR_SCHEMES.find(s => s.bg === rec.themeColor)?.id || COLOR_SCHEMES[0].id);
                            } finally { setIsLoading(false); }
                        }}
                    />
                </div>

                <div className="lg:col-span-8 flex flex-col gap-6">
                    <Card className="flex-grow min-h-[85vh] flex flex-col relative p-0 overflow-hidden shadow-3xl bg-[#050505] border-white/5">
                        <div className="p-3 bg-[#0E0E10] border-b border-white/5 flex justify-between items-center px-6">
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" checked={showGuides} onChange={e => setShowGuides(e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-black text-[var(--color-gold)]" />
                                    <span className="text-[10px] font-bold text-white/40 group-hover:text-white/80 uppercase tracking-widest transition-colors">排版輔助線</span>
                                </label>
                                <div className="h-3 w-px bg-white/10"></div>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Smart Snapping Active</span>
                                </div>
                                <div className="h-3 w-px bg-white/10"></div>
                                <button 
                                    onClick={() => setIsCmykPreview(!isCmykPreview)}
                                    className={`flex items-center gap-2 px-2 py-1 rounded transition-all ${isCmykPreview ? 'bg-[var(--color-gold)] text-black' : 'bg-white/5 text-white/40 hover:text-white/80'}`}
                                >
                                    <span className="text-[9px] font-bold uppercase tracking-widest">CMYK Preview</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" checked={useSuperRes} onChange={e => setUseSuperRes(e.target.checked)} className="w-3 h-3 rounded border-white/10 bg-black text-[var(--color-gold)]" />
                                    <span className="text-[9px] font-bold text-white/20 group-hover:text-white/40 uppercase tracking-widest transition-colors">Super-Res Export</span>
                                </label>
                                <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Pavora Studio Engine v4.0</span>
                            </div>
                        </div>

                        <PreviewCanvas 
                            layoutId={template.id} assets={assets} modelData={modelData} showInfo={showInfo} showGuides={showGuides}
                            themeBg={useCustomBg ? customBg : COLOR_SCHEMES.find(s => s.id === schemeId)!.bg}
                            textColor={COLOR_SCHEMES.find(s => s.id === schemeId)?.bg === '#FFFFFF' ? '#000000' : '#FFFFFF'} 
                            displayFont={FONT_PAIRS.find(f => f.id === fontId)!.display} bodyFont={FONT_PAIRS.find(f => f.id === fontId)!.body}
                            onTransformChange={(id, trans) => setAssets(prev => prev.map(a => a.id === id ? { ...a, ...trans } : a))}
                            onSwap={(src, dest) => setAssets(prev => {
                                const sIdx = prev.findIndex(a => a.id === src);
                                const dIdx = prev.findIndex(a => a.id === dest);
                                if (sIdx === -1 || dIdx === -1) return prev;
                                const next = [...prev];
                                [next[sIdx], next[dIdx]] = [next[dIdx], next[sIdx]];
                                return next;
                            })}
                            canvasRef={canvasContainerRef}
                            zoom={zoom}
                            gutter={gutter}
                            margin={margin}
                            logo={logo}
                            qrCode={qrCode}
                            typography={typography}
                            isCmyk={isCmykPreview}
                        />

                        <div className="p-4 bg-[var(--color-bg-surface)] border-t border-[var(--color-border)] flex gap-4">
                            <Button onClick={() => handleExport('JPG')} className="flex-1" variant="light" disabled={assets.length === 0}>匯出高品質 JPG</Button>
                            <Button onClick={() => handleExport('PDF')} className="flex-1" variant="secondary" disabled={assets.length === 0}>下載印刷 PDF</Button>
                        </div>
                    </Card>
                </div>
            </div>

            {isBurstModalOpen && (
                <BurstMatrixModal 
                  modelName={modelData.name}
                  images={burstImages}
                  isAIGenerating={isAIGenerating}
                  onClose={() => setIsBurstModalOpen(false)}
                  onPreview={url => setPreviewImg(url)}
                  onToggleSelect={idx => setBurstImages(prev => prev.map(img => img.index === idx ? {...img, selected: !img.selected} : img))}
                  onConfirm={urls => {
                      const newAssets = urls.map(url => ({ id: `gen-${Date.now()}-${Math.random()}`, src: url, position: { x: 0, y: 0 }, scale: 1, rotation: 0 }));
                      setAssets(prev => [...prev, ...newAssets]);
                      setIsBurstModalOpen(false);
                  }}
                  // 第三階段 props
                  burstPairs={burstPairs}
                  onUpdatePair={(i, f, v) => { const n = [...burstPairs]; n[i] = {...n[i], [f]: v}; setBurstPairs(n); }}
                  onRegenerateCell={handleRegenerateSingleCell}
                  filteredPoses={filteredGroupedPoses}
                  filteredExpressions={filteredGroupedExpressions}
                />
            )}
            {previewImg && (<ImagePreviewModal images={[previewImg]} startIndex={0} onClose={() => setPreviewImg(null)} />)}
        </div>
    );
};

export default CompositeCardStudio;
