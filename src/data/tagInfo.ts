import type { SurvivalCheck, Tag } from '../types';

const TAG_TOOLTIPS: Record<Tag, string> = {
  Shelter: 'Shelter. Reduces cold pressure and is required for some upgrades.',
  SturdyShelter: 'Upgraded shelter. Fully blocks temperature loss.',
  HearthActive: 'Fire source. Eliminates cold damage and unlocks cooking.',
  SustainedFire: 'Upgraded fire. Eliminates cold damage and unlocks Signal Beacon.',
  FoodSource: 'Food engine. Generates Food during income.',
  Tool: 'Utility tag. Required for Tool Bench and other processing builds.',
  SignalEngine: 'Signal engine. Amplifies future signal builds.',
};

const SURVIVAL_TOOLTIPS: Record<SurvivalCheck, string> = {
  hunger: 'Hunger check. Spend 1 Food or take vitality damage.',
  thirst: 'Thirst check. Spend 1 Water or take vitality damage.',
  warmth: 'Warmth check. Use shelter or fire protection or take temperature damage.',
};

export function getTagTooltip(tag: Tag): string {
  return TAG_TOOLTIPS[tag];
}

export function getSurvivalTooltip(check: SurvivalCheck, damage: number, satisfied = damage === 0): string {
  const base = SURVIVAL_TOOLTIPS[check];
  if (!satisfied && damage === 0 && check === 'hunger') {
    return `${base} No Food this round, but hunger damage is delayed.`;
  }
  return damage > 0 ? `${base} Current damage: ${damage}.` : `${base} Currently safe.`;
}
