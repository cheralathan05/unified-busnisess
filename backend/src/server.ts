// src/server.ts

import http from "http";
import type { AddressInfo } from "net";
import app from "./app";
import { env } from "./config/env";
import { db } from "./config/db";
import { initSocket } from "./socket/socket.server";

const PORT = env.PORT || 5000;

// ======================
// START SERVER
// ======================
const startServer = async () => {
  try {
    // ✅ DB CONNECTION
    await db.$connect();
    console.log("✅ Database connected");

    // ✅ CREATE HTTP SERVER (required for sockets)
    const server = http.createServer(app);

    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `❌ Port ${PORT} is already in use. Stop the existing process or set a different PORT.`
        );
        console.error("💡 Example: PORT=5000 npm run dev");
      } else {
        console.error("❌ Server error:", error);
      }

      process.exit(1);
    });

    // ✅ INIT SOCKET.IO
    initSocket(server);
    console.log("🔌 Socket initialized");

    // ✅ START SERVER
    server.listen(PORT, () => {
      const address = server.address() as AddressInfo;
      const listeningPort = address?.port || PORT;

      console.log(`🚀 Server running on http://localhost:${listeningPort}`);
      console.log(`📡 API: http://localhost:${listeningPort}/api`);
      console.log(`❤️ Health: http://localhost:${listeningPort}/health`);
    });

    // ======================
    // GRACEFUL SHUTDOWN
    // ======================
    const shutdown = async () => {
      console.log("🛑 Shutting down server...");

      await db.$disconnect();

      server.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();