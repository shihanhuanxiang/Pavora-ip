
import React, { useRef, useEffect, useState, memo } from 'react';
import PhotoIcon from '../../../shared/assets/icons/PhotoIcon';
import type { CardAsset, ModelData } from '../../../shared/types/types';

interface PreviewCanvasProps {
  layoutId: string;
  assets: CardAsset[];
  modelData: ModelData;
  showInfo: boolean;
  showGuides: boolean;
  themeBg: string;
  textColor: string;
  displayFont: string;
  bodyFont: string;
  onTransformChange: (id: string, trans: any) => void;
  onSwap: (src: string, dest: string) => void;
  canvasRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  gutter: number;
  margin: number;
  logo: string | null;
  qrCode: string | null;
  typography: any;
  isCmyk: boolean;
}

const CardSlot: React.FC<{ 
    asset?: CardAsset, 
    onTransformChange: (id: string, newTransform: Partial<CardAsset>) => void,
    onSwap: (sourceId: string, destId: string) => void,
    className?: string,
    showGuides: boolean
}> = ({ asset, onTransformChange, onSwap, className = "", showGuides }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isOver, setIsOver] = useState(false);
    const [isSnapping, setIsSnapping] = useState(false);
    const dragState = useRef({ type: 'none', startX: 0, startY: 0, startAngle: 0, startAssetRot: 0 });

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const handleNativeWheel = (e: WheelEvent) => {
            if (!asset) return;
            e.preventDefault();
            e.stopPropagation();

            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            onTransformChange(asset.id, { 
                scale: Math.max(0.1, Math.min(asset.scale + delta, 8)) 
            });
        };

        el.addEventListener('wheel', handleNativeWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleNativeWheel);
    }, [asset, onTransformChange]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!asset) return;
        e.preventDefault();
        
        if (e.altKey) {
            dragState.current.type = 'rotate';
            const rect = e.currentTarget.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            dragState.current.startX = centerX;
            dragState.current.startY = centerY;
            dragState.current.startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
            dragState.current.startAssetRot = asset.rotation;
        } else {
            dragState.current.type = 'pan';
            dragState.current.startX = e.clientX;
            dragState.current.startY = e.clientY;
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!asset || dragState.current.type === 'none') return;
            e.stopPropagation();

            if (dragState.current.type === 'pan') {
                const dx = (e.clientX - dragState.current.startX);
                const dy = (e.clientY - dragState.current.startY);
                dragState.current.startX = e.clientX;
                dragState.current.startY = e.clientY;
                
                const newX = asset.position.x + dx;
                const newY = asset.position.y + dy;
                
                // Smart Snapping Logic (Visual only for now)
                const isNearCenter = Math.abs(newX) < 5 && Math.abs(newY) < 5;
                setIsSnapping(isNearCenter);
                
                onTransformChange(asset.id, { position: { x: newX, y: newY } });
            } else if (dragState.current.type === 'rotate') {
                const currentAngle = Math.atan2(e.clientY - dragState.current.startY, e.clientX - dragState.current.startX);
                const angleDiff = (currentAngle - dragState.current.startAngle) * (180 / Math.PI);
                onTransformChange(asset.id, { rotation: dragState.current.startAssetRot + angleDiff });
            }
        };

        const handleMouseUp = () => { dragState.current.type = 'none'; };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => { 
            window.removeEventListener('mousemove', handleMouseMove); 
            window.removeEventListener('mouseup', handleMouseUp); 
        };
    }, [asset, onTransformChange]);

    return (
        <div 
            ref={containerRef}
            className={`w-full h-full flex items-center justify-center overflow-hidden relative cursor-move transition-all duration-300 ${className} ${isOver ? 'ring-4 ring-blue-500/50 scale-[0.98]' : ''} ${showGuides ? 'bg-white/5 border border-white/10' : 'bg-black/5'}`}
            style={{ touchAction: 'none' }} 
            onMouseDown={handleMouseDown}
            onDragOver={e => { e.preventDefault(); setIsOver(true); }}
            onDragLeave={() => setIsOver(false)}
            onDrop={e => {
                setIsOver(false);
                const sourceId = e.dataTransfer.getData("assetId");
                if (sourceId && asset && sourceId !== asset.id) onSwap(sourceId, asset.id);
            }}
        >
            {isSnapping && showGuides && (
                <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                    <div className="w-px h-full bg-[var(--color-gold)]/40 absolute"></div>
                    <div className="h-px w-full bg-[var(--color-gold)]/40 absolute"></div>
                    <div className="px-2 py-1 bg-[var(--color-gold)] text-[8px] font-bold text-black rounded uppercase tracking-tighter animate-bounce">Snapped</div>
                </div>
            )}
            {asset ? (
                <img 
                    src={asset.src} 
                    className="max-w-none pointer-events-none select-none transition-transform duration-75" 
                    style={{ 
                        transform: `translate(${asset.position.x}px, ${asset.position.y}px) rotate(${asset.rotation}deg) scale(${asset.scale})`,
                        willChange: 'transform'
                    }}
                    onDragStart={e => { e.dataTransfer.setData("assetId", asset.id); }}
                />
            ) : (
                <PhotoIcon className="w-8 h-8 text-gray-400 opacity-20" />
            )}
            {showGuides && <div className="absolute top-1 left-1 text-[9px] font-mono opacity-30 pointer-events-none uppercase">Slot_Ready</div>}
        </div>
    );
};

const PreviewCanvas: React.FC<PreviewCanvasProps> = ({ 
  layoutId, assets, modelData, showInfo, showGuides, themeBg, textColor, displayFont, bodyFont, onTransformChange, onSwap, canvasRef, zoom,
  gutter, margin, logo, qrCode, typography, isCmyk
}) => {
  
  const InfoBlock = () => (
    <div className={`p-6 no-theme-force transition-all ${showGuides ? 'outline outline-1 outline-blue-500/30 bg-blue-500/5' : ''}`}>
        <div 
          className={`font-black uppercase tracking-tighter no-theme-force pavora-text-primary text-${typography.nameSize || '4xl'}`} 
          style={{ 
            fontFamily: displayFont,
            letterSpacing: typography.letterSpacing,
            lineHeight: typography.lineHeight,
            writingMode: typography.isVertical ? 'vertical-rl' : 'horizontal-tb'
          } as any}
        >
          {modelData.name}
        </div>
        
        {!typography.isVertical && (
          <div 
            className="grid grid-cols-2 text-[11px] mt-3 uppercase font-bold no-theme-force pavora-text-secondary" 
            style={{ fontFamily: bodyFont }}
          >
              <div>身高: {modelData.stats.height}cm</div><div>髮色: {modelData.stats.hair}</div>
              <div>胸圍: {modelData.stats.bust}</div><div>眼色: {modelData.stats.eyes}</div>
              <div>腰圍: {modelData.stats.waist}</div><div />
              <div>臀圍: {modelData.stats.hip}</div>
          </div>
        )}
        <div className="mt-4 h-1.5 w-14 bg-[var(--color-gold)]"></div>
    </div>
  );

  const renderSlot = (idx: number, className = "") => (
    <CardSlot asset={assets[idx]} onTransformChange={onTransformChange} onSwap={onSwap} className={className} showGuides={showGuides} />
  );

  return (
    <div className="flex-grow flex items-center justify-center p-2 md:p-4 overflow-auto custom-scrollbar bg-[#050505] inner-shadow">
        <style dangerouslySetInnerHTML={{ __html: `
            .pavora-canvas-root * {
                transition: color 0.3s ease, background-color 0.3s ease;
            }
            .pavora-text-primary {
                color: ${textColor} !important;
                -webkit-text-fill-color: ${textColor} !important;
                opacity: 1 !important;
            }
            .pavora-text-secondary {
                color: ${textColor} !important;
                opacity: 0.9 !important;
            }
            .pavora-canvas-root {
                box-shadow: 0 30px 60px -12px rgba(0,0,0,0.5), 0 18px 36px -18px rgba(0,0,0,0.5);
            }
        `}} />

        <div 
            ref={canvasRef} 
            className={`relative transition-all duration-700 overflow-hidden pavora-canvas-root ${isCmyk ? 'cmyk-preview' : ''}`} 
            style={{ 
                width: '100%', maxWidth: '650px', 
                aspectRatio: `210/297`,
                backgroundColor: themeBg,
                fontFamily: displayFont,
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                '--body-font': bodyFont
            } as any}
        >
            <style dangerouslySetInnerHTML={{ __html: `
                .cmyk-preview {
                    filter: saturate(0.85) contrast(0.95) brightness(1.05) sepia(0.05);
                }
                .cmyk-preview::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background: rgba(255, 255, 255, 0.02);
                    pointer-events: none;
                    z-index: 50;
                }
            `}} />
            {showGuides && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                    <div className="absolute inset-4 border border-dashed border-[var(--color-gold)]/40"></div>
                    <div className="absolute top-1/2 left-0 w-full h-px bg-[var(--color-gold)]/10"></div>
                    <div className="absolute left-1/2 top-0 w-px h-full bg-[var(--color-gold)]/10"></div>
                </div>
            )}

            {logo && (
                <div className="absolute top-6 right-6 z-20 w-24 h-12 flex items-center justify-end">
                    <img src={logo} alt="Agency Logo" className="max-w-full max-h-full object-contain opacity-80" />
                </div>
            )}

            {qrCode && (
                <div className="absolute bottom-6 right-6 z-20 w-16 h-16 bg-white p-1 rounded shadow-lg">
                    <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCode)}`} 
                        alt="Portfolio QR" 
                        className="w-full h-full"
                        referrerPolicy="no-referrer"
                    />
                </div>
            )}

            {(() => {
                const containerStyle = { padding: `${margin}px`, gap: `${gutter}px` };
                switch (layoutId) {
                    case 'pro-a4-hero':
                        return (
                            <div className="grid grid-cols-4 grid-rows-6 h-full" style={containerStyle}>
                                <div className="col-span-3 row-span-5">{renderSlot(0)}</div>
                                <div className="col-span-1 row-span-2">{renderSlot(1)}</div>
                                <div className="col-span-1 row-span-2">{renderSlot(2)}</div>
                                <div className="col-span-1 row-span-1">{renderSlot(3)}</div>
                                <div className="col-span-3 row-span-1 flex items-end">{showInfo && <InfoBlock />}</div>
                            </div>
                        );
                    case 'pro-a4-avant-garde':
                        return (
                            <div className="grid grid-cols-2 h-full" style={containerStyle}>
                                <div className="h-full">{renderSlot(0)}</div>
                                <div className="h-full flex flex-col relative">
                                    {renderSlot(1)}
                                    <div className="absolute bottom-10 left-0 w-full">{showInfo && <InfoBlock />}</div>
                                </div>
                            </div>
                        );
                    case 'pro-a4-classic':
                        return (
                            <div className="grid grid-cols-2 grid-rows-4 h-full" style={containerStyle}>
                                <div className="col-span-1 row-span-3">{renderSlot(0)}</div>
                                <div className="col-span-1 row-span-1">{renderSlot(1)}</div>
                                <div className="col-span-1 row-span-1">{renderSlot(2)}</div>
                                <div className="col-span-1 row-span-1">{renderSlot(3)}</div>
                                <div className="col-span-2 row-span-1 flex items-end">{showInfo && <InfoBlock />}</div>
                            </div>
                        );
                    case 'pro-a4-casting':
                        return (
                            <div className="grid grid-cols-3 h-full" style={containerStyle}>
                                <div className="col-span-1 grid grid-rows-6" style={{gap: `${gutter}px`}}>
                                    {[1,2,3,4,5,6].map(i => <div key={i} className="h-full">{renderSlot(i)}</div>)}
                                </div>
                                <div className="col-span-2 flex flex-col">
                                    <div className="flex-grow">{renderSlot(0)}</div>
                                    {showInfo && <InfoBlock />}
                                </div>
                            </div>
                        );
                    case 'pro-a4-minimal':
                        return (
                            <div className="flex flex-col h-full border-[16px] border-double" style={{borderColor: textColor, padding: `${margin}px`}}>
                                {showInfo && <div className="text-center mb-6"><div className={`font-black uppercase no-theme-force pavora-text-primary text-${typography.nameSize || '6xl'}`} style={{fontFamily: displayFont, letterSpacing: typography.letterSpacing}}>{modelData.name}</div></div>}
                                <div className="flex-grow grid grid-cols-2" style={{gap: `${gutter * 2}px`}}>
                                    {renderSlot(0)}{renderSlot(1)}
                                </div>
                                <div className="grid grid-cols-3 mt-8" style={{gap: `${gutter}px`}}>
                                    {renderSlot(2)}{renderSlot(3)}{renderSlot(4)}
                                </div>
                            </div>
                        );
                    case 'pro-a4-golden':
                        return (
                            <div className="grid grid-cols-12 grid-rows-12 h-full" style={containerStyle}>
                                <div className="col-span-8 row-span-8">{renderSlot(0)}</div>
                                <div className="col-span-4 row-span-4">{renderSlot(1)}</div>
                                <div className="col-span-4 row-span-4">{renderSlot(2)}</div>
                                <div className="col-span-4 row-span-12 flex items-end">{showInfo && <InfoBlock />}</div>
                                <div className="col-span-8 row-span-4">{renderSlot(3)}</div>
                            </div>
                        );
                    default: return <div className="p-20 text-center">佈局未找到</div>;
                }
            })()}
        </div>
    </div>
  );
};

export default memo(PreviewCanvas);
