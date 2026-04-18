import type { EngineEffect, MaterialType, RecipeFamily, RecipeType, SurvivalCheck, Tag } from '../types';

const MATERIAL_GLYPHS: Record<MaterialType, string> = {
  Wood: '🪵',
  Fiber: '🌿',
  Stone: '🪨',
  Food: '🍖',
  Water: '💧',
  Rations: '🥫',
  CleanWater: '💦',
  Fuel: '🔥',
  Cordage: '🧵',
};

const METER_GLYPHS = {
  vitality: '♥',
  rescue: '⚑',
  hunger: '🍽',
  thirst: '💧',
  warmth: '☀',
  accent: '★',
} as const;

const RECIPE_TYPE_GLYPHS: Record<RecipeType, string> = {
  persistentEngine: '⚙',
  persistent: '⌁',
  oneTime: '✦',
};

const FAMILY_GLYPHS: Record<RecipeFamily, string> = {
  survival: '⛑',
  'food-engine': '🍲',
  processing: '🛠',
  'shelter-climate': '🏕',
  'signal-rescue': '⚑',
  recovery: '✚',
};

const TAG_GLYPHS: Record<Tag, string> = {
  Shelter: '⛺',
  SturdyShelter: '🛖',
  HearthActive: '🔥',
  SustainedFire: '♨',
  FoodSource: '🍖',
  Tool: '🛠',
  SignalEngine: '⚑',
};

const SURVIVAL_GLYPHS: Record<SurvivalCheck, string> = {
  hunger: '🍽',
  thirst: '💧',
  warmth: '☀',
};

const ACTION_GLYPHS = {
  search: '🔎',
  rest: '☾',
  cook: '🍲',
  boil: '♨',
  filter: '🧪',
  fish: '🎣',
  hunt: '🏹',
  trap: '🪤',
  signal: '⚑',
  stokeFire: '🔥',
  preserveFood: '🫙',
  treatWater: '💧',
} as const;

const ZONE_GLYPHS = {
  camp: '⛺',
  field: '⟡',
  water: '🌊',
  forest: '🌲',
  ridge: '⛰',
  shelter: '🛖',
  signal: '⚑',
  hazard: '☠',
} as const;

const PERSISTENCE_GLYPHS = {
  persistent: '⌁',
  engine: '⚙',
  oneTime: '✦',
  zoneUse: '➜',
} as const;

export function getMaterialGlyph(material: MaterialType): string {
  return MATERIAL_GLYPHS[material];
}

export function getMeterGlyph(metric: keyof typeof METER_GLYPHS): string {
  return METER_GLYPHS[metric];
}

export function getRecipeTypeGlyph(type: RecipeType): string {
  return RECIPE_TYPE_GLYPHS[type];
}

export function getRecipeFamilyGlyph(family: RecipeFamily): string {
  return FAMILY_GLYPHS[family];
}

export function getTagGlyph(tag: Tag): string {
  return TAG_GLYPHS[tag];
}

export function getSurvivalCheckGlyph(check: SurvivalCheck): string {
  return SURVIVAL_GLYPHS[check];
}

export function getActionGlyph(action: keyof typeof ACTION_GLYPHS): string {
  return ACTION_GLYPHS[action];
}

export function getZoneGlyph(zone: keyof typeof ZONE_GLYPHS): string {
  return ZONE_GLYPHS[zone];
}

export function getPersistenceGlyph(kind: keyof typeof PERSISTENCE_GLYPHS): string {
  return PERSISTENCE_GLYPHS[kind];
}

export function getEffectGlyph(effect: EngineEffect): string {
  if (effect.type === 'vitality') return METER_GLYPHS.vitality;
  if (effect.type === 'rescue') return METER_GLYPHS.rescue;
  if (effect.type === 'materialGain' && effect.material) return getMaterialGlyph(effect.material);
  if (effect.type === 'materialIncome' && effect.condition === 'Food') return getMaterialGlyph('Food');
  if (effect.type === 'materialIncome' && effect.condition === 'Water') return getMaterialGlyph('Water');
  if (effect.type === 'materialIncome' && effect.condition === 'Rations') return getMaterialGlyph('Rations');
  if (effect.type === 'materialIncome' && effect.condition === 'CleanWater') return getMaterialGlyph('CleanWater');
  if (effect.type === 'costReduction') return '↘';
  if (effect.type === 'rescueBonus') return '↗';
  if (effect.type === 'satisfyCheck' && effect.targetCheck) return getSurvivalCheckGlyph(effect.targetCheck);
  return '•';
}

export function formatEffectShort(effect: EngineEffect): string {
  if (effect.type === 'vitality') return `+${effect.amount} Vitality`;
  if (effect.type === 'rescue') return `+${effect.amount} Rescue`;
  if (effect.type === 'materialGain' && effect.material) {
    if (effect.material === 'CleanWater') return `Fill ${effect.amount} Treated Water slot${effect.amount === 1 ? '' : 's'}`;
    if (effect.material === 'Water') return `Fill ${effect.amount} Raw Water slot${effect.amount === 1 ? '' : 's'}`;
    return `+${effect.amount} ${effect.material}`;
  }
  if (effect.type === 'materialIncome' && effect.condition) {
    if (effect.condition === 'CleanWater') return `Fill ${effect.amount} Treated Water slot${effect.amount === 1 ? '' : 's'}/income`;
    if (effect.condition === 'Water') return `Fill ${effect.amount} Raw Water slot${effect.amount === 1 ? '' : 's'}/income`;
    return `+${effect.amount} ${effect.condition}/income`;
  }
  if (effect.type === 'rescueBonus') {
    return effect.condition === 'signal' ? `Signal +${effect.amount} Rescue` : `Future Rescue +${effect.amount}`;
  }
  if (effect.type === 'costReduction') {
    if (effect.condition?.startsWith('family:')) {
      return `-${effect.amount} ${effect.condition.slice('family:'.length)} cost`;
    }
    if (effect.condition?.startsWith('type:')) {
      return `-${effect.amount} ${effect.condition.slice('type:'.length)} cost`;
    }
    return effect.condition ? `-${effect.amount} ${effect.condition} cost` : `-${effect.amount} cost`;
  }
  if (effect.type === 'satisfyCheck' && effect.targetCheck) {
    return effect.targetCheck === 'thirst'
      ? 'Protect against dehydration'
      : `Satisfy ${effect.targetCheck}`;
  }
  return 'Effect';
}

export function getRecipeRoleLabel(type: RecipeType): string {
  if (type === 'persistentEngine') return 'Engine';
  if (type === 'persistent') return 'Infrastructure';
  return 'One-shot';
}

export function getRecipeActionLabel(recipeFamily: RecipeFamily): string {
  const map: Record<RecipeFamily, string> = {
    survival: 'Survive',
    'food-engine': 'Feed',
    processing: 'Process',
    'shelter-climate': 'Shelter',
    'signal-rescue': 'Signal',
    recovery: 'Recover',
  };
  return map[recipeFamily];
}

export function getRecipeZoneKey(recipeFamily: RecipeFamily): keyof typeof ZONE_GLYPHS {
  const map: Record<RecipeFamily, keyof typeof ZONE_GLYPHS> = {
    survival: 'camp',
    'food-engine': 'camp',
    processing: 'field',
    'shelter-climate': 'camp',
    'signal-rescue': 'ridge',
    recovery: 'camp',
  };
  return map[recipeFamily];
}

export function getRecipeZoneLabel(recipeFamily: RecipeFamily): string {
  const map: Record<RecipeFamily, string> = {
    survival: 'Camp',
    'food-engine': 'Camp',
    processing: 'Field',
    'shelter-climate': 'Camp',
    'signal-rescue': 'Ridge',
    recovery: 'Camp',
  };
  return map[recipeFamily];
}
