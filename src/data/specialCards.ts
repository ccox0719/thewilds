import type { Recipe, RNG, SpecialCardDefinition, OwnedSpecialCard } from '../types';

export const specialCards: SpecialCardDefinition[] = [
  {
    id: 'rain-catcher-plan',
    name: 'Rain Catcher Plan',
    source: 'starting',
    family: 'shelter-climate',
    designNotes: 'Opens a water-stability lane by making Water Catcher come online more cleanly. The water it creates is same-round only.',
    printEffectText: 'Water Catcher fills +1 Raw Water slot each income.',
    effects: [
      { type: 'recipeIncomeBonus', targetRecipeId: 'water-catcher', amount: 1, material: 'Water' },
    ],
  },
  {
    id: 'field-dressing',
    name: 'Field Dressing',
    source: 'starting',
    family: 'recovery',
    designNotes: 'Makes prepared food slightly more restorative without turning it into a pure heal card.',
    printEffectText: 'Cooked Meal restores +1 Vitality.',
    effects: [
      { type: 'recipeVitalityBonus', targetRecipeId: 'cooked-meal', amount: 1 },
    ],
  },
  {
    id: 'tripwire-snare',
    name: 'Tripwire Snare',
    source: 'starting',
    family: 'food-engine',
    designNotes: 'Turns the food lane into a more reliable engine by improving Snare output.',
    printEffectText: 'Snare generates +1 Food each income.',
    effects: [
      { type: 'recipeIncomeBonus', targetRecipeId: 'snare', amount: 1, material: 'Food' },
    ],
  },
  {
    id: 'signal-mirror-plan',
    name: 'Signal Mirror Plan',
    source: 'starting',
    family: 'signal-rescue',
    designNotes: 'Makes the earliest rescue play easier to start and gives signal lanes a clearer identity.',
    printEffectText: 'Simple Signal costs 1 less Stone and signal recipes gain +1 Rescue.',
    effects: [
      { type: 'recipeCostReduction', targetRecipeId: 'simple-signal', amount: 1, material: 'Stone' },
      { type: 'recipeRescueBonus', targetFamily: 'signal-rescue', amount: 1 },
    ],
  },
  {
    id: 'kindling-method',
    name: 'Kindling Method',
    source: 'starting',
    family: 'shelter-climate',
    designNotes: 'A small climate technique that trims the cost of early campfire and shelter setup.',
    printEffectText: 'Lean-To and Campfire each cost 1 less Wood.',
    effects: [
      { type: 'recipeCostReduction', targetRecipeId: 'lean-to', amount: 1, material: 'Wood' },
      { type: 'recipeCostReduction', targetRecipeId: 'campfire', amount: 1, material: 'Wood' },
    ],
  },
  {
    id: 'water-filter',
    name: 'Water Filter',
    source: 'earned',
    family: 'processing',
    designNotes: 'An advanced refinement card that turns the water line into a stronger buffer.',
    printEffectText: 'Filtered Water fills +1 Treated Water slot.',
    effects: [
      { type: 'recipeMaterialGain', targetRecipeId: 'filtered-water', amount: 1, material: 'CleanWater' },
    ],
  },
  {
    id: 'smokehouse-plan',
    name: 'Smokehouse Plan',
    source: 'earned',
    family: 'processing',
    designNotes: 'Pushes the food lane from immediate survival into storage and preservation.',
    printEffectText: 'Preserved Rations gain +1 Rations. Drying Rack gains +1 Rations each income.',
    effects: [
      { type: 'recipeMaterialGain', targetRecipeId: 'preserved-rations', amount: 1, material: 'Rations' },
      { type: 'recipeIncomeBonus', targetRecipeId: 'drying-rack', amount: 1, material: 'Rations' },
    ],
  },
  {
    id: 'repair-bench',
    name: 'Repair Bench',
    source: 'earned',
    family: 'processing',
    designNotes: 'Lets the camp turn processing into a more efficient long game lane.',
    printEffectText: 'Processing recipes cost 1 less material.',
    effects: [
      { type: 'recipeCostReduction', targetFamily: 'processing', amount: 1 },
    ],
  },
  {
    id: 'beacon-lens',
    name: 'Beacon Lens',
    source: 'earned',
    family: 'signal-rescue',
    designNotes: 'Makes the rescue lane pay off harder once the camp is already signal-capable, but not to the point of flattening the rest of the build tree.',
    printEffectText: 'Signal recipes gain +2 Rescue.',
    effects: [
      { type: 'recipeRescueBonus', targetFamily: 'signal-rescue', amount: 2 },
    ],
  },
  {
    id: 'insulated-bedding',
    name: 'Insulated Bedding',
    source: 'earned',
    family: 'shelter-climate',
    designNotes: 'A late shelter-climate technique that softens temperature exposure without deleting it.',
    printEffectText: 'Reduce warmth damage by 1.',
    effects: [
      { type: 'warmthDamageReduction', amount: 1 },
    ],
  },
];

export function getSpecialCardById(id: string): SpecialCardDefinition | undefined {
  return specialCards.find((card) => card.id === id);
}

export function drawStartingSpecialCards(rng: RNG, count: number): OwnedSpecialCard[] {
  const pool = specialCards.filter((card) => card.source === 'starting');
  const order = rng.shuffle(pool.map((card) => card.id));
  const owned: OwnedSpecialCard[] = [];
  for (let i = 0; i < count; i++) {
    owned.push({
      id: order[i % order.length],
      source: 'starting',
    });
  }
  return owned;
}

export function getAdvancedSpecialCardForRecipe(recipe: Recipe): SpecialCardDefinition | null {
  if (recipe.id === 'water-catcher') return getSpecialCardById('water-filter') ?? null;
  if (recipe.id === 'drying-rack') return getSpecialCardById('smokehouse-plan') ?? null;
  if (recipe.id === 'tool-bench') return getSpecialCardById('repair-bench') ?? null;
  if (recipe.id === 'signal-lens') return getSpecialCardById('beacon-lens') ?? null;
  if (recipe.id === 'sturdy-shelter' || recipe.id === 'sustained-fire') return getSpecialCardById('insulated-bedding') ?? null;
  return null;
}

export function cardTargetsRecipe(card: SpecialCardDefinition, recipe: Recipe): boolean {
  return card.effects.some((effect) => {
    if (effect.type === 'warmthDamageReduction') return false;
    if (effect.targetRecipeId && effect.targetRecipeId === recipe.id) return true;
    if (effect.targetFamily && effect.targetFamily === recipe.family) return true;
    return false;
  });
}
