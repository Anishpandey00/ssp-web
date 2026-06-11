// ---------------------------------------------------------------------------
// Mock backend for the Smart Study Planner.
//
// This module simulates a backend server + database. All functions are async
// and return Promises (with a small artificial delay) so the React app talks
// to it exactly as it would to a real REST API. The "database" is persisted in
// localStorage, satisfying the SRS storage requirements:
//   REQ-10  tasks stored in the database
//   REQ-16  completed tasks recorded
//   REQ-17  quiz scores stored
//
// To swap in a real backend later, replace the bodies of these functions with
// fetch() calls — the rest of the app does not change.
// ---------------------------------------------------------------------------

import { QUIZZES } from '../data/quizzes.js'

const DB_KEY = 'ssp_database_v1'
const LATENCY = 300 // ms, to mimic a network round-trip

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY))
}

function loadDB() {
  const raw = localStorage.getItem(DB_KEY)
  if (raw) {
    try {
      return JSON.parse(raw)
    } catch {
      // fall through to a fresh DB
    }
  }
  return { users: [], tasks: {}, scores: {} }
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// ----- Auth (REQ-1 to REQ-4) -----

export async function registerUser({ name, email, password }) {
  const db = loadDB()
  if (db.users.some((u) => u.email === email)) {
    return delay({ ok: false, error: 'An account with that email already exists.' })
  }
  const user = { id: uid(), name, email, password }
  db.users.push(user)
  db.tasks[user.id] = []
  db.scores[user.id] = []
  saveDB(db)
  return delay({ ok: true, user: { id: user.id, name: user.name, email: user.email } })
}

export async function loginUser({ email, password }) {
  const db = loadDB()
  const user = db.users.find((u) => u.email === email)
  if (!user || user.password !== password) {
    return delay({ ok: false, error: 'Invalid email or password.' })
  }
  return delay({ ok: true, user: { id: user.id, name: user.name, email: user.email } })
}

// ----- Tasks (REQ-8 to REQ-11, REQ-16) -----

export async function getTasks(userId) {
  const db = loadDB()
  return delay({ ok: true, tasks: db.tasks[userId] || [] })
}

export async function addTask(userId, { title, subject, dueDate, priority }) {
  const db = loadDB()
  const task = {
    id: uid(),
    title,
    subject: subject || 'General',
    dueDate: dueDate || null,
    priority: priority || 'MEDIUM',
    completed: false,
    createdAt: new Date().toISOString(),
  }
  db.tasks[userId] = [...(db.tasks[userId] || []), task]
  saveDB(db)
  return delay({ ok: true, task })
}

export async function toggleTask(userId, taskId) {
  const db = loadDB()
  const list = db.tasks[userId] || []
  const task = list.find((t) => t.id === taskId)
  if (task) task.completed = !task.completed
  saveDB(db)
  return delay({ ok: true, tasks: list })
}

export async function deleteTask(userId, taskId) {
  const db = loadDB()
  db.tasks[userId] = (db.tasks[userId] || []).filter((t) => t.id !== taskId)
  saveDB(db)
  return delay({ ok: true, tasks: db.tasks[userId] })
}

// ----- Quizzes (REQ-12 to REQ-15, REQ-17) -----

export async function getQuizzes() {
  return delay({ ok: true, quizzes: QUIZZES })
}

export async function saveScore(userId, { quizId, quizTitle, score, total }) {
  const db = loadDB()
  const entry = {
    id: uid(),
    quizId,
    quizTitle,
    score,
    total,
    takenAt: new Date().toISOString(),
  }
  db.scores[userId] = [...(db.scores[userId] || []), entry]
  saveDB(db)
  return delay({ ok: true, entry })
}

// ----- Progress (REQ-18) -----

export async function getProgress(userId) {
  const db = loadDB()
  const tasks = db.tasks[userId] || []
  const scores = db.scores[userId] || []
  const completed = tasks.filter((t) => t.completed).length
  return delay({
    ok: true,
    progress: {
      totalTasks: tasks.length,
      completedTasks: completed,
      completionRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
      quizzesTaken: scores.length,
      scores,
    },
  })
}
