// Progress tab derived stats (spec §11) — all pure functions of data already
// in StudentOSData, same "recompute from source, never store derived state"
// principle as the planning engine and lib/weekStats.ts.

import { addDays, diffInDays, startOfWeekMonday } from '@/lib/engine';
import type { CompletionLogEntry, Exam, Task } from '@/lib/engine';
import { todayISO } from '@/lib/format';

export interface OverallWorkload {
  totalEstimatedMinutes: number;
  totalMinutesDone: number;
  fraction: number; // 0..1
}

// Workload = every topic across every exam, plus every standalone task —
// same item set the planner draws from (lib/engine/planner.ts's allItems),
// but including completed items too since this is a lifetime total, not
// "what's left to schedule".
export function overallWorkload(exams: Exam[], tasks: Task[]): OverallWorkload {
  const items = [...exams.flatMap((exam) => exam.topics), ...tasks];
  const totalEstimatedMinutes = items.reduce((sum, item) => sum + item.estimatedMinutes, 0);
  const totalMinutesDone = items.reduce((sum, item) => sum + item.minutesDone, 0);
  const fraction = totalEstimatedMinutes > 0 ? totalMinutesDone / totalEstimatedMinutes : 0;
  return { totalEstimatedMinutes, totalMinutesDone, fraction };
}

export interface WeeklyTrendPoint {
  label: string;
  minutes: number;
  isCurrent: boolean;
}

// 4 Mon-Sun weeks ending with the current (possibly partial) week — same
// Monday boundary as lib/weekStats.ts's "this week" window, just widened to
// the 3 weeks before it too.
export function weeklyTrend(completionLog: CompletionLogEntry[], today: string = todayISO()): WeeklyTrendPoint[] {
  const thisWeekStart = startOfWeekMonday(today);
  const labels = ['3 weeks ago', '2 weeks ago', 'Last week', 'This week'];

  return labels.map((label, index) => {
    const weeksBack = labels.length - 1 - index;
    const weekStart = addDays(thisWeekStart, -7 * weeksBack);
    const weekEnd = addDays(weekStart, 6);
    const minutes = completionLog
      .filter((entry) => entry.date >= weekStart && entry.date <= weekEnd)
      .reduce((sum, entry) => sum + entry.minutes, 0);
    return { label, minutes, isCurrent: weeksBack === 0 };
  });
}

export interface ExamReadinessEntry {
  examId: string;
  subject: string;
  examDate: string;
  daysUntil: number;
  fraction: number; // 0..1
  percent: number;
}

// "Active" exams = exam date hasn't passed yet. Sorted soonest-first, same
// urgency-first ordering the rest of the app uses.
export function examReadiness(exams: Exam[], today: string = todayISO()): ExamReadinessEntry[] {
  return exams
    .filter((exam) => exam.examDate >= today)
    .map((exam) => {
      const totalEstimatedMinutes = exam.topics.reduce((sum, topic) => sum + topic.estimatedMinutes, 0);
      const totalMinutesDone = exam.topics.reduce((sum, topic) => sum + topic.minutesDone, 0);
      const fraction = totalEstimatedMinutes > 0 ? totalMinutesDone / totalEstimatedMinutes : 0;
      return {
        examId: exam.id,
        subject: exam.subject,
        examDate: exam.examDate,
        daysUntil: diffInDays(today, exam.examDate),
        fraction,
        percent: Math.round(fraction * 100),
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
}
