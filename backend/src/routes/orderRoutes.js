import express from "express";

import { createOrder } from "../controllers/orderController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("customer"));

router.post("/", createOrder);

export default router;
