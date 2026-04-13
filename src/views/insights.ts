import type { GameState, LogEntry, PlayerState } from '../types';
import { getScoreBreakdown } from '../engine/scoring';
import { previewEndOfRoundOutcome } from '../engine/pressure';
import { getSpecialCardById } from '../data/specialCards';
import { getRecipeById } from '../data/recipes';

const FOOD_RECIPES = new Set(['snare', 'drying-rack', 'preserved-rations', 'smokehouse', 'cooked-meal']);
const WATER_RECIPES = new Set(['water-catcher', 'filtered-water', 'boiled-water', 'water-filter']);
const WARMTH_RECIPES = new Set(['lean-to', 'campfire', 'sturdy-shelter', 'sustained-fire', 'insulated-bedding']);
const SIGNAL_RECIPES = new Set(['simple-signal', 'signal-platform', 'signal-beacon', 'signal-lens', 'signal-mirror-plan', 'beacon-lens']);
const PROCESSING_RECIPES = new Set(['tool-bench', 'dry-fuel', 'braided-cordage', 'repair-bench']);

export function getCommandPanelData(player: PlayerState, state: GameState) {
  const forecast = previewEndOfRoundOutcome(player, state);
  const score = getScoreBreakdown(player);
  const builtRecipes = player.builtRecipes.map((id) => getRecipeById(id)).filter(Boolean);

  const foodEngine = builtRecipes.filter((recipe) => recipe && FOOD_RECIPES.has(recipe.id)).map((recipe) => recipe!.name);
  const waterEngine = builtRecipes.filter((recipe) => recipe && WATER_RECIPES.has(recipe.id)).map((recipe) => recipe!.name);
  const warmthEngine = builtRecipes.filter((recipe) => recipe && WARMTH_RECIPES.has(recipe.id)).map((recipe) => recipe!.name);
  const signalEngine = builtRecipes.filter((recipe) => recipe && SIGNAL_RECIPES.has(recipe.id)).map((recipe) => recipe!.name);
  const processingEngine = builtRecipes.filter((recipe) => recipe && PROCESSING_RECIPES.has(recipe.id)).map((recipe) => recipe!.name);

  const activeCards = player.specialCards
    .map((owned) => getSpecialCardById(owned.id))
    .filter((card): card is NonNullable<ReturnType<typeof getSpecialCardById>> => Boolean(card))
    .map((card) => card.printEffectText);

  const maintenanceUpcoming = player.builtRecipes
    .map((id) => getRecipeById(id))
    .filter((recipe): recipe is NonNullable<ReturnType<typeof getRecipeById>> => Boolean(recipe))
    .filter((recipe) => recipe.maintenance)
    .map((recipe) => {
      const upkeep = Object.entries(recipe.maintenance!.cost)
        .map(([mat, qty]) => `${qty} ${mat}`)
        .join(' + ');
      const cadence = recipe.maintenance!.interval
        ? `every ${recipe.maintenance!.interval} rounds`
        : 'ongoing';
      return `${recipe.name}: ${upkeep} ${cadence}`;
    });

  const strengths: string[] = [];
  const risks: string[] = [];

  if (forecast.warmthSatisfied) strengths.push('Warmth covered');
  else risks.push('Warmth exposed');

  if (forecast.thirstSatisfied) strengths.push('Water covered');
  else risks.push('Water strain');

  if (forecast.hungerSatisfied) strengths.push('Food covered');
  else risks.push('Food strain');

  if (signalEngine.length > 0) strengths.push('Signal lane active');
  if (waterEngine.length > 0) strengths.push('Water engine online');
  if (foodEngine.length > 0) strengths.push('Food engine online');
  if (warmthEngine.length > 0) strengths.push('Climate protection online');
  if (processingEngine.length > 0) strengths.push('Processing lane online');

  if (player.maintenanceInactiveRecipes.length > 0) risks.push('Maintenance offline');
  else if (maintenanceUpcoming.length > 0) strengths.push('Maintenance manageable');

  return {
    forecast,
    score,
    foodEngine,
    waterEngine,
    warmthEngine,
    signalEngine,
    processingEngine,
    activeCards,
    maintenanceUpcoming,
    strengths,
    risks,
    eventName: state.currentEvent?.name ?? null,
    eventDescription: state.currentEvent?.description ?? null,
    eventModifiers: formatEventModifiers(state),
  };
}

export function formatLogAction(action: string): string {
  switch (action) {
    case 'draft-market':
      return 'market draw';
    case 'market-take':
      return 'took from market';
    case 'market-pass':
      return 'passed on market';
    case 'private-draw':
      return 'private draw';
    case 'craft':
      return 'crafted';
    case 'maintenance':
      return 'maintenance';
    case 'perk':
      return 'perk';
    case 'card':
      return 'blueprint';
    case 'event':
      return 'event';
    case 'game-over':
      return 'game over';
    default:
      return action;
  }
}

export function getLogActorLabel(state: GameState, entry: LogEntry): string {
  if (entry.playerId === 'system') return 'System';
  const player = state.players.find((p) => p.id === entry.playerId);
  if (!player) return entry.playerId;
  return player.isAI ? `${player.name} (AI)` : `${player.name} (You)`;
}

export function getLatestAIMove(state: GameState): LogEntry | null {
  for (let i = state.log.length - 1; i >= 0; i -= 1) {
    const entry = state.log[i];
    if (entry.playerId === 'system') continue;
    const player = state.players.find((p) => p.id === entry.playerId);
    if (player?.isAI) return entry;
  }
  return null;
}

function formatEventModifiers(state: GameState): string[] {
  const event = state.currentEvent;
  if (!event) return ['No active event'];

  const lines: string[] = [];
  if (event.temperatureShift) {
    lines.push(`Temperature ${event.temperatureShift > 0 ? '+' : ''}${event.temperatureShift}`);
  }
  for (const [check, amount] of Object.entries(event.pressureBonus ?? {})) {
    if (amount === 0) continue;
    lines.push(`${check} ${amount > 0 ? '+' : ''}${amount}`);
  }
  if (event.signalRescueBonus) {
    lines.push(`Signal ${event.signalRescueBonus > 0 ? '+' : ''}${event.signalRescueBonus}`);
  }
  if (event.recipeFamilyCostDelta) {
    for (const [family, amount] of Object.entries(event.recipeFamilyCostDelta)) {
      if (amount === 0) continue;
      const direction = amount > 0 ? '+' : '';
      lines.push(`${family} cost ${direction}${amount} (one material shifts at pricing)`);
    }
  }
  return lines.length > 0 ? lines : ['No pressure shift'];
}
