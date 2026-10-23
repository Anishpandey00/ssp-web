// Due dates must be real calendar dates from today up to MAX_YEARS_AHEAD.
export const MAX_YEARS_AHEAD = 5

function toIsoDate(d) {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export function dueDateLimits(today = new Date()) {
  const max = new Date(today)
  max.setFullYear(max.getFullYear() + MAX_YEARS_AHEAD)
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
  if (value > max) return `Due date must be within ${MAX_YEARS_AHEAD} years.`
  return ''
}
