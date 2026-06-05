import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getTasks, addTask, toggleTask, deleteTask } from '../api/backend.js'

const EMPTY = { title: '', subject: '', dueDate: '', priority: 'MEDIUM' }

export default function Tasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState(null)
  const [form, setForm] = useState(EMPTY)
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

  return (
    <div>
      <h2 className="section-title">Study Tasks</h2>

      {error && <p className="error">{error}</p>}

      <div className="task-form">
        <div className="field" style={{ margin: 0 }}>
          <label>Task</label>
          <input
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Revise Chapter 5"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Subject</label>
          <input
            value={form.subject}
            onChange={(e) => update('subject', e.target.value)}
            placeholder="Cloud"
          />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Due</label>
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
        <button className="btn btn-primary" onClick={handleAdd}>Add</button>
      </div>

      {tasks === null ? (
        <div className="spinner">Loading tasks…</div>
      ) : tasks.length === 0 ? (
        <p className="muted">No tasks yet. Add your first study task above.</p>
      ) : (
        <div className="task-list">
          {tasks.map((t) => (
            <div key={t.id} className={`task-item ${t.completed ? 'done' : ''}`}>
              <div
                className={`task-check ${t.completed ? 'on' : ''}`}
                onClick={() => handleToggle(t.id)}
                role="button"
                aria-label="toggle complete"
              >
                {t.completed ? '✓' : ''}
              </div>
              <div>
                <div className="task-title">{t.title}</div>
                <div className="task-meta">
                  {t.subject}
                  {t.due_date ? ` · due ${t.due_date}` : ''}
                </div>
              </div>
              <div className="task-spacer" />
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
