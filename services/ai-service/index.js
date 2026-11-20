// AI service: AI help for students, using a model run by Ollama.
// - Study plan: suggests tasks; the student adds the ones they want through
//   the Task service like a typed task.
// - Study tips: "Today's focus" for the Dashboard, from the student's tasks
//   and quiz scores (read from the Task and Quiz services).
// It has no database and never saves anything. If Ollama is down, the study
// plan says so and the tips fall back to simpler ones written in code; this
// service itself stays healthy so the rest of the app is not affected.
import "dotenv/config";
import { createService, startService } from "../shared/app.js";
import { requireAuth } from "../shared/auth.js";
import { callService } from "../shared/call-service.js";
import { AiError, chatJson } from "./ollama.js";
import { createRateLimiter } from "./rate-limit.js";
import {
  STUDY_PLAN_SCHEMA,
  SYSTEM_PROMPT,
  buildPrompt,
  cleanSuggestions,
  goalError,
  pickToday,
} from "./study-plan.js";
import {
  TIPS_SCHEMA,
  TIPS_SYSTEM_PROMPT,
  buildFacts,
  buildTipsPrompt,
  cleanTips,
  createTipsCache,
  isNewStudent,
  ruleTips,
} from "./study-tips.js";

const OLLAMA_URL = (process.env.OLLAMA_URL || "http://localhost:11434").replace(/\/+$/, "");
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:7b";
const TASK_SERVICE_URL = process.env.TASK_SERVICE_URL || "http://localhost:4002";
const QUIZ_SERVICE_URL = process.env.QUIZ_SERVICE_URL || "http://localhost:4003";
const limiter = createRateLimiter({ limit: 5, windowMs: 60_000 });
const tipsLimiter = createRateLimiter({ limit: 10, windowMs: 60_000 });
const tipsCache = createTipsCache({ ttlMs: 6 * 60 * 60_000, max: 1000 });
const app = createService();

app.post("/api/ai/study-plan", requireAuth, async (req, res) => {
  const { goal, today } = req.body || {};
  const error = goalError(goal);
  if (error) return res.status(400).json({ ok: false, error });

  const userId = req.user.id;
  const limitError = limiter.start(userId);
  if (limitError) return res.status(429).json({ ok: false, error: limitError });

  try {
    const raw = await chatJson({
      url: OLLAMA_URL,
      model: OLLAMA_MODEL,
      system: SYSTEM_PROMPT,
      prompt: buildPrompt(goal, pickToday(today)),
      schema: STUDY_PLAN_SCHEMA,
    });
    const tasks = cleanSuggestions(raw);
    if (tasks.length === 0) {
      return res.status(502).json({
        ok: false,
        error: "The AI couldn't make a plan from that. Try describing your goal differently.",
      });
    }
    return res.json({ ok: true, tasks });
  } catch (err) {
    if (err instanceof AiError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  } finally {
    limiter.finish(userId);
  }
});

// Always answers with tips when the student's tasks can be read: AI tips when
// the model works, otherwise tips written in code (source "rules"). AI tips
// are cached until the facts change; ?fresh=1 asks for new ones.
app.get("/api/ai/study-tips", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const id = encodeURIComponent(userId);
  const authorization = req.headers.authorization;
  const [tasks, scores] = await Promise.allSettled([
    callService(`${TASK_SERVICE_URL}/api/tasks/${id}`, authorization),
    callService(`${QUIZ_SERVICE_URL}/internal/scores/${id}`, authorization),
  ]);
  if (tasks.status === "rejected") {
    console.error("[ai-service] task-service unavailable:", tasks.reason.message);
    return res.status(503).json({ ok: false, error: "Study tips are unavailable right now." });
  }
  if (scores.status === "rejected") {
    console.error("[ai-service] quiz-service unavailable:", scores.reason.message);
  }

  const facts = buildFacts(
    tasks.value.tasks,
    scores.status === "fulfilled" ? scores.value.scores : null,
    pickToday(req.query.today)
  );
  if (isNewStudent(facts)) return res.json({ ok: true, ...ruleTips(facts), source: "rules" });

  const key = JSON.stringify(facts);
  const cached = req.query.fresh ? null : tipsCache.get(userId, key);
  if (cached) return res.json({ ok: true, ...cached, source: "ai" });

  if (tipsLimiter.start(userId)) return res.json({ ok: true, ...ruleTips(facts), source: "rules" });
  try {
    const tips = cleanTips(await chatJson({
      url: OLLAMA_URL,
      model: OLLAMA_MODEL,
      system: TIPS_SYSTEM_PROMPT,
      prompt: buildTipsPrompt(facts),
      schema: TIPS_SCHEMA,
      timeoutMs: 60_000,
    }));
    if (!tips) return res.json({ ok: true, ...ruleTips(facts), source: "rules" });
    tipsCache.set(userId, key, tips);
    return res.json({ ok: true, ...tips, source: "ai" });
  } catch (err) {
    if (!(err instanceof AiError)) throw err;
    console.error("[ai-service] study tips fell back to rules:", err.message);
    return res.json({ ok: true, ...ruleTips(facts), source: "rules" });
  } finally {
    tipsLimiter.finish(userId);
  }
});

startService(app, {
  name: "ai-service",
  port: Number(process.env.PORT) || 4005,
  init: () => console.log(`ai-service using Ollama at ${OLLAMA_URL} with model ${OLLAMA_MODEL}`),
});
