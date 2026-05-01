import React from 'react';
import type { AIDiagnosis } from '../../shared/types/types';
import Card from '../../shared/components/common/Card';
import CloseIcon from '../../shared/assets/icons/CloseIcon';

interface ImageAnalysisOverlayProps {
  diagnosis: AIDiagnosis | null;
  isOpen: boolean;
  onClose: () => void;
}

const ImageAnalysisOverlay: React.FC<ImageAnalysisOverlayProps> = ({ diagnosis, isOpen, onClose }) => {
  if (!isOpen || !diagnosis) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <Card 
        className="bg-gray-800 w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
          <h2 className="text-2xl font-bold text-[var(--color-text-title)]">完整 AI 診斷報告</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-[var(--color-text-title)]">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto pr-4 -mr-4 text-gray-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(Object.keys(diagnosis) as Array<keyof AIDiagnosis>).map((key) => {
              const sectionData = diagnosis[key];
              if (!sectionData) return null;

              return (
                <div key={key} className="bg-gray-900/50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-[var(--color-text-title)] mb-3">{key}</h3>
                  <dl className="space-y-3 text-sm">
                    {Object.entries(sectionData).map(([subKey, subValue]) => (
                      subValue && (
                        <div key={subKey}>
                          <dt className="font-semibold text-gray-400">{subKey}</dt>
                          <dd className="text-gray-200 mt-1 whitespace-pre-wrap">
                            {String(subValue)}
                          </dd>
                        </div>
                      )
                    ))}
                  </dl>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ImageAnalysisOverlay;