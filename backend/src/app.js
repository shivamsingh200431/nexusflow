import express from "express";
import cors from "cors";
import telemetryRoutes from "./routes/telemetryRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/telemetry", telemetryRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "NexusFlow backend is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "nexusflow-backend",
  });
});

export default app;