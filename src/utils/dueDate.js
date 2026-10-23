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

// Returns an error message, or '' when the date is empty (optional) or valid.
export function dueDateError(value, today = new Date()) {
  if (!value) return ''
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  const date = match && new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  if (!date || toIsoDate(date) !== value) return 'Enter a valid due date.'
  const { min, max } = dueDateLimits(today)
  if (value < min) return 'Due date cannot be in the past.'
  if (value > max) return `Due date must be within ${MAX_MONTHS_AHEAD} months.`
  return ''
}
