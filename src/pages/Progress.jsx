import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getProgress } from '../api/backend.js'

export default function Progress() {
  const { user } = useAuth()
  const [p, setP] = useState(null)

  useEffect(() => {
    getProgress(user.id).then((res) => setP(res.progress))
  }, [user.id])

  if (p === null) return <div className="spinner">Loading progress…</div>

  return (
    <div>
      <h2 className="section-title">Your Progress</h2>

      <div className="card" style={{ marginBottom: 20 }}>
        {/* REQ-18: progress displayed to the user */}
        <div className="bar-row">
          <div className="lbl">
            <span>Tasks completed (REQ-16)</span>
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
                  <span>{s.quizTitle}</span>
                  <span className="muted">
                    {s.score}/{s.total} · {new Date(s.takenAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
