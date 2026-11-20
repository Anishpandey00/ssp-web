// Smart study tips: a "Today's focus" sentence and 2-3 tips for the Dashboard.
// The numbers (overdue tasks, weak quizzes...) are worked out here in code,
// because a small model is unreliable at counting and date maths. The model
// only turns these facts into friendly advice. When the model is unavailable
// or its answer is unusable, ruleTips() writes simpler tips from the same facts.

const DAY_MS = 86_400_000;
const TITLE_MAX = 80;
const TEXT_MAX = 220;
const WEAK_PERCENT = 70;
const STRONG_PERCENT = 80;
const PRIORITY_RANK = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export const TIPS_SCHEMA = {
  type: "object",
  properties: {
    focus: { type: "string" },
    tips: { type: "array", items: { type: "string" } },
  },
  required: ["focus", "tips"],
};

export const TIPS_SYSTEM_PROMPT = `You are a friendly study coach inside a student's study app.
You get facts about the student's tasks and quiz scores. Reply with:
- focus: one sentence, under 25 words, saying what the student should do first today and why (for example how overdue it is).
- tips: 2 or 3 short tips, each under 30 words, that use different facts from the focus.

Every tip must name a specific task, subject or quiz from the facts and give the reason, such as a due date or a score. No general advice like "prioritise important tasks".
Rules: use only the facts given. Quote task and quiz names exactly. Never invent tasks, scores, subjects or dates.
Talk to the student as "you". Plain sentences only: no markdown, no lists inside a tip, no emojis.
If the student is doing well, say so briefly and suggest how to keep going.`;

function daysBetween(from, to) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

function shortTitle(title) {
  const t = String(title || "").replace(/\s+/g, " ").trim();
  return t.length > TITLE_MAX ? `${t.slice(0, TITLE_MAX - 1)}…` : t;
}

function byPriority(a, b) {
  return (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1);
}

// `tasks` are task rows from the Task service; `scores` are score rows from
// the Quiz service, newest first, or null when it could not be reached.
// `today` is YYYY-MM-DD.
export function buildFacts(tasks, scores, today) {
  const pending = tasks.filter((t) => !t.completed);
  const completedCount = tasks.length - pending.length;
  const dated = pending.filter((t) => /^\d{4}-\d{2}-\d{2}$/.test(t.due_date || ""));
  const brief = (t) => ({ title: shortTitle(t.title), subject: t.subject || "General", priority: t.priority });

  const overdue = dated
    .filter((t) => t.due_date < today)
    .map((t) => ({ ...brief(t), daysOverdue: daysBetween(t.due_date, today) }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue || byPriority(a, b));

  const dueSoon = dated
    .filter((t) => t.due_date >= today && daysBetween(today, t.due_date) <= 2)
    .map((t) => ({ ...brief(t), daysLeft: daysBetween(today, t.due_date) }))
    .sort((a, b) => a.daysLeft - b.daysLeft || byPriority(a, b));

  const subjects = new Map();
  for (const t of pending) {
    const name = t.subject || "General";
    subjects.set(name, (subjects.get(name) || 0) + 1);
  }
  const [busiest] = [...subjects].sort((a, b) => b[1] - a[1]);

  // Latest score for each quiz (scores arrive newest first).
  const latest = new Map();
  for (const s of scores || []) {
    if (!latest.has(s.quiz_title) && s.total > 0) {
      latest.set(s.quiz_title, { title: shortTitle(s.quiz_title), percent: Math.round((s.score / s.total) * 100) });
    }
  }
  const quizzes = [...latest.values()].sort((a, b) => a.percent - b.percent);
  const weakest = quizzes[0];
  const best = quizzes[quizzes.length - 1];

  return {
    today,
    pendingCount: pending.length,
    completedCount,
    completionRate: tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0,
    overdueCount: overdue.length,
    overdue: overdue.slice(0, 3),
    dueSoonCount: dueSoon.length,
    dueSoon: dueSoon.slice(0, 3),
    undatedCount: pending.length - dated.length,
    busiestSubject: busiest && busiest[1] >= 2 ? { name: busiest[0], count: busiest[1] } : null,
    quizzesTaken: scores ? scores.length : 0,
    weakQuiz: weakest && weakest.percent < WEAK_PERCENT ? weakest : null,
    strongQuiz: best && best.percent >= STRONG_PERCENT ? best : null,
    scoresUnavailable: !scores,
  };
}

// True when there is nothing to give advice about yet.
export function isNewStudent(facts) {
  return facts.pendingCount === 0 && facts.completedCount === 0 && facts.quizzesTaken === 0;
}

function dueText(days) {
  return days === 0 ? "due today" : days === 1 ? "due tomorrow" : `due in ${days} days`;
}

// The facts as plain sentences for the model.
export function buildTipsPrompt(facts) {
  const lines = [
    `Today is ${facts.today}.`,
    `Tasks: ${facts.pendingCount} pending, ${facts.completedCount} completed (${facts.completionRate}% done).`,
  ];
  if (facts.overdueCount) {
    lines.push(`Overdue tasks (${facts.overdueCount}): ${facts.overdue
      .map((t) => `"${t.title}" (${t.subject}, ${t.priority} priority, ${t.daysOverdue} day${t.daysOverdue === 1 ? "" : "s"} overdue)`)
      .join("; ")}.`);
  }
  if (facts.dueSoonCount) {
    lines.push(`Due in the next 2 days (${facts.dueSoonCount}): ${facts.dueSoon
      .map((t) => `"${t.title}" (${t.subject}, ${t.priority} priority, ${dueText(t.daysLeft)})`)
      .join("; ")}.`);
  }
  if (facts.undatedCount) lines.push(`Pending tasks with no due date: ${facts.undatedCount}.`);
  if (facts.busiestSubject) {
    lines.push(`Subject with the most pending tasks: ${facts.busiestSubject.name} (${facts.busiestSubject.count}).`);
  }
  if (facts.scoresUnavailable) lines.push("Quiz scores are not available right now.");
  else if (facts.quizzesTaken === 0) lines.push("No quizzes taken yet.");
  else {
    lines.push(`Quizzes taken: ${facts.quizzesTaken}.`);
    if (facts.weakQuiz) lines.push(`Weakest quiz: "${facts.weakQuiz.title}", latest score ${facts.weakQuiz.percent}%.`);
    if (facts.strongQuiz) lines.push(`Best quiz: "${facts.strongQuiz.title}", latest score ${facts.strongQuiz.percent}%.`);
  }
  return lines.join("\n");
}

function cleanText(value) {
  if (typeof value !== "string") return "";
  const text = value.replace(/[*_#`]/g, "").replace(/^\s*[-•\d.)]+\s*/, "").replace(/\s+/g, " ").trim();
  return text.length > TEXT_MAX ? `${text.slice(0, TEXT_MAX - 1)}…` : text;
}

// Checks the model's answer. Returns { focus, tips } or null if unusable.
export function cleanTips(raw) {
  const focus = cleanText(raw?.focus);
  const tips = (Array.isArray(raw?.tips) ? raw.tips : [])
    .map(cleanText)
    .filter((t) => t && t !== focus)
    .slice(0, 3);
  return focus && tips.length ? { focus, tips } : null;
}

// Simple tips written from the facts without the model.
export function ruleTips(facts) {
  if (isNewStudent(facts)) {
    return {
      focus: "Welcome! Add your first study task to get started.",
      tips: [
        "Try \"Plan my study with AI\" on the Tasks page to turn a goal into tasks.",
        "Take a quiz to see which topics need the most work.",
      ],
    };
  }

  let focus;
  const [late] = facts.overdue;
  const [soon] = facts.dueSoon;
  if (late) {
    focus = facts.overdueCount > 1
      ? `You have ${facts.overdueCount} overdue tasks. Start with "${late.title}".`
      : `Catch up on "${late.title}" first: it is ${late.daysOverdue} day${late.daysOverdue === 1 ? "" : "s"} overdue.`;
  } else if (soon) {
    focus = `"${soon.title}" is ${dueText(soon.daysLeft)}. Make it your first task today.`;
  } else if (facts.weakQuiz) {
    focus = `Revise ${facts.weakQuiz.title}: your latest quiz score was ${facts.weakQuiz.percent}%.`;
  } else if (facts.pendingCount > 0) {
    focus = `You have ${facts.pendingCount} pending task${facts.pendingCount === 1 ? "" : "s"} and nothing urgent. Pick one and finish it today.`;
  } else {
    focus = "You're all caught up. Add a task or take a quiz to keep going.";
  }

  const tips = [];
  if (late && soon) tips.push(`After that, "${soon.title}" is ${dueText(soon.daysLeft)}.`);
  if (facts.weakQuiz && !focus.includes(facts.weakQuiz.title)) {
    tips.push(`Your weakest quiz is ${facts.weakQuiz.title} (${facts.weakQuiz.percent}%). Review it and try again.`);
  }
  if (facts.busiestSubject) {
    tips.push(`${facts.busiestSubject.name} has the most pending tasks (${facts.busiestSubject.count}). Give it a focused session.`);
  }
  if (facts.undatedCount) {
    tips.push(`Give your ${facts.undatedCount} undated task${facts.undatedCount === 1 ? "" : "s"} a due date so ${facts.undatedCount === 1 ? "it doesn't" : "they don't"} slip.`);
  }
  if (facts.completionRate >= 70 && facts.completedCount >= 3) {
    tips.push(`Great work: you've finished ${facts.completionRate}% of your tasks.`);
  }
  if (tips.length < 2) tips.push("Study in 25-minute blocks with 5-minute breaks to stay focused.");
  return { focus, tips: tips.slice(0, 3) };
}

// Remembers each student's AI tips while their facts stay the same, so the
// Dashboard does not wait for the model on every visit.
export function createTipsCache({ ttlMs, max }) {
  const entries = new Map(); // userId -> { key, value, at }
  return {
    get(userId, key, now = Date.now()) {
      const e = entries.get(userId);
      return e && e.key === key && now - e.at < ttlMs ? e.value : null;
    },
    set(userId, key, value, now = Date.now()) {
      entries.delete(userId);
      entries.set(userId, { key, value, at: now });
      if (entries.size > max) entries.delete(entries.keys().next().value);
    },
  };
}
