
import React, { useState, useRef, useEffect } from 'react';
import Button from '../common/Button';
import PhotoIcon from '../../assets/icons/PhotoIcon';

interface Box {
    id: string;
    angle: string;
    box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in 0-1000
}

interface ManualCropModalProps {
    imageUrl: string;
    initialBoxes: Box[];
    angles: { id: string; label: string }[];
    onSave: (boxes: Box[]) => void;
    onClose: () => void;
    onResetToAI?: () => Promise<void>;
}

const ManualCropModal: React.FC<ManualCropModalProps> = ({ imageUrl, initialBoxes, angles, onSave, onClose, onResetToAI }) => {
    const [boxes, setBoxes] = useState<Box[]>(initialBoxes);
    const [isAILoading, setIsAILoading] = useState(false);
    
    // Sync with initialBoxes when they change (e.g. after AI reset)
    useEffect(() => {
        setBoxes(initialBoxes);
    }, [initialBoxes]);

    const handleAIReset = async () => {
        if (!onResetToAI) return;
        setIsAILoading(true);
        try {
            await onResetToAI();
        } catch (error) {
            console.error("AI Reset failed:", error);
            alert("AI 偵測失敗，請稍後再試或手動裁切。");
        } finally {
            setIsAILoading(false);
        }
    };

    const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState<string | null>(null); // 'tl', 'tr', 'bl', 'br'
    const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
    const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
    const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const getNormalizedCoords = (clientX: number, clientY: number) => {
        if (!imageRef.current) return { x: 0, y: 0 };
        const rect = imageRef.current.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * 1000;
        const y = ((clientY - rect.top) / rect.height) * 1000;
        return { 
            x: Math.max(0, Math.min(1000, x)), 
            y: Math.max(0, Math.min(1000, y)) 
        };
    };

    const handleMouseDown = (e: React.MouseEvent, handle?: string, boxId?: string) => {
        const pos = getNormalizedCoords(e.clientX, e.clientY);
        
        if (handle && boxId) {
            e.stopPropagation();
            setSelectedBoxId(boxId);
            setIsResizing(handle);
            setStartPos(pos);
            return;
        }

        if (boxId) {
            e.stopPropagation();
            setSelectedBoxId(boxId);
            setIsDragging(true);
            const box = boxes.find(b => b.id === boxId);
            if (box) {
                setDragOffset({
                    x: pos.x - box.box_2d[1],
                    y: pos.y - box.box_2d[0]
                });
            }
            return;
        }

        // Start drawing new box
        setStartPos(pos);
        setCurrentPos(pos);
        setIsDrawing(true);
        setSelectedBoxId(null);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const pos = getNormalizedCoords(e.clientX, e.clientY);
        setCurrentPos(pos);

        if (isDrawing && startPos) {
            // Handled by render
        } else if (isDragging && selectedBoxId && dragOffset) {
            setBoxes(prev => prev.map(b => {
                if (b.id !== selectedBoxId) return b;
                const width = b.box_2d[3] - b.box_2d[1];
                const height = b.box_2d[2] - b.box_2d[0];
                let newXmin = pos.x - dragOffset.x;
                let newYmin = pos.y - dragOffset.y;
                
                // Boundaries
                newXmin = Math.max(0, Math.min(1000 - width, newXmin));
                newYmin = Math.max(0, Math.min(1000 - height, newYmin));
                
                return {
                    ...b,
                    box_2d: [newYmin, newXmin, newYmin + height, newXmin + width]
                };
            }));
        } else if (isResizing && selectedBoxId) {
            setBoxes(prev => prev.map(b => {
                if (b.id !== selectedBoxId) return b;
                let [ymin, xmin, ymax, xmax] = b.box_2d;
                
                if (isResizing.includes('t')) ymin = pos.y;
                if (isResizing.includes('b')) ymax = pos.y;
                if (isResizing.includes('l')) xmin = pos.x;
                if (isResizing.includes('r')) xmax = pos.x;

                // Ensure min size and correct orientation
                const finalYmin = Math.min(ymin, ymax - 10);
                const finalYmax = Math.max(ymax, ymin + 10);
                const finalXmin = Math.min(xmin, xmax - 10);
                const finalXmax = Math.max(xmax, xmin + 10);

                return {
                    ...b,
                    box_2d: [finalYmin, finalXmin, finalYmax, finalXmax]
                };
            }));
        }
    };

    const handleMouseUp = () => {
        if (isDrawing && startPos && currentPos) {
            const ymin = Math.min(startPos.y, currentPos.y);
            const xmin = Math.min(startPos.x, currentPos.x);
            const ymax = Math.max(startPos.y, currentPos.y);
            const xmax = Math.max(startPos.x, currentPos.x);

            if (xmax - xmin > 20 && ymax - ymin > 20) {
                const newId = `box-${Date.now()}`;
                const newBox: Box = {
                    id: newId,
                    angle: 'front',
                    box_2d: [ymin, xmin, ymax, xmax]
                };
                setBoxes([...boxes, newBox]);
                setSelectedBoxId(newId);
            }
        }
        setIsDrawing(false);
        setIsDragging(false);
        setIsResizing(null);
        setStartPos(null);
        setCurrentPos(null);
        setDragOffset(null);
    };

    const removeBox = (id: string) => {
        setBoxes(boxes.filter(b => b.id !== id));
        if (selectedBoxId === id) setSelectedBoxId(null);
    };

    const updateBoxAngle = (id: string, angle: string) => {
        setBoxes(boxes.map(b => b.id === id ? { ...b, angle } : b));
    };

    const clearAll = () => {
        if (window.confirm('確定要清空所有裁切框嗎？')) {
            setBoxes([]);
            setSelectedBoxId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 lg:p-8">
            <div className="bg-[var(--color-bg-panel)] w-full max-w-7xl h-full max-h-[95vh] rounded-3xl border border-white/10 flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                {/* Header */}
                <div className="px-8 py-5 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-gold)]/20 flex items-center justify-center border border-[var(--color-gold)]/30">
                            <svg className="w-5 h-5 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-widest uppercase">精確裁切與角度分配</h3>
                            <p className="text-[9px] text-gray-500 uppercase mt-0.5 tracking-tighter">Precision Crop & Multi-Angle Mapping</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {onResetToAI && (
                            <button 
                                onClick={handleAIReset}
                                disabled={isAILoading}
                                className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 border rounded-full transition-all flex items-center gap-2 ${isAILoading ? 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed' : 'text-[var(--color-gold)] border-[var(--color-gold)]/20 hover:bg-[var(--color-gold)]/10 hover:text-white'}`}
                            >
                                {isAILoading ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                                        偵測中...
                                    </>
                                ) : (
                                    'AI 自動偵測'
                                )}
                            </button>
                        )}
                        <button 
                            onClick={clearAll}
                            className="text-[10px] font-bold text-red-500/70 hover:text-red-500 uppercase tracking-widest px-4 py-2 border border-red-500/20 rounded-full transition-all hover:bg-red-500/5"
                        >
                            清空所有框
                        </button>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-all">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>

                <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
                    {/* Canvas Area */}
                    <div className="flex-grow bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center p-4 lg:p-12">
                        <div 
                            className="relative inline-block select-none shadow-[0_0_100px_rgba(0,0,0,0.8)]"
                            onMouseDown={(e) => handleMouseDown(e)}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            ref={containerRef}
                        >
                            <img 
                                ref={imageRef}
                                src={imageUrl} 
                                alt="To crop" 
                                className="max-h-[70vh] w-auto object-contain pointer-events-none border border-white/5" 
                                draggable={false}
                            />
                            
                            {/* Existing Boxes */}
                            {boxes.map(box => {
                                const isSelected = selectedBoxId === box.id;
                                return (
                                    <div 
                                        key={box.id}
                                        onMouseDown={(e) => handleMouseDown(e, undefined, box.id)}
                                        className={`absolute border-2 transition-shadow cursor-move ${isSelected ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/10 z-20 shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'border-white/40 bg-white/5 z-10 hover:border-white/60'}`}
                                        style={{
                                            top: `${box.box_2d[0] / 10}%`,
                                            left: `${box.box_2d[1] / 10}%`,
                                            height: `${(box.box_2d[2] - box.box_2d[0]) / 10}%`,
                                            width: `${(box.box_2d[3] - box.box_2d[1]) / 10}%`,
                                        }}
                                    >
                                        {/* Label */}
                                        <div className={`absolute -top-7 left-0 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap border transition-all ${isSelected ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)]' : 'bg-black/80 text-white border-white/20'}`}>
                                            {angles.find(a => a.id === box.angle)?.label || box.angle}
                                        </div>

                                        {/* Resize Handles */}
                                        {isSelected && (
                                            <>
                                                <div onMouseDown={(e) => handleMouseDown(e, 'tl', box.id)} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-[var(--color-gold)] cursor-nwse-resize rounded-sm" />
                                                <div onMouseDown={(e) => handleMouseDown(e, 'tr', box.id)} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-[var(--color-gold)] cursor-nesw-resize rounded-sm" />
                                                <div onMouseDown={(e) => handleMouseDown(e, 'bl', box.id)} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-[var(--color-gold)] cursor-nesw-resize rounded-sm" />
                                                <div onMouseDown={(e) => handleMouseDown(e, 'br', box.id)} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-[var(--color-gold)] cursor-nwse-resize rounded-sm" />
                                            </>
                                        )}

                                        {/* Delete Button */}
                                        {isSelected && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); removeBox(box.id); }}
                                                className="absolute -top-3 -right-3 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm shadow-xl hover:bg-red-500 transition-colors border border-white/20"
                                            >
                                                &times;
                                            </button>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Drawing Box */}
                            {isDrawing && startPos && currentPos && (
                                <div 
                                    className="absolute border-2 border-dashed border-[var(--color-gold)] bg-[var(--color-gold)]/5 z-30 pointer-events-none"
                                    style={{
                                        top: `${Math.min(startPos.y, currentPos.y) / 10}%`,
                                        left: `${Math.min(startPos.x, currentPos.x) / 10}%`,
                                        height: `${Math.abs(currentPos.y - startPos.y) / 10}%`,
                                        width: `${Math.abs(currentPos.x - startPos.x) / 10}%`,
                                    }}
                                />
                            )}
                        </div>
                        
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-black/80 backdrop-blur-xl px-8 py-3 rounded-full border border-white/10 shadow-2xl">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[var(--color-gold)] animate-pulse"></div>
                                <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">拖曳畫框</span>
                            </div>
                            <div className="w-px h-3 bg-white/10"></div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">移動/縮放</span>
                            </div>
                            <div className="w-px h-3 bg-white/10"></div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">分配角度</span>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="w-full lg:w-96 border-l border-white/5 bg-white/[0.02] p-8 flex flex-col gap-8 overflow-y-auto">
                        <div>
                            <div className="flex justify-between items-end mb-6">
                                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">裁切清單 ({boxes.length})</h4>
                                <span className="text-[9px] text-gray-600 font-mono uppercase">Max 4 Slots</span>
                            </div>
                            
                            <div className="space-y-4">
                                {boxes.map(box => (
                                    <div 
                                        key={box.id}
                                        onClick={() => setSelectedBoxId(box.id)}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer group ${selectedBoxId === box.id ? 'bg-[var(--color-gold)]/10 border-[var(--color-gold)]/50 shadow-[0_0_20px_rgba(212,175,55,0.1)]' : 'bg-white/[0.03] border-white/10 hover:border-white/20'}`}
                                    >
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${selectedBoxId === box.id ? 'bg-[var(--color-gold)]' : 'bg-gray-600'}`}></div>
                                                <span className="text-[10px] font-mono text-gray-500 uppercase">View ID: {box.id.slice(-4)}</span>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); removeBox(box.id); }} className="text-gray-600 hover:text-red-500 transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">分配視角角度</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {angles.map(a => (
                                                    <button
                                                        key={a.id}
                                                        onClick={(e) => { e.stopPropagation(); updateBoxAngle(box.id, a.id); }}
                                                        className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all border ${box.angle === a.id ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)]' : 'bg-black/40 text-gray-400 border-white/5 hover:border-white/20'}`}
                                                    >
                                                        {a.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                {boxes.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                        </div>
                                        <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">請在左側圖片上畫框</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-auto pt-8 border-t border-white/5 space-y-4">
                            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                                <p className="text-[9px] text-blue-400/80 leading-relaxed uppercase font-medium">
                                    提示：確保每個框都完整包含模特兒全身，這將直接影響試衣的精確度。
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button onClick={onClose} variant="secondary" className="flex-1 !rounded-2xl !py-4 text-[11px] uppercase tracking-widest">
                                    取消
                                </Button>
                                <Button onClick={() => onSave(boxes)} variant="primary" className="flex-[2] !rounded-2xl !py-4 text-[11px] uppercase tracking-widest" disabled={boxes.length === 0}>
                                    套用裁切設定
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManualCropModal;
