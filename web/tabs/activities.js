// Activities tab (spec §11): two mirrored sections, Exams then Tasks &
// assignments. Exam item-cards nest a nested list of topic rows; task
// item-cards use the same row component for their own single row, so the
// re-estimate stepper and Done control are visually identical wherever they
// appear, matching the "on each topic/task row" wording in the spec's
// definition of done (§17).

import { el } from '../dom.js';
import { subjectColor, formatDueMeta } from '../format.js';
import { ESTIMATE_STEP_MINUTES } from '../state.js';

function showError(node, message) {
  node.textContent = message;
  node.hidden = false;
}

function hideError(node) {
  node.hidden = true;
  node.textContent = '';
}

function renderProgressBar(fraction, color) {
  const track = el('div', { class: 'progress-track' });
  const fill = el('div', { class: 'progress-fill' });
  fill.style.width = `${Math.min(100, Math.max(0, fraction * 100))}%`;
  fill.style.background = color;
  track.append(fill);
  return track;
}

function renderStepper(item, state) {
  const label = item.name ?? item.title;
  const wrap = el('div', { class: 'stepper' + (item.completed ? ' is-disabled' : '') });

  const dec = el('button', {
    type: 'button',
    class: 'stepper-btn',
    'aria-label': `Decrease estimate for ${label}`,
    text: '−',
    disabled: item.completed,
    onClick: () => state.adjustEstimate(item, -ESTIMATE_STEP_MINUTES),
  });

  const value = el('span', { class: 'stepper-value', text: `${item.estimatedMinutes}m` });

  const inc = el('button', {
    type: 'button',
    class: 'stepper-btn',
    'aria-label': `Increase estimate for ${label}`,
    text: '+',
    disabled: item.completed,
    onClick: () => state.adjustEstimate(item, ESTIMATE_STEP_MINUTES),
  });

  wrap.append(dec, value, inc);
  return wrap;
}

function renderRow(item, state) {
  const row = el('div', { class: 'item-row' + (item.completed ? ' is-done' : '') });
  row.append(el('span', { class: 'item-row-name', text: item.name ?? item.title }));
  row.append(renderStepper(item, state));

  if (!item.completed) {
    row.append(
      el('button', {
        type: 'button',
        class: 'mini-btn',
        text: 'Done',
        onClick: () => state.completeItem(item),
      })
    );
  }

  return row;
}

function renderExamCard(exam, state) {
  const totalEstimate = exam.topics.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const totalDone = exam.topics.reduce((sum, t) => sum + t.minutesDone, 0);
  const progress = totalEstimate > 0 ? totalDone / totalEstimate : 0;
  const color = subjectColor(exam.subject);

  const left = el('div', { class: 'item-card-left' }, [
    el('span', { class: 'dot', style: `background:${color}` }),
    el('span', { class: 'item-card-title', text: exam.subject }),
  ]);

  const right = el('div', { class: 'item-card-right' }, [
    el('span', { class: 'item-card-meta', text: formatDueMeta(exam.examDate) }),
    el('button', {
      type: 'button',
      class: 'btn-del',
      'aria-label': `Remove ${exam.subject}`,
      text: '×',
      onClick: () => state.deleteExam(exam.id),
    }),
  ]);

  const header = el('div', { class: 'item-card-header' }, [left, right]);
  const list = el('div', { class: 'topic-list' }, exam.topics.map((topic) => renderRow(topic, state)));

  return el('div', { class: 'item-card' }, [header, renderProgressBar(progress, color), list]);
}

function renderTaskCard(task, state) {
  const progress = task.estimatedMinutes > 0 ? task.minutesDone / task.estimatedMinutes : 0;
  const color = subjectColor(task.subject);

  const left = el('div', { class: 'item-card-left' }, [
    el('span', { class: 'dot', style: `background:${color}` }),
    el('span', { class: 'item-card-title', text: task.title }),
  ]);

  const right = el('div', { class: 'item-card-right' }, [
    el('span', { class: 'item-card-meta', text: formatDueMeta(task.dueDate) }),
    el('button', {
      type: 'button',
      class: 'btn-del',
      'aria-label': `Remove ${task.title}`,
      text: '×',
      onClick: () => state.deleteTask(task.id),
    }),
  ]);

  const header = el('div', { class: 'item-card-header' }, [left, right]);
  const list = el('div', { class: 'topic-list' }, [renderRow(task, state)]);

  return el('div', { class: 'item-card' }, [header, renderProgressBar(progress, color), list]);
}

function renderExamForm(state) {
  const subjectInput = el('input', {
    type: 'text',
    class: 'input input-subject',
    placeholder: 'Subject',
    'aria-label': 'Exam subject',
  });
  const dateInput = el('input', { type: 'date', class: 'input input-date', 'aria-label': 'Exam date' });
  const topicsInput = el('input', {
    type: 'text',
    class: 'input input-wide',
    placeholder: 'Topics, comma separated',
    'aria-label': 'Exam topics',
  });
  const submit = el('button', { type: 'submit', class: 'btn-dark', text: 'Add exam' });
  const errorText = el('p', { class: 'error-text', hidden: true });

  const form = el('form', { class: 'add-form', novalidate: true }, [
    el('div', { class: 'add-form-row' }, [subjectInput, dateInput, topicsInput, submit]),
    errorText,
  ]);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const subject = subjectInput.value.trim();
    const examDate = dateInput.value;
    const topicNames = topicsInput.value
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);

    if (!subject) return showError(errorText, 'Give the exam a subject.');
    if (!examDate) return showError(errorText, 'Pick an exam date.');
    if (topicNames.length === 0) return showError(errorText, 'Add at least one topic to study.');

    hideError(errorText);
    state.addExam({ subject, examDate, topicNames });
    form.reset();
  });

  return form;
}

function renderTaskForm(state) {
  const subjectInput = el('input', {
    type: 'text',
    class: 'input input-subject',
    placeholder: 'Subject',
    'aria-label': 'Task subject',
  });
  const titleInput = el('input', {
    type: 'text',
    class: 'input input-wide',
    placeholder: 'What needs doing?',
    'aria-label': 'Task title',
  });
  const dateInput = el('input', { type: 'date', class: 'input input-date', 'aria-label': 'Due date' });
  const minutesInput = el('input', {
    type: 'number',
    class: 'input input-minutes',
    placeholder: '30',
    min: '5',
    step: '5',
    'aria-label': 'Estimated minutes',
  });
  const submit = el('button', { type: 'submit', class: 'btn-dark', text: 'Add task' });
  const errorText = el('p', { class: 'error-text', hidden: true });

  const form = el('form', { class: 'add-form', novalidate: true }, [
    el('div', { class: 'add-form-row' }, [subjectInput, titleInput, dateInput, minutesInput, submit]),
    errorText,
  ]);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const subject = subjectInput.value.trim();
    const title = titleInput.value.trim();
    const dueDate = dateInput.value;
    const estimatedMinutes = Number(minutesInput.value);

    if (!subject) return showError(errorText, 'Give the task a subject.');
    if (!title) return showError(errorText, 'Say what the task is.');
    if (!dueDate) return showError(errorText, 'Pick a due date.');
    if (!estimatedMinutes || estimatedMinutes <= 0) return showError(errorText, 'Add an estimate in minutes.');

    hideError(errorText);
    state.addTask({ subject, title, dueDate, estimatedMinutes });
    form.reset();
  });

  return form;
}

export function renderActivities(container, state) {
  container.replaceChildren();

  const examsSection = el('section', { class: 'tab-section' }, [el('h2', { class: 'section-title', text: 'Exams' })]);
  if (state.exams.length === 0) {
    examsSection.append(el('p', { class: 'muted-note', text: 'No exams yet. Add one below.' }));
  } else {
    state.exams.forEach((exam) => examsSection.append(renderExamCard(exam, state)));
  }
  examsSection.append(renderExamForm(state));

  const tasksSection = el('section', { class: 'tab-section' }, [
    el('h2', { class: 'section-title', text: 'Tasks & assignments' }),
  ]);
  if (state.tasks.length === 0) {
    tasksSection.append(el('p', { class: 'muted-note', text: 'No standalone tasks yet. Add one below.' }));
  } else {
    state.tasks.forEach((task) => tasksSection.append(renderTaskCard(task, state)));
  }
  tasksSection.append(renderTaskForm(state));

  container.append(examsSection, tasksSection);
}
