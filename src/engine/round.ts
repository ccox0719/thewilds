import type { GameState, MaterialType, Recipe } from '../types';
import { runDraftPhase, takeFromMarket } from './draft';
import { resolveEngineIncome, craftRecipe } from './craft';
import { runSurvivalPressurePhase } from './pressure';
import { determineWinner } from './scoring';
import { chooseCraftAction, chooseDraftPick } from '../ai/decisions';
import { addLog, createEmptySurvivalStatus } from './state';
import { recipes } from '../data/recipes';
import { getRoundEventForScenario } from '../data/events';

export function checkGroupRescueThreshold(state: GameState): boolean {
  return state.groupRescueTrack >= state.groupRescueThreshold;
}

export function areAllPlayersCollapsed(state: GameState): boolean {
  return state.players.every((player) => player.collapsed);
}

export function checkEndCondition(state: GameState): 'rescue' | 'allCollapsed' | 'simulationCeiling' | null {
  if (checkGroupRescueThreshold(state)) return 'rescue';
  if (areAllPlayersCollapsed(state)) return 'allCollapsed';
  if (state.round >= state.simulationCeiling) return 'simulationCeiling';
  return null;
}

export function advanceRound(state: GameState): GameState {
  const newTurnOrder = [...state.turnOrder.slice(1), state.turnOrder[0]];
  return {
    ...state,
    round: state.round + 1,
    turnOrder: newTurnOrder,
    firstPlayerIndex: (state.firstPlayerIndex + 1) % state.players.length,
  };
}

export function prepareRound(state: GameState): GameState {
  const currentEvent = getRoundEventForScenario(state.scenario, state.round);
  let prepared = resetRoundStatus(state);
  prepared = {
    ...prepared,
    currentEvent,
    players: prepared.players.map((player) => ({
      ...player,
      maintenanceInactiveRecipes: [],
    })),
  };
  if (currentEvent) {
    prepared = addLog(prepared, 'system', 'event', currentEvent.name);
  }
  return prepared;
}

export function resolveDraftTurn(state: GameState, playerId: string, pick: MaterialType | null, detail?: string): GameState {
  if (pick !== null) {
    return takeFromMarket(state, playerId, pick, detail);
  }
  return addLog(state, playerId, 'market-pass', detail ? `Passed on market — ${detail}` : 'Passed on market');
}

export function resolveIncomePhase(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((player) => resolveEngineIncome(player, state)),
  };
}

export function resolveMaintenancePhase(state: GameState): GameState {
  const players = state.players.map((player) => {
    if (player.collapsed) return { ...player, maintenanceInactiveRecipes: [] };
    let inventory = { ...player.inventory };
    const inactive: string[] = [];

    for (const recipeId of player.builtRecipes) {
      const recipe = recipes.find((entry) => entry.id === recipeId);
      if (!recipe?.maintenance) continue;
      const startRound = recipe.maintenance.startRound ?? 1;
      const interval = recipe.maintenance.interval ?? 1;
      if (state.round < startRound) continue;
      if ((state.round - startRound) % interval !== 0) continue;

      if (canPayMaintenance(inventory, recipe.maintenance.cost)) {
        inventory = payMaintenance(inventory, recipe.maintenance.cost);
        continue;
      }

      inactive.push(recipe.id);
    }

    return {
      ...player,
      inventory,
      maintenanceInactiveRecipes: inactive,
    };
  });

  let updatedState = { ...state, players };
  for (const player of players) {
    for (const recipeId of player.maintenanceInactiveRecipes) {
      const recipe = recipes.find((entry) => entry.id === recipeId);
      if (!recipe) continue;
      const detail = `Maintenance failed for ${recipe.name}`;
      updatedState = addLog(updatedState, player.id, 'maintenance', detail);
    }
  }

  return updatedState;
}

export function resolveCraftTurn(state: GameState, playerId: string, recipeId: string | null, detail?: string): GameState {
  let updatedState = state;
  const recipe = recipeId ? recipes.find((entry) => entry.id === recipeId) : null;
  if (recipe) {
    updatedState = applyBuilderPerk(updatedState, playerId, recipe);
  }
  if (recipeId !== null) {
    updatedState = craftRecipe(updatedState, playerId, recipeId, detail);
  }
  return updatedState;
}

export function resolvePressureAndAdvance(state: GameState): GameState {
  let s = runSurvivalPressurePhase(state);

  const endCondition = checkEndCondition(s);
  if (endCondition) {
    s = {
      ...s,
      gameOver: true,
      endCondition,
      winner: endCondition === 'allCollapsed' ? null : determineWinner(s),
    };
    s = addLog(s, 'system', 'game-over', `Game ended after round ${s.round} (${endCondition})`);
    return s;
  }

  return advanceRound(s);
}

export function runFullRound(state: GameState): GameState {
  let s = prepareRound(state);

  s = runDraftPhase(s);

  for (const playerId of s.turnOrder) {
    const player = s.players.find((p) => p.id === playerId);
    if (!player || player.collapsed) continue;

    const pick = chooseDraftPick(player, s.market, s);
    s = resolveDraftTurn(s, playerId, pick);
  }

  s = resolveIncomePhase(s);
  s = resolveMaintenancePhase(s);

  for (const playerId of s.turnOrder) {
    const player = s.players.find((p) => p.id === playerId);
    if (!player || player.collapsed) continue;

    const chosenRecipe = chooseCraftAction(player, s);
    s = resolveCraftTurn(s, playerId, chosenRecipe?.id ?? null);
  }

  return resolvePressureAndAdvance(s);
}

function resetRoundStatus(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      survivalStatus: createEmptySurvivalStatus(),
    })),
  };
}

function applyBuilderPerk(state: GameState, playerId: string, recipe: Recipe): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.perkUsed || player.profile.id !== 'builder') return state;
  if (!player.profile.perk.enabled) return state;
  if (!recipe.persistent || recipe.tier !== 2) return state;

  const chosenMaterial = chooseReductionMaterial(recipe);

  const updatedState = {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId
        ? {
            ...p,
            pendingCostReduction: {
              recipeId: recipe.id,
              material: chosenMaterial,
              amount: 1,
            },
            perkUsed: true,
            profile: { ...p.profile, perk: { ...p.profile.perk, usedThisGame: true } },
          }
        : p,
    ),
  };

  return addLog(updatedState, playerId, 'perk', `Builder: reduced ${recipe.name} cost by 1 ${chosenMaterial}`);
}

function chooseReductionMaterial(recipe: Recipe): MaterialType {
  const costEntries = Object.entries(recipe.cost) as [MaterialType, number][];
  let chosen: MaterialType = costEntries[0][0];
  let highestCost = Number.NEGATIVE_INFINITY;
  for (const [material, amount] of costEntries) {
    if (amount > highestCost) {
      highestCost = amount;
      chosen = material;
    }
  }
  return chosen;
}

function canPayMaintenance(
  inventory: Partial<Record<MaterialType, number>>,
  cost: Partial<Record<MaterialType, number>>,
): boolean {
  for (const [material, required] of Object.entries(cost) as [MaterialType, number][]) {
    if ((inventory[material] ?? 0) < required) return false;
  }
  return true;
}

function payMaintenance(
  inventory: Partial<Record<MaterialType, number>>,
  cost: Partial<Record<MaterialType, number>>,
): Partial<Record<MaterialType, number>> {
  const next = { ...inventory };
  for (const [material, required] of Object.entries(cost) as [MaterialType, number][]) {
    next[material] = (next[material] ?? 0) - required;
    if (next[material] === 0) delete next[material];
  }
  return next;
}
