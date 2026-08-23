import express from "express";
import {
    createFlow,
    getFlows,
    getFlowById,
} from "../controllers/flowController.js";

const router = express.Router();

router.post("/", createFlow);
router.get("/", getFlows);
router.get("/:id", getFlowById);

export default router;