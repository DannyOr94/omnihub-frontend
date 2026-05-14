import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  Search, Filter, ShoppingBag, Clock, Check, 
  Upload, X, Package, ChevronRight, Info, Star,
  TrendingUp, Zap, ChevronLeft
} from 'lucide-react'
import { publicApi } from '../../api/index'
import { formatCurrency, cn } from '../../utils'
import TestimonialsSection from '../../components/home/TestimonialsSection'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Label } from '../../components/ui/label'
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogDescription 
} from '../../components/ui/dialog'
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger 
} from '../../components/ui/sheet'
import { Switch } from '../../components/ui/switch'

// ─── Componente de Card de Producto ──────────────────────────────────────────
function ProductoCard({ producto, onReservar }) {
  const tieneVariantes = producto.usaVariantes && producto.variantes?.length > 0
  const [varianteId, setVarianteId] = useState(tieneVariantes ? producto.variantes[0].id : null)

  const varianteSeleccionada = tieneVariantes 
    ? producto.variantes.find(v => v.id === varianteId)
    : null

  const precio = varianteSeleccionada ? varianteSeleccionada.precioVenta : producto.precioVenta
  const stock  = varianteSeleccionada ? varianteSeleccionada.stockDisponible : producto.stockDisponible
  const disponible = varianteSeleccionada ? varianteSeleccionada.disponible : producto.disponible

  return (
    <div className={cn(
      "group relative bg-white rounded-3xl border border-slate-200 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 flex flex-col h-full",
      !disponible && "opacity-75 grayscale-[0.5]"
    )}>
      {/* Imagen */}
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        {/* Gatillo: Badge de Popularidad */}
        {(producto.id % 3 === 0) && (
          <div className="absolute top-4 left-4 z-10 animate-bounce">
            <div className="bg-amber-400 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-amber-500/30 flex items-center gap-1.5 uppercase tracking-tighter">
              <TrendingUp size={12} /> Top Ventas
            </div>
          </div>
        )}
        {(producto.id % 5 === 0) && (
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-indigo-500/30 flex items-center gap-1.5 uppercase tracking-tighter">
              <Zap size={12} /> Tendencia
            </div>
          </div>
        )}

        {producto.imagenUrl ? (
          <img 
            src={varianteSeleccionada?.imagenUrl || producto.imagenUrl} 
            alt={producto.nombre}
            className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Package size={48} strokeWidth={1} />
          </div>
        )}
        
        {/* Badge de Stock */}
        <div className="absolute bottom-4 left-4">
          <Badge className={cn(
            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-0 shadow-lg",
            disponible ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
          )}>
            {disponible ? `En Stock: ${stock}` : 'Agotado'}
          </Badge>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex-1">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">
            {producto.categoria?.nombre || 'General'}
          </p>
          
          <h3 className="text-lg font-black text-slate-900 leading-tight mb-1 group-hover:text-blue-600 transition-colors">
            {producto.nombre}
          </h3>

          {/* Gatillo: Estrellas de Confianza */}
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} size={10} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">(4.9/5 • 12 reseñas)</span>
          </div>
          
          {/* Variantes Selector */}
          {tieneVariantes && (
            <div className="flex flex-wrap gap-2 mb-4">
              {producto.variantes.map(v => {
                const vStock = v.stockDisponible
                const vDisp = v.disponible
                return (
                  <button
                    key={v.id}
                    disabled={!vDisp}
                    onClick={() => setVarianteId(v.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all",
                      varianteId === v.id 
                        ? "border-blue-600 bg-blue-50 text-blue-700" 
                        : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200",
                      !vDisp && "opacity-40 cursor-not-allowed border-dashed"
                    )}
                  >
                    {v.talla && `T.${v.talla} `}
                    {v.color}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Gatillo: Escasez (Scarcity) */}
        {disponible && stock <= 5 && (
          <div className="mb-4 animate-pulse">
            <p className="text-[10px] font-black text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
              <Clock size={12} /> ¡SOLO QUEDAN {stock} DISPONIBLES!
            </p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Precio Online</span>
            <span className="text-xl font-black text-slate-900">{formatCurrency(precio)}</span>
          </div>
          
          {disponible && (
            <Button 
              size="sm"
              onClick={() => onReservar({
                productoId: producto.id,
                varianteId: varianteSeleccionada?.id,
                nombre: producto.nombre,
                precio,
                imagenUrl: varianteSeleccionada?.imagenUrl || producto.imagenUrl,
                varianteTexto: varianteSeleccionada ? `${varianteSeleccionada.talla ? 'Talla ' + varianteSeleccionada.talla : ''} ${varianteSeleccionada.color}` : ''
              })}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/20 px-6"
            >
              <ShoppingBag size={16} className="mr-2" />
              Apartar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function SkeletonProductCard() {
  return (
    <div className="bg-white rounded-[2rem] p-5 border border-slate-100 flex flex-col h-full animate-pulse">
      <div className="aspect-square rounded-2xl mb-6 bg-slate-100" />
      <div className="flex-1 space-y-3">
        <div className="h-3 w-1/4 bg-slate-100 rounded-full" />
        <div className="h-5 w-3/4 bg-slate-100 rounded-full" />
        <div className="h-4 w-1/2 bg-slate-100 rounded-full" />
      </div>
      <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-12 bg-slate-100 rounded-full" />
          <div className="h-6 w-20 bg-slate-100 rounded-full" />
        </div>
        <div className="h-10 w-24 bg-slate-100 rounded-xl" />
      </div>
    </div>
  )
}

// ─── Modal Reserva ────────────────────────────────────────────────────────────
function ModalReserva({ abierto, setAbierto, producto, onSuccess, cuentasPago = [] }) {
  const [step, setStep] = useState(1) // 1: Datos, 2: Pago, 3: Comprobante, 4: Éxito
  const [reservaId, setReservaId] = useState(null)
  const [formData, setFormData] = useState({ nombreContacto: '', telefonoContacto: '', correoContacto: '' })
  const [archivo, setArchivo] = useState(null)
  
  const queryClient = useQueryClient()

  const reservarMutation = useMutation({
    mutationFn: (datos) => publicApi.reservarTemporal(datos),
    onSuccess: (res) => {
      setReservaId(res.data.data.id)
      setStep(2)
      toast.success('¡Inventario reservado!', { description: 'Ahora puedes realizar el pago.' })
      queryClient.invalidateQueries({ queryKey: ['catalogo'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error al intentar reservar el producto')
    }
  })

  const subirComprobanteMutation = useMutation({
    mutationFn: ({ id, fd }) => publicApi.subirComprobanteTemporal(id, fd),
    onSuccess: (res) => {
      toast.success('¡Comprobante enviado!', { description: 'Revisaremos tu pago pronto.' })
      onSuccess(res.data)
      setStep(4)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error al subir comprobante')
    }
  })

  const handleClose = () => {
    setAbierto(false)
    setTimeout(() => {
      setStep(1)
      setReservaId(null)
      setFormData({ nombreContacto: '', telefonoContacto: '', correoContacto: '' })
      setArchivo(null)
    }, 300)
  }

  const handleReservarSubmit = (e) => {
    e.preventDefault()
    
    // Validaciones extra
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const telRegex = /^[0-9\s+]{8,15}$/

    if (!emailRegex.test(formData.correoContacto)) {
      return toast.error('El correo electrónico no es válido')
    }
    if (!telRegex.test(formData.telefonoContacto)) {
      return toast.error('El número de teléfono debe tener al menos 8 dígitos')
    }

    reservarMutation.mutate({
      productoId: producto.productoId,
      varianteId: producto.varianteId,
      nombreContacto: formData.nombreContacto,
      telefonoContacto: formData.telefonoContacto,
      correoContacto: formData.correoContacto
    })
  }

  const handleSubirSubmit = (e) => {
    e.preventDefault()
    if (!archivo) return toast.error('Debes seleccionar una imagen')
    const fd = new FormData()
    fd.append('comprobante', archivo)
    subirComprobanteMutation.mutate({ id: reservaId, fd })
  }

  if (!producto) return null

  // Usamos las cuentas que vienen de la DB o un fallback si no hay ninguna
  const cuentasAMostrar = cuentasPago.length > 0 ? cuentasPago : [
    { banco: 'SINPE Móvil', titular: 'Consultar al comercio', numero: 'No configurado' }
  ]

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
        
        {/* Banner dinámico */}
        <div className={cn(
          "p-8 text-center text-white relative transition-all duration-700",
          step === 1 && "bg-gradient-to-br from-blue-600 to-indigo-700",
          step === 2 && "bg-gradient-to-br from-indigo-600 to-purple-700",
          step === 3 && "bg-gradient-to-br from-amber-500 to-orange-600",
          step === 4 && "bg-gradient-to-br from-emerald-500 to-teal-600"
        )}>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/30">
            {step === 4 ? <Check size={32} /> : <Clock size={32} />}
          </div>
          <DialogTitle className="text-2xl font-black mb-2 text-white">
            {step === 1 && 'Apartar Producto'}
            {step === 2 && 'Información de Pago'}
            {step === 3 && 'Enviar Comprobante'}
            {step === 4 && '¡Todo Listo!'}
          </DialogTitle>
          <DialogDescription className="font-medium text-white/80">
            {step === 1 && 'Asegura el inventario por 15 minutos.'}
            {step === 2 && 'Realiza la transferencia para confirmar.'}
            {step === 3 && 'Adjunta la captura de pantalla del pago.'}
            {step === 4 && 'Tu reserva ha sido enviada a revisión.'}
          </DialogDescription>
        </div>

        <div className="p-6">
          {step === 1 && (
            <form onSubmit={handleReservarSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre Completo</Label>
                <Input 
                  required
                  placeholder="Ej. Juan Pérez"
                  className="h-12 rounded-xl bg-slate-50 border-slate-200"
                  value={formData.nombreContacto}
                  onChange={e => setFormData({...formData, nombreContacto: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">WhatsApp</Label>
                  <Input 
                    required
                    placeholder="8888-8888"
                    className="h-12 rounded-xl bg-slate-50 border-slate-200"
                    value={formData.telefonoContacto}
                    onChange={e => setFormData({...formData, telefonoContacto: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Correo</Label>
                  <Input 
                    required
                    type="email"
                    placeholder="tu@email.com"
                    className="h-12 rounded-xl bg-slate-50 border-slate-200"
                    value={formData.correoContacto}
                    onChange={e => setFormData({...formData, correoContacto: e.target.value})}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-lg">
                {reservarMutation.isPending ? 'Procesando...' : 'Asegurar Inventario'}
              </Button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6 text-slate-900">
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl text-center">
                <p className="text-xs font-bold text-indigo-700 mb-1 uppercase tracking-wider">Monto a Transferir</p>
                <p className="text-3xl font-black text-indigo-900">{formatCurrency(producto.precio)}</p>
              </div>
              <div className="space-y-3">
                {cuentasAMostrar.map((c, i) => (
                  <div key={i} className="p-3 bg-white border border-slate-100 rounded-xl flex flex-col">
                    <span className="text-xs font-black text-blue-600">{c.banco}</span>
                    {c.tipo && <span className="text-[10px] text-slate-400 font-bold uppercase">{c.tipo}</span>}
                    <span className="text-sm font-bold text-slate-800 mt-1 select-all">{c.numero}</span>
                    <span className="text-[10px] text-slate-500">A nombre de: {c.titular}</span>
                  </div>
                ))}
              </div>
              <Button onClick={() => setStep(3)} className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black">
                Ya realicé el pago
              </Button>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubirSubmit} className="space-y-6">
              <label htmlFor="comprobante" className="flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed rounded-3xl cursor-pointer hover:bg-orange-50 transition-all border-slate-200 bg-slate-50">
                <Upload size={24} className="text-slate-400" />
                <div className="text-center">
                  <p className="font-bold text-slate-900">{archivo ? 'Imagen lista' : 'Sube tu comprobante'}</p>
                  <p className="text-xs text-slate-500">{archivo ? archivo.name : 'Formatos JPG, PNG'}</p>
                </div>
                <input type="file" id="comprobante" className="hidden" accept="image/*" onChange={e => setArchivo(e.target.files[0])} />
              </label>
              <Button type="submit" className="w-full h-14 bg-orange-600 text-white rounded-2xl font-black shadow-lg">
                {subirComprobanteMutation.isPending ? 'Enviando...' : 'Confirmar mi Apartado'}
              </Button>
              <button type="button" onClick={() => setStep(2)} className="w-full text-xs font-bold text-slate-400">← Volver a cuentas</button>
            </form>
          )}

          {step === 4 && (
            <div className="space-y-6 text-center animate-in fade-in zoom-in duration-500">
              <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                <h4 className="text-lg font-black text-emerald-900">¡Recibido!</h4>
                <p className="text-sm text-emerald-700 mt-1">
                  Tu reserva <strong>#W-{reservaId}</strong> ha sido registrada.
                  Te enviamos un correo a <strong>{formData.correoContacto}</strong>.
                </p>
              </div>
              <div className="p-4 border border-slate-100 rounded-2xl space-y-2 text-sm text-slate-800">
                <div className="flex justify-between"><span className="text-slate-500">Cliente:</span><span className="font-bold">{formData.nombreContacto}</span></div>
                <div className="flex justify-between text-blue-600 font-bold"><span>Total:</span><span>{formatCurrency(producto.precio)}</span></div>
              </div>
              <Button onClick={handleClose} className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold">Entendido</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function CatalogoPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [busqueda,     setBusqueda]     = useState('')
  const [debouncedBusqueda, setDebouncedBusqueda] = useState('')
  const [categoriaId,  setCategoriaId]  = useState(null)
  const [soloDisponibles, setSoloDisponibles] = useState(false)
  const [sugerenciasAbiertas, setSugerenciasAbiertas] = useState(false)
  
  const [modalAbierto, setModalAbierto] = useState(false)
  const [productoAReservar, setProductoAReservar] = useState(null)

  const queryClient = useQueryClient()
  const tipoFiltro = searchParams.get('tipo') ?? ''

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedBusqueda(busqueda), 300)
    return () => clearTimeout(timer)
  }, [busqueda])

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClick = () => setSugerenciasAbiertas(false)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const r = await publicApi.categorias()
      return r.data?.data ?? []
    }
  })

  const { data: homeConfig } = useQuery({
    queryKey: ['home-config-public'],
    queryFn: async () => {
      const r = await publicApi.homeConfig()
      return r.data?.data
    }
  })

  const { data: productos = [], isLoading: cargando } = useQuery({
    queryKey: ['catalogo', debouncedBusqueda, categoriaId, tipoFiltro, soloDisponibles],
    queryFn: async () => {
      const r = await publicApi.catalogo({
        busqueda: debouncedBusqueda || undefined,
        categoriaId: categoriaId || undefined,
      })
      let lista = r.data?.data ?? []
      if (tipoFiltro) lista = lista.filter(p => p.tipoProducto === tipoFiltro)
      if (soloDisponibles) lista = lista.filter(p => p.disponible)
      return lista
    }
  })

  const handleIniciarReserva = (productoInfo) => {
    setProductoAReservar(productoInfo)
    setModalAbierto(true)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <ModalReserva 
        abierto={modalAbierto} 
        setAbierto={setModalAbierto} 
        producto={productoAReservar} 
        cuentasPago={homeConfig?.cuentasPago || []}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['catalogo'] })}
      />

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Catálogo</h1>
        <p className="text-slate-500 mt-2 font-medium">Encuentra moda y tecnología en un solo lugar.</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 group" onClick={e => e.stopPropagation()}>
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar productos..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            onFocus={() => setSugerenciasAbiertas(true)}
            className="pl-12 h-14 bg-white border-2 border-slate-200 rounded-2xl focus:border-blue-500 transition-all"
          />

          {/* Sugerencias Predictivas */}
          {sugerenciasAbiertas && busqueda.length >= 2 && productos.length > 0 && (
            <div className="absolute top-16 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2">
                {productos.slice(0, 5).map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setBusqueda(p.nombre)
                      setSugerenciasAbiertas(false)
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left group/item"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                      {p.imagenUrl && <img src={p.imagenUrl} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{p.nombre}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                        {p.marca || 'Sin Marca'} • {formatCurrency(p.precioVenta)}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover/item:text-blue-500 group-hover/item:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
              <div className="bg-slate-50 p-3 text-center border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Presiona Enter para ver todos los resultados
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Filtros: Desktop (Inline/Toggle) y Mobile (Bottom Sheet) */}
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              className={cn("h-14 px-6 rounded-2xl border-2", (categoriaId || tipoFiltro || soloDisponibles) && "border-blue-600 bg-blue-50 text-blue-600")}
            >
              <Filter size={18} className="mr-2" /> 
              <span className="hidden sm:inline">Filtros</span>
              {(categoriaId || tipoFiltro || soloDisponibles) && (
                <Badge className="ml-2 bg-blue-600 h-5 w-5 p-0 flex items-center justify-center rounded-full">!</Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-[2.5rem] h-[80vh] sm:h-auto overflow-y-auto border-t-0 bg-white">
            <SheetHeader className="pb-6 border-b border-slate-100 mb-6">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4" />
              <SheetTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <Filter size={24} className="text-blue-600" /> Refinar Búsqueda
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-8 pb-10">
              {/* Categorías */}
              <div className="space-y-4">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Categorías</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={!categoriaId ? 'default' : 'outline'}
                    onClick={() => setCategoriaId('')}
                    className="rounded-xl font-bold"
                  >
                    Todas
                  </Button>
                  {categorias.map(c => (
                    <Button
                      key={c.id}
                      variant={categoriaId === String(c.id) ? 'default' : 'outline'}
                      onClick={() => setCategoriaId(String(c.id))}
                      className="rounded-xl font-bold"
                    >
                      {c.nombre}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Tipos */}
              <div className="space-y-4">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tipo de Producto</Label>
                <div className="flex gap-2">
                  {[
                    { val: '', label: 'Cualquiera' },
                    { val: 'FASHION', label: 'Moda' },
                    { val: 'TECH', label: 'Tecnología' }
                  ].map(t => (
                    <Button
                      key={t.val}
                      variant={tipoFiltro === t.val ? 'secondary' : 'outline'}
                      onClick={() => setSearchParams({ tipo: t.val })}
                      className="flex-1 rounded-xl font-bold"
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Disponibilidad */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-slate-900">Solo Disponibles</Label>
                  <p className="text-xs text-slate-500">Ocultar productos agotados</p>
                </div>
                <Switch 
                  checked={soloDisponibles} 
                  onCheckedChange={setSoloDisponibles} 
                />
              </div>

              <Button 
                className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-500/20"
                onClick={() => document.querySelector('[data-radix-collection-item]')?.click()} // Cierra el sheet
              >
                Ver Resultados
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Grid de Productos */}
      {cargando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(n => <SkeletonProductCard key={n} />)}
        </div>
      ) : productos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productos.map(p => (
            <ProductoCard key={p.id} producto={p} onReservar={handleIniciarReserva} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package size={40} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No encontramos productos</h3>
          <p className="text-slate-500">Prueba ajustando los filtros o la búsqueda.</p>
        </div>
      )}

      {/* Social Proof Final: Testimonios */}
      <div className="pt-20">
        <TestimonialsSection 
          testimonios={homeConfig?.testimonios || []} 
          visible={true}
        />
      </div>
    </div>
  )
}
