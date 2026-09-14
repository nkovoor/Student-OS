'use client';

import type { WorkItem } from '@/lib/engine';
import { useStudentOSActions, ESTIMATE_STEP_MINUTES } from '@/lib/state/StudentOSProvider';

function labelOf(item: WorkItem): string {
  return item.type === 'topic' ? item.name : item.title;
}

// The re-estimate stepper (spec §9, §12, §13, §14): a compact − [mono] +
// control, 20×20px tap targets that stay fixed regardless of viewport, each
// click committing immediately and triggering a full plan recompute — there
// is no separate "save" step and no live-as-you-type behavior to guard
// against, since there's no free-text entry here at all.
export function Stepper({ item }: { item: WorkItem }) {
  const { adjustEstimate } = useStudentOSActions();
  const label = labelOf(item);

  return (
    <div className={'stepper' + (item.completed ? ' is-disabled' : '')}>
      <button
        type="button"
        className="stepper-btn"
        aria-label={`Decrease estimate for ${label}`}
        disabled={item.completed}
        onClick={() => adjustEstimate(item, -ESTIMATE_STEP_MINUTES)}
      >
        −
      </button>
      <span className="stepper-value">{item.estimatedMinutes}m</span>
      <button
        type="button"
        className="stepper-btn"
        aria-label={`Increase estimate for ${label}`}
        disabled={item.completed}
        onClick={() => adjustEstimate(item, ESTIMATE_STEP_MINUTES)}
      >
        +
      </button>
    </div>
  );
}
