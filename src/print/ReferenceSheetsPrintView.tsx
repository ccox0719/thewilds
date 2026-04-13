import { config } from '../data/config';
import { PrintPage } from './PrintFrame';

export function ReferenceSheetsPrintView() {
  return (
    <PrintPage
      title="Quick Reference"
      subtitle="A short play aid for the table"
      footer="One-page reminder"
    >
      <div className="print-rules-grid">
        <section className="print-reference-block">
          <h2>Round Sequence</h2>
          <ol>
            <li>Reveal the event.</li>
            <li>Fill the market.</li>
            <li>Draft materials.</li>
            <li>Gain income.</li>
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
            <li>Warmth uses shelter or fire protection.</li>
            <li>If you pass all three checks, gain 1 Vitality.</li>
          </ul>
        </section>

        <section className="print-reference-block">
          <h2>Scoring Reminder</h2>
          <ul>
            <li>Rescue is worth {config.scoring.rescueMultiplier} points per rescue.</li>
            <li>Remaining Vitality scores directly.</li>
            <li>Each persistent build is worth {config.scoring.persistentBuildBonus} points.</li>
            <li>Healthy finish bonus: +{config.scoring.healthyVitalityBonus} at {config.scoring.healthyVitalityThreshold}+ Vitality.</li>
          </ul>
        </section>

        <section className="print-reference-block">
          <h2>Common Tags</h2>
          <ul>
            <li><span className="bold">Shelter</span>: reduces cold pressure and supports shelter upgrades.</li>
            <li><span className="bold">SturdyShelter</span>: fully blocks temperature loss.</li>
            <li><span className="bold">HearthActive</span>: fire source that unlocks cooking.</li>
            <li><span className="bold">SustainedFire</span>: upgraded fire that unlocks Signal Beacon.</li>
            <li><span className="bold">FoodSource</span>: food engine that makes Food each income.</li>
            <li><span className="bold">Tool</span>: supports processing builds like Tool Bench.</li>
            <li><span className="bold">SignalEngine</span>: supports rescue and later signal builds.</li>
          </ul>
        </section>
      </div>
    </PrintPage>
  );
}
