import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getProgress } from '../api/backend.js'

export default function Progress() {
  const { user } = useAuth()
  const [p, setP] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getProgress(user.id)
      .then((res) => {
        if (res.ok) setP(res.progress)
        else setError(res.error || 'Failed to load progress.')
      })
      .catch(() => setError('Network error. Is the backend server running?'))
  }, [user.id])

  if (error) return (
    <div>
      <h2 className="section-title">Your Progress</h2>
      <p className="error">{error}</p>
    </div>
  )

  if (p === null) return <div className="spinner">Loading progress…</div>

  return (
    <div>
      <h2 className="section-title">Your Progress</h2>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="bar-row">
          <div className="lbl">
            <span>Tasks completed</span>
            <span>{p.completedTasks}/{p.totalTasks}</span>
          </div>
          <div className="progress-bar"><span style={{ width: `${p.completionRate}%` }} /></div>
        </div>

        <div className="tiles" style={{ marginTop: 24 }}>
          <div className="tile" style={{ cursor: 'default' }}>
            <div className="big">{p.completionRate}%</div>
            <div className="lbl">Completion rate</div>
          </div>
          <div className="tile" style={{ cursor: 'default' }}>
            <div className="big">{p.quizzesTaken}</div>
            <div className="lbl">Quizzes taken</div>
          </div>
          <div className="tile" style={{ cursor: 'default' }}>
            <div className="big">{p.totalTasks}</div>
            <div className="lbl">Total tasks</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontFamily: 'var(--display)', marginBottom: 14 }}>Quiz history</h3>
        {p.scores.length === 0 ? (
          <p className="muted">No quizzes taken yet.</p>
        ) : (
          <div className="score-history">
            {p.scores
              .slice()
              .reverse()
              .map((s) => (
                <div className="score-line" key={s.id}>
                  <span>{s.quiz_title || s.quizTitle}</span>
                  <span className="muted">
                    {s.score}/{s.total} · {new Date(s.taken_at || s.takenAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
