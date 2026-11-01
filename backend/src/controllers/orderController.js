import mongoose from "mongoose";
import crypto from "crypto";

import Cart from "../models/Cart.js";
import Product from "../models/Products.js";
import Shop from "../models/Shop.js";
import Order from "../models/Order.js";

import { asyncHandler } from "../../utils/asyncHandler.js";

const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, customerNote = "" } = req.body;

  // 1. Validate shipping address
  const requiredFields = ["recipientName", "phone", "city", "addressLine"];

  for (const field of requiredFields) {
    if (
      typeof shippingAddress?.[field] !== "string" ||
      !shippingAddress[field].trim()
    ) {
      return res.status(400).json({
        message: `${field} is required.`,
      });
    }
  }

  if (typeof customerNote !== "string" || customerNote.length > 1000) {
    return res.status(400).json({
      message: "Invalid customer note.",
    });
  }

  const session = await mongoose.startSession();

  let createdOrder;

  try {
    await session.withTransaction(async () => {
      // 2. Find customer cart
      const cart = await Cart.findOne({
        userId: req.user._id,
      }).session(session);

      if (!cart || cart.items.length === 0) {
        const error = new Error("Your cart is empty.");
        error.statusCode = 400;
        throw error;
      }

      const sellerOrderMap = new Map();

      let subtotalCents = 0;

      // 3. Validate products and reserve stock
      for (const cartItem of cart.items) {
        const product = await Product.findOne({
          _id: cartItem.productId,
          status: "active",
        }).session(session);

        if (!product) {
          const error = new Error(
            "A product in your cart is no longer available.",
          );
          error.statusCode = 400;
          throw error;
        }

        const shop = await Shop.findOne({
          _id: product.shopId,
          verificationStatus: "approved",
          status: "active",
        }).session(session);

        if (!shop) {
          const error = new Error(
            "A shop in your cart is no longer available.",
          );
          error.statusCode = 400;
          throw error;
        }

        const variant = product.variants.find(
          (item) => item.sku === cartItem.variantSku,
        );

        if (!variant) {
          const error = new Error(
            `Variant ${cartItem.variantSku} is unavailable.`,
          );
          error.statusCode = 400;
          throw error;
        }

        // 4. Atomically decrement stock
        const stockUpdate = await Product.updateOne(
          {
            _id: product._id,
            status: "active",
            variants: {
              $elemMatch: {
                sku: variant.sku,
                stock: { $gte: cartItem.quantity },
              },
            },
          },
          {
            $inc: {
              "variants.$.stock": -cartItem.quantity,
            },
          },
          { session },
        );

        if (stockUpdate.modifiedCount !== 1) {
          const error = new Error(
            `Insufficient stock for ${product.title} (${variant.sku}).`,
          );
          error.statusCode = 400;
          throw error;
        }

        // 5. Calculate prices on the server
        const lineTotalCents = variant.priceCents * cartItem.quantity;

        subtotalCents += lineTotalCents;

        if (!Number.isSafeInteger(subtotalCents)) {
          const error = new Error("Order total is too large.");
          error.statusCode = 400;
          throw error;
        }

        // 6. Group items by seller/shop
        const shopKey = product.shopId.toString();

        if (!sellerOrderMap.has(shopKey)) {
          sellerOrderMap.set(shopKey, {
            shopId: product.shopId,
            items: [],
            subtotalCents: 0,
            deliveryFeeCents: 0,
          });
        }

        const sellerOrder = sellerOrderMap.get(shopKey);

        sellerOrder.items.push({
          productId: product._id,
          shopId: product.shopId,
          productTitle: product.title,
          variantSku: variant.sku,
          size: variant.size,
          color: variant.color,
          image: product.images[0] || null,
          unitPriceCents: variant.priceCents,
          quantity: cartItem.quantity,
          lineTotalCents,
        });

        sellerOrder.subtotalCents += lineTotalCents;
      }

      // 7. Calculate final order total
      const deliveryFeeCents = 0;
      const discountCents = 0;

      const totalCents = subtotalCents + deliveryFeeCents - discountCents;

      // 8. Generate unique order number
      const orderNumber = `TIB-${Date.now()}-${crypto
        .randomBytes(3)
        .toString("hex")
        .toUpperCase()}`;

      // 9. Create customer order
      const order = new Order({
        orderNumber,
        customerId: req.user._id,
        sellerOrders: Array.from(sellerOrderMap.values()),
        shippingAddress,
        currency: "ETB",
        subtotalCents,
        deliveryFeeCents,
        discountCents,
        totalCents,
        paymentStatus: "pending",
        status: "pending_payment",
        customerNote: customerNote.trim(),
      });

      await order.save({ session });

      // 10. Clear cart inside the same transaction
      cart.items = [];
      await cart.save({ session });

      createdOrder = order;
    });

    return res.status(201).json({
      message: "Order created successfully.",
      order: createdOrder,
    });
  } finally {
    await session.endSession();
  }
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    customerId: req.user._id,
  })
    .sort({ createdAt: -1 })
    .select(
      "orderNumber sellerOrders shippingAddress currency subtotalCents deliveryFeeCents discountCents totalCents paymentStatus status createdAt",
    );

  return res.status(200).json({
    count: orders.length,
    orders,
  });
});

const getMyOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      message: "Invalid order ID.",
    });
  }

  const order = await Order.findOne({
    _id: id,
    customerId: req.user._id,
  }).lean();

  if (!order) {
    return res.status(404).json({
      message: "Order not found.",
    });
  }

  const sellerOrders = order.sellerOrders.map((sellerOrder) => {
    const items = sellerOrder.items.map((item) => ({
      productId: item.productId,
      productTitle: item.productTitle,
      variantSku: item.variantSku,
      size: item.size,
      color: item.color,
      image: item.image,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.lineTotalCents,
    }));

    return {
      shopId: sellerOrder.shopId,
      status: sellerOrder.status,
      subtotalCents: sellerOrder.subtotalCents,
      deliveryFeeCents: sellerOrder.deliveryFeeCents,
      acceptedAt: sellerOrder.acceptedAt,
      dispatchedAt: sellerOrder.dispatchedAt,
      deliveredAt: sellerOrder.deliveredAt,
      items,
    };
  });

  return res.status(200).json({
    order: {
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      currency: order.currency,
      subtotalCents: order.subtotalCents,
      deliveryFeeCents: order.deliveryFeeCents,
      discountCents: order.discountCents,
      totalCents: order.totalCents,
      shippingAddress: order.shippingAddress,
      customerNote: order.customerNote,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      cancelledAt: order.cancelledAt,
      sellerOrders,
    },
  });
});

const cancelMyOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      message: "Invalid order ID.",
    });
  }

  const session = await mongoose.startSession();

  let cancelledOrder;

  try {
    await session.withTransaction(async () => {
      const order = await Order.findOne({
        _id: id,
        customerId: req.user._id,
      }).session(session);

      if (!order) {
        const error = new Error("Order not found.");
        error.statusCode = 404;
        throw error;
      }

      if (!["pending_payment", "confirmed"].includes(order.status)) {
        const error = new Error("This order can no longer be cancelled.");
        error.statusCode = 400;
        throw error;
      }

      // Do not restore stock twice.
      if (order.status === "cancelled") {
        const error = new Error("Order is already cancelled.");
        error.statusCode = 400;
        throw error;
      }

      // Restore stock for every purchased variant.
      for (const sellerOrder of order.sellerOrders) {
        for (const item of sellerOrder.items) {
          const product = await Product.findOne({
            _id: item.productId,
          }).session(session);

          if (!product) {
            const error = new Error(
              `Product ${item.productTitle} could not be found.`,
            );
            error.statusCode = 409;
            throw error;
          }

          const stockUpdate = await Product.updateOne(
            {
              _id: item.productId,
              "variants.sku": item.variantSku,
            },
            {
              $inc: {
                "variants.$.stock": item.quantity,
              },
            },
            { session },
          );

          if (stockUpdate.modifiedCount !== 1) {
            const error = new Error(
              `Could not restore stock for ${item.productTitle}.`,
            );
            error.statusCode = 409;
            throw error;
          }
        }

        sellerOrder.status = "cancelled";
      }

      order.status = "cancelled";
      order.cancelledAt = new Date();

      await order.save({ session });

      cancelledOrder = order;
    });

    return res.status(200).json({
      message: "Order cancelled successfully.",
      order: cancelledOrder,
    });
  } finally {
    await session.endSession();
  }
});

const getSellerOrders = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({
    ownerId: req.user._id,
    verificationStatus: "approved",
    status: "active",
  });

  if (!shop) {
    return res.status(404).json({
      message: "No approved active shop found.",
    });
  }

  const orders = await Order.find({
    "sellerOrders.shopId": shop._id,
  }).sort({ createdAt: -1 });

  // Return only this seller's part of each customer order.
  const sellerOrders = orders.map((order) => {
    const sellerOrder = order.sellerOrders.find(
      (item) => item.shopId.toString() === shop._id.toString(),
    );

    return {
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      shippingAddress: order.shippingAddress,
      currency: order.currency,
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      sellerOrder,
      createdAt: order.createdAt,
    };
  });

  return res.status(200).json({
    count: sellerOrders.length,
    orders: sellerOrders,
  });
});

const getSellerOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      message: "Invalid order ID.",
    });
  }

  const shop = await Shop.findOne({
    ownerId: req.user._id,
    verificationStatus: "approved",
    status: "active",
  });

  if (!shop) {
    return res.status(404).json({
      message: "No approved active shop found.",
    });
  }

  const order = await Order.findOne({
    _id: id,
    "sellerOrders.shopId": shop._id,
  });

  if (!order) {
    return res.status(404).json({
      message: "Order not found for your shop.",
    });
  }

  const sellerOrder = order.sellerOrders.find(
    (item) => item.shopId.toString() === shop._id.toString(),
  );

  return res.status(200).json({
    orderId: order._id,
    orderNumber: order.orderNumber,
    shippingAddress: order.shippingAddress,
    currency: order.currency,
    paymentStatus: order.paymentStatus,
    orderStatus: order.status,
    sellerOrder,
  });
});

const updateSellerOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      message: "Invalid order ID.",
    });
  }

  const allowedActions = {
    accept: "accepted",
    reject: "rejected",
    prepare: "preparing",
    ready: "ready_for_pickup",
    dispatch: "dispatched",
    deliver: "delivered",
  };
  if (!allowedActions[action]) {
    return res.status(400).json({
      message: "Invalid order action.",
    });
  }

  const shop = await Shop.findOne({
    ownerId: req.user._id,
    verificationStatus: "approved",
    status: "active",
  });

  if (!shop) {
    return res.status(404).json({
      message: "No approved active shop found.",
    });
  }

  const session = await mongoose.startSession();

  let updatedOrder;

  try {
    await session.withTransaction(async () => {
      const order = await Order.findOne({
        _id: id,
        "sellerOrders.shopId": shop._id,
      }).session(session);

      if (!order) {
        const error = new Error("Order not found for your shop.");
        error.statusCode = 404;
        throw error;
      }

      const sellerOrder = order.sellerOrders.find(
        (item) => item.shopId.toString() === shop._id.toString(),
      );

      if (
        sellerOrder.status === "rejected" ||
        sellerOrder.status === "cancelled" ||
        sellerOrder.status === "delivered"
      ) {
        const error = new Error("This seller order cannot be updated.");
        error.statusCode = 400;
        throw error;
      }

      const nextStatus = allowedActions[action];

      const allowedTransitions = {
        pending: ["accepted", "rejected"],
        accepted: ["preparing", "rejected"],
        preparing: ["ready_for_pickup"],
        ready_for_pickup: ["dispatched"],
        dispatched: ["delivered"],
        delivered: [],
        rejected: [],
        cancelled: [],
      };

      if (!allowedTransitions[sellerOrder.status]?.includes(nextStatus)) {
        const error = new Error(
          `Cannot change seller order from ${sellerOrder.status} to ${nextStatus}.`,
        );
        error.statusCode = 400;
        throw error;
      }

      // Only accept or prepare orders after payment is confirmed.
      if (
        ["accept", "prepare", "ready", "dispatch", "deliver"].includes(
          action,
        ) &&
        order.paymentStatus !== "paid"
      ) {
        const error = new Error(
          "The customer payment must be confirmed first.",
        );
        error.statusCode = 400;
        throw error;
      }

      sellerOrder.status = nextStatus;

      if (action === "accept") {
        sellerOrder.acceptedAt = new Date();
      }

      if (action === "dispatch") {
        sellerOrder.dispatchedAt = new Date();
      }

      if (action === "deliver") {
        sellerOrder.deliveredAt = new Date();
      }

      // Update the overall customer order status.
      const statuses = order.sellerOrders.map((item) => item.status);

      if (
        statuses.every(
          (status) => status === "rejected" || status === "cancelled",
        )
      ) {
        order.status = "cancelled";
      } else if (statuses.every((status) => status === "delivered")) {
        order.status = "completed";
      } else if (
        statuses.every(
          (status) =>
            status === "dispatched" ||
            status === "delivered" ||
            status === "rejected" ||
            status === "cancelled",
        )
      ) {
        order.status = "shipped";
      } else if (
        statuses.some(
          (status) => status === "dispatched" || status === "delivered",
        )
      ) {
        order.status = "partially_shipped";
      } else {
        order.status = "processing";
      }

      await order.save({ session });

      updatedOrder = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.status,
        sellerOrder,
      };
    });

    return res.status(200).json({
      message: "Seller order updated successfully.",
      order: updatedOrder,
    });
  } finally {
    await session.endSession();
  }
});

export {
  createOrder,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
  getSellerOrders,
  getSellerOrderById,
  updateSellerOrderStatus,
};
