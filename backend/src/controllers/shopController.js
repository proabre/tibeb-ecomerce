import mongoose from "mongoose";
import Shop from "../models/Shop.js";
import User from "../models/User.js";

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const createShop = async (req, res, next) => {
  try {
    const {
      name,
      description,
      phone,
      email,
      category,
      address,
      logo,
      coverImage,
    } = req.body;

    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 150
    ) {
      return res.status(400).json({
        message: "Shop name must be between 2 and 150 characters.",
      });
    }

    if (typeof phone !== "string" || !phone.trim()) {
      return res.status(400).json({
        message: "Shop phone number is required.",
      });
    }

    if (
      !address ||
      typeof address !== "object" ||
      typeof address.city !== "string" ||
      !address.city.trim()
    ) {
      return res.status(400).json({
        message: "A valid address with a city is required.",
      });
    }

    if (
      description !== undefined &&
      (typeof description !== "string" || description.length > 2000)
    ) {
      return res.status(400).json({
        message: "Description must be 2000 characters or fewer.",
      });
    }

    if (
      email !== undefined &&
      email !== "" &&
      (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    ) {
      return res.status(400).json({
        message: "Enter a valid email address.",
      });
    }

    const existingShop = await Shop.findOne({
      ownerId: req.user._id,
    });

    if (existingShop) {
      return res.status(409).json({
        message: "You already have a shop application.",
        shop: existingShop,
      });
    }

    const baseSlug = slugify(name);

    if (!baseSlug) {
      return res.status(400).json({
        message: "Shop name must contain letters or numbers.",
      });
    }

    const slug = `${baseSlug}-${new mongoose.Types.ObjectId()
      .toString()
      .slice(-6)}`;

    const shop = await Shop.create({
      ownerId: req.user._id,
      name: name.trim(),
      slug,
      description: description?.trim() || "",
      phone: phone.trim(),
      email: email?.trim() || undefined,
      address: {
        country: address.country || "Ethiopia",
        city: address.city.trim(),
        subCity: address.subCity?.trim(),
        woreda: address.woreda?.trim(),
        details: address.details?.trim(),
      },
      logo: logo || null,
      coverImage: coverImage || null,
      verificationStatus: "pending",
    });

    return res.status(201).json({
      message: "Shop application submitted for admin review.",
      shop,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A shop with this identifier already exists.",
      });
    }

    next(error);
  }
};

export const getMyShop = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({
      ownerId: req.user._id,
    });

    if (!shop) {
      return res.status(404).json({
        message: "You have not registered a shop yet.",
      });
    }

    return res.status(200).json({ shop });
  } catch (error) {
    next(error);
  }
};

export const getPendingShops = async (req, res, next) => {
  try {
    const shops = await Shop.find({
      verificationStatus: "pending",
    })
      .populate("ownerId", "name email phone")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      count: shops.length,
      shops,
    });
  } catch (error) {
    next(error);
  }
};

export const reviewShop = async (req, res, next) => {
  try {
    const { action, verificationNote } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        message: 'Action must be "approve" or "reject".',
      });
    }

    if (
      action === "reject" &&
      (typeof verificationNote !== "string" || !verificationNote.trim())
    ) {
      return res.status(400).json({
        message: "A reason is required when rejecting a shop.",
      });
    }

    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({
        message: "Shop not found.",
      });
    }

    if (shop.verificationStatus !== "pending") {
      return res.status(409).json({
        message: "This application has already been reviewed.",
      });
    }

    shop.verificationStatus = action === "approve" ? "approved" : "rejected";

    shop.verificationNote = action === "reject" ? verificationNote.trim() : "";

    shop.reviewedBy = req.user._id;
    shop.reviewedAt = new Date();

    await shop.save();

    // This assumes User.role is a single string.
    // Approval and role changes should be transactional in production.
    if (action === "approve") {
      await User.findByIdAndUpdate(
        shop.ownerId,
        {
          $addToSet: { roles: "seller" },
        },
        { runValidators: true },
      );
    }

    return res.status(200).json({
      message:
        action === "approve"
          ? "Shop approved successfully."
          : "Shop application rejected.",
      shop,
    });
  } catch (error) {
    next(error);
  }
};
