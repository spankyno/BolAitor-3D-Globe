import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type ThemePreference = 'light' | 'dark' | 'system';
const STORAGE_KEY = 'bolaitor-theme';

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  setPreference: (p: ThemePreference) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function readStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);
  const [systemDark, setSystemDark] = useState(getSystemPrefersDark);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resolvedTheme: 'light' | 'dark' = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  const setPreference = (p: ThemePreference) => {
    setPreferenceState(p);
    try {
      if (p === 'system') {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, p);
      }
    } catch {
      // Ignore (private browsing / storage disabled) — the choice just
      // won't persist across reloads.
    }
  };

  const toggle = () => setPreference(resolvedTheme === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ preference, resolvedTheme, setPreference, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>.');
  return ctx;
}
