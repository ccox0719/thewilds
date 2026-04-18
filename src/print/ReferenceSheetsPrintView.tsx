import { config } from '../data/config';
import { getMeterGlyph, getTagGlyph } from '../data/iconography';
import { getTagTooltip } from '../data/tagInfo';
import { PrintPage } from './PrintFrame';
import { formatRescueThresholds } from './printFacts';

export function ReferenceSheetsPrintView() {
  return (
    <div className="print-stack">
      <PrintPage
        title="Player Reference Sheet"
        subtitle="Setup, weather, and survival"
        footer="Page 1 of 4"
      >
        <div className="print-rules-grid">
          <section className="print-reference-block">
            <h2>Setup</h2>
            <ul>
              <li>Choose a scenario and one profile for each seat.</li>
              <li>{getMeterGlyph('vitality')} Each player starts with {config.startingVitality} Vitality, an empty inventory, one starting specialty card, and their profile perk ready.</li>
              <li>Shuffle the scenario bag, fill the shared market to {config.marketCapSize} materials, and place the {getMeterGlyph('rescue')} Rescue track in the middle of the table.</li>
              <li>Each active player gets {config.materialsPrivateDrawPerRound} private bag draw during the draft phase.</li>
            </ul>
          </section>

          <section className="print-reference-block">
            <h2>Round Flow</h2>
            <ol>
              <li>{getMeterGlyph('warmth')} Reveal 1 weather card for the round.</li>
              <li>Refill the market from the bag.</li>
              <li>Draft materials from the shared market and draw private materials.</li>
              <li>Resolve engine income.</li>
              <li>Pay maintenance on the rounds it is due.</li>
              <li>Craft one recipe per active seat, or pass.</li>
              <li>Resolve hunger, thirst, and warmth in that order.</li>
              <li>{getMeterGlyph('rescue')} Check rescue and collapse, then advance only if no end condition was met.</li>
            </ol>
          </section>

          <section className="print-reference-block">
            <h2>Weather</h2>
            <ul>
              <li>At the start of each round, roll 1 die to determine the active weather card from the eligible pool.</li>
              <li>Eligible cards are those matching the current scenario and round window.</li>
              <li>The weather card lasts that round only, then the next round's roll replaces it.</li>
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
              <li>Spend 1 Treated Water to satisfy it with no damage.</li>
              <li>Raw Water still works for the round, but it is only a short-term buffer.</li>
              <li>If you have neither, take 1 Vitality damage.</li>
            </ol>
            <div className="print-rules-small" style={{ marginTop: 8 }}>
              Hydration is a buffer system, not a standard number track.
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
            <div className="print-rules-small" style={{ marginTop: 8 }}>
              Warmth is a position track with a comfort band in the center.
            </div>
          </section>

          <section className="print-reference-block">
            <h2>Vitality</h2>
            <ul>
              <li>{getMeterGlyph('vitality')} If you pass all three checks, regain 1 Vitality at the end of the round.</li>
              <li>If you fail one or more checks, you lose the listed Vitality damage from those checks.</li>
              <li>If Vitality reaches 0 or less, you collapse immediately.</li>
            </ul>
          </section>
        </div>
      </PrintPage>

      <PrintPage
        title="Player Reference Sheet"
        subtitle="Rescue and collapse"
        footer="Page 2 of 4"
      >
        <div className="print-rules-grid">
          <section className="print-reference-block">
            <h2>Shared Rescue</h2>
            <ul>
              <li>{getMeterGlyph('rescue')} Whenever you gain Rescue, your personal rescue score and the shared rescue track both increase by that amount.</li>
              <li>Signal recipes can receive additional Rescue from SignalEngine and some weather cards.</li>
              <li>When the shared rescue track reaches the threshold, finish the current round sequence and then end the game before a new round begins.</li>
              <li>Thresholds by player count: {formatRescueThresholds()}.</li>
            </ul>
          </section>

          <section className="print-reference-block">
            <h2>Collapse Box</h2>
            <ul>
              <li>{getMeterGlyph('vitality')} A player collapses as soon as Vitality is 0 or less.</li>
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
                  <span className="bold">{getTagGlyph(tag)} {tag}</span>: {getTagTooltip(tag)}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </PrintPage>

      <PrintPage
        title="Final Scoring Summary"
        subtitle="Use this to score the game at a glance"
        footer="Page 3 of 4"
      >
        <div className="print-rules-grid">
          <section className="print-reference-block">
            <h2>Score Formula</h2>
            <ul>
              <li>All scoring values are whole numbers for table play.</li>
              <li>Craft points: T1 {config.scoring.craftPointsByTier[1]}, T2 {config.scoring.craftPointsByTier[2]}, T3 {config.scoring.craftPointsByTier[3]}.</li>
              <li>Use points: {config.scoring.usePointsPerImmediateEffect} each, capped at {config.scoring.usePointsCap}.</li>
              <li>{getMeterGlyph('rescue')} Rescue points: 1 per {config.scoring.rescuePointsStep}, capped at {config.scoring.rescuePointsCap}.</li>
              <li>{getMeterGlyph('vitality')} Survival points: 1 per {config.scoring.survivalPointsStep} Vitality, plus {config.scoring.healthyVitalityBonus} at {config.scoring.healthyVitalityThreshold}+ if standing.</li>
              <li>Engine points: {config.scoring.persistentBuildBonus} per persistent build, capped at {config.scoring.persistentBuildCap}.</li>
              <li>Final score cannot go below 0.</li>
            </ul>
          </section>

          <section className="print-reference-block">
            <h2>End Conditions</h2>
            <ul>
              <li>{getMeterGlyph('rescue')} Rescue threshold met: stop before the next round begins.</li>
              <li>{getMeterGlyph('vitality')} All players collapsed: no winner.</li>
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
      <PrintPage
        title="Materials Reference"
        subtitle="Cube colors and converted resource tracking"
        footer="Page 4 of 4"
      >
        <div className="print-rules-grid">
          <section className="print-reference-block">
            <h2>Cube Color Guide</h2>
            <div className="print-cube-guide">
              {CUBE_COLORS.map(({ color, swatch, label, note }) => (
                <div key={color} className="print-cube-row">
                  <span
                    className="print-cube-swatch"
                    style={{ background: swatch }}
                  />
                  <span className="print-cube-label">{color}</span>
                  <span>— {label}</span>
                  {note && <span className="print-cube-note">({note})</span>}
                </div>
              ))}
            </div>
            <div className="print-rules-small" style={{ marginTop: 10 }}>
              Food and Rations share the red cube. Water is unsafe and only lasts for the round; Treated Water is stockpiled.
              When you craft Rations or Treated Water, remove the raw cube from your supply and
              mark a box below instead of placing a new cube.
            </div>
          </section>

          <section className="print-reference-block">
            <h2>Converted Resource Tracking</h2>
            <div className="print-tracking-section">
              <div className="print-tracking-row">
                <div className="print-tracking-label">
                  <span
                    className="print-cube-swatch"
                    style={{ background: '#d83020', width: 14, height: 14 }}
                  />
                  🥫 Rations
                  <span className="print-tracking-sublabel">(red cube converted)</span>
                </div>
                <div className="print-tracking-boxes">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="print-tracking-box" />
                  ))}
                </div>
              </div>

              <div className="print-tracking-row">
                <div className="print-tracking-label">
                  <span
                    className="print-cube-swatch"
                    style={{ background: '#2878d8', width: 14, height: 14 }}
                  />
                  💦 Treated Water
                  <span className="print-tracking-sublabel">(blue cube converted)</span>
                </div>
                <div className="print-tracking-boxes">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="print-tracking-box" />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </PrintPage>
    </div>
  );
}

const WEATHER_CATEGORIES = ['Pressure', 'Opportunity', 'Neutral'];
const COMMON_TAGS = ['Shelter', 'SturdyShelter', 'HearthActive', 'SustainedFire', 'FoodSource', 'Tool', 'SignalEngine'] as const;

const CUBE_COLORS: { color: string; swatch: string; label: string; note?: string }[] = [
  { color: 'Orange', swatch: '#e07020', label: 'Wood' },
  { color: 'Green',  swatch: '#38a028', label: 'Fiber' },
  { color: 'White',  swatch: '#d8d4cc', label: 'Stone' },
  { color: 'Red',    swatch: '#d83020', label: 'Food / Rations', note: 'Rations tracked on this sheet' },
  { color: 'Blue',   swatch: '#2878d8', label: 'Water / Treated Water', note: 'Treated Water tracked on this sheet' },
  { color: 'Yellow', swatch: '#d8a808', label: 'Fuel' },
  { color: 'Pink',   swatch: '#d84890', label: 'Cordage' },
];
