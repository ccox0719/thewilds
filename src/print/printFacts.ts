import { config } from '../data/config';
import { recipes } from '../data/recipes';
import type { MaterialType, Recipe, SpecialCardDefinition, SurvivalCheck, Tag } from '../types';

function titleCase(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .trim();
}

export function formatMaterialName(material: MaterialType | string): string {
  return titleCase(material);
}

export function formatTagName(tag: Tag | string): string {
  return titleCase(tag);
}

export function formatFamilyName(family: string): string {
  return titleCase(family);
}

export function formatTypeName(type: string): string {
  return type === 'persistentEngine'
    ? 'Persistent Engine'
    : type === 'persistent'
      ? 'Persistent'
      : type === 'oneTime'
        ? 'One-time'
        : titleCase(type);
}

export function formatWeatherCategory(category: string): string {
  if (category === 'escalation') return 'Pressure';
  if (category === 'opportunity') return 'Opportunity';
  if (category === 'neutral') return 'Neutral';
  return titleCase(category);
}

export function formatEventDuration(): string {
  return '1 round';
}

export function formatMaterialCost(cost: Partial<Record<MaterialType, number>>): string {
  const parts = Object.entries(cost) as [MaterialType, number][];
  if (parts.length === 0) return 'Free';
  return parts.map(([material, amount]) => `${amount} ${formatMaterialName(material)}`).join(' + ');
}

export function formatBuildList(buildIds: string[]): string {
  return buildIds
    .map((id) => recipes.find((recipe) => recipe.id === id)?.printTitle ?? titleCase(id))
    .join(', ');
}

export function formatMaintenanceText(recipe: Recipe): string | null {
  if (!recipe.maintenance) return null;

  const upkeep = formatMaterialCost(recipe.maintenance.cost);
  const cadence = recipe.maintenance.interval && recipe.maintenance.interval > 1
    ? `every ${recipe.maintenance.interval} rounds`
    : 'every round';
  const start = recipe.maintenance.startRound ? ` starting round ${recipe.maintenance.startRound}` : '';
  return `Upkeep: ${upkeep}${start} ${cadence}`.trim();
}

export function formatRecipeRequirements(recipe: Recipe): string | null {
  const parts: string[] = [];

  if (recipe.tier === 2) {
    parts.push('Tier 2 unlock: Shelter or HearthActive');
  }
  if (recipe.requiresTags.length > 0) {
    parts.push(`Requires ${recipe.requiresTags.map((tag) => formatTagName(tag)).join(', ')}`);
  }
  if (recipe.requiresBuilds.length > 0) {
    parts.push(`Requires builds: ${formatBuildList(recipe.requiresBuilds)}`);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}

export function summarizeRecipeEffects(recipe: Recipe): string[] {
  const lines: string[] = [];

  for (const tag of recipe.tags) {
    lines.push(`Gain ${formatTagName(tag)}`);
  }

  for (const effect of recipe.effects) {
    if (effect.type === 'vitality') {
      lines.push(`Restore ${effect.amount} Vitality`);
      continue;
    }
    if (effect.type === 'rescue') {
      lines.push(`Gain ${effect.amount} Rescue`);
      continue;
    }
    if (effect.type === 'materialGain' && effect.material) {
      lines.push(`Gain ${effect.amount} ${formatMaterialName(effect.material)}`);
      continue;
    }
    if (effect.type === 'materialIncome' && effect.condition) {
      lines.push(`+${effect.amount} ${formatMaterialName(effect.condition)} each income`);
      continue;
    }
    if (effect.type === 'costReduction') {
      if (effect.condition?.startsWith('family:')) {
        const family = effect.condition.slice('family:'.length);
        lines.push(`Future ${formatTagName(family)} recipes cost ${effect.amount} less material`);
      } else if (effect.condition?.startsWith('type:')) {
        const type = effect.condition.slice('type:'.length);
        lines.push(`Future ${formatTagName(type)} recipes cost ${effect.amount} less material`);
      } else {
        lines.push(`Future recipes cost ${effect.amount} less material`);
      }
      continue;
    }
    if (effect.type === 'rescueBonus') {
      if (effect.condition === 'signal') {
        lines.push(`Future signal recipes gain +${effect.amount} Rescue`);
      } else {
        lines.push(`Gain +${effect.amount} Rescue bonus`);
      }
      continue;
    }
    if (effect.type === 'satisfyCheck' && effect.targetCheck) {
      lines.push(`Satisfies ${formatCheckName(effect.targetCheck)}`);
    }
  }

  if (recipe.satisfiesCheck) {
    const line = `Satisfies ${formatCheckName(recipe.satisfiesCheck)}`;
    if (!lines.includes(line)) lines.push(line);
  }

  return lines.length > 0 ? lines : ['No immediate effect'];
}

export function summarizeSpecialCardEffects(card: SpecialCardDefinition): string[] {
  const lines: string[] = [];
  for (const effect of card.effects) {
    if (effect.type === 'recipeCostReduction') {
      const target = effect.targetRecipeId
        ? recipes.find((recipe) => recipe.id === effect.targetRecipeId)?.printTitle ?? titleCase(effect.targetRecipeId)
        : effect.targetFamily
          ? `${formatTagName(effect.targetFamily)} recipes`
          : 'matching recipes';
      const material = effect.material ? ` ${formatMaterialName(effect.material)}` : '';
      lines.push(`Reduce ${target} cost by ${effect.amount}${material}`);
      continue;
    }
    if (effect.type === 'recipeRescueBonus') {
      const target = effect.targetRecipeId
        ? recipes.find((recipe) => recipe.id === effect.targetRecipeId)?.printTitle ?? titleCase(effect.targetRecipeId)
        : effect.targetFamily
          ? `${formatTagName(effect.targetFamily)} recipes`
          : 'matching recipes';
      lines.push(`Add +${effect.amount} Rescue to ${target}`);
      continue;
    }
    if (effect.type === 'recipeVitalityBonus') {
      const target = effect.targetRecipeId
        ? recipes.find((recipe) => recipe.id === effect.targetRecipeId)?.printTitle ?? titleCase(effect.targetRecipeId)
        : effect.targetFamily
          ? `${formatTagName(effect.targetFamily)} recipes`
          : 'matching recipes';
      lines.push(`Add +${effect.amount} Vitality to ${target}`);
      continue;
    }
    if (effect.type === 'recipeMaterialGain') {
      const target = effect.targetRecipeId
        ? recipes.find((recipe) => recipe.id === effect.targetRecipeId)?.printTitle ?? titleCase(effect.targetRecipeId)
        : effect.targetFamily
          ? `${formatTagName(effect.targetFamily)} recipes`
          : 'matching recipes';
      lines.push(`Add +${effect.amount} ${formatMaterialName(effect.material)} to ${target}`);
      continue;
    }
    if (effect.type === 'recipeIncomeBonus') {
      const target = effect.targetRecipeId
        ? recipes.find((recipe) => recipe.id === effect.targetRecipeId)?.printTitle ?? titleCase(effect.targetRecipeId)
        : effect.targetFamily
          ? `${formatTagName(effect.targetFamily)} recipes`
          : 'matching recipes';
      lines.push(`Add +${effect.amount} ${formatMaterialName(effect.material)} income to ${target}`);
      continue;
    }
    if (effect.type === 'warmthDamageReduction') {
      lines.push(`Reduce warmth damage by ${effect.amount}`);
      continue;
    }
    if (effect.type === 'unlockRecipe') {
      const target = recipes.find((recipe) => recipe.id === effect.recipeId)?.printTitle ?? titleCase(effect.recipeId);
      lines.push(`Unlock ${target}`);
    }
  }
  return lines;
}

export function formatPressureSchedule(): string {
  if (config.pressureSchedule.length === 0) return 'No schedule';

  const bands: Array<{ start: number; end: number; value: number }> = [];
  let current = config.pressureSchedule[0];
  let start = 1;

  for (let index = 1; index < config.pressureSchedule.length; index += 1) {
    const value = config.pressureSchedule[index];
    if (value === current) continue;
    bands.push({ start, end: index, value: current });
    start = index + 1;
    current = value;
  }

  bands.push({ start, end: config.pressureSchedule.length, value: current });
  return bands.map((band) => `R${band.start}-${band.end}: ${band.value}`).join(' · ');
}

export function formatRescueThresholds(): string {
  const entries = Object.entries(config.rescueThresholds)
    .sort((a, b) => {
      const aNum = a[0] === 'solo' ? 1 : Number(a[0]);
      const bNum = b[0] === 'solo' ? 1 : Number(b[0]);
      return aNum - bNum;
    })
    .map(([seat, value]) => (seat === 'solo' ? `Solo ${value}` : `${seat} players ${value}`));
  return entries.join(' · ');
}

function formatCheckName(check: SurvivalCheck): string {
  return check.charAt(0).toUpperCase() + check.slice(1);
}
