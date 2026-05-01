import React, { useState } from 'react';
import type { Model, GeneratedLook } from '../../shared/types/types';
import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';

interface ExportProps {
  model: Model;
  look: GeneratedLook | null;
  onGoHome: () => void;
  onGoBack: () => void;
}

const aspectRatios = ['3:4', '9:16', '1:1'];
const formats = ['JPG', 'PNG'];

const Export: React.FC<ExportProps> = ({ model, look, onGoHome, onGoBack }) => {
  const [aspectRatio, setAspectRatio] = useState(aspectRatios[0]);
  const [format, setFormat] = useState(formats[0]);
  
  if (!look) {
    return (
      <div className="text-center p-8">
        <p>沒有可導出的造型。</p>
        <Button onClick={onGoHome} className="mt-4">重新開始</Button>
      </div>
    );
  }

  const lookName = `Look_${look.id}`;
  const date = new Date().toISOString().slice(0,10).replace(/-/g,"");
  const fileName = `${model.id.substring(0,8)}_${lookName}_${date}_v1.${format.toLowerCase()}`;

  return (
    <div className="container mx-auto p-8 max-w-4xl animate-fade-in">
       <div className="flex justify-between items-center mb-6">
        <button onClick={onGoBack} className="text-gray-400 hover:text-white transition-colors text-sm">&larr; 上一頁</button>
        <button onClick={onGoHome} className="text-gray-400 hover:text-white transition-colors text-sm">返回首頁</button>
      </div>
      <h2 className="text-3xl font-bold text-center mb-2 uppercase text-[var(--color-text-title)]">步驟 4: 導出與分享</h2>
      <p className="text-center text-gray-400 mb-8">選擇您的輸出格式並下載您的創作。</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="flex items-center justify-center">
          <img src={look.imageUrl} alt="Final Look" className="max-h-full max-w-full object-contain rounded-md" />
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <h3 className="text-lg font-semibold mb-3">圖片設定</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">長寬比</label>
              <div className="flex flex-wrap gap-2">
                {aspectRatios.map(ar => (
                  <button key={ar} onClick={() => setAspectRatio(ar)} className={`px-4 py-2 text-sm rounded-md ${aspectRatio === ar ? 'bg-white text-gray-900 font-bold' : 'bg-gray-700 hover:bg-gray-600'}`}>{ar}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">格式</label>
               <div className="flex flex-wrap gap-2">
                {formats.map(f => (
                  <button key={f} onClick={() => setFormat(f)} className={`px-4 py-2 text-sm rounded-md ${format === f ? 'bg-white text-gray-900 font-bold' : 'bg-gray-700 hover:bg-gray-600'}`}>{f}</button>
                ))}
              </div>
            </div>
          </Card>
          
          <Card>
            <h3 className="text-lg font-semibold mb-3">社群媒體文案模板</h3>
            <div className="bg-gray-900 p-3 rounded-md text-sm text-gray-300">
                <p className="font-bold">Philipp Plein 虛擬造型 | Pavora AI</p>
                <p className="mt-2 text-gray-400">#PhilippPlein #PavoraAI #VirtualStylist #RockSpirit #AIinFashion</p>
            </div>
          </Card>

          <Button onClick={() => alert(`正在下載: ${fileName}`)} variant="light">
            下載 {fileName}
          </Button>
        </div>
      </div>
       <div className="mt-12 text-center">
        <Button onClick={onGoHome} variant="secondary">
          創建一個新造型
        </Button>
      </div>
    </div>
  );
};

export default Export;
