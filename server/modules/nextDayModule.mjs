/* @flow */

/* :: import type { HeroName, ROCharacterState, CharacterState, DiscordPlayerMessageHandlerPropsType,  ReducerProps, UserState } from '../types' */

import { getArenaOpenedAndDay } from "../../web-app/src/shared/utils/arena.mjs";
import { RARITY } from "../../web-app/src/shared/constants/constants.mjs";
import { getRandomHeroName } from "../../web-app/src/shared/utils/random.mjs";
import { getRandomNumberFrom0ToN } from "../../web-app/src/shared/utils/random.mjs";
import { todayDate } from "../../web-app/src/shared/utils/variables.mjs";
import {
  chestGoldEmoji,
  chestWoodEmoji,
  floozEmoji,
  chestWaterEmoji,
  chestFireEmoji,
  chestEarthEmoji,
  chestRuneEmoji,
  chestPremiumEmoji,
  luckyTokenEmoji,
  cataCommonEmoji,
  chestSilverEmoji,
  chestLightEmoji,
  chestDarkEmoji,
  coinArenaEmoji,
} from "../../web-app/src/shared/constants/emoji.mjs";
import {
  getEmojiByHeroName,
  ALL_HEROS,
} from "../../web-app/src/shared/constants/heros.mjs";

import Discord from "discord.js";
import { updateCurrentCharacter } from "../../web-app/src/shared/utils/updateCurrentCharacter.mjs";
import { spenderTypes } from "../../web-app/src/shared/constants/spenderTypes.mjs";
import { getTodaysBlitz } from "../../web-app/src/shared/utils/getTodaysBlitzHero.mjs";

const NEXT_DAY = "NEXT_DAY";

/* ::
type HerosInDailyRewardsPool = "Merlinus" |
    "Luka" |
    "Kasai" |
    "Goddess" |
    "Arcana" |
    "Black Beard" |
    "Dark Hunter" |
    "Fire Monk" |
    "Robin Hood" |
    "Pirato" |
    "Kage"

type Reward = 
| {| type: "water_chest", amount: number |} 
| {| type: "rune_chest", amount: number |} 
| {| type: "fire_chest", amount: number |} 
| {| type: "flooz", amount: number |} 
| {| type: "earth_chest", amount: number |} 
| {| type: "rune_chest", amount: number |} 
| {| type: "lucky_token", amount: number |} 
| {| type: "common_weapon_cat", amount: number |} 
| {| type: "silver_chest", amount: number |} 
| {| type: "earth_chest", amount: number |} 
| {| type: "hero_medals", heroName: HerosInDailyRewardsPool, amount: number |} 
| {| type: "premium_chest", amount: number |} 
*/

const getMainDailyReward = (day) /* :Reward */ => {
  const dayOfWeek = day % 7;
  switch (dayOfWeek) {
    case 0:
      return { type: "water_chest", amount: 1 };
    case 1:
      return { type: "rune_chest", amount: 2 };
    case 2:
      return { type: "fire_chest", amount: 1 };
    case 3:
      return { type: "flooz", amount: 30 };
    case 4:
      return { type: "earth_chest", amount: 1 };
    case 5:
      return { type: "rune_chest", amount: 2 };
    default:
      return { type: "lucky_token", amount: 5 };
  }
};

const getSecondaryDailyReward = (day) /* :Reward */ => {
  const dayOfWeek = day % 7;
  switch (dayOfWeek) {
    case 3:
    case 6:
      return { type: "common_weapon_cat", amount: 5 };
    default:
      return { type: "flooz", amount: 25 };
  }
};

const dungeonsAvailabilityMap = {
  fire: [0, 2, 5],
  light: [1, 3, 5],
  water: [2, 4, 6],
  earth: [1, 3, 6],
  dark: [0, 4, 6],
};

const getDungeonsHeroMedals = (
  characterState /* CharacterState */,
  isDoubleEvent /* :bool */ // eslint-disable-line
) => {
  const {
    dungeonsPriority1,
    dungeonsPriority2,
    dungeonsPriority3,
    dungeonsPriority4,
    dungeonsPriority5,
  } = characterState; // eslint-disable-line

  const priorities = [
    dungeonsPriority1,
    dungeonsPriority2,
    dungeonsPriority3,
    dungeonsPriority4,
    dungeonsPriority5,
  ];

  const dayOfWeek = characterState.day % 7;

  let elementToFarmToday = "dark";
  for (let element of priorities) {
    if (dungeonsAvailabilityMap[element].includes(dayOfWeek)) {
      elementToFarmToday = element;
      break;
    }
  }

  const commonHerosPool = ALL_HEROS.filter((h) => {
    if (h.elementKind !== elementToFarmToday) return false;
    if (h.rarity === RARITY.COMMON) return true;
    return false;
  }).map((h) => h.name);
  const herosPool = ALL_HEROS.filter((h) => {
    if (h.elementKind !== elementToFarmToday) return false;
    if (h.rarity === RARITY.COMMON) return true;

    const ownedThisHero = characterState.heros[h.name].ev > 0;
    if (ownedThisHero) return true;
    return false;
  }).map((h) => h.name);

  const receivedMedalsMap = {};

  let numberOfAdditionalTicketBuys = 0;

  const desiredAmountOfBuys = isDoubleEvent
    ? characterState.numberOfAdditionalDungeonTicketBuysX2Day
    : characterState.numberOfAdditionalDungeonTicketBuysNormalDay;
  let floozCost = 0;
  while (numberOfAdditionalTicketBuys < desiredAmountOfBuys) {
    numberOfAdditionalTicketBuys += 1;
    const nextIterationPrice = numberOfAdditionalTicketBuys * 20;
    floozCost += nextIterationPrice;

    if (floozCost > characterState.flooz) {
      floozCost -= nextIterationPrice;
      break;
    }
  }

  const rounds = 72 + numberOfAdditionalTicketBuys * 10;

  const process = (pool) => {
    for (let i = 0; i <= rounds; i++) {
      const heroName = getRandomHeroName(pool, "dungeons", characterState);
      if (!receivedMedalsMap[heroName]) {
        receivedMedalsMap[heroName] = 0;
      }
      receivedMedalsMap[heroName] += isDoubleEvent ? 2 : 1;
    }
  };

  process(commonHerosPool);
  process(herosPool);

  let elementEmoji = chestDarkEmoji;

  switch (elementToFarmToday) {
    case "fire":
      elementEmoji = chestFireEmoji;
      break;
    case "earth":
      elementEmoji = chestEarthEmoji;
      break;
    case "water":
      elementEmoji = chestWaterEmoji;
      break;
    case "dark":
      elementEmoji = chestDarkEmoji;
      break;
    case "light":
      elementEmoji = chestLightEmoji;
      break;
    default:
      (elementToFarmToday /*:empty */);
  }

  return {
    receivedMedalsMap,
    floozCost,
    elementEmoji,
    isDoubleEvent,
  };
};

const getCurrentX2Event = (day /* :number */) => {
  const cycle = day % 16;
  const eventIndex = Math.floor(cycle / 4);
  const dayOfEvent = cycle % 4;
  if (dayOfEvent >= 2) return null;

  switch (eventIndex) {
    case 0:
      return "flooz";
    case 1:
      return "prisms";
    case 2:
      return "expeditions";
    case 3:
      return "dungeons";
  }

  return null;
};

const getLoginReward = (day) /* :Reward */ => {
  const HerosInPool /* :HerosInDailyRewardsPool[] */ = [
    "Merlinus",
    "Luka",
    "Kasai",
    "Goddess",
    "Arcana",
    "Black Beard",
    "Dark Hunter",
    "Fire Monk",
    "Robin Hood",
    "Pirato",
    "Kage",
  ];

  const heroOfMonth = HerosInPool[Math.floor(day / 30) % HerosInPool.length];
  const defaultReward = { type: "flooz", amount: 10 };
  switch ((day % 30) + 1) {
    case 1:
      return defaultReward;
    case 2:
      return { type: "silver_chest", amount: 2 };
    case 3:
      return defaultReward;
    case 4:
      return defaultReward;
    case 5:
      return { type: "flooz", amount: 20 };
    case 6:
      return defaultReward;
    case 7:
      return { type: "silver_chest", amount: 3 };
    case 8:
      return defaultReward;
    case 9:
      return defaultReward;
    case 10:
      return { type: "flooz", amount: 30 };
    case 11:
      return defaultReward;
    case 12:
      return { type: "silver_chest", amount: 4 };
    case 13:
      return defaultReward;
    case 14:
      return defaultReward;
    case 15:
      return { type: "flooz", amount: 40 };
    case 16:
      return defaultReward;
    case 17:
      return { type: "earth_chest", amount: 1 };
    case 18:
      return defaultReward;
    case 19:
      return {
        type: "hero_medals",
        heroName: heroOfMonth,
        amount: 10,
      };
    case 20:
      return { type: "flooz", amount: 50 };
    case 21:
      return defaultReward;
    case 22:
      return { type: "water_chest", amount: 1 };
    case 23:
      return defaultReward;
    case 24:
      return { type: "hero_medals", heroName: heroOfMonth, amount: 20 };
    case 25:
      return { type: "flooz", amount: 60 };
    case 26:
      return defaultReward;
    case 27:
      return { type: "fire_chest", amount: 1 };
    case 28:
      return { type: "premium_chest", amount: 1 };
    case 29:
      return { type: "hero_medals", heroName: heroOfMonth, amount: 30 };
    case 30:
      return { type: "flooz", amount: 100 };
    default:
      return defaultReward;
  }
};

const getNextDaysRewardsFromDay = (characterState /* :CharacterState */) => {
  const x2Event = getCurrentX2Event(characterState.day);
  const is2xFloozEvent = x2Event === "flooz";

  const goldenChestsReward =
    5 * 4 +
    3 * 6 +
    2 * 30 +
    Math.round(
      getRandomNumberFrom0ToN(30, "nextDayGoldenChests", characterState)
    );
  const loginReward = getLoginReward(characterState.day);
  const dailyPack1Flooz = characterState.dailyPack1SubscriptionDays ? 35 : 0;
  const dailyPack2Flooz = characterState.dailyPack2SubscriptionDays ? 120 : 0;

  return {
    main: getMainDailyReward(characterState.day),
    secondary: getSecondaryDailyReward(characterState.day),
    dungeonRewards: getDungeonsHeroMedals(
      characterState,
      x2Event === "dungeons"
    ),
    goldChestsFlooz: (is2xFloozEvent ? 3 : 1) * goldenChestsReward,
    woodenChestsFlooz:
      (is2xFloozEvent ? 2 : 1) *
      (10 + getRandomNumberFrom0ToN(25, "nextDayWoodenChests", characterState)),
    loginReward,
    dailyPack1Flooz,
    dailyPack2Flooz,
  };
};

const printReward = (reward /* :Reward */) => {
  const print = (emoji) =>
    `${reward.amount > 1 ? `${reward.amount} ` : ""}${emoji}`;
  switch (reward.type) {
    case "water_chest": {
      return print(chestWaterEmoji);
    }
    case "fire_chest": {
      return print(chestFireEmoji);
    }
    case "earth_chest": {
      return print(chestEarthEmoji);
    }
    case "rune_chest": {
      return print(chestRuneEmoji);
    }
    case "premium_chest": {
      return print(chestPremiumEmoji);
    }
    case "flooz": {
      return print(floozEmoji);
    }
    case "lucky_token": {
      return print(luckyTokenEmoji);
    }
    case "common_weapon_cat": {
      return print(cataCommonEmoji);
    }
    case "silver_chest": {
      return print(chestSilverEmoji);
    }
    case "hero_medals": {
      return print(getEmojiByHeroName(reward.heroName));
    }
    default:
      (reward.type /*:empty */);
      return "";
  }
};

const getDayStatusMsg = (day) => {
  let tomorrow = "";

  const x2Event = getCurrentX2Event(day);

  let x2Emoji = "";
  switch (x2Event) {
    case "flooz":
      x2Emoji = floozEmoji;
      break;
    case "expeditions":
      x2Emoji = "Expeditions"; // TODO x2 expeditions emoji for next day result
      break;
    case "dungeons":
      x2Emoji = "Dungeons"; // TODO x2 dungeons emoji for next day
      break;
    case null:
    case "prisms":
      break;
    default:
      (x2Event /*:empty */);
  }

  if (x2Emoji) {
    tomorrow += `${x2Emoji} x2\n`;
  }

  const blitz = getTodaysBlitz(day);

  if (blitz.opened) {
    tomorrow += `${getEmojiByHeroName(blitz.heroName)} Blitz opened, day ${
      blitz.blitzDay + 1
    }\n`;
  }

  const arena = getArenaOpenedAndDay(day);

  if (arena.opened) {
    tomorrow += `${coinArenaEmoji} Arena opened, day ${arena.arenaDay + 1}\n`;
  }

  return tomorrow;
};

export const nextDayModule = {
  handler: async (
    {
      input,
      addAction,
      getActiveCharacterState,
      getActiveCharacterStateMutableCopy,
      reply,
    } /* :DiscordPlayerMessageHandlerPropsType<{ type: 'NEXT_DAY' }> */
  ) => {
    if (input.startsWith(".today")) {
      const { day } = getActiveCharacterState();
      await reply(`Today, ${todayDate(day)}
${getDayStatusMsg(day)}`);
      return true;
    } else if (input.startsWith(".nextday")) {
      const {
        woodenChestsFlooz,
        goldChestsFlooz,
        main,
        secondary,
        loginReward,
        dailyPack1Flooz,
        dailyPack2Flooz,
        dungeonRewards,
        // next day will change character random seeds, but we want the ones before
      } = getNextDaysRewardsFromDay(getActiveCharacterStateMutableCopy());

      const characterState = getActiveCharacterState();

      const makeDailyPackLine = (n, amount, daysRemainingProp) =>
        amount
          ? `\nReceived ${dailyPack1Flooz} ${floozEmoji} from Daily Pack ${n} ${characterState[daysRemainingProp]} Days remaining.\n`
          : "";

      const dailyPacksPart = `${makeDailyPackLine(
        1,
        dailyPack1Flooz,
        "dailyPack1SubscriptionDays"
      )}${makeDailyPackLine(2, dailyPack2Flooz, "dailyPack2SubscriptionDays")}`;

      const generalRewards = `${woodenChestsFlooz} ${floozEmoji} from ${chestWoodEmoji}
${goldChestsFlooz} ${floozEmoji} from ${chestGoldEmoji}${dailyPacksPart}
${printReward(main)} and ${printReward(secondary)} from Daily Quest
${printReward(loginReward)} from Login reward`;

      const own = `${characterState.flooz}${floozEmoji}`;
      // $FlowFixMe
      const dungeonsMedals = Object.keys(dungeonRewards.receivedMedalsMap)
        .map((heroName /* :HeroName */) => {
          const amount = dungeonRewards.receivedMedalsMap[heroName];
          return `${getEmojiByHeroName(heroName)}${amount ? `x${amount}` : ""}`;
        })
        .join(" ");

      const confirmedDaySwitch = input.includes("-confirm");

      let dungeons = "";
      if (confirmedDaySwitch) {
        dungeons =
          (dungeonRewards.floozCost
            ? `Spent ${dungeonRewards.floozCost}${floozEmoji} for additional tickets\n`
            : "") + dungeonsMedals;
      } else {
        if (dungeonRewards.isDoubleEvent) {
          dungeons += `\nToday is x2 event!`;
        }
        dungeons = `Todays element is ${dungeonRewards.elementEmoji}`;
        if (dungeonRewards.floozCost) {
          dungeons += `\nAnd spend ${dungeonRewards.floozCost} additionally for extra tickets.`;
        }
      }

      let embedMsg = new Discord.MessageEmbed()
        .setColor("#0099ff")
        .addFields(
          {
            name: confirmedDaySwitch ? "General rewards:" : "You will get:",
            value: generalRewards,
          },
          { name: "Dungeons results:", value: dungeons },
          {
            name: confirmedDaySwitch ? "You own:" : "You will own:",
            value: own,
          }
        )
        .setFooter(
          `Today: ${todayDate(characterState.day)}${
            confirmedDaySwitch ? ` -> ${todayDate(characterState.day + 1)}` : ""
          }`
        );

      const tomorrow = getDayStatusMsg(characterState.day + 1);

      if (tomorrow) {
        embedMsg = embedMsg.addField("Tomorrow:", tomorrow);
      }

      if (confirmedDaySwitch) {
        embedMsg = embedMsg.setTitle(`Results for day ${characterState.day}`);
        await addAction({ type: NEXT_DAY });
      } else {
        embedMsg = embedMsg.setTitle(
          `Ready to end the day ${characterState.day}?`
        );
        embedMsg = embedMsg.setDescription(
          `\`.nextday -confirm\` to process to next day\n`
        );
      }

      reply(embedMsg);
      return true;
    }
  },
  reducer: ({ state, action } /* : ReducerProps<{ type: string }> */) => {
    if (action.type === NEXT_DAY) {
      return updateCurrentCharacter((characterState) => {
        const {
          goldChestsFlooz,
          woodenChestsFlooz,
          main,
          secondary,
          loginReward,
          dailyPack1Flooz,
          dailyPack2Flooz,
          dungeonRewards,
        } = getNextDaysRewardsFromDay(characterState);

        characterState.day += 1;
        characterState.flooz +=
          dailyPack1Flooz +
          dailyPack2Flooz +
          goldChestsFlooz +
          woodenChestsFlooz -
          dungeonRewards.floozCost;

        //$FlowFixMe
        Object.keys(dungeonRewards.receivedMedalsMap).forEach((
          heroName /* :HeroName */
        ) => {
          characterState.heros[heroName].medals +=
            dungeonRewards.receivedMedalsMap[heroName];
        });

        if (characterState.dailyPack1SubscriptionDays > 0) {
          characterState.dailyPack1SubscriptionDays--;
        }

        if (characterState.dailyPack2SubscriptionDays > 0) {
          characterState.dailyPack2SubscriptionDays--;
        }
        characterState.usd +=
          characterState.day % 30 === 0
            ? spenderTypes[characterState.spenderType].perMonth
            : 0;

        const addReward = (reward) => {
          switch (reward.type) {
            case "water_chest": {
              characterState.waterChests += reward.amount;
              break;
            }
            case "fire_chest": {
              characterState.fireChests += reward.amount;
              break;
            }
            case "earth_chest": {
              characterState.earthChests += reward.amount;
              break;
            }
            case "rune_chest": {
              characterState.runeChests += reward.amount;
              break;
            }
            case "premium_chest": {
              characterState.premiumChests += reward.amount;
              break;
            }
            case "flooz": {
              characterState.flooz += reward.amount;
              break;
            }
            case "lucky_token": {
              characterState.luckyToken += reward.amount;
              break;
            }
            case "common_weapon_cat": {
              characterState.commonWeaponCat += reward.amount;
              break;
            }
            case "silver_chest": {
              characterState.commonWeaponCat += reward.amount;
              break;
            }
            case "hero_medals": {
              if (characterState.heros[reward.heroName]) {
                characterState.heros[reward.heroName].medals += reward.amount;
              } else {
                console.log("Reward with invalid heroName", reward.heroName);
              }
              break;
            }
            default:
              (reward.type /*:empty */);
          }
        };

        addReward(main);
        addReward(secondary);
        addReward(loginReward);
      }, state);
    }
    return state;
  },
};
