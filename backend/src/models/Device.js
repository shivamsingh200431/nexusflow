import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    metadata: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const Device = mongoose.model("Device", deviceSchema);

export default Device;