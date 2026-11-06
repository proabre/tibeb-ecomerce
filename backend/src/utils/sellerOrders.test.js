import assert from "node:assert/strict";
import test from "node:test";

import {
  findSellerOrderForShop,
  sellerOrderShopFilter,
} from "./sellerOrders.js";

const shopId = "507f1f77bcf86cd799439011";

test("matches seller orders by their shop ID", () => {
  const sellerOrder = { shopId, items: [] };

  assert.equal(findSellerOrderForShop([sellerOrder], shopId), sellerOrder);
});

test("matches legacy seller orders using an item's shop ID", () => {
  const sellerOrder = {
    items: [{ shopId }],
  };

  assert.equal(findSellerOrderForShop([sellerOrder], shopId), sellerOrder);
});

test("does not match another shop's order", () => {
  assert.equal(
    findSellerOrderForShop(
      [{ shopId: "507f1f77bcf86cd799439012", items: [] }],
      shopId,
    ),
    undefined,
  );
});

test("queries both seller-order and item shop IDs", () => {
  assert.deepEqual(sellerOrderShopFilter(shopId), {
    $or: [
      { "sellerOrders.shopId": shopId },
      { "sellerOrders.items.shopId": shopId },
    ],
  });
});
