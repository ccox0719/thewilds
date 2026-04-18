import type { GameState, PlayerState, SurvivalCheck } from '../types';
import {
  resolveHungerCheck,
  resolveThirstCheck,
  resolveWarmthCheck,
  applyVitalityRegen,
} from './craft';
import { addLog } from './state';

export function isPlayerCollapsed(player: PlayerState): boolean {
  return player.vitality <= 0;
}

export interface SurvivalPressurePreview {
  hungerDamage: number;
  thirstDamage: number;
  warmthDamage: number;
  totalDamage: number;
  hungerSatisfied: boolean;
  thirstSatisfied: boolean;
  warmthSatisfied: boolean;
}

export interface EndOfRoundPreview extends SurvivalPressurePreview {
  projectedVitality: number;
  vitalityDelta: number;
  perkTriggered: boolean;
  collapsed: boolean;
  failedChecks: SurvivalCheck[];
}

export function previewSurvivalPressure(player: PlayerState, state: GameState): SurvivalPressurePreview {
  if (player.collapsed) {
    return {
      hungerDamage: 0,
      thirstDamage: 0,
      warmthDamage: 0,
      totalDamage: 0,
      hungerSatisfied: true,
      thirstSatisfied: true,
      warmthSatisfied: true,
    };
  }

  const hunger = resolveHungerCheck(clonePlayer(player), state);
  const thirst = resolveThirstCheck(clonePlayer(player), state);
  const warmth = resolveWarmthCheck(clonePlayer(player), state);

  return {
    hungerDamage: hunger.vitDamage,
    thirstDamage: thirst.vitDamage,
    warmthDamage: warmth.vitDamage,
    totalDamage: hunger.vitDamage + thirst.vitDamage + warmth.vitDamage,
    hungerSatisfied: hunger.satisfied,
    thirstSatisfied: thirst.satisfied,
    warmthSatisfied: warmth.satisfied,
  };
}

export function previewEndOfRoundOutcome(player: PlayerState, state: GameState): EndOfRoundPreview {
  if (player.collapsed) {
    return {
      hungerDamage: 0,
      thirstDamage: 0,
      warmthDamage: 0,
      totalDamage: 0,
      hungerSatisfied: true,
      thirstSatisfied: true,
      warmthSatisfied: true,
      projectedVitality: player.vitality,
      vitalityDelta: 0,
      perkTriggered: false,
      collapsed: true,
      failedChecks: [],
    };
  }

  const outcome = applySurvivalPressure(clonePlayer(player), state);
  const preview = previewSurvivalPressure(player, state);
  return {
    ...preview,
    projectedVitality: outcome.player.vitality,
    vitalityDelta: outcome.player.vitality - player.vitality,
    perkTriggered: outcome.perkTriggered,
    collapsed: outcome.player.collapsed,
    failedChecks: outcome.failedChecks,
  };
}

export function runSurvivalPressurePhase(state: GameState): GameState {
  const outcomes = state.players.map((player) => applySurvivalPressure(player, state));
  let currentState = {
    ...state,
    players: outcomes.map((o) => o.player),
  };

  for (const outcome of outcomes) {
    if (outcome.perkTriggered) {
      currentState = addLog(currentState, outcome.player.id, 'perk', 'Provider: softened the first survival failure');
    }
    if (outcome.failedChecks.length > 0) {
      currentState = addLog(
        currentState,
        outcome.player.id,
        'pressure',
        `Failed ${outcome.failedChecks.join(', ')}`,
      );
    }
    if (outcome.player.collapsed && outcome.player.collapseRound === state.round) {
      currentState = addLog(currentState, outcome.player.id, 'collapse', `Collapsed in round ${state.round}`);
    }
  }

  currentState = {
    ...currentState,
    players: currentState.players.map((player) => {
      if ((player.inventory.Water ?? 0) === 0) return player;
      const inventory = { ...player.inventory };
      delete inventory.Water;
      return { ...player, inventory };
    }),
  };

  return currentState;
}

export function applySurvivalPressure(
  player: PlayerState,
  state: GameState,
): { player: PlayerState; failedChecks: SurvivalCheck[]; perkTriggered: boolean } {
  if (player.collapsed) {
    return { player, failedChecks: [], perkTriggered: false };
  }

  let current = { ...player };

  const failedChecks: SurvivalCheck[] = [];

  const hunger = resolveHungerCheck(current, state);
  current = hunger.player;
  if (!hunger.satisfied) failedChecks.push('hunger');

  const thirst = resolveThirstCheck(current, state);
  current = thirst.player;
  if (!thirst.satisfied) failedChecks.push('thirst');

  const warmth = resolveWarmthCheck(current, state);
  current = warmth.player;
  if (!warmth.satisfied) failedChecks.push('warmth');

  const totalDamage = hunger.vitDamage + thirst.vitDamage + warmth.vitDamage;
  let perkTriggered = false;
  const perkEnabled = player.profile.id === 'provider' && !player.perkUsed && player.profile.perk.enabled;

  let appliedFailures = [...failedChecks];
  let adjustedDamage = totalDamage;
  let adjustedInventory = { ...current.inventory };
  let adjustedHungerDebt = current.hungerDebt;
  let adjustedHungerSatisfied = hunger.satisfied;
  let adjustedThirstSatisfied = thirst.satisfied;
  let adjustedWarmthSatisfied = warmth.satisfied;

  const providerWindow = perkEnabled && appliedFailures.length > 0 && current.vitality <= 5;
  if (providerWindow) {
    const firstFailure = appliedFailures[0];
    perkTriggered = true;
    appliedFailures = appliedFailures.slice(1);

    if (firstFailure === 'hunger') {
      adjustedDamage = Math.max(0, adjustedDamage - hunger.vitDamage);
      adjustedInventory = {
        ...adjustedInventory,
        Food: (adjustedInventory.Food ?? 0) + 1,
      };
      adjustedHungerDebt = 0;
      adjustedHungerSatisfied = true;
    } else if (firstFailure === 'thirst') {
      adjustedDamage = Math.max(0, adjustedDamage - thirst.vitDamage);
      adjustedInventory = {
        ...adjustedInventory,
        Water: (adjustedInventory.Water ?? 0) + 1,
      };
      adjustedThirstSatisfied = true;
    } else if (firstFailure === 'warmth') {
      adjustedDamage = Math.max(0, adjustedDamage - warmth.vitDamage);
      adjustedWarmthSatisfied = true;
    }
  }

  current = {
    ...current,
    inventory: adjustedInventory,
    hungerDebt: adjustedHungerDebt,
    vitality: current.vitality - adjustedDamage,
    survivalStatus: {
      ...current.survivalStatus,
      hungerSatisfied: adjustedHungerSatisfied,
      thirstSatisfied: adjustedThirstSatisfied,
      warmthSatisfied: adjustedWarmthSatisfied,
      allChecksPassed: appliedFailures.length === 0,
    },
    perkUsed: perkTriggered ? true : current.perkUsed,
    profile: perkTriggered
      ? { ...current.profile, perk: { ...current.profile.perk, usedThisGame: true } }
      : current.profile,
  };

  current = applyVitalityRegen(current);

  if (isPlayerCollapsed(current)) {
    current = { ...current, collapsed: true, collapseRound: state.round };
  }

  return { player: current, failedChecks: appliedFailures, perkTriggered };
}

function clonePlayer(player: PlayerState): PlayerState {
  return {
    ...player,
    inventory: { ...player.inventory },
    hungerDebt: player.hungerDebt,
    activeTags: [...player.activeTags],
    builtRecipes: [...player.builtRecipes],
    survivalStatus: { ...player.survivalStatus },
  };
}
