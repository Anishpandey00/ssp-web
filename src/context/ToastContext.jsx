import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

// Small pop-up messages at the bottom of the screen. A toast can carry an
// action (e.g. "Undo") and an onExpire callback that runs when it closes
// without the action being clicked (timer, ✕ button, or the tab closing).
const ToastContext = createContext(null)
let nextId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const pending = useRef(new Map()) // id -> { timer, onExpire }

  const close = useCallback((id, runExpire) => {
    const entry = pending.current.get(id)
    if (entry) {
      clearTimeout(entry.timer)
      pending.current.delete(id)
      if (runExpire) entry.onExpire?.()
    }
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((message, { action, onExpire, tone = 'success', duration = 3500 } = {}) => {
    const id = ++nextId
    setToasts((list) => [...list.slice(-2), { id, message, action, tone }])
    pending.current.set(id, { timer: setTimeout(() => close(id, true), duration), onExpire })
    return id
  }, [close])

  // Finish delayed work (like a pending delete) if the user leaves the page.
  useEffect(() => {
    function flush() {
      for (const id of [...pending.current.keys()]) close(id, true)
    }
    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
  }, [close])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tone}`}>
            <span>{t.message}</span>
            {t.action && (
              <button
                className="toast-action"
                onClick={() => {
                  close(t.id, false)
                  t.action.onClick()
                }}
              >
                {t.action.label}
              </button>
            )}
            <button className="toast-close" onClick={() => close(t.id, true)} aria-label="Dismiss">
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const show = useContext(ToastContext)
  if (!show) throw new Error('useToast must be used inside ToastProvider')
  return show
}
