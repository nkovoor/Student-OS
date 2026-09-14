// Data model + the three student actions (complete / partial / skip) plus the
// re-estimate stepper (spec §2, §12).
//
// Unlike the original vanilla-JS prototype, these action functions are pure —
// they return a new item rather than mutating in place. That's a deliberate
// change for the React port: React state (and StrictMode's dev-mode double
// invocation of reducers) assumes updates are pure, and an in-place mutator
// double-applied would silently corrupt state (e.g. a re-estimate delta
// applied twice). Callers (lib/state) are responsible for splicing the
// returned item back into their exams/tasks arrays immutably.

export const IMPORTANCE_WEIGHTS = { high: 3, medium: 2, low: 1 } as const;
export type Importance = keyof typeof IMPORTANCE_WEIGHTS;
export const DEFAULT_IMPORTANCE: Importance = 'medium'; // "tasks default to 2" — spec §2

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

let autoId = 1;
function nextId(prefix: string): string {
  return `${prefix}_${autoId++}`;
}

export interface Topic {
  id: string;
  type: 'topic';
  name: string;
  subject: string;
  dueDate: string; // denormalized from the parent exam's examDate, 'YYYY-MM-DD'
  examId: string;
  estimatedMinutes: number;
  minutesDone: number;
  completed: boolean;
  importance: Importance;
  skipDates: string[];
}

export interface Exam {
  id: string;
  subject: string;
  examDate: string; // 'YYYY-MM-DD'
  topics: Topic[];
}

export interface Task {
  id: string;
  type: 'task';
  subject: string;
  title: string;
  dueDate: string; // 'YYYY-MM-DD'
  estimatedMinutes: number;
  minutesDone: number;
  completed: boolean;
  importance: Importance;
  skipDates: string[];
}

export type WorkItem = Topic | Task;

export interface BookedSlot {
  id: string;
  weekday: Weekday;
  label: string;
  startTime: string; // 'HH:MM'
  endTime: string; // 'HH:MM'
}

export type Availability = Record<Weekday, number>;

export interface CompletionLogEntry {
  itemId: string;
  type: WorkItem['type'];
  subject: string;
  label: string;
  minutes: number;
  date: string;
}

export function createTopic(input: {
  id?: string;
  name: string;
  estimatedMinutes: number;
  importance?: Importance;
}): Topic {
  return {
    id: input.id ?? nextId('topic'),
    type: 'topic',
    name: input.name,
    subject: '', // stamped by createExam
    dueDate: '', // stamped by createExam
    examId: '', // stamped by createExam
    estimatedMinutes: input.estimatedMinutes,
    minutesDone: 0,
    completed: false,
    importance: input.importance ?? DEFAULT_IMPORTANCE,
    skipDates: [],
  };
}

export function createExam(input: {
  id?: string;
  subject: string;
  examDate: string;
  topics?: Topic[];
}): Exam {
  const examId = input.id ?? nextId('exam');
  const topics = (input.topics ?? []).map((topic) => ({
    ...topic,
    subject: input.subject,
    dueDate: input.examDate,
    examId,
  }));
  return { id: examId, subject: input.subject, examDate: input.examDate, topics };
}

export function createTask(input: {
  id?: string;
  subject: string;
  title: string;
  dueDate: string;
  estimatedMinutes: number;
  importance?: Importance;
}): Task {
  return {
    id: input.id ?? nextId('task'),
    type: 'task',
    subject: input.subject,
    title: input.title,
    dueDate: input.dueDate,
    estimatedMinutes: input.estimatedMinutes,
    minutesDone: 0,
    completed: false,
    importance: input.importance ?? DEFAULT_IMPORTANCE,
    skipDates: [],
  };
}

export function createBookedSlot(input: {
  id?: string;
  weekday: Weekday;
  label: string;
  startTime: string;
  endTime: string;
}): BookedSlot {
  return {
    id: input.id ?? nextId('slot'),
    weekday: input.weekday,
    label: input.label,
    startTime: input.startTime,
    endTime: input.endTime,
  };
}

export function createAvailability(dailyMinutesByWeekday: Partial<Record<Weekday, number>> = {}): Availability {
  const availability = {} as Availability;
  for (const day of WEEKDAYS) {
    availability[day] = dailyMinutesByWeekday[day] ?? 0;
  }
  return availability;
}

function labelOf(item: WorkItem): string {
  return item.type === 'topic' ? item.name : item.title;
}

function makeCompletionEntry(item: WorkItem, minutes: number, dateISO: string): CompletionLogEntry {
  return {
    itemId: item.id,
    type: item.type,
    subject: item.subject,
    label: labelOf(item),
    minutes,
    date: dateISO,
  };
}

export interface ActionResult<T extends WorkItem> {
  item: T;
  logEntry: CompletionLogEntry | null;
}

/** "Mark complete" — the hero action. */
export function withComplete<T extends WorkItem>(item: T, dateISO: string): ActionResult<T> {
  const justDone = item.estimatedMinutes - item.minutesDone;
  const updated: T = { ...item, minutesDone: item.estimatedMinutes, completed: true };
  const logEntry = justDone > 0 ? makeCompletionEntry(updated, justDone, dateISO) : null;
  return { item: updated, logEntry };
}

/** "Did some of it" — completes automatically once minutesDone reaches the estimate. */
export function withPartial<T extends WorkItem>(item: T, minutesJustDone: number, dateISO: string): ActionResult<T> {
  const capped = Math.max(0, Math.min(minutesJustDone, item.estimatedMinutes - item.minutesDone));
  const minutesDone = item.minutesDone + capped;
  const updated: T = { ...item, minutesDone, completed: minutesDone >= item.estimatedMinutes };
  const logEntry = capped > 0 ? makeCompletionEntry(updated, capped, dateISO) : null;
  return { item: updated, logEntry };
}

/** "Skip for now" — skips only this one date; the item remains eligible on other days. */
export function withSkippedToday<T extends WorkItem>(item: T, dateISO: string): T {
  if (item.skipDates.includes(dateISO)) return item;
  return { ...item, skipDates: [...item.skipDates, dateISO] };
}

/** Backs the "reset today's skips" text button on Home. */
export function withResetSkip<T extends WorkItem>(item: T, dateISO: string): T {
  return { ...item, skipDates: item.skipDates.filter((d) => d !== dateISO) };
}

/** The inline re-estimate stepper (spec §12) — never lets the estimate drop below work already logged. */
export function withEstimate<T extends WorkItem>(item: T, newEstimatedMinutes: number): T {
  const estimatedMinutes = Math.max(item.minutesDone, newEstimatedMinutes);
  return { ...item, estimatedMinutes, completed: item.minutesDone >= estimatedMinutes };
}
