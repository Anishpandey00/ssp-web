// Server-side twin of src/utils/dueDate.js so the API rejects bad dates too.
const MAX_MONTHS_AHEAD = 2;

function toIsoDate(d) {
  return d.toISOString().slice(0, 10);
}

// Returns an error message, or "" when the date is empty (optional) or valid.
// Allows one day of slack in the past because the browser's "today" can be
// behind the server's UTC date.
export function dueDateError(value, now = new Date()) {
  if (value === null || value === undefined || value === "") return "";
  const match = typeof value === "string" && /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = match && new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (!date || toIsoDate(date) !== value) return "Enter a valid due date.";

  const earliest = new Date(now);
  earliest.setUTCDate(earliest.getUTCDate() - 1);
  // Clamp to the month's last day so Dec 31 + 2 months is Feb 28/29, not Mar 3.
  const latest = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + MAX_MONTHS_AHEAD, 1));
  const lastDay = new Date(Date.UTC(latest.getUTCFullYear(), latest.getUTCMonth() + 1, 0)).getUTCDate();
  latest.setUTCDate(Math.min(now.getUTCDate(), lastDay) + 1);

  if (value < toIsoDate(earliest)) return "Due date cannot be in the past.";
  if (value > toIsoDate(latest)) return `Due date must be within ${MAX_MONTHS_AHEAD} months.`;
  return "";
}
