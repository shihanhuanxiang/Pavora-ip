
import React, { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';
import KeyIcon from '../../assets/icons/KeyIcon';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose?: () => void; // Optional if forced
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('PAVORA_API_KEY');
    if (stored) setKey(stored);
  }, [isOpen]);

  const handleSave = () => {
    if (key.trim()) {
      localStorage.setItem('PAVORA_API_KEY', key.trim());
      // Reload to apply (or we could use a context, but reload is safer for clearing old clients)
      if (confirm('金鑰已儲存。為了確保所有模組生效，頁面將重新整理。')) {
          window.location.reload();
      }
    } else {
        localStorage.removeItem('PAVORA_API_KEY');
        if (onClose) onClose();
    }
  };

  const handleClear = () => {
      localStorage.removeItem('PAVORA_API_KEY');
      setKey('');
      if (confirm('金鑰已移除。頁面將重新整理。')) {
          window.location.reload();
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] animate-fade-in">
      <Card className="w-full max-w-md p-6 bg-gray-900 border border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[var(--color-gold)] rounded-full text-black">
            <KeyIcon className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">設定 API Key</h2>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          Pavora 需要 Google Gemini API 金鑰才能運作。您的金鑰將僅儲存在您瀏覽器的 <strong>LocalStorage</strong> 中，不會傳送至我們的伺服器。
        </p>

        <div className="space-y-4">
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="貼上您的 API Key (AIza...)"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[var(--color-gold)] outline-none pr-10"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showKey ? '隱藏' : '顯示'}
            </button>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">儲存金鑰</Button>
            <Button onClick={handleClear} variant="secondary" className="bg-red-900/50 text-red-300">移除</Button>
          </div>
          
          {onClose && (
              <button onClick={onClose} className="w-full text-center text-gray-500 text-sm hover:text-white mt-2">
                  暫不設定 (可能會無法使用部分功能)
              </button>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800">
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-[var(--color-gold)] hover:underline"
          >
            <span>前往 Google AI Studio 取得金鑰</span>
            <span className="text-xs">↗</span>
          </a>
        </div>
      </Card>
    </div>
  );
};

export default ApiKeyModal;
