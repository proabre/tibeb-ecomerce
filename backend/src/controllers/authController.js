import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

import User from "../models/User.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { cookieOptions } from "../middleware/authMiddleware.js";

const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254).optional().or(z.literal("")),
    phone: z.string().trim().min(7).max(20).optional().or(z.literal("")),
    password: z.string().min(8).max(72),
  })
  .refine((data) => Boolean(data.email?.trim() || data.phone?.trim()), {
    message: "Email or phone number is required",
  });

const loginSchema = z.object({
  identifier: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(72),
});

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email ?? null,
    phone: user.phone ?? null,
    roles: user.roles,
    status: user.status,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
  };
}

function createToken(userId) {
  return jwt.sign({ sub: userId.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    algorithm: "HS256",
  });
}

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid registration details",
      errors: parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  const { name, password } = parsed.data;

  const email = parsed.data.email?.trim().toLowerCase() || undefined;
  const phone = parsed.data.phone?.trim() || undefined;

  const conditions = [];

  if (email) conditions.push({ email });
  if (phone) conditions.push({ phone });

  const existingUser = await User.findOne({
    $or: conditions,
  });

  if (existingUser) {
    return res.status(409).json({
      message: "An account with that email or phone already exists",
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  let user;

  try {
    user = await User.create({
      name,
      email,
      phone,
      passwordHash,

      // Public registration cannot assign privileged roles.
      roles: ["customer"],
      status: "active",
    });
  } catch (error) {
    // Handles concurrent registration attempts that race
    // against the database's unique indexes.
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with that email or phone already exists",
      });
    }

    throw error;
  }

  const token = createToken(user._id);

  res.cookie("token", token, cookieOptions());

  return res.status(201).json({
    message: "Registration successful",
    user: publicUser(user),
  });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Identifier and password are required",
    });
  }

  const { identifier, password } = parsed.data;
  const normalizedIdentifier = identifier.trim().toLowerCase();

  const conditions = [
    { email: normalizedIdentifier },
    { phone: identifier.trim() },
  ];

  const user = await User.findOne({
    $or: conditions,
  }).select("+passwordHash");

  // Use the same response for unknown accounts and incorrect passwords.
  if (!user) {
    return res.status(401).json({
      message: "Invalid credentials",
    });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return res.status(401).json({
      message: "Invalid credentials",
    });
  }

  if (user.status !== "active") {
    return res.status(403).json({
      message: "Your account is not active",
    });
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = createToken(user._id);

  res.cookie("token", token, cookieOptions());

  return res.status(200).json({
    message: "Login successful",
    user: publicUser(user),
  });
});

// POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", cookieOptions());

  return res.status(200).json({
    message: "Logged out successfully",
  });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  return res.status(200).json({
    user: publicUser(req.user),
  });
});
