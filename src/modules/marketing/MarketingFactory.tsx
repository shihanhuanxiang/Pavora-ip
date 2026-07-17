import React, { useState, useRef, useCallback } from 'react';
import Loader from '../../shared/components/common/Loader';
import { useBrandStore } from '../../shared/stores/useBrandStore';
import { 
    fileToBase64, 
    removeBackground, 
    analyzeEGenProduct, 
    defineEGenStyle, 
    generateEGenCopy, 
    transformImage,
    analyzeLuxuryProduct,
    getAIDiagnosis,
    getBackgroundCards,
    getAllControlOptions,
    generateProductPoster,
    generateSocialCopy,
    generateCampaignStrategy,
    getFriendlyErrorMessage
} from '../../shared/services/geminiService';
import { EGEN_MATRIX_CELLS, buildEGenBatchPrompt } from '../../prompts/eGen';
import { buildLuxuryVisualPrompt } from '../../prompts/luxuryVisual';
import { REELS_VIDEO_PROMPT } from '../../prompts/marketing';
import { generateVideo } from '../../modules/directorMode/services/directorService';
import { downloadImage, imageUrlToimageData } from '../../shared/utils/imageUtils';
import { useNotification } from '../../shared/context/NotificationContext';

import PosterEngineIcon from '../../shared/assets/icons/PosterEngineIcon';
import SparklesIcon from '../../shared/assets/icons/SparklesIcon';
import PhotoIcon from '../../shared/assets/icons/PhotoIcon';
import DownloadIcon from '../../shared/assets/icons/DownloadIcon';
import CloseIcon from '../../shared/assets/icons/CloseIcon';
import CheckIcon from '../../shared/assets/icons/CheckIcon';
import EGenIcon from '../../shared/assets/icons/EGenIcon';
import LuxuryVisualIcon from '../../shared/assets/icons/LuxuryVisualIcon';
import Face3DIcon from '../../shared/assets/icons/Face3DIcon';
import AsyncImage from '../../shared/components/common/AsyncImage';
import VideoPlayer from '../../shared/components/common/VideoPlayer';

import LuxuryVisualStudio from '../luxuryVisual/LuxuryVisualStudio';
import EGenStudio from '../eGen/EGenStudio';
import ProductPosterEngine from '../pcpe/ProductPosterEngine';
import FashionArchitect from '../fashionArchitect/FashionArchitect';

interface MarketingFactoryProps {
  onGoHome: () => void;
  initialView?: 'FACTORY' | 'EGEN' | 'LUXURY' | 'POSTER';
  initialImage?: { url: string; fileData: { data: string; mimeType: string; } } | null;
}

interface BatchItem {
    id: string;
    originalUrl: string;
    processedUrl: string | null;
    fileData: { data: string; mimeType: string };
    status: 'uploading' | 'processing' | 'ready' | 'error';
    diagnosis?: any;
    view: 'front' | 'back' | 'side' | 'detail';
}

type ProductionMode = 'EGEN_MATRIX' | 'LUXURY_HERO' | 'SMART_POSTER' | 'REELS_GENERATOR' | 'ONE_CLICK_CAMPAIGN' | 'FASHION_ARCHITECT';

interface CampaignResult {
    strategy: any;
    copy: { [key: string]: string };
    assets: { id: string; url: string; type: string; mediaType: 'image' | 'video' }[];
}

const MarketingFactory: React.FC<MarketingFactoryProps> = ({ onGoHome, initialView = 'FACTORY', initialImage }) => {
    const { addNotification, addTask, updateTask } = useNotification();
    const [currentView, setCurrentView] = useState<'FACTORY' | 'EGEN' | 'LUXURY' | 'POSTER' | 'ARCHITECT'>(initialView as any);
    const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
    const [selectedMode, setSelectedMode] = useState<ProductionMode | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [results, setResults] = useState<{ id: string; url: string; type: string; mediaType: 'image' | 'video'; copy?: string }[]>([]);
    const [campaign, setCampaign] = useState<CampaignResult | null>(null);
    const [activeCampaignTab, setActiveCampaignTab] = useState<'assets' | 'strategy'>('assets');
    const [activePlatform, setActivePlatform] = useState<'Instagram' | 'TikTok' | 'Facebook'>('Instagram');
    const [quality, setQuality] = useState<'FAST' | 'STANDARD' | 'MAX'>('STANDARD');
    const [imageCount, setImageCount] = useState<number>(1);
    const [useAmbassador, setUseAmbassador] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    
    const { ambassadors, activeAmbassadorId } = useBrandStore();
    const activeAmbassador = ambassadors.find(a => a.id === activeAmbassadorId);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const tabs = [
        { id: 'FACTORY', zh: '批次生產線', en: 'Batch Production', icon: <PosterEngineIcon /> },
        { id: 'POSTER', zh: '影像總監', en: 'Poster Engine', icon: <SparklesIcon /> },
        { id: 'ARCHITECT', zh: '視覺架構師', en: 'Fashion Architect', icon: <Face3DIcon /> },
        { id: 'EGEN', zh: '電商全鏈路', en: 'E-Gen Studio', icon: <EGenIcon /> },
        { id: 'LUXURY', zh: '廣告視覺生成', en: 'Luxury Visual', icon: <LuxuryVisualIcon /> },
    ];

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files: File[] = Array.from(e.target.files);
            const newItems: BatchItem[] = [];
            
            addNotification({
                type: 'info',
                message: `正在上傳 ${files.length} 張商品圖片`,
                duration: 3000
            });

            for (const file of files) {
                const id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const originalUrl = URL.createObjectURL(file);
                const fileData = await fileToBase64(file);
                
                newItems.push({
                    id,
                    originalUrl,
                    processedUrl: null,
                    fileData,
                    status: 'uploading',
                    view: 'front'
                });
            }
            
            setBatchItems(prev => [...prev, ...newItems]);
            
            // Start background removal for each new item
            newItems.forEach(item => processItem(item.id));
        }
    };

    const processItem = async (id: string) => {
        setBatchItems(prev => prev.map(item => item.id === id ? { ...item, status: 'processing' } : item));
        
        try {
            const item = batchItems.find(i => i.id === id) || (await new Promise<BatchItem | undefined>(resolve => {
                setBatchItems(prev => {
                    const found = prev.find(i => i.id === id);
                    resolve(found);
                    return prev;
                });
            }));
            
            if (!item) return;
            
            const processedUrl = await removeBackground(item.fileData);
            setBatchItems(prev => prev.map(i => i.id === id ? { ...i, processedUrl, status: 'ready' } : i));
        } catch (e) {
            setBatchItems(prev => prev.map(i => i.id === id ? { ...i, status: 'error' } : i));
        }
    };

    const removeItem = (id: string) => {
        setBatchItems(prev => prev.filter(item => item.id !== id));
    };

    const updateItemView = (id: string, view: BatchItem['view']) => {
        setBatchItems(prev => prev.map(item => item.id === id ? { ...item, view } : item));
    };

    const runProduction = async () => {
        if (!selectedMode || batchItems.length === 0) return;
        
        setIsLoading(true);
        setResults([]);
        
        try {
            if (selectedMode === 'EGEN_MATRIX') {
                await runEGenBatch();
            } else if (selectedMode === 'LUXURY_HERO') {
                await runLuxuryBatch();
            } else if (selectedMode === 'SMART_POSTER') {
                await runSmartPosterBatch();
            } else if (selectedMode === 'FASHION_ARCHITECT') {
                setCurrentView('ARCHITECT');
            } else if (selectedMode === 'REELS_GENERATOR') {
                await runReelsBatch();
            } else if (selectedMode === 'ONE_CLICK_CAMPAIGN') {
                await runOneClickCampaign();
            }
        } catch (e) {
            console.error("Production failed", e);
            alert("生產過程中發生錯誤，請重試。");
        } finally {
            setIsLoading(false);
        }
    };

    const runEGenBatch = async () => {
        setLoadingMessage("正在啟動 E-Gen 高階生產線...");
        const readyItems = batchItems.filter(i => i.status === 'ready');
        if (readyItems.length === 0) return;
        
        const ambassadorData = (activeAmbassador && useAmbassador) ? await imageUrlToimageData(activeAmbassador.imageUrl) : undefined;
        
        // Find best front view
        const userFrontIndex = readyItems.findIndex(i => i.view === 'front');
        const primaryItem = userFrontIndex !== -1 ? readyItems[userFrontIndex] : readyItems[0];
        const otherItemsData = readyItems.filter(i => i.id !== primaryItem.id).map(i => i.fileData);
        const allRefs = ambassadorData ? [ambassadorData, ...otherItemsData] : otherItemsData;

        setLoadingMessage(`正在深度分析商品細節與多角度特徵...`);
        const analysis = await analyzeEGenProduct(readyItems.map(i => i.fileData));
        const style = await defineEGenStyle(JSON.stringify(analysis));
        
        const styles = [
            { name: '正面大片 (Hero)', suffix: '正面視圖, 完美對稱, 頂級光影' },
            { name: '質感細節 (Detail)', suffix: '宏觀特寫, 材質紋理清晰, 淺景深' },
            { name: '場景氛圍 (Ambient)', suffix: '生活化場景, 自然光影, 品牌調性' },
            { name: '藝術構圖 (Artistic)', suffix: '獨特視角, 藝術化構圖, 戲劇性光影' }
        ].slice(0, imageCount);

        const newResults = [];
        for (let i = 0; i < styles.length; i++) {
            const s = styles[i];
            setLoadingMessage(`正在渲染 ${s.name} (${i + 1}/${styles.length})...`);
            const prompt = buildEGenBatchPrompt(EGEN_MATRIX_CELLS[0], analysis, style, s.suffix, "Ultra-high definition, photorealistic, cinematic lighting, 8k resolution, extreme detail, professional product photography. Maintain consistency with all provided product angles.");
            const url = await transformImage(primaryItem.fileData, prompt, allRefs, (msg) => setLoadingMessage(msg), {
                usePro: quality !== 'FAST',
                imageConfig: { imageSize: quality === 'MAX' ? '4K' : '2K', aspectRatio: '3:4' }
            });
            newResults.push({ id: `res_${Date.now()}_egen_${i}`, url, type: `E-Gen: ${s.name}`, mediaType: 'image' as const });
        }
        setResults(newResults);
    };

    const runLuxuryBatch = async () => {
        setLoadingMessage("正在啟動奢華視覺生產線...");
        const readyItems = batchItems.filter(i => i.status === 'ready');
        if (readyItems.length === 0) return;

        const ambassadorData = (activeAmbassador && useAmbassador) ? await imageUrlToimageData(activeAmbassador.imageUrl) : undefined;
        
        const userFrontIndex = readyItems.findIndex(i => i.view === 'front');
        const primaryItem = userFrontIndex !== -1 ? readyItems[userFrontIndex] : readyItems[0];
        const otherItemsData = readyItems.filter(i => i.id !== primaryItem.id).map(i => i.fileData);
        const allRefs = ambassadorData ? [ambassadorData, ...otherItemsData] : otherItemsData;
        
        setLoadingMessage(`正在為商品進行多維度奢華視覺建模...`);
        const analysis = await analyzeLuxuryProduct(readyItems.map(i => i.fileData), readyItems.map(i => i.view));
        
        const luxuryStyles = [
            { name: '黑曜石 (Obsidian)', style: 'OBSIDIAN_NOIR' },
            { name: '皇家金 (Royal Gold)', style: 'ROYAL_GOLD' },
            { name: '極光白 (Aurora)', style: 'AURORA_WHITE' },
            { name: '霓虹未來 (Neon)', style: 'NEON_FUTURISM' }
        ].slice(0, imageCount);

        const newResults = [];
        for (let i = 0; i < luxuryStyles.length; i++) {
            const s = luxuryStyles[i];
            setLoadingMessage(`正在渲染奢華視覺 ${s.name} (${i + 1}/${luxuryStyles.length})...`);
            const prompt = buildLuxuryVisualPrompt({
                mode: 'LUXURY_POSTER',
                level: quality === 'MAX' ? 'MAX' : 'FAST',
                masterStyle: s.style as any,
                subject: {
                    category: analysis.category,
                    material: analysis.material,
                    color_palette: analysis.colors,
                    brand: analysis.brand,
                    logo_visibility: 'on',
                    texture_detail: 'high',
                    transparency_level: 100
                },
                ingredients_composition: '',
                camera: { focal_length: '100mm', dof_intensity: 80, composition: 'centered' },
                effect: { organic: 'silk_ribbons', particle: 'sparkle', intensity: 70 },
                background: 'luxury_black_marble',
                lighting: 'cinematic_soft_box',
                ratio: '3:4',
                custom_prompt: 'Ultra-realistic, high-end commercial photography, ray tracing, global illumination, hyper-detailed textures. Ensure product details match all provided reference angles.'
            });
            const url = await transformImage(primaryItem.fileData, prompt, allRefs, (msg) => setLoadingMessage(msg), {
                usePro: quality !== 'FAST',
                imageConfig: { imageSize: quality === 'MAX' ? '4K' : '2K', aspectRatio: '3:4' }
            });
            newResults.push({ id: `res_${Date.now()}_luxury_${i}`, url, type: `Luxury: ${s.name}`, mediaType: 'image' as const });
        }
        setResults(newResults);
    };

    const runSmartPosterBatch = async () => {
        setLoadingMessage("正在啟動智能海報生產線...");
        const readyItems = batchItems.filter(i => i.status === 'ready');
        if (readyItems.length === 0) return;

        const ambassadorData = (activeAmbassador && useAmbassador) ? await imageUrlToimageData(activeAmbassador.imageUrl) : undefined;
        
        const userFrontIndex = readyItems.findIndex(i => i.view === 'front');
        const primaryItem = userFrontIndex !== -1 ? readyItems[userFrontIndex] : readyItems[0];

        setLoadingMessage(`正在進行多角度 AI 影像診斷...`);
        const diag = await getAIDiagnosis(primaryItem.fileData as any, true);
        
        setLoadingMessage("正在生成頂級創意概念...");
        const cards = await getBackgroundCards(diag);
        const selectedCard = cards[0];
        
        setLoadingMessage("正在規劃專業微調選項...");
        await getAllControlOptions(diag, selectedCard);
        
        setLoadingMessage("正在執行最終高階海報渲染...");
        const result = await generateProductPoster(
            { subjectImage: primaryItem.fileData as any, isModel: true, ratio: '9:16', quality: quality === 'MAX' ? 'high' : 'standard' } as any,
            diag,
            selectedCard,
            {
                background: selectedCard.background,
                camera: selectedCard.camera,
                pose: selectedCard.pose,
                lighting: selectedCard.lighting,
                props: selectedCard.props
            },
            (msg) => setLoadingMessage(msg),
            ambassadorData
        );
        
        setResults([{ id: `res_${Date.now()}_smart`, url: result.url, type: 'Smart Poster', mediaType: 'image' }]);
    };

    const runReelsBatch = async () => {
        setLoadingMessage("正在啟動 Reels/TikTok 影片生產線...");
        const readyItems = batchItems.filter(i => i.status === 'ready');
        if (readyItems.length === 0) return;

        const ambassadorData = (activeAmbassador && useAmbassador) ? await imageUrlToimageData(activeAmbassador.imageUrl) : undefined;
        
        const userFrontIndex = readyItems.findIndex(i => i.view === 'front');
        const primaryItem = userFrontIndex !== -1 ? readyItems[userFrontIndex] : readyItems[0];
        
        setLoadingMessage(`正在深度分析商品多維屬性...`);
        const analysis = await analyzeLuxuryProduct(primaryItem.fileData);
        
        setLoadingMessage("正在生成高階影片提示詞...");
        const prompt = REELS_VIDEO_PROMPT(analysis, "Modern Luxury High-End", activeAmbassador?.name);
        
        setLoadingMessage("正在渲染 4K 品質短影音素材...");
        const videoResult = await generateVideo({
            prompt: prompt + ", cinematic 4k, high dynamic range, professional color grading. NO VOICEOVER. Background music should be high-end fashion runway style melody with only instrumental sound effects.",
            image: primaryItem.fileData,
            faceReference: ambassadorData,
            aspectRatio: '9:16',
            resolution: quality === 'MAX' ? '1080p' : '720p'
        }, (msg: string) => setLoadingMessage(msg));

        setResults([{ id: `res_${Date.now()}_reels`, url: videoResult.videoUrl, type: 'Reels Video', mediaType: 'video' }]);
    };

    const runOneClickCampaign = async () => {
        const readyItems = batchItems.filter(i => i.status === 'ready');
        if (readyItems.length === 0) return;
        const readyItem = readyItems[0];

        setIsLoading(true);
        const taskId = addTask({ name: "全平台行銷自動化 (1-Click Campaign)" });
        
        try {
            const updateProgress = (p: number, msg: string) => {
                setLoadingMessage(msg);
                updateTask(taskId, { progress: p, status: 'processing' });
            };

            const ambassadorData = (activeAmbassador && useAmbassador) ? await imageUrlToimageData(activeAmbassador.imageUrl) : undefined;

            setLoadingMessage("正在深度分析商品多角度特徵...");
            // Pass images and their labels to the analysis
            const analysis = await analyzeLuxuryProduct(
                readyItems.map(i => i.fileData),
                readyItems.map(i => i.view)
            );
            const analysisJson = JSON.stringify(analysis);
            
            // Use the identified best front view as the primary subject
            // If user explicitly labeled something as 'front', prioritize that
            const userFrontIndex = readyItems.findIndex(i => i.view === 'front');
            const frontIndex = userFrontIndex !== -1 ? userFrontIndex : (analysis.best_front_view_index || 0);
            
            const primaryItem = readyItems[frontIndex] || readyItems[0];
            const otherItemsData = readyItems.filter((_, idx) => idx !== frontIndex).map(i => i.fileData);
            const allRefs = ambassadorData ? [ambassadorData, ...otherItemsData] : otherItemsData;

            updateProgress(30, "正在規劃 3 日行銷策略...");
            const strategy = await generateCampaignStrategy(analysisJson);

            updateProgress(40, "正在撰寫跨平台高轉化文案...");
            const igCopy = await generateSocialCopy(analysisJson, 'Instagram');
            const ttCopy = await generateSocialCopy(analysisJson, 'TikTok');
            const fbCopy = await generateSocialCopy(analysisJson, 'Facebook');

            updateProgress(60, "正在渲染全案主視覺海報矩陣 (4 款風格)...");
            
            const posterStyles = [
                { name: '極簡奢華 (Minimalist)', style: 'OBSIDIAN_NOIR', prompt: 'Minimalist composition, clean lines, soft focus background.' },
                { name: '前衛先鋒 (Avant-Garde)', style: 'NEON_FUTURISM', prompt: 'Dynamic lighting, sharp contrasts, futuristic textures.' },
                { name: '經典永恆 (Classic)', style: 'ROYAL_GOLD', prompt: 'Warm cinematic lighting, elegant atmosphere, rich textures.' },
                { name: '生活美學 (Lifestyle)', style: 'NATURAL_LIGHT', prompt: 'Soft natural daylight, lifestyle setting, organic shadows.' }
            ];

            const posterAssets = [];
            for (let i = 0; i < posterStyles.length; i++) {
                const style = posterStyles[i];
                setLoadingMessage(`正在渲染海報 ${i + 1}/4: ${style.name}...`);
                
                const posterPrompt = buildLuxuryVisualPrompt({
                    mode: 'LUXURY_POSTER',
                    level: 'MAX',
                    masterStyle: style.style as any,
                    subject: {
                        category: analysis.category,
                        material: analysis.material,
                        color_palette: analysis.colors,
                        brand: analysis.brand,
                        logo_visibility: 'on',
                        texture_detail: 'high',
                        transparency_level: 100
                    },
                    ingredients_composition: '',
                    camera: { focal_length: '50mm', dof_intensity: 60, composition: 'centered' },
                    effect: { organic: 'silk_ribbons', particle: 'sparkle', intensity: 50 },
                    background: 'luxury_black_marble',
                    lighting: 'cinematic_soft_box',
                    ratio: '9:16',
                    custom_prompt: `${style.prompt} IMPORTANT: Show the product clearly. Ensure the product details match all provided reference angles.`
                });
                
                const posterUrl = await transformImage(primaryItem.fileData, posterPrompt, allRefs);
                posterAssets.push({ id: `camp_poster_${i}`, url: posterUrl, type: `Poster: ${style.name}`, mediaType: 'image' as const, copy: igCopy });
            }

            updateProgress(90, "正在渲染 Reels 宣傳短片 (Ambassador Sync)...");
            const reelsPrompt = REELS_VIDEO_PROMPT(analysis, "High-End Campaign", activeAmbassador?.name);
            const videoResult = await generateVideo({
                prompt: reelsPrompt + `, ensure the model's face perfectly matches the provided ambassador face reference. Show the product from its best front angle. NO VOICEOVER. Background music should be high-end fashion runway style melody with only instrumental sound effects.`,
                image: primaryItem.fileData,
                referenceImages: otherItemsData,
                faceReference: ambassadorData,
                aspectRatio: '9:16',
                resolution: quality === 'MAX' ? '1080p' : '720p'
            }, (msg: string) => setLoadingMessage(msg));

            setCampaign({
                strategy,
                copy: { 'Instagram': igCopy, 'TikTok': ttCopy, 'Facebook': fbCopy },
                assets: [
                    ...posterAssets.map(p => ({ id: p.id, url: p.url, type: p.type, mediaType: p.mediaType })),
                    { id: 'camp_video', url: videoResult.videoUrl, type: 'Campaign Video', mediaType: 'video' }
                ]
            });

            setResults([
                ...posterAssets,
                { id: 'camp_video', url: videoResult.videoUrl, type: 'Campaign Video', mediaType: 'video', copy: ttCopy }
            ]);

            updateTask(taskId, { status: 'completed', progress: 100, resultUrl: posterAssets[0].url });
            addNotification({
                type: 'success',
                message: '行銷全案已生成',
                description: '策略、文案與視覺素材已準備就緒。'
            });
        } catch (err) {
            const msg = getFriendlyErrorMessage(err);
            updateTask(taskId, { status: 'failed', error: msg });
            addNotification({
                type: 'error',
                message: '行銷全案生成失敗',
                description: msg
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="home-workbench min-h-screen pb-20 flex flex-col">
            {/* Image Zoom Modal（圖片展示深底合理，比照結果矩陣慣例保留） */}
            {selectedImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-bg-deep)]/95 text-white p-4 animate-fade-in" onClick={() => setSelectedImage(null)}>
                    <button className="absolute top-8 right-8 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all text-white">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                    <img src={selectedImage} className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" onClick={(e) => e.stopPropagation()} />
                </div>
            )}

            {isLoading && <Loader message={loadingMessage} />}

            {/* Hub Sub-Header */}
            <div className="mf-subheader sticky top-[80px] z-30 px-4 lg:px-8 py-4">
                <div className="max-w-[110rem] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-wine/10 flex items-center justify-center text-wine">
                            <PosterEngineIcon />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-[var(--home-ink)]">行銷素材工廠</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 home-pill-group p-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setCurrentView(tab.id as any)}
                                className={`home-pill flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${
                                    currentView === tab.id
                                        ? 'home-pill-active'
                                        : 'hover:text-[var(--home-ink)] hover:bg-white/40'
                                }`}
                            >
                                <span className="[&_svg]:w-4 [&_svg]:h-4">{tab.icon}</span>
                                <span className="hidden lg:inline">{tab.zh}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={onGoHome} className="home-btn-secondary px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest transition-all">返回首頁</button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pt-8">
                {currentView === 'EGEN' && <EGenStudio onGoHome={() => setCurrentView('FACTORY')} />}
                {currentView === 'LUXURY' && <LuxuryVisualStudio onGoHome={() => setCurrentView('FACTORY')} initialImage={initialImage} />}
                {currentView === 'POSTER' && <ProductPosterEngine onGoBack={() => setCurrentView('FACTORY')} onGoHome={onGoHome} />}
                {currentView === 'ARCHITECT' && <FashionArchitect onGoHome={() => setCurrentView('FACTORY')} />}
                
                {currentView === 'FACTORY' && (
                    <main className="max-w-[110rem] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left Column: Production Line Control */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="home-card home-card-accent p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full mf-step-badge-active flex items-center justify-center text-[var(--home-paper)]">
                                <PosterEngineIcon />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[var(--home-ink)]">1. 同一商品多角度上傳</h3>
                            </div>
                        </div>

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full aspect-video border-2 border-dashed border-brass/40 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-brass/10 transition-all group"
                        >
                            <PhotoIcon className="w-12 h-12 text-brass/60 group-hover:text-brass mb-4" />
                            <p className="text-sm font-bold text-brass">點擊上傳商品多角度圖片</p>
                            <p className="text-[10px] text-[var(--home-muted)] mt-2">請提供同一件商品的各角度照片 (如包袋的正、側、背面)</p>
                            <input type="file" ref={fileInputRef} multiple className="hidden" accept="image/*" onChange={handleFileUpload} />
                        </div>

                        {batchItems.length > 0 && (
                            <div className="mt-6 grid grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                {batchItems.map((item) => (
                                    <div key={item.id} className="relative group">
                                        <div className="aspect-square rounded-lg overflow-hidden border border-[var(--home-line)] relative">
                                            <img src={item.processedUrl || item.originalUrl} className={`w-full h-full object-cover ${item.status === 'processing' ? 'opacity-30' : ''}`} />
                                            {item.status === 'processing' && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-4 h-4 border-2 border-brass border-t-transparent rounded-full animate-spin" />
                                                </div>
                                            )}
                                            {item.status === 'ready' && (
                                                <div className="absolute top-1 right-1 bg-ok text-[var(--home-paper)] w-4 h-4 rounded-full flex items-center justify-center text-[8px]">
                                                    <CheckIcon className="w-2 h-2" />
                                                </div>
                                            )}
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="absolute top-1 left-1 bg-[var(--color-bg-deep)]/60 text-[var(--color-text-title)] w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <CloseIcon className="w-2 h-2" />
                                            </button>
                                        </div>
                                        <select
                                            value={item.view}
                                            onChange={(e) => updateItemView(item.id, e.target.value as any)}
                                            className="mt-1 w-full bg-white/50 border border-[var(--home-line)] rounded text-[9px] text-[var(--home-muted)] py-0.5 px-1 focus:outline-none focus:border-brass/60"
                                        >
                                            <option value="front">正面 (Front)</option>
                                            <option value="back">反面 (Back)</option>
                                            <option value="side">側面 (Side)</option>
                                            <option value="detail">細節 (Detail)</option>
                                        </select>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="home-card p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full mf-step-badge flex items-center justify-center text-brass">
                                <SparklesIcon />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[var(--home-ink)]">2. 選擇生產模式</h3>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {[
                                { id: 'EGEN_MATRIX', label: 'E-Gen 高階生產', desc: '自動產出超高畫質全方位行銷素材', icon: <EGenIcon /> },
                                { id: 'LUXURY_HERO', label: '奢華英雄大片', desc: '高畫質 4K 品牌主視覺渲染', icon: <LuxuryVisualIcon /> },
                                { id: 'SMART_POSTER', label: '智能海報排版', desc: 'AI 診斷並自動合成專業海報', icon: <PosterEngineIcon /> },
                                { id: 'FASHION_ARCHITECT', label: '視覺架構師', desc: '人物與單品的高階視覺重組', icon: <Face3DIcon /> },
                                { id: 'REELS_GENERATOR', label: 'Reels 短影音生成', desc: '自動產出 9:16 直式社群短片', icon: <SparklesIcon /> },
                                { id: 'ONE_CLICK_CAMPAIGN', label: '全平台行銷自動化', desc: '一鍵產出策略、文案、海報與影片', icon: <Face3DIcon /> },
                            ].map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setSelectedMode(mode.id as ProductionMode)}
                                    className={`w-full p-4 rounded-2xl border text-left transition-all ${selectedMode === mode.id ? 'border-wine bg-wine/5' : 'border-[var(--home-line)] bg-white/30 hover:border-[var(--home-line-strong)]'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedMode === mode.id ? 'bg-wine text-[var(--home-paper)]' : 'bg-white/50 text-brass'}`}>
                                            {mode.icon}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-[var(--home-ink)]">{mode.label}</h4>
                                            <p className="text-[10px] text-[var(--home-muted)]">{mode.desc}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="home-card p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full mf-step-badge flex items-center justify-center text-brass">
                                <Face3DIcon />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[var(--home-ink)]">3. 品牌一致性鎖定</h3>
                            </div>
                        </div>

                        {activeAmbassador ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-3 bg-white/40 rounded-xl border border-brass/30">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden">
                                        <AsyncImage src={activeAmbassador.imageUrl} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-xs font-bold text-[var(--home-ink)]">{activeAmbassador.name}</h4>
                                        <p className="text-[9px] text-brass uppercase tracking-widest">當前品牌代言人</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-[var(--home-muted)]">套用</span>
                                        <input
                                            type="checkbox"
                                            checked={useAmbassador}
                                            onChange={(e) => setUseAmbassador(e.target.checked)}
                                            className="w-4 h-4 rounded border-[var(--home-line)] bg-white/50 text-wine focus:ring-wine"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-danger/5 rounded-xl border border-danger/20 text-center">
                                <p className="text-[10px] text-danger/80">尚未設定品牌代言人，系統將使用通用模特兒。</p>
                            </div>
                        )}

                        <div className="mt-6 space-y-3">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--home-muted)]">生成張數</h4>
                            <div className="grid grid-cols-4 gap-2">
                                {[1, 2, 3, 4].map((n) => (
                                    <button
                                        key={n}
                                        onClick={() => setImageCount(n)}
                                        className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${imageCount === n ? 'bg-wine text-[var(--home-paper)] border-wine' : 'bg-white/40 text-[var(--home-muted)] border-[var(--home-line)] hover:border-[var(--home-line-strong)]'}`}
                                    >
                                        {n} 張
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--home-muted)]">生產畫質設定</h4>
                            <div className="grid grid-cols-3 gap-2">
                                {(['FAST', 'STANDARD', 'MAX'] as const).map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => setQuality(q)}
                                        className={`py-2 rounded-lg text-[9px] font-bold border transition-all ${quality === q ? 'bg-wine text-[var(--home-paper)] border-wine' : 'bg-white/40 text-[var(--home-muted)] border-[var(--home-line)] hover:border-[var(--home-line-strong)]'}`}
                                    >
                                        {q === 'FAST' ? '快速' : q === 'STANDARD' ? '標準' : '極致 4K'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={runProduction}
                            disabled={!selectedMode || batchItems.filter(i => i.status === 'ready').length === 0 || isLoading}
                            className="home-btn-primary w-full mt-8 py-5 text-lg rounded-xl flex items-center justify-center gap-2 font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <SparklesIcon className="w-5 h-5" /> 啟動高階影像生產線
                        </button>
                    </div>
                </div>

                {/* Right Column: Results Grid */}
                <div className="lg:col-span-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 border-b border-[var(--home-line)] pb-6">
                        <div className="flex flex-col">
                            <h3 className="text-2xl font-display font-bold uppercase tracking-[0.2em] text-[var(--home-ink)]">
                                {campaign ? '行銷全案輸出' : '生產輸出矩陣'}
                            </h3>
                            <span className="text-[9px] uppercase tracking-[0.4em] text-brass font-light">
                                {campaign ? 'Campaign Output Matrix' : 'Production Output Matrix'}
                            </span>
                        </div>
                        <div className="flex gap-3">
                            {campaign && (
                                <div className="flex home-pill-group p-1">
                                    <button
                                        onClick={() => setActiveCampaignTab('assets')}
                                        className={`home-pill px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${activeCampaignTab === 'assets' ? 'home-pill-active' : 'hover:text-[var(--home-ink)]'}`}
                                    >
                                        素材矩陣
                                    </button>
                                    <button
                                        onClick={() => setActiveCampaignTab('strategy')}
                                        className={`home-pill px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${activeCampaignTab === 'strategy' ? 'home-pill-active' : 'hover:text-[var(--home-ink)]'}`}
                                    >
                                        行銷策略
                                    </button>
                                </div>
                            )}
                            {results.length > 0 && (
                                <button className="home-btn-secondary px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest transition-all flex items-center gap-2" onClick={() => results.forEach(r => downloadImage(r.url, `pavora_factory_${r.type}.jpg`, 'MarketingFactory'))}>
                                    <DownloadIcon className="w-4 h-4" /> 批次下載全案
                                </button>
                            )}
                        </div>
                    </div>

                    {results.length > 0 ? (
                        activeCampaignTab === 'assets' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
                                {results.map((res) => (
                                    <div key={res.id} className="home-card p-0 overflow-hidden group relative hover:border-brass/50 transition-all">
                                        <div className="aspect-[3/4] bg-[var(--color-bg-deep)]/20 cursor-zoom-in" onClick={() => res.mediaType === 'image' && setSelectedImage(res.url)}>
                                            {res.mediaType === 'video' ? (
                                                <VideoPlayer src={res.url} className="w-full h-full object-cover" controls />
                                            ) : (
                                                <img src={res.url} className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="p-5">
                                            <div className="flex justify-between items-center mb-4">
                                                <div>
                                                    <h4 className="text-xs font-bold uppercase tracking-widest text-brass">{res.type}</h4>
                                                    <p className="text-[10px] text-[var(--home-muted)] mt-1">由 PAVORA 行銷工廠生成</p>
                                                </div>
                                                <button onClick={() => downloadImage(res.url, `pavora_${res.type}.jpg`, 'MarketingFactory')} className="p-2.5 rounded-full bg-white/40 hover:bg-brass hover:text-[var(--home-paper)] transition-all text-[var(--home-muted)]">
                                                    <DownloadIcon className="w-5 h-5" />
                                                </button>
                                            </div>

                                            {campaign && (
                                                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
                                                    {(['Instagram', 'TikTok', 'Facebook'] as const).map(p => (
                                                        <button
                                                            key={p}
                                                            onClick={() => setActivePlatform(p)}
                                                            className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all ${activePlatform === p ? 'bg-wine text-[var(--home-paper)]' : 'bg-white/40 text-[var(--home-muted)]'}`}
                                                        >
                                                            {p}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {(res.copy || (campaign && campaign.copy[activePlatform])) && (
                                                <div className="mt-2 p-4 bg-white/40 rounded-xl text-xs text-[var(--home-muted)] leading-relaxed max-h-48 overflow-y-auto custom-scrollbar border border-[var(--home-line)]">
                                                    <div className="whitespace-pre-wrap">
                                                        {campaign ? campaign.copy[activePlatform] : res.copy}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-6 animate-fade-in">
                                {campaign?.strategy && (
                                    <div className="home-card p-8">
                                        <div className="flex items-center gap-4 mb-8 border-b border-[var(--home-line)] pb-4">
                                            <div className="w-12 h-12 rounded-full bg-wine/15 flex items-center justify-center text-wine">
                                                <SparklesIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold text-[var(--home-ink)]">{campaign.strategy.campaign_name || '3 日行銷攻勢策略'}</h4>
                                                <p className="text-xs text-brass uppercase tracking-widest">3-Day Integrated Marketing Strategy</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {['day1', 'day2', 'day3'].map((day, idx) => {
                                                const dayData = campaign.strategy[day];
                                                if (!dayData) return null;
                                                return (
                                                    <div key={day} className="home-card-sub space-y-4 p-4 hover:border-brass/40 transition-all">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-black bg-brass text-[var(--home-paper)] px-2 py-0.5 rounded">DAY 0{idx + 1}</span>
                                                            <span className="text-[10px] text-[var(--home-muted)] uppercase font-bold tracking-tighter">{dayData.theme}</span>
                                                        </div>
                                                        <h5 className="font-bold text-sm text-[var(--home-ink)] border-l-2 border-brass pl-2">{dayData.goal}</h5>
                                                        <div className="space-y-2">
                                                            <p className="text-[11px] text-[var(--home-muted)] leading-relaxed">{dayData.action}</p>
                                                            <div className="pt-2 border-t border-[var(--home-line)]">
                                                                <p className="text-[9px] text-brass font-bold uppercase">關鍵指標 (KPI)</p>
                                                                <p className="text-[10px] text-[var(--home-muted)]">{dayData.kpi}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="mt-8 p-4 rounded-xl bg-brass/5 border border-brass/20">
                                            <h5 className="text-xs font-bold text-brass mb-2 uppercase tracking-widest">核心行銷訊息 (Core Message)</h5>
                                            <p className="text-sm text-[var(--home-ink)] italic opacity-80">"{campaign.strategy.core_message}"</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    ) : (
                        <div className="h-[70vh] rounded-3xl border-4 border-dashed border-[var(--home-line)] flex flex-col items-center justify-center text-center p-12 bg-white/20">
                            <div className="w-24 h-24 rounded-full bg-white/40 flex items-center justify-center text-[var(--home-muted)] mb-8 opacity-60">
                                <PosterEngineIcon />
                            </div>
                            <h4 className="text-xl font-bold mb-2 text-[var(--home-muted)]">生產線待命中</h4>
                            <p className="text-sm text-[var(--home-muted)] max-w-md">
                                請在上傳同一商品的各角度素材並選擇生產模式後，點擊「啟動高階影像生產線」開始產出極致細節的行銷內容。
                            </p>
                        </div>
                    )}
                </div>
            </main>
        )}
    </div>
</div>
);
};

export default MarketingFactory;
