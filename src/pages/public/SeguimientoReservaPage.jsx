import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  Clock, CheckCircle2, AlertCircle, Upload, 
  ChevronLeft, Copy, Smartphone, Building2, 
  Info, Package, ArrowRight, ShieldCheck
} from 'lucide-react'
import { publicApi } from '../../api'
import { formatCurrency, formatDateTime, cn, getImagenUrl } from '../../utils'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'

export default function SeguimientoReservaPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [archivo, setArchivo] = useState(null)
  const [copiado, setCopiado] = useState(null)

  // 1. Fetch de la reserva
  const { data: reserva, isLoading, error } = useQuery({
    queryKey: ['seguimiento-reserva', id],
    queryFn: async () => {
      const r = await publicApi.obtenerReserva(id)
      return r.data?.data
    },
    refetchInterval: (data) => {
      // Si está en revisión o solicitado, actualizar cada 30s para ver cambios de estado
      return (data?.estado === 'SOLICITADO' || data?.estado === 'EN_REVISION') ? 30000 : false
    }
  })

  // 2. Fetch de configuración para las cuentas (podemos sacarlo de homeConfig)
  const { data: homeConfig } = useQuery({
    queryKey: ['home-config-public'],
    queryFn: async () => {
      const r = await publicApi.homeConfig()
      return r.data?.data
    }
  })

  const subirMutation = useMutation({
    mutationFn: (formData) => publicApi.subirComprobanteTemporal(id, formData),
    onSuccess: () => {
      toast.success('¡Comprobante enviado!', { 
        description: 'Estamos revisando tu pago, te avisaremos pronto.' 
      })
      queryClient.invalidateQueries(['seguimiento-reserva', id])
      setArchivo(null)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error al subir el comprobante')
    }
  })

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiado(field)
    setTimeout(() => setCopiado(null), 2000)
    toast.success('Copiado al portapapeles')
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return toast.error('El archivo es muy pesado (máx 5MB)')
      }
      setArchivo(file)
    }
  }

  const handleUpload = (e) => {
    e.preventDefault()
    if (!archivo) return toast.error('Selecciona una imagen primero')
    const fd = new FormData()
    fd.append('comprobante', archivo)
    subirMutation.mutate(fd)
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="font-bold text-slate-500 animate-pulse">Cargando tu reserva...</p>
      </div>
    </div>
  )

  if (error || !reserva) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="max-w-md w-full border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <div className="p-12 text-center">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">No encontramos tu reserva</h2>
          <p className="text-slate-500 mb-8 font-medium">Verifica el enlace o contacta con soporte si crees que es un error.</p>
          <Link to="/catalogo">
            <Button className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black">
              Volver al Catálogo
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )

  const configEstados = {
    SOLICITADO: {
      label: 'Validando Disponibilidad',
      color: 'bg-indigo-500',
      icon: <Clock className="animate-pulse" />,
      desc: 'Un administrador está verificando físicamente el stock del producto. Te enviaremos un correo apenas esté listo.',
      step: 1
    },
    PENDIENTE_PAGO: {
      label: 'Esperando tu Pago',
      color: 'bg-amber-500',
      icon: <Smartphone />,
      desc: '¡Stock confirmado! Tienes el producto reservado. Realiza el pago y sube el comprobante aquí mismo.',
      step: 2
    },
    EN_REVISION: {
      label: 'Validando Comprobante',
      color: 'bg-blue-500',
      icon: <ShieldCheck className="animate-bounce" />,
      desc: 'Recibimos tu comprobante. Estamos verificando el ingreso en nuestra cuenta bancaria.',
      step: 3
    },
    LISTO_PARA_RETIRAR: {
      label: 'Listo para Retirar',
      color: 'bg-emerald-600',
      icon: <Package className="animate-bounce" />,
      desc: '¡Tu pago ha sido verificado! Ya puedes pasar por nuestra tienda física a recoger tu producto.',
      step: 4
    },
    ENTREGADO: {
      label: 'Pedido Entregado',
      color: 'bg-slate-900',
      icon: <CheckCircle2 />,
      desc: 'El producto ha sido entregado exitosamente. ¡Gracias por confiar en nosotros!',
      step: 5
    },
    APROBADO: {
      label: 'Pago Aprobado',
      color: 'bg-emerald-500',
      icon: <CheckCircle2 />,
      desc: '¡Todo listo! Tu pago fue validado exitosamente.',
      step: 4
    },
    RECHAZADO: {
      label: 'Reserva Cancelada',
      color: 'bg-red-500',
      icon: <AlertCircle />,
      desc: 'La reserva fue rechazada. El motivo ha sido enviado a tu correo electrónico.',
      step: 0
    },
    EXPIRADO: {
      label: 'Reserva Expirada',
      color: 'bg-slate-500',
      icon: <Clock />,
      desc: 'El tiempo de reserva se agotó y el producto fue liberado al catálogo.',
      step: 0
    }
  }

  const status = configEstados[reserva.estado] || configEstados.SOLICITADO
  const nombreProducto = reserva.variante 
    ? `${reserva.variante.producto.nombre} (${reserva.variante.color}${reserva.variante.talla ? ' - T. ' + reserva.variante.talla : ''})`
    : reserva.producto?.nombre

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Header / Navbar sutil */}
      <div className="bg-white border-b border-slate-200/60 sticky top-0 z-30 backdrop-blur-md bg-white/80">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/catalogo" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm">
            <ChevronLeft size={18} />
            Catálogo
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="rounded-full font-black text-[10px] tracking-widest uppercase py-1 px-3 border-slate-200">
              Reserva #{id}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
        
        {/* Banner de Estado */}
        <div className={cn(
          "rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden transition-colors duration-700",
          status.color
        )}>
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
              {status.icon}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-black/10 px-3 py-1 rounded-full">Estado Actual</span>
                <div className="h-1 w-1 rounded-full bg-white/50" />
                <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">
                  Actualizado: {formatDateTime(new Date())}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">{status.label}</h1>
              <p className="text-white/90 font-medium leading-relaxed max-w-xl">{status.desc}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna Izquierda: Detalles */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Detalle del Pedido */}
            <Card className="border-0 shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Package size={16} /> Detalles del Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                    {reserva.producto?.imagenUrl || reserva.variante?.imagenUrl ? (
                      <img 
                        src={getImagenUrl(reserva.variante?.imagenUrl || reserva.producto?.imagenUrl)} 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Package size={32} className="text-slate-200" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-black text-slate-900 text-lg leading-tight">{nombreProducto}</h3>
                    <p className="text-sm text-slate-500 font-medium">Cantidad: {reserva.cantidad} unidad(es)</p>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="text-2xl font-black text-blue-600">{formatCurrency(reserva.montoTotal)}</span>
                       <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-bold px-2 py-0">IVA Incluido</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formulario de Pago (Solo si está pendiente) */}
            {reserva.estado === 'PENDIENTE_PAGO' && (
              <Card className="border-2 border-blue-100 shadow-xl shadow-blue-500/5 rounded-[2.5rem] overflow-hidden">
                <CardHeader className="bg-blue-600 text-white p-8">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl font-black">Información de Pago</CardTitle>
                      <CardDescription className="text-blue-100 font-medium">Sigue estos pasos para completar tu compra.</CardDescription>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20">
                      <Smartphone size={24} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  
                  {/* Cuentas */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-4 bg-blue-600 rounded-full" />
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">1. Realiza la transferencia</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {homeConfig?.cuentasPago?.map((cuenta, idx) => (
                        <div key={idx} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 relative group hover:border-blue-200 transition-colors">
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{cuenta.banco}</p>
                          <p className="font-bold text-slate-900 mb-1">{cuenta.titular}</p>
                          <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-xl border border-slate-100 mt-2">
                            <span className="font-mono text-sm text-slate-600 truncate">{cuenta.numero}</span>
                            <button 
                              onClick={() => handleCopy(cuenta.numero, `cta-${idx}`)}
                              className="text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                            >
                              {copiado === `cta-${idx}` ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Upload */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-4 bg-blue-600 rounded-full" />
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">2. Sube el comprobante</h4>
                    </div>

                    <form onSubmit={handleUpload} className="space-y-4">
                      <label 
                        htmlFor="comprobante" 
                        className={cn(
                          "flex flex-col items-center justify-center gap-4 p-10 border-2 border-dashed rounded-3xl cursor-pointer transition-all bg-slate-50",
                          archivo ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/30"
                        )}
                      >
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-transform",
                          archivo ? "bg-emerald-500 text-white scale-110" : "bg-white text-slate-400 group-hover:scale-110"
                        )}>
                          {archivo ? <CheckCircle2 size={28} /> : <Upload size={28} />}
                        </div>
                        <div className="text-center">
                          <p className="font-black text-slate-900">{archivo ? '¡Imagen cargada!' : 'Haz clic para subir foto'}</p>
                          <p className="text-xs text-slate-500 mt-1 font-medium">{archivo ? archivo.name : 'Formatos JPG o PNG (máx 5MB)'}</p>
                        </div>
                        <input type="file" id="comprobante" className="hidden" accept="image/*" onChange={handleFileChange} />
                      </label>

                      <Button 
                        type="submit" 
                        disabled={!archivo || subirMutation.isPending}
                        className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:grayscale transition-all"
                      >
                        {subirMutation.isPending ? 'Enviando comprobante...' : 'Enviar Comprobante de Pago'}
                      </Button>
                    </form>
                  </div>

                </CardContent>
              </Card>
            )}

            {/* Comprobante ya enviado */}
            {reserva.comprobanteUrl && (
              <Card className="border-0 shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="border-b border-slate-50">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Tu Comprobante</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="aspect-video w-full rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 relative group">
                    <img src={getImagenUrl(reserva.comprobanteUrl)} className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a href={getImagenUrl(reserva.comprobanteUrl)} target="_blank" rel="noreferrer" className="bg-white text-slate-900 px-6 py-2 rounded-full font-bold shadow-xl">Ver en grande</a>
                    </div>
                  </div>
                  {reserva.estado === 'EN_REVISION' && (
                    <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-2xl flex items-start gap-3 border border-blue-100">
                      <Info size={18} className="shrink-0 mt-0.5" />
                      <p className="text-xs font-bold leading-relaxed">
                        Si te equivocaste de imagen, puedes volver a subirla mientras el administrador no haya aprobado el pago todavía.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          </div>

          {/* Columna Derecha: Info Lateral */}
          <div className="space-y-6">
            
            {/* Info de contacto */}
            <Card className="border-0 shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tus Datos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-500">Nombre</p>
                  <p className="font-bold text-slate-900">{reserva.nombreContacto}</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-500">Teléfono</p>
                    <p className="font-bold text-slate-900">{reserva.telefonoContacto}</p>
                  </div>
                </div>
                <div>
                   <p className="text-xs font-bold text-slate-500">Correo</p>
                   <p className="font-bold text-slate-900 break-all">{reserva.correoContacto}</p>
                </div>
              </CardContent>
            </Card>

            {/* Widget de Tiempo / Expiración */}
            {['SOLICITADO', 'PENDIENTE_PAGO'].includes(reserva.estado) && (
              <Card className="border-0 shadow-sm rounded-3xl bg-slate-900 text-white overflow-hidden">
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <Clock size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiración de Reserva</p>
                      <p className="font-bold">{formatDateTime(reserva.fechaExpiracion)}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-xs text-slate-400 leading-relaxed">
                    Si no se confirma el pago antes de esta hora, el sistema liberará el producto para otros clientes.
                  </div>
                </div>
              </Card>
            )}

            {/* Necesitas Ayuda? */}
            <div className="p-8 rounded-3xl bg-blue-50 border border-blue-100 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                  <Info size={20} />
                </div>
                <h4 className="font-black text-slate-900 leading-tight">¿Algún problema con tu reserva?</h4>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Estamos aquí para ayudarte. Si tienes dudas sobre el pago o la disponibilidad, contáctanos directamente.
              </p>
              <Button variant="outline" className="w-full bg-white border-blue-100 text-blue-600 font-bold hover:bg-blue-600 hover:text-white transition-all rounded-xl py-6">
                Hablar con un asesor
              </Button>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
