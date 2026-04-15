import type { MaterialType } from '../types';
import { useLongPressTooltip } from '../hooks/useLongPressTooltip';

const MATERIAL_ICONS: Record<MaterialType, string> = {
  Wood:       '🪵',
  Fiber:      '🌿',
  Stone:      '🪨',
  Food:       '🍖',
  Water:      '💧',
  Rations:    '🥫',
  CleanWater: '💦',
  Fuel:       '🔥',
  Cordage:    '🪢',
};

interface Props {
  material: MaterialType;
  count?: number;
}

export function MaterialPill({ material, count }: Props) {
  const icon = MATERIAL_ICONS[material];
  const { handlers, tooltip } = useLongPressTooltip(material);
  return (
    <>
      <span className={`material-pill material-${material}`} title={material} {...handlers}>
        <span>{icon}</span>
        {count !== undefined && count > 1 && (
          <span className="mat-qty">×{count}</span>
        )}
      </span>
      {tooltip}
    </>
  );
}
