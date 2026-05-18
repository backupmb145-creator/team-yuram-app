import { useState, useEffect, useRef } from 'react'

const TOTAL = 50 * 60

export default function Timer({ startTime, roundNumber }) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!startTime) return TOTAL
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    return Math.max(0, TOTAL - elapsed)
  })
  const [running, setRunning] = useState(true)
  const intervalRef = useRef(null)
  // Temps restant au moment de la pause (pour reprendre correctement)
  const pausedAtRef = useRef(null)

  // Démarre le décompte
  function startTick(fromSeconds) {
    clearInterval(intervalRef.current)
    const deadline = Date.now() + fromSeconds * 1000
    intervalRef.current = setInterval(() => {
      const left = Math.max(0, Math.floor((deadline - Date.now()) / 1000))
      setSecondsLeft(left)
      if (left === 0) {
        clearInterval(intervalRef.current)
        setRunning(false)
      }
    }, 500)
  }

  // Init au montage
  useEffect(() => {
    if (!startTime) return
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    const left = Math.max(0, TOTAL - elapsed)
    setSecondsLeft(left)
    setRunning(left > 0)
    if (left > 0) startTick(left)
    return () => clearInterval(intervalRef.current)
  }, [startTime])

  function handlePause() {
    clearInterval(intervalRef.current)
    pausedAtRef.current = secondsLeft
    setRunning(false)
  }

  function handlePlay() {
    if (secondsLeft === 0) return
    setRunning(true)
    startTick(secondsLeft)
  }

  function handleReset() {
    clearInterval(intervalRef.current)
    setSecondsLeft(TOTAL)
    setRunning(false)
    pausedAtRef.current = null
  }

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const pct = (secondsLeft / TOTAL) * 100
  const isWarning = secondsLeft <= 10 * 60
  const isDanger  = secondsLeft <= 5 * 60
  const isExpired = secondsLeft === 0

  const timeColor = isDanger ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-white'
  const barColor  = isDanger ? 'bg-red-500'   : isWarning ? 'bg-yellow-500'   : 'bg-green-500'

  return (
    <div className={`card p-5 text-center space-y-4 ${isExpired ? 'border-red-500' : isDanger ? 'border-red-800' : ''}`}>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
        ⏱ Round {roundNumber} — Temps restant
      </p>

      {/* Affichage temps */}
      <div className={`font-black tabular-nums leading-none text-7xl tracking-tight ${timeColor}`}>
        {String(minutes).padStart(2, '0')}
        <span className={running && !isExpired ? 'animate-pulse' : ''}> : </span>
        {String(seconds).padStart(2, '0')}
      </div>

      {/* Barre de progression */}
      <div className="bg-slate-700 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full ${running ? 'transition-all duration-500' : ''} ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Boutons */}
      <div className="flex gap-3 justify-center">
        {/* Pause */}
        <button
          onClick={handlePause}
          disabled={!running || isExpired}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors
            bg-yellow-500/20 border-2 border-yellow-500 text-yellow-300
            hover:bg-yellow-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span className="text-lg">⏸</span> Pause
        </button>

        {/* Play */}
        <button
          onClick={handlePlay}
          disabled={running || isExpired}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors
            bg-green-500/20 border-2 border-green-500 text-green-300
            hover:bg-green-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span className="text-lg">▶</span> Reprendre
        </button>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors
            bg-slate-600/50 border-2 border-slate-500 text-slate-300
            hover:bg-slate-600"
        >
          <span className="text-lg">↺</span> Reset
        </button>
      </div>

      {!running && !isExpired && secondsLeft < TOTAL && (
        <p className="text-yellow-400 text-xs font-medium">⏸ En pause</p>
      )}
      {isExpired && (
        <p className="text-red-400 font-bold text-sm animate-pulse">⏰ Temps écoulé !</p>
      )}
    </div>
  )
}
