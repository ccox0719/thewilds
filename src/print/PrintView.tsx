import { config } from '../data/config';
import {
  getActionGlyph,
  getMaterialGlyph,
  getMeterGlyph,
  getRecipeFamilyGlyph,
  getRecipeTypeGlyph,
  getZoneGlyph,
} from '../data/iconography';
import { profiles } from '../data/profiles';
import { recipes } from '../data/recipes';
import { scenarios } from '../data/scenarios';
import { specialCards } from '../data/specialCards';
import type { MaterialType } from '../types';
import { printTemplates } from './registry';

const CUBE_MATERIALS: {
  color: string;
  swatch: string;
  material: MaterialType;
  role: string;
  note?: string;
}[] = [
  { color: 'Orange', swatch: '#d96f24', material: 'Wood', role: 'building and fire base' },
  { color: 'Green', swatch: '#38934b', material: 'Fiber', role: 'shelter and cordage base' },
  { color: 'White', swatch: '#e4e0d5', material: 'Stone', role: 'tools and signal base' },
  { color: 'Red', swatch: '#c83b2f', material: 'Food', role: 'hunger payment', note: 'Rations are printed track boxes after conversion.' },
  { color: 'Blue', swatch: '#2879c9', material: 'Water', role: 'raw thirst buffer', note: 'Treated Water is printed track boxes after conversion.' },
  { color: 'Yellow', swatch: '#d8a928', material: 'Fuel', role: 'crafted fire supply' },
  { color: 'Pink', swatch: '#ce4e93', material: 'Cordage', role: 'crafted rope supply' },
];

const PRINTED_COMPONENTS = [
  { label: 'Player boards', detail: `${profiles.length} character boards with vitality, hunger, hydration, warmth, rescue, and perk tracking.` },
  { label: 'Recipe cards', detail: `${recipes.length} craft cards for the table market and build reference.` },
  { label: 'Specialty cards', detail: `${specialCards.length} profile, blueprint, and upgrade cards.` },
  { label: 'Reference sheets', detail: 'Round flow, survival checks, scoring, cube colors, and converted resource boxes.' },
  { label: 'Tokens sheet', detail: 'Optional markers for tags, rescue, event state, and maintenance reminders.' },
];

const TABLE_ZONES = [
  { icon: getZoneGlyph('camp'), label: 'Camp', text: 'Player boards, built recipes, perk boxes, and personal cube supplies.' },
  { icon: getZoneGlyph('field'), label: 'Market', text: `${config.marketCapSize} public cube slots refilled from the bag.` },
  { icon: getActionGlyph('search'), label: 'Bag', text: `Draw ${config.materialsPrivateDrawPerRound} private cubes per active player during draft.` },
  { icon: getMeterGlyph('rescue'), label: 'Shared Track', text: 'One printed rescue row advances whenever any player gains rescue.' },
];

const PLAY_LOOP = [
  'Reveal weather and refill the market from the cube bag.',
  'Draft from the shared market, then each active player draws private cubes.',
  'Resolve income from built engines and printed specialty effects.',
  'Craft one recipe or pass, paying cube costs back to the supply.',
  'Run hunger, thirst, warmth, collapse, and rescue checks on the printed boards.',
];

const SHORTHAND = [
  { icon: getRecipeTypeGlyph('persistentEngine'), label: 'Engine', text: 'Stays built and produces income or bonuses.' },
  { icon: getRecipeTypeGlyph('persistent'), label: 'Persistent', text: 'Stays built and unlocks protection, tags, or discounts.' },
  { icon: getRecipeTypeGlyph('oneTime'), label: 'One-time', text: 'Resolve, score the use, then discard or mark complete.' },
  { icon: getRecipeFamilyGlyph('signal-rescue'), label: 'Signal', text: 'Adds rescue and pushes the shared end condition.' },
];

export function PrintView() {
  const scenarioRows = scenarios.map((scenario) => ({
    id: scenario.id,
    name: scenario.name,
    total: Object.values(scenario.bagComposition).reduce((sum, count) => sum + count, 0),
    composition: Object.entries(scenario.bagComposition) as [MaterialType, number][],
  }));

  return (
    <main className="print-app print-hub">
      <section className="print-hub__hero">
        <div className="print-hub__hero-copy">
          <div className="print-hub__eyebrow">The Wilds Table Kit</div>
          <h1>Print the boards. Draw the resources as cubes.</h1>
          <p>
            The digital prototype supplies the live rules, card data, and printable sheets.
            At the table, the bag is physical: mini cubes represent the raw resources players draft, spend, convert, and stockpile.
          </p>
        </div>
        <div className="print-hub__hero-panel" aria-label="Print kit summary">
          <div>
            <span className="print-hub__stat">{config.marketCapSize}</span>
            <span className="print-hub__stat-label">market cubes</span>
          </div>
          <div>
            <span className="print-hub__stat">{config.materialsPrivateDrawPerRound}</span>
            <span className="print-hub__stat-label">private draws</span>
          </div>
          <div>
            <span className="print-hub__stat">{config.simulationCeiling}</span>
            <span className="print-hub__stat-label">round ceiling</span>
          </div>
        </div>
      </section>

      <section className="print-hub__actions" aria-label="Printable pages">
        {printTemplates.map((entry) => (
          <a key={entry.id} className="print-hub__print-link" href={entry.href} target="_blank" rel="noopener noreferrer">
            <span>{entry.label}</span>
            <small>{entry.description}</small>
          </a>
        ))}
      </section>

      <section className="print-hub__layout">
        <div className="print-hub__panel print-hub__panel--wide">
          <div className="print-hub__section-heading">
            <h2>Cube Resource Bag</h2>
            <span>Physical pieces</span>
          </div>
          <div className="print-hub__cube-grid">
            {CUBE_MATERIALS.map((item) => (
              <article key={item.color} className="print-hub__cube-card">
                <span className="print-hub__cube-swatch" style={{ background: item.swatch }} />
                <div>
                  <strong>{item.color}</strong>
                  <span>{getMaterialGlyph(item.material)} {item.material}</span>
                  <small>{item.role}</small>
                  {item.note && <em>{item.note}</em>}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="print-hub__panel">
          <div className="print-hub__section-heading">
            <h2>Printed Pieces</h2>
            <span>Paper kit</span>
          </div>
          <div className="print-hub__component-list">
            {PRINTED_COMPONENTS.map((item) => (
              <article key={item.label}>
                <strong>{item.label}</strong>
                <span>{item.detail}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="print-hub__panel">
          <div className="print-hub__section-heading">
            <h2>Table Zones</h2>
            <span>Physical layout</span>
          </div>
          <div className="print-hub__zone-map">
            {TABLE_ZONES.map((zone) => (
              <article key={zone.label}>
                <span aria-hidden="true">{zone.icon}</span>
                <strong>{zone.label}</strong>
                <small>{zone.text}</small>
              </article>
            ))}
          </div>
        </div>

        <div className="print-hub__panel print-hub__panel--wide">
          <div className="print-hub__section-heading">
            <h2>Scenario Bag Counts</h2>
            <span>Build one bag per scenario</span>
          </div>
          <div className="print-hub__scenario-table">
            {scenarioRows.map((scenario) => (
              <article key={scenario.id}>
                <div>
                  <strong>{scenario.name}</strong>
                  <span>{scenario.total} cubes</span>
                </div>
                <div className="print-hub__material-row">
                  {scenario.composition.map(([material, count]) => (
                    <span key={material}>
                      {getMaterialGlyph(material)} {material} x{count}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="print-hub__panel">
          <div className="print-hub__section-heading">
            <h2>Round Loop</h2>
            <span>Table procedure</span>
          </div>
          <ol className="print-hub__loop">
            {PLAY_LOOP.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </div>

        <div className="print-hub__panel">
          <div className="print-hub__section-heading">
            <h2>Card Shorthand</h2>
            <span>Print icons</span>
          </div>
          <div className="print-hub__shorthand">
            {SHORTHAND.map((item) => (
              <article key={item.label}>
                <span aria-hidden="true">{item.icon}</span>
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.text}</small>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
