import express from "express";
import { createTelemetry } from "../controllers/telemetryController.js";

const router = express.Router();

router.post("/", createTelemetry);

export default router;