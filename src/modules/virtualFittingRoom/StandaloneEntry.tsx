import React from 'react';
import VirtualFittingRoom from './VirtualFittingRoom';

/**
 * Standalone Entry Point for Virtual Fitting Room.
 * 
 * This component acts as a lightweight wrapper (Mini-App) when the Fitting Room
 * is deployed or run in isolation from the main Pavora App shell.
 * 
 * It provides:
 * 1. A basic layout/container.
 * 2. Mock navigation handlers since the main Router/App.tsx is absent.
 * 3. Implicit self-loading of data via the modified VirtualFittingRoom component.
 */
const StandaloneEntry: React.FC = () => {
  const handleGoHome = () => {
    console.log("Standalone Mode: 'Go Home' clicked. In a real standalone app, this might reset state or go to a landing page.");
    alert("您目前處於「獨立運行模式」。此功能在完整版 App 中會返回首頁。");
  };

  const handleAdvancedEdit = (imageUrl: string, destination: string) => {
    console.log(`Standalone Mode: Request to edit ${imageUrl} in ${destination}.`);
    alert(`獨立模式暫不支援跳轉至 ${destination}。但在完整架構中，這會將圖片傳遞給該模組。`);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-[var(--color-text-main)] font-sans">
      <header className="py-4 px-8 border-b border-gray-800 flex justify-between items-center">
        <div>
            <h1 className="text-xl font-bold tracking-widest text-[var(--color-text-title)] uppercase">Virtual Fitting Room</h1>
            <p className="text-xs text-gray-500">Standalone Edition</p>
        </div>
        <div className="text-xs text-gray-600 bg-gray-900 px-2 py-1 rounded">
            Physical Isolation Mode
        </div>
      </header>
      
      <main>
        {/*
          2026-08-04（企劃案 D-2）：這段註解原本寫「我們刻意不傳 masterTaxonomy／
          apparelStructure，元件會自己用 useTaxonomy hook 抓資料」。
          那個 fallback 已經不存在了——那兩個 prop 與 useTaxonomy 呼叫在 VirtualFittingRoom
          裡唯一的用途是餵給從未被渲染的 vtoStructure 死碼，已一併移除。
          現在不傳它們不是「靠 hook 兜底」，而是元件根本不需要。
        */}
        <VirtualFittingRoom 
            onGoHome={handleGoHome}
            onAdvancedEdit={handleAdvancedEdit}
        />
      </main>
    </div>
  );
};

export default StandaloneEntry;
