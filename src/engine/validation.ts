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
  const isWhole = (n: number) => Number.isInteger(n);

  if (config.startingVitality <= 0) errors.push('startingVitality must be > 0');
  if (config.simulationCeiling <= 0) errors.push('simulationCeiling must be > 0');
  if (config.marketCapSize <= 0) errors.push('marketCapSize must be > 0');
  if (config.pressureSchedule.length === 0) errors.push('pressureSchedule must not be empty');
  if (Object.keys(config.rescueThresholds).length === 0) errors.push('rescueThresholds must not be empty');
  if (Object.keys(config.scoring.craftPointsByTier).length === 0) errors.push('craftPointsByTier must not be empty');
  for (const [tier, points] of Object.entries(config.scoring.craftPointsByTier)) {
    if (!isWhole(Number(tier)) || !isWhole(points)) errors.push(`craftPointsByTier[${tier}] must be a whole number`);
  }
  if (!isWhole(config.scoring.usePointsPerImmediateEffect)) errors.push('usePointsPerImmediateEffect must be a whole number');
  if (config.scoring.usePointsPerImmediateEffect < 0) errors.push('usePointsPerImmediateEffect must be >= 0');
  if (!isWhole(config.scoring.usePointsCap)) errors.push('usePointsCap must be a whole number');
  if (config.scoring.usePointsCap < 0) errors.push('usePointsCap must be >= 0');
  if (!isWhole(config.scoring.rescuePointsStep)) errors.push('rescuePointsStep must be a whole number');
  if (config.scoring.rescuePointsStep <= 0) errors.push('rescuePointsStep must be > 0');
  if (!isWhole(config.scoring.rescuePointsCap)) errors.push('rescuePointsCap must be a whole number');
  if (config.scoring.rescuePointsCap < 0) errors.push('rescuePointsCap must be >= 0');
  if (!isWhole(config.scoring.survivalPointsStep)) errors.push('survivalPointsStep must be a whole number');
  if (config.scoring.survivalPointsStep <= 0) errors.push('survivalPointsStep must be > 0');
  if (!isWhole(config.scoring.survivalPointsCap)) errors.push('survivalPointsCap must be a whole number');
  if (config.scoring.survivalPointsCap < 0) errors.push('survivalPointsCap must be >= 0');
  if (!isWhole(config.scoring.healthyVitalityThreshold)) errors.push('healthyVitalityThreshold must be a whole number');
  if (config.scoring.healthyVitalityThreshold <= 0) errors.push('healthyVitalityThreshold must be > 0');
  if (!isWhole(config.scoring.healthyVitalityBonus)) errors.push('healthyVitalityBonus must be a whole number');
  if (config.scoring.healthyVitalityBonus < 0) errors.push('healthyVitalityBonus must be >= 0');
  if (!isWhole(config.scoring.lateSurvivalFloorRound)) errors.push('lateSurvivalFloorRound must be a whole number');
  if (config.scoring.lateSurvivalFloorRound <= 0) errors.push('lateSurvivalFloorRound must be > 0');
  if (!isWhole(config.scoring.lateSurvivalFloorPoints)) errors.push('lateSurvivalFloorPoints must be a whole number');
  if (config.scoring.lateSurvivalFloorPoints < 0) errors.push('lateSurvivalFloorPoints must be >= 0');
  if (!isWhole(config.scoring.persistentBuildBonus)) errors.push('persistentBuildBonus must be a whole number');
  if (config.scoring.persistentBuildBonus < 0) errors.push('persistentBuildBonus must be >= 0');
  if (!isWhole(config.scoring.persistentBuildCap)) errors.push('persistentBuildCap must be a whole number');
  if (config.scoring.persistentBuildCap < 0) errors.push('persistentBuildCap must be >= 0');

  return errors;
}

export function recipeValue(recipe: Recipe, context: ValueContext): number {
  const totalCost = Object.values(recipe.cost).reduce((a, b) => a + b, 0);
  if (totalCost === 0) return 0;

  let value = recipe.baseValue;

  const rescueEffect = recipe.effects.find((e) => e.type === 'rescue');
  const vitalityEffect = recipe.effects.find((e) => e.type === 'vitality');
  const engineEffect = recipe.type === 'persistentEngine' ? 2 : 0;

  if (rescueEffect) value += rescueEffect.amount * 2;
  if (vitalityEffect) value += vitalityEffect.amount * 2;
  if (recipe.satisfiesCheck) value += 2;
  if (engineEffect > 0) value += engineEffect * Math.max(1, context.playerCount - 1);
  if (recipe.id === 'simple-signal') value += Math.max(0, 8 - context.round);
  if (recipe.id === 'signal-beacon') value += Math.max(0, 8 - context.round);
  if (context.scenario.temperaturePressure !== 0 && (recipe.id === 'lean-to' || recipe.id === 'campfire')) value += 1;

  return value / totalCost;
}
