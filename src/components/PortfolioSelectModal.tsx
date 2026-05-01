import React, { useState, useEffect } from 'react';
import { getPortfolioItems } from '../shared/services/storageService';
import type { PortfolioItem } from '../shared/types/types';
import Button from '../shared/components/common/Button';
import { motion } from 'motion/react';
import AsyncImage from '../shared/components/common/AsyncImage';

interface PortfolioSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedItems: PortfolioItem[]) => void;
}

const PortfolioSelectModal: React.FC<PortfolioSelectModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      const portfolioItems = getPortfolioItems();
      setItems(portfolioItems);
      // Default to select none or all? User said "可手動選擇匯入的圖片或全選匯入"
      // Let's default to none.
      setSelectedIds(new Set());
    }
  }, [isOpen]);

  const toggleItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(i => i.id)));
    }
  };

  const handleConfirm = () => {
    const selected = items.filter(i => selectedIds.has(i.id));
    onConfirm(selected);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-bg-main)]">
          <div>
            <h3 className="text-xl font-display font-bold uppercase tracking-widest text-[var(--color-text-main)]">從作品集錦匯入</h3>
            <p className="text-[10px] text-[var(--color-gold)] uppercase tracking-widest mt-1">選擇要加入模特兒休息室的作品</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 bg-[var(--color-bg-surface)] border-b border-[var(--color-border)] flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSelectAll}
              className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-gold)] hover:underline"
            >
              {selectedIds.size === items.length ? '取消全選' : '全選所有作品'}
            </button>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest">
              已選擇 {selectedIds.size} / {items.length} 件作品
            </span>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-grow overflow-y-auto p-6 custom-scrollbar min-h-[400px]">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-gray-500">
              <p className="text-[10px] uppercase tracking-widest">作品集錦中沒有任何作品</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {items.map(item => (
                <div 
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 cursor-pointer transition-all group ${selectedIds.has(item.id) ? 'border-[var(--color-gold)]' : 'border-transparent hover:border-white/20'}`}
                >
                  <AsyncImage 
                    src={item.imageUrl} 
                    alt={item.sourceModule}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Selection Overlay */}
                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${selectedIds.has(item.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${selectedIds.has(item.id) ? 'bg-[var(--color-gold)] border-[var(--color-gold)] scale-110' : 'bg-black/40 border-white'}`}>
                      {selectedIds.has(item.id) && (
                        <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      )}
                    </div>
                  </div>

                  {/* Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-[8px] text-white truncate font-medium uppercase tracking-tighter">{item.sourceModule}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-[var(--color-bg-main)] border-t border-[var(--color-border)] flex justify-end gap-4">
          <Button variant="secondary" onClick={onClose} className="text-[10px] px-8">取消</Button>
          <Button 
            variant="primary" 
            onClick={handleConfirm} 
            disabled={selectedIds.size === 0}
            className="text-[10px] px-10"
          >
            確認匯入 ({selectedIds.size})
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default PortfolioSelectModal;
