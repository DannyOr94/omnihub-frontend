import { useState, useEffect, useCallback, useRef } from 'react'
import { useForm }     from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z }           from 'zod'
import { toast }       from 'sonner'
import {
  Plus, Search, RefreshCw, BookMarked, AlertTriangle,
  DollarSign, X, ChevronRight, CheckCircle,
} from 'lucide-react'
import { apartadosApi, clientesApi, productosApi } from '../../api/index'
import { useAuth }    from '../../context/AuthContext'
import { Button }     from '../../components/ui/button'
import { Input }      from '../../components/ui/input'
import { Label }      from '../../components/ui/label'
import { Textarea }   from '../../components/ui/textarea'
import { Separator }  from '../../components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '../../components/ui/dialog'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '../../components/ui/select'
import { formatCurrency, formatDate, formatDateTime, colorEstado } from '../../utils'

// ─── Constantes ───────────────────────────────────────────────────────────────
const ESTADOS = ['ACTIVO', 'ABONADO', 'LIQUIDADO', 'VENCIDO', 'CANCELADO']
const ETIQUETAS_ESTADO = {
  ACTIVO: 'Activo', ABONADO: 'Abonado', LIQUIDADO: 'Liquidado',
  VENCIDO: 'Vencido', CANCELADO: 'Cancelado',
}
const METODOS_PAGO = ['EFECTIVO', 'SINPE', 'TRANSFERENCIA', 'DATAFONO', 'NOTA_CREDITO']

// ─── Schemas ─────────────────────────────────────────────────────────────────
const abonoSchema = z.object({
  monto:      z.coerce.number().positive('Monto requerido'),
  metodoPago: z.string().min(1, 'Selecciona un método'),
  observaciones: z.string().optional(),
})

const cancelarSchema = z.object({
  motivo: z.string().min(5, 'Mínimo 5 caracteres').max(300),
})

// ─── Campo helper ─────────────────────────────────────────────────────────────
function Campo({ label, error, children, required }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ─── Badge de estado ─────────────────────────────────────────────────────────
function EstadoBadge({ estado }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorEstado(estado)}`}>
      {ETIQUETAS_ESTADO[estado] ?? estado}
    </span>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ApartadosPage() {
  const { esAdmin, esVendedor } = useAuth()

  // Lista
  const [apartados,   setApartados]   = useState([])
  const [total,       setTotal]       = useState(0)
  const [pagina,      setPagina]      = useState(1)
  const [cargando,    setCargando]    = useState(true)
  const [filtroEstado,setFiltroEstado]= useState('')
  const [soloVencidos,setSoloVencidos]= useState(false)

  // Detalle
  const [detalle,     setDetalle]     = useState(null)
  const [cargandoDet, setCargandoDet] = useState(false)

  // Modales
  const [modalCrear,   setModalCrear]   = useState(false)
  const [modalAbono,   setModalAbono]   = useState(false)
  const [modalCancelar,setModalCancelar]= useState(false)
  const [enviando,     setEnviando]     = useState(false)

  // Datos auxiliares para creación
  const [busqCliente, setBusqCliente] = useState('')
  const [clientes,    setClientes]    = useState([])
  const [clienteSelec,setClienteSelec]= useState(null)
  const [lineas,      setLineas]      = useState([{ descripcionItem: '', cantidad: 1, precioUnitario: 0, productoId: null, varianteId: null }])
  const [busqProd,    setBusqProd]    = useState({})
  const [resultsProd, setResultsProd] = useState({})
  const [fechaVenc,   setFechaVenc]   = useState('')
  const [abonoInicial,setAbonoInicial]= useState(0)
  const [metodoPagoInicial, setMetodoPagoInicial] = useState('EFECTIVO')
  const [obsCrear,    setObsCrear]    = useState('')

  // Forms
  const formAbono   = useForm({ resolver: zodResolver(abonoSchema) })
  const formCancelar = useForm({ resolver: zodResolver(cancelarSchema) })

  // ─── Cargar lista ──────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const res = await apartadosApi.listar({
        estado:   filtroEstado || undefined,
        vencidos: soloVencidos ? 'true' : undefined,
        page:     pagina,
        limit:    20,
      })
      setApartados(res.data.data?.apartados ?? [])
      setTotal(res.data.data?.total ?? 0)
    } catch { toast.error('Error al cargar apartados') }
    finally  { setCargando(false) }
  }, [filtroEstado, soloVencidos, pagina])

  useEffect(() => { cargar() }, [cargar])

  // ─── Cargar detalle ────────────────────────────────────────────────────────
  async function verDetalle(id) {
    setCargandoDet(true)
    setDetalle(null)
    try {
      const res = await apartadosApi.obtener(id)
      setDetalle(res.data.data)
    } catch { toast.error('Error al cargar apartado') }
    finally  { setCargandoDet(false) }
  }

  // ─── Buscar clientes ───────────────────────────────────────────────────────
  async function buscarClientes(q) {
    setBusqCliente(q)
    if (!q.trim()) { setClientes([]); return }
    try {
      const res = await clientesApi.buscar(q)
      setClientes(res.data.data?.clientes ?? [])
    } catch { setClientes([]) }
  }

  // ─── Buscar productos para líneas ──────────────────────────────────────────
  async function buscarProducto(idx, q) {
    setBusqProd(p => ({ ...p, [idx]: q }))
    if (!q.trim()) { setResultsProd(p => ({ ...p, [idx]: [] })); return }
    try {
      const res = await productosApi.listar({ busqueda: q, soloActivos: true })
      const lista = (res.data.data ?? []).filter(p => !p.usaVariantes)
      setResultsProd(p => ({ ...p, [idx]: lista }))
    } catch { setResultsProd(p => ({ ...p, [idx]: [] })) }
  }

  function seleccionarProductoLinea(idx, prod) {
    setLineas(prev => prev.map((l, i) => i === idx
      ? { ...l, productoId: prod.id, varianteId: null, descripcionItem: prod.nombre, precioUnitario: Number(prod.precioVenta) }
      : l
    ))
    setBusqProd(p => ({ ...p, [idx]: prod.nombre }))
    setResultsProd(p => ({ ...p, [idx]: [] }))
  }

  // ─── Gestión de líneas ────────────────────────────────────────────────────
  function agregarLinea() {
    setLineas(prev => [...prev, { descripcionItem: '', cantidad: 1, precioUnitario: 0, productoId: null, varianteId: null }])
  }

  function actualizarLinea(idx, campo, valor) {
    setLineas(prev => prev.map((l, i) => i === idx ? { ...l, [campo]: valor } : l))
  }

  function eliminarLinea(idx) {
    setLineas(prev => prev.filter((_, i) => i !== idx))
  }

  const subtotal = lineas.reduce((s, l) => s + (Number(l.precioUnitario) * Number(l.cantidad)), 0)

  // ─── Crear apartado ────────────────────────────────────────────────────────
  async function onCrear() {
    if (!clienteSelec) { toast.warning('Selecciona un cliente'); return }
    if (!fechaVenc)    { toast.warning('Indica la fecha de vencimiento'); return }
    if (lineas.some(l => !l.descripcionItem.trim())) { toast.warning('Completa todos los ítems'); return }

    setEnviando(true)
    try {
      await apartadosApi.crear({
        clienteId:       clienteSelec.id,
        fechaVencimiento: new Date(fechaVenc).toISOString(),
        abonoInicial:    Number(abonoInicial) || 0,
        metodoPagoAbono: Number(abonoInicial) > 0 ? metodoPagoInicial : null,
        observaciones:   obsCrear || null,
        detalles: lineas.map(l => ({
          productoId:     l.productoId ?? null,
          varianteId:     l.varianteId ?? null,
          descripcionItem: l.descripcionItem,
          cantidad:       Number(l.cantidad),
          precioUnitario: Number(l.precioUnitario),
        })),
      })
      toast.success('Apartado creado correctamente')
      setModalCrear(false)
      resetCrear()
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error al crear apartado')
    } finally { setEnviando(false) }
  }

  function resetCrear() {
    setClienteSelec(null)
    setBusqCliente('')
    setClientes([])
    setLineas([{ descripcionItem: '', cantidad: 1, precioUnitario: 0, productoId: null, varianteId: null }])
    setBusqProd({})
    setResultsProd({})
    setFechaVenc('')
    setAbonoInicial(0)
    setObsCrear('')
  }

  // ─── Registrar abono ──────────────────────────────────────────────────────
  async function onAbono(datos) {
    setEnviando(true)
    try {
      await apartadosApi.abonar(detalle.id, datos)
      toast.success('Abono registrado')
      setModalAbono(false)
      formAbono.reset()
      verDetalle(detalle.id)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error')
    } finally { setEnviando(false) }
  }

  // ─── Cancelar apartado ────────────────────────────────────────────────────
  async function onCancelar(datos) {
    setEnviando(true)
    try {
      await apartadosApi.cancelar(detalle.id, datos.motivo)
      toast.success('Apartado cancelado y stock liberado')
      setModalCancelar(false)
      formCancelar.reset()
      verDetalle(detalle.id)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error')
    } finally { setEnviando(false) }
  }

  const puedeAbonar  = detalle && ['ACTIVO', 'ABONADO'].includes(detalle.estadoApartado)
  const puedeCancelar = detalle && esAdmin && ['ACTIVO', 'ABONADO'].includes(detalle.estadoApartado)

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-4 h-[calc(100vh-7rem)]">

      {/* ── Lista ─────────────────────────────────────────────────────────── */}
      <div className="w-80 shrink-0 flex flex-col bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <BookMarked size={15} /> Apartados
            </h1>
            {(esAdmin || esVendedor) && (
              <Button size="sm" onClick={() => setModalCrear(true)} className="h-7 text-xs px-2">
                <Plus size={13} className="mr-1" /> Nuevo
              </Button>
            )}
          </div>

          {/* Filtros */}
          <Select value={filtroEstado} onValueChange={v => { setFiltroEstado(v === 'TODOS' ? '' : v); setPagina(1) }}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los estados</SelectItem>
              {ESTADOS.map(e => <SelectItem key={e} value={e}>{ETIQUETAS_ESTADO[e]}</SelectItem>)}
            </SelectContent>
          </Select>

          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={soloVencidos}
              onChange={e => { setSoloVencidos(e.target.checked); setPagina(1) }}
              className="rounded"
            />
            Solo vencidos
          </label>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {cargando ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="px-4 py-3 space-y-1.5">
                <div className="h-3.5 bg-slate-100 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
              </div>
            ))
          ) : apartados.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">Sin apartados</p>
          ) : (
            apartados.map(a => {
              const vencido = a.estadoApartado === 'ACTIVO' && new Date(a.fechaVencimiento) < new Date()
              return (
                <button
                  key={a.id}
                  onClick={() => verDetalle(a.id)}
                  className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors ${detalle?.id === a.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-400">{a.numeroApartado}</p>
                      <p className="text-sm font-medium text-slate-800 truncate">{a.cliente?.nombreCompleto}</p>
                      <p className="text-xs text-slate-400">Vence: {formatDate(a.fechaVencimiento)}</p>
                    </div>
                    <EstadoBadge estado={vencido ? 'VENCIDO' : a.estadoApartado} />
                  </div>
                  <div className="flex justify-between mt-1.5 text-xs">
                    <span className="text-slate-400">Total: {formatCurrency(a.subtotal)}</span>
                    {Number(a.saldo) > 0 && (
                      <span className="text-red-500 font-medium">Saldo: {formatCurrency(a.saldo)}</span>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>

        {total > 20 && (
          <div className="px-4 py-2 border-t flex items-center justify-between text-xs text-slate-400">
            <button onClick={() => setPagina(p => Math.max(1, p-1))} disabled={pagina === 1} className="hover:text-slate-700 disabled:opacity-40">← Ant</button>
            <span>Pág {pagina} · {total}</span>
            <button onClick={() => setPagina(p => p+1)} disabled={pagina * 20 >= total} className="hover:text-slate-700 disabled:opacity-40">Sig →</button>
          </div>
        )}
      </div>

      {/* ── Detalle ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {cargandoDet ? (
          <div className="bg-white rounded-xl border p-6 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" />)}
          </div>
        ) : !detalle ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300">
            <BookMarked size={48} className="mb-3" />
            <p className="text-slate-400 font-medium">Selecciona un apartado</p>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Header */}
            <div className="bg-white rounded-xl border p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-400">{detalle.numeroApartado}</p>
                  <h2 className="text-lg font-bold text-slate-800 mt-0.5">{detalle.cliente?.nombreCompleto}</h2>
                  <p className="text-sm text-slate-500">
                    Creado: {formatDateTime(detalle.fechaCreacion)} ·
                    Vence: <span className={new Date(detalle.fechaVencimiento) < new Date() && detalle.estadoApartado === 'ACTIVO' ? 'text-red-500 font-medium' : ''}>
                      {formatDate(detalle.fechaVencimiento)}
                    </span>
                  </p>
                </div>
                <EstadoBadge estado={detalle.estadoApartado} />
              </div>

              <div className="flex gap-2 mt-4">
                {(esAdmin || esVendedor) && puedeAbonar && (
                  <Button size="sm" onClick={() => { formAbono.reset(); setModalAbono(true) }}>
                    <DollarSign size={13} className="mr-1" /> Registrar abono
                  </Button>
                )}
                {puedeCancelar && (
                  <Button size="sm" variant="destructive" onClick={() => { formCancelar.reset(); setModalCancelar(true) }}>
                    <X size={13} className="mr-1" /> Cancelar apartado
                  </Button>
                )}
              </div>
            </div>

            {/* Ítems */}
            <div className="bg-white rounded-xl border p-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Productos apartados</h3>
              <div className="divide-y divide-slate-100">
                {detalle.detalles?.map(d => (
                  <div key={d.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <p className="font-medium text-slate-800">{d.descripcionItem}</p>
                      <p className="text-xs text-slate-400">Cant: {d.cantidad} · {formatCurrency(d.precioUnitario)} c/u</p>
                    </div>
                    <span className="font-semibold">{formatCurrency(d.subtotalLinea)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financiero */}
            <div className="bg-white rounded-xl border p-4 space-y-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Financiero</h3>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span>{formatCurrency(detalle.subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Abonado</span><span className="text-green-600">{formatCurrency(detalle.abono)}</span></div>
              <Separator />
              <div className="flex justify-between font-bold"><span>Saldo pendiente</span><span className={Number(detalle.saldo) > 0 ? 'text-red-600' : 'text-green-600'}>{formatCurrency(detalle.saldo)}</span></div>

              {/* Historial de pagos */}
              {detalle.pagos?.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-slate-400 mb-1.5">Abonos registrados</p>
                  {detalle.pagos.map(p => (
                    <div key={p.id} className="flex justify-between text-xs py-1 border-t border-slate-50">
                      <span className="text-slate-500">{p.metodoPago.replace('_', ' ')} · {formatDateTime(p.fechaPago)}</span>
                      <span className="font-medium">{formatCurrency(p.monto)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {detalle.observaciones && (
              <div className="bg-white rounded-xl border p-4 text-sm text-slate-600">
                <p className="text-xs text-slate-400 mb-1">Observaciones</p>
                {detalle.observaciones}
              </div>
            )}

          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL — Crear apartado                                              */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={modalCrear} onOpenChange={v => { if (!v) resetCrear(); setModalCrear(v) }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo apartado</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Cliente */}
            <Campo label="Cliente" required>
              {clienteSelec ? (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded px-3 py-2 text-sm">
                  <span className="font-medium text-blue-800">{clienteSelec.nombreCompleto}</span>
                  <button onClick={() => { setClienteSelec(null); setBusqCliente('') }} className="text-blue-400 hover:text-red-500"><X size={14}/></button>
                </div>
              ) : (
                <>
                  <Input placeholder="Buscar cliente…" value={busqCliente} onChange={e => buscarClientes(e.target.value)} />
                  {clientes.length > 0 && (
                    <div className="border rounded-lg divide-y mt-1 max-h-32 overflow-y-auto">
                      {clientes.map(c => (
                        <button type="button" key={c.id} onClick={() => { setClienteSelec(c); setBusqCliente(''); setClientes([]) }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50">
                          {c.nombreCompleto} · {c.telefono ?? '—'}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </Campo>

            {/* Fecha vencimiento */}
            <Campo label="Fecha de vencimiento" required>
              <Input type="date" value={fechaVenc} onChange={e => setFechaVenc(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </Campo>

            {/* Líneas de productos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Productos a apartar</Label>
                <button type="button" onClick={agregarLinea} className="text-xs text-blue-600 hover:underline">+ Agregar línea</button>
              </div>

              {lineas.map((linea, idx) => (
                <div key={idx} className="border rounded-lg p-3 space-y-2 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Ítem {idx + 1}</span>
                    {lineas.length > 1 && (
                      <button type="button" onClick={() => eliminarLinea(idx)} className="text-red-400 hover:text-red-600"><X size={13} /></button>
                    )}
                  </div>

                  {/* Buscador de producto */}
                  <Input
                    placeholder="Buscar producto o escribir descripción libre…"
                    value={busqProd[idx] ?? linea.descripcionItem}
                    onChange={e => {
                      actualizarLinea(idx, 'descripcionItem', e.target.value)
                      buscarProducto(idx, e.target.value)
                    }}
                    className="bg-white"
                  />
                  {(resultsProd[idx] ?? []).length > 0 && (
                    <div className="border rounded divide-y max-h-28 overflow-y-auto bg-white">
                      {(resultsProd[idx] ?? []).map(p => (
                        <button type="button" key={p.id} onClick={() => seleccionarProductoLinea(idx, p)}
                          className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50 flex justify-between">
                          <span>{p.nombre}</span>
                          <span className="text-slate-400">Stock libre: {p.stockActual - p.stockReservado}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Cantidad</Label>
                      <Input type="number" min="1" value={linea.cantidad} onChange={e => actualizarLinea(idx, 'cantidad', e.target.value)} className="bg-white h-8" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Precio unitario (₡)</Label>
                      <Input type="number" min="0" value={linea.precioUnitario} onChange={e => actualizarLinea(idx, 'precioUnitario', e.target.value)} className="bg-white h-8" />
                    </div>
                  </div>
                </div>
              ))}

              {/* Subtotal */}
              <div className="flex justify-end text-sm font-semibold text-slate-800 pr-1">
                Total: {formatCurrency(subtotal)}
              </div>
            </div>

            {/* Abono inicial */}
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Abono inicial (₡)">
                <Input type="number" min="0" step="500" value={abonoInicial} onChange={e => setAbonoInicial(e.target.value)} />
              </Campo>
              {Number(abonoInicial) > 0 && (
                <Campo label="Método de pago abono">
                  <Select value={metodoPagoInicial} onValueChange={setMetodoPagoInicial}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {METODOS_PAGO.map(m => <SelectItem key={m} value={m}>{m.replace('_', ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Campo>
              )}
            </div>

            <Campo label="Observaciones">
              <Textarea rows={2} value={obsCrear} onChange={e => setObsCrear(e.target.value)} />
            </Campo>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => { setModalCrear(false); resetCrear() }}>Cancelar</Button>
            <Button onClick={onCrear} disabled={enviando}>
              {enviando ? 'Guardando…' : `Crear apartado · ${formatCurrency(subtotal)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL — Abono                                                       */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={modalAbono} onOpenChange={setModalAbono}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Registrar abono</DialogTitle></DialogHeader>
          <form onSubmit={formAbono.handleSubmit(onAbono)} className="space-y-4 pt-1">
            <div className="bg-slate-50 rounded p-3 text-sm border text-center">
              <p className="text-slate-500 text-xs">Saldo pendiente</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(detalle?.saldo ?? 0)}</p>
            </div>
            <Campo label="Monto (₡)" error={formAbono.formState.errors.monto?.message}>
              <Input type="number" min="0" step="500" {...formAbono.register('monto')} />
            </Campo>
            <Campo label="Método de pago" error={formAbono.formState.errors.metodoPago?.message}>
              <Select onValueChange={v => formAbono.setValue('metodoPago', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                <SelectContent>
                  {METODOS_PAGO.map(m => <SelectItem key={m} value={m}>{m.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </Campo>
            <Campo label="Observaciones">
              <Input {...formAbono.register('observaciones')} />
            </Campo>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setModalAbono(false)}>Cancelar</Button>
              <Button type="submit" disabled={enviando}>{enviando ? 'Registrando…' : 'Confirmar abono'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL — Cancelar                                                    */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={modalCancelar} onOpenChange={setModalCancelar}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Cancelar apartado</DialogTitle></DialogHeader>
          <form onSubmit={formCancelar.handleSubmit(onCancelar)} className="space-y-4 pt-1">
            <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2.5">
              <AlertTriangle size={14} className="shrink-0" />
              El stock reservado se liberará automáticamente.
            </div>
            <Campo label="Motivo de cancelación" error={formCancelar.formState.errors.motivo?.message}>
              <Textarea rows={3} {...formCancelar.register('motivo')} />
            </Campo>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setModalCancelar(false)}>Volver</Button>
              <Button variant="destructive" type="submit" disabled={enviando}>
                {enviando ? 'Cancelando…' : 'Confirmar cancelación'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
