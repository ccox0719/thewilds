import { recipes } from '../data/recipes';
import {
  formatMaterialCost,
  formatMaintenanceText,
  formatRecipeRequirements,
  summarizeRecipeEffects,
} from '../print/printFacts';

export interface CardExportObject {
  id: string;
  title: string;
  tier: number;
  type: string;
  family: string;
  costText: string;
  effectText: string;
  requirementsText: string | null;
  maintenanceText: string | null;
  iconKeys: string[];
  baseValue: number;
}

export function exportCardsJSON(): CardExportObject[] {
  return recipes.map((recipe) => ({
    id: recipe.id,
    title: recipe.printTitle,
    tier: recipe.tier,
    type: recipe.type,
    family: recipe.family,
    costText: formatMaterialCost(recipe.cost),
    effectText: summarizeRecipeEffects(recipe).join('. '),
    requirementsText: formatRecipeRequirements(recipe),
    maintenanceText: formatMaintenanceText(recipe),
    iconKeys: recipe.printIconKeys,
    baseValue: recipe.baseValue,
  }));
}

export function exportCardsCSV(): string {
  const headers = ['id', 'title', 'tier', 'type', 'family', 'costText', 'effectText', 'requirementsText', 'maintenanceText', 'iconKeys', 'baseValue'];
  const rows = recipes.map((recipe) => [
    recipe.id,
    `"${recipe.printTitle}"`,
    recipe.tier,
    recipe.type,
    `"${recipe.family}"`,
    `"${formatMaterialCost(recipe.cost)}"`,
    `"${summarizeRecipeEffects(recipe).join('. ')}"`,
    `"${formatRecipeRequirements(recipe) ?? ''}"`,
    `"${formatMaintenanceText(recipe) ?? ''}"`,
    `"${recipe.printIconKeys.join(';')}"`,
    recipe.baseValue,
  ].join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function exportRulesSummary(): string {
  const lines: string[] = [
    'THE WILDS — Rules Summary (generated)',
    '=====================================',
    '',
    'MATERIALS: Wood, Fiber, Stone, Food, Water, Rations, CleanWater, Fuel, Cordage',
    '',
    'TIER 1 RECIPES:',
  ];

  for (const recipe of recipes.filter((r) => r.tier === 1)) {
    lines.push(`  ${recipe.printTitle}: ${formatMaterialCost(recipe.cost)} — ${summarizeRecipeEffects(recipe).join('. ')}`);
  }

  lines.push('', 'TIER 2 RECIPES (unlock: have Shelter or HearthActive tag):');
  for (const recipe of recipes.filter((r) => r.tier === 2)) {
    lines.push(`  ${recipe.printTitle}: ${formatMaterialCost(recipe.cost)} — ${summarizeRecipeEffects(recipe).join('. ')}`);
  }

  return lines.join('\n');
}
