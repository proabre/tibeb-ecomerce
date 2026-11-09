import assert from "node:assert/strict";
import test from "node:test";

import {
  decryptPayoutAccountNumber,
  encryptPayoutAccountNumber,
  normalizePayoutAccount,
} from "./payoutAccount.js";

const encryptionKey = "a".repeat(64);

test("normalizes valid bank payout account details", () => {
  const result = normalizePayoutAccount({
    method: "bank_transfer",
    institution: "commercial_bank_of_ethiopia",
    accountName: "  Seller Name ",
    accountNumber: " 1234-5678 ",
  });

  assert.deepEqual(result, {
    value: {
      provider: "chapa",
      method: "bank_transfer",
      institution: "commercial_bank_of_ethiopia",
      accountName: "Seller Name",
      accountNumber: "12345678",
    },
  });
});

test("requires a bank for bank transfers and rejects unsupported methods", () => {
  assert.match(
    normalizePayoutAccount({
      method: "bank_transfer",
      accountName: "Seller Name",
      accountNumber: "12345678",
    }).error,
    /supported bank/,
  );
  assert.match(
    normalizePayoutAccount({
      method: "unknown",
      accountName: "Seller Name",
      accountNumber: "0912345678",
    }).error,
    /supported payout method/,
  );
});

test("encrypts payout account numbers and only decrypts with the right key", () => {
  const accountNumber = "0912345678";
  const encrypted = encryptPayoutAccountNumber(accountNumber, encryptionKey);

  assert.notEqual(encrypted, accountNumber);
  assert.equal(decryptPayoutAccountNumber(encrypted, encryptionKey), accountNumber);
  assert.throws(() =>
    decryptPayoutAccountNumber(encrypted, "b".repeat(64)),
  );
});

test("requires a configured 32-byte hexadecimal encryption key", () => {
  assert.throws(
    () => encryptPayoutAccountNumber("0912345678", "invalid"),
    { statusCode: 503 },
  );
});
