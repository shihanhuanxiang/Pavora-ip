import React, { useState, useCallback } from 'react';
import type { ApparelItem } from '../../shared/types/types';
import Button from '../../shared/components/common/Button';
import Card from '../../shared/components/common/Card';

interface WardrobeUploadProps {
  onItemsConfirm: (items: ApparelItem[]) => void;
  onGoBack: () => void;
  onGoHome: () => void;
}

const WardrobeUpload: React.FC<WardrobeUploadProps> = ({ onItemsConfirm, onGoBack, onGoHome }) => {
  const [items, setItems] = useState<ApparelItem[]>([]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const newItems: ApparelItem[] = files.map((file: File) => ({
        id: `item-${Date.now()}-${Math.random()}`,
        name: file.name,
        file: file,
        previewUrl: URL.createObjectURL(file),
      }));
      setItems(prevItems => [...prevItems, ...newItems]);
    }
  };

  const removeItem = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };
  
  const handleSubmit = useCallback(() => {
    if (items.length > 0) {
      onItemsConfirm(items);
    }
  }, [items, onItemsConfirm]);


  return (
    <div className="container mx-auto p-8 max-w-4xl animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onGoBack} className="text-gray-400 hover:text-white transition-colors text-sm">&larr; 上一頁</button>
        <button onClick={onGoHome} className="text-gray-400 hover:text-white transition-colors text-sm">返回首頁</button>
      </div>
      <h2 className="text-3xl font-bold text-center mb-2 uppercase text-[var(--color-text-title)]">步驟 2: 虛擬衣櫥</h2>
      <p className="text-center text-gray-400 mb-8">上傳服裝與配件圖片。將嚴格按照上傳順序應用。</p>

      <div className="mb-8">
        <label htmlFor="items-upload" className="w-full bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg p-10 text-center cursor-pointer hover:border-white transition-colors block">
          <p className="text-gray-400">點擊或拖曳檔案至此</p>
          <p className="text-xs text-gray-500 mt-1">建議上傳至少4件物品 (PNG, JPG)</p>
        </label>
        <input id="items-upload" type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} />
      </div>

      {items.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">已上傳物品 (應用順序)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {items.map((item, index) => (
              <Card key={item.id} className="relative group">
                <div className="absolute top-2 right-2 bg-white text-gray-900 rounded-full h-6 w-6 flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <img src={item.previewUrl} alt={item.name} className="w-full h-32 object-contain rounded-md" />
                <p className="text-xs mt-2 truncate">{item.name}</p>
                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ top: '-8px', right: '-8px' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12 text-center">
        <Button onClick={handleSubmit} disabled={items.length < 1} className="text-xl py-4 uppercase">
          開始生成
        </Button>
      </div>
    </div>
  );
};

export default WardrobeUpload;