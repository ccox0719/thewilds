export type PrintTemplateId =
  | 'crafting-tree'
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
    href: '/crafting_tree_v2.html',
  },
  {
    id: 'full-rules',
    label: 'Full Rules',
    description: 'Full rules reference derived from live game data.',
    href: '/?print=full-rules',
  },
  {
    id: 'reference-sheet',
    label: 'Player Reference Sheet',
    description: 'Quick rules and scoring reference on US Letter.',
    href: '/?print=reference-sheet',
  },
  {
    id: 'player-boards',
    label: 'Player Boards',
    description: 'Five tabletop player boards for the live 5-seat baseline.',
    href: '/?print=player-boards',
  },
];
