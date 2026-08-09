import express from "express";
import { 
  trackSearchQuery, 
  trackProductView, 
  getAnalyticsReport 
} from "../controllers/analyticsController.js";

const router = express.Router();

router.post("/analytics/search", express.json(), trackSearchQuery);
router.post("/analytics/view/:productId", trackProductView);
router.get("/analytics/report", getAnalyticsReport);

export default router;
