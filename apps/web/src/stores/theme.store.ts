import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

function applyToDocument(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',

      setTheme: (theme) => {
        applyToDocument(theme);
        set({ theme });
      },

      toggle: () => {
        const next: Theme = get().theme === 'light' ? 'dark' : 'light';
        applyToDocument(next);
        set({ theme: next });
      },
    }),
    {
      name: 'supfile-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyToDocument(state.theme);
      },
    },
  ),
);
