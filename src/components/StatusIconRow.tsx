import { config } from '../data/config';
import { getMeterGlyph } from '../data/iconography';
import { useLongPressTooltip } from '../hooks/useLongPressTooltip';

interface StatusIconRowProps {
  hungerSatisfied: boolean;
  hungerDamage: number;
  hungerDebt: number;
  thirstSatisfied: boolean;
  thirstDamage: number;
  warmthSatisfied: boolean;
  warmthDamage: number;
  warmthPressure: number;
  vitalityDelta?: number;
}

const WARMTH_LABELS = ['C3', 'C2', 'C1', 'OK', 'H1', 'H2', 'H3'] as const;

function formatDamageText(damage: number): string {
  return damage > 0 ? `TAKE ${damage} DMG` : 'BALANCED';
}

function MeterRow({
  icon,
  label,
  value,
  max,
  tone,
  status,
  tooltip,
}: {
  icon: string;
  label: string;
  value: number;
  max: number;
  tone: 'safe' | 'warn' | 'danger';
  status: string;
  tooltip: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((Math.max(0, value) / max) * 100)) : 0;
  const fillColor =
    tone === 'safe' ? 'var(--success)' :
    tone === 'warn' ? 'var(--warn)' :
    'var(--vitality-critical)';
  const { handlers, tooltip: tooltipNode } = useLongPressTooltip(tooltip);

  return (
    <>
      <div className={`survival-row ${tone}`} title={tooltip} {...handlers}>
        <span className="survival-row-label">
          <span className="survival-row-symbol" aria-hidden="true">{icon}</span>
          <span className="survival-row-name">{label}</span>
        </span>
        <div className="survival-row-track">
          <div className="survival-row-fill" style={{ width: `${pct}%`, background: fillColor }} />
        </div>
        <span className="survival-row-status">{status}</span>
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
  warmthPressure,
  vitalityDelta,
}: StatusIconRowProps) {
  const threshold = config.hungerMissesPerDamage;
  const hungerValue = hungerSatisfied
    ? threshold
    : hungerDamage > 0
      ? 0
      : Math.max(0, threshold - hungerDebt - 1);
  const hungerState: 'safe' | 'warn' | 'danger' = hungerSatisfied ? 'safe' : hungerDamage > 0 ? 'danger' : 'warn';
  const hungerStatus = hungerSatisfied
    ? 'BALANCED'
    : hungerDamage > 0
      ? formatDamageText(hungerDamage)
      : `${threshold - hungerValue} MISS`;

  const hydrationState: 'safe' | 'warn' | 'danger' = thirstSatisfied ? 'safe' : 'danger';
  const hydrationStatus = thirstSatisfied ? 'DRANK' : formatDamageText(thirstDamage);

  const warmthTone: 'safe' | 'warn' | 'danger' = warmthSatisfied ? 'safe' : warmthDamage <= 1 ? 'warn' : 'danger';
  const warmthStatus = warmthSatisfied ? 'BALANCED' : formatDamageText(warmthDamage);
  const markerIndex = Math.max(0, Math.min(6, 3 + warmthPressure));

  return (
    <div className="survival-bars">
      <MeterRow
        icon={getMeterGlyph('hunger')}
        label="Hunger"
        value={hungerValue}
        max={threshold}
        tone={hungerState}
        status={hungerStatus}
        tooltip={`Hunger: ${hungerSatisfied ? 'balanced' : hungerDamage > 0 ? `miss this check and take ${hungerDamage} vitality damage` : `${threshold - hungerValue} miss(es) before damage`}`}
      />

      <div className={`survival-row ${hydrationState}`}>
        <span className="survival-row-label">
          <span className="survival-row-symbol" aria-hidden="true">{getMeterGlyph('thirst')}</span>
          <span className="survival-row-name">Hydration</span>
        </span>
        <div className="survival-row-track">
          <div
            className="survival-row-fill"
            style={{ width: thirstSatisfied ? '100%' : '0%', background: thirstSatisfied ? 'var(--success)' : 'var(--vitality-critical)' }}
          />
        </div>
        <span className="survival-row-status">{hydrationStatus}</span>
      </div>

      <div className={`survival-row ${warmthTone}`}>
        <span className="survival-row-label">
          <span className="survival-row-symbol" aria-hidden="true">{getMeterGlyph('warmth')}</span>
          <span className="survival-row-name">Warmth</span>
        </span>
        <div className="warmth-track" title={warmthSatisfied ? 'Balanced: no damage' : `Miss this check and take ${warmthDamage} vitality damage`}>
          {['cold', 'cold', 'cold', 'comfort', 'heat', 'heat', 'heat'].map((zone, index) => (
            <span
              key={`${zone}-${index}`}
              className={`warmth-cell ${zone}${index === 3 ? ' center' : ''}${index === markerIndex ? ' marker' : ''}`}
            >
              <span className="warmth-cell-label">
                {WARMTH_LABELS[index]}
              </span>
            </span>
          ))}
          <span className="warmth-track-marker" style={{ left: `${(markerIndex / 6) * 100}%` }} aria-hidden="true" />
        </div>
        <span className="survival-row-status">{warmthStatus}</span>
      </div>

      {vitalityDelta !== undefined && (
        <div
          className={`status-forecast ${vitalityDelta > 0 ? 'positive' : vitalityDelta < 0 ? 'negative' : 'neutral'}`}
          title="Projected vitality change at end of round"
        >
          {vitalityDelta > 0 ? '+' : ''}{vitalityDelta} HP
        </div>
      )}
    </div>
  );
}
