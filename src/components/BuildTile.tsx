import { getRecipeById } from '../data/recipes';
import { getPersistenceGlyph } from '../data/iconography';

interface BuildTileProps {
  recipeId: string;
  isOffline?: boolean;
}

function getTypeLabel(type: string): string {
  if (type === 'persistentEngine') return 'engine';
  if (type === 'persistent') return 'persist';
  return 'one-time';
}

export function BuildTile({ recipeId, isOffline = false }: BuildTileProps) {
  const recipe = getRecipeById(recipeId);
  if (!recipe) return null;

  const typeClass = recipe.type === 'persistentEngine' ? 'engine' : isOffline ? 'offline' : '';

  return (
    <div
      className={`build-tile ${typeClass}`}
      title={recipe.designNotes ?? recipe.printEffectText}
    >
      <span className="build-tile-icon" aria-hidden="true">
        {recipe.type === 'persistentEngine'
          ? getPersistenceGlyph('engine')
          : recipe.type === 'persistent'
            ? getPersistenceGlyph('persistent')
            : getPersistenceGlyph('oneTime')}
      </span>
      <span className="build-tile-name">{recipe.name}</span>
      {isOffline ? (
        <span className="build-tile-type" style={{ color: 'var(--danger)' }}>OFFLINE</span>
      ) : (
        <span className="build-tile-type">{getTypeLabel(recipe.type)}</span>
      )}
    </div>
  );
}
