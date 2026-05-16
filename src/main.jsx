import { StrictMode } from 'react'
import { createRoot }  from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'

// Registrar Plugins de GSAP
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)

// Registro de Service Worker (PWA)
import { registerSW } from 'virtual:pwa-register'
registerSW({ immediate: true })

// Configuración de React Query (Manejo de Caché y Estados de Carga)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // No recargar al cambiar de pestaña
      retry: 1,                    // Reintentar solo 1 vez en caso de error
      staleTime: 1000 * 60 * 5,    // La información en caché es fresca por 5 minutos
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)
