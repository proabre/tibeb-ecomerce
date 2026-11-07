import assert from "node:assert/strict";
import test from "node:test";

import Product from "./Products.js";

test("product categories include couples, wedding, and christening", () => {
  const categories = Product.schema.path("category").enumValues;

  assert.ok(categories.includes("couples"));
  assert.ok(categories.includes("wedding"));
  assert.ok(categories.includes("christening"));
});
