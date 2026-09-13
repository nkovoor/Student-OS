// Part 4: inline text only, no card. Renders nothing at 0 — the brief is
// explicit that a missed day shouldn't read as punitive, and showing
// "0-day streak" felt like a quiet way of calling out the miss anyway, so
// this just stays out of the way until there's something positive to show.
export function StreakIndicator({ streak }: { streak: number }) {
  if (streak <= 0) return null;
  return <span className="streak-indicator">🔥 {streak}-day streak</span>;
}
