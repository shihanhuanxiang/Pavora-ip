
import React, { useState, useMemo } from 'react';
import ModelIcon from '../shared/assets/icons/ModelIcon';
import FittingRoomIcon from '../shared/assets/icons/FittingRoomIcon';
import SceneTransferIcon from '../shared/assets/icons/SceneTransferIcon';
import CompositeCardIcon from '../shared/assets/icons/CompositeCardIcon';
import ApparelDesignIcon from '../shared/assets/icons/ApparelDesignIcon';
import HairSalonIcon from '../shared/assets/icons/HairSalonIcon';
import FantasySeriesIcon from '../shared/assets/icons/FantasySeriesIcon';
import ModelLoungeIcon from '../shared/assets/icons/ModelLoungeIcon';
import PersonalWardrobeIcon from '../shared/assets/icons/PersonalWardrobeIcon';
import PortfolioGalleryIcon from '../shared/assets/icons/PortfolioGalleryIcon';
import DirectorModeIcon from '../shared/assets/icons/DirectorModeIcon';
import OptimizeIcon from '../shared/assets/icons/OptimizeIcon';
import DeconstructIcon from '../shared/assets/icons/DeconstructIcon';
import PosterEngineIcon from '../shared/assets/icons/PosterEngineIcon';
import Face3DIcon from '../shared/assets/icons/Face3DIcon';
import ArchitectIcon from '../shared/assets/icons/ArchitectIcon';
import LuxuryVisualIcon from '../shared/assets/icons/LuxuryVisualIcon';
import MacroCraftIcon from '../shared/assets/icons/MacroCraftIcon';
import StyleAnchorIcon from '../shared/assets/icons/StyleAnchorIcon';
import EGenIcon from '../shared/assets/icons/EGenIcon';
import { useAppStore } from '../shared/stores/useAppStore';
import { useModelStore } from '../shared/stores/useModelStore';

interface HomePageProps {
  onNavigate: (destination: string) => void;
}

type Category = 'all' | 'core' | 'assets' | 'creative' | 'professional';

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { projectMode, setProjectMode } = useAppStore();
  const { models, activeModelId, setActiveModel } = useModelStore();

  const [commerceGuideVisible, setCommerceGuideVisible] = useState<boolean>(
    () => !localStorage.getItem('PAVORA_COMMERCE_STARTED')
  );

  const activeModel = useMemo(
    () => models.find(model => model.id === activeModelId) || null,
    [models, activeModelId]
  );

  const hubs = useMemo(() => {
    if (projectMode === 'ip_creator') {
      return [
        { 
          id: 'lounge', 
          zh: 'IP 休息室', 
          en: '身份與作品管理', 
          desc: '管理目前 IP 的身份鎖定、基準圖、作品集與靈魂敘事入口',
          icon: <ModelLoungeIcon />, 
          color: 'from-amber-500/20 to-transparent',
          size: 'large' 
        },
        { 
          id: 'model_setup', 
          zh: '建立或更新 IP', 
          en: '建立與優化角色', 
          desc: '建立新角色，或延伸既有 IP 的臉部方向、妝髮與視覺身份',
          icon: <ModelIcon />, 
          color: 'from-rose-500/20 to-transparent',
          size: 'large' 
        },
        { 
          id: 'narrative', 
          zh: '靈魂敘事', 
          en: '日常內容流程', 
          desc: '為目前 IP 生成日常事件、場景、服裝與社群內容，延續長期記憶',
          icon: <DirectorModeIcon />, 
          color: 'from-violet-500/20 to-transparent',
          size: 'large' 
        },
        { 
          id: 'portfolio', 
          zh: '作品與內容庫', 
          en: '作品素材整理', 
          desc: '整理 IP 已產出的日常、曲線與戲劇張力內容素材',
          icon: <PortfolioGalleryIcon />, 
          color: 'from-purple-500/20 to-transparent',
          size: 'large' 
        },
      ];
    }

    return [
      { 
        id: 'brand_identity_hub', 
        zh: '品牌形象中心', 
        en: '品牌身份管理', 
        desc: '管理品牌專屬模特兒、妝造與身份鎖定',
        icon: <ModelIcon />, 
        color: 'from-amber-500/20 to-transparent',
        size: 'large' 
      },
      { 
        id: 'marketing_factory', 
        zh: '行銷素材工廠', 
        en: '行銷素材產線', 
        desc: '批次產出電商海報、精品廣告與社群素材',
        icon: <PosterEngineIcon />, 
        color: 'from-blue-500/20 to-transparent',
        size: 'large' 
      },
      { 
        id: 'motion_hub', 
        zh: '動態視覺中心', 
        en: '動態與電影感視覺', 
        desc: '產出 Reels/TikTok 適用之產品動態特寫',
        icon: <DirectorModeIcon />, 
        color: 'from-purple-500/20 to-transparent',
        size: 'large' 
      },
    ];
  }, [projectMode]);

  const advancedTools = useMemo(() => {
    const allTools = [
      { id: 'fitting_room', zh: '虛擬試衣', en: '商品穿搭合成', icon: <FittingRoomIcon />, modes: ['commerce'] },
      { id: 'apparel', zh: '服裝設計', en: '服裝款式生成', icon: <ApparelDesignIcon />, modes: ['all'] },
      { id: 'scene', zh: '場景轉移', en: '背景與情境重建', icon: <SceneTransferIcon />, modes: ['all'] },
      { id: 'deconstruction', zh: '影像解構', en: '視覺元素拆解', icon: <DeconstructIcon />, modes: ['all'] },
      { id: 'macro_craft', zh: '微觀工藝', en: '細節與材質強化', icon: <MacroCraftIcon />, modes: ['all'] },
      { id: 'fantasy', zh: '幻想系列', en: '奇幻造型轉換', icon: <FantasySeriesIcon />, modes: ['all'] },
      { id: 'wardrobe', zh: '智慧衣櫥', en: '商品衣櫥管理', icon: <PersonalWardrobeIcon />, modes: ['commerce'] },
      { id: 'lounge', zh: '資產保險庫', en: 'IP 資產管理', icon: <ModelLoungeIcon />, modes: ['ip_creator'] },
      { id: 'portfolio', zh: '作品集錦', en: '創作成果瀏覽', icon: <PortfolioGalleryIcon />, modes: ['all'] },
    ];

    return allTools.filter(t => t.modes.includes('all') || t.modes.includes(projectMode));
  }, [projectMode]);

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center p-4 lg:p-12 animate-fade-in pb-32">
      
      {/* Hero Section */}
      <div className="text-center mt-8 mb-16 space-y-4 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,var(--color-gold),transparent_70%)] blur-3xl -z-10 pointer-events-none opacity-5"></div>
        <h1 className="text-5xl md:text-7xl font-display font-bold text-[var(--color-text-main)] tracking-[0.15em] uppercase">
          Pavora
        </h1>
        <p className="text-[var(--color-text-dim)] text-xs tracking-[0.4em] font-light uppercase">
          {projectMode === 'commerce' ? '企業級 AI 時尚影像引擎' : '虛擬 IP 經營工作室'}
        </p>

        {/* Project Mode Toggle */}
        <div className="mt-8 flex flex-col items-center gap-6">
            <div className="bg-[var(--color-bg-surface)] p-1 rounded-2xl border border-[var(--color-border)] flex items-center shadow-inner overflow-hidden">
                <button 
                  onClick={() => setProjectMode('commerce')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${projectMode === 'commerce' ? 'bg-[var(--color-gold)] text-black shadow-lg shadow-[var(--color-gold)]/20' : 'text-[var(--color-text-dim)] hover:text-[var(--color-text-main)]'}`}
                >
                  商業模式
                </button>
                <div className="w-px h-4 bg-white/10 mx-1"></div>
                <button 
                  onClick={() => setProjectMode('ip_creator')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${projectMode === 'ip_creator' ? 'bg-[var(--color-gold)] text-black shadow-lg shadow-[var(--color-gold)]/20' : 'text-[var(--color-text-dim)] hover:text-[var(--color-text-main)]'}`}
                >
                  IP 創作模式
                </button>
            </div>

        </div>
      </div>

      {/* Mode Description Tip */}
      <div className="mb-12 text-center animate-fade-in">
          <p className="text-[10px] font-bold text-[var(--color-gold)] uppercase tracking-[0.2em] mb-1">
              {projectMode === 'commerce' ? '專注於快速產出、試衣與大規模自動化行銷' : '從身份、作品集到日常內容，接續經營同一個虛擬 IP'}
          </p>
          <div className="w-12 h-0.5 bg-[var(--color-gold)]/30 mx-auto"></div>
      </div>

      {/* First Step Guide */}
      {projectMode === 'commerce' && commerceGuideVisible && (
        <div className="w-full max-w-7xl mb-10 animate-fade-in">
          <div className="glass-panel rounded-2xl p-5 md:p-6 border border-[var(--color-gold)]/20 bg-[var(--color-gold)]/3 relative">
            <button
              onClick={() => {
                localStorage.setItem('PAVORA_COMMERCE_STARTED', '1');
                setCommerceGuideVisible(false);
              }}
              className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] transition-colors text-lg leading-none"
              aria-label="關閉引導"
            >
              ✕
            </button>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--color-gold)] mb-3">✦ 建議起點</p>
            <p className="text-sm text-[var(--color-text-main)] font-medium mb-4">
              第一次使用？先上傳商品圖，用 AI 快速生成電商圖或試衣效果。
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate('fitting_room')}
                className="px-4 py-2 rounded-xl bg-[var(--color-gold)] text-black text-[10px] font-bold uppercase tracking-widest transition-all hover:opacity-90"
              >
                虛擬試衣 →
              </button>
              <button
                onClick={() => onNavigate('marketing_factory')}
                className="px-4 py-2 rounded-xl border border-[var(--color-gold)]/40 text-[var(--color-gold)] text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-[var(--color-gold)]/10"
              >
                行銷素材工廠 →
              </button>
            </div>
          </div>
        </div>
      )}

      {projectMode === 'ip_creator' && models.length > 0 && !activeModel && (
        <div className="w-full max-w-7xl mb-10 animate-fade-in">
          <div className="glass-panel rounded-2xl p-5 md:p-6 border border-[var(--color-gold)]/20 bg-[var(--color-gold)]/3">
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--color-gold)] mb-3">✦ 選擇你的 IP</p>
            <p className="text-sm text-[var(--color-text-main)] font-medium mb-4">
              你已建立 {models.length} 個虛擬 IP。前往 IP 休息室選擇一個開始工作。
            </p>
            <button
              onClick={() => onNavigate('lounge')}
              className="px-4 py-2 rounded-xl bg-[var(--color-gold)] text-black text-[10px] font-bold uppercase tracking-widest transition-all hover:opacity-90"
            >
              前往 IP 休息室 →
            </button>
          </div>
        </div>
      )}

      {projectMode === 'ip_creator' && models.length === 0 && (
        <div className="w-full max-w-7xl mb-10 animate-fade-in">
          <div className="glass-panel rounded-2xl p-5 md:p-6 border border-[var(--color-gold)]/20 bg-[var(--color-gold)]/3">
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--color-gold)] mb-3">✦ 建議起點</p>
            <p className="text-sm text-[var(--color-text-main)] font-medium mb-4">
              還沒有虛擬 IP？從建立第一個角色開始——設定外貌、身份鎖定，再用靈魂敘事產出內容。
            </p>
            <button
              onClick={() => onNavigate('model_setup')}
              className="px-4 py-2 rounded-xl bg-[var(--color-gold)] text-black text-[10px] font-bold uppercase tracking-widest transition-all hover:opacity-90"
            >
              建立我的第一個 IP →
            </button>
          </div>
        </div>
      )}

      {projectMode === 'ip_creator' && activeModel && (
        <div className="w-full max-w-7xl mb-10 animate-fade-in">
          <button
            onClick={() => {
              setActiveModel(activeModel.id);
              onNavigate('lounge');
            }}
            className="group w-full glass-panel rounded-2xl p-5 md:p-6 flex items-center justify-between gap-5 text-left transition-all duration-500 hover:-translate-y-1 hover:border-[var(--color-gold)] hover:bg-[var(--color-gold)]/5"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20 flex items-center justify-center text-[var(--color-gold)] flex-shrink-0 [&_svg]:w-8 [&_svg]:h-8">
                <ModelLoungeIcon />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--color-gold)] mb-1">
                  繼續目前 IP
                </p>
                <h3 className="text-lg md:text-2xl font-bold text-[var(--color-text-main)] truncate">
                  繼續我的 IP：{activeModel.name}
                </h3>
                <p className="text-xs md:text-sm text-[var(--color-text-dim)] mt-1">
                  回到模特兒休息室，接續身份、作品集與靈魂敘事流程
                </p>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full border border-[var(--color-gold)]/40 flex items-center justify-center text-[var(--color-gold)] flex-shrink-0 transition-transform duration-500 group-hover:translate-x-1">
              →
            </div>
          </button>
        </div>
      )}

      {/* Main Hubs */}
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-20">
        {hubs.map((hub) => (
          <button 
            key={hub.id}
            onClick={() => onNavigate(hub.id)}
            className="group relative glass-panel rounded-2xl p-8 text-left overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:border-[var(--color-gold)]"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${hub.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            <div className="relative z-10">
              <div className="text-[var(--color-gold)] mb-6 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 [&_svg]:w-16 [&_svg]:h-16">
                {hub.icon}
              </div>
              <h2 className="text-2xl font-bold mb-2 tracking-tight">{hub.zh}</h2>
              <p className="text-[var(--color-gold)] text-[10px] uppercase tracking-[0.2em] mb-4 font-display">{hub.en}</p>
              <p className="text-[var(--color-text-dim)] text-sm leading-relaxed group-hover:text-[var(--color-text-main)] transition-colors">
                {hub.desc}
              </p>
            </div>
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
              <div className="w-8 h-8 rounded-full border border-[var(--color-gold)] flex items-center justify-center text-[var(--color-gold)]">
                →
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Advanced Tools Section */}
      <div className="w-full max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--color-text-dim)]">進階工具箱</h3>
          <div className="h-px flex-1 bg-gradient-to-r from-[var(--color-border)] to-transparent"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {advancedTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onNavigate(tool.id)}
              className="group relative glass-panel rounded-2xl p-6 flex items-center gap-5 transition-all duration-500 hover:-translate-y-1 hover:border-[var(--color-gold)] hover:bg-[var(--color-gold)]/5 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-gold)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--color-text-dim)] group-hover:text-[var(--color-gold)] group-hover:scale-110 transition-all duration-500 [&_svg]:w-6 [&_svg]:h-6">
                {tool.icon}
              </div>
              
              <div className="relative z-10 flex flex-col items-start text-left">
                <span className="text-base font-bold tracking-wide text-[var(--color-text-main)] group-hover:text-[var(--color-gold)] transition-colors">
                  {tool.zh}
                </span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-[var(--color-text-dim)] mt-1 font-display group-hover:text-[var(--color-text-main)] transition-colors">
                  {tool.en}
                </span>
              </div>

              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-2 group-hover:translate-x-0">
                <span className="text-[var(--color-gold)] text-lg">›</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const ModuleButton: React.FC<{ 
  zh: string; 
  en: string; 
  icon: React.ReactNode; 
  onClick: () => void; 
  size?: 'large' | 'wide' | 'standard' 
}> = ({ zh, en, icon, onClick, size = 'standard' }) => {
    const isLarge = size === 'large';
    const isWide = size === 'wide';

    return (
      <button 
        onClick={onClick}
        className="group relative w-full h-full glass-panel rounded-xl transition-all duration-700 ease-out hover:-translate-y-2 hover:border-[var(--color-gold)] hover:shadow-2xl flex flex-col items-center justify-center overflow-hidden p-6"
      >
        {/* Hover Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-gold)]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        
        {/* Icon */}
        <div className={`text-[var(--color-text-dim)] group-hover:text-[var(--color-gold)] group-hover:scale-110 transition-all duration-700 z-10 opacity-70 group-hover:opacity-100 ${
          isLarge ? '[&_svg]:w-32 [&_svg]:h-32 mb-6' : 
          isWide ? '[&_svg]:w-20 [&_svg]:h-20 mb-4' : 
          '[&_svg]:w-14 [&_svg]:h-14 mb-4'
        }`}>
          {icon}
        </div>

        {/* Text Content */}
        <div className="flex flex-col items-center z-10 w-full">
            <span className={`font-sans font-bold text-[var(--color-text-main)] group-hover:text-[var(--color-gold)] transition-colors duration-500 text-center ${
              isLarge ? 'text-3xl tracking-[0.2em]' : 
              'text-lg tracking-widest'
            }`}>
                {zh}
            </span>
            <div className={`h-[1px] bg-[var(--color-gold)]/30 transition-all duration-700 my-3 ${
              isLarge ? 'w-12 group-hover:w-24' : 'w-6 group-hover:w-12'
            }`}></div>
            <span className={`font-display text-[var(--color-gold)] uppercase tracking-[0.2em] text-center transition-colors ${
              isLarge ? 'text-xs' : 'text-[9px]'
            }`}>
                {en}
            </span>
        </div>

        {/* Decorative Corner */}
        <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-transparent group-hover:border-[var(--color-gold)]/20 transition-all duration-700 rounded-tr-xl"></div>
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b border-l border-transparent group-hover:border-[var(--color-gold)]/20 transition-all duration-700 rounded-bl-xl"></div>
      </button>
    );
};

export default HomePage;
