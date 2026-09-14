'use client';

import type { BookedSlot } from '@/lib/engine';
import { useStudentOSActions } from '@/lib/state/StudentOSProvider';

export function SlotChip({ slot }: { slot: BookedSlot }) {
  const { deleteSlot } = useStudentOSActions();

  return (
    <div className="slot-chip">
      <span className="dot slot-dot" />
      <span className="slot-chip-label">{slot.label}</span>
      <span className="slot-chip-time">
        {slot.startTime}–{slot.endTime}
      </span>
      <button type="button" className="btn-del" aria-label={`Remove ${slot.label}`} onClick={() => deleteSlot(slot.id)}>
        ×
      </button>
    </div>
  );
}
