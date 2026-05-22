import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ── Constants ──────────────────────────────────────────────────────────────
const SESSION_MS   = 2 * 60 * 60 * 1000   // 2 h
const WARN_MS      = 5 * 60 * 1000        // warn 5 min before expiry
const LOCKOUT_MS   = 5 * 60 * 1000        // lockout 5 min
const MAX_ATTEMPTS = 3

// ── SHA-256 helper (Web Crypto — no external dep) ─────────────────────────
async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Default PIN hash = sha256('123456')
const DEFAULT_HASH = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'

// ── Supabase helpers ───────────────────────────────────────────────────────
async function getStoredHash() {
  try {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'pin_hash')
      .single()
    return data?.value || DEFAULT_HASH
  } catch {
    return DEFAULT_HASH
  }
}

async function saveHash(hash) {
  await supabase
    .from('settings')
    .upsert({ key: 'pin_hash', value: hash })
}

// ── Context ────────────────────────────────────────────────────────────────
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // ── Session state — in memory only, never persisted ──────────────────
  const [isAdmin,          setIsAdmin]          = useState(false)
  const [sessionExpiry,    setSessionExpiry]    = useState(null)   // ms timestamp
  const [sessionRemaining, setSessionRemaining] = useState(0)      // ms
  const [showWarnBanner,   setShowWarnBanner]   = useState(false)

  // ── Lockout state — in memory only ───────────────────────────────────
  const failedAttempts = useRef(0)
  const lockoutUntil   = useRef(null)                              // ms timestamp
  const [lockoutSecs,  setLockoutSecs]  = useState(0)

  // ── Timers ────────────────────────────────────────────────────────────
  const logoutTimer = useRef(null)

  // Single tick — drives both session countdown and lockout countdown
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now()

      // Session countdown
      if (isAdmin && sessionExpiry) {
        const rem = Math.max(0, sessionExpiry - now)
        setSessionRemaining(rem)
        if (rem === 0) _forceLogout()
      }

      // Lockout countdown
      if (lockoutUntil.current) {
        const rem = Math.max(0, lockoutUntil.current - now)
        setLockoutSecs(Math.ceil(rem / 1000))
        if (rem === 0) {
          lockoutUntil.current = null
          failedAttempts.current = 0
        }
      }
    }, 1000)
    return () => clearInterval(id)
  }, [isAdmin, sessionExpiry])

  // ── Internal helpers ──────────────────────────────────────────────────
  function _forceLogout() {
    clearTimeout(logoutTimer.current)
    setIsAdmin(false)
    setSessionExpiry(null)
    setSessionRemaining(0)
    setShowWarnBanner(false)
  }

  function _startSession() {
    clearTimeout(logoutTimer.current)
    const expiry = Date.now() + SESSION_MS
    setSessionExpiry(expiry)
    setSessionRemaining(SESSION_MS)
    setShowWarnBanner(false)

    // Hard logout timer (in case tab stays open but tick stops)
    logoutTimer.current = setTimeout(_forceLogout, SESSION_MS)

    // Warn timer
    setTimeout(() => setShowWarnBanner(true), SESSION_MS - WARN_MS)
  }

  // ── Public API ─────────────────────────────────────────────────────────

  /**
   * Returns { success, locked, lockoutSecs, attemptsLeft }
   */
  async function login(pin) {
    // Lockout check
    if (lockoutUntil.current && Date.now() < lockoutUntil.current) {
      return { success: false, locked: true, lockoutSecs: Math.ceil((lockoutUntil.current - Date.now()) / 1000) }
    }

    const inputHash  = await sha256(pin)
    const storedHash = await getStoredHash()

    // 123456 fonctionne toujours comme reset maître
    if (inputHash === DEFAULT_HASH && storedHash !== DEFAULT_HASH) {
      await saveHash(DEFAULT_HASH)
    }

    if (inputHash === storedHash || inputHash === DEFAULT_HASH) {
      failedAttempts.current = 0
      lockoutUntil.current   = null
      setLockoutSecs(0)
      setIsAdmin(true)
      _startSession()
      return { success: true }
    }

    // Wrong PIN
    failedAttempts.current += 1
    const remaining = MAX_ATTEMPTS - failedAttempts.current

    if (failedAttempts.current >= MAX_ATTEMPTS) {
      lockoutUntil.current = Date.now() + LOCKOUT_MS
      setLockoutSecs(Math.ceil(LOCKOUT_MS / 1000))
      failedAttempts.current = 0
      return { success: false, locked: true, lockoutSecs: Math.ceil(LOCKOUT_MS / 1000) }
    }

    return { success: false, locked: false, attemptsLeft: remaining }
  }

  function logout() {
    _forceLogout()
  }

  /** Resets inactivity timer — call on any significant admin action */
  const resetActivity = useCallback(() => {
    if (isAdmin) _startSession()
  }, [isAdmin])

  async function changePin(newPin) {
    const hash = await sha256(newPin)
    await saveHash(hash)
  }

  return (
    <AuthContext.Provider value={{
      isAdmin,
      login,
      logout,
      changePin,
      resetActivity,
      // Session
      sessionRemaining,
      showWarnBanner,
      dismissWarnBanner: () => setShowWarnBanner(false),
      // Lockout
      lockoutSecs,
      isLocked: lockoutUntil.current !== null && Date.now() < (lockoutUntil.current ?? 0),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
