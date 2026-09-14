'use client';

import { useTheme } from '@/lib/theme';

// Placement (v2 redesign, Part 1.2 — "your call, flag where you put it"):
// header top row, next to level badge/streak, since that's the one place
// that's already visible on every screen and isn't crowded with anything
// else. Revisit if a dedicated settings area gets built later.
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      className="theme-toggle-btn"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
