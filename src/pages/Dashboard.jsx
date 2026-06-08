import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getProgress, getTasks, addTask, toggleTask, deleteTask } from '../api/backend.js'

function getGreeting(date) {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const EMPTY = { title: '', subject: '', dueDate: '', priority: 'MEDIUM' }
const PRIORITY_COLOR = { HIGH: '#7b4fb4', MEDIUM: '#c89b3c', LOW: '#30762d' }

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [now, setNow] = useState(new Date())
  const [stats, setStats] = useState(null)
  const [tasks, setTasks] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [statsError, setStatsError] = useState('')

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    getProgress(user.id)
      .then((res) => {
        if (res.ok) setStats(res.progress)
        else setStatsError(res.error || 'Failed to load stats.')
      })
      .catch(() => setStatsError('Backend offline.'))

    getTasks(user.id)
      .then((res) => {
        if (res.ok) setTasks(res.tasks)
      })
      .catch(() => {})
  }, [user.id])

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleQuickAdd(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    const res = await addTask(user.id, form)
    if (res.ok) {
      setTasks((t) => [...(t || []), res.task])
      setForm(EMPTY)
      setShowForm(false)
    } else {
      setError(res.error || 'Failed to add task.')
    }
  }

  async function handleToggle(id) {
    const res = await toggleTask(user.id, id)
    if (res.ok) setTasks([...res.tasks])
  }

  async function handleDelete(id) {
    const res = await deleteTask(user.id, id)
    if (res.ok) setTasks(res.tasks)
  }

  const pendingTasks = tasks ? tasks.filter((t) => !t.completed) : []
  const completedTasks = tasks ? tasks.filter((t) => t.completed) : []
  const recentScores = stats?.scores?.slice().reverse().slice(0, 3) || []

  const completionRate = tasks && tasks.length > 0
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="greeting">
            {getGreeting(now)}, <span className="accent">{user.name.split(' ')[0]}</span>.
          </h1>
          <p className="dash-date">{formatDate(now)} · <span className="live-time">{formatTime(now)}</span></p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/tasks')}>
          All tasks →
        </button>
      </div>

      {statsError && <p className="error">{statsError}</p>}

      {/* Stats Row */}
      <div className="stat-row">
        <StatCard
          value={tasks ? tasks.length : '—'}
          label="Tasks planned"
          icon="📋"
          onClick={() => navigate('/tasks')}
        />
        <StatCard
          value={tasks ? completedTasks.length : '—'}
          label="Completed"
          icon="✅"
          onClick={() => navigate('/tasks')}
          accent
        />
        <StatCard
          value={stats ? stats.quizzesTaken : '—'}
          label="Quizzes taken"
          icon="🧠"
          onClick={() => navigate('/quiz')}
        />
        <StatCard
          value={tasks && tasks.length > 0 ? completionRate + '%' : '—'}
          label="Completion rate"
          icon="📈"
          onClick={() => navigate('/progress')}
        />
      </div>

      {/* Main Grid */}
      <div className="dash-grid">
        {/* Tasks Panel */}
        <div className="dash-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Today's Tasks</h2>
              <p className="panel-sub">
                {pendingTasks.length} pending · {completedTasks.length} done
              </p>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? 'Cancel' : '+ Add task'}
            </button>
          </div>

          {error && <p className="error" style={{ marginBottom: 12 }}>{error}</p>}

          {showForm && (
            <form className="quick-form" onSubmit={handleQuickAdd}>
              <input
                className="quick-input"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="Task title…"
                autoFocus
              />
              <div className="quick-row">
                <input
                  className="quick-input"
                  value={form.subject}
                  onChange={(e) => update('subject', e.target.value)}
                  placeholder="Subject"
                />
                <input
                  type="date"
                  className="quick-input"
                  value={form.dueDate}
                  onChange={(e) => update('dueDate', e.target.value)}
                />
                <select
                  className="quick-input"
                  value={form.priority}
                  onChange={(e) => update('priority', e.target.value)}
                >
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
                <button type="submit" className="btn btn-primary btn-sm">Add</button>
              </div>
            </form>
          )}

          {tasks === null ? (
            <p className="muted spinner-inline">Loading tasks…</p>
          ) : pendingTasks.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🎉</span>
              <p>All caught up! Add a task to get started.</p>
            </div>
          ) : (
            <div className="dash-task-list">
              {pendingTasks.slice(0, 6).map((t) => (
                <DashTask
                  key={t.id}
                  task={t}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
              {pendingTasks.length > 6 && (
                <button className="see-more" onClick={() => navigate('/tasks')}>
                  +{pendingTasks.length - 6} more tasks →
                </button>
              )}
            </div>
          )}

          {completedTasks.length > 0 && (
            <div className="completed-section">
              <p className="completed-label">Completed</p>
              {completedTasks.slice(0, 3).map((t) => (
                <DashTask
                  key={t.id}
                  task={t}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="dash-right">
          {/* Progress Ring */}
          <div className="dash-panel progress-mini">
            <h2 className="panel-title" style={{ marginBottom: 16 }}>Progress</h2>
            <div className="ring-wrap">
              <RingChart pct={completionRate} />
              <div className="ring-info">
                <div className="ring-pct">{completionRate}%</div>
                <div className="ring-label">tasks done</div>
              </div>
            </div>
            <div className="progress-bar" style={{ marginTop: 16 }}>
              <span style={{ width: `${completionRate}%` }} />
            </div>
            <div className="progress-counts">
              <span>{completedTasks.length} completed</span>
              <span>{pendingTasks.length} remaining</span>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', marginTop: 14 }}
              onClick={() => navigate('/progress')}
            >
              View full progress →
            </button>
          </div>

          {/* Quick Actions */}
          <div className="dash-panel">
            <h2 className="panel-title" style={{ marginBottom: 14 }}>Quick Actions</h2>
            <div className="action-list">
              <ActionCard
                icon="📚"
                title="Take a Quiz"
                sub="Test your knowledge"
                onClick={() => navigate('/quiz')}
              />
              <ActionCard
                icon="✏️"
                title="Manage Tasks"
                sub="Add, edit, organise"
                onClick={() => navigate('/tasks')}
              />
              <ActionCard
                icon="📊"
                title="View Progress"
                sub="Scores and activity"
                onClick={() => navigate('/progress')}
              />
            </div>
          </div>

          {/* Recent Scores */}
          {recentScores.length > 0 && (
            <div className="dash-panel">
              <h2 className="panel-title" style={{ marginBottom: 14 }}>Recent Quizzes</h2>
              <div className="recent-scores">
                {recentScores.map((s) => {
                  const pct = Math.round((s.score / s.total) * 100)
                  return (
                    <div className="recent-score-row" key={s.id}>
                      <div>
                        <div className="rs-title">{s.quiz_title || s.quizTitle}</div>
                        <div className="rs-date muted">
                          {new Date(s.taken_at || s.takenAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="rs-badge" style={{ background: pct >= 70 ? 'rgba(48,118,45,0.15)' : 'rgba(200,155,60,0.2)', color: pct >= 70 ? '#245a22' : '#8a6a1e' }}>
                        {s.score}/{s.total}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ value, label, icon, onClick, accent }) {
  return (
    <button className={`stat-card ${accent ? 'stat-accent' : ''}`} onClick={onClick}>
      <span className="stat-icon">{icon}</span>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </button>
  )
}

function DashTask({ task: t, onToggle, onDelete }) {
  return (
    <div className={`dash-task-item ${t.completed ? 'done' : ''}`}>
      <div
        className={`task-check ${t.completed ? 'on' : ''}`}
        onClick={() => onToggle(t.id)}
        role="button"
        aria-label="toggle complete"
      >
        {t.completed ? '✓' : ''}
      </div>
      <div className="dash-task-body">
        <div className="task-title">{t.title}</div>
        {(t.subject || t.due_date) && (
          <div className="task-meta">
            {t.subject}{t.due_date ? ` · due ${t.due_date}` : ''}
          </div>
        )}
      </div>
      <span className={`pill ${t.priority}`}>{t.priority}</span>
      <button className="icon-btn" onClick={() => onDelete(t.id)} aria-label="delete">✕</button>
    </div>
  )
}

function ActionCard({ icon, title, sub, onClick }) {
  return (
    <button className="action-card" onClick={onClick}>
      <span className="action-icon">{icon}</span>
      <div>
        <div className="action-title">{title}</div>
        <div className="action-sub muted">{sub}</div>
      </div>
      <span className="action-arrow">→</span>
    </button>
  )
}

function RingChart({ pct }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width="90" height="90" viewBox="0 0 90 90">
      <circle cx="45" cy="45" r={r} fill="none" stroke="var(--paper-2)" strokeWidth="8" />
      <circle
        cx="45" cy="45" r={r} fill="none"
        stroke="var(--accent)" strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 45 45)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </svg>
  )
}
