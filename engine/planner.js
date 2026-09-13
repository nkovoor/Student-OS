// The urgency-ranked greedy allocator (spec §2) plus its two zero-cost
// derived outputs, capacity delta and reschedule reason (spec §18).
//
// The plan is never stored: generatePlan() is a pure function of its inputs.
// The one piece of state a caller should keep between renders is the return
// value itself, passed back in as `previousPlan` next time, purely so
// reschedule reasons have something to diff against (spec: "the day it was
// assigned on the previous render").

import { IMPORTANCE_WEIGHTS, DEFAULT_IMPORTANCE } from './model.js';
import { addDays, weekdayOf, startOfWeekMonday, diffInDays, slotDurationMinutes } from './dateUtils.js';
import { computeReasons } from './reasons.js';

function getLabel(item) {
  return item.name ?? item.title ?? item.id;
}

function allItems(exams, tasks) {
  return [...exams.flatMap((exam) => exam.topics), ...tasks];
}

function collectWorkItems(exams, tasks) {
  return allItems(exams, tasks).filter((item) => !item.completed && item.estimatedMinutes - item.minutesDone > 0);
}

// Urgency = importance weight ÷ days remaining (spec §2). Days remaining is
// clamped to a minimum of 1 so due-today/overdue items don't divide by zero
// or go negative — they simply rank as urgently as "due tomorrow" or higher.
function computeUrgency(item, todayISO) {
  const daysRemaining = Math.max(1, diffInDays(todayISO, item.dueDate));
  const weight = IMPORTANCE_WEIGHTS[item.importance] ?? IMPORTANCE_WEIGHTS[DEFAULT_IMPORTANCE];
  return weight / daysRemaining;
}

function rankByUrgency(items, todayISO) {
  return items
    .map((item) => ({ item, urgency: computeUrgency(item, todayISO) }))
    .sort((a, b) => {
      if (b.urgency !== a.urgency) return b.urgency - a.urgency;
      if (a.item.dueDate !== b.item.dueDate) return a.item.dueDate < b.item.dueDate ? -1 : 1;
      const la = getLabel(a.item);
      const lb = getLabel(b.item);
      if (la !== lb) return la < lb ? -1 : 1;
      return a.item.id < b.item.id ? -1 : 1;
    });
}

function dayBudgetMinutes(dateISO, availability, bookedSlots) {
  const weekday = weekdayOf(dateISO);
  const window = availability[weekday] ?? 0;
  const booked = bookedSlots
    .filter((slot) => slot.weekday === weekday)
    .reduce((sum, slot) => sum + slotDurationMinutes(slot), 0);
  return Math.max(0, window - booked);
}

function dayLabelFor(index, dateISO) {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  return weekdayOf(dateISO);
}

// Capacity delta (spec §18, §11): planned-minutes-so-far minus
// budget-consumed-so-far, for the current Mon–Sun week.
// "Planned minutes so far" = minutes actually logged done this week
// (completionLog), NOT minutes the allocator merely scheduled — the point is
// to compare real progress against the pace the budget implies.
// "Budget consumed so far" = the sum of daily budgets from Monday through
// today inclusive (today's whole-day budget counts once the day has arrived;
// this engine has no time-of-day granularity).
function computeCapacityDelta({ today, availability, bookedSlots, completionLog }) {
  const weekStart = startOfWeekMonday(today);
  const elapsedDayCount = diffInDays(weekStart, today) + 1;

  let budgetConsumedSoFar = 0;
  for (let i = 0; i < elapsedDayCount; i++) {
    budgetConsumedSoFar += dayBudgetMinutes(addDays(weekStart, i), availability, bookedSlots);
  }

  const plannedMinutesSoFar = completionLog
    .filter((entry) => entry.date >= weekStart && entry.date <= today)
    .reduce((sum, entry) => sum + entry.minutes, 0);

  const minutes = plannedMinutesSoFar - budgetConsumedSoFar;
  const status = minutes > 0 ? 'ahead' : minutes < 0 ? 'behind' : 'on-track';
  const label =
    status === 'ahead' ? `${minutes}m ahead of plan` : status === 'behind' ? `${Math.abs(minutes)}m behind plan` : 'On track';

  return { minutes, status, label, plannedMinutesSoFar, budgetConsumedSoFar };
}

/**
 * @param {object} args
 * @param {import('./model.js').Exam[]} args.exams
 * @param {import('./model.js').Task[]} args.tasks
 * @param {Record<string, number>} args.availability   weekday -> daily study minutes
 * @param {import('./model.js').BookedSlot[]} [args.bookedSlots]
 * @param {string} args.today                          'YYYY-MM-DD', the plan's day 0
 * @param {object[]} [args.completionLog]               entries from model.js's mark* mutators
 * @param {object|null} [args.previousPlan]             this same function's return value from the last render
 * @returns {{days: object[], assignments: Record<string,string>, capacityDelta: object}}
 */
export function generatePlan({ exams = [], tasks = [], availability, bookedSlots = [], today, completionLog = [], previousPlan = null }) {
  const workItems = collectWorkItems(exams, tasks);
  const ranked = rankByUrgency(workItems, today);
  const urgencyById = Object.fromEntries(ranked.map(({ item, urgency }) => [item.id, urgency]));

  // Per-render, ephemeral remaining-minutes bookkeeping — never written back
  // onto the actual item (that only happens via the model.js mutators).
  const remaining = new Map(ranked.map(({ item }) => [item.id, item.estimatedMinutes - item.minutesDone]));

  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(today, i);
    const budgetMinutes = dayBudgetMinutes(date, availability, bookedSlots);
    let freeBudget = budgetMinutes;
    const blocks = [];

    for (const { item, urgency } of ranked) {
      if (freeBudget <= 0) break;
      const left = remaining.get(item.id);
      if (left <= 0) continue;
      if (item.skipDates.includes(date)) continue;

      const allocate = Math.min(left, freeBudget);
      blocks.push({
        itemId: item.id,
        type: item.type,
        subject: item.subject,
        label: getLabel(item),
        dueDate: item.dueDate,
        importance: item.importance,
        urgency,
        minutes: allocate,
        reason: null, // filled in below once we know the previous render's assignments
      });
      remaining.set(item.id, left - allocate);
      freeBudget -= allocate;
    }

    days.push({
      date,
      weekday: weekdayOf(date),
      dayLabel: dayLabelFor(i, date),
      budgetMinutes,
      plannedMinutes: blocks.reduce((sum, b) => sum + b.minutes, 0),
      isFree: blocks.length === 0,
      blocks,
    });
  }

  // Earliest date each item landed on, this render — this is what next
  // render's previousPlan.assignments will be diffed against.
  const assignments = {};
  for (const day of days) {
    for (const block of day.blocks) {
      if (!(block.itemId in assignments)) assignments[block.itemId] = day.date;
    }
  }

  const itemsById = Object.fromEntries(allItems(exams, tasks).map((item) => [item.id, item]));
  const reasonsByItemId = computeReasons({ days, assignments, urgencyById, itemsById, previousPlan });
  for (const day of days) {
    for (const block of day.blocks) {
      // Only the block on the item's (new) earliest day carries the reason —
      // spec: reason sits "directly under the row" that moved, i.e. once per item.
      if (reasonsByItemId[block.itemId] && assignments[block.itemId] === day.date) {
        block.reason = reasonsByItemId[block.itemId];
      }
    }
  }

  const capacityDelta = computeCapacityDelta({ today, availability, bookedSlots, completionLog });

  return { today, days, assignments, capacityDelta };
}
