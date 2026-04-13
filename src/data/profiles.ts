import type { Profile } from '../types';
import { config } from './config';

export const profiles: Profile[] = [
  {
    id: 'builder',
    name: 'Builder',
    perk: {
      id: 'builder-perk',
      name: 'Builder',
      enabled: config.perks.builderEnabled,
      usedThisGame: false,
      description:
        'Once per game: Reduce one persistent recipe cost by 1 material of your choice.',
      triggerCondition: 'onCraft:persistent:oncePerGame',
    },
    designNotes:
      'Economy profile. Reduces cost on a key persistent build. Best used on Signal Platform or Sturdy Shelter.',
  },
  {
    id: 'provider',
    name: 'Provider',
    perk: {
      id: 'provider-perk',
      name: 'Provider',
      enabled: config.perks.providerEnabled,
      usedThisGame: false,
      description:
        'Once per game: when the first survival check fails at low Vitality, soften it and gain a supply buffer.',
      triggerCondition: 'onSurvivalPressure:oncePerGame:onFirstFailureLowVitality',
    },
    designNotes:
      'Emergency survival profile. Turns one bad survival round into a narrower recovery window.',
  },
  {
    id: 'trapper',
    name: 'Trapper',
    perk: {
      id: 'trapper-perk',
      name: 'Trapper',
      enabled: config.perks.trapperEnabled,
      usedThisGame: false,
      description:
        'When Snare is built, gain 1 Food immediately.',
      triggerCondition: 'onBuild:snare',
    },
    designNotes:
      'Food security profile. Immediate Food on Snare build helps it survive the opening pressure.',
  },
  {
    id: 'scout',
    name: 'Scout',
    perk: {
      id: 'scout-perk',
      name: 'Scout',
      enabled: config.perks.scoutEnabled,
      usedThisGame: false,
      description:
        'The first time Simple Signal is built, gain +1 rescue.',
      triggerCondition: 'onBuild:simple-signal:firstTime',
    },
    designNotes:
      'Signal acceleration profile. Small bonus on the first signal action that keeps the identity focused on rescue.',
  },
];

export function getProfileById(id: string): Profile | undefined {
  return profiles.find((p) => p.id === id);
}
