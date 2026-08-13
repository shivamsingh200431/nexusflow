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

export const getTelemetry = async (req, res) => {
  try {
    const { deviceId, from, to } = req.query;

    const filter = {};

    if (deviceId) {
      filter.deviceId = deviceId;
    }

    if (from || to) {
      filter.timestamp = {};

      if (from) {
        const fromDate = new Date(from);

        if (Number.isNaN(fromDate.getTime())) {
          return res.status(400).json({
            message: "Invalid 'from' date",
          });
        }

        filter.timestamp.$gte = fromDate;
      }

      if (to) {
        const toDate = new Date(to);

        if (Number.isNaN(toDate.getTime())) {
          return res.status(400).json({
            message: "Invalid 'to' date",
          });
        }

        filter.timestamp.$lte = toDate;
      }
    }

    const telemetry = await Telemetry.find(filter)
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    res.status(200).json({
      count: telemetry.length,
      telemetry,
    });
  } catch (error) {
    console.error("Telemetry retrieval failed:", error.message);

    res.status(500).json({
      message: "Failed to retrieve telemetry",
    });
  }
};