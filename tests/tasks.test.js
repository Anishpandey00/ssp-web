import test from "node:test";
import assert from "node:assert/strict";
import { dueInfo, compareTasks, taskFormError } from "../src/utils/tasks.js";

const today = new Date(2026, 9, 23); // 2026-10-23

test("dueInfo gives friendly labels", () => {
  assert.equal(dueInfo("", today), null);
  assert.deepEqual(dueInfo("2026-10-21", today), { text: "Overdue by 2 days", tone: "overdue" });
  assert.deepEqual(dueInfo("2026-10-22", today), { text: "Overdue by 1 day", tone: "overdue" });
  assert.deepEqual(dueInfo("2026-10-23", today), { text: "Due today", tone: "soon" });
  assert.deepEqual(dueInfo("2026-10-24", today), { text: "Due tomorrow", tone: "soon" });
  assert.deepEqual(dueInfo("2026-10-28", today), { text: "Due in 5 days", tone: "later" });
  assert.deepEqual(dueInfo("2026-12-20", today), { text: "Due Dec 20", tone: "later" });
});

test("compareTasks puts pending first, then earliest due date, undated last", () => {
  const tasks = [
    { id: "done", completed: true, due_date: "2026-10-24" },
    { id: "none", completed: false, due_date: null },
    { id: "late", completed: false, due_date: "2026-12-01" },
    { id: "soon", completed: false, due_date: "2026-10-25" },
  ];
  assert.deepEqual(tasks.sort(compareTasks).map((t) => t.id), ["soon", "late", "none", "done"]);
});

test("taskFormError requires a title and keeps an unchanged past date valid", () => {
  const form = { title: "  ", subject: "", dueDate: "", priority: "MEDIUM" };
  assert.equal(taskFormError(form), "Enter a task title.");
  assert.match(taskFormError({ ...form, title: "Read", dueDate: "2020-01-01" }), /^Please choose a due date within the next 2 months/);
  assert.equal(taskFormError({ ...form, title: "Read", dueDate: "2020-01-01" }, "2020-01-01"), "");
});
