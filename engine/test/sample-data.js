import { createExam, createTopic, createTask, createAvailability, createBookedSlot } from '../model.js';
import { addDays } from '../dateUtils.js';

/**
 * Builds a fresh sample dataset anchored on `today`. Returns plain, mutable
 * objects so the test harness can apply mark* actions between renders.
 */
export function buildSampleData(today) {
  const exams = [
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

  const tasks = [
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
    Mon: 90,
    Tue: 90,
    Wed: 90,
    Thu: 90,
    Fri: 90,
    Sat: 120,
    Sun: 120,
  });

  const bookedSlots = [
    createBookedSlot({ weekday: 'Tue', label: 'Basketball practice', startTime: '16:00', endTime: '17:00' }),
    createBookedSlot({ weekday: 'Thu', label: 'Music lesson', startTime: '17:00', endTime: '17:45' }),
  ];

  return { exams, tasks, availability, bookedSlots, completionLog: [] };
}
