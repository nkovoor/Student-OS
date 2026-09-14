'use client';

import { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import { useTheme } from '@/lib/theme';
import type { Theme } from '@/lib/theme';
import type { WeeklyTrendPoint } from '@/lib/progressStats';

// Chart.js needs resolved color strings, not CSS custom properties, so these
// mirror the same theme-keyed token values app/globals.css declares —
// same approach lib/format.ts's subjectColor table already uses for the
// doughnut chart, for the same reason.
const NEUTRAL_BAR: Record<Theme, string> = {
  light: '#EEF1FB', // --surface-2
  dark: '#252340', // --surface-2
};
const CURRENT_WEEK_BAR = '#FF7A1A'; // --accent, same value in both themes
const GRID_LINE: Record<Theme, string> = {
  light: '#E7E9F5', // --border
  dark: '#302E4C', // --border
};
const TICK_COLOR: Record<Theme, string> = {
  light: '#7B7E93', // --muted
  dark: '#8C89A8', // --muted
};

// Spec §11/§12: bar chart, 4 weeks, neutral bars except the current week in
// accent, y-axis ticks suffixed "m", no vertical gridlines — deliberately a
// different implementation from Home's day-strip (see globals.css), which is
// plain CSS rather than Chart.js.
export function WeeklyTrendCard({ points }: { points: WeeklyTrendPoint[] }) {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart<'bar', number[], string> | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: points.map((point) => point.label),
        datasets: [
          {
            data: points.map((point) => point.minutes),
            backgroundColor: points.map((point) => (point.isCurrent ? CURRENT_WEEK_BAR : NEUTRAL_BAR[theme])),
            borderRadius: 4,
            maxBarThickness: 40,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: TICK_COLOR[theme], font: { family: 'Inter', size: 11 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: GRID_LINE[theme] },
            ticks: {
              color: TICK_COLOR[theme],
              font: { family: 'Inter', size: 11 },
              callback: (value) => `${value}m`,
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [points, theme]);

  return (
    <div className="card">
      <h3 className="card-title">Weekly trend</h3>
      <div className="trend-chart-wrap">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
