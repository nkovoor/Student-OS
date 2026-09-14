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
          // Part F.3: quiet, non-modal acknowledgment at 50%/100% — a bar
          // glow, plus a small text badge at 100% specifically. This is a
          // static "at or above" treatment, not a one-shot "just crossed"
          // animation: recomputed fresh every render, same as everything
          // else on this stateless page (CapacityRead's ahead/behind,
          // Scheduler's day-card.is-today) — a genuine one-time "crossed
          // just now" trigger would need new previous-render-tracking state
          // that doesn't exist yet. Flagging this as an interpretation of
          // "crosses," not the only possible one.
          const milestoneClass = entry.fraction >= 1 ? ' is-milestone-100' : entry.fraction >= 0.5 ? ' is-milestone-50' : '';
          return (
            <div className={'readiness-row' + milestoneClass} key={entry.examId}>
              <div className="readiness-row-head">
                <span className="readiness-row-left">
                  <span className="dot" style={{ background: color }} />
                  <span className="readiness-row-subject">{entry.subject}</span>
                  <span className="readiness-row-due">{formatDueMeta(entry.examDate)}</span>
                </span>
                <span className="readiness-row-percent">
                  {entry.percent}%
                  {entry.fraction >= 1 && <span className="readiness-milestone-badge">✓ Ready</span>}
                </span>
              </div>
              <ProgressBar fraction={entry.fraction} color={color} />
            </div>
          );
        })
      )}
    </section>
  );
}
