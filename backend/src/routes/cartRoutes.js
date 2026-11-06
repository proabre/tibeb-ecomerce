import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../controllers/cartController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("customer", "seller"));

router.get("/", getCart);
router.post("/items", addToCart);
router.patch("/items/:itemId", updateCartItem);
router.delete("/items/:itemId", removeCartItem);
router.delete("/", clearCart);

export default router;
