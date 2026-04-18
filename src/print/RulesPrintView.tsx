import { config } from '../data/config';
import { getMaterialGlyph, getMeterGlyph, getRecipeFamilyGlyph, getRecipeTypeGlyph, getTagGlyph } from '../data/iconography';
import { profiles } from '../data/profiles';
import { recipes } from '../data/recipes';
import { scenarios } from '../data/scenarios';
import { specialCards } from '../data/specialCards';
import { roundEvents } from '../data/events';
import { getTagTooltip } from '../data/tagInfo';
import type { RecipeFamily, Tag } from '../types';
import { chunk } from './printUtils';
import { PrintPage } from './PrintFrame';
import { formatEventDuration, formatRescueThresholds, formatWeatherCategory, summarizeSpecialCardEffects } from './printFacts';

type LearnSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export function RulesPrintView() {
  const learnToPlay: LearnSection[] = [
    {
      title: 'Game Objective',
      paragraphs: [
        `Finish with the highest score. Score comes from staying alive, building persistent camp cards, and pushing ${getMeterGlyph('rescue')} Rescue forward.`,
        `The shared ${getMeterGlyph('rescue')} Rescue track can end the game early. If it fills up during the round, finish that round sequence, then stop before the next round begins.`,
      ],
    },
    {
      title: 'Setup',
      bullets: [
        'Choose one scenario.',
        'Choose a profile for each seat.',
        `Each player starts with ${getMeterGlyph('vitality')} ${config.startingVitality} Vitality, empty inventory, 1 starting specialty card, and their profile perk ready.`,
        `Shuffle the scenario bag, fill the market to ${config.marketCapSize} materials, and place the ${getMeterGlyph('rescue')} Rescue track in the middle of the table.`,
        `Each active player gets ${config.materialsPrivateDrawPerRound} private bag draw during the draft phase.`,
        'The standard print setup uses five seats.',
      ],
    },
    {
      title: 'Round Overview',
      bullets: [
        'Start of round: reveal 1 weather card and reset temporary round status.',
        'Draft phase: refresh the market, take materials from the shared market, and receive 1 hidden draw.',
        'Income: built engines produce their income.',
        'Maintenance: pay upkeep for advanced builds that require it.',
        'Craft phase: each seat may craft 1 recipe or pass.',
        `Survival phase: resolve ${getMeterGlyph('hunger')} hunger, ${getMeterGlyph('thirst')} thirst, and ${getMeterGlyph('warmth')} warmth.`,
        `End of round: check ${getMeterGlyph('rescue')} rescue and collapse, then move on.`,
      ],
    },
    {
      title: 'How Drafting Works',
      bullets: [
        'On your draft turn, choose one material from the market or pass.',
        'The market is shared. Once a material is taken, it is gone until the market is refilled.',
        'Each active player also receives one hidden draw during the draft phase.',
        'If the market is empty, you may only pass.',
      ],
    },
    {
      title: 'How Crafting Works',
      bullets: [
        'On your craft turn, choose one recipe you can afford or pass.',
        'Pay the live cost after discounts from built cards, specialty cards, or round events.',
        `Tier 2 recipes are locked until you have ${getTagGlyph('Shelter')} Shelter or ${getTagGlyph('HearthActive')} HearthActive.`,
        'Tier 3 recipes are late-game builds that usually require earlier structures before they appear.',
        'A recipe may require tags or earlier builds before you can craft it.',
        `${getRecipeTypeGlyph('oneTime')} One-time recipes resolve once and are then used up.`,
        `${getRecipeTypeGlyph('persistent')} Persistent recipes stay in play and may give income, rescue, tags, or other ongoing benefits.`,
        `Some recipes convert raw materials into refined goods such as ${getMaterialGlyph('Rations')} Rations, ${getMaterialGlyph('CleanWater')} Treated Water, ${getMaterialGlyph('Fuel')} Fuel, or ${getMaterialGlyph('Cordage')} Cordage.`,
        `Water is unsafe by default: unused raw ${getMaterialGlyph('Water')} Water spoils at the end of the round, while treated ${getMaterialGlyph('CleanWater')} Treated Water can be stockpiled.`,
      ],
    },
    {
      title: 'How Income and Maintenance Work',
      bullets: [
        'After the draft phase, your built engines produce their income.',
        'After income, pay upkeep for any built card that has a maintenance cost due that round.',
        'If you cannot pay upkeep, that build goes offline for the round.',
        'Offline builds stay built, but they do not function until upkeep is paid again.',
      ],
    },
    {
      title: 'How Survival Checks Work',
      bullets: [
        `Hunger: spend 1 ${getMaterialGlyph('Food')} Food or 1 ${getMaterialGlyph('Rations')} Ration. If you have neither, you add hunger debt. Every ${config.hungerMissesPerDamage} misses deal 1 ${getMeterGlyph('vitality')} damage.`,
        `Thirst: spend 1 ${getMaterialGlyph('CleanWater')} Treated Water to avoid damage. Raw ${getMaterialGlyph('Water')} Water still works for the round, but it spoils if unused. If you have neither, take 1 ${getMeterGlyph('vitality')} damage; hot conditions and some events can add 1 more.`,
        `${getMeterGlyph('warmth')} Warmth: positive pressure is cold and negative pressure is heat. Shelter, fire, and specialty cards stop or reduce damage depending on pressure direction.`,
        `If you pass all three survival checks, you regain 1 ${getMeterGlyph('vitality')} at the end of the round.`,
        'Cold pressure comes from the scenario and any event temperature shift. Heat pressure only happens when the combined value goes below zero.',
      ],
    },
    {
      title: 'How Rescue Ends the Game',
      bullets: [
        `Any ${getMeterGlyph('rescue')} Rescue you gain also advances the shared rescue track.`,
        `When the shared ${getMeterGlyph('rescue')} track reaches the rescue threshold, finish the current round sequence, then stop before the next round begins.`,
        `The rescue threshold depends on player count and scenario: ${formatRescueThresholds()}.`,
      ],
    },
    {
      title: 'Collapse Rules',
      bullets: [
        `If your ${getMeterGlyph('vitality')} Vitality reaches 0 or less, you collapse.`,
        'Collapsed players stop taking turns and cannot win.',
        'If every player collapses, the game ends with no winner.',
      ],
    },
    {
      title: 'Scoring',
      bullets: [
        `Crafting scores small tier points: T1 ${config.scoring.craftPointsByTier[1]}, T2 ${config.scoring.craftPointsByTier[2]}, T3 ${config.scoring.craftPointsByTier[3]}.`,
        `Immediate-use recipes can score ${config.scoring.usePointsPerImmediateEffect} point each, up to ${config.scoring.usePointsCap}.`,
        `${getMeterGlyph('rescue')} Rescue scores 1 point per ${config.scoring.rescuePointsStep}, capped at ${config.scoring.rescuePointsCap}.`,
        `${getMeterGlyph('vitality')} Survival scores 1 point per ${config.scoring.survivalPointsStep} Vitality, with a ${config.scoring.healthyVitalityBonus}-point stable finish bonus at ${config.scoring.healthyVitalityThreshold}+.`,
        `Each persistent build scores ${config.scoring.persistentBuildBonus} point, capped at ${config.scoring.persistentBuildCap}.`,
        'Your final score cannot go below 0.',
      ],
    },
    {
      title: 'Tie Breaker',
      bullets: [
        'If scores tie, the surviving player earlier in seat order wins.',
        'If all tied players have collapsed, there is no winner.',
      ],
    },
  ];

  const pages = chunk(learnToPlay, 4);

  return (
    <div className="print-stack">
      {pages.map((sections, pageIndex) => (
        <PrintPage
          key={`learn-${pageIndex}`}
          title="Learn to Play"
          subtitle="First-time player rules"
          footer={`Page ${pageIndex + 1} of ${pages.length + 2}`}
        >
          <div className="print-rules-grid">
            {sections.map((section) => (
              <section key={section.title} className="print-reference-block">
                <h2>{section.title}</h2>
                {section.paragraphs && section.paragraphs.map((p) => <p key={p}>{p}</p>)}
                {section.bullets && (
                  <ul>
                    {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </PrintPage>
      ))}

      <PrintPage title="Quick Reference" subtitle="Round sequence, survival, and scoring" footer={`Page ${pages.length + 1} of ${pages.length + 2}`}>
        <div className="print-rules-grid">
          <section className="print-reference-block">
            <h2>Round Sequence</h2>
            <ol>
              <li>Reveal the event.</li>
              <li>Refill the market and draft materials.</li>
              <li>Gain engine income.</li>
              <li>Pay upkeep.</li>
              <li>Craft one recipe on each seat's turn.</li>
              <li>Resolve hunger, thirst, and warmth.</li>
              <li>Check rescue and collapse.</li>
            </ol>
          </section>
          <section className="print-reference-block">
            <h2>Survival Reminder</h2>
            <ul>
              <li>{getMeterGlyph('hunger')} Hunger uses Food or Rations.</li>
              <li>{getMeterGlyph('thirst')} Thirst uses Treated Water or raw Water. Raw Water is same-round only and spoils if unused; no water costs 1 Vitality.</li>
              <li>{getMeterGlyph('warmth')} Warmth uses Shelter, HearthActive, Sustained Fire, or specialty reductions depending on cold or heat.</li>
              <li>{getMeterGlyph('vitality')} Passing all three checks restores 1 Vitality.</li>
            </ul>
          </section>
          <section className="print-reference-block">
            <h2>Common Tags</h2>
            <ul>
              {COMMON_TAGS.map((tag) => (
                <li key={tag}>
                  <span className="bold">{getTagGlyph(tag)} {tag}</span>: {getTagTooltip(tag)}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </PrintPage>

      <PrintPage title="Appendix" subtitle="Profiles, scenarios, specialty cards, and glossary" footer={`Page ${pages.length + 2} of ${pages.length + 2}`}>
        <div className="print-rules-split">
          <section className="print-reference-block">
            <h2>Profiles</h2>
            <div className="print-rules-list">
              {profiles.map((profile) => (
                <div key={profile.id} className="print-rules-item">
                  <div className="bold">{profile.name}</div>
                  <div className="print-rules-small">{formatProfileBadge(profile.perk.triggerCondition)} {profile.perk.description}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="print-reference-block">
            <h2>Scenarios</h2>
            <div className="print-rules-list">
              {scenarios.map((scenario) => (
                <div key={scenario.id} className="print-rules-item">
                  <div className="bold">{scenario.name}</div>
                  <div className="print-rules-small">{scenario.description}</div>
                  <div className="print-rules-small">
                    {getMeterGlyph('warmth')} Pressure: {scenario.temperaturePressure > 0 ? `cold ${scenario.temperaturePressure}` : scenario.temperaturePressure < 0 ? `heat ${Math.abs(scenario.temperaturePressure)}` : 'neutral'}
                    {' · '}
                    {getMeterGlyph('rescue')} Adjustment: {scenario.rescueThresholdAdjust ?? 0}
                  </div>
                  <div className="print-rules-small">
                    Bag: {Object.entries(scenario.bagComposition).map(([material, count]) => `${count} ${material}`).join(' · ')}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="print-reference-block">
            <h2>Specialty Cards</h2>
            <div className="print-rules-list">
              {specialCards.map((card) => (
                <div key={card.id} className="print-rules-item">
                  <div className="bold">{getRecipeFamilyGlyph(card.family)} {card.name}</div>
                  <div>{summarizeSpecialCardEffects(card).join(' · ')}</div>
                  <div className="print-rules-small">
                    {card.source === 'starting'
                      ? `${getRecipeTypeGlyph('oneTime')} Starting specialty card`
                      : `${getRecipeTypeGlyph('persistentEngine')} Earned when you build the matching advanced card`}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="print-reference-block">
            <h2>Recipe Families</h2>
            <div className="print-rules-list">
              {Object.entries(countRecipesByFamily()).map(([family, count]) => (
                <div key={family} className="print-rules-item">
                  <div className="bold">{getRecipeFamilyGlyph(family as RecipeFamily)} {family.replace('-', ' ')}</div>
                  <div>{count} recipes</div>
                </div>
              ))}
            </div>
          </section>

          <section className="print-reference-block">
            <h2>Weather Cards</h2>
            <div className="print-rules-list">
              {roundEvents.map((event) => (
                <div key={event.id} className="print-rules-item">
                  <div className="bold">{event.name}</div>
                  <div>{formatWeatherCategory(event.family)} · {formatEventDuration()} · {event.description}</div>
                  <div className="print-rules-small">{event.scenarioIds.join(', ')}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="print-reference-block">
            <h2>Weather Categories</h2>
            <div className="print-rules-list">
              {Object.entries(countWeatherByFamily()).map(([family, count]) => (
                <div key={family} className="print-rules-item">
                  <div className="bold">{family}</div>
                  <div>{count} events</div>
                </div>
              ))}
            </div>
          </section>

          <section className="print-reference-block">
            <h2>Glossary</h2>
            <div className="print-rules-list">
              {GLOSSARY.map((entry) => (
                <div key={entry.term} className="print-rules-item">
                  <div className="bold">{entry.term}</div>
                  <div>{entry.text}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </PrintPage>
    </div>
  );
}

function countRecipesByFamily(): Record<string, number> {
  return recipes.reduce<Record<string, number>>((acc, recipe) => {
    acc[recipe.family] = (acc[recipe.family] ?? 0) + 1;
    return acc;
  }, {});
}

function countWeatherByFamily(): Record<string, number> {
  return roundEvents.reduce<Record<string, number>>((acc, event) => {
    const label = formatWeatherCategory(event.family);
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});
}

const GLOSSARY = [
  { term: 'Shelter', text: getTagTooltip('Shelter') },
  { term: 'SturdyShelter', text: getTagTooltip('SturdyShelter') },
  { term: 'HearthActive', text: getTagTooltip('HearthActive') },
  { term: 'SustainedFire', text: getTagTooltip('SustainedFire') },
  { term: 'FoodSource', text: getTagTooltip('FoodSource') },
  { term: 'Tool', text: getTagTooltip('Tool') },
  { term: 'SignalEngine', text: getTagTooltip('SignalEngine') },
];

const COMMON_TAGS: Tag[] = ['Shelter', 'SturdyShelter', 'HearthActive', 'SustainedFire', 'FoodSource', 'Tool', 'SignalEngine'];

function formatProfileBadge(triggerCondition: string): string {
  if (triggerCondition.includes('oncePerGame')) return '⟲ Once / game';
  if (triggerCondition.startsWith('onBuild:snare')) return '🍖 On Snare';
  if (triggerCondition.startsWith('onBuild:simple-signal')) return '⚑ On Simple Signal';
  if (triggerCondition.startsWith('onSurvivalPressure')) return '♥ Survival trigger';
  return '✦ Profile perk';
}
