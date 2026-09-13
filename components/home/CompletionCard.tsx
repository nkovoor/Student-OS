'use client';

import { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import { subjectColor } from '@/lib/format';
import { SubjectLegend } from '@/components/SubjectLegend';
import type { LegendEntry } from '@/components/SubjectLegend';

// Spec §11/§12: 180×180 doughnut, 68% cutout, no built-in legend — paired
// with the custom SubjectLegend component underneath. Chart.js is used
// directly (no React wrapper library), per the build brief's dependency list.
export function CompletionCard({ entries }: { entries: LegendEntry[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart<'doughnut', number[], string> | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const sorted = [...entries].sort((a, b) => b.minutes - a.minutes);

    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: sorted.map((entry) => entry.subject),
        datasets: [
          {
            data: sorted.map((entry) => entry.minutes),
            backgroundColor: sorted.map((entry) => subjectColor(entry.subject)),
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { display: false },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [entries]);

  return (
    <div className="card">
      <h3 className="card-title">This week&rsquo;s completion</h3>
      <div className="doughnut-wrap">
        <canvas ref={canvasRef} />
      </div>
      {entries.length === 0 ? (
        <p className="muted-note">Nothing completed yet this week.</p>
      ) : (
        <SubjectLegend entries={entries} />
      )}
    </div>
  );
}
