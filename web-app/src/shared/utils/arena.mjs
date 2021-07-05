/* @flow */

export const getArenaOpenedAndDay = (day /*: number*/) => {
  const arenaDay = day % 7;
  const opened = arenaDay < 5;

  return {
    opened,
    arenaDay,
  };
};
