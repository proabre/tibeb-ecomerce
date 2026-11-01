import express from "express";

import {
  createOrder,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
} from "../controllers/orderController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("customer"));

router.post("/", createOrder);

router.get("/", getMyOrders);

router.patch("/:id/cancel", cancelMyOrder);

router.get("/:id", getMyOrderById);

export default router;
