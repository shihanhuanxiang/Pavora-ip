import React, { useState } from 'react';
import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
import DirectorMode from '../directorMode/DirectorMode';
import CinematicAnalyzer from '../cinematic/CinematicAnalyzer';

import DirectorModeIcon from '../../shared/assets/icons/DirectorModeIcon';
import CinematicIcon from '../../shared/assets/icons/CinematicIcon';
import SparklesIcon from '../../shared/assets/icons/SparklesIcon';

interface MotionHubProps {
  onGoHome: () => void;
}

type MotionView = 'HUB' | 'DIRECTOR' | 'ANALYZER';

const MotionHub: React.FC<MotionHubProps> = ({ onGoHome }) => {
  const [view, setView] = useState<MotionView>('HUB');
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>(undefined);

  const handleGoBackToHub = () => {
    setView('HUB');
    setInitialPrompt(undefined);
  };

  if (view === 'DIRECTOR') {
    return <DirectorMode onGoHome={handleGoBackToHub} initialPrompt={initialPrompt} />;
  }

  if (view === 'ANALYZER') {
    return (
      <CinematicAnalyzer 
        onGoHome={handleGoBackToHub} 
        onSendToDirector={(prompt) => {
          setInitialPrompt(prompt);
          setView('DIRECTOR');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-deep)] text-[var(--color-text-main)] pb-20 animate-fade-in">
      {/* Header */}
      <div className="sticky top-[80px] z-30 glass-panel border-x-0 border-t-0 px-6 py-4 mb-12">
        <div className="max-w-[110rem] mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <h2 className="text-2xl font-display font-bold uppercase tracking-[0.3em] text-[var(--color-text-main)]">動態影視中心</h2>
            <span className="text-[9px] uppercase tracking-[0.5em] text-[var(--color-gold)] font-light">Motion & Cinematic Hub</span>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={onGoHome} variant="secondary" className="text-[10px] font-bold tracking-widest">返回首頁</Button>
          </div>
        </div>
      </div>

      <main className="max-w-[90rem] mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 tracking-tighter">讓品牌故事<span className="text-gold-gradient">動起來</span></h1>
            <p className="text-[var(--color-text-dim)] max-w-2xl mx-auto text-lg leading-relaxed">
                從靜態影像到動態敘事。整合 AI 影片生成與影視逆向工程，為您的品牌打造專屬的 Reels、TikTok 與高品質宣傳短片。
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
            {/* Director Mode Card */}
            <button 
                onClick={() => setView('DIRECTOR')}
                className="group relative text-left"
            >
                <Card className="h-full p-10 border-2 border-transparent group-hover:border-[var(--color-gold)]/50 transition-all duration-500 bg-[var(--color-bg-surface)]/40 overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-[var(--color-gold)]/5 rounded-full blur-3xl group-hover:bg-[var(--color-gold)]/10 transition-all" />
                    
                    <div className="w-16 h-16 rounded-2xl bg-[var(--color-gold)]/10 flex items-center justify-center text-[var(--color-gold)] mb-8 group-hover:scale-110 transition-transform duration-500">
                        <DirectorModeIcon className="w-8 h-8" />
                    </div>
                    
                    <h3 className="text-3xl font-bold mb-4 tracking-tight">導演模式 (Director Mode)</h3>
                    <p className="text-[var(--color-text-dim)] mb-8 leading-relaxed">
                        基於單圖或多圖參考，自動生成具備專業運鏡、燈光與動作的短影片。支援分鏡腳本規劃與 AI 劇本創作。
                    </p>
                    
                    <div className="flex items-center text-[var(--color-gold)] font-bold text-sm tracking-widest uppercase">
                        進入拍攝現場 <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                    </div>
                </Card>
            </button>

            {/* Cinematic Analyzer Card */}
            <button 
                onClick={() => setView('ANALYZER')}
                className="group relative text-left"
            >
                <Card className="h-full p-10 border-2 border-transparent group-hover:border-[var(--color-gold)]/50 transition-all duration-500 bg-[var(--color-bg-surface)]/40 overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all" />
                    
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-8 group-hover:scale-110 transition-transform duration-500">
                        <CinematicIcon className="w-8 h-8" />
                    </div>
                    
                    <h3 className="text-3xl font-bold mb-4 tracking-tight">影視逆向工程 (Cinematic Analyzer)</h3>
                    <p className="text-[var(--color-text-dim)] mb-8 leading-relaxed">
                        上傳參考影片或劇照，AI 將自動分析攝影參數、佈光邏輯與鏡頭語言，並產出可供復刻的提示詞與腳本。
                    </p>
                    
                    <div className="flex items-center text-blue-400 font-bold text-sm tracking-widest uppercase">
                        啟動視覺拆解 <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                    </div>
                </Card>
            </button>
        </div>

        {/* Future Roadmap Placeholder */}
        <div className="mt-20 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-surface)]/40 rounded-full border border-[var(--color-border)] text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-dim)] mb-6">
                <SparklesIcon className="w-3 h-3 text-[var(--color-gold)]" /> Next Phase: Reels Automation
            </div>
            <p className="text-xs text-[var(--color-text-dim)] italic">
                "我們正在研發一鍵產出 Reels/TikTok 產品細節特寫的功能，敬請期待。"
            </p>
        </div>
      </main>
    </div>
  );
};

export default MotionHub;
