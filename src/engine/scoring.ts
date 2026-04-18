import type { GameState, PlayerState, Recipe } from '../types';
import { config } from '../data/config';
import { recipes } from '../data/recipes';

export function scorePlayer(player: PlayerState, _state: GameState): number {
  const breakdown = getScoreBreakdown(player, _state);
  return Math.max(0, breakdown.total);
}

export interface ScoreBreakdown {
  craftPoints: number;
  usePoints: number;
  rescuePoints: number;
  survivalPoints: number;
  enginePoints: number;
  total: number;
}

export function getScoreBreakdown(player: PlayerState, state: GameState): ScoreBreakdown {
  const scoring = config.scoring;
  const builtRecipes = player.builtRecipes
    .map((id) => recipes.find((recipe) => recipe.id === id))
    .filter((recipe): recipe is Recipe => recipe !== undefined);

  const craftPoints = builtRecipes.reduce((sum, recipe) => sum + scoring.craftPointsByTier[recipe.tier], 0);
  const usePointsRaw = builtRecipes.reduce(
    (sum, recipe) => sum + (hasImmediateUseValue(recipe) ? scoring.usePointsPerImmediateEffect : 0),
    0,
  );
  const usePoints = Math.min(scoring.usePointsCap, usePointsRaw);

  const rescuePoints = player.collapsed
    ? 0
    : Math.min(scoring.rescuePointsCap, Math.floor(player.rescueScore / scoring.rescuePointsStep));

  const roundsSurvived = player.collapsed ? Math.max(0, player.collapseRound ?? 0) : state.round;
  const survivalPointsBase = Math.min(
    scoring.survivalPointsCap,
    Math.floor(roundsSurvived / scoring.survivalPointsStep) +
      (!player.collapsed && player.vitality >= scoring.healthyVitalityThreshold ? scoring.healthyVitalityBonus : 0),
  );
  const lateSurvivalFloor =
    roundsSurvived >= scoring.lateSurvivalFloorRound ? scoring.lateSurvivalFloorPoints : 0;
  const survivalPoints = Math.min(scoring.survivalPointsCap, survivalPointsBase + lateSurvivalFloor);

  const persistentBuilds = builtRecipes.filter((recipe) => recipe.persistent === true).length;
  const enginePoints = Math.min(scoring.persistentBuildCap, persistentBuilds * scoring.persistentBuildBonus);

  return {
    craftPoints,
    usePoints,
    rescuePoints,
    survivalPoints,
    enginePoints,
    total: craftPoints + usePoints + rescuePoints + survivalPoints + enginePoints,
  };
}

export function determineWinner(state: GameState): string | null {
  const activePlayers = state.players.filter((p) => !p.collapsed);
  if (activePlayers.length === 0) return null;

  let best: PlayerState | null = null;
  let bestScore = -Infinity;

  for (const player of activePlayers) {
    const score = scorePlayer(player, state);
    if (score > bestScore) {
      bestScore = score;
      best = player;
    }
  }

  return best?.id ?? null;
}

function hasImmediateUseValue(recipe: Recipe): boolean {
  return recipe.effects.some((effect) =>
    effect.type === 'vitality' ||
    effect.type === 'rescue' ||
    effect.type === 'materialGain' ||
    effect.type === 'satisfyCheck'
  );
}
