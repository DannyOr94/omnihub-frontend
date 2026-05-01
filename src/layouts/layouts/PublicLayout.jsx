import { Outlet, NavLink, Link } from 'react-router-dom'
import { Store, Search, FileText } from 'lucide-react'

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-slate-800">
            <Store className="text-blue-600" size={20} />
            <span>OmniHub T&K</span>
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink
              to="/catalogo"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              <Search size={14} /> Catálogo
            </NavLink>
            <NavLink
              to="/mis-boletas"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              <FileText size={14} /> Mis reparaciones
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      <footer className="bg-white border-t py-4 text-center text-xs text-slate-400">
        OmniHub T&K — Tienda Doña Tere · K.M.A. Conexiones
      </footer>
    </div>
  )
}
