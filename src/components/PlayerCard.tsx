import type { PlayerState, GameState } from '../types';
import type { MaterialType } from '../types';
import { MaterialPill } from './MaterialPill';
import { StatBar } from './StatBar';
import { StatusIconRow } from './StatusIconRow';
import { BuildTile } from './BuildTile';
import { scorePlayer } from '../engine/scoring';
import { previewEndOfRoundOutcome } from '../engine/pressure';
import { getTagTooltip } from '../data/tagInfo';
import { getRecipeById } from '../data/recipes';
import { getSpecialCardById } from '../data/specialCards';
import { getEventTemperatureShift } from '../data/events';
import { playerHasTag } from '../engine/craft';
import { useLongPressTooltip } from '../hooks/useLongPressTooltip';

interface Props {
  player: PlayerState;
  state: GameState;
  isCurrentTurn?: boolean;
  seatLabel?: string;
  compact?: boolean;
}

const ALL_TAGS = ['Shelter', 'SturdyShelter', 'HearthActive', 'SustainedFire', 'FoodSource', 'Tool', 'SignalEngine'] as const;
const MAX_VITALITY = 10;

function TagBadge({ label, tooltip, className = 'tag active', children }: {
  label: string;
  tooltip?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const { handlers, tooltip: tooltipNode } = useLongPressTooltip(tooltip ?? label);
  return (
    <>
      <span className={className} title={tooltip} {...handlers}>{children ?? label}</span>
      {tooltipNode}
    </>
  );
}

export function PlayerCard({ player, state, isCurrentTurn, seatLabel, compact = false }: Props) {
  const score = scorePlayer(player, state);
  const inventoryEntries = Object.entries(player.inventory) as [MaterialType, number][];
  const survivalPreview = previewEndOfRoundOutcome(player, state);
  const activeTags = ALL_TAGS.filter((tag) => playerHasTag(player, state, tag));
  const warmthPressure = state.scenario.temperaturePressure + getEventTemperatureShift(state.currentEvent);

  if (compact) {
    return <CompactPlayerCard
      player={player}
      state={state}
      isCurrentTurn={isCurrentTurn}
      score={score}
      survivalPreview={survivalPreview}
      activeTags={activeTags}
    />;
  }

  return (
    <div
      className={`card flex-col gap-3${player.collapsed ? ' collapsed' : ''}${isCurrentTurn ? ' highlight' : ''}`}
    >
      {/* Header */}
      <div className="flex justify-between align-center">
        <div className="flex gap-2 align-center">
          <span className="player-name">{player.name}</span>
          {player.collapsed && (
            <span className="chip" style={{ background: 'var(--danger-dim)', borderColor: 'var(--danger-border)', color: 'var(--danger)' }}>
              COLLAPSED R{player.collapseRound}
            </span>
          )}
        </div>
        <div className="flex gap-2 align-center">
          <span className="player-meta">{player.profile.name}</span>
          {seatLabel && (
            <span className={`seat-badge ${seatLabel === 'You' ? 'human' : isCurrentTurn ? 'current' : 'ai'}`}>
              {seatLabel === 'You' ? 'YOU' : isCurrentTurn ? 'TURN' : 'AI'}
            </span>
          )}
        </div>
      </div>

      {/* Vitality bar */}
      <div className="camp-stats">
        <StatBar
          value={player.vitality}
          max={MAX_VITALITY}
          label="Vitality"
          variant="vitality"
          size="md"
          projectedValue={survivalPreview.projectedVitality}
        />
      </div>

      {/* Survival status */}
      <StatusIconRow
        hungerSatisfied={survivalPreview.hungerSatisfied}
        hungerDamage={survivalPreview.hungerDamage}
        hungerDebt={player.hungerDebt}
        thirstSatisfied={survivalPreview.thirstSatisfied}
        thirstDamage={survivalPreview.thirstDamage}
        warmthSatisfied={survivalPreview.warmthSatisfied}
        warmthDamage={survivalPreview.warmthDamage}
        warmthPressure={warmthPressure}
        vitalityDelta={survivalPreview.vitalityDelta}
      />

      {/* Score bars */}
      <div className="flex-col gap-2">
        <StatBar
          value={player.rescueScore}
          max={Math.max(player.rescueScore, Math.ceil(state.groupRescueThreshold / state.players.length))}
          label="⚑ Rescue"
          variant="rescue"
          size="sm"
        />
        <StatBar
          value={score}
          max={Math.max(score, 30)}
          label="★ Score"
          variant="accent"
          size="sm"
        />
      </div>

      {/* Inventory */}
      <div>
        <div className="section-label">Inventory</div>
        <div className="flex gap-1 wrap">
          {inventoryEntries.length === 0
            ? <span className="text-sm text-muted">—</span>
            : inventoryEntries.map(([mat, qty]) => (
                <MaterialPill key={mat} material={mat} count={qty} />
              ))}
        </div>
      </div>

      {/* Active tags */}
      {activeTags.length > 0 && (
        <div>
          <div className="section-label">Active Tags</div>
          <div className="flex gap-1 wrap">
            {activeTags.map((tag) => (
              <TagBadge key={tag} label={tag} tooltip={getTagTooltip(tag)} />
            ))}
          </div>
        </div>
      )}

      {/* Built structures */}
      {player.builtRecipes.length > 0 && (
        <div>
          <div className="section-label">Built</div>
          <div className="build-tiles">
            {player.builtRecipes.map((id) => (
              <BuildTile
                key={id}
                recipeId={id}
                isOffline={player.maintenanceInactiveRecipes.includes(id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Maintenance offline (recipes not in builtRecipes — shouldn't happen but guard) */}
      {player.maintenanceInactiveRecipes
        .filter((id) => !player.builtRecipes.includes(id))
        .length > 0 && (
        <div>
          <div className="section-label">Maintenance Offline</div>
          <div className="build-tiles">
            {player.maintenanceInactiveRecipes
              .filter((id) => !player.builtRecipes.includes(id))
              .map((id) => (
                <BuildTile key={id} recipeId={id} isOffline />
              ))}
          </div>
        </div>
      )}

      {/* Special cards / blueprints */}
      {player.specialCards.length > 0 && (
        <div>
          <div className="section-label">Blueprints</div>
          <div className="flex gap-1 wrap">
            {player.specialCards.map((owned) => {
              const card = getSpecialCardById(owned.id);
              if (!card) return null;
              return (
                <TagBadge
                  key={`${owned.source}-${owned.id}-${owned.earnedRound ?? 'start'}`}
                  label={card.name}
                  tooltip={`${card.name}: ${card.printEffectText}`}
                >
                  {card.name}
                  <span className="text-dim" style={{ marginLeft: 4 }}>
                    {owned.source === 'starting' ? 'start' : `R${owned.earnedRound ?? '?'}`}
                  </span>
                </TagBadge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Compact card for AI players ── */
interface CompactProps {
  player: PlayerState;
  state: GameState;
  isCurrentTurn?: boolean;
  score: number;
  survivalPreview: ReturnType<typeof previewEndOfRoundOutcome>;
  activeTags: readonly string[];
}

function CompactPlayerCard({ player, isCurrentTurn, score, survivalPreview }: CompactProps) {
  return (
    <div className={`player-card-compact${isCurrentTurn ? ' current-turn' : ''}${player.collapsed ? ' collapsed' : ''}`}>
      <div className="flex justify-between align-center">
        <div className="flex gap-2 align-center">
          <span style={{ fontSize: 12, fontWeight: 'bold' }}>{player.name}</span>
          {player.collapsed && (
            <span className="text-xs text-danger">†R{player.collapseRound}</span>
          )}
        </div>
        <div className="flex gap-1 align-center">
          <span className="text-xs text-muted">{player.profile.name}</span>
          {isCurrentTurn && <span className="seat-badge current">TURN</span>}
        </div>
      </div>

      <StatBar
        value={player.vitality}
        max={10}
        variant="vitality"
        size="sm"
        showValues={false}
        projectedValue={survivalPreview.projectedVitality}
      />

      <div className="flex justify-between align-center">
        <div className="flex gap-1">
          <span
            className={`text-xs ${survivalPreview.hungerSatisfied ? 'text-success' : 'text-danger'}`}
            title="Hunger"
          >✦</span>
          <span
            className={`text-xs ${survivalPreview.thirstSatisfied ? 'text-success' : 'text-danger'}`}
            title="Thirst"
          >◈</span>
          <span
            className={`text-xs ${survivalPreview.warmthSatisfied ? 'text-success' : 'text-danger'}`}
            title="Warmth"
          >△</span>
        </div>
        <div className="flex gap-2">
          <span className="text-xs text-vitality">♥{player.vitality}</span>
          <span className="text-xs text-rescue">⚑{player.rescueScore}</span>
          <span className="text-xs text-muted">★{score}</span>
        </div>
      </div>

      {player.builtRecipes.length > 0 && (
        <div className="text-xs text-dim">
          {player.builtRecipes.length} build{player.builtRecipes.length !== 1 ? 's' : ''}
          {': '}
          {player.builtRecipes
            .slice(0, 3)
            .map((id) => getRecipeById(id)?.name ?? id)
            .join(', ')}
          {player.builtRecipes.length > 3 ? ` +${player.builtRecipes.length - 3}` : ''}
        </div>
      )}
    </div>
  );
}
