import Flow from "../models/Flow.js";

export const createFlow = async (req, res) => {
  try {
    const { nodes, edges } = req.body;

    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      return res.status(400).json({
        message: "nodes and edges must be arrays",
      });
    }

    const invalidNode = nodes.some(
      (node) =>
        !node ||
        typeof node.id !== "string" ||
        typeof node.type !== "string" ||
        typeof node.data !== "object" ||
        node.data === null ||
        Array.isArray(node.data)
    );

    if (invalidNode) {
      return res.status(400).json({
        message: "Each node must contain id, type and data",
      });
    }

    const invalidEdge = edges.some(
      (edge) =>
        !edge ||
        typeof edge.source !== "string" ||
        typeof edge.target !== "string"
    );

    if (invalidEdge) {
      return res.status(400).json({
        message: "Each edge must contain source and target",
      });
    }

    const flow = await Flow.create({
      nodes,
      edges,
    });

    res.status(201).json({
      message: "Flow created successfully",
      flow,
    });
  } catch (error) {
    console.error("Flow creation failed:", error.message);

    res.status(500).json({
      message: "Failed to create flow",
    });
  }
};

export const getFlows = async (req, res) => {
  try {
    const flows = await Flow.find()
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      count: flows.length,
      flows,
    });
  } catch (error) {
    console.error("Flow retrieval failed:", error.message);

    res.status(500).json({
      message: "Failed to retrieve flows",
    });
  }
};

export const getFlowById = async (req, res) => {
  try {
    const { id } = req.params;
    const flow = await Flow.findById(id).lean();

    if (!flow) {
      return res.status(404).json({
        message: "Flow not found",
      });
    }

    res.status(200).json({
      flow,
    });
  } catch (error) {
    console.error("Flow retrieval failed:", error.message);

    if (error.name === 'CastError') {
      return res.status(400).json({
        message: "Invalid flow ID",
      });
    }

    res.status(500).json({
      message: "Failed to retrieve flow",
    });
  }
};