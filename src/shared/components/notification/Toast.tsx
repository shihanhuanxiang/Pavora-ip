
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Notification, useNotification } from '../../context/NotificationContext';
import CheckIcon from '../../assets/icons/CheckIcon';
import WarningIcon from '../../assets/icons/WarningIcon';
import InfoIcon from '../../assets/icons/InfoIcon';
import CloseIcon from '../../assets/icons/CloseIcon';

interface ToastProps {
  notification: Notification;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ notification }) => {
  const { removeNotification } = useNotification();
  const { id, type, message, description, undoAction } = notification;

  const onClose = (id: string) => removeNotification(id);

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckIcon className="w-5 h-5 text-[var(--color-gold)]" />;
      case 'error': return <WarningIcon className="w-5 h-5 text-red-500" />;
      case 'warning': return <WarningIcon className="w-5 h-5 text-orange-400" />;
      case 'info': return <InfoIcon className="w-5 h-5 text-blue-400" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success': return 'border-[var(--color-gold)]/50';
      case 'error': return 'border-red-500/50';
      case 'warning': return 'border-orange-400/50';
      case 'info': return 'border-blue-400/50';
    }
  };

  const getGlowEffect = () => {
    switch (type) {
      case 'success': return 'shadow-[0_0_15px_rgba(212,175,55,0.2)]';
      case 'error': return 'shadow-[0_0_15px_rgba(239,68,68,0.2)]';
      case 'warning': return 'shadow-[0_0_15px_rgba(251,146,60,0.2)]';
      case 'info': return 'shadow-[0_0_15px_rgba(96,165,250,0.2)]';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`
        relative w-80 mb-3 p-4 rounded-xl border ${getBorderColor()} ${getGlowEffect()}
        bg-[var(--color-bg-deep)]/80 backdrop-blur-xl flex gap-4 group overflow-hidden
      `}
    >
      {/* Shimmer effect background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      
      <div className="flex-grow min-w-0">
        <h4 className="text-sm font-bold text-[var(--color-text-main)] tracking-tight">
          {message}
        </h4>
        {description && (
          <p className="text-xs text-[var(--color-text-dim)] mt-1 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
        
        {undoAction && (
          <button 
            onClick={() => { undoAction(); onClose(id); }}
            className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-gold)] hover:underline"
          >
            Undo
          </button>
        )}
      </div>
      
      <button 
        onClick={() => onClose(id)}
        className="flex-shrink-0 text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] transition-colors"
      >
        <CloseIcon className="w-4 h-4" />
      </button>

      {/* Progress bar for auto-dismiss */}
      {notification.duration !== Infinity && (
        <motion.div 
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: (notification.duration || 5000) / 1000, ease: 'linear' }}
          className={`absolute bottom-0 left-0 h-[2px] ${getBorderColor().replace('border-', 'bg-')}`}
        />
      )}
    </motion.div>
  );
};

export default Toast;
