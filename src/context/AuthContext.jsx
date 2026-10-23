import { createContext, useContext, useState, useEffect } from 'react'
import { readSession, saveSession, clearSession } from '../utils/session.js'
import { SESSION_EXPIRED_EVENT } from '../api/backend.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  // True after the server rejected an old login, so the login page can say why.
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const parsed = readSession()
    if (parsed?.token && parsed.id) {
      const { token, ...u } = parsed
      setUser(u)
    } else if (parsed) {
      clearSession()
    }
    setReady(true)

    function onExpired() {
      setUser(null)
      setExpired(true)
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [])

  function login(u, token, remember = false) {
    setUser(u)
    setExpired(false)
    saveSession({ ...u, token }, remember)
  }

  function logout() {
    setUser(null)
    clearSession()
  }

  return (
    <AuthContext.Provider value={{ user, ready, expired, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
