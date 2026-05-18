import { useState, useEffect } from 'react'
import { getTrainings, saveTraining, deleteTraining, generateId } from '../lib/db'
import { MEMBERS } from '../data/constants'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'

export default function Trainings() {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const [trainings, setTrainings] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingTraining, setEditingTraining] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  async function refresh() {
    try {
      const list = await getTrainings()
      setTrainings(list.sort((a, b) => b.date.localeCompare(a.date)))
    } catch {
      toast('Impossible de charger les entraînements')
    }
  }

  useEffect(() => {
    refresh()
    const sub = supabase
      .channel('trainings-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trainings' }, refresh)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [])

  async function handleSave(training) {
    try {
      await saveTraining(training)
      refresh()
      setShowForm(false)
      setEditingTraining(null)
    } catch {
      toast('Erreur lors de la sauvegarde')
    }
  }

  async function handleDelete(id) {
    try {
      await deleteTraining(id)
      setConfirmDelete(null)
      refresh()
    } catch {
      toast('Erreur lors de la suppression')
    }
  }

  // Compute quarterly stats
  const stats = computeQuarterlyStats(trainings)

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-yellow-400">Entraînements</h1>
        {isAdmin && (
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm px-3 py-1.5">
            + Séance
          </button>
        )}
      </div>

      {/* Quarterly stats */}
      {Object.keys(stats).length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Présence par trimestre
          </h2>
          <div className="space-y-3">
            {Object.entries(stats).reverse().map(([quarter, data]) => (
              <QuarterCard key={quarter} quarter={quarter} data={data} />
            ))}
          </div>
        </section>
      )}

      {/* Training list */}
      <section>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Séances ({trainings.length})
        </h2>
        {trainings.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <div className="text-4xl mb-2">📋</div>
            <p>Aucune séance enregistrée</p>
          </div>
        ) : (
          <div className="space-y-2">
            {trainings.map(t => (
              <TrainingCard
                key={t.id}
                training={t}
                isAdmin={isAdmin}
                onEdit={() => setEditingTraining(t)}
                onDelete={() => setConfirmDelete(t.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Add form modal */}
      {showForm && (
        <TrainingForm
          onSave={handleSave}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Edit form modal */}
      {editingTraining && (
        <TrainingForm
          training={editingTraining}
          onSave={handleSave}
          onClose={() => setEditingTraining(null)}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-sm space-y-4">
            <p className="font-bold">Supprimer cette séance ?</p>
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

function TrainingCard({ training, onDelete, onEdit, isAdmin }) {
  return (
    <div className="card p-3 flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{training.date}</div>
        <div className="text-slate-400 text-xs mt-0.5">
          {training.present.length} présents : {training.present.join(', ')}
        </div>
        {training.note && (
          <div className="text-slate-500 text-xs mt-0.5 italic">{training.note}</div>
        )}
      </div>
      {isAdmin && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button
            onClick={onEdit}
            className="text-slate-500 hover:text-yellow-400 transition-colors text-sm px-1.5 py-0.5"
            title="Modifier"
          >
            ✎
          </button>
          <button
            onClick={onDelete}
            className="text-slate-600 hover:text-red-400 transition-colors text-lg px-1"
            title="Supprimer"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

function TrainingForm({ onSave, onClose, training = null }) {
  const isEdit = training !== null
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(isEdit ? training.date : today)
  const [present, setPresent] = useState(isEdit ? training.present : [])
  const [note, setNote] = useState(isEdit ? training.note ?? '' : '')

  function toggle(name) {
    setPresent(p => p.includes(name) ? p.filter(n => n !== name) : [...p, name])
  }

  function handleSubmit() {
    if (!date || present.length === 0) return
    onSave({ id: isEdit ? training.id : generateId(), date, present, note: note.trim() })
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="card w-full max-w-sm space-y-4 p-5 max-h-[90vh] overflow-y-auto">
        <h2 className="font-black text-lg text-yellow-400">{isEdit ? 'Modifier la séance' : 'Nouvelle séance'}</h2>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Présents ({present.length})
          </label>
          <div className="grid grid-cols-2 gap-2">
            {MEMBERS.map(name => (
              <button
                key={name}
                onClick={() => toggle(name)}
                className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition-colors text-left ${
                  present.includes(name)
                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                    : 'bg-slate-700 border-slate-600 text-slate-300'
                }`}
              >
                {present.includes(name) ? '✓ ' : '  '}{name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Note (optionnel)</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Thème de la séance..."
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button
            onClick={handleSubmit}
            disabled={!date || present.length === 0}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEdit ? 'Sauvegarder' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

function QuarterCard({ quarter, data }) {
  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-sm">{quarter}</span>
        <span className="text-slate-400 text-xs">{data.sessions} séance{data.sessions > 1 ? 's' : ''}</span>
      </div>
      <div className="space-y-1">
        {data.players
          .sort((a, b) => b.rate - a.rate)
          .map(p => (
            <div key={p.name} className="flex items-center gap-2">
              <span className="text-slate-300 text-xs w-16 truncate">{p.name}</span>
              <div className="flex-1 bg-slate-700 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all"
                  style={{ width: `${p.rate}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 w-10 text-right">
                {p.count}/{data.sessions}
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}

function computeQuarterlyStats(trainings) {
  const quarters = {}

  for (const t of trainings) {
    const d = new Date(t.date)
    const year = d.getFullYear()
    const q = Math.ceil((d.getMonth() + 1) / 3)
    const key = `${year} T${q}`

    if (!quarters[key]) {
      quarters[key] = { sessions: 0, counts: {} }
      MEMBERS.forEach(m => (quarters[key].counts[m] = 0))
    }

    quarters[key].sessions += 1
    for (const name of t.present) {
      if (quarters[key].counts[name] !== undefined) {
        quarters[key].counts[name] += 1
      }
    }
  }

  const result = {}
  for (const [key, val] of Object.entries(quarters)) {
    result[key] = {
      sessions: val.sessions,
      players: MEMBERS.map(name => ({
        name,
        count: val.counts[name],
        rate: val.sessions ? Math.round((val.counts[name] / val.sessions) * 100) : 0,
      })),
    }
  }

  return result
}
