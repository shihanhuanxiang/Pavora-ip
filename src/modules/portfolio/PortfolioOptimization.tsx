
import React, { useState, useCallback, useRef } from 'react';
import { optimizeAndReangleImage, getFriendlyErrorMessage, imageUrlToimageData, fileToBase64, getRealismAnalysis } from '../../shared/services/geminiService';
import { COMPOSITION_OPTIONS, LIGHT_DIRECTION_OPTIONS, LIGHT_STYLE_OPTIONS, FOCAL_LENGTH_OPTIONS, DEPTH_OF_FIELD_OPTIONS, RESOLUTION_OPTIONS, QUALITY_OPTIONS, FORMAT_OPTIONS, ASPECT_RATIO_OPTIONS, TEXTURE_INTENSITY_OPTIONS, MATERIAL_FOCUS_OPTIONS, FILL_LIGHT_OPTIONS, CATCHLIGHT_STYLE_OPTIONS, FILM_STOCK_OPTIONS, COLOR_GRADING_OPTIONS } from '../../shared/constants/constants';
import { useHistoryState } from '../../shared/hooks/useHistoryState';
import { savePortfolioItem } from '../../shared/services/storageService';
import { downloadImage } from '../../shared/utils/imageUtils';
import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
import Loader from '../../shared/components/common/Loader';
import PhotoIcon from '../../shared/assets/icons/PhotoIcon';
import SparklesIcon from '../../shared/assets/icons/SparklesIcon';
import ImagePreviewModal from '../../shared/components/common/ImagePreviewModal';
import ModelLoungeModal from '../../shared/components/common/ModelLoungeModal';
import Slider from '../../shared/components/common/Slider';
import Select from '../../shared/components/common/Select';
import { Model, RealismAnalysisReport } from '../../shared/types/types';
import ImageCompareSlider from '../../shared/components/common/ImageCompareSlider';
import DownloadIcon from '../../shared/assets/icons/DownloadIcon';
import ChevronLeftIcon from '../../shared/assets/icons/ChevronLeftIcon';
import ChevronRightIcon from '../../shared/assets/icons/ChevronRightIcon';
import ExpandIcon from '../../shared/assets/icons/ExpandIcon';
import ChevronDownIcon from '../../shared/assets/icons/ChevronDownIcon';
import AdjustmentsIcon from '../../shared/assets/icons/AdjustmentsIcon';
import BeakerIcon from '../../shared/assets/icons/BeakerIcon';
import CubeIcon from '../../shared/assets/icons/CubeIcon';
import CameraIcon from '../../shared/assets/icons/CameraIcon';
import LockClosedIcon from '../../shared/assets/icons/LockClosedIcon';
import ViewColumnsIcon from '../../shared/assets/icons/ViewColumnsIcon';
import { 
    Columns, 
    Split, 
    RefreshCw, 
    Search, 
    BarChart3, 
    Maximize2,
    Eye,
    EyeOff
} from 'lucide-react';

interface PortfolioOptimizationProps {
    onGoBack: () => void;
    onGoHome: () => void;
    initialImage?: { url: string; fileData: { data: string; mimeType: string; } } | null;
    onContinueEditing: (imageUrl: string, destination: string) => void;
}

const PortfolioOptimization: React.FC<PortfolioOptimizationProps> = ({ onGoBack, onGoHome, initialImage, onContinueEditing }) => {
    const [baseImage, setBaseImage] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(() => {
        if (!initialImage) return null;
        const displayUrl = initialImage.url.startsWith('idb://') 
            ? `data:${initialImage.fileData.mimeType};base64,${initialImage.fileData.data}`
            : initialImage.url;
        return { ...initialImage, url: displayUrl };
    });
    const { state: generatedImage, setState: setGeneratedImage, undo, redo, canUndo, canRedo, reset: resetHistory, history, cursor } = useHistoryState<string | null>({ initial: null, max: 20 });
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isLoungeOpen, setIsLoungeOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [yaw, setYaw] = useState(0);
    const [pitch, setPitch] = useState(0);
    const [roll, setRoll] = useState(0);
    const [viewMode, setViewMode] = useState('relative');
    const [lockFace, setLockFace] = useState(true);
    const [lockHair, setLockHair] = useState(true);
    const [lockOutfit, setLockOutfit] = useState(true);
    const [allowOutpaint, setAllowOutpaint] = useState(true);
    const [composition, setComposition] = useState('default');
    const [lightDirection, setLightDirection] = useState('front');
    const [lightStyle, setLightStyle] = useState('soft');
    const [focalLength, setFocalLength] = useState('85mm');
    const [depthOfField, setDepthOfField] = useState('medium');
    const [resolution, setResolution] = useState('original');
    const [aspectRatio, setAspectRatio] = useState('original');
    const [format, setFormat] = useState('JPG');
    const [quality, setQuality] = useState<string[]>(['enhance-details', 'color-correction']);
    const [textureIntensity, setTextureIntensity] = useState('natural');
    const [materialFocus, setMaterialFocus] = useState('none');
    const [fillLight, setFillLight] = useState('none');
    const [catchlightStyle, setCatchlightStyle] = useState('none');
    const [filmStock, setFilmStock] = useState('none');
    const [colorGrading, setColorGrading] = useState('natural');
    const [addObject, setAddObject] = useState('');
    const [removeObject, setRemoveObject] = useState('');
    const [changeStyle, setChangeStyle] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisReport, setAnalysisReport] = useState<RealismAnalysisReport | null>(null);
    const [activeSection, setActiveSection] = useState<string | null>('analysis');
    
    // Phase 2 States
    const [comparisonMode, setComparisonMode] = useState<'slider' | 'side-by-side' | 'toggle'>('slider');
    const [showLoupe, setShowLoupe] = useState(false);
    const [loupePos, setLoupePos] = useState({ x: 0, y: 0, show: false });
    const [showHistogram, setShowHistogram] = useState(false);
    const [isToggled, setIsToggled] = useState(false); // For 'toggle' mode
    const [isSmartLinkEnabled, setIsSmartLinkEnabled] = useState(true);
    const [detectedAspectRatio, setDetectedAspectRatio] = useState<string | null>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // Smart Parameter Linking logic
    React.useEffect(() => {
        if (!isSmartLinkEnabled) return;

        // Link Resolution to Quality
        if (resolution === '4K') {
            if (!quality.includes('8k-reconstruct')) setQuality(prev => [...prev, '8k-reconstruct']);
            if (!quality.includes('skin-texture')) setQuality(prev => [...prev, 'skin-texture']);
        }

        // Link Film Stock to Color Grading
        if (filmStock !== 'none' && colorGrading === 'natural') {
            setColorGrading('cinematic');
        }
    }, [resolution, filmStock, isSmartLinkEnabled]);

    const steps = [
        { id: 'upload', label: '上傳圖片', completed: !!baseImage },
        { id: 'analyze', label: 'AI 診斷', completed: !!analysisReport },
        { id: 'adjust', label: '細節調整', completed: !!generatedImage },
        { id: 'export', label: '高品質輸出', completed: false }
    ];

    // Sync initialImage if it changes (e.g. from Portfolio Gallery)
    React.useEffect(() => {
        if (initialImage) {
            // If it's an internal idb URL, use the data URL for preview
            const displayUrl = initialImage.url.startsWith('idb://') 
                ? `data:${initialImage.fileData.mimeType};base64,${initialImage.fileData.data}`
                : initialImage.url;
            
            setBaseImage({ ...initialImage, url: displayUrl });
            resetHistory(null);
            setAnalysisReport(null);

            // Detect Aspect Ratio for initial image
            const img = new Image();
            img.src = displayUrl;
            img.onload = () => {
                const ratio = img.width / img.height;
                if (Math.abs(ratio - 1) < 0.05) setDetectedAspectRatio('1:1');
                else if (Math.abs(ratio - 0.75) < 0.05) setDetectedAspectRatio('3:4');
                else if (Math.abs(ratio - 1.33) < 0.05) setDetectedAspectRatio('4:3');
                else if (Math.abs(ratio - 0.56) < 0.05) setDetectedAspectRatio('9:16');
                else if (Math.abs(ratio - 1.77) < 0.05) setDetectedAspectRatio('16:9');
                else setDetectedAspectRatio(`${img.width}:${img.height}`);
            };
        }
    }, [initialImage, resetHistory]);

    const setBaseImageFromFile = async (file: File) => {
        setIsLoading(true); setLoadingMessage('正在載入圖片...');
        try {
            const fileData = await fileToBase64(file);
            const url = URL.createObjectURL(file);
            
            // Detect Aspect Ratio
            const img = new Image();
            img.src = url;
            img.onload = () => {
                const ratio = img.width / img.height;
                // Map to common ratios supported by Gemini if possible, or use raw
                if (Math.abs(ratio - 1) < 0.05) setDetectedAspectRatio('1:1');
                else if (Math.abs(ratio - 0.75) < 0.05) setDetectedAspectRatio('3:4');
                else if (Math.abs(ratio - 1.33) < 0.05) setDetectedAspectRatio('4:3');
                else if (Math.abs(ratio - 0.56) < 0.05) setDetectedAspectRatio('9:16');
                else if (Math.abs(ratio - 1.77) < 0.05) setDetectedAspectRatio('16:9');
                else setDetectedAspectRatio(`${img.width}:${img.height}`);
            };

            setBaseImage({ url, fileData }); resetHistory(null); setAnalysisReport(null);
        } catch (err) { setError(getFriendlyErrorMessage(err)); } finally { setIsLoading(false); }
    };
    const handleBaseImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) { setBaseImageFromFile(e.target.files[0]); }
    };
    const handleSelectFromLounge = async (model: Model) => {
        setIsLoungeOpen(false); setIsLoading(true); setLoadingMessage('載入模型...');
        try {
            const fileData = await imageUrlToimageData(model.imageUrl);
            const displayUrl = model.imageUrl.startsWith('idb://') 
                ? `data:${fileData.mimeType};base64,${fileData.data}`
                : model.imageUrl;

            // Detect Aspect Ratio
            const img = new Image();
            img.src = displayUrl;
            img.onload = () => {
                const ratio = img.width / img.height;
                if (Math.abs(ratio - 1) < 0.05) setDetectedAspectRatio('1:1');
                else if (Math.abs(ratio - 0.75) < 0.05) setDetectedAspectRatio('3:4');
                else if (Math.abs(ratio - 1.33) < 0.05) setDetectedAspectRatio('4:3');
                else if (Math.abs(ratio - 0.56) < 0.05) setDetectedAspectRatio('9:16');
                else if (Math.abs(ratio - 1.77) < 0.05) setDetectedAspectRatio('16:9');
                else setDetectedAspectRatio(`${img.width}:${img.height}`);
            };

            setBaseImage({ url: displayUrl, fileData }); resetHistory(null); setAnalysisReport(null);
        } catch(e) { setError(getFriendlyErrorMessage(e)); } finally { setIsLoading(false); }
    };

    const handleGenerate = useCallback(async (overrideParams?: Partial<RealismAnalysisReport['suggested_params']>) => {
        if (!baseImage) return;
        setIsLoading(true); setLoadingMessage('正在優化圖片...'); setError(null);
        
        const params = overrideParams || {};
        
        const compPrompt = COMPOSITION_OPTIONS.find(o => o.value === (params.composition || composition))?.prompt || composition;
        const ldPrompt = LIGHT_DIRECTION_OPTIONS.find(o => o.value === (params.lightDirection || lightDirection))?.prompt || lightDirection;
        const lsPrompt = LIGHT_STYLE_OPTIONS.find(o => o.value === (params.lightStyle || lightStyle))?.prompt || lightStyle;
        const flPrompt = FOCAL_LENGTH_OPTIONS.find(o => o.value === (params.focalLength || focalLength))?.prompt || focalLength;
        const dofPrompt = DEPTH_OF_FIELD_OPTIONS.find(o => o.value === (params.depthOfField || depthOfField))?.prompt || depthOfField;

        // 修正：動態判斷是否需要 Pro 模型
        const usePro = resolution === '2K' || resolution === '4K';

        try {
            const result = await optimizeAndReangleImage(baseImage.fileData, {
                yaw, pitch, roll, viewMode, lockFace, lockHair, lockOutfit, allowOutpaint,
                composition: compPrompt, 
                lightDirection: ldPrompt, 
                lightStyle: lsPrompt, 
                focalLength: flPrompt, 
                depthOfField: dofPrompt, 
                resolution,
                aspectRatio: aspectRatio === 'original' ? (detectedAspectRatio || 'original') : aspectRatio,
                textureIntensity,
                materialFocus,
                fillLight,
                catchlightStyle,
                filmStock,
                colorGrading,
                quality: params.quality || quality,
                addObject, removeObject, changeStyle,
                additionalPrompt: params.additional_prompt
            }, setLoadingMessage);
            setGeneratedImage(result);
        } catch(err) {
            setError(getFriendlyErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, [baseImage, yaw, pitch, roll, viewMode, lockFace, lockHair, lockOutfit, allowOutpaint, composition, lightDirection, lightStyle, focalLength, depthOfField, resolution, aspectRatio, textureIntensity, materialFocus, fillLight, catchlightStyle, filmStock, colorGrading, quality, addObject, removeObject, changeStyle, setGeneratedImage]);

    const handleAnalyze = async () => {
        if (!baseImage) return;
        setIsAnalyzing(true); setError(null); setAnalysisReport(null);
        try { const report = await getRealismAnalysis(baseImage.fileData); setAnalysisReport(report); } catch (err) { setError(getFriendlyErrorMessage(err)); } finally { setIsAnalyzing(false); }
    };

    const handleApplyAndGenerate = () => {
        if (!analysisReport) return;
        const params = analysisReport.suggested_params;
        if (params.composition) setComposition(params.composition);
        if (params.lightDirection) setLightDirection(params.lightDirection);
        if (params.lightStyle) setLightStyle(params.lightStyle);
        if (params.focalLength) setFocalLength(params.focalLength);
        if (params.depthOfField) setDepthOfField(params.depthOfField);
        if (params.quality) setQuality(Array.isArray(params.quality) ? params.quality : []);
        handleGenerate(params);
    };
    
    const handleQualityChange = (id: string) => { setQuality(prev => prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]); };
    const handleSave = () => { if (generatedImage) { savePortfolioItem({ imageUrl: generatedImage, sourceModule: 'PortfolioOptimization' }); alert('已成功儲存至作品集！'); } };
    const handleDownload = useCallback(() => { if (generatedImage) { const extension = format.toLowerCase(); downloadImage(generatedImage, `pavora-optimized-${Date.now()}.${extension}`, 'PortfolioOptimization'); } }, [generatedImage, format]);
    const displayImage = generatedImage || baseImage?.url;
    const beforeImage = history[cursor - 1] ?? (generatedImage ? baseImage?.url : null);
    const handlePreview = () => { if (displayImage) { setIsPreviewOpen(true); } };
    const handleContextMenu = (e: React.MouseEvent) => { e.preventDefault(); handlePreview(); };

    // Loupe Logic
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!showLoupe || !previewContainerRef.current) return;
        const rect = previewContainerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setLoupePos({ x, y, show: true });
    };

    const handleMouseLeave = () => {
        setLoupePos(prev => ({ ...prev, show: false }));
    };

    // Histogram Component
    const Histogram = ({ imageUrl }: { imageUrl: string }) => {
        const canvasRef = useRef<HTMLCanvasElement>(null);

        React.useEffect(() => {
            if (!imageUrl || !canvasRef.current) return;
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = imageUrl;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                canvas.width = 100;
                canvas.height = 100;
                ctx.drawImage(img, 0, 0, 100, 100);
                const data = ctx.getImageData(0, 0, 100, 100).data;
                
                const hist = new Array(256).fill(0);
                for (let i = 0; i < data.length; i += 4) {
                    const avg = Math.round((data[i] + data[i+1] + data[i+2]) / 3);
                    hist[avg]++;
                }

                const max = Math.max(...hist);
                const outCtx = canvasRef.current?.getContext('2d');
                if (!outCtx) return;
                outCtx.clearRect(0, 0, 256, 100);
                outCtx.fillStyle = '#D4AF37';
                outCtx.globalAlpha = 0.6;
                hist.forEach((val, i) => {
                    const h = (val / max) * 100;
                    outCtx.fillRect(i, 100 - h, 1, h);
                });
            };
        }, [imageUrl]);

        return (
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md p-2 rounded-lg border border-gray-800 pointer-events-none">
                <div className="text-[8px] uppercase tracking-widest text-gray-500 mb-1 font-bold">Luminance</div>
                <canvas ref={canvasRef} width={256} height={100} className="w-32 h-12" />
            </div>
        );
    };


    return (
        <div className="container mx-auto p-8 max-w-8xl animate-fade-in font-sans">
             {isLoading && <Loader message={loadingMessage} />}
            <ModelLoungeModal isOpen={isLoungeOpen} onClose={() => setIsLoungeOpen(false)} onSelect={handleSelectFromLounge} />
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleBaseImageUpload} />
             {isPreviewOpen && displayImage && <ImagePreviewModal images={[displayImage]} startIndex={0} onClose={() => setIsPreviewOpen(false)} />}

            {/* Step Indicator */}
            <div className="flex justify-center mb-12">
                <div className="flex items-center w-full max-w-3xl">
                    {steps.map((step, idx) => (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center relative z-10">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${step.completed ? 'bg-[var(--color-gold)] border-[var(--color-gold)] text-black' : 'bg-black border-gray-700 text-gray-500'}`}>
                                    {step.completed ? <SparklesIcon className="w-5 h-5" /> : <span className="font-mono text-sm">{idx + 1}</span>}
                                </div>
                                <span className={`absolute top-12 whitespace-nowrap text-[10px] uppercase tracking-widest font-bold ${step.completed ? 'text-[var(--color-gold)]' : 'text-gray-600'}`}>
                                    {step.label}
                                </span>
                            </div>
                            {idx < steps.length - 1 && (
                                <div className="flex-grow h-[2px] mx-4 bg-gray-800 relative overflow-hidden">
                                    <div className={`absolute inset-0 bg-[var(--color-gold)] transition-transform duration-1000 origin-left ${step.completed ? 'scale-x-100' : 'scale-x-0'}`}></div>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <div className="relative mb-10 py-2">
                <h2 className="text-5xl font-bold uppercase tracking-tighter text-[var(--color-text-title)] text-center font-display">
                    作品優化 <span className="text-[var(--color-gold)] opacity-50 ml-2">/</span> <span className="text-2xl font-light tracking-[0.2em] opacity-80">Portfolio Optimization</span>
                </h2>
                <div className="absolute top-1/2 right-0 -translate-y-1/2">
                    <Button onClick={onGoHome} variant="secondary" className="px-6 border-gray-800 hover:border-[var(--color-gold)]">返回首頁</Button>
                </div>
            </div>
            {error && <div className="text-center text-red-500 p-3 bg-red-900/50 rounded-md mb-6">{error}</div>}

            { !baseImage ? (
                <Card className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <PhotoIcon className="w-24 h-24 text-gray-500 mb-4" />
                    <h3 className="text-2xl font-bold text-[var(--color-text-title)] mb-4">請選擇要優化的圖片</h3>
                    <div className="flex gap-4">
                        <Button onClick={() => fileInputRef.current?.click()} variant="light">從電腦上傳</Button>
                        <Button onClick={() => setIsLoungeOpen(true)}>從模特兒休息室選擇</Button>
                    </div>
                     <p className="text-sm text-gray-500 mt-4">或從「作品集錦」中選取圖片進入此模組。</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-4 flex flex-col gap-4">
                        {/* Accordion Container */}
                        <div className="space-y-3">
                            {/* Section: AI Analysis */}
                            <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${activeSection === 'analysis' ? 'border-[var(--color-gold)]/50 bg-[var(--color-bg-surface)] shadow-2xl shadow-gold/5' : 'border-gray-800 bg-black/40 hover:border-gray-700'}`}>
                                <button 
                                    onClick={() => setActiveSection(activeSection === 'analysis' ? null : 'analysis')}
                                    className="w-full flex items-center justify-between p-4 text-left group"
                                >
                                    <div className="flex items-center gap-3">
                                        <SparklesIcon className={`w-5 h-5 ${activeSection === 'analysis' ? 'text-[var(--color-gold)]' : 'text-gray-500'}`} />
                                        <span className={`font-bold uppercase tracking-widest text-sm ${activeSection === 'analysis' ? 'text-white' : 'text-gray-400'}`}>AI 寫實度分析</span>
                                    </div>
                                    <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${activeSection === 'analysis' ? 'rotate-180 text-[var(--color-gold)]' : 'text-gray-600'}`} />
                                </button>
                                {activeSection === 'analysis' && (
                                    <div className="p-4 pt-0 animate-slide-down">
                                        {analysisReport ? (
                                            <div className="space-y-4">
                                                <div className="p-4 bg-gray-900/80 rounded-lg border border-gray-800">
                                                    <h4 className="text-[10px] font-bold text-[var(--color-gold)] uppercase tracking-widest mb-3">AI 診斷報告</h4>
                                                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">{analysisReport.critique_zh}</p>
                                                </div>
                                                <Button onClick={handleApplyAndGenerate} className="w-full py-3 shadow-lg shadow-gold/10">套用 AI 建議並優化</Button>
                                            </div>
                                        ) : (
                                            <Button onClick={handleAnalyze} isLoading={isAnalyzing} className="w-full py-3"><SparklesIcon className="w-5 h-5 mr-2" />開始分析</Button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Section: Content Editing */}
                            <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${activeSection === 'content' ? 'border-[var(--color-gold)]/50 bg-[var(--color-bg-surface)] shadow-2xl shadow-gold/5' : 'border-gray-800 bg-black/40 hover:border-gray-700'}`}>
                                <button 
                                    onClick={() => setActiveSection(activeSection === 'content' ? null : 'content')}
                                    className="w-full flex items-center justify-between p-4 text-left group"
                                >
                                    <div className="flex items-center gap-3">
                                        <BeakerIcon className={`w-5 h-5 ${activeSection === 'content' ? 'text-[var(--color-gold)]' : 'text-gray-500'}`} />
                                        <span className={`font-bold uppercase tracking-widest text-sm ${activeSection === 'content' ? 'text-white' : 'text-gray-400'}`}>內容編輯 (Nano banana)</span>
                                    </div>
                                    <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${activeSection === 'content' ? 'rotate-180 text-[var(--color-gold)]' : 'text-gray-600'}`} />
                                </button>
                                {activeSection === 'content' && (
                                    <div className="p-4 pt-0 space-y-4 animate-slide-down">
                                        <div><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">新增物件</label><input value={addObject} onChange={e => setAddObject(e.target.value)} placeholder="e.g., a black leather handbag" className="w-full bg-gray-900 border border-gray-800 p-3 rounded-lg text-sm focus:border-[var(--color-gold)] outline-none transition-colors"/></div>
                                        <div><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">移除物件</label><input value={removeObject} onChange={e => setRemoveObject(e.target.value)} placeholder="e.g., the necklace" className="w-full bg-gray-900 border border-gray-800 p-3 rounded-lg text-sm focus:border-[var(--color-gold)] outline-none transition-colors"/></div>
                                        <div><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">風格轉換</label><input value={changeStyle} onChange={e => setChangeStyle(e.target.value)} placeholder="e.g., 90s vintage film photo" className="w-full bg-gray-900 border border-gray-800 p-3 rounded-lg text-sm focus:border-[var(--color-gold)] outline-none transition-colors"/></div>
                                    </div>
                                )}
                            </div>

                            {/* Section: Output Settings */}
                            <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${activeSection === 'output' ? 'border-[var(--color-gold)]/50 bg-[var(--color-bg-surface)] shadow-2xl shadow-gold/5' : 'border-gray-800 bg-black/40 hover:border-gray-700'}`}>
                                <button 
                                    onClick={() => setActiveSection(activeSection === 'output' ? null : 'output')}
                                    className="w-full flex items-center justify-between p-4 text-left group"
                                >
                                    <div className="flex items-center gap-3">
                                        <ViewColumnsIcon className={`w-5 h-5 ${activeSection === 'output' ? 'text-[var(--color-gold)]' : 'text-gray-500'}`} />
                                        <span className={`font-bold uppercase tracking-widest text-sm ${activeSection === 'output' ? 'text-white' : 'text-gray-400'}`}>輸出設定</span>
                                    </div>
                                    <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${activeSection === 'output' ? 'rotate-180 text-[var(--color-gold)]' : 'text-gray-600'}`} />
                                </button>
                                {activeSection === 'output' && (
                                    <div className="p-4 pt-0 space-y-5 animate-slide-down">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">解析度 (Resolution)</label>
                                            <Select options={RESOLUTION_OPTIONS} value={resolution} onChange={(e) => setResolution(e.target.value)} />
                                            { (resolution === '2K' || resolution === '4K') && <p className="text-[9px] text-[var(--color-gold)] mt-2 font-mono uppercase tracking-tighter">※ 升頻模式將啟動 Pro 級別渲染引擎</p>}
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">圖片比例 (Aspect Ratio)</label>
                                            <Select options={ASPECT_RATIO_OPTIONS} value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">輸出格式</label>
                                            <div className="flex gap-2">
                                                {FORMAT_OPTIONS.map(f => (
                                                    <Button key={f} onClick={() => setFormat(f)} variant={format === f ? 'light' : 'secondary'} className="flex-1 py-2 text-[10px] font-mono">{f}</Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Section: Color Science */}
                            <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${activeSection === 'color' ? 'border-[var(--color-gold)]/50 bg-[var(--color-bg-surface)] shadow-2xl shadow-gold/5' : 'border-gray-800 bg-black/40 hover:border-gray-700'}`}>
                                <button 
                                    onClick={() => setActiveSection(activeSection === 'color' ? null : 'color')}
                                    className="w-full flex items-center justify-between p-4 text-left group"
                                >
                                    <div className="flex items-center gap-3">
                                        <AdjustmentsIcon className={`w-5 h-5 ${activeSection === 'color' ? 'text-[var(--color-gold)]' : 'text-gray-500'}`} />
                                        <span className={`font-bold uppercase tracking-widest text-sm ${activeSection === 'color' ? 'text-white' : 'text-gray-400'}`}>色彩科學 (Color Science)</span>
                                    </div>
                                    <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${activeSection === 'color' ? 'rotate-180 text-[var(--color-gold)]' : 'text-gray-600'}`} />
                                </button>
                                {activeSection === 'color' && (
                                    <div className="p-4 pt-0 space-y-5 animate-slide-down">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">膠片模擬 (Film Stock)</label>
                                            <Select options={FILM_STOCK_OPTIONS} value={filmStock} onChange={(e) => setFilmStock(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">電影級調色 (Color Grading)</label>
                                            <Select options={COLOR_GRADING_OPTIONS} value={colorGrading} onChange={(e) => setColorGrading(e.target.value)} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Section: Lighting */}
                            <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${activeSection === 'lighting' ? 'border-[var(--color-gold)]/50 bg-[var(--color-bg-surface)] shadow-2xl shadow-gold/5' : 'border-gray-800 bg-black/40 hover:border-gray-700'}`}>
                                <button 
                                    onClick={() => setActiveSection(activeSection === 'lighting' ? null : 'lighting')}
                                    className="w-full flex items-center justify-between p-4 text-left group"
                                >
                                    <div className="flex items-center gap-3">
                                        <CameraIcon className={`w-5 h-5 ${activeSection === 'lighting' ? 'text-[var(--color-gold)]' : 'text-gray-500'}`} />
                                        <span className={`font-bold uppercase tracking-widest text-sm ${activeSection === 'lighting' ? 'text-white' : 'text-gray-400'}`}>光影重塑 (Lighting Reshaping)</span>
                                    </div>
                                    <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${activeSection === 'lighting' ? 'rotate-180 text-[var(--color-gold)]' : 'text-gray-600'}`} />
                                </button>
                                {activeSection === 'lighting' && (
                                    <div className="p-4 pt-0 space-y-5 animate-slide-down">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">虛擬補光 (Fill Light)</label>
                                            <Select options={FILL_LIGHT_OPTIONS} value={fillLight} onChange={(e) => setFillLight(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">眼神光樣式 (Catchlight)</label>
                                            <Select options={CATCHLIGHT_STYLE_OPTIONS} value={catchlightStyle} onChange={(e) => setCatchlightStyle(e.target.value)} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            {QUALITY_OPTIONS.filter(q => ['rim-light', 'catchlight'].includes(q.id)).map(q => (
                                                <div key={q.id} className="flex items-center group/check cursor-pointer" onClick={() => handleQualityChange(q.id)}>
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${quality.includes(q.id) ? 'bg-[var(--color-gold)] border-[var(--color-gold)]' : 'border-gray-700 group-hover/check:border-[var(--color-gold)]/50'}`}>
                                                        {quality.includes(q.id) && <div className="w-2 h-2 bg-black rounded-full" />}
                                                    </div>
                                                    <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover/check:text-gray-200">{q.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Section: Texture */}
                            <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${activeSection === 'texture' ? 'border-[var(--color-gold)]/50 bg-[var(--color-bg-surface)] shadow-2xl shadow-gold/5' : 'border-gray-800 bg-black/40 hover:border-gray-700'}`}>
                                <button 
                                    onClick={() => setActiveSection(activeSection === 'texture' ? null : 'texture')}
                                    className="w-full flex items-center justify-between p-4 text-left group"
                                >
                                    <div className="flex items-center gap-3">
                                        <AdjustmentsIcon className={`w-5 h-5 ${activeSection === 'texture' ? 'text-[var(--color-gold)]' : 'text-gray-500'}`} />
                                        <span className={`font-bold uppercase tracking-widest text-sm ${activeSection === 'texture' ? 'text-white' : 'text-gray-400'}`}>質感覺醒 (Texture Awakening)</span>
                                    </div>
                                    <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${activeSection === 'texture' ? 'rotate-180 text-[var(--color-gold)]' : 'text-gray-600'}`} />
                                </button>
                                {activeSection === 'texture' && (
                                    <div className="p-4 pt-0 space-y-5 animate-slide-down">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">質感強度 (Intensity)</label>
                                            <Select options={TEXTURE_INTENSITY_OPTIONS} value={textureIntensity} onChange={(e) => setTextureIntensity(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">材質重點 (Material Focus)</label>
                                            <Select options={MATERIAL_FOCUS_OPTIONS} value={materialFocus} onChange={(e) => setMaterialFocus(e.target.value)} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            {QUALITY_OPTIONS.filter(q => ['skin-texture', 'fabric-fidelity', '8k-reconstruct'].includes(q.id)).map(q => (
                                                <div key={q.id} className="flex items-center group/check cursor-pointer" onClick={() => handleQualityChange(q.id)}>
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${quality.includes(q.id) ? 'bg-[var(--color-gold)] border-[var(--color-gold)]' : 'border-gray-700 group-hover/check:border-[var(--color-gold)]/50'}`}>
                                                        {quality.includes(q.id) && <div className="w-2 h-2 bg-black rounded-full" />}
                                                    </div>
                                                    <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover/check:text-gray-200">{q.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Section: Viewport */}
                            <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${activeSection === 'viewport' ? 'border-[var(--color-gold)]/50 bg-[var(--color-bg-surface)] shadow-2xl shadow-gold/5' : 'border-gray-800 bg-black/40 hover:border-gray-700'}`}>
                                <button 
                                    onClick={() => setActiveSection(activeSection === 'viewport' ? null : 'viewport')}
                                    className="w-full flex items-center justify-between p-4 text-left group"
                                >
                                    <div className="flex items-center gap-3">
                                        <CubeIcon className={`w-5 h-5 ${activeSection === 'viewport' ? 'text-[var(--color-gold)]' : 'text-gray-500'}`} />
                                        <span className={`font-bold uppercase tracking-widest text-sm ${activeSection === 'viewport' ? 'text-white' : 'text-gray-400'}`}>視角調整</span>
                                    </div>
                                    <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${activeSection === 'viewport' ? 'rotate-180 text-[var(--color-gold)]' : 'text-gray-600'}`} />
                                </button>
                                {activeSection === 'viewport' && (
                                    <div className="p-4 pt-0 space-y-6 animate-slide-down">
                                        <Slider label="水平 (Yaw)" min={-45} max={45} value={yaw} onChange={e => setYaw(Number(e.target.value))} unit="°" />
                                        <Slider label="俯仰 (Pitch)" min={-30} max={30} value={pitch} onChange={e => setPitch(Number(e.target.value))} unit="°" />
                                        <Slider label="滾動 (Roll)" min={-20} max={20} value={roll} onChange={e => setRoll(Number(e.target.value))} unit="°" />
                                        <div className="flex justify-center gap-2 pt-2">
                                            <Button onClick={()=>setViewMode('relative')} variant={viewMode==='relative'?'light':'secondary'} className="flex-1 text-[10px] uppercase tracking-widest">相對</Button>
                                            <Button onClick={()=>setViewMode('absolute')} variant={viewMode==='absolute'?'light':'secondary'} className="flex-1 text-[10px] uppercase tracking-widest">絕對</Button>
                                        </div>
                                        <Button variant="secondary" onClick={() => { setYaw(0); setPitch(0); setRoll(0); }} className="w-full text-[10px] uppercase tracking-widest border-gray-800">重置視角</Button>
                                    </div>
                                )}
                            </div>

                            {/* Section: Lock & Extend */}
                            <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${activeSection === 'lock' ? 'border-[var(--color-gold)]/50 bg-[var(--color-bg-surface)] shadow-2xl shadow-gold/5' : 'border-gray-800 bg-black/40 hover:border-gray-700'}`}>
                                <button 
                                    onClick={() => setActiveSection(activeSection === 'lock' ? null : 'lock')}
                                    className="w-full flex items-center justify-between p-4 text-left group"
                                >
                                    <div className="flex items-center gap-3">
                                        <LockClosedIcon className={`w-5 h-5 ${activeSection === 'lock' ? 'text-[var(--color-gold)]' : 'text-gray-500'}`} />
                                        <span className={`font-bold uppercase tracking-widest text-sm ${activeSection === 'lock' ? 'text-white' : 'text-gray-400'}`}>鎖定與擴展</span>
                                    </div>
                                    <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${activeSection === 'lock' ? 'rotate-180 text-[var(--color-gold)]' : 'text-gray-600'}`} />
                                </button>
                                {activeSection === 'lock' && (
                                    <div className="p-4 pt-0 space-y-4 animate-slide-down">
                                        {[ 
                                            {id:'lockFace', label:'鎖定臉部', value:lockFace, setter:setLockFace}, 
                                            {id:'lockHair', label:'鎖定髮型', value:lockHair, setter:setLockHair}, 
                                            {id:'lockOutfit', label:'鎖定服裝', value:lockOutfit, setter:setLockOutfit},
                                            {id:'allowOutpaint', label:'允許畫面擴展 (Outpaint)', value:allowOutpaint, setter:setAllowOutpaint}
                                        ].map(opt => (
                                            <div key={opt.id} className="flex items-center group/check cursor-pointer" onClick={() => opt.setter(!opt.value)}>
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${opt.value ? 'bg-[var(--color-gold)] border-[var(--color-gold)]' : 'border-gray-700 group-hover/check:border-[var(--color-gold)]/50'}`}>
                                                    {opt.value && <div className="w-2 h-2 bg-black rounded-full" />}
                                                </div>
                                                <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover/check:text-gray-200">{opt.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Main Action Button */}
                        <div className="mt-4">
                            <Button 
                                onClick={() => handleGenerate()} 
                                isLoading={isLoading} 
                                className="w-full py-4 text-lg font-bold uppercase tracking-[0.2em] shadow-2xl shadow-gold/20"
                            >
                                <SparklesIcon className="w-6 h-6 mr-2" />
                                立即優化
                            </Button>
                        </div>
                    </div>
                    <div className="lg:col-span-8">
                        <Card className="h-full min-h-[60vh] flex flex-col border-gray-800 bg-black/20 overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-[0.3em]">Live Preview</h3>
                                    {generatedImage && (
                                        <div className="flex bg-black/40 p-1 rounded-lg border border-gray-800 gap-1">
                                            <button 
                                                onClick={() => setComparisonMode('slider')}
                                                className={`p-1.5 rounded transition-colors ${comparisonMode === 'slider' ? 'bg-[var(--color-gold)] text-black' : 'text-gray-500 hover:text-gray-300'}`}
                                                title="滑桿對比模式"
                                            >
                                                <Split className="w-3.5 h-3.5" />
                                            </button>
                                            <button 
                                                onClick={() => setComparisonMode('side-by-side')}
                                                className={`p-1.5 rounded transition-colors ${comparisonMode === 'side-by-side' ? 'bg-[var(--color-gold)] text-black' : 'text-gray-500 hover:text-gray-300'}`}
                                                title="左右並排模式"
                                            >
                                                <Columns className="w-3.5 h-3.5" />
                                            </button>
                                            <button 
                                                onClick={() => setComparisonMode('toggle')}
                                                className={`p-1.5 rounded transition-colors ${comparisonMode === 'toggle' ? 'bg-[var(--color-gold)] text-black' : 'text-gray-500 hover:text-gray-300'}`}
                                                title="點擊切換模式"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-gray-800">
                                        <button 
                                            onClick={() => setShowLoupe(!showLoupe)}
                                            className={`p-1.5 rounded transition-colors ${showLoupe ? 'bg-[var(--color-gold)] text-black' : 'text-gray-500 hover:text-gray-300'}`}
                                            title="放大鏡檢視"
                                        >
                                            <Search className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                            onClick={() => setShowHistogram(!showHistogram)}
                                            className={`p-1.5 rounded transition-colors ${showHistogram ? 'bg-[var(--color-gold)] text-black' : 'text-gray-500 hover:text-gray-300'}`}
                                            title="亮度直方圖"
                                        >
                                            <BarChart3 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setIsSmartLinkEnabled(!isSmartLinkEnabled)}
                                            className={`flex items-center gap-1 px-2 py-1 rounded border transition-all ${isSmartLinkEnabled ? 'bg-[var(--color-gold)]/10 border-[var(--color-gold)]/50 text-[var(--color-gold)]' : 'border-gray-800 text-gray-600'}`}
                                            title="智慧參數聯動"
                                        >
                                            <RefreshCw className={`w-3 h-3 ${isSmartLinkEnabled ? 'animate-spin-slow' : ''}`} />
                                            <span className="text-[8px] font-bold uppercase tracking-widest">Smart Link</span>
                                        </button>
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="text-[10px] text-gray-500 font-mono uppercase">Ready</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div 
                                ref={previewContainerRef}
                                className="flex-grow bg-gray-900/30 rounded-xl flex items-center justify-center relative border border-gray-800/50 overflow-hidden group/preview cursor-crosshair"
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                                onClick={() => comparisonMode === 'toggle' && setIsToggled(!isToggled)}
                            >
                                {beforeImage && generatedImage ? (
                                    comparisonMode === 'slider' ? (
                                        <ImageCompareSlider beforeImage={beforeImage} afterImage={generatedImage} />
                                    ) : comparisonMode === 'side-by-side' ? (
                                        <div className="flex w-full h-full gap-2 p-2">
                                            <div className="flex-1 relative overflow-hidden rounded-lg border border-gray-800">
                                                <img src={beforeImage} alt="Before" className="w-full h-full object-contain" />
                                                <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md text-[8px] font-bold uppercase tracking-widest text-gray-400 rounded">Before</div>
                                            </div>
                                            <div className="flex-1 relative overflow-hidden rounded-lg border border-gray-800">
                                                <img src={generatedImage} alt="After" className="w-full h-full object-contain" />
                                                <div className="absolute top-2 left-2 px-2 py-1 bg-[var(--color-gold)] text-black text-[8px] font-bold uppercase tracking-widest rounded">After</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            <img 
                                                src={isToggled ? beforeImage : generatedImage} 
                                                alt="Toggled" 
                                                className="max-h-full max-w-full object-contain transition-all duration-300"
                                            />
                                            <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md border border-gray-800 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-gold)] rounded-full">
                                                {isToggled ? 'Original' : 'Optimized'} (Click to Toggle)
                                            </div>
                                        </div>
                                    )
                                ) : displayImage ? (
                                    <img src={displayImage} alt="Optimized" className="max-h-full max-w-full object-contain transition-transform duration-700 group-hover/preview:scale-[1.02]" onContextMenu={handleContextMenu} />
                                ) : (
                                    <div className="text-center text-gray-600">
                                        <PhotoIcon className="w-20 h-20 mx-auto mb-6 opacity-20" />
                                        <p className="text-xs uppercase tracking-[0.2em] font-bold opacity-40">Waiting for input</p>
                                    </div>
                                )}
                                
                                {/* Loupe Tool Overlay */}
                                {showLoupe && loupePos.show && displayImage && (
                                    <div 
                                        className="absolute w-48 h-48 rounded-full border-2 border-[var(--color-gold)] shadow-2xl pointer-events-none overflow-hidden z-50 bg-gray-900"
                                        style={{ 
                                            left: `${loupePos.x}%`, 
                                            top: `${loupePos.y}%`,
                                            transform: 'translate(-50%, -50%)',
                                            backgroundImage: `url(${displayImage})`,
                                            backgroundSize: '800%', // 8x zoom
                                            backgroundPosition: `${loupePos.x}% ${loupePos.y}%`,
                                            backgroundRepeat: 'no-repeat'
                                        }}
                                    >
                                        <div className="absolute inset-0 border-[12px] border-black/20 rounded-full"></div>
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-[var(--color-gold)]/30 rounded-full"></div>
                                    </div>
                                )}

                                {/* Histogram Overlay */}
                                {showHistogram && displayImage && <Histogram imageUrl={displayImage} />}

                                {displayImage && (
                                    <div className="absolute top-4 right-4 opacity-0 group-hover/preview:opacity-100 transition-opacity flex gap-2">
                                        <Button onClick={() => setIsPreviewOpen(true)} variant="secondary" className="p-2 bg-black/60 backdrop-blur-md border-gray-700">
                                            <Maximize2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Batch Preview / History Strip */}
                            {history.length > 1 && (
                                <div className="mt-4 pb-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[8px] font-bold uppercase tracking-widest text-gray-600">History Strip</span>
                                        <div className="h-[1px] flex-grow bg-gray-800/50"></div>
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                        {history.map((img, idx) => img && (
                                            <button 
                                                key={idx}
                                                onClick={() => {
                                                    // This is a bit hacky since useHistoryState doesn't expose a 'jumpTo'
                                                    // But we can simulate it by undoing/redoing if needed, 
                                                    // or just show it as a reference.
                                                    // For now, let's just set it as the generated image if possible.
                                                    setGeneratedImage(img);
                                                }}
                                                className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 transition-all overflow-hidden ${generatedImage === img ? 'border-[var(--color-gold)] scale-105' : 'border-gray-800 opacity-50 hover:opacity-100'}`}
                                            >
                                                <img src={img} alt={`History ${idx}`} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {displayImage && (
                                <div className="mt-8 flex flex-wrap justify-center gap-4">
                                    <div className="flex bg-black/40 p-1 rounded-lg border border-gray-800">
                                        <Button onClick={undo} disabled={!canUndo} variant="secondary" className="border-none bg-transparent hover:bg-white/5 px-4"><ChevronLeftIcon className="w-5 h-5"/></Button>
                                        <div className="w-[1px] bg-gray-800 my-2"></div>
                                        <Button onClick={redo} disabled={!canRedo} variant="secondary" className="border-none bg-transparent hover:bg-white/5 px-4"><ChevronRightIcon className="w-5 h-5"/></Button>
                                    </div>
                                    
                                    {generatedImage && (
                                        <div className="flex gap-3">
                                            <Button onClick={handleSave} variant="secondary" className="px-6 border-gray-800 hover:border-[var(--color-gold)]">儲存至作品集</Button>
                                            <Button onClick={handleDownload} variant="light" className="px-6 flex items-center gap-2 shadow-lg shadow-gold/10">
                                                <DownloadIcon className="w-4 h-4"/> 下載
                                            </Button>
                                            {onContinueEditing && (
                                                <Button onClick={() => onContinueEditing(generatedImage, 'pcpe')} variant="secondary" className="px-6 border-[var(--color-gold)]/30 text-[var(--color-gold)]">
                                                    製作海報 &rarr;
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PortfolioOptimization;
