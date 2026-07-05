
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, useNotification } from '../../context/NotificationContext';
import SparklesIcon from '../../assets/icons/SparklesIcon';
import ChevronLeftIcon from '../../assets/icons/ChevronLeftIcon';
import ChevronRightIcon from '../../assets/icons/ChevronRightIcon';
import CloseIcon from '../../assets/icons/CloseIcon';
import CheckIcon from '../../assets/icons/CheckIcon';
import WarningIcon from '../../assets/icons/WarningIcon';

const TaskMonitor: React.FC = () => {
  const { tasks, removeTask } = useNotification();
  const [isExpanded, setIsExpanded] = useState(true);
  const prevTasksLength = useRef(tasks.length);
  const prevTaskStatuses = useRef<Record<string, string>>({});

  // Auto-expand when new tasks are added or tasks complete/fail
  useEffect(() => {
    try {
      if (!tasks || !Array.isArray(tasks)) return;

      const hasNewTask = tasks.length > prevTasksLength.current;
      const hasStatusUpdate = tasks.some(t => {
        if (!t || !t.id) return false;
        const prevStatus = prevTaskStatuses.current[t.id];
        // Expand if status changed to a final state
        return prevStatus && prevStatus !== t.status && (t.status === 'completed' || t.status === 'failed');
      });

      if (hasNewTask || hasStatusUpdate) {
        setIsExpanded(true);
      }

      // Update refs
      prevTasksLength.current = tasks.length;
      const newStatuses: Record<string, string> = {};
      tasks.forEach(t => {
        if (t && t.id) {
          newStatuses[t.id] = t.status;
        }
      });
      prevTaskStatuses.current = newStatuses;
    } catch (err) {
      console.error('TaskMonitor auto-expand error:', err);
    }
  }, [tasks]);

  if (tasks.length === 0) return null;

  const activeTasks = tasks.filter(t => t.status === 'processing' || t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'failed');

  return (
    <motion.div
      layout
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className={`
        fixed right-6 top-24 z-[60] 
        ${isExpanded ? 'w-72 rounded-2xl h-auto max-h-[400px]' : 'w-12 h-12 rounded-full'}
        border border-[var(--color-border)]
        bg-[var(--color-bg-deep)]/90 backdrop-blur-2xl shadow-2xl overflow-hidden
        transition-all duration-500 flex flex-col
      `}
    >
      {/* Header / Toggle Button */}
      <div className={`flex items-center ${isExpanded ? 'justify-between px-4 border-b border-[var(--color-border)]' : 'justify-center'} h-12 flex-shrink-0`}>
        {isExpanded ? (
          <>
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-[var(--color-gold)] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-main)]">
                AI 任務監控 ({activeTasks.length})
              </span>
            </div>
            <button 
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-white/5 rounded-full transition-colors"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button 
            onClick={() => setIsExpanded(true)}
            className="relative w-full h-full flex items-center justify-center hover:bg-white/5 transition-colors group"
          >
            <ChevronLeftIcon className="w-4 h-4 text-[var(--color-gold)] group-hover:scale-110 transition-transform" />
            {activeTasks.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--color-gold)] rounded-full animate-pulse shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
            )}
          </button>
        )}
      </div>

      {/* Task List */}
      {isExpanded && (
        <div className="overflow-y-auto max-h-[350px] p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {tasks.map(task => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--color-text-main)] truncate max-w-[180px]">
                  {task.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-[var(--color-gold)]">
                    {task.status === 'processing' ? `${Math.round(task.progress)}%` : task.status}
                  </span>
                  {(task.status === 'completed' || task.status === 'failed') && (
                    <button 
                      onClick={() => removeTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <CloseIcon className="w-3 h-3 text-[var(--color-text-dim)]" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${task.progress}%`,
                    backgroundColor: task.status === 'failed' ? '#ef4444' : '#d4af37'
                  }}
                  className="absolute inset-y-0 left-0 shadow-[0_0_8px_rgba(212,175,55,0.5)]"
                />
              </div>

              {/* Status Message */}
              <div className="flex items-center gap-1.5">
                {task.status === 'processing' && (
                  <div className="flex gap-1">
                    <span className="w-1 h-1 rounded-full bg-[var(--color-gold)] animate-bounce" />
                    <span className="w-1 h-1 rounded-full bg-[var(--color-gold)] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1 h-1 rounded-full bg-[var(--color-gold)] animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
                {task.status === 'completed' && <CheckIcon className="w-3 h-3 text-[var(--color-gold)]" />}
                {task.status === 'failed' && <WarningIcon className="w-3 h-3 text-red-500" />}
                <span className="text-[9px] text-[var(--color-text-dim)] italic">
                  {task.status === 'processing' ? '正在調度 GPU 資源...' : 
                   task.status === 'completed' ? '任務已完成' : 
                   task.status === 'failed' ? task.error || '任務中斷' : '等待中...'}
                </span>
              </div>

              {/* Result Preview */}
              {task.status === 'completed' && task.resultUrl && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 rounded-lg border border-[var(--color-border)] overflow-hidden bg-black/20"
                >
                  <img 
                    src={task.resultUrl} 
                    alt="Result" 
                    className="w-full h-20 object-cover hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      )}
    </motion.div>
  );
};

export default TaskMonitor;
