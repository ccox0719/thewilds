export type MaterialType =
  | 'Wood'
  | 'Fiber'
  | 'Stone'
  | 'Food'
  | 'Water'
  | 'Rations'
  | 'CleanWater'
  | 'Fuel'
  | 'Cordage';

export type RecipeTier = 1 | 2 | 3;

export type RecipeType = 'persistent' | 'persistentEngine' | 'oneTime';

export type RecipeFamily =
  | 'survival'
  | 'food-engine'
  | 'processing'
  | 'shelter-climate'
  | 'signal-rescue'
  | 'recovery';

export type SurvivalCheck = 'hunger' | 'thirst' | 'warmth';

export type EndCondition = 'rescue' | 'allCollapsed' | 'simulationCeiling';

export type SpecialCardSource = 'starting' | 'earned';

export type RoundEventFamily = 'opportunity' | 'escalation' | 'neutral';

export type Tag =
  | 'Shelter'
  | 'SturdyShelter'
  | 'HearthActive'
  | 'SustainedFire'
  | 'FoodSource'
  | 'Tool'
  | 'SignalEngine';

export interface EngineEffect {
  type: 'vitality' | 'rescue' | 'materialGain' | 'materialIncome' | 'rescueBonus' | 'costReduction' | 'satisfyCheck';
  amount: number;
  condition?: string;
  duration?: 'permanent' | 'oneRound' | 'oncePerGame';
  targetCheck?: SurvivalCheck;
  material?: MaterialType;
}

export interface SpecialCardEffectBase {
  targetRecipeId?: string;
  targetFamily?: RecipeFamily;
}

export interface MaintenanceRule {
  cost: Partial<Record<MaterialType, number>>;
  startRound?: number;
  interval?: number;
}

export interface RoundEventDefinition {
  id: string;
  name: string;
  family: RoundEventFamily;
  description: string;
  scenarioIds: string[];
  startRound?: number;
  endRound?: number;
  temperatureShift?: number;
  pressureBonus?: Partial<Record<SurvivalCheck, number>>;
  signalRescueBonus?: number;
  recipeFamilyCostDelta?: Partial<Record<RecipeFamily, number>>;
}

export interface RoundEventInstance extends RoundEventDefinition {
  round: number;
}

export interface SpecialCardDefinition {
  id: string;
  name: string;
  source: SpecialCardSource;
  family: RecipeFamily;
  designNotes: string;
  printEffectText: string;
  effects: SpecialCardEffect[];
}

export interface OwnedSpecialCard {
  id: string;
  source: SpecialCardSource;
  earnedRound?: number;
  grantedBy?: string;
}

export type SpecialCardEffect =
  | (SpecialCardEffectBase & {
      type: 'recipeCostReduction';
      amount: number;
      material?: MaterialType;
    })
  | (SpecialCardEffectBase & {
      type: 'recipeRescueBonus';
      amount: number;
    })
  | (SpecialCardEffectBase & {
      type: 'recipeVitalityBonus';
      amount: number;
    })
  | (SpecialCardEffectBase & {
      type: 'recipeMaterialGain';
      amount: number;
      material: MaterialType;
    })
  | (SpecialCardEffectBase & {
      type: 'recipeIncomeBonus';
      amount: number;
      material: MaterialType;
    })
  | {
      type: 'warmthDamageReduction';
      amount: number;
    }
  | SpecialCardEffectBase & {
      type: 'unlockRecipe';
      recipeId: string;
    };

export interface Recipe {
  id: string;
  name: string;
  tier: RecipeTier;
  type: RecipeType;
  family: RecipeFamily;
  cost: Partial<Record<MaterialType, number>>;
  requiresTags: Tag[];
  requiresBuilds: string[];
  persistent: boolean;
  tags: Tag[];
  effects: EngineEffect[];
  maintenance?: MaintenanceRule;
  satisfiesCheck?: SurvivalCheck;
  designNotes: string;
  baseValue: number;
  printTitle: string;
  printCostText: string;
  printEffectText: string;
  printIconKeys: string[];
}

export interface Perk {
  id: string;
  name: string;
  enabled: boolean;
  usedThisGame: boolean;
  description: string;
  triggerCondition: string;
}

export interface Profile {
  id: string;
  name: string;
  perk: Perk;
  designNotes: string;
}

export interface PlayerState {
  id: string;
  name: string;
  profile: Profile;
  vitality: number;
  rescueScore: number;
  inventory: Partial<Record<MaterialType, number>>;
  hungerDebt: number;
  builtRecipes: string[];
  activeTags: Tag[];
  collapsed: boolean;
  collapseRound: number | null;
  perkUsed: boolean;
  pendingCostReduction?: {
    recipeId: string;
    material?: MaterialType;
    amount: number;
  } | null;
  rescueBonuses?: Partial<Record<string, number>>;
  specialCards: OwnedSpecialCard[];
  maintenanceInactiveRecipes: string[];
  survivalStatus: SurvivalStatus;
  isAI: boolean;
  aiStrategy?: AIStrategy;
  snareBonusRound?: number | null;
}

export interface MarketState {
  available: MaterialType[];
  roundDrawn: number[];
}

export interface SurvivalStatus {
  hungerSatisfied: boolean;
  thirstSatisfied: boolean;
  warmthSatisfied: boolean;
  allChecksPassed: boolean;
}

export interface GameState {
  gameId: string;
  scenario: Scenario;
  round: number;
  simulationCeiling: number;
  players: PlayerState[];
  groupRescueTrack: number;
  groupRescueThreshold: number;
  market: MarketState;
  bagRemaining: MaterialType[];
  turnOrder: string[];
  firstPlayerIndex: number;
  currentEvent: RoundEventInstance | null;
  gameOver: boolean;
  endCondition: EndCondition | null;
  winner: string | null;
  log: LogEntry[];
  rngSeed: number;
}

export interface Scenario {
  id: string;
  name: string;
  bagComposition: Partial<Record<MaterialType, number>>;
  temperaturePressure: number;
  rescueThresholdAdjust?: number;
  description: string;
}

export interface LogEntry {
  round: number;
  playerId: string;
  action: string;
  detail: string;
}

export interface SimulationResult {
  gameId: string;
  rounds: number;
  endCondition: EndCondition;
  winner: string | null;
  groupRescueFinal: number;
  groupRescueThreshold: number;
  rescueReached: boolean;
  players: SimulationPlayerResult[];
  recipeUsageFrequency: Record<string, number>;
  tier2RecipeUsageFrequency: Record<string, number>;
  eventFrequencyByFamily: Record<RoundEventFamily, number>;
  eventFrequencyById: Record<string, number>;
  maintenanceFailureCount: number;
  maintenanceDowntimeCount: number;
  specialCardGrantFrequency: Record<string, number>;
  specialCardOwnershipFrequency: Record<string, number>;
  rngSeed: number;
  log: LogEntry[];
}

export interface SimulationPlayerResult {
  playerId: string;
  profile: string;
  aiStrategy: string;
  finalScore: number;
  rescueScore: number;
  finalVitality: number;
  persistentBuilds: number;
  collapsed: boolean;
  collapseRound: number | null;
  perkUsed: boolean;
  builtRecipes: string[];
  firstTier2RecipeRound: number | null;
  checkFailuresByRound: Record<number, SurvivalCheck[]>;
}

export interface BatchSimulationResult {
  count: number;
  scenario: string;
  perksEnabled: boolean;
  avgScore: number;
  avgRescue: number;
  avgVitality: number;
  avgRoundsPlayed: number;
  survivalPercent: number;
  collapsePercent: number;
  rescueReachedPercent: number;
  allCollapsedPercent: number;
  simulationCeilingPercent: number;
  collapseTimingDistribution: Record<number, number>;
  checkFailureFrequency: Record<SurvivalCheck, number>;
  recipeUsageFrequency: Record<string, number>;
  tier2RecipeUsageFrequency: Record<string, number>;
  eventFrequencyByFamily: Record<RoundEventFamily, number>;
  eventFrequencyById: Record<string, number>;
  maintenanceFailureCount: number;
  maintenanceDowntimeCount: number;
  specialCardGrantFrequency: Record<string, number>;
  specialCardOwnershipFrequency: Record<string, number>;
  byProfile: Record<string, ProfileBatchStats>;
}

export interface ProfileBatchStats {
  avgScore: number;
  avgRescue: number;
  avgVitality: number;
  survivalPercent: number;
  perkUsagePercent: number;
  firstTier2RecipeAvgRound: number;
}

export type AIStrategy = 'cautious' | 'balanced' | 'rescueFocused';

export interface GameConfig {
  playerCount: number;
  scenario: Scenario;
  profiles: Profile[];
  aiStrategies: AIStrategy[];
  rngSeed?: number;
}

export interface SimulationConfig {
  playerCount: number;
  scenario: Scenario;
  profiles: Profile[];
  aiStrategies: AIStrategy[];
  rngSeed?: number;
}

export interface ValueContext {
  scenario: Scenario;
  round: number;
  playerCount: number;
}

export interface RNG {
  next(): number;
  pick<T>(array: T[]): T;
  shuffle<T>(array: T[]): T[];
}

export interface BalanceConfig {
  startingVitality: number;
  simulationCeiling: number;
  materialsPrivateDrawPerRound: number;
  marketCapSize: number;
  hungerMissesPerDamage: number;
  tier2UnlockCondition: string;
  pressureSchedule: number[];
  rescueThresholds: Record<string, number>;
  scoring: {
    rescueMultiplier: number;
    healthyVitalityThreshold: number;
    healthyVitalityBonus: number;
    persistentBuildBonus: number;
  };
  aiWeights: {
    shelterPriority: number;
    firePriority: number;
    snarePriority: number;
    signalPlatformPriority: number;
    beaconPriority: number;
    stabilizePriority: number;
    lateSignalPriority: number;
    vitalityPriority: number;
  };
  perks: {
    builderEnabled: boolean;
    providerEnabled: boolean;
    trapperEnabled: boolean;
    scoutEnabled: boolean;
  };
}
