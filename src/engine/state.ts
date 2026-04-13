import type { GameState, GameConfig, PlayerState, MaterialType } from '../types';
import { drawStartingSpecialCards } from '../data/specialCards';
import { config } from '../data/config';
import { createRNG, randomSeed } from '../utils/rng';
import { validateRecipes, validateSpecialCards, validateScenarios, validateConfig } from './validation';

function buildBag(bagComposition: Partial<Record<MaterialType, number>>): MaterialType[] {
  const bag: MaterialType[] = [];
  for (const [material, count] of Object.entries(bagComposition) as [MaterialType, number][]) {
    for (let i = 0; i < count; i++) {
      bag.push(material);
    }
  }
  return bag;
}

function getRescueThreshold(playerCount: number, scenario: GameConfig['scenario']): number {
  const key = playerCount === 1 ? 'solo' : String(playerCount);
  return (config.rescueThresholds[key] ?? 22) + (scenario.rescueThresholdAdjust ?? 0);
}

export function createEmptySurvivalStatus() {
  return {
    hungerSatisfied: false,
    thirstSatisfied: false,
    warmthSatisfied: false,
    allChecksPassed: false,
  };
}

export function createNewGame(gameConfig: GameConfig): GameState {
  const seed = gameConfig.rngSeed ?? randomSeed();
  const rng = createRNG(seed);

  const baseBag = buildBag(gameConfig.scenario.bagComposition);
  // Shuffle the bag so draws are randomized
  const bagRemaining = rng.shuffle(baseBag);

  const players: PlayerState[] = gameConfig.profiles.map((profile, i) => ({
    id: `player-${i + 1}`,
    name: profile.name,
    profile: {
      ...profile,
      perk: { ...profile.perk, usedThisGame: false },
    },
    vitality: config.startingVitality,
    rescueScore: 0,
    inventory: {},
    hungerDebt: 0,
    builtRecipes: [],
    activeTags: [],
    collapsed: false,
    collapseRound: null,
    perkUsed: false,
    pendingCostReduction: null,
    rescueBonuses: {},
    specialCards: [],
    maintenanceInactiveRecipes: [],
    survivalStatus: createEmptySurvivalStatus(),
    isAI: true,
    aiStrategy: gameConfig.aiStrategies[i] ?? 'balanced',
    snareBonusRound: null,
  }));

  const startingCards = drawStartingSpecialCards(rng, players.length);
  for (let i = 0; i < players.length; i++) {
    players[i] = {
      ...players[i],
      specialCards: [startingCards[i]],
    };
  }

  const turnOrder = players.map((p) => p.id);

  return {
    gameId: `game-${seed}`,
    scenario: gameConfig.scenario,
    round: 1,
    simulationCeiling: config.simulationCeiling,
    players,
    groupRescueTrack: 0,
    groupRescueThreshold: getRescueThreshold(players.length, gameConfig.scenario),
    market: { available: [], roundDrawn: [] },
    bagRemaining,
    turnOrder,
    firstPlayerIndex: 0,
    currentEvent: null,
    gameOver: false,
    endCondition: null,
    winner: null,
    log: [],
    rngSeed: seed,
  };
}

export function cloneGameState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

export function addLog(
  state: GameState,
  playerId: string,
  action: string,
  detail: string,
): GameState {
  return {
    ...state,
    log: [...state.log, { round: state.round, playerId, action, detail }],
  };
}

// Validate that all recipe and config data loads without errors
export function validateDataIntegrity(): string[] {
  return [
    ...validateRecipes(),
    ...validateSpecialCards(),
    ...validateScenarios(),
    ...validateConfig(),
  ];
}
