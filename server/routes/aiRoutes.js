import express from "express";
import { smartSearchHandler } from "../controllers/aiController.js";
import { aiLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.post("/ai/smart-search", aiLimiter, express.json(), smartSearchHandler);

export default router;
