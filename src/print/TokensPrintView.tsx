import { MaterialPill } from '../components/MaterialPill';
import { PrintPage, PrintToken } from './PrintFrame';
import type { MaterialType, Tag } from '../types';
import { getTagTooltip } from '../data/tagInfo';

const MATERIALS: MaterialType[] = ['Wood', 'Fiber', 'Stone', 'Food', 'Water', 'Rations', 'CleanWater', 'Fuel', 'Cordage'];
const TAGS: Tag[] = ['Shelter', 'SturdyShelter', 'HearthActive', 'SustainedFire', 'FoodSource', 'Tool', 'SignalEngine'];

export function TokensPrintView() {
  return (
    <PrintPage
      title="Tokens Sheet"
      subtitle="Materials, status markers, and table trackers"
      footer="Print, cut, and sleeve as needed"
    >
      <div className="print-token-sections">
        <section className="print-reference-block">
          <h2>Materials</h2>
          <div className="print-token-grid">
            {MATERIALS.map((material) => (
              <div key={material} className="print-token-wrap">
                <MaterialPill material={material} />
                <div className="print-token-caption">{material}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="print-reference-block">
          <h2>Tags</h2>
          <div className="print-token-grid">
            {TAGS.map((tag) => (
              <div key={tag} className="print-token-wrap">
                <PrintToken label={tag} detail={getTagTooltip(tag)} />
              </div>
            ))}
          </div>
        </section>

        <section className="print-reference-block">
          <h2>Trackers</h2>
          <div className="print-token-grid">
            <PrintToken label="Rescue" detail="Group rescue track marker" />
            <PrintToken label="Vitality" detail="Player health marker" />
            <PrintToken label="Maintenance" detail="Upkeep / offline marker" />
            <PrintToken label="Event" detail="Current round event marker" />
          </div>
        </section>
      </div>
    </PrintPage>
  );
}
