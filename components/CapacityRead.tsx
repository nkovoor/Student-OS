import type { CapacityDelta } from '@/lib/engine';

// Spec §11/§12: text-only, never a filled badge. Ahead/on-track share the
// same muted color — there's no celebratory styling for being ahead.
export function CapacityRead({ capacityDelta }: { capacityDelta: CapacityDelta }) {
  const stateClass =
    capacityDelta.status === 'behind' ? 'is-behind' : capacityDelta.status === 'ahead' ? 'is-ahead' : 'is-on-track';
  return <span className={`capacity-read ${stateClass}`}>{capacityDelta.label}</span>;
}
