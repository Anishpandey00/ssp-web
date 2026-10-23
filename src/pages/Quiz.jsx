import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getQuizzes, saveScore } from '../api/backend.js'

export default function Quiz() {
  const { user } = useAuth()
  const [quizzes, setQuizzes] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [active, setActive] = useState(null) // selected quiz
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState([]) // chosen option per question
  const [finished, setFinished] = useState(false)
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved | error
  const [saveError, setSaveError] = useState('')

  const load = useCallback(() => {
    setLoadError('')
    getQuizzes().then((res) => {
      if (res.ok) setQuizzes(res.quizzes)
      else setLoadError(res.error || 'Failed to load quizzes.')
    })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // REQ-12: start a quiz
  function startQuiz(quiz) {
    setActive(quiz)
    setIndex(0)
    setAnswers([])
    setFinished(false)
    setSaveState('idle')
  }

  function quitQuiz() {
    if (answers.length > 0 && !window.confirm('Quit this quiz? Your answers will not be saved.')) return
    setActive(null)
  }

  const question = active?.questions[index]
  const selected = answers[index]
  const locked = selected !== undefined
  const score = active
    ? answers.filter((a, i) => a === active.questions[i].answerIndex).length
    : 0

  // REQ-14: evaluate the answer
  const choose = useCallback((optIndex) => {
    if (locked) return
    setAnswers((a) => {
      const next = [...a]
      next[index] = optIndex
      return next
    })
  }, [locked, index])

  // REQ-17: store quiz score
  async function submitScore(finalScore) {
    setSaveState('saving')
    const res = await saveScore(user.id, { quizId: active.id, score: finalScore })
    if (res.ok) {
      setSaveState('saved')
    } else {
      setSaveState('error')
      setSaveError(res.error || 'Could not save your score.')
    }
  }

  const next = useCallback(() => {
    if (!locked) return
    if (index + 1 < active.questions.length) {
      setIndex(index + 1)
    } else {
      setFinished(true)
      submitScore(score)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, index, active, score])

  // Keyboard: 1–9 picks an answer, Enter moves on.
  useEffect(() => {
    if (!active || finished) return
    function onKey(e) {
      if (e.target.closest?.('input, textarea, select')) return
      const n = Number(e.key)
      if (n >= 1 && n <= question.options.length) choose(n - 1)
      else if (e.key === 'Enter' && locked && e.target.tagName !== 'BUTTON') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, finished, question, locked, choose, next])

  if (loadError) {
    return (
      <div>
        <h2 className="section-title">Quizzes</h2>
        <p className="error" role="alert">
          {loadError}
          <button className="text-button" onClick={load}>Try again</button>
        </p>
      </div>
    )
  }

  if (quizzes === null) return <div className="spinner">Loading quizzes…</div>

  // Quiz picker
  if (!active) {
    return (
      <div>
        <h2 className="section-title">Quizzes</h2>
        <p className="muted" style={{ marginBottom: 20 }}>
          Pick a quiz to test your knowledge. Your score is saved to your progress.
        </p>
        {quizzes.length === 0 ? (
          <p className="muted">No quizzes yet. Check back soon.</p>
        ) : (
          <div className="quiz-grid">
            {quizzes.map((q) => (
              <div className="card" key={q.id}>
                <h3 style={{ fontFamily: 'var(--display)', marginBottom: 8 }}>{q.title}</h3>
                <p className="muted" style={{ marginBottom: 16 }}>{q.questions.length} questions</p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => startQuiz(q)}
                  disabled={q.questions.length === 0}
                >
                  Start quiz
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Result screen (REQ-15)
  if (finished) {
    const total = active.questions.length
    const pct = Math.round((score / total) * 100)
    return (
      <div className="card" style={{ maxWidth: 620, margin: '40px auto' }}>
        <div className="center">
          <p className="muted">You scored</p>
          <div className="score-ring">{score}/{total}</div>
          <p className="muted">
            {pct}% on {active.title} · {pct >= 80 ? 'Excellent! 🌟' : pct >= 50 ? 'Good effort! 👍' : 'Keep practising! 💪'}
          </p>
          <p className={`save-status ${saveState}`} role="status">
            {saveState === 'saving' && 'Saving your score…'}
            {saveState === 'saved' && 'Score saved to your progress ✓'}
            {saveState === 'error' && (
              <>
                {saveError}
                <button className="text-button" onClick={() => submitScore(score)}>Try again</button>
              </>
            )}
          </p>
        </div>

        <h3 className="review-title">Review your answers</h3>
        <ol className="review-list">
          {active.questions.map((q, i) => {
            const right = answers[i] === q.answerIndex
            return (
              <li key={q.id ?? i} className={right ? 'right' : 'wrong'}>
                <p className="review-q">{right ? '✓' : '✗'} {q.text}</p>
                {!right && <p className="review-a muted">Your answer: {q.options[answers[i]]}</p>}
                <p className="review-a">Correct answer: {q.options[q.answerIndex]}</p>
              </li>
            )
          })}
        </ol>

        <div className="center mt">
          <button className="btn btn-ghost" onClick={() => startQuiz(active)} style={{ marginRight: 8 }}>
            Retry
          </button>
          <button className="btn btn-primary" onClick={() => setActive(null)}>
            Back to quizzes
          </button>
        </div>
      </div>
    )
  }

  // Active question (REQ-13)
  const progress = ((index + (locked ? 1 : 0)) / active.questions.length) * 100
  return (
    <div className="card" style={{ maxWidth: 620, margin: '0 auto' }}>
      <div className="quiz-top">
        <p className="muted">
          Question {index + 1} of {active.questions.length} · Score {score}
        </p>
        <button className="text-button" onClick={quitQuiz}>Quit quiz</button>
      </div>
      <div className="progress-bar"><span style={{ width: `${progress}%` }} /></div>
      <p className="quiz-q">{question.text}</p>

      {question.options.map((opt, i) => {
        let cls = 'opt'
        if (locked) {
          if (i === question.answerIndex) cls += ' correct'
          else if (i === selected) cls += ' wrong'
        }
        return (
          <button key={i} className={cls} onClick={() => choose(i)}>
            <span className="opt-key">{i + 1}</span>
            {opt}
          </button>
        )
      })}

      {locked && (
        <p className={`quiz-feedback ${selected === question.answerIndex ? 'right' : 'wrong'}`} role="status">
          {selected === question.answerIndex
            ? 'Correct! 🎉'
            : `Not quite — the answer is "${question.options[question.answerIndex]}".`}
        </p>
      )}

      {locked && (
        <button className="btn btn-primary mt" onClick={next} autoFocus>
          {index + 1 < active.questions.length ? 'Next question' : 'See results'}
        </button>
      )}
      {!locked && <p className="muted fine-print mt">Tip: press 1–{question.options.length} to answer, Enter for next.</p>}
    </div>
  )
}
