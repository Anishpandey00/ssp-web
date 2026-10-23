import test from "node:test";
import assert from "node:assert/strict";
import { dueDateError } from "../server/due-date.js";
import { dueDateError as clientDueDateError, dueDateRangeText } from "../src/utils/dueDate.js";

const now = new Date("2026-10-23T04:00:00Z");
const RANGE = /^Please choose a due date within the next 2 months/;

for (const [name, check] of [["server", dueDateError], ["client", clientDueDateError]]) {
  test(`${name}: accepts empty and dates from today up to 2 months ahead`, () => {
    assert.equal(check("", now), "");
    assert.equal(check("2026-10-23", now), "");
    assert.equal(check("2026-12-23", now), "");
  });

  test(`${name}: rejects malformed, past and too-far dates with one message`, () => {
    for (const bad of ["44242-12-31", "2026-02-30", "tomorrow", "2026-04-11", "2025-01-01", "2026-12-25", "2099-01-01"]) {
      assert.match(check(bad, now), RANGE, bad);
    }
  });
}

test("client: the message names the allowed range", () => {
  const today = new Date(2026, 9, 23);
  assert.equal(dueDateRangeText(today), "Oct 23, 2026 – Dec 23, 2026");
  assert.equal(
    clientDueDateError("2026-04-11", today),
    "Please choose a due date within the next 2 months (Oct 23, 2026 – Dec 23, 2026)."
  );
});

test("client: Dec 31 + 2 months is the end of February, not March", () => {
  assert.equal(clientDueDateError("2027-02-28", new Date(2026, 11, 31)), "");
  assert.match(clientDueDateError("2027-03-03", new Date(2026, 11, 31)), RANGE);
});
