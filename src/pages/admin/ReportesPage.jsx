import { useState, useEffect } from 'react'
import { toast }   from 'sonner'
import {
  BarChart3, RefreshCw, TrendingUp, Package,
  Wrench, BookMarked, ClipboardList, DollarSign,
} from 'lucide-react'
import { reportesApi } from '../../api/index'
import { Button }      from '../../components/ui/button'
import { Input }       from '../../components/ui/input'
import { Label }       from '../../components/ui/label'
import { StatCard }    from '../../components/shared/StatCard'
import { formatCurrency, formatDate, colorEstado } from '../../utils'
const TABS = [
  { key: 'ventas',    label: 'Ventas',          icon: TrendingUp   },
  { key: 'inventario',label: 'Inventario',       icon: Package      },
  { key: 'tecnico',   label: 'Servicio Técnico', icon: Wrench       },
  { key: 'apartados', label: 'Apartados',        icon: BookMarked   },
  { key: 'pedidos',   label: 'Pedidos',          icon: ClipboardList },
]

const ETIQ_ESTADO_BOLETA = {
  RECIBIDO:'Recibido', EN_DIAGNOSTICO:'En diagnóstico', PRESUPUESTADO:'Presupuestado',
  APROBADO:'Aprobado', RECHAZADO:'Rechazado', EN_REPARACION:'En reparación',
  LISTO_ENTREGA:'Listo para entrega', ENTREGADO:'Entregado',
}

export default function ReportesPage() {
  const [tab,      setTab]      = useState('ventas')
  const [datos,    setDatos]    = useState(null)
  const [cargando, setCargando] = useState(false)

  // Filtros de ventas
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  async function cargar() {
    setCargando(true)
    setDatos(null)
    try {
      let res
      if (tab === 'ventas')     res = await reportesApi.ventas({ desde: desde || undefined, hasta: hasta || undefined })
      if (tab === 'inventario') res = await reportesApi.inventario()
      if (tab === 'tecnico')    res = await reportesApi.servicioTecnico({ desde: desde || undefined, hasta: hasta || undefined })
      if (tab === 'apartados')  res = await reportesApi.apartados()
      if (tab === 'pedidos')    res = await reportesApi.pedidos()
      setDatos(res.data.data)
    } catch { toast.error('Error al cargar reporte') }
    finally  { setCargando(false) }
  }

  useEffect(() => { cargar() }, [tab])

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2"><BarChart3 size={20}/> Reportes</h1>
          <p className="text-sm text-slate-500 mt-0.5">Análisis operativo del negocio</p>
        </div>
        <Button variant="outline" size="sm" onClick={cargar} disabled={cargando}>
          <RefreshCw size={14} className={`mr-1.5 ${cargando?'animate-spin':''}`}/> Actualizar
        </Button>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${tab===t.key?'border-blue-600 text-blue-700':'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <t.icon size={14}/> {t.label}
          </button>
        ))}
      </div>

      {/* ── Filtros de fecha (ventas y técnico) ─────────────────────────────── */}
      {(tab === 'ventas' || tab === 'tecnico') && (
        <div className="flex items-end gap-3 bg-white rounded-xl border p-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Desde</Label>
            <Input type="date" value={desde} onChange={e=>setDesde(e.target.value)} className="h-8 text-sm w-36"/>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Hasta</Label>
            <Input type="date" value={hasta} onChange={e=>setHasta(e.target.value)} className="h-8 text-sm w-36"/>
          </div>
          <Button size="sm" onClick={cargar} disabled={cargando}>Aplicar filtro</Button>
          <button onClick={() => { setDesde(''); setHasta('') }} className="text-xs text-slate-400 hover:text-slate-600">Limpiar</button>
        </div>
      )}

      {/* ── Loading ──────────────────────────────────────────────────────────── */}
      {cargando && (
        <div className="space-y-3">
          {[...Array(3)].map((_,i) => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse"/>)}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB VENTAS                                                            */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {!cargando && tab === 'ventas' && datos && (
        <div className="space-y-4">
          {/* Resumen global */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard titulo="Ventas totales"   valor={datos.resumen?._count?.id ?? 0}                 icono={TrendingUp} color="blue"/>
            <StatCard titulo="Ingresos totales" valor={formatCurrency(datos.resumen?._sum?.total ?? 0)} icono={DollarSign} color="green"/>
            <StatCard titulo="Total descuentos" valor={formatCurrency(datos.resumen?._sum?.descuento ?? 0)} icono={DollarSign} color="yellow"/>
          </div>

          {/* Por método de pago */}
          {datos.porMetodoPago?.length > 0 && (
            <div className="bg-white rounded-xl border p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Desglose por método de pago</h3>
              <div className="divide-y divide-slate-100">
                {datos.porMetodoPago.map(m => (
                  <div key={m.metodoPago} className="flex justify-between py-2.5 text-sm">
                    <span className="text-slate-600">{m.metodoPago.replace('_',' ')}</span>
                    <div className="flex gap-6">
                      <span className="text-slate-400 text-xs">{m._count?.id} transacciones</span>
                      <span className="font-semibold">{formatCurrency(m._sum?.monto ?? 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ventas agrupadas por período */}
          {datos.agrupado && Object.keys(datos.agrupado).length > 0 && (
            <div className="bg-white rounded-xl border p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Ventas por período</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-slate-500 border-b"><th className="py-2 text-left">Período</th><th className="py-2 text-right">Cantidad</th><th className="py-2 text-right">Total</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {Object.entries(datos.agrupado).slice(-30).reverse().map(([fecha, d]) => (
                      <tr key={fecha} className="hover:bg-slate-50">
                        <td className="py-2 text-slate-600">{fecha}</td>
                        <td className="py-2 text-right text-slate-500">{d.cantidad}</td>
                        <td className="py-2 text-right font-semibold">{formatCurrency(d.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB INVENTARIO                                                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {!cargando && tab === 'inventario' && datos && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard titulo="Total productos" valor={datos.resumen?.totalProductos ?? 0} icono={Package} color="blue"/>
            <StatCard titulo="Con stock bajo"  valor={datos.resumen?.stockBajo ?? 0}      icono={Package} color="red"/>
            <StatCard titulo="Sin variantes"   valor={datos.resumen?.sinVariantes ?? 0}   icono={Package} color="slate"/>
            <StatCard titulo="Con variantes"   valor={datos.resumen?.conVariantes ?? 0}   icono={Package} color="purple"/>
          </div>

          {/* Lista completa */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-4 py-3 border-b text-sm font-semibold text-slate-700">Productos en inventario</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 text-xs text-slate-500 border-b">
                  <th className="px-4 py-2.5 text-left font-medium">Producto</th>
                  <th className="px-4 py-2.5 text-left font-medium">Categoría</th>
                  <th className="px-4 py-2.5 text-right font-medium">Stock</th>
                  <th className="px-4 py-2.5 text-right font-medium">Mínimo</th>
                  <th className="px-4 py-2.5 text-right font-medium">Precio venta</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {(datos.productos ?? []).filter(p=>!p.usaVariantes).map(p => (
                    <tr key={p.id} className={`hover:bg-slate-50 ${p.stockActual<=p.stockMinimo?'bg-red-50':''}`}>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{p.nombre}</td>
                      <td className="px-4 py-2.5 text-slate-500 text-xs">{p.categoria?.nombre}</td>
                      <td className={`px-4 py-2.5 text-right font-bold ${p.stockActual-p.stockReservado<=p.stockMinimo?'text-red-600':'text-slate-800'}`}>{p.stockActual}</td>
                      <td className="px-4 py-2.5 text-right text-slate-400">{p.stockMinimo}</td>
                      <td className="px-4 py-2.5 text-right text-slate-700">{formatCurrency(p.precioVenta)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB SERVICIO TÉCNICO                                                  */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {!cargando && tab === 'tecnico' && datos && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard titulo="Total boletas" valor={datos.totales?._count?.id ?? 0}                    icono={Wrench} color="blue"/>
            <StatCard titulo="Ingresos total" valor={formatCurrency(datos.totales?._sum?.total ?? 0)}  icono={DollarSign} color="green"/>
            <StatCard titulo="Mano de obra"  valor={formatCurrency(datos.totales?._sum?.manoObra ?? 0)} icono={DollarSign} color="purple"/>
            <StatCard titulo="Tiempo prom."  valor={`${datos.tiempoPromedioReparacion ?? 0} días`}      icono={Wrench} color="slate"/>
          </div>

          {/* Por estado */}
          {datos.porEstado?.length > 0 && (
            <div className="bg-white rounded-xl border p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Boletas por estado</h3>
              <div className="divide-y divide-slate-100">
                {datos.porEstado.map(e => (
                  <div key={e.estadoBoleta} className="flex justify-between py-2.5 text-sm">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colorEstado(e.estadoBoleta)}`}>
                      {ETIQ_ESTADO_BOLETA[e.estadoBoleta] ?? e.estadoBoleta}
                    </span>
                    <span className="font-semibold">{e._count?.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB APARTADOS                                                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {!cargando && tab === 'apartados' && datos && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard titulo="Total apartados" valor={datos.resumen?.total ?? 0}                       icono={BookMarked} color="blue"/>
            <StatCard titulo="Activos/Abonados" valor={datos.resumen?.activos ?? 0}                   icono={BookMarked} color="yellow"/>
            <StatCard titulo="Liquidados"       valor={datos.resumen?.liquidados ?? 0}                icono={BookMarked} color="green"/>
            <StatCard titulo="Saldo pendiente"  valor={formatCurrency(datos.resumen?.saldoPendiente ?? 0)} icono={DollarSign} color="red"/>
          </div>

          {datos.apartados?.length > 0 && (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="px-4 py-3 border-b text-sm font-semibold text-slate-700">Apartados activos</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50 text-xs text-slate-500 border-b">
                    <th className="px-4 py-2.5 text-left font-medium">N°</th>
                    <th className="px-4 py-2.5 text-left font-medium">Cliente</th>
                    <th className="px-4 py-2.5 text-left font-medium">Estado</th>
                    <th className="px-4 py-2.5 text-left font-medium">Vence</th>
                    <th className="px-4 py-2.5 text-right font-medium">Saldo</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {datos.apartados.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{a.numeroApartado}</td>
                        <td className="px-4 py-2.5 text-slate-800">{a.cliente?.nombreCompleto}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colorEstado(a.estadoApartado)}`}>{a.estadoApartado}</span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{formatDate(a.fechaVencimiento)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-red-600">{formatCurrency(a.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB PEDIDOS                                                           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {!cargando && tab === 'pedidos' && datos && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard titulo="Total pedidos"    valor={datos.resumen?.total ?? 0}      icono={ClipboardList} color="blue"/>
            <StatCard titulo="En proceso"       valor={datos.resumen?.enProceso ?? 0}  icono={ClipboardList} color="yellow"/>
            <StatCard titulo="Disponibles"      valor={datos.resumen?.disponibles ?? 0} icono={ClipboardList} color="green"/>
            <StatCard titulo="Entregados"       valor={datos.resumen?.entregados ?? 0} icono={ClipboardList} color="slate"/>
          </div>

          {datos.pedidos?.length > 0 && (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="px-4 py-3 border-b text-sm font-semibold text-slate-700">Pedidos activos</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50 text-xs text-slate-500 border-b">
                    <th className="px-4 py-2.5 text-left font-medium">N°</th>
                    <th className="px-4 py-2.5 text-left font-medium">Cliente</th>
                    <th className="px-4 py-2.5 text-left font-medium">Estado</th>
                    <th className="px-4 py-2.5 text-left font-medium">Solicitado</th>
                    <th className="px-4 py-2.5 text-right font-medium">Saldo</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {datos.pedidos.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{p.numeroPedido}</td>
                        <td className="px-4 py-2.5 text-slate-800">{p.cliente?.nombreCompleto}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colorEstado(p.estadoPedido)}`}>{p.estadoPedido}</span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{formatDate(p.fechaSolicitud)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-700">{formatCurrency(p.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
