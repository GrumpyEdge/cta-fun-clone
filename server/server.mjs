/* @flow */

/* ::
  import { type PvpModuleAction } from './modules/pvpModule.mjs'
  type WebAppActionType = $PropertyType<PvpModuleAction, 'type'>
*/

import express from "express";
import { Server } from "http";
import Discord from "discord.js";
import { db } from "../db/db.mjs";
import fs from "fs";
import io from "socket.io-client";
import secret from "../ws-proxy/secret.js";
import { wsProxyHost, webHost } from "../web-app/src/config.mjs";
import fbAdmin from "firebase-admin";
import {
  attachDbActionsListener,
  deleteUserState,
  getUserState,
} from "./usersState.mjs";
import { modulesList } from "./modules/modules.registry.mjs";
import { callReducerDirectly } from "./usersState.mjs";

const VERSION = 3;

const { makeServerSecret, makeServerId, makeClientSecret } = secret;

if (!process.argv[2]) {
  console.log("=================");
  console.log(
    'Provide the secret key postfix. You should have a file "discord.secret.fly" and provide "fly" as an argument. Ex: npm run watch fly'
  );
  console.log("=================");

  process.exit(1);
}

const discordSecret = fs
  .readFileSync(`./discord.secret.${process.argv[2]}`)
  .toString()
  .replace("\n", "");
const client = new Discord.Client();
const FieldValue = fbAdmin.firestore.FieldValue;

const bypassDBActionTypesMap = {
  SEND_BATTLE_STATS_TO_DISCORD_DM: true,
};

const isWebAppActionTypeAllowed = (type /* : WebAppActionType */) => {
  switch (type) {
    case "SET_TEAM":
    case "REMOVE_TEAM":
    case "SET_OWNED_HEROS_NAMES":
    case "SET_OWNED_HERO_STATS":
    case "SEND_BATTLE_STATS_TO_DISCORD_DM":
    case "CREATE_OR_EDIT_BUCKET":
    case "DELETE_BUCKET":
      return true;
    case "WEB_APP_CLIENT_CONNECTED":
      return false;
    default:
      (type /*:empty */);
  }
};

async function main() {
  const serverId = makeServerId(discordSecret);
  const ws = io(
    `${wsProxyHost}?mode=server&serverId=${serverId}&secret=${makeServerSecret(
      serverId
    )}`
  );

  const dmMapByUserId = {};
  const userLocksById = {};

  const lock = (userid, input) => {
    userLocksById[userid] = input;
  };
  const unlock = (userid) => {
    userLocksById[userid] = false;
  };
  const makeAddAction = (userid, input) => async (action /* : Object */) => {
    lock(userid, input);
    let retry = 2;
    while (retry) {
      try {
        await db.collection("actions").add({
          ...action,
          userid,
          timestamp: FieldValue.serverTimestamp(),
        });
        break;
      } catch (e) {
        console.log("addAction failed", userid, e);
        retry--;
      }
    }
    unlock(userid);
  };

  const sendMsgToWeb = (msg, _userid) => {
    ws.emit("msg", { ...msg, _userid });
  };
  const { dispatchAction } = await attachDbActionsListener(
    dmMapByUserId,
    sendMsgToWeb
  );

  ws.on("msg", (msg) => {
    const { _userid, ..._action } = msg;
    const action = { ..._action, userid: _userid };
    if (msg.type === "WEB_APP_CLIENT_CONNECTED") {
      ws.emit("msg", { _userid, type: "HELLO_FROM_SERVER" });
      dispatchAction(action);
    } else {
      if (msg.type === "CLIENT_NOT_AVAILABLE") {
        // do nothing
      } else {
        // TODO sanitize action against schema
        if (isWebAppActionTypeAllowed(action.type)) {
          if (bypassDBActionTypesMap[action.type]) {
            const dmMapMock = {
              [_userid]: {
                send: (msg) => {
                  client.users.cache.get(_userid).send(msg);
                },
              },
            };
            callReducerDirectly(dmMapMock, sendMsgToWeb, action);
          } else {
            makeAddAction(_userid, "msg from web-app")(action);
          }
        } else {
          ws.emit("msg", { _userid, type: "ACTION_NOT_ALLOWED", action });
        }
      }
    }
  });
  ws.open();

  client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
  });

  let pause = false;

  const ArtoUserId = "532592137225895947";
  client.on("message", async (msg) => {
    const { author: user, content: input } = msg;
    let _input = input.toLowerCase().replace(/\s\s+/g, " ");
    const { id: userid } = user;

    if (user.bot) return;

    if (_input === ".pause" && userid === ArtoUserId) {
      pause = true;
      return;
    }
    if (_input === ".resume" && userid === ArtoUserId) {
      pause = false;
      return;
    }
    if (pause) return;

    if (!getUserState(userid) && !user.dmChannel) {
      const dm = await user.createDM();
      await dm.send(
        `Hi there! You can also send me commands in DM! Try: \`.help\``
      );
    }

    const dm = {
      send: async (m) =>
        msg.channel.reply ? msg.channel.reply(m) : msg.channel.send(m),
    };

    const sendDmToUser = async (message) => {
      let dm = user.dmChannel;
      if (!dm) {
        dm = await user.createDM();
      }
      await dm.send(message);
    };

    try {
      if (userLocksById[userid]) {
        dm.send(
          `Still processing your previous request: ${userLocksById[userid]}`
        );
      }

      dmMapByUserId[userid] = dm;

      let handled = false;
      for (let { handler } of modulesList) {
        const getActiveCharacterState = () => {
          const userState = getUserState(userid);
          if (!userState) {
            dm.send("no user state");
            throw new Error("no user state");
          }
          const characterState =
            userState.characters[userState.activeCharacterName];
          if (!characterState) {
            dm.send("no active character. type `.character` for more info");
            throw new Error("no active characterState");
          }
          return characterState;
        };
        const userState = getUserState(userid);
        if (!userState) {
          await makeAddAction(userid, input)({ type: "FIRST_INTERACTION" });
          await msg.reply("Congrats! your profile has been created!");
        }
        const _handled = await handler({
          input: _input,
          reply: (m) => dm.send(m),
          replyDM: (m) => sendDmToUser(m),
          getUserState: () => getUserState(userid),
          getActiveCharacterState,
          getActiveCharacterStateMutableCopy: () => {
            return JSON.parse(JSON.stringify(getActiveCharacterState()));
          },
          addAction: makeAddAction(userid, input),
          lock: () => lock(userid, input),
          unlock: () => unlock(userid),
          userid,
          deleteUserState: () => deleteUserState(userid),
          msg,
        });

        if (_handled) {
          handled = true;
        }
      }

      if (input.startsWith(".web")) {
        const secret = makeClientSecret(serverId, userid);
        sendDmToUser(
          `${webHost}?serverId=${serverId}&userid=${userid}&secret=${secret}&version=${VERSION}&rnd=${Math.round(Math.random() * 1000000)}`
        );
        handled = true;
      }

      if (!handled && input.startsWith(".")) {
        await dm.send(
          'I can not recognize your request. Type ".help" to know how to interact with me.'
        );
      }
    } catch (e) {
      if (
        e.message === "no user state" ||
        e.message === "no active characterState"
      ) {
        // do nothing
      } else {
        console.log("error", e);
        dm.send(`error: ${e.message}`);
      }
    }
  });

  client.login(discordSecret);
}

main();

let lastException = "";

const app = express();
app.get("*", function (req, res) {
  res.send({
    health: "ok",
    lastException,
  });
});
// $FlowFixMe
const server = Server(app);
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log("Press Ctrl+C to quit.");
});

process
  .on("unhandledRejection", (reason, p) => {
    console.error(reason, "Unhandled Rejection at Promise", p);
    lastException = "unhandledRejection: " + reason;
  })
  .on("uncaughtException", (err) => {
    console.error(err, "Uncaught Exception thrown");
    lastException = err.message;
  });
