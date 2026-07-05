
import React, { useState, useMemo } from 'react';
import Card from '../../../shared/components/common/Card';
import Button from '../../../shared/components/common/Button';
import ExpandIcon from '../../../shared/assets/icons/ExpandIcon';
import DownloadIcon from '../../../shared/assets/icons/DownloadIcon';
import ReplaceIcon from '../../../shared/assets/icons/ReplaceIcon';
import { downloadImage } from '../../../shared/utils/imageUtils';
import type { BurstPoseExpressionPair } from '../../../shared/types/types';

interface BurstImage {
  index: number;
  url: string;
  pose: string;
  expression: string;
  selected: boolean;
  status: 'loading' | 'success' | 'error';
}

interface BurstMatrixModalProps {
  modelName: string;
  images: BurstImage[];
  onClose: () => void;
  onConfirm: (selectedUrls: string[]) => void;
  onToggleSelect: (index: number) => void;
  onPreview: (url: string) => void;
  isAIGenerating: boolean;
  // 第三階段新增 props
  burstPairs: BurstPoseExpressionPair[];
  onUpdatePair: (index: number, field: 'pose' | 'expression', value: string) => void;
  onRegenerateCell: (index: number) => void;
  filteredPoses: Record<string, any[]>;
  filteredExpressions: Record<string, any[]>;
}

const BurstMatrixModal: React.FC<BurstMatrixModalProps> = ({
  modelName, images, onClose, onConfirm, onToggleSelect, onPreview, isAIGenerating,
  burstPairs, onUpdatePair, onRegenerateCell, filteredPoses, filteredExpressions
}) => {
  const selectedCount = useMemo(() => images.filter(i => i.selected && i.url).length, [images]);
  const isAllSelected = images.length > 0 && selectedCount === images.filter(i => i.url).length;

  const handleSelectAll = () => {
    const target = !isAllSelected;
    images.forEach(img => {
      if (img.url && img.selected !== target) {
        onToggleSelect(img.index);
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-[var(--color-bg-deep)]/95 flex items-center justify-center z-[60] p-4 animate-fade-in">
      <Card className="w-full max-w-7xl h-[92vh] flex flex-col bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-3xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/5">
          <div>
            <h3 className="text-2xl font-bold text-[var(--color-text-title)] uppercase tracking-widest font-display text-gold-gradient">
              Pavora 渲染矩陣
            </h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">
              {isAIGenerating ? 'AI 正在執行連拍渲染中...' : `渲染完成，點擊下方選單可「單格微調重製」`}
            </p>
          </div>
          <div className="flex gap-3">
            {images.some(i => i.url) && (
              <Button variant="secondary" onClick={handleSelectAll} className="text-xs py-1.5 border-gray-700">
                {isAllSelected ? '取消全選' : '全部選取'}
              </Button>
            )}
            <Button onClick={onClose} variant="secondary" className="text-xs py-1.5">關閉彈窗</Button>
          </div>
        </div>

        {/* Grid Content */}
        <div className="flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8 custom-scrollbar bg-black/20">
          {images.map((img) => (
            <div key={img.index} className="flex flex-col gap-3 group">
              <div 
                className={`relative aspect-[3/4] rounded-xl overflow-hidden transition-all duration-500 border-2 shadow-2xl ${
                  img.selected 
                    ? 'border-[var(--color-gold)] scale-[0.99] ring-4 ring-[var(--color-gold)]/20' 
                    : 'border-gray-800 hover:border-gray-600'
                } ${!img.selected && img.url ? 'opacity-80 grayscale-[0.1]' : 'opacity-100 grayscale-0'}`}
              >
                {img.url ? (
                  <>
                    <img src={img.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    
                    {/* Hover Toolbar - Top Right (Checkbox) */}
                    <div className="absolute top-4 right-4 z-20 cursor-pointer" onClick={() => onToggleSelect(img.index)}>
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        img.selected ? 'bg-[var(--color-gold)] border-[var(--color-gold)]' : 'bg-black/40 border-white/40 hover:border-white'
                      }`}>
                        {img.selected && <span className="text-black font-black text-sm">✓</span>}
                      </div>
                    </div>

                    {/* Hover Toolbar - Bottom Right (Actions) */}
                    <div className="absolute bottom-4 right-4 flex gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <button onClick={() => onPreview(img.url)} className="p-2.5 rounded-full bg-[var(--color-bg-panel)] backdrop-blur-md border border-[var(--color-border)] text-[var(--color-text-main)] hover:bg-[var(--color-gold)] hover:text-black transition-all">
                        <ExpandIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => downloadImage(img.url, `Pavora_${img.index}.jpg`, 'CompositeCard')} className="p-2.5 rounded-full bg-[var(--color-bg-panel)] backdrop-blur-md border border-[var(--color-border)] text-[var(--color-text-main)] hover:bg-[var(--color-gold)] hover:text-black transition-all">
                        <DownloadIcon className="w-4 h-4" />
                      </button>
                    </div>

                    {/* SHOT ID Overlay */}
                    <div className="absolute top-4 left-4 pointer-events-none">
                       <span className="bg-[var(--color-bg-panel)] backdrop-blur-sm text-[var(--color-gold)] text-[9px] font-mono font-black px-2 py-1 rounded border border-[var(--color-border)] tracking-tighter">SHOT_0{img.index + 1}</span>
                    </div>

                    {/* Click-to-toggle selection layer */}
                    <div className="absolute inset-0 z-10 cursor-pointer" onClick={() => onToggleSelect(img.index)} />
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 animate-pulse text-gray-600">
                    <div className="w-10 h-10 border-2 border-gray-700 border-t-[var(--color-gold)] rounded-full animate-spin mb-4"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Pavora Core Generating</span>
                  </div>
                )}
              </div>

              {/* Local Control Bar - 局部微調控制列 */}
              <div className="flex flex-col gap-2 p-3 bg-[var(--color-bg-input)] rounded-lg border border-[var(--color-border)] group-hover:border-[var(--color-gold)]/30 transition-colors">
                <div className="grid grid-cols-2 gap-2">
                   <select 
                     value={burstPairs[img.index].pose} 
                     onChange={e => onUpdatePair(img.index, 'pose', e.target.value)}
                     className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[10px] text-[var(--color-text-main)] p-2 rounded-md outline-none focus:ring-1 focus:ring-[var(--color-gold)]"
                   >
                     <option value="">選擇新姿勢</option>
                     {Object.entries(filteredPoses).map(([cat, items]) => (
                       <optgroup key={cat} label={cat}>{(items as any[]).map(it => <option key={it.id} value={it.keyword}>{it.name}</option>)}</optgroup>
                     ))}
                   </select>
                   <select 
                     value={burstPairs[img.index].expression} 
                     onChange={e => onUpdatePair(img.index, 'expression', e.target.value)}
                     className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[10px] text-[var(--color-text-main)] p-2 rounded-md outline-none focus:ring-1 focus:ring-[var(--color-gold)]"
                   >
                     <option value="">選擇新表情</option>
                     {Object.entries(filteredExpressions).map(([cat, items]) => (
                       <optgroup key={cat} label={cat}>{(items as any[]).map(it => <option key={it.id} value={it.keyword}>{it.name}</option>)}</optgroup>
                     ))}
                   </select>
                </div>
                <button 
                  onClick={() => onRegenerateCell(img.index)}
                  disabled={img.status === 'loading'}
                  className="w-full btn-precision-fix bg-[var(--color-gold)]/10 text-[var(--color-gold)] text-[10px] font-bold py-2 rounded-md hover:bg-[var(--color-gold)] hover:text-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                  <ReplaceIcon className="w-3.5 h-3.5" />
                  {img.status === 'loading' ? '正在重製中...' : '重新生成此格'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-bg-surface)] flex justify-center items-center gap-6">
          <div className="text-sm text-gray-500 font-bold uppercase tracking-widest mr-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-gold)]"></span>
            已選取 <span className="text-[var(--color-gold)] text-lg">{selectedCount}</span> / 9 張影像
          </div>
          <Button 
            onClick={() => {
              const selected = images.filter(i => i.selected && i.url).map(i => i.url);
              onConfirm(selected);
            }} 
            disabled={selectedCount === 0}
            className="px-12 py-4 text-sm font-bold shadow-[0_10px_20px_rgba(212,175,55,0.2)]"
          >
            確認並匯入主素材庫 ({selectedCount})
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default BurstMatrixModal;
