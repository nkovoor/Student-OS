'use client';

import { ProgressBar } from '@/components/ProgressBar';
import { formatDueMeta, subjectColor } from '@/lib/format';
import { useTheme } from '@/lib/theme';
import type { ExamReadinessEntry } from '@/lib/progressStats';

// Spec §11/§12: no card wrapper — a section title followed by one labeled
// progress bar per active exam. Subject + days-until on the left, percentage
// in mono on the right, subject-colored fill.
export function ExamReadinessSection({ entries }: { entries: ExamReadinessEntry[] }) {
  const { theme } = useTheme();

  return (
    <section className="tab-section">
      <h2 className="section-title">Exam readiness</h2>
      {entries.length === 0 ? (
        <p className="muted-note">No upcoming exams.</p>
      ) : (
        entries.map((entry) => {
          const color = subjectColor(entry.subject, theme);
          return (
            <div className="readiness-row" key={entry.examId}>
              <div className="readiness-row-head">
                <span className="readiness-row-left">
                  <span className="dot" style={{ background: color }} />
                  <span className="readiness-row-subject">{entry.subject}</span>
                  <span className="readiness-row-due">{formatDueMeta(entry.examDate)}</span>
                </span>
                <span className="readiness-row-percent">{entry.percent}%</span>
              </div>
              <ProgressBar fraction={entry.fraction} color={color} />
            </div>
          );
        })
      )}
    </section>
  );
}
