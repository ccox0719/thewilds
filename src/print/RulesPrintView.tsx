import { config } from '../data/config';
import { profiles } from '../data/profiles';
import { recipes } from '../data/recipes';
import { scenarios } from '../data/scenarios';
import { specialCards } from '../data/specialCards';
import { roundEvents } from '../data/events';
import { getTagTooltip } from '../data/tagInfo';
import type { Tag } from '../types';
import { chunk } from './printUtils';
import { PrintPage } from './PrintFrame';
import { formatEventDuration, formatPressureSchedule, formatRescueThresholds, formatWeatherCategory, summarizeSpecialCardEffects } from './printFacts';

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
        'Finish with the highest score. You score by staying alive, building persistent camp cards, and pushing the rescue track forward.',
        'The shared rescue track can end the game early. If it fills up during the round, finish that round sequence, then stop before the next round begins. The highest-scoring surviving player wins.',
      ],
    },
    {
      title: 'Setup',
      bullets: [
        'Choose one scenario.',
        'Choose a profile for each seat.',
        `Each player starts with ${config.startingVitality} Vitality, an empty inventory, one starting specialty card, and their profile perk ready to use.`,
        `Shuffle the scenario bag, fill the market to ${config.marketCapSize} materials, and place the rescue track in the middle of the table.`,
        `Each active player gets ${config.materialsPrivateDrawPerRound} private bag draw during the draft phase.`,
        'The standard print setup uses five seats.',
      ],
    },
    {
      title: 'Round Overview',
      bullets: [
        'Start of round: reveal 1 weather card and reset temporary round status.',
        'Draft phase: refresh the market, take materials from the shared market, and receive one hidden draw from the bag.',
        'Income: built engines produce their income.',
        'Maintenance: pay upkeep for advanced builds that require it.',
        'Craft phase: each seat may craft one recipe or pass.',
        'Survival phase: resolve hunger, thirst, and warmth.',
        'End of round: check rescue and collapse, then move to the next round.',
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
        'Pay the live cost after any discounts from built cards, specialty cards, or round events.',
        'Tier 2 recipes are locked until you have Shelter or HearthActive.',
        'A recipe may require tags or earlier builds before you can craft it.',
        'One-time recipes resolve once and are then used up.',
        'Persistent recipes stay in play and may give income, rescue, tags, or other ongoing benefits.',
        'Some recipes convert raw materials into refined goods such as Rations, Clean Water, Fuel, or Cordage.',
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
        `Hunger: spend 1 Food or 1 Ration. If you have neither, you add hunger debt. Every ${config.hungerMissesPerDamage} hunger misses deal 1 Vitality damage.`,
        `Thirst: spend 1 Water or 1 Clean Water. If you have neither, you take Vitality damage based on the current pressure schedule (${formatPressureSchedule()}).`,
        'Warmth: positive pressure is cold and negative pressure is heat. Shelter, fire, and specialty cards stop or reduce damage depending on the direction of the pressure.',
        'If you pass all three survival checks, you regain 1 Vitality at the end of the round.',
        'Cold pressure comes from the scenario and any event temperature shift. Heat pressure only happens when the combined value goes below zero.',
      ],
    },
    {
      title: 'How Rescue Ends the Game',
      bullets: [
        'Any Rescue you gain also advances the shared rescue track.',
        'When the shared rescue track reaches the rescue threshold, finish the current round sequence, then stop before the next round begins.',
        `The rescue threshold depends on player count and scenario: ${formatRescueThresholds()}.`,
      ],
    },
    {
      title: 'Collapse Rules',
      bullets: [
        'If your Vitality reaches 0 or less, you collapse.',
        'Collapsed players stop taking turns and cannot win.',
        'If every player collapses, the game ends with no winner.',
      ],
    },
    {
      title: 'Scoring',
      bullets: [
        `Rescue score is worth ${config.scoring.rescueMultiplier} points per rescue.`,
        'Your remaining Vitality counts as points if you are still standing.',
        `Each persistent build is worth ${config.scoring.persistentBuildBonus} points.`,
        `If you end the game at ${config.scoring.healthyVitalityThreshold} Vitality or more and are not collapsed, you gain a ${config.scoring.healthyVitalityBonus}-point healthy finish bonus.`,
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
              <li>Craft one recipe on each seat’s turn.</li>
              <li>Resolve hunger, thirst, and warmth.</li>
              <li>Check rescue and collapse.</li>
            </ol>
          </section>
          <section className="print-reference-block">
            <h2>Survival Reminder</h2>
            <ul>
              <li>Hunger uses Food or Rations.</li>
              <li>Thirst uses Water or Clean Water.</li>
              <li>Warmth uses Shelter, HearthActive, Sustained Fire, or specialty reductions depending on cold or heat.</li>
              <li>Passing all three checks restores 1 Vitality.</li>
            </ul>
          </section>
          <section className="print-reference-block">
            <h2>Common Tags</h2>
            <ul>
              {COMMON_TAGS.map((tag) => (
                <li key={tag}>
                  <span className="bold">{tag}</span>: {getTagTooltip(tag)}
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
                  <div>{profile.perk.description}</div>
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
                  <div>{scenario.description}</div>
                  <div className="print-rules-small">
                    Temperature pressure: {scenario.temperaturePressure > 0 ? `cold ${scenario.temperaturePressure}` : scenario.temperaturePressure < 0 ? `heat ${Math.abs(scenario.temperaturePressure)}` : 'neutral'}
                    {' · '}
                    Rescue adjustment: {scenario.rescueThresholdAdjust ?? 0}
                  </div>
                  <div className="print-rules-small">
                    Bag: {Object.entries(scenario.bagComposition).map(([material, count]) => `${count} ${material}`).join(', ')}
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
                  <div className="bold">{card.name}</div>
                  <div>{summarizeSpecialCardEffects(card).join('. ')}</div>
                  <div className="print-rules-small">{card.source === 'starting' ? 'Starting specialty card' : 'Earned when you build the matching advanced card'}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="print-reference-block">
            <h2>Recipe Families</h2>
            <div className="print-rules-list">
              {Object.entries(countRecipesByFamily()).map(([family, count]) => (
                <div key={family} className="print-rules-item">
                  <div className="bold">{family.replace('-', ' ')}</div>
                  <div>{count} recipes</div>
                </div>
              ))}
            </div>
          </section>

          <section className="print-reference-block">
            <h2>Weather Cards</h2>
            <div className="print-rules-list">
              {WEATHER_CARDS.map((event) => (
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
const WEATHER_CARDS = roundEvents;
