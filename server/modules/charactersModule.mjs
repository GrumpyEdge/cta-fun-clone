/* @flow */

/* :: import type { HeroStateForCharacter, ROCharacterState, Module, DiscordPlayerMessageHandlerPropsType,  ReducerProps } from '../types' */

import { printActiveCharacterState } from "../../web-app/src/shared/utils/user.mjs";
import { ALL_HEROS } from "../../web-app/src/shared/constants/heros.mjs";
import { spenderTypes } from "../../web-app/src/shared/constants/spenderTypes.mjs";

/* ::
type CreateCharacter = {|
  type: 'CREATE_CHARACTER',
  name: string,
  spenderType: 'F' | 'S' | 'M' | 'L',
  randomSeed: number
|} 
type SetActiveCharacter = {|
  type: 'SET_ACTIVE_CHARACTER',
  name: string,
|} 

type CharacterAction = CreateCharacter | SetActiveCharacter
*/

const explainSpenderTypes = async function (reply /* : string => Promise<any> */) {
  const parts = [];
  Object.keys(spenderTypes).forEach((spenderTypeId) => {
    parts.push(
      `send \`.character create ${spenderTypeId} character-name\` if you want character that ${spenderTypes[spenderTypeId].description}`
    );
  });
  await reply(parts.join("\n"));
};

const getCharacterInitialState = (
  spenderTypeId,
  name,
  randomSeed
) /* :ROCharacterState */ => ({
  name,
  day: 0,
  spenderType: spenderTypeId,
  usd: spenderTypes[spenderTypeId].initialBalance,
  flooz: 0,
  dailyPack1SubscriptionDays: 0,
  dailyPack2SubscriptionDays: 0,
  heros: ALL_HEROS.reduce((a, h) => {
    const heroState /* :HeroStateForCharacter */ = {
      medals: h.name === "Luka" ? 80 : 0,
      aw: 0,
      ev: h.name === "Luka" ? 3 : 0,
      desiredEv: null,
      weapon: 1,
    };
    a[(h.name /*:string */)] = heroState;
    return a;
  }, {}),
  luckyToken: 15,
  commonWeaponCat: 0,

  // chests
  waterChests: 0,
  fireChests: 0,
  earthChests: 0,
  runeChests: 0,
  premiumChests: 2,

  numberOfAdditionalDungeonTicketBuysNormalDay: 0,
  numberOfAdditionalDungeonTicketBuysX2Day: 0,
  // dungeon priority
  dungeonsPriority1: "dark",
  dungeonsPriority2: "fire",
  dungeonsPriority3: "earth",
  dungeonsPriority4: "light",
  dungeonsPriority5: "water",

  // starter packs
  boughtStarterPackWater: false,
  boughtStarterPackFire: false,
  boughtStarterPackEarth: false,
  boughtStarterPackLight: false,
  boughtStarterPackDark: false,
  boughtStarterPackFlooz5usd: false,
  boughtStarterPackFlooz10usd: false,
  boughtStarterPackFlooz20usd: false,
  boughtStarterPackFlooz50usd: false,
  boughtStarterPackFlooz100usd: false,

  // random,
  randomSeeds: {
    blitzChest: randomSeed + 1823746,
    fortuneChest: randomSeed - 3238947,
    premiumChest: randomSeed + 384765,
    nextDayGoldenChests: randomSeed - 2389409,
    nextDayWoodenChests: randomSeed + 239084679,
    dungeons: randomSeed + 93789424,
  },
});

const characterNameToUserIdMap = {};

export const charactersModule /* :Module<CharacterAction> */ = {
  handler: async ({
    input,
    reply,
    addAction,
    getUserState,
    getActiveCharacterState,
  }) => {
    const inputParts = input.split(" ");
    if (inputParts[0] === ".character") {
      switch (inputParts[1]) {
        case "create": {
          const spenderType = inputParts[2][0].toUpperCase();
          if (
            (spenderType === "F" ||
              spenderType === "S" ||
              spenderType === "M" ||
              spenderType === "L")
          ) {
            const name = inputParts[3];
            if (!name) {
              await reply(`New character name is not regognized`);
              return true;
            }
            if (name.length > 15) {
              await reply(`"${name}" is too long. Max is 15 characters.`);
              return true;
            }
            if (characterNameToUserIdMap[name]) {
              await reply(`Character with name "${name}" already exist`);
              return true;
            }

            await addAction({
              type: "CREATE_CHARACTER",
              spenderType,
              name,
              randomSeed: Math.round(Math.random() * Date.now()),
            });
            await reply(`Character has been created.
\`.character play ${name}\` to start playing`);
          } else {
            await explainSpenderTypes(reply);
          }
          break;
        }
        case "list": {
          const characterNames = Object.keys(getUserState().characters);
          if (characterNames.length) {
            await reply(`**Your Characters**
${characterNames.map((n) => `\`.character play ${n}\``).join("\n")}`);
          } else {
            await reply("You do not have characters yet");
          }
          break;
        }
        case "play": {
          const name = inputParts[2].toLowerCase();
          const characterNames = Object.keys(getUserState().characters);
          if (
            !characterNames.find((n) => n.toLowerCase() === name.toLowerCase())
          ) {
            await reply(
              `Character with name **${inputParts[2]}** not found in your account`
            );
            return true;
          }
          await addAction({ type: "SET_ACTIVE_CHARACTER", name });
          await reply(`**You playing:**
${printActiveCharacterState(getActiveCharacterState())}`);
          break;
        }
        default: {
          let parts = [];
          if (getUserState().activeCharacterName) {
            parts.push(printActiveCharacterState(getActiveCharacterState()));
          }
          parts.push(`Character management menu
          \`.character create character-name\`
          \`.character list character-name\`
          \`.character play character-name\``);
          await reply(parts.join("\n"));
        }
      }

      return true;
    }
  },
  reducer: ({ state, action, userid }) => {
    if (action.type === "CREATE_CHARACTER") {
      characterNameToUserIdMap[action.name.toLowerCase()] = userid;
      return {
        ...state,
        characters: {
          ...state.characters,
          [action.name.toLowerCase()]: getCharacterInitialState(
            action.spenderType,
            action.name,
            action.randomSeed
          ),
        },
      };
    } else if (action.type === "SET_ACTIVE_CHARACTER") {
      return {
        ...state,
        activeCharacterName: action.name,
      };
    }
    return state;
  },
};
