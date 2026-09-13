'use client';

import type { Task } from '@/lib/engine';
import { useStudentOSActions } from '@/lib/state/StudentOSProvider';
import { subjectColor, formatDueMeta } from '@/lib/format';
import { ProgressBar } from '@/components/ProgressBar';
import { ItemRow } from './ItemRow';

export function TaskCard({ task }: { task: Task }) {
  const { deleteTask } = useStudentOSActions();
  const progress = task.estimatedMinutes > 0 ? task.minutesDone / task.estimatedMinutes : 0;
  const color = subjectColor(task.subject);

  return (
    <div className="item-card">
      <div className="item-card-header">
        <div className="item-card-left">
          <span className="dot" style={{ background: color }} />
          <span className="item-card-title">{task.title}</span>
        </div>
        <div className="item-card-right">
          <span className="item-card-meta">{formatDueMeta(task.dueDate)}</span>
          <button
            type="button"
            className="btn-del"
            aria-label={`Remove ${task.title}`}
            onClick={() => deleteTask(task.id)}
          >
            ×
          </button>
        </div>
      </div>
      <ProgressBar fraction={progress} color={color} />
      <div className="topic-list">
        <ItemRow item={task} />
      </div>
    </div>
  );
}
