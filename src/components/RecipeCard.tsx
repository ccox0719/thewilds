import type { Recipe, PlayerState, GameState, MaterialType, Tag } from '../types';
import { MaterialPill } from './MaterialPill';
import { canCraftRecipe, getEffectiveRecipeCost } from '../engine/craft';
import { getTagTooltip } from '../data/tagInfo';

interface RecipeCardProps {
  recipe: Recipe;
  player: PlayerState;
  state: GameState;
  onCraft?: (id: string) => void;
  /** If false, show card in "available but locked (can't afford)" mode */
  showCraftButton?: boolean;
}

function typeChipClass(type: string): string {
  if (type === 'persistentEngine') return 'chip type-engine';
  if (type === 'persistent') return 'chip type-persistent';
  return 'chip type-one-time';
}

function typeLabel(type: string): string {
  if (type === 'persistentEngine') return 'ENGINE';
  if (type === 'persistent') return 'PERSIST';
  return 'ONE-TIME';
}

function familyLabel(family: string): string {
  const map: Record<string, string> = {
    survival: 'Survival',
    'food-engine': 'Food',
    processing: 'Processing',
    'shelter-climate': 'Shelter',
    'signal-rescue': 'Signal',
    recovery: 'Recovery',
  };
  return map[family] ?? family;
}

export function RecipeCard({ recipe, player, state, onCraft, showCraftButton = true }: RecipeCardProps) {
  const canAfford = canCraftRecipe(player, recipe, state);
  const cost = getEffectiveRecipeCost(player, recipe, state);

  return (
    <div className={`recipe-card ${canAfford ? 'can-afford' : 'cannot-afford'}`}>
      <div className="recipe-card-header">
        <span className="recipe-card-name">{recipe.name}</span>
        <div className="recipe-card-badges">
          <span className={typeChipClass(recipe.type)}>{typeLabel(recipe.type)}</span>
          <span className="chip family">{familyLabel(recipe.family)}</span>
          {recipe.tier === 2 && <span className="chip tier2">T2</span>}
        </div>
      </div>

      <div className="recipe-card-cost">
        <span className="text-dim text-xs" style={{ marginRight: 2 }}>Cost:</span>
        {Object.entries(cost).map(([mat, qty]) => (
          <MaterialPill key={mat} material={mat as MaterialType} count={qty as number} />
        ))}
      </div>

      {recipe.requiresTags.length > 0 && (
        <div className="recipe-card-requires">
          <span className="text-dim text-xs">Needs:</span>
          {recipe.requiresTags.map((tag: Tag) => (
            <span key={tag} className="tag active" title={getTagTooltip(tag)}>{tag}</span>
          ))}
        </div>
      )}

      {recipe.satisfiesCheck && (
        <div className="text-xs text-muted">
          Satisfies: <span className="tag safe">{recipe.satisfiesCheck}</span>
        </div>
      )}

      {recipe.tags.length > 0 && (
        <div className="recipe-card-requires">
          <span className="text-dim text-xs">Grants:</span>
          {recipe.tags.map((tag: Tag) => (
            <span key={tag} className="tag active" title={getTagTooltip(tag)}>{tag}</span>
          ))}
        </div>
      )}

      {recipe.effects.length > 0 && (
        <div className="recipe-card-effect">
          {recipe.effects.map((e, i) => (
            <span
              key={i}
              style={{
                color: e.type === 'rescue' ? 'var(--rescue)'
                  : e.type === 'vitality' ? 'var(--vitality)'
                  : 'var(--text-muted)',
              }}
            >
              {e.type} +{e.amount}{e.duration ? ` (${e.duration})` : ''}{' '}
            </span>
          ))}
        </div>
      )}

      {recipe.printEffectText && !recipe.effects.length && !recipe.satisfiesCheck && (
        <div className="recipe-card-effect">{recipe.printEffectText}</div>
      )}

      {showCraftButton && onCraft && (
        <div className="recipe-card-action">
          <button
            className={canAfford ? 'primary' : ''}
            onClick={() => canAfford && onCraft(recipe.id)}
            disabled={!canAfford}
          >
            {canAfford ? 'Craft' : 'Cannot Afford'}
          </button>
        </div>
      )}
    </div>
  );
}
