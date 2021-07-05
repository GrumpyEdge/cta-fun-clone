/* @flow */

import { FIRST_DAY_GAME_DATE } from "../constants/constants.mjs";

export const todayDate = (day /*: number*/) => {
  const firstDate = new Date(FIRST_DAY_GAME_DATE);

  return new Date(firstDate.getTime() + 1000 * 60 * 60 * 24 * day)
    .toUTCString()
    .replace(" 00:00:00 GMT", "");
};
