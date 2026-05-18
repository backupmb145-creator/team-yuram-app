import { useState, useEffect } from 'react'
import { getTournament, saveTournament } from '../utils/storage'
import { computeStandings } from '../utils/scoring'
import { generatePairings, initPlayoffs, resolvePlayoffWinner, resolvePlayoffLoser } from '../utils/swiss'
import { useAuth } from '../contexts/AuthContext'
import Timer from '../components/Timer'
import { triggerDuelStart, triggerSpellcast, triggerVictoryScreen } from '../utils/animations'

const SCORES_P1_WIN  = ['2-0', '2-1']
const SCORES_P1_LOSS = ['1-2', '0-2']
const SCORES_DRAW    = ['0-0']

export default function TournamentView({ id, navigate }) {
  const { isAdmin } = useAuth()
  const [tournament, setTournament] = useState(null)
  const [tab, setTab] = useState('rounds')
  const [showClosure, setShowClosure] = useState(false)

  function reload() {
    const t = getTournament(id)
    setTournament(t ? { ...t } : null)
  }

  useEffect(() => { reload() }, [id])

  function update(changes) {
    const updated = { ...tournament, ...changes }
    saveTournament(updated)
    setTournament(updated)
  }

  function handleClosure(decks, finalRanking) {
    const seasonPoints = finalRanking.map(name => ({
      name,
      pts: standings.find(s => s.name === name)?.pts ?? 0,
    }))
    update({ status: 'locked', decks, seasonPoints })
    setShowClosure(false)
    triggerVictoryScreen()
  }

  if (!tournament) return <div className="p-4 text-slate-400">Tournoi introuvable.</div>

  const allPairings = tournament.swissRounds.flatMap(r => r.pairings)
  const standings = computeStandings(tournament.players, allPairings)
  const isSwissDone = ['swiss_complete', 'playoffs', 'completed', 'locked'].includes(tournament.status)
  const showPlayoffs = tournament.hasPlayoffs && isSwissDone
  const isLocked = tournament.status === 'locked'
  const canClose = tournament.status === 'completed' && isAdmin && !isLocked

  return (
    <div className="flex flex-col min-h-full">
      {/* En-tête tournoi */}
      <div className="p-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-black text-lg">{tournament.date}</div>
            <div className="text-slate-400 text-sm">
              {tournament.players.length} joueurs · {tournament.numRounds} rounds · Org: {tournament.organizer}
            </div>
          </div>
          <StatusBadge status={tournament.status} />
        </div>
      </div>

      {/* Bannière clôture */}
      {canClose && (
        <div className="px-4 py-3 bg-yellow-500/10 border-b border-yellow-500/30 flex items-center justify-between gap-3">
          <span className="text-yellow-300 text-sm">Saisir les decks et valider les points de saison</span>
          <button
            onClick={e => { triggerSpellcast(e.currentTarget); setTimeout(() => setShowClosure(true), 400) }}
            className="text-sm px-3 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-500 text-yellow-300 font-bold hover:bg-yellow-500/30 flex-shrink-0"
          >
            🏁 Clôturer
          </button>
        </div>
      )}

      {/* Bannière lecture seule */}
      {isLocked && (
        <div className="px-4 py-2 bg-slate-700/40 border-b border-slate-600 flex items-center gap-2">
          <span className="text-slate-400 text-xs">🔒 Tournoi clôturé — lecture seule</span>
        </div>
      )}

      {/* Onglets */}
      <div className="flex border-b border-slate-700 bg-slate-800">
        {[
          { id: 'rounds',    label: 'Rounds' },
          { id: 'standings', label: 'Classement' },
          ...(showPlayoffs ? [{ id: 'playoffs', label: 'Playoffs' }] : []),
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
              tab === t.id
                ? 'text-yellow-400 border-yellow-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 space-y-4">
        {tab === 'rounds'    && <RoundsTab tournament={tournament} standings={standings} update={update} isAdmin={isAdmin} isLocked={isLocked} />}
        {tab === 'standings' && <StandingsTab standings={standings} status={tournament.status} tournament={tournament} />}
        {tab === 'playoffs'  && <PlayoffsTab tournament={tournament} standings={standings} update={update} isAdmin={isAdmin} isLocked={isLocked} />}
      </div>

      {/* Modal de clôture */}
      {showClosure && (
        <ClosureModal
          tournament={tournament}
          standings={standings}
          onClose={() => setShowClosure(false)}
          onConfirm={handleClosure}
        />
      )}
    </div>
  )
}

// ── Rounds Tab ────────────────────────────────────────────────────────────────

function RoundsTab({ tournament, standings, update, isAdmin, isLocked }) {
  const { swissRounds, players, numRounds, status } = tournament
  const currentRound = swissRounds[swissRounds.length - 1]
  const isAllScored = currentRound?.pairings.every(p => p.score)
  const canStart    = status === 'pending' && swissRounds.length === 0 && isAdmin
  const canNextRound = isAllScored && swissRounds.length < numRounds && status === 'active' && isAdmin
  const canFinishSwiss = isAllScored && swissRounds.length >= numRounds && status === 'active' && isAdmin
  const showTimer = status === 'active' && currentRound && !isAllScored

  function startRound1() {
    triggerDuelStart()
    const pairings = generatePairings(players, [])
    update({
      status: 'active',
      currentRound: 1,
      roundStartTime: Date.now(),
      swissRounds: [{ round: 1, pairings }],
    })
  }

  function startNextRound() {
    triggerDuelStart()
    const allPrev = swissRounds.flatMap(r => r.pairings)
    const pairings = generatePairings(players, allPrev)
    const nextNum = swissRounds.length + 1
    update({
      currentRound: nextNum,
      roundStartTime: Date.now(),
      swissRounds: [...swissRounds, { round: nextNum, pairings }],
    })
  }

  function finishSwiss() {
    update({ status: tournament.hasPlayoffs ? 'swiss_complete' : 'completed' })
  }

  function setScore(roundIdx, pairingIdx, score) {
    const rounds = tournament.swissRounds.map((r, ri) =>
      ri !== roundIdx ? r : {
        ...r,
        pairings: r.pairings.map((p, pi) => pi !== pairingIdx ? p : { ...p, score }),
      }
    )
    update({ swissRounds: rounds })
  }

  return (
    <div className="space-y-4">
      {canStart && (
        <button onClick={startRound1} className="btn-primary w-full py-3 text-base">
          ▶ Démarrer le Round 1
        </button>
      )}

      {showTimer && (
        <Timer
          startTime={tournament.roundStartTime}
          roundNumber={currentRound.round}
        />
      )}

      {[...swissRounds].reverse().map((round, revIdx) => {
        const roundIdx = swissRounds.length - 1 - revIdx
        const isCurrent = roundIdx === swissRounds.length - 1
        return (
          <RoundCard
            key={round.round}
            round={round}
            roundIdx={roundIdx}
            isCurrent={isCurrent && !isLocked}
            editable={isCurrent && isAdmin && !isLocked}
            setScore={(pi, score) => setScore(roundIdx, pi, score)}
          />
        )
      })}

      {canNextRound && (
        <button onClick={startNextRound} className="btn-primary w-full py-3 text-base">
          ▶ Générer le Round {swissRounds.length + 1}
        </button>
      )}
      {canFinishSwiss && (
        <button onClick={finishSwiss} className="btn-primary w-full py-3 text-base">
          {tournament.hasPlayoffs ? 'Terminer Swiss → Playoffs' : 'Terminer le tournoi'}
        </button>
      )}
      {['swiss_complete', 'playoffs', 'completed', 'locked'].includes(status) && (
        <div className="text-center text-slate-400 text-sm py-2">
          Phase Swiss terminée ({swissRounds.length} rounds)
        </div>
      )}
    </div>
  )
}

function RoundCard({ round, roundIdx, isCurrent, editable, setScore }) {
  const [open, setOpen] = useState(isCurrent)
  const doneCount = round.pairings.filter(p => p.score).length

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-bold">Round {round.round}</span>
          {isCurrent && <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">Actif</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm">{doneCount}/{round.pairings.length}</span>
          <span className="text-slate-500">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-700 divide-y divide-slate-700">
          {round.pairings.map((pairing, pi) => (
            <PairingRow
              key={pi}
              pairing={pairing}
              editable={editable}
              onScore={score => setScore(pi, score)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PairingRow({ pairing, editable, onScore }) {
  const { player1, player2, score } = pairing
  const [ffMode, setFfMode] = useState(false)

  if (player2 === 'BYE') {
    return (
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">{player1}</span>
          <span className="text-slate-500 text-sm">vs</span>
          <span className="text-slate-500 italic">BYE</span>
        </div>
        <span className="text-green-400 text-sm font-medium">2-0 ✓</span>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center gap-1 text-sm">
        <span className="font-bold flex-1 truncate">{player1}</span>
        <span className="text-slate-500 text-xs">vs</span>
        <span className="font-bold flex-1 truncate text-right">{player2}</span>
      </div>

      {editable && !ffMode && (
        <div className="flex gap-1.5 flex-wrap">
          {SCORES_P1_WIN.map(s => (
            <ScoreBtn key={s} label={s} type="win" active={score === s} onClick={() => onScore(s)} />
          ))}
          {SCORES_P1_LOSS.map(s => (
            <ScoreBtn key={s} label={s} type="loss" active={score === s} onClick={() => onScore(s)} />
          ))}
          {SCORES_DRAW.map(s => (
            <ScoreBtn key={s} label={s} type="draw" active={score === s} onClick={() => onScore(s)} />
          ))}
          <ScoreBtn label="FF" type="ff" active={score?.startsWith('FF')} onClick={() => setFfMode(true)} />
        </div>
      )}

      {editable && ffMode && (
        <div className="space-y-1">
          <p className="text-xs text-slate-400">Qui a forfait ?</p>
          <div className="flex gap-2">
            <button
              onClick={() => { onScore('FF_P1'); setFfMode(false) }}
              className="flex-1 py-1.5 rounded bg-red-900/50 border border-red-700 text-red-300 text-sm font-medium"
            >
              {player1} FF
            </button>
            <button
              onClick={() => { onScore('FF_P2'); setFfMode(false) }}
              className="flex-1 py-1.5 rounded bg-red-900/50 border border-red-700 text-red-300 text-sm font-medium"
            >
              {player2} FF
            </button>
            <button onClick={() => setFfMode(false)} className="px-3 py-1.5 rounded bg-slate-700 text-slate-300 text-sm">
              ✕
            </button>
          </div>
        </div>
      )}

      {score && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className={`font-bold ${SCORES_DRAW.includes(score) ? 'text-orange-400' : SCORES_P1_WIN.includes(score) || score === 'FF_P2' ? 'text-green-400' : 'text-red-400'}`}>
            {player1}
          </span>
          <span className="font-mono">{score.startsWith('FF') ? (score === 'FF_P1' ? '0-2 (FF)' : '2-0 (FF)') : score}</span>
          <span className={`font-bold ${SCORES_DRAW.includes(score) ? 'text-orange-400' : SCORES_P1_LOSS.includes(score) || score === 'FF_P1' ? 'text-green-400' : 'text-red-400'}`}>
            {player2}
          </span>
          {editable && (
            <button onClick={() => onScore(null)} className="ml-auto text-slate-600 hover:text-yellow-400">✎</button>
          )}
        </div>
      )}
    </div>
  )
}

function ScoreBtn({ label, type, active, onClick }) {
  const cls = {
    win:  active ? 'score-btn-active-win'  : 'score-btn-win',
    loss: active ? 'score-btn-active-loss' : 'score-btn-loss',
    draw: active ? 'score-btn-active-draw' : 'score-btn-draw',
    ff:   active ? 'score-btn-active-ff'   : 'score-btn-ff',
  }[type]
  return <button onClick={onClick} className={`score-btn ${cls}`}>{label}</button>
}

// ── Standings Tab ─────────────────────────────────────────────────────────────

function StandingsTab({ standings, status, tournament }) {
  const placements = tournament.playoffs?.result
  const isCompleted = status === 'completed' || status === 'locked'
  const hasDecks = tournament.decks && Object.keys(tournament.decks).length > 0

  // Classement final ordonné par placement playoffs si disponible
  const finalOrder = (() => {
    if (isCompleted && placements?.first) {
      const names = [placements.first, placements.second, placements.third, placements.fourth].filter(Boolean)
      const rest = standings.filter(s => !names.includes(s.name))
      return [...names.map(n => standings.find(s => s.name === n) ?? { name: n, pts: 0, wins: 0, played: 0 }), ...rest]
    }
    return standings
  })()

  return (
    <div className="space-y-3">
      {isCompleted && placements?.first && (
        <div className="card p-4 space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Résultat final</h3>
          {[
            { medal: '🥇', name: placements.first  },
            { medal: '🥈', name: placements.second },
            { medal: '🥉', name: placements.third  },
            { medal: '4️⃣', name: placements.fourth },
          ].filter(p => p.name).map(p => (
            <div key={p.name} className="flex items-center gap-3">
              <span className="text-2xl">{p.medal}</span>
              <span className="font-bold">{p.name}</span>
              {hasDecks && tournament.decks[p.name] && (
                <span className="text-slate-400 text-sm ml-auto">{tournament.decks[p.name]}</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 text-xs">
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Joueur</th>
              {hasDecks && <th className="px-3 py-2 text-left">Deck</th>}
              <th className="px-3 py-2 text-right">Pts</th>
              <th className="px-3 py-2 text-right">Wins</th>
              <th className="px-3 py-2 text-right">J</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {finalOrder.map((s, i) => (
              <tr key={s.name} className={i < 4 && tournament.hasPlayoffs && !isCompleted ? 'bg-purple-900/10' : ''}>
                <td className="px-3 py-2.5 text-slate-400 font-mono">{i + 1}</td>
                <td className="px-3 py-2.5 font-medium">{s.name}</td>
                {hasDecks && (
                  <td className="px-3 py-2.5 text-slate-400 text-xs">{tournament.decks[s.name] || '—'}</td>
                )}
                <td className="px-3 py-2.5 text-right font-black text-yellow-400">{s.pts}</td>
                <td className="px-3 py-2.5 text-right text-green-400">{s.wins}</td>
                <td className="px-3 py-2.5 text-right text-slate-400">{s.played}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {tournament.hasPlayoffs && standings.length >= 4 && !isCompleted && (
          <div className="px-3 py-2 text-xs text-purple-400 bg-purple-900/10 border-t border-slate-700">
            Top 4 qualifiés pour les playoffs
          </div>
        )}
      </div>

      {/* Points de saison attribués */}
      {tournament.seasonPoints?.length > 0 && (
        <div className="card p-3 text-xs space-y-1">
          <p className="text-slate-400 font-bold mb-1">Points de saison attribués</p>
          {tournament.seasonPoints.filter(sp => sp.pts > 0).map(sp => (
            <div key={sp.name} className="flex justify-between">
              <span className="text-slate-300">{sp.name}</span>
              <span className="text-yellow-400 font-bold">+{sp.pts} pts saison</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Playoffs Tab ──────────────────────────────────────────────────────────────

function PlayoffsTab({ tournament, standings, update, isAdmin, isLocked }) {
  function initBracket() {
    const playoffs = initPlayoffs(standings)
    update({ status: 'playoffs', playoffs })
  }

  function setPlayoffScore(matchKey, score) {
    const playoffs = { ...tournament.playoffs }
    playoffs[matchKey] = { ...playoffs[matchKey], score }

    if (matchKey === 'semi1' || matchKey === 'semi2') {
      const s1 = playoffs.semi1.score
      const s2 = playoffs.semi2.score
      if (s1 && s2) {
        const w1 = resolvePlayoffWinner(playoffs.semi1)
        const w2 = resolvePlayoffWinner(playoffs.semi2)
        const l1 = resolvePlayoffLoser(playoffs.semi1)
        const l2 = resolvePlayoffLoser(playoffs.semi2)
        playoffs.final = { player1: w1, player2: w2, score: playoffs.final?.score || null }
        playoffs.third = { player1: l1, player2: l2, score: playoffs.third?.score || null }
      }
    }

    if (playoffs.final?.score && playoffs.third?.score) {
      playoffs.result = {
        first:  resolvePlayoffWinner(playoffs.final),
        second: resolvePlayoffLoser(playoffs.final),
        third:  resolvePlayoffWinner(playoffs.third),
        fourth: resolvePlayoffLoser(playoffs.third),
      }
      update({ status: 'completed', playoffs })
    } else {
      update({ playoffs })
    }
  }

  const { status, playoffs } = tournament
  const canEdit = isAdmin && !isLocked

  if (status === 'swiss_complete') {
    return (
      <div className="space-y-4">
        <div className="card p-4 space-y-3">
          <h3 className="font-bold text-lg">Phase finale — Top 4</h3>
          <div className="space-y-1">
            {standings.slice(0, 4).map((s, i) => (
              <div key={s.name} className="flex items-center gap-2 text-sm">
                <span className="text-slate-400 w-4">{i + 1}.</span>
                <span className="font-medium">{s.name}</span>
                <span className="text-slate-500 text-xs ml-auto">{s.pts} pts · {s.wins} wins</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400">Demi-finales : 1er vs 4ème · 2ème vs 3ème</p>
        </div>
        {canEdit && (
          <button onClick={initBracket} className="btn-primary w-full py-3">
            Démarrer les playoffs
          </button>
        )}
      </div>
    )
  }

  if (!playoffs) return null

  const semisOk = playoffs.semi1.score && playoffs.semi2.score

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Demi-finales</h3>
        <PlayoffMatch match={playoffs.semi1} editable={canEdit && !playoffs.semi1.score} onScore={s => setPlayoffScore('semi1', s)} />
        <PlayoffMatch match={playoffs.semi2} editable={canEdit && !playoffs.semi2.score} onScore={s => setPlayoffScore('semi2', s)} />
      </div>

      {semisOk && (
        <>
          <div className="card p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Petite finale (3e place)</h3>
            <PlayoffMatch match={playoffs.third} editable={canEdit && playoffs.third.player1 && !playoffs.third.score} onScore={s => setPlayoffScore('third', s)} />
          </div>
          <div className="card p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Finale</h3>
            <PlayoffMatch match={playoffs.final} editable={canEdit && playoffs.final.player1 && !playoffs.final.score} onScore={s => setPlayoffScore('final', s)} />
          </div>
        </>
      )}

      {playoffs.result?.first && (
        <div className="card p-4 space-y-2">
          <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Résultats finaux</h3>
          {[
            { medal: '🥇', name: playoffs.result.first  },
            { medal: '🥈', name: playoffs.result.second },
            { medal: '🥉', name: playoffs.result.third  },
            { medal: '4️⃣', name: playoffs.result.fourth },
          ].map(({ medal, name }) => name && (
            <div key={name} className="flex items-center gap-3">
              <span className="text-2xl">{medal}</span>
              <span className="font-bold text-lg">{name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PlayoffMatch({ match, editable, onScore }) {
  if (!match?.player1) return <div className="text-slate-500 text-sm italic">En attente des demi-finales...</div>
  const { player1, player2, score } = match
  const isWin = s => ['2-0', '2-1', 'FF_P2'].includes(s)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <span className={`font-bold flex-1 ${score ? (isWin(score) ? 'text-green-400' : 'text-red-400') : ''}`}>{player1}</span>
        <span className="text-slate-500 text-xs">vs</span>
        <span className={`font-bold flex-1 text-right ${score ? (!isWin(score) ? 'text-green-400' : 'text-red-400') : ''}`}>{player2}</span>
      </div>
      {editable && (
        <div className="flex gap-1.5 flex-wrap">
          {['2-0', '2-1', '1-2', '0-2'].map(s => (
            <button key={s} onClick={() => onScore(s)}
              className={`score-btn ${score === s ? (isWin(s) ? 'score-btn-active-win' : 'score-btn-active-loss') : (isWin(s) ? 'score-btn-win' : 'score-btn-loss')}`}>
              {s}
            </button>
          ))}
        </div>
      )}
      {score && (
        <div className="text-xs text-slate-400">
          Vainqueur : <span className="font-bold text-green-400">{isWin(score) ? player1 : player2}</span>
          {editable && <button onClick={() => onScore(null)} className="ml-2 text-slate-600 hover:text-yellow-400">✎</button>}
        </div>
      )}
    </div>
  )
}

// ── Closure Modal ─────────────────────────────────────────────────────────────

function ClosureModal({ tournament, standings, onClose, onConfirm }) {
  const hasPR = tournament.hasPlayoffs && tournament.playoffs?.result?.first
  const pr = tournament.playoffs?.result

  const finalRanking = hasPR
    ? [pr.first, pr.second, pr.third, pr.fourth]
        .filter(Boolean)
        .concat(standings.filter(s => ![pr.first, pr.second, pr.third, pr.fourth].includes(s.name)).map(s => s.name))
    : standings.map(s => s.name)

  const MEDALS = ['🥇', '🥈', '🥉']

  const [decks, setDecks] = useState({})

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="card w-full max-w-sm space-y-5 p-5 max-h-[92vh] overflow-y-auto">
        <div>
          <h2 className="font-black text-lg text-yellow-400">🏁 Clôturer le tournoi</h2>
          <p className="text-slate-400 text-xs mt-1">Cette action est définitive et verrouille le tournoi.</p>
        </div>

        {/* Classement final + points saison */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Classement final & points saison</p>
          <div className="space-y-1.5">
            {finalRanking.map((name, i) => {
              const pts = standings.find(s => s.name === name)?.pts ?? 0
              return (
                <div key={name} className="flex items-center gap-2">
                  <span className="text-lg w-8 flex-shrink-0">{MEDALS[i] ?? `${i + 1}.`}</span>
                  <span className="font-bold flex-1 text-sm">{name}</span>
                  <span className={`text-xs font-bold ${pts > 0 ? 'text-yellow-400' : 'text-slate-500'}`}>
                    +{pts} pts saison
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Saisie des decks */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Decks joués</p>
          <div className="space-y-2">
            {finalRanking.map(name => (
              <div key={name} className="flex items-center gap-2">
                <span className="text-sm font-medium w-20 truncate flex-shrink-0">{name}</span>
                <input
                  type="text"
                  value={decks[name] || ''}
                  onChange={e => setDecks(d => ({ ...d, [name]: e.target.value }))}
                  placeholder="Nom du deck…"
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button
            onClick={() => onConfirm(decks, finalRanking)}
            className="flex-1 py-2 rounded-lg font-bold text-sm bg-yellow-500 hover:bg-yellow-400 text-slate-900 transition-colors"
          >
            Confirmer la clôture
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    pending:        ['En attente', 'bg-slate-700 text-slate-300'],
    active:         ['En cours',   'bg-blue-900 text-blue-300'],
    swiss_complete: ['Swiss ✓',    'bg-yellow-900 text-yellow-300'],
    playoffs:       ['Playoffs',   'bg-purple-900 text-purple-300'],
    completed:      ['Terminé',    'bg-green-900 text-green-300'],
    locked:         ['🔒 Clôturé', 'bg-slate-600 text-slate-200'],
  }
  const [text, cls] = map[status] || map.pending
  return <span className={`text-xs px-2 py-1 rounded-full font-medium ${cls}`}>{text}</span>
}
