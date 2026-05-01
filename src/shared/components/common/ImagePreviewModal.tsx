
import React, { useState, useEffect, useCallback, useRef, WheelEvent, MouseEvent } from 'react';
import ChevronLeftIcon from '../../assets/icons/ChevronLeftIcon';
import ChevronRightIcon from '../../assets/icons/ChevronRightIcon';
import { imageDB } from '../../services/imageDB';

interface ImagePreviewModalProps {
  images: string[];
  startIndex: number;
  onClose: () => void;
  actions?: React.ReactNode;
  srcId?: string;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ images, startIndex, onClose, actions, srcId }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [scale, setScale] = useState(1);

  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false); // Track if drag occurred
  const dragStartRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  // Resolve IDB URL if needed
  useEffect(() => {
      const src = images[currentIndex];
      let objectUrl: string | null = null;
      
      const resolve = async () => {
          if (src && src.startsWith('idb://')) {
              const blob = await imageDB.get(src);
              if (blob) {
                  const url = URL.createObjectURL(blob);
                  objectUrl = url;
                  setResolvedSrc(url);
                  setMimeType(blob.type);
              }
          } else {
              setResolvedSrc(src);
              if (src?.startsWith('data:')) {
                const match = src.match(/^data:([^;]+);/);
                if (match) setMimeType(match[1]);
              } else {
                setMimeType(null);
              }
          }
      };
      
      resolve();
      
      return () => {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
      };
  }, [currentIndex, images]);

  const centerMedia = useCallback(() => {
    const media = mimeType?.includes('video') ? videoRef.current : imgRef.current;
    const wrap = wrapRef.current;
    if (!media || !wrap) return;

    const vw = wrap.clientWidth;
    const vh = wrap.clientHeight;
    
    let natW = 0;
    let natH = 0;

    if (media instanceof HTMLImageElement) {
      if (!media.naturalWidth) return;
      natW = media.naturalWidth;
      natH = media.naturalHeight;
    } else if (media instanceof HTMLVideoElement) {
      if (!media.videoWidth) return;
      natW = media.videoWidth;
      natH = media.videoHeight;
    }

    const s = Math.min(vw / natW, vh / natH, 1);

    setScale(s);
    setTx((vw - natW * s) / 2);
    setTy((vh - natH * s) / 2);
  }, [mimeType]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      else if (e.key === 'ArrowRight') goToNext();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener("resize", centerMedia);
    
    // Center on mount
    const timer = setTimeout(centerMedia, 100);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener("resize", centerMedia);
      clearTimeout(timer);
    };
  }, [goToPrevious, goToNext, onClose, centerMedia]);

  useEffect(() => {
    // Reset transform on image change
    setScale(1);
    setTx(0);
    setTy(0);
  }, [currentIndex]);


  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const wrap = wrapRef.current;
    if (!wrap) return;

    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    const nextScale = Math.min(Math.max(scale + delta, 0.1), 5);
    
    setScale(nextScale);
  };

  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    // Ignore if clicking on buttons or video controls
    if ((event.target as HTMLElement).closest('button')) return;
    if ((event.target as HTMLElement).tagName === 'VIDEO') return;

    if (event.button !== 0) return;
    event.preventDefault();
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = { x: event.clientX, y: event.clientY, tx, ty };
    if (wrapRef.current) wrapRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = useCallback((event: globalThis.MouseEvent) => {
    if (isDraggingRef.current) {
      const dx = event.clientX - dragStartRef.current.x;
      const dy = event.clientY - dragStartRef.current.y;
      
      // Mark as moved if drag exceeds threshold
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          hasMovedRef.current = true;
      }
      
      setTx(dragStartRef.current.tx + dx);
      setTy(dragStartRef.current.ty + dy);
    }
  }, []);

  const handleMouseUp = useCallback((event: globalThis.MouseEvent) => {
    if (isDraggingRef.current) {
        // If it was a click (not a drag) AND it was on the wrapper (background), close modal
        if (!hasMovedRef.current && event.target === wrapRef.current) {
            onClose();
        }
    }
    
    isDraggingRef.current = false;
    if (wrapRef.current) wrapRef.current.style.cursor = 'grab';
  }, [onClose]);
  
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);
  
  if (!images || images.length === 0) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[100] animate-fade-in"
      onClick={onClose} // Fallback for outer area if any
      onContextMenu={(e) => { e.preventDefault(); onClose(); }}
    >
      <div 
        ref={wrapRef}
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onClick={e => e.stopPropagation()} // Stop propagation to allow custom click handling via MouseUp
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onDoubleClick={centerMedia}
        style={{ cursor: 'grab' }}
      >
        {resolvedSrc ? (
            mimeType?.includes('video') ? (
              <video 
                ref={videoRef}
                src={resolvedSrc} 
                controls 
                autoPlay
                onLoadedMetadata={centerMedia}
                className="absolute left-0 top-0 select-none max-w-none max-h-none"
                style={{
                  transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
                  transformOrigin: 'top left',
                  willChange: 'transform'
                }}
              />
            ) : (
              <img 
                ref={imgRef}
                src={resolvedSrc} 
                alt={`Preview ${currentIndex + 1}`} 
                onLoad={centerMedia}
                className="absolute left-0 top-0 select-none max-w-none max-h-none"
                style={{
                  transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
                  transformOrigin: 'top left',
                  willChange: 'transform'
                }}
                draggable="false"
              />
            )
        ) : (
            <div className="text-white">Loading...</div>
        )}
        
        <div className="absolute inset-0 pointer-events-none">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white text-black rounded-full h-10 w-10 flex items-center justify-center text-2xl font-bold z-20 transition-transform hover:scale-110 pointer-events-auto"
            aria-label="關閉"
          >
            &times;
          </button>

          {images.length > 1 && (
            <>
              <button onClick={goToPrevious} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 text-white rounded-full h-12 w-12 flex items-center justify-center z-20 backdrop-blur-sm transition-all hover:bg-white/40 pointer-events-auto" aria-label="上一張圖片"><ChevronLeftIcon className="w-6 h-6" /></button>
              <button onClick={goToNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 text-white rounded-full h-12 w-12 flex items-center justify-center z-20 backdrop-blur-sm transition-all hover:bg-white/40 pointer-events-auto" aria-label="下一張圖片"><ChevronRightIcon className="w-6 h-6" /></button>
            </>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col items-center justify-center gap-4 z-20 bg-gradient-to-t from-black/80 to-transparent pb-8 pointer-events-auto">
              {images.length > 1 && (<div className="bg-black/50 text-white text-sm rounded-full px-3 py-1 mb-2">{currentIndex + 1} / {images.length}</div>)}
              {actions && (<div className="flex gap-4">{actions}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;
