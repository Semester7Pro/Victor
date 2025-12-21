import http from "http";
import crypto from "crypto";

const server = http.createServer();

server.on("upgrade", (req, socket) => {
  socket.write(
    "HTTP/1.1 101 Switching Protocols\r\n" +
      "Upgrade: websocket\r\n" +
      "Connection: Upgrade\r\n" +
      `Sec-WebSocket-Accept: ${crypto
        .createHash("sha1")
        .update(req.headers["sec-websocket-key"] + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
        .digest("base64")}\r\n` +
      "\r\n"
  );

  socket.on("data", () => {});
});

server.listen(1234, () => {
  console.log("⚡ Basic WS server at ws://localhost:1234 (but NOT Yjs sync)");
});
