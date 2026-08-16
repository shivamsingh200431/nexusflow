import express from "express";
import { 
    createFlow,
    getFlows, 
} from "../controllers/flowController.js";

const router = express.Router();

router.post("/", createFlow);
router.get("/", getFlows);

export default router;