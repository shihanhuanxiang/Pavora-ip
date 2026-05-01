import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ProjectMode = 'commerce' | 'ip_creator';

interface AppState {
  projectMode: ProjectMode;
  setProjectMode: (mode: ProjectMode) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      projectMode: 'ip_creator',
      setProjectMode: (mode) => {
        // Update CSS Variables dynamically for theme shift
        const root = document.documentElement;
        if (mode === 'commerce') {
          root.style.setProperty('--color-gold', '#60a5fa'); // Blue
          root.style.setProperty('--color-gold-rgb', '96, 165, 250');
        } else {
          root.style.setProperty('--color-gold', '#d4af37'); // Gold
          root.style.setProperty('--color-gold-rgb', '212, 175, 55');
        }
        set({ projectMode: mode });
      },
    }),
    {
      name: 'pavora-app-store',
    }
  )
);
