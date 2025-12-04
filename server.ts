import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { initializeSocket } from "./src/lib/socket/socket-server";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = Number.parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url || "/", true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling request:", err);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  });

  // 初始化 Socket.IO
  const socketIO = initializeSocket(httpServer);
  console.log(
    "[Server] Socket.IO initialized:",
    socketIO ? "SUCCESS" : "FAILED",
  );

  httpServer
    .once("error", (err) => {
      console.error("Server error:", err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(
        `> Server ready on http://${hostname}:${port} (${dev ? "development" : "production"})`,
      );
      console.log(`> Socket.IO ready on path: /api/socket/io`);
    });
});
