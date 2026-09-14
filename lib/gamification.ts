// Gamification math (v2 redesign, Part 3; urgency-weighted XP, daily cap,
// archetypes, and weekly recap added in the Profile-screen pass): pure,
// deterministic functions — same principle as the planning engine itself
// (AI, if any, parses input; code decides outcomes). Nothing here calls an
// API or depends on wall-clock state beyond the `today` argument callers
// already have to pass in.

import { addDays, startOfWeekMonday } from '@/lib/engine';

export const XP_PER_LEVEL = 1000;

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

// Urgency-weighted base XP (replaces the old flat 50 XP/completion): higher
// urgency — lib/engine/planner.ts's computeUrgency, importance weight ÷
// days-remaining, the SAME formula the scheduler ranks work by, not a
// re-derived copy — earns more. Bounded rather than a raw multiply: urgency
// ranges from near-zero (low importance, weeks out) to 3.0 (high importance,
// due today), a ~100x span that would make far-off work feel worthless and
// last-minute work feel like the only thing worth doing. Clamping the
// *input* to [0.1, 3.0] before linearly mapping it onto a [20, 120] XP range
// keeps the ratio to 6x — still a real, felt difference, but calibrated so a
// genuinely middling completion (e.g. medium importance due in 2 days,
// urgency 1.0) lands at ~51 XP — close to the old flat 50 — rather than the
// whole economy jumping to a new scale the moment this ships.
// FLAGGED: floor/ceiling/clamp bounds (20/120, 0.1-3.0) are a first-pass
// calibration, not tuned against real usage yet — easy to retune, they're
// the only four numbers below.
const URGENCY_XP_FLOOR = 20;
const URGENCY_XP_CEILING = 120;
const URGENCY_CLAMP_MIN = 0.1;
const URGENCY_CLAMP_MAX = 3.0;

export function baseXpForUrgency(urgency: number): number {
  const clamped = Math.min(URGENCY_CLAMP_MAX, Math.max(URGENCY_CLAMP_MIN, urgency));
  const t = (clamped - URGENCY_CLAMP_MIN) / (URGENCY_CLAMP_MAX - URGENCY_CLAMP_MIN);
  return Math.round(URGENCY_XP_FLOOR + t * (URGENCY_XP_CEILING - URGENCY_XP_FLOOR));
}

// Partial progress still scales proportionally to how much of the item's
// estimate that action just covered (unchanged principle from the old flat-
// 50 version — doing 50% now and 50% later still sums to the same total the
// item would've earned in one shot) — just applied on top of the new
// urgency-weighted base instead of a constant.
export function xpForCompletion(minutesJustDone: number, estimatedMinutes: number, urgency: number): number {
  if (estimatedMinutes <= 0 || minutesJustDone <= 0) return 0;
  const fraction = Math.min(1, minutesJustDone / estimatedMinutes);
  return Math.round(baseXpForUrgency(urgency) * fraction);
}

// Soft daily XP cap: discourages low-value task-grinding (splitting one
// task into many tiny completions to rack up XP) without a harsh cliff. XP
// earned today under DAILY_XP_CAP is awarded in full; XP that would push the
// day over the cap is halved rather than zeroed, so crossing the cap still
// feels like "less," not "nothing."
// FLAGGED: 350 is a chosen midpoint of the suggested 300-400/day range —
// not tuned against real usage yet, easy to retune (just this one constant,
// or the 0.5 overflow factor below it).
export const DAILY_XP_CAP = 350;
const DAILY_XP_OVERFLOW_FACTOR = 0.5;

export function applyDailyXpCap(rawXp: number, xpAlreadyEarnedToday: number): number {
  if (rawXp <= 0) return 0;
  const remainingBeforeCap = Math.max(0, DAILY_XP_CAP - xpAlreadyEarnedToday);
  if (rawXp <= remainingBeforeCap) return rawXp;
  const overflow = rawXp - remainingBeforeCap;
  return Math.round(remainingBeforeCap + overflow * DAILY_XP_OVERFLOW_FACTOR);
}

export function xpEarnedOnDate(xpLog: XpLogEntry[], date: string): number {
  return xpLog.filter((entry) => entry.date === date).reduce((sum, entry) => sum + entry.xp, 0);
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
// case instead of zeroing out mid-day. A missed day resets to zero — this is
// the confirmed final behavior for now, not a placeholder. Agreed next
// iteration (not scheduled yet — once this ships and there's real usage data
// to design against): a grace mechanic, one protected skip day per week that
// doesn't reset the streak.
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

// --- Archetype ladder (Profile screen, Part D) --------------------------
//
// Pure lookup, same "deterministic, no AI" principle as everything else
// here. maxLevel: null means open-ended — every level from minLevel up maps
// to that tier, so there's no gap to fill in if a student reaches level 20;
// FLAGGED per the brief: if a 5th tier above Luminary is ever wanted, this
// is the one array to extend, nothing else needs to change.
export interface ArchetypeTier {
  minLevel: number;
  maxLevel: number | null;
  title: string;
}

export const ARCHETYPE_TIERS: ArchetypeTier[] = [
  { minLevel: 1, maxLevel: 2, title: 'Apprentice' },
  { minLevel: 3, maxLevel: 5, title: 'Strategist' },
  { minLevel: 6, maxLevel: 8, title: 'Vanguard' },
  { minLevel: 9, maxLevel: null, title: 'Luminary' },
];

export function levelToArchetype(level: number): string {
  const tier = ARCHETYPE_TIERS.find((t) => level >= t.minLevel && (t.maxLevel === null || level <= t.maxLevel));
  return tier?.title ?? ARCHETYPE_TIERS[ARCHETYPE_TIERS.length - 1].title;
}

// --- Weekly recap (Part F.4) ----------------------------------------------
//
// A single calm summary (XP, streak, subject balance) for the week that just
// ended — no push notifications, no nag pattern, shown at most once. "Shown
// once" genuinely means once per session right now: there's no persistence
// layer yet (see the backend contract below), so a session-local dismissed
// flag is the honest version of that until Part G's last-shown-week field
// exists to survive a reload. hasPastWeekToRecap is the trigger condition —
// true once completionLog has at least one entry from before the current
// Mon-Sun week, i.e. a genuine prior week of activity actually happened;
// buildWeeklyRecap computes what to show once that's true.
export interface WeeklyRecap {
  weekStart: string;
  weekEnd: string;
  xpEarned: number;
  streak: number;
  subjectBalance: { subject: string; minutes: number }[];
}

export function hasPastWeekToRecap(completionLog: { date: string }[], today: string): boolean {
  const thisWeekStart = startOfWeekMonday(today);
  return completionLog.some((entry) => entry.date < thisWeekStart);
}

export function buildWeeklyRecap(
  xpLog: XpLogEntry[],
  completionLog: { date: string; subject: string; minutes: number }[],
  streak: number,
  today: string
): WeeklyRecap {
  const thisWeekStart = startOfWeekMonday(today);
  const weekStart = addDays(thisWeekStart, -7);
  const weekEnd = addDays(weekStart, 6);

  const xpEarned = xpLog
    .filter((entry) => entry.date >= weekStart && entry.date <= weekEnd)
    .reduce((sum, entry) => sum + entry.xp, 0);

  const bySubject = new Map<string, number>();
  for (const entry of completionLog) {
    if (entry.date < weekStart || entry.date > weekEnd) continue;
    bySubject.set(entry.subject, (bySubject.get(entry.subject) ?? 0) + entry.minutes);
  }
  const subjectBalance = [...bySubject.entries()]
    .map(([subject, minutes]) => ({ subject, minutes }))
    .sort((a, b) => b.minutes - a.minutes);

  return { weekStart, weekEnd, xpEarned, streak, subjectBalance };
}

// --- Future Supabase schema contract (Part G) -----------------------------
//
// NOT implemented yet — everything above runs against session-only React
// state (StudentOSProvider) for now, per the ground-truth status report
// (auth: not started; database: schema drafted on feature/supabase-
// persistence but never run). Documenting the eventual persisted shape here
// so that phase-2 work (deferred until after exams, per prior agreement)
// has a clear target and doesn't have to re-derive it from scratch:
//
// users: { id, name, email, avatar_url? }
// gamification: {
//   user_id, total_xp, subject_xp: jsonb { [subject]: number },
//   streak_count, last_completion_date,
//   daily_xp_log: jsonb { [date]: number },       // for the soft daily cap
//   last_shown_recap_week: string | null,         // for the weekly recap
// }
//
// archetype and level are always DERIVED from total_xp via xpToLevel() +
// levelToArchetype() above — never stored directly, so a future change to
// the leveling formula can't drift out of sync with a stale stored value.
//
// Do not create a migration for this, do not touch feature/supabase-
// persistence, do not install @supabase/supabase-js or any DB client as
// part of implementing this comment — documentation only.
