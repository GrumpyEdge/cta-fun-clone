/* @flow */

/* :: import type { RandomSeeds, Module, FcRareHeroName, HeroName, CharacterState } from '../../../../server/types' */

import { boundaryInt } from "./utils.mjs"

export const nextRandom = (seed /* :number */) => {
  // Robert Jenkins’ 32 bit integer hash function
  seed = (seed + 0x7ed55d16 + (seed << 12)) & 0xffffffff;
  seed = (seed ^ 0xc761c23c ^ (seed >>> 19)) & 0xffffffff;
  seed = (seed + 0x165667b1 + (seed << 5)) & 0xffffffff;
  seed = ((seed + 0xd3a2646c) ^ (seed << 9)) & 0xffffffff;
  seed = (seed + 0xfd7046c5 + (seed << 3)) & 0xffffffff;
  seed = (seed ^ 0xb55a4f09 ^ (seed >>> 16)) & 0xffffffff;
  const rnd0to1 = (seed & 0xfffffff) / 0x10000000;
  return {
    nextSeed: seed,
    rnd0to1,
  };
};

export const getRandomHeroName = /* ::<T, P: $Keys<RandomSeeds>> */ (
  list /* :$ReadOnlyArray<T> */,
  rndStateProperty /* :P */,
  characterState /* :CharacterState */
) /* :T */ => {
  const { rnd0to1, nextSeed } = nextRandom(
    characterState.randomSeeds[rndStateProperty]
  );
  characterState.randomSeeds[rndStateProperty] = nextSeed;
  const heroIndex = boundaryInt(
    0,
    list.length - 1,
    Math.floor(list.length * rnd0to1)
  );
  return list[heroIndex];
};

export const isRndSuccess = /* ::<P: $Keys<RandomSeeds>> */ (
  chance /* :number */,
  rndStateProperty /* :P */,
  characterState /* :CharacterState */
) /* :bool */ => {
  const { rnd0to1, nextSeed } = nextRandom(
    characterState.randomSeeds[rndStateProperty]
  );
  characterState.randomSeeds[rndStateProperty] = nextSeed;

  if (rnd0to1 <= chance) return true;
  return false;
};

export const getRandomNumberFrom0ToN = /* ::<P: $Keys<RandomSeeds>> */ (
  to /* :number */,
  rndStateProperty /* :P */,
  characterState /* :CharacterState */
) => {
  const { rnd0to1, nextSeed } = nextRandom(
    characterState.randomSeeds[rndStateProperty]
  );
  characterState.randomSeeds[rndStateProperty] = nextSeed;

  return Math.floor((to + 1) * rnd0to1);
};