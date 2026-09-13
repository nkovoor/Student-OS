// Gamification math (v2 redesign, Part 3): pure, deterministic functions —
// same principle as the planning engine itself (AI, if any, parses input;
// code decides outcomes). Nothing here calls an API or depends on wall-clock
// state beyond the `today` argument callers already have to pass in.

import { addDays, startOfWeekMonday } from '@/lib/engine';

export const XP_PER_LEVEL = 1000;
export const XP_PER_COMPLETION = 50;

export interface LevelProgress {
  level: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  progressFraction: number; // 0..1, for the XP bar fill
}

// Flat 1000 XP per level, per the brief: "simplest possible version — we can
// make it curve later if it feels off in testing." Level 1 starts at 0 XP.
export function xpToLevel(totalXp: number): LevelProgress {
  const safeXp = Math.max(0, totalXp);
  const level = Math.floor(safeXp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = safeXp % XP_PER_LEVEL;
  return {
    level,
    xpIntoLevel,
    xpToNextLevel: XP_PER_LEVEL - xpIntoLevel,
    progressFraction: xpIntoLevel / XP_PER_LEVEL,
  };
}

// Flat 50 XP for a full completion. Partial progress scales proportionally
// to how much of the item's estimate that action just covered, so doing
// 50% of a task now and the other 50% later still sums to the same 50 XP
// the item would've earned in one shot — recommended over an all-or-nothing
// flat award, which would give 0 XP for doing 90% of something.
export function xpForCompletion(minutesJustDone: number, estimatedMinutes: number): number {
  if (estimatedMinutes <= 0 || minutesJustDone <= 0) return 0;
  const fraction = Math.min(1, minutesJustDone / estimatedMinutes);
  return Math.round(XP_PER_COMPLETION * fraction);
}

export interface XpLogEntry {
  date: string;
  xp: number;
}

// "This week" here is Monday through today, inclusive — same window
// lib/weekStats.ts uses for minutes, so the XP figure and the minutes figure
// on Home's stat row are always describing the same period even though
// they're tracked as two separate logs (XP isn't stored on the engine's own
// completionLog — that's kept purely about the planning data, gamification
// stays a layer on top, per the brief's architecture principle).
export function thisWeekXp(xpLog: XpLogEntry[], today: string): number {
  const weekStart = startOfWeekMonday(today);
  return xpLog
    .filter((entry) => entry.date >= weekStart && entry.date <= today)
    .reduce((sum, entry) => sum + entry.xp, 0);
}

// Consecutive days with at least one completed item, counting back from
// today. If today has nothing logged yet, that alone doesn't break the
// streak — the day isn't over — so counting starts from yesterday in that
// case instead of zeroing out mid-day. A missed day (two or more days with
// nothing) resets to zero: the simplest correct version per the brief; a
// grace/freeze mechanic is explicitly left open for later.
export function computeStreak(completionLog: { date: string }[], today: string): number {
  const activeDates = new Set(completionLog.map((entry) => entry.date));

  let cursor = activeDates.has(today) ? today : addDays(today, -1);
  if (!activeDates.has(cursor)) return 0;

  let streak = 0;
  while (activeDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
