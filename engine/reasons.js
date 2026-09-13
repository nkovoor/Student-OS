// Reschedule-reason text (spec §2, §18): deterministic strings built from the
// same urgency numbers driving allocation — no AI call. A reason only exists
// when we have a previous render's plan to diff against.

import { addDays, diffInDays, weekdayOf } from './dateUtils.js';

function blocksOnDate(planDays, date) {
  const day = planDays.find((d) => d.date === date);
  return day ? day.blocks : [];
}

function describeDue(dueDate, todayISO) {
  const days = diffInDays(todayISO, dueDate);
  if (days <= 0) return 'due today';
  if (days === 1) return 'due tomorrow';
  return `due in ${days} days`;
}

/**
 * @param {object} args
 * @param {object[]} args.days               this render's 7 day objects (with .blocks)
 * @param {Record<string,string>} args.assignments  itemId -> earliest date scheduled, this render
 * @param {Record<string,number>} args.urgencyById   itemId -> urgency, this render
 * @param {Record<string,object>} args.itemsById      itemId -> current item (for freed-item status text)
 * @param {{days: object[], assignments: Record<string,string>}|null} args.previousPlan
 * @returns {Record<string,string>} itemId -> reason text, only for items whose day changed
 */
export function computeReasons({ days, assignments, urgencyById, itemsById, previousPlan }) {
  const reasons = {};
  if (!previousPlan) return reasons;

  const prevAssignments = previousPlan.assignments || {};
  const todayISO = days[0]?.date;

  for (const [itemId, newDate] of Object.entries(assignments)) {
    const prevDate = prevAssignments[itemId];
    if (!prevDate || prevDate === newDate) continue;

    if (newDate > prevDate) {
      reasons[itemId] = buildDelayReason({ itemId, prevDate, days, urgencyById, todayISO });
    } else {
      reasons[itemId] = buildAdvanceReason({ itemId, newDate, prevDate, assignments, itemsById, previousPlan });
    }
  }

  return reasons;
}

// Item moved LATER: something more urgent now occupies the day it used to have.
function buildDelayReason({ itemId, prevDate, days, urgencyById, todayISO }) {
  const myUrgency = urgencyById[itemId] ?? 0;
  const occupants = blocksOnDate(days, prevDate).filter((b) => b.itemId !== itemId && b.urgency > myUrgency);
  const culprit = occupants.sort((a, b) => b.urgency - a.urgency)[0];

  if (culprit) {
    return `moved here — ${culprit.label} ${describeDue(culprit.dueDate, todayISO)} took priority`;
  }
  // No higher-urgency occupant found — the day's own budget must have shrunk
  // (e.g. a new booked slot, or a smaller study window).
  return `moved here — less study time available on ${weekdayOf(prevDate)}`;
}

// Item moved EARLIER: something that used to occupy an earlier day is gone now
// (completed or skipped off the plan entirely), freeing that capacity.
function buildAdvanceReason({ itemId, newDate, prevDate, assignments, itemsById, previousPlan }) {
  const freedCandidates = [];
  for (let cursor = newDate; cursor < prevDate; cursor = addDays(cursor, 1)) {
    freedCandidates.push(...blocksOnDate(previousPlan.days, cursor));
  }
  const uniqueByItem = [...new Map(freedCandidates.map((b) => [b.itemId, b])).values()].filter(
    (b) => b.itemId !== itemId
  );
  const freed = uniqueByItem.find((b) => !(b.itemId in assignments));

  if (freed) {
    const freedItem = itemsById[freed.itemId];
    const state = freedItem?.completed
      ? 'was marked done'
      : freedItem?.skipDates?.length
        ? 'was skipped'
        : 'is no longer scheduled';
    return `moved up — ${freed.label} ${state}`;
  }
  return 'moved up — extra study time became available';
}
