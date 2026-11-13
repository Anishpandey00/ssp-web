// Auth service: sign up, log in, and the admin's user management.
// Owns auth_db (users). Issues the login token every other service checks.
import "dotenv/config";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { createService, startService } from "../shared/app.js";
import { requireAuth, requireAdmin, jwtSecret } from "../shared/auth.js";
import { createDb } from "../shared/db.js";
import { seedAdmin } from "./admin-seed.js";

const db = createDb(process.env.AUTH_DB_NAME || "auth_db");
const { query } = db;
const app = createService();

// Emails are compared case-insensitively so "Ann@x.com" and "ann@x.com" are one account.
function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function issueToken({ id, name, email, isAdmin }) {
  return jwt.sign({ id, name, email, isAdmin }, jwtSecret(), { expiresIn: "7d" });
}

app.post("/api/register", async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;
  if (!name || !email || typeof password !== "string" || !password) {
    return res.json({ ok: false, error: "Name, email, and password are required." });
  }
  if (name.length > 100 || email.length > 200 || password.length > 200) {
    return res.json({ ok: false, error: "Input is too long." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.json({ ok: false, error: "Please enter a valid email address." });
  }
  if (password.length < 6) {
    return res.json({ ok: false, error: "Password must be at least 6 characters." });
  }

  const existing = await query("SELECT id FROM users WHERE LOWER(email) = $1", [email]);
  if (existing.rows.length > 0) {
    return res.json({ ok: false, error: "An account with that email already exists." });
  }

  const id = randomUUID();
  const hashedPassword = await bcrypt.hash(password, 10);
  await query(
    "INSERT INTO users (id, name, email, password) VALUES ($1, $2, $3, $4)",
    [id, name, email, hashedPassword]
  );

  const user = { id, name, email, isAdmin: false };
  return res.json({ ok: true, user, token: issueToken(user) });
});

app.post("/api/login", async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;
  if (!email || typeof password !== "string" || !password) {
    return res.json({ ok: false, error: "Email and password are required." });
  }

  // LOWER() on the column also matches accounts created before emails were normalised.
  const result = await query("SELECT * FROM users WHERE LOWER(email) = $1", [email]);
  const row = result.rows[0];
  const passwordMatches = row && (await bcrypt.compare(password, row.password));
  if (!passwordMatches) {
    return res.json({ ok: false, error: "Invalid email or password." });
  }

  const user = { id: row.id, name: row.name, email: row.email, isAdmin: !!row.is_admin };
  return res.json({ ok: true, user, token: issueToken(user) });
});

app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
  const result = await query("SELECT id, name, email, is_admin FROM users ORDER BY name ASC");
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

async function init() {
  await db.ensureDatabase();
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      is_admin BOOLEAN DEFAULT FALSE
    )
  `);
  await seedAdmin(query);
}

startService(app, {
  name: "auth-service",
  port: Number(process.env.PORT) || 4001,
  init,
  health: () => query("SELECT 1"),
});
