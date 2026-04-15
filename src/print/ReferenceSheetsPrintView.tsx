import { config } from '../data/config';
import { getTagTooltip } from '../data/tagInfo';
import { PrintPage } from './PrintFrame';
import { formatPressureSchedule, formatRescueThresholds } from './printFacts';

export function ReferenceSheetsPrintView() {
  return (
    <div className="print-stack">
      <PrintPage
        title="Player Reference Sheet"
        subtitle="Setup, weather, and survival"
        footer="Page 1 of 3"
      >
        <div className="print-rules-grid">
          <section className="print-reference-block">
            <h2>Setup</h2>
            <ul>
              <li>Choose a scenario and one profile for each seat.</li>
              <li>Each player starts with {config.startingVitality} Vitality, an empty inventory, one starting specialty card, and their profile perk ready to use.</li>
              <li>Shuffle the scenario bag, fill the shared market to {config.marketCapSize} materials, and place the rescue track in the middle of the table.</li>
              <li>Each active player gets {config.materialsPrivateDrawPerRound} private bag draw during the draft phase.</li>
            </ul>
          </section>

          <section className="print-reference-block">
            <h2>Round Flow</h2>
            <ol>
              <li>Reveal 1 weather card for the round.</li>
              <li>Refill the market from the bag.</li>
              <li>Draft materials from the shared market and draw private materials.</li>
              <li>Resolve engine income.</li>
              <li>Pay maintenance on the rounds it is due.</li>
              <li>Craft one recipe per active seat, or pass.</li>
              <li>Resolve hunger, thirst, and warmth in that order.</li>
              <li>Check rescue and collapse, then advance only if no end condition was met.</li>
            </ol>
          </section>

          <section className="print-reference-block">
            <h2>Weather</h2>
            <ul>
              <li>Reveal 1 weather card at the start of each round.</li>
              <li>The weather card lasts that round only.</li>
              <li>Each card should show a name, one-line effect, and duration.</li>
              <li>Table categories: {WEATHER_CATEGORIES.join(', ')}.</li>
            </ul>
            <div className="print-rules-small" style={{ marginTop: 8 }}>
              Pressure cards raise survival pressure, Opportunity cards soften it or improve rescue, and Neutral cards are mostly informational.
            </div>
          </section>

          <section className="print-reference-block">
            <h2>Hunger Procedure</h2>
            <ol>
              <li>Check hunger at the end of the round.</li>
              <li>Spend 1 Food or 1 Ration to satisfy it.</li>
              <li>If you cannot pay, add 1 hunger debt, plus any event hunger bonus.</li>
              <li>Every {config.hungerMissesPerDamage} hunger misses deal 1 Vitality damage, then reduce hunger debt by that amount.</li>
            </ol>
          </section>

          <section className="print-reference-block">
            <h2>Thirst Procedure</h2>
            <ol>
              <li>Check thirst after hunger.</li>
              <li>Spend 1 Water or 1 Clean Water to satisfy it.</li>
              <li>If you cannot pay, take Vitality damage equal to the current pressure schedule plus any event thirst bonus.</li>
              <li>Thirst damage is never less than 1 when you are unprotected.</li>
            </ol>
            <div className="print-rules-small" style={{ marginTop: 8 }}>
              Pressure schedule: {formatPressureSchedule()}.
            </div>
          </section>

          <section className="print-reference-block">
            <h2>Warmth Procedure</h2>
            <ol>
              <li>Check warmth after thirst.</li>
              <li>Warmth pressure equals scenario temperature pressure plus any weather shift.</li>
              <li>Positive pressure is cold. Negative pressure is heat.</li>
              <li>Cold: Sturdy Shelter, HearthActive, or Sustained Fire fully stop damage; Shelter reduces it by 1; then apply any remaining warmth damage.</li>
              <li>Heat: Sturdy Shelter or Shelter fully stop damage; then apply any remaining warmth damage.</li>
            </ol>
          </section>

          <section className="print-reference-block">
            <h2>Vitality</h2>
            <ul>
              <li>If you pass all three checks, regain 1 Vitality at the end of the round.</li>
              <li>If you fail one or more checks, you lose the listed Vitality damage from those checks.</li>
              <li>If Vitality reaches 0 or less, you collapse immediately.</li>
            </ul>
          </section>
        </div>
      </PrintPage>

      <PrintPage
        title="Player Reference Sheet"
        subtitle="Rescue and collapse"
        footer="Page 2 of 3"
      >
        <div className="print-rules-grid">
          <section className="print-reference-block">
            <h2>Rescue</h2>
            <ul>
              <li>Whenever you gain Rescue, your personal rescue score and the shared rescue track both increase by that amount.</li>
              <li>Signal recipes can receive additional Rescue from SignalEngine and some weather cards.</li>
              <li>When the shared rescue track reaches the threshold, finish the current round sequence and then end the game before a new round begins.</li>
              <li>Thresholds by player count: {formatRescueThresholds()}.</li>
            </ul>
          </section>

          <section className="print-reference-block">
            <h2>Collapse Box</h2>
            <ul>
              <li>A player collapses as soon as Vitality is 0 or less.</li>
              <li>Collapsed players stop taking turns and cannot win.</li>
              <li>Collapsed players do not score Vitality.</li>
              <li>If every player collapses, the game ends with no winner.</li>
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

      <PrintPage
        title="Final Scoring Summary"
        subtitle="Use this to score the game at a glance"
        footer="Page 3 of 3"
      >
        <div className="print-rules-grid">
          <section className="print-reference-block">
            <h2>Score Formula</h2>
            <ul>
              <li>Rescue score is worth {config.scoring.rescueMultiplier} points per Rescue.</li>
              <li>Remaining Vitality scores 1 point per Vitality if you are still standing.</li>
              <li>Each persistent build is worth {config.scoring.persistentBuildBonus} points.</li>
              <li>If you finish the game at {config.scoring.healthyVitalityThreshold}+ Vitality and are not collapsed, gain {config.scoring.healthyVitalityBonus} bonus points.</li>
              <li>Final score cannot go below 0.</li>
            </ul>
          </section>

          <section className="print-reference-block">
            <h2>End Conditions</h2>
            <ul>
              <li>Rescue threshold met: stop before the next round begins.</li>
              <li>All players collapsed: no winner.</li>
              <li>Simulation ceiling reached: use score to determine the winner unless a collapse rule says otherwise.</li>
            </ul>
          </section>

          <section className="print-reference-block">
            <h2>Tie Breaker</h2>
            <ul>
              <li>If scores tie, the surviving player earlier in seat order wins.</li>
              <li>If all tied players have collapsed, there is no winner.</li>
            </ul>
          </section>
        </div>
      </PrintPage>
    </div>
  );
}

const WEATHER_CATEGORIES = ['Pressure', 'Opportunity', 'Neutral'];
const COMMON_TAGS = ['Shelter', 'SturdyShelter', 'HearthActive', 'SustainedFire', 'FoodSource', 'Tool', 'SignalEngine'] as const;
