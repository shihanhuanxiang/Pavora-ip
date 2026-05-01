
import React, { useState, useCallback, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { AIDiagnosis, BackgroundCard, CamOption, PoseOption, LightOption, PropsOption, PCPEForm, PCPERatio } from '../../shared/types/types';
import { getAIDiagnosis, getBackgroundCards, getAllControlOptions, generateProductPoster, getFriendlyErrorMessage, fileToBase64, cleanupSubject, processTasksInParallel } from '../../shared/services/geminiService';
import { imageUrlToimageData } from '../../shared/utils/imageUtils';
import { savePortfolioItem, saveMultiplePortfolioItems } from '../../shared/services/storageService';
import { downloadImage } from '../../shared/utils/imageUtils';
import { useNotification } from '../../shared/context/NotificationContext';

import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
import Loader from '../../shared/components/common/Loader';
import PhotoIcon from '../../shared/assets/icons/PhotoIcon';
import SparklesIcon from '../../shared/assets/icons/SparklesIcon';
import ExpandIcon from '../../shared/assets/icons/ExpandIcon';
import ImageAnalysisOverlay from './ImageAnalysisOverlay';
import Select from '../../shared/components/common/Select';
import ImagePreviewModal from '../../shared/components/common/ImagePreviewModal';
import ColorPicker from '../../shared/components/common/ColorPicker';

interface BrandPreset {
  id: string;
  name: string;
  overrides: {
    background: string;
    camera: string;
    pose: string;
    lighting: string;
    props: string;
  };
}

interface ProductPosterEngineProps {
  onGoBack: () => void;
  onGoHome: () => void;
}

type Step = 'UPLOAD' | 'DIAGNOSIS' | 'FINETUNE' | 'RESULT';

const SummaryItem: React.FC<{ title: string; content?: string }> = ({ title, content }) => (
    <div>
        <h4 className="font-semibold text-[var(--color-text-dim)]">{title}</h4>
        <p className="text-[var(--color-text-main)] mt-1">{content || 'N/A'}</p>
    </div>
);

interface FinetuneGroupProps<T> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  defaultOption: { label_zh: string; purpose_zh: string; prompt: string };
  altOptions: T[];
  getOptionProps: (option: T) => { label_zh: string; purpose_zh: string; prompt: string };
}

const FinetuneGroup = <T,>({ label, value, onChange, defaultOption, altOptions, getOptionProps }: FinetuneGroupProps<T>) => {
  const isSelected = (p: string) => {
    if (!value || !p) return false;
    // Normalize strings for comparison
    const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
    return normalize(value) === normalize(p) && normalize(p) !== "";
  };
  const isDefaultSelected = isSelected(defaultOption?.prompt || "");

  return (
    <div className="border-b border-[var(--color-border)] pb-8 mb-8 last:border-0 animate-fade-in">
      <label className="block text-lg font-bold text-[var(--color-gold)] mb-4 tracking-wider">{label}</label>
      
      <div className="mb-5">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-[0.2em] font-bold">當前提示詞 (Prompt Override)</span>
            <span className="text-[9px] text-gray-600 italic">手動修改內容按鈕會取消反白</span>
          </div>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-black/40 border border-gray-700 text-gray-200 p-4 rounded-lg text-xs font-mono focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] outline-none transition-all leading-relaxed"
            rows={3}
            placeholder="提示詞將在此處連動更新..."
          />
      </div>
      
      <div className="space-y-3">
        <button
          onClick={() => onChange(defaultOption.prompt)}
          className={`w-full text-left p-4 rounded-xl transition-all duration-500 border ${
            isDefaultSelected 
              ? 'bg-[var(--color-gold)]/10 text-[var(--color-gold)] border-[var(--color-gold)] shadow-[0_0_20px_rgba(212,175,55,0.1)]' 
              : 'bg-white/5 text-gray-400 border-gray-800 hover:border-gray-600'
          }`}
        >
          <div className="flex justify-between items-center">
            <p className="font-bold text-sm tracking-wide">{(defaultOption.label_zh)}</p>
            {isDefaultSelected && <div className="w-2 h-2 rounded-full bg-[var(--color-gold)] shadow-[0_0_8px_var(--color-gold)]" />}
          </div>
          <p className="text-[10px] opacity-60 mt-1.5 leading-relaxed">{defaultOption.purpose_zh}</p>
        </button>
        
        {altOptions.map((option, index) => {
          const { label_zh, purpose_zh, prompt } = getOptionProps(option);
          const active = isSelected(prompt);
          return (
            <button
              key={index}
              onClick={() => onChange(prompt)}
              className={`w-full text-left p-4 rounded-xl transition-all duration-500 border ${
                active
                  ? 'bg-[var(--color-gold)]/10 text-[var(--color-gold)] border-[var(--color-gold)] shadow-[0_0_20px_rgba(212,175,55,0.1)]' 
                  : 'bg-white/5 text-gray-400 border-gray-800 hover:border-gray-600'
              }`}
            >
              <div className="flex justify-between items-center">
                <p className="font-bold text-sm tracking-wide">{label_zh}</p>
                {active && <div className="w-2 h-2 rounded-full bg-[var(--color-gold)] shadow-[0_0_8px_var(--color-gold)]" />}
              </div>
              <p className="text-[10px] opacity-60 mt-1.5 leading-relaxed">{purpose_zh}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ProductPosterEngine: React.FC<ProductPosterEngineProps> = ({ onGoBack, onGoHome }) => {
  const { addNotification, addTask, updateTask } = useNotification();
  const [step, setStep] = useState<Step>('UPLOAD');
  const [form, setForm] = useState<Omit<PCPEForm, 'format'>>({
    subjectImages: [],
    isModel: true,
    ratio: '9:16',
    quality: 'standard',
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [faceAnchor, setFaceAnchor] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(null);

  const [diagnosis, setDiagnosis] = useState<AIDiagnosis | null>(null);
  const [cards, setCards] = useState<BackgroundCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<BackgroundCard | null>(null);
  
  const [controlOptions, setControlOptions] = useState<{
    bg_options?: any[],
    cam_options?: CamOption[],
    pose_options?: PoseOption[],
    light_options?: LightOption[],
    props_options?: PropsOption[]
  } | null>(null);
  
  const [overrides, setOverrides] = useState({
    background: '', camera: '', pose: '', lighting: '', props: ''
  });

  const [presets, setPresets] = useState<BrandPreset[]>([]);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const [useColorLock, setUseColorLock] = useState(false);
  const [colorLock, setColorLock] = useState('#FFFFFF');
  const [useAutoCleanup, setUseAutoCleanup] = useState(false);

  const [imageCount, setImageCount] = useState<number>(1);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDiagnosisOverlayOpen, setIsDiagnosisOverlayOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const faceAnchorInputRef = useRef<HTMLInputElement>(null);
  const resultImageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('pavora_pcpe_presets');
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load presets', e);
      }
    }
  }, []);
  
  const resetState = useCallback(() => {
      setStep('UPLOAD');
      setForm({ subjectImages: [], isModel: true, ratio: '9:16', quality: 'standard' });
      setImagePreviews([]);
      setFaceAnchor(null);
      setDiagnosis(null);
      setCards([]);
      setSelectedCard(null);
      setControlOptions(null);
      setOverrides({ background: '', camera: '', pose: '', lighting: '', props: '' });
      setGeneratedImages([]);
      setError(null);
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newFiles: File[] = Array.from(event.target.files);
      const updatedFiles = [...form.subjectImages, ...newFiles];
      setForm(prev => ({ ...prev, subjectImages: updatedFiles }));
      
      const newPreviews = newFiles.map((file: File) => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
      setError(null);
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedFiles = [...form.subjectImages];
    updatedFiles.splice(index, 1);
    
    const updatedPreviews = [...imagePreviews];
    // Revoke URL to prevent memory leaks
    URL.revokeObjectURL(updatedPreviews[index]);
    updatedPreviews.splice(index, 1);
    
    setForm(prev => ({ ...prev, subjectImages: updatedFiles }));
    setImagePreviews(updatedPreviews);
  };

  const handleClearAllImages = () => {
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    setForm(prev => ({ ...prev, subjectImages: [] }));
    setImagePreviews([]);
  };

  const handleFaceAnchorUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0]) {
          const file = event.target.files[0];
          try {
              const fileData = await fileToBase64(file);
              const url = URL.createObjectURL(file);
              setFaceAnchor({ url, fileData });
          } catch (err) {
              setError(getFriendlyErrorMessage(err));
          }
      }
  };

  const handleStartDiagnosis = useCallback(async () => {
    if (form.subjectImages.length === 0) return;
    setIsLoading(true); setError(null);
    try {
      setLoadingMessage('正在進行 AI 影像診斷 (綜合分析所有上傳圖片)...');
      // 修改：傳送所有圖片進行分析
      const diag = await getAIDiagnosis(form.subjectImages, form.isModel);
      setDiagnosis(diag);

      setLoadingMessage('正在生成創意概念卡...');
      const bgCards = await getBackgroundCards(diag);
      setCards(bgCards);
      setStep('DIAGNOSIS');
    } catch (err) { setError(getFriendlyErrorMessage(err)); } 
    finally { setIsLoading(false); }
  }, [form.isModel, form.subjectImages]);

  const handleCardSelect = useCallback(async (card: BackgroundCard) => {
    setSelectedCard(card);
    setIsLoading(true);
    setLoadingMessage('正在規劃微調選項變體...');
    try {
      if (!diagnosis) throw new Error("Diagnosis is missing.");
      const options = await getAllControlOptions(diagnosis, card);
      setControlOptions(options);
      // 初始化微調參數為概念卡預設值
      setOverrides({
          background: card.background,
          camera: card.camera,
          pose: card.pose,
          lighting: card.lighting,
          props: card.props
      });
      setStep('FINETUNE');
    } catch (err) { setError(getFriendlyErrorMessage(err)); } 
    finally { setIsLoading(false); }
  }, [diagnosis]);
  
  const handleGenerate = useCallback(async () => {
      if (form.subjectImages.length === 0 || !diagnosis || !selectedCard) return;
      setIsLoading(true); setError(null);
      const taskId = addTask({ name: `生成產品海報 (${imageCount} 張)` });
      
      try {
          const onProgress = (message: string) => {
            setLoadingMessage(message);
            updateTask(taskId, { status: 'processing', progress: 50 });
          };
          
          // Limit tasks to imageCount
          const selectedImages = form.subjectImages.slice(0, imageCount);
          
          const tasks = selectedImages.map((file, index) => async () => {
              const currentProgress = Math.round(((index) / selectedImages.length) * 100);
              updateTask(taskId, { progress: currentProgress, status: 'processing' });
              setLoadingMessage(`正在處理第 ${index + 1}/${selectedImages.length} 張圖片...`);
              let subjectData = await fileToBase64(file);
              
              if (useAutoCleanup) {
                  const cleanedUrl = await cleanupSubject(subjectData, onProgress);
                  const cleanedData = await imageUrlToimageData(cleanedUrl);
                  subjectData = cleanedData;
              }

              const result = await generateProductPoster(
                  form as any, 
                  diagnosis, 
                  selectedCard, 
                  overrides, 
                  onProgress,
                  faceAnchor?.fileData,
                  useColorLock ? colorLock : undefined,
                  subjectData
              );
              return result.url;
          });

          const results = await processTasksInParallel<string>(tasks, 2);
          
          setGeneratedImages(results);
          setStep('RESULT');
          updateTask(taskId, { status: 'completed', progress: 100, resultUrl: results[0] });
          addNotification({
            type: 'success',
            message: '海報生成成功',
            description: `已完成 ${results.length} 張產品海報。`
          });
      } catch (err) { 
          const msg = getFriendlyErrorMessage(err);
          setError(msg); 
          updateTask(taskId, { status: 'failed', error: msg });
          addNotification({
            type: 'error',
            message: '生成失敗',
            description: msg
          });
      } 
      finally { setIsLoading(false); }
  }, [form, diagnosis, selectedCard, overrides, faceAnchor, useColorLock, colorLock, useAutoCleanup, addTask, updateTask, addNotification]);

  const handleSaveToPortfolio = useCallback(async () => {
    if (generatedImages.length > 0) {
      setIsLoading(true);
      setLoadingMessage('正在儲存至作品集...');
      try {
        const items = generatedImages.map(url => ({
          imageUrl: url,
          sourceModule: 'ProductPosterEngine'
        }));
        await saveMultiplePortfolioItems(items);
        addNotification({
          type: 'success',
          message: '已成功儲存至作品集',
          description: `共處理了 ${generatedImages.length} 張海報。`
        });
      } catch (err) {
        addNotification({
          type: 'error',
          message: '儲存失敗',
          description: getFriendlyErrorMessage(err)
        });
      } finally {
        setIsLoading(false);
      }
    }
  }, [generatedImages, addNotification]);

  const handleSavePreset = useCallback(() => {
    if (!newPresetName.trim()) {
      addNotification({ type: 'warning', message: '請輸入預設名稱' });
      return;
    }
    const newPreset: BrandPreset = {
      id: Date.now().toString(),
      name: newPresetName.trim(),
      overrides: { ...overrides }
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem('pavora_pcpe_presets', JSON.stringify(updated));
    setNewPresetName('');
    setShowSavePreset(false);
    addNotification({
      type: 'success',
      message: '品牌風格已儲存',
      description: `名稱：${newPreset.name}`
    });
  }, [newPresetName, overrides, presets, addNotification]);

  const handleApplyPreset = useCallback((preset: BrandPreset) => {
    setOverrides(preset.overrides);
    addNotification({
      type: 'info',
      message: '已套用品牌風格',
      description: `名稱：${preset.name}`
    });
  }, [addNotification]);

  const handleDeletePreset = useCallback((id: string) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    localStorage.setItem('pavora_pcpe_presets', JSON.stringify(updated));
  }, [presets]);
  
  const handleDownload = useCallback(async (format: 'JPG' | 'PNG' | 'PDF', quality: 'standard' | 'high', index: number = selectedImageIndex) => {
    const targetImage = generatedImages[index];
    if (!targetImage) return;
    setIsLoading(true);
    setLoadingMessage(`正在匯出為 ${quality === 'high' ? '高畫質' : '標準'} ${format}...`);
    try {
        if (format === 'PDF') {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = targetImage;
            await new Promise((resolve) => { img.onload = resolve; });

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            
            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF({
                orientation: canvas.width > canvas.height ? 'l' : 'p',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`pavora_poster_${Date.now()}_${index}.pdf`);
        } else {
            downloadImage(targetImage, `pavora_poster_${Date.now()}_${index}_${quality}.${format.toLowerCase()}`);
        }
    } catch (err) { setError(getFriendlyErrorMessage(err)); } 
    finally { setIsLoading(false); }
}, [generatedImages, selectedImageIndex]);

  const renderUploadStep = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">1. 上傳主體影像 (支援多選)</h3>
                {imagePreviews.length > 0 && (
                    <button 
                        onClick={handleClearAllImages}
                        className="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase tracking-widest transition-colors"
                    >
                        全部刪除
                    </button>
                )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
            <input type="file" ref={faceAnchorInputRef} className="hidden" accept="image/*" onChange={handleFaceAnchorUpload} />

            {imagePreviews.length > 0 ? (
                <div className="space-y-4">
                    <div className="relative group w-full aspect-square bg-[var(--color-bg-deep)]/20 rounded-xl overflow-hidden border border-[var(--color-border)]">
                        <img src={imagePreviews[0]} alt="Subject preview" className="w-full h-full object-contain cursor-pointer" onClick={() => fileInputRef.current?.click()} />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none text-[var(--color-text-title)] font-bold">
                            點擊更換/新增圖片
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleRemoveImage(0); }}
                            className="absolute top-2 left-2 bg-red-600/80 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors z-20"
                        >
                            &times;
                        </button>
                        {form.isModel && (
                             <div className="absolute top-2 right-2 w-20 h-20 bg-[var(--color-bg-deep)] border border-[var(--color-border)] rounded-md overflow-hidden shadow-lg z-10">
                                {faceAnchor ? (
                                    <>
                                        <img src={faceAnchor.url} alt="Face Anchor" className="w-full h-full object-cover" />
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setFaceAnchor(null); }}
                                            className="absolute top-0 right-0 bg-red-600 text-white w-5 h-5 flex items-center justify-center text-xs"
                                        >&times;</button>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[10px] text-center text-[var(--color-text-title)]">臉部錨定</div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--color-bg-surface)]/30" onClick={(e) => { e.stopPropagation(); faceAnchorInputRef.current?.click(); }}>
                                        <span className="text-xl text-[var(--color-text-dim)]">+</span>
                                        <span className="text-[10px] text-[var(--color-text-dim)]">臉部錨定</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {imagePreviews.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                            {imagePreviews.slice(1, 5).map((url, i) => (
                                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-deep)]/20 group">
                                    <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover opacity-60" />
                                    <button 
                                        onClick={() => handleRemoveImage(i + 1)}
                                        className="absolute inset-0 bg-red-600/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold"
                                    >
                                        刪除
                                    </button>
                                </div>
                            ))}
                            {imagePreviews.length > 5 && (
                                <div className="aspect-square rounded-lg bg-[var(--color-bg-surface)]/5 flex items-center justify-center text-xs text-[var(--color-text-dim)] border border-dashed border-[var(--color-border)]">
                                    +{imagePreviews.length - 5}
                                </div>
                            )}
                        </div>
                    )}
                    <p className="text-center text-[10px] text-[var(--color-text-dim)] uppercase tracking-widest">已選取 {imagePreviews.length} 張圖片</p>
                </div>
            ) : (
                <div onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-[var(--color-border)] rounded-lg p-16 text-center cursor-pointer hover:border-[var(--color-gold)] flex flex-col items-center justify-center transition-all bg-[var(--color-bg-surface)]/10">
                    <PhotoIcon className="w-16 h-16 text-[var(--color-text-dim)] mb-4" />
                    <p className="text-lg text-[var(--color-text-dim)] font-display uppercase">Upload Images</p>
                    <p className="text-xs text-[var(--color-text-dim)] mt-2">支援批次上傳多張人物或商品圖片</p>
                </div>
            )}
        </Card>
        <Card>
            <h3 className="text-xl font-bold mb-4">2. 輸出設定</h3>
            <div className="space-y-6">
                <div>
                    <label className="block text-[11px] font-bold text-[var(--color-text-dim)] mb-2 uppercase tracking-[0.1em] font-display">Subject Type</label>
                    <div className="flex gap-2">
                        <Button onClick={() => setForm(p => ({...p, isModel: true}))} variant={form.isModel ? 'light' : 'secondary'} className="flex-1">人物 (Person)</Button>
                        <Button onClick={() => { setForm(p => ({...p, isModel: false})); setFaceAnchor(null); }} variant={!form.isModel ? 'light' : 'secondary'} className="flex-1">產品 (Product)</Button>
                    </div>
                </div>
                <Select label="長寬比 (Aspect Ratio)" options={[{value: '9:16', label: '9:16 (直式手機)'}, {value: '3:4', label: '3:4 (時尚人像)'}, {value: '1:1', label: '1:1 (正方形)'}, {value: '4:3', label: '4:3 (標準橫式)'}, {value: '16:9', label: '16:9 (寬螢幕)'}]} value={form.ratio} onChange={e => setForm(p => ({...p, ratio: e.target.value as PCPERatio}))} />
                <Select label="生成品質 (Rendering)" options={[{value: 'standard', label: '標準 (Standard)'}, {value: 'high', label: '高畫質 (High-End 4K)'}]} value={form.quality || 'standard'} onChange={e => setForm(p => ({...p, quality: e.target.value as 'standard' | 'high'}))} />
                
                <div className="space-y-3">
                    <label className="block text-[11px] font-bold text-[var(--color-text-dim)] uppercase tracking-[0.1em] font-display">生成張數 (Image Count)</label>
                    <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map(n => (
                            <button
                                key={n}
                                onClick={() => setImageCount(n)}
                                className={`py-2 rounded-lg text-xs font-bold border transition-all ${imageCount === n ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)]' : 'bg-white/5 text-gray-400 border-gray-800 hover:border-gray-600'}`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>

                <Button onClick={handleStartDiagnosis} disabled={form.subjectImages.length === 0 || isLoading} className="w-full text-xl py-4 mt-4 shadow-xl">開始 AI 影像診斷</Button>
            </div>
        </Card>
    </div>
  );

  const renderDiagnosisStep = () => (
    <div className="animate-fade-in pt-12">
        <div className="flex justify-between items-center mb-6 border-b border-[var(--color-border)] pb-4">
            <h2 className="text-3xl font-bold uppercase tracking-widest">AI 診斷與創意方向</h2>
            <Button onClick={() => setStep('UPLOAD')} variant="secondary">重新上傳</Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <Card className="lg:col-span-4 space-y-5 text-sm">
                <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-3">
                    <h3 className="text-xl font-bold text-[var(--color-gold)]">視覺診斷摘要</h3>
                    <Button variant="secondary" className="text-[10px] py-1 px-3" onClick={() => setIsDiagnosisOverlayOpen(true)}>完整報告</Button>
                </div>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    <SummaryItem title="主體核心特徵" content={diagnosis?.視覺摘要?.主體核心特徵} />
                    <SummaryItem title="多角度觀察" content={diagnosis?.視覺摘要?.多角度觀察} />
                    <SummaryItem title="視覺缺陷" content={diagnosis?.問題診斷?.視覺缺陷} />
                    <SummaryItem title="融合挑戰" content={diagnosis?.問題診斷?.融合挑戰} />
                    <SummaryItem title="鏡頭策略" content={diagnosis?.攝影方向?.鏡頭策略} />
                    <SummaryItem title="創意背景" content={diagnosis?.創意建議?.背景類型建議} />
                </div>
            </Card>
            <div className="lg:col-span-8">
                <h3 className="text-xl font-bold mb-4 uppercase tracking-widest">選擇創意概念卡</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cards.map(card => (
                        <button key={card.id} className="text-left group" onClick={() => handleCardSelect(card)}>
                            <Card className="h-full p-5 space-y-3 hover:border-[var(--color-gold)] transition-all duration-300">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-xl group-hover:text-[var(--color-gold)] transition-colors">{card.title}</h4>
                                    <span className="text-[10px] font-mono text-[var(--color-text-dim)]">#CONCEPT</span>
                                </div>
                                <p className="text-xs text-[var(--color-text-dim)] leading-relaxed">{card.why}</p>
                            </Card>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );

  const renderFinetuneStep = () => (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6 border-b border-[var(--color-border)] pb-4">
        <h2 className="text-3xl font-bold uppercase tracking-widest">參數微調與渲染發送</h2>
        <Button onClick={() => setStep('DIAGNOSIS')} variant="secondary">返回概念卡</Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start pt-12">
        <Card className="space-y-2 max-h-[85vh] overflow-y-auto pr-4 custom-scrollbar">
            <div className="flex justify-between items-center mb-6 border-b border-[var(--color-border)] pb-4">
                <h3 className="text-2xl font-bold">Director Controls</h3>
                <Button variant="secondary" className="text-xs py-1" onClick={() => setShowSavePreset(!showSavePreset)}>
                    {showSavePreset ? '取消儲存' : '儲存為品牌風格'}
                </Button>
            </div>

            {showSavePreset && (
                <div className="bg-[var(--color-gold)]/5 border border-[var(--color-gold)]/30 p-4 rounded-xl mb-8 animate-fade-in">
                    <label className="block text-[10px] font-bold text-[var(--color-gold)] mb-2 uppercase tracking-widest">新風格名稱</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={newPresetName} 
                            onChange={e => setNewPresetName(e.target.value)}
                            placeholder="例如：極簡白牆風格"
                            className="flex-1 bg-[var(--color-bg-deep)]/40 border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                        />
                        <Button onClick={handleSavePreset} className="px-4 py-2 text-sm">確認儲存</Button>
                    </div>
                </div>
            )}

            {presets.length > 0 && (
                <div className="mb-8">
                    <label className="block text-[10px] font-bold text-[var(--color-text-dim)] mb-3 uppercase tracking-widest">已儲存的品牌風格</label>
                    <div className="flex flex-wrap gap-2">
                        {presets.map(p => (
                            <div key={p.id} className="group relative">
                                <button 
                                    onClick={() => handleApplyPreset(p)}
                                    className="px-4 py-2 bg-[var(--color-bg-surface)]/5 border border-[var(--color-border)] rounded-full text-xs hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-all"
                                >
                                    {p.name}
                                </button>
                                <button 
                                    onClick={() => handleDeletePreset(p.id)}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-900 text-white rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <FinetuneGroup 
              label="背景環境 (Background)" 
              value={overrides.background} 
              onChange={v => setOverrides(p => ({ ...p, background: v }))} 
              defaultOption={{ 
                label_zh: "(預設) 概念卡建議背景", 
                purpose_zh: selectedCard?.why || '', 
                prompt: selectedCard?.background || '' 
              }} 
              altOptions={controlOptions?.bg_options || []} 
              getOptionProps={opt => {
                const o = opt as any;
                return { 
                  label_zh: o?.label_zh || '未知選項', 
                  purpose_zh: o?.purpose_zh || '', 
                  prompt: o?.background || o?.prompt || '' 
                };
              }} 
            />

            <FinetuneGroup 
              label="鏡頭語言 (Camera Strategy)" 
              value={overrides.camera} 
              onChange={v => setOverrides(p => ({ ...p, camera: v }))} 
              defaultOption={{ 
                label_zh: "(預設) 概念卡建議鏡頭", 
                purpose_zh: '依照概念卡自動配置的相機參數', 
                prompt: selectedCard?.camera || '' 
              }} 
              altOptions={controlOptions?.cam_options || []} 
              getOptionProps={opt => {
                const o = opt as any;
                return { 
                  label_zh: o?.label_zh || '未知選項', 
                  purpose_zh: o?.purpose_zh || '', 
                  prompt: o?.camera || o?.prompt || '' 
                };
              }} 
            />

            <FinetuneGroup 
              label="姿態與角度 (Pose & Angle)" 
              value={overrides.pose} 
              onChange={v => setOverrides(p => ({ ...p, pose: v }))} 
              defaultOption={{ 
                label_zh: "(預設) 概念卡建議姿態", 
                purpose_zh: '依照影像內容自動優化的姿態', 
                prompt: selectedCard?.pose || '' 
              }} 
              altOptions={controlOptions?.pose_options || []} 
              getOptionProps={opt => {
                const o = opt as any;
                return { 
                  label_zh: o?.label_zh || '未知選項', 
                  purpose_zh: o?.purpose_zh || '', 
                  prompt: o?.pose || o?.prompt || '' 
                };
              }} 
            />

            <FinetuneGroup 
              label="佈光風格 (Lighting Setup)" 
              value={overrides.lighting} 
              onChange={v => setOverrides(p => ({ ...p, lighting: v }))} 
              defaultOption={{ 
                label_zh: "(預設) 概念卡建議佈光", 
                purpose_zh: '與背景氛圍完美契合的打光', 
                prompt: selectedCard?.lighting || '' 
              }} 
              altOptions={controlOptions?.light_options || []} 
              getOptionProps={opt => {
                const o = opt as any;
                return { 
                  label_zh: o?.label_zh || '未知選項', 
                  purpose_zh: o?.purpose_zh || '', 
                  prompt: o?.lighting || o?.prompt || '' 
                };
              }} 
            />

            <FinetuneGroup 
               label="裝飾道具 (Props)" 
               value={overrides.props} 
               onChange={v => setOverrides(p => ({ ...p, props: v }))} 
               defaultOption={{ 
                 label_zh: "(預設) 概念卡建議道具", 
                 purpose_zh: '增強畫面層次感的點綴物', 
                 prompt: selectedCard?.props || '' 
               }} 
               altOptions={controlOptions?.props_options || []} 
               getOptionProps={opt => {
                 const o = opt as any;
                 return { 
                   label_zh: o?.label_zh || '未知選項', 
                   purpose_zh: o?.purpose_zh || '', 
                   prompt: o?.props || o?.prompt || '' 
                 };
               }} 
             />

             <div className="mt-10 pt-8 border-t border-[var(--color-border)]">
                 <div className="flex items-center justify-between mb-6">
                     <div>
                         <h4 className="text-lg font-bold flex items-center gap-2">
                             色彩鎖定技術 <span className="text-[10px] bg-[var(--color-gold)]/20 text-[var(--color-gold)] px-2 py-0.5 rounded uppercase">Experimental</span>
                         </h4>
                         <p className="text-xs text-[var(--color-text-dim)] mt-1">強制 AI 鎖定商品核心色，防止環境光導致色差</p>
                     </div>
                     <div 
                         className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${useColorLock ? 'bg-[var(--color-gold)]' : 'bg-[var(--color-bg-input)]'}`}
                         onClick={() => setUseColorLock(!useColorLock)}
                     >
                         <div className={`w-4 h-4 bg-white rounded-full transition-transform ${useColorLock ? 'translate-x-6' : 'translate-x-0'}`} />
                     </div>
                 </div>

                 {useColorLock && (
                     <div className="animate-fade-in flex flex-col md:flex-row gap-6 items-center bg-[var(--color-bg-surface)]/5 p-6 rounded-2xl border border-[var(--color-border)]">
                         <ColorPicker color={colorLock} onChange={setColorLock} />
                         <div className="flex-1 space-y-3">
                             <div className="text-xs text-[var(--color-text-dim)] leading-relaxed">
                                 <p>• 建議吸取商品最亮面的顏色</p>
                                 <p>• 系統將在生成時注入 [COLOR REFERENCE LOCK] 指令</p>
                                 <p>• 適用於對色準要求極高的電商場景</p>
                             </div>
                             <div className="flex items-center gap-3 p-3 bg-[var(--color-bg-deep)]/40 rounded-lg border border-[var(--color-border)]">
                                 <div className="w-6 h-6 rounded shadow-inner" style={{ backgroundColor: colorLock }} />
                                 <span className="font-mono text-sm uppercase">{colorLock}</span>
                             </div>
                         </div>
                     </div>
                 )}

                 <div className="mt-8 pt-8 border-t border-[var(--color-border)]">
                     <div className="flex items-center justify-between">
                         <div>
                             <h4 className="text-lg font-bold flex items-center gap-2">
                                 自動優化流水線 <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase">Auto-Cleanup</span>
                             </h4>
                             <p className="text-xs text-[var(--color-text-dim)] mt-1">生成前自動去背、移除雜物並優化主體細節</p>
                         </div>
                         <div 
                             className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${useAutoCleanup ? 'bg-blue-500' : 'bg-[var(--color-bg-input)]'}`}
                             onClick={() => setUseAutoCleanup(!useAutoCleanup)}
                         >
                             <div className={`w-4 h-4 bg-white rounded-full transition-transform ${useAutoCleanup ? 'translate-x-6' : 'translate-x-0'}`} />
                         </div>
                     </div>
                 </div>
             </div>
            
            <div className="pt-6 sticky bottom-0 bg-[var(--color-bg-deep)] py-4 -mx-4 px-4 border-t border-[var(--color-border)] z-10">
                <Button onClick={handleGenerate} isLoading={isLoading} className="w-full text-xl py-5 shadow-xl">
                    <SparklesIcon className="w-6 h-6 mr-2" /> 執行最終渲染 (Final Render)
                </Button>
            </div>
        </Card>
        
        <div className="sticky top-24 flex flex-col items-center gap-6">
            <h3 className="text-xl font-bold text-[var(--color-text-dim)] font-display uppercase tracking-widest">Subject Reference</h3>
            <div className="w-full relative bg-[var(--color-bg-surface)]/5 p-4 rounded-xl border border-[var(--color-border)] shadow-2xl">
                {imagePreviews[0] && <img src={imagePreviews[0]} alt="Subject" className="w-full max-h-[65vh] object-contain rounded-lg" />}
                <div className="absolute top-4 left-4 z-10">
                     <span className="text-[10px] text-[var(--color-gold)] font-bold bg-[var(--color-bg-deep)]/90 px-3 py-1 rounded border border-[var(--color-gold)]/30 tracking-widest uppercase">Batch Reference</span>
                </div>
            </div>
            <div className="p-4 bg-[var(--color-bg-panel)] rounded-lg border border-[var(--color-border)] w-full text-center">
                <p className="text-xs text-[var(--color-text-dim)] italic">"正在將主體融合至「{selectedCard?.title}」場景，並套用您選定的微調參數。"</p>
            </div>
        </div>
      </div>
    </div>
  );
  
  const renderResultStep = () => (
    <div className="text-center animate-fade-in">
        <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]/5 flex justify-between items-center mb-8 rounded-xl glass-panel">
            <span className="text-[10px] font-mono text-[var(--color-text-dim)] bg-[var(--color-bg-deep)]/40 px-3 py-1 rounded-full border border-[var(--color-border)] uppercase tracking-widest">Batch Production // 批次生成</span>
            <h3 className="text-xl font-bold tracking-[0.2em] uppercase text-[var(--color-text-title)]">生成結果</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {generatedImages.map((url, index) => (
                <div 
                    key={index} 
                    className={`relative group cursor-pointer bg-[var(--color-bg-surface)]/5 p-2 rounded-xl border transition-all duration-300 ${selectedImageIndex === index ? 'border-[var(--color-gold)] shadow-[0_0_30px_rgba(212,175,55,0.2)]' : 'border-[var(--color-border)] shadow-xl'}`} 
                    onClick={() => setSelectedImageIndex(index)}
                >
                    <img src={url} alt={`Generated Poster ${index}`} className="w-full rounded-lg transition-transform duration-500 group-hover:scale-[1.02]" crossOrigin="anonymous" />
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(index); setIsPreviewModalOpen(true); }}
                            className="w-8 h-8 bg-[var(--color-bg-deep)]/60 backdrop-blur-md rounded-full flex items-center justify-center text-[var(--color-text-title)] hover:bg-[var(--color-gold)] transition-colors"
                        >
                            <ExpandIcon className="w-4 h-4" />
                        </button>
                    </div>
                    {selectedImageIndex === index && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[var(--color-gold)] text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                            Selected
                        </div>
                    )}
                </div>
            ))}
        </div>
        <div className="flex justify-center gap-4 flex-wrap mb-12">
            <Button onClick={() => setStep('FINETUNE')} variant="secondary" className="px-8">返回微調</Button>
            <Button onClick={resetState} variant="secondary" className="px-8">重新開始</Button>
            <Button onClick={handleSaveToPortfolio} className="px-8">全部儲存至作品集</Button>
        </div>
        <Card className="max-w-2xl mx-auto p-8 border-t-4 border-[var(--color-gold)]">
            <div className="flex justify-between items-center mb-6 border-b border-[var(--color-border)] pb-4">
                <h3 className="text-2xl font-bold font-display tracking-widest">EXPORT SELECTED (#{selectedImageIndex + 1})</h3>
                <span className="text-xs text-[var(--color-text-dim)]">點擊上方圖片切換選取</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button onClick={() => handleDownload('JPG', 'standard')} variant="secondary" className="text-sm font-bold" disabled={generatedImages.length === 0}>下載 JPG (標準)</Button>
                <Button onClick={() => handleDownload('JPG', 'high')} variant="light" className="text-sm font-bold" disabled={generatedImages.length === 0}>下載 JPG (Pro 4K)</Button>
                <Button onClick={() => handleDownload('PDF', 'high')} variant="light" className="sm:col-span-2 text-sm font-bold" disabled={generatedImages.length === 0}>下載 PDF (專業格式)</Button>
            </div>
            <p className="text-[10px] text-[var(--color-text-dim)] mt-6 font-mono tracking-widest">Pavora PCPE Engine v2.1 - Batch Mode Active</p>
        </Card>
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-[1400px] animate-fade-in pb-20">
        {isLoading && <Loader message={loadingMessage} />}
        <ImageAnalysisOverlay diagnosis={diagnosis} isOpen={isDiagnosisOverlayOpen} onClose={() => setIsDiagnosisOverlayOpen(false)} />
        {generatedImages.length > 0 && isPreviewModalOpen && <ImagePreviewModal images={generatedImages} startIndex={selectedImageIndex} onClose={() => setIsPreviewModalOpen(false)} />}
        
        {/* Header */}
        <div className="sticky top-[80px] z-30 glass-panel border-x-0 border-t-0 px-6 py-4 mb-16">
            <div className="max-w-[110rem] mx-auto flex justify-between items-center">
                <div className="flex flex-col">
                    <h2 className="text-2xl font-display font-bold uppercase tracking-[0.3em] text-[var(--color-text-main)]">影像總監</h2>
                    <span className="text-[9px] uppercase tracking-[0.5em] text-[var(--color-gold)] font-light">Product Poster Engine (PCPE)</span>
                </div>
                <div className="flex items-center gap-4">
                    {onGoHome && <Button onClick={onGoHome} variant="secondary" className="text-[10px] font-bold tracking-widest">返回首頁</Button>}
                </div>
            </div>
        </div>
        
        {error && <div className="text-center text-red-500 p-4 bg-red-900/10 border border-red-500/30 rounded-lg mb-8">{error}</div>}

        {step === 'UPLOAD' && renderUploadStep()}
        {step === 'DIAGNOSIS' && renderDiagnosisStep()}
        {step === 'FINETUNE' && renderFinetuneStep()}
        {step === 'RESULT' && renderResultStep()}
    </div>
  );
};

export default ProductPosterEngine;
