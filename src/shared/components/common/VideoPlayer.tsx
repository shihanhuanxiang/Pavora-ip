
import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../services/core/geminiClient';

interface VideoPlayerProps {
    src: string;
    className?: string;
    controls?: boolean;
    autoPlay?: boolean;
    loop?: boolean;
    muted?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
    src, 
    className = "", 
    controls = true, 
    autoPlay = false, 
    loop = false, 
    muted = false 
}) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        const loadVideo = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Case 1: Already a blob or data URL
                if (src.startsWith('blob:') || src.startsWith('data:')) {
                    if(active) {
                        setBlobUrl(src);
                        setLoading(false);
                    }
                    return;
                }
                
                // Case 2: Gemini API Video URL (proxied server-side, key never reaches browser)
                if (src.includes('generativelanguage.googleapis.com')) {
                    const response = await fetchWithAuth(`/api/gemini-video?fileUri=${encodeURIComponent(src)}`);

                    if (!response.ok) throw new Error(`Video load failed: ${response.status}`);
                    const blob = await response.blob();
                    const objectUrl = URL.createObjectURL(blob);
                    if (active) {
                        setBlobUrl(objectUrl);
                        setLoading(false);
                    }
                } 
                // Case 3: Standard URL
                else {
                    if (active) {
                        setBlobUrl(src);
                        setLoading(false);
                    }
                }
            } catch (err: any) {
                console.error("VideoPlayer error:", err);
                if (active) {
                    setError(err.message || '無法載入影片');
                    setLoading(false);
                }
            }
        };

        loadVideo();
        return () => {
            active = false;
            if (blobUrl && blobUrl.startsWith('blob:')) {
                URL.revokeObjectURL(blobUrl);
            }
        };
    }, [src]);

    if (loading) {
        return (
            <div className={`flex items-center justify-center bg-black/20 ${className}`}>
                <div className="w-8 h-8 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className={`flex items-center justify-center bg-black/40 text-red-500 text-xs p-4 text-center ${className}`}>
                {error}
            </div>
        );
    }

    return (
        <video 
            src={blobUrl || ""} 
            className={className} 
            controls={controls} 
            autoPlay={autoPlay} 
            loop={loop} 
            muted={muted}
            playsInline
        />
    );
};

export default VideoPlayer;
