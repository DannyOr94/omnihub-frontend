import { useState, useEffect, useCallback } from 'react'
import { useForm }     from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z }           from 'zod'
import { toast }       from 'sonner'
import {
  Plus, RefreshCw, ClipboardList, ArrowRight,
  DollarSign, X, AlertTriangle,
} from 'lucide-react'
import { pedidosApi, clientesApi } from '../../api/index'
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
const ESTADOS = ['SOLICITADO','CONFIRMADO','EN_ESPERA','DISPONIBLE','ENTREGADO','CANCELADO']
const ETIQUETAS = {
  SOLICITADO:'Solicitado', CONFIRMADO:'Confirmado', EN_ESPERA:'En espera',
  DISPONIBLE:'Disponible', ENTREGADO:'Entregado',   CANCELADO:'Cancelado',
}
// Transiciones válidas
const TRANSICIONES = {
  SOLICITADO: ['CONFIRMADO','CANCELADO'],
  CONFIRMADO: ['EN_ESPERA'],
  EN_ESPERA:  ['DISPONIBLE'],
  DISPONIBLE: ['ENTREGADO'],
  ENTREGADO:  [], CANCELADO: [],
}

// ─── Schema abono ─────────────────────────────────────────────────────────────
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
      <Label>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function EstadoBadge({ estado }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colorEstado(estado)}`}>
      {ETIQUETAS[estado] ?? estado}
    </span>
  )
}

export default function PedidosPage() {
  const { esAdmin, esVendedor } = useAuth()

  const [pedidos,     setPedidos]     = useState([])
  const [total,       setTotal]       = useState(0)
  const [pagina,      setPagina]      = useState(1)
  const [cargando,    setCargando]    = useState(true)
  const [filtroEstado,setFiltroEstado]= useState('')
  const [detalle,     setDetalle]     = useState(null)
  const [cargandoDet, setCargandoDet] = useState(false)

  const [modalCrear,    setModalCrear]   = useState(false)
  const [modalEstado,   setModalEstado]  = useState(false)
  const [modalAbono,    setModalAbono]   = useState(false)
  const [modalCancelar, setModalCancelar]= useState(false)
  const [enviando,      setEnviando]     = useState(false)

  // Datos creación
  const [busqCliente,  setBusqCliente]  = useState('')
  const [clientes,     setClientes]     = useState([])
  const [clienteSelec, setClienteSelec] = useState(null)
  const [lineas,       setLineas]       = useState([{ descripcionSolicitada: '', cantidad: 1, talla: '', color: '', precioEstimado: '' }])
  const [fechaEstimada,setFechaEstimada]= useState('')
  const [abonoInicial, setAbonoInicial] = useState(0)
  const [obsCrear,     setObsCrear]     = useState('')

  // Estado cambio
  const [nuevoEstado,  setNuevoEstado]  = useState('')
  const [obsEstado,    setObsEstado]    = useState('')

  const formAbono   = useForm({ resolver: zodResolver(abonoSchema) })
  const formCancelar= useForm({ resolver: zodResolver(cancelarSchema) })

  // ─── Cargar ────────────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const res = await pedidosApi.listar({ estado: filtroEstado || undefined, page: pagina, limit: 20 })
      setPedidos(res.data.data?.pedidos ?? [])
      setTotal(res.data.data?.total ?? 0)
    } catch { toast.error('Error al cargar pedidos') }
    finally  { setCargando(false) }
  }, [filtroEstado, pagina])

  useEffect(() => { cargar() }, [cargar])

  async function verDetalle(id) {
    setCargandoDet(true); setDetalle(null)
    try {
      const res = await pedidosApi.obtener(id)
      setDetalle(res.data.data)
    } catch { toast.error('Error al cargar pedido') }
    finally { setCargandoDet(false) }
  }

  // ─── Buscar clientes ────────────────────────────────────────────────────────
  async function buscarClientes(q) {
    setBusqCliente(q)
    if (!q.trim()) { setClientes([]); return }
    try {
      const res = await clientesApi.buscar(q)
      setClientes(res.data.data?.clientes ?? [])
    } catch { setClientes([]) }
  }

  // ─── Crear ─────────────────────────────────────────────────────────────────
  async function onCrear() {
    if (!clienteSelec) { toast.warning('Selecciona un cliente'); return }
    if (lineas.some(l => !l.descripcionSolicitada.trim())) { toast.warning('Completa todos los ítems'); return }
    setEnviando(true)
    try {
      await pedidosApi.crear({
        clienteId:    clienteSelec.id,
        fechaEstimada: fechaEstimada ? new Date(fechaEstimada).toISOString() : null,
        abonoInicial: Number(abonoInicial) || 0,
        observaciones: obsCrear || null,
        detalles: lineas.map(l => ({
          descripcionSolicitada: l.descripcionSolicitada,
          cantidad:     Number(l.cantidad),
          talla:        l.talla || null,
          color:        l.color || null,
          precioEstimado: l.precioEstimado ? Number(l.precioEstimado) : null,
        })),
      })
      toast.success('Pedido especial creado')
      setModalCrear(false)
      resetCrear()
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error')
    } finally { setEnviando(false) }
  }

  function resetCrear() {
    setClienteSelec(null); setBusqCliente(''); setClientes([])
    setLineas([{ descripcionSolicitada: '', cantidad: 1, talla: '', color: '', precioEstimado: '' }])
    setFechaEstimada(''); setAbonoInicial(0); setObsCrear('')
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

  const transiciones = TRANSICIONES[detalle?.estadoPedido] ?? []
  const puedeAbonar  = detalle && ['SOLICITADO','CONFIRMADO','EN_ESPERA','DISPONIBLE'].includes(detalle.estadoPedido)

  return (
    <div className="flex gap-4 h-[calc(100vh-7rem)]">

      {/* ── Lista ─────────────────────────────────────────────────────────── */}
      <div className="w-80 shrink-0 flex flex-col bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <ClipboardList size={15} /> Pedidos Especiales
            </h1>
            {(esAdmin || esVendedor) && (
              <Button size="sm" onClick={() => setModalCrear(true)} className="h-7 text-xs px-2">
                <Plus size={13} className="mr-1" /> Nuevo
              </Button>
            )}
          </div>
          <Select value={filtroEstado} onValueChange={v => { setFiltroEstado(v === 'TODOS' ? '' : v); setPagina(1) }}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos los estados" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los estados</SelectItem>
              {ESTADOS.map(e => <SelectItem key={e} value={e}>{ETIQUETAS[e]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {cargando
            ? [...Array(5)].map((_, i) => <div key={i} className="px-4 py-3 space-y-1.5"><div className="h-3.5 bg-slate-100 rounded animate-pulse w-3/4" /><div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" /></div>)
            : pedidos.length === 0
              ? <p className="text-xs text-slate-400 text-center py-8">Sin pedidos</p>
              : pedidos.map(p => (
                <button key={p.id} onClick={() => verDetalle(p.id)}
                  className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors ${detalle?.id === p.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-400">{p.numeroPedido}</p>
                      <p className="text-sm font-medium text-slate-800 truncate">{p.cliente?.nombreCompleto}</p>
                      <p className="text-xs text-slate-400">{formatDate(p.fechaSolicitud)}</p>
                    </div>
                    <EstadoBadge estado={p.estadoPedido} />
                  </div>
                </button>
              ))
          }
        </div>

        {total > 20 && (
          <div className="px-4 py-2 border-t flex items-center justify-between text-xs text-slate-400">
            <button onClick={() => setPagina(p => Math.max(1,p-1))} disabled={pagina===1} className="hover:text-slate-700 disabled:opacity-40">← Ant</button>
            <span>Pág {pagina} · {total}</span>
            <button onClick={() => setPagina(p=>p+1)} disabled={pagina*20>=total} className="hover:text-slate-700 disabled:opacity-40">Sig →</button>
          </div>
        )}
      </div>

      {/* ── Detalle ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {cargandoDet ? (
          <div className="bg-white rounded-xl border p-6 space-y-3">{[...Array(4)].map((_,i)=><div key={i} className="h-4 bg-slate-100 rounded animate-pulse"/>)}</div>
        ) : !detalle ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300">
            <ClipboardList size={48} className="mb-3" />
            <p className="text-slate-400 font-medium">Selecciona un pedido</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="bg-white rounded-xl border p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-400">{detalle.numeroPedido}</p>
                  <h2 className="text-lg font-bold text-slate-800 mt-0.5">{detalle.cliente?.nombreCompleto}</h2>
                  <p className="text-sm text-slate-500">
                    Solicitado: {formatDateTime(detalle.fechaSolicitud)}
                    {detalle.fechaEstimada && ` · Est: ${formatDate(detalle.fechaEstimada)}`}
                  </p>
                </div>
                <EstadoBadge estado={detalle.estadoPedido} />
              </div>
              <div className="flex gap-2 mt-4">
                {transiciones.length > 0 && (
                  <Button size="sm" variant="outline" onClick={() => { setNuevoEstado(''); setModalEstado(true) }}>
                    <ArrowRight size={13} className="mr-1" /> Cambiar estado
                  </Button>
                )}
                {(esAdmin || esVendedor) && puedeAbonar && (
                  <Button size="sm" onClick={() => { formAbono.reset(); setModalAbono(true) }}>
                    <DollarSign size={13} className="mr-1" /> Abono
                  </Button>
                )}
                {esAdmin && !['ENTREGADO','CANCELADO'].includes(detalle.estadoPedido) && (
                  <Button size="sm" variant="destructive" onClick={() => { formCancelar.reset(); setModalCancelar(true) }}>
                    <X size={13} className="mr-1" /> Cancelar
                  </Button>
                )}
              </div>
            </div>

            {/* Ítems */}
            <div className="bg-white rounded-xl border p-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Ítems solicitados</h3>
              <div className="divide-y divide-slate-100">
                {detalle.detalles?.map(d => (
                  <div key={d.id} className="py-2.5 text-sm">
                    <p className="font-medium text-slate-800">{d.descripcionSolicitada}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Cant: {d.cantidad}
                      {d.talla && ` · Talla: ${d.talla}`}
                      {d.color && ` · Color: ${d.color}`}
                      {d.precioEstimado && ` · Est: ${formatCurrency(d.precioEstimado)}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Financiero */}
            <div className="bg-white rounded-xl border p-4 space-y-2 text-sm">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Financiero</h3>
              <div className="flex justify-between"><span className="text-slate-500">Abonado</span><span className="text-green-600">{formatCurrency(detalle.abono)}</span></div>
              <div className="flex justify-between font-bold"><span>Saldo pendiente</span><span className={Number(detalle.saldo) > 0 ? 'text-red-600' : 'text-green-600'}>{formatCurrency(detalle.saldo)}</span></div>
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

      {/* MODAL — Crear pedido */}
      <Dialog open={modalCrear} onOpenChange={v => { if (!v) resetCrear(); setModalCrear(v) }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nuevo pedido especial</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-1">
            {/* Cliente */}
            <Campo label="Cliente" required>
              {clienteSelec ? (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded px-3 py-2 text-sm">
                  <span className="font-medium text-blue-800">{clienteSelec.nombreCompleto}</span>
                  <button onClick={() => { setClienteSelec(null); setBusqCliente('') }}><X size={14} /></button>
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

            {/* Ítems */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ítems solicitados</Label>
                <button type="button" onClick={() => setLineas(p => [...p, { descripcionSolicitada:'', cantidad:1, talla:'', color:'', precioEstimado:'' }])}
                  className="text-xs text-blue-600 hover:underline">+ Agregar</button>
              </div>
              {lineas.map((l, i) => (
                <div key={i} className="border rounded-lg p-3 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Ítem {i+1}</span>
                    {lineas.length > 1 && <button type="button" onClick={() => setLineas(p => p.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-600"><X size={13}/></button>}
                  </div>
                  <Input placeholder="Descripción del producto buscado…" value={l.descripcionSolicitada}
                    onChange={e => setLineas(p => p.map((x,j) => j===i ? {...x, descripcionSolicitada: e.target.value} : x))} className="bg-white" />
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: 'cantidad', label: 'Cant.', type: 'number' },
                      { key: 'talla',    label: 'Talla', type: 'text' },
                      { key: 'color',    label: 'Color', type: 'text' },
                      { key: 'precioEstimado', label: 'Precio est.', type: 'number' },
                    ].map(f => (
                      <div key={f.key} className="space-y-1">
                        <Label className="text-xs">{f.label}</Label>
                        <Input type={f.type} min={f.type==='number'?'0':undefined} value={l[f.key]}
                          onChange={e => setLineas(p => p.map((x,j) => j===i ? {...x,[f.key]:e.target.value}:x))}
                          className="bg-white h-8 text-xs" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Campo label="Fecha estimada de llegada">
                <Input type="date" value={fechaEstimada} onChange={e => setFechaEstimada(e.target.value)} />
              </Campo>
              <Campo label="Abono inicial (₡)">
                <Input type="number" min="0" step="500" value={abonoInicial} onChange={e => setAbonoInicial(e.target.value)} />
              </Campo>
            </div>
            <Campo label="Observaciones">
              <Textarea rows={2} value={obsCrear} onChange={e => setObsCrear(e.target.value)} />
            </Campo>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setModalCrear(false); resetCrear() }}>Cancelar</Button>
            <Button onClick={onCrear} disabled={enviando}>{enviando ? 'Guardando…' : 'Crear pedido'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL — Cambiar estado */}
      <Dialog open={modalEstado} onOpenChange={setModalEstado}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Cambiar estado</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-1">
            <div><p className="text-xs text-slate-500 mb-1">Estado actual</p><EstadoBadge estado={detalle?.estadoPedido} /></div>
            <Campo label="Nuevo estado">
              <Select value={nuevoEstado} onValueChange={setNuevoEstado}>
                <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                <SelectContent>{transiciones.map(e => <SelectItem key={e} value={e}>{ETIQUETAS[e]}</SelectItem>)}</SelectContent>
              </Select>
            </Campo>
            <Campo label="Observaciones (opcional)">
              <Textarea rows={2} value={obsEstado} onChange={e => setObsEstado(e.target.value)} />
            </Campo>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEstado(false)}>Cancelar</Button>
            <Button onClick={onCambiarEstado} disabled={enviando || !nuevoEstado}>{enviando ? 'Guardando…' : 'Confirmar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL — Abono */}
      <Dialog open={modalAbono} onOpenChange={setModalAbono}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Registrar abono</DialogTitle></DialogHeader>
          <form onSubmit={formAbono.handleSubmit(onAbono)} className="space-y-4 pt-1">
            <Campo label="Monto (₡)" error={formAbono.formState.errors.monto?.message}>
              <Input type="number" min="0" step="500" {...formAbono.register('monto')} />
            </Campo>
            <Campo label="Observaciones"><Input {...formAbono.register('observaciones')} /></Campo>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setModalAbono(false)}>Cancelar</Button>
              <Button type="submit" disabled={enviando}>{enviando ? 'Registrando…' : 'Confirmar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL — Cancelar */}
      <Dialog open={modalCancelar} onOpenChange={setModalCancelar}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Cancelar pedido</DialogTitle></DialogHeader>
          <form onSubmit={formCancelar.handleSubmit(onCancelar)} className="space-y-4 pt-1">
            <Campo label="Motivo" error={formCancelar.formState.errors.motivo?.message}>
              <Textarea rows={3} {...formCancelar.register('motivo')} />
            </Campo>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setModalCancelar(false)}>Volver</Button>
              <Button variant="destructive" type="submit" disabled={enviando}>{enviando ? 'Cancelando…' : 'Confirmar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
