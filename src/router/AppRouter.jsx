import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Layouts
import AdminLayout  from '../layouts/AdminLayout'
import PublicLayout from '../layouts/PublicLayout'

// Auth
import LoginPage from '../pages/auth/LoginPage'

// Public pages
import HomePage           from '../pages/public/HomePage'
import CatalogoPage       from '../pages/public/CatalogoPage'
import ConsultaBoletaPage from '../pages/public/ConsultaBoletaPage'

// Admin pages
import DashboardPage   from '../pages/admin/DashboardPage'
import CajaPage        from '../pages/admin/CajaPage'
import POSPage         from '../pages/admin/POSPage'
import ProductosPage   from '../pages/admin/ProductosPage'
import InventarioPage  from '../pages/admin/InventarioPage'
import ClientesPage    from '../pages/admin/ClientesPage'
import ApartadosPage   from '../pages/admin/ApartadosPage'
import PedidosPage     from '../pages/admin/PedidosPage'
import BoletasPage     from '../pages/admin/BoletasPage'
import ReportesPage    from '../pages/admin/ReportesPage'
import PromocionesPage       from '../pages/admin/PromocionesPage'
import UsuariosPage          from '../pages/admin/UsuariosPage'
import ConfiguracionHomePage from '../pages/admin/ConfiguracionHomePage'

// ─── Guardia: requiere autenticación ─────────────────────────────────────────
function RequiereAuth() {
  const { autenticado, cargando } = useAuth()
  if (cargando) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm">Cargando…</p>
        </div>
      </div>
    )
  }
  return autenticado ? <Outlet /> : <Navigate to="/login" replace />
}

// ─── Guardia: ya autenticado — redirige al dashboard si entra al login ────────
function SoloPublico() {
  const { autenticado, cargando } = useAuth()
  if (cargando) return null
  return autenticado ? <Navigate to="/admin/dashboard" replace /> : <Outlet />
}

// ─── Guardia: requiere rol específico ────────────────────────────────────────
function RequiereRol({ roles }) {
  const { usuario, cargando } = useAuth()
  if (cargando) return null
  if (!roles.includes(usuario?.rol)) return <Navigate to="/admin/dashboard" replace />
  return <Outlet />
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Portal público ───────────────────────────────────────────────── */}
        <Route element={<PublicLayout />}>
          <Route path="/"            element={<HomePage />} />
          <Route path="/catalogo"    element={<CatalogoPage />} />
          <Route path="/mis-boletas" element={<ConsultaBoletaPage />} />
        </Route>

        {/* ── Login — solo si no está autenticado ──────────────────────────── */}
        <Route element={<SoloPublico />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* ── Panel administrativo — requiere autenticación ────────────────── */}
        <Route element={<RequiereAuth />}>
          <Route element={<AdminLayout />}>

            {/* Todos los roles autenticados */}
            <Route path="/admin/dashboard" element={<DashboardPage />} />
            <Route path="/admin/caja"      element={<CajaPage />} />
            <Route path="/admin/pos"       element={<POSPage />} />
            <Route path="/admin/boletas"   element={<BoletasPage />} />

            {/* Admin y vendedor */}
            <Route element={<RequiereRol roles={['ADMINISTRADOR', 'VENDEDOR']} />}>
              <Route path="/admin/clientes"  element={<ClientesPage />} />
              <Route path="/admin/apartados" element={<ApartadosPage />} />
              <Route path="/admin/pedidos"   element={<PedidosPage />} />
            </Route>

            {/* Solo administrador */}
            <Route element={<RequiereRol roles={['ADMINISTRADOR']} />}>
              <Route path="/admin/productos"         element={<ProductosPage />} />
              <Route path="/admin/inventario"        element={<InventarioPage />} />
              <Route path="/admin/reportes"          element={<ReportesPage />} />
              <Route path="/admin/promociones"       element={<PromocionesPage />} />
              <Route path="/admin/usuarios"          element={<UsuariosPage />} />
              <Route path="/admin/configuracion-home" element={<ConfiguracionHomePage />} />
            </Route>

          </Route>
        </Route>

        {/* ── Fallback ─────────────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
