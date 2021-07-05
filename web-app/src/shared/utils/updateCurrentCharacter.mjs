/* @flow */

/* :: import { type CharacterState, type UserState } from '../../../../server/types' */

import immer from "immer";

// $FlowFixMe
const { produce } = immer;

export const updateCurrentCharacter = (
  updater /* :CharacterState => void */,
  userState /* :UserState */
) /* :UserState */ => {
  const activeCharacter = userState.characters[userState.activeCharacterName];
  if (!activeCharacter) return userState;

  const nextActiveCharacter = produce(activeCharacter, (updater /*:any */));

  if (nextActiveCharacter === activeCharacter) {
    return userState;
  }

  return {
    ...userState,
    characters: {
      ...userState.characters,
      [userState.activeCharacterName]: nextActiveCharacter,
    },
  };
};
