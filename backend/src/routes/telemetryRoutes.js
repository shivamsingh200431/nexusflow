import express from "express";
import { 
    createTelemetry,
    getTelemetry,

} from "../controllers/telemetryController.js";

const router = express.Router();

router.post("/", createTelemetry);

router.get("/", getTelemetry);

export default router;