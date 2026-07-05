
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotification } from '../../context/NotificationContext';
import CloseIcon from '../../assets/icons/CloseIcon';
import CheckIcon from '../../assets/icons/CheckIcon';
import WarningIcon from '../../assets/icons/WarningIcon';
import InfoIcon from '../../assets/icons/InfoIcon';
import SparklesIcon from '../../assets/icons/SparklesIcon';

interface ActivityLogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ActivityLog: React.FC<ActivityLogProps> = ({ isOpen, onClose }) => {
  const { notifications, tasks, clearAll } = useNotification();

  // Combine and sort by timestamp
  const allActivities = [
    ...notifications.map(n => ({ ...n, category: 'notification' })),
    ...tasks.map(t => ({ ...t, category: 'task' }))
  ].sort((a, b) => b.timestamp - a.timestamp);

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-[80] w-full max-w-md bg-[var(--color-bg-deep)] border-l border-[var(--color-border)] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-bold uppercase tracking-[0.2em] text-[var(--color-text-main)]">
                  活動紀錄
                </h2>
                <p className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-widest mt-1">
                  Activity Log // Pavora Studio
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={clearAll}
                  className="text-[10px] uppercase tracking-widest text-[var(--color-text-dim)] hover:text-[var(--color-gold)] transition-colors"
                >
                  清除全部
                </button>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {allActivities.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                  <SparklesIcon className="w-12 h-12" />
                  <p className="text-sm uppercase tracking-widest">目前沒有活動紀錄</p>
                </div>
              ) : (
                allActivities.map((item, idx) => (
                  <motion.div 
                    key={`${item.id}-${idx}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex gap-4 group"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {'type' in item ? (
                        item.type === 'success' ? <CheckIcon className="w-4 h-4 text-[var(--color-gold)]" /> :
                        item.type === 'error' ? <WarningIcon className="w-4 h-4 text-red-500" /> :
                        <InfoIcon className="w-4 h-4 text-blue-400" />
                      ) : (
                        <SparklesIcon className="w-4 h-4 text-[var(--color-gold)]" />
                      )}
                    </div>
                    <div className="flex-grow space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-[var(--color-text-dim)]">
                          {formatTime(item.timestamp)}
                        </span>
                        <span className="text-[9px] uppercase tracking-widest text-[var(--color-gold)] opacity-0 group-hover:opacity-100 transition-opacity">
                          {'category' in item && item.category === 'task' ? 'Task' : 'Notification'}
                        </span>
                      </div>
                      <h4 className="text-sm font-medium text-[var(--color-text-main)]">
                        {'message' in item ? item.message : item.name}
                      </h4>
                      {'description' in item && item.description && (
                        <p className="text-xs text-[var(--color-text-dim)] leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      {'status' in item && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-grow h-[1px] bg-[var(--color-border)]" />
                          <span className="text-[9px] uppercase tracking-widest text-[var(--color-text-dim)]">
                            {item.status}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[var(--color-border)] bg-black/20">
              <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.3em] text-[var(--color-text-dim)]">
                <span>Pavora AI System</span>
                <span>v1.0.42</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ActivityLog;
