import { diffInDays, toISODate } from '@/lib/engine';

// Subject color coding (spec §4) — the only way subjects are distinguished
// anywhere in the product.
const SUBJECT_COLORS: Record<string, string> = {
  Maths: '#3557A6',
  Science: '#2F7A5E',
  English: '#A6453B',
  'Social Science': '#7A5EA6',
};
const SUBJECT_FALLBACK = '#6B6558';

export function subjectColor(subject: string): string {
  return SUBJECT_COLORS[subject] || SUBJECT_FALLBACK;
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
