// Part B item 5: three chips, each with its own 2px accent bottom border
// (blue / accent / indigo) via the .stats-chip-2/.stats-chip-3 modifiers —
// .stats-chip itself defaults to blue.
export function StatsChips({
  streak,
  totalXp,
  daysActive,
}: {
  streak: number;
  totalXp: number;
  daysActive: number;
}) {
  return (
    <div className="stats-chip-row">
      <div className="stats-chip">
        <span className="stats-chip-value">🔥 {streak}</span>
        <span className="stats-chip-label">Day streak</span>
      </div>
      <div className="stats-chip stats-chip-2">
        <span className="stats-chip-value">{totalXp}</span>
        <span className="stats-chip-label">Total XP</span>
      </div>
      <div className="stats-chip stats-chip-3">
        <span className="stats-chip-value">{daysActive}</span>
        <span className="stats-chip-label">Days active</span>
      </div>
    </div>
  );
}
