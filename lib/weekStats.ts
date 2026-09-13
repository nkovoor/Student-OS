import { startOfWeekMonday } from '@/lib/engine';
import type { CompletionLogEntry } from '@/lib/engine';
import { todayISO } from '@/lib/format';

// "This week" is Monday through today (inclusive) — same window the engine
// uses for the capacity delta, so the doughnut, the stat row, and the
// capacity read are always talking about the same period.
export function thisWeekBySubject(
  completionLog: CompletionLogEntry[],
  today: string = todayISO()
): { subject: string; minutes: number }[] {
  const weekStart = startOfWeekMonday(today);
  const bySubject = new Map<string, number>();

  for (const entry of completionLog) {
    if (entry.date < weekStart || entry.date > today) continue;
    bySubject.set(entry.subject, (bySubject.get(entry.subject) ?? 0) + entry.minutes);
  }

  return [...bySubject.entries()].map(([subject, minutes]) => ({ subject, minutes }));
}

export function thisWeekTotalMinutes(completionLog: CompletionLogEntry[], today: string = todayISO()): number {
  return thisWeekBySubject(completionLog, today).reduce((sum, entry) => sum + entry.minutes, 0);
}
