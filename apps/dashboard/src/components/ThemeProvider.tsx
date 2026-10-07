'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { THEMES, Theme, getTheme, themeToCSS, DEFAULT_THEME } from '@/lib/themes';

interface ThemeContextType {
  theme: Theme;
  themeId: string;
  setTheme: (id: string) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState(DEFAULT_THEME);
  const theme = getTheme(themeId);

  useEffect(() => {
    const saved = localStorage.getItem('forgeos-theme');
    if (saved && THEMES.find(t => t.id === saved)) {
      setThemeId(saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.cssText += themeToCSS(theme);
    document.documentElement.setAttribute('data-theme', theme.id);
    document.documentElement.setAttribute('data-mode', theme.mode);
    localStorage.setItem('forgeos-theme', themeId);
  }, [theme, themeId]);

  return (
    <ThemeContext.Provider value={{ theme, themeId, setTheme: setThemeId, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
