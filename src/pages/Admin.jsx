import { useEffect, useState } from 'react'
import {
  adminGetQuizzes, adminCreateQuiz, adminUpdateQuiz, adminDeleteQuiz,
  adminAddQuestion, adminDeleteQuestion,
  adminGetUsers, adminToggleAdmin,
} from '../api/backend.js'

const TABS = ['Quizzes', 'Users']
const EMPTY_QUIZ = { title: '', description: '' }
const EMPTY_Q = { text: '', options: ['', '', '', ''], answerIndex: 0 }

export default function Admin() {
  const [tab, setTab] = useState('Quizzes')

  return (
    <div>
      <div className="admin-header">
        <div>
          <h2 className="section-title" style={{ marginBottom: 4 }}>Admin Panel</h2>
          <p className="muted" style={{ fontSize: '0.88rem' }}>Manage quizzes, questions, and users</p>
        </div>
        <div className="filter-tabs">
          {TABS.map((t) => (
            <button key={t} className={`filter-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'Quizzes' && <QuizManager />}
      {tab === 'Users' && <UserManager />}
    </div>
  )
}

// ── Quiz Manager ──────────────────────────────────────────────────────────────
function QuizManager() {
  const [quizzes, setQuizzes] = useState(null)
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [newQuiz, setNewQuiz] = useState(EMPTY_QUIZ)
  const [showNewQuiz, setShowNewQuiz] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    adminGetQuizzes().then((res) => {
      if (res.ok) setQuizzes(res.quizzes)
      else setError(res.error || 'Failed to load quizzes.')
    })
  }, [])

  async function handleCreateQuiz(e) {
    e.preventDefault()
    if (!newQuiz.title.trim()) return
    const res = await adminCreateQuiz(newQuiz)
    if (res.ok) {
      setQuizzes((q) => [...q, res.quiz])
      setNewQuiz(EMPTY_QUIZ)
      setShowNewQuiz(false)
    } else {
      setError(res.error || 'Failed to create quiz.')
    }
  }

  async function handleDeleteQuiz(quizId, title) {
    if (!window.confirm(`Delete quiz "${title}" and all its questions?`)) return
    const res = await adminDeleteQuiz(quizId)
    if (res.ok) {
      setQuizzes((q) => q.filter((x) => x.id !== quizId))
      if (activeQuiz?.id === quizId) setActiveQuiz(null)
    } else {
      setError(res.error || 'Failed to delete quiz.')
    }
  }

  function handleQuestionAdded(quizId, question) {
    setQuizzes((prev) =>
      prev.map((q) =>
        q.id === quizId ? { ...q, questions: [...q.questions, question] } : q
      )
    )
    setActiveQuiz((prev) =>
      prev?.id === quizId ? { ...prev, questions: [...prev.questions, question] } : prev
    )
  }

  function handleQuestionDeleted(quizId, questionId) {
    setQuizzes((prev) =>
      prev.map((q) =>
        q.id === quizId
          ? { ...q, questions: q.questions.filter((x) => x.id !== questionId) }
          : q
      )
    )
    setActiveQuiz((prev) =>
      prev?.id === quizId
        ? { ...prev, questions: prev.questions.filter((x) => x.id !== questionId) }
        : prev
    )
  }

  if (quizzes === null) return <div className="spinner">Loading quizzes…</div>

  return (
    <div className="admin-grid">
      {/* Left: Quiz list */}
      <div className="admin-panel">
        <div className="panel-header">
          <h3 className="panel-title">All Quizzes ({quizzes.length})</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowNewQuiz((v) => !v)}>
            {showNewQuiz ? 'Cancel' : '+ New Quiz'}
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        {showNewQuiz && (
          <form className="quick-form" onSubmit={handleCreateQuiz} style={{ marginBottom: 16 }}>
            <input
              className="quick-input"
              placeholder="Quiz title"
              value={newQuiz.title}
              onChange={(e) => setNewQuiz((q) => ({ ...q, title: e.target.value }))}
              autoFocus
            />
            <input
              className="quick-input"
              placeholder="Description (optional)"
              value={newQuiz.description}
              onChange={(e) => setNewQuiz((q) => ({ ...q, description: e.target.value }))}
            />
            <button type="submit" className="btn btn-primary btn-sm">Create</button>
          </form>
        )}

        {quizzes.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📝</span>
            <p>No quizzes yet. Create your first one.</p>
          </div>
        ) : (
          <div className="admin-quiz-list">
            {quizzes.map((q) => (
              <div
                key={q.id}
                className={`admin-quiz-row ${activeQuiz?.id === q.id ? 'selected' : ''}`}
                onClick={() => setActiveQuiz(activeQuiz?.id === q.id ? null : q)}
              >
                <div className="admin-quiz-info">
                  <div className="admin-quiz-title">{q.title}</div>
                  <div className="muted" style={{ fontSize: '0.78rem' }}>
                    {q.questions.length} question{q.questions.length !== 1 ? 's' : ''}
                    {q.description ? ` · ${q.description}` : ''}
                  </div>
                </div>
                <button
                  className="icon-btn"
                  onClick={(e) => { e.stopPropagation(); handleDeleteQuiz(q.id, q.title) }}
                  aria-label="delete quiz"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Question editor */}
      <div className="admin-panel">
        {!activeQuiz ? (
          <div className="empty-state">
            <span className="empty-icon">👈</span>
            <p>Select a quiz to manage its questions</p>
          </div>
        ) : (
          <QuestionEditor
            quiz={activeQuiz}
            onAdded={(q) => handleQuestionAdded(activeQuiz.id, q)}
            onDeleted={(qid) => handleQuestionDeleted(activeQuiz.id, qid)}
          />
        )}
      </div>
    </div>
  )
}

function QuestionEditor({ quiz, onAdded, onDeleted }) {
  const [form, setForm] = useState(EMPTY_Q)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function setOption(i, val) {
    setForm((f) => {
      const opts = [...f.options]
      opts[i] = val
      return { ...f, options: opts }
    })
  }

  async function handleAdd(e) {
    e.preventDefault()
    const filledOpts = form.options.filter((o) => o.trim())
    if (!form.text.trim() || filledOpts.length < 2) {
      setError('Question text and at least 2 options are required.')
      return
    }
    setSaving(true)
    setError('')
    const res = await adminAddQuestion(quiz.id, {
      text: form.text,
      options: form.options.filter((o) => o.trim()),
      answerIndex: Math.min(form.answerIndex, filledOpts.length - 1),
    })
    setSaving(false)
    if (res.ok) {
      onAdded(res.question)
      setForm(EMPTY_Q)
    } else {
      setError(res.error || 'Failed to add question.')
    }
  }

  async function handleDelete(questionId) {
    const res = await adminDeleteQuestion(quiz.id, questionId)
    if (res.ok) onDeleted(questionId)
  }

  const filledOptions = form.options.filter((o) => o.trim())

  return (
    <div>
      <h3 className="panel-title" style={{ marginBottom: 4 }}>{quiz.title}</h3>
      <p className="muted" style={{ fontSize: '0.82rem', marginBottom: 18 }}>
        {quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''}
      </p>

      {/* Existing questions */}
      {quiz.questions.length > 0 && (
        <div className="question-list">
          {quiz.questions.map((q, i) => (
            <div key={q.id} className="question-card">
              <div className="question-meta">Q{i + 1}</div>
              <div className="question-body">
                <div className="question-text">{q.text}</div>
                <div className="question-opts">
                  {q.options.map((opt, oi) => (
                    <span
                      key={oi}
                      className={`question-opt ${oi === q.answerIndex ? 'correct-opt' : ''}`}
                    >
                      {oi === q.answerIndex ? '✓ ' : ''}{opt}
                    </span>
                  ))}
                </div>
              </div>
              <button className="icon-btn" onClick={() => handleDelete(q.id)} aria-label="delete question">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Add question form */}
      <div className="add-question-form">
        <p className="panel-title" style={{ fontSize: '1rem', marginBottom: 12 }}>Add Question</p>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleAdd}>
          <div className="field">
            <label>Question text</label>
            <input
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              placeholder="e.g. What is the OSI model?"
            />
          </div>

          <div className="options-grid">
            {form.options.map((opt, i) => (
              <div key={i} className="field" style={{ margin: 0 }}>
                <label>Option {i + 1}</label>
                <input
                  value={opt}
                  onChange={(e) => setOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                />
              </div>
            ))}
          </div>

          <div className="field">
            <label>Correct answer</label>
            <select
              value={form.answerIndex}
              onChange={(e) => setForm((f) => ({ ...f, answerIndex: Number(e.target.value) }))}
            >
              {form.options.map((opt, i) => (
                opt.trim() && <option key={i} value={i}>Option {i + 1}: {opt}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving || !form.text.trim() || filledOptions.length < 2}
          >
            {saving ? 'Saving…' : 'Add Question'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── User Manager ──────────────────────────────────────────────────────────────
function UserManager() {
  const [users, setUsers] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminGetUsers().then((res) => {
      if (res.ok) setUsers(res.users)
      else setError(res.error || 'Failed to load users.')
    })
  }, [])

  async function handleToggle(userId, name) {
    const res = await adminToggleAdmin(userId)
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_admin: res.user.is_admin } : u))
      )
    } else {
      setError(res.error || 'Failed to update user.')
    }
  }

  if (users === null) return <div className="spinner">Loading users…</div>

  return (
    <div className="admin-panel" style={{ maxWidth: 700 }}>
      <h3 className="panel-title" style={{ marginBottom: 16 }}>All Users ({users.length})</h3>
      {error && <p className="error">{error}</p>}
      <div className="user-list">
        {users.map((u) => (
          <div key={u.id} className="user-row">
            <div className="user-avatar">{u.name[0].toUpperCase()}</div>
            <div className="user-info">
              <div className="user-name">{u.name}</div>
              <div className="user-email muted">{u.email}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {u.is_admin && <span className="admin-badge">Admin</span>}
              <button
                className={`btn btn-sm ${u.is_admin ? 'btn-ghost' : 'btn-ghost'}`}
                onClick={() => handleToggle(u.id, u.name)}
              >
                {u.is_admin ? 'Remove admin' : 'Make admin'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
