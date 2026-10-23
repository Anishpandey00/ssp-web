import { readSession, clearSession } from "../utils/session.js";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";
export const SESSION_EXPIRED_EVENT = "ssp:session-expired";

function getToken() {
  return readSession()?.token || null;
}

// Never throws: every failure comes back as { ok: false, error } with a
// message the page can show as is.
async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}/${path}`, {
      headers,
      ...options,
      body: options.body && JSON.stringify(options.body),
    });
  } catch {
    return { ok: false, error: "Can't reach the server. Check your connection and try again." };
  }

  if (res.status === 401 && token) {
    clearSession();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    return { ok: false, error: "Your session has expired. Please log in again." };
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // fall through
  }
  if (!res.ok) {
    return {
      ok: false,
      error: data?.error || (res.status >= 500
        ? "The server had a problem. Please try again."
        : "Request failed. Please try again."),
    };
  }
  return data ?? { ok: false, error: "Invalid server response." };
}

export async function registerUser(form) {
  return request("register", { method: "POST", body: form });
}

export async function loginUser(form) {
  return request("login", { method: "POST", body: form });
}

export async function getTasks(userId) {
  return request(`tasks/${encodeURIComponent(userId)}`);
}

export async function addTask(userId, task) {
  return request(`tasks/${encodeURIComponent(userId)}`, {
    method: "POST",
    body: task,
  });
}

export async function updateTask(userId, taskId, task) {
  return request(`tasks/${encodeURIComponent(userId)}/${encodeURIComponent(taskId)}`, {
    method: "PUT",
    body: task,
  });
}

export async function toggleTask(userId, taskId) {
  return request(
    `tasks/${encodeURIComponent(userId)}/${encodeURIComponent(taskId)}/toggle`,
    { method: "PATCH" }
  );
}

export async function deleteTask(userId, taskId) {
  return request(
    `tasks/${encodeURIComponent(userId)}/${encodeURIComponent(taskId)}`,
    // keepalive lets an undo-delayed delete finish even if the tab is closing.
    { method: "DELETE", keepalive: true }
  );
}

export async function getQuizzes() {
  return request("quizzes");
}

export async function saveScore(userId, score) {
  return request(`scores/${encodeURIComponent(userId)}`, {
    method: "POST",
    body: score,
  });
}

export async function getProgress(userId) {
  return request(`progress/${encodeURIComponent(userId)}`);
}

// ── Admin API ─────────────────────────────────────────────────────────────────
export async function adminGetQuizzes() {
  return request("admin/quizzes");
}

export async function adminCreateQuiz(data) {
  return request("admin/quizzes", { method: "POST", body: data });
}

export async function adminUpdateQuiz(quizId, data) {
  return request(`admin/quizzes/${encodeURIComponent(quizId)}`, { method: "PUT", body: data });
}

export async function adminDeleteQuiz(quizId) {
  return request(`admin/quizzes/${encodeURIComponent(quizId)}`, { method: "DELETE" });
}

export async function adminAddQuestion(quizId, data) {
  return request(`admin/quizzes/${encodeURIComponent(quizId)}/questions`, {
    method: "POST",
    body: data,
  });
}

export async function adminDeleteQuestion(quizId, questionId) {
  return request(
    `admin/quizzes/${encodeURIComponent(quizId)}/questions/${encodeURIComponent(questionId)}`,
    { method: "DELETE" }
  );
}

export async function adminGetUsers() {
  return request("admin/users");
}

export async function adminToggleAdmin(userId) {
  return request(`admin/users/${encodeURIComponent(userId)}/toggle-admin`, { method: "PATCH" });
}
