import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getTasks, addTask, toggleTask, deleteTask } from '../api/backend.js'

const EMPTY = { title: '', subject: '', dueDate: '', priority: 'MEDIUM' }
const FILTERS = ['All', 'Pending', 'Completed']

export default function Tasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [filter, setFilter] = useState('All')
  const [error, setError] = useState('')

  useEffect(() => {
    getTasks(user.id)
      .then((res) => {
        if (res.ok) setTasks(res.tasks)
        else setError(res.error || 'Failed to load tasks.')
      })
      .catch(() => setError('Network error. Is the backend server running?'))
  }, [user.id])

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleAdd() {
    if (!form.title.trim()) return
    setError('')
    const res = await addTask(user.id, form)
    if (res.ok) {
      setTasks((t) => [...t, res.task])
      setForm(EMPTY)
    } else {
      setError(res.error || 'Failed to add task.')
    }
  }

  async function handleToggle(id) {
    const res = await toggleTask(user.id, id)
    if (res.ok) setTasks([...res.tasks])
    else setError(res.error || 'Failed to update task.')
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete "${title}"?`)) return
    const res = await deleteTask(user.id, id)
    if (res.ok) setTasks(res.tasks)
    else setError(res.error || 'Failed to delete task.')
  }

  const filtered = tasks
    ? tasks.filter((t) => {
        if (filter === 'Pending') return !t.completed
        if (filter === 'Completed') return t.completed
        return true
      })
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
        {error && <p className="error">{error}</p>}
        <div className="task-form">
          <div className="field" style={{ margin: 0 }}>
            <label>Task title</label>
            <input
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. Revise Chapter 5"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Subject</label>
            <input
              value={form.subject}
              onChange={(e) => update('subject', e.target.value)}
              placeholder="e.g. Cloud Computing"
            />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Due date</label>
            <input type="date" value={form.dueDate} onChange={(e) => update('dueDate', e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Priority</label>
            <select value={form.priority} onChange={(e) => update('priority', e.target.value)}>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleAdd} style={{ alignSelf: 'flex-end' }}>
            Add task
          </button>
        </div>
      </div>

      {/* Task list */}
      {tasks === null ? (
        <div className="spinner">Loading tasks…</div>
      ) : filtered.length === 0 ? (
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
          {filtered.map((t) => (
            <div key={t.id} className={`task-item ${t.completed ? 'done' : ''}`}>
              <div
                className={`task-check ${t.completed ? 'on' : ''}`}
                onClick={() => handleToggle(t.id)}
                role="button"
                aria-label="toggle complete"
              >
                {t.completed ? '✓' : ''}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="task-title">{t.title}</div>
                <div className="task-meta">
                  {t.subject}
                  {t.due_date ? ` · due ${t.due_date}` : ''}
                </div>
              </div>
              <span className={`pill ${t.priority}`}>{t.priority}</span>
              <button className="icon-btn" onClick={() => handleDelete(t.id, t.title)} aria-label="delete">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
