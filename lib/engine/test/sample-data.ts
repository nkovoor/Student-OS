import { createExam, createTopic, createTask, createAvailability, createBookedSlot } from '../model';
import type { Exam, Task, Availability, BookedSlot, CompletionLogEntry } from '../model';
import { addDays } from '../dateUtils';

export interface SampleData {
  exams: Exam[];
  tasks: Task[];
  availability: Availability;
  bookedSlots: BookedSlot[];
  completionLog: CompletionLogEntry[];
}

/**
 * Builds a fresh sample dataset anchored on `today`. Returns plain, mutable
 * objects so the test harness can apply action helpers between renders.
 */
export function buildSampleData(today: string): SampleData {
  const exams: Exam[] = [
    createExam({
      id: 'exam_math',
      subject: 'Maths',
      examDate: addDays(today, 4),
      topics: [
        createTopic({ id: 'topic_algebra', name: 'Algebra revision', estimatedMinutes: 60, importance: 'high' }),
        createTopic({ id: 'topic_geometry', name: 'Geometry practice set', estimatedMinutes: 90, importance: 'medium' }),
        createTopic({ id: 'topic_trig', name: 'Trigonometry basics', estimatedMinutes: 45, importance: 'low' }),
      ],
    }),
    createExam({
      id: 'exam_science',
      subject: 'Science',
      examDate: addDays(today, 2),
      topics: [
        createTopic({ id: 'topic_forces', name: 'Forces & motion', estimatedMinutes: 50, importance: 'high' }),
        createTopic({ id: 'topic_bonding', name: 'Chemical bonding', estimatedMinutes: 40, importance: 'medium' }),
      ],
    }),
  ];

  const tasks: Task[] = [
    createTask({
      id: 'task_essay',
      subject: 'English',
      title: 'English essay draft',
      dueDate: addDays(today, 1),
      estimatedMinutes: 60,
      importance: 'high',
    }),
    createTask({
      id: 'task_history',
      subject: 'Social Science',
      title: 'History reading',
      dueDate: addDays(today, 5),
      estimatedMinutes: 30,
      importance: 'low',
    }),
  ];

  const availability = createAvailability({
    // Monday is 120, not 90 like the other weekdays: at 90, the two highest-
    // urgency items (essay 60m + forces' 30m-that-fits) already consume the
    // whole day before Chemical bonding's turn comes up in the greedy
    // allocator, so bonding never lands on Monday in render 1 at all — it
    // starts Tuesday already. That makes the harness's "skip bonding for
    // today" action a no-op (it was never on today to begin with), so its
    // earliest day stays Tuesday in both renders and there's nothing for
    // reasons.ts to report — not a bug in reasons.ts, a fixture that didn't
    // exercise the delay-reason path it was meant to test. 120 (reusing the
    // value already used for Sat/Sun below) leaves just enough room after
    // essay+forces for bonding to get a real slice of Monday in render 1, so
    // skipping it for today genuinely delays it to Tuesday.
    Mon: 120,
    Tue: 90,
    Wed: 90,
    Thu: 90,
    Fri: 90,
    Sat: 120,
    Sun: 120,
  });

  const bookedSlots: BookedSlot[] = [
    createBookedSlot({ weekday: 'Tue', label: 'Basketball practice', startTime: '16:00', endTime: '17:00' }),
    createBookedSlot({ weekday: 'Thu', label: 'Music lesson', startTime: '17:00', endTime: '17:45' }),
  ];

  return { exams, tasks, availability, bookedSlots, completionLog: [] };
}
