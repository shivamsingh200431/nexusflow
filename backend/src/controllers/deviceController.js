import Device from "../models/Device.js";

export const createDevice = async (req, res) => {
  try {
    const { deviceId, name, type, status, metadata } = req.body;

    if (!deviceId || !name || !type) {
      return res.status(400).json({
        message: "deviceId, name, and type are required",
      });
    }

    const device = await Device.create({
      deviceId,
      name,
      type,
      status,
      metadata,
    });

    res.status(201).json({
      message: "Device created successfully",
      device,
    });
  } catch (error) {
    console.error("Device creation failed:", error.message);

    res.status(500).json({
      message: "Failed to create device",
    });
  }
};

export const getDevices = async (req, res) => {
  try {
    const devices = await Device.find()
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      count: devices.length,
      devices,
    });
  } catch (error) {
    console.error("Device retrieval failed:", error.message);

    res.status(500).json({
      message: "Failed to retrieve devices",
    });
  }
};

export const getDeviceById = async (req, res) => {
  try {
    const { id } = req.params;

    const device = await Device.findById(id).lean();

    if (!device) {
      return res.status(404).json({
        message: "Device not found",
      });
    }

    res.status(200).json({
      device,
    });
  } catch (error) {
    console.error("Device retrieval failed:", error.message);

    res.status(500).json({
      message: "Failed to retrieve device",
    });
  }
};