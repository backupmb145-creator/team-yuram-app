import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import PinModal from './PinModal'
import { triggerHexRipple, triggerInvocation } from '../utils/animations'

const NAV = [
  { id: 'dashboard',  label: 'Accueil',   icon: '🏠' },
  { id: 'ranking',    label: 'Saison',    icon: '🏆' },
  { id: 'trainings',  label: 'Entraîn.',  icon: '📋' },
  { id: 'external',   label: 'Externe',   icon: '🌍' },
  { id: 'history',    label: 'Historique',icon: '📖' },
]

function fmtSession(ms) {
  const totalSecs = Math.ceil(ms / 1000)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`
  if (m > 0) return `${m}m${String(s).padStart(2, '0')}`
  return `${s}s`
}

const WARN_MS = 5 * 60 * 1000

export default function Layout({ page, navigate, children }) {
  const showBack = page === 'tournament' || page === 'new'
  const { isAdmin, logout, sessionRemaining, showWarnBanner, dismissWarnBanner } = useAuth()
  const [showPin, setShowPin] = useState(false)
  const [showAdminMenu, setShowAdminMenu] = useState(false)

  const nearExpiry = isAdmin && sessionRemaining > 0 && sessionRemaining <= WARN_MS

  // Global hex ripple on all button clicks
  useEffect(() => {
    function onBtnClick(e) {
      const btn = e.target.closest('button')
      if (btn && !btn.dataset.noRipple) triggerHexRipple({ currentTarget: btn, clientX: e.clientX, clientY: e.clientY })
    }
    document.addEventListener('click', onBtnClick, true)
    return () => document.removeEventListener('click', onBtnClick, true)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', position: 'relative' }}>

      {/* ── Background halos ─────────────────────────────────── */}
      <div aria-hidden="true" style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse 600px 400px at 85% 10%, rgba(240,192,64,0.06), transparent),
          radial-gradient(ellipse 500px 350px at 10% 90%, rgba(120,60,200,0.07), transparent),
          radial-gradient(ellipse 400px 250px at 50% 95%, rgba(192,57,43,0.05), transparent)
        `,
      }} />

      {/* ── Logo watermark ───────────────────────────────────── */}
      <div aria-hidden="true" style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <img src="/logo.svg" alt="" style={{ width: '520px', opacity: 0.05, filter: 'blur(1px)', userSelect: 'none' }} />
      </div>

      {/* ── Logos côtés (xl) ─────────────────────────────────── */}
      <div aria-hidden="true" className="hidden xl:block" style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: '288px', pointerEvents: 'none', zIndex: 0 }}>
        <img src="/logo.svg" alt="" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: '256px', left: '16px', opacity: 0.1, filter: 'drop-shadow(0 0 30px rgba(240,192,64,0.5))' }} />
      </div>
      <div aria-hidden="true" className="hidden xl:block" style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '288px', pointerEvents: 'none', zIndex: 0 }}>
        <img src="/logo.svg" alt="" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: '256px', right: '16px', opacity: 0.1, filter: 'drop-shadow(0 0 30px rgba(240,192,64,0.5))' }} />
      </div>

      {/* ── Main container ───────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '672px', margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* ── Bannière expiration session ─────────────────────── */}
        {showWarnBanner && (
          <div style={{
            position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: '672px',
            background: 'rgba(192,57,43,0.92)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(248,113,113,0.5)',
            padding: '10px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
            zIndex: 30,
            animation: 'cardReveal 0.3s ease both',
          }}>
            <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '13px', color: '#fff', fontWeight: 600 }}>
              ⚠️ Session admin expire dans {fmtSession(sessionRemaining)} — sauvegarde tes données
            </span>
            <button
              onClick={dismissWarnBanner}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '18px', cursor: 'pointer', flexShrink: 0, padding: '0 4px' }}
            >
              ×
            </button>
          </div>
        )}

        {/* ── Header ─────────────────────────────────────────── */}
        <header style={{
          background: 'rgba(8,12,24,0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(240,192,64,0.2)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          marginTop: showWarnBanner ? '44px' : '0',
          transition: 'margin-top 0.3s',
        }}>
          {showBack && (
            <button
              onClick={() => navigate('dashboard')}
              style={{ color: 'var(--gold)', fontSize: '20px', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
            >
              ←
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
            <img src="/logo.svg" alt="Team Yurâm" style={{ height: '40px', width: '40px', objectFit: 'contain', flexShrink: 0 }} />
            <span style={{
              fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: '20px', color: 'var(--gold)',
              textShadow: '0 0 20px rgba(240,192,64,0.5)', animation: 'titleGlow 4s ease infinite', whiteSpace: 'nowrap',
            }}>
              Team Yurâm
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontFamily: 'Rajdhani, sans-serif' }}>
              {page === 'new'        && '/ Nouveau tournoi'}
              {page === 'tournament' && '/ Tournoi'}
              {page === 'ranking'    && '/ Saison 2026'}
              {page === 'trainings'  && '/ Entraînements'}
              {page === 'history'    && '/ Historique'}
              {page === 'external'   && '/ Tournois Externes'}
            </span>
          </div>

          {/* Session timer chip — visible quand admin actif */}
          {isAdmin && sessionRemaining > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '3px 8px',
              borderRadius: '20px',
              background: nearExpiry ? 'rgba(192,57,43,0.2)' : 'rgba(240,192,64,0.08)',
              border: `1px solid ${nearExpiry ? 'rgba(248,113,113,0.4)' : 'rgba(240,192,64,0.2)'}`,
              flexShrink: 0,
              transition: 'all 0.5s',
            }}>
              <span style={{ fontSize: '10px' }}>{nearExpiry ? '⚠️' : '⏱'}</span>
              <span style={{
                fontFamily: 'monospace', fontSize: '11px', fontWeight: 700,
                color: nearExpiry ? '#f87171' : 'rgba(240,192,64,0.7)',
                letterSpacing: '0.5px',
              }}>
                {fmtSession(sessionRemaining)}
              </span>
            </div>
          )}

          {/* + Tournoi (admin) */}
          {page === 'dashboard' && isAdmin && (
            <button
              data-no-ripple="1"
              onClick={e => { triggerInvocation(e.currentTarget); setTimeout(() => navigate('new'), 80) }}
              style={{
                background: 'linear-gradient(135deg, #f0c040, #c8960a)', color: '#080c18',
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '14px', letterSpacing: '0.5px',
                padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                boxShadow: '0 0 15px rgba(240,192,64,0.3)', flexShrink: 0, transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 0 28px rgba(240,192,64,0.55)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(240,192,64,0.3)' }}
            >
              + Tournoi
            </button>
          )}

          {/* Cadenas */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => isAdmin ? setShowAdminMenu(m => !m) : setShowPin(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '20px', padding: '6px 8px', borderRadius: '6px',
                color: isAdmin ? 'var(--gold)' : 'var(--text-secondary)',
                textShadow: isAdmin ? '0 0 12px rgba(240,192,64,0.7)' : 'none',
                transition: 'color 0.2s, text-shadow 0.2s',
              }}
              title={isAdmin ? 'Mode Admin' : 'Mode Membre'}
            >
              {isAdmin ? '🔓' : '🔒'}
            </button>

            {isAdmin && showAdminMenu && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowAdminMenu(false)} />
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  background: 'rgba(8,12,24,0.95)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(240,192,64,0.2)', borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 20, width: '220px', overflow: 'hidden',
                }}>
                  <div style={{ padding: '10px 16px', background: 'rgba(240,192,64,0.08)', borderBottom: '1px solid rgba(240,192,64,0.15)' }}>
                    <p style={{ fontFamily: 'Cinzel, serif', fontSize: '11px', color: 'var(--gold)', letterSpacing: '2px', textTransform: 'uppercase' }}>Mode Admin</p>
                    {sessionRemaining > 0 && (
                      <p style={{ fontSize: '11px', color: nearExpiry ? '#f87171' : 'rgba(240,192,64,0.5)', fontFamily: 'Rajdhani, sans-serif', marginTop: '2px' }}>
                        Session expire dans {fmtSession(sessionRemaining)}
                      </p>
                    )}
                  </div>
                  <ChangePinItem onDone={() => setShowAdminMenu(false)} />
                  <button
                    onClick={() => { logout(); setShowAdminMenu(false) }}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '14px', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,57,43,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    🔒 Se déconnecter
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* ── Content ────────────────────────────────────────── */}
        <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }}>
          {children}
        </main>

        {/* ── Bottom nav ─────────────────────────────────────── */}
        {!showBack && (
          <nav style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: '672px',
            background: 'rgba(8,12,24,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            borderTop: '1px solid rgba(240,192,64,0.2)', display: 'flex', zIndex: 10,
          }}>
            {NAV.map(({ id, label, icon }) => {
              const active = page === id
              return (
                <button
                  key={id}
                  onClick={() => navigate(id)}
                  style={{ flex: 1, padding: '10px 4px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'none', border: 'none', cursor: 'pointer', position: 'relative', transition: 'all 0.15s ease' }}
                >
                  <span style={{ fontSize: '20px', lineHeight: 1, textShadow: active ? '0 0 10px rgba(240,192,64,0.7)' : 'none', opacity: active ? 1 : 0.35, transition: 'all 0.15s ease' }}>
                    {icon}
                  </span>
                  <span style={{ fontFamily: active ? 'Cinzel, serif' : 'Rajdhani, sans-serif', fontSize: '10px', fontWeight: active ? 600 : 400, color: active ? 'var(--gold)' : 'var(--text-secondary)', letterSpacing: active ? '0.5px' : '0', transition: 'all 0.15s ease' }}>
                    {label}
                  </span>
                  {active && (
                    <span style={{ position: 'absolute', bottom: '2px', left: '50%', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--gold)', boxShadow: '0 0 8px rgba(240,192,64,0.8)', animation: 'navDotAppear 0.2s ease forwards' }} />
                  )}
                </button>
              )
            })}
          </nav>
        )}
      </div>

      {showPin && <PinModal onClose={() => setShowPin(false)} />}
    </div>
  )
}

// ── Change PIN item ────────────────────────────────────────────────────────

function ChangePinItem({ onDone }) {
  const { changePin } = useAuth()
  const [editing, setEditing] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [error, setError] = useState('')

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '14px', color: 'var(--text-primary)', background: 'none', border: 'none', borderBottom: '1px solid rgba(240,192,64,0.1)', cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif', transition: 'background 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        🔑 Changer le PIN
      </button>
    )
  }

  async function handleSave() {
    if (newPin.length !== 6) { setError('6 chiffres requis'); return }
    await changePin(newPin)
    setEditing(false)
    setNewPin('')
    onDone()
  }

  return (
    <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(240,192,64,0.1)' }}>
      <input
        type="password"
        inputMode="numeric"
        maxLength={6}
        value={newPin}
        onChange={e => { setNewPin(e.target.value.replace(/\D/g, '')); setError('') }}
        placeholder="Nouveau PIN (6 chiffres)"
        style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(240,192,64,0.25)', borderRadius: '6px', padding: '6px 10px', fontSize: '14px', textAlign: 'center', fontFamily: 'monospace', letterSpacing: '6px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
        autoFocus
      />
      {error && <p style={{ color: '#f87171', fontSize: '11px', textAlign: 'center', marginTop: '4px' }}>{error}</p>}
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button onClick={() => { setEditing(false); setNewPin('') }} style={{ flex: 1, padding: '5px', fontSize: '12px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif' }}>Annuler</button>
        <button
          onClick={handleSave}
          style={{ flex: 1, padding: '5px', fontSize: '12px', borderRadius: '6px', background: 'linear-gradient(135deg,#f0c040,#c8960a)', border: 'none', color: '#080c18', fontWeight: 700, cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif' }}
        >
          Valider
        </button>
      </div>
    </div>
  )
}
