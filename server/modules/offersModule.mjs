/* @flow */

/* :: import type { Module } from '../types' */

import { updateCurrentCharacter } from "../../web-app/src/shared/utils/updateCurrentCharacter.mjs";
import { floozEmoji } from "../../web-app/src/shared/constants/emoji.mjs";
import { checkusd } from "./userModule.mjs";

const SUBSCRIBE_FLOOZ_35_15 = "SUBSCRIBE_FLOOZ_35_15";
const SUBSCRIBE_FLOOZ_120_15 = "SUBSCRIBE_FLOOZ_120_15";
const BUY_FLOOZ_5USD = "BUY_FLOOZ_5USD";
const BUY_FLOOZ_10USD = "BUY_FLOOZ_10USD";
const BUY_FLOOZ_20USD = "BUY_FLOOZ_20USD";
const BUY_FLOOZ_50USD = "BUY_FLOOZ_50USD";
const BUY_FLOOZ_100USD = "BUY_FLOOZ_100USD";
const BUY_STARTER_PACK_WATER = "BUY_STARTER_PACK_WATER";
const BUY_STARTER_PACK_FIRE = "BUY_STARTER_PACK_FIRE";
const BUY_STARTER_PACK_EARTH = "BUY_STARTER_PACK_EARTH";
const BUY_STARTER_PACK_LIGHT = "BUY_STARTER_PACK_LIGHT";
const BUY_STARTER_PACK_DARK = "BUY_STARTER_PACK_DARK";

const makeBuyStarterPack = (heroName, elementProp) => (state) => {
  return updateCurrentCharacter((character) => {
    character.usd -= 5;
    character.flooz += 500;
    character[elementProp] = true;
    character.heros[heroName].medals += 50;
  }, state);
};

const buyWaterStarterPack = makeBuyStarterPack(
  "Valkyrie",
  "boughtStarterPackWater"
);
const buyFireStarterPack = makeBuyStarterPack("Scud", "boughtStarterPackFire");
const buyEarthStarterPack = makeBuyStarterPack(
  "Leaf Blade",
  "boughtStarterPackEarth"
);
const buyLightStarterPack = makeBuyStarterPack(
  "Hikari",
  "boughtStarterPackLight"
);
const buyDarkStarterPack = makeBuyStarterPack(
  "Kasumi",
  "boughtStarterPackDark"
);

export const offersModule /* :Module<{ type:string }> */ = {
  handler: async ({ input, reply, getActiveCharacterState, addAction }) => {
    if (input.startsWith(".offers")) {
      if (!getActiveCharacterState().boughtStarterPackWater) {
        await reply(
          `**.sp-water** spend 5 usd to get 500${floozEmoji} and 2 stars epic hero Valkyrie!`
        );
      }
      if (!getActiveCharacterState().boughtStarterPackFire) {
        await reply(
          `**.sp-fire** spend 5 usd to get 500${floozEmoji} and 2 stars epic hero Scud!`
        );
      }
      if (!getActiveCharacterState().boughtStarterPackEarth) {
        await reply(
          `**.sp-earth** spend 5 usd to get 500${floozEmoji} and 2 stars epic hero Leaf Blade!`
        );
      }
      if (!getActiveCharacterState().boughtStarterPackLight) {
        await reply(
          `**.sp-light** spend 5 usd to get 500${floozEmoji} and 2 stars epic hero Hikari!`
        );
      }
      if (!getActiveCharacterState().boughtStarterPackDark) {
        await reply(
          `**.sp-dark** spend 5 usd to get 500${floozEmoji} and 2 stars epic hero Kasumi!`
        );
      }
      return true;
    } else if (input.startsWith(".flooz")) {
      await reply(
        (getActiveCharacterState().dailyPack1SubscriptionDays
          ? ""
          : `**.f35s** spend 10 usd to get 35 ${floozEmoji} daily for next 15 days\n`) +
          (getActiveCharacterState().dailyPack2SubscriptionDays
            ? ""
            : `**.f120s** spend 30 usd to get 120 ${floozEmoji} daily for next 15 days\n`) +
          `**.f5usd** spend 5 usd to instantly get ${
            getActiveCharacterState().boughtStarterPackFlooz5usd ? 100 : 200
          }${floozEmoji}
**.f10usd** spend 10 usd to instantly get ${
            getActiveCharacterState().boughtStarterPackFlooz10usd ? 240 : 480
          }${floozEmoji}
**.f20usd** spend 20 usd to instantly get ${
            getActiveCharacterState().boughtStarterPackFlooz20usd ? 500 : 1000
          } ${floozEmoji}
**.f50usd** spend 50 usd to instantly get ${
            getActiveCharacterState().boughtStarterPackFlooz50usd ? 1300 : 2600
          }${floozEmoji}
**.f100usd** spend 100 usd to instantly get ${
            getActiveCharacterState().boughtStarterPackFlooz100usd ? 2800 : 5600
          }${floozEmoji}
        `
      );
      return true;
    } else if (input.startsWith(".f35s")) {
      if (await checkusd(10, reply, getActiveCharacterState())) {
        await addAction({ type: SUBSCRIBE_FLOOZ_35_15 });
      }
      return true;
    } else if (input.includes("f120s")) {
      if (await checkusd(30, reply, getActiveCharacterState())) {
        await addAction({ type: SUBSCRIBE_FLOOZ_120_15 });
      }
      return true;
    } else if (input.startsWith(".f5usd")) {
      if (await checkusd(5, reply, getActiveCharacterState())) {
        await addAction({ type: BUY_FLOOZ_5USD });
      }
      return true;
    } else if (input.startsWith(".f10usd")) {
      if (await checkusd(10, reply, getActiveCharacterState())) {
        await addAction({ type: BUY_FLOOZ_10USD });
      }
      return true;
    } else if (input.startsWith(".f20usd")) {
      if (await checkusd(20, reply, getActiveCharacterState())) {
        await addAction({ type: BUY_FLOOZ_20USD });
      }
      return true;
    } else if (input.startsWith(".f50usd")) {
      if (await checkusd(50, reply, getActiveCharacterState())) {
        await addAction({ type: BUY_FLOOZ_50USD });
      }
      return true;
    } else if (input.startsWith(".f100usd")) {
      if (await checkusd(100, reply, getActiveCharacterState())) {
        await addAction({ type: BUY_FLOOZ_100USD });
      }
      return true;
    } else if (input.startsWith(".sp-water")) {
      if (getActiveCharacterState().boughtStarterPackWater) {
        await reply("Already owned");
      } else {
        if (await checkusd(5, reply, getActiveCharacterState())) {
          await addAction({ type: BUY_STARTER_PACK_WATER });
        }
      }
      return true;
    } else if (input.startsWith(".sp-fire")) {
      if (getActiveCharacterState().boughtStarterPackFire) {
        await reply("Already owned");
      } else {
        if (await checkusd(5, reply, getActiveCharacterState())) {
          await addAction({ type: BUY_STARTER_PACK_FIRE });
        }
      }
      return true;
    } else if (input.startsWith(".sp-earth")) {
      if (getActiveCharacterState().boughtStarterPackEarth) {
        await reply("Already owned");
      } else {
        if (await checkusd(5, reply, getActiveCharacterState())) {
          await addAction({ type: BUY_STARTER_PACK_EARTH });
        }
      }
      return true;
    } else if (input.startsWith(".sp-light")) {
      if (getActiveCharacterState().boughtStarterPackLight) {
        await reply("Already owned");
      } else {
        if (await checkusd(5, reply, getActiveCharacterState())) {
          await addAction({ type: BUY_STARTER_PACK_LIGHT });
        }
      }
      return true;
    } else if (input.startsWith(".sp-dark")) {
      if (getActiveCharacterState().boughtStarterPackDark) {
        await reply("Already owned");
      } else {
        if (await checkusd(5, reply, getActiveCharacterState())) {
          await addAction({ type: BUY_STARTER_PACK_DARK });
        }
      }
      return true;
    }
  },
  reducer: ({ state, action }) => {
    if (action.type === SUBSCRIBE_FLOOZ_35_15) {
      return updateCurrentCharacter((character) => {
        character.usd -= 10;
        character.flooz += 35;
        character.dailyPack1SubscriptionDays = 14;
      }, state);
    }
    if (action.type === SUBSCRIBE_FLOOZ_120_15) {
      return updateCurrentCharacter((character) => {
        character.usd -= 30;
        character.flooz += 120;
        character.dailyPack1SubscriptionDays = 14;
      }, state);
    }
    if (action.type === BUY_FLOOZ_5USD) {
      return updateCurrentCharacter((character) => {
        character.usd -= 5;
        character.flooz += character.boughtStarterPackFlooz5usd ? 100 : 200;
        character.boughtStarterPackFlooz5usd = true;
      }, state);
    }
    if (action.type === BUY_FLOOZ_10USD) {
      return updateCurrentCharacter((character) => {
        character.usd -= 10;
        character.flooz += character.boughtStarterPackFlooz10usd ? 240 : 480;
        character.boughtStarterPackFlooz10usd = true;
      }, state);
    }
    if (action.type === BUY_FLOOZ_20USD) {
      return updateCurrentCharacter((character) => {
        character.usd -= 20;
        character.flooz += character.boughtStarterPackFlooz20usd ? 500 : 1000;
        character.boughtStarterPackFlooz20usd = true;
      }, state);
    }
    if (action.type === BUY_FLOOZ_50USD) {
      return updateCurrentCharacter((character) => {
        character.usd -= 50;
        character.flooz += character.boughtStarterPackFlooz50usd ? 1300 : 2600;
        character.boughtStarterPackFlooz50usd = true;
      }, state);
    }
    if (action.type === BUY_FLOOZ_100USD) {
      return updateCurrentCharacter((character) => {
        character.usd -= 100;
        character.flooz += character.boughtStarterPackFlooz100usd ? 2800 : 5600;
        character.boughtStarterPackFlooz100usd = true;
      }, state);
    }
    if (action.type === BUY_STARTER_PACK_WATER) {
      return buyWaterStarterPack(state);
    }
    if (action.type === BUY_STARTER_PACK_FIRE) {
      return buyFireStarterPack(state);
    }
    if (action.type === BUY_STARTER_PACK_EARTH) {
      return buyEarthStarterPack(state);
    }
    if (action.type === BUY_STARTER_PACK_LIGHT) {
      return buyLightStarterPack(state);
    }
    if (action.type === BUY_STARTER_PACK_DARK) {
      return buyDarkStarterPack(state);
    }

    return state;
  },
};
