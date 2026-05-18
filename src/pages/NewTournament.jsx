import { useState } from 'react'
import { MEMBERS } from '../data/constants'
import { saveTournament, generateId } from '../lib/db'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

export default function NewTournament({ navigate }) {
  const { isAdmin } = useAuth()
  if (!isAdmin) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="text-4xl">🔒</div>
        <p className="font-bold text-slate-300">Accès Admin requis</p>
        <p className="text-slate-500 text-sm">Connecte-toi en mode Admin pour créer un tournoi.</p>
        <button onClick={() => navigate('dashboard')} className="btn-secondary mt-4">← Retour</button>
      </div>
    )
  }
  const today = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState({
    date: today,
    organizer: 'Marc',
    numRounds: 4,
    hasPlayoffs: true,
  })
  const [selectedPlayers, setSelectedPlayers] = useState([...MEMBERS])
  const [customPlayer, setCustomPlayer] = useState('')
  const [extraPlayers, setExtraPlayers] = useState([])
  const toast = useToast()
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  function togglePlayer(name) {
    setSelectedPlayers(prev =>
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    )
  }

  function addCustomPlayer() {
    const name = customPlayer.trim()
    if (!name) return
    if ([...MEMBERS, ...extraPlayers].includes(name)) return
    setExtraPlayers(prev => [...prev, name])
    setSelectedPlayers(prev => [...prev, name])
    setCustomPlayer('')
  }

  function validate() {
    const e = {}
    if (!form.date) e.date = 'Date requise'
    if (!form.organizer.trim()) e.organizer = 'Organisateur requis'
    if (selectedPlayers.length < 4) e.players = 'Minimum 4 joueurs'
    if (selectedPlayers.length > 12) e.players = 'Maximum 12 joueurs'
    if (form.numRounds < 3 || form.numRounds > 8) e.numRounds = '3 à 8 rounds'
    return e
  }

  async function handleSubmit() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    const tournament = {
      id: generateId(),
      date: form.date,
      organizer: form.organizer.trim(),
      players: [...selectedPlayers],
      numRounds: form.numRounds,
      hasPlayoffs: form.hasPlayoffs,
      status: 'pending',
      currentRound: 0,
      swissRounds: [],
      playoffs: null,
    }
    try {
      await saveTournament(tournament)
      navigate('tournament', { id: tournament.id })
    } catch {
      toast('Erreur lors de la création du tournoi')
      setSaving(false)
    }
  }

  const allMembers = [...MEMBERS, ...extraPlayers]

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-black text-yellow-400">Nouveau tournoi</h1>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
        <input
          type="date"
          value={form.date}
          onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
        />
        {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
      </div>

      {/* Organizer */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Organisateur</label>
        <select
          value={form.organizer}
          onChange={e => setForm(f => ({ ...f, organizer: e.target.value }))}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
        >
          {MEMBERS.map(m => <option key={m}>{m}</option>)}
        </select>
        {errors.organizer && <p className="text-red-400 text-xs mt-1">{errors.organizer}</p>}
      </div>

      {/* Players */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Joueurs ({selectedPlayers.length}/12)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {allMembers.map(name => (
            <button
              key={name}
              onClick={() => togglePlayer(name)}
              className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition-colors text-left ${
                selectedPlayers.includes(name)
                  ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                  : 'bg-slate-700 border-slate-600 text-slate-300'
              }`}
            >
              {selectedPlayers.includes(name) ? '✓ ' : '  '}{name}
            </button>
          ))}
        </div>
        {/* Add custom player */}
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={customPlayer}
            onChange={e => setCustomPlayer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomPlayer()}
            placeholder="Joueur invité..."
            className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
          />
          <button onClick={addCustomPlayer} className="btn-secondary text-sm px-3">
            + Ajouter
          </button>
        </div>
        {errors.players && <p className="text-red-400 text-xs mt-1">{errors.players}</p>}
      </div>

      {/* Rounds */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Nombre de rounds ({form.numRounds})
        </label>
        <div className="flex gap-2">
          {[3, 4, 5, 6, 7, 8].map(n => (
            <button
              key={n}
              onClick={() => setForm(f => ({ ...f, numRounds: n }))}
              className={`flex-1 py-2 rounded-lg font-bold text-sm border-2 transition-colors ${
                form.numRounds === n
                  ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                  : 'bg-slate-700 border-slate-600 text-slate-300'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        {errors.numRounds && <p className="text-red-400 text-xs mt-1">{errors.numRounds}</p>}
      </div>

      {/* Playoffs toggle */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Phase finale (top 4)</label>
        <div className="flex gap-3">
          {[true, false].map(val => (
            <button
              key={String(val)}
              onClick={() => setForm(f => ({ ...f, hasPlayoffs: val }))}
              className={`flex-1 py-2 rounded-lg font-bold text-sm border-2 transition-colors ${
                form.hasPlayoffs === val
                  ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                  : 'bg-slate-700 border-slate-600 text-slate-300'
              }`}
            >
              {val ? 'Avec playoffs' : 'Sans playoffs'}
            </button>
          ))}
        </div>
        {form.hasPlayoffs && selectedPlayers.length < 4 && (
          <p className="text-yellow-600 text-xs mt-1">Les playoffs nécessitent au moins 4 joueurs</p>
        )}
      </div>

      <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full py-3 text-base disabled:opacity-50">
        {saving ? 'Création…' : 'Créer le tournoi'}
      </button>
    </div>
  )
}
