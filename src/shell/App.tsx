
import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { WorkflowStep } from '../shared/types/types';
import type { TaxonomyData } from '../shared/services/taxonomyService';

// 常駐首屏必需元件：維持靜態 import，確保首頁秒開
import Header from './Header';
import Loader from '../shared/components/common/Loader';
import { getImagenUsage, imageUrlToimageData } from '../shared/services/geminiService';
import HomePage from './HomePage';
import QuotaErrorModal from '../shared/components/common/QuotaErrorModal';
import PaidFeatureModal from '../shared/components/common/PaidFeatureModal';

// 大模組：改 React.lazy 動態 import，切出獨立 chunk（D1，Stage D 導覽計畫）
const ModelSetup = React.lazy(() => import('../modules/modelCreation/ModelSetup'));
const VirtualFittingRoom = React.lazy(() => import('../modules/virtualFittingRoom/VirtualFittingRoom'));
const ApparelDesign = React.lazy(() => import('../modules/apparelDesign/ApparelDesign'));
const HairAndMakeupStudio = React.lazy(() => import('../modules/hairSalon/HairSalon'));
const SceneGeneration = React.lazy(() => import('../modules/sceneGeneration/SceneGeneration'));
const FantasySeries = React.lazy(() => import('../modules/fantasySeries/FantasySeries'));
const ModelLounge = React.lazy(() => import('../modules/modelLounge/ModelLounge'));
const PersonalWardrobe = React.lazy(() => import('../modules/personalWardrobe/PersonalWardrobe'));
const CompositeCardStudio = React.lazy(() => import('../modules/compositeCard/CompositeCardStudio'));
const PortfolioGallery = React.lazy(() => import('../modules/portfolio/PortfolioGallery'));
const PortfolioOptimization = React.lazy(() => import('../modules/portfolio/PortfolioOptimization'));
const ImageDeconstructionStudio = React.lazy(() => import('../modules/imageDeconstruction/ImageDeconstructionStudio'));
const ProductPosterEngine = React.lazy(() => import('../modules/pcpe/ProductPosterEngine'));
const DirectorMode = React.lazy(() => import('../modules/directorMode/DirectorMode'));
const CharacterLab = React.lazy(() => import('../modules/characterLab/CharacterLab'));
const MacroCraftStudio = React.lazy(() => import('../modules/macroCraft/MacroCraftStudio'));
const StyleAnchorStudio = React.lazy(() => import('../modules/styleAnchor/StyleAnchorStudio'));

const BrandIdentityHub = React.lazy(() => import('../modules/brandIdentity/BrandIdentityHub'));
const MarketingFactory = React.lazy(() => import('../modules/marketing/MarketingFactory'));
const MotionHub = React.lazy(() => import('../modules/motion/MotionHub'));
const NarrativeWorkflow = React.lazy(() => import('../modules/narrative/NarrativeWorkflow'));

import { useNotification } from '../shared/context/NotificationContext';
import { AuthProvider, useAuth } from '../shared/context/AuthContext';
import NotificationPortal from '../shared/components/notification/NotificationPortal';
import LoginScreen from './LoginScreen';

interface AppProps {
  taxonomyData: TaxonomyData;
}

// D1 Suspense fallback：premium 調性（黑底＋PAVORA 淡入＋細金線 pulse），避免白畫面/土轉圈。
// 固定 min-h-[60vh] 避免 layout shift。
const RouteTransitionFallback: React.FC = () => (
  <div className="min-h-[60vh] w-full flex flex-col items-center justify-center bg-[var(--color-bg-deep)] animate-fade-in">
    <span className="text-xs font-display font-bold uppercase tracking-[0.6em] text-[var(--color-text-main)]">
      PAVORA
    </span>
    <div className="mt-6 h-px w-24 overflow-hidden bg-white/10">
      <div className="h-full w-1/3 bg-[var(--color-gold)] animate-pulse" />
    </div>
  </div>
);

import { useAppStore } from '../shared/stores/useAppStore';
import { useModelStore } from '../shared/stores/useModelStore';

// E4b：登入閘（env 旗標控制）。VITE_REQUIRE_LOGIN 未設定或非 'true' 時，
// requireLogin 為 false，直接 render children，行為與旗標不存在前完全相同。
// 必須放在 AuthProvider 之內才能拿到真實的 user/loading（App 本體在 Provider 外層）。
const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const requireLogin = import.meta.env.VITE_REQUIRE_LOGIN === 'true';
  const { user, loading } = useAuth();

  if (!requireLogin) return <>{children}</>;
  if (loading) return <RouteTransitionFallback />;
  if (!user) return <LoginScreen />;
  return <>{children}</>;
};

const getWorkflowStepForPath = (pathname: string): WorkflowStep | null => {
  if (pathname === '/narrative') return WorkflowStep.NARRATIVE;
  return null;
};

const getPathForWorkflowStep = (step: WorkflowStep) => {
  if (step === WorkflowStep.NARRATIVE) return '/narrative';
  return '/';
};

const App: React.FC<AppProps> = ({ taxonomyData }) => {
  const { projectMode } = useAppStore();
  const { models, activeModelId } = useModelStore();
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
    const pathStep = getWorkflowStepForPath(window.location.pathname);
    if (pathStep !== null) return pathStep;
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
  const [loungeFocusModelId, setLoungeFocusModelId] = useState<string | null>(null);
  
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
  const setWorkflowStepWithPath = useCallback((step: WorkflowStep) => {
    setWorkflowStep(step);
    const nextPath = getPathForWorkflowStep(step);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setWorkflowStep(getWorkflowStepForPath(window.location.pathname) ?? WorkflowStep.HOMEPAGE);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleGoHome = useCallback(() => { setWorkflowStepWithPath(WorkflowStep.HOMEPAGE); setEditingImage(null); setLoungeFocusModelId(null); }, [setWorkflowStepWithPath]);
  const handleGoBack = useCallback(() => { setWorkflowStepWithPath(WorkflowStep.HOMEPAGE); }, [setWorkflowStepWithPath]);
  
  const handleNavigate = useCallback((destination: string) => {
    switch (destination) {
        case 'brand_identity_hub': setWorkflowStepWithPath(WorkflowStep.BRAND_IDENTITY_HUB); break;
        case 'marketing_factory': setWorkflowStepWithPath(WorkflowStep.MARKETING_FACTORY); break;
        case 'motion_hub': setWorkflowStepWithPath(WorkflowStep.MOTION_CINEMATIC_HUB); break;
        case 'model_setup': setWorkflowStepWithPath(WorkflowStep.MODEL_SETUP); break;
        case 'fitting_room': setWorkflowStepWithPath(WorkflowStep.VIRTUAL_FITTING_ROOM); break;
        case 'apparel': setWorkflowStepWithPath(WorkflowStep.APPAREL_DESIGN); break;
        case 'salon': setWorkflowStepWithPath(WorkflowStep.HAIR_SALON); break;
        case 'scene': setWorkflowStepWithPath(WorkflowStep.SCENE_GENERATION); break;
        case 'fantasy': setWorkflowStepWithPath(WorkflowStep.FANTASY_SERIES); break;
        case 'narrative': setWorkflowStepWithPath(WorkflowStep.NARRATIVE); break;
        case 'lounge': setWorkflowStepWithPath(WorkflowStep.MODEL_LOUNGE); break;
        case 'wardrobe': setWorkflowStepWithPath(WorkflowStep.PERSONAL_WARDROBE); break;
        case 'composite_card': setWorkflowStepWithPath(WorkflowStep.BRAND_IDENTITY_HUB_COMP_CARD); break;
        case 'portfolio': setWorkflowStepWithPath(WorkflowStep.PORTFOLIO_GALLERY); break;
        case 'portfolio_optimization': setWorkflowStepWithPath(WorkflowStep.PORTFOLIO_OPTIMIZATION); break;
        case 'deconstruction': setWorkflowStepWithPath(WorkflowStep.IMAGE_DECONSTRUCTION); break;
        case 'pcpe': setWorkflowStepWithPath(WorkflowStep.MARKETING_FACTORY_POSTER); break;
        case 'architect': setWorkflowStepWithPath(WorkflowStep.MARKETING_FACTORY_ARCHITECT); break;
        case 'director_mode': setWorkflowStepWithPath(WorkflowStep.DIRECTOR_MODE); break;
        case 'character_lab': setWorkflowStepWithPath(WorkflowStep.CHARACTER_LAB); break;
        case 'macro_craft': setWorkflowStepWithPath(WorkflowStep.MACRO_CRAFT); break;
        case 'style_anchor': setWorkflowStepWithPath(WorkflowStep.STYLE_ANCHOR); break;
        default: setWorkflowStepWithPath(WorkflowStep.HOMEPAGE); break;
    }
  }, [setWorkflowStepWithPath]);

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
    if (destination === 'narrative') {
        handleNavigate(destination);
        return;
    }
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
    const narrativeModel = selectedModel || models.find(model => model.id === activeModelId) || models[0] || null;
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
      case WorkflowStep.MODEL_LOUNGE: return <ModelLounge onGoHome={handleGoHome} onModelSelect={handleModelSelect} initialPortfolioModelId={loungeFocusModelId} focusPortfolioAssets={!!loungeFocusModelId} />;
      case WorkflowStep.NARRATIVE: return narrativeModel ? (
          <NarrativeWorkflow
            model={narrativeModel}
            onClose={() => setWorkflowStepWithPath(WorkflowStep.MODEL_LOUNGE)}
            onGoHome={handleGoHome}
            onConfirm={() => {
              addNotification({ type: 'success', message: '靈魂敘事已同步至模特兒作品集' });
              setLoungeFocusModelId(narrativeModel.id);
              setWorkflowStepWithPath(WorkflowStep.MODEL_LOUNGE);
            }}
          />
      ) : (
          <div className="container mx-auto p-4 lg:p-8 max-w-[110rem] animate-fade-in">
            <div className="sticky top-[80px] z-30 glass-panel border-x-0 border-t-0 px-6 py-4 mb-8">
              <div className="max-w-[110rem] mx-auto flex justify-between items-center">
                <div className="flex flex-col">
                  <h2 className="text-2xl font-display font-bold uppercase tracking-[0.3em] text-[var(--color-text-main)]">靈魂敘事</h2>
                  <span className="text-[9px] uppercase tracking-[0.5em] text-[var(--color-gold)] font-light">Narrative Workflow</span>
                </div>
                <button onClick={handleGoHome} className="px-4 py-2 rounded-xl border border-white/10 text-[10px] font-bold text-gray-400 hover:text-white hover:border-[var(--color-gold)]/50 transition-all">
                  返回首頁
                </button>
              </div>
            </div>
            <div className="glass-panel rounded-3xl p-12 flex flex-col items-center justify-center text-center border border-[var(--color-border)] min-h-[50vh]">
              <h3 className="text-2xl font-display font-bold uppercase tracking-[0.3em] text-[var(--color-text-main)] mb-4">尚未選擇 IP</h3>
              <p className="text-sm text-[var(--color-text-dim)] max-w-md leading-relaxed">請先從 IP 休息室選擇一位模特兒，再啟動靈魂敘事流程。</p>
              <button onClick={() => handleNavigate('lounge')} className="mt-10 px-6 py-3 rounded-xl bg-[var(--color-gold)] text-black text-[10px] font-black tracking-widest uppercase">
                前往 IP 休息室
              </button>
            </div>
          </div>
      );
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
    <AuthProvider>
      <AuthGate>
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
            <Suspense fallback={<RouteTransitionFallback />}>
              {renderContent()}
            </Suspense>
          </main>
          <NotificationPortal />
        </div>
      </AuthGate>
    </AuthProvider>
  );
};

export default App;
