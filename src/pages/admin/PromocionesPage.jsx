import { useState, useEffect, useCallback } from 'react'
import { useForm }     from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z }           from 'zod'
import { toast }       from 'sonner'
import {
  Tag, Plus, Edit2, ToggleLeft, ToggleRight,
  Lightbulb, RefreshCw, X,
} from 'lucide-react'
import { promocionesApi, categoriasApi, productosApi } from '../../api/index'
import { Button }   from '../../components/ui/button'
import { Input }    from '../../components/ui/input'
import { Label }    from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Badge }    from '../../components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '../../components/ui/dialog'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '../../components/ui/select'
import { formatCurrency, formatDate } from '../../utils'

// ─── Schemas ─────────────────────────────────────────────────────────────────
const promoSchema = z.object({
  nombre:        z.string().min(3, 'Mínimo 3 caracteres').max(150),
  descripcion:   z.string().max(1000).optional(),
  tipoPromocion: z.enum(['PORCENTAJE','MONTO_FIJO','COMBO','DOS_POR_UNO']),
  valor:         z.coerce.number().positive('Debe ser mayor a 0'),
  fechaInicio:   z.string().min(1, 'Obligatorio'),
  fechaFin:      z.string().optional(),
  activa:        z.boolean().default(true),
  autoAplicar:   z.boolean().default(false),
  acumulable:    z.boolean().default(true),
  prioridad:     z.coerce.number().int().min(0).default(0),
  montoMinimo:   z.coerce.number().min(0).optional(),
  cantidadMinima:z.coerce.number().int().min(1).optional(),
})

const TIPOS = { PORCENTAJE:'Porcentaje (%)', MONTO_FIJO:'Monto fijo (₡)', COMBO:'Combo (precio fijo)', DOS_POR_UNO:'2x1' }

function Campo({ label, error, children, required }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function CheckF({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="rounded" />
      {label}
    </label>
  )
}

export default function PromocionesPage() {
  const [promos,     setPromos]     = useState([])
  const [cargando,   setCargando]   = useState(true)
  const [seleccion,  setSeleccion]  = useState(null)
  const [sugerencias,setSugerencias]= useState(null)
  const [cargandoSug,setCargandoSug]= useState(false)
  const [categorias, setCategorias] = useState([])
  const [productos,  setProductos]  = useState([])
  const [busqProd,   setBusqProd]   = useState('')

  const [modalForm,  setModalForm]  = useState(false)
  const [editando,   setEditando]   = useState(null)
  const [enviando,   setEnviando]   = useState(false)
  const [tab,        setTab]        = useState('lista') // 'lista' | 'sugerencias'

  // Objetivos del formulario
  const [objetivos,  setObjetivos]  = useState([{ tipoObjetivo: 'GLOBAL', categoriaId: null, productoId: null, varianteId: null }])

  const form = useForm({ resolver: zodResolver(promoSchema), defaultValues: { activa: true, autoAplicar: false, acumulable: true, prioridad: 0, tipoPromocion: 'PORCENTAJE' } })

  // ─── Cargar ───────────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const res = await promocionesApi.listar({ limit: 100 })
      setPromos(res.data.data?.promociones ?? [])
    } catch { toast.error('Error al cargar promociones') }
    finally  { setCargando(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  useEffect(() => {
    categoriasApi.listar().then(r => setCategorias(r.data.data ?? [])).catch(() => {})
  }, [])

  async function buscarProductos(q) {
    setBusqProd(q)
    if (!q.trim()) { setProductos([]); return }
    try {
      const r = await productosApi.listar({ busqueda: q, soloActivos: true })
      setProductos((r.data.data ?? []).filter(p => !p.usaVariantes))
    } catch { setProductos([]) }
  }

  // ─── Abrir formulario ────────────────────────────────────────────────────
  function abrirCrear() {
    setEditando(null)
    form.reset({ nombre:'', descripcion:'', tipoPromocion:'PORCENTAJE', valor:'', fechaInicio:'', fechaFin:'', activa:true, autoAplicar:false, acumulable:true, prioridad:0, montoMinimo:'', cantidadMinima:'' })
    setObjetivos([{ tipoObjetivo:'GLOBAL', categoriaId:null, productoId:null, varianteId:null }])
    setModalForm(true)
  }

  function abrirEditar(p) {
    setEditando(p)
    form.reset({
      nombre: p.nombre, descripcion: p.descripcion ?? '', tipoPromocion: p.tipoPromocion,
      valor: Number(p.valor), fechaInicio: p.fechaInicio?.split('T')[0] ?? '',
      fechaFin: p.fechaFin ? p.fechaFin.split('T')[0] : '',
      activa: p.activa, autoAplicar: p.autoAplicar, acumulable: p.acumulable,
      prioridad: p.prioridad, montoMinimo: p.montoMinimo ? Number(p.montoMinimo) : '',
      cantidadMinima: p.cantidadMinima ?? '',
    })
    setObjetivos(p.objetivos?.length > 0
      ? p.objetivos.map(o => ({ tipoObjetivo: o.tipoObjetivo, categoriaId: o.categoriaId, productoId: o.productoId, varianteId: o.varianteId }))
      : [{ tipoObjetivo:'GLOBAL', categoriaId:null, productoId:null, varianteId:null }]
    )
    setModalForm(true)
  }

  // ─── Guardar ─────────────────────────────────────────────────────────────
  async function onGuardar(datos) {
    if (objetivos.length === 0) { toast.warning('Agrega al menos un objetivo'); return }
    const payload = {
      ...datos,
      valor: Number(datos.valor),
      fechaInicio: new Date(datos.fechaInicio).toISOString(),
      fechaFin:    datos.fechaFin ? new Date(datos.fechaFin).toISOString() : null,
      montoMinimo:    datos.montoMinimo    ? Number(datos.montoMinimo)    : null,
      cantidadMinima: datos.cantidadMinima ? Number(datos.cantidadMinima) : null,
      metodosExcluidos: [],
      objetivos,
    }
    setEnviando(true)
    try {
      if (editando) {
        await promocionesApi.editar(editando.id, payload)
        toast.success('Promoción actualizada')
      } else {
        await promocionesApi.crear(payload)
        toast.success('Promoción creada')
      }
      setModalForm(false)
      cargar()
      if (seleccion) {
        const r = await promocionesApi.obtener(editando?.id ?? seleccion.id)
        setSeleccion(r.data.data)
      }
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error')
    } finally { setEnviando(false) }
  }

  // ─── Toggle activa ────────────────────────────────────────────────────────
  async function toggleActiva(p) {
    try {
      await promocionesApi.toggle(p.id, !p.activa)
      toast.success(`Promoción ${!p.activa ? 'activada' : 'desactivada'}`)
      cargar()
    } catch (err) { toast.error(err.response?.data?.message ?? 'Error') }
  }

  // ─── Sugerencias ─────────────────────────────────────────────────────────
  async function cargarSugerencias() {
    setCargandoSug(true)
    try {
      const r = await promocionesApi.sugerencias()
      setSugerencias(r.data.data)
    } catch { toast.error('Error al cargar sugerencias') }
    finally { setCargandoSug(false) }
  }

  useEffect(() => { if (tab === 'sugerencias') cargarSugerencias() }, [tab])

  // ─── Gestión de objetivos ────────────────────────────────────────────────
  function addObjetivo() {
    setObjetivos(p => [...p, { tipoObjetivo:'GLOBAL', categoriaId:null, productoId:null, varianteId:null }])
  }
  function removeObjetivo(i) { setObjetivos(p => p.filter((_,j) => j!==i)) }
  function updateObjetivo(i, campo, valor) {
    setObjetivos(p => p.map((o,j) => j===i ? {...o,[campo]:valor} : o))
  }

  const tipo = form.watch('tipoPromocion')

  return (
    <div className="space-y-5">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Tag size={20}/> Promociones</h1>
          <p className="text-sm text-slate-500 mt-0.5">Descuentos y ofertas del negocio</p>
        </div>
        <Button size="sm" onClick={abrirCrear}><Plus size={14} className="mr-1.5"/>Nueva promoción</Button>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b">
        {[{ key:'lista', label:'Promociones' }, { key:'sugerencias', label:'💡 Sugerencias analíticas' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab===t.key?'border-blue-600 text-blue-700':'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Lista ─────────────────────────────────────────────────────────── */}
      {tab === 'lista' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          {cargando ? (
            <div className="divide-y">{[...Array(4)].map((_,i)=><div key={i} className="px-5 py-4 flex gap-4"><div className="h-4 bg-slate-100 rounded animate-pulse flex-1"/><div className="h-4 bg-slate-100 rounded animate-pulse w-20"/></div>)}</div>
          ) : promos.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-400 text-sm">Sin promociones creadas</p>
              <Button size="sm" className="mt-3" onClick={abrirCrear}><Plus size={13} className="mr-1"/>Crear primera promoción</Button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 border-b">
                  <th className="px-5 py-3 text-left font-medium">Nombre</th>
                  <th className="px-5 py-3 text-left font-medium">Tipo</th>
                  <th className="px-5 py-3 text-left font-medium">Valor</th>
                  <th className="px-5 py-3 text-left font-medium">Vigencia</th>
                  <th className="px-5 py-3 text-left font-medium">Usos</th>
                  <th className="px-5 py-3 text-left font-medium">Estado</th>
                  <th className="px-5 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {promos.map(p => (
                  <tr key={p.id} className={`hover:bg-slate-50 ${!p.activa?'opacity-60':''}`}>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-800">{p.nombre}</p>
                      {p.autoAplicar && <span className="text-xs text-blue-500">Auto-aplica</span>}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{TIPOS[p.tipoPromocion]}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {p.tipoPromocion === 'PORCENTAJE' ? `${p.valor}%` : formatCurrency(p.valor)}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {formatDate(p.fechaInicio)}
                      {p.fechaFin && ` — ${formatDate(p.fechaFin)}`}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {p.usosActuales}{p.limiteUsosTotales ? `/${p.limiteUsosTotales}` : ''}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={p.activa ? 'default' : 'secondary'}>{p.activa ? 'Activa' : 'Inactiva'}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => abrirEditar(p)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"><Edit2 size={14}/></button>
                        <button onClick={() => toggleActiva(p)} className={`p-1.5 rounded ${p.activa?'text-slate-400 hover:text-red-500 hover:bg-red-50':'text-slate-400 hover:text-green-600 hover:bg-green-50'}`}>
                          {p.activa ? <ToggleLeft size={14}/> : <ToggleRight size={14}/>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Sugerencias ───────────────────────────────────────────────────── */}
      {tab === 'sugerencias' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={cargarSugerencias} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
              <RefreshCw size={13} className={cargandoSug?'animate-spin':''}/> Actualizar análisis
            </button>
          </div>

          {cargandoSug ? (
            <div className="space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse"/>)}</div>
          ) : !sugerencias ? (
            <p className="text-slate-400 text-sm text-center py-8">Cargando análisis…</p>
          ) : (
            <>
              {sugerencias.stockAlto?.length > 0 && (
                <div className="bg-white rounded-xl border p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Lightbulb size={15} className="text-yellow-500"/> Stock alto, baja rotación</h3>
                  {sugerencias.stockAlto.map((s,i) => (
                    <div key={i} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                      <p className="font-medium text-yellow-800">{s.producto?.nombre}</p>
                      <p className="text-xs text-yellow-600 mt-0.5">{s.sugerencia}</p>
                      <Button size="sm" className="mt-2 h-7 text-xs" onClick={() => { abrirCrear(); form.setValue('nombre', `Descuento ${s.producto?.nombre}`) }}>
                        Crear promoción
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {sugerencias.categoriasPocoMovimiento?.length > 0 && (
                <div className="bg-white rounded-xl border p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Lightbulb size={15} className="text-blue-500"/> Categorías con poca venta</h3>
                  {sugerencias.categoriasPocoMovimiento.map((s,i) => (
                    <div key={i} className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                      <p className="font-medium text-blue-800">{s.categoria?.nombre}</p>
                      <p className="text-xs text-blue-600 mt-0.5">{s.sugerencia}</p>
                    </div>
                  ))}
                </div>
              )}

              {sugerencias.comboPotencial?.length > 0 && (
                <div className="bg-white rounded-xl border p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Lightbulb size={15} className="text-green-500"/> Combos potenciales</h3>
                  {sugerencias.comboPotencial.map((s,i) => (
                    <div key={i} className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                      <p className="font-medium text-green-800">{s.productos?.map(p=>p.nombre).join(', ')}</p>
                      <p className="text-xs text-green-600 mt-0.5">{s.sugerencia}</p>
                    </div>
                  ))}
                </div>
              )}

              {!sugerencias.stockAlto?.length && !sugerencias.categoriasPocoMovimiento?.length && !sugerencias.comboPotencial?.length && (
                <div className="bg-white rounded-xl border p-8 text-center">
                  <p className="text-slate-400 text-sm">Sin sugerencias por el momento — se generan con datos históricos de ventas</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* MODAL — Crear / Editar */}
      <Dialog open={modalForm} onOpenChange={setModalForm}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editando?'Editar promoción':'Nueva promoción'}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onGuardar)} className="space-y-4 pt-1">

            <Campo label="Nombre" required error={form.formState.errors.nombre?.message}>
              <Input {...form.register('nombre')} />
            </Campo>

            <div className="grid grid-cols-2 gap-3">
              <Campo label="Tipo" required error={form.formState.errors.tipoPromocion?.message}>
                <Select value={tipo} onValueChange={v => form.setValue('tipoPromocion',v)}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{Object.entries(TIPOS).map(([k,v])=><SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </Campo>
              <Campo label={tipo==='PORCENTAJE'?'Valor (%)':'Valor (₡)'} required error={form.formState.errors.valor?.message}>
                <Input type="number" min="0" step={tipo==='PORCENTAJE'?'1':'100'} max={tipo==='PORCENTAJE'?'100':undefined} {...form.register('valor')} />
              </Campo>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Campo label="Fecha inicio" required error={form.formState.errors.fechaInicio?.message}>
                <Input type="date" {...form.register('fechaInicio')} />
              </Campo>
              <Campo label="Fecha fin (opcional)">
                <Input type="date" {...form.register('fechaFin')} />
              </Campo>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Campo label="Monto mínimo de compra (₡)">
                <Input type="number" min="0" step="500" {...form.register('montoMinimo')} />
              </Campo>
              <Campo label="Cantidad mínima de ítems">
                <Input type="number" min="1" {...form.register('cantidadMinima')} />
              </Campo>
            </div>

            <Campo label="Prioridad (mayor = se sugiere primero)">
              <Input type="number" min="0" {...form.register('prioridad')} />
            </Campo>

            <div className="space-y-2 pt-1">
              <CheckF label="Activa" checked={form.watch('activa')} onChange={v=>form.setValue('activa',v)} />
              <CheckF label="Auto-aplicar (sin intervención del vendedor)" checked={form.watch('autoAplicar')} onChange={v=>form.setValue('autoAplicar',v)} />
              <CheckF label="Acumulable con otras promociones" checked={form.watch('acumulable')} onChange={v=>form.setValue('acumulable',v)} />
            </div>

            {/* Objetivos */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <Label>Alcance de la promoción</Label>
                <button type="button" onClick={addObjetivo} className="text-xs text-blue-600 hover:underline">+ Agregar objetivo</button>
              </div>
              {objetivos.map((obj, i) => (
                <div key={i} className="border rounded-lg p-3 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <Select value={obj.tipoObjetivo} onValueChange={v => updateObjetivo(i,'tipoObjetivo',v)}>
                      <SelectTrigger className="w-44 h-8 text-xs"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GLOBAL">Global (toda venta)</SelectItem>
                        <SelectItem value="CATEGORIA">Por categoría</SelectItem>
                        <SelectItem value="PRODUCTO">Por producto</SelectItem>
                      </SelectContent>
                    </Select>
                    {objetivos.length > 1 && (
                      <button type="button" onClick={() => removeObjetivo(i)} className="text-red-400 hover:text-red-600"><X size={14}/></button>
                    )}
                  </div>
                  {obj.tipoObjetivo === 'CATEGORIA' && (
                    <Select value={String(obj.categoriaId||'')} onValueChange={v => updateObjetivo(i,'categoriaId',Number(v))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleccionar categoría…"/></SelectTrigger>
                      <SelectContent>{categorias.map(c=><SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                  {obj.tipoObjetivo === 'PRODUCTO' && (
                    <div>
                      <Input placeholder="Buscar producto…" value={busqProd} onChange={e=>buscarProductos(e.target.value)} className="h-8 text-xs bg-white"/>
                      {productos.length > 0 && (
                        <div className="border rounded divide-y mt-1 max-h-28 overflow-y-auto bg-white">
                          {productos.map(p=>(
                            <button type="button" key={p.id} onClick={()=>{updateObjetivo(i,'productoId',p.id);setBusqProd(p.nombre);setProductos([])}}
                              className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50">{p.nombre}</button>
                          ))}
                        </div>
                      )}
                      {obj.productoId && <p className="text-xs text-blue-600 mt-1">Producto ID: {obj.productoId}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Campo label="Condiciones adicionales (texto informativo)">
              <Textarea rows={2} {...form.register('descripcion')} />
            </Campo>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setModalForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={enviando}>{enviando?'Guardando…':editando?'Guardar cambios':'Crear promoción'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
