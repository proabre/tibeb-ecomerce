import assert from "node:assert/strict";
import test from "node:test";

import Order from "./Order.js";

test("orders support the sample delivery providers and default legacy orders", () => {
  const providerPath = Order.schema.path("shippingAddress.deliveryProvider");

  assert.deepEqual(providerPath.enumValues, [
    "fedex",
    "dhl",
    "ethioposta",
    "deliver_addis",
    "ahununu",
    "local_courier",
  ]);

  const order = new Order({
    shippingAddress: {
      recipientName: "Buyer",
      phone: "+251900000000",
      city: "Addis Ababa",
      addressLine: "Example address",
    },
  });

  assert.equal(order.shippingAddress.deliveryProvider, "local_courier");
});
