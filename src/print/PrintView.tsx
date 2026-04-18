import { printTemplates } from './registry';
import { getActionGlyph, getMaterialGlyph, getMeterGlyph, getRecipeFamilyGlyph, getRecipeTypeGlyph, getZoneGlyph } from '../data/iconography';

const LEGEND_MATERIALS = ['Wood', 'Fiber', 'Stone', 'Food', 'Rations', 'Water', 'CleanWater', 'Fuel', 'Cordage'] as const;
const LEGEND_METERS = ['vitality', 'rescue', 'hunger', 'thirst', 'warmth'] as const;

export function PrintView() {
  return (
    <div className="print-app">
      <div className="print-toolbar">
        <div className="print-toolbar__brand">
          <div className="print-toolbar__eyebrow">The Wilds</div>
          <div className="print-toolbar__title">Print</div>
          <div className="print-toolbar__subtitle">
            Each template opens as its own page. Use the browser print dialog to export PDFs.
          </div>
        </div>
      </div>

      <div className="print-legend">
        <div className="print-legend__group">
          <span className="print-legend__label">Materials</span>
          {LEGEND_MATERIALS.map((material) => (
            <span key={material} className="print-legend__pill">
              <span aria-hidden="true">{getMaterialGlyph(material)}</span>
              {material}
            </span>
          ))}
        </div>
        <div className="print-legend__group">
          <span className="print-legend__label">Meters</span>
          {LEGEND_METERS.map((meter) => (
            <span key={meter} className="print-legend__pill">
              <span aria-hidden="true">{getMeterGlyph(meter)}</span>
              {meter}
            </span>
          ))}
        </div>
        <div className="print-legend__group">
          <span className="print-legend__label">Crafts</span>
          <span className="print-legend__pill">
            <span aria-hidden="true">{getRecipeTypeGlyph('persistentEngine')}</span>
            Engine
          </span>
          <span className="print-legend__pill">
            <span aria-hidden="true">{getRecipeTypeGlyph('persistent')}</span>
            Persistent
          </span>
          <span className="print-legend__pill">
            <span aria-hidden="true">{getRecipeTypeGlyph('oneTime')}</span>
            One-time
          </span>
          <span className="print-legend__pill">
            <span aria-hidden="true">{getRecipeFamilyGlyph('signal-rescue')}</span>
            Signal lane
          </span>
        </div>
        <div className="print-legend__group">
          <span className="print-legend__label">Board</span>
          <span className="print-legend__pill">
            <span aria-hidden="true">{getMaterialGlyph('CleanWater')}</span>
            Hydration fill
          </span>
          <span className="print-legend__pill">
            <span aria-hidden="true">{getMaterialGlyph('Water')}</span>
            Raw Water loss
          </span>
          <span className="print-legend__pill">
            <span aria-hidden="true">{getMeterGlyph('warmth')}</span>
            Warmth move
          </span>
          <span className="print-legend__pill">
            <span aria-hidden="true">{getMeterGlyph('rescue')}</span>
            Shared rescue
          </span>
          <span className="print-legend__pill">
            <span aria-hidden="true">{getZoneGlyph('camp')}</span>
            Zone
          </span>
          <span className="print-legend__pill">
            <span aria-hidden="true">{getActionGlyph('signal')}</span>
            Action
          </span>
        </div>
      </div>

      <div className="print-template-tabs">
        {printTemplates.map((entry) => (
          <a
            key={entry.id}
            href={entry.href}
            target="_blank"
            rel="noopener noreferrer"
            title={entry.description}
          >
            {entry.label} ↗
          </a>
        ))}
      </div>

      <div className="print-template-description" style={{ marginTop: 16 }}>
        Select a template above to open it in a new tab. The legend above matches the shared icon language used in the updated print and digital views.
      </div>
    </div>
  );
}
