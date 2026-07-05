
import React, { useState, useRef } from 'react';
import { analyzeCinematicShot, fileToBase64, getFriendlyErrorMessage, generateImageAsset } from '../../shared/services/geminiService';
import type { CinematicAnalysis } from '../../shared/types/types';
import { downloadImage } from '../../shared/utils/imageUtils';
import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
import Loader from '../../shared/components/common/Loader';
import PhotoIcon from '../../shared/assets/icons/PhotoIcon';
import CinematicIcon from '../../shared/assets/icons/CinematicIcon';
import SparklesIcon from '../../shared/assets/icons/SparklesIcon';
import DownloadIcon from '../../shared/assets/icons/DownloadIcon';
import ImagePreviewModal from '../../shared/components/common/ImagePreviewModal';
import VideoPreviewModal from '../../shared/components/common/VideoPreviewModal';
import ExpandIcon from '../../shared/assets/icons/ExpandIcon';

interface CinematicAnalyzerProps {
  onGoHome: () => void;
  onSendToDirector?: (prompt: string) => void;
}

const CinematicAnalyzer: React.FC<CinematicAnalyzerProps> = ({ onGoHome, onSendToDirector }) => {
    const [media, setMedia] = useState<{ url: string; fileData: { data: string; mimeType: string; }; isVideo: boolean } | null>(null);
    const [capturedFrame, setCapturedFrame] = useState<string | null>(null); // To show user what AI sees
    const [analysis, setAnalysis] = useState<CinematicAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Validation/Re-generation
    const [validationImage, setValidationImage] = useState<string | null>(null);
    const [isGeneratingValidation, setIsGeneratingValidation] = useState(false);
    const [previewMedia, setPreviewMedia] = useState<string | null>(null);

    const extractVideoFrame = (videoUrl: string): Promise<{ data: string; mimeType: string }> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.src = videoUrl;
            video.crossOrigin = 'anonymous';
            video.muted = true;
            video.playsInline = true;
            
            // Wait for metadata to load to know duration
            video.onloadedmetadata = () => {
                // Capture at 20% of video length to avoid intro black frames, or 1s if very short
                let seekTime = video.duration * 0.2; 
                if (isNaN(seekTime) || seekTime === 0) seekTime = 1;
                video.currentTime = seekTime;
            };

            video.onseeked = () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context not available'));
                    return;
                }
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                
                // Validate if frame is black (simple check)
                // In a real app, we might analyze pixel data here.
                
                const parts = dataUrl.split(',');
                const base64 = parts[1]; 
                setCapturedFrame(dataUrl); // Save for UI preview
                resolve({ data: base64, mimeType: 'image/jpeg' });
                video.remove();
            };

            video.onerror = () => {
                reject(new Error('Video loading failed'));
                video.remove();
            };
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const isVideoFile = file.type.startsWith('video/');
            
            setIsLoading(true); 
            setLoadingMessage(isVideoFile ? '正在智慧擷取關鍵影格 (Keyframe)...' : '正在載入影像...');
            setError(null);
            setCapturedFrame(null);
            
            try {
                const url = URL.createObjectURL(file);
                
                // Use let for conditional assignment
                let fileData: { data: string; mimeType: string };
                
                if (isVideoFile) {
                    fileData = await extractVideoFrame(url);
                } else {
                    fileData = await fileToBase64(file);
                    setCapturedFrame(`data:${fileData.mimeType};base64,${fileData.data}`);
                }

                setMedia({ url, fileData, isVideo: isVideoFile });
                setAnalysis(null);
                setValidationImage(null);
                
                setLoadingMessage('AI 視覺導演正在進行像素級拆解 (Pixel-Level Deconstruction)...');
                
                // Call API
                const result = await analyzeCinematicShot(fileData);
                setAnalysis(result);
                
            } catch (err) { 
                console.error("Analysis failed:", err);
                setError(getFriendlyErrorMessage(err)); 
            } finally { 
                setIsLoading(false); 
            }
        }
    };

    const handleCopyPrompt = (prompt: string) => {
        if (prompt) {
            navigator.clipboard.writeText(prompt);
            alert('Golden Prompt (EN) 已複製到剪貼簿！');
        }
    };

    const handleCopyJSON = () => {
        if (analysis) {
            navigator.clipboard.writeText(JSON.stringify(analysis, null, 2));
            alert('完整自動化數據 (JSON) 已複製！');
        }
    };

    const handleValidation = async () => {
        if (!analysis?.storyboard || analysis.storyboard.length === 0) return;
        
        const lastIndex = analysis.storyboard.length - 1;
        const prompt = analysis.storyboard[lastIndex].golden_prompt_en;
        
        if (!prompt) return;
        
        setIsGeneratingValidation(true);
        setError(null);
        try {
            const url = await generateImageAsset(prompt, '16:9');
            setValidationImage(url);
        } catch (err) {
            setError(getFriendlyErrorMessage(err));
        } finally {
            setIsGeneratingValidation(false);
        }
    };

    return (
        <div className="container mx-auto p-8 max-w-[1600px] animate-fade-in pb-24">
            {isLoading && <Loader message={loadingMessage} />}
            
            {previewMedia && media && !media.isVideo && (
                <ImagePreviewModal images={[previewMedia]} startIndex={0} onClose={() => setPreviewMedia(null)} />
            )}
            
            {previewMedia && media && media.isVideo && (
                <VideoPreviewModal videoUrl={previewMedia} onClose={() => setPreviewMedia(null)} />
            )}

            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />

            {/* Header */}
            <div className="sticky top-[80px] z-30 glass-panel border-x-0 border-t-0 px-6 py-4 mb-8">
                <div className="max-w-[110rem] mx-auto flex justify-between items-center">
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-display font-bold uppercase tracking-[0.3em] text-[var(--color-text-main)] flex items-center gap-3">
                            <CinematicIcon className="w-8 h-8 text-[var(--color-gold)]" />
                            影視逆向工程
                        </h2>
                        <span className="text-[9px] uppercase tracking-[0.5em] text-[var(--color-gold)] font-light">Visual Director Studio</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {onGoHome && <Button onClick={onGoHome} variant="secondary" className="text-[10px] font-bold tracking-widest">返回首頁</Button>}
                    </div>
                </div>
            </div>
            
            <p className="text-center text-[var(--color-text-dim)] mb-10 max-w-3xl mx-auto">
                上傳電影劇照或影片，AI 將從「導演視視角」還原攝影參數、佈光邏輯，並推導出 Before/Process/After 三段式分鏡腳本。
            </p>

            {error && <div className="text-center text-red-500 p-3 bg-red-500/10 border border-red-500/20 rounded-md mb-6">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <Card>
                        <h3 className="text-xl font-bold text-[var(--color-text-title)] mb-4">來源媒體 (Source Media)</h3>
                        {media ? (
                            <div className="space-y-4">
                                <div className="relative group w-full flex justify-center items-center bg-[var(--color-bg-deep)] rounded-md border border-[var(--color-border)] overflow-hidden min-h-[200px]">
                                    {media.isVideo ? (
                                        <video 
                                            src={media.url} 
                                            className="max-w-full max-h-[500px] w-auto h-auto object-contain" 
                                            controls
                                            onClick={() => setPreviewMedia(media.url)}
                                        />
                                    ) : (
                                        <img 
                                            src={media.url} 
                                            alt="Source" 
                                            className="max-w-full max-h-[500px] w-auto h-auto object-contain" 
                                            onClick={() => setPreviewMedia(media.url)} 
                                        />
                                    )}
                                    
                                    <Button onClick={() => fileInputRef.current?.click()} className="absolute top-2 right-2 text-xs py-1 px-2 opacity-80 hover:opacity-100" variant="secondary">更換</Button>
                                    
                                    <button 
                                        onClick={() => setPreviewMedia(media.url)}
                                        className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition-all"
                                        title="全螢幕檢視"
                                    >
                                        <ExpandIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Analyzed Frame Preview */}
                                {media.isVideo && capturedFrame && (
                                    <div className="p-3 bg-[var(--color-bg-input)] rounded-lg border border-[var(--color-border)]">
                                        <p className="text-xs text-[var(--color-text-dim)] mb-2 flex justify-between">
                                            <span>AI 分析的關鍵影格 (Keyframe)</span>
                                            <span className="text-[var(--color-gold)]">確保畫面清晰</span>
                                        </p>
                                        <div className="flex justify-center bg-[var(--color-bg-deep)] rounded overflow-hidden">
                                            <img src={capturedFrame} className="max-w-full max-h-[150px] w-auto h-auto object-contain" alt="Analyzed Frame" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div onClick={() => fileInputRef.current?.click()} className="w-full h-64 border-2 border-dashed border-[var(--color-border)] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[var(--color-gold)] mb-4 bg-[var(--color-bg-input)]/30">
                                <PhotoIcon className="w-12 h-12 text-[var(--color-text-dim)] mb-2"/>
                                <span className="text-[var(--color-text-dim)]">點擊上傳影像或影片</span>
                                <span className="text-xs text-[var(--color-text-dim)]/60 mt-2">支援 JPG, PNG, MP4, MOV</span>
                            </div>
                        )}
                        
                        {analysis && (
                            <div className="mt-6 border-t border-[var(--color-border)] pt-4">
                                <h3 className="text-xl font-bold text-[var(--color-text-title)] mb-4">閉環驗證 (Re-Render)</h3>
                                <div className="p-3 bg-[var(--color-bg-input)] rounded-lg mb-3">
                                    <p className="text-xs text-[var(--color-text-dim)] mb-2">使用分析出的提示詞重新生成，驗證準確度。</p>
                                    <Button onClick={handleValidation} isLoading={isGeneratingValidation} className="w-full" variant="light" disabled={!analysis.storyboard?.[analysis.storyboard.length - 1]?.golden_prompt_en}>
                                        <SparklesIcon className="w-4 h-4 mr-2" /> 生成驗證圖 (The After)
                                    </Button>
                                </div>
                                {validationImage && (
                                    <div className="relative group cursor-pointer flex justify-center bg-black rounded-md border border-[var(--color-gold)] overflow-hidden" onClick={() => setPreviewMedia(validationImage)}>
                                        <img src={validationImage} alt="Validation" className="max-w-full max-h-[300px] w-auto h-auto object-contain" />
                                        <div className="absolute bottom-2 right-2 flex gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); downloadImage(validationImage, 'validation_render.jpg', 'CinematicAnalyzer'); }} className="p-1 bg-black/60 rounded-full text-white hover:bg-[var(--color-gold)] hover:text-black transition-colors"><DownloadIcon className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                </div>

                <div className="lg:col-span-8 space-y-6">
                    {analysis ? (
                        <>
                            <Card className="border-t-4 border-t-[var(--color-gold)]">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-2xl font-bold text-[var(--color-text-title)] uppercase tracking-wider">視覺技術規格總表 (Technical Audit)</h3>
                                    <span className="bg-[var(--color-bg-input)] text-[var(--color-gold)] px-3 py-1 rounded text-xs font-mono border border-[var(--color-border)]">
                                        {analysis.technical_audit?.genre_style || 'Unknown Style'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-[var(--color-text-dim)] font-bold uppercase text-xs mb-1">色彩科學 (Color Palette)</h4>
                                            <div className="flex flex-wrap gap-3">
                                                {analysis.technical_audit?.color_palette?.map((c, i) => (
                                                    <div key={i} className="flex items-center gap-2 bg-[var(--color-bg-input)] px-2 py-1 rounded border border-[var(--color-border)]">
                                                        <div className="w-4 h-4 rounded-full border border-[var(--color-border)]" style={{backgroundColor: c.hex}}></div>
                                                        <span className="font-mono text-xs text-[var(--color-text-main)]">{c.hex}</span>
                                                    </div>
                                                )) || <span className="text-[var(--color-text-dim)] text-xs">無色彩數據</span>}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-[var(--color-text-dim)] font-bold uppercase text-xs mb-1">鏡頭與感光元件 (Lens & Sensor)</h4>
                                            <p className="text-[var(--color-text-main)] bg-[var(--color-bg-input)] p-2 rounded border-l-2 border-blue-500">{analysis.technical_audit?.lens_camera || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-[var(--color-text-dim)] font-bold uppercase text-xs mb-1">佈光邏輯 (Lighting Schema)</h4>
                                            <p className="text-[var(--color-text-main)] bg-[var(--color-bg-input)] p-2 rounded border-l-2 border-yellow-500">{analysis.technical_audit?.lighting_setup || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-[var(--color-text-dim)] font-bold uppercase text-xs mb-1">材質與細節 (Texture & Details)</h4>
                                            <p className="text-[var(--color-text-main)] italic">{analysis.technical_audit?.texture_details || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="font-mono bg-[var(--color-bg-surface)] text-[var(--color-text-main)] border-l-8 border-l-[var(--color-text-dim)]">
                                <h3 className="text-xl font-bold text-[var(--color-text-title)] mb-4 border-b border-[var(--color-border)] pb-2">復刻拍攝腳本 (Shooting Script)</h3>
                                <div className="space-y-4 pl-4">
                                    <p className="text-lg font-bold text-[var(--color-text-title)] uppercase tracking-widest">{analysis.shooting_script?.scene_header || 'SCENE HEADER'}</p>
                                    <div>
                                        <span className="text-xs text-[var(--color-text-dim)] block mb-1">動作描述 (ACTION)</span>
                                        <p className="text-[var(--color-text-main)] leading-relaxed max-w-3xl">{analysis.shooting_script?.action || 'N/A'}</p>
                                    </div>
                                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                                        <span className="text-xs text-blue-500 block mb-1 font-bold">技術筆記 (TECH NOTES)</span>
                                        <p className="text-blue-600 dark:text-blue-200 text-sm">{analysis.shooting_script?.tech_notes || 'N/A'}</p>
                                    </div>
                                </div>
                            </Card>

                            <Card>
                                <h3 className="text-xl font-bold text-[var(--color-text-title)] mb-4">深度分鏡拆解 (Storyboard Sequence)</h3>
                                
                                {Array.isArray(analysis.storyboard) && analysis.storyboard.length > 0 ? (
                                    <div className="space-y-8">
                                        {analysis.storyboard.map((shot, idx) => (
                                            <div key={idx} className="bg-[var(--color-bg-input)]/50 rounded-lg overflow-hidden border border-[var(--color-border)]">
                                                <div className="bg-[var(--color-bg-input)] p-3 flex justify-between items-center border-b border-[var(--color-border)]">
                                                    <div className="flex items-center gap-4 flex-wrap">
                                                        <span className="text-[var(--color-gold)] font-mono font-bold text-lg">{shot.time_code}</span>
                                                        <span className="text-[var(--color-text-title)] font-bold bg-[var(--color-bg-surface)] px-2 py-0.5 rounded text-sm">{shot.shot_type}</span>
                                                    </div>
                                                    <span className="text-xs text-[var(--color-text-dim)] font-mono">SHOT {idx + 1}</span>
                                                </div>
                                                
                                                <div className="px-4 py-2 bg-[var(--color-bg-deep)]/30 border-b border-[var(--color-border)]/30 flex items-center gap-2">
                                                    <span className="text-xs text-[var(--color-text-dim)] font-bold uppercase">Camera & Tech:</span>
                                                    <span className="text-[var(--color-text-main)] text-sm italic">{shot.camera_move}</span>
                                                </div>
                                                
                                                <div className="p-4 border-b border-[var(--color-border)]/50">
                                                    <p className="text-sm text-[var(--color-text-main)] leading-relaxed whitespace-pre-wrap">{shot.visual_description}</p>
                                                </div>

                                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-xs text-[var(--color-text-dim)] mb-1">Golden Prompt (English)</p>
                                                        <div className="bg-[var(--color-bg-deep)]/50 p-3 rounded border border-[var(--color-gold)]/20 text-[var(--color-text-main)] font-mono text-xs leading-relaxed relative group">
                                                            {shot.golden_prompt_en}
                                                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button 
                                                                    onClick={() => handleCopyPrompt(shot.golden_prompt_en)}
                                                                    className="bg-[var(--color-gold)] text-[var(--color-bg-deep)] px-2 py-0.5 rounded text-[10px] font-bold hover:bg-white transition-colors"
                                                                >
                                                                    COPY
                                                                </button>
                                                                {onSendToDirector && (
                                                                    <button 
                                                                        onClick={() => onSendToDirector(shot.golden_prompt_en)}
                                                                        className="bg-blue-500 text-white px-2 py-0.5 rounded text-[10px] font-bold hover:bg-blue-400 transition-colors"
                                                                    >
                                                                        DIRECTOR
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-[var(--color-text-dim)] mb-1">提示詞解析 (Chinese)</p>
                                                        <div className="bg-[var(--color-bg-input)]/30 p-3 rounded border border-[var(--color-border)]/30 text-[var(--color-text-dim)] text-xs leading-relaxed">
                                                            {shot.golden_prompt_zh}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        尚無分鏡資料
                                    </div>
                                )}
                            </Card>

                            <div className="flex justify-end">
                                <Button onClick={handleCopyJSON} variant="secondary" className="text-xs">
                                    複製完整 JSON 數據
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50 min-h-[400px] border-2 border-dashed border-gray-800 rounded-lg">
                            <CinematicIcon className="w-24 h-24 mb-4" />
                            <p className="text-xl font-medium">等待影像輸入...</p>
                            <p className="text-sm mt-2">請在左側上傳檔案</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CinematicAnalyzer;
