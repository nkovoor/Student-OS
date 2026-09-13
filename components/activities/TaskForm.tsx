'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useStudentOSActions } from '@/lib/state/StudentOSProvider';

export function TaskForm() {
  const { addTask } = useStudentOSActions();
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [minutes, setMinutes] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const estimatedMinutes = Number(minutes);

    if (!subject.trim()) return setError('Give the task a subject.');
    if (!title.trim()) return setError('Say what the task is.');
    if (!dueDate) return setError('Pick a due date.');
    if (!estimatedMinutes || estimatedMinutes <= 0) return setError('Add an estimate in minutes.');

    setError(null);
    addTask({ subject: subject.trim(), title: title.trim(), dueDate, estimatedMinutes });
    setSubject('');
    setTitle('');
    setDueDate('');
    setMinutes('');
  }

  return (
    <form className="add-form" noValidate onSubmit={handleSubmit}>
      <div className="add-form-row">
        <input
          type="text"
          className="input input-subject"
          placeholder="Subject"
          aria-label="Task subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <input
          type="text"
          className="input input-wide"
          placeholder="What needs doing?"
          aria-label="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="date"
          className="input input-date"
          aria-label="Due date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <input
          type="number"
          className="input input-minutes"
          placeholder="30"
          min={5}
          step={5}
          aria-label="Estimated minutes"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
        />
        <button type="submit" className="btn-dark">
          Add task
        </button>
      </div>
      <p className="error-text" hidden={!error}>
        {error}
      </p>
    </form>
  );
}
