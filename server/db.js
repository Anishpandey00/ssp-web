import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "smart_study_planner",
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
});

export function query(text, params) {
  return pool.query(text, params);
}

export async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      is_admin BOOLEAN DEFAULT FALSE
    )
  `);

  // Add is_admin column to existing installs that don't have it yet
  await query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      subject TEXT DEFAULT 'General',
      due_date TEXT,
      priority TEXT DEFAULT 'MEDIUM',
      completed BOOLEAN DEFAULT FALSE,
      created_at TEXT NOT NULL
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS scores (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      quiz_id TEXT NOT NULL,
      quiz_title TEXT NOT NULL,
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      taken_at TEXT NOT NULL
    )
  `);

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

  // Seed quizzes from static data if DB is empty
  const existing = await query("SELECT COUNT(*) FROM quizzes");
  if (parseInt(existing.rows[0].count, 10) === 0) {
    const { QUIZZES } = await import("../src/data/quizzes.js");
    const { randomUUID } = await import("crypto");
    for (const quiz of QUIZZES) {
      const quizId = quiz.id || randomUUID();
      const now = new Date().toISOString();
      await query(
        "INSERT INTO quizzes (id, title, description, created_at) VALUES ($1, $2, $3, $4)",
        [quizId, quiz.title, quiz.description || "", now]
      );
      for (let i = 0; i < quiz.questions.length; i++) {
        const q = quiz.questions[i];
        await query(
          "INSERT INTO questions (id, quiz_id, text, options, answer_index, order_index) VALUES ($1, $2, $3, $4, $5, $6)",
          [randomUUID(), quizId, q.text, JSON.stringify(q.options), q.answerIndex, i]
        );
      }
    }
    console.log(`Seeded ${QUIZZES.length} quizzes from static data.`);
  }
}

export default pool;
