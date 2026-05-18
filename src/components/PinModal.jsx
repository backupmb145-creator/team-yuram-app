import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { triggerMillenniumEye } from '../utils/animations'

export default function PinModal({ onClose }) {
  const { login, lockoutSecs } = useAuth()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const locked = lockoutSecs > 0

  function fmtLockout(secs) {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return m > 0 ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (locked || loading) return
    setLoading(true)
    const result = await login(pin)
    setLoading(false)
    setPin('')

    if (result.success) {
      triggerMillenniumEye()
      setTimeout(onClose, 1000)
    } else if (result.locked) {
      setError(`Accès bloqué — réessayez dans ${fmtLockout(result.lockoutSecs)}`)
    } else {
      setError(`PIN incorrect — ${result.attemptsLeft} tentative${result.attemptsLeft > 1 ? 's' : ''} restante${result.attemptsLeft > 1 ? 's' : ''}`)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(8,12,24,0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: '16px',
    }}>
      <div className="card" style={{ padding: '28px 24px', width: '100%', maxWidth: '320px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>{locked ? '🔒' : '🔐'}</div>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: '18px', color: 'var(--gold)', marginBottom: '4px' }}>
            Mode Admin
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>
            {locked ? 'Trop de tentatives échouées' : 'Saisissez votre code PIN à 6 chiffres'}
          </p>
        </div>

        {/* Lockout countdown */}
        {locked && (
          <div style={{
            background: 'rgba(192,57,43,0.12)',
            border: '1px solid rgba(192,57,43,0.4)',
            borderRadius: '10px',
            padding: '14px',
            textAlign: 'center',
            marginBottom: '12px',
          }}>
            <div style={{ fontSize: '28px', fontFamily: 'monospace', fontWeight: 700, color: '#f87171', letterSpacing: '2px' }}>
              {fmtLockout(lockoutSecs)}
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(248,113,113,0.7)', fontFamily: 'Rajdhani, sans-serif', marginTop: '4px' }}>
              Réessayez dans ce délai
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            disabled={locked || loading}
            onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setError('') }}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: locked ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
              border: `2px solid ${error ? 'rgba(248,113,113,0.6)' : 'rgba(240,192,64,0.25)'}`,
              borderRadius: '10px',
              padding: '12px 16px',
              textAlign: 'center',
              fontSize: '24px',
              fontFamily: 'monospace',
              letterSpacing: '10px',
              color: 'var(--text-primary)',
              outline: 'none',
              opacity: locked ? 0.4 : 1,
              transition: 'border-color 0.2s',
            }}
            placeholder="••••••"
            autoFocus={!locked}
          />
          {error && (
            <p style={{ color: '#f87171', fontSize: '13px', textAlign: 'center', fontFamily: 'Rajdhani, sans-serif', lineHeight: 1.4 }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '10px', opacity: locked ? 0.4 : 1 }}
            disabled={pin.length < 6 || locked || loading}
          >
            {loading ? '…' : 'Déverrouiller'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{ width: '100%', padding: '8px' }}
          >
            Annuler
          </button>
        </form>
      </div>
    </div>
  )
}
