import type { GameState, PlayerState } from '../types';
import { getCommandPanelData } from '../views/insights';

interface Props {
  player: PlayerState;
  state: GameState;
}

const ENGINE_CONFIG = [
  { key: 'foodEngine',       label: 'Food',       symbol: '✦', color: 'var(--warn)' },
  { key: 'waterEngine',      label: 'Water',      symbol: '◈', color: 'var(--accent)' },
  { key: 'warmthEngine',     label: 'Warmth',     symbol: '△', color: 'var(--danger)' },
  { key: 'signalEngine',     label: 'Signal',     symbol: '⚑', color: 'var(--rescue)' },
  { key: 'processingEngine', label: 'Processing', symbol: '⚙', color: 'var(--vitality)' },
] as const;

export function CommandPanel({ player, state }: Props) {
  const data = getCommandPanelData(player, state);
  const hasEngines = ENGINE_CONFIG.some((e) => (data[e.key] as string[]).length > 0);

  return (
    <div className="card flex-col gap-3">
      <div className="flex justify-between align-center">
        <h3>Camp Overview</h3>
        <span className="text-xs text-muted">
          Score: <span className="bold text-sm" style={{ color: 'var(--text)' }}>{data.score.total.toFixed(0)} pts</span>
          <span className="text-muted"> (rescue {data.score.rescuePoints.toFixed(0)} · vit {data.score.vitalityPoints.toFixed(0)} · builds {data.score.persistentBuildPoints.toFixed(0)})</span>
        </span>
      </div>

      {/* Strengths + Risks */}
      {(data.strengths.length > 0 || data.risks.length > 0) && (
        <div className="flex gap-2 wrap">
          {data.strengths.map((s) => (
            <span key={s} className="status-icon safe" style={{ fontSize: 11 }}>✓ {s}</span>
          ))}
          {data.risks.map((r) => (
            <span key={r} className="status-icon danger" style={{ fontSize: 11 }}>! {r}</span>
          ))}
        </div>
      )}

      {/* Engine lanes */}
      {hasEngines && (
        <div>
          <div className="section-label">Active Engines</div>
          <div className="flex gap-2 wrap">
            {ENGINE_CONFIG.map(({ key, label, symbol, color }) => {
              const names = data[key] as string[];
              if (!names.length) return null;
              return (
                <div
                  key={key}
                  className="build-tile"
                  style={{ borderColor: color, background: `color-mix(in srgb, transparent 85%, ${color})` }}
                >
                  <span style={{ color }}>{symbol}</span>
                  <span>{label}</span>
                  <span className="build-tile-type">{names.join(', ')}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Maintenance upcoming */}
      {data.maintenanceUpcoming.length > 0 && (
        <div>
          <div className="section-label">Upkeep Due</div>
          <div className="flex gap-2 wrap">
            {data.maintenanceUpcoming.map((line) => (
              <span key={line} className="tag" style={{ color: 'var(--warn)', borderColor: 'var(--warn-border)' }}>
                {line}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Blueprint cards */}
      {data.activeCards.length > 0 && (
        <div>
          <div className="section-label">Blueprints</div>
          <div className="flex gap-1 wrap">
            {data.activeCards.map((text, i) => (
              <span key={i} className="tag active" title={text}>Blueprint {i + 1}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
