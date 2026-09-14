'use client';

import { useTheme } from '@/lib/theme';

// Part B item 7. Theme is real (reuses the existing global toggleTheme()
// rather than a dead placeholder — the capability already exists and
// wiring it is correct, not scope creep). Notifications is informational
// text, no toggle was asked for. Sign out is an intentional no-op for
// now — no auth exists yet (ground-truth status report: "Not started"),
// so there's nothing to actually sign out of; styled --danger per spec,
// clicking it does nothing.
export function SettingsCard() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="card">
      <h3 className="card-title">Settings</h3>

      <button type="button" className="settings-row settings-row-btn" onClick={toggleTheme}>
        <span className="settings-row-label">Theme</span>
        <span className="settings-row-value">{theme === 'light' ? 'Light' : 'Dark'}</span>
      </button>

      <div className="settings-row">
        <span className="settings-row-label">Notifications</span>
        <span className="settings-row-value">Weekly recap only</span>
      </div>

      <button type="button" className="settings-row settings-row-btn is-danger">
        <span className="settings-row-label">Sign out</span>
      </button>
    </div>
  );
}
