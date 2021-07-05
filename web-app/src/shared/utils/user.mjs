/* @flow */
/* :: import type { ROCharacterState, DiscordPlayerMessageHandlerPropsType,  ReducerProps, UserState } from '../../../../server/types' */
import { todayDate } from "./variables.mjs";
import { usdEmoji, floozEmoji } from "../constants/emoji.mjs";

export const printActiveCharacterState = (
  activeCharacter /* : ROCharacterState */
) => {
  return `${activeCharacter.name}, ${todayDate(activeCharacter.day)}
    ${activeCharacter.usd} ${usdEmoji}
    ${activeCharacter.flooz} ${floozEmoji}
    days played: ${activeCharacter.day}`;
};
