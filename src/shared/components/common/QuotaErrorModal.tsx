import React from 'react';
import Card from './Card';
import Button from './Button';
import WarningIcon from '../../assets/icons/WarningIcon';

interface QuotaErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AFFECTED_FEATURES = ['模特兒生成', '服裝設計', '靈映疊影'];
const AVAILABLE_FEATURES = ['虛擬試衣間', '妝髮設計', '場景轉移', '幻想系列', 'PCPE 產品海報'];

const QuotaErrorModal: React.FC<QuotaErrorModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <Card 
        className="bg-gray-800 w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
            <WarningIcon className="w-16 h-16 text-yellow-400 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">圖片生成服務暫時無法使用</h2>
          <p className="text-gray-400 mb-6">
            您今日用於「從零生成」全新圖片的 AI 配額已用盡。此模型有較嚴格的用量限制。
          </p>

          <div className="w-full text-left space-y-4">
            <div>
                <h3 className="font-semibold text-red-400 mb-2">受影響的功能：</h3>
                <div className="flex flex-wrap gap-2">
                    {AFFECTED_FEATURES.map(feat => (
                        <span key={feat} className="bg-red-900/50 text-red-300 text-sm px-3 py-1 rounded-full">{feat}</span>
                    ))}
                </div>
            </div>
             <div>
                <h3 className="font-semibold text-green-400 mb-2">仍可使用的功能：</h3>
                 <p className="text-xs text-gray-500 mb-2">以下功能使用不同的 AI 模型，配額獨立計算，您可以繼續使用：</p>
                <div className="flex flex-wrap gap-2">
                    {AVAILABLE_FEATURES.map(feat => (
                        <span key={feat} className="bg-green-900/50 text-green-300 text-sm px-3 py-1 rounded-full">{feat}</span>
                    ))}
                </div>
            </div>
          </div>
          
          <Button onClick={onClose} className="mt-8 w-full text-lg">
            了解
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default QuotaErrorModal;
