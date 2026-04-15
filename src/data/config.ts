import type { BalanceConfig } from '../types';

export const config: BalanceConfig = {
  startingVitality: 9,
  simulationCeiling: 12,
  materialsPrivateDrawPerRound: 1,
  marketCapSize: 7,
  hungerMissesPerDamage: 3,
  tier2UnlockCondition: 'hasShelterOrHearth',
  pressureSchedule: [1, 1, 1, 1, 2, 2, 3, 3, 4, 4, 4, 4],
  rescueThresholds: {
    solo: 7,
    '2': 9,
    '3': 13,
    '4': 17,
    '5': 21,
  },
  scoring: {
    rescueMultiplier: 2,
    healthyVitalityThreshold: 5,
    healthyVitalityBonus: 4,
    persistentBuildBonus: 2,
  },
  aiWeights: {
    shelterPriority: 10,
    firePriority: 12,
    snarePriority: 8,
    signalPlatformPriority: 7,
    beaconPriority: 15,
    stabilizePriority: 6,
    lateSignalPriority: 10,
    vitalityPriority: 8,
  },
  perks: {
    builderEnabled: true,
    providerEnabled: true,
    trapperEnabled: true,
    scoutEnabled: true,
  },
};
