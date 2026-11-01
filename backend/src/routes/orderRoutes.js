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

router.use(protect, authorize("customer"));

router.get("/seller/my-orders", authorize("seller"), getSellerOrders);
router.get("/seller/my-orders/:id", authorize("seller"), getSellerOrderById);
router.patch(
  "/seller/my-orders/:id/status",
  authorize("seller"),
  updateSellerOrderStatus,
);

router.post("/", authorize("customer"), createOrder);
router.get("/", authorize("customer"), getMyOrders);
router.patch("/:id/cancel", authorize("customer"), cancelMyOrder);
router.get("/:id", authorize("customer"), getMyOrderById);

export default router;
