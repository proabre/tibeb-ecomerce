import mongoose from "mongoose";

const trackingEventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        "shipment_created",
        "picked_up",
        "in_transit",
        "arrived_at_facility",
        "out_for_delivery",
        "delivered",
        "delivery_failed",
        "returned",
      ],
      required: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    location: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    occurredAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { _id: true },
);

const shipmentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    sellerOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    courierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    courierName: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    courierPhone: {
      type: String,
      trim: true,
      maxlength: 20,
      default: "",
    },

    trackingCode: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    provider: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "manual",
    },

    status: {
      type: String,
      enum: [
        "shipment_created",
        "picked_up",
        "in_transit",
        "arrived_at_facility",
        "out_for_delivery",
        "delivered",
        "delivery_failed",
        "returned",
      ],
      default: "shipment_created",
      index: true,
    },

    events: {
      type: [trackingEventSchema],
      default: [],
    },

    estimatedDeliveryAt: {
      type: Date,
      default: null,
    },

    shippedAt: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

shipmentSchema.index(
  { trackingCode: 1 },
  {
    unique: true,
    partialFilterExpression: {
      trackingCode: { $type: "string" },
    },
  },
);

shipmentSchema.index({
  courierId: 1,
  status: 1,
});

shipmentSchema.index({
  orderId: 1,
  sellerOrderId: 1,
});

const Shipment = mongoose.model("Shipment", shipmentSchema);

export default Shipment;
