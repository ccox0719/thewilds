import type { GameState, MarketState, MaterialType } from '../types';
import { config } from '../data/config';
import { createRNG } from '../utils/rng';
import { addLog } from './state';

function buildBag(bagComposition: Partial<Record<MaterialType, number>>): MaterialType[] {
  const bag: MaterialType[] = [];
  for (const [material, count] of Object.entries(bagComposition) as [MaterialType, number][]) {
    for (let i = 0; i < count; i++) {
      bag.push(material);
    }
  }
  return bag;
}

export function drawFromBag(
  state: GameState,
  count: number,
): { drawn: MaterialType[]; newState: GameState } {
  let bag = state.bagRemaining.length >= count ? [...state.bagRemaining] : buildBag(state.scenario.bagComposition);
  const rng = createRNG(state.rngSeed + state.round * 1000 + bag.length);
  const drawn: MaterialType[] = [];

  for (let i = 0; i < count; i++) {
    if (bag.length === 0) {
      bag = buildBag(state.scenario.bagComposition);
      if (bag.length === 0) break;
    }
    const index = Math.floor(rng.next() * bag.length);
    drawn.push(bag.splice(index, 1)[0]);
  }

  return { drawn, newState: { ...state, bagRemaining: bag } };
}

export function resolveMarketOverflow(market: MarketState, cap: number): MarketState {
  if (market.available.length <= cap) return market;
  const excess = market.available.length - cap;
  return {
    available: market.available.slice(excess),
    roundDrawn: market.roundDrawn.slice(excess),
  };
}

export function runDraftPhase(state: GameState): GameState {
  const playerCount = state.players.length;
  const marketDrawCount = playerCount * 2 + 2;

  const { drawn: marketDraw, newState: afterMarketDraw } = drawFromBag(state, marketDrawCount);
  const newMarket: MarketState = {
    available: [...state.market.available, ...marketDraw],
    roundDrawn: [...state.market.roundDrawn, ...marketDraw.map(() => state.round)],
  };
  let currentState = { ...afterMarketDraw, market: resolveMarketOverflow(newMarket, config.marketCapSize) };
  if (marketDraw.length > 0) {
    currentState = addLog(currentState, 'system', 'draft-market', `Drew ${marketDraw.join(', ')} to market`);
  }

  for (const playerId of currentState.turnOrder) {
    const player = currentState.players.find((pl) => pl.id === playerId);
    if (!player || player.collapsed) continue;

    const { drawn: privateDraw, newState: afterPrivate } = drawFromBag(currentState, config.materialsPrivateDrawPerRound);
    currentState = afterPrivate;

    if (privateDraw.length > 0) {
      const material = privateDraw[0];
      currentState = {
        ...currentState,
        players: currentState.players.map((pl) =>
          pl.id === playerId
            ? {
                ...pl,
                inventory: {
                  ...pl.inventory,
                  [material]: (pl.inventory[material] ?? 0) + 1,
                },
              }
            : pl,
        ),
      };
      currentState = addLog(currentState, playerId, 'private-draw', `Drew ${material} privately`);
    }
  }

  return currentState;
}

export function takeFromMarket(
  state: GameState,
  playerId: string,
  material: MaterialType,
  detail?: string,
): GameState {
  const marketIndex = state.market.available.indexOf(material);
  if (marketIndex === -1) return state;

  const newAvailable = [...state.market.available];
  const newRoundDrawn = [...state.market.roundDrawn];
  newAvailable.splice(marketIndex, 1);
  newRoundDrawn.splice(marketIndex, 1);

  const updatedPlayers = state.players.map((p) =>
    p.id === playerId
      ? {
          ...p,
          inventory: {
            ...p.inventory,
            [material]: (p.inventory[material] ?? 0) + 1,
          },
        }
      : p,
  );

  let newState: GameState = {
    ...state,
    market: { available: newAvailable, roundDrawn: newRoundDrawn },
    players: updatedPlayers,
  };
  const logDetail = detail ? `Took ${material} from market — ${detail}` : `Took ${material} from market`;
  newState = addLog(newState, playerId, 'market-take', logDetail);
  return newState;
}
