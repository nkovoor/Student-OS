// All dates in this module are plain 'YYYY-MM-DD' strings, handled as UTC
// midnight internally so day-math never drifts across DST/timezone boundaries.

export const MS_PER_DAY = 86400000;

const WEEKDAY_BY_JS_DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, n: number): string {
  const d = parseISODate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toISODate(d);
}

export function diffInDays(fromISO: string, toISO: string): number {
  return Math.round((parseISODate(toISO).getTime() - parseISODate(fromISO).getTime()) / MS_PER_DAY);
}

export function weekdayOf(iso: string): (typeof WEEKDAY_BY_JS_DAY)[number] {
  return WEEKDAY_BY_JS_DAY[parseISODate(iso).getUTCDay()];
}

// Week boundary is fixed to Monday, matching the Availability tab's
// always-Mon-to-Sun row order (spec §11).
export function startOfWeekMonday(iso: string): string {
  const jsDay = parseISODate(iso).getUTCDay(); // 0=Sun..6=Sat
  const offsetFromMonday = (jsDay + 6) % 7; // Mon=0, Tue=1, ..., Sun=6
  return addDays(iso, -offsetFromMonday);
}

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export interface TimeRange {
  startTime: string;
  endTime: string;
}

export function slotDurationMinutes(slot: TimeRange): number {
  return Math.max(0, timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime));
}
