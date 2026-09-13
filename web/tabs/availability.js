// Availability tab (spec §11): per-weekday study window + free-to-study
// readout, permanent recurring slot chips nested under each weekday, and the
// closing "Book a permanent slot" add-form.

import { el } from '../dom.js';
import { WEEKDAYS, timeToMinutes, slotDurationMinutes } from '../engine.js';

const WEEKDAY_FULL = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

function showError(node, message) {
  node.textContent = message;
  node.hidden = false;
}

function hideError(node) {
  node.hidden = true;
  node.textContent = '';
}

function bookedMinutesForWeekday(state, weekday) {
  return state.bookedSlots
    .filter((slot) => slot.weekday === weekday)
    .reduce((sum, slot) => sum + slotDurationMinutes(slot), 0);
}

function renderSlotChip(slot, state) {
  return el('div', { class: 'slot-chip' }, [
    el('span', { class: 'dot slot-dot' }),
    el('span', { class: 'slot-chip-label', text: slot.label }),
    el('span', { class: 'slot-chip-time', text: `${slot.startTime}–${slot.endTime}` }),
    el('button', {
      type: 'button',
      class: 'btn-del',
      'aria-label': `Remove ${slot.label}`,
      text: '×',
      onClick: () => state.deleteSlot(slot.id),
    }),
  ]);
}

function renderAvailRow(weekday, state) {
  const minutesInput = el('input', {
    type: 'number',
    class: 'input input-minutes',
    min: '0',
    step: '5',
    value: String(state.availability[weekday] ?? 0),
    'aria-label': `${WEEKDAY_FULL[weekday]} study window minutes`,
  });
  minutesInput.addEventListener('change', () => {
    const value = Math.max(0, Number(minutesInput.value) || 0);
    state.setDailyMinutes(weekday, value);
  });

  const booked = bookedMinutesForWeekday(state, weekday);
  const free = Math.max(0, (state.availability[weekday] ?? 0) - booked);

  const head = el('div', { class: 'avail-row-head' }, [
    el('span', { class: 'avail-weekday', text: weekday }),
    minutesInput,
    el('span', { class: 'avail-window-label', text: 'study window min' }),
    el('span', { class: 'avail-free', text: `${free}m free to study` }),
  ]);

  const row = el('div', { class: 'avail-row' }, [head]);

  const slots = state.bookedSlots.filter((slot) => slot.weekday === weekday);
  if (slots.length > 0) {
    row.append(el('div', { class: 'slot-chip-row' }, slots.map((slot) => renderSlotChip(slot, state))));
  }

  return row;
}

function renderSlotForm(state) {
  const weekdaySelect = el(
    'select',
    { class: 'input', 'aria-label': 'Weekday' },
    WEEKDAYS.map((day) => el('option', { value: day, text: WEEKDAY_FULL[day] }))
  );
  const labelInput = el('input', {
    type: 'text',
    class: 'input input-wide',
    placeholder: 'Slot name',
    'aria-label': 'Slot name',
  });
  const startInput = el('input', { type: 'time', class: 'input', 'aria-label': 'Start time' });
  const endInput = el('input', { type: 'time', class: 'input', 'aria-label': 'End time' });
  const submit = el('button', { type: 'submit', class: 'btn-dark', text: 'Book slot' });
  const errorText = el('p', { class: 'error-text', hidden: true });

  const form = el('form', { class: 'add-form', novalidate: true }, [
    el('div', { class: 'add-form-row' }, [weekdaySelect, labelInput, startInput, endInput, submit]),
    errorText,
  ]);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const label = labelInput.value.trim();
    const startTime = startInput.value;
    const endTime = endInput.value;

    if (!label) return showError(errorText, 'Give the slot a name.');
    if (!startTime || !endTime) return showError(errorText, 'Pick a start and end time.');
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      return showError(errorText, 'End time must be after start time.');
    }

    hideError(errorText);
    state.addSlot({ weekday: weekdaySelect.value, label, startTime, endTime });
    form.reset();
    weekdaySelect.value = WEEKDAYS[0];
  });

  return form;
}

export function renderAvailability(container, state) {
  container.replaceChildren();

  container.append(
    el('p', {
      class: 'muted-note',
      text: "Book permanent weekly slots — sports, music, coaching — and set how much study time you realistically have each day. The scheduler will never plan over these.",
    })
  );

  container.append(el('div', { class: 'avail-rows' }, WEEKDAYS.map((day) => renderAvailRow(day, state))));
  container.append(el('h2', { class: 'section-title', text: 'Book a permanent slot' }));
  container.append(renderSlotForm(state));
}
