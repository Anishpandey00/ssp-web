import "dotenv/config";
import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { query, initDb } from "./db.js";
import { QUIZZES } from "../src/data/quizzes.js";

const app = express();
const port = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "ssp_dev_secret_change_in_production";

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, bypass-tunnel-reminder");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,PATCH,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ── Auth middleware ──────────────────────────────────────────────────────────
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

  const token = jwt.sign({ id, name, email }, JWT_SECRET, { expiresIn: "7d" });
  return res.json({ ok: true, user: { id, name, email }, token });
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

  const { id, name } = user;
  const token = jwt.sign({ id, name, email }, JWT_SECRET, { expiresIn: "7d" });
  return res.json({ ok: true, user: { id, name, email }, token });
});

// ── Protected routes ──────────────────────────────────────────────────────────
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

app.get("/api/quizzes", requireAuth, (req, res) => {
  return res.json({ ok: true, quizzes: QUIZZES });
});

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

// Start server only after tables are ready
initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Backend server running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
