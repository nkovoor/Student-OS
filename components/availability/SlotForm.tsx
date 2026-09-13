'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { WEEKDAYS, timeToMinutes } from '@/lib/engine';
import type { Weekday } from '@/lib/engine';
import { useStudentOSActions } from '@/lib/state/StudentOSProvider';

const WEEKDAY_FULL: Record<Weekday, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

export function SlotForm() {
  const { addSlot } = useStudentOSActions();
  const [weekday, setWeekday] = useState<Weekday>(WEEKDAYS[0]);
  const [label, setLabel] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!label.trim()) return setError('Give the slot a name.');
    if (!startTime || !endTime) return setError('Pick a start and end time.');
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) return setError('End time must be after start time.');

    setError(null);
    addSlot({ weekday, label: label.trim(), startTime, endTime });
    setLabel('');
    setStartTime('');
    setEndTime('');
    setWeekday(WEEKDAYS[0]);
  }

  return (
    <form className="add-form" noValidate onSubmit={handleSubmit}>
      <div className="add-form-row">
        <select
          className="input"
          aria-label="Weekday"
          value={weekday}
          onChange={(e) => setWeekday(e.target.value as Weekday)}
        >
          {WEEKDAYS.map((day) => (
            <option key={day} value={day}>
              {WEEKDAY_FULL[day]}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="input input-wide"
          placeholder="Slot name"
          aria-label="Slot name"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <input
          type="time"
          className="input"
          aria-label="Start time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
        <input
          type="time"
          className="input"
          aria-label="End time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />
        <button type="submit" className="btn-dark">
          Book slot
        </button>
      </div>
      <p className="error-text" hidden={!error}>
        {error}
      </p>
    </form>
  );
}
