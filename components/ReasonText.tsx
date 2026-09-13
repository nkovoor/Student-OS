// Spec §2/§12/§18: sits directly under the row it explains, no border of its
// own. Renders nothing when there's no reason — most rows don't have one.
export function ReasonText({ reason }: { reason: string | null }) {
  if (!reason) return null;
  return <p className="reason-text">→ {reason}</p>;
}
