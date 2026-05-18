import { useState, useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NewTournament from './pages/NewTournament'
import TournamentView from './pages/TournamentView'
import SeasonRanking from './pages/SeasonRanking'
import Trainings from './pages/Trainings'
import History from './pages/History'
import ExternalTournaments from './pages/ExternalTournaments'
import { getTournament, saveTournament, saveHistory } from './utils/storage'
import { SEED_TOURNAMENT, SEED_HISTORY } from './data/seed'

function AppInner() {
  const [page, setPage] = useState('dashboard')
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    if (!localStorage.getItem('yuram_seeded')) {
      if (!getTournament(SEED_TOURNAMENT.id)) {
        saveTournament(SEED_TOURNAMENT)
      }
      saveHistory(SEED_HISTORY)
      localStorage.setItem('yuram_seeded', '1')
    }
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
      <AppInner />
    </AuthProvider>
  )
}
