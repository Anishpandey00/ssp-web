// Task service: a student's study tasks. Owns task_db (tasks).
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { createService, startService } from "../shared/app.js";
import { requireAuth, requireOwner } from "../shared/auth.js";
import { createDb } from "../shared/db.js";
import { dueDateError } from "../shared/due-date.js";

const PRIORITIES = ["HIGH", "MEDIUM", "LOW"];
const db = createDb(process.env.TASK_DB_NAME || "task_db");
const { query } = db;
const app = createService();

function listTasks(userId) {
  return query("SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
}

// Checks a task from the request body. `keepDate` is the task's current due
// date when editing: an unchanged (possibly now past) date is allowed.
function parseTask(body, keepDate) {
  const { title, subject, dueDate, priority = "MEDIUM" } = body;
  if (typeof title !== "string" || !title.trim()) return { error: "Task title is required." };
  if (title.trim().length > 300) return { error: "Task title is too long." };
  if (subject !== undefined && subject !== null && typeof subject !== "string") {
    return { error: "Subject must be text." };
  }
  if (!PRIORITIES.includes(priority)) return { error: "Priority must be High, Medium, or Low." };
  const due = dueDate || null;
  if (due !== keepDate) {
    const dateError = dueDateError(due);
    if (dateError) return { error: dateError };
  }
  return {
    task: {
      title: title.trim(),
      subject: (subject || "").trim().slice(0, 100) || "General",
      dueDate: due,
      priority,
    },
  };
}

app.get("/api/tasks/:userId", requireAuth, requireOwner, async (req, res) => {
  const result = await listTasks(req.params.userId);
  return res.json({ ok: true, tasks: result.rows });
});

app.post("/api/tasks/:userId", requireAuth, requireOwner, async (req, res) => {
  const { userId } = req.params;
  const { task, error } = parseTask(req.body);
  if (error) return res.json({ ok: false, error });

  const result = await query(
    `INSERT INTO tasks (id, user_id, title, subject, due_date, priority, completed, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, FALSE, $7) RETURNING *`,
    [randomUUID(), userId, task.title, task.subject, task.dueDate, task.priority, new Date().toISOString()]
  );
  return res.json({ ok: true, task: result.rows[0] });
});

app.put("/api/tasks/:userId/:taskId", requireAuth, requireOwner, async (req, res) => {
  const { userId, taskId } = req.params;
  const current = await query("SELECT due_date FROM tasks WHERE id = $1 AND user_id = $2", [taskId, userId]);
  if (current.rows.length === 0) return res.json({ ok: false, error: "Task not found." });

  const { task, error } = parseTask(req.body, current.rows[0].due_date);
  if (error) return res.json({ ok: false, error });

  const result = await query(
    `UPDATE tasks SET title = $1, subject = $2, due_date = $3, priority = $4
     WHERE id = $5 AND user_id = $6 RETURNING *`,
    [task.title, task.subject, task.dueDate, task.priority, taskId, userId]
  );
  return res.json({ ok: true, task: result.rows[0] });
});

app.patch("/api/tasks/:userId/:taskId/toggle", requireAuth, requireOwner, async (req, res) => {
  const { userId, taskId } = req.params;
  const result = await query(
    "UPDATE tasks SET completed = NOT completed WHERE id = $1 AND user_id = $2 RETURNING *",
    [taskId, userId]
  );
  if (result.rows.length === 0) return res.json({ ok: false, error: "Task not found." });
  return res.json({ ok: true, tasks: (await listTasks(userId)).rows });
});

app.delete("/api/tasks/:userId/:taskId", requireAuth, requireOwner, async (req, res) => {
  const { userId, taskId } = req.params;
  await query("DELETE FROM tasks WHERE id = $1 AND user_id = $2", [taskId, userId]);
  return res.json({ ok: true, tasks: (await listTasks(userId)).rows });
});

// Internal: called by the Progress service, never routed by the gateway.
app.get("/internal/tasks/:userId/summary", requireAuth, requireOwner, async (req, res) => {
  const result = await query(
    "SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE completed)::int AS completed FROM tasks WHERE user_id = $1",
    [req.params.userId]
  );
  const { total, completed } = result.rows[0];
  return res.json({ ok: true, totalTasks: total, completedTasks: completed });
});

async function init() {
  await db.ensureDatabase();
  // user_id comes from the verified login token; users live in the Auth
  // service's database, so there is no foreign key to them.
  await query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      subject TEXT DEFAULT 'General',
      due_date TEXT,
      priority TEXT DEFAULT 'MEDIUM',
      completed BOOLEAN DEFAULT FALSE,
      created_at TEXT NOT NULL
    )
  `);
  await query("CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks (user_id)");
}

startService(app, {
  name: "task-service",
  port: Number(process.env.PORT) || 4002,
  init,
  health: () => query("SELECT 1"),
});
