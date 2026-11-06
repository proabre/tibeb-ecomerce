import assert from "node:assert/strict";
import test from "node:test";

import {
  hasValidOptionalProductVideos,
  hasValidProductImages,
} from "./productMedia.js";

test("product listings require front and back photos and allow up to three extras", () => {
  assert.equal(hasValidProductImages([]), false);
  assert.equal(hasValidProductImages(["front"]), false);
  assert.equal(hasValidProductImages(["front", "back"]), true);
  assert.equal(hasValidProductImages(["front", "back", "side", "detail", "fabric"]), true);
  assert.equal(hasValidProductImages(Array(6).fill("photo")), false);
});

test("product listings allow up to three optional short videos", () => {
  assert.equal(hasValidOptionalProductVideos(undefined), true);
  assert.equal(hasValidOptionalProductVideos([]), true);
  assert.equal(hasValidOptionalProductVideos(["one", "two", "three"]), true);
  assert.equal(hasValidOptionalProductVideos(["one", "two", "three", "four"]), false);
  assert.equal(hasValidOptionalProductVideos("video"), false);
});
