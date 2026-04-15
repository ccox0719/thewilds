import type { PlayerState, MarketState, GameState, Recipe, MaterialType, SurvivalCheck } from '../types';
import { getAvailableRecipes, canCraftRecipe, getEffectiveRecipeCost, playerHasTag } from '../engine/craft';
import { config } from '../data/config';
import { getSpecialCardById, cardTargetsRecipe } from '../data/specialCards';
import { getEventSignalBonus, getEventTemperatureShift } from '../data/events';

export function evaluateRecipeOption(player: PlayerState, recipe: Recipe, state: GameState): number {
  const strategy = player.aiStrategy ?? 'balanced';
  const weights = config.aiWeights;
  const roundsLeft = state.simulationCeiling - state.round;
  const risks = evaluateSurvivalRisk(player, state);
  const hasWarmthInfrastructure =
    playerHasTag(player, state, 'Shelter') ||
    playerHasTag(player, state, 'HearthActive') ||
    playerHasTag(player, state, 'SturdyShelter') ||
    playerHasTag(player, state, 'SustainedFire');

  let score = recipe.baseValue;

  if (recipe.satisfiesCheck && risks.includes(recipe.satisfiesCheck)) {
    score += 20;
  }

  if (recipe.id === 'lean-to') {
    score += weights.shelterPriority;
    if (strategy === 'cautious') score += 8;
    if (!hasWarmthInfrastructure) score += 10;
  }

  if (recipe.id === 'campfire') {
    score += weights.firePriority;
    if (strategy !== 'rescueFocused') score += 8;
    if (!playerHasTag(player, state, 'HearthActive')) score += 12;
    if (risks.includes('warmth')) score += 6;
  }

  if (recipe.family === 'shelter-climate') {
    score += 2;
    if (risks.includes('warmth')) score += 8;
    if (recipe.id === 'water-catcher') score += 4;
  }

  if (recipe.family === 'food-engine') {
    score += 2;
    if (risks.includes('hunger')) score += 8;
    if (recipe.id === 'drying-rack') score += 4;
  }

  if (recipe.family === 'processing') {
    score += 3;
    if (playerHasTag(player, state, 'Tool')) score += 4;
    if (roundsLeft > 4) score += 2;
    if (recipe.id === 'tool-bench') score += 6;
  }

  const costReductionEffects = recipe.effects.filter((effect) => effect.type === 'costReduction');
  if (costReductionEffects.length > 0) {
    score += 4 + costReductionEffects.length;
    if (recipe.family === 'processing') score += 4;
    if (roundsLeft > 4) score += 1;
    if (player.profile.id === 'builder') score += 2;
  }

  if (recipe.family === 'signal-rescue') {
    score += 10;
    if (strategy === 'rescueFocused') score += 4;
    if (roundsLeft > 4) score += 4;
  }

  score += evaluateSpecialCardRecipeValue(player, recipe, state);

  if (recipe.id === 'filtered-water') {
    score += weights.stabilizePriority + 6;
    if (risks.includes('thirst')) score += 14;
  }

  if (recipe.id === 'preserved-rations') {
    score += weights.stabilizePriority + 5;
    if (risks.includes('hunger')) score += 12;
  }

  if (recipe.id === 'dry-fuel') {
    score += Math.max(0, weights.firePriority - 6);
    if (!hasWarmthInfrastructure) score += 1;
    if (strategy === 'cautious') score += 1;
  }

  if (recipe.id === 'braided-cordage') {
    score += 0;
    if (player.profile.id === 'builder') score += 1;
    if (roundsLeft > 4) score += 1;
  }

  if (recipe.id === 'snare') {
    score += weights.snarePriority;
    score += Math.max(0, 6 - state.round);
  }

  if (recipe.id === 'signal-platform') {
    score += weights.signalPlatformPriority;
    if (roundsLeft > 3) score += 8;
    if (risks.length === 0) score += 8;
    if (playerHasTag(player, state, 'SignalEngine')) score += 10;
    score += 12;
  }

  if (recipe.id === 'signal-beacon') {
    score += weights.beaconPriority;
    if (roundsLeft <= 5) score += 12;
    if (playerHasTag(player, state, 'SignalEngine')) score += 14;
  }

  if (recipe.id === 'signal-lens') {
    score += weights.signalPlatformPriority + 8;
    if (playerHasTag(player, state, 'SignalEngine')) score += 14;
    if (roundsLeft > 4) score += 6;
  }

  if (recipe.id === 'cooked-meal' || recipe.id === 'boiled-water') {
    score += weights.stabilizePriority;
    score += weights.vitalityPriority;
    if (risks.length > 0) score += 8;
    if (player.vitality <= 4) score += 6;
    if (recipe.id === 'boiled-water' && risks.includes('thirst')) score += 10;
  }

  if (recipe.id === 'sturdy-shelter' || recipe.id === 'sustained-fire') {
    score += 2;
    if (strategy === 'cautious') score += 3;
    if (risks.includes('warmth')) score += recipe.id === 'sustained-fire' ? 6 : 4;
  }

  if (recipe.id === 'sustained-fire') {
    score += 3;
  }

  if (recipe.id === 'simple-signal') {
    score += weights.lateSignalPriority;
    if (roundsLeft <= 5) score += 10;
    if (risks.length === 0) score += 8;
    if (playerHasTag(player, state, 'SignalEngine')) score += 10;
    if (strategy === 'rescueFocused') score += 6;
    if (player.profile.id === 'scout') score += 5;
  }

  if (recipe.id === 'signal-platform') {
    if (risks.length === 0) score += 5;
    if (roundsLeft <= 5) score += 6;
    if (player.profile.id === 'scout') score += 2;
  }

  if (strategy === 'rescueFocused' && (recipe.id === 'simple-signal' || recipe.id === 'signal-beacon')) {
    score += 6;
  }

  if (risks.length > 0 && recipe.satisfiesCheck && risks.includes(recipe.satisfiesCheck)) {
    score += recipe.satisfiesCheck === 'thirst' ? 16 : recipe.satisfiesCheck === 'hunger' ? 8 : 12;
  }

  return score;
}

export function chooseDraftPick(player: PlayerState, market: MarketState, state: GameState): MaterialType | null {
  if (market.available.length === 0) return null;

  const available = getAvailableRecipes(player, state);
  const needed = getMaterialNeed(player, available, state);
  const strategy = player.aiStrategy ?? 'balanced';
  const risks = evaluateSurvivalRisk(player, state);

  let bestMaterial: MaterialType | null = null;
  let bestScore = -1;

  for (const material of market.available) {
    let score = needed[material] ?? 0;

    if (strategy === 'cautious' && (material === 'Food' || material === 'Water')) score += 4;
    if (strategy === 'rescueFocused' && (material === 'Stone' || material === 'Fiber')) score += 2;
    if (player.profile.id === 'builder' && (material === 'Wood' || material === 'Fiber' || material === 'Stone')) score += 2;
    if (material === 'Water' && risks.includes('thirst')) score += 10;
    if (material === 'Food' && risks.includes('hunger')) score += 2;

    if (score > bestScore) {
      bestScore = score;
      bestMaterial = material;
    }
  }

  return bestScore > 0 ? bestMaterial : null;
}

export function chooseCraftAction(player: PlayerState, state: GameState): Recipe | null {
  const available = getAvailableRecipes(player, state);
  const affordable = available.filter((recipe) => canCraftRecipe(player, recipe, state));
  if (affordable.length === 0) return null;

  const risks = evaluateSurvivalRisk(player, state);

  const sorted = affordable
    .map((recipe) => ({ recipe, score: evaluateRecipeOption(player, recipe, state) }))
    .sort((a, b) => b.score - a.score);

  if (risks.length > 0) {
    const survivalFirst = sorted.find(({ recipe }) => recipe.satisfiesCheck && risks.includes(recipe.satisfiesCheck));
    if (survivalFirst) return survivalFirst.recipe;
  }

  return sorted[0].recipe;
}

export function explainDraftPick(
  player: PlayerState,
  market: MarketState,
  state: GameState,
  pick: MaterialType | null,
): string {
  const risks = evaluateSurvivalRisk(player, state);
  const available = getAvailableRecipes(player, state);
  const materialNeed = getMaterialNeed(player, available, state);
  const topNeed = getTopNeedMaterial(materialNeed);

  if (pick === null) {
    if (market.available.length === 0) return 'Passed because the market was empty';
    if (risks.length === 0) return 'Passed to keep flexibility';
    if (risks.includes('thirst')) return 'Passed; no market card beat the current thirst need';
    if (risks.includes('warmth')) return 'Passed; no market card improved camp protection';
    if (risks.includes('hunger')) return 'Passed; no market card improved food stability';
    return 'Passed to hold resources for later';
  }

  if (pick === 'Water' && risks.includes('thirst')) return 'Took Water to cover thirst pressure';
  if (pick === 'Food' && risks.includes('hunger')) return 'Took Food to slow hunger pressure';
  if ((pick === 'Wood' || pick === 'Fiber') && !playerHasTag(player, state, 'HearthActive')) return `Took ${pick} to open cooking and warmth`;

  if (pick === topNeed) {
    return `Took ${pick} for current build plans`;
  }

  if ((pick === 'Wood' || pick === 'Fiber' || pick === 'Stone') && player.profile.id === 'builder') {
    return `Took ${pick} to keep camp development moving`;
  }

  if (pick === 'Stone' && state.currentEvent?.family === 'escalation') {
    return 'Took Stone because the current event rewards sturdier builds';
  }

  return `Took ${pick} for future flexibility`;
}

export function explainCraftChoice(player: PlayerState, state: GameState, recipe: Recipe | null): string {
  if (!recipe) {
    return 'Passed craft to save resources for later';
  }

  const risks = evaluateSurvivalRisk(player, state);
  const event = state.currentEvent;

  if (recipe.satisfiesCheck === 'thirst' && risks.includes('thirst')) {
    return 'Covers thirst before it can snowball';
  }
  if (recipe.satisfiesCheck === 'hunger' && risks.includes('hunger')) {
    return 'Covers hunger before the round pressure spikes';
  }
  if (recipe.family === 'shelter-climate') {
    if (risks.includes('warmth')) return 'Secures exposure before cold damage lands';
    if (recipe.id === 'water-catcher') return 'Sets up recurring water support';
    return 'Improves the camp’s protection line';
  }

  if (recipe.family === 'food-engine') {
    if (risks.includes('hunger')) return 'Builds the food lane before hunger gets urgent';
    return 'Turns raw food into a steadier food engine';
  }

  if (recipe.family === 'processing') {
    return 'Improves future crafting efficiency';
  }

  if (recipe.family === 'signal-rescue') {
    if (state.groupRescueTrack < state.groupRescueThreshold) {
      return event?.signalRescueBonus ? 'Pushes rescue while the event helps signaling' : 'Pushes the rescue lane';
    }
    return 'Converts camp stability into score pressure';
  }

  if (recipe.id === 'simple-signal' || recipe.id === 'signal-beacon') {
    return 'Converts stable camp resources into rescue';
  }

  if (recipe.id === 'water-catcher') return 'Adds recurring water support';
  if (recipe.id === 'drying-rack') return 'Adds recurring food stability';
  if (recipe.id === 'tool-bench') return 'Reduces later processing friction';
  if (recipe.id === 'signal-lens') return 'Amplifies later rescue plays';
  if (recipe.id === 'insulated-bedding') return 'Softens future temperature pressure';

  return `Built ${recipe.name} for future flexibility`;
}

export function simulateSingleTurnLookahead(player: PlayerState, state: GameState): Recipe | null {
  return chooseCraftAction(player, state);
}

export function evaluateSurvivalRisk(player: PlayerState, state: GameState): SurvivalCheck[] {
  if (player.collapsed) return [];

  const risks: SurvivalCheck[] = [];
  if ((player.inventory.Food ?? 0) + (player.inventory.Rations ?? 0) === 0 && !player.survivalStatus.hungerSatisfied) risks.push('hunger');
  if ((player.inventory.Water ?? 0) + (player.inventory.CleanWater ?? 0) === 0 && !player.survivalStatus.thirstSatisfied) risks.push('thirst');

  const pressure = state.scenario.temperaturePressure + getEventTemperatureShift(state.currentEvent);
  const cardWarmthReduction = getSpecialCardWarmthReduction(player);
  if (pressure !== 0 && !player.survivalStatus.warmthSatisfied) {
    const hasShelter = playerHasTag(player, state, 'Shelter') || playerHasTag(player, state, 'SturdyShelter');
    const hasHearth = playerHasTag(player, state, 'HearthActive') || playerHasTag(player, state, 'SustainedFire');
    const warmthSafe = pressure > 0
      ? hasShelter || hasHearth || cardWarmthReduction >= Math.abs(pressure)
      : hasShelter || cardWarmthReduction >= Math.abs(pressure);
    if (!warmthSafe) risks.push('warmth');
  }

  const potentialDamage = risks.reduce((total, check) => {
    if (check === 'warmth') return total + Math.abs(state.scenario.temperaturePressure);
    return total + (config.pressureSchedule[state.round - 1] ?? config.pressureSchedule.at(-1)!);
  }, 0);

  if (player.vitality <= potentialDamage + 1) return risks;
  if (risks.length === 3) return risks;

  return risks.filter((check) => check !== 'warmth' || Math.abs(state.scenario.temperaturePressure) > 0);
}

function getMaterialNeed(player: PlayerState, available: Recipe[], state: GameState): Partial<Record<MaterialType, number>> {
  const need: Partial<Record<MaterialType, number>> = {};
  for (const recipe of available) {
    const weight = Math.max(1, recipe.baseValue);
    const effectiveCost = getEffectiveRecipeCost(player, recipe, state);
    for (const [material, required] of Object.entries(effectiveCost) as [MaterialType, number][]) {
      const have = player.inventory[material] ?? 0;
      const deficit = required - have;
      if (deficit > 0) need[material] = (need[material] ?? 0) + deficit * weight;
    }
  }
  return need;
}

function evaluateSpecialCardRecipeValue(player: PlayerState, recipe: Recipe, state: GameState): number {
  let score = 0;
  for (const owned of player.specialCards) {
    const card = getSpecialCardById(owned.id);
    if (!card) continue;
    score += getSpecialCardFamilySynergy(card.family, recipe.family);
    for (const effect of card.effects) {
      if (!cardTargetsRecipe(card, recipe) && effect.type !== 'warmthDamageReduction' && effect.type !== 'unlockRecipe') continue;
      if (effect.type === 'recipeCostReduction') score += effect.amount * (effect.material === 'Stone' || effect.material === 'Fiber' ? 4 : 3);
      if (effect.type === 'recipeRescueBonus') score += effect.amount * 6;
      if (effect.type === 'recipeVitalityBonus') score += effect.amount * 3;
      if (effect.type === 'recipeMaterialGain') score += effect.amount * (effect.material === 'Food' || effect.material === 'Water' ? 4 : 3);
      if (effect.type === 'recipeIncomeBonus') score += effect.amount * (effect.material === 'Food' || effect.material === 'Water' ? 5 : 4);
      if (effect.type === 'warmthDamageReduction' && recipe.family === 'shelter-climate') score += effect.amount * 4;
    }
  }
  if (recipe.family === 'signal-rescue') score += getEventSignalBonus(state.currentEvent) * 4;
  return score;
}

function getSpecialCardFamilySynergy(cardFamily: string, recipeFamily: string): number {
  const matchingFamilies: Record<string, string[]> = {
    survival: ['survival'],
    recovery: ['survival'],
    'food-engine': ['food-engine'],
    processing: ['processing'],
    'shelter-climate': ['shelter-climate'],
    'signal-rescue': ['signal-rescue'],
  };

  return matchingFamilies[cardFamily]?.includes(recipeFamily) ? 2 : 0;
}

function getSpecialCardWarmthReduction(player: PlayerState): number {
  let reduction = 0;
  for (const owned of player.specialCards) {
    const card = getSpecialCardById(owned.id);
    if (!card) continue;
    for (const effect of card.effects) {
      if (effect.type !== 'warmthDamageReduction') continue;
      reduction += effect.amount;
    }
  }
  return reduction;
}

function getTopNeedMaterial(need: Partial<Record<MaterialType, number>>): MaterialType | null {
  let chosen: MaterialType | null = null;
  let highest = 0;
  for (const [material, score] of Object.entries(need) as [MaterialType, number][]) {
    if (score > highest) {
      highest = score;
      chosen = material;
    }
  }
  return chosen;
}
