import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateCommissionCents,
  DEFAULT_COMMISSION_RATE_BPS,
} from "./commission.js";
import Order from "../models/Order.js";
import Shop from "../models/Shop.js";

test("uses a 10% default commission rate", () => {
  assert.equal(DEFAULT_COMMISSION_RATE_BPS, 1000);
  assert.equal(
    calculateCommissionCents(100000, DEFAULT_COMMISSION_RATE_BPS),
    10000,
  );
  assert.equal(new Shop().commissionRateBps, DEFAULT_COMMISSION_RATE_BPS);
});

test("seller orders persist commission and settlement snapshots", () => {
  const sellerOrderSchema = Order.schema.path("sellerOrders").schema;

  assert.equal(
    sellerOrderSchema.path("commissionRateBps").options.default,
    DEFAULT_COMMISSION_RATE_BPS,
  );
  assert.ok(sellerOrderSchema.path("commissionCents"));
  assert.ok(sellerOrderSchema.path("sellerEarningsCents"));
  assert.ok(sellerOrderSchema.path("settlementStatus"));
  assert.ok(Order.schema.path("platformCommissionCents"));
});

test("rounds commission to the nearest cent", () => {
  assert.equal(calculateCommissionCents(1, 5000), 1);
  assert.equal(calculateCommissionCents(1, 4999), 0);
});

test("supports a zero rate and the maximum rate", () => {
  assert.equal(calculateCommissionCents(1000, 0), 0);
  assert.equal(calculateCommissionCents(1000, 10000), 1000);
});

test("rejects unsafe amounts and invalid commission rates", () => {
  assert.throws(() => calculateCommissionCents(-1, 1000), RangeError);
  assert.throws(() => calculateCommissionCents(1.5, 1000), RangeError);
  assert.throws(() => calculateCommissionCents(1, -1), RangeError);
  assert.throws(() => calculateCommissionCents(1, 10001), RangeError);
});
