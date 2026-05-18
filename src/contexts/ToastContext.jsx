import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'error') => {
    const id = Date.now()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }, [])

  const toast = useCallback((msg) => addToast(msg, 'error'), [addToast])
  toast.info = useCallback((msg) => addToast(msg, 'info'), [addToast])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div style={{
        position: 'fixed', bottom: '90px', left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '640px', padding: '0 16px',
        display: 'flex', flexDirection: 'column', gap: '8px',
        zIndex: 9000, pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '10px 16px',
            borderRadius: '10px',
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            animation: 'cardReveal 0.25s ease both',
            background: t.type === 'error'
              ? 'rgba(192,57,43,0.92)'
              : 'rgba(30,40,60,0.95)',
            border: t.type === 'error'
              ? '1px solid rgba(248,113,113,0.5)'
              : '1px solid rgba(240,192,64,0.3)',
            color: t.type === 'error' ? '#fca5a5' : 'var(--text-primary)',
            backdropFilter: 'blur(12px)',
            pointerEvents: 'auto',
          }}>
            {t.type === 'error' ? '⚠️ ' : 'ℹ️ '}{t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
