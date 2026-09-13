export function ProgressBar({ fraction, color }: { fraction: number; color: string }) {
  const percent = Math.min(100, Math.max(0, fraction * 100));
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${percent}%`, background: color }} />
    </div>
  );
}
