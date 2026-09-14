'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useStudentOSActions } from '@/lib/state/StudentOSProvider';
import type { Importance } from '@/lib/engine';

export function ExamForm() {
  const { addExam } = useStudentOSActions();
  const [subject, setSubject] = useState('');
  const [examDate, setExamDate] = useState('');
  const [topics, setTopics] = useState('');
  // Defaults to 'medium', matching the previous silent fallback exactly —
  // existing behavior doesn't change for anyone who doesn't touch this
  // control, but it's now a visible, changeable choice instead of an
  // invisible default (see StudentOSProvider's ADD_EXAM case).
  const [importance, setImportance] = useState<Importance>('medium');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const topicNames = topics
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);

    if (!subject.trim()) return setError('Give the exam a subject.');
    if (!examDate) return setError('Pick an exam date.');
    if (topicNames.length === 0) return setError('Add at least one topic to study.');

    setError(null);
    addExam({ subject: subject.trim(), examDate, topicNames, importance });
    setSubject('');
    setExamDate('');
    setTopics('');
    setImportance('medium');
  }

  return (
    <form className="add-form" noValidate onSubmit={handleSubmit}>
      <div className="add-form-row">
        <input
          type="text"
          className="input input-subject"
          placeholder="Subject"
          aria-label="Exam subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <input
          type="date"
          className="input input-date"
          aria-label="Exam date"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
        />
        <select
          className="input"
          aria-label="Exam importance"
          value={importance}
          onChange={(e) => setImportance(e.target.value as Importance)}
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <input
          type="text"
          className="input input-wide"
          placeholder="Topics, comma separated"
          aria-label="Exam topics"
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
        />
        <button type="submit" className="btn-dark">
          Add exam
        </button>
      </div>
      <p className="error-text" hidden={!error}>
        {error}
      </p>
    </form>
  );
}
