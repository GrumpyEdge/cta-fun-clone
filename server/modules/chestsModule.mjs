/* @flow */

/* :: import type { RandomSeeds, Module, FcRareHeroName, HeroName, CharacterState } from '../types' */

import { getTodaysBlitz } from "../../web-app/src/shared/utils/getTodaysBlitzHero.mjs";
import {
  nextRandom,
  isRndSuccess,
  getRandomHeroName,
} from "../../web-app/src/shared/utils/random.mjs";
import { updateCurrentCharacter } from "../../web-app/src/shared/utils/updateCurrentCharacter.mjs";
import {
  getAmountFromUserInput,
  boundaryInt,
} from "../../web-app/src/shared/utils/utils.mjs";
import { checkFlooz } from "./userModule.mjs";
import {
  COMMON_HERO_NAMES,
  FC_EPIC_HERO_NAMES,
  FC_RARE_HERO_NAMES,
  FC_ROTATION,
  HEROS_BY_NAME,
} from "../../web-app/src/shared/constants/heros.mjs";
import { MAX_DAY } from "../../web-app/src/shared/constants/constants.mjs";

/* ::
  type Open_FC_Action = {|
    type: 'OPEN_FORTUNE_CHEST',
    amount: number
  |}
  type Open_BC_Action = {|
    type: 'OPEN_BLITZ_CHEST',
    amount: number
  |}
  type Open_PC_Action = {|
    type: 'OPEN_PREMIUM_CHEST',
    amount: number
  |}

  type ChestsAction = Open_FC_Action | Open_BC_Action | Open_PC_Action
*/

const OPEN_FORTUNE_CHEST = "OPEN_FORTUNE_CHEST";
const OPEN_BLITZ_CHEST = "OPEN_BLITZ_CHEST";
const OPEN_PREMIUM_CHEST = "OPEN_PREMIUM_CHEST";

export const fortuneChestContentsByDay = (() => {
  let randomSeed = 27313663;
  const result = [];
  for (let i = 0; i < MAX_DAY; i++) {
    const common = FC_ROTATION.common[i % FC_ROTATION.common.length];
    const rare1 = FC_ROTATION.rare[i % FC_ROTATION.rare.length];
    let rare2;
    do {
      const { rnd0to1, nextSeed } = nextRandom(randomSeed);
      randomSeed = nextSeed;
      rare2 =
        FC_RARE_HERO_NAMES[
          boundaryInt(
            0,
            FC_RARE_HERO_NAMES.length - 1,
            Math.floor(FC_RARE_HERO_NAMES.length * rnd0to1)
          )
        ];
    } while (rare2 === rare1);
    const epic = FC_ROTATION.epic[i % FC_ROTATION.epic.length];

    result.push({ common, rare1, rare2, epic });
  }
  return result;
})();

export const chestsModule /* :Module<ChestsAction> */ = {
  handler: async ({ input, reply, getActiveCharacterState, addAction }) => {
    if (input.startsWith(".chests")) {
      //**.cci** - To see details for todays next crusher chest - NOT IMPLEMENTED
      // **.occ** - to open crusher chest - NOT IMPLEMENTED
      // **.opc** [number of chests to open (max 500)] - to open premium chest for 80 flooz to get a random 80medals of rare hero + 10medals for other rare hero
      await reply(`
**.fci** To see todays contents of fortune chest
**.ofc** [number of chests to open (max 500)] - to open fortune chest for 200 flooz. Get 50 common, 80 rare, 30 rare, 30 epic medals
`);
      return true;
    } else if (input.startsWith(".fci")) {
      const { common, rare1, rare2, epic } = fortuneChestContentsByDay[
        getActiveCharacterState().day
      ];
      await reply(
        [common, rare1, rare2, epic]
          .map((n /* : string */) => HEROS_BY_NAME[n].emoji)
          .join("")
      );
    } else if (input.startsWith(".ofc")) {
      const amount = getAmountFromUserInput(input);

      if (await checkFlooz(amount * 200, reply, getActiveCharacterState())) {
        const action /* :Open_FC_Action */ = {
          type: OPEN_FORTUNE_CHEST,
          amount,
        };
        await addAction(action);
      }
      return true;
    } else if (input.startsWith(".obc")) {
      const blitz = getTodaysBlitz(getActiveCharacterState().day);
      if (blitz.opened) {
        const amount = getAmountFromUserInput(input);

        if (await checkFlooz(amount * 120, reply, getActiveCharacterState())) {
          const action /* :Open_BC_Action */ = {
            type: OPEN_BLITZ_CHEST,
            amount,
          };
          await addAction(action);
        }
      } else {
        await reply("There is no blitz today");
      }
      return true;
    } else if (input.startsWith(".pc")) {
      const amount = getAmountFromUserInput(input);

      if (await checkFlooz(amount * 80, reply, getActiveCharacterState())) {
        const action /* :Open_PC_Action */ = {
          type: OPEN_PREMIUM_CHEST,
          amount,
        };
        await addAction(action);
      }
      return true;
    }
  },
  reducer: ({ state, action }) => {
    if (action.type === OPEN_BLITZ_CHEST) {
      return updateCurrentCharacter((characterState) => {
        const blitz = getTodaysBlitz(characterState.day);
        if (!blitz.opened) {
          return;
        }
        const blitzHeroName = blitz.heroName;
        let left = action.amount;
        while (left--) {
          const getRndHeroName = () => {
            const hero1IsBlitz = isRndSuccess(
              1 / (FC_RARE_HERO_NAMES.length + 1),
              "blitzChest",
              characterState
            );

            let heroName;

            if (hero1IsBlitz) {
              heroName = blitzHeroName;
            } else {
              heroName = getRandomHeroName(
                FC_RARE_HERO_NAMES,
                "blitzChest",
                characterState
              );
            }
            return heroName;
          };

          const hero1Name = getRndHeroName();

          let hero2Name;
          do {
            hero2Name = getRndHeroName();
          } while (hero1Name === hero2Name && hero2Name !== blitzHeroName);

          characterState.flooz -= 120;
          characterState.heros[hero1Name].medals +=
            50 + (hero1Name === blitzHeroName ? 10 : 0);
          characterState.heros[hero2Name].medals +=
            30 + (hero2Name === blitzHeroName ? 10 : 0);

          if (hero2Name !== blitzHeroName && hero1Name !== blitzHeroName) {
            characterState.heros[blitzHeroName].medals += 10;
          }
        }
      }, state);
    }
    if (action.type === OPEN_FORTUNE_CHEST) {
      return updateCurrentCharacter((characterState) => {
        let left = action.amount;
        while (left--) {
          const { common, rare1, rare2, epic } = fortuneChestContentsByDay[
            characterState.day
          ];

          let dayEpic = isRndSuccess(0.2, "fortuneChest", characterState);
          let dayRare2 = isRndSuccess(0.3, "fortuneChest", characterState);
          let dayRare1 = isRndSuccess(0.5, "fortuneChest", characterState);
          let dayCommon = isRndSuccess(0.9, "fortuneChest", characterState);

          let counter = [dayCommon, dayRare1, dayRare2, dayEpic].filter(
            (x) => x
          ).length;
          while (counter < 2) {
            counter++;
            if (!dayCommon) {
              dayCommon = true;
              continue;
            }
            if (!dayRare1) {
              dayRare1 = true;
              continue;
            }
          }

          const hero1Name = dayCommon
            ? common
            : getRandomHeroName(
                COMMON_HERO_NAMES,
                "fortuneChest",
                characterState
              );
          let hero2Name;
          let hero3Name;
          do {
            hero2Name = dayRare1
              ? rare1
              : getRandomHeroName(
                  FC_RARE_HERO_NAMES,
                  "fortuneChest",
                  characterState
                );
            hero3Name = dayRare2
              ? rare2
              : getRandomHeroName(
                  FC_RARE_HERO_NAMES,
                  "fortuneChest",
                  characterState
                );
          } while (hero3Name === hero2Name);
          const hero4Name = dayEpic
            ? epic
            : getRandomHeroName(
                FC_EPIC_HERO_NAMES,
                "fortuneChest",
                characterState
              );

          characterState.flooz -= 200;
          characterState.heros[hero1Name].medals += 50;
          characterState.heros[hero2Name].medals += 50;
          characterState.heros[hero3Name].medals += 30;
          characterState.heros[hero4Name].medals += 30;
        }
      }, state);
    }
    if (action.type === OPEN_PREMIUM_CHEST) {
      let left = action.amount;
      return updateCurrentCharacter((characterState) => {
        while (left--) {
          const hero1Name = getRandomHeroName(
            FC_RARE_HERO_NAMES,
            "premiumChest",
            characterState
          );
          const hero2Name = getRandomHeroName(
            FC_RARE_HERO_NAMES,
            "premiumChest",
            characterState
          );

          characterState.flooz -= 80;
          characterState.heros[hero1Name].medals += 80;
          characterState.heros[hero2Name].medals += 10;
        }
      }, state);
    }
    return state;
  },
};