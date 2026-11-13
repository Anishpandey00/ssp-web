// Progress service: the Dashboard and Progress numbers. It has no database;
// it asks the Task and Quiz services at the same time and combines the answers.
import "dotenv/config";
import { createService, startService } from "../shared/app.js";
import { requireAuth, requireOwner } from "../shared/auth.js";
import { combineProgress } from "./progress.js";

const TASK_SERVICE_URL = process.env.TASK_SERVICE_URL || "http://localhost:4002";
const QUIZ_SERVICE_URL = process.env.QUIZ_SERVICE_URL || "http://localhost:4003";
const TIMEOUT_MS = 3000;
const app = createService();

// Calls another service with the student's own token, so it applies the same checks.
async function callService(url, authorization) {
  const res = await fetch(url, { headers: { Authorization: authorization }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(`${url} answered ${res.status}`);
  return data;
}

app.get("/api/progress/:userId", requireAuth, requireOwner, async (req, res) => {
  const userId = encodeURIComponent(req.params.userId);
  const authorization = req.headers.authorization;
  const [tasks, scores] = await Promise.allSettled([
    callService(`${TASK_SERVICE_URL}/internal/tasks/${userId}/summary`, authorization),
    callService(`${QUIZ_SERVICE_URL}/internal/scores/${userId}`, authorization),
  ]);

  if (tasks.status === "rejected") {
    console.error("[progress-service] task-service unavailable:", tasks.reason.message);
    return res.status(503).json({ ok: false, error: "Progress is unavailable right now. Please try again." });
  }
  if (scores.status === "rejected") {
    console.error("[progress-service] quiz-service unavailable:", scores.reason.message);
  }
  return res.json({
    ok: true,
    progress: combineProgress(tasks.value, scores.status === "fulfilled" ? scores.value.scores : null),
  });
});

startService(app, { name: "progress-service", port: Number(process.env.PORT) || 4004 });
