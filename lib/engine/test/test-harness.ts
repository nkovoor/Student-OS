// Small, dependency-free harness: runs the allocator across two renders and
// prints the resulting 7-day plans so the output can be eyeballed, plus a set
// of assertions (using Node's built-in assert) that pin down the invariants
// the spec cares about — budgets never exceeded, skips honored, capacity
// delta arithmetic, and reasons only appearing where a day assignment moved.
//
// Run with: npm run test:engine

import assert from 'node:assert/strict';
import { generatePlan } from '../planner';
import type { Plan } from '../planner';
import { withComplete, withPartial, withSkippedToday, withEstimate } from '../model';
import type { Exam, Task, CompletionLogEntry } from '../model';
import { buildSampleData } from './sample-data';
import { toISODate } from '../dateUtils';

const TODAY = toISODate(new Date());

function printPlan(title: string, plan: Plan): void {
  console.log(`\n=== ${title} (today = ${TODAY}) ===`);
  for (const day of plan.days) {
    const header = `${day.dayLabel.padEnd(9)} ${day.date} (${day.weekday})  budget ${String(day.budgetMinutes).padStart(3)}m  planned ${String(day.plannedMinutes).padStart(3)}m`;
    console.log(header);
    if (day.isFree) {
      console.log('  · Free — no work scheduled');
      continue;
    }
    for (const block of day.blocks) {
      console.log(`  · [${block.subject}] ${block.label} — ${block.minutes}m`);
      if (block.reason) console.log(`      → ${block.reason}`);
    }
  }
  console.log(
    `Capacity: ${plan.capacityDelta.label}  (planned ${plan.capacityDelta.plannedMinutesSoFar}m vs budget ${plan.capacityDelta.budgetConsumedSoFar}m)`
  );
}

function sumBudgetsRespected(plan: Plan): void {
  for (const day of plan.days) {
    assert.ok(
      day.plannedMinutes <= day.budgetMinutes,
      `day ${day.date} over-allocated: planned ${day.plannedMinutes}m > budget ${day.budgetMinutes}m`
    );
  }
}

// --- Render 1: fresh plan, no previous render to diff against ---

const data = buildSampleData(TODAY);
const plan1 = generatePlan({ ...data, today: TODAY, previousPlan: null });
printPlan('Render 1 — initial plan', plan1);

sumBudgetsRespected(plan1);
for (const day of plan1.days) {
  for (const block of day.blocks) {
    assert.equal(block.reason, null, 'no reasons should exist on the very first render');
  }
}
// Everything should be scheduled somewhere in the 7-day window given the
// sample data's light load, so nothing should be left off entirely.
const expectedItems = ['task_essay', 'topic_forces', 'topic_bonding', 'topic_algebra', 'topic_geometry', 'topic_trig', 'task_history'];
for (const id of expectedItems) {
  assert.ok(id in plan1.assignments, `${id} should be scheduled somewhere in render 1`);
}

// --- Apply the adaptive-loop actions between renders (immutably, the same
// way lib/state's reducer splices an updated item back into its list) ---

function replaceTopic(exams: Exam[], topicId: string, next: Exam['topics'][number]): Exam[] {
  return exams.map((exam) =>
    exam.topics.some((t) => t.id === topicId) ? { ...exam, topics: exam.topics.map((t) => (t.id === topicId ? next : t)) } : exam
  );
}

function replaceTask(tasks: Task[], taskId: string, next: Task): Task[] {
  return tasks.map((t) => (t.id === taskId ? next : t));
}

let { exams, tasks, completionLog } = data;
const logAppend = (entry: CompletionLogEntry | null, log: CompletionLogEntry[]) => (entry ? [...log, entry] : log);

// hero action: Mark complete — Forces & motion
{
  const forces = exams[1].topics.find((t) => t.id === 'topic_forces')!;
  const { item, logEntry } = withComplete(forces, TODAY);
  exams = replaceTopic(exams, forces.id, item);
  completionLog = logAppend(logEntry, completionLog);
}

// hero action: Did some of it — English essay draft, 20 minutes
{
  const essay = tasks.find((t) => t.id === 'task_essay')!;
  const { item, logEntry } = withPartial(essay, 20, TODAY);
  tasks = replaceTask(tasks, essay.id, item);
  completionLog = logAppend(logEntry, completionLog);
}

// hero action: Skip for now — Chemical bonding, today only
{
  const bonding = exams[1].topics.find((t) => t.id === 'topic_bonding')!;
  exams = replaceTopic(exams, bonding.id, withSkippedToday(bonding, TODAY));
}

// re-estimate stepper: Geometry practice set, 90 -> 60
{
  const geometry = exams[0].topics.find((t) => t.id === 'topic_geometry')!;
  exams = replaceTopic(exams, geometry.id, withEstimate(geometry, 60));
}

// --- Render 2: same day, immediately rebuilt (spec's core interaction) ---

const plan2 = generatePlan({ exams, tasks, availability: data.availability, bookedSlots: data.bookedSlots, today: TODAY, completionLog, previousPlan: plan1 });
printPlan('Render 2 — after complete / partial / skip / re-estimate', plan2);

sumBudgetsRespected(plan2);

// Completed items must disappear from the plan entirely.
assert.ok(!('topic_forces' in plan2.assignments), 'a completed topic must not be scheduled');

// Skipping "today" must keep the item off today specifically, without
// dropping it from the week.
const bondingDay0 = plan2.days[0].blocks.find((b) => b.itemId === 'topic_bonding');
assert.equal(bondingDay0, undefined, 'a topic skipped for today must not appear on day 0');
assert.ok('topic_bonding' in plan2.assignments, 'a topic skipped for today should still land on a later day');

// A reason must appear on every item whose earliest day changed, and only those.
for (const [itemId, newDate] of Object.entries(plan2.assignments)) {
  const prevDate = plan1.assignments[itemId];
  const block = plan2.days.find((d) => d.date === newDate)!.blocks.find((b) => b.itemId === itemId)!;
  if (prevDate && prevDate !== newDate) {
    assert.ok(block.reason, `${itemId} moved from ${prevDate} to ${newDate} but has no reason text`);
  } else {
    assert.equal(block.reason, null, `${itemId} did not move but has reason text: "${block.reason}"`);
  }
}

// The item bumped by the essay's urgency should say so by name.
const bondingReasonDay = plan2.days.find((d) => d.date === plan2.assignments.topic_bonding)!;
const bondingReason = bondingReasonDay.blocks.find((b) => b.itemId === 'topic_bonding')!.reason!;
assert.match(bondingReason, /^moved here — English essay draft .* took priority$/);

// An item that moved earlier because forces was completed should say so.
const algebraReasonDay = plan2.days.find((d) => d.date === plan2.assignments.topic_algebra)!;
const algebraReason = algebraReasonDay.blocks.find((b) => b.itemId === 'topic_algebra')!.reason!;
assert.match(algebraReason, /^moved up — Forces & motion was marked done$/);

// Capacity delta arithmetic: planned-so-far (completion log, this week) minus
// budget-consumed-so-far (Mon..today budgets) — recomputed independently here.
const loggedThisWeek = completionLog.reduce((sum, e) => sum + e.minutes, 0); // both log entries are dated today
assert.equal(plan2.capacityDelta.plannedMinutesSoFar, loggedThisWeek);
assert.equal(
  plan2.capacityDelta.minutes,
  plan2.capacityDelta.plannedMinutesSoFar - plan2.capacityDelta.budgetConsumedSoFar
);
assert.equal(
  plan2.capacityDelta.status,
  plan2.capacityDelta.minutes > 0 ? 'ahead' : plan2.capacityDelta.minutes < 0 ? 'behind' : 'on-track'
);

console.log('\nAll assertions passed.');
