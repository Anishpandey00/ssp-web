import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getQuizzes, saveScore } from '../api/backend.js'

export default function Quiz() {
  const { user } = useAuth()
  const [quizzes, setQuizzes] = useState(null)
  const [active, setActive] = useState(null) // selected quiz
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [locked, setLocked] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    getQuizzes().then((res) => setQuizzes(res.quizzes))
  }, [])

  // REQ-12: start a quiz
  function startQuiz(quiz) {
    setActive(quiz)
    setIndex(0)
    setSelected(null)
    setLocked(false)
    setScore(0)
    setFinished(false)
  }

  const question = active?.questions[index]

  // REQ-14: evaluate the answer
  function choose(optIndex) {
    if (locked) return
    setSelected(optIndex)
    setLocked(true)
    if (optIndex === question.answerIndex) setScore((s) => s + 1)
  }

  async function next() {
    if (index + 1 < active.questions.length) {
      setIndex(index + 1)
      setSelected(null)
      setLocked(false)
    } else {
      // REQ-17: store quiz score
      await saveScore(user.id, {
        quizId: active.id,
        quizTitle: active.title,
        score: score,
        total: active.questions.length,
      })
      setFinished(true)
    }
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
        <div className="quiz-grid">
          {quizzes.map((q) => (
            <div className="card" key={q.id}>
              <h3 style={{ fontFamily: 'var(--display)', marginBottom: 8 }}>{q.title}</h3>
              <p className="muted" style={{ marginBottom: 16 }}>{q.questions.length} questions</p>
              <button className="btn btn-primary btn-sm" onClick={() => startQuiz(q)}>
                Start quiz
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Result screen (REQ-15)
  if (finished) {
    const pct = Math.round((score / active.questions.length) * 100)
    return (
      <div className="card center" style={{ maxWidth: 460, margin: '40px auto' }}>
        <p className="muted">You scored</p>
        <div className="score-ring">{score}/{active.questions.length}</div>
        <p className="muted mt">{pct}% on {active.title}</p>
        <div className="mt">
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
  const progress = ((index) / active.questions.length) * 100
  return (
    <div className="card" style={{ maxWidth: 620, margin: '0 auto' }}>
      <div className="progress-bar"><span style={{ width: `${progress}%` }} /></div>
      <p className="muted" style={{ marginBottom: 8 }}>
        Question {index + 1} of {active.questions.length}
      </p>
      <p className="quiz-q">{question.text}</p>

      {question.options.map((opt, i) => {
        let cls = 'opt'
        if (locked) {
          if (i === question.answerIndex) cls += ' correct'
          else if (i === selected) cls += ' wrong'
        } else if (i === selected) {
          cls += ' selected'
        }
        return (
          <button key={i} className={cls} onClick={() => choose(i)}>
            {opt}
          </button>
        )
      })}

      {locked && (
        <button className="btn btn-primary mt" onClick={next}>
          {index + 1 < active.questions.length ? 'Next question' : 'See results'}
        </button>
      )}
    </div>
  )
}
