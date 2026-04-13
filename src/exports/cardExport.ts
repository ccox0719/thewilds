import { recipes } from '../data/recipes';

export interface CardExportObject {
  id: string;
  title: string;
  tier: number;
  type: string;
  costText: string;
  effectText: string;
  iconKeys: string[];
  baseValue: number;
}

export function exportCardsJSON(): CardExportObject[] {
  return recipes.map((recipe) => ({
    id: recipe.id,
    title: recipe.printTitle,
    tier: recipe.tier,
    type: recipe.type,
    costText: recipe.printCostText,
    effectText: recipe.printEffectText,
    iconKeys: recipe.printIconKeys,
    baseValue: recipe.baseValue,
  }));
}

export function exportCardsCSV(): string {
  const headers = ['id', 'title', 'tier', 'type', 'costText', 'effectText', 'iconKeys', 'baseValue'];
  const rows = recipes.map((recipe) => [
    recipe.id,
    `"${recipe.printTitle}"`,
    recipe.tier,
    recipe.type,
    `"${recipe.printCostText}"`,
    `"${recipe.printEffectText}"`,
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
    'MATERIALS: Wood, Fiber, Stone, Food, Water, Fire',
    '',
    'TIER 1 RECIPES:',
  ];

  for (const recipe of recipes.filter((r) => r.tier === 1)) {
    lines.push(`  ${recipe.printTitle}: ${recipe.printCostText} — ${recipe.printEffectText}`);
  }

  lines.push('', 'TIER 2 RECIPES (unlock: have Shelter or HearthActive tag):');
  for (const recipe of recipes.filter((r) => r.tier === 2)) {
    lines.push(`  ${recipe.printTitle}: ${recipe.printCostText} — ${recipe.printEffectText}`);
  }

  return lines.join('\n');
}
