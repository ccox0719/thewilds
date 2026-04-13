import type { Scenario } from '../types';

export const scenarios: Scenario[] = [
  {
    id: 'forest',
    name: 'Forest',
    description: 'Dense woodland with abundant wood and fiber. The starting scenario.',
    bagComposition: { Wood: 6, Fiber: 5, Stone: 3, Food: 3, Water: 5, Fire: 1 },
    temperaturePressure: 1,
    rescueThresholdAdjust: 8,
  },
  {
    id: 'rocky-highlands',
    name: 'Rocky Highlands',
    description: 'Rugged terrain. Stone is plentiful but food is scarce.',
    bagComposition: { Stone: 5, Wood: 3, Fiber: 3, Food: 2, Water: 4, Fire: 1 },
    temperaturePressure: 1,
    rescueThresholdAdjust: 15,
  },
  {
    id: 'river-delta',
    name: 'River Delta',
    description: 'Wetlands with abundant water and food but limited stone.',
    bagComposition: { Water: 6, Food: 5, Fiber: 3, Wood: 3, Stone: 2, Fire: 1 },
    temperaturePressure: 0,
    rescueThresholdAdjust: 0,
  },
  {
    id: 'volcanic',
    name: 'Volcanic',
    description: 'Harsh volcanic landscape. Hot ground, scarce fuel, and very little room for recovery.',
    bagComposition: { Fire: 1, Stone: 3, Wood: 2, Fiber: 1, Food: 2, Water: 2 },
    temperaturePressure: 3,
    rescueThresholdAdjust: 18,
  },
  {
    id: 'desert',
    name: 'Desert',
    description: 'Hot, dry land where water is scarce and shelter is the difference between progress and collapse.',
    bagComposition: { Stone: 3, Fire: 1, Food: 4, Water: 4, Wood: 2, Fiber: 2 },
    temperaturePressure: -1,
    rescueThresholdAdjust: 15,
  },
];

export const defaultScenario = scenarios[0];
