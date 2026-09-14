'use client';

import { useStudentOSData } from '@/lib/state/StudentOSProvider';
import { ExamCard } from '@/components/activities/ExamCard';
import { TaskCard } from '@/components/activities/TaskCard';
import { ExamForm } from '@/components/activities/ExamForm';
import { TaskForm } from '@/components/activities/TaskForm';

// Activities tab (spec §11): two mirrored sections, Exams then Tasks &
// assignments.
export default function ActivitiesPage() {
  const { exams, tasks } = useStudentOSData();

  return (
    <>
      <section className="tab-section">
        <h2 className="section-title">Exams</h2>
        {exams.length === 0 ? (
          <p className="muted-note">No exams yet. Add one below.</p>
        ) : (
          exams.map((exam) => <ExamCard key={exam.id} exam={exam} />)
        )}
        <ExamForm />
      </section>

      <section className="tab-section">
        <h2 className="section-title">Tasks &amp; assignments</h2>
        {tasks.length === 0 ? (
          <p className="muted-note">No standalone tasks yet. Add one below.</p>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
        <TaskForm />
      </section>
    </>
  );
}
