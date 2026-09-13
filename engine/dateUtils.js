// All dates in this module are plain 'YYYY-MM-DD' strings, handled as UTC
// midnight internally so day-math never drifts across DST/timezone boundaries.

export const MS_PER_DAY = 86400000;

const WEEKDAY_BY_JS_DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso, n) {
  const d = parseISODate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toISODate(d);
}

export function diffInDays(fromISO, toISO) {
  return Math.round((parseISODate(toISO) - parseISODate(fromISO)) / MS_PER_DAY);
}

export function weekdayOf(iso) {
  return WEEKDAY_BY_JS_DAY[parseISODate(iso).getUTCDay()];
}

// Week boundary is fixed to Monday, matching the Availability tab's
// always-Mon-to-Sun row order (spec §11).
export function startOfWeekMonday(iso) {
  const jsDay = parseISODate(iso).getUTCDay(); // 0=Sun..6=Sat
  const offsetFromMonday = (jsDay + 6) % 7; // Mon=0, Tue=1, ..., Sun=6
  return addDays(iso, -offsetFromMonday);
}

export function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function slotDurationMinutes(slot) {
  return Math.max(0, timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime));
}
