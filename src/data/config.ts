import type { BalanceConfig } from '../types';

export const config: BalanceConfig = {
  startingVitality: 9,
  simulationCeiling: 12,
  materialsPrivateDrawPerRound: 2,
  marketCapSize: 7,
  hungerMissesPerDamage: 3,
  tier2UnlockCondition: 'hasShelterOrHearth',
  pressureSchedule: [1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4],
  rescueThresholds: {
    solo: 12,
    '2': 18,
    '3': 28,
    '4': 40,
    '5': 52,
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
