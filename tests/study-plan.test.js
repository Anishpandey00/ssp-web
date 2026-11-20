import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_TASKS,
  buildPrompt,
  cleanSuggestions,
  goalError,
  pickToday,
} from "../services/ai-service/study-plan.js";
import { createRateLimiter } from "../services/ai-service/rate-limit.js";

const now = new Date("2026-11-20T10:00:00Z");

test("goal must be a short description", () => {
  assert.equal(goalError("Calculus exam on Dec 12, weak on integrals"), "");
  assert.match(goalError("exam"), /few more words/);
  assert.match(goalError(42), /few more words/);
  assert.match(goalError("x".repeat(501)), /under 500/);
});

test("uses the browser's date only when it is within a day of the server's", () => {
  assert.equal(pickToday("2026-11-21", now), "2026-11-21");
  assert.equal(pickToday("2026-11-19", now), "2026-11-19");
  assert.equal(pickToday("2026-11-25", now), "2026-11-20");
  assert.equal(pickToday("2026-02-30", now), "2026-11-20");
  assert.equal(pickToday(undefined, now), "2026-11-20");
});

test("the prompt gives the model a calendar to copy dates from", () => {
  const prompt = buildPrompt("  Physics exam on Dec 12  ", "2026-11-20");
  assert.match(prompt, /^Today is 2026-11-20 Fri\./);
  assert.match(prompt, /2026-12-12 Sat/);
  assert.match(prompt, /"""\nPhysics exam on Dec 12\n"""/);
});

test("keeps good suggestions and tidies the rest", () => {
  const tasks = cleanSuggestions(
    {
      tasks: [
        { title: "  Revise   optics notes ", subject: "Physics", dueDate: "2026-11-22", priority: "high" },
        { title: "Revise optics notes", subject: "Physics", dueDate: "2026-11-23", priority: "LOW" },
        { title: "Practice past paper", subject: "", dueDate: "2027-06-01", priority: "URGENT" },
        { title: "", subject: "Physics", dueDate: "2026-11-24", priority: "LOW" },
        "not a task",
      ],
    },
    now
  );
  assert.deepEqual(tasks, [
    { title: "Revise optics notes", subject: "Physics", dueDate: "2026-11-22", priority: "HIGH" },
    { title: "Practice past paper", subject: "General", dueDate: "", priority: "MEDIUM" },
  ]);
});

test("returns no tasks for an unusable answer, and at most MAX_TASKS", () => {
  assert.deepEqual(cleanSuggestions(null, now), []);
  assert.deepEqual(cleanSuggestions({ tasks: "nope" }, now), []);
  const many = Array.from({ length: 20 }, (_, i) => ({ title: `Task ${i}`, subject: "Maths", dueDate: "", priority: "LOW" }));
  assert.equal(cleanSuggestions({ tasks: many }, now).length, MAX_TASKS);
});

test("rate limiter allows one request at a time and a few per minute", () => {
  const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 });
  assert.equal(limiter.start("u1", 0), "");
  assert.match(limiter.start("u1", 1), /still running/);
  assert.equal(limiter.start("u2", 1), "");
  limiter.finish("u1");
  assert.equal(limiter.start("u1", 2), "");
  limiter.finish("u1");
  assert.match(limiter.start("u1", 3), /wait a minute/);
  assert.equal(limiter.start("u1", 60_001), "");
});
