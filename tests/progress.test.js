import test from "node:test";
import assert from "node:assert/strict";
import { combineProgress } from "../services/progress-service/progress.js";

const scores = [
  { id: "s2", score: 4, total: 5 },
  { id: "s1", score: 2, total: 5 },
];

test("combines the task summary and the quiz scores", () => {
  assert.deepEqual(combineProgress({ totalTasks: 4, completedTasks: 3 }, scores), {
    totalTasks: 4,
    completedTasks: 3,
    completionRate: 75,
    quizzesTaken: 2,
    scores,
    scoresUnavailable: false,
  });
});

test("a student with no tasks has a 0% completion rate", () => {
  assert.equal(combineProgress({ totalTasks: 0, completedTasks: 0 }, []).completionRate, 0);
});

test("keeps the task numbers when the Quiz service is unavailable", () => {
  const progress = combineProgress({ totalTasks: 3, completedTasks: 1 }, null);
  assert.equal(progress.completionRate, 33);
  assert.equal(progress.quizzesTaken, 0);
  assert.deepEqual(progress.scores, []);
  assert.equal(progress.scoresUnavailable, true);
});
