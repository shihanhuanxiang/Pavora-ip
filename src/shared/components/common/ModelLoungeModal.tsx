import React from 'react';
import { getModels } from '../../services/storageService';
import type { Model } from '../../types/types';
import Card from './Card';
import Button from './Button';

interface ModelLoungeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (model: Model) => void;
}

const ModelLoungeModal: React.FC<ModelLoungeModalProps> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;
  const models = getModels();

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-white">從模特兒休息室選擇</h3>
            <Button onClick={onClose} variant="secondary" className="py-1 px-3">&times;</Button>
        </div>
        {models.length > 0 ? (
          <div className="overflow-y-auto grid grid-cols-4 gap-4 pr-2">
            {models.map(model => (
              <Card key={model.id} className="p-2 cursor-pointer" onClick={() => onSelect(model)}>
                <img src={model.imageUrl} alt={model.name} className="w-full h-48 object-cover object-top rounded-md bg-gray-700" />
                <p className="text-sm mt-2 truncate">{model.name}</p>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">您的模特兒休息室是空的。</p>
        )}
      </div>
    </div>
  );
};

export default ModelLoungeModal;