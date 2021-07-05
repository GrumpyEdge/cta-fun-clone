/* @flow */

/* :: import type { RORunesStats, CLS, BattleLogRecord, DiscordPlayerMessageHandlerPropsType, ReducerProps, Hero, HeroProgress, RunesStats, HeroBattleStats, HeroInfoWithBattleProgress, HeroProgressI } from '../../../../server/types' */

import { boundaryInt } from "./utils.mjs";

export const getRuneProgressMult = (
  averageRuneLvlProgress /* :number */,
  averageRuneStars /* :number */
) => {
  const runeProgress = boundaryInt(
    1,
    2,
    1 + averageRuneLvlProgress / 5 / averageRuneStars
  );

  return runeProgress;
};

export const computerunesStats = /* ::<T: HeroProgressI> */ (
  heroProgress /* :T */
) /* :RORunesStats */ => {
  let stats /* :RunesStats */ = {
    atk: 0,
    def: 0,
    aoe: 0,
    aps: 0,
    ctkrate: 0,
    ctkdmg: 0,
    hp: 0,
    freezeTime: 0,
    freezeChance: 0,
    stunTime: 0,
    stunChance: 0,
    poisonTime: 0,
    poisonChance: 0,
    atkrange: 0,
    mvspd: 0,
    burnChance: 0,
    burnTime: 0,
    dodgerate: 0,
    knightShield: 0,
  };

  for (let i = 0; i < Math.floor(Math.floor(heroProgress.weapon) / 3); i++) {
    const numOfRuneStars =
      Math.min(3, heroProgress.weapon - i * 3) * heroProgress.averageRuneStars;

    switch (heroProgress.runes[i]) {
      case "D":
        stats.atk += 60 + 6 * numOfRuneStars;
        break;
      case "G":
        stats.def += 60 + 6 * numOfRuneStars;
        break;
      case "A":
        stats.aps += 10 + 0.5 * numOfRuneStars;
        break;
      case "V":
        stats.hp += 60 + 6 * numOfRuneStars;
        break;
      case "P":
        stats.ctkrate += 10 + 0.5 * numOfRuneStars;
        break;
      case "R":
        stats.ctkdmg += 50 + 5 * numOfRuneStars;
        break;
      case "E":
        stats.aoe += 10 + 1 * numOfRuneStars;
        break;
      case "N":
        stats.dodgerate += 10 + 0.5 * numOfRuneStars;
        break;
      case "F":
        stats.freezeTime += 20 + 2 * numOfRuneStars;
        break;
      case "C":
        stats.freezeChance += 5 + 0.5 * numOfRuneStars;
        break;
      case "S":
        stats.stunTime += 20 + 2 * numOfRuneStars;
        break;
      case "X":
        stats.stunChance += 5 + 0.5 * numOfRuneStars;
        break;
      case "B":
        stats.burnTime += 20 + 2 * numOfRuneStars;
        break;
      case "I":
        stats.burnChance += 5 + 1 * numOfRuneStars;
        break;
      case "W":
        stats.poisonTime += 20 + 2 * numOfRuneStars;
        break;
      case "Y":
        stats.poisonChance += 5 + 1 * numOfRuneStars;
        break;
      case "K":
        stats.knightShield += 100 + 10 * numOfRuneStars;
        break;
      default:
        // do nothing
        break;
    }
  }

  for (let i = 0; i < heroProgress.weapon; i++) {
    const runeTypeIndex = Math.floor(i / 3);
    const runeProgress = getRuneProgressMult(
      heroProgress.averageRuneLvlProgress,
      heroProgress.averageRuneStars
    );

    switch (heroProgress.runePrimaries[runeTypeIndex]) {
      case "D":
        stats.atk += 6 * heroProgress.averageRuneStars * runeProgress; 
        break;
      case "G":
        stats.def += 6 * heroProgress.averageRuneStars * runeProgress;
        break;
      case "A":
        stats.aps += heroProgress.averageRuneStars * runeProgress;
        break;
      case "V":
        stats.hp += 6 * heroProgress.averageRuneStars * runeProgress;
        break;
      case "R":
        stats.ctkdmg += 5 * heroProgress.averageRuneStars * runeProgress;
        break;
      case "E":
        stats.aoe += 2 * heroProgress.averageRuneStars * runeProgress;
        break;
      case "F":
        stats.freezeTime += 2 * heroProgress.averageRuneStars * runeProgress;
        break;
      case "S":
        stats.stunTime += 2 * heroProgress.averageRuneStars * runeProgress;
        break;
      case "B":
        stats.burnTime += 2 * heroProgress.averageRuneStars * runeProgress;
        break;
      case "W":
        stats.poisonTime += 2 * heroProgress.averageRuneStars * runeProgress;
        break;
      default:
        // do nothing
        break;
    }
  }

  for (let i = 0; i < heroProgress.weapon; i++) {
    const runeProgress = getRuneProgressMult(
      heroProgress.averageRuneLvlProgress,
      heroProgress.averageRuneStars
    );

    let unlockedSecondariesNumber = 0;
    switch (heroProgress.averageRuneStars) {
      case 1:
        if (heroProgress.averageRuneLvlProgress >= 5) {
          unlockedSecondariesNumber = 1;
        }
        break;
      case 2:
        unlockedSecondariesNumber = 1;
        if (heroProgress.averageRuneLvlProgress >= 5) {
          unlockedSecondariesNumber = 2;
        }
        if (heroProgress.averageRuneLvlProgress >= 10) {
          unlockedSecondariesNumber = 3;
        }
        break;
      case 3:
        unlockedSecondariesNumber = 1;
        if (heroProgress.averageRuneLvlProgress >= 5) {
          unlockedSecondariesNumber = 2;
        }
        if (heroProgress.averageRuneLvlProgress >= 10) {
          unlockedSecondariesNumber = 3;
        }
        if (heroProgress.averageRuneLvlProgress >= 15) {
          unlockedSecondariesNumber = 4;
        }
        break;
      case 4:
      case 5:
        unlockedSecondariesNumber = 2;
        if (heroProgress.averageRuneLvlProgress >= 5) {
          unlockedSecondariesNumber = 3;
        }
        if (heroProgress.averageRuneLvlProgress >= 10) {
          unlockedSecondariesNumber = 4;
        }
        break;
      case 6:
        unlockedSecondariesNumber = 3;
        if (heroProgress.averageRuneLvlProgress >= 5) {
          unlockedSecondariesNumber = 4;
        }
        break;
      default:
        // do nothing
        break;
    }

    for (let i = 0; i < unlockedSecondariesNumber; i++) {
      const secondaryType = heroProgress.runeSecondaries[i];

      let secondaryMult = 1;
      if (heroProgress.averageRuneStars === 4) {
        if (
          (i === 1 && heroProgress.averageRuneLvlProgress >= 15) ||
          (i === 2 && heroProgress.averageRuneLvlProgress >= 20)
        ) {
          secondaryMult = 2;
        }
      }
      if (heroProgress.averageRuneStars === 5) {
        if (
          (i === 1 && heroProgress.averageRuneLvlProgress >= 15) ||
          (i === 2 && heroProgress.averageRuneLvlProgress >= 20) ||
          (i === 3 && heroProgress.averageRuneLvlProgress >= 25)
        ) {
          secondaryMult = 2;
        }
      }
      if (heroProgress.averageRuneStars === 6) {
        if (
          (i === 1 && heroProgress.averageRuneLvlProgress >= 10) ||
          (i === 2 && heroProgress.averageRuneLvlProgress >= 15) ||
          (i === 3 && heroProgress.averageRuneLvlProgress >= 20) ||
          (i === 4 && heroProgress.averageRuneLvlProgress >= 25)
        ) {
          secondaryMult = 2;
        }
      }

      switch (secondaryType) {
        case "D":
          // Power increase (30% + (11%(22%) ~ 36%(72%))) = 41%(52%) ~ 66%(102%) lvl1(maxLvl)
          // set 60 + (18 ~ 108) = 78% ~ 168%
          // primary 18%(36%) ~ 108%(216%) = 18% ~ 216%
          // secondary 2.7%(5.4%) ~ 16.2%(32.4%) = 5.4% ~ 32.4%
          // total 101.4% ~ 416.4%
          // middle dmg = 259%
          // middle power increase = 77%
          // each dmg % = 0.3% power increase
          stats.atk +=
            0.9 * heroProgress.averageRuneStars * runeProgress * secondaryMult;
          break;
        case "G":
          stats.def +=
            0.9 * heroProgress.averageRuneStars * runeProgress * secondaryMult;
          break;
        case "V":
          stats.hp +=
            0.9 * heroProgress.averageRuneStars * runeProgress * secondaryMult;
          break;
        case "L":
          stats.atkrange +=
            0.6 * heroProgress.averageRuneStars * runeProgress * secondaryMult;
          break;
        case "R":
          stats.ctkdmg +=
            0.8 * heroProgress.averageRuneStars * runeProgress * secondaryMult;
          break;
        case "M":
          stats.mvspd +=
            0.3 * heroProgress.averageRuneStars * runeProgress * secondaryMult;
          break;
        default:
          // do nothing
          break;
      }
    }
  }
  return stats;
};
