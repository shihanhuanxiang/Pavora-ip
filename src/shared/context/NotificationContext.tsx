
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useNotificationStore } from '../stores/useNotificationStore';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  description?: string;
  duration?: number;
  undoAction?: () => void;
  timestamp: number;
}

export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  progress: number;
  resultUrl?: string;
  timestamp: number;
  error?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  tasks: Task[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  addTask: (task: Omit<Task, 'id' | 'timestamp' | 'progress' | 'status'>) => string;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'timestamp'>>) => void;
  removeTask: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { notifications, addNotification: storeAddNotification, removeNotification: storeRemoveNotification, setNotifications } = useNotificationStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const activityLogRef = useRef<(Notification | Task)[]>([]);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = storeAddNotification(n);
    // Find the newly added notification in the store's state
    // Since we can't easily get it immediately from the hook's state, 
    // we reconstruct it for the log
    const newNotification: Notification = {
      ...n,
      id,
      timestamp: Date.now(),
      duration: n.duration ?? 5000,
    } as Notification;
    
    activityLogRef.current = [newNotification, ...activityLogRef.current].slice(0, 50);
    return id;
  }, [storeAddNotification]);

  const removeNotification = useCallback((id: string) => {
    storeRemoveNotification(id);
  }, [storeRemoveNotification]);

  const addTask = useCallback((t: Omit<Task, 'id' | 'timestamp' | 'progress' | 'status'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newTask: Task = {
      ...t,
      id,
      status: 'pending',
      progress: 0,
      timestamp: Date.now(),
    };
    
    setTasks(prev => [newTask, ...prev]);
    activityLogRef.current = [newTask, ...activityLogRef.current].slice(0, 50);
    return id;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Omit<Task, 'id' | 'timestamp'>>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    
    // Update in activity log too
    const logIdx = activityLogRef.current.findIndex(item => 'status' in item && item.id === id);
    if (logIdx !== -1) {
      const task = activityLogRef.current[logIdx] as Task;
      activityLogRef.current[logIdx] = { ...task, ...updates };
    }
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setTasks(prev => prev.filter(t => t.status === 'processing'));
  }, [setNotifications]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      tasks,
      addNotification,
      removeNotification,
      addTask,
      updateTask,
      removeTask,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
