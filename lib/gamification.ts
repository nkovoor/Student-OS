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
// re-derived copy — earns more. Bounded rather than a raw multiply, since
// urgency itself spans a ~100x range and an unclamped multiply would make
// far-off work feel worthless and last-minute work feel like the only thing
// worth doing.
//
// CLAMP_MIN/MAX are pinned to the engine's own real output, not guessed: run
// against every (importance x days-remaining) combination a student would
// realistically hit — 1/2/3/5/7/10/14/21/30 days out, all three importance
// levels, 27 combinations total — urgency ranges exactly from 0.0333 (low
// importance, 30 days out: weight 1 / 30 days) up to 3.0 (high importance,
// due today/tomorrow: weight 3 / 1 day). CLAMP_MAX=3.0 needed no change —
// it already matched the real ceiling exactly. CLAMP_MIN was 0.1 at first
// (a guess), which sat ABOVE the real floor of 0.0333: every low-importance
// item 10+ days out — a meaningful slice of realistic scenarios — was
// clamping to the same value and losing exactly the differentiation this
// whole system exists to provide. Now set to the exact computed floor
// (1/30), not rounded to something tidier, so nothing realistic clamps away.
//
// FLOOR/CEILING (20/120 XP) were checked against that same 27-scenario
// spread and left unchanged — 120 XP is reached only at the genuine max
// (urgency 3.0), 20 XP is the genuine floor once CLAMP_MIN reflects reality,
// and the "middling completion lands near the old flat 50" calibration goal
// still holds after the clamp fix (urgency 1.0 -> 53 XP, was 51).
//
// FLAGGED: this is realistic-scenario simulation against the engine's own
// output, not real usage data — there is none yet (no persistence, no live
// students). Revisit once there is.
const URGENCY_XP_FLOOR = 20;
const URGENCY_XP_CEILING = 120;
const URGENCY_CLAMP_MIN = 1 / 30; // exact real floor: low importance, 30 days out
const URGENCY_CLAMP_MAX = 3.0; // exact real ceiling: high importance, due today — unchanged, already correct

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

// Soft daily XP cap: discourages low-value task-grinding without a harsh
// cliff. XP earned today under DAILY_XP_CAP is awarded in full; XP that
// would push the day over the cap is halved rather than zeroed, so crossing
// it still feels like "less," not "nothing."
//
// 350 (a guessed midpoint of a suggested 300-400 range) turned out to be
// too LOW once checked against a real simulated day: generatePlan() run
// against a genuinely realistic "two exams within a few days" cram day —
// two 2-topic exams, 240 realistic study minutes, all four 60-minute topics
// completed — produced 378 raw XP (120+120+69+69, urgency-weighted), which
// the old 350 cap would have clipped on a LEGITIMATE demanding day, exactly
// what this mechanism is supposed to avoid. (Lighter days stayed far under
// either cap: a 1-item light day = 20 XP, a 2-item normal day = 65 XP.)
//
// Set to 450 — ~19% headroom over that 378 XP heaviest-realistic-day figure,
// confirmed by replaying that same day's four completions through the cap
// sequentially (not just checking the sum): every block was awarded in
// full, none reduced. One real tension surfaced by this same check, flagged
// rather than resolved silently: at 450, the illustrative "20+ low-value
// items" grinding case (20 items x ~21 XP each = 420 raw) no longer
// triggers the cap at all — it takes ~22 same-profile items before any
// reduction kicks in. Raising the cap to clear a genuine heavy day and
// keeping it tight against grinding pull in opposite directions; 450
// resolves that in favor of never punishing real studying, since urgency-
// weighting itself already taxes low-value grinding (each such item only
// earns ~20-21 XP versus up to 120 for genuinely urgent work) — but a
// tighter cap (nearer 400) is the other reasonable answer if blocking
// exactly "20+" is meant literally rather than illustratively.
//
// FLAGGED: realistic-scenario simulation, not real usage data — there is
// none yet (no persistence, no live students). Revisit once there is.
export const DAILY_XP_CAP = 450;
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
