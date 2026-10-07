'use client';

import { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeSwitcher() {
  const { theme, themeId, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all hover:scale-105"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
        title={`Theme: ${theme.name}`}
      >
        <Palette className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
        <span className="hidden sm:inline">{theme.name}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl p-3 grid grid-cols-2 gap-2"
               style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); setOpen(false); }}
                className="flex items-center gap-2 p-2 rounded-lg text-left transition-all hover:scale-[1.02]"
                style={{ 
                  background: themeId === t.id ? 'var(--accent-glow)' : 'var(--surface)',
                  border: `1px solid ${themeId === t.id ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                <div className="flex -space-x-1">
                  <div className="w-4 h-4 rounded-full border border-white/20" style={{ background: t.colors.accent }} />
                  <div className="w-4 h-4 rounded-full border border-white/20" style={{ background: t.colors.accentSecondary }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{t.name}</p>
                  <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{t.mode}</p>
                </div>
                {themeId === t.id && <Check className="h-3 w-3" style={{ color: 'var(--accent)' }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
