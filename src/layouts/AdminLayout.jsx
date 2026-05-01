import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, ShoppingCart, Package, Warehouse,
  Users, BookMarked, ClipboardList, Wrench, BarChart3,
  Tag, UserCog, LogOut, Menu, X, DollarSign, Store,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button }  from '../components/ui/button'
import { cn }      from '../utils'

const NAV_ITEMS = [
  // Todos los roles
  { to: '/admin/dashboard',  label: 'Dashboard',      icon: LayoutDashboard, roles: ['ADMINISTRADOR', 'VENDEDOR', 'TECNICO'] },
  { to: '/admin/caja',       label: 'Caja',            icon: DollarSign,      roles: ['ADMINISTRADOR', 'VENDEDOR'] },
  { to: '/admin/pos',        label: 'Punto de Venta',  icon: ShoppingCart,    roles: ['ADMINISTRADOR', 'VENDEDOR'] },
  { to: '/admin/boletas',    label: 'Servicio Técnico',icon: Wrench,          roles: ['ADMINISTRADOR', 'VENDEDOR', 'TECNICO'] },
  { to: '/admin/clientes',   label: 'Clientes',        icon: Users,           roles: ['ADMINISTRADOR', 'VENDEDOR'] },
  { to: '/admin/apartados',  label: 'Apartados',       icon: BookMarked,      roles: ['ADMINISTRADOR', 'VENDEDOR'] },
  { to: '/admin/pedidos',    label: 'Pedidos Especiales', icon: ClipboardList, roles: ['ADMINISTRADOR', 'VENDEDOR'] },
  // Solo admin
  { to: '/admin/productos',  label: 'Productos',       icon: Package,         roles: ['ADMINISTRADOR'] },
  { to: '/admin/inventario', label: 'Inventario',      icon: Warehouse,       roles: ['ADMINISTRADOR'] },
  { to: '/admin/reportes',   label: 'Reportes',        icon: BarChart3,       roles: ['ADMINISTRADOR'] },
  { to: '/admin/promociones',label: 'Promociones',     icon: Tag,             roles: ['ADMINISTRADOR'] },
  { to: '/admin/usuarios',   label: 'Usuarios',        icon: UserCog,         roles: ['ADMINISTRADOR'] },
]

export default function AdminLayout() {
  const { usuario, logout, esAdmin } = useAuth()
  const navigate  = useNavigate()
  const [abierto, setAbierto] = useState(false)

  const itemsVisibles = NAV_ITEMS.filter(item =>
    item.roles.includes(usuario?.rol)
  )

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const Sidebar = ({ mobile = false }) => (
    <aside className={cn(
      'flex flex-col h-full bg-slate-900 text-slate-100',
      mobile ? 'w-full' : 'w-64 min-h-screen'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-700">
        <Store className="text-blue-400" size={22} />
        <div>
          <p className="text-sm font-bold leading-none">OmniHub T&K</p>
          <p className="text-xs text-slate-400 mt-0.5">Panel administrativo</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {itemsVisibles.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setAbierto(false)}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              isActive
                ? 'bg-blue-600 text-white font-medium'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            )}
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Usuario y logout */}
      <div className="border-t border-slate-700 px-4 py-3">
        <p className="text-xs text-slate-400 truncate">{usuario?.nombre} {usuario?.apellido}</p>
        <p className="text-xs text-blue-400 mb-2">{usuario?.rol}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800 px-2"
        >
          <LogOut size={14} className="mr-2" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar escritorio */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Sidebar móvil (sheet manual) */}
      {abierto && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAbierto(false)} />
          <div className="relative w-64 h-full">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar móvil */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b">
          <button onClick={() => setAbierto(true)} className="text-slate-600">
            <Menu size={22} />
          </button>
          <span className="font-semibold text-slate-700 text-sm">OmniHub T&K</span>
          <div className="w-6" />
        </header>

        {/* Página */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
