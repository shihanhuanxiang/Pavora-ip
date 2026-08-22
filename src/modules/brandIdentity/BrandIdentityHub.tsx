import React, { useState } from 'react';
import Button from '../../shared/components/common/Button';
// 2026-08-14（A3）：`useMemo` / `Card` / `AsyncImage` / `useModelStore` 的 import
// 隨代言人卡牆一併移除 —— 那一籤是它們唯一的使用者。
import ModelSetup from '../modelCreation/ModelSetup';
import CharacterLab from '../characterLab/CharacterLab';
import HairSalon from '../hairSalon/HairSalon';
import StyleAnchorStudio from '../styleAnchor/StyleAnchorStudio';
import ModelLounge from '../modelLounge/ModelLounge';
import CompositeCardStudio from '../compositeCard/CompositeCardStudio';
import ModelIcon from '../../shared/assets/icons/ModelIcon';
import Face3DIcon from '../../shared/assets/icons/Face3DIcon';
import HairSalonIcon from '../../shared/assets/icons/HairSalonIcon';
import StyleAnchorIcon from '../../shared/assets/icons/StyleAnchorIcon';
import ModelLoungeIcon from '../../shared/assets/icons/ModelLoungeIcon';
import CompositeCardIcon from '../../shared/assets/icons/CompositeCardIcon';

interface BrandIdentityHubProps {
  onGoHome: () => void;
  onModelSelect: (model: any, destination: string) => void;
  initialImage?: any;
  initialTab?: HubTab;
}

/**
 * 2026-08-14（階段 7 · A3）：**`'ambassadors'` 頁籤已移除。**
 *
 * Hank 裁決：「把代言人移除，那是靈魂敘事這個功能還沒做之前的瑕疵版」。
 * 本頁是 7 個頁籤的外殼，只有第 1 個是代言人管理，所以**頁面留著、只拆那一籤**。
 * 落地頁改為 `'lounge'`（IP 休息室）—— 原本代言人籤的下半部本來就內嵌了
 * `<ModelLounge isHubMode />`，所以使用者看到的東西幾乎沒變，只是少了上半部的代言人卡牆。
 */
type HubTab = 'creation' | 'lounge' | 'matrix' | 'salon' | 'presets' | 'comp_card';

const BrandIdentityHub: React.FC<BrandIdentityHubProps> = ({ onGoHome, onModelSelect, initialImage, initialTab = 'lounge' }) => {
  const [activeTab, setActiveTab] = useState<HubTab>(initialTab);

  const tabs = [
    { id: 'lounge', zh: 'IP 休息室', en: 'Model Lounge', icon: <ModelLoungeIcon /> },
    { id: 'creation', zh: '模特兒生成', en: 'Genesis', icon: <ModelIcon /> },
    { id: 'matrix', zh: '角色矩陣', en: 'Face Matrix', icon: <Face3DIcon /> },
    { id: 'salon', zh: '妝髮沙龍', en: 'Beauty Salon', icon: <HairSalonIcon /> },
    { id: 'presets', zh: '品牌預設', en: 'Style Presets', icon: <StyleAnchorIcon /> },
    { id: 'comp_card', zh: '模特兒合輯卡', en: 'Comp Card', icon: <CompositeCardIcon /> },
  ];

  const renderTabContent = () => {
    const commonProps = { onGoHome, onGoBack: () => setActiveTab('lounge') };

    switch (activeTab) {
      /*
       * 2026-08-14（A3）：這裡原本是 `case 'ambassadors'` —— 一面代言人卡牆
       * （每張卡有「設為當前代言人」／「取消代言人」）＋ 下半部內嵌 IP 休息室。
       * 代言人概念移除後整段刪掉，落地頁改為 `'lounge'`，
       * 而 IP 休息室本來就在下半部，所以使用者看到的內容幾乎沒變。
       */
      case 'creation':
        return <ModelSetup onModelSelect={onModelSelect} {...commonProps} />;
      case 'lounge':
        return <ModelLounge onGoHome={onGoHome} onModelSelect={onModelSelect} isHubMode />;
      case 'matrix':
        return <CharacterLab onGoHome={onGoHome} initialImage={initialImage} />;
      case 'salon':
        return <HairSalon onGoHome={onGoHome} initialImage={initialImage} onContinueEditing={() => {}} />;
      case 'presets':
        return <StyleAnchorStudio onGoHome={onGoHome} />;
      case 'comp_card':
        return <CompositeCardStudio onGoHome={onGoHome} initialImage={initialImage} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hub Sub-Header */}
      <div className="glass-panel border-x-0 border-t-0 sticky top-[80px] z-30 px-4 lg:px-8 py-4">
        <div className="max-w-[110rem] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center text-[var(--color-gold)]">
              <ModelIcon />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">品牌形象中心</h1>
              <p className="text-[var(--color-gold)] text-[9px] uppercase tracking-[0.2em] font-display">Brand Identity Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-bg-input/40 p-1 rounded-xl border border-[var(--color-border)]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as HubTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'bg-[var(--color-gold)] text-[var(--color-bg-deep)] shadow-lg' 
                    : 'text-[var(--color-text-dim)] hover:text-[var(--color-text-title)] hover:bg-bg-surface/50'
                }`}
              >
                <span className="[&_svg]:w-4 [&_svg]:h-4">{tab.icon}</span>
                <span className="hidden lg:inline">{tab.zh}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={onGoHome} variant="secondary" className="text-[10px] font-bold tracking-widest">返回首頁</Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default BrandIdentityHub;
