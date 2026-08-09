import express from "express";
import {
  getCustomReviews,
  createCustomReview,
  approveCustomReview,
  deleteCustomReview
} from "../controllers/reviewController.js";
import { verifyAdminToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/custom-reviews", getCustomReviews);
router.post("/custom-reviews", createCustomReview);
router.post("/custom-reviews/:id/approve", verifyAdminToken, approveCustomReview);
router.delete("/custom-reviews/:id", verifyAdminToken, deleteCustomReview);

export default router;
