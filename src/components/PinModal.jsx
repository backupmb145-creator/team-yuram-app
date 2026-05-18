import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { triggerMillenniumEye } from '../utils/animations'

export default function PinModal({ onClose }) {
  const { login } = useAuth()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (login(pin)) {
      triggerMillenniumEye()
      setTimeout(onClose, 1000)
    } else {
      setError(true)
      setPin('')
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
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔐</div>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: '18px', color: 'var(--gold)', marginBottom: '4px' }}>
            Mode Admin
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>
            Saisissez votre code PIN à 4 chiffres
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setError(false) }}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.06)',
              border: `2px solid ${error ? 'rgba(248,113,113,0.6)' : 'rgba(240,192,64,0.25)'}`,
              borderRadius: '10px',
              padding: '12px 16px',
              textAlign: 'center',
              fontSize: '24px',
              fontFamily: 'monospace',
              letterSpacing: '8px',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            placeholder="••••"
            autoFocus
          />
          {error && (
            <p style={{ color: '#f87171', fontSize: '13px', textAlign: 'center', fontFamily: 'Rajdhani, sans-serif' }}>
              Code PIN incorrect
            </p>
          )}
          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '10px' }}
            disabled={pin.length < 4}
          >
            Déverrouiller
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
