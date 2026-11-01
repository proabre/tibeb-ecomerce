import express from "express";
import {
  initiatePayment,
  confirmDevelopmentPayment,
} from "../controllers/paymentController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("customer"));

router.post("/orders/:orderId/initiate", initiatePayment);

router.post("/:paymentId/dev-confirm", confirmDevelopmentPayment);

export default router;
