import React from 'react';
import Card from './Card';
import Button from './Button';
import WarningIcon from '../../assets/icons/WarningIcon';

interface PaidFeatureModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const PaidFeatureModal: React.FC<PaidFeatureModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] animate-fade-in" onClick={onCancel}>
      <Card className="bg-gray-900 border border-yellow-600/50 w-full max-w-md p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-yellow-900/30 rounded-full flex items-center justify-center mb-4">
             <WarningIcon className="w-8 h-8 text-yellow-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">付費功能確認</h3>
          <p className="text-gray-300 text-sm mb-6 leading-relaxed">
            此操作將使用 <span className="text-yellow-400 font-semibold">Gemini 3 Pro</span> 或 <span className="text-yellow-400 font-semibold">Veo</span> 高階模型。
            <br/><br/>
            這屬於付費 API 功能，可能會產生額外費用。請確認您已了解並同意繼續。
          </p>
          <div className="flex gap-3 w-full">
            <Button variant="secondary" onClick={onCancel} className="flex-1">取消</Button>
            <Button onClick={onConfirm} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white border-none">確認繼續</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PaidFeatureModal;