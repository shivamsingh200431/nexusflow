import express from "express";
import { 
  createDevice,
  getDevices,
  getDeviceById,
} from "../controllers/deviceController.js";

const router = express.Router();

router.post("/", createDevice);

router.get("/", getDevices);

router.get("/:id", getDeviceById);

export default router;