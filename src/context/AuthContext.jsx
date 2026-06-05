import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)
const SESSION_KEY = 'ssp_session'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (parsed.token && parsed.id) {
          const { token, ...u } = parsed
          setUser(u)
        }
      } catch {
        sessionStorage.removeItem(SESSION_KEY)
      }
    }
    setReady(true)
  }, [])

  function login(u, token) {
    setUser(u)
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...u, token }))
  }

  function logout() {
    setUser(null)
    sessionStorage.removeItem(SESSION_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
