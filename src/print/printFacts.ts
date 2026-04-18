import { config } from '../data/config';
import { recipes } from '../data/recipes';
import {
  formatEffectShort,
  getEffectGlyph,
  getMaterialGlyph,
  getRecipeActionLabel,
  getRecipeTypeGlyph,
  getRecipeZoneKey,
  getRecipeZoneLabel,
  getSurvivalCheckGlyph,
  getTagGlyph,
  getZoneGlyph,
} from '../data/iconography';
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
  return parts.map(([material, amount]) => `${getMaterialGlyph(material)} ×${amount}`).join(' · ');
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

  parts.push(`Zone ${getZoneGlyph(getRecipeZoneKey(recipe.family))} ${getRecipeZoneLabel(recipe.family)}`);
  parts.push(`Action ${getRecipeActionLabel(recipe.family)}`);

  if (recipe.tier === 3) {
    parts.push(`${getRecipeTypeGlyph(recipe.type)} Tier 3 epic recipe`);
  }
  if (recipe.tier === 2) {
    parts.push(`Tier 2 unlock: ${getTagGlyph('Shelter')} Shelter or ${getTagGlyph('HearthActive')} HearthActive`);
  }
  if (recipe.requiresTags.length > 0) {
    parts.push(`Requires ${recipe.requiresTags.map((tag) => `${getTagGlyph(tag)} ${formatTagName(tag)}`).join(', ')}`);
  }
  if (recipe.requiresBuilds.length > 0) {
    parts.push(`Requires builds: ${formatBuildList(recipe.requiresBuilds)}`);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}

export function summarizeRecipeEffects(recipe: Recipe): string[] {
  const lines: string[] = [];

  for (const tag of recipe.tags) {
    lines.push(`${getTagGlyph(tag)} Gain ${formatTagName(tag)}`);
  }

  for (const effect of recipe.effects) {
    lines.push(`${getEffectGlyph(effect)} ${formatEffectShort(effect)}`);
  }

  if (recipe.satisfiesCheck) {
    const line = `${getSurvivalCheckGlyph(recipe.satisfiesCheck)} Satisfies ${formatCheckName(recipe.satisfiesCheck)}`;
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
      lines.push(`↘ Reduce ${target} cost by ${effect.amount}${material}`);
      continue;
    }
    if (effect.type === 'recipeRescueBonus') {
      const target = effect.targetRecipeId
        ? recipes.find((recipe) => recipe.id === effect.targetRecipeId)?.printTitle ?? titleCase(effect.targetRecipeId)
        : effect.targetFamily
          ? `${formatTagName(effect.targetFamily)} recipes`
          : 'matching recipes';
      lines.push(`⚑ Add +${effect.amount} Rescue to ${target}`);
      continue;
    }
    if (effect.type === 'recipeVitalityBonus') {
      const target = effect.targetRecipeId
        ? recipes.find((recipe) => recipe.id === effect.targetRecipeId)?.printTitle ?? titleCase(effect.targetRecipeId)
        : effect.targetFamily
          ? `${formatTagName(effect.targetFamily)} recipes`
          : 'matching recipes';
      lines.push(`♥ Add +${effect.amount} Vitality to ${target}`);
      continue;
    }
    if (effect.type === 'recipeMaterialGain') {
      const target = effect.targetRecipeId
        ? recipes.find((recipe) => recipe.id === effect.targetRecipeId)?.printTitle ?? titleCase(effect.targetRecipeId)
        : effect.targetFamily
          ? `${formatTagName(effect.targetFamily)} recipes`
          : 'matching recipes';
      const materialName =
        effect.material === 'CleanWater'
          ? `Treated Water slot${effect.amount === 1 ? '' : 's'}`
          : effect.material === 'Water'
            ? `Raw Water slot${effect.amount === 1 ? '' : 's'}`
            : formatMaterialName(effect.material);
      lines.push(`${getMaterialGlyph(effect.material)} Fill +${effect.amount} ${materialName} on ${target}`);
      continue;
    }
    if (effect.type === 'recipeIncomeBonus') {
      const target = effect.targetRecipeId
        ? recipes.find((recipe) => recipe.id === effect.targetRecipeId)?.printTitle ?? titleCase(effect.targetRecipeId)
        : effect.targetFamily
          ? `${formatTagName(effect.targetFamily)} recipes`
          : 'matching recipes';
      const materialName =
        effect.material === 'CleanWater'
          ? `Treated Water slot${effect.amount === 1 ? '' : 's'}`
          : effect.material === 'Water'
            ? `Raw Water slot${effect.amount === 1 ? '' : 's'}`
            : formatMaterialName(effect.material);
      lines.push(`${getMaterialGlyph(effect.material)} Fill +${effect.amount} ${materialName} each income on ${target}`);
      continue;
    }
    if (effect.type === 'warmthDamageReduction') {
      lines.push(`☀ Move warmth ${effect.amount} toward comfort`);
      continue;
    }
    if (effect.type === 'unlockRecipe') {
      const target = recipes.find((recipe) => recipe.id === effect.recipeId)?.printTitle ?? titleCase(effect.recipeId);
      lines.push(`✦ Unlock ${target}`);
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
    .map(([seat, value]) => (seat === 'solo' ? `⚑ Solo ${value}` : `⚑ ${seat} players ${value}`));
  return entries.join(' · ');
}

function formatCheckName(check: SurvivalCheck): string {
  return check.charAt(0).toUpperCase() + check.slice(1);
}
