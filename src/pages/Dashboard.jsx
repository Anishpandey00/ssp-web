import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getProgress } from '../api/backend.js'

function timeGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getProgress(user.id).then((res) => setStats(res.progress))
  }, [user.id])

  return (
    <div>
      {/* REQ-5: greeting message */}
      <h1 className="greeting">
        {timeGreeting()}, <span className="accent">{user.name.split(' ')[0]}</span>.
      </h1>
      <p className="lede">
        Your study space is ready. Organise tasks, test yourself with quizzes,
        and watch your progress build over time.
      </p>

      <button className="btn btn-primary begin-btn" onClick={() => navigate('/tasks')}>
        Plan today&rsquo;s tasks →
      </button>

      <div className="tiles">
        <a className="tile" href="/tasks" onClick={(e) => { e.preventDefault(); navigate('/tasks') }}>
          <div className="big">{stats ? stats.totalTasks : '—'}</div>
          <div className="lbl">Tasks planned</div>
        </a>
        <a className="tile" href="/tasks" onClick={(e) => { e.preventDefault(); navigate('/tasks') }}>
          <div className="big">{stats ? stats.completedTasks : '—'}</div>
          <div className="lbl">Tasks completed</div>
        </a>
        <a className="tile" href="/quiz" onClick={(e) => { e.preventDefault(); navigate('/quiz') }}>
          <div className="big">{stats ? stats.quizzesTaken : '—'}</div>
          <div className="lbl">Quizzes taken</div>
        </a>
        <a className="tile" href="/progress" onClick={(e) => { e.preventDefault(); navigate('/progress') }}>
          <div className="big">{stats ? stats.completionRate + '%' : '—'}</div>
          <div className="lbl">Completion rate</div>
        </a>
      </div>
    </div>
  )
}
