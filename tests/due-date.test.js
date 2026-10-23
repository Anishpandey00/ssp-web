import test from "node:test";
import assert from "node:assert/strict";
import { dueDateError } from "../server/due-date.js";
import { dueDateError as clientDueDateError } from "../src/utils/dueDate.js";

const now = new Date("2026-10-23T04:00:00Z");

for (const [name, check] of [["server", dueDateError], ["client", clientDueDateError]]) {
  test(`${name}: accepts empty and dates from today up to 5 years ahead`, () => {
    assert.equal(check("", now), "");
    assert.equal(check("2026-10-23", now), "");
    assert.equal(check("2031-10-23", now), "");
  });

  test(`${name}: rejects malformed and impossible dates`, () => {
    assert.equal(check("44242-12-31", now), "Enter a valid due date.");
    assert.equal(check("2026-02-30", now), "Enter a valid due date.");
    assert.equal(check("tomorrow", now), "Enter a valid due date.");
  });

  test(`${name}: rejects past dates and dates too far ahead`, () => {
    assert.equal(check("2025-01-01", now), "Due date cannot be in the past.");
    assert.equal(check("2099-01-01", now), "Due date must be within 5 years.");
  });
}
