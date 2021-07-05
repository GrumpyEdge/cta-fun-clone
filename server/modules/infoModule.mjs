/* @flow */

/* :: import type { DiscordPlayerMessageHandlerPropsType,  ReducerProps } from '../types' */

import { ALL_HEROS } from "../../web-app/src/shared/constants/heros.mjs";
import { floozEmoji } from "../../web-app/src/shared/constants/emoji.mjs";
import { splitArrIntoChunks } from "../../web-app/src/shared/utils/utils.mjs";

export const infoModule = {
  handler: async (
    { input, reply } /* :DiscordPlayerMessageHandlerPropsType<> */
  ) => {
    if (input.startsWith(".help")) {
      /* 

**.offers** to check available offers. - NOT IMPLEMENTED
**.staging** to check staging actions - NOT IMPLEMENTED
**.arena** to participate in arena. - NOT IMPLEMENTED
**.dungeon** to farm dungeon boss. - NOT IMPLEMENTED */
      await reply(`
**.nextday** to complete this day and start next one
**.blitz** to check blitz status
**.info** to check your status
**.evolution** to see commands related to heros evolution
**.heros** [element] to see your heros
**.flooz** to check how to buy ${floozEmoji}
**.chests** to check what chests you can open today.
**.names** to see all hero names
**.pvp** to see arena related commands
**.guild** to see guild related commands`);
      return true;
    } else if (input.startsWith(".names")) {
      const chunks = splitArrIntoChunks(33, ALL_HEROS);
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        await reply(
          chunk
            .map((h) => `${h.emoji} ${h.shortName} ${h.nameNoSpace}`)
            .join("\n")
        );
      }
      return true;
    }
  },
  reducer: ({ state } /* : ReducerProps<{ type:string }> */) => {
    return state;
  },
};
