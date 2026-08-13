import Telemetry from "../models/Telemetry.js";

export const createTelemetry = async (req, res) => {
  try {
    const { timestamp, deviceId, metrics } = req.body;

    if (!timestamp || !deviceId || !metrics) {
      return res.status(400).json({
        message: "timestamp, deviceId and metrics are required",
      });
    }

    const telemetry = await Telemetry.create({
      timestamp,
      deviceId,
      metrics,
    });

    res.status(201).json({
      message: "Telemetry recorded successfully",
      telemetry,
    });
  } catch (error) {
    console.error("Telemetry ingestion failed:", error.message);

    res.status(500).json({
      message: "Failed to record telemetry",
    });
  }
};