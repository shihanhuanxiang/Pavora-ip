
import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import Button from './Button';
import PhotoIcon from '../../assets/icons/PhotoIcon';
import { fileToBase64 } from '../../services/geminiService';

export interface MaskEditorRef {
    exportMask: () => void;
}

interface MaskEditorProps {
  imageSrc: string;
  onConfirm: (maskDataUrl: string, instruction: string, refImageData?: { data: string; mimeType: string }) => void;
  onCancel: () => void;
}

type Point = { x: number; y: number };
type Stroke = {
  points: Point[];
  size: number;
  mode: 'brush' | 'eraser';
};

const MaskEditor = forwardRef<MaskEditorRef, MaskEditorProps>(({ imageSrc, onConfirm, onCancel }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const refFileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  
  const [brushSize, setBrushSize] = useState(40);
  const [mode, setMode] = useState<'brush' | 'eraser'>('brush');
  const [containerScale, setContainerScale] = useState(1);
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });

  // 描述與參考圖狀態
  const [instruction, setInstruction] = useState('');
  const [refImage, setRefImage] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const [isDraggingBrush, setIsDraggingBrush] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      fitToContainer(img.naturalWidth, img.naturalHeight);
    };
  }, [imageSrc]);

  const fitToContainer = useCallback((w: number, h: number) => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    // 預留右側邊欄寬度 (360px)
    const availableWidth = clientWidth - 360;
    const scaleW = (availableWidth * 0.9) / w;
    const scaleH = (clientHeight * 0.9) / h;
    const s = Math.min(scaleW, scaleH, 1); 
    setContainerScale(s);
  }, []);

  useEffect(() => {
      if (!containerRef.current || imgDimensions.width === 0) return;
      const resizeObserver = new ResizeObserver(() => {
          fitToContainer(imgDimensions.width, imgDimensions.height);
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
  }, [imgDimensions, fitToContainer]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || imgDimensions.width === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const drawStrokes = (list: Stroke[]) => {
        list.forEach(stroke => {
            ctx.beginPath();
            ctx.lineWidth = stroke.size;
            if (stroke.points.length > 0) {
                ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
                stroke.points.forEach(p => ctx.lineTo(p.x, p.y));
            }
            if (stroke.mode === 'brush') {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = 'rgba(212, 175, 55, 0.65)'; 
            } else {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.strokeStyle = 'rgba(0,0,0,1)';
            }
            ctx.stroke();
        });
    };

    drawStrokes(strokes);
    if (currentStroke) {
        drawStrokes([currentStroke]);
    }
    ctx.globalCompositeOperation = 'source-over';
  }, [strokes, currentStroke, imgDimensions]);

  useEffect(() => {
    render();
  }, [render]);

  const getPointerPos = (e: React.MouseEvent | React.TouchEvent): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;
      if ('touches' in e) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      } else {
          clientX = (e as React.MouseEvent).clientX;
          clientY = (e as React.MouseEvent).clientY;
      }
      const scaleX = imgDimensions.width / rect.width;
      const scaleY = imgDimensions.height / rect.height;
      return {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY
      };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if ('button' in e && (e as React.MouseEvent).button !== 0) return;
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPointerPos(e);
    setCurrentStroke({ points: [pos], size: brushSize, mode });
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || !currentStroke) return;
      e.preventDefault();
      const pos = getPointerPos(e);
      setCurrentStroke(prev => prev ? { ...prev, points: [...prev.points, pos] } : null);
  };

  const stopDrawing = () => {
      if (!isDrawing || !currentStroke) return;
      setIsDrawing(false);
      setStrokes(prev => [...prev, currentStroke]);
      setCurrentStroke(null);
  };

  const handleRefImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
          const file = e.target.files[0];
          const data = await fileToBase64(file);
          setRefImage({ url: URL.createObjectURL(file), fileData: data });
      }
  };

  const handleExport = () => {
      const canvas = document.createElement('canvas');
      canvas.width = imgDimensions.width;
      canvas.height = imgDimensions.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      strokes.forEach(stroke => {
          ctx.beginPath();
          ctx.lineWidth = stroke.size;
          if (stroke.points.length > 0) {
              ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
              stroke.points.forEach(p => ctx.lineTo(p.x, p.y));
          }
          if (stroke.mode === 'brush') {
              ctx.strokeStyle = '#FFFFFF';
          } else {
              ctx.strokeStyle = '#000000';
          }
          ctx.stroke();
      });
      
      if (!instruction.trim()) {
          alert('請輸入修正描述（例如：將鈕扣改為玫瑰金金屬質感）');
          return;
      }

      onConfirm(canvas.toDataURL('image/png'), instruction, refImage?.fileData);
  };

  useImperativeHandle(ref, () => ({
    exportMask: handleExport
  }));

  return (
    <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col animate-fade-in no-theme-force">
        {/* 頂部操作列 */}
        <div className="h-16 bg-gray-900 border-b border-white/10 flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-6">
                <h3 className="text-white font-bold text-lg tracking-widest font-display uppercase text-gold-gradient">Precision Fix</h3>
                <div className="h-8 w-px bg-white/10"></div>
                <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10">
                    <button onClick={() => setMode('brush')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'brush' ? 'bg-[var(--color-gold)] text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>畫筆 (Brush)</button>
                    <button onClick={() => setMode('eraser')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'eraser' ? 'bg-[var(--color-gold)] text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>橡皮擦 (Eraser)</button>
                </div>
                <button 
                    onClick={() => setShowGuide(true)}
                    className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-500 hover:text-[var(--color-gold)] hover:border-[var(--color-gold)] transition-all"
                    title="顯示指南"
                >
                    <span className="text-xs font-bold">?</span>
                </button>
                <div className="flex items-center gap-3 ml-4 relative">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">筆刷大小</span>
                    <div className="relative flex items-center">
                        <input 
                            type="range" 
                            min="5" 
                            max="200" 
                            value={brushSize} 
                            onChange={(e) => setBrushSize(Number(e.target.value))} 
                            onMouseDown={() => setIsDraggingBrush(true)}
                            onMouseUp={() => setIsDraggingBrush(false)}
                            onTouchStart={() => setIsDraggingBrush(true)}
                            onTouchEnd={() => setIsDraggingBrush(false)}
                            className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[var(--color-gold)]" 
                        />
                        {isDraggingBrush && (
                            <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 px-2 py-1 bg-[var(--color-gold)] text-black text-[10px] font-bold rounded shadow-lg pointer-events-none z-20 whitespace-nowrap">
                                {brushSize}px
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--color-gold)]"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <Button variant="secondary" onClick={() => setStrokes(prev => prev.slice(0, -1))} disabled={strokes.length === 0} className="text-xs py-1.5 px-4">撤銷塗抹 (Undo)</Button>
                <Button variant="secondary" onClick={onCancel} className="text-xs py-1.5 px-4 text-red-400 border-red-900/50">退出</Button>
                <Button onClick={handleExport} className="text-xs py-1.5 px-6 !bg-white !text-black font-bold">執行 AI 精密修復</Button>
            </div>
        </div>

        <div className="flex-grow flex overflow-hidden relative">
            {/* 操作引導浮窗 */}
            {showGuide && (
                <div className="absolute inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
                    <div className="max-w-md bg-gray-900 border border-[var(--color-gold)]/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent"></div>
                        <h4 className="text-xl font-display font-bold text-[var(--color-gold)] mb-6 tracking-widest uppercase text-center">精密修復指南</h4>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 flex items-center justify-center shrink-0 text-[var(--color-gold)] font-bold text-xs">1</div>
                                <div>
                                    <p className="text-sm font-bold text-white mb-1">塗抹區域</p>
                                    <p className="text-xs text-gray-400 leading-relaxed">使用畫筆在圖片上塗抹您想要修改的區域（例如：衣服、背景物件、配飾）。</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 flex items-center justify-center shrink-0 text-[var(--color-gold)] font-bold text-xs">2</div>
                                <div>
                                    <p className="text-sm font-bold text-white mb-1">輸入指令</p>
                                    <p className="text-xs text-gray-400 leading-relaxed">在右側輸入具體的修改描述，AI 將根據您的文字進行精準重繪。</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 flex items-center justify-center shrink-0 text-[var(--color-gold)] font-bold text-xs">3</div>
                                <div>
                                    <p className="text-sm font-bold text-white mb-1">參考圖 (選填)</p>
                                    <p className="text-xs text-gray-400 leading-relaxed">上傳參考圖可以幫助 AI 學習特定的材質、花紋或設計風格。</p>
                                </div>
                            </div>
                        </div>
                        <Button onClick={() => setShowGuide(false)} className="w-full mt-8 py-3 font-bold tracking-widest">
                            我明白了，開始修復
                        </Button>
                    </div>
                </div>
            )}

            {/* 左側：畫布 */}
            <div ref={containerRef} className="flex-grow relative flex items-center justify-center bg-[#050505] select-none touch-none overflow-hidden">
                {imgDimensions.width > 0 && (
                    <div style={{ width: imgDimensions.width * containerScale, height: imgDimensions.height * containerScale, position: 'relative' }}>
                        <img src={imageSrc} alt="Base" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                        <canvas
                            ref={canvasRef}
                            width={imgDimensions.width}
                            height={imgDimensions.height}
                            className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                )}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md text-[var(--color-gold)] text-[10px] font-bold tracking-[0.2em] px-4 py-2 rounded-full border border-[var(--color-gold)]/20 uppercase pointer-events-none">
                    請塗抹下方需要修正的區域
                </div>
            </div>

            {/* 右側：參數邊欄 */}
            <div className="w-[360px] bg-gray-900 border-l border-white/10 p-6 flex flex-col gap-6 overflow-y-auto">
                <div>
                    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">1. 修正指令 (Instruction)</h4>
                    <textarea 
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        placeholder="請描述預期結果，例如：將手提包手把改為黑色亮面皮革，增加金色金屬扣細節。"
                        className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:border-[var(--color-gold)] outline-none resize-none transition-all"
                    />
                </div>

                <div>
                    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">2. 參考對照圖 (Reference Image)</h4>
                    {refImage ? (
                        <div className="relative group aspect-video bg-black rounded-lg border border-white/10 overflow-hidden shadow-xl">
                            <img src={refImage.url} className="w-full h-full object-contain" alt="Reference" />
                            <button 
                                onClick={() => setRefImage(null)}
                                className="absolute top-2 right-2 bg-black/60 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                            >
                                &times;
                            </button>
                        </div>
                    ) : (
                        <div 
                            onClick={() => refFileInputRef.current?.click()}
                            className="w-full aspect-video border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[var(--color-gold)]/50 bg-white/5 transition-all group"
                        >
                            <PhotoIcon className="w-8 h-8 text-gray-600 group-hover:text-[var(--color-gold)] mb-2" />
                            <span className="text-[10px] text-gray-500 group-hover:text-gray-300 font-bold uppercase tracking-widest">上傳細節參考圖</span>
                            <span className="text-[9px] text-gray-600 mt-1">幫助 AI 學習材質或圖樣</span>
                        </div>
                    )}
                    <input type="file" ref={refFileInputRef} className="hidden" accept="image/*" onChange={handleRefImageChange} />
                </div>

                <div className="mt-auto p-4 bg-[var(--color-gold)]/5 border border-[var(--color-gold)]/20 rounded-lg">
                    <p className="text-[10px] text-[var(--color-gold)] leading-relaxed italic">
                        * Pavora 局部細節修正功能使用高階視覺模型，能精準對齊織物、硬體、LOGO 紋理，實現專業級重繪。
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
});

export default MaskEditor;
