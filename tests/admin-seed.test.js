import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import { seedAdmin } from "../server/admin-seed.js";

test("does not create a default administrator without explicit credentials", async () => {
  let calls = 0;
  await seedAdmin(async () => { calls++; return { rows: [] }; }, {});
  assert.equal(calls, 1);
});

test("preserves existing administrators even when seed settings change", async () => {
  let calls = 0;
  await seedAdmin(async () => { calls++; return { rows: [{ id: "existing" }] }; }, {
    ADMIN_EMAIL: "changed@example.test", ADMIN_PASSWORD: "short",
  });
  assert.equal(calls, 1);
});

test("rejects incomplete or short new-administrator credentials", async () => {
  for (const env of [
    { ADMIN_EMAIL: "admin@example.test" },
    { ADMIN_PASSWORD: "a-long-test-password" },
    { ADMIN_EMAIL: "admin@example.test", ADMIN_PASSWORD: "short" },
  ]) {
    await assert.rejects(seedAdmin(async () => ({ rows: [] }), env), /ADMIN_PASSWORD/);
  }
});

test("stores a bcrypt hash and uses a parameterized insert", async () => {
  const calls = [];
  const password = "unique-test-password-only";
  await seedAdmin(async (sql, params) => {
    calls.push({ sql, params });
    return { rows: [] };
  }, { ADMIN_EMAIL: " admin@example.test ", ADMIN_PASSWORD: password });
  assert.equal(calls.length, 2);
  assert.match(calls[1].sql, /VALUES \(\$1, \$2, \$3, \$4, \$5\)/);
  assert.equal(calls[1].params[2], "admin@example.test");
  assert.notEqual(calls[1].params[3], password);
  assert.equal(await bcrypt.compare(password, calls[1].params[3]), true);
  assert.equal(calls[1].params[4], true);
});
