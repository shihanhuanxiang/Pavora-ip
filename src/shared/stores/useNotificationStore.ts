import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  description?: string;
  duration?: number;
  timestamp: number;
  undoAction?: () => void;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: any) => string;
  removeNotification: (id: string) => void;
  setNotifications: (notifications: Notification[]) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (n: any) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    // Handle both {title, message} and {message, description} formats
    const newNotification: Notification = {
      id,
      type: n.type || 'info',
      message: n.title || n.message || '',
      description: n.title ? n.message : n.description,
      duration: n.duration ?? 5000,
      timestamp: Date.now(),
      undoAction: n.undoAction,
    };
    
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
    }));

    if (newNotification.duration !== Infinity) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((notif) => notif.id !== id),
        }));
      }, newNotification.duration);
    }

    return id;
  },
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  setNotifications: (notifications) => set({ notifications }),
}));
