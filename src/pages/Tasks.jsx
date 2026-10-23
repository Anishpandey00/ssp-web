import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useTasks } from '../hooks/useTasks.js'
import { dueDateLimits } from '../utils/dueDate.js'
import { EMPTY_TASK, compareTasks } from '../utils/tasks.js'
import TaskRow from '../components/TaskRow.jsx'

const FILTERS = ['All', 'Pending', 'Completed']

export default function Tasks() {
  const { user } = useAuth()
  const { tasks, loadError, reload, add, update, toggle, remove } = useTasks(user.id)
  const [form, setForm] = useState(EMPTY_TASK)
  const [filter, setFilter] = useState('All')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)

  async function handleAdd(e) {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    const res = await add(form)
    setSaving(false)
    if (res.ok) {
      setForm(EMPTY_TASK)
      setError('')
    } else {
      setError(res.error)
    }
  }

  const visible = tasks
    ? tasks
        .filter((t) => {
          if (filter === 'Pending') return !t.completed
          if (filter === 'Completed') return t.completed
          return true
        })
        .sort(compareTasks)
    : []

  const pending = tasks ? tasks.filter((t) => !t.completed).length : 0
  const completed = tasks ? tasks.filter((t) => t.completed).length : 0

  return (
    <div>
      {/* Header */}
      <div className="tasks-header">
        <div>
          <h2 className="section-title" style={{ marginBottom: 4 }}>Study Tasks</h2>
          {tasks && (
            <p className="muted" style={{ fontSize: '0.88rem' }}>
              {pending} pending · {completed} completed
            </p>
          )}
        </div>
        <div className="filter-tabs">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Add task form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <p className="panel-title" style={{ marginBottom: 14 }}>Add new task</p>
        {error && <p className="error" role="alert">{error}</p>}
        <form className="task-form" onSubmit={handleAdd} noValidate>
          <TaskFields form={form} onChange={(key, value) => setForm((f) => ({ ...f, [key]: value }))} />
          <button className="btn btn-primary" type="submit" disabled={saving} style={{ alignSelf: 'flex-end' }}>
            {saving ? 'Adding…' : 'Add task'}
          </button>
        </form>
      </div>

      {/* Task list */}
      {loadError ? (
        <p className="error" role="alert">
          {loadError}
          <button className="text-button" onClick={reload}>Try again</button>
        </p>
      ) : tasks === null ? (
        <div className="spinner">Loading tasks…</div>
      ) : visible.length === 0 ? (
        <div className="empty-state" style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>
          <span className="empty-icon">
            {filter === 'Completed' ? '📭' : filter === 'Pending' ? '🎉' : '📋'}
          </span>
          <p>
            {filter === 'Completed'
              ? 'No completed tasks yet.'
              : filter === 'Pending'
              ? 'All tasks completed — great work!'
              : 'No tasks yet. Add your first study task above.'}
          </p>
        </div>
      ) : (
        <div className="task-list">
          {visible.map((t) =>
            editingId === t.id ? (
              <TaskEditor
                key={t.id}
                task={t}
                onSave={async (changes) => {
                  const res = await update(t, changes)
                  if (res.ok) setEditingId(null)
                  return res
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <TaskRow
                key={t.id}
                task={t}
                onToggle={toggle}
                onDelete={remove}
                onEdit={(task) => setEditingId(task.id)}
              />
            )
          )}
        </div>
      )}
    </div>
  )
}

function TaskFields({ form, onChange, minDate }) {
  const limits = dueDateLimits()
  return (
    <>
      <div className="field" style={{ margin: 0 }}>
        <label>Task title</label>
        <input
          value={form.title}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="e.g. Revise Chapter 5"
          maxLength={300}
        />
      </div>
      <div className="field" style={{ margin: 0 }}>
        <label>Subject</label>
        <input
          value={form.subject}
          onChange={(e) => onChange('subject', e.target.value)}
          placeholder="e.g. Cloud Computing"
          maxLength={100}
        />
      </div>
      <div className="field" style={{ margin: 0 }}>
        <label>Due date</label>
        <input
          type="date"
          min={minDate && minDate < limits.min ? minDate : limits.min}
          max={limits.max}
          value={form.dueDate}
          onChange={(e) => onChange('dueDate', e.target.value)}
        />
      </div>
      <div className="field" style={{ margin: 0 }}>
        <label>Priority</label>
        <select value={form.priority} onChange={(e) => onChange('priority', e.target.value)}>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>
    </>
  )
}

function TaskEditor({ task, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: task.title,
    subject: task.subject || '',
    dueDate: task.due_date || '',
    priority: task.priority,
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    const res = await onSave(form)
    setSaving(false)
    if (!res.ok) setError(res.error)
  }

  return (
    <form
      className="task-edit"
      onSubmit={handleSave}
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
      noValidate
    >
      {error && <p className="error" role="alert">{error}</p>}
      <div className="task-form">
        <TaskFields
          form={form}
          minDate={task.due_date}
          onChange={(key, value) => setForm((f) => ({ ...f, [key]: value }))}
        />
      </div>
      <div className="task-edit-actions">
        <button className="btn btn-primary btn-sm" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button className="btn btn-ghost btn-sm" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
