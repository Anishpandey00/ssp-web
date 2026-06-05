import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Navbar from './Navbar.jsx'

// Enforces Business Rule: only logged-in users can access the features.
export default function ProtectedRoute() {
  const { user, ready } = useAuth()
  if (!ready) return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div className="spinner">Loading…</div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return (
    <div className="container">
      <Navbar />
      <Outlet />
    </div>
  )
}
