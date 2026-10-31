import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number from 1 to 5.",
      },
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    status: {
      type: String,
      enum: ["published", "hidden", "pending"],
      default: "published",
      index: true,
    },

    sellerReply: {
      text: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: "",
      },

      repliedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

reviewSchema.index(
  {
    customerId: 1,
    productId: 1,
    orderId: 1,
  },
  { unique: true },
);

reviewSchema.index({
  productId: 1,
  status: 1,
  createdAt: -1,
});

reviewSchema.index({
  shopId: 1,
  status: 1,
  createdAt: -1,
});

const Review = mongoose.model("Review", reviewSchema);

export default Review;
