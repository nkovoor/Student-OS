'use client';

// Theme toggle (v2 redesign, Part 1.2): persisted to localStorage since
// there's no `preferences` table yet and it doesn't need to sync across
// devices for a beta. Defaults to light for new visitors, respects the
// stored choice on return visits.
//
// React's own `theme` state always starts at 'light', matching what the
// server rendered (SSR has no access to localStorage) — that's what avoids
// a hydration mismatch. A separate effect then corrects it to 'dark' after
// mount if that's what's stored, which is a normal post-hydration state
// update, not a mismatch. Deliberately, that sync effect only ever READS
// localStorage — it never writes it. An earlier version had it both read
// and (via a second effect keeping the DOM attribute in sync) write on
// every mount, and under React's dev-mode double-invocation of effects,
// the first pass's write silently overwrote a correctly-stored 'dark' with
// the initial 'light' default before the read had taken effect — clobbering
// the real preference. Only toggleTheme() writes now, so there's nothing
// left to race with.
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'student-os-theme';

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    if (window.localStorage.getItem(STORAGE_KEY) === 'dark') setTheme('dark');
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => {
      const next: Theme = current === 'light' ? 'dark' : 'light';
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
