import type { ComponentType } from 'react';
import { CardsPrintView } from './CardsPrintView';
import { ReferenceSheetsPrintView } from './ReferenceSheetsPrintView';
import { PlayerBoardsPrintView } from './PlayerBoardsPrintView';
import { TokensPrintView } from './TokensPrintView';
import { RulesPrintView } from './RulesPrintView';

export type PrintTemplateId =
  | 'recipe-cards'
  | 'specialty-cards'
  | 'full-rules'
  | 'reference-sheet'
  | 'player-boards'
  | 'tokens-sheet';

export interface PrintTemplateDefinition {
  id: PrintTemplateId;
  label: string;
  description: string;
  Component: ComponentType;
}

export const printTemplates: PrintTemplateDefinition[] = [
  {
    id: 'recipe-cards',
    label: 'Recipe Cards',
    description: 'Print the core recipe deck on 2.5 x 3.5 in cards.',
    Component: () => <CardsPrintView mode="recipes" />,
  },
  {
    id: 'specialty-cards',
    label: 'Specialty Cards',
    description: 'Print starting and earned specialty cards as poker-size cards.',
    Component: () => <CardsPrintView mode="specialties" />,
  },
  {
    id: 'full-rules',
    label: 'Full Rules',
    description: 'Print the full rules reference derived from live game data.',
    Component: RulesPrintView,
  },
  {
    id: 'reference-sheet',
    label: 'Player Reference Sheet',
    description: 'Print a quick rules and scoring reference on US Letter.',
    Component: ReferenceSheetsPrintView,
  },
  {
    id: 'player-boards',
    label: 'Player Boards',
    description: 'Print five tabletop player boards for the live 5-seat baseline.',
    Component: PlayerBoardsPrintView,
  },
  {
    id: 'tokens-sheet',
    label: 'Tokens Sheet',
    description: 'Print material, status, and tracker tokens.',
    Component: TokensPrintView,
  },
];

export const defaultPrintTemplateId: PrintTemplateId = 'recipe-cards';
