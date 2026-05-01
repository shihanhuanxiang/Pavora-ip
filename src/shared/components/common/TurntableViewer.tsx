


import React, { useState, useRef, useEffect, useCallback } from 'react';
import ExpandIcon from '../../assets/icons/ExpandIcon';

interface TurntableViewerProps {
  images?: string[]; // Array of image URLs in order: Front -> Left -> Back -> Right
  videoUrl?: string; // Video URL for seamless 360 rotation
  autoRotate?: boolean;
  aspectRatioClass?: string; // Optional class to override default aspect ratio
  onExpand?: () => void; // Callback for full screen
}

const TurntableViewer: React.FC<TurntableViewerProps> = ({ images, videoUrl, autoRotate = false, aspectRatioClass, onExpand }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100 for the slider/joystick
  
  // Zoom State
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);

  const startXRef = useRef<number>(0);
  const startIndexRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const autoRotateInterval = useRef<number | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Auto rotation logic for images
  useEffect(() => {
    if (images && images.length > 0 && autoRotate && !isDragging && !isInteracting && !videoUrl) {
      autoRotateInterval.current = window.setInterval(() => {
        setCurrentIndex((prev) => {
            const next = (prev + 1) % images.length;
            setProgress((next / (images.length - 1)) * 100);
            return next;
        });
      }, 1500);
    }
    return () => {
      if (autoRotateInterval.current) clearInterval(autoRotateInterval.current);
    };
  }, [autoRotate, isDragging, isInteracting, images, videoUrl]);

  // Auto play for video
  useEffect(() => {
      if (videoUrl && videoRef.current && autoRotate && !isDragging && !isInteracting) {
          videoRef.current.play().catch(() => {});
      } else if (videoRef.current && (isDragging || isInteracting)) {
          videoRef.current.pause();
      }
  }, [autoRotate, isDragging, isInteracting, videoUrl]);

  // Sync video time to progress state for the slider
  const handleTimeUpdate = () => {
      if (videoRef.current && !isDragging) {
          const current = videoRef.current.currentTime;
          const duration = videoRef.current.duration;
          if (duration > 0) {
              setProgress((current / duration) * 100);
          }
      }
  };

  // Handle Slider (Joystick) Change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      setProgress(val);
      setIsInteracting(true); // Stop auto-rotate

      if (videoUrl && videoRef.current && videoRef.current.duration) {
          const time = (val / 100) * videoRef.current.duration;
          videoRef.current.currentTime = time;
      } else if (images && images.length > 0) {
          const index = Math.min(Math.floor((val / 100) * images.length), images.length - 1);
          setCurrentIndex(index);
      }
  };

  const handleStart = useCallback((clientX: number) => {
    if (isZooming) return; // Disable drag rotate when zoomed in? Or handle pan? Let's keep simple.
    setIsDragging(true);
    setIsInteracting(true);
    startXRef.current = clientX;
    startIndexRef.current = currentIndex;
    
    if (videoRef.current) {
        startTimeRef.current = videoRef.current.currentTime;
    }
    
    if (autoRotateInterval.current) clearInterval(autoRotateInterval.current);
  }, [currentIndex, isZooming]);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || !containerRef.current) return;
    
    const width = containerRef.current.offsetWidth;
    const deltaX = clientX - startXRef.current;

    if (videoUrl && videoRef.current && videoRef.current.duration) {
        const duration = videoRef.current.duration;
        const timeDelta = (deltaX / width) * duration;
        let newTime = startTimeRef.current - timeDelta; 

        if (newTime < 0) newTime += duration;
        if (newTime > duration) newTime %= duration;
        
        videoRef.current.currentTime = newTime;
        setProgress((newTime / duration) * 100);

    } else if (images && images.length > 0) {
        const steps = images.length;
        const sensitivity = width / steps; 
        const moveIndex = Math.floor(-deltaX / sensitivity); 
        
        let newIndex = (startIndexRef.current + moveIndex) % steps;
        if (newIndex < 0) newIndex += steps;
        
        if (newIndex !== currentIndex) {
            setCurrentIndex(newIndex);
            setProgress((newIndex / (steps - 1)) * 100);
        }
    }
  }, [isDragging, images, currentIndex, videoUrl]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom Handlers
  const handleMouseEnter = (e: React.MouseEvent) => {
      setIsZooming(true);
  };
  
  const handleMouseMoveZoom = (e: React.MouseEvent) => {
      if (!containerRef.current || isDragging) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setZoomOrigin({ x, y });
      setZoomScale(2); // 2x zoom on hover
  };

  const handleMouseLeaveZoom = () => {
      setIsZooming(false);
      setZoomScale(1);
      setZoomOrigin({ x: 50, y: 50 });
      if (isDragging) handleEnd();
  };

  // Mouse Events
  const onMouseDown = (e: React.MouseEvent) => { 
      e.preventDefault(); e.stopPropagation();
      handleStart(e.clientX); 
  };
  const onMouseMove = (e: React.MouseEvent) => {
      e.preventDefault(); e.stopPropagation();
      if (isDragging) {
          handleMove(e.clientX);
      } else {
          handleMouseMoveZoom(e); // Handle hover zoom
      }
  };
  const onMouseUp = (e: React.MouseEvent) => {
      e.preventDefault(); e.stopPropagation();
      handleEnd();
  };
  const onMouseLeave = (e: React.MouseEvent) => {
     handleMouseLeaveZoom();
  };

  // Touch Events
  const onTouchStart = (e: React.TouchEvent) => { handleStart(e.touches[0].clientX); };
  const onTouchMove = (e: React.TouchEvent) => { handleMove(e.touches[0].clientX); };
  const onTouchEnd = () => handleEnd();

  if ((!images || images.length === 0) && !videoUrl) return null;

  const containerClass = `relative w-full ${aspectRatioClass || 'aspect-[9/16] md:aspect-[3/4]'} bg-white rounded-lg overflow-hidden cursor-grab select-none shadow-2xl group ${isDragging ? 'cursor-grabbing' : ''}`;

  return (
    <div className="flex flex-col items-center w-full gap-3">
        <div 
            ref={containerRef}
            className={containerClass}
            style={{ touchAction: 'none' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <div 
                className="w-full h-full transition-transform duration-100 ease-out"
                style={{ 
                    transform: `scale(${zoomScale})`, 
                    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%` 
                }}
            >
                {videoUrl ? (
                     <video
                        ref={videoRef}
                        src={videoUrl}
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        // Astra Requirement: object-fit: contain with white background for aspect protection
                        style={{ objectFit: 'contain', backgroundColor: '#ffffff' }} 
                        muted
                        loop
                        playsInline
                        onLoadedData={() => setIsVideoReady(true)}
                        onTimeUpdate={handleTimeUpdate}
                    />
                ) : (
                    images!.map((src, index) => (
                        <img 
                            key={index}
                            src={src} 
                            alt={`View ${index}`}
                            className={`absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-300 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                            draggable={false}
                            style={{ backgroundColor: '#ffffff' }}
                        />
                    ))
                )}
            </div>
            
            {/* Hint Overlay */}
            {!isInteracting && !isZooming && (
                <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none transition-opacity duration-500">
                     <div className="bg-black/50 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm flex items-center gap-2">
                        <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        拖曳旋轉 · 懸停放大
                     </div>
                </div>
            )}
            
             {/* Loading Overlay for Video */}
             {videoUrl && !isVideoReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-30">
                    <div className="text-white text-sm animate-pulse">載入影片中...</div>
                </div>
            )}

            {/* Expand Button */}
            {onExpand && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onExpand(); }}
                    className="absolute top-3 right-3 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-40"
                    title="全螢幕檢視"
                >
                    <ExpandIcon className="w-5 h-5" />
                </button>
            )}
        </div>

        {/* Joystick / Control Slider */}
        <div className="w-full px-2 flex items-center gap-3">
            <span className="text-xs text-gray-500 font-mono w-8 text-right">0°</span>
            <div className="relative flex-grow h-8 flex items-center">
                {/* Track */}
                <div className="absolute left-0 right-0 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--color-gold)] transition-all duration-75" style={{ width: `${progress}%` }}></div>
                </div>
                {/* Input */}
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="0.1"
                    value={progress}
                    onChange={handleSliderChange}
                    className="w-full absolute inset-0 opacity-0 cursor-pointer"
                />
                {/* Custom Thumb */}
                <div 
                    className="absolute h-4 w-4 bg-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] pointer-events-none border-2 border-[var(--color-gold)] transition-all duration-75 ease-linear"
                    style={{ left: `calc(${progress}% - 8px)` }}
                ></div>
            </div>
            <span className="text-xs text-gray-500 font-mono w-8">360°</span>
        </div>
    </div>
  );
};

export default TurntableViewer;
