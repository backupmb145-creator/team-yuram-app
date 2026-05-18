import { useState, useEffect } from 'react'
import { getHistory, saveHistoryYear } from '../lib/db'
import { MEMBERS } from '../data/constants'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

export default function History() {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const [history, setHistory] = useState({})
  const [editingYear, setEditingYear] = useState(null)

  useEffect(() => {
    getHistory().then(setHistory).catch(() => toast('Impossible de charger l\'historique'))
  }, [])

  async function handleSave(year, data) {
    try {
      await saveHistoryYear(year, data)
      setHistory(h => ({ ...h, [year]: data }))
      setEditingYear(null)
    } catch {
      toast('Erreur lors de la sauvegarde')
    }
  }

  const years = Object.keys(history).sort((a, b) => b - a)

  return (
    <div className="p-4 space-y-5">
      <h1 className="text-xl font-black text-yellow-400">Historique des saisons</h1>

      {years.map(year => (
        <YearCard
          key={year}
          year={year}
          data={history[year]}
          isAdmin={isAdmin}
          isEditing={editingYear === year}
          onEdit={() => setEditingYear(year)}
          onSave={data => handleSave(year, data)}
          onCancel={() => setEditingYear(null)}
        />
      ))}
    </div>
  )
}

function YearCard({ year, data, isAdmin, isEditing, onEdit, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({ ...data }))

  useEffect(() => { setForm({ ...data }) }, [data])

  // Inclut les joueurs historiques (ex: Steve) en plus des membres actuels
  const allPlayers = [...new Set([...MEMBERS, ...data.ranking.map(r => r.name)])]

  function updateRank(name, pts) {
    setForm(f => ({
      ...f,
      ranking: f.ranking.map(r => r.name === name ? { ...r, pts: Math.max(0, parseInt(pts) || 0) } : r),
    }))
  }

  if (isEditing) {
    return (
      <div className="card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-lg text-yellow-400">Saison {year}</h2>
          <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded">Édition</span>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Champion 🏆</label>
          <select
            value={form.champion}
            onChange={e => setForm(f => ({ ...f, champion: e.target.value }))}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
          >
            <option value="">-- Inconnu --</option>
            {allPlayers.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Points de saison</label>
          <div className="space-y-2">
            {[...form.ranking]
              .sort((a, b) => b.pts - a.pts)
              .map(r => (
                <div key={r.name} className="flex items-center gap-3">
                  <span className="text-slate-300 text-sm flex-1">{r.name}</span>
                  <input
                    type="number"
                    min="0"
                    value={r.pts}
                    onChange={e => updateRank(r.name, e.target.value)}
                    className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-sm text-right"
                  />
                  <span className="text-slate-500 text-xs w-5">pts</span>
                </div>
              ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Note (optionnel)</label>
          <textarea
            value={form.note}
            onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            rows={2}
            placeholder="Résumé de la saison..."
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={() => { setForm({ ...data }); onCancel() }} className="btn-secondary flex-1">Annuler</button>
          <button onClick={() => onSave(form)} className="btn-primary flex-1">Sauvegarder</button>
        </div>
      </div>
    )
  }

  const sorted = [...data.ranking].sort((a, b) => b.pts - a.pts).filter(r => r.pts > 0)
  const MEDALS = ['🥇', '🥈', '🥉']

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-black text-lg">Saison {year}</h2>
          {data.champion && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-yellow-400 text-sm">🏆 Champion :</span>
              <span className="text-yellow-400 font-bold text-sm">{data.champion}</span>
            </div>
          )}
        </div>
        {isAdmin && (
          <button onClick={onEdit} className="text-slate-500 hover:text-yellow-400 text-sm transition-colors px-2 py-1">
            ✎ Éditer
          </button>
        )}
      </div>

      {data.note && (
        <p className="text-slate-400 text-sm italic mb-3 border-l-2 border-slate-600 pl-3">{data.note}</p>
      )}

      {sorted.length > 0 ? (
        <div className="space-y-1.5">
          {sorted.map((r, i) => (
            <div key={r.name} className="flex items-center gap-2">
              <span className="w-7 text-center text-lg">{MEDALS[i] ?? `${i + 1}.`}</span>
              <span className="font-medium flex-1">{r.name}</span>
              <span className="text-yellow-400 font-black tabular-nums">{r.pts}</span>
              <span className="text-slate-500 text-xs">pts</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500 text-sm italic">Données non renseignées — appuie sur ✎ Éditer</p>
      )}
    </div>
  )
}
