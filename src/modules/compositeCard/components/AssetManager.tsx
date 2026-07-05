
import React, { memo } from 'react';
import Card from '../../../shared/components/common/Card';
import type { CardAsset } from '../../../shared/types/types';

interface AssetManagerProps {
  assets: CardAsset[];
  onAddAssets: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAsset: (id: string) => void;
}

const AssetManager: React.FC<AssetManagerProps> = ({ assets, onAddAssets, onRemoveAsset }) => {
  return (
    <Card>
      <h3 className="text-lg font-bold text-[var(--color-gold)] mb-4 border-l-4 border-[var(--color-gold)] pl-3">2. 素材庫 ({assets.length})</h3>
      <div className="grid grid-cols-4 gap-2 mb-4 max-h-40 overflow-y-auto custom-scrollbar pr-1">
        {assets.map(a => (
          <div key={a.id} className="relative aspect-square rounded overflow-hidden group border border-gray-700">
            <img src={a.src} className="w-full h-full object-cover" />
            <button 
              onClick={() => onRemoveAsset(a.id)} 
              className="absolute top-0 right-0 bg-red-600 text-white p-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
            >
              &times;
            </button>
          </div>
        ))}
        <label className="aspect-square border-2 border-dashed border-gray-700 rounded flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors bg-black/20">
          <span className="text-gray-500 text-2xl">+</span>
          <input type="file" multiple className="hidden" onChange={onAddAssets} />
        </label>
      </div>
    </Card>
  );
};

export default memo(AssetManager);
