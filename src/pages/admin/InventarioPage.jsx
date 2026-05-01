import { useState, useEffect, useCallback } from 'react'
import { useForm }     from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z }           from 'zod'
import { toast }       from 'sonner'
import {
  Warehouse, RefreshCw, Plus, AlertTriangle,
  ArrowUpCircle, ArrowDownCircle, Search,
} from 'lucide-react'
import { inventarioApi, productosApi } from '../../api/index'
import { Button }   from '../../components/ui/button'
import { Input }    from '../../components/ui/input'
import { Label }    from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '../../components/ui/dialog'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '../../components/ui/select'
import { formatCurrency, formatDateTime } from '../../utils'

// ─── Schemas ─────────────────────────────────────────────────────────────────
const entradaSchema = z.object({
  productoId: z.coerce.number().int().positive().optional().nullable(),
  varianteId: z.coerce.number().int().positive().optional().nullable(),
  cantidad:   z.coerce.number().int().positive('Mínimo 1'),
  motivo:     z.string().min(3,'Mínimo 3 caracteres').max(300),
}).refine(d => !!d.productoId || !!d.varianteId, { message: 'Selecciona un producto', path: ['productoId'] })

const ajusteSchema = z.object({
  productoId: z.coerce.number().int().positive().optional().nullable(),
  varianteId: z.coerce.number().int().positive().optional().nullable(),
  tipo:       z.enum(['AJUSTE_POSITIVO','AJUSTE_NEGATIVO']),
  cantidad:   z.coerce.number().int().positive('Mínimo 1'),
  motivo:     z.string().min(5,'Mínimo 5 caracteres').max(300),
}).refine(d => !!d.productoId || !!d.varianteId, { message: 'Selecciona un producto', path: ['productoId'] })

const TIPOS_MOV = {
  ENTRADA:'Entrada', SALIDA_VENTA:'Salida venta', SALIDA_REPUESTO:'Salida repuesto',
  RESERVA_APARTADO:'Reserva apartado', LIBERACION_APARTADO:'Liberación apartado',
  AJUSTE_POSITIVO:'Ajuste +', AJUSTE_NEGATIVO:'Ajuste -',
  CAMBIO_PRODUCTO:'Cambio producto', DEVOLUCION_STOCK:'Devolución',
  ANULACION:'Anulación',
}

function colorMov(tipo) {
  if (['ENTRADA','LIBERACION_APARTADO','DEVOLUCION_STOCK','AJUSTE_POSITIVO'].includes(tipo))
    return 'text-green-600'
  if (['SALIDA_VENTA','SALIDA_REPUESTO','AJUSTE_NEGATIVO','ANULACION'].includes(tipo))
    return 'text-red-500'
  return 'text-slate-500'
}

function signoCantidad(tipo) {
  return ['ENTRADA','LIBERACION_APARTADO','DEVOLUCION_STOCK','AJUSTE_POSITIVO'].includes(tipo) ? '+' : '-'
}

function Campo({ label, error, children, required }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ─── Buscador de producto para modales ────────────────────────────────────────
function BuscadorProducto({ onSelect, placeholder = 'Buscar producto…' }) {
  const [q,       setQ]       = useState('')
  const [results, setResults] = useState([])
  const [selected,setSelected]= useState(null)

  async function buscar(texto) {
    setQ(texto)
    if (!texto.trim()) { setResults([]); return }
    try {
      const res = await productosApi.listar({ busqueda: texto, soloActivos: true })
      setResults(res.data.data ?? [])
    } catch { setResults([]) }
  }

  function seleccionar(p, variante = null) {
    const label = variante
      ? `${p.nombre} — ${variante.talla ?? ''} ${variante.color ?? ''}`.trim()
      : p.nombre
    setSelected({ productoId: variante ? null : p.id, varianteId: variante?.id ?? null, label })
    setQ(label)
    setResults([])
    onSelect(variante ? null : p.id, variante?.id ?? null)
  }

  return (
    <div>
      {selected && (
        <div className="mb-1.5 text-xs bg-blue-50 border border-blue-200 rounded px-2.5 py-1.5 text-blue-800 font-medium">
          {selected.label}
        </div>
      )}
      <Input placeholder={placeholder} value={q} onChange={e => buscar(e.target.value)} />
      {results.length > 0 && (
        <div className="border rounded-lg divide-y mt-1 max-h-48 overflow-y-auto bg-white z-10 relative">
          {results.map(p => (
            <div key={p.id}>
              {!p.usaVariantes ? (
                <button type="button" onClick={() => seleccionar(p)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex justify-between">
                  <span>{p.nombre}</span>
                  <span className="text-xs text-slate-400">Stock: {p.stockActual}</span>
                </button>
              ) : (
                <div>
                  <p className="px-3 pt-2 pb-1 text-xs text-slate-400 font-medium">{p.nombre} — variantes:</p>
                  {(p.variantes ?? []).filter(v => v.activo).map(v => (
                    <button type="button" key={v.id} onClick={() => seleccionar(p, v)}
                      className="w-full px-5 py-1.5 text-left text-xs hover:bg-slate-50 flex justify-between">
                      <span>{v.talla && `T.${v.talla}`} {v.color} — {v.sku}</span>
                      <span className="text-slate-400">Stock: {v.stockActual}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function InventarioPage() {
  const [tab,         setTab]         = useState('movimientos') // 'movimientos' | 'alertas'
  const [movimientos, setMovimientos] = useState([])
  const [totalMov,    setTotalMov]    = useState(0)
  const [paginaMov,   setPaginaMov]   = useState(1)
  const [cargando,    setCargando]    = useState(true)
  const [alertas,     setAlertas]     = useState({ productos: [], variantes: [] })
  const [cargandoAl,  setCargandoAl]  = useState(false)

  const [modalEntrada,setModalEntrada]= useState(false)
  const [modalAjuste, setModalAjuste] = useState(false)
  const [enviando,    setEnviando]    = useState(false)

  const formEntrada = useForm({ resolver: zodResolver(entradaSchema), defaultValues: { cantidad: 1, motivo: '' } })
  const formAjuste  = useForm({ resolver: zodResolver(ajusteSchema),  defaultValues: { tipo: 'AJUSTE_POSITIVO', cantidad: 1, motivo: '' } })

  // ─── Cargar movimientos ────────────────────────────────────────────────────
  const cargarMovimientos = useCallback(async () => {
    setCargando(true)
    try {
      const res = await inventarioApi.movimientos({ page: paginaMov, limit: 30 })
      setMovimientos(res.data.data?.movimientos ?? [])
      setTotalMov(res.data.data?.total ?? 0)
    } catch { toast.error('Error al cargar movimientos') }
    finally  { setCargando(false) }
  }, [paginaMov])

  useEffect(() => { cargarMovimientos() }, [cargarMovimientos])

  // ─── Cargar alertas ────────────────────────────────────────────────────────
  async function cargarAlertas() {
    setCargandoAl(true)
    try {
      const res = await inventarioApi.alertas()
      setAlertas(res.data.data ?? { productos: [], variantes: [] })
    } catch { toast.error('Error al cargar alertas') }
    finally { setCargandoAl(false) }
  }

  useEffect(() => { if (tab === 'alertas') cargarAlertas() }, [tab])

  // ─── Entrada de stock ─────────────────────────────────────────────────────
  async function onEntrada(datos) {
    setEnviando(true)
    try {
      await inventarioApi.entrada({
        productoId: datos.productoId ?? null,
        varianteId: datos.varianteId ?? null,
        cantidad:   datos.cantidad,
        motivo:     datos.motivo,
      })
      toast.success('Entrada de stock registrada')
      setModalEntrada(false)
      formEntrada.reset()
      cargarMovimientos()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error')
    } finally { setEnviando(false) }
  }

  // ─── Ajuste manual ────────────────────────────────────────────────────────
  async function onAjuste(datos) {
    setEnviando(true)
    try {
      await inventarioApi.ajuste({
        productoId: datos.productoId ?? null,
        varianteId: datos.varianteId ?? null,
        tipo:       datos.tipo,
        cantidad:   datos.cantidad,
        motivo:     datos.motivo,
      })
      toast.success('Ajuste registrado correctamente')
      setModalAjuste(false)
      formAjuste.reset()
      cargarMovimientos()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error')
    } finally { setEnviando(false) }
  }

  const totalAlertas = alertas.productos.length + alertas.variantes.length

  return (
    <div className="space-y-4">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Warehouse size={20}/> Inventario
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Movimientos y alertas de stock</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { formEntrada.reset({ cantidad:1, motivo:'' }); setModalEntrada(true) }}>
            <ArrowUpCircle size={14} className="mr-1.5 text-green-600"/> Entrada de stock
          </Button>
          <Button size="sm" variant="outline" onClick={() => { formAjuste.reset({ tipo:'AJUSTE_POSITIVO', cantidad:1, motivo:'' }); setModalAjuste(true) }}>
            <ArrowDownCircle size={14} className="mr-1.5 text-orange-500"/> Ajuste manual
          </Button>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b">
        {[
          { key: 'movimientos', label: 'Historial de movimientos' },
          { key: 'alertas',     label: `Alertas de stock${totalAlertas > 0 ? ` (${totalAlertas})` : ''}` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab===t.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Movimientos ──────────────────────────────────────────────────────── */}
      {tab === 'movimientos' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <p className="text-sm font-semibold text-slate-700">{totalMov} movimientos</p>
            <button onClick={cargarMovimientos} className="text-slate-400 hover:text-slate-600">
              <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} />
            </button>
          </div>

          {cargando ? (
            <div className="divide-y">{[...Array(8)].map((_,i)=><div key={i} className="px-4 py-3 flex gap-4"><div className="h-4 bg-slate-100 rounded animate-pulse flex-1"/><div className="h-4 bg-slate-100 rounded animate-pulse w-20"/></div>)}</div>
          ) : movimientos.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">Sin movimientos registrados</p>
          ) : (
            <div className="divide-y divide-slate-50 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500">
                    <th className="px-4 py-2.5 text-left font-medium">Fecha</th>
                    <th className="px-4 py-2.5 text-left font-medium">Tipo</th>
                    <th className="px-4 py-2.5 text-left font-medium">Producto</th>
                    <th className="px-4 py-2.5 text-left font-medium">Motivo</th>
                    <th className="px-4 py-2.5 text-right font-medium">Cant.</th>
                    <th className="px-4 py-2.5 text-left font-medium">Usuario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {movimientos.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-xs text-slate-400 whitespace-nowrap">{formatDateTime(m.fechaMovimiento)}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-medium ${colorMov(m.tipoMovimiento)}`}>{TIPOS_MOV[m.tipoMovimiento] ?? m.tipoMovimiento}</span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700 max-w-[160px] truncate">
                        {m.producto?.nombre ?? (m.variante ? `SKU ${m.variante.sku}` : '—')}
                        {m.variante && <span className="text-xs text-slate-400 ml-1">{m.variante.talla} {m.variante.color}</span>}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 text-xs max-w-[180px] truncate">{m.motivo}</td>
                      <td className={`px-4 py-2.5 text-right font-bold ${colorMov(m.tipoMovimiento)}`}>
                        {signoCantidad(m.tipoMovimiento)}{m.cantidad}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-400">{m.usuario?.nombre} {m.usuario?.apellido}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalMov > 30 && (
            <div className="px-4 py-2 border-t flex items-center justify-between text-xs text-slate-400">
              <button onClick={() => setPaginaMov(p=>Math.max(1,p-1))} disabled={paginaMov===1} className="hover:text-slate-700 disabled:opacity-40">← Ant</button>
              <span>Pág {paginaMov} · {totalMov} movimientos</span>
              <button onClick={() => setPaginaMov(p=>p+1)} disabled={paginaMov*30>=totalMov} className="hover:text-slate-700 disabled:opacity-40">Sig →</button>
            </div>
          )}
        </div>
      )}

      {/* ── Alertas ───────────────────────────────────────────────────────────── */}
      {tab === 'alertas' && (
        <div className="space-y-4">
          {cargandoAl ? (
            <div className="bg-white rounded-xl border p-6 space-y-3">{[...Array(4)].map((_,i)=><div key={i} className="h-4 bg-slate-100 rounded animate-pulse"/>)}</div>
          ) : totalAlertas === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center">
              <p className="text-green-600 font-semibold">✓ Sin alertas de stock</p>
              <p className="text-sm text-slate-400 mt-1">Todos los productos están sobre su mínimo</p>
            </div>
          ) : (
            <>
              {alertas.productos.length > 0 && (
                <div className="bg-white rounded-xl border overflow-hidden">
                  <p className="px-4 py-3 border-b text-sm font-semibold text-red-700 flex items-center gap-2">
                    <AlertTriangle size={14}/> Productos con stock bajo ({alertas.productos.length})
                  </p>
                  <div className="divide-y divide-slate-100">
                    {alertas.productos.map(p => (
                      <div key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium text-slate-800">{p.nombre}</p>
                          <p className="text-xs text-slate-400">{p.categoria?.nombre}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">{p.stockActual} en stock</p>
                          <p className="text-xs text-slate-400">Mínimo: {p.stockMinimo}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {alertas.variantes.length > 0 && (
                <div className="bg-white rounded-xl border overflow-hidden">
                  <p className="px-4 py-3 border-b text-sm font-semibold text-orange-700 flex items-center gap-2">
                    <AlertTriangle size={14}/> Variantes con stock bajo ({alertas.variantes.length})
                  </p>
                  <div className="divide-y divide-slate-100">
                    {alertas.variantes.map(v => (
                      <div key={v.id} className="flex items-center justify-between px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium text-slate-800">{v.producto?.nombre}</p>
                          <p className="text-xs text-slate-400">SKU: {v.sku} · {v.talla && `T.${v.talla}`} {v.color}</p>
                        </div>
                        <p className="font-bold text-orange-600">{v.stockActual} en stock</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* MODAL — Entrada */}
      <Dialog open={modalEntrada} onOpenChange={setModalEntrada}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Registrar entrada de stock</DialogTitle></DialogHeader>
          <form onSubmit={formEntrada.handleSubmit(onEntrada)} className="space-y-4 pt-1">
            <Campo label="Producto" required error={formEntrada.formState.errors.productoId?.message}>
              <BuscadorProducto onSelect={(pid, vid) => {
                formEntrada.setValue('productoId', pid)
                formEntrada.setValue('varianteId', vid)
              }} />
            </Campo>
            <Campo label="Cantidad" error={formEntrada.formState.errors.cantidad?.message}>
              <Input type="number" min="1" {...formEntrada.register('cantidad')} />
            </Campo>
            <Campo label="Motivo / proveedor" required error={formEntrada.formState.errors.motivo?.message}>
              <Input placeholder="Ej: Compra proveedor X" {...formEntrada.register('motivo')} />
            </Campo>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setModalEntrada(false)}>Cancelar</Button>
              <Button type="submit" disabled={enviando}>{enviando ? 'Registrando…' : 'Registrar entrada'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL — Ajuste */}
      <Dialog open={modalAjuste} onOpenChange={setModalAjuste}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Ajuste manual de stock</DialogTitle></DialogHeader>
          <form onSubmit={formAjuste.handleSubmit(onAjuste)} className="space-y-4 pt-1">
            <Campo label="Producto" required error={formAjuste.formState.errors.productoId?.message}>
              <BuscadorProducto onSelect={(pid, vid) => {
                formAjuste.setValue('productoId', pid)
                formAjuste.setValue('varianteId', vid)
              }} />
            </Campo>
            <Campo label="Tipo de ajuste">
              <Select value={formAjuste.watch('tipo')} onValueChange={v => formAjuste.setValue('tipo', v)}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AJUSTE_POSITIVO">Ajuste positivo (+)</SelectItem>
                  <SelectItem value="AJUSTE_NEGATIVO">Ajuste negativo (-)</SelectItem>
                </SelectContent>
              </Select>
            </Campo>
            <Campo label="Cantidad" error={formAjuste.formState.errors.cantidad?.message}>
              <Input type="number" min="1" {...formAjuste.register('cantidad')} />
            </Campo>
            <Campo label="Motivo obligatorio" required error={formAjuste.formState.errors.motivo?.message}>
              <Textarea rows={2} placeholder="Explica el motivo del ajuste…" {...formAjuste.register('motivo')} />
            </Campo>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setModalAjuste(false)}>Cancelar</Button>
              <Button type="submit" disabled={enviando}>{enviando ? 'Registrando…' : 'Aplicar ajuste'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
