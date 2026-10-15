import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Icon from './Icon.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar" aria-label="Main navigation">
      <div className="navbar-top">
        <button className="brand brand-button" onClick={() => navigate('/dashboard')}>
          <span className="brand-mark"><Icon /></span>
          Smart Study Planner
        </button>
        {user && <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Log out</button>}
      </div>
      {user && <div className="nav-links">
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/tasks">Tasks</NavLink>
        <NavLink to="/quiz">Quiz</NavLink>
        <NavLink to="/progress">Progress</NavLink>
        {user.isAdmin && <NavLink to="/admin" className={({ isActive }) => isActive ? 'active admin-link' : 'admin-link'}>⚙ Admin</NavLink>}
      </div>}
    </nav>
  )
}
