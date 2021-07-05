/* @flow */

/* :: import type { HeroName, DiscordPlayerMessageHandlerPropsType,  ReducerProps } from '../types' */

import { updateCurrentCharacter } from "../../web-app/src/shared/utils/updateCurrentCharacter.mjs";
import { ALL_HEROS } from "../../web-app/src/shared/constants/heros.mjs";

const SET_DESIRED_HERO_EVOLUTION = "SET_DESIRED_HERO_EVOLUTION";
/* ::
  type SetDesiredHeroEvAction = {|
    type: 'SET_DESIRED_HERO_EVOLUTION',
    desiredEv: number,
    heroName: HeroName,
  |}

  type HeroAction = SetDesiredHeroEvAction
*/

export const heroModule = {
  handler: async (
    {
      input,
      reply,
      addAction,
    } /* :DiscordPlayerMessageHandlerPropsType<HeroAction> */
  ) => {
    if (input.startsWith(".evolution")) {
      await reply(`By default evolution is happening automatically, Heros good for arena will be evolved to 2,3,4,5,7 stars if you have enough medals. Bad heros will stay at 3 stars unless you override it. Type .arenatires to check what heros are considered good for arena.
**.ev** [hero name] [desired evolution 1 - 7] Hero will have this number of stars if you have enough medals`);
      return true;
    } else if (input.startsWith(".ev ")) {
      const heroName = input.split(" ")[1];
      const desiredEv = parseInt(input.split(" ")[2], 10);
      const hero = ALL_HEROS.find(
        (h) => h.nameNoSpace.toLowerCase() === heroName.toLowerCase()
      );
      if (isNaN(desiredEv) || desiredEv < 1 || desiredEv > 7) {
        await reply(`"${input.split(" ")[2]}" is not valid number of stars`);
      } else if (!hero) {
        await reply(
          `I do not know hero with "${heroName}" name. Check all hero names here **.names**`
        );
      } else {
        const action /* :SetDesiredHeroEvAction */ = {
          type: SET_DESIRED_HERO_EVOLUTION,
          desiredEv,
          heroName: hero.name,
        };
        await addAction(action);
      }
      return true;
    }
  },
  reducer: ({ state, action } /* : ReducerProps<HeroAction> */) => {
    if (action.type === SET_DESIRED_HERO_EVOLUTION) {
      return updateCurrentCharacter((characterState) => {
        characterState.heros[action.heroName].desiredEv = action.desiredEv;
      }, state);
    }
    return state;
  },
};
