import { useState, useEffect, useCallback } from 'react'
import { useForm }     from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z }           from 'zod'
import { toast }       from 'sonner'
import {
  Plus, Search, RefreshCw, Wrench, ChevronRight,
  X, ArrowRight, DollarSign, Package, Clock,
  CheckCircle, XCircle, AlertTriangle, FileText,
  Camera, Upload, Trash2,
} from 'lucide-react'
import { boletasApi, clientesApi, usuariosApi, productosApi } from '../../api/index'
import { useAuth }    from '../../context/AuthContext'
import { Button }     from '../../components/ui/button'
import { Input }      from '../../components/ui/input'
import { Label }      from '../../components/ui/label'
import { Badge }      from '../../components/ui/badge'
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
const ESTADOS_BOLETA = [
  'RECIBIDO', 'EN_DIAGNOSTICO', 'PRESUPUESTADO',
  'APROBADO', 'RECHAZADO', 'EN_REPARACION',
  'LISTO_ENTREGA', 'ENTREGADO',
]

const ETIQUETAS_ESTADO = {
  RECIBIDO:       'Recibido',
  EN_DIAGNOSTICO: 'En diagnóstico',
  PRESUPUESTADO:  'Presupuestado',
  APROBADO:       'Aprobado',
  RECHAZADO:      'Rechazado',
  EN_REPARACION:  'En reparación',
  LISTO_ENTREGA:  'Listo para entrega',
  ENTREGADO:      'Entregado',
}

// Transiciones permitidas por estado
const TRANSICIONES = {
  RECIBIDO:       ['EN_DIAGNOSTICO'],
  EN_DIAGNOSTICO: ['PRESUPUESTADO'],
  PRESUPUESTADO:  ['APROBADO', 'RECHAZADO'],
  APROBADO:       ['EN_REPARACION'],
  EN_REPARACION:  ['LISTO_ENTREGA'],
  LISTO_ENTREGA:  ['ENTREGADO'],
}

const METODOS_PAGO = ['EFECTIVO', 'SINPE', 'TRANSFERENCIA', 'DATAFONO', 'NOTA_CREDITO']

// ─── Schemas ─────────────────────────────────────────────────────────────────
const crearSchema = z.object({
  clienteId:             z.coerce.number().int().positive('Selecciona un cliente'),
  tipoEquipo:            z.string().min(2, 'Mínimo 2 caracteres').max(100),
  marca:                 z.string().min(1, 'Obligatorio').max(100),
  modelo:                z.string().max(100).optional().nullable(),
  numeroSerie:           z.string().max(100).optional().nullable(),
  fallaReportada:        z.string().min(5, 'Mínimo 5 caracteres'),
  estadoRecepcionFisica: z.string().min(3, 'Mínimo 3 caracteres'),
  accesoriosRecibidos:   z.string().optional().nullable(),
  observacionesCliente:  z.string().optional().nullable(),
  costoRevision:         z.coerce.number().min(0, 'Costo no puede ser negativo').default(0),
  presupuestoMax:        z.coerce.number().min(0, 'Presupuesto no puede ser negativo').default(0),
  fechaEstimada:         z.string().min(1, 'Fecha de entrega estimada requerida'),
  tecnicoId:             z.coerce.number().int().positive().optional().nullable(),
  exencionDatos:         z.boolean().refine(val => val === true, { message: 'Debe aceptar los términos de exención' }),
})

const presupuestoSchema = z.object({
  manoObra:              z.coerce.number().min(0),
  observacionesInternas: z.string().optional(),
})

const pagoSchema = z.object({
  monto:      z.coerce.number().positive('Monto obligatorio'),
  metodoPago: z.string().min(1, 'Selecciona método'),
  observaciones: z.string().optional(),
})

const repuestoSchema = z.object({
  productoId:  z.coerce.number().int().positive('Selecciona un producto'),
  cantidad:    z.coerce.number().int().positive('Mínimo 1'),
  precioVenta: z.coerce.number().min(0, 'Precio requerido'),
})

// ─── Campo form helper ────────────────────────────────────────────────────────
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
export default function BoletasPage() {
  const { esAdmin, esTecnico, esVendedor } = useAuth()

  // Lista
  const [boletas,    setBoletas]    = useState([])
  const [total,      setTotal]      = useState(0)
  const [pagina,     setPagina]     = useState(1)
  const [cargando,   setCargando]   = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [busqueda,   setBusqueda]   = useState('')

  // Detalle
  const [detalle,    setDetalle]    = useState(null)
  const [cargandoDet,setCargandoDet]= useState(false)

  // Modales
  const [modalCrear,       setModalCrear]       = useState(false)
  const [modalEstado,      setModalEstado]       = useState(false)
  const [modalPresupuesto, setModalPresupuesto]  = useState(false)
  const [modalPago,        setModalPago]         = useState(false)
  const [modalRepuesto,    setModalRepuesto]     = useState(false)

  const [enviando, setEnviando] = useState(false)

  // Datos auxiliares
  const [clientes,   setClientes]   = useState([])
  const [busqCliente,setBusqCliente]= useState('')
  const [tecnicos,   setTecnicos]   = useState([])
  const [productos,  setProductos]  = useState([])
  const [busqProd,   setBusqProd]   = useState('')

  // Fotos de la boleta actual en creación
  const [fotosSubidas, setFotosSubidas] = useState([])
  const [subiendoFotos, setSubiendoFotos] = useState(false)

  // Forms
  const formCrear       = useForm({
    resolver: zodResolver(crearSchema),
    defaultValues: {
      costoRevision: 0,
      presupuestoMax: 0,
      exencionDatos: false,
      tecnicoId: undefined,
      modelo: '',
      numeroSerie: '',
      accesoriosRecibidos: '',
      observacionesCliente: '',
    }
  })
  const formPresupuesto = useForm({ resolver: zodResolver(presupuestoSchema), defaultValues: { manoObra: 0 } })
  const formPago        = useForm({ resolver: zodResolver(pagoSchema) })
  const formRepuesto    = useForm({ resolver: zodResolver(repuestoSchema), defaultValues: { cantidad: 1 } })
  const [estadoNuevo,   setEstadoNuevo]   = useState('')
  const [comentarioEst, setComentarioEst] = useState('')

  const handleSubirFotos = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (fotosSubidas.length + files.length > 4) {
      toast.warning('Puedes subir un máximo de 4 fotos')
      return
    }

    setSubiendoFotos(true)
    const formData = new FormData()
    files.forEach(file => {
      formData.append('fotos', file)
    })

    try {
      const res = await boletasApi.subirFotos(formData)
      const nuevasUrls = res.data.data?.urls || []
      setFotosSubidas(prev => [...prev, ...nuevasUrls])
      toast.success('Imágenes subidas correctamente')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al subir las imágenes')
    } finally {
      setSubiendoFotos(false)
    }
  }

  const eliminarFoto = (urlEliminar) => {
    setFotosSubidas(prev => prev.filter(url => url !== urlEliminar))
  }

  // ─── Cargar lista ──────────────────────────────────────────────────────────
  const cargarBoletas = useCallback(async () => {
    setCargando(true)
    try {
      const res = await boletasApi.listar({
        estado: filtroEstado || undefined,
        page:   pagina,
        limit:  20,
      })
      setBoletas(res.data.data?.boletas ?? [])
      setTotal(res.data.data?.total ?? 0)
    } catch { toast.error('Error al cargar boletas') }
    finally  { setCargando(false) }
  }, [filtroEstado, pagina])

  useEffect(() => { cargarBoletas() }, [cargarBoletas])

  // Cargar técnicos para el formulario de creación
  useEffect(() => {
    usuariosApi.listar({ limit: 100 })
      .then(res => setTecnicos((res.data.data?.usuarios ?? []).filter(u => u.rol?.nombreRol === 'TECNICO' || u.rolId)))
      .catch(() => {})
  }, [])

  // ─── Cargar detalle ────────────────────────────────────────────────────────
  async function verDetalle(id) {
    setCargandoDet(true)
    setDetalle(null)
    try {
      const res = await boletasApi.obtener(id)
      setDetalle(res.data.data)
    } catch { toast.error('Error al cargar boleta') }
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

  // ─── Buscar productos para repuestos ──────────────────────────────────────
  async function buscarProductos(q) {
    setBusqProd(q)
    if (!q.trim()) { setProductos([]); return }
    try {
      const res = await productosApi.listar({ busqueda: q, soloActivos: true })
      setProductos((res.data.data ?? []).filter(p => ['REPUESTO', 'TECNOLOGIA'].includes(p.tipoProducto) && !p.usaVariantes))
    } catch { setProductos([]) }
  }

  // ─── Crear boleta ──────────────────────────────────────────────────────────
  async function onCrear(datos) {
    setEnviando(true)
    try {
      const payload = {
        ...datos,
        fotos: fotosSubidas,
      }
      await boletasApi.crear(payload)
      toast.success('Boleta creada correctamente')
      setModalCrear(false)
      formCrear.reset()
      setBusqCliente('')
      setClientes([])
      setFotosSubidas([])
      cargarBoletas()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error al crear boleta')
    } finally { setEnviando(false) }
  }

  // ─── Cambiar estado ────────────────────────────────────────────────────────
  async function onCambiarEstado() {
    if (!estadoNuevo) { toast.warning('Selecciona un estado'); return }
    setEnviando(true)
    try {
      await boletasApi.cambiarEstado(detalle.id, { estadoNuevo, comentario: comentarioEst || null })
      toast.success(`Estado actualizado a ${ETIQUETAS_ESTADO[estadoNuevo]}`)
      setModalEstado(false)
      setEstadoNuevo('')
      setComentarioEst('')
      verDetalle(detalle.id)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error al cambiar estado')
    } finally { setEnviando(false) }
  }

  // ─── Actualizar presupuesto ────────────────────────────────────────────────
  async function onPresupuesto(datos) {
    setEnviando(true)
    try {
      await boletasApi.presupuesto(detalle.id, datos)
      toast.success('Presupuesto actualizado')
      setModalPresupuesto(false)
      verDetalle(detalle.id)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error')
    } finally { setEnviando(false) }
  }

  // ─── Registrar pago ────────────────────────────────────────────────────────
  async function onPago(datos) {
    setEnviando(true)
    try {
      await boletasApi.registrarPago(detalle.id, datos)
      toast.success('Pago registrado')
      setModalPago(false)
      formPago.reset()
      verDetalle(detalle.id)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error al registrar pago')
    } finally { setEnviando(false) }
  }

  // ─── Asignar repuesto ─────────────────────────────────────────────────────
  async function onRepuesto(datos) {
    setEnviando(true)
    try {
      await boletasApi.asignarRepuesto(detalle.id, datos)
      toast.success('Repuesto asignado y descontado del inventario')
      setModalRepuesto(false)
      formRepuesto.reset()
      setBusqProd('')
      setProductos([])
      verDetalle(detalle.id)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error')
    } finally { setEnviando(false) }
  }

  // ─── Retirar repuesto ─────────────────────────────────────────────────────
  async function retirarRepuesto(repId) {
    if (!confirm('¿Retirar este repuesto? Se devolverá al inventario.')) return
    try {
      await boletasApi.retirarRepuesto(detalle.id, repId)
      toast.success('Repuesto retirado')
      verDetalle(detalle.id)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error')
    }
  }

  const transicionesDisponibles = TRANSICIONES[detalle?.estadoBoleta] ?? []
  const puedeModificarTecnico   = esAdmin || esTecnico
  const puedeRegistrarPago      = esAdmin || esVendedor

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-4 h-[calc(100vh-7rem)]">

      {/* ── Panel izquierdo: lista ─────────────────────────────────────────── */}
      <div className="w-80 shrink-0 flex flex-col bg-white rounded-xl border overflow-hidden">
        {/* Header lista */}
        <div className="px-4 py-3 border-b space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-slate-800 text-sm">Servicio Técnico</h1>
            <div className="flex gap-1">
              <button onClick={cargarBoletas} className="text-slate-400 hover:text-slate-600 p-1">
                <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} />
              </button>
              {(esAdmin || esVendedor) && (
                <Button size="sm" onClick={() => setModalCrear(true)} className="h-7 text-xs px-2">
                  <Plus size={13} className="mr-1" /> Nueva
                </Button>
              )}
            </div>
          </div>

          {/* Filtro estado */}
          <Select value={filtroEstado} onValueChange={v => { setFiltroEstado(v === 'TODOS' ? '' : v); setPagina(1) }}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los estados</SelectItem>
              {ESTADOS_BOLETA.map(e => (
                <SelectItem key={e} value={e}>{ETIQUETAS_ESTADO[e]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lista de boletas */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {cargando ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="px-4 py-3 space-y-1.5">
                <div className="h-3.5 bg-slate-100 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
              </div>
            ))
          ) : boletas.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">Sin boletas</p>
          ) : (
            boletas.map(b => (
              <button
                key={b.id}
                onClick={() => verDetalle(b.id)}
                className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors ${detalle?.id === b.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-500">{b.numeroBoleta}</p>
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {b.tipoEquipo} {b.marca}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{b.cliente?.nombreCompleto}</p>
                  </div>
                  <EstadoBadge estado={b.estadoBoleta} />
                </div>
                {Number(b.saldo) > 0 && (
                  <p className="text-xs text-red-500 mt-1">Saldo: {formatCurrency(b.saldo)}</p>
                )}
              </button>
            ))
          )}
        </div>

        {/* Paginación */}
        {total > 20 && (
          <div className="px-4 py-2 border-t flex items-center justify-between text-xs text-slate-400">
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} className="hover:text-slate-700 disabled:opacity-40">← Ant</button>
            <span>Pág {pagina} · {total} boletas</span>
            <button onClick={() => setPagina(p => p + 1)} disabled={pagina * 20 >= total} className="hover:text-slate-700 disabled:opacity-40">Sig →</button>
          </div>
        )}
      </div>

      {/* ── Panel derecho: detalle ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {cargandoDet ? (
          <div className="bg-white rounded-xl border p-6 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" />)}
          </div>
        ) : !detalle ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300">
            <Wrench size={48} className="mb-3" />
            <p className="font-medium text-slate-400">Selecciona una boleta</p>
          </div>
        ) : (
          <div className="space-y-4">

            {/* ── Header boleta ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-400">{detalle.numeroBoleta}</p>
                  <h2 className="text-lg font-bold text-slate-800 mt-0.5">
                    {detalle.tipoEquipo} {detalle.marca} {detalle.modelo}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Cliente: <span className="font-medium text-slate-700">{detalle.cliente?.nombreCompleto}</span>
                    {detalle.cliente?.telefono && ` · ${detalle.cliente.telefono}`}
                  </p>
                </div>
                <EstadoBadge estado={detalle.estadoBoleta} />
              </div>

              {/* Acciones */}
              <div className="flex flex-wrap gap-2 mt-4">
                {puedeModificarTecnico && transicionesDisponibles.length > 0 && (
                  <Button size="sm" variant="outline" onClick={() => { setEstadoNuevo(''); setModalEstado(true) }}>
                    <ArrowRight size={13} className="mr-1" /> Cambiar estado
                  </Button>
                )}
                {puedeModificarTecnico && (
                  <Button size="sm" variant="outline" onClick={() => {
                    formPresupuesto.setValue('manoObra', Number(detalle.manoObra))
                    formPresupuesto.setValue('observacionesInternas', detalle.observacionesInternas ?? '')
                    setModalPresupuesto(true)
                  }}>
                    <FileText size={13} className="mr-1" /> Presupuesto
                  </Button>
                )}
                {puedeModificarTecnico && detalle.estadoBoleta === 'EN_REPARACION' && (
                  <Button size="sm" variant="outline" onClick={() => setModalRepuesto(true)}>
                    <Package size={13} className="mr-1" /> Asignar repuesto
                  </Button>
                )}
                {puedeRegistrarPago && Number(detalle.saldo) > 0 && (
                  <Button size="sm" onClick={() => setModalPago(true)}>
                    <DollarSign size={13} className="mr-1" /> Registrar pago
                  </Button>
                )}
              </div>
            </div>

            {/* ── Grid info + financiero ───────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Info del equipo */}
              <div className="bg-white rounded-xl border p-4 space-y-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Equipo</h3>
                <InfoRow label="Tipo" value={detalle.tipoEquipo} />
                <InfoRow label="Marca" value={detalle.marca} />
                {detalle.modelo && <InfoRow label="Modelo" value={detalle.modelo} />}
                {detalle.numeroSerie && <InfoRow label="N° serie" value={detalle.numeroSerie} />}
                <InfoRow label="Falla reportada" value={detalle.fallaReportada} multiline />
                <InfoRow label="Estado físico" value={detalle.estadoRecepcionFisica} multiline />
                {detalle.accesoriosRecibidos && <InfoRow label="Accesorios" value={detalle.accesoriosRecibidos} multiline />}
                {detalle.fechaEstimada && <InfoRow label="Fecha estimada" value={formatDate(detalle.fechaEstimada)} />}
                {detalle.tecnico && <InfoRow label="Técnico" value={`${detalle.tecnico.nombre} ${detalle.tecnico.apellido}`} />}
                {detalle.observacionesInternas && (
                  <InfoRow label="Obs. internas" value={detalle.observacionesInternas} multiline />
                )}
              </div>

              {/* Resumen financiero */}
              <div className="bg-white rounded-xl border p-4 space-y-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Financiero</h3>
                <InfoRow label="Costo de revisión" value={formatCurrency(detalle.costoRevision)} />
                {Number(detalle.presupuestoMax) > 0 && (
                  <InfoRow label="Presupuesto máx. autorizado" value={formatCurrency(detalle.presupuestoMax)} />
                )}
                <InfoRow label="Mano de obra" value={formatCurrency(detalle.manoObra)} />
                <InfoRow label="Repuestos" value={formatCurrency(detalle.subtotalRepuestos)} />
                <Separator />
                <InfoRow label="Total" value={formatCurrency(detalle.total)} bold />
                <InfoRow label="Abonado" value={formatCurrency(detalle.abono)} />
                <InfoRow
                  label="Saldo"
                  value={formatCurrency(detalle.saldo)}
                  bold
                  className={Number(detalle.saldo) > 0 ? 'text-red-600' : 'text-green-600'}
                />

                {/* Pagos recibidos */}
                {detalle.pagos?.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs text-slate-400 mb-1.5">Pagos recibidos</p>
                    {detalle.pagos.map(p => (
                      <div key={p.id} className="flex justify-between text-xs py-1 border-t border-slate-50">
                        <span className="text-slate-500">{p.metodoPago} · {formatDateTime(p.fechaPago)}</span>
                        <span className="font-medium">{formatCurrency(p.monto)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Repuestos asignados ───────────────────────────────────────── */}
            {detalle.repuestos?.length > 0 && (
              <div className="bg-white rounded-xl border p-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Repuestos utilizados</h3>
                <div className="divide-y divide-slate-100">
                  {detalle.repuestos.map(r => (
                    <div key={r.id} className="flex items-center justify-between py-2.5 text-sm">
                      <div>
                        <p className="font-medium text-slate-800">{r.producto?.nombre}</p>
                        <p className="text-xs text-slate-400">Cant: {r.cantidad}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{formatCurrency(r.precioVenta * r.cantidad)}</span>
                        {puedeModificarTecnico && (
                          <button onClick={() => retirarRepuesto(r.id)} className="text-red-400 hover:text-red-600">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Evidencia fotográfica de recepción ─────────────────────────── */}
            {detalle.fotos?.length > 0 && (
              <div className="bg-white rounded-xl border p-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Evidencia fotográfica</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {detalle.fotos.map(f => (
                    <a
                      key={f.id}
                      href={`http://localhost:3000${f.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative rounded-lg overflow-hidden aspect-video border bg-slate-50 hover:opacity-90 transition-opacity"
                    >
                      <img src={`http://localhost:3000${f.url}`} alt="Evidencia de recepción" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[10px] text-white font-medium bg-black/60 px-2 py-1 rounded">Ver pantalla completa</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* ── Historial de estados ──────────────────────────────────────── */}
            {detalle.historialEstados?.length > 0 && (
              <div className="bg-white rounded-xl border p-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Historial</h3>
                <div className="space-y-2">
                  {detalle.historialEstados.map((h, i) => (
                    <div key={h.id} className="flex items-start gap-3 text-sm">
                      <div className="mt-1 shrink-0">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                      </div>
                      <div>
                        <p className="text-slate-700">
                          {h.estadoAnterior && <span className="text-slate-400">{ETIQUETAS_ESTADO[h.estadoAnterior]} → </span>}
                          <span className="font-medium">{ETIQUETAS_ESTADO[h.estadoNuevo]}</span>
                        </p>
                        {h.comentario && <p className="text-xs text-slate-400 mt-0.5">{h.comentario}</p>}
                        <p className="text-xs text-slate-400">
                          {h.usuario?.nombre} · {formatDateTime(h.fechaCambio)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL — Crear boleta                                                */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={modalCrear} onOpenChange={setModalCrear}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva boleta de servicio</DialogTitle>
          </DialogHeader>
          <form onSubmit={formCrear.handleSubmit(onCrear)} className="space-y-4 pt-1">

            {/* Buscar cliente */}
            <Campo label="Cliente" required error={formCrear.formState.errors.clienteId?.message}>
              <Input
                placeholder="Buscar cliente…"
                value={busqCliente}
                onChange={e => buscarClientes(e.target.value)}
              />
              {clientes.length > 0 && (
                <div className="border rounded-lg divide-y mt-1 max-h-36 overflow-y-auto">
                  {clientes.map(c => (
                    <button type="button" key={c.id}
                      onClick={() => {
                        formCrear.setValue('clienteId', c.id)
                        setBusqCliente(c.nombreCompleto)
                        setClientes([])
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      {c.nombreCompleto} · {c.telefono ?? c.cedula ?? '—'}
                    </button>
                  ))}
                </div>
              )}
            </Campo>

            <div className="grid grid-cols-2 gap-3">
              <Campo label="Tipo de equipo" required error={formCrear.formState.errors.tipoEquipo?.message}>
                <Input placeholder="Ej: Celular, Laptop…" {...formCrear.register('tipoEquipo')} />
              </Campo>
              <Campo label="Marca" required error={formCrear.formState.errors.marca?.message}>
                <Input placeholder="Ej: Samsung" {...formCrear.register('marca')} />
              </Campo>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Campo label="Modelo">
                <Input placeholder="Ej: Galaxy A54" {...formCrear.register('modelo')} />
              </Campo>
              <Campo label="Número de serie">
                <Input {...formCrear.register('numeroSerie')} />
              </Campo>
            </div>

            <Campo label="Falla reportada" required error={formCrear.formState.errors.fallaReportada?.message}>
              <Textarea rows={2} placeholder="Describe la falla que reporta el cliente…" {...formCrear.register('fallaReportada')} />
            </Campo>

            <Campo label="Estado físico de recepción" required error={formCrear.formState.errors.estadoRecepcionFisica?.message}>
              <Textarea rows={2} placeholder="Describe el estado físico del equipo al recibirlo…" {...formCrear.register('estadoRecepcionFisica')} />
            </Campo>

            <Campo label="Accesorios recibidos">
              <Input placeholder="Ej: Cargador, estuche, audífonos" {...formCrear.register('accesoriosRecibidos')} />
            </Campo>

            <Campo label="Observaciones del cliente">
              <Textarea rows={2} {...formCrear.register('observacionesCliente')} />
            </Campo>

            <div className="border-t pt-4 my-2 space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Diagnóstico y Trazabilidad</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Costo de Revisión (₡)" error={formCrear.formState.errors.costoRevision?.message}>
                  <Input type="number" min="0" step="100" {...formCrear.register('costoRevision')} />
                </Campo>
                <Campo label="Presupuesto Máximo (₡)" error={formCrear.formState.errors.presupuestoMax?.message}>
                  <Input type="number" min="0" step="100" {...formCrear.register('presupuestoMax')} />
                </Campo>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Campo label="Fecha Estimada de Entrega" required error={formCrear.formState.errors.fechaEstimada?.message}>
                  <Input type="date" {...formCrear.register('fechaEstimada')} />
                </Campo>
                <Campo label="Técnico Asignado" error={formCrear.formState.errors.tecnicoId?.message}>
                  <Select onValueChange={v => formCrear.setValue('tecnicoId', v === 'none' ? null : parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar técnico..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar / En cola</SelectItem>
                      {tecnicos.map(t => (
                        <SelectItem key={t.id} value={t.id.toString()}>
                          {t.nombre} {t.apellido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Campo>
              </div>
            </div>

            <div className="border-t pt-4 my-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Evidencia Visual (Max. 4 fotos)</h4>
              
              <div className="relative border-2 border-dashed border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleSubirFotos}
                  disabled={subiendoFotos || fotosSubidas.length >= 4}
                  className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <Upload className="text-slate-400 mb-2" size={24} />
                <span className="text-xs text-slate-600 font-medium text-center">
                  {subiendoFotos ? 'Subiendo imágenes...' : 'Arrastra o selecciona imágenes (Mín. 3-4 recomendado)'}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 text-center">Soporta JPG, PNG · Cámara activa en móviles ({fotosSubidas.length}/4)</span>
              </div>

              {fotosSubidas.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {fotosSubidas.map((url, idx) => (
                    <div key={idx} className="relative group rounded-md overflow-hidden aspect-square border">
                      <img src={`http://localhost:3000${url}`} alt={`Evidencia ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => eliminarFoto(url)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-90 hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-4 my-2 space-y-3">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="exencionDatos"
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  {...formCrear.register('exencionDatos')}
                />
                <label htmlFor="exencionDatos" className="text-xs text-slate-600 cursor-pointer leading-relaxed">
                  Acepto la <strong className="text-slate-700">Exención de Responsabilidad por Datos</strong>. El cliente declara que ha respaldado su información y OmniHub no se hace responsable por pérdida de datos durante el soporte.
                </label>
              </div>
              {formCrear.formState.errors.exencionDatos && (
                <p className="text-xs text-red-500 ml-6">{formCrear.formState.errors.exencionDatos.message}</p>
              )}

              <p className="text-[10px] text-slate-400 leading-normal bg-slate-50 p-2.5 rounded border border-slate-100">
                ⚖️ <strong>Cláusula de Garantía y Abandono:</strong> La garantía de reparación es de 30 días únicamente sobre la falla reparada. De conformidad con las políticas del taller, los artículos no retirados en un plazo de 30 días calendario posteriores al aviso de entrega se considerarán abandonados y serán descartados o liquidados para cubrir costos de soporte.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { setModalCrear(false); formCrear.reset(); setBusqCliente(''); setClientes([]); setFotosSubidas([]) }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={enviando}>
                {enviando ? 'Guardando…' : 'Crear boleta'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL — Cambiar estado                                              */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={modalEstado} onOpenChange={setModalEstado}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cambiar estado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div>
              <p className="text-xs text-slate-500 mb-1">Estado actual</p>
              <EstadoBadge estado={detalle?.estadoBoleta} />
            </div>
            <Campo label="Nuevo estado">
              <Select value={estadoNuevo} onValueChange={setEstadoNuevo}>
                <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                <SelectContent>
                  {transicionesDisponibles.map(e => (
                    <SelectItem key={e} value={e}>{ETIQUETAS_ESTADO[e]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Campo>
            <Campo label="Comentario (opcional)">
              <Textarea rows={2} value={comentarioEst} onChange={e => setComentarioEst(e.target.value)} />
            </Campo>
            {estadoNuevo === 'ENTREGADO' && Number(detalle?.saldo) > 0 && !detalle?.salidaCredito && (
              <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2.5">
                <AlertTriangle size={14} className="shrink-0" />
                Hay saldo pendiente de {formatCurrency(detalle?.saldo)}. Se requiere autorización de salida a crédito.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEstado(false)}>Cancelar</Button>
            <Button onClick={onCambiarEstado} disabled={enviando || !estadoNuevo}>
              {enviando ? 'Guardando…' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL — Presupuesto                                                 */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={modalPresupuesto} onOpenChange={setModalPresupuesto}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Actualizar presupuesto</DialogTitle>
          </DialogHeader>
          <form onSubmit={formPresupuesto.handleSubmit(onPresupuesto)} className="space-y-4 pt-1">
            <Campo label="Mano de obra (₡)" error={formPresupuesto.formState.errors.manoObra?.message}>
              <Input type="number" min="0" step="500" {...formPresupuesto.register('manoObra')} />
            </Campo>
            <div className="bg-slate-50 rounded p-3 text-sm border">
              <div className="flex justify-between">
                <span className="text-slate-500">Repuestos actuales</span>
                <span>{formatCurrency(detalle?.subtotalRepuestos ?? 0)}</span>
              </div>
              <div className="flex justify-between font-bold mt-1">
                <span>Total estimado</span>
                <span>{formatCurrency((Number(formPresupuesto.watch('manoObra')) || 0) + Number(detalle?.subtotalRepuestos ?? 0))}</span>
              </div>
            </div>
            <Campo label="Observaciones internas">
              <Textarea rows={2} {...formPresupuesto.register('observacionesInternas')} />
            </Campo>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setModalPresupuesto(false)}>Cancelar</Button>
              <Button type="submit" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL — Pago                                                        */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={modalPago} onOpenChange={setModalPago}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
          </DialogHeader>
          <form onSubmit={formPago.handleSubmit(onPago)} className="space-y-4 pt-1">
            <div className="bg-slate-50 rounded p-3 text-sm border text-center">
              <p className="text-slate-500 text-xs">Saldo pendiente</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(detalle?.saldo ?? 0)}</p>
            </div>
            <Campo label="Monto (₡)" error={formPago.formState.errors.monto?.message}>
              <Input type="number" min="0" step="100" {...formPago.register('monto')} />
            </Campo>
            <Campo label="Método de pago" error={formPago.formState.errors.metodoPago?.message}>
              <Select onValueChange={v => formPago.setValue('metodoPago', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                <SelectContent>
                  {METODOS_PAGO.map(m => <SelectItem key={m} value={m}>{m.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </Campo>
            <Campo label="Observaciones">
              <Input {...formPago.register('observaciones')} />
            </Campo>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { setModalPago(false); formPago.reset() }}>Cancelar</Button>
              <Button type="submit" disabled={enviando}>{enviando ? 'Registrando…' : 'Confirmar pago'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL — Asignar repuesto                                            */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={modalRepuesto} onOpenChange={setModalRepuesto}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Asignar repuesto</DialogTitle>
          </DialogHeader>
          <form onSubmit={formRepuesto.handleSubmit(onRepuesto)} className="space-y-4 pt-1">
            <Campo label="Buscar repuesto" error={formRepuesto.formState.errors.productoId?.message}>
              <Input
                placeholder="Nombre o código…"
                value={busqProd}
                onChange={e => buscarProductos(e.target.value)}
              />
              {productos.length > 0 && (
                <div className="border rounded-lg divide-y mt-1 max-h-36 overflow-y-auto">
                  {productos.map(p => (
                    <button type="button" key={p.id}
                      onClick={() => {
                        formRepuesto.setValue('productoId', p.id)
                        formRepuesto.setValue('precioVenta', Number(p.precioVenta))
                        setBusqProd(p.nombre)
                        setProductos([])
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <span className="font-medium">{p.nombre}</span>
                      <span className="text-slate-400 ml-2 text-xs">Stock: {p.stockActual - p.stockReservado}</span>
                    </button>
                  ))}
                </div>
              )}
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Cantidad" error={formRepuesto.formState.errors.cantidad?.message}>
                <Input type="number" min="1" {...formRepuesto.register('cantidad')} />
              </Campo>
              <Campo label="Precio venta (₡)" error={formRepuesto.formState.errors.precioVenta?.message}>
                <Input type="number" min="0" step="100" {...formRepuesto.register('precioVenta')} />
              </Campo>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { setModalRepuesto(false); formRepuesto.reset(); setBusqProd(''); setProductos([]) }}>Cancelar</Button>
              <Button type="submit" disabled={enviando}>{enviando ? 'Asignando…' : 'Asignar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}

// ─── Subcomponente: fila de información ───────────────────────────────────────
function InfoRow({ label, value, multiline, bold, className }) {
  if (!value && value !== 0) return null
  return (
    <div className={`flex ${multiline ? 'flex-col gap-0.5' : 'items-start justify-between gap-2'} text-sm`}>
      <span className="text-slate-400 text-xs shrink-0">{label}</span>
      <span className={`${bold ? 'font-bold text-slate-800' : 'text-slate-700'} ${multiline ? '' : 'text-right'} ${className ?? ''}`}>
        {value}
      </span>
    </div>
  )
}
