import assert from "node:assert/strict";
import test from "node:test";

import Shop from "./Shop.js";

test("shop payout account stores private account data in excluded encrypted fields", () => {
  assert.equal(
    Shop.schema.path("payoutAccount.accountNumberEncrypted").options.select,
    false,
  );
  assert.equal(
    Shop.schema.path("payoutAccount.accountNameEncrypted").options.select,
    false,
  );
  assert.equal(Shop.schema.path("payoutAccount.accountNumberLast4").options.maxlength, 4);
});
