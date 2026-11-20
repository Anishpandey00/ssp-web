// AI service: AI suggestions for students, using a model run by Ollama.
// It has no database and never saves anything: the student reviews each
// suggestion and adds it through the Task service like a typed task.
// If Ollama is down, only the AI buttons stop working; this service itself
// stays healthy so the rest of the app is not affected.
import "dotenv/config";
import { createService, startService } from "../shared/app.js";
import { requireAuth } from "../shared/auth.js";
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

const OLLAMA_URL = (process.env.OLLAMA_URL || "http://localhost:11434").replace(/\/+$/, "");
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:7b";
const limiter = createRateLimiter({ limit: 5, windowMs: 60_000 });
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

startService(app, {
  name: "ai-service",
  port: Number(process.env.PORT) || 4005,
  init: () => console.log(`ai-service using Ollama at ${OLLAMA_URL} with model ${OLLAMA_MODEL}`),
});
