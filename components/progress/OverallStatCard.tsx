import { ProgressBar } from '@/components/ProgressBar';
import type { OverallWorkload } from '@/lib/progressStats';

// Spec §11/§12: the only card with a left-stat/right-bar split — big
// display-font percentage on the left, progress bar + workload caption on
// the right, both in the same card.
export function OverallStatCard({ workload }: { workload: OverallWorkload }) {
  const percent = Math.round(workload.fraction * 100);

  return (
    <div className="card">
      <h3 className="card-title">Overall progress</h3>
      <div className="overall-stat-row">
        <span className="overall-stat-percent">{percent}%</span>
        <div className="overall-stat-bar-col">
          <ProgressBar fraction={workload.fraction} color="var(--accent)" />
          <p className="overall-stat-caption">
            {workload.totalMinutesDone} of {workload.totalEstimatedMinutes} total workload done
          </p>
        </div>
      </div>
    </div>
  );
}
