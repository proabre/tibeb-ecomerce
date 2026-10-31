import mongoose from "mongoose";

const shippingAddressSchema = new mongoose.Schema(
  {
    recipientName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },

    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    subCity: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    woreda: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    addressLine: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    deliveryInstructions: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  { _id: false },
);

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },

    productTitle: {
      type: String,
      required: true,
      trim: true,
    },

    variantSku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    size: {
      type: String,
      default: "",
    },

    color: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: null,
    },

    unitPriceCents: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isSafeInteger,
    },

    lineTotalCents: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true },
);

const sellerOrderSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "A seller order must contain at least one item.",
      },
    },

    subtotalCents: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveryFeeCents: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
        "preparing",
        "ready_for_pickup",
        "dispatched",
        "delivered",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    dispatchedAt: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    sellerOrders: {
      type: [sellerOrderSchema],
      required: true,
      validate: {
        validator: (orders) => orders.length > 0,
        message: "An order must contain at least one seller order.",
      },
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    currency: {
      type: String,
      enum: ["ETB"],
      default: "ETB",
      required: true,
    },

    subtotalCents: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveryFeeCents: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    discountCents: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalCents: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "processing",
        "paid",
        "failed",
        "partially_refunded",
        "refunded",
      ],
      default: "pending",
      index: true,
    },

    status: {
      type: String,
      enum: [
        "pending_payment",
        "confirmed",
        "processing",
        "partially_shipped",
        "shipped",
        "completed",
        "cancelled",
      ],
      default: "pending_payment",
      index: true,
    },

    customerNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    paidAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

orderSchema.index({ customerId: 1, createdAt: -1 });

orderSchema.index({
  status: 1,
  createdAt: -1,
});

orderSchema.index({
  "sellerOrders.shopId": 1,
  createdAt: -1,
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
