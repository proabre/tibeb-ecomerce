import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch {
    res.clearCookie("token", cookieOptions());

    return res.status(401).json({
      message: "Invalid or expired session",
    });
  }

  const user = await User.findById(decoded.sub);

  if (!user || user.status !== "active") {
    res.clearCookie("token", cookieOptions());

    return res.status(401).json({
      message: "Account is unavailable",
    });
  }

  req.user = user;

  next();
});

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const permitted = allowedRoles.some((role) =>
      req.user.roles.includes(role),
    );

    if (!permitted) {
      return res.status(403).json({
        message: "You do not have permission to access this resource",
      });
    }

    next();
  };
}

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000,
  };
}
