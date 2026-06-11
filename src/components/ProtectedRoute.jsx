import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Navbar from './Navbar.jsx'

export default function ProtectedRoute({ adminOnly = false }) {
  const { user, ready } = useAuth()

  if (!ready) return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div className="spinner">Loading…</div>
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !user.isAdmin) return <Navigate to="/dashboard" replace />

  return (
    <div className="container">
      <Navbar />
      <Outlet />
    </div>
  )
}
