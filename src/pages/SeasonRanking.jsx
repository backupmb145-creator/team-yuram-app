import { useState, useEffect } from 'react'
import { getTournaments } from '../utils/storage'
import { computeSeasonRanking, getTournamentPlacements } from '../utils/scoring'
import { CURRENT_YEAR } from '../data/constants'

export default function SeasonRanking() {
  const [tournaments, setTournaments] = useState([])
  const [ranking, setRanking] = useState([])

  useEffect(() => {
    const all = getTournaments()
    const yearTournaments = all.filter(t => t.date.startsWith(String(CURRENT_YEAR)))
    setTournaments(yearTournaments)
    setRanking(computeSeasonRanking(yearTournaments))
  }, [])

  const completed = tournaments.filter(t => t.status === 'completed')

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-yellow-400">Saison {CURRENT_YEAR}</h1>
        <span className="text-slate-400 text-sm">{completed.length} tournoi{completed.length > 1 ? 's' : ''}</span>
      </div>

      {ranking.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <div className="text-4xl mb-3">🏆</div>
          <p>Aucun tournoi terminé pour {CURRENT_YEAR}</p>
        </div>
      ) : (
        <>
          {/* Podium top 3 */}
          {ranking.length >= 3 && (
            <div className="flex gap-3 items-end justify-center py-4">
              {/* 2nd */}
              <div className="flex-1 text-center space-y-1">
                <div className="text-3xl">🥈</div>
                <div className="font-bold text-sm">{ranking[1].name}</div>
                <div className="bg-slate-700 rounded-t-lg py-3">
                  <div className="text-yellow-400 font-black text-xl">{ranking[1].pts}</div>
                  <div className="text-slate-400 text-xs">pts</div>
                </div>
              </div>
              {/* 1st */}
              <div className="flex-1 text-center space-y-1">
                <div className="text-3xl">🥇</div>
                <div className="font-bold text-sm">{ranking[0].name}</div>
                <div className="bg-yellow-500/20 border-t-2 border-yellow-500 rounded-t-lg py-5">
                  <div className="text-yellow-400 font-black text-2xl">{ranking[0].pts}</div>
                  <div className="text-slate-400 text-xs">pts</div>
                </div>
              </div>
              {/* 3rd */}
              <div className="flex-1 text-center space-y-1">
                <div className="text-3xl">🥉</div>
                <div className="font-bold text-sm">{ranking[2].name}</div>
                <div className="bg-slate-700 rounded-t-lg py-2">
                  <div className="text-yellow-400 font-black text-xl">{ranking[2].pts}</div>
                  <div className="text-slate-400 text-xs">pts</div>
                </div>
              </div>
            </div>
          )}

          {/* Full table */}
          <div className="card overflow-hidden">
            <div className="px-3 py-2 bg-slate-700/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Classement complet
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-xs">
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Joueur</th>
                  <th className="px-3 py-2 text-right">Pts</th>
                  <th className="px-3 py-2 text-right">Wins</th>
                  <th className="px-3 py-2 text-right">T</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {ranking.map((p, i) => (
                  <tr key={p.name} className={i === 0 ? 'bg-yellow-500/5' : ''}>
                    <td className="px-3 py-2.5 font-mono text-slate-400">{i + 1}</td>
                    <td className="px-3 py-2.5 font-bold">{p.name}</td>
                    <td className="px-3 py-2.5 text-right font-black text-yellow-400 text-base">{p.pts}</td>
                    <td className="px-3 py-2.5 text-right text-green-400">{p.wins}</td>
                    <td className="px-3 py-2.5 text-right text-slate-400">{p.tournamentsPlayed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Points legend */}
          <div className="card p-3 text-xs space-y-1">
            <p className="text-slate-400 font-bold mb-1">Calcul du classement saison</p>
            <p className="text-slate-400">Cumul des points de match sur tous les tournois terminés</p>
            <p className="text-slate-500 mt-1">Départage : Points → Duels gagnés</p>
          </div>

          {/* Per-tournament breakdown */}
          {completed.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Détail par tournoi
              </h2>
              <div className="space-y-2">
                {completed.map(t => (
                  <TournamentResult key={t.id} tournament={t} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function TournamentResult({ tournament }) {
  const placements = getTournamentPlacements(tournament)
  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{tournament.date}</span>
        <span className="text-slate-400 text-xs">{tournament.players.length} joueurs</span>
      </div>
      <div className="flex gap-3 text-sm">
        {placements.slice(0, 3).map(({ name, rank }) => (
          <div key={name} className="flex items-center gap-1">
            <span>{['🥇', '🥈', '🥉'][rank - 1]}</span>
            <span className="font-medium">{name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
