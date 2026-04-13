import { recipes } from '../data/recipes';
import { specialCards } from '../data/specialCards';
import { chunk } from './printUtils';
import { PrintCard, PrintPage } from './PrintFrame';

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
  const prereq = [
    recipe.requiresTags.length ? `Prereq: ${recipe.requiresTags.join(', ')}` : null,
    recipe.requiresBuilds.length ? `Builds: ${recipe.requiresBuilds.join(', ')}` : null,
  ].filter(Boolean).join(' · ');

  const effects = [
    `Family: ${recipe.family}`,
    `Tier ${recipe.tier} · ${recipe.type}`,
    recipe.designNotes,
  ];

  return (
    <PrintCard
      title={recipe.printTitle}
      headerNote={prereq || undefined}
      subtitle={recipe.printCostText}
      footer={recipe.satisfiesCheck ? `Satisfies: ${recipe.satisfiesCheck}` : undefined}
    >
      <div className="print-card__stack">
        <div className="print-card__effect">{recipe.printEffectText}</div>
        <div className="print-card__meta">
          {effects.map((line) => <div key={line}>{line}</div>)}
        </div>
      </div>
    </PrintCard>
  );
}

function SpecialtyCard({ card }: { card: (typeof specialCards)[number] }) {
  const effects = card.effects.map((effect) => summarizeSpecialtyEffect(effect));
  return (
    <PrintCard
      title={card.name}
      subtitle={`${card.source} · ${card.family.replace('-', ' ')}`}
      footer={card.id}
    >
      <div className="print-card__stack">
        <div className="print-card__effect">{card.printEffectText}</div>
        <div className="print-card__meta">
          {effects.map((line, index) => <div key={`${card.id}-${index}`}>{line}</div>)}
        </div>
        <div className="print-card__meta print-card__meta--muted">{card.designNotes}</div>
      </div>
    </PrintCard>
  );
}

function summarizeSpecialtyEffect(effect: (typeof specialCards)[number]['effects'][number]): string {
  switch (effect.type) {
    case 'recipeCostReduction':
      return `Reduces ${effect.targetRecipeId ?? effect.targetFamily ?? 'matching'} cost by ${effect.amount}${effect.material ? ` ${effect.material}` : ''}`;
    case 'recipeRescueBonus':
      return `Adds +${effect.amount} Rescue to ${effect.targetRecipeId ?? effect.targetFamily ?? 'matching'} recipes`;
    case 'recipeVitalityBonus':
      return `Adds +${effect.amount} Vitality to ${effect.targetRecipeId ?? effect.targetFamily ?? 'matching'} recipes`;
    case 'recipeMaterialGain':
      return `Adds +${effect.amount} ${effect.material} to ${effect.targetRecipeId ?? effect.targetFamily ?? 'matching'} recipes`;
    case 'recipeIncomeBonus':
      return `Adds +${effect.amount} ${effect.material} income to ${effect.targetRecipeId ?? effect.targetFamily ?? 'matching'} recipes`;
    case 'warmthDamageReduction':
      return `Reduces warmth damage by ${effect.amount}`;
    case 'unlockRecipe':
      return `Unlocks ${effect.recipeId}`;
    default:
      return 'Specialty effect';
  }
}
