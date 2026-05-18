const KEYS = {
  TOURNAMENTS: 'yuram_tournaments',
  TRAININGS: 'yuram_trainings',
  HISTORY: 'yuram_history',
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

// Tournaments
export function getTournaments() {
  return load(KEYS.TOURNAMENTS, [])
}

export function getTournament(id) {
  return getTournaments().find(t => t.id === id) ?? null
}

export function saveTournament(tournament) {
  const list = getTournaments()
  const idx = list.findIndex(t => t.id === tournament.id)
  if (idx >= 0) list[idx] = tournament
  else list.push(tournament)
  save(KEYS.TOURNAMENTS, list)
}

export function deleteTournament(id) {
  save(KEYS.TOURNAMENTS, getTournaments().filter(t => t.id !== id))
}

// Trainings
export function getTrainings() {
  return load(KEYS.TRAININGS, [])
}

export function saveTraining(training) {
  const list = getTrainings()
  const idx = list.findIndex(t => t.id === training.id)
  if (idx >= 0) list[idx] = training
  else list.push(training)
  save(KEYS.TRAININGS, list)
}

export function deleteTraining(id) {
  save(KEYS.TRAININGS, getTrainings().filter(t => t.id !== id))
}

// History
export function getHistory(initialData) {
  return load(KEYS.HISTORY, initialData)
}

export function saveHistory(history) {
  save(KEYS.HISTORY, history)
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// External tournaments
export function getExternalTournaments() {
  return load('yuram_external', [])
}

export function saveExternalTournament(t) {
  const list = getExternalTournaments()
  const idx = list.findIndex(e => e.id === t.id)
  if (idx >= 0) list[idx] = t
  else list.push(t)
  save('yuram_external', list)
}

export function deleteExternalTournament(id) {
  save('yuram_external', getExternalTournaments().filter(t => t.id !== id))
}
