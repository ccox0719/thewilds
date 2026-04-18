import type { GameState, PlayerState, Recipe, MaterialType, Tag, SurvivalCheck } from '../types';
import { recipes } from '../data/recipes';
import { getSpecialCardById, getAdvancedSpecialCardForRecipe } from '../data/specialCards';
import { getEventPressureBonus, getEventSignalBonus, getEventTemperatureShift, getEventRecipeCostDelta } from '../data/events';
import { config } from '../data/config';
import { addLog } from './state';

export function hasTier2Unlock(player: PlayerState, state: GameState): boolean {
  return playerHasTag(player, state, 'Shelter') || playerHasTag(player, state, 'HearthActive');
}

export function getAvailableRecipes(player: PlayerState, state: GameState): Recipe[] {
  if (player.collapsed || state.gameOver) return [];
  const tier2Unlocked = hasTier2Unlock(player, state);
  const hasHearth = playerHasTag(player, state, 'HearthActive');
  const hasFoodSource = playerHasTag(player, state, 'FoodSource');
  const hasSignalEngine = playerHasTag(player, state, 'SignalEngine');
  const hasTool = playerHasTag(player, state, 'Tool');
  const hasFuelEngine = playerHasTag(player, state, 'SustainedFire');

  return recipes.filter((recipe) => {
    if (recipe.tier === 2 && !tier2Unlocked) return false;
    if (recipe.persistent && player.builtRecipes.includes(recipe.id)) return false;
    if (hasHearth && isFireStarterRecipe(recipe)) return false;
    if (hasFoodSource && recipe.id === 'snare') return false;
    if (hasSignalEngine && recipe.id === 'simple-signal') return false;
    if (hasTool && recipe.id === 'basic-tool') return false;
    if (hasFuelEngine && recipe.id === 'dry-fuel') return false;
    if (!recipe.requiresTags.every((tag) => playerHasTag(player, state, tag))) return false;
    if (!recipe.requiresBuilds.every((id) => player.builtRecipes.includes(id))) return false;
    return true;
  });
}

function isFireStarterRecipe(recipe: Recipe): boolean {
  return recipe.id === 'bow-drill' || recipe.id === 'flint-spark' || recipe.id === 'brush-ember';
}

export function canCraftRecipe(player: PlayerState, recipe: Recipe, state: GameState): boolean {
  if (player.collapsed || state.gameOver) return false;
  const cost = getEffectiveRecipeCost(player, recipe, state);
  for (const [material, required] of Object.entries(cost) as [MaterialType, number][]) {
    if ((player.inventory[material] ?? 0) < required) return false;
  }
  return true;
}

export function payRecipeCost(player: PlayerState, recipe: Recipe): PlayerState {
  const inventory = { ...player.inventory };
  const cost = getEffectiveRecipeCost(player, recipe, null);
  for (const [material, required] of Object.entries(cost) as [MaterialType, number][]) {
    inventory[material] = (inventory[material] ?? 0) - required;
    if (inventory[material] === 0) delete inventory[material];
  }
  return { ...player, inventory };
}

export function applyRecipeEffects(
  player: PlayerState,
  recipe: Recipe,
  state: GameState,
): { player: PlayerState; state: GameState } {
  let p = { ...player };
  let s = state;

  const newTags = recipe.tags.filter((tag: Tag) => !p.activeTags.includes(tag));
  if (newTags.length > 0) {
    p = { ...p, activeTags: [...p.activeTags, ...newTags] };
  }

  if (!p.builtRecipes.includes(recipe.id)) {
    p = { ...p, builtRecipes: [...p.builtRecipes, recipe.id] };
  }

  if (p.pendingCostReduction) {
    p = { ...p, pendingCostReduction: null };
  }

  if (recipe.satisfiesCheck) {
    p = applySatisfiedCheck(p, recipe.satisfiesCheck);
  }

  for (const effect of recipe.effects) {
    if (effect.type === 'vitality') {
      p = { ...p, vitality: p.vitality + effect.amount + getSpecialCardRecipeVitalityBonus(p, recipe) };
    }
    if (effect.type === 'materialGain' && effect.material) {
      const bonus = getSpecialCardRecipeMaterialGainBonus(p, recipe, effect.material);
      p = {
        ...p,
        inventory: {
          ...p.inventory,
          [effect.material]: (p.inventory[effect.material] ?? 0) + effect.amount + bonus,
        },
      };
    }
    if (effect.type === 'satisfyCheck' && effect.targetCheck) {
      p = applySatisfiedCheck(p, effect.targetCheck);
    }
    if (effect.type === 'rescue') {
      const bonus = getSpecialCardRecipeRescueBonus(p, recipe, state);
      const totalRescue = effect.amount + bonus;
      p = { ...p, rescueScore: p.rescueScore + totalRescue };
      s = { ...s, groupRescueTrack: s.groupRescueTrack + totalRescue };
    }
    if (effect.type === 'rescueBonus') {
      const condition = effect.condition ?? 'signal';
      p = {
        ...p,
        rescueBonuses: {
          ...(p.rescueBonuses ?? {}),
          [condition]: (p.rescueBonuses?.[condition] ?? 0) + effect.amount,
        },
      };
    }
  }

  const updatedPlayers = s.players.map((pl) => (pl.id === p.id ? p : pl));
  s = { ...s, players: updatedPlayers };

  return { player: p, state: s };
}

export function resolveEngineIncome(player: PlayerState, state: GameState): PlayerState {
  if (player.collapsed) return player;

  let p = { ...player };

  for (const recipeId of p.builtRecipes) {
    const builtRecipe = recipes.find((recipe) => recipe.id === recipeId);
    if (!builtRecipe) continue;
    if (!isRecipeMaintained(p, builtRecipe.id)) continue;
    for (const effect of builtRecipe.effects) {
      if (effect.type !== 'materialIncome' || !effect.condition) continue;
      if (!isMaterialType(effect.condition)) continue;
      const bonus = getSpecialCardRecipeIncomeBonus(p, builtRecipe, effect.condition);
      p = {
        ...p,
        inventory: {
          ...p.inventory,
          [effect.condition]: (p.inventory[effect.condition] ?? 0) + effect.amount + bonus,
        },
      };
    }
  }

  if (p.profile.id === 'trapper' && p.snareBonusRound === state.round) {
    p = {
      ...p,
      inventory: {
        ...p.inventory,
        Food: (p.inventory.Food ?? 0) + 1,
      },
      snareBonusRound: null,
    };
  }

  return p;
}

export function resolveHungerCheck(
  player: PlayerState,
  state: GameState,
): { player: PlayerState; vitDamage: number; satisfied: boolean } {
  if (player.collapsed) return { player, vitDamage: 0, satisfied: true };
  if (player.survivalStatus.hungerSatisfied) return { player, vitDamage: 0, satisfied: true };

  const ration = player.inventory.Rations ?? 0;
  if (ration > 0) {
    const inventory = { ...player.inventory };
    inventory.Rations = ration - 1;
    if (inventory.Rations === 0) delete inventory.Rations;
    return {
      player: { ...player, inventory, hungerDebt: 0 },
      vitDamage: 0,
      satisfied: true,
    };
  }

  const food = player.inventory.Food ?? 0;
  if (food > 0) {
    const inventory = { ...player.inventory };
    inventory.Food = food - 1;
    if (inventory.Food === 0) delete inventory.Food;
    return {
      player: { ...player, inventory, hungerDebt: 0 },
      vitDamage: 0,
      satisfied: true,
    };
  }

  const hungerDebt = (player.hungerDebt ?? 0) + 1 + getEventPressureBonus(state.currentEvent, 'hunger');
  const threshold = Math.max(1, config.hungerMissesPerDamage);
  const vitDamage = hungerDebt >= threshold ? 1 : 0;
  const remainingDebt = hungerDebt >= threshold ? hungerDebt - threshold : hungerDebt;

  return {
    player: { ...player, hungerDebt: remainingDebt },
    vitDamage,
    satisfied: false,
  };
}

export function resolveThirstCheck(
  player: PlayerState,
  state: GameState,
): { player: PlayerState; vitDamage: number; satisfied: boolean } {
  if (player.collapsed) return { player, vitDamage: 0, satisfied: true };
  if (player.survivalStatus.thirstSatisfied) return { player, vitDamage: 0, satisfied: true };

  const cleanWater = player.inventory.CleanWater ?? 0;
  if (cleanWater > 0) {
    const inventory = { ...player.inventory };
    inventory.CleanWater = cleanWater - 1;
    if (inventory.CleanWater === 0) delete inventory.CleanWater;
    return { player: { ...player, inventory }, vitDamage: 0, satisfied: true };
  }

  const water = player.inventory.Water ?? 0;
  if (water > 0) {
    const inventory = { ...player.inventory };
    inventory.Water = water - 1;
    if (inventory.Water === 0) delete inventory.Water;
    return { player: { ...player, inventory }, vitDamage: 0, satisfied: true };
  }

  const heatPressure = Math.max(0, state.scenario.temperaturePressure + getEventTemperatureShift(state.currentEvent));
  const eventBonus = Math.max(0, getEventPressureBonus(state.currentEvent, 'thirst'));
  return {
    player,
    vitDamage: Math.max(1, 1 + (heatPressure > 0 ? 1 : 0) + eventBonus),
    satisfied: false,
  };
}

export function resolveWarmthCheck(
  player: PlayerState,
  state: GameState,
): { player: PlayerState; vitDamage: number; satisfied: boolean } {
  if (player.collapsed) return { player, vitDamage: 0, satisfied: true };
  if (player.survivalStatus.warmthSatisfied) return { player, vitDamage: 0, satisfied: true };

  const pressure = state.scenario.temperaturePressure + getEventTemperatureShift(state.currentEvent);
  if (pressure === 0) return { player, vitDamage: 0, satisfied: true };

  const hasShelter = playerHasTag(player, state, 'Shelter');
  const hasSturdyShelter = playerHasTag(player, state, 'SturdyShelter');
  const hasHearth = playerHasTag(player, state, 'HearthActive');
  const hasSustainedFire = playerHasTag(player, state, 'SustainedFire');
  const cardWarmthReduction = getSpecialCardWarmthReduction(player);

  if (pressure > 0) {
    if (hasSturdyShelter || hasHearth || hasSustainedFire) return { player, vitDamage: 0, satisfied: true };
    const baseDamage = hasShelter ? Math.max(pressure - 1, 0) : pressure;
    const vitDamage = Math.max(baseDamage - cardWarmthReduction, 0);
    return { player, vitDamage, satisfied: vitDamage === 0 };
  }

  const baseDamage = hasSturdyShelter || hasShelter ? 0 : Math.abs(pressure);
  const vitDamage = Math.max(baseDamage - cardWarmthReduction, 0);
  return { player, vitDamage, satisfied: vitDamage === 0 };
}

export function applyVitalityRegen(player: PlayerState): PlayerState {
  if (player.collapsed) return player;
  if (!player.survivalStatus.allChecksPassed) return player;
  return { ...player, vitality: player.vitality + 1 };
}

export function getPressureCost(round: number): number {
  const schedule = config.pressureSchedule;
  return schedule[round - 1] ?? schedule.at(-1)!;
}

export function craftRecipe(
  state: GameState,
  playerId: string,
  recipeId: string,
  detail?: string,
): GameState {
  const player = state.players.find((p) => p.id === playerId);
  const recipe = recipes.find((r) => r.id === recipeId);
  if (!player || !recipe) return state;

  const available = getAvailableRecipes(player, state);
  if (!available.find((r) => r.id === recipeId)) return state;
  if (!canCraftRecipe(player, recipe, state)) return state;

  let updatedPlayer = payRecipeCost(player, recipe);
  let updatedState = state;

  const effectResult = applyRecipeEffects(updatedPlayer, recipe, updatedState);
  updatedPlayer = effectResult.player;
  updatedState = effectResult.state;

  updatedPlayer = clearPendingCostReduction(updatedPlayer);
  updatedState = {
    ...updatedState,
    players: updatedState.players.map((pl) => (pl.id === updatedPlayer.id ? updatedPlayer : pl)),
  };

  updatedState = applyBuildPerkHooks(updatedState, updatedPlayer, recipe);
  updatedPlayer = updatedState.players.find((p) => p.id === playerId) ?? updatedPlayer;

  updatedState = maybeGrantSpecialCard(updatedState, updatedPlayer, recipe);
  updatedPlayer = updatedState.players.find((p) => p.id === playerId) ?? updatedPlayer;

  const logDetail = detail ? `Crafted ${recipe.name} — ${detail}` : `Crafted ${recipe.name}`;
  updatedState = addLog(updatedState, playerId, 'craft', logDetail);
  return updatedState;
}

export function getEffectiveRecipeCost(
  player: PlayerState,
  recipe: Recipe,
  state: GameState | null = null,
): Partial<Record<MaterialType, number>> {
  const cost = { ...recipe.cost };
  const reductions = getRecipeCostReductions(player, recipe);
  const cardReductions = getSpecialCardCostReductions(player, recipe);
  const eventDeltas = state ? getEventRecipeCostDelta(state.currentEvent, recipe) : [];

  for (const reduction of [...reductions, ...cardReductions]) {
    for (let i = 0; i < reduction.amount; i += 1) {
      applySingleCostReduction(cost, reduction.material);
    }
  }

  for (const delta of eventDeltas) {
    const steps = Math.abs(delta.amount);
    for (let i = 0; i < steps; i += 1) {
      if (delta.amount > 0) applySingleCostIncrease(cost, delta.material);
      else applySingleCostReduction(cost, delta.material);
    }
  }

  return cost;
}

function applySatisfiedCheck(player: PlayerState, check: SurvivalCheck): PlayerState {
  const status = { ...player.survivalStatus };
  if (check === 'hunger') status.hungerSatisfied = true;
  if (check === 'thirst') status.thirstSatisfied = true;
  if (check === 'warmth') status.warmthSatisfied = true;
  status.allChecksPassed = status.hungerSatisfied && status.thirstSatisfied && status.warmthSatisfied;
  return {
    ...player,
    survivalStatus: status,
    hungerDebt: check === 'hunger' ? 0 : player.hungerDebt,
  };
}

function clearPendingCostReduction(player: PlayerState): PlayerState {
  if (!player.pendingCostReduction) return player;
  return { ...player, pendingCostReduction: null };
}

function getOwnedSpecialCards(player: PlayerState) {
  return player.specialCards
    .map((owned) => getSpecialCardById(owned.id))
    .filter((card): card is NonNullable<ReturnType<typeof getSpecialCardById>> => Boolean(card));
}

export function playerHasTag(player: PlayerState, _state: GameState, tag: Tag): boolean {
  for (const recipeId of player.builtRecipes) {
    const builtRecipe = recipes.find((recipe) => recipe.id === recipeId);
    if (!builtRecipe) continue;
    if (!isRecipeMaintained(player, builtRecipe.id)) continue;
    if (builtRecipe.tags.includes(tag)) return true;
  }
  return false;
}

function getSpecialCardCostReductions(
  player: PlayerState,
  recipe: Recipe,
): { amount: number; material?: MaterialType }[] {
  const reductions: { amount: number; material?: MaterialType }[] = [];
  for (const card of getOwnedSpecialCards(player)) {
    for (const effect of card.effects) {
      if (effect.type !== 'recipeCostReduction') continue;
      if (!matchesSpecialCardTarget(effect, recipe)) continue;
      reductions.push({ amount: effect.amount, material: effect.material });
    }
  }
  return reductions;
}

function getSpecialCardRecipeVitalityBonus(player: PlayerState, recipe: Recipe): number {
  let bonus = 0;
  for (const card of getOwnedSpecialCards(player)) {
    for (const effect of card.effects) {
      if (effect.type !== 'recipeVitalityBonus') continue;
      if (!matchesSpecialCardTarget(effect, recipe)) continue;
      bonus += effect.amount;
    }
  }
  return bonus;
}

function getSpecialCardRecipeMaterialGainBonus(player: PlayerState, recipe: Recipe, material: MaterialType): number {
  let bonus = 0;
  for (const card of getOwnedSpecialCards(player)) {
    for (const effect of card.effects) {
      if (effect.type !== 'recipeMaterialGain') continue;
      if (effect.material !== material) continue;
      if (!matchesSpecialCardTarget(effect, recipe)) continue;
      bonus += effect.amount;
    }
  }
  return bonus;
}

function getSpecialCardRecipeIncomeBonus(player: PlayerState, recipe: Recipe, material: MaterialType): number {
  let bonus = 0;
  for (const card of getOwnedSpecialCards(player)) {
    for (const effect of card.effects) {
      if (effect.type !== 'recipeIncomeBonus') continue;
      if (effect.material !== material) continue;
      if (!matchesSpecialCardTarget(effect, recipe)) continue;
      bonus += effect.amount;
    }
  }
  return bonus;
}

function getSpecialCardRecipeRescueBonus(player: PlayerState, recipe: Recipe, state: GameState): number {
  const bonuses = player.rescueBonuses ?? {};
  let bonus = 0;
  if (recipe.id === 'simple-signal' || recipe.id === 'signal-beacon') {
    if (playerHasTag(player, state, 'SignalEngine')) {
      bonus += bonuses.signal ?? 0;
      bonus += getEventSignalBonus(state.currentEvent);
      bonus += 1;
    }
  }
  for (const card of getOwnedSpecialCards(player)) {
    for (const effect of card.effects) {
      if (effect.type !== 'recipeRescueBonus') continue;
      if (!matchesSpecialCardTarget(effect, recipe)) continue;
      bonus += effect.amount;
    }
  }
  return bonus;
}

function getSpecialCardWarmthReduction(player: PlayerState): number {
  let reduction = 0;
  for (const card of getOwnedSpecialCards(player)) {
    for (const effect of card.effects) {
      if (effect.type !== 'warmthDamageReduction') continue;
      reduction += effect.amount;
    }
  }
  return reduction;
}

function isRecipeMaintained(player: PlayerState, recipeId: string): boolean {
  return !player.maintenanceInactiveRecipes.includes(recipeId);
}

function maybeGrantSpecialCard(state: GameState, player: PlayerState, recipe: Recipe): GameState {
  const currentPlayer = state.players.find((p) => p.id === player.id);
  if (!currentPlayer) return state;
  if (!(recipe.persistent && recipe.tier === 2)) return state;

  const award = getAdvancedSpecialCardForRecipe(recipe);
  if (!award) return state;
  if (currentPlayer.specialCards.some((card) => card.id === award.id)) return state;

  const updatedPlayers = state.players.map((p) =>
    p.id === player.id
      ? {
          ...p,
          specialCards: [
            ...p.specialCards,
            { id: award.id, source: 'earned' as const, earnedRound: state.round, grantedBy: recipe.id },
          ],
        }
      : p,
  );
  return addLog({ ...state, players: updatedPlayers }, player.id, 'card', `Earned ${award.name}`);
}

function matchesSpecialCardTarget(
  effect: { targetRecipeId?: string; targetFamily?: string },
  recipe: Recipe,
): boolean {
  if (effect.targetRecipeId && effect.targetRecipeId === recipe.id) return true;
  if (effect.targetFamily && effect.targetFamily === recipe.family) return true;
  return !effect.targetRecipeId && !effect.targetFamily;
}

function getRecipeCostReductions(
  player: PlayerState,
  recipe: Recipe,
): { amount: number; material?: MaterialType }[] {
  const reductions: { amount: number; material?: MaterialType }[] = [];

  if (player.pendingCostReduction?.recipeId === recipe.id) {
    reductions.push({
      amount: player.pendingCostReduction.amount,
      material: player.pendingCostReduction.material,
    });
  }

  for (const builtRecipeId of player.builtRecipes) {
    const builtRecipe = recipes.find((entry) => entry.id === builtRecipeId);
    if (!builtRecipe) continue;

    for (const effect of builtRecipe.effects) {
      if (effect.type !== 'costReduction') continue;
      if (!doesCostReductionApply(effect.condition, recipe)) continue;
      reductions.push({ amount: effect.amount });
    }
  }

  return reductions;
}

function doesCostReductionApply(condition: string | undefined, recipe: Recipe): boolean {
  if (!condition) return true;
  if (condition.startsWith('recipe:')) return condition.slice('recipe:'.length) === recipe.id;
  if (condition.startsWith('family:')) return condition.slice('family:'.length) === recipe.family;
  if (condition.startsWith('type:')) return condition.slice('type:'.length) === recipe.type;
  if (condition === recipe.id) return true;
  if (condition === recipe.family) return true;
  if (condition === recipe.type) return true;
  return false;
}

function applySingleCostReduction(cost: Partial<Record<MaterialType, number>>, material?: MaterialType): void {
  const targetMaterial = material ?? chooseMostExpensiveMaterial(cost);
  if (!targetMaterial) return;
  const current = cost[targetMaterial] ?? 0;
  if (current <= 0) return;
  const next = Math.max(0, current - 1);
  if (next === 0) delete cost[targetMaterial];
  else cost[targetMaterial] = next;
}

function applySingleCostIncrease(cost: Partial<Record<MaterialType, number>>, material?: MaterialType): void {
  const targetMaterial = material ?? chooseCheapestMaterial(cost);
  if (!targetMaterial) return;
  cost[targetMaterial] = (cost[targetMaterial] ?? 0) + 1;
}

function chooseMostExpensiveMaterial(cost: Partial<Record<MaterialType, number>>): MaterialType | null {
  let chosen: MaterialType | null = null;
  let best = -1;
  for (const [material, amount] of Object.entries(cost) as [MaterialType, number][]) {
    if (amount > best) {
      best = amount;
      chosen = material;
    }
  }
  return chosen;
}

function chooseCheapestMaterial(cost: Partial<Record<MaterialType, number>>): MaterialType | null {
  let chosen: MaterialType | null = null;
  let best = Number.POSITIVE_INFINITY;
  for (const [material, amount] of Object.entries(cost) as [MaterialType, number][]) {
    if (amount < best) {
      best = amount;
      chosen = material;
    }
  }
  return chosen;
}

function isMaterialType(value: string): value is MaterialType {
  return ['Wood', 'Fiber', 'Stone', 'Food', 'Water', 'Rations', 'CleanWater', 'Fuel', 'Cordage'].includes(value);
}

function applyBuildPerkHooks(state: GameState, player: PlayerState, recipe: Recipe): GameState {
  let updatedState = state;
  const updatedPlayers = updatedState.players.map((pl) => (pl.id === player.id ? player : pl));
  updatedState = { ...updatedState, players: updatedPlayers };

  if (player.profile.id === 'trapper' && recipe.id === 'snare' && !player.perkUsed && player.profile.perk.enabled) {
    const trapper = {
      ...player,
      inventory: {
        ...player.inventory,
        Food: (player.inventory.Food ?? 0) + 1,
      },
      perkUsed: true,
      profile: { ...player.profile, perk: { ...player.profile.perk, usedThisGame: true } },
    };
    updatedState = {
      ...updatedState,
      players: updatedState.players.map((pl) => (pl.id === player.id ? trapper : pl)),
    };
    updatedState = addLog(updatedState, player.id, 'perk', 'Trapper: gained 1 Food');
  }

  if (player.profile.id === 'scout' && recipe.id === 'simple-signal' && !player.perkUsed && player.profile.perk.enabled) {
    const scout = {
      ...player,
      rescueScore: player.rescueScore + 1,
      perkUsed: true,
      profile: { ...player.profile, perk: { ...player.profile.perk, usedThisGame: true } },
    };
    updatedState = {
      ...updatedState,
      players: updatedState.players.map((pl) => (pl.id === player.id ? scout : pl)),
      groupRescueTrack: updatedState.groupRescueTrack + 1,
    };
    updatedState = addLog(updatedState, player.id, 'perk', 'Scout: +1 rescue on first Simple Signal');
  }

  return updatedState;
}
