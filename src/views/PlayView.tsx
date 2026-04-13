import { useState } from 'react';
import type { AIStrategy, GameState, MaterialType } from '../types';
import { createNewGame } from '../engine/state';
import { prepareRound, resolveCraftTurn, resolveDraftTurn, resolveIncomePhase, resolvePressureAndAdvance, resolveMaintenancePhase } from '../engine/round';
import { runDraftPhase } from '../engine/draft';
import { canCraftRecipe, getAvailableRecipes } from '../engine/craft';
import { chooseCraftAction, chooseDraftPick, explainCraftChoice, explainDraftPick } from '../ai/decisions';
import { scenarios } from '../data/scenarios';
import { profiles } from '../data/profiles';
import { MaterialPill } from '../components/MaterialPill';
import { RescueBar } from '../components/RescueBar';
import { PlayerCard } from '../components/PlayerCard';
import { CommandPanel } from '../components/CommandPanel';
import { RecipeCard } from '../components/RecipeCard';
import { scorePlayer } from '../engine/scoring';
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
          {game.currentEvent && (
            <span
              className={`chip ${game.currentEvent.family === 'escalation' ? '' : ''}`}
              style={{
                background: game.currentEvent.family === 'escalation'
                  ? 'var(--danger-dim)' : game.currentEvent.family === 'opportunity'
                  ? 'var(--success-dim)' : 'var(--surface3)',
                borderColor: game.currentEvent.family === 'escalation'
                  ? 'var(--danger-border)' : game.currentEvent.family === 'opportunity'
                  ? 'var(--success-border)' : 'var(--border)',
                color: game.currentEvent.family === 'escalation'
                  ? 'var(--danger)' : game.currentEvent.family === 'opportunity'
                  ? 'var(--success)' : 'var(--text-muted)',
              }}
              title={game.currentEvent.description}
            >
              {game.currentEvent.family === 'escalation' ? '⚠ ' : game.currentEvent.family === 'opportunity' ? '★ ' : ''}
              {game.currentEvent.name}
            </span>
          )}
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
              <CommandPanel player={humanPlayer} state={game} />
            </>
          )}
        </div>

        {/* ── Col 2: Market + Craft (stacked) ── */}
        <div className="play-action-col">

          {/* Market */}
          <div className="card flex-col gap-3">
            <div className="flex justify-between align-center">
              <h3>Center Market</h3>
              <span className="text-xs text-muted">
                {game.market.available.length}/6 · Bag: {game.bagRemaining.length} left
              </span>
            </div>

            {game.market.available.length === 0 ? (
              <span className="text-sm text-muted">Market empty</span>
            ) : (
              <div className="market-grid">
                {game.market.available.map((mat, i) => (
                  <div
                    key={`${mat}-${i}`}
                    className={`market-slot${isHumanDraftTurn ? ' pickable' : ''}`}
                    onClick={() => isHumanDraftTurn && handleDraftPick(mat)}
                    role={isHumanDraftTurn ? 'button' : undefined}
                    tabIndex={isHumanDraftTurn ? 0 : undefined}
                    onKeyDown={(e) => isHumanDraftTurn && e.key === 'Enter' && handleDraftPick(mat)}
                  >
                    <MaterialPill material={mat} />
                    <span className="market-slot-age">R{game.market.roundDrawn[i]}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 align-center">
              {isHumanDraftTurn ? (
                <>
                  <span className="text-xs text-accent">Pick a material — or pass.</span>
                  <button onClick={() => handleDraftPick(null)}>Pass Draft</button>
                </>
              ) : isHumanCraftTurn ? (
                <span className="text-xs text-muted">Craft phase — choose a recipe below.</span>
              ) : (
                <span className="text-xs text-muted">
                  {game.gameOver ? 'Game over.' : `↻ ${currentPlayer?.name ?? '—'} is deciding...`}
                </span>
              )}
            </div>
          </div>

          {/* Craft panel — below market */}
          {!game.gameOver && isHumanCraftTurn && (
            <div className="card flex-col gap-3">
              <div className="flex justify-between align-center">
                <h3>Craft</h3>
                <button onClick={() => handleCraftPick(null)}>Pass Craft</button>
              </div>

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
                  <div className="section-label">Locked (can't afford)</div>
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

              {availableRecipes.length === 0 && (
                <span className="text-sm text-muted">No recipes available this round.</span>
              )}
            </div>
          )}

          {/* Game over scores */}
          {game.gameOver && (
            <div className="card flex-col gap-2">
              <h3>Final Scores</h3>
              {[...game.players]
                .sort((a, b) => scorePlayer(b, game) - scorePlayer(a, game))
                .map((p, rank) => (
                  <div key={p.id} className="sim-metric">
                    <span className="sim-metric-label">
                      {rank === 0 ? '★ ' : ''}
                      {p.name} · {p.profile.name}
                      {p.id === game.winner ? ' — WINNER' : ''}
                    </span>
                    <span className="flex gap-3 text-xs">
                      <span className="text-rescue">⚑ {p.rescueScore}</span>
                      <span className="text-vitality">♥ {p.vitality}</span>
                      <span className="text-muted">{p.builtRecipes.length} builds</span>
                      <span className="bold">{scorePlayer(p, game)} pts</span>
                    </span>
                  </div>
                ))}
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
                  <span className="log-round">[R{entry.round}]</span>
                  <span className="log-actor">{getLogActorLabel(game, entry)}</span>
                  <span>{formatLogAction(entry.action)}</span>
                  {entry.detail && <span className="log-detail">— {entry.detail}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── AI players strip ── */}
      <div className="play-ai-row">
        <span className="text-xs text-dim" style={{ alignSelf: 'center', marginRight: 4 }}>
          Opponents:
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
