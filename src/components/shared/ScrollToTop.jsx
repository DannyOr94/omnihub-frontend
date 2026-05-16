import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Componente que maneja el scroll al tope y el refresco de ScrollTrigger
 * al cambiar de ruta en la aplicación.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()
  const { cargando } = useAuth()

  useEffect(() => {
    // 1. Desplazar al inicio de la página inmediatamente
    window.scrollTo(0, 0)

    // 2. Forzar refresco de GSAP ScrollTrigger
    // Lo hacemos en dos pasos: inmediato y tras un breve delay por si hay renderizados pendientes
    ScrollTrigger.refresh()

    const timer = setTimeout(() => {
      ScrollTrigger.refresh()
    }, 200) // Un poco más de delay para asegurar que el contenido auth se asentó

    return () => clearTimeout(timer)
  }, [pathname, cargando])

  return null
}
