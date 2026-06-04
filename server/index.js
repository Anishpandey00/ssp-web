import bcrypt from "bcrypt";
import express from "express";
import { query, initDb } from "./db.js";
import { QUIZZES } from "../src/data/quizzes.js";

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,DELETE,PATCH,OPTIONS",
  );
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.json({
      ok: false,
      error: "Name, email, and password are required.",
    });
  }

  const existing = await query("SELECT id FROM users WHERE email = $1", [
    email,
  ]);
  if (existing.rows.length > 0) {
    return res.json({
      ok: false,
      error: "An account with that email already exists.",
    });
  }

  const id = uid();
  const hashedPassword = await bcrypt.hash(password, 10);
  await query(
    "INSERT INTO users (id, name, email, password) VALUES ($1, $2, $3, $4)",
    [id, name, email, hashedPassword],
  );

  return res.json({ ok: true, user: { id, name, email } });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.json({ ok: false, error: "Email and password are required." });
  }

  const result = await query("SELECT * FROM users WHERE email = $1", [email]);
  const user = result.rows[0];
  const passwordMatches =
    user && (await bcrypt.compare(password, user.password));
  if (!passwordMatches) {
    return res.json({ ok: false, error: "Invalid email or password." });
  }

  return res.json({
    ok: true,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

app.get("/api/tasks/:userId", async (req, res) => {
  const { userId } = req.params;
  const result = await query(
    "SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC",
    [userId],
  );
  return res.json({ ok: true, tasks: result.rows });
});

app.post("/api/tasks/:userId", async (req, res) => {
  const { userId } = req.params;
  const {
    title,
    subject = "General",
    dueDate = null,
    priority = "MEDIUM",
  } = req.body;
  if (!title) {
    return res.json({ ok: false, error: "Task title is required." });
  }

  const id = uid();
  const createdAt = new Date().toISOString();
  const result = await query(
    `INSERT INTO tasks (id, user_id, title, subject, due_date, priority, completed, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, FALSE, $7) RETURNING *`,
    [id, userId, title, subject, dueDate, priority, createdAt],
  );

  return res.json({ ok: true, task: result.rows[0] });
});

app.patch("/api/tasks/:userId/:taskId/toggle", async (req, res) => {
  const { userId, taskId } = req.params;
  const result = await query(
    `UPDATE tasks SET completed = NOT completed
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    [taskId, userId],
  );
  if (result.rows.length === 0) {
    return res.json({ ok: false, error: "Task not found." });
  }

  const tasks = await query(
    "SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC",
    [userId],
  );
  return res.json({ ok: true, tasks: tasks.rows });
});

app.delete("/api/tasks/:userId/:taskId", async (req, res) => {
  const { userId, taskId } = req.params;
  await query("DELETE FROM tasks WHERE id = $1 AND user_id = $2", [
    taskId,
    userId,
  ]);

  const tasks = await query(
    "SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC",
    [userId],
  );
  return res.json({ ok: true, tasks: tasks.rows });
});

app.get("/api/quizzes", (req, res) => {
  return res.json({ ok: true, quizzes: QUIZZES });
});

app.post("/api/scores/:userId", async (req, res) => {
  const { userId } = req.params;
  const { quizId, quizTitle, score, total } = req.body;
  if (
    !quizId ||
    !quizTitle ||
    typeof score !== "number" ||
    typeof total !== "number"
  ) {
    return res.json({ ok: false, error: "Quiz score payload is invalid." });
  }

  const id = uid();
  const takenAt = new Date().toISOString();
  const result = await query(
    `INSERT INTO scores (id, user_id, quiz_id, quiz_title, score, total, taken_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [id, userId, quizId, quizTitle, score, total, takenAt],
  );

  return res.json({ ok: true, entry: result.rows[0] });
});

app.get("/api/progress/:userId", async (req, res) => {
  const { userId } = req.params;
  const tasksResult = await query("SELECT * FROM tasks WHERE user_id = $1", [
    userId,
  ]);
  const scoresResult = await query(
    "SELECT * FROM scores WHERE user_id = $1 ORDER BY taken_at DESC",
    [userId],
  );

  const tasks = tasksResult.rows;
  const scores = scoresResult.rows;
  const completed = tasks.filter((task) => task.completed).length;

  return res.json({
    ok: true,
    progress: {
      totalTasks: tasks.length,
      completedTasks: completed,
      completionRate: tasks.length
        ? Math.round((completed / tasks.length) * 100)
        : 0,
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
  });
