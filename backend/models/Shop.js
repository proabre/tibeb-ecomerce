import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    country: {
      type: String,
      default: "Ethiopia",
      trim: true,
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

    details: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { _id: false },
);

const shopSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    logo: {
      type: String,
      default: null,
    },

    coverImage: {
      type: String,
      default: null,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },

    address: {
      type: addressSchema,
      required: true,
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    verificationNote: {
      type: String,
      maxlength: 1000,
      default: "",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "suspended", "closed"],
      default: "active",
      index: true,
    },

    commissionRateBps: {
      type: Number,
      min: 0,
      max: 10000,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

shopSchema.index({ slug: 1 }, { unique: true });

shopSchema.index({
  verificationStatus: 1,
  status: 1,
  createdAt: -1,
});

shopSchema.index({
  ownerId: 1,
  createdAt: -1,
});

const Shop = mongoose.model("Shop", shopSchema);

export default Shop;
