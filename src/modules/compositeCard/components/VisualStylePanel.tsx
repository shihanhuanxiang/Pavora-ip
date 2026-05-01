
import React, { memo } from 'react';
import Card from '../../../shared/components/common/Card';
import Button from '../../../shared/components/common/Button';
import Select from '../../../shared/components/common/Select';
import ColorPicker from '../../../shared/components/common/ColorPicker';
import SparklesIcon from '../../../shared/assets/icons/SparklesIcon';

interface VisualStylePanelProps {
  templateId: string;
  onTemplateChange: (id: string) => void;
  schemeId: string;
  onSchemeChange: (id: string) => void;
  isCustomColor: boolean;
  setIsCustomColor: (v: boolean) => void;
  customColor: string;
  onCustomColorChange: (c: string) => void;
  fontId: string;
  onFontChange: (id: string) => void;
  showInfo: boolean;
  onShowInfoChange: (v: boolean) => void;
  onAISmartLayout: () => void;
  templates: any[];
  schemes: any[];
  fontPairs: any[];
  disabled: boolean;
  gutter: number;
  onGutterChange: (v: number) => void;
  margin: number;
  onMarginChange: (v: number) => void;
  logo: string | null;
  onLogoChange: (v: string | null) => void;
  qrCode: string | null;
  onQrCodeChange: (v: string | null) => void;
  typography: any;
  onTypographyChange: (v: any) => void;
}

const VisualStylePanel: React.FC<VisualStylePanelProps> = ({
  templateId, onTemplateChange, schemeId, onSchemeChange, isCustomColor, setIsCustomColor,
  customColor, onCustomColorChange, fontId, onFontChange, showInfo, onShowInfoChange,
  onAISmartLayout, templates, schemes, fontPairs, disabled,
  gutter, onGutterChange, margin, onMarginChange, logo, onLogoChange, qrCode, onQrCodeChange,
  typography, onTypographyChange
}) => {
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <Card className="border-t-2 border-blue-500/20">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-[var(--color-text-title)] uppercase tracking-wider">4. 版面與風格</h3>
        <Button onClick={onAISmartLayout} variant="secondary" disabled={disabled} className="text-[10px] py-1 px-2 border-blue-500/50 text-blue-300">
          <SparklesIcon className="w-3 h-3 mr-1" /> AI 佈局
        </Button>
      </div>
      <div className="space-y-4">
        <Select 
          label="合輯卡版型" 
          options={templates.map(t => ({value: t.id, label: t.name}))} 
          value={templateId} 
          onChange={e => onTemplateChange(e.target.value)} 
        />
        
        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-widest">配色與主題</label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {schemes.map(s => (
              <button 
                key={s.id} 
                onClick={() => { onSchemeChange(s.id); setIsCustomColor(false); }} 
                className={`p-2 rounded border-2 transition-all flex items-center gap-2 ${schemeId === s.id && !isCustomColor ? 'border-[var(--color-gold)] bg-[var(--color-bg-input)]' : 'border-[var(--color-border)] bg-[var(--color-bg-surface)]/50'}`}
              >
                <div className="w-3 h-3 rounded-full" style={{backgroundColor: s.bg}}></div>
                <span className="text-[10px] text-[var(--color-text-main)]">{s.name}</span>
              </button>
            ))}
            <button 
              onClick={() => setIsCustomColor(true)} 
              className={`p-2 rounded border-2 col-span-2 flex items-center gap-2 ${isCustomColor ? 'border-[var(--color-gold)] bg-[var(--color-bg-input)]' : 'border-[var(--color-border)] bg-[var(--color-bg-surface)]/50'}`}
            >
              <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-red-500 to-blue-500"></div>
              <span className="text-[10px] text-[var(--color-text-main)]">自訂底色</span>
            </button>
          </div>
          {isCustomColor && <div className="mt-2"><ColorPicker color={customColor} onChange={onCustomColorChange} /></div>}
        </div>

        <Select 
          label="字體美學" 
          options={fontPairs.map(f => ({value: f.id, label: f.name}))} 
          value={fontId} 
          onChange={e => onFontChange(e.target.value)} 
        />

        <div className="space-y-4 pt-4 border-t border-white/5">
          <h4 className="text-[10px] font-bold text-[var(--color-gold)] uppercase tracking-[0.2em]">進階排版控制</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-gray-500 mb-1 uppercase">網格間距 (Gutter)</label>
              <input type="range" min="0" max="40" value={gutter} onChange={e => onGutterChange(Number(e.target.value))} className="w-full accent-[var(--color-gold)]" />
              <div className="flex justify-between text-[9px] text-gray-600 mt-1"><span>0px</span><span>{gutter}px</span><span>40px</span></div>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-1 uppercase">頁邊距 (Margin)</label>
              <input type="range" min="0" max="60" value={margin} onChange={e => onMarginChange(Number(e.target.value))} className="w-full accent-[var(--color-gold)]" />
              <div className="flex justify-between text-[9px] text-gray-600 mt-1"><span>0px</span><span>{margin}px</span><span>60px</span></div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 mb-2 uppercase">品牌 Logo</label>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => logoInputRef.current?.click()}
                className="flex-grow py-2 px-3 bg-white/5 border border-dashed border-white/20 rounded-lg text-[10px] text-gray-400 hover:border-[var(--color-gold)] hover:text-white transition-all"
              >
                {logo ? '更換 Logo' : '上傳經紀公司 Logo'}
              </button>
              {logo && (
                <button onClick={() => onLogoChange(null)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
            <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={async (e) => {
              if (e.target.files?.[0]) {
                const reader = new FileReader();
                reader.onload = (ev) => onLogoChange(ev.target?.result as string);
                reader.readAsDataURL(e.target.files[0]);
              }
            }} />
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] text-gray-500 uppercase">字體細節</label>
            <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
              <span className="text-[10px] text-gray-400 uppercase">垂直排列姓名</span>
              <button 
                onClick={() => onTypographyChange({...typography, isVertical: !typography.isVertical})}
                className={`w-10 h-5 rounded-full transition-all relative ${typography.isVertical ? 'bg-[var(--color-gold)]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${typography.isVertical ? 'left-6' : 'left-1'}`}></div>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select 
                label="字距 (Spacing)" 
                options={[{value: '0', label: 'Normal'}, {value: '0.1em', label: 'Wide'}, {value: '0.2em', label: 'Extra Wide'}]} 
                value={typography.letterSpacing} 
                onChange={e => onTypographyChange({...typography, letterSpacing: e.target.value})} 
              />
              <Select 
                label="姓名大小" 
                options={[{value: '2xl', label: 'S'}, {value: '4xl', label: 'M'}, {value: '6xl', label: 'L'}, {value: '8xl', label: 'XL'}]} 
                value={typography.nameSize} 
                onChange={e => onTypographyChange({...typography, nameSize: e.target.value})} 
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 mb-2 uppercase">線上作品集 QR Code (URL)</label>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                placeholder="https://..." 
                value={qrCode || ''} 
                onChange={e => onQrCodeChange(e.target.value)}
                className="flex-grow bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white outline-none focus:border-[var(--color-gold)]"
              />
              {qrCode && (
                <button onClick={() => onQrCodeChange(null)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-2 border-t border-[var(--color-border)]">
          <input type="checkbox" id="showInfo" checked={showInfo} onChange={e => onShowInfoChange(e.target.checked)} className="h-4 w-4 rounded bg-[var(--color-bg-input)] border-[var(--color-border)]" />
          <label htmlFor="showInfo" className="text-xs text-gray-400">顯示模特兒數據區塊</label>
        </div>
      </div>
    </Card>
  );
};

export default memo(VisualStylePanel);
