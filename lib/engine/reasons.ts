// Reschedule-reason text (spec §2, §18): deterministic strings built from the
// same urgency numbers driving allocation — no AI call. A reason only exists
// when we have a previous render's plan to diff against.

import { addDays, diffInDays, weekdayOf } from './dateUtils';
import type { WorkItem, Importance } from './model';

export interface PlanBlock {
  itemId: string;
  type: WorkItem['type'];
  subject: string;
  label: string;
  dueDate: string;
  importance: Importance;
  urgency: number;
  minutes: number;
  reason: string | null;
}

export interface PlanDay {
  date: string;
  weekday: string;
  dayLabel: string;
  budgetMinutes: number;
  plannedMinutes: number;
  isFree: boolean;
  blocks: PlanBlock[];
}

export interface PlanLike {
  days: PlanDay[];
  assignments: Record<string, string>;
}

function blocksOnDate(planDays: PlanDay[], date: string | null): PlanBlock[] {
  if (date === null) return [];
  const day = planDays.find((d) => d.date === date);
  return day ? day.blocks : [];
}

function describeDue(dueDate: string, todayISO: string): string {
  const days = diffInDays(todayISO, dueDate);
  if (days <= 0) return 'due today';
  if (days === 1) return 'due tomorrow';
  return `due in ${days} days`;
}

export function computeReasons({
  days,
  assignments,
  urgencyById,
  itemsById,
  previousPlan,
}: {
  days: PlanDay[];
  assignments: Record<string, string>;
  urgencyById: Record<string, number>;
  itemsById: Record<string, WorkItem>;
  previousPlan: PlanLike | null;
}): Record<string, string> {
  const reasons: Record<string, string> = {};
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
function buildDelayReason({
  itemId,
  prevDate,
  days,
  urgencyById,
  todayISO,
}: {
  itemId: string;
  prevDate: string;
  days: PlanDay[];
  urgencyById: Record<string, number>;
  todayISO: string;
}): string {
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
function buildAdvanceReason({
  itemId,
  newDate,
  prevDate,
  assignments,
  itemsById,
  previousPlan,
}: {
  itemId: string;
  newDate: string;
  prevDate: string;
  assignments: Record<string, string>;
  itemsById: Record<string, WorkItem>;
  previousPlan: PlanLike;
}): string {
  const freedCandidates: PlanBlock[] = [];
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
