import express from "express";
import { uploadProductImages } from "../controllers/uploadController.js";
import upload from "../middleware/uploadMiddleware.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/products",
  protect,
  authorize("seller"),
  upload.array("images", 12),
  uploadProductImages,
);

export default router;
