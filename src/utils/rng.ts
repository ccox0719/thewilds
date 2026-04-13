import type { RNG } from '../types';

// Mulberry32 — fast, seedable, deterministic PRNG
function mulberry32(seed: number) {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRNG(seed: number): RNG {
  const random = mulberry32(seed);

  return {
    next(): number {
      return random();
    },

    pick<T>(array: T[]): T {
      if (array.length === 0) throw new Error('Cannot pick from empty array');
      return array[Math.floor(random() * array.length)];
    },

    shuffle<T>(array: T[]): T[] {
      const result = [...array];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    },
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 32);
}
