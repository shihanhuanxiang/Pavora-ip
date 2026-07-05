
import React, { useState, useRef, useCallback, useEffect } from 'react';
import AsyncImage from './AsyncImage';
import { motion, AnimatePresence } from 'motion/react';

interface ImageCompareSliderProps {
  beforeImage: string;
  afterImage: string;
  mode?: 'slider' | 'side-by-side' | 'quad';
  history?: string[];
  controlledPosition?: number;
  onChange?: (position: number) => void;
  zoom?: number;
}

const ImageCompareSlider: React.FC<ImageCompareSliderProps> = ({ 
  beforeImage, 
  afterImage, 
  mode = 'slider', 
  history = [],
  controlledPosition,
  onChange,
  zoom = 1
}) => {
  const [internalSliderPosition, setInternalSliderPosition] = useState(50);
  const sliderPosition = controlledPosition ?? internalSliderPosition;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current || mode !== 'slider') return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    
    if (onChange) {
      onChange(percent);
    } else {
      setInternalSliderPosition(percent);
    }
  }, [mode, onChange]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'slider') return;
    isDragging.current = true;
    handleMove(e.clientX);
  };
  
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (mode !== 'slider') return;
    isDragging.current = true;
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    if (mode !== 'slider') return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      handleMove(e.clientX);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      handleMove(e.touches[0].clientX);
    };
    
    const handleTouchEnd = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMove, mode]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full select-none overflow-hidden rounded-md group ${mode === 'slider' ? 'cursor-ew-resize' : ''}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <AnimatePresence mode="wait">
        {mode === 'slider' && (
          <motion.div 
            key="slider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full relative"
          >
            {/* Before Image */}
            <AsyncImage
              src={beforeImage}
              alt="Before"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-transform duration-300"
              style={{ transform: `scale(${zoom})` }}
              draggable={false}
            />
            
            {/* After Image (clipped) */}
            <div
              className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <AsyncImage
                src={afterImage}
                alt="After"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-transform duration-300"
                style={{ transform: `scale(${zoom})` }}
                draggable={false}
              />
            </div>

            {/* Slider Handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white/50 pointer-events-none"
              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm">
                <svg className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
              </div>
            </div>
          </motion.div>
        )}

        {mode === 'side-by-side' && (
          <motion.div 
            key="side"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-2 w-full h-full gap-2 p-2"
          >
            <div className="relative rounded-lg overflow-hidden border border-white/10">
              <AsyncImage src={beforeImage} className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-[8px] text-white rounded uppercase tracking-widest">Before</div>
            </div>
            <div className="relative rounded-lg overflow-hidden border border-[var(--color-gold)]/30">
              <AsyncImage src={afterImage} className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 px-2 py-1 bg-[var(--color-gold)]/80 text-[8px] text-black font-bold rounded uppercase tracking-widest">After</div>
            </div>
          </motion.div>
        )}

        {mode === 'quad' && (
          <motion.div 
            key="quad"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="grid grid-cols-2 grid-rows-2 w-full h-full gap-2 p-2"
          >
            {[...history.slice(-3), afterImage].map((img, i) => (
              <div key={i} className="relative rounded-lg overflow-hidden border border-white/10">
                <AsyncImage src={img} className="w-full h-full object-cover" />
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 text-[8px] text-white rounded uppercase tracking-widest">v{history.length - 3 + i + 1}</div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageCompareSlider;
