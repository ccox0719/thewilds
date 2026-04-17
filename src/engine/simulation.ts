import type {
  SimulationConfig,
  SimulationResult,
  BatchSimulationResult,
  SimulationPlayerResult,
  ProfileBatchStats,
  GameState,
  SurvivalCheck,
  RoundEventFamily,
} from '../types';
import { createNewGame } from './state';
import { runFullRound } from './round';
import { scorePlayer } from './scoring';
import { recipes } from '../data/recipes';
import { getRoundEventForScenario } from '../data/events';

export function runGameSimulation(simConfig: SimulationConfig): SimulationResult {
  let state: GameState = createNewGame(simConfig);

  let safetyLimit = 0;
  while (!state.gameOver && safetyLimit < state.simulationCeiling + 2) {
    state = runFullRound(state);
    safetyLimit++;
  }

  if (!state.gameOver) {
    state = { ...state, gameOver: true, endCondition: 'simulationCeiling' };
    state = {
      ...state,
      log: [...state.log, { round: state.round, playerId: 'system', action: 'game-over', detail: 'Simulation ceiling reached' }],
    };
  }

  const playerResults: SimulationPlayerResult[] = state.players.map((player) => {
    const finalScore = scorePlayer(player, state);
    const persistentBuilds = player.builtRecipes.filter((id) => recipes.find((r) => r.id === id)?.persistent).length;

    const tier2RecipeIds = recipes.filter((r) => r.tier === 2).map((r) => r.id);
    const firstTier2Log = state.log.find(
      (entry) =>
        entry.playerId === player.id &&
        entry.action === 'craft' &&
        tier2RecipeIds.some((id) => entry.detail.includes(recipes.find((r) => r.id === id)?.name ?? '')),
    );
    const firstTier2RecipeRound = firstTier2Log?.round ?? null;

    const tier3RecipeIds = recipes.filter((r) => r.tier === 3).map((r) => r.id);
    const firstTier3Log = state.log.find(
      (entry) =>
        entry.playerId === player.id &&
        entry.action === 'craft' &&
        tier3RecipeIds.some((id) => entry.detail.includes(recipes.find((r) => r.id === id)?.name ?? '')),
    );
    const firstTier3RecipeRound = firstTier3Log?.round ?? null;

    return {
      playerId: player.id,
      profile: player.profile.id,
      aiStrategy: player.aiStrategy ?? 'balanced',
      finalScore,
      rescueScore: player.rescueScore,
      finalVitality: player.vitality,
      persistentBuilds,
      collapsed: player.collapsed,
      collapseRound: player.collapseRound,
      perkUsed: player.perkUsed,
      builtRecipes: player.builtRecipes,
      firstTier2RecipeRound,
      firstTier3RecipeRound,
      checkFailuresByRound: collectCheckFailuresByRound(state, player.id),
    };
  });

  const recipeUsageFrequency: Record<string, number> = {};
  for (const player of state.players) {
    for (const recipeId of player.builtRecipes) {
      recipeUsageFrequency[recipeId] = (recipeUsageFrequency[recipeId] ?? 0) + 1;
    }
  }

  const tier2RecipeIds = new Set(recipes.filter((r) => r.tier === 2).map((r) => r.id));
  const tier2RecipeUsageFrequency = Object.fromEntries(
    Object.entries(recipeUsageFrequency).filter(([id]) => tier2RecipeIds.has(id)),
  ) as Record<string, number>;
  const tier3RecipeIds = new Set(recipes.filter((r) => r.tier === 3).map((r) => r.id));
  const tier3RecipeUsageFrequency = Object.fromEntries(
    Object.entries(recipeUsageFrequency).filter(([id]) => tier3RecipeIds.has(id)),
  ) as Record<string, number>;

  const { eventFrequencyByFamily, eventFrequencyById } = collectEventTelemetry(state.scenario, state.rngSeed, state.round);
  const { maintenanceFailureCount, maintenanceDowntimeCount } = collectMaintenanceTelemetry(state);
  const { specialCardGrantFrequency, specialCardOwnershipFrequency } = collectSpecialCardTelemetry(state);

  return {
    gameId: state.gameId,
    rounds: state.round,
    endCondition: state.endCondition ?? 'simulationCeiling',
    winner: state.winner,
    groupRescueFinal: state.groupRescueTrack,
    groupRescueThreshold: state.groupRescueThreshold,
    rescueReached: state.groupRescueTrack >= state.groupRescueThreshold,
    players: playerResults,
    recipeUsageFrequency,
    tier2RecipeUsageFrequency,
    tier3RecipeUsageFrequency,
    eventFrequencyByFamily,
    eventFrequencyById,
    maintenanceFailureCount,
    maintenanceDowntimeCount,
    specialCardGrantFrequency,
    specialCardOwnershipFrequency,
    rngSeed: state.rngSeed,
    log: state.log,
  };
}

export function runBatchSimulation(simConfig: SimulationConfig, count: number): BatchSimulationResult {
  const results: SimulationResult[] = [];

  for (let i = 0; i < count; i++) {
    const seed = (simConfig.rngSeed ?? 0) + i * 997;
    results.push(runGameSimulation({ ...simConfig, rngSeed: seed }));
  }

  const totalPlayers = results.flatMap((r) => r.players);
  const totalGames = results.length;

  const avgScore = avg(totalPlayers.map((p) => p.finalScore));
  const avgRescue = avg(totalPlayers.map((p) => p.rescueScore));
  const avgVitality = avg(totalPlayers.map((p) => p.finalVitality));
  const avgRoundsPlayed = avg(results.map((r) => r.rounds));
  const survivalPercent = pct(totalPlayers.filter((p) => !p.collapsed).length, totalPlayers.length);
  const collapsePercent = pct(totalPlayers.filter((p) => p.collapsed).length, totalPlayers.length);
  const rescueReachedPercent = pct(results.filter((r) => r.rescueReached).length, totalGames);
  const allCollapsedPercent = pct(results.filter((r) => r.endCondition === 'allCollapsed').length, totalGames);
  const simulationCeilingPercent = pct(results.filter((r) => r.endCondition === 'simulationCeiling').length, totalGames);

  const collapseTimingDistribution: Record<number, number> = {};
  for (const player of totalPlayers) {
    if (player.collapsed && player.collapseRound !== null) {
      collapseTimingDistribution[player.collapseRound] = (collapseTimingDistribution[player.collapseRound] ?? 0) + 1;
    }
  }

  const recipeUsageFrequency: Record<string, number> = {};
  const tier2RecipeUsageFrequency: Record<string, number> = {};
  const tier3RecipeUsageFrequency: Record<string, number> = {};
  const eventFrequencyByFamily: Record<RoundEventFamily, number> = {
    opportunity: 0,
    escalation: 0,
    neutral: 0,
  };
  const eventFrequencyById: Record<string, number> = {};
  let maintenanceFailureCount = 0;
  let maintenanceDowntimeCount = 0;
  const specialCardGrantFrequency: Record<string, number> = {};
  const specialCardOwnershipFrequency: Record<string, number> = {};
  for (const result of results) {
    for (const [id, count] of Object.entries(result.recipeUsageFrequency)) {
      recipeUsageFrequency[id] = (recipeUsageFrequency[id] ?? 0) + count;
    }
    for (const [id, count] of Object.entries(result.tier2RecipeUsageFrequency)) {
      tier2RecipeUsageFrequency[id] = (tier2RecipeUsageFrequency[id] ?? 0) + count;
    }
    for (const [id, count] of Object.entries(result.tier3RecipeUsageFrequency)) {
      tier3RecipeUsageFrequency[id] = (tier3RecipeUsageFrequency[id] ?? 0) + count;
    }
    for (const [family, count] of Object.entries(result.eventFrequencyByFamily) as [RoundEventFamily, number][]) {
      eventFrequencyByFamily[family] += count;
    }
    for (const [id, count] of Object.entries(result.eventFrequencyById)) {
      eventFrequencyById[id] = (eventFrequencyById[id] ?? 0) + count;
    }
    maintenanceFailureCount += result.maintenanceFailureCount;
    maintenanceDowntimeCount += result.maintenanceDowntimeCount;
    for (const [id, count] of Object.entries(result.specialCardGrantFrequency)) {
      specialCardGrantFrequency[id] = (specialCardGrantFrequency[id] ?? 0) + count;
    }
    for (const [id, count] of Object.entries(result.specialCardOwnershipFrequency)) {
      specialCardOwnershipFrequency[id] = (specialCardOwnershipFrequency[id] ?? 0) + count;
    }
  }

  const checkFailureFrequency: Record<SurvivalCheck, number> = {
    hunger: 0,
    thirst: 0,
    warmth: 0,
  };
  for (const result of results) {
    for (const player of result.players) {
      for (const checks of Object.values(player.checkFailuresByRound)) {
        for (const check of checks) {
          checkFailureFrequency[check] += 1;
        }
      }
    }
  }

  const profileIds = [...new Set(totalPlayers.map((p) => p.profile))];
  const byProfile: Record<string, ProfileBatchStats> = {};
  for (const profileId of profileIds) {
    const pp = totalPlayers.filter((p) => p.profile === profileId);
    byProfile[profileId] = {
      avgScore: avg(pp.map((p) => p.finalScore)),
      avgRescue: avg(pp.map((p) => p.rescueScore)),
      avgVitality: avg(pp.map((p) => p.finalVitality)),
      survivalPercent: pct(pp.filter((p) => !p.collapsed).length, pp.length),
      perkUsagePercent: pct(pp.filter((p) => p.perkUsed).length, pp.length),
      firstTier2RecipeAvgRound: avg(pp.filter((p) => p.firstTier2RecipeRound !== null).map((p) => p.firstTier2RecipeRound!)),
      firstTier3RecipeAvgRound: avg(pp.filter((p) => p.firstTier3RecipeRound !== null).map((p) => p.firstTier3RecipeRound!)),
    };
  }

  const perksEnabled = simConfig.profiles.some((pr) => pr.perk.enabled);

  return {
    count: totalGames,
    scenario: simConfig.scenario.id,
    perksEnabled,
    avgScore,
    avgRescue,
    avgVitality,
    avgRoundsPlayed,
    survivalPercent,
    collapsePercent,
    rescueReachedPercent,
    allCollapsedPercent,
    simulationCeilingPercent,
    collapseTimingDistribution,
    checkFailureFrequency,
    recipeUsageFrequency,
    tier2RecipeUsageFrequency,
    tier3RecipeUsageFrequency,
    eventFrequencyByFamily,
    eventFrequencyById,
    maintenanceFailureCount,
    maintenanceDowntimeCount,
    specialCardGrantFrequency,
    specialCardOwnershipFrequency,
    byProfile,
  };
}

function collectCheckFailuresByRound(state: GameState, playerId: string): Record<number, SurvivalCheck[]> {
  const failures: Record<number, SurvivalCheck[]> = {};
  for (const entry of state.log) {
    if (entry.playerId !== playerId || entry.action !== 'pressure') continue;
    const checks = entry.detail
      .replace(/^Failed\s+/i, '')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean) as SurvivalCheck[];
    if (checks.length > 0) {
      failures[entry.round] = checks;
    }
  }
  return failures;
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function pct(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}

function collectEventTelemetry(
  scenario: GameState['scenario'],
  seed: number,
  roundsPlayed: number,
): { eventFrequencyByFamily: Record<RoundEventFamily, number>; eventFrequencyById: Record<string, number> } {
  const eventFrequencyByFamily: Record<RoundEventFamily, number> = {
    opportunity: 0,
    escalation: 0,
    neutral: 0,
  };
  const eventFrequencyById: Record<string, number> = {};

  for (let round = 1; round <= roundsPlayed; round += 1) {
    const event = getRoundEventForScenario(scenario, round, seed);
    if (!event) continue;
    eventFrequencyByFamily[event.family] += 1;
    eventFrequencyById[event.id] = (eventFrequencyById[event.id] ?? 0) + 1;
  }

  return { eventFrequencyByFamily, eventFrequencyById };
}

function collectMaintenanceTelemetry(state: GameState): { maintenanceFailureCount: number; maintenanceDowntimeCount: number } {
  let maintenanceFailureCount = 0;
  const downtimeKeys = new Set<string>();

  for (const entry of state.log) {
    if (entry.action !== 'maintenance') continue;
    maintenanceFailureCount += 1;
    downtimeKeys.add(`${entry.round}:${entry.playerId}`);
  }

  return { maintenanceFailureCount, maintenanceDowntimeCount: downtimeKeys.size };
}

function collectSpecialCardTelemetry(state: GameState): {
  specialCardGrantFrequency: Record<string, number>;
  specialCardOwnershipFrequency: Record<string, number>;
} {
  const specialCardGrantFrequency: Record<string, number> = {};
  const specialCardOwnershipFrequency: Record<string, number> = {};

  for (const player of state.players) {
    for (const card of player.specialCards) {
      specialCardOwnershipFrequency[card.id] = (specialCardOwnershipFrequency[card.id] ?? 0) + 1;
      if (card.source === 'earned') {
        specialCardGrantFrequency[card.id] = (specialCardGrantFrequency[card.id] ?? 0) + 1;
      }
    }
  }

  return { specialCardGrantFrequency, specialCardOwnershipFrequency };
}
