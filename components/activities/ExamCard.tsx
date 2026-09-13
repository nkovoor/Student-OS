'use client';

import type { Exam } from '@/lib/engine';
import { useStudentOSActions } from '@/lib/state/StudentOSProvider';
import { subjectColor, formatDueMeta } from '@/lib/format';
import { ProgressBar } from '@/components/ProgressBar';
import { ItemRow } from './ItemRow';

export function ExamCard({ exam }: { exam: Exam }) {
  const { deleteExam } = useStudentOSActions();
  const totalEstimate = exam.topics.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const totalDone = exam.topics.reduce((sum, t) => sum + t.minutesDone, 0);
  const progress = totalEstimate > 0 ? totalDone / totalEstimate : 0;
  const color = subjectColor(exam.subject);

  return (
    <div className="item-card">
      <div className="item-card-header">
        <div className="item-card-left">
          <span className="dot" style={{ background: color }} />
          <span className="item-card-title">{exam.subject}</span>
        </div>
        <div className="item-card-right">
          <span className="item-card-meta">{formatDueMeta(exam.examDate)}</span>
          <button
            type="button"
            className="btn-del"
            aria-label={`Remove ${exam.subject}`}
            onClick={() => deleteExam(exam.id)}
          >
            ×
          </button>
        </div>
      </div>
      <ProgressBar fraction={progress} color={color} />
      <div className="topic-list">
        {exam.topics.map((topic) => (
          <ItemRow key={topic.id} item={topic} />
        ))}
      </div>
    </div>
  );
}
