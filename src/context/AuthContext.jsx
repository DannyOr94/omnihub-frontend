import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authApi } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario]   = useState(null)
  const [cargando, setCargando] = useState(true) // true mientras verifica sesión inicial

  // ─── Verificar sesión al montar ───────────────────────────────────────────
  useEffect(() => {
    const isLogged = localStorage.getItem('omnihub_logged_in') === 'true'
    if (!isLogged) {
      setUsuario(null)
      setCargando(false)
      return
    }

    authApi.me()
      .then(res => setUsuario(res.data.data))
      .catch(() => {
        setUsuario(null)
        localStorage.removeItem('omnihub_logged_in')
      })
      .finally(() => setCargando(false))
  }, [])

  // ─── Escuchar evento global de logout forzado (desde interceptor axios) ──
  // Solo activo después del arranque inicial para no interferir con /me
  useEffect(() => {
    const handler = () => {
      setUsuario(null)
      setCargando(false) // garantizar que nunca quede cargando
      localStorage.removeItem('omnihub_logged_in')
    }
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  // ─── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (correo, password) => {
    const res = await authApi.login(correo, password)
    setUsuario(res.data.data)
    localStorage.setItem('omnihub_logged_in', 'true')
    return res.data.data
  }, [])

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await authApi.logout() } catch { /* ignorar errores de red al cerrar */ }
    setUsuario(null)
    localStorage.removeItem('omnihub_logged_in')
  }, [])

  // ─── Helpers de rol ───────────────────────────────────────────────────────
  const esAdmin   = usuario?.rol === 'ADMINISTRADOR'
  const esVendedor = usuario?.rol === 'VENDEDOR'
  const esTecnico  = usuario?.rol === 'TECNICO'

  return (
    <AuthContext.Provider value={{
      usuario,
      cargando,
      login,
      logout,
      esAdmin,
      esVendedor,
      esTecnico,
      autenticado: !!usuario,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook de consumo
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
