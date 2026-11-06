import "dotenv/config";

import mongoose from "mongoose";
import { productCatalog } from "../../../frontend/src/data/catalog.js";
import Product from "../models/Products.js";
import Shop from "../models/Shop.js";

const shopSlug = process.argv[2];

if (!shopSlug) {
  throw new Error("Usage: npm run seed:catalog -- <approved-shop-slug>");
}

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is required to seed the catalog.");
}

try {
  await mongoose.connect(process.env.MONGODB_URI);

  const shop = await Shop.findOne({
    slug: shopSlug,
    verificationStatus: "approved",
    status: "active",
  });

  if (!shop) {
    throw new Error(`No approved, active shop found with slug "${shopSlug}".`);
  }

  const existingProducts = await Product.find({
    shopId: shop._id,
    slug: { $in: productCatalog.map(({ slug }) => slug) },
  }).select("slug");

  const existingSlugs = new Set(existingProducts.map(({ slug }) => slug));
  const productsToCreate = productCatalog
    .filter(({ slug }) => !existingSlugs.has(slug))
    .map((product) => ({
      shopId: shop._id,
      title: product.name,
      slug: product.slug,
      description: product.description,
      category: product.category,
      material: product.material,
      craftsmanship: product.craftsmanship,
      madeToOrder: product.category === "custom",
      productionDays: product.category === "custom" ? 14 : 0,
      images: product.images,
      variants: product.variants.map((variant, index) => ({
        sku: `${product.slug}-${index + 1}`.toUpperCase(),
        size: variant.label,
        priceCents: Math.round(variant.price * 100),
        stock: product.stock,
      })),
      status: "draft",
    }));

  if (productsToCreate.length) {
    await Product.insertMany(productsToCreate, { ordered: true });
  }

  console.log(
    `Catalog seeded for ${shop.name}: ${productsToCreate.length} created, ${existingSlugs.size} already existed.`,
  );
  console.log("New products are drafts and require admin approval before they can be ordered.");
} finally {
  await mongoose.disconnect();
}
