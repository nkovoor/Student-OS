import type { Exam, Task, WorkItem } from '@/lib/engine';

// The plan's blocks (from generatePlan) are lightweight snapshots — itemId,
// label, minutes — not the live Topic/Task object. Actions like
// completeItem/adjustEstimate need the actual current item (so they compute
// off its real minutesDone, not a stale copy), so this looks it up by id.
export function findWorkItem(
  data: { exams: Exam[]; tasks: Task[] },
  itemId: string,
  type: WorkItem['type']
): WorkItem | undefined {
  if (type === 'topic') {
    for (const exam of data.exams) {
      const topic = exam.topics.find((t) => t.id === itemId);
      if (topic) return topic;
    }
    return undefined;
  }
  return data.tasks.find((t) => t.id === itemId);
}
