import React, { useState } from 'react';
import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';
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

import { useBrandStore } from '../../shared/stores/useBrandStore';
import AsyncImage from '../../shared/components/common/AsyncImage';

interface BrandIdentityHubProps {
  onGoHome: () => void;
  onModelSelect: (model: any, destination: string) => void;
  initialImage?: any;
  initialTab?: HubTab;
}

type HubTab = 'ambassadors' | 'creation' | 'lounge' | 'matrix' | 'salon' | 'presets' | 'comp_card';

const BrandIdentityHub: React.FC<BrandIdentityHubProps> = ({ onGoHome, onModelSelect, initialImage, initialTab = 'ambassadors' }) => {
  const [activeTab, setActiveTab] = useState<HubTab>(initialTab);
  const { ambassadors, removeAmbassadors, activeAmbassadorId, setActiveAmbassador } = useBrandStore();

  const tabs = [
    { id: 'ambassadors', zh: '代言人管理', en: 'Ambassadors', icon: <ModelLoungeIcon /> },
    { id: 'creation', zh: '模特兒生成', en: 'Genesis', icon: <ModelIcon /> },
    { id: 'lounge', zh: '模特兒休息室', en: 'Model Lounge', icon: <ModelLoungeIcon /> },
    { id: 'matrix', zh: '角色矩陣', en: 'Face Matrix', icon: <Face3DIcon /> },
    { id: 'salon', zh: '妝髮沙龍', en: 'Beauty Salon', icon: <HairSalonIcon /> },
    { id: 'presets', zh: '品牌預設', en: 'Style Presets', icon: <StyleAnchorIcon /> },
    { id: 'comp_card', zh: '模特兒合輯卡', en: 'Comp Card', icon: <CompositeCardIcon /> },
  ];

  const renderTabContent = () => {
    const commonProps = { onGoHome, onGoBack: () => setActiveTab('ambassadors') };
    
    switch (activeTab) {
      case 'ambassadors':
        return (
          <div className="max-w-[110rem] mx-auto p-8">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl font-bold mb-2">品牌代言人庫</h2>
                <p className="text-[var(--color-text-dim)]">最多可儲存 5 位品牌代言人，用於所有行銷素材生成。</p>
              </div>
              <Button onClick={() => setActiveTab('creation')} variant="primary">新增代言人</Button>
            </div>

            {ambassadors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {ambassadors.map((amb) => (
                  <Card 
                    key={amb.id} 
                    className={`p-2 group relative transition-all duration-500 ${activeAmbassadorId === amb.id ? 'border-[var(--color-gold)] ring-2 ring-[var(--color-gold)]/20' : ''}`}
                  >
                    <div className="aspect-[3/4] rounded-lg overflow-hidden mb-4">
                      <AsyncImage src={amb.imageUrl} className="w-full h-full object-cover object-top" />
                    </div>
                    <div className="text-center">
                      <h4 className="font-bold mb-1">{amb.name}</h4>
                      <p className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-widest mb-4">{amb.ethnicity} · {amb.gender}</p>
                      
                      <div className="flex flex-col gap-2">
                        <Button 
                          onClick={() => setActiveAmbassador(amb.id)} 
                          variant={activeAmbassadorId === amb.id ? 'primary' : 'secondary'}
                          className="w-full text-[10px] py-2"
                        >
                          {activeAmbassadorId === amb.id ? '當前使用中' : '設為當前代言人'}
                        </Button>
                        <button 
                          onClick={() => removeAmbassadors([amb.id])}
                          className="text-[10px] text-red-500/50 hover:text-red-500 transition-colors uppercase tracking-widest font-bold"
                        >
                          移除
                        </button>
                      </div>
                    </div>
                    {activeAmbassadorId === amb.id && (
                      <div className="absolute -top-2 -right-2 bg-[var(--color-gold)] text-[var(--color-bg-deep)] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                        ✓
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-20 flex flex-col items-center justify-center text-center border-dashed border-2 border-[var(--color-border)]">
                <p className="text-[var(--color-text-dim)] mb-8">尚未建立品牌代言人。您可以從模特兒生成中晉升，或從模特兒休息室中挑選。</p>
                <div className="flex gap-4">
                  <Button onClick={() => setActiveTab('creation')}>前往生成</Button>
                  <Button onClick={() => setActiveTab('lounge')} variant="secondary">從休息室挑選</Button>
                </div>
              </div>
            )}

            <div className="mt-20">
              <div className="flex items-center gap-4 mb-8">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--color-text-dim)]">模特兒休息室 / Model Lounge</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-[var(--color-border)] to-transparent"></div>
              </div>
              <ModelLounge onGoHome={onGoHome} onModelSelect={onModelSelect} isHubMode />
            </div>
          </div>
        );
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
            <div className="w-10 h-10 rounded-lg bg-[var(--color-gold)]/10 flex items-center justify-center text-[var(--color-gold)]">
              <ModelIcon />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">品牌形象中心</h1>
              <p className="text-[var(--color-gold)] text-[9px] uppercase tracking-[0.2em] font-display">Brand Identity Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[var(--color-bg-input)]/40 p-1 rounded-xl border border-[var(--color-border)]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as HubTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'bg-[var(--color-gold)] text-[var(--color-bg-deep)] shadow-lg' 
                    : 'text-[var(--color-text-dim)] hover:text-[var(--color-text-title)] hover:bg-[var(--color-bg-surface)]/50'
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
