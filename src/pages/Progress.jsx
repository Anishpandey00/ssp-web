import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getProgress } from '../api/backend.js'

const pctOf = (s) => (s.total ? Math.round((s.score / s.total) * 100) : 0)

export default function Progress() {
  const { user } = useAuth()
  const [p, setP] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setError('')
    getProgress(user.id).then((res) => {
      if (res.ok) setP(res.progress)
      else setError(res.error || 'Failed to load progress.')
    })
  }, [user.id])

  useEffect(() => {
    load()
  }, [load])

  if (error) return (
    <div>
      <h2 className="section-title">Your Progress</h2>
      <p className="error" role="alert">
        {error}
        <button className="text-button" onClick={load}>Try again</button>
      </p>
    </div>
  )

  if (p === null) return <div className="spinner">Loading progress…</div>

  // The server returns scores newest first.
  const scores = p.scores
  const percents = scores.map(pctOf)
  const average = percents.length ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length) : null
  const best = percents.length ? Math.max(...percents) : null

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

        <div className="tiles tiles-4" style={{ marginTop: 24 }}>
          <div className="tile">
            <div className="big">{p.completionRate}%</div>
            <div className="lbl">Task completion</div>
          </div>
          <div className="tile">
            <div className="big">{p.quizzesTaken}</div>
            <div className="lbl">Quizzes taken</div>
          </div>
          <div className="tile">
            <div className="big">{average === null ? '—' : `${average}%`}</div>
            <div className="lbl">Average quiz score</div>
          </div>
          <div className="tile">
            <div className="big">{best === null ? '—' : `${best}%`}</div>
            <div className="lbl">Best quiz score</div>
          </div>
        </div>
      </div>

      {scores.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--display)', marginBottom: 4 }}>Quiz scores over time</h3>
          <p className="muted fine-print" style={{ marginBottom: 14 }}>Your last {Math.min(scores.length, 10)} attempts, oldest on the left</p>
          <ScoreChart scores={scores.slice(0, 10).reverse()} />
        </div>
      )}

      <div className="card">
        <h3 style={{ fontFamily: 'var(--display)', marginBottom: 14 }}>Quiz history</h3>
        {scores.length === 0 ? (
          <p className="muted">No quizzes taken yet. Take one from the Quiz page to see your scores here.</p>
        ) : (
          <div className="score-history">
            {scores.map((s) => (
              <div className="score-line" key={s.id}>
                <span>{s.quiz_title || s.quizTitle}</span>
                <span className="muted">
                  {s.score}/{s.total} ({pctOf(s)}%) · {new Date(s.taken_at || s.takenAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Simple bar chart of quiz percentages; green at 70% or more.
function ScoreChart({ scores }) {
  const W = 600
  const H = 180
  const top = 20
  const bottom = 24
  const slot = W / scores.length
  const barW = Math.min(44, slot * 0.6)
  const label = scores.map((s) => `${s.quiz_title || s.quizTitle}: ${pctOf(s)}%`).join(', ')

  return (
    <svg className="score-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Quiz scores: ${label}`}>
      {[0, 50, 100].map((v) => {
        const y = top + (H - top - bottom) * (1 - v / 100)
        return (
          <g key={v}>
            <line x1="0" x2={W} y1={y} y2={y} className="chart-grid" />
            <text x="2" y={y - 4} className="chart-axis">{v}%</text>
          </g>
        )
      })}
      {scores.map((s, i) => {
        const pct = pctOf(s)
        const h = (H - top - bottom) * (pct / 100)
        const x = slot * i + (slot - barW) / 2
        const y = H - bottom - h
        return (
          <g key={s.id}>
            <title>{`${s.quiz_title || s.quizTitle}: ${s.score}/${s.total} (${pct}%)`}</title>
            <rect x={x} y={y} width={barW} height={Math.max(h, 2)} rx="6" className={pct >= 70 ? 'bar-good' : 'bar-low'} />
            <text x={x + barW / 2} y={y - 6} textAnchor="middle" className="chart-value">{pct}%</text>
            <text x={x + barW / 2} y={H - 6} textAnchor="middle" className="chart-axis">#{i + 1}</text>
          </g>
        )
      })}
    </svg>
  )
}
