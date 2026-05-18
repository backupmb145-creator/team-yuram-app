export function getMatchPoints(score) {
  const map = {
    '2-0':   { p1pts: 3, p1wins: 2, p2pts: 0, p2wins: 0 },
    '2-1':   { p1pts: 3, p1wins: 2, p2pts: 0, p2wins: 1 },
    '1-2':   { p1pts: 0, p1wins: 1, p2pts: 3, p2wins: 2 },
    '0-2':   { p1pts: 0, p1wins: 0, p2pts: 3, p2wins: 2 },
    '0-0':   { p1pts: 0, p1wins: 0, p2pts: 0, p2wins: 0 },
    'FF_P1': { p1pts: 0, p1wins: 0, p2pts: 3, p2wins: 2 },
    'FF_P2': { p1pts: 3, p1wins: 2, p2pts: 0, p2wins: 0 },
  }
  return map[score] || { p1pts: 0, p1wins: 0, p2pts: 0, p2wins: 0 }
}

export function computeStandings(players, allPairings) {
  const standings = {}
  for (const name of players) {
    standings[name] = { name, pts: 0, wins: 0, played: 0 }
  }

  for (const pairing of allPairings) {
    if (!pairing.score) continue
    const { player1, player2, score } = pairing

    if (player2 === 'BYE') {
      if (standings[player1]) {
        standings[player1].pts += 3
        standings[player1].wins += 2
        standings[player1].played += 1
      }
      continue
    }

    if (!standings[player1] || !standings[player2]) continue

    const s = getMatchPoints(score)
    standings[player1].pts += s.p1pts
    standings[player1].wins += s.p1wins
    standings[player1].played += 1

    standings[player2].pts += s.p2pts
    standings[player2].wins += s.p2wins
    standings[player2].played += 1
  }

  return Object.values(standings).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    return b.wins - a.wins
  })
}

// Classement de saison :
// - Tournoi clôturé (locked) → points de saison explicites (1er=3, 2e=2, 3e=1, reste=0)
// - Tournoi terminé non clôturé → cumul des points de match (rétrocompatibilité)
export function computeSeasonRanking(tournaments) {
  const totals = {}

  for (const t of tournaments) {
    if (t.status !== 'completed' && t.status !== 'locked') continue

    if (t.seasonPoints?.length) {
      for (const { name, pts } of t.seasonPoints) {
        if (!totals[name]) totals[name] = { name, pts: 0, wins: 0, tournamentsPlayed: 0 }
        totals[name].pts += pts
        totals[name].tournamentsPlayed += 1
      }
    } else {
      const allPairings = t.swissRounds.flatMap(r => r.pairings)
      const standings = computeStandings(t.players, allPairings)
      standings.forEach(s => {
        if (!totals[s.name]) totals[s.name] = { name: s.name, pts: 0, wins: 0, tournamentsPlayed: 0 }
        totals[s.name].pts += s.pts
        totals[s.name].wins += s.wins
        totals[s.name].tournamentsPlayed += 1
      })
    }
  }

  return Object.values(totals).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    return b.wins - a.wins
  })
}

export function getTournamentPlacements(tournament) {
  const allPairings = tournament.swissRounds.flatMap(r => r.pairings)
  const swissStandings = computeStandings(tournament.players, allPairings)

  if (tournament.hasPlayoffs && tournament.playoffs?.result?.first) {
    const { first, second, third, fourth } = tournament.playoffs.result
    return [
      { name: first,  rank: 1 },
      { name: second, rank: 2 },
      { name: third,  rank: 3 },
      { name: fourth, rank: 4 },
    ].filter(p => p.name)
  }

  return swissStandings.slice(0, 3).map((p, i) => ({ name: p.name, rank: i + 1 }))
}
