import { useState, useEffect, useCallback } from 'react'
import { useForm }     from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z }           from 'zod'
import { toast }       from 'sonner'
import {
  Plus, Search, Package, Edit2, UploadCloud,
  ToggleLeft, ToggleRight, ChevronDown, ChevronUp, X,
} from 'lucide-react'
import { productosApi, categoriasApi } from '../../api/index'
import { Button }   from '../../components/ui/button'
import { Input }    from '../../components/ui/input'
import { Label }    from '../../components/ui/label'
import { Badge }    from '../../components/ui/badge'
import { Textarea } from '../../components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from '../../components/ui/dialog'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '../../components/ui/select'
import { formatCurrency, formatDate, getImagenUrl } from '../../utils'

// ─── Schemas ─────────────────────────────────────────────────────────────────
const prodSchema = z.object({
  nombre:       z.string().min(2,'Mínimo 2 caracteres').max(200),
  descripcion:  z.string().max(1000).optional(),
  tipoProducto: z.enum(['TEXTIL','TECNOLOGIA','REPUESTO','SERVICIO']),
  categoriaId:  z.coerce.number().int().positive('Selecciona categoría'),
  marca:        z.string().max(100).optional(),
  skuBase:      z.string().max(100).optional(),
  codigoBarras: z.string().max(100).optional(),
  usaVariantes: z.boolean().default(false),
  manejaStock:  z.boolean().default(true),
  stockMinimo:  z.coerce.number().int().min(0).default(0),
  precioVenta:  z.coerce.number().min(0).default(0),
  precioCompra: z.coerce.number().min(0).optional(),
  stockInicial: z.coerce.number().int().min(0).optional(),
  visiblePublico: z.boolean().default(true),
})

const varianteSchema = z.object({
  talla:        z.string().max(20).optional(),
  color:        z.string().max(50).optional(),
  sku:          z.string().min(1,'SKU obligatorio').max(100),
  codigoBarras: z.string().max(100).optional(),
  precioVenta:  z.coerce.number().min(0,'Precio requerido'),
  precioCompra: z.coerce.number().min(0).optional(),
  stockInicial: z.coerce.number().int().min(0).optional(),
})

const TIPOS = ['TEXTIL','TECNOLOGIA','REPUESTO','SERVICIO']
const ETIQ_TIPO = { TEXTIL:'Textil', TECNOLOGIA:'Tecnología', REPUESTO:'Repuesto', SERVICIO:'Servicio' }

function Campo({ label, error, children, required }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function CheckField({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="rounded" />
      {label}
    </label>
  )
}

export default function ProductosPage() {
  const [productos,    setProductos]    = useState([])
  const [cargando,     setCargando]     = useState(true)
  const [busqueda,     setBusqueda]     = useState('')
  const [filtroTipo,   setFiltroTipo]   = useState('')
  const [categorias,   setCategorias]   = useState([])
  const [seleccion,    setSeleccion]    = useState(null) // producto con detalle
  const [cargandoDet,  setCargandoDet]  = useState(false)
  const [expandVariantes, setExpandVariantes] = useState(false)

  const [modalProd,    setModalProd]    = useState(false)
  const [editandoProd, setEditandoProd] = useState(null)
  const [modalVariante,setModalVariante]= useState(false)
  const [editandoVar,  setEditandoVar]  = useState(null)
  const [enviando,     setEnviando]     = useState(false)

  const [imagenProd, setImagenProd] = useState(null)
  const [previewProd, setPreviewProd] = useState(null)
  const [imagenVar, setImagenVar] = useState(null)
  const [previewVar, setPreviewVar] = useState(null)

  const formProd = useForm({ resolver: zodResolver(prodSchema), defaultValues: { usaVariantes: false, manejaStock: true, stockMinimo: 0, stockInicial: 0, precioVenta: 0, visiblePublico: true } })
  const formVar  = useForm({ resolver: zodResolver(varianteSchema), defaultValues: { stockInicial: 0 } })

  // ─── Cargar categorías ────────────────────────────────────────────────────
  useEffect(() => {
    categoriasApi.listar({ soloActivas: true })
      .then(res => setCategorias(res.data.data ?? []))
      .catch(() => {})
  }, [])

  // ─── Cargar productos ────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const res = await productosApi.listar({
        busqueda:    busqueda || undefined,
        tipoProducto: filtroTipo || undefined,
        soloActivos: false,
      })
      setProductos(res.data.data ?? [])
    } catch { toast.error('Error al cargar productos') }
    finally  { setCargando(false) }
  }, [busqueda, filtroTipo])

  useEffect(() => {
    const t = setTimeout(() => cargar(), 350)
    return () => clearTimeout(t)
  }, [busqueda, filtroTipo])

  // ─── Detalle ──────────────────────────────────────────────────────────────
  async function verDetalle(id) {
    setCargandoDet(true); setSeleccion(null); setExpandVariantes(false)
    try {
      const res = await productosApi.obtener(id)
      setSeleccion(res.data.data)
    } catch { toast.error('Error al cargar producto') }
    finally { setCargandoDet(false) }
  }

  // ─── Crear / Editar producto ──────────────────────────────────────────────
  function abrirCrear() {
    setEditandoProd(null)
    setImagenProd(null); setPreviewProd(null);
    formProd.reset({ nombre:'', descripcion:'', tipoProducto:'TECNOLOGIA', categoriaId:'', marca:'', skuBase:'', codigoBarras:'', usaVariantes:false, manejaStock:true, stockMinimo:0, stockInicial:0, precioVenta:0, precioCompra:'', visiblePublico:true })
    setModalProd(true)
  }

  function abrirEditar(p) {
    setEditandoProd(p)
    setImagenProd(null); setPreviewProd(p.imagenUrl ? getImagenUrl(p.imagenUrl) : null);
    formProd.reset({
      nombre: p.nombre, descripcion: p.descripcion ?? '', tipoProducto: p.tipoProducto,
      categoriaId: p.categoriaId, marca: p.marca ?? '', skuBase: p.skuBase ?? '',
      codigoBarras: p.codigoBarras ?? '', usaVariantes: p.usaVariantes, manejaStock: p.manejaStock,
      stockMinimo: p.stockMinimo, precioVenta: Number(p.precioVenta),
      precioCompra: p.precioCompra ? Number(p.precioCompra) : '', visiblePublico: p.visiblePublico,
    })
    setModalProd(true)
  }

  async function onGuardarProd(datos) {
    const payload = Object.fromEntries(Object.entries(datos).map(([k,v]) => [k, v === '' ? null : v]))
    setEnviando(true)
    try {
      if (imagenProd) {
        const fd = new FormData()
        fd.append('imagen', imagenProd)
        const resImg = await productosApi.subirImagen(fd)
        payload.imagenUrl = resImg.data.data.url
      }

      if (editandoProd) {
        await productosApi.editar(editandoProd.id, payload)
        toast.success('Producto actualizado')
      } else {
        await productosApi.crear(payload)
        toast.success('Producto creado')
      }
      setModalProd(false)
      cargar()
      if (seleccion) verDetalle(seleccion.id)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error')
    } finally { setEnviando(false) }
  }

  async function toggleProducto(p) {
    try {
      await productosApi.toggle(p.id, !p.activo)
      toast.success(`Producto ${!p.activo ? 'activado' : 'desactivado'}`)
      cargar()
      if (seleccion?.id === p.id) verDetalle(p.id)
    } catch (err) { toast.error(err.response?.data?.message ?? 'Error') }
  }

  // ─── Variantes ────────────────────────────────────────────────────────────
  function abrirCrearVariante() {
    setEditandoVar(null)
    setImagenVar(null); setPreviewVar(null);
    formVar.reset({ talla:'', color:'', sku:'', codigoBarras:'', precioVenta:0, precioCompra:'', stockInicial:0 })
    setModalVariante(true)
  }

  function abrirEditarVariante(v) {
    setEditandoVar(v)
    setImagenVar(null); setPreviewVar(v.imagenUrl ? getImagenUrl(v.imagenUrl) : null);
    formVar.reset({ talla: v.talla ?? '', color: v.color ?? '', sku: v.sku,
      codigoBarras: v.codigoBarras ?? '', precioVenta: Number(v.precioVenta),
      precioCompra: v.precioCompra ? Number(v.precioCompra) : '' })
    setModalVariante(true)
  }

  async function onGuardarVariante(datos) {
    const payload = Object.fromEntries(Object.entries(datos).map(([k,v]) => [k, v === '' ? null : v]))
    setEnviando(true)
    try {
      if (imagenVar) {
        const fd = new FormData()
        fd.append('imagen', imagenVar)
        const resImg = await productosApi.subirImagen(fd)
        payload.imagenUrl = resImg.data.data.url
      }

      if (editandoVar) {
        await productosApi.editarVariante(seleccion.id, editandoVar.id, payload)
        toast.success('Variante actualizada')
      } else {
        await productosApi.crearVariante(seleccion.id, payload)
        toast.success('Variante creada')
      }
      setModalVariante(false)
      verDetalle(seleccion.id)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error')
    } finally { setEnviando(false) }
  }

  async function toggleVariante(v) {
    try {
      await productosApi.toggleVariante(seleccion.id, v.id, !v.activo)
      toast.success(`Variante ${!v.activo ? 'activada' : 'desactivada'}`)
      verDetalle(seleccion.id)
    } catch (err) { toast.error(err.response?.data?.message ?? 'Error') }
  }

  const usaVariantes = formProd.watch('usaVariantes')
  const manejaStock  = formProd.watch('manejaStock')
  const tipoSelec    = formProd.watch('tipoProducto')

  return (
    <div className="flex gap-4 h-[calc(100vh-7rem)]">

      {/* ── Lista ─────────────────────────────────────────────────────────── */}
      <div className="w-80 shrink-0 flex flex-col bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-slate-800 text-sm flex items-center gap-1.5"><Package size={15}/> Productos</h1>
            <Button size="sm" onClick={abrirCrear} className="h-7 text-xs px-2"><Plus size={13} className="mr-1"/>Nuevo</Button>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
            <Input placeholder="Buscar…" value={busqueda} onChange={e=>setBusqueda(e.target.value)} className="pl-8 h-8 text-sm"/>
          </div>
          <Select value={filtroTipo} onValueChange={v => setFiltroTipo(v==='TODOS'?'':v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos los tipos"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los tipos</SelectItem>
              {TIPOS.map(t=><SelectItem key={t} value={t}>{ETIQ_TIPO[t]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {cargando
            ? [...Array(6)].map((_,i)=><div key={i} className="px-4 py-3 space-y-1.5"><div className="h-3.5 bg-slate-100 rounded animate-pulse w-3/4"/><div className="h-3 bg-slate-100 rounded animate-pulse w-1/2"/></div>)
            : productos.length===0
              ? <p className="text-xs text-slate-400 text-center py-8">Sin productos</p>
              : productos.map(p=>(
                <button key={p.id} onClick={()=>verDetalle(p.id)}
                  className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors ${seleccion?.id===p.id?'bg-blue-50 border-l-2 border-blue-500':''} ${!p.activo?'opacity-50':''}`}>
                  <div className="flex items-start gap-3">
                    {p.imagenUrl ? (
                      <img src={getImagenUrl(p.imagenUrl)} className="w-10 h-10 object-cover rounded-md border shrink-0" alt="" />
                    ) : (
                      <div className="w-10 h-10 bg-slate-100 rounded-md border flex items-center justify-center text-slate-400 shrink-0">
                        <Package size={16}/>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-800 truncate">{p.nombre}</p>
                        <span className="text-xs font-semibold text-slate-600 shrink-0">{formatCurrency(p.precioVenta)}</span>
                      </div>
                      <p className="text-xs text-slate-400">{ETIQ_TIPO[p.tipoProducto]} · {p.categoria?.nombre}</p>
                      {p.manejaStock && !p.usaVariantes && (
                        <p className={`text-xs mt-0.5 ${p.stockActual-p.stockReservado<=p.stockMinimo?'text-red-500':'text-slate-400'}`}>
                          Stock: {p.stockActual-p.stockReservado} libre
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
          }
        </div>
      </div>

      {/* ── Detalle ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {cargandoDet ? (
          <div className="bg-white rounded-xl border p-6 space-y-3">{[...Array(4)].map((_,i)=><div key={i} className="h-4 bg-slate-100 rounded animate-pulse"/>)}</div>
        ) : !seleccion ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300"><Package size={48} className="mb-3"/><p className="text-slate-400 font-medium">Selecciona un producto</p></div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="bg-white rounded-xl border p-5">
              <div className="flex items-start gap-4">
                {seleccion.imagenUrl ? (
                  <img src={getImagenUrl(seleccion.imagenUrl)} className="w-16 h-16 object-cover rounded-xl border shrink-0" alt="" />
                ) : (
                  <div className="w-16 h-16 bg-slate-100 rounded-xl border flex items-center justify-center text-slate-400 shrink-0">
                    <Package size={24}/>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs text-slate-400">{ETIQ_TIPO[seleccion.tipoProducto]} · {seleccion.categoria?.nombre}</span>
                      <h2 className="text-lg font-bold text-slate-800 mt-0.5">{seleccion.nombre}</h2>
                      {seleccion.marca && <p className="text-sm text-slate-500">{seleccion.marca}</p>}
                    </div>
                    <Badge variant={seleccion.activo?'default':'secondary'}>{seleccion.activo?'Activo':'Inactivo'}</Badge>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={()=>abrirEditar(seleccion)}><Edit2 size={13} className="mr-1"/>Editar</Button>
                    <Button size="sm" variant={seleccion.activo?'destructive':'outline'} onClick={()=>toggleProducto(seleccion)}>
                      {seleccion.activo?<><ToggleLeft size={13} className="mr-1"/>Desactivar</>:<><ToggleRight size={13} className="mr-1"/>Activar</>}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="bg-white rounded-xl border p-4 grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-slate-400">Precio venta</p><p className="font-bold text-slate-800">{formatCurrency(seleccion.precioVenta)}</p></div>
              {seleccion.precioCompra && <div><p className="text-xs text-slate-400">Precio compra</p><p className="font-semibold">{formatCurrency(seleccion.precioCompra)}</p></div>}
              {seleccion.skuBase && <div><p className="text-xs text-slate-400">SKU Base</p><p className="font-mono text-slate-700">{seleccion.skuBase}</p></div>}
              {seleccion.codigoBarras && <div><p className="text-xs text-slate-400">Cód. barras</p><p className="font-mono text-slate-700">{seleccion.codigoBarras}</p></div>}
              {!seleccion.usaVariantes && seleccion.manejaStock && (
                <>
                  <div><p className="text-xs text-slate-400">Stock actual</p><p className={`font-bold ${seleccion.stockActual-seleccion.stockReservado<=seleccion.stockMinimo?'text-red-600':'text-slate-800'}`}>{seleccion.stockActual} ({seleccion.stockActual-seleccion.stockReservado} libre)</p></div>
                  <div><p className="text-xs text-slate-400">Stock mínimo</p><p>{seleccion.stockMinimo}</p></div>
                </>
              )}
            </div>

            {/* Variantes */}
            {seleccion.usaVariantes && (
              <div className="bg-white rounded-xl border overflow-hidden">
                <div role="button" tabIndex={0} onClick={()=>setExpandVariantes(v=>!v)}
                  onKeyDown={e => e.key === 'Enter' && setExpandVariantes(v=>!v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                  <span>Variantes ({seleccion.variantes?.length ?? 0})</span>
                  <div className="flex items-center gap-2">
                    <Button type="button" size="sm" variant="ghost" onClick={e=>{e.stopPropagation();abrirCrearVariante()}}
                      className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-1">
                      <Plus size={12}/>Agregar
                    </Button>
                    {expandVariantes ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                  </div>
                </div>
                {expandVariantes && (
                  <div className="divide-y divide-slate-100">
                    {(seleccion.variantes ?? []).map(v => (
                      <div key={v.id} className={`flex items-center justify-between px-4 py-3 text-sm ${!v.activo?'opacity-50':''}`}>
                        <div className="flex items-center gap-3">
                          {v.imagenUrl ? (
                            <img src={getImagenUrl(v.imagenUrl)} alt={v.sku} className="w-10 h-10 object-cover rounded-md border" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 rounded-md border flex items-center justify-center text-slate-400">
                              <Package size={16}/>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-800">
                              {v.talla && `T.${v.talla}`}{v.talla&&v.color&&' · '}{v.color}
                            </p>
                            <p className="text-xs text-slate-400">SKU: {v.sku} · Stock: {v.stockActual-v.stockReservado} libre</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{formatCurrency(v.precioVenta)}</span>
                          <button onClick={()=>abrirEditarVariante(v)} className="text-slate-400 hover:text-slate-700"><Edit2 size={13}/></button>
                          <button onClick={()=>toggleVariante(v)} className="text-slate-400 hover:text-slate-700">
                            {v.activo?<ToggleLeft size={13}/>:<ToggleRight size={13}/>}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {seleccion.descripcion && (
              <div className="bg-white rounded-xl border p-4 text-sm text-slate-600">
                <p className="text-xs text-slate-400 mb-1">Descripción</p>{seleccion.descripcion}
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={modalProd} onOpenChange={setModalProd}>
        <DialogContent aria-describedby={undefined} className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editandoProd?'Editar producto':'Nuevo producto'}</DialogTitle>
            <DialogDescription className="sr-only">Formulario para gestionar productos</DialogDescription>
          </DialogHeader>
          <form onSubmit={formProd.handleSubmit(onGuardarProd)} className="space-y-4 pt-1">
            
            <div className="flex items-start gap-4">
              <label className="shrink-0 group cursor-pointer border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl w-24 h-24 flex flex-col items-center justify-center relative overflow-hidden bg-slate-50 transition-colors">
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" 
                  onChange={e => {
                    if (e.target.files[0]) {
                      setImagenProd(e.target.files[0])
                      setPreviewProd(URL.createObjectURL(e.target.files[0]))
                    }
                  }} />
                {previewProd ? (
                  <img src={previewProd} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <UploadCloud size={20} className="text-slate-400 group-hover:text-blue-500 mb-1" />
                    <span className="text-[10px] font-medium text-slate-500">Subir foto</span>
                  </>
                )}
              </label>

              <div className="flex-1 space-y-3">
                <Campo label="Nombre" required error={formProd.formState.errors.nombre?.message}>
                  <Input {...formProd.register('nombre')}/>
                </Campo>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Campo label="Tipo" required error={formProd.formState.errors.tipoProducto?.message}>
                <Select value={tipoSelec} onValueChange={v=>formProd.setValue('tipoProducto',v)} disabled={!!editandoProd}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{TIPOS.map(t=><SelectItem key={t} value={t}>{ETIQ_TIPO[t]}</SelectItem>)}</SelectContent>
                </Select>
              </Campo>
              <Campo label="Categoría" required error={formProd.formState.errors.categoriaId?.message}>
                <Select value={String(formProd.watch('categoriaId')||'')} onValueChange={v=>formProd.setValue('categoriaId',Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar…"/></SelectTrigger>
                  <SelectContent>{categorias.map(c=><SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </Campo>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Marca"><Input {...formProd.register('marca')}/></Campo>
              <Campo label="SKU Base"><Input {...formProd.register('skuBase')}/></Campo>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Precio venta (₡)" error={formProd.formState.errors.precioVenta?.message}>
                <Input type="number" min="0" step="50" {...formProd.register('precioVenta')}/>
              </Campo>
              <Campo label="Precio compra (₡)">
                <Input type="number" min="0" step="50" {...formProd.register('precioCompra')}/>
              </Campo>
            </div>
            <div className="space-y-2 pt-1">
              {!editandoProd && <CheckField label="Usa variantes (tallas/colores)" checked={usaVariantes} onChange={v=>formProd.setValue('usaVariantes',v)}/>}
              <CheckField label="Maneja stock" checked={manejaStock} onChange={v=>formProd.setValue('manejaStock',v)}/>
              <CheckField label="Visible en portal público" checked={formProd.watch('visiblePublico')} onChange={v=>formProd.setValue('visiblePublico',v)}/>
            </div>
            {manejaStock && !usaVariantes && (
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Stock mínimo" error={formProd.formState.errors.stockMinimo?.message}>
                  <Input type="number" min="0" {...formProd.register('stockMinimo')}/>
                </Campo>
                {!editandoProd && (
                  <Campo label="Stock inicial" error={formProd.formState.errors.stockInicial?.message}>
                    <Input type="number" min="0" {...formProd.register('stockInicial')}/>
                  </Campo>
                )}
              </div>
            )}
            <Campo label="Descripción"><Textarea rows={2} {...formProd.register('descripcion')}/></Campo>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={()=>setModalProd(false)}>Cancelar</Button>
              <Button type="submit" disabled={enviando}>{enviando?'Guardando…':editandoProd?'Guardar cambios':'Crear producto'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL — Crear/Editar variante */}
      <Dialog open={modalVariante} onOpenChange={setModalVariante}>
        <DialogContent aria-describedby={undefined} className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editandoVar?'Editar variante':'Nueva variante'}</DialogTitle>
            <DialogDescription className="sr-only">Formulario para gestionar variantes de producto</DialogDescription>
          </DialogHeader>
          <form onSubmit={formVar.handleSubmit(onGuardarVariante)} className="space-y-4 pt-1">
            
            <div className="flex justify-center mb-2">
              <label className="shrink-0 group cursor-pointer border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl w-24 h-24 flex flex-col items-center justify-center relative overflow-hidden bg-slate-50 transition-colors">
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" 
                  onChange={e => {
                    if (e.target.files[0]) {
                      setImagenVar(e.target.files[0])
                      setPreviewVar(URL.createObjectURL(e.target.files[0]))
                    }
                  }} />
                {previewVar ? (
                  <img src={previewVar} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <UploadCloud size={20} className="text-slate-400 group-hover:text-blue-500 mb-1" />
                    <span className="text-[10px] font-medium text-slate-500">Subir foto</span>
                  </>
                )}
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Campo label="Talla"><Input {...formVar.register('talla')}/></Campo>
              <Campo label="Color"><Input {...formVar.register('color')}/></Campo>
            </div>
            <Campo label="SKU" required error={formVar.formState.errors.sku?.message}>
              <Input {...formVar.register('sku')} disabled={!!editandoVar}/>
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Precio venta (₡)" error={formVar.formState.errors.precioVenta?.message}>
                <Input type="number" min="0" step="50" {...formVar.register('precioVenta')}/>
              </Campo>
              <Campo label="Precio compra (₡)">
                <Input type="number" min="0" step="50" {...formVar.register('precioCompra')}/>
              </Campo>
            </div>
            {!editandoVar && (
              <Campo label="Stock inicial" error={formVar.formState.errors.stockInicial?.message}>
                <Input type="number" min="0" {...formVar.register('stockInicial')}/>
              </Campo>
            )}
            <DialogFooter>
              <Button variant="outline" type="button" onClick={()=>setModalVariante(false)}>Cancelar</Button>
              <Button type="submit" disabled={enviando}>{enviando?'Guardando…':editandoVar?'Guardar':'Crear variante'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
