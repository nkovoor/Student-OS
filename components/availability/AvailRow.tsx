'use client';

import { useEffect, useRef, useState } from 'react';
import type { Weekday, BookedSlot, Availability } from '@/lib/engine';
import { slotDurationMinutes } from '@/lib/engine';
import { useStudentOSActions } from '@/lib/state/StudentOSProvider';
import { SlotChip } from './SlotChip';

const WEEKDAY_FULL: Record<Weekday, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

export function AvailRow({
  weekday,
  availability,
  bookedSlots,
}: {
  weekday: Weekday;
  availability: Availability;
  bookedSlots: BookedSlot[];
}) {
  const { setDailyMinutes } = useStudentOSActions();
  const [draft, setDraft] = useState(String(availability[weekday] ?? 0));
  const inputRef = useRef<HTMLInputElement>(null);

  const slotsForDay = bookedSlots.filter((slot) => slot.weekday === weekday);
  const booked = slotsForDay.reduce((sum, slot) => sum + slotDurationMinutes(slot), 0);
  const free = Math.max(0, (availability[weekday] ?? 0) - booked);

  // Spec §11/§9: commit on "onchange, not live-as-you-type". React's onChange
  // fires per keystroke (it's really the native 'input' event under the
  // hood), so it can't tell a keystroke apart from a spinner-arrow click or
  // Enter. A native 'change' listener does — it only fires on blur, Enter,
  // or a spinner click — so that's what actually triggers the recompute.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const handleNativeChange = () => {
      const value = Math.max(0, Number(el.value) || 0);
      setDailyMinutes(weekday, value);
    };
    el.addEventListener('change', handleNativeChange);
    return () => el.removeEventListener('change', handleNativeChange);
  }, [weekday, setDailyMinutes]);

  return (
    <div className="avail-row">
      <div className="avail-row-head">
        <span className="avail-weekday">{weekday}</span>
        <input
          ref={inputRef}
          type="number"
          className="input input-minutes"
          min={0}
          step={5}
          aria-label={`${WEEKDAY_FULL[weekday]} study window minutes`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <span className="avail-window-label">study window min</span>
        <span className="avail-free">{free}m free to study</span>
      </div>
      {slotsForDay.length > 0 && (
        <div className="slot-chip-row">
          {slotsForDay.map((slot) => (
            <SlotChip key={slot.id} slot={slot} />
          ))}
        </div>
      )}
    </div>
  );
}
