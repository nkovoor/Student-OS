// Spec §11 + v2 Part 5: "the simplest card in the app" — still a
// palate-cleanser after the doughnut, but the label now shows XP earned
// this week ("🎉 XXX XP earned this week") while the value stays the
// existing minutes figure — XP is a layer on top of the engine's own
// minutes-based data, not a replacement for it.
export function StatCard({ totalMinutes, weekXp }: { totalMinutes: number; weekXp: number }) {
  return (
    <div className="card">
      <div className="stat-row">
        <span className="stat-row-label">🎉 {weekXp} XP earned this week</span>
        <span className="stat-row-value">{totalMinutes}m</span>
      </div>
    </div>
  );
}
