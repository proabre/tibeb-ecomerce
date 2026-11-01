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

export { createOrder };
