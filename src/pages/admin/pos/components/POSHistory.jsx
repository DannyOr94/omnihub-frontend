import { useState, useEffect } from 'react'
import { ChevronRight, ChevronLeft, Receipt, AlertTriangle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDateTime } from '../../../../utils'
import { ventasApi } from '../../../../api/index'
import { useAuth } from '../../../../context/AuthContext'

const TASAS_IVA = { EXENTO: 0, IVA_1: 1, IVA_4: 4, IVA_13: 13 }

export function POSHistory({ tabActivo }) {
  const { esAdmin } = useAuth()
  
  const [ventas, setVentas] = useState([])
  const [totalVentas, setTotalVentas] = useState(0)
  const [paginaVentas, setPaginaVentas] = useState(1)
  const [cargandoVentas, setCargandoVentas] = useState(false)
  const [ventaDetalle, setVentaDetalle] = useState(null)
  const [cargandoDet, setCargandoDet] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modalAnular, setModalAnular] = useState(false)
  const [motivoAnular, setMotivoAnular] = useState('')
  const [anulando, setAnulando] = useState(false)

  useEffect(() => {
    if (tabActivo === 'historial') cargarVentas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabActivo, paginaVentas, filtroEstado])

  async function cargarVentas() {
    setCargandoVentas(true)
    try {
      const res = await ventasApi.listar({ estado: filtroEstado || undefined, page: paginaVentas, limit: 15 })
      setVentas(res.data.data?.ventas ?? [])
      setTotalVentas(res.data.data?.total ?? 0)
    } catch { 
      toast.error('Error al cargar historial') 
    } finally { 
      setCargandoVentas(false) 
    }
  }

  async function verDetalleVenta(id) {
    setCargandoDet(true)
    setVentaDetalle(null)
    try {
      const res = await ventasApi.obtener(id)
      setVentaDetalle(res.data.data)
    } catch { 
      toast.error('Error al cargar detalle de venta') 
    } finally { 
      setCargandoDet(false) 
    }
  }

  async function confirmarAnulacion() {
    if (!motivoAnular.trim() || motivoAnular.trim().length < 5) {
      toast.warning('El motivo debe tener al menos 5 caracteres'); return
    }
    setAnulando(true)
    try {
      await ventasApi.anular(ventaDetalle.id, motivoAnular)
      toast.success('Venta anulada correctamente')
      setModalAnular(false)
      setMotivoAnular('')
      verDetalleVenta(ventaDetalle.id)
      cargarVentas()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error al anular')
    } finally { 
      setAnulando(false) 
    }
  }

  return (
    <div className="flex gap-4 flex-1 overflow-hidden">
      {/* Lista de ventas */}
      <div className="w-[340px] shrink-0 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-bold text-slate-800 text-sm">Ventas registradas</p>
            <button onClick={cargarVentas} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded-md transition-colors">
              <ChevronRight size={16} className={cargandoVentas ? 'animate-spin' : ''} />
            </button>
          </div>
          <select
            value={filtroEstado}
            onChange={e => { setFiltroEstado(e.target.value); setPaginaVentas(1) }}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
          >
            <option value="">Todos los estados</option>
            <option value="COMPLETADA">Solo Completadas</option>
            <option value="ANULADA">Solo Anuladas</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {cargandoVentas ? (
            [...Array(6)].map((_,i) => (
              <div key={i} className="px-5 py-4 space-y-2">
                <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-slate-50 rounded animate-pulse w-1/2" />
              </div>
            ))
          ) : ventas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-300">
              <Receipt size={40} className="mb-3 opacity-50" />
              <p className="text-sm font-medium text-slate-400">Sin ventas encontradas</p>
            </div>
          ) : (
            ventas.map(v => (
              <button
                key={v.id}
                onClick={() => verDetalleVenta(v.id)}
                className={`w-full px-5 py-4 text-left hover:bg-blue-50/50 transition-all group ${
                  ventaDetalle?.id === v.id ? 'bg-blue-50/80 border-l-4 border-blue-600' : 'border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{v.numeroVenta}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                    v.estadoVenta === 'COMPLETADA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {v.estadoVenta === 'COMPLETADA' ? 'Completada' : 'Anulada'}
                  </span>
                </div>
                <p className="text-base font-black text-slate-800 mt-1">{formatCurrency(v.total)}</p>
                <p className="text-xs font-medium text-slate-500 mt-1 flex justify-between">
                  <span className="truncate pr-2">{v.cliente?.nombreCompleto ?? 'Cliente genérico'}</span>
                  <span className="shrink-0">{v._count?.detalles} ítem(s)</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{formatDateTime(v.fechaVenta)}</p>
              </button>
            ))
          )}
        </div>

        {totalVentas > 15 && (
          <div className="px-5 py-3 border-t bg-slate-50 flex items-center justify-between text-xs font-semibold text-slate-500">
            <button onClick={() => setPaginaVentas(p => Math.max(1, p - 1))} disabled={paginaVentas === 1} className="flex items-center gap-1 hover:text-slate-800 disabled:opacity-40 transition-colors p-1">
              <ChevronLeft size={14} /> Ant
            </button>
            <span className="bg-white px-3 py-1 rounded-md border border-slate-200">{paginaVentas} / {Math.ceil(totalVentas / 15)}</span>
            <button onClick={() => setPaginaVentas(p => p + 1)} disabled={paginaVentas * 15 >= totalVentas} className="flex items-center gap-1 hover:text-slate-800 disabled:opacity-40 transition-colors p-1">
              Sig <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Detalle de venta */}
      <div className="flex-1 overflow-y-auto pr-2">
        {cargandoDet ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-4 shadow-sm">
            {[...Array(5)].map((_,i) => <div key={i} className="h-5 bg-slate-100 rounded animate-pulse" />)}
          </div>
        ) : !ventaDetalle ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 bg-white rounded-xl border border-dashed border-slate-300">
            <Receipt size={64} className="mb-4 text-slate-200" />
            <p className="text-slate-500 font-bold text-lg">Historial de Ventas</p>
            <p className="text-slate-400 mt-1">Selecciona una venta en el panel izquierdo para ver sus detalles</p>
          </div>
        ) : (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Recibo N° {ventaDetalle.numeroVenta}</p>
                  <p className="text-4xl font-black text-slate-800">{formatCurrency(ventaDetalle.total)}</p>
                  <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-2">
                    <Clock size={14} /> {formatDateTime(ventaDetalle.fechaVenta)}
                  </p>
                  
                  <div className="mt-5 space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {ventaDetalle.cliente ? (
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-800 block mb-0.5">Datos del Cliente:</span>
                        {ventaDetalle.cliente.nombreCompleto}
                        {ventaDetalle.cliente.telefono && <span className="text-slate-400 ml-2">({ventaDetalle.cliente.telefono})</span>}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-500 italic">Venta rápida (Sin cliente asociado)</p>
                    )}
                    <p className="text-xs font-medium text-slate-400 mt-2 pt-2 border-t border-slate-200">
                      Vendedor: {ventaDetalle.usuario?.nombre} {ventaDetalle.usuario?.apellido}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <span className={`text-sm px-4 py-1.5 rounded-lg font-bold uppercase tracking-wide border shadow-sm ${
                    ventaDetalle.estadoVenta === 'COMPLETADA' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {ventaDetalle.estadoVenta === 'COMPLETADA' ? '✓ Completada' : '✕ Anulada'}
                  </span>
                  
                  {ventaDetalle.estadoVenta === 'COMPLETADA' && esAdmin && (
                    <button
                      onClick={() => { setMotivoAnular(''); setModalAnular(true) }}
                      className="text-xs font-bold text-red-500 hover:text-white bg-white hover:bg-red-600 border-2 border-red-200 hover:border-red-600 px-4 py-2 rounded-xl transition-all mt-2"
                    >
                      Anular Venta
                    </button>
                  )}
                </div>
              </div>
              
              {ventaDetalle.motivoAnulacion && (
                <div className="mt-4 bg-red-50/50 border-l-4 border-red-500 rounded-r-lg px-4 py-3 text-sm text-red-800 flex gap-3 items-start">
                  <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold block mb-0.5">Motivo de anulación:</span>
                    <span className="opacity-90">{ventaDetalle.motivoAnulacion}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Ítems */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b bg-slate-50">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Detalle de Productos ({ventaDetalle.detalles?.length ?? 0} ítem{ventaDetalle.detalles?.length !== 1 ? 's' : ''})
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {ventaDetalle.detalles?.map(d => (
                  <div key={d.id} className="flex items-center justify-between px-6 py-4 text-sm group hover:bg-slate-50 transition-colors">
                    <div className="min-w-0 pr-4">
                      <p className="font-bold text-slate-800 truncate">{d.descripcionItem}</p>
                      <p className="text-xs font-medium text-slate-500 mt-1 flex flex-wrap gap-2 items-center">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{d.cantidad} × {formatCurrency(d.precioUnitario)}</span>
                        {Number(d.descuentoLinea) > 0 && <span className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-bold">-{formatCurrency(d.descuentoLinea)}</span>}
                        {d.tasaIva && d.tasaIva !== 'EXENTO' && (
                          <span className="text-slate-400">IVA {TASAS_IVA[d.tasaIva]}% ({formatCurrency(d.montoIva)})</span>
                        )}
                      </p>
                    </div>
                    <p className="font-black text-slate-800 shrink-0 text-base">{formatCurrency(d.subtotalLinea)}</p>
                  </div>
                ))}
              </div>
              <div className="px-6 py-5 border-t bg-slate-50 space-y-2 text-sm">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Subtotal</span><span>{formatCurrency(ventaDetalle.subtotal)}</span>
                </div>
                {ventaDetalle.detalles?.some(d => d.montoIva > 0) && (
                  <div className="space-y-1">
                    {Object.entries(
                      ventaDetalle.detalles.reduce((acc, d) => {
                        if (!d.tasaIva || d.tasaIva === 'EXENTO') return acc
                        const k = d.tasaIva
                        acc[k] = (acc[k] || 0) + Number(d.montoIva)
                        return acc
                      }, {})
                    ).map(([tasa, monto]) => (
                      <div key={tasa} className="flex justify-between text-xs text-slate-400 font-medium pl-2">
                        <span>• IVA {TASAS_IVA[tasa]}% incluido</span>
                        <span>{formatCurrency(monto)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {Number(ventaDetalle.descuento) > 0 && (
                  <div className="flex justify-between text-red-600 font-bold bg-red-50 px-2 py-1 -mx-2 rounded">
                    <span>Descuento Aplicado</span><span>-{formatCurrency(ventaDetalle.descuento)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center font-black text-slate-800 text-lg pt-3 border-t border-slate-200 mt-3">
                  <span>Total Pagado</span><span className="text-blue-700 text-2xl">{formatCurrency(ventaDetalle.total)}</span>
                </div>
              </div>
            </div>

            {/* Pagos */}
            {ventaDetalle.pagos?.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b bg-slate-50">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Métodos de Pago</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {ventaDetalle.pagos.map(p => (
                    <div key={p.id} className="flex items-center justify-between px-6 py-4 text-sm hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-bold text-slate-700">{p.metodoPago.replace('_', ' ')}</p>
                        {p.referenciaPago && <p className="text-xs font-medium text-slate-400 mt-1 font-mono bg-slate-100 px-2 py-0.5 rounded w-fit">Ref: {p.referenciaPago}</p>}
                      </div>
                      <p className="font-black text-slate-800 text-base">{formatCurrency(p.monto)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ventaDetalle.observaciones && (
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 text-sm text-amber-900 shadow-sm">
                <p className="text-xs text-amber-700/70 mb-1.5 font-bold uppercase tracking-wider flex items-center gap-1.5"><AlertTriangle size={14}/> Observaciones</p>
                <p className="font-medium">{ventaDetalle.observaciones}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal anular */}
      {modalAnular && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-red-50 px-6 py-5 border-b border-red-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0 shadow-inner">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div>
                <p className="font-black text-slate-800 text-lg leading-tight">Anular venta</p>
                <p className="text-sm font-bold text-slate-500 mt-0.5">{ventaDetalle?.numeroVenta}</p>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-red-50/50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-800 font-medium">
                Esta acción devolverá el stock de todos los productos y cancelará el ingreso en caja. <strong className="font-bold text-red-900">Esta acción no se puede deshacer.</strong>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Motivo de anulación <span className="text-red-500">*</span></label>
                <textarea
                  rows={3}
                  value={motivoAnular}
                  onChange={e => setMotivoAnular(e.target.value)}
                  placeholder="Explica el motivo (mín. 5 caracteres)…"
                  className="w-full text-sm border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50 transition-all resize-none"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="bg-slate-50 px-6 py-4 flex gap-3 border-t">
              <button onClick={() => { setModalAnular(false); setMotivoAnular('') }} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                Cancelar
              </button>
              <button onClick={confirmarAnulacion} disabled={anulando || motivoAnular.trim().length < 5} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-black transition-colors shadow-sm hover:shadow-md">
                {anulando ? 'Anulando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
