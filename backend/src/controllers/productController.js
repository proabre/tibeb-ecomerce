import mongoose from "mongoose";
import Product from "../models/Products.js";
import Shop from "../models/Shop.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import User from "../models/User.js";

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const createProduct = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({
    ownerId: req.user._id,
    verificationStatus: "approved",
    status: "active",
  });

  if (!shop) {
    return res.status(403).json({
      message: "You need an approved and active shop to create products.",
    });
  }

  const {
    title,
    description,
    category,
    material,
    craftsmanship,
    madeToOrder,
    productionDays,
    images,
    variants,
  } = req.body;

  if (
    !title ||
    !description ||
    !category ||
    !Array.isArray(variants) ||
    variants.length === 0
  ) {
    return res.status(400).json({
      message:
        "Title, description, category, and at least one variant are required.",
    });
  }

  if (!Array.isArray(images || [])) {
    return res.status(400).json({
      message: "Images must be an array.",
    });
  }

  const baseSlug = slugify(title);

  if (!baseSlug) {
    return res.status(400).json({
      message: "Product title must contain valid characters.",
    });
  }

  const slug = `${baseSlug}-${new mongoose.Types.ObjectId().toString().slice(-6)}`;

  const product = await Product.create({
    shopId: shop._id,
    title,
    slug,
    description,
    category,
    material,
    craftsmanship,
    madeToOrder,
    productionDays,
    images,
    variants,
    status: "draft",
  });

  return res.status(201).json({
    message: "Product created successfully.",
    product,
  });
});

export const getMyProducts = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({
    ownerId: req.user._id,
  });

  if (!shop) {
    return res.status(404).json({
      message: "Shop not found.",
    });
  }

  const products = await Product.find({
    shopId: shop._id,
  }).sort({ createdAt: -1 });

  res.status(200).json({
    count: products.length,
    products,
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({
    ownerId: req.user._id,
  });

  if (!shop) {
    return res.status(404).json({
      message: "Shop not found.",
    });
  }

  const product = await Product.findOne({
    _id: req.params.id,
    shopId: shop._id,
  });

  if (!product) {
    return res.status(404).json({
      message: "Product not found.",
    });
  }

  res.status(200).json({ product });
});
export const updateProduct = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({
    ownerId: req.user._id,
    verificationStatus: "approved",
    status: "active",
  });

  if (!shop) {
    return res.status(403).json({
      message: "You need an approved active shop to edit products",
    });
  }

  const product = await Product.findOne({
    _id: req.params.id,
    shopId: shop._id,
  });

  if (!product) {
    return res.status(404).json({
      message: "Product not found",
    });
  }

  const allowedFields = [
    "title",
    "description",
    "category",
    "material",
    "craftsmanship",
    "madeToOrder",
    "productionDays",
    "images",
    "variants",
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  }

  if (req.body.title !== undefined) {
    const baseSlug = slugify(req.body.title);
    product.slug = `${baseSlug}-${new mongoose.Types.ObjectId()
      .toString()
      .slice(-6)}`;
  }

  await product.save();

  res.status(200).json({
    message: "Product updated successfully",
    product,
  });
});
export const deleteProduct = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({
    ownerId: req.user._id,
    verificationStatus: "approved",
    status: "active",
  });

  if (!shop) {
    return res.status(403).json({
      message: "You need an approved active shop to delete products",
    });
  }

  const product = await Product.findOne({
    _id: req.params.id,
    shopId: shop._id,
  });

  if (!product) {
    return res.status(404).json({
      message: "Product not found",
    });
  }

  product.status = "archived";
  await product.save();

  res.status(200).json({
    message: "Product archived successfully",
  });
});
/* ADMIN: Get products awaiting review */
export const getPendingProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    status: "draft",
  })
    .populate({
      path: "shopId",
      select: "name slug verificationStatus status",
    })
    .sort({ createdAt: 1 });

  res.status(200).json({
    count: products.length,
    products,
  });
});

/* ADMIN: Approve or reject a product */
export const reviewProduct = asyncHandler(async (req, res) => {
  const { action, rejectionReason } = req.body;

  if (!["approve", "reject"].includes(action)) {
    return res.status(400).json({
      message: "Action must be approve or reject.",
    });
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      message: "Product not found.",
    });
  }

  if (product.status !== "draft") {
    return res.status(400).json({
      message: "Only draft products can be reviewed.",
    });
  }

  const shop = await Shop.findOne({
    _id: product.shopId,
    verificationStatus: "approved",
    status: "active",
  });

  if (!shop) {
    return res.status(400).json({
      message: "The product's shop is not approved and active.",
    });
  }

  if (action === "approve") {
    product.status = "active";
    product.rejectionReason = "";
  } else {
    if (typeof rejectionReason !== "string" || !rejectionReason.trim()) {
      return res.status(400).json({
        message: "Please provide a rejection reason.",
      });
    }

    product.status = "rejected";
    product.rejectionReason = rejectionReason.trim();
  }

  await product.save();

  res.status(200).json({
    message:
      action === "approve"
        ? "Product approved successfully."
        : "Product rejected successfully.",
    product,
  });
});

/* PUBLIC: Browse active products */
export const getPublicProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(req.query.limit, 10) || 12),
  );

  const filter = {
    status: "active",
  };

  if (req.query.category) {
    filter.category = req.query.category;
  }

  if (req.query.search) {
    filter.$text = { $search: String(req.query.search) };
  }

  const approvedShops = await Shop.find({
    verificationStatus: "approved",
    status: "active",
  }).select("_id");

  filter.shopId = {
    $in: approvedShops.map((shop) => shop._id),
  };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("shopId", "name slug")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),

    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    count: products.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    products,
  });
});

/* PUBLIC: Get one product by slug */
export const getPublicProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    slug: req.params.slug,
    status: "active",
  }).populate({
    path: "shopId",
    match: {
      verificationStatus: "approved",
      status: "active",
    },
    select: "name slug description logo",
  });

  if (!product || !product.shopId) {
    return res.status(404).json({
      message: "Product not found.",
    });
  }

  res.status(200).json({ product });
});
