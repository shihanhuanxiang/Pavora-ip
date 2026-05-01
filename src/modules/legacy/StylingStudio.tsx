import React, { useState } from 'react';
import type { Model, ApparelItem, GeneratedLook, QaCheck } from '../../shared/types/types';
import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';

interface StylingStudioProps {
  model: Model;
  apparelItems: ApparelItem[];
  generatedLooks: GeneratedLook[];
  onExport: () => void;
  onGenerateMore: () => void;
  isLoading: boolean;
  onGoBack: () => void;
  onGoHome: () => void;
}

const modules = [
  '服裝設計師', '配件工作室', '髮型沙龍', '場景生成器', '姿勢與動態',
  '幻想系列', '模型休息室', '個人衣櫥'
];

const StylingStudio: React.FC<StylingStudioProps> = ({ model, apparelItems, generatedLooks, onExport, onGenerateMore, isLoading, onGoBack, onGoHome }) => {
  const [activeLookId, setActiveLookId] = useState<number | null>(generatedLooks.length > 0 ? generatedLooks[0].id : null);
  const [activeModule, setActiveModule] = useState<string>(modules[0]);
  
  const activeLook = generatedLooks.find(look => look.id === activeLookId);

  return (
    <div className="container mx-auto p-4 lg:p-8 animate-fade-in">
       <div className="flex justify-between items-center mb-6 px-4 lg:px-0">
        <button onClick={onGoBack} className="text-gray-400 hover:text-white transition-colors text-sm">&larr; 上一頁</button>
        <button onClick={onGoHome} className="text-gray-400 hover:text-white transition-colors text-sm">返回首頁</button>
      </div>
      <h2 className="text-3xl font-bold text-center mb-2 uppercase text-[var(--color-text-title)]">步驟 3: 風格化工作室</h2>
      <p className="text-center text-gray-400 mb-8">預覽造型、進行微調並執行品質檢查。</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Preview */}
        <div className="lg:col-span-2">
          <Card className="h-[75vh] relative flex items-center justify-center overflow-hidden">
            {isLoading && !activeLook && (
              <div className="text-gray-400">正在生成第一個造型...</div>
            )}
            {activeLook ? (
              <>
                {/* The "FACE & HAIR LOCK" is visually simulated by showing the original model headshot */}
                <div className="absolute top-4 left-4 bg-gray-900/70 p-2 rounded-lg border border-white z-10">
                    <p className="text-xs text-white font-bold uppercase">臉部/髮型 鎖定</p>
                    <img src={model.imageUrl} alt="Model face" className="w-24 h-24 object-cover mt-2 rounded-md border-2 border-gray-600"/>
                </div>
                <img src={activeLook.imageUrl} alt={`Look ${activeLook.id}`} className="max-h-full w-auto object-contain" />
              </>
            ) : (
                !isLoading && <div className="text-gray-500">沒有可顯示的造型</div>
            )}
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-6">
          <Card>
            <h3 className="text-lg font-semibold mb-3 text-[var(--color-text-title)]">結果預覽</h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {generatedLooks.map(look => (
                <div key={look.id} onClick={() => setActiveLookId(look.id)} className={`cursor-pointer rounded-md p-1 border-2 ${activeLookId === look.id ? 'border-white' : 'border-transparent'}`}>
                    <img src={look.imageUrl} alt={`Look ${look.id}`} className="w-24 h-24 object-cover rounded-md" />
                    <p className="text-center text-sm mt-1">Look {look.id}</p>
                </div>
              ))}
              {isLoading && <div className="w-24 h-24 bg-gray-700 rounded-md animate-pulse flex items-center justify-center text-xs">生成中...</div>}
            </div>
          </Card>

          {activeLook && (
            <Card>
                <h3 className="text-lg font-semibold mb-3 text-[var(--color-text-title)]">品質保證檢查清單</h3>
                <div className="space-y-2">
                {activeLook.qaChecks.map(check => (
                    <div key={check.id} className="flex items-center">
                    <input type="checkbox" id={check.id} checked={check.passed} readOnly className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-white focus:ring-white"/>
                    <label htmlFor={check.id} className="ml-2 text-sm">{check.label}</label>
                    </div>
                ))}
                </div>
            </Card>
          )}

          <Card>
            <h3 className="text-lg font-semibold mb-3 text-[var(--color-text-title)]">編輯模組</h3>
            <div className="flex flex-wrap gap-2">
              {modules.map(module => (
                <button
                  key={module}
                  onClick={() => setActiveModule(module)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${activeModule === module ? 'bg-white text-gray-900 font-bold' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  {module}
                </button>
              ))}
            </div>
             <div className="mt-4 p-4 bg-gray-900 rounded-md min-h-[50px]">
                <p className="text-gray-400 text-sm">此處為模組 '{activeModule}' 的控制選項。</p>
            </div>
          </Card>
          
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={onGenerateMore} variant="secondary" isLoading={isLoading}>
                再生成一個
            </Button>
            <Button onClick={onExport} disabled={!activeLook} variant="light">
                導出
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StylingStudio;
