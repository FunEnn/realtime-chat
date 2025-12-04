import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { initializeSocket } from "./src/lib/socket/socket-server";

const dev = process.env.NODE_ENV !== "production";
const hostname = dev ? "localhost" : "0.0.0.0";
const port = Number.parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const httpServer = createServer(async (req, res) => {
      try {
        if (req.url === "/health" || req.url === "/api/health") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              status: "ok",
              timestamp: new Date().toISOString(),
            }),
          );
          return;
        }

        const parsedUrl = parse(req.url || "/", true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error("Error occurred handling request:", err);
        res.statusCode = 500;
        res.end("Internal server error");
      }
    });

    initializeSocket(httpServer);

    httpServer
      .once("error", (err) => {
        console.error("Server error:", err);
        process.exit(1);
      })
      .listen(port, hostname, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
      });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
