import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

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