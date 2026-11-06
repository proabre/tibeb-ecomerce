import express from "express";

import {
  register,
  login,
  logout,
  getMe,
} from "../controllers/authController.js";
import { beginOAuth, completeOAuth } from "../controllers/oauthController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.get("/google", authLimiter, beginOAuth("google"));
router.get("/google/callback", authLimiter, completeOAuth("google"));
router.get("/facebook", authLimiter, beginOAuth("facebook"));
router.get("/facebook/callback", authLimiter, completeOAuth("facebook"));

export default router;
