
// ... imports ...
import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { fileToBase64, getFriendlyErrorMessage, processFashionItem, refineFullBody, analyzeFashionLayout } from '../../shared/services/geminiService';
import { savePortfolioItem } from '../../shared/services/storageService';
import type { FashionItem, FashionLayoutAnalysis, FashionArchitectLayout, FashionArchitectRatio } from '../../shared/types/types';
import { generateFashionArchitectImage } from '../../shared/utils/canvasUtils';
import { downloadImage } from '../../shared/utils/imageUtils';

import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
import Loader from '../../shared/components/common/Loader';
import PhotoIcon from '../../shared/assets/icons/PhotoIcon';
import DownloadIcon from '../../shared/assets/icons/DownloadIcon';
import ArchitectIcon from '../../shared/assets/icons/ArchitectIcon';
import SparklesIcon from '../../shared/assets/icons/SparklesIcon';
import ImagePreviewModal from '../../shared/components/common/ImagePreviewModal';
import Select from '../../shared/components/common/Select';
import ExpandIcon from '../../shared/assets/icons/ExpandIcon';

interface FashionArchitectProps {
  onGoHome: () => void;
}

const FashionArchitect: React.FC<FashionArchitectProps> = ({ onGoHome }) => {
    // ... (Retain all state logic) ...
    // Inputs
    const [personImage, setPersonImage] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(null);
    const [fashionItems, setFashionItems] = useState<FashionItem[]>([]);
    const [collageTitle, setCollageTitle] = useState('Style Profile');
    const [styleNotes, setStyleNotes] = useState('');
    const [resolution, setResolution] = useState<'HD' | '2K' | '4K'>('HD');
    const [selectedMood, setSelectedMood] = useState<'AUTO' | 'MINIMAL' | 'CYBER' | 'ORGANIC'>('AUTO');
    const [selectedLayout, setSelectedLayout] = useState<FashionArchitectLayout>('CLASSIC');
    const [selectedRatio, setSelectedRatio] = useState<FashionArchitectRatio>('A4');
    const [styleReferenceImage, setStyleReferenceImage] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(null);

    // Results
    const [layoutAnalysis, setLayoutAnalysis] = useState<FashionLayoutAnalysis | null>(null);
    const [fullBodyResult, setFullBodyResult] = useState<string | null>(null);
    const [processedItems, setProcessedItems] = useState<FashionItem[]>([]); // Includes clean & macro URLs
    
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<{url: string, name: string} | null>(null);
    
    // Layout scaling & Dimensions
    const [previewScale, setPreviewScale] = useState(0.5);
    const [contentHeight, setContentHeight] = useState(1600);
    const [hoveredItemIndex, setHoveredItemIndex] = useState<number | null>(null);
    
    const personInputRef = useRef<HTMLInputElement>(null);
    const itemInputRef = useRef<HTMLInputElement>(null);
    const styleRefInputRef = useRef<HTMLInputElement>(null);
    const collageRef = useRef<HTMLDivElement>(null);

    const handlePersonChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const file = e.target.files[0];
                const fileData = await fileToBase64(file);
                setPersonImage({ url: URL.createObjectURL(file), fileData });
                // Reset results when input changes
                setLayoutAnalysis(null); 
                setFullBodyResult(null);
                setProcessedItems([]);
            } catch (err) { setError("無法讀取圖片"); }
        }
    };

    const handleStyleRefChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const file = e.target.files[0];
                const fileData = await fileToBase64(file);
                setStyleReferenceImage({ url: URL.createObjectURL(file), fileData });
            } catch (err) { setError("無法讀取參考圖"); }
        }
    };

    const handleItemsChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files) as File[];
            const newItems: FashionItem[] = [];
            
            for (const file of files) {
                const fileData = await fileToBase64(file);
                newItems.push({
                    id: `item-${Date.now()}-${Math.random()}`,
                    name: file.name.split('.')[0], // Default label
                    fileData,
                    previewUrl: URL.createObjectURL(file)
                });
            }
            setFashionItems(prev => [...prev, ...newItems]);
        }
    };

    const handleRemoveItem = (id: string) => {
        setFashionItems(prev => prev.filter(i => i.id !== id));
        setProcessedItems(prev => prev.filter(i => i.id !== id));
    };

    const handleMoveItem = (id: string, direction: 'up' | 'down') => {
        const move = (list: any[]) => {
            const index = list.findIndex(item => item.id === id);
            if (index === -1) return list;
            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= list.length) return list;
            
            const newList = [...list];
            const [movedItem] = newList.splice(index, 1);
            newList.splice(newIndex, 0, movedItem);
            return newList;
        };

        setFashionItems(prev => move(prev));
        setProcessedItems(prev => move(prev));
    };

    const handleLabelChange = (id: string, newName: string) => {
        const update = (list: any[]) => list.map(i => i.id === id ? { ...i, name: newName } : i);
        setFashionItems(prev => update(prev));
        setProcessedItems(prev => update(prev));
    };

    const handleAnalyzeLayout = async () => {
        if (!personImage) { setError("請先上傳人物照片"); return; }
        setIsLoading(true); setError(null);
        try {
            setLoadingMessage('AI 正在分析風格與配色...');
            const itemDataList = fashionItems.map(i => i.fileData);
            // Only analyze based on first 2 items to save tokens/bandwidth if list is huge
            const analysis = await analyzeFashionLayout(personImage.fileData, itemDataList.slice(0, 2));
            setLayoutAnalysis(analysis);
        } catch (err) {
            setError(getFriendlyErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleProcess = async () => {
        if (!personImage) { setError("請先上傳人物照片"); return; }
        setIsLoading(true); setError(null);
        setProcessedItems([]); // Reset results
        setFullBodyResult(null);
        
        try {
            // 1. Analyze Layout (if not done)
            if (!layoutAnalysis) {
                setLoadingMessage('分析風格與配色...');
                const itemDataList = fashionItems.map(i => i.fileData);
                const analysis = await analyzeFashionLayout(personImage.fileData, itemDataList.slice(0, 2));
                setLayoutAnalysis(analysis);
            }

            // 2. Refine Full Body
            // Pass resolution directly. Service handles cost logic.
            const fullBodyTask = refineFullBody(
                personImage.fileData, 
                styleNotes, 
                setLoadingMessage, 
                resolution,
                styleReferenceImage?.fileData
            );

            // 3. Process Items (Clean + Macro)
            const itemTasks = fashionItems.map(item => processFashionItem(
                item, 
                (msg) => setLoadingMessage(msg), 
                resolution,
                layoutAnalysis?.lighting,
                styleReferenceImage?.fileData
            ));

            // Execute Parallel
            const [bodyResult, ...itemsResult] = await Promise.all([fullBodyTask, ...itemTasks]);
            
            setFullBodyResult(bodyResult);
            setProcessedItems(itemsResult);
            
            setLoadingMessage('完成！正在組裝拼貼...');

        } catch (err) {
            setError(getFriendlyErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    // Dynamic height calculation for the preview DOM only
    useLayoutEffect(() => {
        if (!collageRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === collageRef.current) {
                    const newHeight = entry.target.scrollHeight;
                    if (Math.abs(newHeight - contentHeight) > 2) {
                        setContentHeight(newHeight);
                    }
                }
            }
        });
        observer.observe(collageRef.current);
        return () => observer.disconnect();
    }, [contentHeight, fullBodyResult, processedItems]);

    const [guidelinePoints, setGuidelinePoints] = useState<{ x1: number, y1: number, x2: number, y2: number }[]>([]);
    const mainImgRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    useLayoutEffect(() => {
        if (!fullBodyResult || !layoutAnalysis?.itemAnchors || !collageRef.current || !mainImgRef.current) {
            setGuidelinePoints([]);
            return;
        }

        const collageRect = collageRef.current.getBoundingClientRect();
        const mainRect = mainImgRef.current.getBoundingClientRect();
        
        const points = layoutAnalysis.itemAnchors.map((anchor, i) => {
            const itemEl = itemRefs.current[i];
            if (!itemEl) return null;
            
            const itemRect = itemEl.getBoundingClientRect();
            
            // Item center (relative to collage)
            const x1 = (itemRect.left + itemRect.width / 2) - collageRect.left;
            const y1 = (itemRect.top + itemRect.height / 2) - collageRect.top;
            
            // Anchor point (relative to collage)
            const x2 = (mainRect.left + (anchor.x / 100) * mainRect.width) - collageRect.left;
            const y2 = (mainRect.top + (anchor.y / 100) * mainRect.height) - collageRect.top;
            
            return { x1, y1, x2, y2 };
        }).filter(p => p !== null) as { x1: number, y1: number, x2: number, y2: number }[];

        setGuidelinePoints(points);
    }, [fullBodyResult, layoutAnalysis, selectedLayout, selectedRatio, previewScale, processedItems]);

    const handleDownloadCollage = async () => {
        if (!fullBodyResult) return;
        setIsLoading(true);
        setLoadingMessage('正在繪製高解析度拼貼...');
        try {
            const dataUrl = await generateFashionArchitectImage(
                fullBodyResult,
                processedItems,
                layoutAnalysis,
                collageTitle,
                styleNotes,
                resolution,
                selectedMood,
                selectedLayout,
                selectedRatio
            );

            downloadImage(dataUrl, `style_profile_${Date.now()}.jpg`, 'FashionArchitect');
        } catch (e) { 
            console.error(e);
            setError("下載失敗"); 
        } finally { 
            setIsLoading(false); 
        }
    };

    const downloadSingle = (url: string, prefix: string) => {
        downloadImage(url, `${prefix}_${Date.now()}.jpg`, 'FashionArchitect');
    };

    // Render Helpers
    const MOOD_CONFIGS = {
        AUTO: { bg: layoutAnalysis?.backgroundColor || '#ffffff', text: layoutAnalysis?.fontColor || '#000000', accent: layoutAnalysis?.accentColor || '#888888', font: "'Playfair Display', serif" },
        MINIMAL: { bg: '#FDFCF8', text: '#1A1A1A', accent: '#A68B5B', font: "'Playfair Display', serif" },
        CYBER: { bg: '#050505', text: '#FFFFFF', accent: '#00FF00', font: "'Inter', sans-serif" },
        ORGANIC: { bg: '#F5F2E9', text: '#5A5A40', accent: '#8B7E66', font: "'Playfair Display', serif" }
    };

    const currentMood = MOOD_CONFIGS[selectedMood];
    const themeBg = currentMood.bg;
    const themeText = currentMood.text;
    const themeAccent = currentMood.accent;
    const themeFont = currentMood.font;

    const COLLAGE_WIDTH = 1200;
    const getCollageHeight = () => {
        if (selectedRatio === '9:16') return 2133;
        if (selectedRatio === '4:5') return 1500;
        if (selectedRatio === '1:1') return 1200;
        return 1697; // A4
    };
    const COLLAGE_HEIGHT = getCollageHeight();

    return (
        <div className="container mx-auto p-8 max-w-[1600px] animate-fade-in">
            <AnimatePresence>
                {isLoading && <Loader message={loadingMessage} />}
            </AnimatePresence>
            {previewImage && (
                <ImagePreviewModal 
                    images={[previewImage.url]} 
                    startIndex={0} 
                    onClose={() => setPreviewImage(null)}
                    actions={
                        <Button onClick={() => downloadSingle(previewImage.url, previewImage.name)}>
                            <DownloadIcon className="w-5 h-5 mr-2" /> 下載單圖
                        </Button>
                    }
                />
            )}
            <input type="file" ref={personInputRef} className="hidden" accept="image/*" onChange={handlePersonChange} />
            <input type="file" ref={itemInputRef} className="hidden" accept="image/*" multiple onChange={handleItemsChange} />
            <input type="file" ref={styleRefInputRef} className="hidden" accept="image/*" onChange={handleStyleRefChange} />

            {/* Header */}
            <div className="sticky top-[80px] z-30 glass-panel border-x-0 border-t-0 px-6 py-4 mb-8">
                <div className="max-w-[110rem] mx-auto flex justify-between items-center">
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-display font-bold uppercase tracking-[0.3em] text-[var(--color-text-main)] flex items-center gap-3">
                            <ArchitectIcon className="w-8 h-8" />
                            時尚視覺架構師
                        </h2>
                        <span className="text-[9px] uppercase tracking-[0.5em] text-[var(--color-gold)] font-light">Fashion Visual Architect</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {onGoHome && <Button onClick={onGoHome} variant="secondary" className="text-[10px] font-bold tracking-widest">返回首頁</Button>}
                    </div>
                </div>
            </div>
            <p className="text-center text-[var(--color-text-dim)] mb-8">上傳人物與單品照片，AI 將為您重塑影像並生成專業的時尚分析拼貼。</p>
            
            {error && <div className="text-center text-red-500 p-3 bg-red-900/20 rounded-md mb-6">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Inputs */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <Card>
                        <h3 className="text-xl font-bold text-[var(--color-text-title)] mb-4">1. 人物主圖 (必填)</h3>
                        {personImage ? (
                            <div className="relative group w-full mb-4">
                                <img src={personImage.url} alt="Main" className="w-full h-64 object-cover object-top rounded-md" />
                                <Button onClick={() => personInputRef.current?.click()} className="absolute bottom-2 right-2 text-xs py-1 px-2" variant="secondary">更換</Button>
                            </div>
                        ) : (
                            <div onClick={() => personInputRef.current?.click()} className="w-full h-48 border-2 border-dashed border-[var(--color-border)] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[var(--color-gold)] mb-4">
                                <PhotoIcon className="w-8 h-8 text-[var(--color-text-dim)] mb-2"/>
                                <span className="text-[var(--color-text-dim)]">點擊上傳照片</span>
                            </div>
                        )}
                    </Card>

                    <Card>
                        <h3 className="text-xl font-bold text-[var(--color-text-title)] mb-4">2. 風格參考圖 (選填)</h3>
                        {styleReferenceImage ? (
                            <div className="relative group w-full mb-4">
                                <img src={styleReferenceImage.url} alt="Style Ref" className="w-full h-32 object-cover rounded-md border border-[var(--color-border)]" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-md">
                                    <Button onClick={() => styleRefInputRef.current?.click()} className="text-[10px] py-1 px-2" variant="secondary">更換</Button>
                                    <Button onClick={() => setStyleReferenceImage(null)} className="text-[10px] py-1 px-2 bg-red-500/20 hover:bg-red-500/40 text-red-500 border-red-500/50">移除</Button>
                                </div>
                            </div>
                        ) : (
                            <div onClick={() => styleRefInputRef.current?.click()} className="w-full h-24 border-2 border-dashed border-[var(--color-border)] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[var(--color-gold)] mb-4 group">
                                <SparklesIcon className="w-6 h-6 text-[var(--color-text-dim)] mb-1 group-hover:text-[var(--color-gold)] transition-colors"/>
                                <span className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-widest">上傳品牌視覺參考</span>
                            </div>
                        )}
                        <p className="text-[10px] text-[var(--color-text-dim)] leading-relaxed">AI 將提取此圖的顆粒感、濾鏡與色調，確保拼貼風格一致。</p>
                    </Card>

                    <Card>
                        <h3 className="text-xl font-bold text-[var(--color-text-title)] mb-4">3. 單品配件 ({fashionItems.length})</h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-1 mb-4 custom-scrollbar">
                            <AnimatePresence mode="popLayout">
                                {fashionItems.map((item, i) => (
                                    <motion.div 
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        onMouseEnter={() => setHoveredItemIndex(i)}
                                        onMouseLeave={() => setHoveredItemIndex(null)}
                                        className={`flex items-center gap-2 bg-[var(--color-bg-surface)] p-2 rounded border transition-all ${hoveredItemIndex === i ? 'border-[var(--color-gold)] shadow-lg shadow-[var(--color-gold)]/10 translate-x-1' : 'border-transparent'}`}
                                    >
                                        <div className="flex flex-col gap-0.5 shrink-0 bg-[var(--color-bg-panel)] rounded-md p-1 border border-[var(--color-border)]">
                                            <button 
                                                onClick={() => handleMoveItem(item.id, 'up')}
                                                disabled={i === 0}
                                                className="p-1 text-[var(--color-text-dim)] hover:text-[var(--color-gold)] disabled:opacity-20 transition-all hover:bg-[var(--color-bg-surface)] rounded"
                                                title="上移"
                                            >
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                                            </button>
                                            <button 
                                                onClick={() => handleMoveItem(item.id, 'down')}
                                                disabled={i === fashionItems.length - 1}
                                                className="p-1 text-[var(--color-text-dim)] hover:text-[var(--color-gold)] disabled:opacity-20 transition-all hover:bg-[var(--color-bg-surface)] rounded"
                                                title="下移"
                                            >
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                            </button>
                                        </div>
                                        <div className="w-10 h-10 bg-[var(--color-bg-input)] rounded overflow-hidden shrink-0 border border-[var(--color-border)]">
                                            {item.previewUrl ? (
                                                <img src={item.previewUrl} className="w-full h-full object-cover" alt={item.name} />
                                            ) : (
                                                <div className="w-full h-full bg-[var(--color-bg-deep)] flex items-center justify-center text-xs text-[var(--color-text-title)]">{i+1}</div>
                                            )}
                                        </div>
                                        <input 
                                            value={item.name} 
                                            onChange={(e) => handleLabelChange(item.id, e.target.value)}
                                            className="bg-transparent border-b border-[var(--color-border)] text-sm text-[var(--color-text-title)] flex-grow focus:outline-none focus:border-[var(--color-gold)] font-medium"
                                            placeholder="輸入名稱..."
                                        />
                                        <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-400 text-lg px-1">&times;</button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                        <Button onClick={() => itemInputRef.current?.click()} variant="secondary" className="w-full text-sm">+ 新增單品 (可多選)</Button>
                    </Card>

                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-[var(--color-text-title)]">4. 設定與生成</h3>
                            <Button onClick={handleAnalyzeLayout} disabled={!personImage} variant="secondary" className="text-xs px-2 py-1 flex items-center gap-1">
                                <SparklesIcon className="w-3 h-3" /> 風格分析
                            </Button>
                        </div>
                        
                        {/* Analysis Preview */}
                        {layoutAnalysis && (
                            <div className="mb-4 p-3 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-md">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-[var(--color-gold)] uppercase tracking-widest">Style Analysis</span>
                                    <span className="text-[10px] text-[var(--color-text-dim)] capitalize">{layoutAnalysis.layoutStyle}</span>
                                </div>
                                
                                {layoutAnalysis.colorPalette ? (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {layoutAnalysis.colorPalette.map((c, i) => (
                                            <div key={i} className="group relative">
                                                <div className="w-6 h-6 rounded-full border border-white/10 shadow-sm cursor-help" style={{ backgroundColor: c.hex }} />
                                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-[8px] px-1 rounded whitespace-nowrap z-10">{c.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-4 h-4 rounded-full border border-[var(--color-border)]" style={{backgroundColor: layoutAnalysis.backgroundColor}} title="Background"></div>
                                        <div className="w-4 h-4 rounded-full border border-[var(--color-border)]" style={{backgroundColor: layoutAnalysis.fontColor}} title="Font"></div>
                                        <div className="w-4 h-4 rounded-full border border-[var(--color-border)]" style={{backgroundColor: layoutAnalysis.accentColor}} title="Accent"></div>
                                    </div>
                                )}

                                {layoutAnalysis.lighting && (
                                    <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-[var(--color-border)]/50">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-tighter">Lighting: {layoutAnalysis.lighting.direction} / {layoutAnalysis.lighting.temperature}</span>
                                            <div className="flex items-center gap-1">
                                                <div className="w-1 h-1 rounded-full bg-[var(--color-gold)] animate-ping" />
                                                <span className="text-[9px] text-[var(--color-gold)] font-bold uppercase">AI Fusion Active</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-[8px] px-1 bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded text-[var(--color-text-dim)]">Contact Shadows</span>
                                            <span className="text-[8px] px-1 bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded text-[var(--color-text-dim)]">Tone Sync</span>
                                            {styleReferenceImage && <span className="text-[8px] px-1 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded text-[var(--color-gold)]">Style Transfer</span>}
                                        </div>
                                    </div>
                                )}
                                <p className="text-[10px] text-[var(--color-text-dim)] mt-2 italic opacity-70">AI 已偵測配色、排版與光影環境</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-[var(--color-text-main)] mb-1">拼貼標題</label>
                                <input value={collageTitle} onChange={e => setCollageTitle(e.target.value)} className="w-full bg-[var(--color-bg-input)] p-2 rounded text-sm text-[var(--color-text-title)]" />
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--color-text-main)] mb-1">風格備註</label>
                                <textarea value={styleNotes} onChange={e => setStyleNotes(e.target.value)} className="w-full bg-[var(--color-bg-input)] p-2 rounded text-sm text-[var(--color-text-title)]" rows={2} placeholder="例如：極簡、高對比..." />
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--color-text-main)] mb-1">視覺風格 (Mood)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.keys(MOOD_CONFIGS).map(m => (
                                        <button 
                                            key={m}
                                            onClick={() => setSelectedMood(m as any)}
                                            className={`py-2 px-1 text-[10px] font-bold rounded border transition-all ${selectedMood === m ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/10 text-[var(--color-gold)]' : 'border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-text-dim)]'}`}
                                        >
                                            {m === 'AUTO' ? 'AI 自動偵測' : m === 'MINIMAL' ? '極簡白 (Minimal)' : m === 'CYBER' ? '賽博黑 (Cyber)' : '大地色 (Organic)'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--color-text-main)] mb-1">輸出比例 (Ratio)</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {(['A4', '9:16', '4:5', '1:1'] as FashionArchitectRatio[]).map(r => (
                                        <button 
                                            key={r}
                                            onClick={() => setSelectedRatio(r)}
                                            className={`py-2 px-1 text-[10px] font-bold rounded border transition-all ${selectedRatio === r ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/10 text-[var(--color-gold)]' : 'border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-text-dim)]'}`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--color-text-main)] mb-1">排版佈局 (Layout)</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['CLASSIC', 'MODERN', 'AVANT_GARDE', 'L_FRAME', 'TRIPTYCH', 'STEPPED'] as FashionArchitectLayout[]).map(l => (
                                        <button 
                                            key={l}
                                            onClick={() => setSelectedLayout(l)}
                                            className={`py-2 px-1 text-[10px] font-bold rounded border transition-all ${selectedLayout === l ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/10 text-[var(--color-gold)]' : 'border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-text-dim)]'}`}
                                        >
                                            {l === 'CLASSIC' ? '經典' : l === 'MODERN' ? '現代' : l === 'AVANT_GARDE' ? '前衛' : l === 'L_FRAME' ? 'L型' : l === 'TRIPTYCH' ? '三聯' : '階梯'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--color-text-main)] mb-1">輸出解析度</label>
                                <Select 
                                    label="" 
                                    options={[{value: 'HD', label: 'HD (快速/免費)'}, {value: '2K', label: '2K (Pro)'}, {value: '4K', label: '4K (Pro)'}]} 
                                    value={resolution} 
                                    onChange={(e) => setResolution(e.target.value as any)} 
                                />
                            </div>
                            <Button onClick={handleProcess} disabled={!personImage || isLoading} className="w-full text-lg py-3">
                                <ArchitectIcon className="w-5 h-5 mr-2" /> 開始架構
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Result */}
                <div className="lg:col-span-9 bg-[var(--color-bg-deep)] rounded-lg p-4 flex flex-col items-center">
                    
                    {fullBodyResult ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full flex flex-col items-center"
                        >
                            <div className="w-full flex flex-wrap justify-between items-center mb-4 gap-4">
                                <div className="flex items-center gap-4 px-4 bg-[var(--color-bg-surface)] rounded-full py-1">
                                    <div className="flex items-center gap-2 mr-2 border-r border-[var(--color-border)] pr-4">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[10px] uppercase font-bold tracking-widest text-green-500/80">Live Preview</span>
                                    </div>
                                    <span className="text-xs text-[var(--color-text-dim)]">預覽縮放</span>
                                    <input 
                                        type="range" 
                                        min="0.2" 
                                        max="1.0" 
                                        step="0.1" 
                                        value={previewScale} 
                                        onChange={(e) => setPreviewScale(Number(e.target.value))}
                                        className="w-32 h-2 bg-[var(--color-bg-panel)] rounded-lg appearance-none cursor-pointer"
                                    />
                                    <span className="text-xs text-[var(--color-text-title)]">{Math.round(previewScale * 100)}%</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={() => downloadSingle(fullBodyResult, 'fullbody')}>下載全身圖</Button>
                                    <Button onClick={handleDownloadCollage}>下載完整拼貼</Button>
                                </div>
                            </div>
                            
                            {/* Interactive Preview Container - Scaled to fit UI */}
                            <div className="w-full overflow-auto flex justify-center bg-[var(--color-bg-surface)]/50 border border-[var(--color-border)] rounded-lg p-4 shadow-inner transition-all">
                                <div 
                                    style={{ 
                                        width: `${COLLAGE_WIDTH * previewScale}px`, 
                                        height: `${COLLAGE_HEIGHT * previewScale}px`,
                                        position: 'relative',
                                        overflow: 'hidden',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <div 
                                        style={{ 
                                            transform: `scale(${previewScale})`, 
                                            transformOrigin: 'top left',
                                            width: `${COLLAGE_WIDTH}px`, 
                                            height: `${COLLAGE_HEIGHT}px`,
                                            position: 'absolute',
                                            top: 0,
                                            left: 0
                                        }}
                                    >
                                        <div 
                                            ref={collageRef}
                                            style={{ 
                                                backgroundColor: themeBg,
                                                color: themeText,
                                                width: `${COLLAGE_WIDTH}px`, 
                                                height: `${COLLAGE_HEIGHT}px`,
                                                padding: '60px',
                                                display: 'grid',
                                                gridTemplateColumns: selectedLayout === 'TRIPTYCH' ? '1fr 2fr 1fr' : '1.2fr 0.8fr',
                                                gridTemplateRows: 'auto 1fr auto',
                                                gap: '40px',
                                                fontFamily: "'Helvetica Neue', Arial, sans-serif",
                                                position: 'relative'
                                            }}
                                        >
                                            {/* Guideline SVG Overlay */}
                                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                                                {guidelinePoints.map((p, i) => (
                                                    <g key={i} className="transition-all duration-300">
                                                        <line 
                                                            x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} 
                                                            stroke={hoveredItemIndex === i ? 'var(--color-gold)' : themeAccent} 
                                                            strokeWidth={hoveredItemIndex === i ? "2" : "1"} 
                                                            strokeDasharray={hoveredItemIndex === i ? "none" : "5,5"} 
                                                            opacity={hoveredItemIndex === i ? "1" : "0.5"} 
                                                            className="transition-all duration-300"
                                                        />
                                                        <circle 
                                                            cx={p.x2} cy={p.y2} 
                                                            r={hoveredItemIndex === i ? "5" : "3"} 
                                                            fill={hoveredItemIndex === i ? 'var(--color-gold)' : themeAccent} 
                                                            className="transition-all duration-300"
                                                        />
                                                    </g>
                                                ))}
                                            </svg>

                                            {/* Vertical Rails */}
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-12 pointer-events-none" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                                <span className="text-[10px] uppercase tracking-[0.5em] opacity-30" style={{ color: themeText }}>Pavora Architect Engine // v2.0</span>
                                                <span className="text-[10px] uppercase tracking-[0.5em] opacity-30" style={{ color: themeText }}>{new Date().toISOString().split('T')[0]} // {resolution}</span>
                                            </div>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-12 pointer-events-none" style={{ writingMode: 'vertical-rl' }}>
                                                <span className="text-[10px] uppercase tracking-[0.5em] opacity-30" style={{ color: themeText }}>Subject: {collageTitle.toUpperCase()}</span>
                                                <span className="text-[10px] uppercase tracking-[0.5em] opacity-30" style={{ color: themeText }}>Layout: {selectedLayout} // Ratio: {selectedRatio}</span>
                                            </div>

                                            {/* Header */}
                                            <div className="col-span-full border-b-2 pb-6 group/header" style={{ borderColor: themeText }}>
                                                <input 
                                                   value={collageTitle}
                                                   onChange={e => setCollageTitle(e.target.value)}
                                                   className="text-6xl font-black uppercase tracking-tight bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] rounded-lg px-2 w-full"
                                                   style={{ color: themeText, fontFamily: themeFont, textShadow: '0 2px 4px rgba(0,0,0,0.1)', letterSpacing: '-0.02em' }}
                                                />
                                                <p className="text-xl mt-2 uppercase tracking-[0.3em] font-light" style={{ color: themeAccent, textShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>Wardrobe Deconstruction & Style Profile</p>
                                            </div>

                                            {/* Main Content Area - Conditional Layout */}
                                            {selectedLayout === 'AVANT_GARDE' ? (
                                                <div className="col-span-full flex flex-col gap-8">
                                                    <div ref={mainImgRef} className="relative w-full aspect-video group cursor-pointer" onClick={() => setPreviewImage({ url: fullBodyResult, name: 'Full Body Portrait' })}>
                                                        <div className="w-full h-full overflow-hidden relative bg-[var(--color-bg-input)]">
                                                            <div 
                                                                className="w-full h-full shadow-sm"
                                                                style={{
                                                                    backgroundImage: `url(${fullBodyResult})`,
                                                                    backgroundSize: 'cover',
                                                                    backgroundPosition: 'center 20%',
                                                                    backgroundRepeat: 'no-repeat',
                                                                }}
                                                            />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                                <div className="bg-[var(--color-bg-surface)]/90 text-[var(--color-text-deep)] p-3 rounded-full shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                                                                    <ExpandIcon className="w-8 h-8" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-4">
                                                            <p className="font-bold text-sm uppercase tracking-wider" style={{ color: themeAccent }}>01 // Subject Profile</p>
                                                            <p className="text-xs mt-1 opacity-70">{styleNotes || "Editorial refinement with natural lighting."}</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-6">
                                                        {processedItems.map((item, i) => (
                                                            <div 
                                                                key={i} 
                                                                ref={el => itemRefs.current[i] = el} 
                                                                onMouseEnter={() => setHoveredItemIndex(i)}
                                                                onMouseLeave={() => setHoveredItemIndex(null)}
                                                                className={`flex flex-col gap-2 group cursor-pointer transition-all duration-300 ${hoveredItemIndex === i ? 'scale-105 z-30' : ''}`} 
                                                                onClick={() => item.processedUrl && setPreviewImage({ url: item.processedUrl, name: item.name })}
                                                            >
                                                                <div className="aspect-square w-full flex items-center justify-center p-4 bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-sm relative overflow-hidden">
                                                                    {item.processedUrl && <img src={item.processedUrl} className="max-w-full max-h-full object-contain" />}
                                                                    <div className="absolute inset-0 bg-black/0 group-hover:opacity-100 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                                        <ExpandIcon className="w-6 h-6 text-[var(--color-text-dim)]" />
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-between items-baseline border-b pb-1 group/label" style={{ borderColor: 'var(--color-border)' }}>
                                                                    <input 
                                                                        value={item.name}
                                                                        onChange={(e) => handleLabelChange(item.id, e.target.value)}
                                                                        className="font-bold text-sm uppercase truncate bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[var(--color-gold)] rounded px-1 w-full cursor-text"
                                                                        style={{ color: themeText }}
                                                                    />
                                                                    <span className="text-[10px] font-mono opacity-50 ml-2">#{i + 1}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : selectedLayout === 'TRIPTYCH' ? (
                                                <div className="col-span-full grid grid-cols-4 gap-8 h-full">
                                                    <div className="flex flex-col gap-4">
                                                        {processedItems.slice(0, Math.ceil(processedItems.length / 2)).map((item, i) => (
                                                            <div 
                                                                key={i} 
                                                                ref={el => itemRefs.current[i] = el} 
                                                                onMouseEnter={() => setHoveredItemIndex(i)}
                                                                onMouseLeave={() => setHoveredItemIndex(null)}
                                                                className={`flex flex-col gap-1 transition-all duration-300 ${hoveredItemIndex === i ? 'scale-105 z-30' : ''}`}
                                                            >
                                                                <div className="aspect-square bg-[var(--color-bg-surface)] border border-[var(--color-border)] p-2">
                                                                    {item.processedUrl && <img src={item.processedUrl} className="w-full h-full object-contain" />}
                                                                </div>
                                                                <span className="text-[10px] font-bold uppercase truncate" style={{ color: themeText }}>{item.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div ref={mainImgRef} className="col-span-2 relative">
                                                        <div className="w-full h-full overflow-hidden bg-[var(--color-bg-input)]">
                                                            <img src={fullBodyResult!} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="absolute bottom-4 left-4">
                                                            <p className="font-bold text-xs uppercase tracking-widest px-2 py-1 bg-white/80 text-black">01 // Subject</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-4">
                                                        {processedItems.slice(Math.ceil(processedItems.length / 2)).map((item, i) => (
                                                            <div 
                                                                key={i} 
                                                                ref={el => itemRefs.current[i + Math.ceil(processedItems.length / 2)] = el} 
                                                                onMouseEnter={() => setHoveredItemIndex(i + Math.ceil(processedItems.length / 2))}
                                                                onMouseLeave={() => setHoveredItemIndex(null)}
                                                                className={`flex flex-col gap-1 transition-all duration-300 ${hoveredItemIndex === i + Math.ceil(processedItems.length / 2) ? 'scale-105 z-30' : ''}`}
                                                            >
                                                                <div className="aspect-square bg-[var(--color-bg-surface)] border border-[var(--color-border)] p-2">
                                                                    {item.processedUrl && <img src={item.processedUrl} className="w-full h-full object-contain" />}
                                                                </div>
                                                                <span className="text-[10px] font-bold uppercase truncate" style={{ color: themeText }}>{item.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : selectedLayout === 'L_FRAME' ? (
                                                <div className="col-span-full grid grid-cols-3 grid-rows-3 gap-6 h-full">
                                                    <div ref={mainImgRef} className="col-span-2 row-span-2 relative overflow-hidden bg-[var(--color-bg-input)]">
                                                        <img src={fullBodyResult!} className="w-full h-full object-cover" />
                                                        <div className="absolute top-4 left-4">
                                                            <p className="font-bold text-xs uppercase tracking-widest px-2 py-1 bg-black text-white">Main Subject</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-4">
                                                        {processedItems.slice(0, 2).map((item, i) => (
                                                            <div 
                                                                key={i} 
                                                                ref={el => itemRefs.current[i] = el} 
                                                                onMouseEnter={() => setHoveredItemIndex(i)}
                                                                onMouseLeave={() => setHoveredItemIndex(null)}
                                                                className={`aspect-square bg-[var(--color-bg-surface)] border border-[var(--color-border)] p-4 transition-all duration-300 ${hoveredItemIndex === i ? 'scale-105 z-30 border-[var(--color-gold)]' : ''}`}
                                                            >
                                                                {item.processedUrl && <img src={item.processedUrl} className="w-full h-full object-contain" />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="col-span-3 flex gap-4">
                                                        {processedItems.slice(2, 6).map((item, i) => (
                                                            <div 
                                                                key={i} 
                                                                ref={el => itemRefs.current[i + 2] = el} 
                                                                onMouseEnter={() => setHoveredItemIndex(i + 2)}
                                                                onMouseLeave={() => setHoveredItemIndex(null)}
                                                                className={`flex-1 aspect-square bg-[var(--color-bg-surface)] border border-[var(--color-border)] p-4 transition-all duration-300 ${hoveredItemIndex === i + 2 ? 'scale-105 z-30 border-[var(--color-gold)]' : ''}`}
                                                            >
                                                                {item.processedUrl && <img src={item.processedUrl} className="w-full h-full object-contain" />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : selectedLayout === 'STEPPED' ? (
                                                <div className="col-span-full grid grid-cols-12 gap-6 h-full">
                                                    <div ref={mainImgRef} className="col-span-7 h-full overflow-hidden bg-[var(--color-bg-input)]">
                                                        <img src={fullBodyResult!} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="col-span-5 grid grid-cols-2 gap-4">
                                                        {processedItems.map((item, i) => (
                                                            <div 
                                                                key={i} 
                                                                ref={el => itemRefs.current[i] = el} 
                                                                onMouseEnter={() => setHoveredItemIndex(i)}
                                                                onMouseLeave={() => setHoveredItemIndex(null)}
                                                                className={`aspect-square bg-[var(--color-bg-surface)] border border-[var(--color-border)] p-4 transition-all duration-300 ${hoveredItemIndex === i ? 'scale-105 z-30 border-[var(--color-gold)]' : ''} ${i % 3 === 0 ? 'translate-y-8' : ''}`}
                                                            >
                                                                {item.processedUrl && <img src={item.processedUrl} className="w-full h-full object-contain" />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* CLASSIC (Left) or MODERN (Right) */}
                                                    <div ref={mainImgRef} className={`relative h-full group cursor-pointer ${selectedLayout === 'MODERN' ? 'order-2' : 'order-1'}`} onClick={() => setPreviewImage({ url: fullBodyResult, name: 'Full Body Portrait' })}>
                                                        <div className="w-full h-full overflow-hidden relative bg-[var(--color-bg-input)]">
                                                            <div 
                                                                className="w-full h-full shadow-sm"
                                                                style={{
                                                                    backgroundImage: `url(${fullBodyResult})`,
                                                                    backgroundSize: 'cover',
                                                                    backgroundPosition: 'center top',
                                                                    backgroundRepeat: 'no-repeat',
                                                                    minHeight: '800px'
                                                                }}
                                                            />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                                <div className="bg-[var(--color-bg-surface)]/90 text-[var(--color-text-deep)] p-3 rounded-full shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                                                                    <ExpandIcon className="w-8 h-8" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-4">
                                                            <p className="font-bold text-sm uppercase tracking-wider" style={{ color: themeAccent }}>01 // Subject Profile</p>
                                                            <p className="text-xs mt-1 opacity-70">{styleNotes || "Editorial refinement with natural lighting."}</p>
                                                        </div>
                                                    </div>

                                                    <div className={`flex flex-col gap-8 ${selectedLayout === 'MODERN' ? 'order-1' : 'order-2'}`}>
                                                        {processedItems.map((item, i) => (
                                                            <div 
                                                                key={i} 
                                                                ref={el => itemRefs.current[i] = el} 
                                                                onMouseEnter={() => setHoveredItemIndex(i)}
                                                                onMouseLeave={() => setHoveredItemIndex(null)}
                                                                className={`flex flex-col gap-2 group cursor-pointer transition-all duration-300 ${hoveredItemIndex === i ? 'scale-105 z-30' : ''}`} 
                                                                onClick={() => item.processedUrl && setPreviewImage({ url: item.processedUrl, name: item.name })}
                                                            >
                                                                <div className="aspect-[4/3] w-full flex items-center justify-center p-4 bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-sm relative overflow-hidden">
                                                                    {item.processedUrl && <img src={item.processedUrl} className="max-w-full max-h-full object-contain" />}
                                                                    <div className="absolute inset-0 bg-black/0 group-hover:opacity-100 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                                        <ExpandIcon className="w-6 h-6 text-[var(--color-text-dim)]" />
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-between items-baseline border-b pb-1 group/label" style={{ borderColor: 'var(--color-border)' }}>
                                                                    <input 
                                                                        value={item.name}
                                                                        onChange={(e) => handleLabelChange(item.id, e.target.value)}
                                                                        className="font-bold text-lg uppercase truncate bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[var(--color-gold)] rounded px-1 w-full cursor-text"
                                                                        style={{ color: themeText }}
                                                                    />
                                                                    <span className="text-xs font-mono opacity-50 ml-2">ITEM {String(i + 1).padStart(2, '0')}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {processedItems.length < 3 && <div className="flex-grow" />}
                                                    </div>
                                                </>
                                            )}

                                            {/* Footer / Macros - Gallery Style */}
                                            <div className="col-span-2 pt-8 border-t-2" style={{ borderColor: themeText }}>
                                                <p className="font-bold text-sm uppercase tracking-wider mb-6" style={{ color: themeAccent }}>02 // Material & Texture Study</p>
                                                <div className="flex flex-wrap gap-4">
                                                    {processedItems.slice(0, 6).map((item, i) => (
                                                        item.macroUrl ? (
                                                            <div 
                                                                key={i} 
                                                                className={`overflow-hidden relative group cursor-pointer ${i % 3 === 0 ? 'w-[calc(40%-1rem)] aspect-[16/9]' : 'w-[calc(30%-1rem)] aspect-square'}`} 
                                                                onClick={() => setPreviewImage({ url: item.macroUrl!, name: `${item.name} Texture` })}
                                                            >
                                                                <img src={item.macroUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                                <div className="absolute bottom-0 left-0 bg-[var(--color-bg-surface)]/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider z-10 shadow-sm">
                                                                    {item.name}
                                                                </div>
                                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 z-20">
                                                                    <ExpandIcon className="w-6 h-6 text-[var(--color-text-title)] drop-shadow-md" />
                                                                </div>
                                                            </div>
                                                        ) : null
                                                    ))}
                                                </div>
                                                <div className="flex justify-between items-end mt-12">
                                                    <div className="flex flex-col gap-4">
                                                        {layoutAnalysis?.colorPalette && (
                                                            <div className="flex flex-col gap-2">
                                                                <span className="text-[10px] uppercase font-bold tracking-widest opacity-50">Color Palette</span>
                                                                <div className="flex gap-2">
                                                                    {layoutAnalysis.colorPalette.map((c, i) => (
                                                                        <div key={i} className="flex flex-col items-center gap-1">
                                                                            <div className="w-8 h-8 rounded-full border border-white/10 shadow-sm" style={{ backgroundColor: c.hex }} />
                                                                            <span className="text-[8px] opacity-40 font-mono">{c.hex}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="text-[10px] font-mono opacity-50 uppercase tracking-tighter">
                                                            RES: {resolution} // DATE: {new Date().toLocaleDateString()} <br/>
                                                            {layoutAnalysis?.lighting ? `LIGHT: ${layoutAnalysis.lighting.direction} / ${layoutAnalysis.lighting.temperature}` : "LIGHT: NATURAL / NEUTRAL"} <br/>
                                                            LENS: 35MM F1.4 // ISO: 100
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xl font-bold uppercase" style={{ fontFamily: themeFont }}>Pavora AI Studio</p>
                                                        <p className="text-xs opacity-60 uppercase tracking-widest">Fashion Visual Architect Engine // v2.0</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-dim)] opacity-50 py-32">
                            <ArchitectIcon className="w-32 h-32 mb-4" />
                            <p className="text-2xl">等待生成...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FashionArchitect;
