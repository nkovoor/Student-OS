// Spec §11: "the simplest card in the app, intentionally" — a palate-cleanser
// after the doughnut, no chart, no icon.
export function StatCard({ totalMinutes }: { totalMinutes: number }) {
  return (
    <div className="card">
      <div className="stat-row">
        <span className="stat-row-label">Total done this week</span>
        <span className="stat-row-value">{totalMinutes}m</span>
      </div>
    </div>
  );
}
