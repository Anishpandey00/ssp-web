// Per-student limits so one person cannot keep the AI model busy for everyone.
// Kept in memory: a restart clears them, which is fine for a single instance.
export function createRateLimiter({ limit, windowMs }) {
  const calls = new Map(); // userId -> timestamps of recent calls
  const busy = new Set(); // userIds with a request still running

  return {
    // Returns "" when the call may start, or a message saying why not.
    start(userId, now = Date.now()) {
      if (busy.has(userId)) return "Your last AI request is still running. Please wait for it to finish.";
      const recent = (calls.get(userId) || []).filter((t) => now - t < windowMs);
      if (recent.length >= limit) {
        calls.set(userId, recent);
        return "You've used the AI assistant a lot just now. Please wait a minute and try again.";
      }
      recent.push(now);
      calls.set(userId, recent);
      busy.add(userId);
      return "";
    },
    finish(userId) {
      busy.delete(userId);
    },
  };
}
