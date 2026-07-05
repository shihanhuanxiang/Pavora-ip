
import React, { useEffect, useState } from 'react';
import ExpandIcon from '../../assets/icons/ExpandIcon';

interface VideoPreviewModalProps {
  videoUrl: string;
  onClose: () => void;
  actions?: React.ReactNode;
}

const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({ videoUrl, onClose, actions }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const toggleFullscreen = () => {
    // Note: Actual fullscreen API requires user interaction and is complex.
    // This is a simplified CSS-based fullscreen for the modal content.
    setIsFullscreen(!isFullscreen);
  };

  if (!videoUrl) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in ${isFullscreen ? 'p-0' : 'p-4'}`}
      onClick={onClose}
    >
      <div
        className={`relative flex flex-col items-center justify-center transition-all duration-300 ${isFullscreen ? 'w-full h-full' : 'w-auto h-auto max-w-full max-h-full'}`}
        onClick={e => e.stopPropagation()}
      >
        <video
          src={videoUrl}
          controls
          autoPlay
          loop
          className={`rounded-lg object-contain ${isFullscreen ? 'w-full h-full' : 'max-w-[80vw] max-h-[70vh]'}`}
        />
        
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-white text-black rounded-full h-8 w-8 flex items-center justify-center text-xl font-bold z-20 transition-transform hover:scale-110"
          aria-label="Close"
        >
          &times;
        </button>
        
        <button
          onClick={toggleFullscreen}
          className="absolute top-2 left-2 bg-white/20 text-white rounded-full h-8 w-8 flex items-center justify-center z-20 backdrop-blur-sm transition-all hover:bg-white/40"
          aria-label="Toggle Fullscreen"
        >
          <ExpandIcon className="w-5 h-5" />
        </button>
        
        {actions && !isFullscreen && (
          <div className="mt-4 flex gap-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPreviewModal;
