import Cart from "../models/Cart.js";
import Product from "../models/Products.js";
import Shop from "../models/Shop.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// GET CUSTOMER CART
export const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id }).populate({
    path: "items.productId",
    select: "title slug images variants shopId status",
    populate: {
      path: "shopId",
      select: "name slug verificationStatus status",
    },
  });

  if (!cart) {
    return res.status(200).json({
      items: [],
      subtotalCents: 0,
    });
  }

  let subtotalCents = 0;

  const items = cart.items
    .filter((item) => {
      const product = item.productId;

      return (
        product &&
        product.status === "active" &&
        product.shopId &&
        product.shopId.verificationStatus === "approved" &&
        product.shopId.status === "active"
      );
    })
    .map((item) => {
      const product = item.productId;

      const variant = product.variants.find((v) => v.sku === item.variantSku);

      if (!variant) return null;

      const lineTotalCents = variant.priceCents * item.quantity;

      subtotalCents += lineTotalCents;

      return {
        _id: item._id,
        product,
        variantSku: item.variantSku,
        quantity: item.quantity,
        unitPriceCents: variant.priceCents,
        lineTotalCents,
      };
    })
    .filter(Boolean);

  res.status(200).json({
    items,
    subtotalCents,
  });
});

// ADD PRODUCT TO CART
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, variantSku, quantity = 1 } = req.body;

  if (!productId || !variantSku) {
    return res.status(400).json({
      message: "Product ID and variant SKU are required",
    });
  }

  if (typeof variantSku !== "string" || !variantSku.trim()) {
    return res.status(400).json({
      message: "A valid variant SKU is required",
    });
  }

  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100) {
    return res.status(400).json({
      message: "Quantity must be an integer between 1 and 100",
    });
  }

  const product = await Product.findOne({
    _id: productId,
    status: "active",
  });

  if (!product) {
    return res.status(404).json({
      message: "Product not found or unavailable",
    });
  }

  const shop = await Shop.findOne({
    _id: product.shopId,
    verificationStatus: "approved",
    status: "active",
  });

  if (!shop) {
    return res.status(404).json({
      message: "Product shop is unavailable",
    });
  }

  const variant = product.variants.find(
    (v) => v.sku === variantSku.trim().toUpperCase(),
  );

  if (!variant) {
    return res.status(404).json({
      message: "Product variant not found",
    });
  }

  let cart = await Cart.findOne({
    userId: req.user._id,
  });

  if (!cart) {
    cart = await Cart.create({
      userId: req.user._id,
      items: [],
    });
  }

  const existingItem = cart.items.find(
    (item) =>
      item.productId.toString() === productId &&
      item.variantSku === variant.sku,
  );

  const newQuantity = existingItem
    ? existingItem.quantity + quantity
    : quantity;

  if (newQuantity > 100) {
    return res.status(400).json({
      message: "Maximum quantity per cart item is 100",
    });
  }

  if (newQuantity > variant.stock) {
    return res.status(400).json({
      message: `Only ${variant.stock} items are available`,
    });
  }

  if (existingItem) {
    existingItem.quantity = newQuantity;
  } else {
    cart.items.push({
      productId: product._id,
      variantSku: variant.sku,
      quantity,
    });
  }

  await cart.save();

  res.status(200).json({
    message: "Product added to cart successfully",
    cart,
  });
});

// UPDATE CART ITEM QUANTITY
export const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;

  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100) {
    return res.status(400).json({
      message: "Quantity must be an integer between 1 and 100",
    });
  }

  const cart = await Cart.findOne({
    userId: req.user._id,
  });

  if (!cart) {
    return res.status(404).json({
      message: "Cart not found",
    });
  }

  const item = cart.items.id(req.params.itemId);

  if (!item) {
    return res.status(404).json({
      message: "Cart item not found",
    });
  }

  const product = await Product.findOne({
    _id: item.productId,
    status: "active",
  });

  if (!product) {
    return res.status(400).json({
      message: "Product is no longer available",
    });
  }

  const shop = await Shop.findOne({
    _id: product.shopId,
    verificationStatus: "approved",
    status: "active",
  });

  if (!shop) {
    return res.status(400).json({
      message: "Product shop is no longer available",
    });
  }

  const variant = product.variants.find((v) => v.sku === item.variantSku);

  if (!variant) {
    return res.status(400).json({
      message: "Product variant is no longer available",
    });
  }

  if (quantity > variant.stock) {
    return res.status(400).json({
      message: `Only ${variant.stock} items are available`,
    });
  }

  item.quantity = quantity;

  await cart.save();

  res.status(200).json({
    message: "Cart updated successfully",
    cart,
  });
});

// REMOVE ONE CART ITEM
export const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({
    userId: req.user._id,
  });

  if (!cart) {
    return res.status(404).json({
      message: "Cart not found",
    });
  }

  const item = cart.items.id(req.params.itemId);

  if (!item) {
    return res.status(404).json({
      message: "Cart item not found",
    });
  }

  item.deleteOne();

  await cart.save();

  res.status(200).json({
    message: "Item removed from cart successfully",
  });
});

// CLEAR ENTIRE CART
export const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate(
    { userId: req.user._id },
    { $set: { items: [] } },
  );

  res.status(200).json({
    message: "Cart cleared successfully",
  });
});
