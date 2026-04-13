import type { MaterialType } from '../types';

const MATERIAL_SYMBOLS: Record<MaterialType, string> = {
  Wood: '≡',
  Fiber: '∿',
  Stone: '◆',
  Food: '✦',
  Water: '◈',
  Fire: '◉',
  Rations: '⊕',
  CleanWater: '◈',
  Fuel: '◉',
  Cordage: '∞',
};

interface Props {
  material: MaterialType;
  count?: number;
}

export function MaterialPill({ material, count }: Props) {
  const symbol = MATERIAL_SYMBOLS[material];
  return (
    <span className={`material-pill material-${material}`}>
      <span style={{ opacity: 0.75 }}>{symbol}</span>
      <span>{material}</span>
      {count !== undefined && count > 1 && (
        <span className="mat-qty">×{count}</span>
      )}
      {count === 1 && null}
    </span>
  );
}
