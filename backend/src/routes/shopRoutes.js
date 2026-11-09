import express from "express";
import {
  createShop,
  deleteMyPayoutAccount,
  getMyPayoutAccount,
  getMyShop,
  getPendingShops,
  reviewShop,
  updateMyPayoutAccount,
} from "../controllers/shopController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createShop);
router.get("/me", protect, getMyShop);
router.get(
  "/me/payout-account",
  protect,
  authorize("seller"),
  getMyPayoutAccount,
);
router.put(
  "/me/payout-account",
  protect,
  authorize("seller"),
  updateMyPayoutAccount,
);
router.delete(
  "/me/payout-account",
  protect,
  authorize("seller"),
  deleteMyPayoutAccount,
);

router.get("/admin/pending", protect, authorize("admin"), getPendingShops);

router.patch("/admin/:id/review", protect, authorize("admin"), reviewShop);

router.patch("/admin/:id/review", protect, authorize("admin"), reviewShop);

export default router;
