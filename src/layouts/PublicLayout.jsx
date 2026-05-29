import { useState } from 'react'
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import {
  Store, Search, FileText, Menu, X,
  Shirt, Cpu, LogIn, ChevronRight,
} from 'lucide-react'

export default function PublicLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const navigate = useNavigate()

  const navLinks = [
    { to: '/',            label: 'Inicio',          end: true },
    { to: '/catalogo',    label: 'Catálogo'          },
    { to: '/mis-boletas', label: 'Mis reparaciones'  },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 font-bold text-slate-800 shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Store size={16} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-slate-800 font-bold text-sm">OmniHub</span>
                <span className="text-blue-600 font-bold text-sm"> T&K</span>
              </div>
            </Link>

            {/* Nav escritorio */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Derecha: acceso empleados + hamburguesa */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/login')}
                className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg px-3 py-1.5 transition-colors"
              >
                <LogIn size={13} />
                Acceso empleados
              </button>

              {/* Hamburguesa móvil */}
              <button
                onClick={() => setMenuAbierto(v => !v)}
                className="md:hidden p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                {menuAbierto ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Menú móvil */}
        {menuAbierto && (
          <div className="md:hidden border-t bg-white px-4 py-3 space-y-1">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setMenuAbierto(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <button
              onClick={() => { setMenuAbierto(false); navigate('/login') }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 border-t mt-2 pt-3"
            >
              <LogIn size={14} /> Acceso empleados
            </button>
          </div>
        )}
      </header>

      {/* ── Contenido ──────────────────────────────────────────────────────── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">

            {/* Marca */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Store size={14} className="text-white" />
                </div>
                <span className="font-bold text-white">OmniHub T&K</span>
              </div>
              <p className="text-xs leading-relaxed">
                Tienda Doña Tere y K.M.A. Conexiones.<br/>
                Ropa para toda la familia y tecnología en un solo lugar.
              </p>
            </div>

            {/* Links */}
            <div>
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-3">Navegación</p>
              <ul className="space-y-2 text-xs">
                {navLinks.map(l => (
                  <li key={l.to}>
                    <Link to={l.to} className="hover:text-white transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contacto */}
            <div>
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-3">Contacto</p>
              <p className="text-xs leading-relaxed">
                Visítanos en nuestra tienda física.<br/>
                ¿Tienes dudas? Escríbenos directamente.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <p>© {new Date().getFullYear()} OmniHub T&K — Todos los derechos reservados</p>
            <button
              onClick={() => navigate('/login')}
              className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
            >
              <LogIn size={11} /> Acceso empleados
            </button>
          </div>
        </div>
      </footer>

    </div>
  )
}
