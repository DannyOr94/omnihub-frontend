import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingCart, DollarSign, Wrench, BookMarked,
  ClipboardList, Package, RefreshCw, TrendingUp,
  Receipt, CreditCard,
} from 'lucide-react'
import { reportesApi } from '../../api/index'
import { cajaApi }     from '../../api/caja'
import { useAuth }     from '../../context/AuthContext'
import { StatCard }    from '../../components/shared/StatCard'
import { AlertaItem }  from '../../components/shared/AlertaItem'
import { Button }      from '../../components/ui/button'
import { formatCurrency, formatDateTime } from '../../utils'

export default function DashboardPage() {
  const { usuario, esAdmin, esVendedor } = useAuth()
  const navigate = useNavigate()

  const [metricas,     setMetricas]     = useState(null)
  const [caja,         setCaja]         = useState(null)
  const [cargando,     setCargando]     = useState(true)
  const [cargandoCaja, setCargandoCaja] = useState(true)

  async function cargarDatos() {
    setCargando(true)
    try {
      const res = await reportesApi.dashboard()
      setMetricas(res.data.data)
    } catch {
      setMetricas(null)
    } finally {
      setCargando(false)
    }
  }

  async function cargarCaja() {
    setCargandoCaja(true)
    try {
      const res = await cajaApi.estado()
      setCaja(res.data.data)
    } catch {
      setCaja(null)
    } finally {
      setCargandoCaja(false)
    }
  }

  useEffect(() => { cargarDatos(); cargarCaja() }, [])

  const hora  = new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })
  const fecha = new Date().toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long' })

  const hoy = metricas?.ventas?.hoy
  const mes  = metricas?.ventas?.mes

  const ingresosTotalesHoy = hoy?.ingresosTotales  ?? hoy?.total ?? 0
  const ingresosTotalesMes = mes?.ingresosTotales  ?? mes?.total ?? 0
  const ingresosPos        = hoy?.ingresosPos      ?? hoy?.total ?? 0
  const ingresosBoletas    = hoy?.ingresosBoletas  ?? 0
  const ingresosApartados  = hoy?.ingresosApartados ?? 0

  return (
    <div className="space-y-6">

      {/* ── Encabezado ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Buenos días, {usuario?.nombre} 👋</h1>
          <p className="text-sm text-slate-500 capitalize mt-0.5">{fecha} · {hora}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { cargarDatos(); cargarCaja() }}>
          <RefreshCw size={14} className="mr-1.5" /> Actualizar
        </Button>
      </div>

      {/* ── Estado de caja ──────────────────────────────────────────────────── */}
      {(esAdmin || esVendedor) && (
        <div
          onClick={() => navigate('/admin/caja')}
          className={`rounded-xl border px-5 py-4 flex items-center justify-between cursor-pointer transition-colors ${
            caja?.abierta
              ? 'bg-green-50 border-green-200 hover:bg-green-100'
              : 'bg-red-50 border-red-200 hover:bg-red-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <DollarSign size={20} className={caja?.abierta ? 'text-green-600' : 'text-red-500'} />
            <div>
              <p className={`text-sm font-semibold ${caja?.abierta ? 'text-green-800' : 'text-red-800'}`}>
                {cargandoCaja ? 'Verificando caja…' : caja?.abierta ? 'Caja abierta' : 'Caja cerrada'}
              </p>
              {!cargandoCaja && caja?.abierta && (
                <p className="text-xs text-green-600 mt-0.5">
                  Monto sistema: {formatCurrency(caja.caja?.montoSistemaActual)} · Abierta: {formatDateTime(caja.caja?.fechaApertura)}
                </p>
              )}
              {!cargandoCaja && !caja?.abierta && (
                <p className="text-xs text-red-500 mt-0.5">Debe abrir la caja para registrar ventas y cobros</p>
              )}
            </div>
          </div>
          <span className="text-xs text-slate-400">Ver caja →</span>
        </div>
      )}

      {/* ── Métricas del día ────────────────────────────────────────────────── */}
      {(esAdmin || esVendedor) && (
        <>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Ingresos de hoy</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard titulo="Total ingresos hoy"     valor={formatCurrency(ingresosTotalesHoy)} subtitulo="POS + técnico + apartados" icono={TrendingUp}    color="green"  cargando={cargando} />
            <StatCard titulo="Ventas POS hoy"         valor={hoy?.cantidad ?? 0}                 subtitulo={formatCurrency(ingresosPos) + ' cobrado'}       icono={ShoppingCart} color="blue"   cargando={cargando} />
            <StatCard titulo="Cobros técnicos hoy"    valor={formatCurrency(ingresosBoletas)}    subtitulo="pagos de reparaciones"                           icono={Wrench}       color="purple" cargando={cargando} />
            <StatCard titulo="Abonos apartados hoy"   valor={formatCurrency(ingresosApartados)}  subtitulo="abonos recibidos"                                icono={BookMarked}   color="orange" cargando={cargando} />
          </div>

          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Resumen del mes</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard titulo="Ingresos totales mes"   valor={formatCurrency(ingresosTotalesMes)} subtitulo="acumulado mensual"       icono={DollarSign}   color="green"  cargando={cargando} />
            <StatCard titulo="Ventas del mes"         valor={mes?.cantidad ?? 0}                 subtitulo="transacciones POS"      icono={ShoppingCart} color="blue"   cargando={cargando} />
            <StatCard titulo="Ventas POS mes"         valor={formatCurrency(mes?.total ?? 0)}    subtitulo="solo punto de venta"    icono={Receipt}      color="purple" cargando={cargando} />
            <StatCard titulo="Otros cobros mes"       valor={formatCurrency(ingresosTotalesMes - (mes?.total ?? 0))} subtitulo="técnico + apartados" icono={CreditCard} color="slate" cargando={cargando} />
          </div>
        </>
      )}

      {/* ── Alertas operativas ──────────────────────────────────────────────── */}
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Alertas operativas</h2>
      {cargando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(4)].map((_,i) => <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AlertaItem icono={Wrench}       label="Boletas en proceso"              cantidad={metricas?.alertas.boletasAbiertas  ?? 0} to="/admin/boletas"   color={metricas?.alertas.boletasAbiertas  > 0 ? 'blue'   : 'green'} />
          <AlertaItem icono={BookMarked}   label="Apartados vencidos"              cantidad={metricas?.alertas.apartadosVencidos ?? 0} to="/admin/apartados" color={metricas?.alertas.apartadosVencidos > 0 ? 'red'    : 'green'} />
          <AlertaItem icono={ClipboardList}label="Pedidos disponibles para entregar" cantidad={metricas?.alertas.pedidosDisponibles ?? 0} to="/admin/pedidos"  color={metricas?.alertas.pedidosDisponibles > 0 ? 'yellow' : 'green'} />
          {esAdmin && (
            <AlertaItem icono={Package} label="Productos con stock bajo" cantidad={metricas?.alertas.productosStockBajo ?? 0} to="/admin/inventario" color={metricas?.alertas.productosStockBajo > 0 ? 'red' : 'green'} />
          )}
        </div>
      )}

      {/* ── Accesos rápidos ─────────────────────────────────────────────────── */}
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Acceso rápido</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {(esAdmin || esVendedor) && (
          <button onClick={() => navigate('/admin/pos')} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-4 text-left transition-colors">
            <ShoppingCart size={22} className="mb-2" />
            <p className="font-semibold text-sm">Nueva venta</p>
            <p className="text-xs text-blue-200 mt-0.5">Abrir POS</p>
          </button>
        )}
        <button onClick={() => navigate('/admin/boletas')} className="bg-slate-700 hover:bg-slate-800 text-white rounded-xl p-4 text-left transition-colors">
          <Wrench size={22} className="mb-2" />
          <p className="font-semibold text-sm">Nueva boleta</p>
          <p className="text-xs text-slate-400 mt-0.5">Servicio técnico</p>
        </button>
        {(esAdmin || esVendedor) && (
          <button onClick={() => navigate('/admin/apartados')} className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl p-4 text-left transition-colors">
            <BookMarked size={22} className="mb-2 text-slate-500" />
            <p className="font-semibold text-sm">Nuevo apartado</p>
            <p className="text-xs text-slate-400 mt-0.5">Reservar producto</p>
          </button>
        )}
      </div>

    </div>
  )
}
