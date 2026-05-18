import { supabase } from './supabase'

// ── Mappers DB (snake_case) ↔ App (camelCase) ──────────────────────────────

function dbToTournament(row) {
  return {
    id:           row.id,
    date:         row.date,
    organizer:    row.organizer,
    numRounds:    row.num_rounds,
    hasPlayoffs:  row.has_playoffs,
    status:       row.status,
    currentRound: row.current_round,
    players:      row.players      ?? [],
    swissRounds:  row.swiss_rounds ?? [],
    playoffs:     row.playoffs     ?? null,
    decks:        row.decks        ?? {},
    seasonPoints: row.season_points ?? [],
  }
}

function tournamentToDb(t) {
  return {
    id:            t.id,
    date:          t.date,
    organizer:     t.organizer,
    num_rounds:    t.numRounds,
    has_playoffs:  t.hasPlayoffs,
    status:        t.status,
    current_round: t.currentRound ?? 0,
    players:       t.players      ?? [],
    swiss_rounds:  t.swissRounds  ?? [],
    playoffs:      t.playoffs     ?? null,
    decks:         t.decks        ?? {},
    season_points: t.seasonPoints ?? [],
  }
}

// ── Tournaments ────────────────────────────────────────────────────────────

export async function getTournaments() {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(dbToTournament)
}

export async function getTournament(id) {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return dbToTournament(data)
}

export async function saveTournament(tournament) {
  const { error } = await supabase
    .from('tournaments')
    .upsert(tournamentToDb(tournament))
  if (error) throw error
}

export async function deleteTournament(id) {
  const { error } = await supabase
    .from('tournaments')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── Trainings ──────────────────────────────────────────────────────────────

export async function getTrainings() {
  const { data, error } = await supabase
    .from('trainings')
    .select('*')
    .order('date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function saveTraining(training) {
  const { error } = await supabase
    .from('trainings')
    .upsert({ id: training.id, date: training.date, present: training.present, note: training.note ?? '' })
  if (error) throw error
}

export async function deleteTraining(id) {
  const { error } = await supabase
    .from('trainings')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── External Tournaments ───────────────────────────────────────────────────

export async function getExternalTournaments() {
  const { data, error } = await supabase
    .from('external_tournaments')
    .select('*')
    .order('date', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function saveExternalTournament(t) {
  const { error } = await supabase
    .from('external_tournaments')
    .upsert({
      id:       t.id,
      name:     t.name,
      date:     t.date,
      location: t.location ?? '',
      members:  t.members  ?? [],
      decks:    t.decks    ?? {},
      results:  t.results  ?? '',
    })
  if (error) throw error
}

export async function deleteExternalTournament(id) {
  const { error } = await supabase
    .from('external_tournaments')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── History ────────────────────────────────────────────────────────────────

export async function getHistory() {
  const { data, error } = await supabase
    .from('history')
    .select('*')
    .order('year', { ascending: true })
  if (error) throw error
  // Transform array → { year: data } object
  const result = {}
  for (const row of data ?? []) {
    result[row.year] = { champion: row.champion, ranking: row.ranking, note: row.note }
  }
  return result
}

export async function saveHistory(historyObj) {
  // historyObj = { 2023: { champion, ranking, note }, ... }
  const rows = Object.entries(historyObj).map(([year, d]) => ({
    year:     parseInt(year),
    champion: d.champion ?? '',
    ranking:  d.ranking  ?? [],
    note:     d.note     ?? '',
  }))
  const { error } = await supabase
    .from('history')
    .upsert(rows)
  if (error) throw error
}

export async function saveHistoryYear(year, data) {
  const { error } = await supabase
    .from('history')
    .upsert({ year: parseInt(year), champion: data.champion ?? '', ranking: data.ranking ?? [], note: data.note ?? '' })
  if (error) throw error
}

// ── Seeding ────────────────────────────────────────────────────────────────

export async function isSeeded() {
  const { count } = await supabase
    .from('tournaments')
    .select('id', { count: 'exact', head: true })
  return (count ?? 0) > 0
}

// ── ID generator ──────────────────────────────────────────────────────────

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}
