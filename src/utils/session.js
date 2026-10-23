// The login session lives in sessionStorage (this tab only) or, when the user
// ticks "Keep me logged in", in localStorage (all tabs, survives restarts).
const KEY = 'ssp_session'

function stores() {
  try {
    return [window.localStorage, window.sessionStorage]
  } catch {
    return []
  }
}

export function readSession() {
  for (const store of stores()) {
    try {
      const raw = store.getItem(KEY)
      if (raw) return JSON.parse(raw)
    } catch {
      store.removeItem(KEY)
    }
  }
  return null
}

export function saveSession(data, remember) {
  clearSession()
  try {
    ;(remember ? window.localStorage : window.sessionStorage).setItem(KEY, JSON.stringify(data))
  } catch {
    // Storage blocked (private mode): the session lasts until the page reloads.
  }
}

export function clearSession() {
  for (const store of stores()) {
    try {
      store.removeItem(KEY)
    } catch {
      // ignore
    }
  }
}
