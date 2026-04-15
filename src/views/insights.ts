import type { GameState, LogEntry } from '../types';

export function formatLogAction(action: string): string {
  switch (action) {
    case 'draft-market':
      return 'market draw';
    case 'market-take':
      return 'took from market';
    case 'market-pass':
      return 'passed on market';
    case 'private-draw':
      return 'private draw';
    case 'craft':
      return 'crafted';
    case 'maintenance':
      return 'maintenance';
    case 'perk':
      return 'perk';
    case 'card':
      return 'blueprint';
    case 'event':
      return 'event';
    case 'game-over':
      return 'game over';
    default:
      return action;
  }
}

export function getLogActorLabel(state: GameState, entry: LogEntry): string {
  if (entry.playerId === 'system') return 'System';
  const player = state.players.find((p) => p.id === entry.playerId);
  if (!player) return entry.playerId;
  return player.isAI ? `${player.name} (AI)` : `${player.name} (You)`;
}

export function getLatestAIMove(state: GameState): LogEntry | null {
  for (let i = state.log.length - 1; i >= 0; i -= 1) {
    const entry = state.log[i];
    if (entry.playerId === 'system') continue;
    const player = state.players.find((p) => p.id === entry.playerId);
    if (player?.isAI) return entry;
  }
  return null;
}

