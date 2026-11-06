import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";

import Order from "./Order.js";

test("order history retains actor and seller fulfillment details", () => {
  const actorId = new mongoose.Types.ObjectId();
  const sellerOrderId = new mongoose.Types.ObjectId();
  const order = new Order({
    statusHistory: [
      {
        status: "processing",
        actorId,
        sellerOrderId,
        sellerStatus: "preparing",
        note: "Shop updated its order to preparing.",
      },
    ],
  });

  assert.equal(order.statusHistory[0].actorId.toString(), actorId.toString());
  assert.equal(
    order.statusHistory[0].sellerOrderId.toString(),
    sellerOrderId.toString(),
  );
  assert.equal(order.statusHistory[0].sellerStatus, "preparing");
  assert.ok(order.statusHistory[0].changedAt instanceof Date);
});
