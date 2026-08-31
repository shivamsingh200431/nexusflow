import "dotenv/config";
import { createServer } from "node:http";

import app from "./app.js";
import connectDB from "./config/db.js";
import { createWebSocketServer } from "./websocket/server.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const server = createServer(app);

  createWebSocketServer(server);

  server.listen(PORT, () => {
    console.log(`NexusFlow backend running on port ${PORT}`);
  });
};

startServer();