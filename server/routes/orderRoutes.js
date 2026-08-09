import express from "express";
import { 
  updateOrderStatusHandler, 
  bulkUpdateOrderStatusHandler 
} from "../controllers/orderController.js";
import { verifyAdminToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/orders/update-status", verifyAdminToken, express.json(), updateOrderStatusHandler);
router.post("/orders/bulk-update-status", verifyAdminToken, express.json(), bulkUpdateOrderStatusHandler);

export default router;
