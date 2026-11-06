import express from "express";
import {
  uploadProductImages,
  uploadProductVideos,
} from "../controllers/uploadController.js";
import upload, {
  handleProductImageUploadError,
  handleProductVideoUploadError,
  uploadProductVideoFiles,
} from "../middleware/uploadMiddleware.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/products",
  protect,
  authorize("seller"),
  upload.array("images", 5),
  handleProductImageUploadError,
  uploadProductImages,
);

router.post(
  "/product-videos",
  protect,
  authorize("seller"),
  uploadProductVideoFiles.array("videos", 3),
  handleProductVideoUploadError,
  uploadProductVideos,
);

export default router;
