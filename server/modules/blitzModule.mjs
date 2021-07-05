/* @flow */

/* :: import type { Module } from '../types' */

import { getTodaysBlitz } from '../../web-app/src/shared/utils/getTodaysBlitzHero.mjs'
import { medalEmoji } from "../../web-app/src/shared/constants/emoji.mjs"

export const blitzModule/* :Module<> */= {
  handler: async (
    {
      input,
      reply,
      getActiveCharacterState,
    }
  ) => {
    if (input.startsWith(".blitz")) {
      const blitz = getTodaysBlitz(getActiveCharacterState().day);
      if (blitz.opened) {
        await reply(`This week blitz hero is ${blitz.heroName}
  **.obc** to open blitz chest and get 50 + 30 rare ${medalEmoji} and 10 ${blitz.heroName} ${medalEmoji} for 120 flooz
  `);
      } else {
        await reply("There is no blitz today");
      }
      return true;
    }
  },
  reducer: ({ state }) => {
    return state
  }
};