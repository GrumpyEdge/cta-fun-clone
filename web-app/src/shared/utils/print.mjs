/* @flow */

/* :: import type { ROHerosStateForCharacter } from '../../../../server/types' */

import { ALL_HEROS } from "../constants/heros.mjs"
import {
  medalEmoji,
  evEmoji,
  evAwWepEmojiesMap,
} from "../constants/emoji.mjs"
import { REQUIRED_MEDALS } from "../constants/constants.mjs"
import { splitArrIntoChunks } from "./utils.mjs"

export const printStars = (
  ev /* :number */,
  aw /* :number */,
  weapon /* :number */
) => {
  return evAwWepEmojiesMap[`${ev}${aw}${weapon}`];
};

export const printMedals = (medals /* :number */) => {
  const result = [];
  REQUIRED_MEDALS.forEach((requiredForNextStar) => {
    if (medals >= requiredForNextStar) {
      medals -= requiredForNextStar;
      result.push(evEmoji);
    }
  });
  return result.join("") + (medals ? ` ${medals}${medalEmoji}` : "");
};

export const printHeros = (
  heros /* :$ReadOnly<{ [heroName: string]: $ReadOnly<{ ev: number, aw: number, weapon: number }> }> */
) => {
  const herosByStar = ALL_HEROS.filter(({ name }) => heros[name])
    .map(({ name, emoji }) => ({
      name,
      emoji,
      ev: heros[name].ev,
      aw: heros[name].aw,
      weapon: heros[name].weapon,
    }))
    .reduce((a, h) => {
      const key = `${h.ev}${h.aw}${h.weapon}`;
      if (!a[key]) {
        a[key] = [];
      }
      a[key].push(h);
      return a;
    }, {});

  let current = "";
  const result = [];

  Object.keys(herosByStar)
    .sort(
      (starsStr1, starsStr2) => parseInt(starsStr2[0]) - parseInt(starsStr1[0])
    )
    .forEach((starsStr) => {
      const herosForThisStar = herosByStar[starsStr];
      const { aw, ev, weapon } = herosForThisStar[0];

      splitArrIntoChunks(10, herosForThisStar).forEach((chunk) => {
        const additional = `${printStars(
          ev,
          aw,
          weapon
        )} ${chunk.map((hero) => hero.emoji).join("")}`;

        const next = current + additional + "\n";
        if (next.length > 1990) {
          result.push(current);
          current = "More heros:\n" + additional + "\n";
        } else {
          current = next;
        }
      });
    });

  if (current) {
    result.push(current);
  }
  return result;
};
