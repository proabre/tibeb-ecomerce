import assert from "node:assert/strict";
import test from "node:test";

import { grantConfiguredAdminRole } from "./adminAccess.js";

test("grants admin only to an email explicitly configured by the operator", () => {
  const user = { email: "Admin@Example.com", roles: ["customer"] };

  assert.equal(
    grantConfiguredAdminRole(user, "other@example.com, admin@example.com"),
    true,
  );
  assert.deepEqual(user.roles, ["customer", "admin"]);
});

test("does not grant admin to an unconfigured email or duplicate the role", () => {
  const user = { email: "customer@example.com", roles: ["customer"] };
  assert.equal(grantConfiguredAdminRole(user, "admin@example.com"), false);
  assert.deepEqual(user.roles, ["customer"]);

  user.email = "admin@example.com";
  user.roles.push("admin");
  assert.equal(grantConfiguredAdminRole(user, "admin@example.com"), false);
  assert.deepEqual(user.roles, ["customer", "admin"]);
});
