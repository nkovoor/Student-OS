import { diffInDays, toISODate } from '@/lib/engine';
import type { Theme } from '@/lib/theme';

// Subject color coding — the only way subjects are distinguished anywhere in
// the product. Per design-spec-v2.md §2.1's subject color table: Maths and
// Social Science use the theme's own --blue/--indigo tokens (so they stay
// legible after a theme toggle), while Science is a fixed green — the SAME
// hex in both themes, not a brightened dark-mode variant. The two approved
// mockups actually render Maths/Science slightly differently in dark mode
// (#7B93FF and #5FE3A0) than this table specifies; the spec is later and
// explicitly marked "FINAL — colors locked" and calls this exact table out
// as a correction to the mockups' draft version, so it wins here.
const SUBJECT_COLORS: Record<Theme, Record<string, string>> = {
  light: {
    Maths: '#2E52D6',
    Science: '#2F9E6E',
    English: '#FF7A1A',
    'Social Science': '#5B3DBF',
  },
  dark: {
    Maths: '#4C6EF5',
    Science: '#2F9E6E',
    English: '#FF7A1A',
    'Social Science': '#8B5CF6',
  },
};
const SUBJECT_FALLBACK: Record<Theme, string> = {
  light: '#7B7E93',
  dark: '#8C89A8',
};

export function subjectColor(subject: string, theme: Theme): string {
  return SUBJECT_COLORS[theme][subject] || SUBJECT_FALLBACK[theme];
}

// Profile screen's per-subject progress bars (Part D) want each subject's
// own color gradating "into its own lighter variant" — there's no existing
// token for that (only Maths/Social Science alias --blue-2/--indigo, and
// only in one direction; Science and English have no lighter-variant token
// at all), so this computes one from any subject's hex directly rather than
// inventing 4 more one-off tokens. amount is 0..1 toward white.
export function lightenHex(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const lighten = (channel: number) => Math.round(channel + (255 - channel) * amount);
  return `#${[lighten(r), lighten(g), lighten(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function formatDueMeta(dueDateISO: string, referenceISO: string = todayISO()): string {
  const days = diffInDays(referenceISO, dueDateISO);
  if (days < 0) return `Overdue ${Math.abs(days)}d`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days}d`;
}
