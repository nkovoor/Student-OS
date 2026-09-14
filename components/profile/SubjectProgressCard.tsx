'use client';

import { xpToLevel } from '@/lib/gamification';
import { subjectColor, lightenHex } from '@/lib/format';
import { useTheme } from '@/lib/theme';

// Part B item 6 / Part D: accent-top variant (is-accent -> --accent instead
// of --blue). Each subject's own xpToLevel().progressFraction — same math
// the overall Level Hero Card uses, just per-subject — drives a thin
// gradient bar into that subject's own lighter variant.
export function SubjectProgressCard({ subjectXp }: { subjectXp: Record<string, number> }) {
  const { theme } = useTheme();
  const subjects = Object.entries(subjectXp).sort((a, b) => b[1] - a[1]);

  return (
    <div className="card card-accent-top is-accent">
      <h3 className="card-title">Subject Progress</h3>
      {subjects.length === 0 ? (
        <p className="muted-note">No subject activity yet.</p>
      ) : (
        subjects.map(([subject, xp]) => {
          const levelProgress = xpToLevel(xp);
          const color = subjectColor(subject, theme);
          const lighter = lightenHex(color, 0.4);
          return (
            <div className="subject-progress-row" key={subject}>
              <div className="subject-progress-header">
                <span className="subject-progress-name">{subject}</span>
                <span className="subject-progress-level">Lv {levelProgress.level}</span>
              </div>
              <div className="subject-progress-track">
                <div
                  className="subject-progress-fill"
                  style={{
                    width: `${levelProgress.progressFraction * 100}%`,
                    background: `linear-gradient(90deg, ${color}, ${lighter})`,
                  }}
                />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
