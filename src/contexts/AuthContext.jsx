import { createContext, useContext, useState } from 'react'

const AuthContext = createContext({ isAdmin: false, login: () => false, logout: () => {}, changePin: () => {} })

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('yuram_admin') === '1')

  function login(pin) {
    const stored = localStorage.getItem('yuram_admin_pin') || '1234'
    if (pin === stored) {
      sessionStorage.setItem('yuram_admin', '1')
      setIsAdmin(true)
      return true
    }
    return false
  }

  function logout() {
    sessionStorage.removeItem('yuram_admin')
    setIsAdmin(false)
  }

  function changePin(newPin) {
    localStorage.setItem('yuram_admin_pin', newPin)
  }

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout, changePin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
