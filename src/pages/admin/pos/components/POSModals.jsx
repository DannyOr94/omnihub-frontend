import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { X, UserPlus, AlertTriangle, Printer, Clock, PlayCircle, ShoppingCart } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../../components/ui/dialog'
import { Input } from '../../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Button } from '../../../../components/ui/button'
import { formatCurrency } from '../../../../utils'
import { clientesApi } from '../../../../api/index'

const METODOS_PAGO = [
  { value: 'EFECTIVO',      label: 'Efectivo' },
  { value: 'SINPE',         label: 'SINPE Móvil' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'DATAFONO',      label: 'Datáfono' },
  { value: 'NOTA_CREDITO',  label: 'Nota de crédito' },
]

const MONTOS_RAPIDOS = [1000, 2000, 5000, 10000, 20000, 50000]

// ─── Modal de Creación de Cliente ─────────────────────────────────────────────
function ModalCrearCliente({ open, onClose, onCreado }) {
  const [form, setForm] = useState({ nombreCompleto: '', cedula: '', telefono: '', correo: '', direccion: '' })
  const [guardando, setGuardando] = useState(false)
  const [errores, setErrores] = useState({})

  function set(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }))
    if (errores[campo]) setErrores(prev => { const n = {...prev}; delete n[campo]; return n })
  }

  function validar() {
    const e = {}
    if (!form.nombreCompleto.trim() || form.nombreCompleto.trim().length < 2)
      e.nombreCompleto = 'El nombre es obligatorio (mín. 2 caracteres)'
    if (form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
      e.correo = 'Correo inválido'
    if (form.telefono && form.telefono.length < 8)
      e.telefono = 'Teléfono inválido'
    return e
  }

  async function guardar() {
    const e = validar()
    if (Object.keys(e).length) { setErrores(e); return }
    setGuardando(true)
    try {
      const datos = {
        nombreCompleto: form.nombreCompleto.trim(),
        cedula: form.cedula.trim() || null,
        telefono: form.telefono.trim() || null,
        correo: form.correo.trim() || null,
        direccion: form.direccion.trim() || null,
      }
      const res = await clientesApi.crear(datos)
      const nuevo = res.data.data
      toast.success(`Cliente "${nuevo.nombreCompleto}" creado`)
      onCreado(nuevo)
      setForm({ nombreCompleto:'', cedula:'', telefono:'', correo:'', direccion:'' })
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error al crear cliente')
    } finally {
      setGuardando(false)
    }
  }

  if (!open) return null

  return (
    <div className="border-t border-blue-100 pt-4 mt-3 space-y-4 bg-blue-50/50 rounded-xl p-4">
      <p className="text-sm font-bold text-blue-800 flex items-center gap-2">
        <UserPlus size={16} /> Registrar nuevo cliente
      </p>

      <div className="space-y-3">
        <div>
          <Input placeholder="Nombre completo *" value={form.nombreCompleto} onChange={e => set('nombreCompleto', e.target.value)}
            className={`h-9 text-sm ${errores.nombreCompleto ? 'border-red-400 focus-visible:ring-red-400' : ''}`} autoFocus />
          {errores.nombreCompleto && <p className="text-xs text-red-500 mt-1">{errores.nombreCompleto}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Cédula" value={form.cedula} onChange={e => set('cedula', e.target.value)} className="h-9 text-sm" />
          <div>
            <Input placeholder="Teléfono" value={form.telefono} onChange={e => set('telefono', e.target.value)}
              className={`h-9 text-sm ${errores.telefono ? 'border-red-400 focus-visible:ring-red-400' : ''}`} />
            {errores.telefono && <p className="text-xs text-red-500 mt-1">{errores.telefono}</p>}
          </div>
        </div>

        <div>
          <Input placeholder="Correo electrónico" type="email" value={form.correo} onChange={e => set('correo', e.target.value)}
            className={`h-9 text-sm ${errores.correo ? 'border-red-400 focus-visible:ring-red-400' : ''}`} />
          {errores.correo && <p className="text-xs text-red-500 mt-1">{errores.correo}</p>}
        </div>

        <Input placeholder="Dirección (opcional)" value={form.direccion} onChange={e => set('direccion', e.target.value)} className="h-9 text-sm" />
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
        <Button onClick={guardar} disabled={guardando} className="flex-1 bg-blue-600 hover:bg-blue-700">
          {guardando ? 'Guardando…' : 'Crear cliente'}
        </Button>
      </div>
    </div>
  )
}

// ─── Selector de Variantes ────────────────────────────────────────────────────
function VariantesSelector({ producto, onSeleccionar }) {
  const [variantes, setVariantes] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!producto) return
    import('../../../../api/index').then(({ productosApi: api }) => {
      api.obtener(producto.id)
        .then(res => setVariantes(res.data.data?.variantes ?? []))
        .catch(() => setVariantes([]))
        .finally(() => setCargando(false))
    })
  }, [producto])

  if (cargando) return (
    <div className="flex justify-center py-8">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
  if (variantes.length === 0) return <p className="text-sm text-slate-400 py-4 text-center">Sin variantes disponibles</p>

  return (
    <div className="grid grid-cols-2 gap-3 pt-2 max-h-80 overflow-y-auto p-1">
      {variantes.filter(v => v.activo).map(v => {
        const libre = v.stockActual - v.stockReservado
        return (
          <button key={v.id} onClick={() => onSeleccionar(v)} disabled={libre <= 0}
            className="border border-slate-200 rounded-xl p-4 text-left hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md group">
            <p className="text-sm font-bold text-slate-800 group-hover:text-blue-800">
              {v.talla && `Talla ${v.talla}`}{v.talla && v.color && ' · '}{v.color}
            </p>
            <p className="text-sm text-slate-600 mt-1 font-medium">{formatCurrency(v.precioVenta)}</p>
            <p className={`text-xs mt-2 font-semibold px-2 py-1 rounded inline-block ${libre <= 0 ? 'bg-red-100 text-red-700' : libre <= 3 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
              {libre <= 0 ? 'Sin stock' : `${libre} disponibles`}
            </p>
          </button>
        )
      })}
    </div>
  )
}

// ─── Modal de Proforma ────────────────────────────────────────────────────────
function ModalProforma({ proforma, onClose }) {
  if (!proforma) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={!!proforma} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white">
        <div className="no-print">
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Printer size={20} className="text-blue-400" /> Vista Previa de Proforma
              </DialogTitle>
            </DialogHeader>
            <div className="flex gap-2">
              <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 font-bold shadow-lg">
                <Printer size={18} className="mr-2" /> Imprimir / PDF
              </Button>
              <Button variant="ghost" onClick={onClose} className="text-white hover:bg-white/10 p-2 h-auto">
                <X size={20} />
              </Button>
            </div>
          </div>
        </div>

        {/* Área de Impresión */}
        <div className="p-10 bg-white min-h-[600px] overflow-y-auto max-h-[80vh] custom-scrollbar proforma-print-area">
          {/* Header Factura */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                  <ShoppingCart size={24} className="text-white" />
                </div>
                <h1 className="text-3xl font-black tracking-tighter text-slate-900">OMNIHUB</h1>
              </div>
              <p className="text-sm font-black text-slate-800">Omnihub Solutions S.A.</p>
              <p className="text-xs text-slate-500 font-medium">Cédula Jurídica: 3-101-778899</p>
              <p className="text-xs text-slate-500 font-medium">San José, Costa Rica</p>
              <p className="text-xs text-slate-500 font-medium">Tel: +506 2233-4455</p>
            </div>

            <div className="text-right space-y-2">
              <div className="bg-slate-100 px-4 py-2 rounded-lg inline-block border border-slate-200">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 leading-none mb-1">Documento No.</p>
                <p className="text-xl font-black text-slate-900 tabular-nums">{proforma.numeroProforma}</p>
              </div>
              <p className="text-xs font-bold text-slate-500">Fecha: {new Date(proforma.fecha).toLocaleDateString('es-CR')}</p>
              <p className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded inline-block">Proforma Comercial</p>
            </div>
          </div>

          {/* Info Cliente y Vendedor */}
          <div className="grid grid-cols-2 gap-12 mb-10">
            <div className="space-y-3">
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 border-b pb-1">Datos del Cliente</p>
              {proforma.cliente ? (
                <div className="space-y-1">
                  <p className="text-base font-black text-slate-900">{proforma.cliente.nombre}</p>
                  <p className="text-xs text-slate-500 font-medium">Identificación: {proforma.cliente.cedula || 'N/A'}</p>
                  <p className="text-xs text-slate-500 font-medium">Dirección: {proforma.cliente.direccion || 'No especificada'}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-400 font-bold italic">Cliente Contado (Genérico)</p>
              )}
            </div>
            <div className="space-y-3">
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 border-b pb-1">Atendido por</p>
              <div className="space-y-1">
                <p className="text-base font-black text-slate-900">{proforma.vendedor || 'Sistema Principal'}</p>
                <p className="text-xs text-slate-500 font-medium italic">Ejecutivo de Ventas</p>
              </div>
            </div>
          </div>

          {/* Tabla de Items */}
          <div className="mb-10">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-slate-900 text-[10px] uppercase font-black tracking-widest text-slate-400">
                  <th className="py-3">Cant.</th>
                  <th className="py-3">Descripción</th>
                  <th className="py-3 text-right">Precio Unit.</th>
                  <th className="py-3 text-right">Descuento</th>
                  <th className="py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {proforma.items.map((item, i) => (
                  <tr key={i} className="text-sm">
                    <td className="py-4 font-black text-slate-900">{item.cantidad}</td>
                    <td className="py-4">
                      <p className="font-bold text-slate-800">{item.nombre}</p>
                      {item.variante && (
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{item.variante.talla} · {item.variante.color}</p>
                      )}
                    </td>
                    <td className="py-4 text-right font-medium text-slate-600">{formatCurrency(item.precioUnitario)}</td>
                    <td className="py-4 text-right font-medium text-red-500">{item.descuentoLinea > 0 ? `-${formatCurrency(item.descuentoLinea)}` : '—'}</td>
                    <td className="py-4 text-right font-black text-slate-900">{formatCurrency((item.precioUnitario * item.cantidad) - item.descuentoLinea)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Resumen de Totales */}
          <div className="flex justify-end pt-6 border-t-2 border-slate-900">
            <div className="w-64 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-bold">SUBTOTAL</span>
                <span className="text-slate-900 font-bold">{formatCurrency(proforma.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-400 font-bold uppercase tracking-tighter italic">DESCUENTOS</span>
                <span className="text-red-500 font-bold">-{formatCurrency(proforma.totalDescuento)}</span>
              </div>
              {proforma.gruposIva.map(g => (
                <div key={g.tasa} className="flex justify-between text-sm">
                  <span className="text-slate-400 font-bold">IVA {g.porcentaje}%</span>
                  <span className="text-slate-900 font-bold">{formatCurrency(g.monto)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center bg-slate-900 text-white px-3 py-4 rounded-xl mt-4">
                <span className="text-xs font-black tracking-widest">TOTAL</span>
                <span className="text-2xl font-black tracking-tight">{formatCurrency(proforma.total)}</span>
              </div>
            </div>
          </div>

          {/* Footer Legal */}
          <div className="mt-20 pt-8 border-t border-slate-100 text-[10px] text-slate-400 text-center space-y-1">
            <p className="font-bold uppercase tracking-widest text-slate-600 mb-2">Gracias por su preferencia</p>
            <p>Esta proforma tiene una validez de 15 días naturales a partir de la fecha de emisión.</p>
            <p>Precios sujetos a cambio sin previo aviso. Los productos en esta proforma no se reservan hasta confirmar el pago.</p>
            <p className="mt-4 font-black text-slate-800">WWW.OMNIHUB.COM</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Componente Principal de Modales ──────────────────────────────────────────
export function POSModals({ pos }) {
  const {
    modalVariantes, setModalVariantes, agregarVariante,
    modalPago, setModalPago, total, gruposIva, pagos, setPagos, totalPagado, cambio, faltaPagar, confirmarVenta, enviando,
    modalCliente, setModalCliente, clienteId, clienteNombre, setClienteId, setClienteNombre, busquedaCliente, realizarBusquedaCliente, resultadosCliente, seleccionarCliente, mostrarCrearCliente, setMostrarCrearCliente,
    modalComprobante, setModalComprobante, searchRef,
    modalEspera, setModalEspera, enEspera, recuperarEspera, setEnEspera,
    modalProforma, setModalProforma
  } = pos

  return (
    <>
      {/* Estilos para impresión */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .proforma-print-area { 
            max-height: none !important; 
            overflow: visible !important; 
            padding: 0 !important;
          }
          body * { visibility: hidden; }
          .proforma-print-area, .proforma-print-area * { visibility: visible; }
          .proforma-print-area { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
          }
        }
      `}</style>

      {/* Modal: Proforma */}
      <ModalProforma proforma={modalProforma} onClose={() => setModalProforma(null)} />

      {/* Modal: Variantes */}
      <Dialog open={!!modalVariantes} onOpenChange={() => setModalVariantes(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-lg">{modalVariantes?.nombre} — Seleccionar variante</DialogTitle></DialogHeader>
          <VariantesSelector producto={modalVariantes} onSeleccionar={(v) => agregarVariante(modalVariantes, v)} />
        </DialogContent>
      </Dialog>

      {/* Modal: Pago */}
      <Dialog open={modalPago} onOpenChange={setModalPago}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-slate-50">
          <div className="bg-white px-6 py-4 border-b">
            <DialogHeader><DialogTitle className="text-xl font-bold">Registrar Cobro</DialogTitle></DialogHeader>
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* Total prominente */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-center shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              <p className="text-xs text-slate-400 mb-2 uppercase tracking-widest font-semibold">Total a cobrar</p>
              <p className="text-5xl font-black text-white">{formatCurrency(total)}</p>
            </div>

            {/* Métodos de pago */}
            <div className="space-y-4">
              {pagos.map((pago, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 relative">
                  {pagos.length > 1 && (
                    <button onClick={() => setPagos(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 transition-colors">
                      <X size={14} />
                    </button>
                  )}
                  <div className="flex gap-3 items-center">
                    <Select value={pago.metodoPago} onValueChange={v => setPagos(prev => prev.map((p, idx) => idx === i ? { ...p, metodoPago: v, referenciaPago: '' } : p))}>
                      <SelectTrigger className="w-40 shrink-0 bg-slate-50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {METODOS_PAGO.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₡</span>
                      <Input type="number" min="0" placeholder="Monto" value={pago.monto} onChange={e => setPagos(prev => prev.map((p, idx) => idx === i ? { ...p, monto: e.target.value } : p))} className="pl-7 font-semibold text-lg" />
                    </div>
                  </div>

                  {/* Botones rápidos efectivo */}
                  {pago.metodoPago === 'EFECTIVO' && (
                    <div className="flex flex-wrap gap-2">
                      {MONTOS_RAPIDOS.map(m => (
                        <button key={m} onClick={() => setPagos(prev => prev.map((p, idx) => idx === i ? { ...p, monto: String(m) } : p))}
                          className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-800 rounded-lg font-semibold transition-colors">
                          {formatCurrency(m)}
                        </button>
                      ))}
                      <button onClick={() => setPagos(prev => prev.map((p, idx) => idx === i ? { ...p, monto: String(Math.ceil(total / 1000) * 1000) } : p))}
                        className="text-xs px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg font-semibold transition-colors">
                        Exacto
                      </button>
                    </div>
                  )}

                  {/* Referencia */}
                  {['SINPE', 'DATAFONO', 'TRANSFERENCIA'].includes(pago.metodoPago) && (
                    <Input placeholder={pago.metodoPago === 'SINPE' ? 'Número de confirmación SINPE…' : pago.metodoPago === 'DATAFONO' ? 'Últimos 4 dígitos o referencia…' : 'Número de transferencia…'}
                      value={pago.referenciaPago} onChange={e => setPagos(prev => prev.map((p, idx) => idx === i ? { ...p, referenciaPago: e.target.value } : p))} className="text-sm bg-slate-50" />
                  )}
                </div>
              ))}

              <button onClick={() => setPagos(prev => [...prev, { metodoPago: 'EFECTIVO', monto: '', referenciaPago: '' }])} className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline px-1">
                + Agregar método de pago
              </button>
            </div>

            {/* Resumen */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Total pagado</span>
                <span className={totalPagado >= total ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{formatCurrency(totalPagado)}</span>
              </div>
              
              {cambio > 0 && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center shadow-inner">
                  <p className="text-xs text-green-700 font-bold uppercase tracking-wide mb-1">Cambio a devolver</p>
                  <p className="text-3xl font-black text-green-700">{formatCurrency(cambio)}</p>
                </div>
              )}
              
              {faltaPagar > 0 && (
                <div className="flex justify-between text-red-500 text-sm mt-2 pt-2 border-t border-slate-100">
                  <span className="font-medium">Falta cubrir</span><span className="font-bold">{formatCurrency(faltaPagar)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white px-6 py-4 border-t flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setModalPago(false)}>Cancelar</Button>
            <Button className="flex-1 text-base font-bold" onClick={confirmarVenta} disabled={enviando || faltaPagar > 0}>
              {enviando ? 'Registrando…' : 'Confirmar venta'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Cliente */}
      <Dialog open={modalCliente} onOpenChange={v => { setModalCliente(v); if (!v) setMostrarCrearCliente(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Asociar cliente a la venta</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {clienteId && (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 shadow-sm">
                <span className="text-blue-800 font-bold">{clienteNombre}</span>
                <button onClick={() => { setClienteId(null); setClienteNombre('') }} className="text-blue-400 hover:text-red-500 bg-white p-1 rounded-full shadow-sm transition-colors">
                  <X size={16} />
                </button>
              </div>
            )}

            <Input placeholder="Buscar por nombre, cédula o teléfono…" value={busquedaCliente} onChange={e => realizarBusquedaCliente(e.target.value)} autoFocus={!mostrarCrearCliente} className="h-11" />

            {resultadosCliente.length > 0 && !mostrarCrearCliente && (
              <div className="border border-slate-200 rounded-xl divide-y max-h-60 overflow-y-auto shadow-sm">
                {resultadosCliente.map(c => (
                  <button key={c.id} onClick={() => seleccionarCliente(c)} className="w-full flex items-start gap-3 px-4 py-3 hover:bg-blue-50 text-left transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      <UserPlus size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 group-hover:text-blue-800">{c.nombreCompleto}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{c.telefono ?? c.cedula ?? 'Sin datos extra'}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!mostrarCrearCliente && (
              <button onClick={() => setMostrarCrearCliente(true)} className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 py-3 border-2 border-dashed border-blue-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all">
                <UserPlus size={18} /> Crear nuevo cliente
              </button>
            )}

            <ModalCrearCliente open={mostrarCrearCliente} onClose={() => setMostrarCrearCliente(false)} onCreado={seleccionarCliente} />

            {!mostrarCrearCliente && <p className="text-xs text-slate-400 text-center font-medium pt-2">El cliente es opcional en ventas inmediatas</p>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Comprobante (Factura) */}
      <Dialog open={!!modalComprobante} onOpenChange={() => setModalComprobante(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white">
          <div className="no-print">
            <div className="bg-green-600 text-white px-6 py-4 flex items-center justify-between">
              <DialogHeader><DialogTitle className="text-xl font-bold flex items-center gap-2">✓ Venta Confirmada</DialogTitle></DialogHeader>
              <div className="flex gap-2">
                <Button onClick={() => window.print()} className="bg-white text-green-700 hover:bg-green-50 font-bold">
                  <Printer size={18} className="mr-2" /> Imprimir Recibo
                </Button>
                <Button variant="ghost" onClick={() => setModalComprobante(null)} className="text-white hover:bg-white/10 p-2 h-auto">
                  <X size={20} />
                </Button>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white proforma-print-area">
            {/* Header Mini Factura */}
            <div className="text-center border-b pb-6 mb-6">
              <h2 className="text-2xl font-black text-slate-900">OMNIHUB</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Comprobante de Venta</p>
              <div className="flex justify-center gap-4 mt-4 text-[11px] font-bold text-slate-400 uppercase">
                <span>No. {modalComprobante?.numeroVenta}</span>
                <span>•</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-6 text-sm">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cliente</p>
                <p className="font-bold text-slate-800">{modalComprobante?.cliente?.nombreCompleto || 'Cliente Contado'}</p>
                {modalComprobante?.cliente?.cedula && <p className="text-xs text-slate-500">ID: {modalComprobante.cliente.cedula}</p>}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vendedor</p>
                <p className="font-bold text-slate-800">{pos.usuario?.nombre} {pos.usuario?.apellido}</p>
              </div>
            </div>

            <table className="w-full text-sm mb-6">
              <thead className="border-b">
                <tr className="text-[10px] font-black text-slate-400 uppercase">
                  <th className="py-2 text-left">Cant.</th>
                  <th className="py-2 text-left">Producto</th>
                  <th className="py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {modalComprobante?.detalles?.map((d, i) => (
                  <tr key={i}>
                    <td className="py-3 font-bold text-slate-900">{d.cantidad}</td>
                    <td className="py-3 text-slate-700">{d.producto?.nombre || d.variante?.producto?.nombre || 'Producto'}</td>
                    <td className="py-3 text-right font-bold text-slate-900">{formatCurrency(d.precioUnitario * d.cantidad)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-bold">Subtotal</span>
                <span className="font-bold text-slate-900">{formatCurrency(modalComprobante?.subtotal || modalComprobante?.total)}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-900 text-white px-4 py-3 rounded-lg mt-4">
                <span className="text-xs font-black uppercase tracking-widest">Total Pagado</span>
                <span className="text-xl font-black">{formatCurrency(modalComprobante?.total)}</span>
              </div>
            </div>

            <div className="mt-8 text-center no-print">
              <Button className="w-full bg-slate-900 hover:bg-slate-800 font-bold py-6 text-lg rounded-xl" onClick={() => { setModalComprobante(null); searchRef.current?.focus() }}>
                Finalizar y Nueva Venta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Ventas en espera (Parking) */}
      <Dialog open={modalEspera} onOpenChange={setModalEspera}>
        <DialogContent className="max-w-md bg-slate-50">
          <div className="bg-white px-6 py-4 border-b">
            <DialogHeader><DialogTitle className="flex items-center gap-2 text-lg"><Clock size={20} className="text-amber-500" /> Ventas en espera</DialogTitle></DialogHeader>
          </div>
          <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
            {enEspera.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Clock size={40} className="mb-3 opacity-20" />
                <p className="text-sm font-medium">No hay ventas pausadas</p>
              </div>
            ) : (
              enEspera.map(item => (
                <div key={item.id} className="flex flex-col border border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm hover:border-amber-300 transition-colors">
                  <div className="px-4 py-3 flex items-center justify-between border-b bg-slate-50">
                    <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><Clock size={12} /> {item.hora}</p>
                    <button onClick={() => setEnEspera(prev => prev.filter(e => e.id !== item.id))} className="text-slate-400 hover:text-red-500 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-base font-bold text-slate-800 mb-0.5">
                        {formatCurrency(item.carrito.reduce((s, l) => s + (l.precioUnitario * l.cantidad) - l.descuentoLinea, 0))}
                      </p>
                      <p className="text-sm text-slate-500 font-medium">
                        {item.clienteNombre || 'Cliente genérico'} · {item.carrito.length} ítem(s)
                      </p>
                    </div>
                    <Button onClick={() => recuperarEspera(item)} className="bg-amber-100 text-amber-800 hover:bg-amber-200 font-bold border border-amber-200 shadow-none">
                      <PlayCircle size={16} className="mr-1.5" /> Recuperar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
