import assert from "node:assert/strict";
import test from "node:test";

import User from "./User.js";

test("allows an account authenticated by a linked social provider", async () => {
  const user = new User({
    name: "Google Customer",
    email: "customer@example.com",
    googleId: "google-account-123",
    roles: ["customer"],
    status: "active",
  });

  await assert.doesNotReject(user.validate());
});

test("requires a password or linked social provider", async () => {
  const user = new User({
    name: "Customer",
    email: "customer@example.com",
    roles: ["customer"],
    status: "active",
  });

  await assert.rejects(user.validate(), (error) => {
    assert.match(error.errors.passwordHash.message, /password or a linked sign-in provider/);
    return true;
  });
});
