import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Layouts
import AdminLayout  from '../layouts/AdminLayout'
import PublicLayout from '../layouts/PublicLayout'

// Auth
import LoginPage from '../pages/auth/LoginPage'

// Admin pages
import DashboardPage    from '../pages/admin/DashboardPage'
import CajaPage         from '../pages/admin/CajaPage'
import POSPage          from '../pages/admin/POSPage'
import ProductosPage    from '../pages/admin/ProductosPage'
import InventarioPage   from '../pages/admin/InventarioPage'
import ClientesPage     from '../pages/admin/ClientesPage'
import ApartadosPage    from '../pages/admin/ApartadosPage'
import PedidosPage      from '../pages/admin/PedidosPage'
import BoletasPage      from '../pages/admin/BoletasPage'
import ReportesPage     from '../pages/admin/ReportesPage'
import PromocionesPage  from '../pages/admin/PromocionesPage'
import UsuariosPage     from '../pages/admin/UsuariosPage'

// Public pages
import CatalogoPage      from '../pages/public/CatalogoPage'
import ConsultaBoletaPage from '../pages/public/ConsultaBoletaPage'

// ─── Guardia: requiere autenticación ─────────────────────────────────────────
function RequiereAuth() {
  const { autenticado, cargando } = useAuth()
  if (cargando) return <div className="flex items-center justify-center h-screen text-slate-500">Cargando…</div>
  return autenticado ? <Outlet /> : <Navigate to="/login" replace />
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

        {/* ── Públicas ─────────────────────────────────────────────────── */}
        <Route path="/login" element={<LoginPage />} />

        <Route element={<PublicLayout />}>
          <Route path="/"           element={<CatalogoPage />} />
          <Route path="/catalogo"   element={<CatalogoPage />} />
          <Route path="/mis-boletas" element={<ConsultaBoletaPage />} />
        </Route>

        {/* ── Protegidas (cualquier rol autenticado) ───────────────────── */}
        <Route element={<RequiereAuth />}>
          <Route element={<AdminLayout />}>

            <Route path="/admin/dashboard"   element={<DashboardPage />} />
            <Route path="/admin/caja"        element={<CajaPage />} />
            <Route path="/admin/pos"         element={<POSPage />} />
            <Route path="/admin/boletas"     element={<BoletasPage />} />

            {/* Admin y vendedor */}
            <Route element={<RequiereRol roles={['ADMINISTRADOR', 'VENDEDOR']} />}>
              <Route path="/admin/clientes"   element={<ClientesPage />} />
              <Route path="/admin/apartados"  element={<ApartadosPage />} />
              <Route path="/admin/pedidos"    element={<PedidosPage />} />
            </Route>

            {/* Solo admin */}
            <Route element={<RequiereRol roles={['ADMINISTRADOR']} />}>
              <Route path="/admin/productos"    element={<ProductosPage />} />
              <Route path="/admin/inventario"   element={<InventarioPage />} />
              <Route path="/admin/reportes"     element={<ReportesPage />} />
              <Route path="/admin/promociones"  element={<PromocionesPage />} />
              <Route path="/admin/usuarios"     element={<UsuariosPage />} />
            </Route>

          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
