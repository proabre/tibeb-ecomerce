import express from "express";

import {
  createProduct,
  getMyProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getPendingProducts,
  reviewProduct,
  getPublicProducts,
  getPublicProductBySlug,
} from "../controllers/productController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// =====================================
// PUBLIC PRODUCT ROUTES
// No login required
// =====================================

router.get("/", getPublicProducts);

router.get("/public/:slug", getPublicProductBySlug);

// =====================================
// ADMIN PRODUCT ROUTES
// Admin login required
// =====================================

router.get("/admin/pending", protect, authorize("admin"), getPendingProducts);

router.patch("/admin/:id/review", protect, authorize("admin"), reviewProduct);

// =====================================
// SELLER PRODUCT ROUTES
// Seller login required
// =====================================

router.post("/", protect, authorize("seller"), createProduct);

router.get("/my-products", protect, authorize("seller"), getMyProducts);

router.get("/:id", protect, authorize("seller"), getProductById);

router.patch("/:id", protect, authorize("seller"), updateProduct);

router.delete("/:id", protect, authorize("seller"), deleteProduct);

export default router;
