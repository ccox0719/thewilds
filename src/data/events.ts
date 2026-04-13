import type { RoundEventDefinition, RoundEventInstance, Scenario, SurvivalCheck } from '../types';
import { createRNG } from '../utils/rng';

export const roundEvents: RoundEventDefinition[] = [
  {
    id: 'forest-abundant-forage',
    name: 'Abundant Forage',
    family: 'opportunity',
    description: 'Fresh sign and easy forage soften hunger pressure for the round.',
    scenarioIds: ['forest', 'river-delta'],
    startRound: 1,
    endRound: 5,
    pressureBonus: { hunger: -1 },
  },
  {
    id: 'forest-clear-skies',
    name: 'Clear Skies',
    family: 'neutral',
    description: 'Dry, clear weather makes rescue signaling more effective.',
    scenarioIds: ['forest', 'river-delta', 'rocky-highlands', 'desert'],
    startRound: 1,
    endRound: 12,
    temperatureShift: -1,
    signalRescueBonus: 1,
  },
  {
    id: 'rocky-highlands-exposed-ridge',
    name: 'Exposed Ridge',
    family: 'opportunity',
    description: 'High ridges make signaling easier, but the wind bites harder.',
    scenarioIds: ['rocky-highlands'],
    startRound: 1,
    endRound: 12,
    temperatureShift: 1,
    pressureBonus: { warmth: 1 },
    signalRescueBonus: 2,
    recipeFamilyCostDelta: { 'signal-rescue': -1 },
  },
  {
    id: 'forest-windy-night',
    name: 'Windy Night',
    family: 'escalation',
    description: 'Wind cuts through camp cover but makes signals carry farther.',
    scenarioIds: ['forest', 'rocky-highlands'],
    startRound: 4,
    endRound: 12,
    temperatureShift: 1,
    pressureBonus: { warmth: 1 },
    signalRescueBonus: 2,
  },
  {
    id: 'forest-heavy-rain',
    name: 'Heavy Rain',
    family: 'escalation',
    description: 'Rain soaks the camp, making shelter matter more and signaling harder.',
    scenarioIds: ['forest', 'river-delta'],
    startRound: 5,
    endRound: 12,
    temperatureShift: 1,
    pressureBonus: { thirst: -1, warmth: 1 },
    signalRescueBonus: -1,
  },
  {
    id: 'forest-cold-front',
    name: 'Cold Front',
    family: 'escalation',
    description: 'A cold snap pushes exposed players harder.',
    scenarioIds: ['forest', 'rocky-highlands'],
    startRound: 8,
    endRound: 12,
    temperatureShift: 2,
    pressureBonus: { warmth: 2 },
  },
  {
    id: 'rocky-highlands-landslide',
    name: 'Landslide',
    family: 'escalation',
    description: 'Shifting stone and loose ground slow camp development.',
    scenarioIds: ['rocky-highlands'],
    startRound: 5,
    endRound: 12,
    pressureBonus: { hunger: 1 },
    recipeFamilyCostDelta: { processing: 1, 'shelter-climate': 1 },
  },
  {
    id: 'rocky-highlands-thin-air',
    name: 'Thin Air',
    family: 'neutral',
    description: 'The camp must work harder to stay steady at elevation.',
    scenarioIds: ['rocky-highlands'],
    startRound: 3,
    endRound: 12,
    pressureBonus: { thirst: 1 },
  },
  {
    id: 'desert-heat-wave',
    name: 'Heat Wave',
    family: 'escalation',
    description: 'The heat deepens and water pressure rises.',
    scenarioIds: ['desert', 'volcanic'],
    startRound: 1,
    endRound: 12,
    temperatureShift: -1,
    pressureBonus: { thirst: 1 },
  },
  {
    id: 'desert-dust-storm',
    name: 'Dust Storm',
    family: 'escalation',
    description: 'A dust storm hammers visibility and makes rescue signaling harder.',
    scenarioIds: ['desert', 'volcanic'],
    startRound: 4,
    endRound: 12,
    temperatureShift: -1,
    pressureBonus: { warmth: 1 },
    signalRescueBonus: -1,
  },
  {
    id: 'volcanic-ashfall',
    name: 'Ash Fall',
    family: 'escalation',
    description: 'Ash blankets the camp and taxes every rescue and shelter effort.',
    scenarioIds: ['volcanic'],
    startRound: 3,
    endRound: 12,
    pressureBonus: { hunger: 1, thirst: 1 },
    signalRescueBonus: -2,
    recipeFamilyCostDelta: { 'signal-rescue': 2, 'shelter-climate': 1 },
  },
  {
    id: 'volcanic-thermal-burst',
    name: 'Thermal Burst',
    family: 'opportunity',
    description: 'A sudden warm draft cuts exposure for a round, but only if the camp is already prepared.',
    scenarioIds: ['volcanic'],
    startRound: 1,
    endRound: 12,
    temperatureShift: -1,
    signalRescueBonus: 1,
  },
  {
    id: 'volcanic-seismic-shift',
    name: 'Seismic Shift',
    family: 'escalation',
    description: 'The ground shifts under weak infrastructure and slows advanced camp work.',
    scenarioIds: ['volcanic'],
    startRound: 6,
    endRound: 12,
    pressureBonus: { warmth: 1 },
    recipeFamilyCostDelta: { processing: 1, 'signal-rescue': 1 },
  },
  {
    id: 'delta-clear-skies',
    name: 'Clear Skies',
    family: 'neutral',
    description: 'Stable weather gives a clean chance to push rescue.',
    scenarioIds: ['river-delta'],
    startRound: 1,
    endRound: 12,
    signalRescueBonus: 2,
  },
  {
    id: 'delta-heavy-rain',
    name: 'Heavy Rain',
    family: 'opportunity',
    description: 'Rain helps water stability but pushes warmth and rescue down a bit.',
    scenarioIds: ['river-delta'],
    startRound: 3,
    endRound: 12,
    temperatureShift: 1,
    pressureBonus: { warmth: 1, thirst: -1 },
    signalRescueBonus: -1,
  },
  {
    id: 'delta-abundant-forage',
    name: 'Abundant Forage',
    family: 'opportunity',
    description: 'The wetlands provide an easier food turn.',
    scenarioIds: ['river-delta'],
    startRound: 1,
    endRound: 6,
    pressureBonus: { hunger: -1 },
  },
  {
    id: 'river-delta-flood-tide',
    name: 'Flood Tide',
    family: 'escalation',
    description: 'Water stays plentiful, but the camp must keep its footing.',
    scenarioIds: ['river-delta'],
    startRound: 6,
    endRound: 12,
    pressureBonus: { warmth: 1 },
    signalRescueBonus: -1,
  },
];

export function getRoundEventForScenario(scenario: Scenario, round: number, seed: number): RoundEventInstance | null {
  const candidates = roundEvents.filter((event) => {
    if (!event.scenarioIds.includes(scenario.id)) return false;
    if (event.startRound !== undefined && round < event.startRound) return false;
    if (event.endRound !== undefined && round > event.endRound) return false;
    return true;
  });
  if (candidates.length === 0) return null;

  const rng = createRNG(seed + round * 1009 + scenario.id.length * 97);
  const weights = candidates.map((event) => {
    let weight = event.family === 'escalation' ? 3 : event.family === 'opportunity' ? 2 : 1;
    if (event.id.includes('clear-skies')) weight += 1;
    if (event.id.includes('cold-front') || event.id.includes('heat-wave')) weight += Math.max(0, round - 6) * 0.25;
    if (event.id.includes('abundant-forage')) weight += Math.max(0, 6 - round) * 0.35;
    if (scenario.id === 'rocky-highlands' && event.id.startsWith('rocky-highlands')) weight += 2;
    if (scenario.id === 'volcanic' && event.id.startsWith('volcanic')) weight += 2;
    if (scenario.id === 'river-delta' && event.id.startsWith('river-delta')) weight += 2;
    return weight;
  });
  const total = weights.reduce((sum, value) => sum + value, 0);
  let pick = rng.next() * total;
  for (let i = 0; i < candidates.length; i += 1) {
    pick -= weights[i];
    if (pick <= 0) {
      return { ...candidates[i], round };
    }
  }
  return { ...candidates[candidates.length - 1], round };
}

export function getEventPressureBonus(event: RoundEventInstance | null, check: SurvivalCheck): number {
  return event?.pressureBonus?.[check] ?? 0;
}

export function getEventSignalBonus(event: RoundEventInstance | null): number {
  return event?.signalRescueBonus ?? 0;
}

export function getEventTemperatureShift(event: RoundEventInstance | null): number {
  return event?.temperatureShift ?? 0;
}

export function getEventRecipeCostDelta(
  event: RoundEventInstance | null,
  recipe: { family: string },
): { amount: number; material?: import('../types').MaterialType }[] {
  if (!event?.recipeFamilyCostDelta) return [];
  const delta = event.recipeFamilyCostDelta[recipe.family as keyof typeof event.recipeFamilyCostDelta];
  if (!delta || delta === 0) return [];
  return [{ amount: delta }];
}

export function describeEvent(event: RoundEventInstance | null): string {
  if (!event) return 'No event';
  return event.description;
}
