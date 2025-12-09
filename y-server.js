import http from "http";
import { WebSocketServer } from "ws";
import { setupWSConnection } from "y-websocket/bin/utils.js";

const server = http.createServer();
const wss = new WebSocketServer({ server });

wss.on("connection", (socket, req) => {
  setupWSConnection(socket, req, { pingTimeout: 30000 });
});

server.listen(1234, () => {
  console.log("Yjs server running at ws://localhost:1234");
});
