import mongoose from "mongoose";

const flowSchema = new mongoose.Schema(
  {
    nodes: {
      type: [mongoose.Schema.Types.Mixed],
      required: true,
      default: [],
    },

    edges: {
      type: [mongoose.Schema.Types.Mixed],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Flow = mongoose.model("Flow", flowSchema);

export default Flow;