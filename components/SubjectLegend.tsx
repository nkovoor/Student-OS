import { subjectColor } from '@/lib/format';

export interface LegendEntry {
  subject: string;
  minutes: number;
}

// Spec §11/§12: paired with the Home doughnut, reused as-is by Progress's
// subject breakdown later — dot + name + right-aligned mono minutes, sorted
// by minutes descending.
export function SubjectLegend({ entries }: { entries: LegendEntry[] }) {
  const sorted = [...entries].sort((a, b) => b.minutes - a.minutes);

  return (
    <div className="subject-legend">
      {sorted.map((entry) => (
        <div className="subject-legend-row" key={entry.subject}>
          <span className="dot" style={{ background: subjectColor(entry.subject) }} />
          <span className="subject-legend-name">{entry.subject}</span>
          <span className="subject-legend-minutes">{entry.minutes}m</span>
        </div>
      ))}
    </div>
  );
}
