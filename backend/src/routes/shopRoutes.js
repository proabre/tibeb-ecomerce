import express from "express";
import {
  createShop,
  getMyShop,
  getPendingShops,
  reviewShop,
} from "../controllers/shopController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createShop);
router.get("/me", protect, getMyShop);

router.get("/admin/pending", protect, authorize("admin"), getPendingShops);

router.patch("/admin/:id/review", protect, authorize("admin"), reviewShop);

router.patch("/admin/:id/review", protect, authorize("admin"), reviewShop);

export default router;
