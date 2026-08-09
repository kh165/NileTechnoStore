import express from "express";
import { 
  getAllStocks, 
  getStockById, 
  updateStockById, 
  decrementStock 
} from "../controllers/stockController.js";
import { verifyAdminToken } from "../middleware/authMiddleware.js";
import { orderLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.get("/product-stock", getAllStocks);
router.get("/product-stock/:id", getStockById);
router.post("/product-stock/:id", verifyAdminToken, updateStockById);
router.post("/product-stock/decrement", orderLimiter, verifyAdminToken, decrementStock);

export default router;
