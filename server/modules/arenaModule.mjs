/* @flow */

/* :: import type { Module, CLS, BattleLogRecord, DiscordPlayerMessageHandlerPropsType, ReducerProps, Hero, HeroProgress, RunesStats, HeroBattleStats, HeroInfoWithBattleProgress, HeroProgressI } from '../types' */

import Discord from "discord.js";

import {
  HEROS_ARENA_TIRES,
  HEROS_BY_NAME,
} from "../../web-app/src/shared/constants/heros.mjs";

const arenaStatesByDayMap = {};

const getArenaStateForToday = (day /*: number*/) => {
  return {
    ...arenaStatesByDayMap[day],
  };
};

export const arenaModule/* :Module<> */ = {
  handler: async (
    { input, reply, getActiveCharacterState }
  ) => {
    if (input.startsWith(".arena")) {
      const arenaState = getArenaStateForToday(getActiveCharacterState().day);
      if (arenaState) {
        await reply("Arena is opened today, but not implemented yet");
      } else {
        await reply("Arena is closed today");
      }
      return true;
    } else if (input.startsWith(".arenatires")) {
      await reply(
        new Discord.MessageEmbed().setColor("#0099ff").addFields(
          ...Object.keys(HEROS_ARENA_TIRES).map((tire) => {
            return {
              name: `Tire ${tire}`,
              value: HEROS_ARENA_TIRES[tire]
                .map((heroName /* :string */) => {
                  const hero = HEROS_BY_NAME[heroName];
                  if (hero) {
                    return hero.emoji;
                  } else {
                    console.log("Arena tire hero name mismatch", heroName);
                    return heroName;
                  }
                })
                .join(""),
            };
          })
        )
      );
      return true;
    }
  },
  reducer: (
    { state }
  ) => {
    return state;
  },
};