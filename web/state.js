// Bridges UI actions to the planning engine. Holds the only mutable copy of
// the student's data; every mutation goes through a model.js action and is
// immediately followed by a full plan recompute (spec §2: the plan is never
// stored, it's recomputed fresh from current data on every render).
//
// There's no Home/Scheduler page yet to display the plan, but the recompute
// still runs on every change and is exposed on window.__studentOS for manual
// verification in devtools, and logged to the console.

import {
  createAvailability,
  createExam,
  createTopic,
  createTask,
  createBookedSlot,
  markComplete,
  markSkippedToday,
  setEstimate,
  generatePlan,
} from './engine.js';
import { todayISO } from './format.js';

export const DEFAULT_TOPIC_ESTIMATE_MINUTES = 30;
export const ESTIMATE_STEP_MINUTES = 5;
export const MIN_ESTIMATE_MINUTES = 5;

export class AppState {
  constructor() {
    this.exams = [];
    this.tasks = [];
    this.availability = createAvailability({});
    this.bookedSlots = [];
    this.completionLog = [];
    this.previousPlan = null;
    this.listeners = new Set();
    this.recompute();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // Deferred to a microtask so the re-render (which rebuilds the DOM the
  // triggering event came from) never runs inside the same synchronous
  // dispatch as the click/change event that caused it — doing that
  // synchronously can race the browser's own focus/blur handling on the
  // element being replaced and throw a NotFoundError on replaceChildren.
  notify() {
    if (this._notifyScheduled) return;
    this._notifyScheduled = true;
    queueMicrotask(() => {
      this._notifyScheduled = false;
      const plan = this.recompute();
      for (const fn of this.listeners) fn(this, plan);
    });
  }

  recompute() {
    const plan = generatePlan({
      exams: this.exams,
      tasks: this.tasks,
      availability: this.availability,
      bookedSlots: this.bookedSlots,
      today: todayISO(),
      completionLog: this.completionLog,
      previousPlan: this.previousPlan,
    });
    this.previousPlan = plan;

    if (typeof window !== 'undefined') {
      window.__studentOS = { state: this, plan };
    }
    console.debug('[student-os] plan recomputed:', plan);

    return plan;
  }

  // --- Activities: exams ---

  addExam({ subject, examDate, topicNames }) {
    const topics = topicNames.map((name) =>
      createTopic({ name, estimatedMinutes: DEFAULT_TOPIC_ESTIMATE_MINUTES })
    );
    const exam = createExam({ subject, examDate, topics });
    this.exams.push(exam);
    this.notify();
    return exam;
  }

  deleteExam(examId) {
    this.exams = this.exams.filter((exam) => exam.id !== examId);
    this.notify();
  }

  // --- Activities: standalone tasks ---

  addTask({ subject, title, dueDate, estimatedMinutes }) {
    const task = createTask({ subject, title, dueDate, estimatedMinutes });
    this.tasks.push(task);
    this.notify();
    return task;
  }

  deleteTask(taskId) {
    this.tasks = this.tasks.filter((task) => task.id !== taskId);
    this.notify();
  }

  // --- Shared topic/task row actions ---

  completeItem(item) {
    markComplete(item, todayISO(), this.completionLog);
    this.notify();
  }

  skipItemToday(item) {
    markSkippedToday(item, todayISO());
    this.notify();
  }

  adjustEstimate(item, deltaMinutes) {
    const next = Math.max(MIN_ESTIMATE_MINUTES, item.estimatedMinutes + deltaMinutes);
    setEstimate(item, next);
    this.notify();
  }

  // --- Availability ---

  setDailyMinutes(weekday, minutes) {
    this.availability[weekday] = minutes;
    this.notify();
  }

  addSlot({ weekday, label, startTime, endTime }) {
    const slot = createBookedSlot({ weekday, label, startTime, endTime });
    this.bookedSlots.push(slot);
    this.notify();
    return slot;
  }

  deleteSlot(slotId) {
    this.bookedSlots = this.bookedSlots.filter((slot) => slot.id !== slotId);
    this.notify();
  }
}
