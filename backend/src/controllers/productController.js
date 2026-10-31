import mongoose from "mongoose";
import Product from "../models/Product.js";
import Shop from "../models/Shop.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

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
    "status",
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  }

  if (req.body.title !== undefined) {
    const baseSlug = slugify(req.body.title);

    if (!baseSlug) {
      return res.status(400).json({
        message: "Invalid product title.",
      });
    }

    product.slug = `${baseSlug}-${product._id.toString().slice(-6)}`;
  }

  await product.save();

  res.status(200).json({
    message: "Product updated successfully.",
    product,
  });
});

export const deleteProduct = asyncHandler(async (req, res) => {
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

  product.status = "archived";
  await product.save();

  res.status(200).json({
    message: "Product archived successfully.",
  });
});
