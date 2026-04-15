import { config } from '../data/config';
import { useLongPressTooltip } from '../hooks/useLongPressTooltip';

interface StatusIconRowProps {
  hungerSatisfied: boolean;
  hungerDamage: number;
  hungerDebt: number;
  thirstSatisfied: boolean;
  thirstDamage: number;
  warmthSatisfied: boolean;
  warmthDamage: number;
  vitalityDelta?: number;
}

interface SurvivalBarProps {
  symbol: string;
  label: string;
  value: number;
  max: number;
  state: 'safe' | 'warn' | 'danger';
  statusText: string;
  tooltip?: string;
}

function SurvivalBar({ symbol, label, value, max, state, statusText, tooltip }: SurvivalBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((Math.max(0, value) / max) * 100)) : 0;
  const fillColor =
    state === 'safe' ? 'var(--success)' :
    state === 'warn' ? 'var(--warn)' :
    'var(--vitality-critical)';
  const { handlers, tooltip: tooltipNode } = useLongPressTooltip(tooltip);

  return (
    <>
      <div className={`survival-bar ${state}`} title={tooltip} {...handlers}>
        <span className="survival-bar-label">
          <span className="survival-bar-symbol">{symbol}</span>
          <span className="survival-bar-name">{label}</span>
        </span>
        <div className="survival-bar-track">
          <div className="survival-bar-fill" style={{ width: `${pct}%`, background: fillColor }} />
        </div>
        <span className="survival-bar-status">{statusText}</span>
      </div>
      {tooltipNode}
    </>
  );
}

export function StatusIconRow({
  hungerSatisfied,
  hungerDamage,
  hungerDebt,
  thirstSatisfied,
  thirstDamage,
  warmthSatisfied,
  warmthDamage,
  vitalityDelta,
}: StatusIconRowProps) {
  const threshold = config.hungerMissesPerDamage;

  // Hunger bar: depletes over missed rounds before dealing damage
  const hungerLevel = hungerSatisfied
    ? threshold
    : hungerDamage > 0
      ? 0
      : Math.max(0, threshold - hungerDebt - 1);
  const hungerState: SurvivalBarProps['state'] =
    hungerSatisfied ? 'safe' : hungerDamage > 0 ? 'danger' : 'warn';
  const hungerStatus = hungerSatisfied
    ? 'FED'
    : hungerDamage > 0
      ? `−${hungerDamage}♥`
      : 'HUNGRY';

  // Thirst bar: binary (no accumulation mechanic)
  const thirstLevel = thirstSatisfied ? 1 : 0;
  const thirstState: SurvivalBarProps['state'] = thirstSatisfied ? 'safe' : 'danger';
  const thirstStatus = thirstSatisfied ? 'OK' : `−${thirstDamage}♥`;

  // Warmth bar: binary
  const warmthLevel = warmthSatisfied ? 1 : 0;
  const warmthState: SurvivalBarProps['state'] = warmthSatisfied ? 'safe' : 'danger';
  const warmthStatus = warmthSatisfied ? 'OK' : `−${warmthDamage}♥`;

  return (
    <div className="survival-bars">
      <SurvivalBar
        symbol="✦"
        label="Hunger"
        value={hungerLevel}
        max={threshold}
        state={hungerState}
        statusText={hungerStatus}
        tooltip={`Hunger: ${hungerSatisfied ? 'satisfied' : hungerDamage > 0 ? `takes ${hungerDamage} vitality damage` : `${threshold - hungerLevel} miss(es) — ${threshold - hungerDebt - 1} round(s) before damage`}`}
      />
      <SurvivalBar
        symbol="◈"
        label="Thirst"
        value={thirstLevel}
        max={1}
        state={thirstState}
        statusText={thirstStatus}
        tooltip={`Thirst: ${thirstSatisfied ? 'satisfied' : `takes ${thirstDamage} vitality damage`}`}
      />
      <SurvivalBar
        symbol="△"
        label="Warmth"
        value={warmthLevel}
        max={1}
        state={warmthState}
        statusText={warmthStatus}
        tooltip={`Warmth: ${warmthSatisfied ? 'satisfied' : `takes ${warmthDamage} vitality damage`}`}
      />
      {vitalityDelta !== undefined && (
        <div
          className={`status-forecast ${vitalityDelta > 0 ? 'positive' : vitalityDelta < 0 ? 'negative' : 'neutral'}`}
          title="Projected vitality change at end of round"
        >
          {vitalityDelta > 0 ? '+' : ''}{vitalityDelta} ♥
        </div>
      )}
    </div>
  );
}
