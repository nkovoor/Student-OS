// Data model + the three student actions (complete / partial / skip) plus the
// re-estimate stepper (spec §2, §12). Pure data + mutators — no rendering,
// no persistence. The planner (planner.js) treats all of this as read-only
// input and never writes back to it.

export const IMPORTANCE_WEIGHTS = Object.freeze({ high: 3, medium: 2, low: 1 });
export const DEFAULT_IMPORTANCE = 'medium'; // "tasks default to 2" — spec §2
export const WEEKDAYS = Object.freeze(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);

let autoId = 1;
function nextId(prefix) {
  return `${prefix}_${autoId++}`;
}

/**
 * @typedef {Object} Topic
 * @property {string} id
 * @property {'topic'} type
 * @property {string} name
 * @property {string} subject      denormalized from the parent exam
 * @property {string} dueDate      denormalized from the parent exam's examDate, 'YYYY-MM-DD'
 * @property {string} examId
 * @property {number} estimatedMinutes
 * @property {number} minutesDone
 * @property {boolean} completed
 * @property {'high'|'medium'|'low'} importance
 * @property {string[]} skipDates  'YYYY-MM-DD' dates this topic was skipped for
 */

export function createTopic({ id, name, estimatedMinutes, importance = DEFAULT_IMPORTANCE }) {
  return {
    id: id || nextId('topic'),
    type: 'topic',
    name,
    subject: null, // stamped by createExam
    dueDate: null, // stamped by createExam
    examId: null, // stamped by createExam
    estimatedMinutes,
    minutesDone: 0,
    completed: false,
    importance,
    skipDates: [],
  };
}

/**
 * @typedef {Object} Exam
 * @property {string} id
 * @property {string} subject
 * @property {string} examDate 'YYYY-MM-DD'
 * @property {Topic[]} topics
 */

export function createExam({ id, subject, examDate, topics = [] }) {
  const examId = id || nextId('exam');
  const stampedTopics = topics.map((topic) => ({
    ...topic,
    subject,
    dueDate: examDate,
    examId,
  }));
  return { id: examId, subject, examDate, topics: stampedTopics };
}

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {'task'} type
 * @property {string} subject
 * @property {string} title
 * @property {string} dueDate 'YYYY-MM-DD'
 * @property {number} estimatedMinutes
 * @property {number} minutesDone
 * @property {boolean} completed
 * @property {'high'|'medium'|'low'} importance
 * @property {string[]} skipDates
 */

export function createTask({ id, subject, title, dueDate, estimatedMinutes, importance = DEFAULT_IMPORTANCE }) {
  return {
    id: id || nextId('task'),
    type: 'task',
    subject,
    title,
    dueDate,
    estimatedMinutes,
    minutesDone: 0,
    completed: false,
    importance,
    skipDates: [],
  };
}

/**
 * @typedef {Object} BookedSlot permanent recurring weekly slot the planner will never schedule over
 * @property {string} id
 * @property {string} weekday 'Mon'..'Sun'
 * @property {string} label
 * @property {string} startTime 'HH:MM'
 * @property {string} endTime 'HH:MM'
 */

export function createBookedSlot({ id, weekday, label, startTime, endTime }) {
  return { id: id || nextId('slot'), weekday, label, startTime, endTime };
}

/**
 * @param {Partial<Record<'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun', number>>} dailyMinutesByWeekday
 * @returns {Record<string, number>} every weekday present, defaulting to 0
 */
export function createAvailability(dailyMinutesByWeekday = {}) {
  const availability = {};
  for (const day of WEEKDAYS) {
    availability[day] = dailyMinutesByWeekday[day] ?? 0;
  }
  return availability;
}

// --- The three adaptive-loop actions, plus re-estimate (spec §2, §9, §12) ---
// Each of these is the trigger for an immediate full-plan recompute; the
// mutation itself is just plain object bookkeeping.

/** Mark complete (spec: "Mark complete" hero action). */
export function markComplete(item, dateISO, completionLog) {
  const justDone = item.estimatedMinutes - item.minutesDone;
  item.minutesDone = item.estimatedMinutes;
  item.completed = true;
  if (justDone > 0) logCompletion(completionLog, item, justDone, dateISO);
}

/** "Did some of it" — partial progress; completes automatically once minutesDone reaches the estimate. */
export function markPartial(item, minutesJustDone, dateISO, completionLog) {
  const capped = Math.max(0, Math.min(minutesJustDone, item.estimatedMinutes - item.minutesDone));
  item.minutesDone += capped;
  item.completed = item.minutesDone >= item.estimatedMinutes;
  if (capped > 0) logCompletion(completionLog, item, capped, dateISO);
}

/** "Skip for now" — skips only this one date; the item remains eligible on other days. */
export function markSkippedToday(item, dateISO) {
  if (!item.skipDates.includes(dateISO)) item.skipDates.push(dateISO);
}

/** Backs the "reset today's skips" text button on Home. */
export function resetSkip(item, dateISO) {
  item.skipDates = item.skipDates.filter((d) => d !== dateISO);
}

/** The inline re-estimate stepper (spec §12) — never lets the estimate drop below work already logged. */
export function setEstimate(item, newEstimatedMinutes) {
  item.estimatedMinutes = Math.max(item.minutesDone, newEstimatedMinutes);
  item.completed = item.minutesDone >= item.estimatedMinutes;
}

function logCompletion(completionLog, item, minutes, dateISO) {
  completionLog.push({
    itemId: item.id,
    type: item.type,
    subject: item.subject,
    label: item.name ?? item.title,
    minutes,
    date: dateISO,
  });
}
