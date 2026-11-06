import assert from "node:assert/strict";
import test from "node:test";

import Product from "./Products.js";

test("products support a front/back photo gallery and up to three videos", () => {
  const product = new Product();
  const imagePath = Product.schema.path("images");
  const videoPath = Product.schema.path("videos");

  assert.deepEqual(product.videos, []);
  assert.equal(imagePath.options.validate.validator(Array(5).fill("photo")), true);
  assert.equal(imagePath.options.validate.validator(Array(6).fill("photo")), false);
  assert.equal(videoPath.options.validate.validator(["one", "two", "three"]), true);
  assert.equal(videoPath.options.validate.validator(["one", "two", "three", "four"]), false);
});
