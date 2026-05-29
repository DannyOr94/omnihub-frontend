import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingCart, DollarSign, Wrench, BookMarked,
  Package, RefreshCw, TrendingUp,
  Globe, Activity, Clock, ArrowRight
} from 'lucide-react'
import { reportesApi } from '../../api/index'
import { cajaApi }     from '../../api/caja'
import { useAuth }     from '../../context/AuthContext'
import { StatCard }    from '../../components/shared/StatCard'
import { Button }      from '../../components/ui/button'
import { formatCurrency } from '../../utils'

// Mocks para Actividad Reciente (simula un flujo en vivo)
const MOCK_ACTIVIDAD = [
  { id: 1, hora: '03:11 PM', tipo: 'venta', texto: 'Venta POS realizada por Administrador (₡25,000)', icono: ShoppingCart, color: 'blue' },
  { id: 2, hora: '01:45 PM', tipo: 'boleta', texto: 'Boleta #1024 cambió a estado "Listo para Entrega"', icono: Wrench, color: 'purple' },
  { id: 3, hora: '11:30 AM', tipo: 'abono', texto: 'Abono recibido de Juan Pérez para Apartado #452 (₡10,000)', icono: DollarSign, color: 'green' },
  { id: 4, hora: '08:15 AM', tipo: 'caja', texto: 'Apertura de Caja por Administrador (₡251,000)', icono: Globe, color: 'slate' },
];

const AlertaCondensada = ({ icono: Icon, label, cantidad, to, colorType = 'red', navigate }) => {
  const isZero = cantidad === 0;
  
  const colors = {
    red: 'bg-red-50 border-red-100 text-red-700 hover:bg-red-100',
    blue: 'bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100',
    yellow: 'bg-yellow-50 border-yellow-100 text-yellow-700 hover:bg-yellow-100',
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100',
    green: 'bg-green-50 border-green-100 text-green-700 hover:bg-green-100',
    slate: 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100' // Gris neutro para cero
  }

  // Regla Pro (UI/UX): Si es 0 -> gris neutro. Si > 0 -> encendido.
  const activeColor = isZero ? colors.slate : colors[colorType]
  const iconColorClass = isZero ? 'text-slate-400' : 
    colorType === 'red' ? 'text-red-600' : 
    colorType === 'blue' ? 'text-blue-600' : 
    colorType === 'yellow' ? 'text-yellow-600' : 
    colorType === 'indigo' ? 'text-indigo-600' : 'text-green-600';

  return (
    <div 
      onClick={() => navigate(to)} 
      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${activeColor} ${!isZero && 'shadow-sm font-medium'}`}
      title={isZero ? '' : 'Haz clic para ver detalles'}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className={iconColorClass} />
        <span className={`text-sm ${isZero ? 'font-medium opacity-70' : 'font-bold'}`}>{label}</span>
      </div>
      <span className={`text-base ${isZero ? 'font-medium opacity-50' : 'font-extrabold'}`}>{cantidad}</span>
    </div>
  )
}

// Utilidad para los colores estáticos del Timeline
const getTimelineIconColors = (color) => {
  switch(color) {
    case 'blue': return 'bg-blue-50 text-blue-600 border-blue-100';
    case 'purple': return 'bg-purple-50 text-purple-600 border-purple-100';
    case 'green': return 'bg-green-50 text-green-600 border-green-100';
    case 'slate': return 'bg-slate-50 text-slate-600 border-slate-100';
    default: return 'bg-slate-50 text-slate-600 border-slate-100';
  }
}

export default function DashboardPage() {
  const { usuario, esAdmin, esVendedor } = useAuth()
  const navigate = useNavigate()

  const [metricas,     setMetricas]     = useState(null)
  const [caja,         setCaja]         = useState(null)
  const [cargando,     setCargando]     = useState(true)
  const [cargandoCaja, setCargandoCaja] = useState(true)

  async function cargarDatos() {
    // Si ya hay datos, no ponemos cargando=true para evitar parpadeos visuales en el polling
    if (!metricas) setCargando(true)
    try {
      const res = await reportesApi.dashboard()
      setMetricas(res.data.data)
    } catch {
      // Ignorar error de polling para no romper UI
    } finally {
      setCargando(false)
    }
  }

  async function cargarCaja() {
    if (!caja) setCargandoCaja(true)
    try {
      const res = await cajaApi.estado()
      setCaja(res.data.data)
    } catch {
      // Ignorar error de polling para no romper UI
    } finally {
      setCargandoCaja(false)
    }
  }

  // Setup inicial y Polling cada 30 segundos para "Actividad Viva"
  useEffect(() => { 
    cargarDatos(); 
    cargarCaja(); 

    const intervalId = setInterval(() => {
      cargarDatos();
      cargarCaja();
    }, 30000);

    return () => clearInterval(intervalId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hora  = new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })
  const fecha = new Date().toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long' })

  const hoy = metricas?.ventas?.hoy
  const ingresosTotalesHoy = hoy?.ingresosTotales ?? hoy?.total ?? 0
  const totalOrdenes = hoy?.cantidad ?? 0
  
  // KPIs nuevos
  const boletasActivas = metricas?.alertas?.boletasAbiertas ?? 0
  const apartadosPorVencer = metricas?.alertas?.apartadosVencidos ?? 0

  // Cálculo de Efectivo Estimado: Apertura + ventas en efectivo (montoSistemaActual refleja el esperado físico)
  const efectivoEstimado = caja?.caja?.montoSistemaActual ?? 0;
  const montoApertura = caja?.caja?.montoApertura ?? 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* ── 1. Cabecera y Estado Operativo ────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Buenos días, {usuario?.nombre} 👋</h1>
          <p className="text-sm text-slate-500 capitalize mt-1">{fecha} · {hora}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setCargando(true); setCargandoCaja(true); cargarDatos(); cargarCaja(); }} className="shadow-sm w-fit border-slate-200">
          <RefreshCw size={14} className={`mr-2 text-slate-500 ${cargando ? 'animate-spin' : ''}`} /> Actualizar Ahora
        </Button>
      </div>

      {(esAdmin || esVendedor) && (
        <div
          onClick={() => navigate('/admin/caja')}
          className={`rounded-2xl border px-5 py-4 flex items-center justify-between cursor-pointer transition-all duration-200 shadow-sm ${
            caja?.abierta
              ? 'bg-gradient-to-r from-emerald-50/80 to-green-50/50 border-green-200 hover:shadow-md'
              : 'bg-gradient-to-r from-red-50 to-slate-50 border-red-200 hover:shadow-md'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full shadow-sm ${caja?.abierta ? 'bg-white text-green-600 border border-green-100' : 'bg-white text-red-600 border border-red-100'}`}>
              <DollarSign size={22} strokeWidth={2.5} />
            </div>
            <div>
              <p className={`text-base font-bold ${caja?.abierta ? 'text-green-800' : 'text-red-800'}`}>
                {cargandoCaja ? 'Verificando caja…' : caja?.abierta ? 'Caja Abierta' : 'Caja Cerrada'}
              </p>
              {!cargandoCaja && caja?.abierta && (
                <p className="text-sm text-green-700/80 mt-0.5 font-medium">
                  Efectivo Estimado: <span className="font-extrabold text-green-800">{formatCurrency(efectivoEstimado)}</span> 
                  <span className="opacity-40 mx-2">|</span> Apertura: {formatCurrency(montoApertura)}
                </p>
              )}
              {!cargandoCaja && !caja?.abierta && (
                <p className="text-sm text-red-600/80 mt-0.5 font-medium">El sistema no puede procesar pagos físicos actualmente.</p>
              )}
            </div>
          </div>
          
          {!cargandoCaja && !caja?.abierta ? (
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white shadow-sm rounded-full px-5 hidden sm:flex">
              Abrir Caja
            </Button>
          ) : (
            <span className="text-xs font-bold px-4 py-1.5 rounded-full bg-green-100 text-green-700 border border-green-200 hidden sm:inline-block">
              Gestionar →
            </span>
          )}
        </div>
      )}

      {/* ── 2. Bloque de KPIs Dinámicos (Sin redundancias) ────────────────────── */}
      {(esAdmin || esVendedor) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard titulo="Ingresos del Día" valor={formatCurrency(ingresosTotalesHoy)} subtitulo="Acumulado bruto hoy" icono={TrendingUp} color="green" cargando={cargando} />
          <StatCard titulo="Transacciones" valor={totalOrdenes} subtitulo="Ventas y servicios hoy" icono={Activity} color="blue" cargando={cargando} />
          <StatCard titulo="Soporte Activo" valor={boletasActivas} subtitulo="Boletas en proceso" icono={Wrench} color="purple" cargando={cargando} />
          <StatCard titulo="Ap. por Vencer" valor={apartadosPorVencer} subtitulo="Próximos 3-5 días" icono={Clock} color="orange" cargando={cargando} />
        </div>
      )}

      {/* ── 3. y 4. Core Visual: Matriz de Alertas & Actividad Reciente ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Columna Izquierda (60%): Matriz Compacta de Alertas Operativas */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex-1">
            <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
              <Activity className="text-blue-600" size={20} />
              Alertas Operativas
            </h2>
            {cargando && !metricas ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(5)].map((_,i) => <div key={i} className="h-[52px] bg-slate-100 animate-pulse rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {esAdmin && (
                  <AlertaCondensada navigate={navigate} icono={Package} label="Stock Crítico" cantidad={metricas?.alertas.productosStockBajo ?? 0} to="/admin/inventario" colorType="red" />
                )}
                <AlertaCondensada navigate={navigate} icono={Clock} label="Apartados Vencidos" cantidad={metricas?.alertas.apartadosVencidos ?? 0} to="/admin/apartados" colorType="red" />
                <AlertaCondensada navigate={navigate} icono={Wrench} label="Soporte Retrasado" cantidad={metricas?.alertas.boletasAbiertas ?? 0} to="/admin/boletas" colorType="yellow" />
                <AlertaCondensada navigate={navigate} icono={Package} label="Por Entregar" cantidad={metricas?.alertas.pedidosDisponibles ?? 0} to="/admin/pedidos" colorType="yellow" />
                <AlertaCondensada navigate={navigate} icono={Globe} label="Reservas Web" cantidad={metricas?.alertas.reservasWebNuevas ?? 0} to="/admin/reservas-web" colorType="indigo" />
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha (40%): Actividad Reciente (El "Historial en Vivo") */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex-1 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Clock className="text-emerald-600" size={20} />
                Actividad Reciente
              </h2>
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">En Vivo</span>
              </div>
            </div>
            
            <div className="space-y-5 relative z-10">
              {MOCK_ACTIVIDAD.map((act) => (
                <div key={act.id} className="flex gap-4 items-start relative group">
                  {/* Linea conectora timeline */}
                  <div className="absolute left-[15px] top-8 bottom-[-20px] w-0.5 bg-slate-100 group-last:hidden"></div>
                  
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border z-10 ${getTimelineIconColors(act.color)}`}>
                    <act.icono size={14} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 pb-1 pt-0.5">
                    <p className="text-sm font-semibold text-slate-700 leading-snug">{act.texto}</p>
                    <p className="text-xs font-medium text-slate-400 mt-1">{act.hora}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <Button onClick={() => navigate('/admin/historial')} variant="ghost" className="w-full mt-5 text-xs text-blue-600 font-bold hover:text-blue-800 hover:bg-blue-50 relative z-10">
              Ver todo el historial <ArrowRight size={14} className="ml-1.5" />
            </Button>
            
            {/* Decoración de fondo */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-slate-50 rounded-full opacity-50 blur-2xl z-0 pointer-events-none"></div>
          </div>
        </div>
      </div>

      {/* ── 5. Barra de Accesos Rápidos (Acción Directa) ────────────────────── */}
      <div className="pt-2">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">Acciones Directas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {(esAdmin || esVendedor) && (
            <button onClick={() => navigate('/admin/pos')} className="group relative overflow-hidden bg-blue-600 hover:bg-blue-700 text-white rounded-3xl p-6 flex flex-col justify-between min-h-[140px] text-left transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl shadow-blue-600/20">
              <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                <ShoppingCart size={24} />
              </div>
              <div>
                <p className="font-bold text-lg leading-tight">Nueva Venta</p>
                <p className="text-sm text-blue-200 mt-1 font-medium">Abrir Punto de Venta</p>
              </div>
              {/* Brillo decorativo */}
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
            </button>
          )}
          <button onClick={() => navigate('/admin/boletas')} className="group relative overflow-hidden bg-slate-800 hover:bg-slate-900 text-white rounded-3xl p-6 flex flex-col justify-between min-h-[140px] text-left transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl shadow-slate-800/20">
            <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
              <Wrench size={24} />
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">Nueva Boleta</p>
              <p className="text-sm text-slate-400 mt-1 font-medium">Ingreso a Servicio Técnico</p>
            </div>
          </button>
          {(esAdmin || esVendedor) && (
            <button onClick={() => navigate('/admin/apartados')} className="group relative overflow-hidden bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-3xl p-6 flex flex-col justify-between min-h-[140px] text-left transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg shadow-sm">
              <div className="bg-slate-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                <BookMarked size={24} className="text-slate-600" />
              </div>
              <div>
                <p className="font-bold text-lg leading-tight">Nuevo Apartado</p>
                <p className="text-sm text-slate-500 mt-1 font-medium">Registro o reserva de producto</p>
              </div>
            </button>
          )}
        </div>
      </div>

    </div>
  )
}
