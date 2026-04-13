import type { Recipe, ValueContext } from '../types';
import { recipes } from '../data/recipes';
import { specialCards, getAdvancedSpecialCardForRecipe } from '../data/specialCards';
import { scenarios } from '../data/scenarios';
import { config } from '../data/config';

export function validateRecipes(): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const recipe of recipes) {
    if (!recipe.id) { errors.push('Recipe missing id'); continue; }
    if (ids.has(recipe.id)) errors.push(`Duplicate recipe id: ${recipe.id}`);
    ids.add(recipe.id);

    if (!recipe.name) errors.push(`Recipe ${recipe.id}: missing name`);
    if (![1, 2, 3].includes(recipe.tier)) errors.push(`Recipe ${recipe.id}: invalid tier ${recipe.tier}`);
    if (!recipe.family) errors.push(`Recipe ${recipe.id}: missing family`);
    if (!recipe.printTitle) errors.push(`Recipe ${recipe.id}: missing print title`);
    if (!recipe.printCostText) errors.push(`Recipe ${recipe.id}: missing print cost text`);
    if (!recipe.printEffectText) errors.push(`Recipe ${recipe.id}: missing print effect text`);
    if (/\breserved\b|\bplaceholder\b/i.test(`${recipe.printTitle} ${recipe.printCostText} ${recipe.printEffectText} ${recipe.designNotes}`)) {
      errors.push(`Recipe ${recipe.id}: contains placeholder wording`);
    }

    for (const [mat, qty] of Object.entries(recipe.cost)) {
      if (typeof qty !== 'number' || qty <= 0) {
        errors.push(`Recipe ${recipe.id}: invalid cost for ${mat}`);
      }
    }

    if (recipe.maintenance) {
      const upkeepCost = Object.values(recipe.maintenance.cost).reduce((sum, qty) => sum + qty, 0);
      if (upkeepCost <= 0) errors.push(`Recipe ${recipe.id}: maintenance cost must not be empty`);
      if ((recipe.maintenance.startRound ?? 1) < 1) errors.push(`Recipe ${recipe.id}: maintenance startRound must be >= 1`);
      if ((recipe.maintenance.interval ?? 1) < 1) errors.push(`Recipe ${recipe.id}: maintenance interval must be >= 1`);
    }
  }

  return errors;
}

export function validateSpecialCards(): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const card of specialCards) {
    if (!card.id) { errors.push('Special card missing id'); continue; }
    if (ids.has(card.id)) errors.push(`Duplicate special card id: ${card.id}`);
    ids.add(card.id);

    if (!card.name) errors.push(`Special card ${card.id}: missing name`);
    if (!card.family) errors.push(`Special card ${card.id}: missing family`);
    if (!card.printEffectText) errors.push(`Special card ${card.id}: missing print effect text`);
    if (/\breserved\b|\bplaceholder\b/i.test(`${card.name} ${card.designNotes} ${card.printEffectText}`)) {
      errors.push(`Special card ${card.id}: contains placeholder wording`);
    }

    for (const effect of card.effects) {
      if ('targetRecipeId' in effect && effect.targetRecipeId) {
        if (!recipes.find((recipe) => recipe.id === effect.targetRecipeId)) {
          errors.push(`Special card ${card.id}: unknown target recipe ${effect.targetRecipeId}`);
        }
      }
    }
  }

  for (const recipe of recipes) {
    const award = getAdvancedSpecialCardForRecipe(recipe);
    if (award && !ids.has(award.id)) {
      errors.push(`Recipe ${recipe.id}: award references missing special card ${award.id}`);
    }
  }

  return errors;
}

export function validateScenarios(): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const scenario of scenarios) {
    if (!scenario.id) { errors.push('Scenario missing id'); continue; }
    if (ids.has(scenario.id)) errors.push(`Duplicate scenario id: ${scenario.id}`);
    ids.add(scenario.id);

    if (!scenario.name) errors.push(`Scenario ${scenario.id}: missing name`);
    if (!scenario.description) errors.push(`Scenario ${scenario.id}: missing description`);
    if (!Number.isFinite(scenario.temperaturePressure)) errors.push(`Scenario ${scenario.id}: invalid temperaturePressure`);
    if (scenario.rescueThresholdAdjust !== undefined && !Number.isFinite(scenario.rescueThresholdAdjust)) {
      errors.push(`Scenario ${scenario.id}: invalid rescueThresholdAdjust`);
    }

    for (const [material, qty] of Object.entries(scenario.bagComposition)) {
      if (typeof qty !== 'number' || qty <= 0) {
        errors.push(`Scenario ${scenario.id}: invalid bag composition for ${material}`);
      }
    }
  }

  return errors;
}

export function validateConfig(): string[] {
  const errors: string[] = [];

  if (config.startingVitality <= 0) errors.push('startingVitality must be > 0');
  if (config.simulationCeiling <= 0) errors.push('simulationCeiling must be > 0');
  if (config.marketCapSize <= 0) errors.push('marketCapSize must be > 0');
  if (config.thirstDamageScale <= 0 || config.thirstDamageScale > 1) errors.push('thirstDamageScale must be between 0 and 1');
  if (config.pressureSchedule.length === 0) errors.push('pressureSchedule must not be empty');
  if (Object.keys(config.rescueThresholds).length === 0) errors.push('rescueThresholds must not be empty');
  if (config.scoring.rescueMultiplier <= 0) errors.push('rescueMultiplier must be > 0');
  if (config.scoring.persistentBuildBonus < 0) errors.push('persistentBuildBonus must be >= 0');
  if (config.scoring.healthyVitalityThreshold <= 0) errors.push('healthyVitalityThreshold must be > 0');

  return errors;
}

export function recipeValue(recipe: Recipe, context: ValueContext): number {
  const totalCost = Object.values(recipe.cost).reduce((a, b) => a + b, 0);
  if (totalCost === 0) return 0;

  let value = recipe.baseValue;

  const rescueEffect = recipe.effects.find((e) => e.type === 'rescue');
  const vitalityEffect = recipe.effects.find((e) => e.type === 'vitality');
  const engineEffect = recipe.type === 'persistentEngine' ? 1.5 : 0;

  if (rescueEffect) value += rescueEffect.amount * 1.5;
  if (vitalityEffect) value += vitalityEffect.amount * 2;
  if (recipe.satisfiesCheck) value += 1.5;
  if (engineEffect > 0) value += engineEffect * Math.max(1, context.playerCount - 1);
  if (recipe.id === 'simple-signal') value += Math.max(0, 8 - context.round) * 0.25;
  if (recipe.id === 'signal-beacon') value += Math.max(0, 8 - context.round) * 0.4;
  if (context.scenario.temperaturePressure !== 0 && (recipe.id === 'lean-to' || recipe.id === 'campfire')) value += 1;

  return value / totalCost;
}
