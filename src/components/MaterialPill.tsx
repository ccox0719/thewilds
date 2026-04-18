import type { MaterialType } from '../types';
import { useLongPressTooltip } from '../hooks/useLongPressTooltip';
import { getMaterialGlyph } from '../data/iconography';

interface Props {
  material: MaterialType;
  count?: number;
}

export function MaterialPill({ material, count }: Props) {
  const icon = getMaterialGlyph(material);
  const { handlers, tooltip } = useLongPressTooltip(material);

  return (
    <>
      <span className={`material-pill material-${material}`} title={material} {...handlers}>
        <span className="material-pill-icon" aria-hidden="true">{icon}</span>
        {count !== undefined && count > 1 && (
          <span className="mat-qty">×{count}</span>
        )}
      </span>
      {tooltip}
    </>
  );
}

