import { computeStandings } from './scoring.js'

export function generatePairings(players, allPreviousPairings, byePlayers = []) {
  const completedPairings = allPreviousPairings.filter(p => p.score)
  const standings = computeStandings(players, completedPairings)

  // Build set of already-played matchups
  const played = new Set()
  for (const p of allPreviousPairings) {
    if (p.player2 !== 'BYE' && p.score) {
      played.add([p.player1, p.player2].sort().join('|'))
    }
  }

  const sorted = [...standings]
  const paired = new Set()
  const pairings = []

  for (let i = 0; i < sorted.length; i++) {
    const playerA = sorted[i].name
    if (paired.has(playerA)) continue

    let found = false
    // Find closest opponent they haven't faced
    for (let j = i + 1; j < sorted.length; j++) {
      const playerB = sorted[j].name
      if (paired.has(playerB)) continue
      const key = [playerA, playerB].sort().join('|')
      if (!played.has(key)) {
        pairings.push({ player1: playerA, player2: playerB, score: null })
        paired.add(playerA)
        paired.add(playerB)
        found = true
        break
      }
    }

    // If all opponents faced, pair with nearest available regardless
    if (!found) {
      for (let j = i + 1; j < sorted.length; j++) {
        const playerB = sorted[j].name
        if (!paired.has(playerB)) {
          pairings.push({ player1: playerA, player2: playerB, score: null })
          paired.add(playerA)
          paired.add(playerB)
          break
        }
      }
    }
  }

  // BYE for odd number: give to lowest-ranked player who hasn't had a BYE yet
  const unpairedPlayer = sorted.find(p => !paired.has(p.name))
  if (unpairedPlayer) {
    pairings.push({ player1: unpairedPlayer.name, player2: 'BYE', score: '2-0' })
  }

  return pairings
}

export function initPlayoffs(swissStandings) {
  const top4 = swissStandings.slice(0, 4)
  return {
    semi1: { player1: top4[0]?.name ?? '', player2: top4[3]?.name ?? '', score: null },
    semi2: { player1: top4[1]?.name ?? '', player2: top4[2]?.name ?? '', score: null },
    third: { player1: null, player2: null, score: null },
    final: { player1: null, player2: null, score: null },
    result: { first: null, second: null, third: null, fourth: null },
  }
}

export function resolvePlayoffWinner(match) {
  if (!match.score) return null
  const { player1, player2, score } = match
  const wins = ['2-0', '2-1', 'FF_P2']
  return wins.includes(score) ? player1 : player2
}

export function resolvePlayoffLoser(match) {
  const winner = resolvePlayoffWinner(match)
  if (!winner) return null
  return winner === match.player1 ? match.player2 : match.player1
}
