export type PrintTemplateId =
  | 'crafting-tree'
  | 'recipe-cards'
  | 'specialty-cards'
  | 'tokens'
  | 'full-rules'
  | 'reference-sheet'
  | 'player-boards';

export interface PrintTemplateDefinition {
  id: PrintTemplateId;
  label: string;
  description: string;
  href: string;
}

export const printTemplates: PrintTemplateDefinition[] = [
  {
    id: 'crafting-tree',
    label: 'Crafting Tree',
    description: 'All recipes and special cards organized by tier.',
    href: 'crafting_tree_v2.html',
  },
  {
    id: 'recipe-cards',
    label: 'Recipe Cards',
    description: 'Printable 2.5 x 3.5 in recipe cards, six per page.',
    href: 'index.html?print=recipe-cards',
  },
  {
    id: 'specialty-cards',
    label: 'Specialty Cards',
    description: 'Printable specialty and blueprint cards, six per page.',
    href: 'index.html?print=specialty-cards',
  },
  {
    id: 'tokens',
    label: 'Tokens',
    description: 'Material, tag, and tracker tokens for tabletop play.',
    href: 'index.html?print=tokens',
  },
  {
    id: 'full-rules',
    label: 'Full Rules',
    description: 'Full rules reference derived from live game data.',
    href: 'index.html?print=full-rules',
  },
  {
    id: 'reference-sheet',
    label: 'Player Reference Sheet',
    description: 'Quick rules and scoring reference on US Letter.',
    href: 'index.html?print=reference-sheet',
  },
  {
    id: 'player-boards',
    label: 'Player Boards',
    description: 'Five tabletop player boards for the live 5-seat baseline.',
    href: 'index.html?print=player-boards',
  },
];
