import { dueDateError } from './dueDate.js'

export const EMPTY_TASK = { title: '', subject: '', dueDate: '', priority: 'MEDIUM' }

// Validates a task form. When editing, an unchanged due date is allowed even
// if it is now in the past.
export function taskFormError(form, originalDue = null) {
  if (!form.title.trim()) return 'Enter a task title.'
  if ((form.dueDate || null) !== originalDue) return dueDateError(form.dueDate)
  return ''
}

const DAY = 24 * 60 * 60 * 1000

// Turns "2026-11-15" into a friendly label such as "Due tomorrow".
// tone: 'overdue' (past), 'soon' (within 2 days) or 'later'.
export function dueInfo(dueDate, today = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate || '')
  if (!match) return null
  const due = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const days = Math.round((due - start) / DAY)

  if (days < 0) return { text: days === -1 ? 'Overdue by 1 day' : `Overdue by ${-days} days`, tone: 'overdue' }
  if (days === 0) return { text: 'Due today', tone: 'soon' }
  if (days === 1) return { text: 'Due tomorrow', tone: 'soon' }
  if (days <= 7) return { text: `Due in ${days} days`, tone: days <= 2 ? 'soon' : 'later' }
  const sameYear = due.getFullYear() === start.getFullYear()
  const label = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) })
  return { text: `Due ${label}`, tone: 'later' }
}

// Pending before completed; then earliest due date first (no date last);
// then newest first.
export function compareTasks(a, b) {
  if (a.completed !== b.completed) return a.completed ? 1 : -1
  const da = a.due_date || '9999-99-99'
  const db = b.due_date || '9999-99-99'
  if (da !== db) return da < db ? -1 : 1
  return (b.created_at || '').localeCompare(a.created_at || '')
}
