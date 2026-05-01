import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Model } from '../../../shared/types/types';
import Button from '../../../shared/components/common/Button';
import { handleDownload } from '../ModelLounge';
import { useModelStore } from '../../../shared/stores/useModelStore';
import { useNotification } from '../../../shared/context/NotificationContext';

interface ModelActionMenuProps {
    model: Model;
    imageUrl?: string; // Optional: specific image if in portfolio
    isOpen: boolean;
    onClose: () => void;
    onModelSelect: (model: Model, destination: string) => void;
    onPromote?: (model: Model) => void;
    onSetAsCover?: (url: string) => void;
    isGalleryItem?: boolean;
}

const DESTINATIONS = [
    { key: 'fitting_room', label: '虛擬試衣間 (Fitting)' },
    { key: 'scene', label: '場景轉移 (Scene)' },
    { key: 'narrative', label: '靈魂敘事 (Narrative) ✨' },
    { key: 'salon', label: '髮型沙龍 (Salon)' },
];

const ModelActionMenu: React.FC<ModelActionMenuProps> = ({ 
    model, 
    imageUrl, 
    isOpen, 
    onClose, 
    onModelSelect, 
    onPromote,
    onSetAsCover,
    isGalleryItem 
}) => {
    const { updateModel } = useModelStore();
    const { addNotification } = useNotification();
    const activeImageUrl = imageUrl || model.imageUrl;

    const handleSetCover = async () => {
        if (!imageUrl) return;
        try {
            await updateModel(model.id, { imageUrl: imageUrl });
            addNotification({
                type: 'success',
                message: '封面更新成功',
                description: `已將選定作品設為 ${model.name} 的形象封面。`
            });
            if (onSetAsCover) onSetAsCover(imageUrl);
            onClose();
        } catch (e) {
            addNotification({ type: 'error', message: '封面更新失敗' });
        }
    };

    const handleAction = (destKey: string) => {
        onClose();
        // If it's a gallery item, we might want to carry over the specific image for the next step
        const targetModel = isGalleryItem ? { ...model, imageUrl: activeImageUrl } : model;
        onModelSelect(targetModel, destKey);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/95 backdrop-blur-3xl z-[60] flex flex-col justify-center p-8"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <span className="text-[9px] uppercase tracking-[0.4em] text-[var(--color-gold)] font-bold">
                                {isGalleryItem ? 'Asset Intelligence' : 'Model Identity Lab'}
                            </span>
                            <h4 className="text-xl font-display font-bold uppercase tracking-widest text-white">
                                {isGalleryItem ? '衍生資產操作' : model.name}
                            </h4>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                            {isGalleryItem && (
                                <button
                                    onClick={handleSetCover}
                                    className="w-full py-3.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-gold)] border border-[var(--color-gold)]/30 bg-[var(--color-gold)]/5 hover:bg-[var(--color-gold)]/10 transition-all rounded-xl mb-2"
                                >
                                    🖼️ 設為模特兒封面 (Set as Cover)
                                </button>
                            )}
                            
                            {DESTINATIONS.map(dest => (
                                <button
                                    key={dest.key}
                                    onClick={() => handleAction(dest.key)}
                                    className="w-full py-3.5 text-[10px] font-bold uppercase tracking-widest text-white border border-white/5 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] hover:bg-[var(--color-gold)]/5 transition-all rounded-xl"
                                >
                                    {isGalleryItem ? `以此圖啟動 ${dest.label}` : dest.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                            <button
                                onClick={() => { handleDownload({ ...model, imageUrl: activeImageUrl }); onClose(); }}
                                className="text-[10px] text-gray-500 hover:text-white uppercase tracking-widest"
                            >
                                📥 下載此影像與身分內碼
                            </button>
                            
                            {!isGalleryItem && onPromote && (
                                <Button
                                    onClick={() => { onPromote(model); onClose(); }}
                                    className="w-full py-4 text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-[var(--color-gold)]/10"
                                >
                                    晉升品牌大使 💎
                                </Button>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ModelActionMenu;
