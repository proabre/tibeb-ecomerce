import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Any authenticated user
router.get("/profile-area", protect, (req, res) => {
  res.json({
    message: "You are authenticated",
    userId: req.user._id,
    roles: req.user.roles,
  });
});

// Customers only
router.get("/customer", protect, authorize("customer"), (req, res) => {
  res.json({ message: "Customer access granted" });
});

// Sellers only
router.get("/seller", protect, authorize("seller"), (req, res) => {
  res.json({ message: "Seller access granted" });
});

// Administrators only
router.get("/admin", protect, authorize("admin"), (req, res) => {
  res.json({ message: "Admin access granted" });
});

// Delivery operators only
router.get("/delivery", protect, authorize("delivery"), (req, res) => {
  res.json({ message: "Delivery access granted" });
});

export default router;
