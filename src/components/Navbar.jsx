import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
        <span className="dot" />
        Smart Study Planner
      </div>
      {user && (
        <div className="nav-links">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/tasks">Tasks</NavLink>
          <NavLink to="/quiz">Quiz</NavLink>
          <NavLink to="/progress">Progress</NavLink>
          {user.isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'active admin-link' : 'admin-link'}>
              ⚙ Admin
            </NavLink>
          )}
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            Log out
          </button>
        </div>
      )}
    </nav>
  )
}
