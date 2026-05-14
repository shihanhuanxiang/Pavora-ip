
import React, { useState, useCallback, useEffect } from 'react';
import { WorkflowStep } from '../shared/types/types';
import type { TaxonomyData } from '../shared/services/taxonomyService';

import Header from './Header';
import Loader from '../shared/components/common/Loader';
import { getImagenUsage, imageUrlToimageData } from '../shared/services/geminiService';
import HomePage from './HomePage';
import QuotaErrorModal from '../shared/components/common/QuotaErrorModal';
import PaidFeatureModal from '../shared/components/common/PaidFeatureModal';

import ModelSetup from '../modules/modelCreation/ModelSetup';
import VirtualFittingRoom from '../modules/virtualFittingRoom/VirtualFittingRoom';
import ApparelDesign from '../modules/apparelDesign/ApparelDesign';
import HairAndMakeupStudio from '../modules/hairSalon/HairSalon';
import SceneGeneration from '../modules/sceneGeneration/SceneGeneration';
import FantasySeries from '../modules/fantasySeries/FantasySeries';
import ModelLounge from '../modules/modelLounge/ModelLounge';
import PersonalWardrobe from '../modules/personalWardrobe/PersonalWardrobe';
import CompositeCardStudio from '../modules/compositeCard/CompositeCardStudio';
import PortfolioGallery from '../modules/portfolio/PortfolioGallery';
import PortfolioOptimization from '../modules/portfolio/PortfolioOptimization';
import ImageDeconstructionStudio from '../modules/imageDeconstruction/ImageDeconstructionStudio';
import ProductPosterEngine from '../modules/pcpe/ProductPosterEngine';
import DirectorMode from '../modules/directorMode/DirectorMode';
import CharacterLab from '../modules/characterLab/CharacterLab';
import MacroCraftStudio from '../modules/macroCraft/MacroCraftStudio';
import StyleAnchorStudio from '../modules/styleAnchor/StyleAnchorStudio';

import BrandIdentityHub from '../modules/brandIdentity/BrandIdentityHub';
import MarketingFactory from '../modules/marketing/MarketingFactory';
import MotionHub from '../modules/motion/MotionHub';

import { useNotification } from '../shared/context/NotificationContext';
import NotificationPortal from '../shared/components/notification/NotificationPortal';

interface AppProps {
  taxonomyData: TaxonomyData;
}

import { useAppStore } from '../shared/stores/useAppStore';

const App: React.FC<AppProps> = ({ taxonomyData }) => {
  const { projectMode } = useAppStore();
  const { masterTaxonomy, apparelStructure } = taxonomyData;
  const { addNotification } = useNotification();

  // 同步專案模式色彩
  useEffect(() => {
    const root = document.documentElement;
    if (projectMode === 'commerce') {
      root.style.setProperty('--color-gold', '#60a5fa');
      root.style.setProperty('--color-gold-rgb', '96, 165, 250');
    } else {
      root.style.setProperty('--color-gold', '#d4af37');
      root.style.setProperty('--color-gold-rgb', '212, 175, 55');
    }
  }, [projectMode]);
  
  // 狀態持久化：從 sessionStorage 恢復
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>(() => {
    const saved = sessionStorage.getItem('pavora_workflow_step');
    if (saved !== null) {
      const num = parseInt(saved, 10);
      if (!isNaN(num)) return num as WorkflowStep;
    }
    return WorkflowStep.HOMEPAGE;
  });
  
  const [editingImage, setEditingImage] = useState<{ url: string; fileData: { data: string; mimeType: string; } } | null>(() => {
    const saved = sessionStorage.getItem('pavora_editing_image');
    return saved ? JSON.parse(saved) : null;
  });

  const [isQuotaModalVisible, setQuotaModalVisible] = useState(false);
  const [imagenUsage, setImagenUsage] = useState(0);
  const [paidModalConfig, setPaidModalConfig] = useState<{ isOpen: boolean; resolve?: (v: boolean) => void } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [narrativeData, setNarrativeData] = useState<{model: any, diary: any} | null>(null);
  const [selectedModel, setSelectedModel] = useState<any | null>(null);
  
  // 主題管理
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('pavora_theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
      html.classList.remove('light');
      localStorage.setItem('pavora_theme', 'dark');
    } else {
      html.classList.add('light');
      html.classList.remove('dark');
      localStorage.setItem('pavora_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    setImagenUsage(getImagenUsage());
    const handleQuotaExceeded = () => setQuotaModalVisible(true);
    const handleUsageUpdated = () => setImagenUsage(getImagenUsage());
    window.addEventListener('imagenQuotaExceeded', handleQuotaExceeded);
    window.addEventListener('imagenUsageUpdated', handleUsageUpdated);
    return () => {
      window.removeEventListener('imagenQuotaExceeded', handleQuotaExceeded);
      window.removeEventListener('imagenUsageUpdated', handleUsageUpdated);
    };
  }, []);

  useEffect(() => {
    const handleConfirmPaid = (e: CustomEvent) => setPaidModalConfig({ isOpen: true, resolve: e.detail.resolve });
    window.addEventListener('PAVORA_CONFIRM_PAID', handleConfirmPaid as EventListener);
    return () => window.removeEventListener('PAVORA_CONFIRM_PAID', handleConfirmPaid as EventListener);
  }, []);

  useEffect(() => {
    sessionStorage.setItem('pavora_workflow_step', workflowStep);
  }, [workflowStep]);

  useEffect(() => {
    if (editingImage) {
      sessionStorage.setItem('pavora_editing_image', JSON.stringify(editingImage));
    } else {
      sessionStorage.removeItem('pavora_editing_image');
    }
  }, [editingImage]);

  const toggleTheme = useCallback(() => setIsDarkMode(prev => !prev), []);
  const handlePaidConfirm = () => { if (paidModalConfig?.resolve) paidModalConfig.resolve(true); setPaidModalConfig(null); };
  const handlePaidCancel = () => { if (paidModalConfig?.resolve) paidModalConfig.resolve(false); setPaidModalConfig(null); };
  const handleGoHome = useCallback(() => { setWorkflowStep(WorkflowStep.HOMEPAGE); setEditingImage(null); }, []);
  const handleGoBack = useCallback(() => { setWorkflowStep(WorkflowStep.HOMEPAGE); }, []);
  
  const handleNavigate = useCallback((destination: string) => {
    switch (destination) {
        case 'brand_identity_hub': setWorkflowStep(WorkflowStep.BRAND_IDENTITY_HUB); break;
        case 'marketing_factory': setWorkflowStep(WorkflowStep.MARKETING_FACTORY); break;
        case 'motion_hub': setWorkflowStep(WorkflowStep.MOTION_CINEMATIC_HUB); break;
        case 'model_setup': setWorkflowStep(WorkflowStep.MODEL_SETUP); break;
        case 'fitting_room': setWorkflowStep(WorkflowStep.VIRTUAL_FITTING_ROOM); break;
        case 'apparel': setWorkflowStep(WorkflowStep.APPAREL_DESIGN); break;
        case 'salon': setWorkflowStep(WorkflowStep.HAIR_SALON); break;
        case 'scene': setWorkflowStep(WorkflowStep.SCENE_GENERATION); break;
        case 'fantasy': setWorkflowStep(WorkflowStep.FANTASY_SERIES); break;
        case 'narrative': setWorkflowStep(WorkflowStep.MODEL_SETUP); break;
        case 'lounge': setWorkflowStep(WorkflowStep.MODEL_LOUNGE); break;
        case 'wardrobe': setWorkflowStep(WorkflowStep.PERSONAL_WARDROBE); break;
        case 'composite_card': setWorkflowStep(WorkflowStep.BRAND_IDENTITY_HUB_COMP_CARD); break;
        case 'portfolio': setWorkflowStep(WorkflowStep.PORTFOLIO_GALLERY); break;
        case 'portfolio_optimization': setWorkflowStep(WorkflowStep.PORTFOLIO_OPTIMIZATION); break;
        case 'deconstruction': setWorkflowStep(WorkflowStep.IMAGE_DECONSTRUCTION); break;
        case 'pcpe': setWorkflowStep(WorkflowStep.MARKETING_FACTORY_POSTER); break;
        case 'architect': setWorkflowStep(WorkflowStep.MARKETING_FACTORY_ARCHITECT); break;
        case 'director_mode': setWorkflowStep(WorkflowStep.DIRECTOR_MODE); break;
        case 'character_lab': setWorkflowStep(WorkflowStep.CHARACTER_LAB); break;
        case 'macro_craft': setWorkflowStep(WorkflowStep.MACRO_CRAFT); break;
        case 'style_anchor': setWorkflowStep(WorkflowStep.STYLE_ANCHOR); break;
        default: setWorkflowStep(WorkflowStep.HOMEPAGE); break;
    }
  }, []);

  const handleAdvancedEdit = useCallback(async (imageUrl: string, destination: string) => {
    setIsTransitioning(true);
    try {
        const fileData = await imageUrlToimageData(imageUrl);
        setEditingImage({ url: imageUrl, fileData }); 
        handleNavigate(destination);
    } catch (e) {
        addNotification({
          type: 'error',
          message: '載入失敗',
          description: '無法載入圖片進行編輯，請重試。'
        });
    } finally {
        setIsTransitioning(false);
    }
  }, [handleNavigate, addNotification]);

  const handleModelSelect = useCallback((model: any, destination: string) => {
    setSelectedModel(model);
    if (model && model.narrativeData) {
        setNarrativeData({ model, diary: model.narrativeData });
        handleNavigate(destination);
    } else if (model && model.imageUrl && destination !== 'model_setup') {
      handleAdvancedEdit(model.imageUrl, destination);
    } else {
      handleNavigate(destination);
    }
  }, [handleAdvancedEdit, handleNavigate]);

  const renderContent = () => {
    const navProps = { onGoBack: handleGoBack, onGoHome: handleGoHome };
    switch (workflowStep) {
      case WorkflowStep.HOMEPAGE: return <HomePage onNavigate={handleNavigate} />;
      case WorkflowStep.BRAND_IDENTITY_HUB: return <BrandIdentityHub onGoHome={handleGoHome} onModelSelect={handleModelSelect} initialImage={editingImage} />;
      case WorkflowStep.BRAND_IDENTITY_HUB_COMP_CARD: return <BrandIdentityHub onGoHome={handleGoHome} onModelSelect={handleModelSelect} initialImage={editingImage} initialTab="comp_card" />;
      case WorkflowStep.MARKETING_FACTORY: return <MarketingFactory onGoHome={handleGoHome} initialImage={editingImage} />;
      case WorkflowStep.MARKETING_FACTORY_POSTER: return <MarketingFactory onGoHome={handleGoHome} initialView="POSTER" initialImage={editingImage} />;
      case WorkflowStep.MARKETING_FACTORY_ARCHITECT: return <MarketingFactory onGoHome={handleGoHome} initialView="ARCHITECT" initialImage={editingImage} />;
      case WorkflowStep.MOTION_CINEMATIC_HUB: return <MotionHub onGoHome={handleGoHome} />;
      case WorkflowStep.MODEL_SETUP: return (
          <ModelSetup 
            onModelSelect={handleModelSelect} 
            {...navProps} 
            inheritedModel={selectedModel}
            initialNarrativeData={narrativeData}
            onClearNarrative={() => { setNarrativeData(null); setSelectedModel(null); }}
          />
      );
      case WorkflowStep.MODEL_LOUNGE: return <ModelLounge onGoHome={handleGoHome} onModelSelect={handleModelSelect} />;
      case WorkflowStep.VIRTUAL_FITTING_ROOM: return <VirtualFittingRoom {...navProps} onAdvancedEdit={handleAdvancedEdit} initialImage={editingImage} masterTaxonomy={masterTaxonomy} apparelStructure={apparelStructure} />;
      case WorkflowStep.PERSONAL_WARDROBE: return <PersonalWardrobe onGoHome={handleGoHome} apparelStructure={apparelStructure} />;
      case WorkflowStep.APPAREL_DESIGN: return <ApparelDesign onGoHome={handleGoHome} onAdvancedEdit={handleAdvancedEdit} masterTaxonomy={masterTaxonomy} apparelStructure={apparelStructure} />;
      case WorkflowStep.HAIR_SALON: return <HairAndMakeupStudio onGoHome={handleGoHome} initialImage={editingImage} onContinueEditing={handleAdvancedEdit} />;
      case WorkflowStep.SCENE_GENERATION: return <SceneGeneration onGoHome={handleGoHome} initialImage={editingImage} onContinueEditing={handleAdvancedEdit} selectedModel={selectedModel} />;
      case WorkflowStep.FANTASY_SERIES: return <FantasySeries onGoHome={handleGoHome} initialImage={editingImage} onContinueEditing={handleAdvancedEdit} />;
      case WorkflowStep.COMPOSITE_CARD: return <CompositeCardStudio onGoHome={handleGoHome} initialImage={editingImage} />;
      case WorkflowStep.PORTFOLIO_GALLERY: return <PortfolioGallery onGoHome={handleGoHome} onAdvancedEdit={handleAdvancedEdit} />;
      case WorkflowStep.PORTFOLIO_OPTIMIZATION: return <PortfolioOptimization {...navProps} initialImage={editingImage} onContinueEditing={handleAdvancedEdit} />;
      case WorkflowStep.IMAGE_DECONSTRUCTION: return <ImageDeconstructionStudio {...navProps} />;
      case WorkflowStep.PCPE: return <ProductPosterEngine {...navProps} />;
      case WorkflowStep.DIRECTOR_MODE: return <DirectorMode onGoHome={handleGoHome} initialImage={editingImage} />;
      case WorkflowStep.CHARACTER_LAB: return <CharacterLab onGoHome={handleGoHome} initialImage={editingImage} />;
      case WorkflowStep.MACRO_CRAFT: return <MacroCraftStudio onGoHome={handleGoHome} />;
      case WorkflowStep.STYLE_ANCHOR: return <StyleAnchorStudio onGoHome={handleGoHome} />;
      default: return <div>錯誤的流程步驟</div>;
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-500 bg-[var(--color-bg-deep)] text-[var(--color-text-main)] font-sans">
      {isTransitioning && <Loader message="正在準備編輯素材..." />}
      <Header 
        onTitleClick={handleGoHome} 
        onNavigate={handleNavigate} 
        imagenUsage={imagenUsage} 
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />
      <main className="relative">
        <QuotaErrorModal isOpen={isQuotaModalVisible} onClose={() => setQuotaModalVisible(false)} />
        <PaidFeatureModal isOpen={!!paidModalConfig?.isOpen} onConfirm={handlePaidConfirm} onCancel={handlePaidCancel} />
        {renderContent()}
      </main>
      <NotificationPortal />
    </div>
  );
};

export default App;
