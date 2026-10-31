import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 80,
    },

    size: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    },

    color: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },

    priceCents: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: "Price must be a safe integer.",
      },
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: "Stock must be a non-negative integer.",
      },
      default: 0,
    },
  },
  { _id: true },
);

const productSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 220,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    category: {
      type: String,
      enum: [
        "habesha-kemis",
        "tibeb-fabric",
        "shawl",
        "accessories",
        "menswear",
        "custom",
      ],
      required: true,
      index: true,
    },

    material: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    craftsmanship: {
      type: String,
      enum: ["handmade", "machine-made", "mixed", "unspecified"],
      default: "unspecified",
    },

    madeToOrder: {
      type: Boolean,
      default: false,
    },

    productionDays: {
      type: Number,
      min: 0,
      max: 365,
      default: 0,
    },

    images: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 2048,
        },
      ],
      validate: {
        validator: (images) => images.length <= 12,
        message: "A product can have at most 12 images.",
      },
      default: [],
    },

    variants: {
      type: [variantSchema],
      validate: {
        validator: (variants) =>
          variants.length > 0 &&
          new Set(variants.map((v) => v.sku)).size === variants.length,
        message: "Products need variants with unique SKUs.",
      },
    },

    status: {
      type: String,
      enum: ["draft", "active", "rejected", "archived"],
      default: "draft",
      index: true,
    },

    rejectionReason: {
      type: String,
      maxlength: 1000,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

productSchema.index({ shopId: 1, slug: 1 }, { unique: true });

productSchema.index({
  status: 1,
  category: 1,
  createdAt: -1,
});

productSchema.index({
  shopId: 1,
  status: 1,
});

productSchema.index({
  title: "text",
  description: "text",
  material: "text",
});

const Product = mongoose.model("Product", productSchema);

export default Product;
