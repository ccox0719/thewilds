interface StatBarProps {
  value: number;
  max: number;
  label?: string;
  showValues?: boolean;
  /** For vitality: color shifts green → yellow → red based on ratio */
  variant?: 'vitality' | 'rescue' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  /** If provided, shows a red overlay from projectedValue% to value% */
  projectedValue?: number;
}

export function StatBar({
  value,
  max,
  label,
  showValues = true,
  variant = 'accent',
  size = 'md',
  projectedValue,
}: StatBarProps) {
  const clampedValue = Math.max(0, value);
  const pct = Math.min(100, Math.round((clampedValue / max) * 100));

  let fillColor: string;
  if (variant === 'vitality') {
    const ratio = clampedValue / max;
    if (ratio <= 0.25) fillColor = 'var(--vitality-critical)';
    else if (ratio <= 0.5) fillColor = 'var(--vitality-low)';
    else fillColor = 'var(--vitality)';
  } else if (variant === 'rescue') {
    fillColor = 'var(--rescue)';
  } else {
    fillColor = 'var(--accent)';
  }

  const projectedPct =
    projectedValue !== undefined
      ? Math.max(0, Math.min(100, Math.round((Math.max(0, projectedValue) / max) * 100)))
      : null;

  return (
    <div className="stat-bar">
      {(label || showValues) && (
        <div className="stat-bar-header">
          {label && <span className="stat-bar-label">{label}</span>}
          {showValues && (
            <span className="stat-bar-value" style={{ color: fillColor }}>
              {clampedValue} / {max}
            </span>
          )}
        </div>
      )}
      <div className={`stat-bar-track ${size}`}>
        <div className="stat-bar-fill" style={{ width: `${pct}%`, background: fillColor }} />
        {projectedPct !== null && projectedPct < pct && (
          <div
            className="stat-bar-projected"
            style={{ left: `${projectedPct}%`, width: `${pct - projectedPct}%` }}
          />
        )}
      </div>
    </div>
  );
}
