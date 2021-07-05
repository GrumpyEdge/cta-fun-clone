/* @flow */

/* :: import type { DiscordPlayerMessageHandlerPropsType,  ReducerProps } from '../types' */

import { db/* , deleteQueryBatch */ } from "../../db/db.mjs"

export const serviceModule = {
  handler: async (
    {
      input,
      reply,
      lock,
      unlock,
      userid,
      // deleteUserState,
    } /* :DiscordPlayerMessageHandlerPropsType<> */
  ) => {
    if (input.startsWith(".startover")) {
      return;
      /* lock();
      try {
        await new Promise((resolve, reject) =>
          deleteQueryBatch(
            (db) => db.collection("actions").where("userid", "==", userid),
            resolve,
            reject
          )
        );
        deleteUserState();
        await reply(
          "Great. All data erased. Send any message to begin again."
        );
      } catch (e) {
        await reply(`Failed. err: ${e.message}`);
      }
      unlock();
      return true; */
    } else if (input.startsWith(".lastactions")) {
      lock();
      try {
        await db
          .collection("actions")
          .where("userid", "==", userid)
          .orderBy("timestamp")
          .limitToLast(10)
          .get()
          .then((snapshot) => {
            reply(
              JSON.stringify(
                snapshot.docChanges().map((d) => {
                  const {
                    userid, //eslint-disable-line
                    timestamp, //eslint-disable-line
                    ...rest
                  } = d.doc.data();
                  return rest;
                }),
                null,
                "   "
              )
            );
          });
      } catch (e) {
        await reply(`Failed. err: ${e.message}`);
      }
      unlock();
      return true;
    } else if (input.startsWith(".deletelastaction")) {
      lock();
      try {
        await db
          .collection("actions")
          .where("userid", "==", userid)
          .orderBy("timestamp")
          .limitToLast(1)
          .get()
          .then((snapshot) => {
            return snapshot.docs[0].ref.delete();
          });
        await reply(`Done!`);
      } catch (e) {
        await reply(`Failed. err: ${e.message}`);
      }
      unlock();
      return true;
    }
  },
  reducer: ({ state } /* : ReducerProps<{ type: string }> */) => {
    return state;
  },
};
