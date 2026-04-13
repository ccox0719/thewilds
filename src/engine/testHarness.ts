// Quick console test harness — run with: npx tsx src/engine/testHarness.ts
import { createNewGame } from './state';
import { runFullRound } from './round';
import { scorePlayer } from './scoring';
import { validateRecipes, validateSpecialCards, validateScenarios, validateConfig } from './validation';
import { runBatchSimulation } from './simulation';
import { scenarios } from '../data/scenarios';
import { profiles } from '../data/profiles';
import { getRoundEventForScenario } from '../data/events';

function main() {
  console.log('--- Wilds V2 Engine Test ---\n');

  // Validation
  const recipeErrors = validateRecipes();
  const specialCardErrors = validateSpecialCards();
  const scenarioErrors = validateScenarios();
  const configErrors = validateConfig();
  if (recipeErrors.length || specialCardErrors.length || scenarioErrors.length || configErrors.length) {
    console.error('Data validation errors:', [...recipeErrors, ...specialCardErrors, ...scenarioErrors, ...configErrors]);
    throw new Error('Data validation failed');
  }
  console.log('Data validation: OK');

  const volcanic = scenarios.find((s) => s.id === 'volcanic')!;
  const liveProfiles = [
    profiles.find((p) => p.id === 'builder')!,
    profiles.find((p) => p.id === 'provider')!,
    profiles.find((p) => p.id === 'trapper')!,
    profiles.find((p) => p.id === 'scout')!,
    profiles.find((p) => p.id === 'builder')!,
  ];

  // Single game test
  const state0 = createNewGame({
    playerCount: 5,
    scenario: volcanic,
    profiles: liveProfiles,
    aiStrategies: ['balanced', 'balanced', 'balanced', 'balanced', 'balanced'],
    rngSeed: 42,
  });

  console.log(`\nGame: ${state0.gameId} | Scenario: ${state0.scenario.name} | Threshold: ${state0.groupRescueThreshold}`);

  let state = state0;
  let limit = 0;
  while (!state.gameOver && limit < state.simulationCeiling + 2) {
    state = runFullRound(state);
    limit++;
  }

  console.log(`\n=== GAME OVER — Round ${state.round} ===`);
  console.log(`End condition: ${state.endCondition ?? 'none'} | Group rescue: ${state.groupRescueTrack}/${state.groupRescueThreshold} | Winner: ${state.winner ?? 'none'}`);
  for (const p of state.players) {
    console.log(`  ${p.name}: score=${scorePlayer(p, state)} rescue=${p.rescueScore} vitality=${p.vitality} collapsed=${p.collapsed}`);
  }
  console.log(`Events by family: ${JSON.stringify(collectEventFamilyCounts(state), null, 2)}`);
  console.log(`Maintenance failures: ${state.log.filter((entry) => entry.action === 'maintenance').length}`);
  console.log(`Special card awards: ${JSON.stringify(collectAwardCounts(state), null, 2)}`);

  // Batch sim test
  console.log('\n--- Batch Simulation (50 runs, Forest, 5-seat live baseline) ---');
  const forest = scenarios.find((s) => s.id === 'forest')!;
  const batch = runBatchSimulation({
    playerCount: 5,
    scenario: forest,
    profiles: liveProfiles,
    aiStrategies: ['balanced', 'balanced', 'balanced', 'balanced', 'balanced'],
    rngSeed: 1,
  }, 50);

  console.log(`Runs: ${batch.count} | Scenario: ${batch.scenario}`);
  console.log(`Avg score: ${batch.avgScore.toFixed(2)} | Avg rescue: ${batch.avgRescue.toFixed(2)} | Avg vitality: ${batch.avgVitality.toFixed(2)}`);
  console.log(`Survival: ${batch.survivalPercent}% | Collapse: ${batch.collapsePercent}% | Rescue reached: ${batch.rescueReachedPercent}%`);
  console.log(`All collapsed: ${batch.allCollapsedPercent}% | Ceiling hit: ${batch.simulationCeilingPercent}%`);
  console.log(`Avg rounds: ${batch.avgRoundsPlayed.toFixed(1)}`);
  console.log(`Check failures: ${JSON.stringify(batch.checkFailureFrequency)}`);
  console.log(`Event families: ${JSON.stringify(batch.eventFrequencyByFamily)}`);
  console.log(`Maintenance: failures=${batch.maintenanceFailureCount} downtime=${batch.maintenanceDowntimeCount}`);
  console.log(`Special card awards: ${JSON.stringify(batch.specialCardGrantFrequency)}`);
  console.log(`Tier 2 recipe usage: ${JSON.stringify(batch.tier2RecipeUsageFrequency)}`);
  console.log('By profile:', JSON.stringify(batch.byProfile, null, 2));
  console.log('Recipe freq:', batch.recipeUsageFrequency);
  console.log('Collapse timing:', batch.collapseTimingDistribution);
}

main();

function collectEventFamilyCounts(state: ReturnType<typeof createNewGame> & { log: { action: string; detail: string }[] }) {
  const counts = {
    opportunity: 0,
    escalation: 0,
    neutral: 0,
  };
  for (let round = 1; round <= state.round; round += 1) {
    const event = getRoundEventForScenario(state.scenario, round, state.rngSeed);
    if (!event) continue;
    counts[event.family] += 1;
  }
  return counts;
}

function collectAwardCounts(state: ReturnType<typeof createNewGame> & { players: { specialCards: { id: string; source: string }[] }[] }) {
  const counts: Record<string, number> = {};
  for (const player of state.players) {
    for (const card of player.specialCards) {
      if (card.source !== 'earned') continue;
      counts[card.id] = (counts[card.id] ?? 0) + 1;
    }
  }
  return counts;
}
