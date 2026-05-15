import React, { useState, useEffect } from 'react';
import { imageDB } from '../../services/imageDB';
import PhotoIcon from '../../assets/icons/PhotoIcon';

interface AsyncImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallback?: React.ReactNode;
  isLoading?: boolean;
}

const AsyncImage: React.FC<AsyncImageProps> = ({ src, fallback, className, isLoading, ...props }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    const load = async () => {
      setLoading(true);
      setError(false);
      
      try {
        if (!src) {
            setLoading(false);
            return;
        }

        if (src.startsWith('idb://')) {
          const blob = await imageDB.get(src);
          if (active && blob) {
            const url = URL.createObjectURL(blob);
            objectUrl = url;
            setImageSrc(url);
            setMimeType(blob.type);
          } else if (active) {
            setError(true);
          }
        } else {
          // Standard URL or Data URL
          setImageSrc(src);
          // Try to infer mime type from data URL
          if (src.startsWith('data:')) {
            const match = src.match(/^data:([^;]+);/);
            if (match) setMimeType(match[1]);
          }
        }
      } catch (e) {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
      // Revoke object URL if we created one to free memory
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (loading) {
    return <div className={`animate-pulse bg-gray-800 flex items-center justify-center ${className}`}><PhotoIcon className="w-6 h-6 text-gray-600"/></div>;
  }

  if (error || !imageSrc) {
    return <div className={`bg-gray-800 flex items-center justify-center text-gray-500 text-xs ${className}`}>{fallback || 'Media not found'}</div>;
  }

  if (mimeType?.includes('video')) {
    return (
      <video 
        src={imageSrc} 
        className={className} 
        controls={false} 
        muted 
        loop 
        playsInline 
        onMouseOver={e => (e.target as HTMLVideoElement).play()}
        onMouseOut={e => (e.target as HTMLVideoElement).pause()}
        style={{ objectFit: 'cover' }}
      />
    );
  }

  return <img src={imageSrc} className={className} {...props} loading="lazy" />;
};

export default AsyncImage;
