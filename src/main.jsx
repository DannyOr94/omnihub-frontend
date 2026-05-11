import { StrictMode } from 'react'
import { createRoot }  from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Registrar Plugins de GSAP
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
