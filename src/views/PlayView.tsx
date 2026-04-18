import { useState } from 'react';
import type { AIStrategy, GameState, MaterialType } from '../types';
import { useLongPressTooltip } from '../hooks/useLongPressTooltip';
import { createNewGame } from '../engine/state';
import { prepareRound, resolveCraftTurn, resolveDraftTurn, resolveIncomePhase, resolvePressureAndAdvance, resolveMaintenancePhase } from '../engine/round';
import { runDraftPhase } from '../engine/draft';
import { canCraftRecipe, getAvailableRecipes } from '../engine/craft';
import { chooseCraftAction, chooseDraftPick, explainCraftChoice, explainDraftPick } from '../ai/decisions';
import { getMeterGlyph } from '../data/iconography';
import { scenarios } from '../data/scenarios';
import { profiles } from '../data/profiles';
import { MaterialPill } from '../components/MaterialPill';
import { RescueBar } from '../components/RescueBar';
import { PlayerCard } from '../components/PlayerCard';
import { RecipeCard } from '../components/RecipeCard';
import { getScoreBreakdown, scorePlayer } from '../engine/scoring';
import { randomSeed } from '../utils/rng';
import { formatLogAction, getLogActorLabel } from './insights';

type Phase = 'draft' | 'craft';

const AI_PLAYER_COUNT = 4;
const TOTAL_PLAYERS = AI_PLAYER_COUNT + 1;
const HUMAN_PLAYER_ID = 'player-1';
const DEFAULT_AI_PROFILES = ['provider', 'trapper', 'scout', 'builder'];
const DEFAULT_AI_STRATEGIES: AIStrategy[] = ['balanced', 'cautious', 'balanced', 'rescueFocused'];

interface AdvanceResult {
  game: GameState;
  phase: Phase;
  decisionIndex: number;
}

function EventChip({ event }: { event: GameState['currentEvent'] }) {
  const { handlers, tooltip } = useLongPressTooltip(event?.description);
  if (!event) return null;
  const bg =
    event.family === 'escalation' ? 'var(--danger-dim)' :
    event.family === 'opportunity' ? 'var(--success-dim)' : 'var(--surface3)';
  const borderColor =
    event.family === 'escalation' ? 'var(--danger-border)' :
    event.family === 'opportunity' ? 'var(--success-border)' : 'var(--border)';
  const color =
    event.family === 'escalation' ? 'var(--danger)' :
    event.family === 'opportunity' ? 'var(--success)' : 'var(--text-muted)';
  return (
    <>
      <span
        className="chip"
        style={{ background: bg, borderColor, color }}
        title={event.description}
        {...handlers}
      >
        {event.family === 'escalation' ? '⚠ ' : event.family === 'opportunity' ? '★ ' : ''}
        {event.name}
      </span>
      {tooltip}
    </>
  );
}

function LogChip({
  label,
  icon,
  tone = 'neutral',
}: {
  label: string;
  icon: string;
  tone?: 'neutral' | 'warn' | 'danger' | 'rescue' | 'vitality';
}) {
  return (
    <span className={`log-chip ${tone}`}>
      <span className="log-chip-icon" aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </span>
  );
}

function MarketSlotItem({
  mat,
  roundDrawn,
  pickable,
  onPick,
}: {
  mat: MaterialType;
  roundDrawn: number;
  pickable: boolean;
  onPick: () => void;
}) {
  const tooltipText = `${mat} · drawn R${roundDrawn}`;
  const { handlers, tooltip } = useLongPressTooltip(tooltipText);
  return (
    <>
      <div
        className={`market-slot${pickable ? ' pickable' : ''}`}
        onClick={() => pickable && onPick()}
        role={pickable ? 'button' : undefined}
        tabIndex={pickable ? 0 : undefined}
        onKeyDown={(e) => pickable && e.key === 'Enter' && onPick()}
        title={tooltipText}
        {...handlers}
      >
        <MaterialPill material={mat} />
      </div>
      {tooltip}
    </>
  );
}

export function PlayView() {
  const [game, setGame] = useState<GameState | null>(null);
  const [phase, setPhase] = useState<Phase>('draft');
  const [decisionIndex, setDecisionIndex] = useState(0);
  const [scenarioId, setScenarioId] = useState('forest');
  const [humanProfileId, setHumanProfileId] = useState('builder');
  const [aiProfiles] = useState<string[]>(DEFAULT_AI_PROFILES);
  const [aiStrategies] = useState<AIStrategy[]>(DEFAULT_AI_STRATEGIES);

  const startGame = () => {
    const scenario = scenarios.find((s) => s.id === scenarioId)!;
    const humanProfile = profiles.find((p) => p.id === humanProfileId)!;
    const selectedProfiles = [
      humanProfile,
      ...aiProfiles.map((id) => profiles.find((p) => p.id === id)!),
    ];

    let state = createNewGame({
      playerCount: TOTAL_PLAYERS,
      scenario,
      profiles: selectedProfiles,
      aiStrategies: ['balanced', ...aiStrategies],
      rngSeed: randomSeed(),
    });

    state = {
      ...state,
      players: state.players.map((player, index) => ({
        ...player,
        isAI: index !== 0,
      })),
    };

    const prepared = runDraftPhase(prepareRound(state));
    const next = advanceUntilHumanOrEnd(prepared, 'draft', 0);
    setGame(next.game);
    setPhase(next.phase);
    setDecisionIndex(next.decisionIndex);
  };

  const resetGame = () => {
    setGame(null);
    setPhase('draft');
    setDecisionIndex(0);
  };

  const continueFromHumanAction = (nextState: GameState, nextPhase: Phase, nextIndex: number) => {
    const next = advanceUntilHumanOrEnd(nextState, nextPhase, nextIndex);
    setGame(next.game);
    setPhase(next.phase);
    setDecisionIndex(next.decisionIndex);
  };

  const handleDraftPick = (pick: MaterialType | null) => {
    if (!game || game.gameOver) return;
    const playerId = game.turnOrder[decisionIndex];
    const nextState = resolveDraftTurn(game, playerId, pick);
    continueFromHumanAction(nextState, 'draft', decisionIndex + 1);
  };

  const handleCraftPick = (recipeId: string | null) => {
    if (!game || game.gameOver) return;
    const playerId = game.turnOrder[decisionIndex];
    const nextState = resolveCraftTurn(game, playerId, recipeId);
    continueFromHumanAction(nextState, 'craft', decisionIndex + 1);
  };

  // ── Setup screen ──
  if (!game) {
    return (
      <div className="setup-screen">
        <div className="setup-form">
          <h2>New Game</h2>
          <p className="text-sm text-muted">You vs. 4 AI opponents. Pick your setup and survive.</p>

          <div className="flex-col gap-2">
            <label>Scenario</label>
            <select value={scenarioId} onChange={(e) => setScenarioId(e.target.value)}>
              {scenarios.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="text-xs text-dim">
              {scenarios.find(s => s.id === scenarioId)?.description ?? ''}
            </div>
            <div className="flex gap-1 wrap">
              {scenarios.find(s => s.id === scenarioId)?.identityTags?.map((tag) => (
                <span key={tag} className="tag active">{tag}</span>
              ))}
            </div>
            <div className="text-xs text-muted">
              {scenarios.find(s => s.id === scenarioId)?.playstyleHint ?? ''}
            </div>
          </div>

          <div className="flex-col gap-2">
            <label>Your Profile</label>
            <select value={humanProfileId} onChange={(e) => setHumanProfileId(e.target.value)}>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="text-xs text-dim">
              {profiles.find(p => p.id === humanProfileId)?.perk.description ?? ''}
            </div>
          </div>

          <button className="primary" onClick={startGame} style={{ marginTop: 4 }}>
            Start Game
          </button>
        </div>
      </div>
    );
  }

  // ── In-game state ──
  const currentTurnPlayerId = !game.gameOver ? game.turnOrder[decisionIndex] : null;
  const currentPlayer = currentTurnPlayerId
    ? game.players.find((p) => p.id === currentTurnPlayerId) ?? null
    : null;
  const humanPlayer = game.players.find((p) => p.id === HUMAN_PLAYER_ID) ?? null;

  const isHumanDraftTurn = phase === 'draft' && currentTurnPlayerId === HUMAN_PLAYER_ID;
  const isHumanCraftTurn = phase === 'craft' && currentTurnPlayerId === HUMAN_PLAYER_ID;

  const availableRecipes = humanPlayer
    ? getAvailableRecipes(humanPlayer, game)
    : [];
  const affordableRecipes = availableRecipes.filter((r) => canCraftRecipe(humanPlayer!, r, game));
  const lockedRecipes = availableRecipes.filter((r) => !canCraftRecipe(humanPlayer!, r, game));

  const recentLog = game.log.slice(-18).reverse();

  const turnLabel = game.gameOver
    ? null
    : currentPlayer
      ? `${currentPlayer.name} · ${phase === 'draft' ? 'Drafting' : 'Crafting'}`
      : null;

  return (
    <div className="play-layout">
      {/* ── Game header ── */}
      <div className="game-header">
          <div className="game-header-left">
            <span className="round-badge">Round {game.round}</span>
            <span className="scenario-name">{game.scenario.name}</span>
            <span className="scenario-flavor">{game.scenario.identityTags?.join(' · ') ?? ''}</span>
            <EventChip event={game.currentEvent} />
          </div>

        <div className="game-header-center">
          <RescueBar current={game.groupRescueTrack} threshold={game.groupRescueThreshold} />
        </div>

        <div className="game-header-right">
          {game.gameOver ? (
            <span className="game-over-banner">
              {game.endCondition === 'rescue' ? '⚑ RESCUED' : 'GAME OVER'}
              {game.winner
                ? ` — ${game.players.find((p) => p.id === game.winner)?.name} wins`
                : game.endCondition === 'allCollapsed' ? ' — All collapsed'
                : ''}
            </span>
          ) : (
            <>
              {turnLabel && (
                <span className={`turn-indicator${currentTurnPlayerId !== HUMAN_PLAYER_ID ? ' waiting' : ''}`}>
                  {currentTurnPlayerId === HUMAN_PLAYER_ID ? '▶ Your turn' : `↻ ${turnLabel}`}
                </span>
              )}
            </>
          )}
          <button onClick={resetGame}>New Game</button>
        </div>
      </div>

      {/* ── Main 3-column layout ── */}
      <div className="play-body">

        {/* ── Col 1: Human camp ── */}
        <div className="play-camp-col">
          {humanPlayer && (
            <>
              <PlayerCard
                player={humanPlayer}
                state={game}
                isCurrentTurn={currentTurnPlayerId === HUMAN_PLAYER_ID}
                seatLabel="You"
              />
            </>
          )}
        </div>

        {/* ── Col 2: Market + Craft (stacked) ── */}
        <div className="play-action-col">

          {/* Market */}
          <div className="market-strip">
            {game.market.available.length === 0 ? (
              <span className="text-sm text-muted">Market empty</span>
            ) : (
              game.market.available.map((mat, i) => (
                <MarketSlotItem
                  key={`${mat}-${i}`}
                  mat={mat}
                  roundDrawn={game.market.roundDrawn[i]}
                  pickable={isHumanDraftTurn}
                  onPick={() => handleDraftPick(mat)}
                />
              ))
            )}
            {isHumanDraftTurn && (
              <button className="market-pass" onClick={() => handleDraftPick(null)}>Pass</button>
            )}
          </div>

          {/* Craft panel — below market */}
          {!game.gameOver && isHumanCraftTurn && (
            <div className="card flex-col gap-3 craft-panel">
              <div className="flex justify-between align-center">
                <h3>Craft</h3>
                <button onClick={() => handleCraftPick(null)}>Pass Craft</button>
              </div>

              <div className="craft-panel__lists">
                {affordableRecipes.length > 0 && (
                  <div>
                  <div className="section-label">Available</div>
                  <div className="recipe-cards">
                    {affordableRecipes.map((recipe) => (
                      <RecipeCard
                        key={recipe.id}
                        recipe={recipe}
                        player={humanPlayer!}
                        state={game}
                        onCraft={(id) => handleCraftPick(id)}
                        showCraftButton
                      />
                    ))}
                  </div>
                  </div>
                )}

                {lockedRecipes.length > 0 && (
                  <div>
                  <div className="section-label">⊘ Locked</div>
                  <div className="recipe-cards">
                    {lockedRecipes.map((recipe) => (
                      <RecipeCard
                        key={recipe.id}
                        recipe={recipe}
                        player={humanPlayer!}
                        state={game}
                        showCraftButton={false}
                      />
                    ))}
                  </div>
                  </div>
                )}
              </div>

              {availableRecipes.length === 0 && (
                <span className="text-sm text-muted">No recipes available this round.</span>
              )}
            </div>
          )}

          {/* Game over scores */}
          {game.gameOver && (
            <div className="card flex-col gap-2">
              <h3>Final Scores</h3>
              <div className="score-chip-grid">
                {[...game.players]
                  .sort((a, b) => scorePlayer(b, game) - scorePlayer(a, game))
                  .map((p, rank) => {
                    const breakdown = getScoreBreakdown(p, game);
                    return (
                    <div key={p.id} className={`score-chip${p.id === game.winner ? ' winner' : ''}`}>
                      <div className="score-chip__head">
                        <span className="score-chip__name">
                          {rank === 0 ? '★ ' : ''}
                          {p.name}
                        </span>
                        <span className="score-chip__profile">{p.profile.name}</span>
                      </div>
                      <div className="score-chip__stats">
                        <span className="score-chip__stat text-muted">C {breakdown.craftPoints}</span>
                        <span className="score-chip__stat text-muted">U {breakdown.usePoints}</span>
                        <span className="score-chip__stat text-rescue">{getMeterGlyph('rescue')} {breakdown.rescuePoints}</span>
                        <span className="score-chip__stat text-vitality">{getMeterGlyph('vitality')} {breakdown.survivalPoints}</span>
                        <span className="score-chip__stat text-muted">⚙ {breakdown.enginePoints}</span>
                        <span className="score-chip__stat score-chip__total">★ {scorePlayer(p, game)}</span>
                      </div>
                    </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* ── Col 3: Event + Log ── */}
        <div className="play-log-col">
          {game.currentEvent && (
            <div className={`event-banner ${game.currentEvent.family}`}>
              <div className="event-banner-title">
                {game.currentEvent.family === 'escalation' ? '⚠ ' : game.currentEvent.family === 'opportunity' ? '★ ' : ''}
                {game.currentEvent.name}
              </div>
              <div className="event-banner-desc">{game.currentEvent.description}</div>
            </div>
          )}

          {/* Turn order */}
          <div className="card flex-col gap-2">
            <h3>Turn Order</h3>
            <div className="flex-col gap-1">
              {game.turnOrder.map((id, i) => {
                const p = game.players.find((pl) => pl.id === id);
                if (!p) return null;
                return (
                  <div
                    key={id}
                    className="flex justify-between text-xs"
                    style={{ color: id === currentTurnPlayerId ? 'var(--accent)' : 'var(--text-muted)' }}
                  >
                    <span>{i + 1}. {p.name}</span>
                    <span>{p.isAI ? 'AI' : 'You'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action log */}
          <div className="card flex-col gap-2" style={{ flex: 1 }}>
            <h3>Action Log</h3>
            <div className="log-entries">
              {recentLog.map((entry, i) => (
                <div key={i} className="log-entry">
                  <LogChip label={`R${entry.round}`} icon="R" />
                  <LogChip
                    label={getLogActorLabel(game, entry)}
                    icon={entry.playerId === 'system' ? '⚑' : entry.playerId === HUMAN_PLAYER_ID ? '◎' : '◦'}
                    tone={entry.playerId === 'system' ? 'warn' : 'neutral'}
                  />
                  <LogChip
                    label={formatLogAction(entry.action)}
                    icon={entry.action === 'craft' ? '✦' : entry.action === 'maintenance' ? '↻' : entry.action === 'perk' ? '⟲' : entry.action === 'game-over' ? '⛔' : entry.action === 'pressure' ? '☠' : '•'}
                    tone={entry.action === 'game-over' ? 'danger' : entry.action === 'pressure' ? 'warn' : entry.action === 'perk' ? 'rescue' : 'neutral'}
                  />
                  {entry.detail && <span className="log-detail">{entry.detail}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── AI players strip ── */}
      <div className="play-ai-row">
        <span className="text-xs text-dim" style={{ alignSelf: 'center', marginRight: 4 }}>
          ⊹
        </span>
        {game.players
          .filter((p) => p.isAI)
          .map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              state={game}
              isCurrentTurn={player.id === currentTurnPlayerId}
              seatLabel="AI"
              compact
            />
          ))}
      </div>
    </div>
  );
}

// ── Engine helpers (unchanged) ──

function advanceUntilHumanOrEnd(game: GameState, phase: Phase, decisionIndex: number): AdvanceResult {
  if (game.gameOver) return { game, phase, decisionIndex };
  if (phase === 'draft') return processDraftPhase(game, decisionIndex);
  return processCraftPhase(game, decisionIndex);
}

function processDraftPhase(game: GameState, startIndex: number): AdvanceResult {
  let state = game;
  for (let i = startIndex; i < state.turnOrder.length; i++) {
    const playerId = state.turnOrder[i];
    const player = state.players.find((p) => p.id === playerId);
    if (!player || player.collapsed) continue;
    if (playerId === HUMAN_PLAYER_ID) return { game: state, phase: 'draft', decisionIndex: i };
    const pick = chooseDraftPick(player, state.market, state);
    const detail = explainDraftPick(player, state.market, state, pick);
    state = resolveDraftTurn(state, playerId, pick, detail);
  }
  state = resolveIncomePhase(state);
  state = resolveMaintenancePhase(state);
  return processCraftPhase(state, 0);
}

function processCraftPhase(game: GameState, startIndex: number): AdvanceResult {
  let state = game;
  for (let i = startIndex; i < state.turnOrder.length; i++) {
    const playerId = state.turnOrder[i];
    const player = state.players.find((p) => p.id === playerId);
    if (!player || player.collapsed) continue;
    if (playerId === HUMAN_PLAYER_ID) return { game: state, phase: 'craft', decisionIndex: i };
    const chosenRecipe = chooseCraftAction(player, state);
    const detail = explainCraftChoice(player, state, chosenRecipe);
    state = resolveCraftTurn(state, playerId, chosenRecipe?.id ?? null, detail);
  }
  state = resolvePressureAndAdvance(state);
  if (state.gameOver) return { game: state, phase: 'craft', decisionIndex: 0 };
  state = prepareRound(state);
  state = runDraftPhase(state);
  return processDraftPhase(state, 0);
}
