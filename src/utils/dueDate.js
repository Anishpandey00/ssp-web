// Due dates must be real calendar dates from today up to MAX_MONTHS_AHEAD.
export const MAX_MONTHS_AHEAD = 2

function toIsoDate(d) {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export function dueDateLimits(today = new Date()) {
  // Clamp to the month's last day so Dec 31 + 2 months is Feb 28/29, not Mar 3.
  const max = new Date(today.getFullYear(), today.getMonth() + MAX_MONTHS_AHEAD, 1)
  const lastDay = new Date(max.getFullYear(), max.getMonth() + 1, 0).getDate()
  max.setDate(Math.min(today.getDate(), lastDay))
  return { min: toIsoDate(today), max: toIsoDate(max) }
}

function formatIso(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// "Oct 23, 2026 – Dec 23, 2026": shown as a hint and in the error message.
export function dueDateRangeText(today = new Date()) {
  const { min, max } = dueDateLimits(today)
  return `${formatIso(min)} – ${formatIso(max)}`
}

// Returns an error message, or '' when the date is empty (optional) or valid.
// Every rejected date (past, too far ahead, or not a real date) gets the same
// message so the user always sees the allowed range.
export function dueDateError(value, today = new Date()) {
  if (!value) return ''
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  const date = match && new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  const { min, max } = dueDateLimits(today)
  if (!date || toIsoDate(date) !== value || value < min || value > max) {
    return `Please choose a due date within the next ${MAX_MONTHS_AHEAD} months (${dueDateRangeText(today)}).`
  }
  return ''
}
