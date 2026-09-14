import { SubjectLegend } from '@/components/SubjectLegend';
import type { LegendEntry } from '@/components/SubjectLegend';

// Spec §11/§12: reuses the exact SubjectLegend component built for Home's
// completion doughnut (dot + name + right-aligned mono minutes, sorted
// descending) — no doughnut here, just the legend on its own.
export function SubjectBreakdownCard({ entries }: { entries: LegendEntry[] }) {
  return (
    <div className="card">
      <h3 className="card-title">This week by subject</h3>
      {entries.length === 0 ? (
        <p className="muted-note">Nothing completed yet this week.</p>
      ) : (
        <SubjectLegend entries={entries} />
      )}
    </div>
  );
}
