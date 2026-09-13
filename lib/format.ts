import { diffInDays, toISODate } from '@/lib/engine';
import type { Theme } from '@/lib/theme';

// Subject color coding — the only way subjects are distinguished anywhere in
// the product. v2's warm blue/orange palette needs different literal hex
// values per theme (e.g. Science's green is brighter in dark mode for
// contrast), not just a straight reuse of one fixed color — taken from the
// two approved mockups.
const SUBJECT_COLORS: Record<Theme, Record<string, string>> = {
  light: {
    Maths: '#2E52D6',
    Science: '#2F9E6E',
    English: '#FF7A1A',
    'Social Science': '#5B3DBF',
  },
  dark: {
    Maths: '#7B93FF',
    Science: '#5FE3A0',
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
