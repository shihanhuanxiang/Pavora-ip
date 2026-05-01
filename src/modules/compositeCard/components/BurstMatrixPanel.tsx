
import React, { memo } from 'react';
import Card from '../../../shared/components/common/Card';
import Button from '../../../shared/components/common/Button';
import Select from '../../../shared/components/common/Select';
import View360Icon from '../../../shared/assets/icons/View360Icon';
import type { BurstPoseExpressionPair } from '../../../shared/types/types';

interface BurstMatrixPanelProps {
  burstGender: string;
  setBurstGender: (g: string) => void;
  burstPairs: BurstPoseExpressionPair[];
  onUpdatePair: (index: number, field: 'pose' | 'expression', value: string) => void;
  onRandomize: () => void;
  onGenerate: () => void;
  faceAnchor: any;
  onFaceAnchorClick: () => void;
  onRemoveFaceAnchor: () => void;
  burstQuality: string;
  setBurstQuality: (q: any) => void;
  filteredPoses: Record<string, any[]>;
  filteredExpressions: Record<string, any[]>;
  disabled: boolean;
  isProcessing: boolean;
  hasResults: boolean;
  onOpenResults: () => void;
  lightingPreset: string;
  onLightingChange: (v: string) => void;
  consistencyLock: boolean;
  onConsistencyChange: (v: boolean) => void;
}

const BurstMatrixPanel: React.FC<BurstMatrixPanelProps> = ({
  burstGender, setBurstGender, burstPairs, onUpdatePair, onRandomize, onGenerate,
  faceAnchor, onFaceAnchorClick, onRemoveFaceAnchor, burstQuality, setBurstQuality,
  filteredPoses, filteredExpressions, disabled, isProcessing, hasResults, onOpenResults,
  lightingPreset, onLightingChange, consistencyLock, onConsistencyChange
}) => {
  return (
    <Card className="border-t-2 border-[var(--color-gold)]/20 relative">
      {isProcessing && <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg cursor-not-allowed"></div>}
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-[var(--color-text-title)] uppercase tracking-wider">3. AI 連拍矩陣</h3>
        <div className="flex gap-2">
            {hasResults && (
                <button 
                    onClick={onOpenResults} 
                    className="p-1.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                    title="查看最近一次渲染結果"
                >
                    <View360Icon className="w-4 h-4" />
                </button>
            )}
            <Button onClick={onRandomize} variant="secondary" className="text-[10px] py-1" disabled={isProcessing}>智慧填入</Button>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-2 bg-black/20 rounded border border-gray-800">
          <div 
            className="w-12 h-12 bg-[var(--color-bg-input)] rounded overflow-hidden cursor-pointer border border-[var(--color-border)] flex items-center justify-center"
            onClick={!isProcessing ? onFaceAnchorClick : undefined}
          >
            {faceAnchor ? <img src={faceAnchor.url} className="w-full h-full object-cover" /> : <div className="text-[10px] text-gray-500 font-bold">+臉部</div>}
          </div>
          <div className="flex-grow">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">人物身份鎖定</p>
            {faceAnchor && <button onClick={onRemoveFaceAnchor} className="text-[10px] text-red-400 hover:underline" disabled={isProcessing}>移除</button>}
          </div>
        </div>

        <div className="flex gap-2">
          {['female', 'male', 'auto'].map(g => (
            <button 
              key={g} 
              onClick={() => setBurstGender(g)} 
              disabled={isProcessing}
              className={`flex-1 py-1.5 text-[10px] rounded border transition-all ${burstGender === g ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)] font-bold' : 'text-gray-500 border-gray-800'}`}
            >
              {g === 'female' ? '女性' : (g === 'male' ? '男性' : '自動')}
            </button>
          ))}
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">風格一致性鎖定</label>
            <button 
              onClick={() => onConsistencyChange(!consistencyLock)}
              className={`w-8 h-4 rounded-full transition-all relative ${consistencyLock ? 'bg-[var(--color-gold)]' : 'bg-white/10'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${consistencyLock ? 'left-4.5' : 'left-0.5'}`}></div>
            </button>
          </div>
          
          <Select 
            label="攝影棚燈位 (Lighting)" 
            options={[
              {value: 'cinematic', label: '電影質感 (Cinematic)'},
              {value: 'butterfly', label: '蝴蝶光 (Butterfly)'},
              {value: 'rim', label: '輪廓光 (Rim)'},
              {value: 'high-key', label: '高調光 (High-Key)'},
              {value: 'dramatic', label: '戲劇張力 (Dramatic)'}
            ]} 
            value={lightingPreset} 
            disabled={isProcessing}
            onChange={e => onLightingChange(e.target.value)} 
          />
        </div>

        <div className="max-h-60 overflow-y-auto pr-1 custom-scrollbar border-y border-gray-800 py-3 space-y-3">
          {burstPairs.map((p, i) => (
            <div key={i} className="bg-black/20 p-2 rounded-lg border border-gray-800">
              <p className="text-[9px] font-mono text-[var(--color-gold)] mb-1 opacity-70">SHOT_0{i+1}</p>
              <div className="grid grid-cols-2 gap-2">
                <select 
                  value={p.pose} 
                  disabled={isProcessing}
                  onChange={e => onUpdatePair(i, 'pose', e.target.value)}
                  className="bg-[var(--color-bg-input)] border-none text-[10px] text-[var(--color-text-main)] p-1 rounded outline-none focus:ring-1 focus:ring-[var(--color-gold)]"
                >
                  <option value="">選擇姿勢</option>
                  {/* Fix: Explicitly cast items to any[] to fix unknown property map error */}
                  {Object.entries(filteredPoses).map(([cat, items]) => (
                    <optgroup key={cat} label={cat}>{(items as any[]).map(it => <option key={it.id} value={it.keyword}>{it.name}</option>)}</optgroup>
                  ))}
                </select>
                <select 
                  value={p.expression} 
                  disabled={isProcessing}
                  onChange={e => onUpdatePair(i, 'expression', e.target.value)}
                  className="bg-[var(--color-bg-input)] border-none text-[10px] text-[var(--color-text-main)] p-1 rounded outline-none focus:ring-1 focus:ring-[var(--color-gold)]"
                >
                  <option value="">選擇表情</option>
                  {/* Fix: Explicitly cast items to any[] to fix unknown property map error */}
                  {Object.entries(filteredExpressions).map(([cat, items]) => (
                    <optgroup key={cat} label={cat}>{(items as any[]).map(it => <option key={it.id} value={it.keyword}>{it.name}</option>)}</optgroup>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        <Select 
          label="渲染品質" 
          options={[{value: 'standard', label: '標準 (Flash)'}, {value: 'high', label: '高品質 (Pro)'}]} 
          value={burstQuality} 
          disabled={isProcessing}
          onChange={e => setBurstQuality(e.target.value)} 
        />
        <Button onClick={onGenerate} disabled={disabled || isProcessing} className="w-full font-bold">
          {isProcessing ? '渲染發送中...' : '啟動連拍渲染'}
        </Button>
      </div>
    </Card>
  );
};

export default memo(BurstMatrixPanel);
