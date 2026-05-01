
import React, { useState, useRef } from 'react';
import { generateStyleAnchorImage, fileToBase64, getFriendlyErrorMessage } from '../../shared/services/geminiService';
import { savePortfolioItem } from '../../shared/services/storageService';
import { downloadImage } from '../../shared/utils/imageUtils';
import type { StyleAnchorParams, StyleAnchorPreset } from '../../shared/types/types';
import { 
    STYLE_ANCHOR_TYPES, STRUCTURE_LAYOUTS, POSE_SETS, 
    MOOD_STATES, PHOTO_STYLES, STYLE_ANCHOR_PRESETS 
} from '../../shared/constants/styleAnchorPresets';
import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
import Loader from '../../shared/components/common/Loader';
import PhotoIcon from '../../shared/assets/icons/PhotoIcon';
import StyleAnchorIcon from '../../shared/assets/icons/StyleAnchorIcon';
import Select from '../../shared/components/common/Select';
import ExpandIcon from '../../shared/assets/icons/ExpandIcon';
import DownloadIcon from '../../shared/assets/icons/DownloadIcon';
import ImagePreviewModal from '../../shared/components/common/ImagePreviewModal';
import SparklesIcon from '../../shared/assets/icons/SparklesIcon';

import { useNotificationStore } from '../../shared/stores/useNotificationStore';

interface StyleAnchorStudioProps {
  onGoHome: () => void;
}

const StyleAnchorStudio: React.FC<StyleAnchorStudioProps> = ({ onGoHome }) => {
    const [identityImage, setIdentityImage] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(null);
    const [outfitImage, setOutfitImage] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(null);
    
    const [params, setParams] = useState<StyleAnchorParams>({
        anchorType: 'geometry',
        cloneCount: 4,
        structureLayout: 'interlocking',
        poseSet: 'classic_4',
        hookIntensity: 'medium',
        outfitConsistency: 'identical',
        moodState: 'relaxed',
        photoStyle: 'studio',
        ratio: '3:4',
        quality: 'standard'
    });

    const [activePresetId, setActivePresetId] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const identityInputRef = useRef<HTMLInputElement>(null);
    const outfitInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'identity' | 'outfit') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsLoading(true); setLoadingMessage('載入影像中...');
            setError(null);
            try {
                const fileData = await fileToBase64(file);
                const url = URL.createObjectURL(file);
                if (type === 'identity') setIdentityImage({ url, fileData });
                else setOutfitImage({ url, fileData });
            } catch (err) {
                setError(getFriendlyErrorMessage(err));
            } finally {
                setIsLoading(false);
            }
        }
    };

    const applyPreset = (preset: StyleAnchorPreset) => {
        setParams(prev => ({ ...prev, ...preset.params }));
        setActivePresetId(preset.id);
    };

    const handleGenerate = async () => {
        if (!identityImage) {
            setError("請先上傳人物參考圖以鎖定身份。");
            return;
        }
        setIsLoading(true); setError(null);
        try {
            const result = await generateStyleAnchorImage({
                ...params,
                identityImage: identityImage.fileData,
                outfitImage: outfitImage?.fileData
            }, (msg: string) => setLoadingMessage(msg));
            setResultUrl(result);
        } catch (err) {
            setError(getFriendlyErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (resultUrl) {
            downloadImage(resultUrl, `style_anchor_${Date.now()}.jpg`, 'StyleAnchor');
            const { addNotification } = useNotificationStore.getState();
            addNotification({
                type: 'success',
                title: '儲存成功',
                message: '已成功儲存並下載至作品集！'
            });
        }
    };

    return (
        <div className="container mx-auto p-4 lg:p-8 max-w-[1400px] animate-fade-in pb-24">
            {isLoading && <Loader message={loadingMessage} />}
            {previewImage && <ImagePreviewModal images={[previewImage]} startIndex={0} onClose={() => setPreviewImage(null)} />}
            
            <input type="file" ref={identityInputRef} className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'identity')} />
            <input type="file" ref={outfitInputRef} className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'outfit')} />

            {/* Header */}
            <div className="sticky top-[80px] z-30 glass-panel border-x-0 border-t-0 px-6 py-4 mb-8">
                <div className="max-w-[110rem] mx-auto flex justify-between items-center">
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-display font-bold uppercase tracking-[0.3em] text-[var(--color-text-main)] flex items-center gap-3">
                            <StyleAnchorIcon className="w-8 h-8 text-[var(--color-gold)]" />
                            視覺錨點
                        </h2>
                        <span className="text-[9px] uppercase tracking-[0.5em] text-[var(--color-gold)] font-light">Style Anchor Studio</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {onGoHome && <Button onClick={onGoHome} variant="secondary" className="text-[10px] font-bold tracking-widest">返回首頁</Button>}
                    </div>
                </div>
            </div>

            <div className="text-center mb-8 max-w-2xl mx-auto">
                <p className="text-[#D4AF37] text-xs font-bold tracking-[0.3em] uppercase mb-2">穿搭視覺錨點引擎 // Creative Lab</p>
                <p className="text-gray-400 text-sm">透過重複分身與空間結構，創造具備強烈「視覺鉤子」的時尚影像。</p>
            </div>

            {error && <div className="text-center text-red-500 p-3 bg-red-900/50 rounded-md mb-6">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left side: Controls */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <Card>
                        <h3 className="text-xl font-bold text-[var(--color-text-title)] mb-4">1. 參考輸入</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">人物身份 (必填)</label>
                                {identityImage ? (
                                    <div className="relative group aspect-square">
                                        <img src={identityImage.url} className="w-full h-full object-cover rounded-md border border-gray-700" />
                                        <button onClick={() => setIdentityImage(null)} className="absolute top-1 right-1 bg-red-600 rounded-full w-5 h-5 text-white text-[10px]">&times;</button>
                                    </div>
                                ) : (
                                    <div onClick={() => identityInputRef.current?.click()} className="aspect-square border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#D4AF37] bg-gray-800/20 transition-colors">
                                        <PhotoIcon className="w-6 h-6 text-gray-600 mb-1" />
                                        <span className="text-[10px] text-gray-500">上傳人物</span>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">穿搭細節 (選填)</label>
                                {outfitImage ? (
                                    <div className="relative group aspect-square">
                                        <img src={outfitImage.url} className="w-full h-full object-cover rounded-md border border-gray-700" />
                                        <button onClick={() => setOutfitImage(null)} className="absolute top-1 right-1 bg-red-600 rounded-full w-5 h-5 text-white text-[10px]">&times;</button>
                                    </div>
                                ) : (
                                    <div onClick={() => outfitInputRef.current?.click()} className="aspect-square border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#D4AF37] bg-gray-800/20 transition-colors">
                                        <PhotoIcon className="w-6 h-6 text-gray-600 mb-1" />
                                        <span className="text-[10px] text-gray-500">上傳穿搭</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center gap-2 mb-4">
                            <SparklesIcon className="w-4 h-4 text-[var(--color-gold)]" />
                            <h3 className="text-xl font-bold text-[var(--color-text-title)]">2. 快速預設風格</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {STYLE_ANCHOR_PRESETS.map(preset => {
                                const isActive = activePresetId === preset.id;
                                return (
                                    <button
                                        key={preset.id}
                                        onClick={() => applyPreset(preset)}
                                        className={`group relative p-4 text-left border rounded-lg transition-all duration-300 ${
                                            isActive 
                                            ? 'bg-[var(--color-gold)]/10 border-[var(--color-gold)] shadow-[0_0_15px_rgba(212,175,55,0.15)]' 
                                            : 'bg-gray-800/40 border-gray-700 hover:border-gray-500 hover:bg-gray-800/60'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`font-bold text-sm tracking-wide ${isActive ? 'text-[var(--color-gold)]' : 'text-[var(--color-text-title)]'}`}>
                                                {preset.name}
                                            </span>
                                            {isActive && <div className="w-2 h-2 rounded-full bg-[var(--color-gold)] shadow-[0_0_8px_var(--color-gold)]" />}
                                        </div>
                                        <p className="text-[11px] text-gray-400 leading-relaxed">
                                            {preset.description}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </Card>

                    <Card>
                        <h3 className="text-xl font-bold text-[var(--color-text-title)] mb-4">3. 進階參數細節</h3>
                        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                            <Select label="視覺母型" options={STYLE_ANCHOR_TYPES} value={params.anchorType} onChange={e => { setParams(p => ({...p, anchorType: e.target.value})); setActivePresetId(null); }} />
                            <Select label="分身數量" options={[3,4,5,6].map(n => ({value: n, label: `${n} 個分身`}))} value={params.cloneCount} onChange={e => { setParams(p => ({...p, cloneCount: parseInt(e.target.value)})); setActivePresetId(null); }} />
                            <Select label="結構佈局" options={STRUCTURE_LAYOUTS} value={params.structureLayout} onChange={e => { setParams(p => ({...p, structureLayout: e.target.value})); setActivePresetId(null); }} />
                            <Select label="姿態套組" options={POSE_SETS} value={params.poseSet} onChange={e => { setParams(p => ({...p, poseSet: e.target.value})); setActivePresetId(null); }} />
                            <Select label="視覺強度" options={[{value:'low', label:'低強度 - 穩定'}, {value:'medium', label:'中強度 - 敘事'}, {value:'high', label:'高強度 - 超現實'}]} value={params.hookIntensity} onChange={e => { setParams(p => ({...p, hookIntensity: e.target.value as any})); setActivePresetId(null); }} />
                            <Select label="服裝一致性" options={[{value:'identical', label:'完全一致'}, {value:'one-variant', label:'主體一致但細節變動'}]} value={params.outfitConsistency} onChange={e => { setParams(p => ({...p, outfitConsistency: e.target.value as any})); setActivePresetId(null); }} />
                            <Select label="氣質情緒" options={MOOD_STATES} value={params.moodState} onChange={e => { setParams(p => ({...p, moodState: e.target.value})); setActivePresetId(null); }} />
                            <Select label="攝影美學" options={PHOTO_STYLES} value={params.photoStyle} onChange={e => { setParams(p => ({...p, photoStyle: e.target.value})); setActivePresetId(null); }} />
                            <Select label="輸出比例" options={[{value:'3:4', label:'3:4 (直式時尚)'}, {value:'1:1', label:'1:1 (正方形)'}, {value:'4:5', label:'4:5 (社群專用)'}]} value={params.ratio} onChange={e => setParams(p => ({...p, ratio: e.target.value}))} />
                            <Select label="渲染品質" options={[{value:'standard', label:'標準 (2K)'}, {value:'high', label:'高品質 (Pro 4K)'}]} value={params.quality} onChange={e => setParams(p => ({...p, quality: e.target.value as any}))} />
                        </div>
                    </Card>

                    <Button 
                        onClick={handleGenerate} 
                        isLoading={isLoading} 
                        disabled={!identityImage} 
                        className="w-full text-xl py-4 shadow-[0_10px_30px_rgba(212,175,55,0.2)]"
                    >
                        生成視覺錨點影像
                    </Button>
                </div>

                {/* Right side: Preview area */}
                <div className="lg:col-span-8 flex flex-col">
                    <Card className="flex-grow flex flex-col items-center justify-center bg-gray-900 relative overflow-hidden min-h-[70vh]">
                        {resultUrl ? (
                            <div className="w-full h-full flex flex-col items-center">
                                <div className="flex-grow w-full flex items-center justify-center p-4">
                                    <img 
                                        src={resultUrl} 
                                        alt="Style Anchor Result" 
                                        className="max-h-full max-w-full object-contain rounded-lg shadow-2xl" 
                                    />
                                </div>
                                <div className="w-full p-4 flex justify-center gap-4 bg-gray-800/50 backdrop-blur-md">
                                    <Button onClick={() => setPreviewImage(resultUrl)} variant="secondary" className="flex items-center gap-2">
                                        <ExpandIcon className="w-4 h-4" /> 全螢幕預覽
                                    </Button>
                                    <Button onClick={() => downloadImage(resultUrl, `style_anchor_${Date.now()}.jpg`, 'StyleAnchor')} variant="secondary" className="flex items-center gap-2">
                                        <DownloadIcon className="w-4 h-4" /> 下載影像
                                    </Button>
                                    <Button onClick={handleSave} variant="light">
                                        儲存至作品集
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-600 opacity-40">
                                <StyleAnchorIcon className="w-32 h-32 mx-auto mb-4" />
                                <p className="text-2xl font-display uppercase tracking-widest italic">Visual Anchor Engine Standby</p>
                                <p className="text-sm mt-2 font-sans tracking-widest">請完成左側設定並點擊「生成視覺錨點影像」</p>
                            </div>
                        )}
                        
                        <div className="absolute top-4 left-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full border border-white/5">
                            Engine: AnchorCore v1.1 // Pavora Lab
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default StyleAnchorStudio;
