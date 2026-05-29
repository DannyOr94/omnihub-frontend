import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  Search, Filter, ShoppingBag, Clock, Check, 
  Upload, X, Package, ChevronRight, Info, Star,
  TrendingUp, Zap, ChevronLeft, ArrowRight
} from 'lucide-react'
import { publicApi, analyticsApi } from '../../api/index'
import { formatCurrency, cn, getImagenUrl } from '../../utils'

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
            src={getImagenUrl(varianteSeleccionada?.imagenUrl || producto.imagenUrl)} 
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
  const [step, setStep] = useState(1) // 1: Datos, 2: Solicitado (Éxito inicial), 3: Comprobante (Legacy/Directo), 4: Éxito Final
  const [reservaId, setReservaId] = useState(null)
  const [formData, setFormData] = useState({ nombreContacto: '', telefonoContacto: '', correoContacto: '' })
  const [archivo, setArchivo] = useState(null)
  
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  useEffect(() => {
    if (abierto && producto?.productoId) {
      let sesionId = localStorage.getItem('analytics_session_id')
      if (!sesionId) {
        sesionId = Math.random().toString(36).substring(2) + Date.now().toString(36)
        localStorage.setItem('analytics_session_id', sesionId)
      }

      const detectarDispositivo = () => {
        return window.innerWidth < 768 ? 'Mobile' : 'Desktop'
      }

      analyticsApi.registrarVisita({
        productoId: producto.productoId,
        sesionId,
        dispositivo: detectarDispositivo()
      }).catch(err => console.log('Error analítico de visita silencioso:', err))
    }
  }, [abierto, producto?.productoId])

  const reservarMutation = useMutation({
    mutationFn: (datos) => publicApi.reservarTemporal(datos),
    onSuccess: (res) => {
      setReservaId(res.data.data.id)
      setStep(2)
      toast.success('¡Solicitud enviada!', { description: 'Revisaremos la disponibilidad pronto.' })
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

  const handleIrASeguimiento = () => {
    handleClose()
    navigate(`/reserva/${reservaId}`)
  }

  const handleReservarSubmit = (e) => {
    e.preventDefault()
    
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

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-0 shadow-2xl bg-white">
        
        {/* Banner dinámico */}
        <div className={cn(
          "p-10 text-center text-white relative transition-all duration-700",
          step === 1 && "bg-slate-900",
          step === 2 && "bg-blue-600",
          step === 3 && "bg-amber-500",
          step === 4 && "bg-emerald-500"
        )}>
          {/* Círculo decorativo */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/30 shadow-inner">
            {step === 4 ? <Check size={36} /> : step === 2 ? <Check size={36} /> : <ShoppingBag size={36} />}
          </div>
          <DialogTitle className="text-3xl font-black mb-2 text-white">
            {step === 1 && 'Apartar Producto'}
            {step === 2 && '¡Solicitud Recibida!'}
            {step === 3 && 'Enviar Comprobante'}
            {step === 4 && '¡Todo Listo!'}
          </DialogTitle>
          <DialogDescription className="font-medium text-white/80 text-base">
            {step === 1 && 'Ingresa tus datos para procesar el apartado.'}
            {step === 2 && 'Estamos verificando el stock para ti.'}
            {step === 3 && 'Adjunta la captura de pantalla del pago.'}
            {step === 4 && 'Tu comprobante está en revisión.'}
          </DialogDescription>
        </div>

        <div className="p-8">
          {step === 1 && (
            <form onSubmit={handleReservarSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre Completo</Label>
                <Input 
                  required
                  placeholder="Ej. Juan Pérez"
                  className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus:ring-blue-500 focus:border-blue-500 font-bold"
                  value={formData.nombreContacto}
                  onChange={e => setFormData({...formData, nombreContacto: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">WhatsApp</Label>
                  <Input 
                    required
                    placeholder="8888-8888"
                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-bold"
                    value={formData.telefonoContacto}
                    onChange={e => setFormData({...formData, telefonoContacto: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Correo</Label>
                  <Input 
                    required
                    type="email"
                    placeholder="tu@email.com"
                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-bold"
                    value={formData.correoContacto}
                    onChange={e => setFormData({...formData, correoContacto: e.target.value})}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-16 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-900/20 transition-all mt-4">
                {reservarMutation.isPending ? 'Procesando...' : 'Confirmar Solicitud'}
              </Button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-8 text-center py-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-4">
                <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 relative group overflow-hidden">
                   <div className="relative z-10">
                    <p className="text-sm font-black text-blue-900 mb-2">¡Casi es tuyo!</p>
                    <p className="text-xs text-blue-700 leading-relaxed font-medium">
                      Un administrador está verificando la disponibilidad física de <strong>{producto.nombre}</strong>. 
                      Te avisaremos por correo y WhatsApp apenas esté confirmado.
                    </p>
                   </div>
                   <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-blue-200/30 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                </div>

                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
                    <Clock size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Siguiente Paso</p>
                    <p className="text-xs font-bold text-slate-700">Recibirás un link de pago con las cuentas bancarias.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleIrASeguimiento} 
                  className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  Seguir mi Reserva <ArrowRight size={20} />
                </Button>
                <Button 
                  variant="ghost"
                  onClick={handleClose} 
                  className="w-full h-12 text-slate-400 hover:text-slate-900 font-bold"
                >
                  Cerrar y volver al catálogo
                </Button>
              </div>
              
              <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">
                Ticket ID: #{reservaId}
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 text-center py-2 animate-in fade-in zoom-in duration-500">
              <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100">
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                  <Check size={32} />
                </div>
                <h4 className="text-xl font-black text-emerald-900 mb-2">¡Recibido con éxito!</h4>
                <p className="text-sm text-emerald-700 font-medium leading-relaxed">
                  Tu comprobante ha sido enviado. Estamos validando el ingreso en nuestra cuenta bancaria.
                </p>
              </div>
              
              <Button 
                onClick={handleIrASeguimiento} 
                className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20"
              >
                Ver Estado Actual
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Componente de Filtros Reusable ──────────────────────────────────────────
function FiltrosContent({ 
  categorias, 
  tipoFiltro, 
  setSearchParams, 
  categoriaId, 
  setCategoriaId, 
  soloDisponibles, 
  setSoloDisponibles,
  totalResultados,
  onClose
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header (Solo Mobile) */}
      <div className="lg:hidden pt-4 pb-2 px-8 flex flex-col items-center">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mb-6" />
        <div className="w-full flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Filter size={24} className="text-blue-600" /> Refinar
          </h2>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-blue-600 font-bold hover:bg-blue-50 rounded-xl"
            onClick={() => {
              setCategoriaId('')
              setSearchParams({ tipo: '' })
              setSoloDisponibles(false)
            }}
          >
            Limpiar
          </Button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block mb-8">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Filter size={20} className="text-blue-600" /> Refinar búsqueda
        </h2>
      </div>

      {/* Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-0 lg:px-0 py-6 lg:py-0 space-y-10 custom-scrollbar pr-2">
        
        {/* 1. Departamento */}
        <div className="space-y-4">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Departamento</Label>
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
            {[
              { val: '', label: 'Todo', icon: Package },
              { val: 'FASHION', label: 'Moda', icon: ShoppingBag },
              { val: 'TECH', label: 'Tecnología', icon: Zap }
            ].map(t => {
              const active = tipoFiltro === t.val
              return (
                <button
                  key={t.val}
                  onClick={() => {
                    setSearchParams({ tipo: t.val })
                    setCategoriaId('')
                  }}
                  className={cn(
                    "flex lg:flex-row flex-col items-center justify-center lg:justify-start gap-3 p-4 rounded-2xl border-2 transition-all duration-300",
                    active 
                      ? "border-blue-600 bg-blue-50 text-blue-600 shadow-md lg:shadow-none" 
                      : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                  )}
                >
                  <t.icon size={18} className={active ? 'text-blue-600' : 'text-slate-400'} />
                  <span className="text-[10px] lg:text-xs font-black uppercase tracking-tight">{t.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 2. Categorías Dinámicas */}
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Categorías</Label>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            <button
              onClick={() => setCategoriaId('')}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left group",
                !categoriaId ? "border-blue-600 bg-blue-50" : "border-slate-100 hover:border-slate-200"
              )}
            >
              <div className={cn(
                "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                !categoriaId ? "bg-blue-600 border-blue-600" : "border-slate-200"
              )}>
                {!categoriaId && <Check size={10} className="text-white" strokeWidth={4} />}
              </div>
              <span className={cn("text-xs font-bold", !categoriaId ? "text-blue-900" : "text-slate-600")}>Todas</span>
            </button>

            {categorias
              .filter(c => !tipoFiltro || c.tipoProducto === tipoFiltro)
              .filter((val, idx, self) => idx === self.findIndex(t => t.nombre === val.nombre))
              .map(c => {
                const active = categoriaId === String(c.id)
                return (
                  <button
                    key={c.id}
                    onClick={() => setCategoriaId(active ? '' : String(c.id))}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left group",
                      active ? "border-blue-600 bg-blue-50" : "border-slate-100 hover:border-slate-200"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                      active ? "bg-blue-600 border-blue-600" : "border-slate-200"
                    )}>
                      {active && <Check size={10} className="text-white" strokeWidth={4} />}
                    </div>
                    <span className={cn("text-xs font-bold truncate", active ? "text-blue-900" : "text-slate-600")}>
                      {c.nombre}
                    </span>
                  </button>
                )
            })}
          </div>
        </div>

        {/* 3. Disponibilidad */}
        <div className="space-y-4">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Inventario</Label>
          <div 
            onClick={() => setSoloDisponibles(!soloDisponibles)}
            className={cn(
              "flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all",
              soloDisponibles ? "border-emerald-500 bg-emerald-50" : "border-slate-100 bg-slate-50 hover:border-slate-200"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                soloDisponibles ? "bg-emerald-500 text-white" : "bg-white text-slate-400 border border-slate-200"
              )}>
                <TrendingUp size={18} />
              </div>
              <Label className={cn("text-xs font-black", soloDisponibles ? "text-emerald-900" : "text-slate-900")}>Solo Disponibles</Label>
            </div>
            <Switch 
              checked={soloDisponibles} 
              onCheckedChange={setSoloDisponibles}
              className="data-[state=checked]:bg-emerald-500 scale-75"
            />
          </div>
        </div>
      </div>

      {/* Mobile Footer */}
      <div className="lg:hidden p-8 bg-white border-t border-slate-100 shadow-[0_-20px_40px_rgba(0,0,0,0.02)]">
        <Button 
          className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 transition-all"
          onClick={onClose}
        >
          Ver {totalResultados} Resultados
        </Button>
      </div>
    </div>
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <ModalReserva 
        abierto={modalAbierto} 
        setAbierto={setModalAbierto} 
        producto={productoAReservar} 
        cuentasPago={homeConfig?.cuentasPago || []}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['catalogo'] })}
      />

      <div className="flex flex-col lg:flex-row gap-12">
        
        {/* Sidebar: Filtros Escritorio */}
        <aside className="hidden lg:block w-72 shrink-0 h-fit sticky top-24">
          <div className="mb-8">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Catálogo</h1>
            <p className="text-slate-500 mt-2 font-medium text-sm">Encuentra moda y tecnología Josefina.</p>
          </div>
          <FiltrosContent 
            categorias={categorias}
            tipoFiltro={tipoFiltro}
            setSearchParams={setSearchParams}
            categoriaId={categoriaId}
            setCategoriaId={setCategoriaId}
            soloDisponibles={soloDisponibles}
            setSoloDisponibles={setSoloDisponibles}
            totalResultados={productos.length}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-8">
          {/* Mobile Header */}
          <div className="lg:hidden mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Catálogo</h1>
            <p className="text-slate-500 mt-2 font-medium">Moda y tecnología en un solo lugar.</p>
          </div>

          {/* Search + Mobile Filter Button */}
          <div className="flex gap-3">
            <div className="relative flex-1 group" onClick={e => e.stopPropagation()}>
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar productos..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                onFocus={() => setSugerenciasAbiertas(true)}
                className="pl-12 h-14 bg-white border-2 border-slate-200 rounded-2xl focus:border-blue-500 transition-all shadow-sm"
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
                          {p.imagenUrl && <img src={getImagenUrl(p.imagenUrl)} className="w-full h-full object-cover" />}
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
                </div>
              )}
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn("lg:hidden h-14 px-6 rounded-2xl border-2 transition-all", (categoriaId || tipoFiltro || soloDisponibles) && "border-blue-600 bg-blue-50 text-blue-600")}
                >
                  <Filter size={18} className="mr-2" /> 
                  {(categoriaId || tipoFiltro || soloDisponibles) && (
                    <div className="ml-2 bg-blue-600 text-white text-[10px] h-5 w-5 flex items-center justify-center rounded-full font-black animate-in zoom-in">!</div>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-[3rem] h-[85vh] overflow-hidden border-t-0 bg-white p-0">
                <FiltrosContent 
                  categorias={categorias}
                  tipoFiltro={tipoFiltro}
                  setSearchParams={setSearchParams}
                  categoriaId={categoriaId}
                  setCategoriaId={setCategoriaId}
                  soloDisponibles={soloDisponibles}
                  setSoloDisponibles={setSoloDisponibles}
                  totalResultados={productos.length}
                  onClose={() => {
                    const closeBtn = document.querySelector('[data-state="open"] button.absolute.right-4.top-4')
                    if (closeBtn) closeBtn.click()
                  }}
                />
              </SheetContent>
            </Sheet>
          </div>

          {/* Grid de Productos */}
          {cargando ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(n => <SkeletonProductCard key={n} />)}
            </div>
          ) : productos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {productos.map(p => (
                <ProductoCard key={p.id} producto={p} onReservar={handleIniciarReserva} />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <Package size={48} className="text-slate-300" strokeWidth={1} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">No encontramos productos</h3>
              <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                Prueba ajustando los filtros de búsqueda o explorando otras categorías.
              </p>
              <Button 
                variant="link" 
                className="mt-6 text-blue-600 font-black uppercase tracking-widest text-xs"
                onClick={() => {
                  setCategoriaId('')
                  setSearchParams({ tipo: '' })
                  setSoloDisponibles(false)
                  setBusqueda('')
                }}
              >
                Limpiar todos los filtros
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
