'use client';

import type { WorkItem } from '@/lib/engine';
import { useStudentOSActions } from '@/lib/state/StudentOSProvider';
import { Stepper } from './Stepper';

function labelOf(item: WorkItem): string {
  return item.type === 'topic' ? item.name : item.title;
}

// Shared by exam topic rows and standalone task rows (spec §17: "inline
// re-estimate stepper on each topic/task row") so both look and behave
// identically wherever they appear.
export function ItemRow({ item }: { item: WorkItem }) {
  const { completeItem } = useStudentOSActions();

  return (
    <div className={'item-row' + (item.completed ? ' is-done' : '')}>
      <span className="item-row-name">{labelOf(item)}</span>
      <Stepper item={item} />
      {!item.completed && (
        <button type="button" className="mini-btn" onClick={() => completeItem(item)}>
          Done
        </button>
      )}
    </div>
  );
}
