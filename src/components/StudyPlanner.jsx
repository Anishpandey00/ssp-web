import { useState } from 'react'
import { suggestStudyPlan } from '../api/backend.js'
import { useToast } from '../context/ToastContext.jsx'
import { dueDateLimits } from '../utils/dueDate.js'
import { dueInfo } from '../utils/tasks.js'

// "Plan my study with AI": the student describes a goal, the AI suggests
// tasks, and the student ticks the ones to add. Nothing is saved until then.
// `onAdd` is useTasks().add, so added tasks get the normal checks.
export default function StudyPlanner({ onAdd }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [goal, setGoal] = useState('')
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState([])

  async function handleSuggest(e) {
    e.preventDefault()
    if (loading) return
    if (goal.trim().length < 10) {
      setError('Describe your goal in a few more words, e.g. "Calculus exam on Dec 12, weak on integrals".')
      return
    }
    setLoading(true)
    setError('')
    setSuggestions([])
    const res = await suggestStudyPlan(goal, dueDateLimits().min)
    setLoading(false)
    if (res.ok) setSuggestions(res.tasks.map((t, i) => ({ ...t, key: i, selected: true })))
    else setError(res.error || 'The AI assistant could not answer. Please try again.')
  }

  async function handleAdd() {
    const chosen = suggestions.filter((s) => s.selected)
    if (adding || chosen.length === 0) return
    setAdding(true)
    const failed = []
    for (const s of chosen) {
      const res = await onAdd(
        { title: s.title, subject: s.subject, dueDate: s.dueDate, priority: s.priority },
        { quiet: true }
      )
      if (!res.ok) failed.push({ ...s, reason: res.error })
    }
    setAdding(false)

    const added = chosen.length - failed.length
    if (added > 0) toast(added === 1 ? 'Added 1 task from your study plan' : `Added ${added} tasks from your study plan`)
    if (failed.length > 0) {
      const failedKeys = new Set(failed.map((f) => f.key))
      setSuggestions((list) => list.filter((s) => !s.selected || failedKeys.has(s.key)))
      setError(`Couldn't add "${failed[0].title}": ${failed[0].reason}`)
    } else {
      setSuggestions([])
      setGoal('')
    }
  }

  function toggle(key) {
    setSuggestions((list) => list.map((s) => (s.key === key ? { ...s, selected: !s.selected } : s)))
  }

  const selectedCount = suggestions.filter((s) => s.selected).length

  return (
    <div className="card ai-plan">
      <div className="ai-plan-head">
        <div>
          <p className="panel-title">✨ Plan my study with AI</p>
          <p className="panel-sub">Describe a goal and get suggested tasks. You choose which ones to add.</p>
        </div>
        {!open && (
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => setOpen(true)}>
            Try it
          </button>
        )}
      </div>

      {open && (
        <>
          <form className="ai-plan-form" onSubmit={handleSuggest} noValidate>
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="ai-goal">Your goal</label>
              <textarea
                id="ai-goal"
                rows={3}
                maxLength={500}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSuggest(e)
                }}
                placeholder="e.g. Physics exam on Dec 12. I'm weak on optics and need to revise waves."
                disabled={loading}
              />
            </div>
            <div className="ai-plan-actions">
              <button className="btn btn-primary btn-sm" type="submit" disabled={loading}>
                {loading ? 'Thinking…' : suggestions.length ? 'Suggest again' : 'Suggest tasks'}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                disabled={loading}
                onClick={() => {
                  setOpen(false)
                  setError('')
                  setSuggestions([])
                }}
              >
                Close
              </button>
            </div>
          </form>

          {loading && (
            <p className="field-hint" role="status">
              The AI is planning your tasks. The first answer can take up to a minute while the model loads.
            </p>
          )}
          {error && <p className="error" role="alert" style={{ marginTop: 14, marginBottom: 0 }}>{error}</p>}

          {suggestions.length > 0 && (
            <div className="ai-results">
              <ul className="ai-suggestions">
                {suggestions.map((s) => {
                  const due = dueInfo(s.dueDate)
                  return (
                    <li key={s.key}>
                      <label className={`ai-suggestion ${s.selected ? '' : 'off'}`}>
                        <input type="checkbox" checked={s.selected} onChange={() => toggle(s.key)} />
                        <div className="task-body">
                          <div className="task-title">{s.title}</div>
                          <div className="task-meta">
                            {s.subject} · {due ? <span className={`due ${due.tone}`}>{due.text}</span> : 'No due date'}
                          </div>
                        </div>
                        <span className={`pill ${s.priority}`}>{s.priority}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
              <div className="ai-plan-actions">
                <button
                  className="btn btn-primary btn-sm"
                  type="button"
                  onClick={handleAdd}
                  disabled={adding || selectedCount === 0}
                >
                  {adding ? 'Adding…' : selectedCount === 1 ? 'Add 1 task' : `Add ${selectedCount} tasks`}
                </button>
                <p className="field-hint">AI suggestions can be wrong. Check them, and edit any task after adding it.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
