import express from "express";

import {
  createOrder,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
  getSellerOrders,
  getSellerOrderById,
  updateSellerOrderStatus,
} from "../controllers/orderController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

// Seller routes
router.get("/seller/my-orders", authorize("seller"), getSellerOrders);
router.get("/seller/my-orders/:id", authorize("seller"), getSellerOrderById);
router.patch(
  "/seller/my-orders/:id/status",
  authorize("seller"),
  updateSellerOrderStatus,
);

// Customer routes
router.post("/", authorize("customer", "seller"), createOrder);
router.get("/", authorize("customer", "seller"), getMyOrders);
router.patch("/:id/cancel", authorize("customer", "seller"), cancelMyOrder);
router.get("/:id", authorize("customer", "seller"), getMyOrderById);

export default router;
