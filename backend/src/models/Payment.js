import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    provider: {
      type: String,
      enum: ["telebirr", "bank_gateway", "other_gateway"],
      required: true,
    },

    method: {
      type: String,
      enum: ["mobile_money", "bank_transfer", "bank_card", "other"],
      required: true,
    },

    merchantReference: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
    },

    providerReference: {
      type: String,
      default: null,
    },

    amountCents: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isSafeInteger,
    },

    currency: {
      type: String,
      enum: ["ETB"],
      default: "ETB",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "initiated",
        "pending",
        "succeeded",
        "failed",
        "cancelled",
        "expired",
        "refunded",
        "partially_refunded",
      ],
      default: "initiated",
      index: true,
    },

    checkoutUrl: {
      type: String,
      default: null,
      select: false,
    },

    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
    },

    failureCode: {
      type: String,
      default: null,
      maxlength: 100,
    },

    failureMessage: {
      type: String,
      default: null,
      maxlength: 500,
    },

    initiatedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    lastVerifiedAt: {
      type: Date,
      default: null,
    },

    providerMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

paymentSchema.index({
  orderId: 1,
  createdAt: -1,
});

paymentSchema.index(
  { provider: 1, providerReference: 1 },
  {
    unique: true,
    partialFilterExpression: {
      providerReference: { $type: "string" },
    },
  },
);

paymentSchema.index({
  status: 1,
  lastVerifiedAt: 1,
});

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
