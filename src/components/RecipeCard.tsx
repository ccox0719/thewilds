import type { EngineEffect, MaterialType, PlayerState, GameState, Tag, Recipe } from '../types';
import { MaterialPill } from './MaterialPill';
import { canCraftRecipe, getEffectiveRecipeCost } from '../engine/craft';
import { getTagTooltip } from '../data/tagInfo';
import {
  formatEffectShort,
  getEffectGlyph,
  getPersistenceGlyph,
  getRecipeFamilyGlyph,
  getRecipeActionLabel,
  getRecipeZoneKey,
  getRecipeZoneLabel,
  getRecipeRoleLabel,
  getRecipeTypeGlyph,
  getTagGlyph,
  getSurvivalCheckGlyph,
  getZoneGlyph,
} from '../data/iconography';

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

function familyChipClass(family: string): string {
  return `chip family family-${family}`;
}

function typeClass(type: string): string {
  if (type === 'persistentEngine') return 'type-engine';
  if (type === 'persistent') return 'type-persistent';
  return 'type-one-time';
}

function tierLabel(tier: number): string | null {
  if (tier === 1) return 'T1';
  if (tier === 2) return 'T2';
  if (tier === 3) return 'T3';
  return null;
}

function summarizeTags(tags: Tag[]): { glyph: string; text: string }[] {
  return tags.map((tag) => ({
    glyph: getTagGlyph(tag),
    text: tag,
  }));
}

function renderEffectChip(effect: EngineEffect, index: number) {
  const glyph = getEffectGlyph(effect);
  const label = formatEffectShort(effect);
  const color =
    effect.type === 'rescue' || effect.type === 'rescueBonus'
      ? 'var(--rescue)'
      : effect.type === 'vitality'
        ? 'var(--vitality)'
        : effect.type === 'materialGain' || effect.type === 'materialIncome'
          ? 'var(--accent)'
          : 'var(--text-muted)';

  return (
    <span className="recipe-effect-chip" key={`${effect.type}-${index}`} style={{ color }}>
      <span className="recipe-effect-chip__glyph" aria-hidden="true">{glyph}</span>
      <span>{label}</span>
      {effect.duration && effect.duration !== 'permanent' && (
        <span className="recipe-effect-chip__meta">({effect.duration})</span>
      )}
    </span>
  );
}

export function RecipeCard({ recipe, player, state, onCraft, showCraftButton = true }: RecipeCardProps) {
  const canAfford = canCraftRecipe(player, recipe, state);
  const cost = getEffectiveRecipeCost(player, recipe, state);
  const effectChips = recipe.effects.map(renderEffectChip);
  const tagChips = recipe.tags.length > 0 ? summarizeTags(recipe.tags) : [];
  const requiresChips = recipe.requiresTags.map((tag) => ({
    glyph: getTagGlyph(tag),
    text: tag,
  }));

  return (
    <div className={`recipe-card ${typeClass(recipe.type)} ${canAfford ? 'can-afford' : 'cannot-afford'}`}>
      <div className="recipe-card-banner" aria-hidden="true" />
      <div className="recipe-card-header">
        <span className="recipe-card-name">{recipe.name}</span>
        <div className="recipe-card-badges">
          <span className={typeChipClass(recipe.type)}>
            <span className="chip-icon" aria-hidden="true">{getRecipeTypeGlyph(recipe.type)}</span>
            {typeLabel(recipe.type)}
          </span>
          <span className="chip type-role">
            <span className="chip-icon" aria-hidden="true">{getPersistenceGlyph(recipe.type === 'oneTime' ? 'oneTime' : recipe.type === 'persistentEngine' ? 'engine' : 'persistent')}</span>
            {getRecipeRoleLabel(recipe.type)}
          </span>
          <span className={familyChipClass(recipe.family)}>
            <span className="chip-icon" aria-hidden="true">{getRecipeFamilyGlyph(recipe.family)}</span>
            {getRecipeActionLabel(recipe.family)}
          </span>
          {tierLabel(recipe.tier) && <span className={`chip tier${recipe.tier}`}>{tierLabel(recipe.tier)}</span>}
        </div>
      </div>

      <div className="recipe-card-route">
        <span className="recipe-card-require-label">ZONE</span>
        <span className="tag active">
          <span className="chip-icon" aria-hidden="true">{getZoneGlyph(getRecipeZoneKey(recipe.family))}</span>
          {getRecipeZoneLabel(recipe.family)}
        </span>
        <span className="recipe-card-require-label">ACTION</span>
        <span className="tag safe">
          <span className="chip-icon" aria-hidden="true">{getRecipeFamilyGlyph(recipe.family)}</span>
          {getRecipeActionLabel(recipe.family)}
        </span>
      </div>

      <div className="recipe-card-cost" aria-label={`Cost: ${recipe.printCostText}`}>
        {Object.entries(cost).map(([mat, qty]) => (
          <MaterialPill key={mat} material={mat as MaterialType} count={qty as number} />
        ))}
      </div>

      {requiresChips.length > 0 && (
        <div className="recipe-card-requires">
          <span className="recipe-card-require-label">REQ</span>
          {requiresChips.map((req) => (
            <span key={req.text} className="tag active" title={getTagTooltip(req.text as Tag)}>
              <span className="chip-icon" aria-hidden="true">{req.glyph}</span>
              {req.text}
            </span>
          ))}
        </div>
      )}

      {recipe.satisfiesCheck && (
        <div className="recipe-card-requires">
          <span className="recipe-card-require-label">FLOW</span>
          <span className="tag safe">
            <span className="chip-icon" aria-hidden="true">{getSurvivalCheckGlyph(recipe.satisfiesCheck)}</span>
            {recipe.satisfiesCheck}
          </span>
        </div>
      )}

      {tagChips.length > 0 && (
        <div className="recipe-card-requires">
          <span className="recipe-card-require-label">GAIN</span>
          {tagChips.map((tag) => (
            <span key={tag.text} className="tag active" title={getTagTooltip(tag.text as Tag)}>
              <span className="chip-icon" aria-hidden="true">{tag.glyph}</span>
              {tag.text}
            </span>
          ))}
        </div>
      )}

      {effectChips.length > 0 ? (
        <div className="recipe-card-effect-row">
          {effectChips}
        </div>
      ) : recipe.printEffectText ? (
        <div className="recipe-card-effect">{recipe.printEffectText}</div>
      ) : null}

      {recipe.type === 'persistentEngine' && (
        <div className="recipe-card-footnote">
          <span className="recipe-card-footnote-icon" aria-hidden="true">⟳</span>
          Persistent engine
        </div>
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
