// Quiz service: quizzes, questions, saved scores and the admin's quiz editing.
// Owns quiz_db (quizzes, questions, scores). Scores live here because saving
// one is checked against the quiz's question count.
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { createService, startService } from "../shared/app.js";
import { requireAuth, requireOwner, requireAdmin } from "../shared/auth.js";
import { createDb } from "../shared/db.js";
import { QUIZZES } from "./data/quizzes.js";

const db = createDb(process.env.QUIZ_DB_NAME || "quiz_db");
const { query } = db;
const app = createService();

async function loadQuizzes(withOrder) {
  const quizzesResult = await query("SELECT * FROM quizzes ORDER BY created_at ASC");
  const questionsResult = await query("SELECT * FROM questions ORDER BY order_index ASC");
  return quizzesResult.rows.map((quiz) => ({
    ...quiz,
    questions: questionsResult.rows
      .filter((q) => q.quiz_id === quiz.id)
      .map((q) => ({
        id: q.id,
        text: q.text,
        options: q.options,
        answerIndex: q.answer_index,
        ...(withOrder && { orderIndex: q.order_index }),
      })),
  }));
}

function listScores(userId) {
  return query("SELECT * FROM scores WHERE user_id = $1 ORDER BY taken_at DESC", [userId]);
}

// ── Student routes ────────────────────────────────────────────────────────────
app.get("/api/quizzes", requireAuth, async (req, res) => {
  return res.json({ ok: true, quizzes: await loadQuizzes(false) });
});

app.post("/api/scores/:userId", requireAuth, requireOwner, async (req, res) => {
  const { userId } = req.params;
  const { quizId, score } = req.body;
  if (typeof quizId !== "string" || !Number.isInteger(score)) {
    return res.json({ ok: false, error: "Quiz score payload is invalid." });
  }

  // Title and question count come from the database, not the request.
  const quiz = await query(
    `SELECT q.title, COUNT(qs.id)::int AS total
     FROM quizzes q LEFT JOIN questions qs ON qs.quiz_id = q.id
     WHERE q.id = $1 GROUP BY q.id`,
    [quizId]
  );
  if (quiz.rows.length === 0) return res.json({ ok: false, error: "Quiz not found." });
  const { title, total } = quiz.rows[0];
  if (score < 0 || score > total) {
    return res.json({ ok: false, error: "Score is out of range." });
  }

  const result = await query(
    `INSERT INTO scores (id, user_id, quiz_id, quiz_title, score, total, taken_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [randomUUID(), userId, quizId, title, score, total, new Date().toISOString()]
  );
  return res.json({ ok: true, entry: result.rows[0] });
});

// Internal: called by the Progress service, never routed by the gateway.
app.get("/internal/scores/:userId", requireAuth, requireOwner, async (req, res) => {
  return res.json({ ok: true, scores: (await listScores(req.params.userId)).rows });
});

// ── Admin routes ──────────────────────────────────────────────────────────────
app.get("/api/admin/quizzes", requireAuth, requireAdmin, async (req, res) => {
  return res.json({ ok: true, quizzes: await loadQuizzes(true) });
});

app.post("/api/admin/quizzes", requireAuth, requireAdmin, async (req, res) => {
  const { title, description = "" } = req.body;
  if (!title?.trim()) return res.json({ ok: false, error: "Quiz title is required." });

  const result = await query(
    "INSERT INTO quizzes (id, title, description, created_at) VALUES ($1, $2, $3, $4) RETURNING *",
    [randomUUID(), title.trim(), description.trim(), new Date().toISOString()]
  );
  return res.json({ ok: true, quiz: { ...result.rows[0], questions: [] } });
});

app.put("/api/admin/quizzes/:quizId", requireAuth, requireAdmin, async (req, res) => {
  const { quizId } = req.params;
  const { title, description } = req.body;
  if (!title?.trim()) return res.json({ ok: false, error: "Title is required." });

  const result = await query(
    "UPDATE quizzes SET title = $1, description = $2 WHERE id = $3 RETURNING *",
    [title.trim(), (description || "").trim(), quizId]
  );
  if (result.rows.length === 0) return res.json({ ok: false, error: "Quiz not found." });
  return res.json({ ok: true, quiz: result.rows[0] });
});

app.delete("/api/admin/quizzes/:quizId", requireAuth, requireAdmin, async (req, res) => {
  await query("DELETE FROM quizzes WHERE id = $1", [req.params.quizId]);
  return res.json({ ok: true });
});

app.post("/api/admin/quizzes/:quizId/questions", requireAuth, requireAdmin, async (req, res) => {
  const { quizId } = req.params;
  const { text, options, answerIndex } = req.body;

  if (!text?.trim() || !Array.isArray(options) || options.length < 2) {
    return res.json({ ok: false, error: "Question text and at least 2 options are required." });
  }
  if (typeof answerIndex !== "number" || answerIndex < 0 || answerIndex >= options.length) {
    return res.json({ ok: false, error: "Invalid answer index." });
  }

  const countResult = await query("SELECT COUNT(*) FROM questions WHERE quiz_id = $1", [quizId]);
  const orderIndex = parseInt(countResult.rows[0].count, 10);

  const result = await query(
    "INSERT INTO questions (id, quiz_id, text, options, answer_index, order_index) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [randomUUID(), quizId, text.trim(), JSON.stringify(options), answerIndex, orderIndex]
  );
  const row = result.rows[0];
  return res.json({
    ok: true,
    question: { id: row.id, text: row.text, options: row.options, answerIndex: row.answer_index, orderIndex: row.order_index },
  });
});

app.delete("/api/admin/quizzes/:quizId/questions/:questionId", requireAuth, requireAdmin, async (req, res) => {
  const { quizId, questionId } = req.params;
  await query("DELETE FROM questions WHERE id = $1 AND quiz_id = $2", [questionId, quizId]);
  return res.json({ ok: true });
});

// ── Start ─────────────────────────────────────────────────────────────────────
async function init() {
  await db.ensureDatabase();
  await query(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TEXT NOT NULL
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      options JSONB NOT NULL,
      answer_index INTEGER NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0
    )
  `);
  // user_id comes from the verified login token; users live in the Auth
  // service's database, so there is no foreign key to them.
  await query(`
    CREATE TABLE IF NOT EXISTS scores (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      quiz_id TEXT NOT NULL,
      quiz_title TEXT NOT NULL,
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      taken_at TEXT NOT NULL
    )
  `);
  await query("CREATE INDEX IF NOT EXISTS scores_user_id_idx ON scores (user_id)");

  // Seed the starter quizzes into an empty database.
  const existing = await query("SELECT COUNT(*) FROM quizzes");
  if (parseInt(existing.rows[0].count, 10) === 0) {
    for (const quiz of QUIZZES) {
      const quizId = quiz.id || randomUUID();
      await query(
        "INSERT INTO quizzes (id, title, description, created_at) VALUES ($1, $2, $3, $4)",
        [quizId, quiz.title, quiz.description || "", new Date().toISOString()]
      );
      for (let i = 0; i < quiz.questions.length; i++) {
        const q = quiz.questions[i];
        await query(
          "INSERT INTO questions (id, quiz_id, text, options, answer_index, order_index) VALUES ($1, $2, $3, $4, $5, $6)",
          [randomUUID(), quizId, q.text, JSON.stringify(q.options), q.answerIndex, i]
        );
      }
    }
    console.log(`Seeded ${QUIZZES.length} quizzes.`);
  }
}

startService(app, {
  name: "quiz-service",
  port: Number(process.env.PORT) || 4003,
  init,
  health: () => query("SELECT 1"),
});
