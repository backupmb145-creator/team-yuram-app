import { useState, useEffect } from 'react'
import { getTournaments, deleteTournament } from '../lib/db'
import { computeSeasonRanking } from '../utils/scoring'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { CURRENT_YEAR } from '../data/constants'

const STATUS_MAP = {
  pending:        { text: 'En attente',  bg: 'rgba(255,255,255,0.05)',   border: 'rgba(255,255,255,0.15)',  color: 'var(--text-secondary)' },
  active:         { text: 'En cours',    bg: 'rgba(240,192,64,0.1)',     border: 'rgba(240,192,64,0.45)',   color: 'var(--gold)', pulse: true },
  swiss_complete: { text: 'Swiss ✓',     bg: 'rgba(168,85,247,0.1)',     border: 'rgba(168,85,247,0.4)',    color: '#c084fc' },
  playoffs:       { text: 'Playoffs',    bg: 'rgba(120,60,200,0.12)',    border: 'rgba(120,60,200,0.45)',   color: '#a78bfa' },
  completed:      { text: 'Terminé',     bg: 'rgba(46,160,67,0.12)',     border: 'rgba(46,160,67,0.45)',    color: '#4ade80' },
  locked:         { text: '🔒 Clôturé', bg: 'rgba(192,57,43,0.12)',    border: 'rgba(192,57,43,0.45)',    color: '#f87171' },
}

export default function Dashboard({ navigate }) {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const [tournaments, setTournaments] = useState([])
  const [topRanking, setTopRanking] = useState([])
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    try {
      const list = await getTournaments()
      setTournaments(list)
      const ranking = computeSeasonRanking(list.filter(t => t.date.startsWith(String(CURRENT_YEAR))))
      setTopRanking(ranking.slice(0, 3))
    } catch {
      toast('Impossible de charger les tournois')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // Realtime : refresh quand un tournoi change
    const sub = supabase
      .channel('dashboard-tournaments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' }, refresh)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [])

  async function handleDelete(id) {
    try {
      await deleteTournament(id)
      setConfirmDelete(null)
      refresh()
    } catch {
      toast('Erreur lors de la suppression')
    }
  }

  const active = tournaments.filter(t => t.status !== 'completed' && t.status !== 'locked')
  const done   = tournaments.filter(t => t.status === 'completed' || t.status === 'locked')

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Podium Top 3 */}
      {topRanking.length > 0 && (
        <section>
          <SectionTitle>Top 3 — Saison {CURRENT_YEAR}</SectionTitle>
          <Podium ranking={topRanking} />
        </section>
      )}

      {/* Tournois actifs */}
      {active.length > 0 && (
        <section>
          <SectionTitle>Tournois actifs</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {active.map((t, i) => (
              <TournamentCard
                key={t.id}
                tournament={t}
                isAdmin={isAdmin}
                index={i}
                onOpen={() => navigate('tournament', { id: t.id })}
                onDelete={() => setConfirmDelete(t.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Tournois terminés */}
      {done.length > 0 && (
        <section>
          <SectionTitle>Historique des tournois</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {done.map((t, i) => (
              <TournamentCard
                key={t.id}
                tournament={t}
                isAdmin={isAdmin}
                index={i}
                onOpen={() => navigate('tournament', { id: t.id })}
                onDelete={() => setConfirmDelete(t.id)}
              />
            ))}
          </div>
        </section>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '64px 16px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px', animation: 'titleGlow 1.5s ease infinite' }}>⚔️</div>
          <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '14px' }}>Chargement…</p>
        </div>
      )}

      {!loading && tournaments.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 16px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>⚔️</div>
          <p style={{ fontFamily: 'Cinzel, serif', fontWeight: 600, color: 'var(--text-primary)', fontSize: '16px' }}>Aucun tournoi créé</p>
          <p style={{ fontSize: '13px', marginTop: '8px' }}>
            {isAdmin ? 'Appuie sur "+ Tournoi" pour commencer' : 'Connecte-toi en admin pour créer un tournoi'}
          </p>
        </div>
      )}

      {/* Suppression modal */}
      {confirmDelete && isAdmin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div className="card" style={{ padding: '24px', width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: '16px' }}>Supprimer ce tournoi ?</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Cette action est irréversible.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary" style={{ flex: 1 }}>Annuler</button>
              <button onClick={() => handleDelete(confirmDelete)} className="btn-danger" style={{ flex: 1 }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Section title ──────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <p className="section-title">{children}</p>
      <div className="section-divider" />
    </div>
  )
}

// ── Podium ─────────────────────────────────────────────────────────────────

const PODIUM_CONFIG = [
  {
    medal: '♛', label: '1er',
    border: 'rgba(240,192,64,0.55)', glow: 'rgba(240,192,64,0.3)',
    bg: 'radial-gradient(ellipse at top, rgba(240,192,64,0.12), transparent 70%)',
    scale: 1.05, ptsSize: '28px', medalColor: 'var(--gold)',
  },
  {
    medal: '🥈', label: '2e',
    border: 'rgba(192,192,192,0.35)', glow: 'rgba(192,192,192,0.15)',
    bg: 'radial-gradient(ellipse at top, rgba(192,192,192,0.06), transparent 70%)',
    scale: 1, ptsSize: '22px', medalColor: '#c0c0c0',
  },
  {
    medal: '🥉', label: '3e',
    border: 'rgba(180,100,40,0.35)', glow: 'rgba(180,100,40,0.12)',
    bg: 'radial-gradient(ellipse at top, rgba(180,100,40,0.08), transparent 70%)',
    scale: 1, ptsSize: '22px', medalColor: '#b46428',
  },
]

function Podium({ ranking }) {
  // Render order: 2nd | 1st | 3rd  for visual hierarchy
  const order = [1, 0, 2].filter(i => ranking[i])

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', padding: '8px 0' }}>
      {order.map(idx => {
        const player = ranking[idx]
        if (!player) return null
        const cfg = PODIUM_CONFIG[idx]
        return (
          <div
            key={player.name}
            style={{
              flex: 1,
              transform: `scale(${cfg.scale})`,
              transformOrigin: 'bottom center',
              background: `var(--bg-surface), ${cfg.bg}`,
              backdropFilter: 'blur(16px)',
              border: `1px solid ${cfg.border}`,
              borderRadius: '12px',
              boxShadow: `0 0 ${idx === 0 ? '40px' : '20px'} ${cfg.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
              padding: idx === 0 ? '20px 12px' : '14px 10px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              animation: `cardReveal 0.4s ease ${idx * 120}ms both`,
            }}
          >
            <span style={{ fontSize: idx === 0 ? '26px' : '20px', color: cfg.medalColor, textShadow: idx === 0 ? '0 0 14px rgba(240,192,64,0.7)' : 'none' }}>
              {cfg.medal}
            </span>
            <span style={{ fontFamily: 'Cinzel, serif', fontWeight: idx === 0 ? 700 : 600, fontSize: idx === 0 ? '14px' : '12px', color: 'var(--text-primary)', wordBreak: 'break-word', lineHeight: 1.2 }}>
              {player.name}
            </span>
            <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: cfg.ptsSize, color: 'var(--gold)', lineHeight: 1 }}>
              {player.pts}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>
              pts saison
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Tournament card ────────────────────────────────────────────────────────

function TournamentCard({ tournament: t, isAdmin, index, onOpen, onDelete }) {
  const s = STATUS_MAP[t.status] || STATUS_MAP.pending
  const allPairings = t.swissRounds?.flatMap(r => r.pairings) ?? []
  const done  = allPairings.filter(p => p.score).length
  const total = allPairings.length

  return (
    <div
      className="card"
      onClick={onOpen}
      style={{
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        animation: `cardReveal 0.35s ease ${index * 80}ms both`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
          <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
            {t.date}
          </span>
          <span style={{
            fontSize: '11px',
            padding: '2px 9px',
            borderRadius: '20px',
            background: s.bg,
            border: `1px solid ${s.border}`,
            color: s.color,
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 600,
            animation: s.pulse ? 'badgeActivePulse 2s ease infinite' : 'none',
          }}>
            {s.text}
          </span>
          {t.hasPlayoffs && (
            <span style={{ fontSize: '11px', color: '#a78bfa', fontFamily: 'Rajdhani, sans-serif' }}>+ Playoffs</span>
          )}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>
          {t.players.length} joueurs · {t.numRounds} rounds · Org: {t.organizer}
        </div>
        {total > 0 && t.status !== 'locked' && (
          <div style={{ fontSize: '11px', color: 'rgba(232,224,208,0.28)', marginTop: '2px', fontFamily: 'Rajdhani, sans-serif' }}>
            {done}/{total} matchs saisis
          </div>
        )}
      </div>
      {isAdmin && (
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'rgba(232,224,208,0.2)', transition: 'color 0.2s', flexShrink: 0, padding: '4px 6px' }}
          onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(232,224,208,0.2)'}
        >
          ×
        </button>
      )}
    </div>
  )
}
