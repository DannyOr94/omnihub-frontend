import { useState, useEffect, useCallback } from 'react'
import { useForm }     from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z }           from 'zod'
import { toast }       from 'sonner'
import {
  Plus, RefreshCw, ClipboardList, ArrowRight,
  DollarSign, X, AlertTriangle, Search, Calendar, Truck,
  Tag, Clock, User, CheckCircle2, ShoppingBag, Eye
} from 'lucide-react'
import { pedidosApi, clientesApi, productosApi } from '../../api/index'
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
import { formatCurrency, formatDate, formatDateTime } from '../../utils'

// ─── Constantes de Estado ───────────────────────────────────────────────────
const ESTADOS = ['RECIBIDO', 'EN_PREPARACION', 'ENVIADO', 'ENTREGADO', 'CANCELADO']

const ETIQUETAS = {
  RECIBIDO:       'Recibido',
  EN_PREPARACION: 'En preparación',
  ENVIADO:        'Enviado',
  ENTREGADO:      'Entregado',
  CANCELADO:      'Cancelado',
}

const PEDIDO_COLORES = {
  RECIBIDO:       'bg-blue-50 text-blue-700 border-blue-200',
  EN_PREPARACION: 'bg-amber-50 text-amber-700 border-amber-200',
  ENVIADO:        'bg-purple-50 text-purple-700 border-purple-200',
  ENTREGADO:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELADO:      'bg-rose-50 text-rose-700 border-rose-200',
}

const TRANSICIONES = {
  RECIBIDO:       ['EN_PREPARACION', 'CANCELADO'],
  EN_PREPARACION: ['ENVIADO', 'CANCELADO'],
  ENVIADO:        ['ENTREGADO', 'CANCELADO'],
  ENTREGADO:      [],
  CANCELADO:      [],
}

// ─── Schemas abono / cancelación ─────────────────────────────────────────────
const abonoSchema = z.object({
  monto: z.coerce.number().positive('Monto requerido'),
  observaciones: z.string().optional(),
})

const cancelarSchema = z.object({
  motivo: z.string().min(5, 'Mínimo 5 caracteres').max(300),
})

function Campo({ label, error, children, required }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
}

function EstadoBadge({ estado }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${PEDIDO_COLORES[estado] ?? 'bg-slate-50 text-slate-700'}`}>
      {ETIQUETAS[estado] ?? estado}
    </span>
  )
}

export default function PedidosPage() {
  const { esAdmin, esVendedor } = useAuth()

  const [pedidos,      setPedidos]      = useState([])
  const [total,        setTotal]        = useState(0)
  const [pagina,       setPagina]       = useState(1)
  const [cargando,     setCargando]     = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroTipo,   setFiltroTipo]   = useState('')
  const [detalle,      setDetalle]      = useState(null)
  const [cargandoDet,  setCargandoDet]  = useState(false)

  const [modalCrear,    setModalCrear]   = useState(false)
  const [modalEstado,   setModalEstado]  = useState(false)
  const [modalAbono,    setModalAbono]   = useState(false)
  const [modalCancelar, setModalCancelar]= useState(false)
  const [enviando,      setEnviando]     = useState(false)

  // Datos creación
  const [tipoPedido,   setTipoPedido]   = useState('ESPECIAL') // REGULAR o ESPECIAL
  const [busqCliente,  setBusqCliente]  = useState('')
  const [clientes,     setClientes]     = useState([])
  const [clienteSelec, setClienteSelec] = useState(null)
  const [costoEnvio,   setCostoEnvio]   = useState(0)
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [abonoInicial, setAbonoInicial] = useState(0)
  const [obsCrear,     setObsCrear]     = useState('')
  const [lineas,       setLineas]       = useState([
    {
      productoId: null,
      varianteId: null,
      descripcionSolicitada: '',
      cantidad: 1,
      talla: '',
      color: '',
      precioEstimado: '',
      searchTerm: '',
      results: [],
      usaVariantes: false,
      variantsList: [],
    }
  ])

  // Estado cambio
  const [nuevoEstado,  setNuevoEstado]  = useState('')
  const [obsEstado,    setObsEstado]    = useState('')

  const formAbono   = useForm({ resolver: zodResolver(abonoSchema) })
  const formCancelar= useForm({ resolver: zodResolver(cancelarSchema) })

  // ─── Urgencia/Atraso checker ──────────────────────────────────────────────
  const esAtrasado = useCallback((p) => {
    if (!p.fechaEntregaProg) return false
    if (['ENTREGADO', 'CANCELADO'].includes(p.estadoActual)) return false
    return new Date(p.fechaEntregaProg) < new Date()
  }, [])

  // ─── Cargar ────────────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const res = await pedidosApi.listar({
        estado: filtroEstado || undefined,
        tipo:   filtroTipo || undefined,
        page:   pagina,
        limit:  20
      })
      setPedidos(res.data.data?.pedidos ?? [])
      setTotal(res.data.data?.total ?? 0)
    } catch {
      toast.error('Error al cargar pedidos')
    } finally {
      setCargando(false)
    }
  }, [filtroEstado, filtroTipo, pagina])

  useEffect(() => { cargar() }, [cargar])

  async function verDetalle(id) {
    setCargandoDet(true)
    setDetalle(null)
    try {
      const res = await pedidosApi.obtener(id)
      setDetalle(res.data.data)
    } catch {
      toast.error('Error al cargar pedido')
    } finally {
      setCargandoDet(false)
    }
  }

  // ─── Buscar clientes ────────────────────────────────────────────────────────
  async function buscarClientes(q) {
    setBusqCliente(q)
    if (!q.trim()) { setClientes([]); return }
    try {
      const res = await clientesApi.buscar(q)
      setClientes(res.data.data ?? [])
    } catch {
      setClientes([])
    }
  }

  // ─── Buscar productos para Pedido Regular ────────────────────────────────────
  async function buscarProductos(index, query) {
    setLineas(prev => prev.map((l, idx) => idx === index ? { ...l, searchTerm: query } : l))
    if (!query.trim()) {
      setLineas(prev => prev.map((l, idx) => idx === index ? { ...l, results: [] } : l))
      return
    }
    try {
      const res = await productosApi.listar({ busqueda: query, soloActivos: true })
      setLineas(prev => prev.map((l, idx) => idx === index ? { ...l, results: res.data.data ?? [] } : l))
    } catch {
      // ignore
    }
  }

  async function seleccionarProducto(index, prod) {
    let variants = []
    if (prod.usaVariantes) {
      try {
        const res = await productosApi.obtener(prod.id)
        variants = res.data.data?.variantes ?? []
      } catch {
        toast.error('Error al cargar variantes del producto')
      }
    }

    setLineas(prev => prev.map((l, idx) => {
      if (idx === index) {
        return {
          ...l,
          productoId:            prod.id,
          varianteId:            null,
          descripcionSolicitada: prod.nombre,
          precioEstimado:        prod.precio ?? 0,
          talla:                 '',
          color:                 '',
          usaVariantes:          prod.usaVariantes,
          variantsList:          variants,
          searchTerm:            prod.nombre,
          results:               [],
        }
      }
      return l
    }))
  }

  function seleccionarVariante(index, variantId) {
    setLineas(prev => prev.map((l, idx) => {
      if (idx === index) {
        const variant = l.variantsList?.find(v => v.id === Number(variantId))
        if (variant) {
          return {
            ...l,
            varianteId:     variant.id,
            talla:          variant.talla || '',
            color:          variant.color || '',
            precioEstimado: variant.precio ?? l.precioEstimado,
          }
        }
      }
      return l
    }))
  }

  // ─── Crear Pedido ───────────────────────────────────────────────────────────
  async function onCrear() {
    if (!clienteSelec) { toast.warning('Selecciona un cliente'); return }
    if (lineas.some(l => !l.descripcionSolicitada.trim())) { toast.warning('Completa la descripción o producto de todos los ítems'); return }
    setEnviando(true)
    try {
      await pedidosApi.crear({
        clienteId:        clienteSelec.id,
        tipo:             tipoPedido,
        fechaEntregaProg: fechaEntrega ? new Date(fechaEntrega).toISOString() : null,
        costoEnvio:       Number(costoEnvio) || 0,
        abonoInicial:     Number(abonoInicial) || 0,
        observaciones:    obsCrear || null,
        detalles: lineas.map(l => ({
          productoId:            l.productoId,
          varianteId:            l.varianteId,
          descripcionSolicitada: l.descripcionSolicitada,
          cantidad:              Number(l.cantidad),
          talla:                 l.talla || null,
          color:                 l.color || null,
          precioEstimado:        l.precioEstimado ? Number(l.precioEstimado) : null,
        })),
      })
      toast.success('Pedido registrado con éxito')
      setModalCrear(false)
      resetCrear()
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error al guardar pedido')
    } finally { setEnviando(false) }
  }

  function resetCrear() {
    setClienteSelec(null)
    setBusqCliente('')
    setClientes([])
    setTipoPedido('ESPECIAL')
    setCostoEnvio(0)
    setFechaEntrega('')
    setAbonoInicial(0)
    setObsCrear('')
    setLineas([{
      productoId: null,
      varianteId: null,
      descripcionSolicitada: '',
      cantidad: 1,
      talla: '',
      color: '',
      precioEstimado: '',
      searchTerm: '',
      results: [],
      usaVariantes: false,
      variantsList: [],
    }])
  }

  // ─── Cambiar estado ────────────────────────────────────────────────────────
  async function onCambiarEstado() {
    if (!nuevoEstado) { toast.warning('Selecciona un estado'); return }
    setEnviando(true)
    try {
      await pedidosApi.cambiarEstado(detalle.id, { estadoPedido: nuevoEstado, observaciones: obsEstado || null })
      toast.success(`Estado actualizado a ${ETIQUETAS[nuevoEstado]}`)
      setModalEstado(false); setNuevoEstado(''); setObsEstado('')
      verDetalle(detalle.id); cargar()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error')
    } finally { setEnviando(false) }
  }

  // ─── Abono ─────────────────────────────────────────────────────────────────
  async function onAbono(datos) {
    setEnviando(true)
    try {
      await pedidosApi.abonar(detalle.id, datos)
      toast.success('Abono registrado')
      setModalAbono(false); formAbono.reset()
      verDetalle(detalle.id); cargar()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error')
    } finally { setEnviando(false) }
  }

  // ─── Cancelar ──────────────────────────────────────────────────────────────
  async function onCancelar(datos) {
    setEnviando(true)
    try {
      await pedidosApi.cancelar(detalle.id, datos.motivo)
      toast.success('Pedido cancelado')
      setModalCancelar(false); formCancelar.reset()
      verDetalle(detalle.id); cargar()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error')
    } finally { setEnviando(false) }
  }

  const transiciones = TRANSICIONES[detalle?.estadoActual] ?? []
  const puedeAbonar  = detalle && ['RECIBIDO', 'EN_PREPARACION', 'ENVIADO'].includes(detalle.estadoActual)

  return (
    <div className="flex gap-4 h-[calc(100vh-7rem)]">

      {/* ── Lista de Pedidos ────────────────────────────────────────────────── */}
      <div className="w-85 shrink-0 flex flex-col bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 space-y-2.5 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <ClipboardList size={16} className="text-blue-600" /> Control de Pedidos
            </h1>
            {(esAdmin || esVendedor) && (
              <Button size="sm" onClick={() => setModalCrear(true)} className="h-7 text-xs px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                <Plus size={14} className="mr-1" /> Nuevo
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select value={filtroTipo} onValueChange={v => { setFiltroTipo(v === 'ALL' ? '' : v); setPagina(1) }}>
              <SelectTrigger className="h-8 text-xs bg-white border-slate-200"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los tipos</SelectItem>
                <SelectItem value="REGULAR">Regular (Stock)</SelectItem>
                <SelectItem value="ESPECIAL">Especial (A medida)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroEstado} onValueChange={v => { setFiltroEstado(v === 'TODOS' ? '' : v); setPagina(1) }}>
              <SelectTrigger className="h-8 text-xs bg-white border-slate-200"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los estados</SelectItem>
                {ESTADOS.map(e => <SelectItem key={e} value={e}>{ETIQUETAS[e]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {cargando
            ? [...Array(5)].map((_, i) => <div key={i} className="px-4 py-3 space-y-1.5"><div className="h-3.5 bg-slate-100 rounded animate-pulse w-3/4" /><div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" /></div>)
            : pedidos.length === 0
              ? <div className="text-center py-12 px-4"><ClipboardList className="mx-auto text-slate-300 mb-2" size={32} /><p className="text-xs text-slate-400 font-medium">Ningún pedido encontrado</p></div>
              : pedidos.map(p => {
                const delayed = esAtrasado(p)
                return (
                  <button key={p.id} onClick={() => verDetalle(p.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors relative ${detalle?.id === p.id ? 'bg-blue-50/70 border-l-3 border-blue-600' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800">{p.consecutivo}</span>
                          <span className={`text-[10px] font-bold px-1 py-0.2 rounded border ${p.tipo === 'REGULAR' ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-indigo-50 text-indigo-700 border-indigo-150'}`}>
                            {p.tipo === 'REGULAR' ? 'Regular' : 'Especial'}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-700 mt-1 truncate">{p.cliente?.nombreCompleto}</p>
                        <div className="flex flex-wrap gap-x-2 items-center text-xs text-slate-450 mt-1.5">
                          <span className="flex items-center gap-0.5"><Clock size={11} /> {formatDate(p.fechaCreacion)}</span>
                          {p.fechaEntregaProg && (
                            <span className={`flex items-center gap-0.5 ${delayed ? 'text-red-650 font-semibold' : ''}`}>
                              <Calendar size={11} /> Est: {formatDate(p.fechaEntregaProg)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <EstadoBadge estado={p.estadoActual} />
                        {delayed && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-100 text-red-750 border border-red-200 animate-pulse">
                            <AlertTriangle size={10} /> Atrasado
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
          }
        </div>

        {total > 20 && (
          <div className="px-4 py-2 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <button onClick={() => setPagina(p => Math.max(1,p-1))} disabled={pagina===1} className="hover:text-slate-800 disabled:opacity-40 transition-opacity">← Anterior</button>
            <span>Pág {pagina} · {total} pedidos</span>
            <button onClick={() => setPagina(p=>p+1)} disabled={pagina*20>=total} className="hover:text-slate-800 disabled:opacity-40 transition-opacity">Siguiente →</button>
          </div>
        )}
      </div>

      {/* ── Panel de Detalle ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pr-1">
        {cargandoDet ? (
          <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-6 bg-slate-150 w-24 rounded animate-pulse" />
              <div className="h-4 bg-slate-150 w-32 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              {[...Array(4)].map((_,i)=><div key={i} className="h-4 bg-slate-100 rounded animate-pulse"/>)}
            </div>
          </div>
        ) : !detalle ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 border border-dashed rounded-xl p-8 bg-slate-50/30">
            <ClipboardList size={56} className="mb-3 text-slate-300" />
            <p className="text-slate-500 font-semibold text-sm">Selecciona un pedido para visualizar su gestión</p>
          </div>
        ) : (
          <div className="space-y-4 pb-6">

            {/* Alerta de Pedido Atrasado */}
            {esAtrasado(detalle) && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 text-rose-800 shadow-sm">
                <AlertTriangle className="text-rose-600 shrink-0" size={20} />
                <div className="text-xs">
                  <p className="font-bold text-sm">¡Alerta: Pedido Atrasado!</p>
                  <p className="mt-0.5 font-medium">Este pedido debió ser entregado el <b>{formatDate(detalle.fechaEntregaProg)}</b>. Por favor, verifica el estado con el cliente o el departamento logístico.</p>
                </div>
              </div>
            )}

            {/* Tarjeta Principal */}
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3 border-b pb-3.5 border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">{detalle.consecutivo}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${detalle.tipo === 'REGULAR' ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-indigo-50 text-indigo-700 border-indigo-150'}`}>
                      {detalle.tipo === 'REGULAR' ? 'Pedido Regular' : 'Pedido Especial'}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 mt-1">{detalle.cliente?.nombreCompleto}</h2>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500 mt-2 font-medium">
                    <p>Creado: <span className="text-slate-700">{formatDateTime(detalle.fechaCreacion)}</span></p>
                    <p>Por: <span className="text-slate-700">{detalle.usuario?.nombre} {detalle.usuario?.apellido}</span></p>
                    {detalle.fechaEntregaProg && <p>Entrega programada: <span className="text-slate-700 font-bold">{formatDate(detalle.fechaEntregaProg)}</span></p>}
                    <p>Teléfono cliente: <span className="text-slate-700">{detalle.cliente?.telefono ?? '—'}</span></p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5">
                  <EstadoBadge estado={detalle.estadoActual} />
                  {detalle.cliente?.correo && <span className="text-xs text-slate-400">{detalle.cliente.correo}</span>}
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex flex-wrap gap-2 pt-1.5">
                {transiciones.length > 0 && (
                  <Button size="sm" variant="outline" onClick={() => { setNuevoEstado(''); setModalEstado(true) }} className="h-8.5 font-medium border-slate-200 hover:bg-slate-50">
                    <ArrowRight size={14} className="mr-1 text-blue-600" /> Cambiar estado
                  </Button>
                )}
                {(esAdmin || esVendedor) && puedeAbonar && (
                  <Button size="sm" onClick={() => { formAbono.reset(); setModalAbono(true) }} className="h-8.5 bg-blue-600 hover:bg-blue-700 text-white font-medium">
                    <DollarSign size={14} className="mr-1" /> Registrar Abono
                  </Button>
                )}
                {esAdmin && !['ENTREGADO','CANCELADO'].includes(detalle.estadoActual) && (
                  <Button size="sm" variant="destructive" onClick={() => { formCancelar.reset(); setModalCancelar(true) }} className="h-8.5 font-medium bg-red-50 hover:bg-red-100 text-red-600 border border-red-200">
                    <X size={14} className="mr-1" /> Cancelar Pedido
                  </Button>
                )}
              </div>
            </div>

            {/* Stepper del Progreso de Gestión */}
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4.5 flex items-center gap-1.5">
                <Clock size={14} className="text-slate-400" /> Progreso de Gestión
              </h3>

              {detalle.estadoActual === 'CANCELADO' ? (
                <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-lg p-3 text-red-800">
                  <X className="w-5 h-5 text-red-600 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold">PEDIDO CANCELADO</p>
                    <p className="mt-0.5">Este pedido se encuentra anulado. Si era un Pedido Regular, el stock reservado ha sido reintegrado al inventario general.</p>
                  </div>
                </div>
              ) : (
                <div className="relative pt-2 pb-1">
                  {/* Línea conectora */}
                  <div className="absolute top-6 left-5 right-5 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
                  
                  {/* Puntos del Stepper */}
                  <div className="relative z-10 flex justify-between">
                    {['RECIBIDO', 'EN_PREPARACION', 'ENVIADO', 'ENTREGADO'].map((est, i) => {
                      const idxActual = ['RECIBIDO', 'EN_PREPARACION', 'ENVIADO', 'ENTREGADO'].indexOf(detalle.estadoActual)
                      const completado = idxActual >= i
                      const activo = detalle.estadoActual === est

                      // Buscar si tiene registro de historial para mostrar fecha y notas
                      const hist = detalle.historialEstados?.find(h => h.estado === est)

                      return (
                        <div key={est} className="flex flex-col items-center flex-1 group relative">
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                            activo 
                              ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100 ring-4 ring-blue-50' 
                              : completado 
                                ? 'bg-emerald-600 border-emerald-600 text-white' 
                                : 'bg-white border-slate-200 text-slate-400'
                          }`}>
                            {completado && !activo ? (
                              <CheckCircle2 size={16} />
                            ) : (
                              <span className="text-xs font-bold">{i + 1}</span>
                            )}
                          </div>
                          <span className={`text-[11px] font-bold mt-2 ${activo ? 'text-blue-600' : 'text-slate-650'}`}>
                            {ETIQUETAS[est]}
                          </span>
                          {hist && (
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {formatDate(hist.fechaCambio)}
                            </span>
                          )}

                          {/* Tooltip Hover con notas y responsable */}
                          {hist && (
                            <div className="absolute bottom-11 scale-0 group-hover:scale-100 transition-transform origin-bottom bg-slate-900 text-white text-[11px] rounded-lg p-2.5 w-48 shadow-lg z-50 text-center">
                              <p className="font-semibold">{ETIQUETAS[est]}</p>
                              <p className="text-[10px] text-slate-300 mt-0.5">Resp: {hist.responsable?.nombre} {hist.responsable?.apellido}</p>
                              {hist.notas && <p className="text-[10px] text-slate-200 mt-1 italic font-medium">"{hist.notas}"</p>}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Ítems Solicitados */}
            <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                <ShoppingBag size={14} className="text-slate-400" /> Ítems del Pedido
              </h3>
              <div className="divide-y divide-slate-100">
                {detalle.detalles?.map(d => (
                  <div key={d.id} className="py-3 first:pt-1 last:pb-1 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-sm leading-snug">{d.descripcionSolicitada}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400 mt-1 font-medium">
                        <span>Cant: <b className="text-slate-650">{d.cantidad}</b></span>
                        {d.talla && <span>Talla: <b className="text-slate-650">{d.talla}</b></span>}
                        {d.color && <span>Color: <b className="text-slate-650">{d.color}</b></span>}
                        {d.variante?.sku && <span>SKU: <b className="text-slate-650">{d.variante.sku}</b></span>}
                      </div>
                    </div>
                    {d.precioEstimado && (
                      <div className="text-right">
                        <span className="text-xs text-slate-450 font-medium">Precio Unit.</span>
                        <p className="font-bold text-slate-700 text-sm mt-0.5">{formatCurrency(d.precioEstimado)}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Desglose Financiero */}
            <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign size={14} className="text-slate-400" /> Información Económica
              </h3>
              <div className="divide-y divide-slate-100 text-xs text-slate-600 space-y-2">
                <div className="flex justify-between pt-1 font-medium">
                  <span className="text-slate-500">Mano de Obra / Productos</span>
                  <span className="text-slate-800">
                    {formatCurrency(detalle.detalles?.reduce((acc, d) => acc + (Number(d.subtotalEstimado) || 0), 0) ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 font-medium">
                  <span className="text-slate-500">Costo de Envío</span>
                  <span className="text-slate-800">{formatCurrency(detalle.costoEnvio)}</span>
                </div>
                <div className="flex justify-between pt-2 font-medium">
                  <span className="text-slate-500">Abonado a la Fecha</span>
                  <span className="text-emerald-600 font-bold">{formatCurrency(detalle.abono)}</span>
                </div>
                <div className="flex justify-between pt-2 text-sm font-bold border-t border-slate-100">
                  <span className="text-slate-800">Saldo Pendiente</span>
                  <span className={Number(detalle.saldo) > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                    {formatCurrency(detalle.saldo)}
                  </span>
                </div>
              </div>
            </div>

            {/* Observaciones Generales */}
            {detalle.observaciones && (
              <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Historial de Observaciones</p>
                <div className="text-xs text-slate-650 bg-slate-50 rounded-lg p-3 font-medium whitespace-pre-line leading-relaxed">
                  {detalle.observaciones}
                </div>
              </div>
            )}

            {/* Historial de Cambios de Estado Detallado */}
            {detalle.historialEstados && detalle.historialEstados.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                  <Eye size={14} className="text-slate-400" /> Bitácora de Transiciones (Auditoría)
                </h3>
                <div className="space-y-4">
                  {detalle.historialEstados.map((h, i) => (
                    <div key={h.id} className="relative flex gap-3 text-xs">
                      {/* Línea vertical */}
                      {i < detalle.historialEstados.length - 1 && (
                        <div className="absolute left-2.5 top-5 bottom-[-15px] w-0.5 bg-slate-100" />
                      )}
                      
                      {/* Círculo */}
                      <div className="w-5 h-5 rounded-full border border-slate-200 bg-white flex items-center justify-center shrink-0 z-10">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 pb-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-slate-700">Cambio a {ETIQUETAS[h.estado] ?? h.estado}</p>
                          <span className="text-[10px] text-slate-400 font-semibold">{formatDateTime(h.fechaCambio)}</span>
                        </div>
                        <p className="text-[11px] text-slate-450 mt-0.5">Operador: {h.responsable?.nombre} {h.responsable?.apellido}</p>
                        {h.notes || h.notas ? (
                          <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-100 rounded px-2.5 py-1 mt-1.5 italic">
                            "{h.notes || h.notas}"
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL — Crear Pedido */}
      <Dialog open={modalCrear} onOpenChange={v => { if (!v) resetCrear(); setModalCrear(v) }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 text-slate-800">
              <Plus className="text-blue-600" size={18} /> Registrar Nuevo Pedido
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            
            {/* Selección de Tipo de Pedido */}
            <Campo label="Tipo de Pedido" required>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => { setTipoPedido('ESPECIAL'); setLineas([{ productoId: null, varianteId: null, descripcionSolicitada: '', cantidad: 1, talla: '', color: '', precioEstimado: '', searchTerm: '', results: [], usaVariantes: false, variantsList: [] }]) }}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all ${tipoPedido === 'ESPECIAL' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'}`}>
                  Especial (Ropa personalizada / a medida)
                </button>
                <button type="button" onClick={() => { setTipoPedido('REGULAR'); setLineas([{ productoId: null, varianteId: null, descripcionSolicitada: '', cantidad: 1, talla: '', color: '', precioEstimado: '', searchTerm: '', results: [], usaVariantes: false, variantsList: [] }]) }}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all ${tipoPedido === 'REGULAR' ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'}`}>
                  Regular (Stock inmediato / catálogo)
                </button>
              </div>
            </Campo>

            {/* Cliente */}
            <Campo label="Cliente del Pedido" required>
              {clienteSelec ? (
                <div className="flex items-center justify-between bg-blue-50/55 border border-blue-200 rounded-lg px-3 py-2 text-xs">
                  <div className="text-slate-850">
                    <span className="font-bold text-blue-800">{clienteSelec.nombreCompleto}</span>
                    {clienteSelec.telefono && <span className="text-slate-400 block mt-0.5">Tel: {clienteSelec.telefono}</span>}
                  </div>
                  <button onClick={() => { setClienteSelec(null); setBusqCliente('') }} className="text-slate-400 hover:text-rose-600 p-1 transition-colors"><X size={15} /></button>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400"><Search size={14} /></div>
                  <Input placeholder="Buscar por nombre o teléfono de cliente…" value={busqCliente} onChange={e => buscarClientes(e.target.value)} className="pl-9 text-xs" />
                  {clientes.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-36 overflow-y-auto divide-y divide-slate-50">
                      {clientes.map(c => (
                        <button type="button" key={c.id} onClick={() => { setClienteSelec(c); setBusqCliente(''); setClientes([]) }}
                          className="w-full px-3 py-2.5 text-left text-xs hover:bg-slate-50 font-medium text-slate-700 flex justify-between">
                          <span>{c.nombreCompleto}</span>
                          <span className="text-slate-400">{c.telefono ?? 'Sin teléfono'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Campo>

            {/* Detalles de Ítems */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-700">Detalle de Productos</Label>
                <button type="button" onClick={() => setLineas(p => [...p, { productoId: null, varianteId: null, descripcionSolicitada: '', cantidad: 1, talla: '', color: '', precioEstimado: '', searchTerm: '', results: [], usaVariantes: false, variantsList: [] }])}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5">+ Agregar Línea</button>
              </div>
              {lineas.map((l, i) => (
                <div key={i} className="border border-slate-150 rounded-lg p-3 bg-slate-50/50 space-y-2.5 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 tracking-wider">Ítem {i+1}</span>
                    {lineas.length > 1 && (
                      <button type="button" onClick={() => setLineas(p => p.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-650 transition-colors p-1"><X size={14}/></button>
                    )}
                  </div>

                  {tipoPedido === 'REGULAR' ? (
                    /* Look up / Autocomplete para regular */
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-slate-500">Buscar Producto en Catálogo</Label>
                      {l.productoId ? (
                        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs">
                          <span className="font-semibold text-slate-700">{l.descripcionSolicitada}</span>
                          <button type="button" onClick={() => setLineas(prev => prev.map((x, j) => j === i ? { ...x, productoId: null, varianteId: null, descripcionSolicitada: '', precioEstimado: '', talla: '', color: '', usaVariantes: false, variantsList: [], searchTerm: '' } : x))}
                            className="text-rose-500 hover:text-rose-700 p-0.5"><X size={12} /></button>
                        </div>
                      ) : (
                        <div className="relative">
                          <Input placeholder="Escribe el nombre del producto de stock…" value={l.searchTerm} onChange={e => buscarProductos(i, e.target.value)} className="bg-white h-8 text-xs" />
                          {l.results?.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-250 rounded-md shadow-md max-h-32 overflow-y-auto divide-y divide-slate-50 mt-1">
                              {l.results.map(p => (
                                <button type="button" key={p.id} onClick={() => seleccionarProducto(i, p)}
                                  className="w-full px-2.5 py-2 text-left text-xs hover:bg-slate-50 font-semibold text-slate-650 flex justify-between">
                                  <span>{p.nombre}</span>
                                  <span className="text-blue-600">{formatCurrency(p.precio)}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Si usa variantes, selector de variantes */}
                      {l.usaVariantes && l.variantsList?.length > 0 && (
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-500">Seleccionar Variante (Talla/Color)</Label>
                          <Select value={l.varianteId?.toString() || ''} onValueChange={v => seleccionarVariante(i, v)}>
                            <SelectTrigger className="h-8 text-xs bg-white border-slate-200"><SelectValue placeholder="Seleccione variante…" /></SelectTrigger>
                            <SelectContent>
                              {l.variantsList.map(v => (
                                <SelectItem key={v.id} value={v.id.toString()}>
                                  Talla: {v.talla ?? 'N/A'} · Color: {v.color ?? 'N/A'} (Stock: {v.stockActual})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Descripción libre para especial */
                    <Campo label="Descripción del Pedido (Diseño, especificaciones, tela)" required>
                      <Input placeholder="Ej: Vestido infantil celeste con encaje..." value={l.descripcionSolicitada}
                        onChange={e => setLineas(p => p.map((x,j) => j===i ? {...x, descripcionSolicitada: e.target.value} : x))} className="bg-white h-8.5 text-xs" />
                    </Campo>
                  )}

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: 'cantidad',       label: 'Cant.',     type: 'number', disabled: false },
                      { key: 'talla',          label: 'Talla',    type: 'text',   disabled: tipoPedido === 'REGULAR' },
                      { key: 'color',          label: 'Color',    type: 'text',   disabled: tipoPedido === 'REGULAR' },
                      { key: 'precioEstimado', label: 'Precio (₡)', type: 'number', disabled: false },
                    ].map(f => (
                      <div key={f.key} className="space-y-1">
                        <Label className="text-[10px] font-semibold text-slate-550">{f.label}</Label>
                        <Input type={f.type} min={f.type==='number'?'0':undefined} value={l[f.key]} disabled={f.disabled}
                          onChange={e => setLineas(p => p.map((x,j) => j===i ? {...x,[f.key]:e.target.value}:x))}
                          className="bg-white h-8 text-xs disabled:bg-slate-100 disabled:text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Fecha, Envío y Abono */}
            <div className="grid grid-cols-3 gap-3">
              <Campo label="Costo Envío (₡)">
                <Input type="number" min="0" step="500" value={costoEnvio} onChange={e => setCostoEnvio(e.target.value)} className="text-xs" />
              </Campo>
              <Campo label="Abono Inicial (₡)">
                <Input type="number" min="0" step="500" value={abonoInicial} onChange={e => setAbonoInicial(e.target.value)} className="text-xs" />
              </Campo>
              <Campo label="Fecha Entrega">
                <Input type="date" value={fechaEntrega} onChange={e => setFechaEntrega(e.target.value)} className="text-xs" />
              </Campo>
            </div>
            
            <Campo label="Observaciones del Pedido">
              <Textarea rows={2} placeholder="Detalles de logística de entrega, notas especiales..." value={obsCrear} onChange={e => setObsCrear(e.target.value)} className="text-xs" />
            </Campo>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => { setModalCrear(false); resetCrear() }}>Cancelar</Button>
            <Button onClick={onCrear} disabled={enviando} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              {enviando ? 'Guardando…' : 'Crear Pedido'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL — Cambiar Estado */}
      <Dialog open={modalEstado} onOpenChange={setModalEstado}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader><DialogTitle className="text-slate-800 font-bold">Cambiar Estado de Pedido</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Estado actual</p>
              <EstadoBadge estado={detalle?.estadoActual} />
            </div>
            <Campo label="Nuevo Estado" required>
              <Select value={nuevoEstado} onValueChange={setNuevoEstado}>
                <SelectTrigger className="border-slate-200"><SelectValue placeholder="Seleccionar nuevo estado…" /></SelectTrigger>
                <SelectContent>
                  {transiciones.map(e => <SelectItem key={e} value={e}>{ETIQUETAS[e]}</SelectItem>)}
                </SelectContent>
              </Select>
            </Campo>
            <Campo label="Notas del Cambio (Se guardará en la Bitácora)" required>
              <Textarea rows={2} placeholder="Escriba los motivos o detalles relevantes de esta transición..." value={obsEstado} onChange={e => setObsEstado(e.target.value)} className="text-xs" />
            </Campo>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setModalEstado(false)}>Cancelar</Button>
            <Button onClick={onCambiarEstado} disabled={enviando || !nuevoEstado || !obsEstado.trim()} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              {enviando ? 'Procesando…' : 'Confirmar Cambio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL — Registrar Abono */}
      <Dialog open={modalAbono} onOpenChange={setModalAbono}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader><DialogTitle className="text-slate-800 font-bold">Abonar al Pedido</DialogTitle></DialogHeader>
          <form onSubmit={formAbono.handleSubmit(onAbono)} className="space-y-4 pt-2">
            <Campo label="Monto a Abonar (₡)" error={formAbono.formState.errors.monto?.message} required>
              <Input type="number" min="0" step="500" {...formAbono.register('monto')} />
            </Campo>
            <Campo label="Observaciones o Método de Pago">
              <Input placeholder="Ej: Efectivo, comprobante SINPE..." {...formAbono.register('observaciones')} />
            </Campo>
            <DialogFooter className="pt-2">
              <Button variant="outline" type="button" onClick={() => setModalAbono(false)}>Cancelar</Button>
              <Button type="submit" disabled={enviando} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                {enviando ? 'Registrando…' : 'Abonar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL — Cancelar Pedido */}
      <Dialog open={modalCancelar} onOpenChange={setModalCancelar}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader><DialogTitle className="text-slate-800 font-bold">Cancelar y Revertir Pedido</DialogTitle></DialogHeader>
          <form onSubmit={formCancelar.handleSubmit(onCancelar)} className="space-y-4 pt-2">
            <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 text-rose-800 text-xs font-semibold">
              ⚠️ Esta acción es irreversible. Si el pedido es de tipo Regular, todos los ítems reservados serán reintegrados al inventario de forma inmediata.
            </div>
            <Campo label="Motivo de la Cancelación" error={formCancelar.formState.errors.motivo?.message} required>
              <Textarea rows={3} placeholder="Ingrese el detalle o justificación del cliente/administrador..." {...formCancelar.register('motivo')} className="text-xs" />
            </Campo>
            <DialogFooter className="pt-2">
              <Button variant="outline" type="button" onClick={() => setModalCancelar(false)}>Volver</Button>
              <Button variant="destructive" type="submit" disabled={enviando} className="bg-red-650 hover:bg-red-700 text-white font-semibold">
                {enviando ? 'Anulando…' : 'Confirmar Cancelación'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
