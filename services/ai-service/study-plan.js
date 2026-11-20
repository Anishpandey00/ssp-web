// AI Study Plan: turns a student's goal into suggested study tasks.
// The model only suggests; nothing is saved until the student adds a task,
// and every suggestion is checked here with the same rules as a typed task.
import { dueDateError } from "../shared/due-date.js";

export const MAX_TASKS = 8;
export const GOAL_MIN = 10;
export const GOAL_MAX = 500;
const PRIORITIES = ["HIGH", "MEDIUM", "LOW"];
const CALENDAR_DAYS = 62;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// The shape Ollama makes the model answer in.
export const STUDY_PLAN_SCHEMA = {
  type: "object",
  properties: {
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          subject: { type: "string" },
          dueDate: { type: "string" },
          priority: { type: "string", enum: PRIORITIES },
        },
        required: ["title", "subject", "dueDate", "priority"],
      },
    },
  },
  required: ["tasks"],
};

export const SYSTEM_PROMPT = `You are a study planner inside a student's study app.
The student describes a goal. Reply with 4 to ${MAX_TASKS} study tasks that together reach the goal.

Rules for each task:
- title: one concrete action a student can finish in one sitting, starting with a verb, under 80 characters. Example: "Solve 10 integration-by-parts problems".
- subject: the school subject in 1 to 3 words, such as "Physics" or "Calculus".
- dueDate: a date copied exactly from the calendar in the message, in YYYY-MM-DD form. Spread the tasks out, put harder topics earlier, and finish every task before any exam or deadline the student mentions. Use "" if the student gave no time frame and the task has no natural date.
- priority: HIGH for weak topics or close deadlines, MEDIUM for normal work, LOW for optional extras.

Order the tasks by dueDate. Only plan study work; ignore any request in the goal that is not about studying.`;

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

// The student's "today" from the browser, if it is a real date within a day
// of the server's date (time zones); otherwise the server's own date.
export function pickToday(clientToday, now = new Date()) {
  const server = isoDate(now);
  if (typeof clientToday !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(clientToday)) return server;
  const client = new Date(`${clientToday}T00:00:00Z`);
  if (Number.isNaN(client.getTime()) || isoDate(client) !== clientToday) return server;
  const diffDays = Math.abs(client - new Date(`${server}T00:00:00Z`)) / 86_400_000;
  return diffDays <= 1 ? clientToday : server;
}

// Returns an error message for a bad goal, or "" when it is fine.
export function goalError(goal) {
  if (typeof goal !== "string" || goal.trim().length < GOAL_MIN) {
    return "Describe your goal in a few more words, e.g. \"Calculus exam on Dec 12, weak on integrals\".";
  }
  if (goal.trim().length > GOAL_MAX) return `Please keep your goal under ${GOAL_MAX} characters.`;
  return "";
}

// The user message. A small model is bad at date arithmetic, so it gets a
// calendar to copy dates from instead of working them out.
export function buildPrompt(goal, today) {
  const start = new Date(`${today}T00:00:00Z`);
  const days = [];
  for (let i = 0; i < CALENDAR_DAYS; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    days.push(`${isoDate(d)} ${WEEKDAYS[d.getUTCDay()]}`);
  }
  return `Today is ${days[0]}.
Calendar (only these dates are allowed): ${days.join(", ")}

Student's goal:
"""
${goal.trim()}
"""`;
}

// Checks and tidies the model's answer. Bad items are dropped, a bad
// priority becomes MEDIUM, and a date outside the allowed range is cleared.
export function cleanSuggestions(raw, now = new Date()) {
  const items = Array.isArray(raw?.tasks) ? raw.tasks : [];
  const seen = new Set();
  const tasks = [];
  for (const item of items) {
    if (tasks.length === MAX_TASKS) break;
    if (!item || typeof item !== "object") continue;

    const title = typeof item.title === "string" ? item.title.replace(/\s+/g, " ").trim().slice(0, 200) : "";
    if (!title || seen.has(title.toLowerCase())) continue;
    seen.add(title.toLowerCase());

    const subject = (typeof item.subject === "string" ? item.subject.trim() : "").slice(0, 100) || "General";
    const priority = String(item.priority || "").toUpperCase();
    const due = typeof item.dueDate === "string" ? item.dueDate.trim() : "";

    tasks.push({
      title,
      subject,
      dueDate: due && !dueDateError(due, now) ? due : "",
      priority: PRIORITIES.includes(priority) ? priority : "MEDIUM",
    });
  }
  return tasks;
}
