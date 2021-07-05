/* @flow */
/* :: import type { DmMap, UserState, MsgToWeb } from './types' */

import fs from 'fs';
import { printHeros } from "../web-app/src/shared/utils/print.mjs";
import { modulesList } from "./modules/modules.registry.mjs";
import { db } from "../db/db.mjs";
import {
  OPEN_BLITZ_CHEST,
  NEXT_DAY,
} from "../web-app/src/shared/constants/actionTypes.mjs";
import { HEROS_BY_NAME } from "../web-app/src/shared/constants/heros.mjs";
import { usdEmoji, floozEmoji } from "../web-app/src/shared/constants/emoji.mjs";
import { REQUIRED_TOTAL_MEDALS } from "../web-app/src/shared/constants/constants.mjs";

const evolveIfReady = (heroName /* :string */, state) => {
  const hero = state.heros[heroName];
  const tire = HEROS_BY_NAME[heroName].tire || "none";
  let targetLevel = REQUIRED_TOTAL_MEDALS.reduce((a, v, i) => {
    if (v < hero.medals) {
      return i + 1;
    }
    return a;
  }, 0);

  if (targetLevel === 6 && hero.desiredEv !== 6) {
    targetLevel = 5;
  }

  if (hero.desiredEv) {
    if (hero.desiredEv < targetLevel) {
      targetLevel = hero.desiredEv;
    }
  } else {
    if (tire === "none" && targetLevel > 3) {
      targetLevel = 3;
    }
  }

  if (hero.aw > targetLevel) {
    targetLevel = hero.aw;
  }

  if (targetLevel !== hero.ev) {
    return {
      ...state,
      heros: {
        ...state.heros,
        [heroName]: { ...hero, ev: targetLevel },
      },
    };
  }
  return state;
};

function nextUserState(
  {
    sendMsgToWeb,
    userid,
    onHerosMedalsChanged,
    onHerosEvOrAwOrWepChanged,
    onUsdChanged,
    onFloozChanged,
    sendMsgToDM
  },
  action,
  state
) {
  let nextState = state;

  nextState = modulesList.reduce((nextState, { reducer }) => {
    return reducer({
      state: nextState,
      action,
      userid,
      sendMsgToWeb,
      sendMsgToDM
    });
  }, nextState);

  if (action.type === "SET_ACTIVE_CHARACTER") {
    return nextState;
  }
  const activeCharacter = state.characters[state.activeCharacterName];

  if (!activeCharacter) {
    return nextState;
  }

  const getNextActiveCharacterState = () =>
    nextState.characters[nextState.activeCharacterName];

  if (
    activeCharacter &&
    onUsdChanged &&
    getNextActiveCharacterState().usd !== activeCharacter.usd
  ) {
    onUsdChanged(activeCharacter.usd, getNextActiveCharacterState().usd);
  }

  if (
    activeCharacter &&
    onFloozChanged &&
    getNextActiveCharacterState().flooz !== activeCharacter.flooz
  ) {
    onFloozChanged(
      activeCharacter.flooz,
      getNextActiveCharacterState().flooz,
      action
    );
  }

  if (
    activeCharacter &&
    activeCharacter.heros !== getNextActiveCharacterState().heros
  ) {
    const changedHerosNames = Object.keys(
      getNextActiveCharacterState().heros
    ).filter(
      (heroName /* :string */) =>
        activeCharacter.heros[heroName] !==
        getNextActiveCharacterState().heros[heroName]
    );
    const herosWithMedalsChanged = [];
    const herosWithEvOrAwOrWepChanged = [];
    changedHerosNames.forEach((heroName /* :string */) => {
      const prevHeroState = activeCharacter.heros[heroName];
      let getNextHeroState = () =>
        getNextActiveCharacterState().heros[heroName];
      if (prevHeroState !== getNextHeroState()) {
        if (prevHeroState.medals !== getNextHeroState().medals) {
          herosWithMedalsChanged.push([
            heroName,
            prevHeroState.medals,
            getNextHeroState().medals,
          ]);
        }
        nextState = {
          ...nextState,
          characters: {
            ...nextState.characters,
            [state.activeCharacterName]: evolveIfReady(
              heroName,
              getNextActiveCharacterState()
            ),
          },
        };

        if (
          prevHeroState.ev !== getNextHeroState().ev ||
          prevHeroState.aw !== getNextHeroState().aw ||
          prevHeroState.weapon !== getNextHeroState().weapon
        ) {
          herosWithEvOrAwOrWepChanged.push([
            heroName,
            getNextHeroState().ev,
            getNextHeroState().aw,
            getNextHeroState().weapon,
          ]);
        }
      }
    });
    if (herosWithEvOrAwOrWepChanged.length && onHerosEvOrAwOrWepChanged) {
      onHerosEvOrAwOrWepChanged(herosWithEvOrAwOrWepChanged);
    }
    if (herosWithMedalsChanged.length && onHerosMedalsChanged) {
      onHerosMedalsChanged(herosWithMedalsChanged, action);
    }
  }
  return nextState;
}

const userStateByIdMap /* : { [string]: UserState } */ = {};

const processAction = ({
  action,
  dmMapByUserId,
  initialLoad,
  sendMsgToWeb
}) => {
  userStateByIdMap[action.userid] = nextUserState(
    {
      sendMsgToDM: (msg) => {
        const dm = dmMapByUserId[action.userid];
        if (dm) {
          return dm.send(msg)
        }
        return Promise.resolve()
      },
      sendMsgToWeb: initialLoad
        ? null
        : (msg) => sendMsgToWeb(msg, action.userid),
      userid: action.userid,
      onHerosMedalsChanged: initialLoad
        ? null
        : (heros, action) => {
            if (action.type === NEXT_DAY) return;

            const dm = dmMapByUserId[action.userid];

            if (dm) {
              const emojiesByMedalsCount = heros
                .map(([name, medalsBefore, medalsAfter]) => {
                  const diff = medalsAfter - medalsBefore;
                  return { diff, emoji: HEROS_BY_NAME[name].emoji };
                })
                .reduce(
                  (acc, v) => ({
                    ...acc,
                    [v.diff]: [...(acc[v.diff] || []), v.emoji],
                  }),
                  {}
                );

              let title = "Congrats! You got:";
              if (action.type === OPEN_BLITZ_CHEST) {
                // $FlowFixMe
                if (action.amount > 1) {
                  // $FlowFixMe
                  title = `You opened ${action.amount} blitz chests and got`;
                } else {
                  title = `Inside blitz chest you found`;
                }
              }
              title += "\n";

              const messages = [];
              let current = "";
              Object.keys(emojiesByMedalsCount)
                .map((medalsCount) => {
                  return [medalsCount, emojiesByMedalsCount[medalsCount]];
                })
                .sort((a1, a2) => parseInt(a2[0]) - parseInt(a1[0]))
                .forEach((row) => {
                  const msg = `x${row[0]} ${row[1].join("")}\n`;
                  const next = current + msg;
                  if (next.length > 1990 - title.length) {
                    messages.push(current);
                    current = msg;
                  } else {
                    current = next;
                  }
                });

              if (current) {
                messages.push(current);
              }

              for (let m of messages) {
                dm.send(title + m);
              }
            }
          },
      onHerosEvOrAwOrWepChanged: initialLoad
        ? null
        : (heros) => {
            setTimeout(() => {
              const dm = dmMapByUserId[action.userid];

              if (dm) {
                const messages = printHeros(
                  heros.reduce(
                    (a, [name, ev, aw, weapon]) => ({
                      ...a,
                      [name]: { ev, aw, weapon },
                    }),
                    {}
                  )
                );

                for (let m of messages) {
                  dm.send("Following heros has been evolved!\n" + m);
                }
              }
            }, 10);
          },
      onUsdChanged: initialLoad
        ? null
        : (before, after) => {
            const dm = dmMapByUserId[action.userid];
            if (dm) {
              if (after > before) {
                dm.send(
                  `+${
                    after - before
                  }${usdEmoji}. Now you own ${after}${usdEmoji}`
                );
              }
            }
          },
      onFloozChanged: initialLoad
        ? null
        : (before, after, action) => {
            if (action.type === NEXT_DAY) return;
            const dm = dmMapByUserId[action.userid];
            if (dm) {
              if (after > before) {
                dm.send(
                  `+${
                    after - before
                  }${floozEmoji}\n Now you own ${after}${floozEmoji}`
                );
              }
            }
          },
    },
    action,
    userStateByIdMap[action.userid]
  );
}

export async function attachDbActionsListener(
  dmMapByUserId /* :DmMap */,
  sendMsgToWeb /* : (MsgToWeb, userId: string) => void */
) {
  const dispatchAction = /* ::<A: { userid: string, type: string }> */ (
    action /* : A*/
  ) => {
    if (!userStateByIdMap[action.userid]) {
      userStateByIdMap[action.userid] = {
        guildName: '',
        characters: {},
        activeCharacterName: "",
        teams: {},
        ownedHeros: {},
        ownedHerosNames: [],
        buckets: {}
      };
    }

    if (!initialLoad) {
      console.log(new Date().getTime(), action.userid, action.type);
    }
    processAction({
      action,
      dmMapByUserId,
      initialLoad,
      sendMsgToWeb
    })
  };

  let initialLoad = true;
  const backupActions = [];
  await new Promise((resolve) => {
    db.collection("actions")
      .orderBy("timestamp")
      .onSnapshot((docSnapshot) => {
        docSnapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const action = change.doc.data();
            backupActions.push(action);
            dispatchAction(action);
          }
        });

        resolve();
      });
  });
  try{
    fs.writeFileSync(`./db/backup/${new Date().toISOString()}.gjson`, JSON.stringify(backupActions))
  } catch(e) {
    // do nothing
    // it will fail on prod server, we do not need backup there any way
  }
  initialLoad = false;

  return {
    dispatchAction,
  };
}

export const callReducerDirectly = (
  dmMapByUserId /* :DmMap */,
  sendMsgToWeb /* : (MsgToWeb, userId: string) => void */,
  action/* : { type: string, userid: string } */
) => {
  processAction({
    initialLoad: false,
    action,
    dmMapByUserId,
    sendMsgToWeb
  })
}

export const getUserState = (userid /* :string */) /* :UserState */ =>
  userStateByIdMap[userid];
export const deleteUserState = (userid /* :string */) => {
  delete userStateByIdMap[userid];
};
