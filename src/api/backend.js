const BASE_URL = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}/${path}`, {
    headers: { "Content-Type": "application/json" },
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
    { method: "PATCH" },
  );
}

export async function deleteTask(userId, taskId) {
  return request(
    `tasks/${encodeURIComponent(userId)}/${encodeURIComponent(taskId)}`,
    { method: "DELETE" },
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
