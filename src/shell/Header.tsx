
import React, { useState, useEffect, useMemo } from 'react';
import SkullIcon from '../shared/assets/icons/SkullIcon';
import BellIcon from '../shared/assets/icons/BellIcon';
import ActivityLog from '../shared/components/notification/ActivityLog';
import AsyncImage from '../shared/components/common/AsyncImage';
import ModelLoungeModal from '../shared/components/common/ModelLoungeModal';
import { useNotification } from '../shared/context/NotificationContext';
import { useModelStore } from '../shared/stores/useModelStore';
import { NAV_GROUPS, entriesByGroup, navName } from './navRegistry';

interface HeaderProps {
  onTitleClick: () => void;
  onNavigate: (destination: string) => void;
  imagenUsage: number;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ onTitleClick, onNavigate, imagenUsage, isDarkMode, onToggleTheme }) => {
  const cloudSyncStatus = useModelStore((state) => state.cloudSyncStatus);
  const lastSyncError = useModelStore((state) => state.lastSyncError);
  // 常駐 IP 選擇器（2026-08-02，企劃案 B-1b）。
  // 改版前「現在在操作哪個 IP」沒有任何常駐入口：setActiveModel 全 repo 只有首頁旅程卡 2 個呼叫點，
  // 連模特兒休息室都不會寫入。現在 Header 成為全站唯一、隨時可切的入口。
  const models = useModelStore((state) => state.models);
  const activeModelId = useModelStore((state) => state.activeModelId);
  const setActiveModel = useModelStore((state) => state.setActiveModel);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const [isIpSwitcherOpen, setIpSwitcherOpen] = useState(false);
  const { notifications, tasks } = useNotification();

  const activeModel = useMemo(
    () => models.find(model => model.id === activeModelId) || null,
    [models, activeModelId]
  );

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

  // 選單直接由 navRegistry 產生，不再手寫一份名稱。
  // 改版前這裡的名稱與首頁兩處各寫各的，同一個 lounge 有三個中文名。
  const menuCategories = useMemo(
    () =>
      NAV_GROUPS.map(group => ({
        title: group.title,
        items: entriesByGroup(group.key),
      })).filter(category => category.items.length > 0),
    []
  );

  const handleNavigate = (id: string) => {
    onNavigate(id);
    setIsMenuOpen(false);
  };

  const handlePickModel = (id: string) => {
    setActiveModel(id);
    setIpSwitcherOpen(false);
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
                  <SkullIcon className="w-5 h-5 transition-colors duration-700 ease-out text-[var(--color-text-dim)] group-hover:text-[var(--color-gold)]" />
                  <h1 className="text-lg lg:text-2xl font-display font-bold uppercase tracking-[0.25em] text-[var(--color-text-main)] group-hover:text-[var(--color-gold)] transition-colors duration-700">
                    Pavora
                  </h1>
                </div>
              </div>

              {/* 常駐 IP 選擇器：取代改版前的「商業／IP 創作模式」切換。
                  真正的全域狀態是「現在在操作哪個 IP」，不是「我是哪種人」。 */}
              {models.length > 0 ? (
                <button
                  onClick={() => setIpSwitcherOpen(true)}
                  className="hidden lg:flex items-center gap-2.5 bg-[var(--color-bg-deep)]/60 rounded-full border border-[var(--color-border)] pl-1 pr-4 py-1 backdrop-blur-md shadow-2xl hover:border-[var(--color-gold)]/50 transition-colors group/ip"
                  title="切換目前操作的 IP"
                >
                  <span className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-[var(--color-bg-input)]">
                    {activeModel ? (
                      <AsyncImage
                        src={activeModel.imageUrl}
                        alt={activeModel.name}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : null}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-dim)] group-hover/ip:text-[var(--color-gold)] transition-colors max-w-[140px] truncate">
                    {activeModel ? activeModel.name : '尚未選擇 IP'}
                  </span>
                  <span className="text-[var(--color-text-dim)] text-[9px]">▾</span>
                </button>
              ) : (
                <button
                  onClick={() => handleNavigate('model_setup')}
                  className="hidden lg:flex items-center gap-2 bg-[var(--color-bg-deep)]/60 rounded-full border border-[var(--color-border)] px-4 py-1.5 backdrop-blur-md shadow-2xl hover:border-[var(--color-gold)]/50 transition-colors group/ip"
                  title="還沒有 IP，先建立一個"
                >
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-dim)] group-hover/ip:text-[var(--color-gold)] transition-colors">
                    ＋ 建立第一個 IP
                  </span>
                </button>
              )}
          </div>
          
          {/* Right: Nav & Usage */}
          <div className="w-1/4 flex justify-end items-center gap-6">
              <div className="flex flex-col items-end gap-1">
                   <div className="hidden md:flex items-center gap-8">
                      {/* 名稱一律取自 navRegistry，避免與首頁／漢堡選單各叫各的 */}
                      <button onClick={() => handleNavigate('fitting_room')} className="text-[10px] font-bold text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] transition-colors uppercase tracking-[0.15em] relative group font-sans">
                          {navName('fitting_room')}
                          <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[var(--color-gold)] transition-all duration-500 group-hover:w-full"></span>
                      </button>
                      <button onClick={() => handleNavigate('portfolio')} className="text-[10px] font-bold text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] transition-colors uppercase tracking-[0.15em] relative group font-sans">
                          {navName('portfolio')}
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

              {/* Cloud Sync Status Badge：degraded 才醒目，其他狀態不干擾視覺 */}
              {cloudSyncStatus === 'degraded' && (
                <div
                  className="flex items-center gap-1.5 group cursor-default"
                  title={lastSyncError ? `雲端同步異常：${lastSyncError}` : '雲端同步異常'}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400/60 animate-ping"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400"></span>
                  </span>
                  <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-[0.15em] text-amber-400/90">
                    雲端同步異常
                  </span>
                </div>
              )}

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

      {/* 常駐 IP 選擇器的彈窗。選了就寫入 activeModelId（全站唯一的「目前 IP」）。 */}
      <ModelLoungeModal
        isOpen={isIpSwitcherOpen}
        onClose={() => setIpSwitcherOpen(false)}
        onSelect={model => handlePickModel(model.id)}
      />

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
                                            {item.name}
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
