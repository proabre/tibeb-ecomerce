import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

import exampleRoutes from "./routes/exampleRoutes.js";

import shopRoutes from "./routes/shopRoutes.js";

import productRoutes from "./routes/productRoutes.js";

import uploadRoutes from "./routes/uploadRoutes.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

//example route
app.use("/api/examples", exampleRoutes);

// Authentication routes
app.use("/api/auth", authRoutes);

//shop route
app.use("/api/shops", shopRoutes);
// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

//product routes
app.use("/api/products", productRoutes);

//upload Routes
app.use("/api/uploads", uploadRoutes);

// Not found
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

const port = process.env.PORT || 5000;

try {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }

  await connectDB();

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
} catch (error) {
  console.error("Server startup failed:", error.message);
  process.exit(1);
}
