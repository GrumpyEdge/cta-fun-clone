/* @flow */

import { BLITZ_DURATION_DAYS } from "../constants/constants.mjs"
import { BLITZ_HERO_NAMES } from "../constants/heros.mjs"

export const getTodaysBlitz = (day /*: number*/) => {
  const week = Math.floor(day / 7);
  const dayOfWeek = day - week * 7;
  if (dayOfWeek >= BLITZ_DURATION_DAYS) {
    return { opened: false };
  }
  return {
    opened: true,
    heroName: BLITZ_HERO_NAMES[week % BLITZ_HERO_NAMES.length],
    blitzDay: dayOfWeek
  }
};
