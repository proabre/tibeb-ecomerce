import mongoose from "mongoose";
import crypto from "crypto";
import Payment from "../models/Payment.js";
import Order from "../models/Order.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// Customer initiates a payment for an existing order.
const initiatePayment = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const idempotencyKey = req.get("Idempotency-Key");

  if (!mongoose.isValidObjectId(orderId)) {
    return res.status(400).json({ message: "Invalid order ID." });
  }

  if (
    typeof idempotencyKey !== "string" ||
    idempotencyKey.length < 8 ||
    idempotencyKey.length > 128
  ) {
    return res.status(400).json({
      message:
        "Provide an Idempotency-Key header between 8 and 128 characters.",
    });
  }

  // Return the previous result if this request was already processed.
  const previousPayment = await Payment.findOne({ idempotencyKey });

  if (previousPayment) {
    if (
      previousPayment.customerId.toString() !== req.user._id.toString() ||
      previousPayment.orderId.toString() !== orderId
    ) {
      return res.status(409).json({
        message: "This idempotency key has already been used.",
      });
    }

    return res.status(200).json({
      message: "This payment request was already processed.",
      payment: previousPayment,
    });
  }

  const order = await Order.findOne({
    _id: orderId,
    customerId: req.user._id,
  });

  if (!order) {
    return res.status(404).json({ message: "Order not found." });
  }

  if (order.status === "cancelled" || order.status === "completed") {
    return res.status(400).json({
      message: "Payment cannot be initiated for this order.",
    });
  }

  if (order.paymentStatus === "paid") {
    return res.status(400).json({
      message: "This order has already been paid.",
    });
  }

  // Reuse an existing pending payment instead of creating another.
  const pendingPayment = await Payment.findOne({
    orderId: order._id,
    customerId: req.user._id,
    status: { $in: ["initiated", "pending"] },
  });

  if (pendingPayment) {
    return res.status(200).json({
      message: "A payment is already in progress.",
      payment: pendingPayment,
    });
  }

  const payment = await Payment.create({
    orderId: order._id,
    customerId: req.user._id,
    provider: "other_gateway",
    method: "other",
    merchantReference: `TIB-DEV-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
    amountCents: order.totalCents,
    currency: "ETB",
    status: "initiated",
    idempotencyKey,
  });

  order.paymentStatus = "processing";
  await order.save();

  return res.status(201).json({
    message: "Development payment initiated.",
    payment,
    instructions:
      "Use the development confirmation endpoint to simulate payment. This is not a real payment.",
  });
});

// Development-only endpoint. Never use this as a real payment confirmation.
const confirmDevelopmentPayment = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ message: "Route not found." });
  }

  const { paymentId } = req.params;
  const { result } = req.body;

  if (!mongoose.isValidObjectId(paymentId)) {
    return res.status(400).json({ message: "Invalid payment ID." });
  }

  if (!["success", "failed"].includes(result)) {
    return res.status(400).json({
      message: 'Result must be either "success" or "failed".',
    });
  }

  const session = await mongoose.startSession();
  let response;

  try {
    await session.withTransaction(async () => {
      const payment = await Payment.findOne({
        _id: paymentId,
        customerId: req.user._id,
      }).session(session);

      if (!payment) {
        const error = new Error("Payment not found.");
        error.statusCode = 404;
        throw error;
      }

      const order = await Order.findOne({
        _id: payment.orderId,
        customerId: req.user._id,
      }).session(session);

      if (!order) {
        const error = new Error("Order not found.");
        error.statusCode = 404;
        throw error;
      }

      // Repeated confirmation of an already completed payment is safe.
      if (payment.status === "succeeded") {
        response = { payment, order };
        return;
      }

      if (!["initiated", "pending"].includes(payment.status)) {
        const error = new Error("This payment can no longer be confirmed.");
        error.statusCode = 400;
        throw error;
      }

      if (order.status === "cancelled" || order.status === "completed") {
        const error = new Error("This order can no longer be paid.");
        error.statusCode = 400;
        throw error;
      }

      const now = new Date();

      if (result === "success") {
        payment.status = "succeeded";
        payment.completedAt = now;
        payment.lastVerifiedAt = now;

        order.paymentStatus = "paid";
        order.paidAt = now;
        order.status = "confirmed";
      } else {
        payment.status = "failed";
        payment.completedAt = now;
        payment.lastVerifiedAt = now;
        payment.failureCode = "DEV_PAYMENT_FAILED";
        payment.failureMessage = "Simulated development payment failure.";

        order.paymentStatus = "failed";
      }

      await payment.save({ session });
      await order.save({ session });

      response = { payment, order };
    });

    return res.status(200).json({
      message:
        result === "success"
          ? "Development payment succeeded."
          : "Development payment failed.",
      payment: response.payment,
      order: {
        _id: response.order._id,
        orderNumber: response.order.orderNumber,
        paymentStatus: response.order.paymentStatus,
        status: response.order.status,
      },
    });
  } finally {
    await session.endSession();
  }
});

export { initiatePayment, confirmDevelopmentPayment };
