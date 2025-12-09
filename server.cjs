// server.cjs
const { Server } = require("@hocuspocus/server");

const server = new Server({
  port: 1234,
});

server.listen();

console.log("✅ Hocuspocus WebSocket server running on ws://localhost:1234");
