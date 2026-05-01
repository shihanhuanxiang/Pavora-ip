
import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'motion/react';
import { useNotification } from '../../context/NotificationContext';
import Toast from './Toast';
import TaskMonitor from './TaskMonitor';

const NotificationPortal: React.FC = () => {
  const { notifications } = useNotification();

  return createPortal(
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Toast Container */}
      <div className="absolute top-24 right-6 flex flex-col items-end pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {notifications.map(notification => (
            <Toast 
              key={notification.id} 
              notification={notification} 
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Task Monitor Container */}
      <div className="pointer-events-auto">
        <TaskMonitor />
      </div>
    </div>,
    document.body
  );
};

export default NotificationPortal;
