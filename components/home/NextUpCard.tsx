'use client';

import { useState } from 'react';
import { usePlan, useStudentOSData, useStudentOSActions } from '@/lib/state/StudentOSProvider';
import { findWorkItem } from '@/lib/state/findWorkItem';
import { subjectColor } from '@/lib/format';
import { ReasonText } from '@/components/ReasonText';

const PARTIAL_STEP_MINUTES = 5;
const DEFAULT_PARTIAL_MINUTES = 15;

// The hero card (spec §11): the single next task, with the three adaptive-
// loop actions. "Did some of it" has no spec-given interaction beyond the
// button itself — since the app has no modals anywhere, clicking it swaps
// the 3-button row for an inline minutes-done stepper (reusing the same
// stepper component style as Activities) instead of popping a dialog.
export function NextUpCard() {
  const plan = usePlan();
  const data = useStudentOSData();
  const { completeItem, partialItem, skipItemToday } = useStudentOSActions();
  const [mode, setMode] = useState<'idle' | 'partial'>('idle');
  const [partialMinutes, setPartialMinutes] = useState(DEFAULT_PARTIAL_MINUTES);

  const block = plan.days[0]?.blocks[0];
  const item = block ? findWorkItem(data, block.itemId, block.type) : undefined;

  if (!block || !item) {
    return (
      <div className="next-card">
        <p className="eyebrow">NEXT UP</p>
        <p className="next-card-empty">
          Nothing left scheduled for today. Check Activities to add more, or look ahead in Scheduler.
        </p>
      </div>
    );
  }

  const remaining = item.estimatedMinutes - item.minutesDone;

  function startPartial() {
    setPartialMinutes(Math.min(remaining, DEFAULT_PARTIAL_MINUTES));
    setMode('partial');
  }

  return (
    <div className="next-card">
      <p className="eyebrow">NEXT UP</p>
      <span className="subject-pill" style={{ background: subjectColor(block.subject) }}>
        {block.subject}
      </span>
      <p className="next-card-label">{block.label}</p>
      <p className="next-card-minutes">{block.minutes}m</p>
      <ReasonText reason={block.reason} />

      {mode === 'idle' ? (
        <div className="next-card-actions">
          <button type="button" className="btn-gold" onClick={() => completeItem(item)}>
            Mark complete
          </button>
          <button type="button" className="btn-ghost" onClick={startPartial}>
            Did some of it
          </button>
          <button type="button" className="btn-ghost-muted" onClick={() => skipItemToday(item)}>
            Skip for now
          </button>
        </div>
      ) : (
        <div className="partial-entry">
          <span className="partial-entry-label">Minutes done:</span>
          <div className="stepper">
            <button
              type="button"
              className="stepper-btn"
              aria-label="Decrease minutes done"
              onClick={() => setPartialMinutes((m) => Math.max(PARTIAL_STEP_MINUTES, m - PARTIAL_STEP_MINUTES))}
            >
              −
            </button>
            <span className="stepper-value">{partialMinutes}m</span>
            <button
              type="button"
              className="stepper-btn"
              aria-label="Increase minutes done"
              onClick={() => setPartialMinutes((m) => Math.min(remaining, m + PARTIAL_STEP_MINUTES))}
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="btn-gold"
            onClick={() => {
              partialItem(item, partialMinutes);
              setMode('idle');
            }}
          >
            Log progress
          </button>
          <button type="button" className="btn-ghost-muted" onClick={() => setMode('idle')}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
