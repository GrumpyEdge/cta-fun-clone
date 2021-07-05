/* @flow */

/* :: 
import {
  type HeroName,
  type Teams,
  type HeroProgress,
  type OwnedHeroRecord,
} from "../../../../server/types";
 */
import { getRuneProgressMult } from "./runes.mjs";

const FULL_RUNE_SET_POWER_BONUS = 0.3;

export const runePowerGainByStarLvl = (starLevel /* : number */) => {
  return 0.02 + (starLevel * 1) / 60;
};

export const getRunesPowerMultiplier = (
  weapon /* : number */,
  averageRuneStars /* : number */,
  averageRuneLvlProgress /* : number */
) => {
  const runeProgress = getRuneProgressMult(
    averageRuneLvlProgress,
    averageRuneStars
  );
  const setBonus = FULL_RUNE_SET_POWER_BONUS * Math.floor(weapon / 3);
  return (
    1 +
    setBonus +
    weapon * runePowerGainByStarLvl(averageRuneStars) * runeProgress
  );
};

const getBasePower = (ev, aw) => {
  let power = 200;

  for (let i = 1; i < ev; i++) {
    power *= 2;
  }
  for (let i = 0; i < aw; i++) {
    power *= 1.5;
  }
  return power;
};

export const getHeroPower = (hero /* : HeroProgress */) => {
  const power = getBasePower(hero.ev, hero.aw);

  const runePowerMultiplier = getRunesPowerMultiplier(
    hero.weapon,
    hero.averageRuneStars,
    hero.averageRuneLvlProgress
  );

  return Math.round(power * runePowerMultiplier);
};

export const getHeroPowerDetailed = (hero /* : OwnedHeroRecord */) => {
  const power = getBasePower(hero.ev, hero.aw);

  return power// Math.round(power * runePowerMultiplier);
};

export const getTeamPower = (team /* :$ReadOnlyArray<HeroProgress | OwnedHeroRecord> */) =>
  team.reduce((total, h) => {
    return total + (h.runesStats ? getHeroPowerDetailed(h) : getHeroPower(h));
  }, 0);
