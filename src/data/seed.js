// Données importées depuis Team Yurâm 2026.xlsm
// Tournoi du 08/02/2026 + historique des saisons passées

export const SEED_TOURNAMENT = {
  id: 'seed_20260208',
  date: '2026-02-08',
  organizer: 'Team Yurâm',
  players: ['Genti', 'Kévin', 'Terry', 'Thibaut', 'Marc', 'Mathieu', 'Jeff'],
  numRounds: 5,
  hasPlayoffs: false,
  status: 'completed',
  currentRound: 5,
  swissRounds: [
    {
      round: 1,
      pairings: [
        { player1: 'Mathieu', player2: 'Terry',   score: '0-2' },
        { player1: 'Thibaut', player2: 'BYE',     score: '2-0' },
        { player1: 'Kévin',   player2: 'Genti',   score: '0-2' },
        { player1: 'Jeff',    player2: 'Marc',     score: '1-2' },
      ],
    },
    {
      round: 2,
      pairings: [
        { player1: 'Marc',    player2: 'Terry',    score: '2-1' },
        { player1: 'Kévin',   player2: 'Thibaut',  score: '2-0' },
        { player1: 'Jeff',    player2: 'Mathieu',  score: '1-2' },
        { player1: 'Genti',   player2: 'BYE',      score: '2-0' },
      ],
    },
    {
      round: 3,
      pairings: [
        { player1: 'Marc',    player2: 'BYE',      score: '2-0' },
        { player1: 'Genti',   player2: 'Thibaut',  score: '2-1' },
        { player1: 'Mathieu', player2: 'Kévin',    score: '0-2' },
        { player1: 'Jeff',    player2: 'Terry',    score: '0-2' },
      ],
    },
    {
      round: 4,
      pairings: [
        { player1: 'Terry',   player2: 'BYE',      score: '2-0' },
        { player1: 'Thibaut', player2: 'Jeff',     score: '2-0' },
        { player1: 'Kévin',   player2: 'Marc',     score: '2-0' },
        { player1: 'Genti',   player2: 'Mathieu',  score: '2-0' },
      ],
    },
    {
      round: 5,
      pairings: [
        { player1: 'Marc',    player2: 'Mathieu',  score: '0-2' },
        { player1: 'Thibaut', player2: 'Terry',    score: '2-1' },
        { player1: 'Kévin',   player2: 'BYE',      score: '2-0' },
        { player1: 'Genti',   player2: 'Jeff',     score: '2-0' },
      ],
    },
  ],
  // Classement final Swiss : 1.Genti(15pts) 2.Kévin(12pts) 3.Terry(9pts,8w,4d) 4.Thibaut(9pts,7w,2d)
  playoffs: null,
}

export const SEED_HISTORY = {
  2023: {
    champion: 'Kévin',
    note: '',
    ranking: [
      { name: 'Kévin',   pts: 42 },
      { name: 'Marc',    pts: 39 },
      { name: 'Steve',   pts: 39 },
      { name: 'Genti',   pts: 37 },
      { name: 'Thibaut', pts: 0  },
      { name: 'Noah',    pts: 0  },
      { name: 'Terry',   pts: 0  },
      { name: 'Jeff',    pts: 0  },
      { name: 'Mathieu', pts: 0  },
    ],
  },
  2024: {
    champion: 'Genti',
    note: '',
    ranking: [
      { name: 'Genti',   pts: 53 },
      { name: 'Thibaut', pts: 51 },
      { name: 'Kévin',   pts: 48 },
      { name: 'Marc',    pts: 42 },
      { name: 'Noah',    pts: 0  },
      { name: 'Terry',   pts: 0  },
      { name: 'Jeff',    pts: 0  },
      { name: 'Mathieu', pts: 0  },
    ],
  },
  2025: {
    champion: 'Genti',
    note: '',
    ranking: [
      { name: 'Genti',   pts: 55 },
      { name: 'Kévin',   pts: 41 },
      { name: 'Marc',    pts: 33 },
      { name: 'Noah',    pts: 33 },
      { name: 'Thibaut', pts: 0  },
      { name: 'Terry',   pts: 0  },
      { name: 'Jeff',    pts: 0  },
      { name: 'Mathieu', pts: 0  },
    ],
  },
}
