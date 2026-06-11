const BASE_URL = import.meta.env.VITE_API_URL || "/api";

function getToken() {
  try {
    const raw = sessionStorage.getItem("ssp_session");
    return raw ? JSON.parse(raw).token || null : null;
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/${path}`, {
    headers,
    ...options,
    body: options.body && JSON.stringify(options.body),
  });

  if (!res.ok) {
    return { ok: false, error: "Network error" };
  }

  try {
    return await res.json();
  } catch {
    return { ok: false, error: "Invalid server response" };
  }
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

export async function toggleTask(userId, taskId) {
  return request(
    `tasks/${encodeURIComponent(userId)}/${encodeURIComponent(taskId)}/toggle`,
    { method: "PATCH" }
  );
}

export async function deleteTask(userId, taskId) {
  return request(
    `tasks/${encodeURIComponent(userId)}/${encodeURIComponent(taskId)}`,
    { method: "DELETE" }
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
