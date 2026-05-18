import { useState, useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NewTournament from './pages/NewTournament'
import TournamentView from './pages/TournamentView'
import SeasonRanking from './pages/SeasonRanking'
import Trainings from './pages/Trainings'
import History from './pages/History'
import ExternalTournaments from './pages/ExternalTournaments'
import { isSeeded, saveTournament, saveHistory } from './lib/db'
import { SEED_TOURNAMENT, SEED_HISTORY } from './data/seed'

function AppInner() {
  const [page, setPage] = useState('dashboard')
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    isSeeded().then(seeded => {
      if (!seeded) {
        saveTournament(SEED_TOURNAMENT).catch(() => {})
        saveHistory(SEED_HISTORY).catch(() => {})
      }
    }).catch(() => {})
  }, [])

  function navigate(to, params = {}) {
    setPage(to)
    if (params.id) setSelectedId(params.id)
  }

  return (
    <Layout page={page} navigate={navigate}>
      {page === 'dashboard'  && <Dashboard navigate={navigate} />}
      {page === 'new'        && <NewTournament navigate={navigate} />}
      {page === 'tournament' && <TournamentView id={selectedId} navigate={navigate} />}
      {page === 'ranking'    && <SeasonRanking />}
      {page === 'trainings'  && <Trainings />}
      {page === 'history'    && <History />}
      {page === 'external'   && <ExternalTournaments />}
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </AuthProvider>
  )
}
