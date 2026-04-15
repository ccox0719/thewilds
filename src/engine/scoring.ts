import type { PlayerState, GameState } from '../types';
import { config } from '../data/config';
import { recipes } from '../data/recipes';

export function scorePlayer(player: PlayerState, _state: GameState): number {
  void _state.round;
  const breakdown = getScoreBreakdown(player);
  return Math.max(0, breakdown.total);
}

export interface ScoreBreakdown {
  rescuePoints: number;
  vitalityPoints: number;
  persistentBuildPoints: number;
  bonusPoints: number;
  total: number;
}

export function getScoreBreakdown(player: PlayerState): ScoreBreakdown {
  const scoring = config.scoring;

  const rescuePoints = player.collapsed ? 0 : player.rescueScore * scoring.rescueMultiplier;
  const vitalityPoints = player.collapsed ? 0 : Math.max(0, player.vitality);

  const persistentBuilds = player.builtRecipes.filter((id) => {
    const recipe = recipes.find((r) => r.id === id);
    return recipe?.persistent === true;
  }).length;
  const persistentBuildPoints = persistentBuilds * scoring.persistentBuildBonus;

  const bonusPoints =
    !player.collapsed && player.vitality >= scoring.healthyVitalityThreshold
      ? scoring.healthyVitalityBonus
      : 0;

  return {
    rescuePoints,
    vitalityPoints,
    persistentBuildPoints,
    bonusPoints,
    total: rescuePoints + vitalityPoints + persistentBuildPoints + bonusPoints,
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
