import type { BalanceConfig } from '../types';

export const config: BalanceConfig = {
  startingVitality: 10,
  simulationCeiling: 12,
  materialsPrivateDrawPerRound: 1,
  marketCapSize: 6,
  thirstDamageScale: 0.85,
  hungerMissesPerDamage: 3,
  tier2UnlockCondition: 'hasShelterOrHearth',
  pressureSchedule: [1, 1, 1, 1, 2, 2, 2, 3, 4, 4, 4, 4],
  rescueThresholds: {
    solo: 5,
    '2': 7,
    '3': 11,
    '4': 15,
    '5': 19,
  },
  scoring: {
    rescueMultiplier: 1.5,
    healthyVitalityThreshold: 5,
    healthyVitalityBonus: 4,
    persistentBuildBonus: 2,
  },
  aiWeights: {
    shelterPriority: 10,
    firePriority: 9,
    snarePriority: 8,
    signalPlatformPriority: 5,
    beaconPriority: 10,
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
