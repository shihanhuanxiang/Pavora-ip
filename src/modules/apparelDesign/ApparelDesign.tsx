
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { generateApparelDesignSequence, getFriendlyErrorMessage, fileToBase64, getFashionTrends } from '../../shared/services/geminiService';
import { saveMultipleApparel, savePortfolioItem } from '../../shared/services/storageService';
import type { TaxonomyEntry, BrandDefinition, ApparelMainCategory, StoredApparelItem } from '../../shared/types/types';
import { PAVORA_DESIGN_BRANDS, BRAND_OPTIONS } from '../../shared/constants/constants';
import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
import Loader from '../../shared/components/common/Loader';
import PhotoIcon from '../../shared/assets/icons/PhotoIcon';
import ImagePreviewModal from '../../shared/components/common/ImagePreviewModal';
import DownloadIcon from '../../shared/assets/icons/DownloadIcon';
import TrendingUpIcon from '../../shared/assets/icons/TrendingUpIcon';
import Select from '../../shared/components/common/Select';
import { useTaxonomy } from '../../shared/hooks/useTaxonomy';
import ExpandIcon from '../../shared/assets/icons/ExpandIcon'; 
import { useBrandStore } from '../../shared/stores/useBrandStore';
import AsyncImage from '../../shared/components/common/AsyncImage';
import { imageUrlToimageData, downloadImage } from '../../shared/utils/imageUtils';

import DeepApparelSelector from '../../shared/components/business/DeepApparelSelector';

interface ApparelDesignProps {
  onGoHome?: () => void;
  onAdvancedEdit?: (imageUrl: string, destination: string) => void;
  masterTaxonomy?: TaxonomyEntry[];
  apparelStructure?: ApparelMainCategory[];
}

type QualityLevel = 'standard' | 'high' | 'ultra';

const ApparelDesign: React.FC<ApparelDesignProps> = ({ onGoHome, onAdvancedEdit, masterTaxonomy: propTaxonomy, apparelStructure: propStructure }) => {
  // Phase 3: Self-Sufficiency Logic
  const { masterTaxonomy: hookTaxonomy, apparelStructure: hookStructure, loading: taxonomyLoading } = useTaxonomy();
  const masterTaxonomy = propTaxonomy || hookTaxonomy;
  const apparelStructure = propStructure || hookStructure;
  const isDataReady = (propTaxonomy && propStructure) || (!taxonomyLoading && masterTaxonomy.length > 0);

  const [taxonomyEntry, setTaxonomyEntry] = useState<TaxonomyEntry | null>(null);
  // Set default entry only when data is ready
  React.useEffect(() => {
      if (isDataReady && !taxonomyEntry && masterTaxonomy.length > 0) {
          setTaxonomyEntry(masterTaxonomy.find(item => item.id === 'tops_tee_01') || null);
      }
  }, [isDataReady, masterTaxonomy, taxonomyEntry]);

  const [brand, setBrand] = useState<BrandDefinition | null>(null);
  const [customBrandStyle, setCustomBrandStyle] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [customColor, setCustomColor] = useState('#ffffff');
  const [pattern, setPattern] = useState('');
  const [referenceImage, setReferenceImage] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(null);
  
  const [quality, setQuality] = useState<QualityLevel>('standard');
  const [lockToAmbassador, setLockToAmbassador] = useState(false);

  const { ambassadors, activeAmbassadorId } = useBrandStore();
  const activeAmbassador = useMemo(() => ambassadors.find(a => a.id === activeAmbassadorId), [ambassadors, activeAmbassadorId]);

  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewingImage, setPreviewingImage] = useState<{images: string[], startIndex: number} | null>(null);
  const [selectedForDownload, setSelectedForDownload] = useState<Set<number>>(new Set());
  
  const [trends, setTrends] = useState<{ text: string; sources: { uri: string; title: string }[] } | null>(null);
  const [isTrendsLoading, setIsTrendsLoading] = useState(false);
  
  const refFileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = useCallback(async () => {
    console.log("handleGenerate triggered", { taxonomyEntry, referenceImage, lockToAmbassador, activeAmbassador });
    if (!taxonomyEntry && !referenceImage) {
      setError('請先選擇一個服裝類別或上傳參考圖。');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const onProgress = (message: string) => setLoadingMessage(message);
      
      // Configure based on quality
      const config = {
          usePro: quality !== 'standard',
          resolution: quality === 'ultra' ? '4K' : '2K' as '2K' | '4K'
      };

      let finalFaceRefs = undefined;
      if (lockToAmbassador && activeAmbassador) {
          console.log("Locking to ambassador face", activeAmbassador.name);
          const ambassadorData = await imageUrlToimageData(activeAmbassador.imageUrl);
          finalFaceRefs = [ambassadorData];
      }

      const images = await generateApparelDesignSequence({
        taxonomyEntry: taxonomyEntry || { display_name_zh: '參考設計', display_name_en: 'Reference Design' } as any,
        brandDefinition: brand,
        customBrandStyle: brand?.id === 'custom' ? customBrandStyle : '',
        colors,
        pattern,
        referenceImage: referenceImage?.fileData,
        faceReferences: finalFaceRefs
      }, config, onProgress);
      
      console.log("Generation success", images);
      setGeneratedImages(images);
      setSelectedForDownload(new Set());
    } catch (err) {
      console.error("Generation error", err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [taxonomyEntry, brand, customBrandStyle, colors, pattern, referenceImage, quality, lockToAmbassador, activeAmbassador]);

  if (taxonomyLoading && masterTaxonomy.length === 0) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-deep)]">
              <Loader message="正在同步全球時尚分類系統..." />
          </div>
      );
  }

  const handleGetTrends = async () => {
    setIsTrendsLoading(true);
    setError(null);
    try {
      const query = `current fashion design trends for ${taxonomyEntry?.group || 'apparel'}`;
      const result = await getFashionTrends(query);
      setTrends(result);
    } catch (e) {
      setError(getFriendlyErrorMessage(e));
    } finally {
      setIsTrendsLoading(false);
    }
  };

  const handleSaveToWardrobe = () => {
    if (generatedImages.length < 3) return;
    const name = `${taxonomyEntry?.display_name_zh || '參考設計'} - ${brand?.display_name || '自訂'}`;
    const newItems: StoredApparelItem[] = [
        { id: `apparel-${Date.now()}-packshot`, name: `${name} (平拍)`, imageUrl: generatedImages[0], category: taxonomyEntry?.category || 'unknown' },
        { id: `apparel-${Date.now()}-front`, name: `${name} (正面)`, imageUrl: generatedImages[1], category: 'model-shot' },
        { id: `apparel-${Date.now()}-back`, name: `${name} (背面)`, imageUrl: generatedImages[2], category: 'model-shot' },
    ];
    saveMultipleApparel(newItems);
    
    // Auto-save to Portfolio
    generatedImages.forEach(img => {
      savePortfolioItem({ imageUrl: img, sourceModule: 'ApparelDesign' });
    });
    
    alert('已成功儲存至衣櫥與作品集！');
  };

  const handleColorAdd = (color: string) => {
      if (color && !colors.includes(color) && colors.length < 5) {
          setColors(prev => [...prev, color]);
      }
  };
  const handleColorRemove = (color: string) => {
      setColors(prev => prev.filter(c => c !== color));
  };
  
  const handleReferenceImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0];
        try {
            const fileData = await fileToBase64(file);
            setReferenceImage({ url: URL.createObjectURL(file), fileData });
        } catch (err) {
            setError('讀取參考圖失敗。');
        }
    }
  };

  const toggleDownloadSelection = (index: number) => {
      setSelectedForDownload(prev => {
          const newSet = new Set(prev);
          if (newSet.has(index)) {
              newSet.delete(index);
          } else {
              newSet.add(index);
          }
          return newSet;
      });
  };

  const handleDownloadImage = (url: string, index: number) => {
    const designId = `design_${Date.now()}`;
    const type = index === 0 ? 'packshot' : index === 1 ? 'front' : 'back';
    downloadImage(url, `${designId}_${type}.jpg`, 'ApparelDesign');
  };
  
  const handleDownloadSelected = () => {
    selectedForDownload.forEach((index, i) => {
      const url = generatedImages[index];
      if (url) {
        setTimeout(() => handleDownloadImage(url, index), i * 300);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-deep)] text-[var(--color-text-main)] font-sans pb-20">
      <input type="file" ref={refFileInputRef} className="hidden" accept="image/*" onChange={handleReferenceImageChange} />
      {isLoading && <Loader message={loadingMessage} />}
      {previewingImage && <ImagePreviewModal {...previewingImage} onClose={() => setPreviewingImage(null)} />}
      
      {/* Trends Modal */}
      <AnimatePresence>
        {trends && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[100] p-6" 
            onClick={() => setTrends(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-panel w-full max-w-2xl max-h-[80vh] flex flex-col p-8 rounded-2xl relative bg-[var(--color-bg-surface)] border border-[var(--color-border)]" 
              onClick={e => e.stopPropagation()}
            >
            <button 
              onClick={() => setTrends(null)}
              className="absolute top-4 right-4 text-[var(--color-text-dim)] hover:text-[var(--color-gold)] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex items-center gap-3 mb-6">
                <TrendingUpIcon className="w-6 h-6 text-[var(--color-gold)]" />
                <h3 className="text-2xl font-display font-bold uppercase tracking-widest text-[var(--color-gold)]">最新流行趨勢摘要</h3>
            </div>
            
            <div className="overflow-y-auto pr-4 custom-scrollbar space-y-6">
                <p className="text-[var(--color-text-main)] leading-relaxed text-sm font-light tracking-wide whitespace-pre-wrap">{trends.text}</p>
                
                <div className="pt-6 border-t border-[var(--color-border)]">
                    <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--color-text-dim)] mb-4">資料來源 // Sources</h4>
                    <ul className="space-y-2">
                        {trends.sources.map(source => (
                            <li key={source.uri}>
                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-gold)] hover:text-[var(--color-gold-light)] transition-colors flex items-center gap-2 group">
                                    <span className="w-1 h-1 rounded-full bg-[var(--color-gold)] group-hover:scale-150 transition-transform"></span>
                                    {source.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
      
      {/* Header */}
      <div className="sticky top-[80px] z-30 glass-panel border-x-0 border-t-0 px-6 py-4 mb-8">
        <div className="max-w-[110rem] mx-auto flex justify-between items-center">
                    <h2 className="text-2xl font-display font-bold uppercase tracking-[0.3em] text-[var(--color-text-main)] flex flex-col items-start leading-tight">
                        <span>服裝設計</span>
                        <span className="text-[10px] uppercase tracking-[0.5em] text-[var(--color-gold)] font-light mt-1">Apparel Design Studio</span>
                    </h2>
            <div className="flex items-center gap-4">
                <Button onClick={handleGetTrends} isLoading={isTrendsLoading} variant="secondary" className="text-[10px] font-bold tracking-widest flex items-center gap-2">
                    <TrendingUpIcon className="w-4 h-4"/> 趨勢分析
                </Button>
                {onGoHome && <Button onClick={onGoHome} variant="secondary" className="text-[10px] font-bold tracking-widest">返回首頁</Button>}
            </div>
        </div>
      </div>

      <main className="max-w-[110rem] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Panel: Parameters */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 1. 參考與基礎 */}
            <CollapsibleCard title="1. 參考與基礎" defaultOpen={true} icon={<PhotoIcon className="w-4 h-4" />}>
                <div className="space-y-6">
                    <div>
                        <label className="block mb-3 text-[13px] font-bold text-gray-400 uppercase tracking-widest text-left flex flex-col leading-tight">
                            <span>參考圖</span>
                            <span className="text-[10px] opacity-50 font-normal normal-case">(AI Visual Reconstruction)</span>
                        </label>
                        {referenceImage ? (
                            <div className="relative group rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-surface)]">
                                <img src={referenceImage.url} alt="Reference" className="w-full h-48 object-contain" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button onClick={() => setPreviewingImage({images:[referenceImage.url], startIndex: 0})} className="p-2 bg-[var(--color-bg-surface)]/20 hover:bg-[var(--color-bg-surface)]/40 rounded-full transition-colors"><ExpandIcon className="w-5 h-5"/></button>
                                    <button onClick={() => setReferenceImage(null)} className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-500 rounded-full transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.277H8.084a2.25 2.25 0 0 1-2.244-2.277L4.14 5.928m14.352 0a22.906 22.906 0 0 0-2.384-.126M12 18.75V16.5m0-2.25V12m0-2.25V9.75M15 6.75V4.5a2.25 2.25 0 0 0-2.25-2.25h-1.5a2.25 2.25 0 0 0-2.25 2.25v2.25" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button 
                                onClick={() => refFileInputRef.current?.click()}
                                className="w-full h-32 border-2 border-dashed border-[var(--color-border)] rounded-xl flex flex-col items-center justify-center gap-2 text-[var(--color-text-dim)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-all group"
                            >
                                <PhotoIcon className="w-8 h-8 opacity-50 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">點擊上傳參考圖</span>
                            </button>
                        )}
                    </div>

                    <div>
                        <DeepApparelSelector 
                            masterTaxonomy={masterTaxonomy}
                            apparelStructure={apparelStructure}
                            onSelect={setTaxonomyEntry}
                            selectedId={taxonomyEntry?.id}
                            label="服裝設計分類 (Clothing Design Taxonomy)"
                        />
                    </div>
                </div>
            </CollapsibleCard>

            {/* 2. 品牌風格 */}
            <CollapsibleCard title="2. 品牌風格" defaultOpen={true} icon={<TrendingUpIcon className="w-4 h-4" />}>
                <div className="space-y-4">
                    <select 
                        value={brand?.id || 'none'} 
                        onChange={e => {
                            const selectedId = e.target.value;
                            if (selectedId === 'none') setBrand(null);
                            else if (selectedId === 'custom') setBrand({ id: 'custom', display_name: '自訂' } as any);
                            else setBrand(PAVORA_DESIGN_BRANDS.find(b => b.id === selectedId) || null);
                        }}
                        className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text-main)] text-sm rounded-lg p-3 focus:border-[var(--color-gold)] outline-none transition-all"
                    >
                        {BRAND_OPTIONS.map(opt => <option key={opt.id} value={opt.id} className="bg-[var(--color-bg-surface)]">{opt.name}</option>)}
                    </select>
                    
                    {brand?.id === 'custom' && (
                        <textarea 
                            value={customBrandStyle} 
                            onChange={e => setCustomBrandStyle(e.target.value)} 
                            placeholder="輸入自訂品牌風格提示詞，例如：'Minimalist Japanese aesthetics with architectural silhouettes'..." 
                            className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text-main)] text-sm rounded-lg p-3 focus:border-[var(--color-gold)] outline-none transition-all min-h-[100px]"
                        />
                    )}
                </div>
            </CollapsibleCard>

            {/* 3. 細節調整 */}
            <CollapsibleCard title="3. 細節調整" defaultOpen={false}>
                <div className="space-y-6">
                    <div>
                        <label className="block mb-3 text-[13px] font-bold text-gray-400 uppercase tracking-widest text-left flex flex-col leading-tight">
                            <span>主色調</span>
                            <span className="text-[10px] opacity-50 font-normal normal-case">(Primary Palette - Max 5)</span>
                        </label>
                        <div className="flex flex-wrap gap-2 mb-4 min-h-[40px] p-2 bg-[var(--color-bg-input)] rounded-lg border border-[var(--color-border)]">
                            {colors.map(c => (
                                <div key={c} className="flex items-center gap-2 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-full pl-2 pr-1 py-1 text-[10px] font-bold tracking-tighter">
                                    <div className="w-3 h-3 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: c }}></div>
                                    <span className="font-mono">{c.toUpperCase()}</span>
                                    <button onClick={() => handleColorRemove(c)} className="hover:text-red-500 transition-colors p-1">&times;</button>
                                </div>
                            ))}
                            {colors.length === 0 && <span className="text-[10px] text-[var(--color-text-dim)] italic flex items-center px-2">尚未選擇顏色</span>}
                        </div>
                        <div className="flex gap-3">
                           <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-[var(--color-border)]">
                                <input type="color" value={customColor} onChange={e => setCustomColor(e.target.value)} className="absolute inset-[-10px] w-[200%] h-[200%] cursor-pointer"/>
                           </div>
                           <Button onClick={() => handleColorAdd(customColor)} variant="secondary" className="flex-grow text-[10px] font-bold tracking-[0.2em]">加入調色盤</Button>
                        </div>
                    </div>
                    <div>
                         <label className="block mb-3 text-[13px] font-bold text-gray-400 uppercase tracking-widest text-left flex flex-col leading-tight">
                             <span>花紋 / 圖樣</span>
                             <span className="text-[10px] opacity-50 font-normal normal-case">(Patterns & Textures)</span>
                         </label>
                         <input 
                            value={pattern} 
                            onChange={e => setPattern(e.target.value)} 
                            placeholder="例如: 'Baroque Floral', 'Geometric Stripes'..." 
                            className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text-main)] text-sm rounded-lg p-3 focus:border-[var(--color-gold)] outline-none transition-all" 
                         />
                    </div>
                </div>
            </CollapsibleCard>
            
            {/* 4. 畫質設定 */}
            <CollapsibleCard title="4. 畫質設定" defaultOpen={false}>
                <div className="space-y-6">
                    {/* Ambassador Lock Toggle */}
                    {activeAmbassador && (
                        <div className="p-4 bg-[var(--color-gold)]/5 border border-[var(--color-gold)]/20 rounded-xl flex items-center justify-between group hover:bg-[var(--color-gold)]/10 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg overflow-hidden border border-[var(--color-gold)]/30">
                                    <AsyncImage src={activeAmbassador.imageUrl} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-[var(--color-text-title)] flex flex-col items-start leading-tight">
                                        <span>鎖定品牌代言人</span>
                                        <span className="text-[10px] opacity-50 font-normal normal-case tracking-normal">(Lock Brand Ambassador)</span>
                                    </h4>
                                    <p className="text-[10px] text-[var(--color-text-dim)] mt-1">啟用後，生成的所有模特兒將自動套用 {activeAmbassador.name} 的面部特徵。</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setLockToAmbassador(!lockToAmbassador)}
                                className={`w-12 h-6 rounded-full relative transition-all ${lockToAmbassador ? 'bg-[var(--color-gold)]' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${lockToAmbassador ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                    )}

                    <Select 
                        label="生成品質" 
                        options={[
                            {value: 'standard', label: '標準 (Flash)'}, 
                            {value: 'high', label: '高品質 (Pro 2K)'},
                            {value: 'ultra', label: '超高畫質 (Pro 4K)'}
                        ]} 
                        value={quality} 
                        onChange={e => setQuality(e.target.value as QualityLevel)} 
                    />
                </div>
            </CollapsibleCard>

            <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate} 
                disabled={isLoading || (!taxonomyEntry && !referenceImage)}
                className="w-full py-5 rounded-xl bg-[var(--color-gold)] text-black font-bold flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_6px_30px_rgba(var(--color-gold-rgb),0.2)]"
            >
                {isLoading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                        <span>正在編織設計...</span>
                    </>
                ) : (
                    <>
                        <TrendingUpIcon className="w-5 h-5 group-hover:scale-125 transition-transform" />
                        <span className="text-lg">開始生成設計</span>
                    </>
                )}
            </motion.button>
          </div>
          
          {/* Right Panel: Results */}
          <div className="lg:col-span-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div className="flex flex-col items-start leading-tight">
                    <h3 className="text-2xl font-display font-bold uppercase tracking-widest text-[var(--color-text-main)]">生成結果</h3>
                    <span className="text-[10px] text-[var(--color-gold)] uppercase tracking-[0.4em] font-medium">Curated High-Definition Renderings</span>
                </div>
                {generatedImages.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/5"
                    >
                        <span className="text-[9px] px-4 font-bold text-gray-500 uppercase tracking-widest hidden sm:inline">批次：{generatedImages.length} 預覽圖</span>
                        <div className="hidden sm:block w-px h-4 bg-white/10"></div>
                        <Button 
                            onClick={handleDownloadSelected} 
                            variant="primary" 
                            className="text-[9px] py-1.5 h-auto rounded-full font-bold" 
                            disabled={selectedForDownload.size === 0}
                        >
                            下載選取 ({selectedForDownload.size})
                        </Button>
                        <Button onClick={handleSaveToWardrobe} variant="secondary" className="text-[9px] py-1.5 h-auto rounded-full font-bold">儲存衣櫥 (SAVE ALL)</Button>
                    </motion.div>
                )}
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 animate-shake">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span className="text-sm font-bold tracking-wider">{error}</span>
                </div>
            )}

            {generatedImages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {generatedImages.map((img, index) => (
                            <motion.div 
                                key={index} 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className="glass-panel p-3 rounded-2xl group relative flex flex-col"
                            >
                                <div className="relative aspect-square rounded-xl overflow-hidden bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                                <img 
                                    src={img} 
                                    alt={`Generated Image ${index + 1}`} 
                                    className="w-full h-full object-contain cursor-pointer transition-transform duration-700 group-hover:scale-110" 
                                    onClick={() => setPreviewingImage({images: generatedImages, startIndex: index})} 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                
                                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                    <button 
                                        onClick={() => handleDownloadImage(img, index)} 
                                        className="p-2 bg-[var(--color-bg-deep)]/60 hover:bg-[var(--color-gold)] text-[var(--color-text-main)] hover:text-[var(--color-bg-deep)] rounded-full backdrop-blur-md transition-all"
                                        title="下載此圖"
                                    >
                                        <DownloadIcon className="w-4 h-4"/>
                                    </button>
                                    {onAdvancedEdit && (
                                        <button 
                                            onClick={() => onAdvancedEdit(img, 'fitting_room')} 
                                            className="p-2 bg-[var(--color-bg-deep)]/60 hover:bg-[var(--color-gold)] text-[var(--color-text-main)] hover:text-[var(--color-bg-deep)] rounded-full backdrop-blur-md transition-all"
                                            title="立即試穿此設計"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                            </svg>
                                        </button>
                                    )}
                                    <div className="p-2 bg-[var(--color-bg-deep)]/60 backdrop-blur-md rounded-full flex items-center justify-center">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedForDownload.has(index)} 
                                            onChange={() => toggleDownloadSelection(index)} 
                                            className="h-4 w-4 rounded border-[var(--color-border)] bg-transparent text-[var(--color-gold)] focus:ring-[var(--color-gold)] cursor-pointer" 
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-4 flex flex-col items-center">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-dim)] group-hover:text-[var(--color-gold)] transition-colors">
                                    {index === 0 ? '產品平拍圖 // Packshot' : (index === 1 ? '模特兒正面 // Front View' : '模特兒背面 // Back View')}
                                </span>
                                <div className="h-px w-8 bg-[var(--color-gold)]/20 mt-2 group-hover:w-16 transition-all duration-500"></div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            ) : (
                <div className="glass-panel h-[600px] rounded-3xl flex flex-col items-center justify-center text-center p-12 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-gold),transparent_70%)] opacity-5 blur-3xl"></div>
                    <div className="relative z-10 space-y-6">
                        <div className="w-24 h-24 mx-auto rounded-full bg-[var(--color-bg-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-dim)] animate-pulse">
                            <PhotoIcon className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-2xl font-display font-bold uppercase tracking-[0.2em] text-[var(--color-text-dim)]">等待創意降臨</p>
                            <p className="text-xs text-[var(--color-text-dim)]/60 tracking-widest uppercase">Select parameters and start generation</p>
                        </div>
                    </div>
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// --- Helper Components ---

const CollapsibleCard: React.FC<{ 
    title: string; 
    children: React.ReactNode; 
    defaultOpen?: boolean;
    icon?: React.ReactNode;
}> = ({ title, children, defaultOpen = true, icon }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="glass-panel rounded-2xl overflow-hidden border border-[var(--color-border)] transition-all duration-500">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--color-bg-surface)]/50 transition-colors group"
            >
                <div className="flex items-center gap-3">
                    {icon && <span className="text-[var(--color-gold)] opacity-70 group-hover:opacity-100 transition-all">{icon}</span>}
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-main)]">{title}</h3>
                </div>
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={2} 
                    stroke="currentColor" 
                    className={`w-4 h-4 text-[var(--color-text-dim)] transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
            </button>
            <div className={`collapsible-content ${isOpen ? 'open' : ''}`}>
                <div className="px-6 pb-6 pt-2">
                    {children}
                </div>
            </div>
        </div>
    );
};


export default ApparelDesign;
