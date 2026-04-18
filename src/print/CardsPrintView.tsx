import { recipes } from '../data/recipes';
import { specialCards } from '../data/specialCards';
import { chunk } from './printUtils';
import { PrintCard, PrintPage } from './PrintFrame';
import {
  formatMaterialCost,
  formatFamilyName,
  formatRecipeRequirements,
  formatMaintenanceText,
  formatTypeName,
  formatTagName,
  summarizeRecipeEffects,
  summarizeSpecialCardEffects,
} from './printFacts';
import {
  getRecipeActionLabel,
  getRecipeZoneKey,
  getRecipeZoneLabel,
  getZoneGlyph,
} from '../data/iconography';

type Mode = 'recipes' | 'specialties';

interface Props {
  mode: Mode;
}

const PAGE_SIZE = 6;

export function CardsPrintView({ mode }: Props) {
  const title = mode === 'recipes' ? 'Recipe Cards' : 'Specialty Cards';
  const subtitle = mode === 'recipes'
    ? 'US Letter preview. 2.5 x 3.5 in cards, 6 per page.'
    : 'US Letter preview. 2.5 x 3.5 in cards, 6 per page.';

  if (mode === 'recipes') {
    const pages = chunk(
      recipes.slice().sort((a, b) => a.tier - b.tier || a.family.localeCompare(b.family) || a.name.localeCompare(b.name)),
      PAGE_SIZE,
    );

    return (
      <div className="print-stack">
        {pages.map((pageItems, pageIndex) => (
          <PrintPage
            key={`recipes-${pageIndex}`}
            title={title}
            subtitle={subtitle}
            footer={`Page ${pageIndex + 1} of ${pages.length}`}
          >
            <div className="print-card-grid">
              {pageItems.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}
            </div>
          </PrintPage>
        ))}
      </div>
    );
  }

  const pages = chunk(
    specialCards.slice().sort((a, b) => a.source.localeCompare(b.source) || a.family.localeCompare(b.family) || a.name.localeCompare(b.name)),
    PAGE_SIZE,
  );

  return (
    <div className="print-stack">
      {pages.map((pageItems, pageIndex) => (
        <PrintPage
          key={`specialties-${pageIndex}`}
          title={title}
          subtitle={subtitle}
          footer={`Page ${pageIndex + 1} of ${pages.length}`}
        >
          <div className="print-card-grid">
            {pageItems.map((card) => <SpecialtyCard key={card.id} card={card} />)}
          </div>
        </PrintPage>
      ))}
    </div>
  );
}

function RecipeCard({ recipe }: { recipe: (typeof recipes)[number] }) {
  const requirements = formatRecipeRequirements(recipe) || undefined;
  const maintenance = formatMaintenanceText(recipe);
  const footer = [
    `Tier ${recipe.tier} · ${formatTypeName(recipe.type)}`,
    maintenance,
  ].filter(Boolean).join(' · ');

  return (
    <PrintCard
      title={recipe.printTitle}
      className={`print-card--recipe ${recipe.type === 'persistentEngine' ? 'print-card--engine' : recipe.type === 'persistent' ? 'print-card--persistent' : 'print-card--one-time'}`}
      headerNote={requirements}
      subtitle={formatMaterialCost(recipe.cost)}
      footer={footer || undefined}
    >
      <div className="print-card__banner" aria-hidden="true" />
      <div className="print-card__stack">
        <div className="print-card__effect">{summarizeRecipeEffects(recipe).join('. ')}</div>
        <div className="print-card__meta">
          <div>Route: {getZoneGlyph(getRecipeZoneKey(recipe.family))} {getRecipeZoneLabel(recipe.family)} / {getRecipeActionLabel(recipe.family)}</div>
          <div>Family: {formatFamilyName(recipe.family)}</div>
          <div>Grants: {recipe.tags.length ? recipe.tags.map((tag) => formatTagName(tag)).join(', ') : 'None'}</div>
          {recipe.satisfiesCheck && <div>Satisfies: {formatTagName(recipe.satisfiesCheck)}</div>}
        </div>
      </div>
    </PrintCard>
  );
}

function SpecialtyCard({ card }: { card: (typeof specialCards)[number] }) {
  const effects = summarizeSpecialCardEffects(card);
  return (
    <PrintCard
      title={card.name}
      subtitle={`${card.source} · ${card.family.replace('-', ' ')}`}
      footer={card.id}
    >
      <div className="print-card__stack">
        <div className="print-card__effect">{effects.join('. ')}</div>
        <div className="print-card__meta">
          <div>Family: {formatFamilyName(card.family)}</div>
          <div>Source: {card.source}</div>
        </div>
      </div>
    </PrintCard>
  );
}
