
import React, { useState, useEffect } from 'react';
import SkullIcon from '../shared/assets/icons/SkullIcon';
import BellIcon from '../shared/assets/icons/BellIcon';
import ActivityLog from '../shared/components/notification/ActivityLog';
import { useNotification } from '../shared/context/NotificationContext';
import { useAppStore } from '../shared/stores/useAppStore';

interface HeaderProps {
  onTitleClick: () => void;
  onNavigate: (destination: string) => void;
  imagenUsage: number;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ onTitleClick, onNavigate, imagenUsage, isDarkMode, onToggleTheme }) => {
  const { projectMode, setProjectMode } = useAppStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const { notifications, tasks } = useNotification();

  const activeCount = notifications.length + tasks.filter(t => t.status === 'processing').length;

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMenuOpen]);

  const menuCategories = [
    {
      title: "品牌與行銷",
      items: [
        { label: "品牌識別中心", id: "brand_identity_hub", desc: "品牌視覺靈魂、核心美學與模特兒合輯卡管理" },
        { label: "行銷工廠", id: "marketing_factory", desc: "全平台行銷策略、素材生產與 AI 影像總監" },
        { label: "動態中心", id: "motion_hub", desc: "賦予靜態影像電影級的流動生命" },
      ]
    },
    {
      title: "核心流程",
      items: [
        { label: "模特兒生成", id: "model_setup", desc: "打造獨一無二的品牌專屬代言人" },
        { label: "虛擬試衣間", id: "fitting_room", desc: "零成本實現高品質服裝穿搭效果" },
        { label: "場景轉移", id: "scene", desc: "將主體瞬間置於全球奢華場景中" },
      ]
    },
    {
      title: "專業工具",
      items: [
        { label: "廣告視覺生成", id: "luxury_visual", desc: "創作頂級時尚雜誌等級的視覺大片" },
        { label: "電商全鏈路", id: "e_gen", desc: "自動化生成電商詳情頁與主圖矩陣" },
        { label: "導演模式", id: "director_mode", desc: "將創意腳本轉化為分鏡與動態預覽" },
        { label: "視覺錨點", id: "style_anchor", desc: "精準鎖定並遷移特定的視覺風格" },
        { label: "影像解構", id: "deconstruction", desc: "深度解析影像構成並提取核心元素" },
      ]
    },
    {
      title: "創意實驗與資產",
      items: [
        { label: "服裝設計", id: "apparel", desc: "探索前衛剪裁與材質的無限可能" },
        { label: "妝髮沙龍", id: "salon", desc: "精準控制模特兒的妝容與髮型細節" },
        { label: "角色矩陣", id: "character_lab", desc: "生成多樣化的角色原型與視覺一致性" },
        { label: "作品集錦", id: "portfolio", desc: "管理與展示您的所有 AI 創作資產" },
        { label: "模特兒休息室", id: "lounge", desc: "管理您的專屬模特兒矩陣與代言人" },
      ]
    }
  ];

  const handleNavigate = (id: string) => {
    onNavigate(id);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 py-3 px-6 lg:px-12 border-b border-[var(--color-border)] bg-[var(--color-bg-deep)]/80 backdrop-blur-md transition-all duration-500">
        <div className="container mx-auto flex items-center justify-between">
          {/* Left: Branding spacer */}
          <div className="w-1/4 flex items-center gap-4">
              <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 group"
              >
                  <div className="relative w-6 h-5 flex flex-col justify-between">
                      <span className={`h-[1px] bg-[var(--color-text-main)] transition-all duration-500 ${isMenuOpen ? 'rotate-45 translate-y-2 w-6' : 'w-6'}`}></span>
                      <span className={`h-[1px] bg-[var(--color-text-main)] transition-all duration-500 ${isMenuOpen ? 'opacity-0' : 'w-4'}`}></span>
                      <span className={`h-[1px] bg-[var(--color-text-main)] transition-all duration-500 ${isMenuOpen ? '-rotate-45 -translate-y-2 w-6' : 'w-6'}`}></span>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--color-text-dim)] group-hover:text-[var(--color-gold)] transition-colors hidden sm:block">Explore</span>
              </button>
              
              <button 
                  onClick={onToggleTheme}
                  className="p-2 rounded-full hover:bg-[var(--color-gold)]/10 transition-all duration-300 group ml-2"
                  title={isDarkMode ? "切換至白天模式" : "切換至夜晚模式"}
              >
                  {isDarkMode ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M3 12h2.25m.386-6.364 1.591-1.591M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                      </svg>
                  ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-600 group-hover:scale-110 transition-transform">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                      </svg>
                  )}
              </button>
          </div>
          
          {/* Center: Logo & Switcher */}
          <div className="flex flex-col items-center gap-3">
              <div
                className="flex flex-col items-center cursor-pointer group"
                onClick={() => { onTitleClick(); setIsMenuOpen(false); }}
                aria-label="Back to Homepage"
                role="button"
              >
                <div className="flex items-center justify-center gap-3">
                  <SkullIcon className={`w-5 h-5 transition-colors duration-700 ease-out ${projectMode === 'commerce' ? 'text-blue-400' : 'text-[var(--color-text-dim)] group-hover:text-[var(--color-gold)]'}`} />
                  <h1 className="text-lg lg:text-2xl font-display font-bold uppercase tracking-[0.25em] text-[var(--color-text-main)] group-hover:text-[var(--color-gold)] transition-colors duration-700">
                    Pavora
                  </h1>
                </div>
              </div>

              {/* Workflow Switcher */}
              <div className="hidden lg:flex items-center bg-[var(--color-bg-deep)]/60 rounded-full border border-[var(--color-border)] p-1 backdrop-blur-md shadow-2xl">
                  <button 
                    onClick={() => setProjectMode('commerce')}
                    className={`px-4 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest transition-all ${projectMode === 'commerce' ? 'bg-[var(--color-gold)] text-black shadow-lg shadow-[var(--color-gold)]/20' : 'text-[var(--color-text-dim)] hover:text-white'}`}
                  >
                    Commerce
                  </button>
                  <button 
                    onClick={() => setProjectMode('ip_creator')}
                    className={`px-4 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest transition-all ${projectMode === 'ip_creator' ? 'bg-[var(--color-gold)] text-black shadow-lg shadow-[var(--color-gold)]/20' : 'text-[var(--color-text-dim)] hover:text-white'}`}
                  >
                    IP 創作模式
                  </button>
              </div>
          </div>
          
          {/* Right: Nav & Usage */}
          <div className="w-1/4 flex justify-end items-center gap-6">
              <div className="flex flex-col items-end gap-1">
                   <div className="hidden md:flex items-center gap-8">
                      <button onClick={() => handleNavigate('fitting_room')} className="text-[10px] font-bold text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] transition-colors uppercase tracking-[0.15em] relative group font-sans">
                          虛擬試衣
                          <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[var(--color-gold)] transition-all duration-500 group-hover:w-full"></span>
                      </button>
                      <button onClick={() => handleNavigate('portfolio')} className="text-[10px] font-bold text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] transition-colors uppercase tracking-[0.15em] relative group font-sans">
                          作品集
                          <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[var(--color-gold)] transition-all duration-500 group-hover:w-full"></span>
                      </button>
                  </div>
                  {imagenUsage > 0 && (
                      <div 
                          className="text-[9px] text-[var(--color-gold)] font-mono tracking-widest mt-1" 
                      >
                          {imagenUsage} 次操作
                      </div>
                  )}
              </div>

              {/* Notification Bell */}
              <button 
                onClick={() => setIsActivityLogOpen(true)}
                className="relative p-2 rounded-full hover:bg-[var(--color-gold)]/10 transition-all duration-300 group"
              >
                <BellIcon className={`w-5 h-5 text-[var(--color-text-dim)] group-hover:text-[var(--color-gold)] transition-colors ${activeCount > 0 ? 'animate-bounce' : ''}`} />
                {activeCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-[var(--color-bg-deep)]" />
                )}
              </button>
          </div>
        </div>
      </header>

      <ActivityLog isOpen={isActivityLogOpen} onClose={() => setIsActivityLogOpen(false)} />

      {/* Full Screen Mega Menu */}
      <div 
        className={`fixed inset-0 z-[40] bg-[var(--color-bg-deep)]/95 backdrop-blur-3xl transition-all duration-700 ease-out ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        {/* 增加 pt-32 (約 128px) 確保避開 Header */}
        <div className="container mx-auto h-full flex flex-col justify-start pt-32 lg:pt-40 px-12 lg:px-24 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-20 pb-20">
                {menuCategories.map((category, idx) => (
                    <div 
                        key={category.title} 
                        className={`space-y-8 transition-all duration-700 delay-[${idx * 100}ms] ${isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-[var(--color-gold)] font-mono text-[10px] tracking-tighter">0{idx + 1}</span>
                            <h3 className="text-sm font-display font-bold uppercase tracking-[0.3em] text-[var(--color-text-dim)] border-b border-[var(--color-border)] pb-2 w-full">
                                {category.title}
                            </h3>
                        </div>
                        <ul className="space-y-6">
                            {category.items.map((item) => (
                                <li key={item.id}>
                                    <button 
                                        onClick={() => handleNavigate(item.id)}
                                        className="group/item text-left flex flex-col transition-all duration-300 hover:translate-x-2"
                                    >
                                        <span className="text-xl lg:text-2xl font-display font-light text-[var(--color-text-main)] group-hover/item:text-[var(--color-gold)] uppercase tracking-wider transition-colors">
                                            {item.label}
                                        </span>
                                        {item.desc && (
                                            <span className="text-[10px] text-[var(--color-text-dim)] group-hover/item:text-[var(--color-text-main)] opacity-60 mt-1 transition-colors max-w-[240px] leading-relaxed">
                                                {item.desc}
                                            </span>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Bottom Branding */}
            <div className={`mt-32 border-t border-[var(--color-border)] pt-8 flex justify-between items-center transition-all duration-1000 delay-500 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}>
                <span className="text-[10px] font-mono tracking-[0.5em] text-[var(--color-text-dim)] uppercase">Pavora AI 時尚工作室 2026</span>
                <div className="flex gap-6">
                    <span className="w-1 h-1 rounded-full bg-[var(--color-gold)]"></span>
                    <span className="w-1 h-1 rounded-full bg-[var(--color-gold)] opacity-50"></span>
                    <span className="w-1 h-1 rounded-full bg-[var(--color-gold)] opacity-20"></span>
                </div>
            </div>
        </div>
      </div>
    </>
  );
};

export default Header;
