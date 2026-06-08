import "dotenv/config";
import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";
import { query, initDb } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "ssp_dev_secret_change_in_production";

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, bypass-tunnel-reminder");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,PATCH,PUT,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, error: "Unauthorized." });
  }
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Invalid or expired token." });
  }
}

function requireOwner(req, res, next) {
  if (req.params.userId && req.params.userId !== req.user.id) {
    return res.status(403).json({ ok: false, error: "Forbidden." });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ ok: false, error: "Admin access required." });
  }
  next();
}

// ── Public routes ─────────────────────────────────────────────────────────────
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.json({ ok: false, error: "Name, email, and password are required." });
  }
  if (name.length > 100 || email.length > 200 || password.length > 200) {
    return res.json({ ok: false, error: "Input is too long." });
  }

  const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows.length > 0) {
    return res.json({ ok: false, error: "An account with that email already exists." });
  }

  const id = randomUUID();
  const hashedPassword = await bcrypt.hash(password, 10);
  await query(
    "INSERT INTO users (id, name, email, password) VALUES ($1, $2, $3, $4)",
    [id, name, email, hashedPassword]
  );

  const token = jwt.sign({ id, name, email, isAdmin: false }, JWT_SECRET, { expiresIn: "7d" });
  return res.json({ ok: true, user: { id, name, email, isAdmin: false }, token });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.json({ ok: false, error: "Email and password are required." });
  }

  const result = await query("SELECT * FROM users WHERE email = $1", [email]);
  const user = result.rows[0];
  const passwordMatches = user && (await bcrypt.compare(password, user.password));
  if (!passwordMatches) {
    return res.json({ ok: false, error: "Invalid email or password." });
  }

  const { id, name, is_admin: isAdmin } = user;
  const token = jwt.sign({ id, name, email, isAdmin: !!isAdmin }, JWT_SECRET, { expiresIn: "7d" });
  return res.json({ ok: true, user: { id, name, email, isAdmin: !!isAdmin }, token });
});

// ── Task routes ───────────────────────────────────────────────────────────────
app.get("/api/tasks/:userId", requireAuth, requireOwner, async (req, res) => {
  const { userId } = req.params;
  const result = await query(
    "SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );
  return res.json({ ok: true, tasks: result.rows });
});

app.post("/api/tasks/:userId", requireAuth, requireOwner, async (req, res) => {
  const { userId } = req.params;
  const { title, subject = "General", dueDate = null, priority = "MEDIUM" } = req.body;
  if (!title) return res.json({ ok: false, error: "Task title is required." });
  if (title.length > 300) return res.json({ ok: false, error: "Task title is too long." });

  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const result = await query(
    `INSERT INTO tasks (id, user_id, title, subject, due_date, priority, completed, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, FALSE, $7) RETURNING *`,
    [id, userId, title, subject.slice(0, 100), dueDate, priority, createdAt]
  );
  return res.json({ ok: true, task: result.rows[0] });
});

app.patch("/api/tasks/:userId/:taskId/toggle", requireAuth, requireOwner, async (req, res) => {
  const { userId, taskId } = req.params;
  const result = await query(
    `UPDATE tasks SET completed = NOT completed WHERE id = $1 AND user_id = $2 RETURNING *`,
    [taskId, userId]
  );
  if (result.rows.length === 0) return res.json({ ok: false, error: "Task not found." });

  const tasks = await query(
    "SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );
  return res.json({ ok: true, tasks: tasks.rows });
});

app.delete("/api/tasks/:userId/:taskId", requireAuth, requireOwner, async (req, res) => {
  const { userId, taskId } = req.params;
  await query("DELETE FROM tasks WHERE id = $1 AND user_id = $2", [taskId, userId]);

  const tasks = await query(
    "SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );
  return res.json({ ok: true, tasks: tasks.rows });
});

// ── Quiz routes (read — served from DB) ───────────────────────────────────────
app.get("/api/quizzes", requireAuth, async (req, res) => {
  const quizzesResult = await query("SELECT * FROM quizzes ORDER BY created_at ASC");
  const questionsResult = await query("SELECT * FROM questions ORDER BY order_index ASC");

  const quizzes = quizzesResult.rows.map((quiz) => ({
    ...quiz,
    questions: questionsResult.rows
      .filter((q) => q.quiz_id === quiz.id)
      .map((q) => ({
        id: q.id,
        text: q.text,
        options: q.options,
        answerIndex: q.answer_index,
      })),
  }));

  return res.json({ ok: true, quizzes });
});

// ── Score & progress routes ────────────────────────────────────────────────────
app.post("/api/scores/:userId", requireAuth, requireOwner, async (req, res) => {
  const { userId } = req.params;
  const { quizId, quizTitle, score, total } = req.body;
  if (!quizId || !quizTitle || typeof score !== "number" || typeof total !== "number") {
    return res.json({ ok: false, error: "Quiz score payload is invalid." });
  }

  const id = randomUUID();
  const takenAt = new Date().toISOString();
  const result = await query(
    `INSERT INTO scores (id, user_id, quiz_id, quiz_title, score, total, taken_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [id, userId, quizId, quizTitle, score, total, takenAt]
  );
  return res.json({ ok: true, entry: result.rows[0] });
});

app.get("/api/progress/:userId", requireAuth, requireOwner, async (req, res) => {
  const { userId } = req.params;
  const tasksResult = await query("SELECT * FROM tasks WHERE user_id = $1", [userId]);
  const scoresResult = await query(
    "SELECT * FROM scores WHERE user_id = $1 ORDER BY taken_at DESC",
    [userId]
  );

  const tasks = tasksResult.rows;
  const scores = scoresResult.rows;
  const completed = tasks.filter((t) => t.completed).length;

  return res.json({
    ok: true,
    progress: {
      totalTasks: tasks.length,
      completedTasks: completed,
      completionRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
      quizzesTaken: scores.length,
      scores,
    },
  });
});

// ── Admin routes ──────────────────────────────────────────────────────────────
// GET  /api/admin/quizzes          — list all quizzes with question counts
// POST /api/admin/quizzes          — create a quiz
// PUT  /api/admin/quizzes/:id      — rename a quiz
// DELETE /api/admin/quizzes/:id    — delete quiz + all its questions
// POST /api/admin/quizzes/:id/questions        — add a question
// DELETE /api/admin/quizzes/:id/questions/:qid — delete a question
// GET  /api/admin/users            — list all users

app.get("/api/admin/quizzes", requireAuth, requireAdmin, async (req, res) => {
  const quizzesResult = await query("SELECT * FROM quizzes ORDER BY created_at ASC");
  const questionsResult = await query("SELECT * FROM questions ORDER BY order_index ASC");

  const quizzes = quizzesResult.rows.map((quiz) => ({
    ...quiz,
    questions: questionsResult.rows
      .filter((q) => q.quiz_id === quiz.id)
      .map((q) => ({
        id: q.id,
        text: q.text,
        options: q.options,
        answerIndex: q.answer_index,
        orderIndex: q.order_index,
      })),
  }));

  return res.json({ ok: true, quizzes });
});

app.post("/api/admin/quizzes", requireAuth, requireAdmin, async (req, res) => {
  const { title, description = "" } = req.body;
  if (!title?.trim()) return res.json({ ok: false, error: "Quiz title is required." });

  const id = randomUUID();
  const now = new Date().toISOString();
  const result = await query(
    "INSERT INTO quizzes (id, title, description, created_at) VALUES ($1, $2, $3, $4) RETURNING *",
    [id, title.trim(), description.trim(), now]
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
  const { quizId } = req.params;
  await query("DELETE FROM quizzes WHERE id = $1", [quizId]);
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

  const id = randomUUID();
  const result = await query(
    "INSERT INTO questions (id, quiz_id, text, options, answer_index, order_index) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [id, quizId, text.trim(), JSON.stringify(options), answerIndex, orderIndex]
  );
  const row = result.rows[0];
  return res.json({
    ok: true,
    question: {
      id: row.id,
      text: row.text,
      options: row.options,
      answerIndex: row.answer_index,
      orderIndex: row.order_index,
    },
  });
});

app.delete("/api/admin/quizzes/:quizId/questions/:questionId", requireAuth, requireAdmin, async (req, res) => {
  const { quizId, questionId } = req.params;
  await query("DELETE FROM questions WHERE id = $1 AND quiz_id = $2", [questionId, quizId]);
  return res.json({ ok: true });
});

app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
  const result = await query(
    "SELECT id, name, email, is_admin FROM users ORDER BY name ASC"
  );
  return res.json({ ok: true, users: result.rows });
});

app.patch("/api/admin/users/:userId/toggle-admin", requireAuth, requireAdmin, async (req, res) => {
  const { userId } = req.params;
  if (userId === req.user.id) {
    return res.json({ ok: false, error: "You cannot change your own admin status." });
  }
  const result = await query(
    "UPDATE users SET is_admin = NOT is_admin WHERE id = $1 RETURNING id, name, email, is_admin",
    [userId]
  );
  if (result.rows.length === 0) return res.json({ ok: false, error: "User not found." });
  return res.json({ ok: true, user: result.rows[0] });
});

// ── Serve React build (when running via Docker / production) ──────────────────
const distPath = join(__dirname, "../dist");
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  // For any non-API route, return the React index.html (SPA routing)
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(join(distPath, "index.html"));
    }
  });
  console.log("Serving React build from /dist");
}

// ── Start ─────────────────────────────────────────────────────────────────────
initDb()
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`Smart Study Planner running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
