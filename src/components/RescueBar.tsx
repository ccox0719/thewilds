interface Props {
  current: number;
  threshold: number;
  label?: string;
  size?: 'sm' | 'md';
}

export function RescueBar({ current, threshold, label = 'Group Rescue', size = 'md' }: Props) {
  const pct = Math.min(100, Math.round((current / threshold) * 100));
  return (
    <div className="rescue-bar">
      <div className="rescue-bar-header">
        <span className="rescue-bar-title">⚑ {label}</span>
        <span className="rescue-bar-value">{current} / {threshold}</span>
      </div>
      <div className="rescue-bar-track" style={{ height: size === 'sm' ? 5 : 8 }}>
        <div className="rescue-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
