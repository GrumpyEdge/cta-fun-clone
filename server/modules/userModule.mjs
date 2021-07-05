/* @flow */

/* :: import type { DiscordPlayerMessageHandlerPropsType,  ROCharacterState, ReducerProps } from '../types' */

import { printActiveCharacterState } from "../../web-app/src/shared/utils/user.mjs"
import { usdEmoji, evEmoji } from "../../web-app/src/shared/constants/emoji.mjs"
import Discord from "discord.js"
import { printHeros } from "../../web-app/src/shared/utils/print.mjs"
import { ALL_HEROS } from "../../web-app/src/shared/constants/heros.mjs"
import { RARITY } from "../../web-app/src/shared/constants/constants.mjs"

export async function checkusd(
  requiredAmount /* :number */,
  reply /* :string => Promise<any> */,
  characterState /* :ROCharacterState */
) {
  if (characterState.usd < requiredAmount) {
    await reply(
      `You do not have enought ${usdEmoji}. Balance: ${characterState.usd}.`
    );
    return false;
  }
  return true;
}

export async function checkFlooz(
  requiredAmount /* :number */,
  reply /* :string => Promise<any> */,
  characterState /* :ROCharacterState */
) {
  if (characterState.flooz < requiredAmount) {
    await reply(
      `You do not have enought Flooz. Balance: ${characterState.flooz}.`
    );
    return false;
  }
  return true;
}

export const userModule = {
  handler: async (
    {
      input,
      reply,
      getActiveCharacterState,
    } /* :DiscordPlayerMessageHandlerPropsType<> */
  ) => {
    if (input.startsWith(".info")) {
      reply(
        new Discord.MessageEmbed().setColor("#0099ff").addFields({
          name: "Info",
          value: printActiveCharacterState(getActiveCharacterState()),
        })
      );
      return true;
    } else if (input.startsWith(".heros")) {
      if (input.includes("element")) {
        const { heros } = getActiveCharacterState();
        const makeValue = (element, rarity) =>
          ALL_HEROS.filter(
            (h) => h.elementKind === element && h.rarity === rarity
          )
            .map((hero) => `${hero.emoji} ${heros[hero.name].medals}`)
            .join(" ");
        reply(
          new Discord.MessageEmbed().setColor("#0099ff").addFields(
            {
              name: "water common",
              value: makeValue("water", RARITY.COMMON),
            },
            { name: "water rare", value: makeValue("water", RARITY.RARE) },
            { name: "water epic", value: makeValue("water", RARITY.EPIC) },
            { name: "fire common", value: makeValue("fire", RARITY.COMMON) },
            { name: "fire rare", value: makeValue("fire", RARITY.RARE) },
            { name: "fire epic", value: makeValue("fire", RARITY.EPIC) },
            {
              name: "earth common",
              value: makeValue("earth", RARITY.COMMON),
            },
            { name: "earth rare", value: makeValue("earth", RARITY.RARE) },
            { name: "earth epic", value: makeValue("earth", RARITY.EPIC) },
            {
              name: "light common",
              value: makeValue("light", RARITY.COMMON),
            },
            { name: "light rare", value: makeValue("light", RARITY.RARE) },
            { name: "light epic", value: makeValue("light", RARITY.EPIC) },
            { name: "dark common", value: makeValue("dark", RARITY.COMMON) },
            { name: "dark rare", value: makeValue("dark", RARITY.RARE) },
            { name: "dark epic", value: makeValue("dark", RARITY.EPIC) }
          )
        );
      } else {
        const { heros } = getActiveCharacterState();

        let prefix = input.includes("all")
          ? "Your heros:\n"
          : `Showing heros 4+${evEmoji} heros only. Use \`.heros all\` to see all\n`;

        const filteredHeros = Object.keys(heros)
          .filter((heroName) =>
            input.includes("all") ? heros[heroName].ev : heros[heroName].ev > 3
          )
          .reduce((a, heroName) => ({ ...a, [heroName]: heros[heroName] }), {});

        const messages = printHeros(filteredHeros);

        for (let m of messages) {
          await reply(prefix + m);
        }

        if (!messages.length) {
          await reply(`No 4+${evEmoji} heros to show. Use \`.heros all\` to see all\n`)
        }
      }

      return true;
    } else if (input.startsWith(".debug")) {
      await reply(
        JSON.stringify(
          { ...getActiveCharacterState(), heros: "hidden" },
          null,
          "   "
        )
      );

      return true;
    }
  },
  reducer: ({ state } /* : ReducerProps<{ type: string }> */) => {
    return state;
  },
};
