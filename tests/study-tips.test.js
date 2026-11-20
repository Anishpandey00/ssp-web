import test from "node:test";
import assert from "node:assert/strict";
import {
  buildFacts,
  buildTipsPrompt,
  cleanTips,
  createTipsCache,
  isNewStudent,
  ruleTips,
} from "../services/ai-service/study-tips.js";

const today = "2026-11-20";
const task = (title, subject, due_date, priority = "MEDIUM", completed = false) =>
  ({ title, subject, due_date, priority, completed });

const tasks = [
  task("Revise integrals", "Maths", "2026-11-17", "HIGH"),
  task("Finish lab report", "Physics", "2026-11-19", "MEDIUM"),
  task("Read chapter 4", "Maths", "2026-11-21", "HIGH"),
  task("Make flashcards", "Maths", null, "LOW"),
  task("Old essay", "English", "2026-11-10", "LOW", true),
];
// Newest first, as the Quiz service sends them.
const scores = [
  { quiz_title: "Cloud Basics", score: 2, total: 5 },
  { quiz_title: "Networking", score: 9, total: 10 },
  { quiz_title: "Cloud Basics", score: 5, total: 5 },
];

test("works out the facts in code", () => {
  const facts = buildFacts(tasks, scores, today);
  assert.equal(facts.pendingCount, 4);
  assert.equal(facts.completedCount, 1);
  assert.equal(facts.completionRate, 20);
  assert.equal(facts.overdueCount, 2);
  assert.deepEqual(facts.overdue[0], { title: "Revise integrals", subject: "Maths", priority: "HIGH", daysOverdue: 3 });
  assert.deepEqual(facts.dueSoon, [{ title: "Read chapter 4", subject: "Maths", priority: "HIGH", daysLeft: 1 }]);
  assert.equal(facts.undatedCount, 1);
  assert.deepEqual(facts.busiestSubject, { name: "Maths", count: 3 });
  assert.equal(facts.quizzesTaken, 3);
  // Uses the latest attempt: 2/5, not the older 5/5.
  assert.deepEqual(facts.weakQuiz, { title: "Cloud Basics", percent: 40 });
  assert.deepEqual(facts.strongQuiz, { title: "Networking", percent: 90 });
});

test("handles missing quiz scores and new students", () => {
  const facts = buildFacts(tasks, null, today);
  assert.equal(facts.scoresUnavailable, true);
  assert.equal(facts.weakQuiz, null);
  assert.match(buildTipsPrompt(facts), /Quiz scores are not available/);
  assert.equal(isNewStudent(buildFacts([], [], today)), true);
  assert.match(ruleTips(buildFacts([], [], today)).focus, /first study task/);
});

test("the prompt lists only the facts that apply", () => {
  const prompt = buildTipsPrompt(buildFacts(tasks, scores, today));
  assert.match(prompt, /^Today is 2026-11-20\./);
  assert.match(prompt, /Overdue tasks \(2\): "Revise integrals" \(Maths, HIGH priority, 3 days overdue\)/);
  assert.match(prompt, /"Read chapter 4" \(Maths, HIGH priority, due tomorrow\)/);
  assert.match(prompt, /Weakest quiz: "Cloud Basics", latest score 40%/);
  const calm = buildTipsPrompt(buildFacts([task("Read", "Art", null)], [], today));
  assert.doesNotMatch(calm, /Overdue|Due in the next/);
  assert.match(calm, /No quizzes taken yet/);
});

test("rule tips start with the most urgent thing", () => {
  const facts = buildFacts(tasks, scores, today);
  const { focus, tips } = ruleTips(facts);
  assert.equal(focus, 'You have 2 overdue tasks. Start with "Revise integrals".');
  assert.ok(tips.length >= 2 && tips.length <= 3);
  assert.match(tips[0], /"Read chapter 4" is due tomorrow/);
  assert.ok(tips.some((t) => t.includes("Cloud Basics")));
});

test("cleans the model's answer and rejects unusable ones", () => {
  assert.deepEqual(
    cleanTips({ focus: "**Start with Revise integrals.**", tips: ["- Review Cloud Basics.", "", 3, "Start with Revise integrals."] }),
    { focus: "Start with Revise integrals.", tips: ["Review Cloud Basics."] }
  );
  assert.equal(cleanTips({ focus: "", tips: ["x"] }), null);
  assert.equal(cleanTips({ focus: "Do it", tips: [] }), null);
  assert.equal(cleanTips(null), null);
  assert.equal(cleanTips({ focus: "a".repeat(500), tips: ["b"] }).focus.length, 220);
});

test("the cache returns tips only while the facts and time match", () => {
  const cache = createTipsCache({ ttlMs: 1000, max: 2 });
  cache.set("u1", "k1", { focus: "f" }, 0);
  assert.deepEqual(cache.get("u1", "k1", 500), { focus: "f" });
  assert.equal(cache.get("u1", "k2", 500), null);
  assert.equal(cache.get("u1", "k1", 1500), null);
  cache.set("u2", "k", {}, 0);
  cache.set("u3", "k", {}, 0);
  assert.equal(cache.get("u1", "k1", 10), null); // oldest dropped past max
});
