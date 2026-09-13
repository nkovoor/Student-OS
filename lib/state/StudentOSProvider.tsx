'use client';

// Bridges UI actions to the planning engine via a plain useReducer — every
// action is a pure (data, action) -> data transition, then a full plan
// recompute (spec §2: the plan is never stored, it's recomputed fresh from
// current data on every render). Pure reducers are safe under React
// StrictMode's dev-mode double-invocation; the original vanilla-JS prototype
// used in-place mutators, which would have double-applied under that
// invocation, so the engine's model.ts action helpers were changed to be
// immutable for this port (see lib/engine/model.ts).
//
// There's no Home/Scheduler page yet to display the plan, but the recompute
// still runs on every change and is exposed on window.__studentOS for manual
// verification in devtools, and logged to the console.

import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import {
  createAvailability,
  createExam,
  createTopic,
  createTask,
  createBookedSlot,
  withComplete,
  withEstimate,
  generatePlan,
} from '@/lib/engine';
import type { Exam, Task, Availability, BookedSlot, CompletionLogEntry, Weekday, WorkItem, Plan } from '@/lib/engine';
import { todayISO } from '@/lib/format';

export const DEFAULT_TOPIC_ESTIMATE_MINUTES = 30;
export const ESTIMATE_STEP_MINUTES = 5;
export const MIN_ESTIMATE_MINUTES = 5;

interface StudentOSData {
  exams: Exam[];
  tasks: Task[];
  availability: Availability;
  bookedSlots: BookedSlot[];
  completionLog: CompletionLogEntry[];
}

interface State {
  data: StudentOSData;
  plan: Plan;
}

type Action =
  | { type: 'ADD_EXAM'; subject: string; examDate: string; topicNames: string[] }
  | { type: 'DELETE_EXAM'; examId: string }
  | { type: 'ADD_TASK'; subject: string; title: string; dueDate: string; estimatedMinutes: number }
  | { type: 'DELETE_TASK'; taskId: string }
  | { type: 'COMPLETE_ITEM'; item: WorkItem }
  | { type: 'ADJUST_ESTIMATE'; item: WorkItem; deltaMinutes: number }
  | { type: 'SET_DAILY_MINUTES'; weekday: Weekday; minutes: number }
  | { type: 'ADD_SLOT'; weekday: Weekday; label: string; startTime: string; endTime: string }
  | { type: 'DELETE_SLOT'; slotId: string };

function replaceTopicInExams(exams: Exam[], topicId: string, next: Exam['topics'][number]): Exam[] {
  return exams.map((exam) =>
    exam.topics.some((t) => t.id === topicId)
      ? { ...exam, topics: exam.topics.map((t) => (t.id === topicId ? next : t)) }
      : exam
  );
}

function replaceTaskInList(tasks: Task[], taskId: string, next: Task): Task[] {
  return tasks.map((t) => (t.id === taskId ? next : t));
}

function applyAction(data: StudentOSData, action: Action): StudentOSData {
  switch (action.type) {
    case 'ADD_EXAM': {
      const topics = action.topicNames.map((name) =>
        createTopic({ name, estimatedMinutes: DEFAULT_TOPIC_ESTIMATE_MINUTES })
      );
      const exam = createExam({ subject: action.subject, examDate: action.examDate, topics });
      return { ...data, exams: [...data.exams, exam] };
    }
    case 'DELETE_EXAM':
      return { ...data, exams: data.exams.filter((exam) => exam.id !== action.examId) };

    case 'ADD_TASK': {
      const task = createTask({
        subject: action.subject,
        title: action.title,
        dueDate: action.dueDate,
        estimatedMinutes: action.estimatedMinutes,
      });
      return { ...data, tasks: [...data.tasks, task] };
    }
    case 'DELETE_TASK':
      return { ...data, tasks: data.tasks.filter((task) => task.id !== action.taskId) };

    case 'COMPLETE_ITEM': {
      const dateISO = todayISO();
      const { item, logEntry } = withComplete(action.item, dateISO);
      const exams = item.type === 'topic' ? replaceTopicInExams(data.exams, item.id, item) : data.exams;
      const tasks = item.type === 'task' ? replaceTaskInList(data.tasks, item.id, item) : data.tasks;
      const completionLog = logEntry ? [...data.completionLog, logEntry] : data.completionLog;
      return { ...data, exams, tasks, completionLog };
    }

    case 'ADJUST_ESTIMATE': {
      const nextMinutes = Math.max(MIN_ESTIMATE_MINUTES, action.item.estimatedMinutes + action.deltaMinutes);
      const item = withEstimate(action.item, nextMinutes);
      const exams = item.type === 'topic' ? replaceTopicInExams(data.exams, item.id, item) : data.exams;
      const tasks = item.type === 'task' ? replaceTaskInList(data.tasks, item.id, item) : data.tasks;
      return { ...data, exams, tasks };
    }

    case 'SET_DAILY_MINUTES':
      return { ...data, availability: { ...data.availability, [action.weekday]: action.minutes } };

    case 'ADD_SLOT': {
      const slot = createBookedSlot({
        weekday: action.weekday,
        label: action.label,
        startTime: action.startTime,
        endTime: action.endTime,
      });
      return { ...data, bookedSlots: [...data.bookedSlots, slot] };
    }
    case 'DELETE_SLOT':
      return { ...data, bookedSlots: data.bookedSlots.filter((slot) => slot.id !== action.slotId) };
  }
}

function reducer(state: State, action: Action): State {
  const nextData = applyAction(state.data, action);
  const nextPlan = generatePlan({
    exams: nextData.exams,
    tasks: nextData.tasks,
    availability: nextData.availability,
    bookedSlots: nextData.bookedSlots,
    today: todayISO(),
    completionLog: nextData.completionLog,
    previousPlan: state.plan,
  });
  return { data: nextData, plan: nextPlan };
}

function initState(): State {
  const data: StudentOSData = {
    exams: [],
    tasks: [],
    availability: createAvailability({}),
    bookedSlots: [],
    completionLog: [],
  };
  const plan = generatePlan({
    exams: data.exams,
    tasks: data.tasks,
    availability: data.availability,
    bookedSlots: data.bookedSlots,
    today: todayISO(),
    completionLog: data.completionLog,
    previousPlan: null,
  });
  return { data, plan };
}

const StudentOSContext = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null);

export function StudentOSProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as { __studentOS?: State }).__studentOS = state;
    }
    console.debug('[student-os] plan recomputed:', state.plan);
  }, [state]);

  return <StudentOSContext.Provider value={{ state, dispatch }}>{children}</StudentOSContext.Provider>;
}

function useStudentOSContext() {
  const ctx = useContext(StudentOSContext);
  if (!ctx) throw new Error('useStudentOS must be used within a StudentOSProvider');
  return ctx;
}

export function useStudentOSData() {
  return useStudentOSContext().state.data;
}

export function usePlan() {
  return useStudentOSContext().state.plan;
}

export function useStudentOSActions() {
  const { dispatch } = useStudentOSContext();
  return useMemo(
    () => ({
      addExam: (input: { subject: string; examDate: string; topicNames: string[] }) =>
        dispatch({ type: 'ADD_EXAM', ...input }),
      deleteExam: (examId: string) => dispatch({ type: 'DELETE_EXAM', examId }),
      addTask: (input: { subject: string; title: string; dueDate: string; estimatedMinutes: number }) =>
        dispatch({ type: 'ADD_TASK', ...input }),
      deleteTask: (taskId: string) => dispatch({ type: 'DELETE_TASK', taskId }),
      completeItem: (item: WorkItem) => dispatch({ type: 'COMPLETE_ITEM', item }),
      adjustEstimate: (item: WorkItem, deltaMinutes: number) => dispatch({ type: 'ADJUST_ESTIMATE', item, deltaMinutes }),
      setDailyMinutes: (weekday: Weekday, minutes: number) => dispatch({ type: 'SET_DAILY_MINUTES', weekday, minutes }),
      addSlot: (input: { weekday: Weekday; label: string; startTime: string; endTime: string }) =>
        dispatch({ type: 'ADD_SLOT', ...input }),
      deleteSlot: (slotId: string) => dispatch({ type: 'DELETE_SLOT', slotId }),
    }),
    [dispatch]
  );
}
