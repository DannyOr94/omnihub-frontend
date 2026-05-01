import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  withCredentials: true, // enviar cookies httpOnly en cada request
})

// ─── Interceptor de respuesta ────────────────────────────────────────────────
// Si el servidor devuelve 401, intenta renovar el token una vez.
// Si el refresh también falla, redirige al login.

let renovando = false
let cola = []

function procesarCola(error) {
  cola.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve()
  })
  cola = []
}

api.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config

    // Solo reintentar si:
    // 1. Es un 401
    // 2. No es ya un reintento
    // 3. NO es una ruta de autenticación (evita loop en /me y /refresh)
    const esRutaAuth = original.url?.includes('/auth/')
    if (error.response?.status === 401 && !original._reintento && !esRutaAuth) {
      if (renovando) {
        // Encolar requests mientras se renueva
        return new Promise((resolve, reject) => {
          cola.push({ resolve, reject })
        }).then(() => api(original)).catch(e => Promise.reject(e))
      }

      original._reintento = true
      renovando = true

      try {
        await api.post('/auth/refresh')
        procesarCola(null)
        return api(original)
      } catch (err) {
        procesarCola(err)
        // Limpiar estado de auth y redirigir al login
        window.dispatchEvent(new CustomEvent('auth:logout'))
        return Promise.reject(err)
      } finally {
        renovando = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
