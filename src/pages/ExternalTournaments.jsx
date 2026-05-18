import { useState, useEffect } from 'react'
import { getExternalTournaments, saveExternalTournament, deleteExternalTournament, generateId } from '../utils/storage'
import { MEMBERS } from '../data/constants'
import { useAuth } from '../contexts/AuthContext'

export default function ExternalTournaments() {
  const { isAdmin } = useAuth()
  const [tournaments, setTournaments] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  function refresh() {
    setTournaments(getExternalTournaments().sort((a, b) => a.date.localeCompare(b.date)))
  }

  useEffect(() => { refresh() }, [])

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = tournaments.filter(t => t.date >= today)
  const past = [...tournaments.filter(t => t.date < today)].reverse()

  function handleSave(data) {
    saveExternalTournament(data)
    refresh()
    setShowForm(false)
    setEditingId(null)
  }

  function handleDelete(id) {
    deleteExternalTournament(id)
    setConfirmDelete(null)
    refresh()
  }

  const editing = editingId ? tournaments.find(t => t.id === editingId) : null

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-yellow-400">Tournois Externes</h1>
        {isAdmin && (
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm px-3 py-1.5">
            + Tournoi
          </button>
        )}
      </div>

      {/* À venir */}
      <section>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          À venir ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <div className="text-3xl mb-2">📅</div>
            <p>Aucun tournoi externe à venir</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map(t => (
              <ExternalCard
                key={t.id}
                tournament={t}
                isAdmin={isAdmin}
                onEdit={() => setEditingId(t.id)}
                onDelete={() => setConfirmDelete(t.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Historique */}
      {past.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Historique ({past.length})
          </h2>
          <div className="space-y-2">
            {past.map(t => (
              <ExternalCard
                key={t.id}
                tournament={t}
                isAdmin={isAdmin}
                isPast
                onEdit={() => setEditingId(t.id)}
                onDelete={() => setConfirmDelete(t.id)}
              />
            ))}
          </div>
        </section>
      )}

      {(showForm || editing) && (
        <ExternalForm
          initial={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingId(null) }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-sm space-y-4">
            <p className="font-bold">Supprimer ce tournoi externe ?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={() => handleDelete(confirmDelete)} className="btn-danger flex-1">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ExternalCard({ tournament: t, isAdmin, isPast, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const hasResults = isPast && t.results?.some(r => r.placement)

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full p-3 flex items-center justify-between hover:bg-slate-700/50 transition-colors text-left"
      >
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold">{t.name}</span>
            {hasResults && (
              <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full">Résultats</span>
            )}
            {isPast && !hasResults && (
              <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">Passé</span>
            )}
          </div>
          <div className="text-slate-400 text-xs mt-0.5">
            {t.date}{t.location ? ` · ${t.location}` : ''}
          </div>
          <div className="text-slate-500 text-xs mt-0.5">
            {t.participants?.length ?? 0} membre{(t.participants?.length ?? 0) !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {isAdmin && (
            <>
              <button
                onClick={e => { e.stopPropagation(); onEdit() }}
                className="text-slate-500 hover:text-yellow-400 text-sm px-1.5 py-1"
              >
                ✎
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDelete() }}
                className="text-slate-600 hover:text-red-400 text-lg px-1"
              >
                ×
              </button>
            </>
          )}
          <span className="text-slate-500 ml-1">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && t.participants?.length > 0 && (
        <div className="border-t border-slate-700 p-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Participants</p>
          <div className="space-y-1.5">
            {t.participants.map(p => {
              const result = t.results?.find(r => r.name === p.name)
              return (
                <div key={p.name} className="flex items-center gap-2 text-sm">
                  <span className="font-medium flex-1">{p.name}</span>
                  {p.deck && <span className="text-slate-400 text-xs">{p.deck}</span>}
                  {result?.placement && (
                    <span className="text-yellow-400 text-xs font-bold ml-auto">{result.placement}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function ExternalForm({ initial, onSave, onClose }) {
  const today = new Date().toISOString().slice(0, 10)
  const [name, setName] = useState(initial?.name ?? '')
  const [date, setDate] = useState(initial?.date ?? today)
  const [location, setLocation] = useState(initial?.location ?? '')
  const [participants, setParticipants] = useState(initial?.participants ?? [])
  const [results, setResults] = useState(initial?.results ?? [])
  const [customMember, setCustomMember] = useState('')

  const isPast = date < today
  const participantNames = participants.map(p => p.name)

  function toggleMember(memberName) {
    setParticipants(prev =>
      prev.find(p => p.name === memberName)
        ? prev.filter(p => p.name !== memberName)
        : [...prev, { name: memberName, deck: '' }]
    )
  }

  function updateDeck(memberName, deck) {
    setParticipants(prev => prev.map(p => p.name === memberName ? { ...p, deck } : p))
  }

  function updateResult(memberName, placement) {
    setResults(prev => {
      const existing = prev.find(r => r.name === memberName)
      if (existing) return prev.map(r => r.name === memberName ? { ...r, placement } : r)
      return [...prev, { name: memberName, placement }]
    })
  }

  function addCustomMember() {
    const n = customMember.trim()
    if (!n || participants.find(p => p.name === n)) return
    setParticipants(prev => [...prev, { name: n, deck: '' }])
    setCustomMember('')
  }

  function handleSubmit() {
    if (!name.trim() || !date) return
    onSave({
      id: initial?.id ?? generateId(),
      name: name.trim(),
      date,
      location: location.trim(),
      participants,
      results: isPast ? results : [],
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="card w-full max-w-sm space-y-4 p-5 max-h-[90vh] overflow-y-auto">
        <h2 className="font-black text-lg text-yellow-400">
          {initial ? 'Modifier' : 'Nouveau'} tournoi externe
        </h2>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Nom du tournoi</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="ex: Regional Paris, YCS Lyon, WCQ…"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Lieu</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Ville…"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Membres participants
          </label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {MEMBERS.map(m => (
              <button
                key={m}
                onClick={() => toggleMember(m)}
                className={`py-1.5 px-3 rounded-lg text-sm font-medium border-2 transition-colors text-left ${
                  participantNames.includes(m)
                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                    : 'bg-slate-700 border-slate-600 text-slate-300'
                }`}
              >
                {participantNames.includes(m) ? '✓ ' : '  '}{m}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customMember}
              onChange={e => setCustomMember(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomMember()}
              placeholder="Autre joueur…"
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
            />
            <button onClick={addCustomMember} className="btn-secondary text-sm px-3">+</button>
          </div>
        </div>

        {participants.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Decks joués</label>
            {participants.map(p => (
              <div key={p.name} className="flex items-center gap-2 mb-1.5">
                <span className="text-sm w-20 truncate flex-shrink-0">{p.name}</span>
                <input
                  type="text"
                  value={p.deck}
                  onChange={e => updateDeck(p.name, e.target.value)}
                  placeholder="Deck…"
                  className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
                />
              </div>
            ))}
          </div>
        )}

        {isPast && participants.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Résultats obtenus</label>
            {participants.map(p => {
              const r = results.find(r => r.name === p.name)
              return (
                <div key={p.name} className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm w-20 truncate flex-shrink-0">{p.name}</span>
                  <input
                    type="text"
                    value={r?.placement ?? ''}
                    onChange={e => updateResult(p.name, e.target.value)}
                    placeholder="ex: 12e, Top 32…"
                    className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
                  />
                </div>
              )
            })}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !date}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {initial ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}
