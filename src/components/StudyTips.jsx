import { useCallback, useEffect, useRef, useState } from 'react'
import { getStudyTips } from '../api/backend.js'
import { dueDateLimits } from '../utils/dueDate.js'

// "Today's focus" on the Dashboard: AI tips from the student's tasks and quiz
// scores. Loads on its own so the rest of the Dashboard never waits for it.
export default function StudyTips() {
  const [tips, setTips] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const latest = useRef(0)

  const load = useCallback(async (fresh) => {
    const call = ++latest.current
    setLoading(true)
    setError('')
    const res = await getStudyTips(dueDateLimits().min, fresh)
    if (call !== latest.current) return // a newer load has started
    setLoading(false)
    if (res.ok) setTips(res)
    else setError(res.error || 'Study tips are unavailable right now.')
  }, [])

  useEffect(() => {
    load(false)
    return () => { latest.current++ } // ignore an answer that arrives after leaving
  }, [load])

  return (
    <section className="dash-panel tips-card" aria-busy={loading}>
      <div className="panel-header">
        <div>
          <h2 className="panel-title">✨ Today's focus</h2>
          <p className="panel-sub">
            {tips?.source === 'ai'
              ? 'AI tips from your tasks and quiz scores'
              : 'Tips from your tasks and quiz scores'}
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => load(true)} disabled={loading}>
          {loading && tips ? 'Thinking…' : 'New tips'}
        </button>
      </div>

      {error ? (
        <p className="muted">
          {error}
          <button className="text-button" onClick={() => load(false)}>Try again</button>
        </p>
      ) : !tips ? (
        <div className="tips-loading" role="status">
          <span className="tips-line" />
          <span className="tips-line short" />
          <p className="field-hint">Looking at your tasks and quiz scores…</p>
        </div>
      ) : (
        <div className={loading ? 'tips-body stale' : 'tips-body'}>
          <p className="tips-focus">{tips.focus}</p>
          <ul className="tips-list">
            {tips.tips.map((tip) => <li key={tip}>{tip}</li>)}
          </ul>
        </div>
      )}
    </section>
  )
}
