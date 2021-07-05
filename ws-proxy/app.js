// @flow

"use strict";

// [START appengine_websockets_app]
const app = require("express")();

// $FlowFixMe
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { makeServerSecret, makeClientSecret } = require("./secret");

const serverSocketsMapByServerId = {};
const clientSocketsMapByToken = {};

io.on("connection", (socket) => {
  const { mode, serverId, secret, userid } = socket.handshake.query;
  console.log("connection", { mode, serverId, secret, userid });
  const onInvalidSecret = () => socket.emit("msg", { type: "INVALID_SECRET" });
  if (mode === "server") {
    if (makeServerSecret(serverId) !== secret) {
      onInvalidSecret();
      socket.conn.close();
    } else {
      if (serverSocketsMapByServerId[serverId]) {
        serverSocketsMapByServerId[serverId].emit("msg", {
          type: "SOCKET_TERMITATED_DUE_TO_NEW_INSTANCE_CONNECTED",
        });
        serverSocketsMapByServerId[serverId].conn.close();
      }
      serverSocketsMapByServerId[serverId] = socket;
      socket.emit("msg", { type: "CONNECTED_TO_PROXY" });
      socket.on("msg", (msg) => {
        const { _userid, ...rest } = msg;
        const clientSocket = clientSocketsMapByToken[_userid + serverId];
        if (clientSocket) {
          clientSocket.emit("msg", rest);
        } else {
          socket.emit("msg", { type: "CLIENT_NOT_AVAILABLE", msg });
        }
      });
    }
  } else {
    if (makeClientSecret(serverId, userid) !== secret) {
      onInvalidSecret();
      socket.conn.close();
    } else {
      const token = userid + serverId;
      if (clientSocketsMapByToken[token]) {
        clientSocketsMapByToken[token].emit("msg", {
          type: "SOCKET_TERMITATED_DUE_TO_NEW_INSTANCE_CONNECTED",
        });
        clientSocketsMapByToken[token].conn.close();
      }
      clientSocketsMapByToken[token] = socket;
      socket.emit("msg", { type: "CONNECTED_TO_PROXY" });
      const getServerSocket = () => serverSocketsMapByServerId[serverId];

      const serverSocket = getServerSocket();
      if (serverSocket) {
        serverSocket.emit("msg", {
          type: "WEB_APP_CLIENT_CONNECTED",
          _userid: userid,
        });
      } else {
        socket.emit("msg", {
          type: "SERVER_IS_NOT_AVAILABLE_AT_THE_MOMENT_TRY_AGAIN_LATER",
        });
        clientSocketsMapByToken[token].conn.close();
        delete clientSocketsMapByToken[token];
      }

      socket.on("msg", (msg) => {
        const serverSocket = getServerSocket();
        if (serverSocket) {
          serverSocket.emit("msg", { ...msg, _userid: userid });
        } else {
          socket.emit("msg", { type: "SERVER_NOT_AVAILABLE" });
        }
      });
    }
  }
});

if (module === require.main) {
  const PORT = process.env.PORT || 8080;
  server.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log("Press Ctrl+C to quit.");
  });
}
// [END appengine_websockets_app]
