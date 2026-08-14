import mongoose from "mongoose";

const telemetrySchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      required: true,
    },

    deviceId: {
      type: String,
      required: true,
      index: true,
    },

    metrics: {
      type: Map,
      of: Number,
      required: true,
    },
  },
  {
    collection: "telemetry",
    timeseries: {
      timeField: "timestamp",
      metaField: "deviceId",
      granularity: "seconds",
    },
  }
);

const Telemetry = mongoose.model("Telemetry", telemetrySchema);

export default Telemetry;