import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Clock, ExternalLink, Image as ImageIcon } from 'lucide-react'
import { apartadosApi } from '../../api'
import { formatCurrency, formatDateTime, getImagenUrl } from '../../utils'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from '../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Textarea } from '../../components/ui/textarea'

// ─── Componente de Estado ──────────────────────────────────────────────────
function EstadoBadge({ estado }) {
  const config = {
    SOLICITADO: { label: 'Nueva Solicitud', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    PENDIENTE_PAGO: { label: 'Pago Pendiente', className: 'bg-amber-100 text-amber-800 border-amber-200' },
    EN_REVISION: { label: 'En Revisión', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    LISTO_PARA_RETIRAR: { label: 'Listo para Retirar', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    ENTREGADO: { label: 'Entregado', className: 'bg-slate-100 text-slate-500 border-slate-200' },
    APROBADO: { label: 'Aprobado', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    RECHAZADO: { label: 'Rechazado', className: 'bg-red-100 text-red-800 border-red-200' },
    EXPIRADO: { label: 'Expirado', className: 'bg-slate-100 text-slate-800 border-slate-200' },
  }
  const current = config[estado] || { label: estado, className: 'bg-slate-100 text-slate-800' }
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${current.className}`}>
      {current.label}
    </span>
  )
}

const getUrl = getImagenUrl

export default function ReservasWebPage() {
  const [reservas, setReservas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('SOLICITADO')
  
  // Modales
  const [reservaSelec, setReservaSelec] = useState(null)
  const [modalAprobar, setModalAprobar] = useState(false)
  const [modalConfirmar, setModalConfirmar] = useState(false)
  const [modalRechazar, setModalRechazar] = useState(false)
  const [modalEntregar, setModalEntregar] = useState(false)
  const [modalVerImagen, setModalVerImagen] = useState(false)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const res = await apartadosApi.listarTemporales({ estado: filtroEstado === 'TODOS' ? '' : filtroEstado })
      setReservas(res.data.data)
    } catch (err) {
      toast.error('Error al cargar las reservas web')
    } finally {
      setCargando(false)
    }
  }, [filtroEstado])

  useEffect(() => { cargar() }, [cargar])

  // Acciones
  async function handleConfirmar() {
    setEnviando(true)
    try {
      await apartadosApi.confirmarTemporal(reservaSelec.id)
      toast.success('Disponibilidad confirmada. El cliente recibió un correo con datos de pago.')
      setModalConfirmar(false)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al confirmar disponibilidad')
    } finally {
      setEnviando(false)
    }
  }

  async function handleAprobar() {
    setEnviando(true)
    try {
      await apartadosApi.aprobarTemporal(reservaSelec.id)
      toast.success('Reserva aprobada exitosamente')
      setModalAprobar(false)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al aprobar')
    } finally {
      setEnviando(false)
    }
  }
  
  async function handleEntregar() {
    setEnviando(true)
    try {
      await apartadosApi.entregarTemporal(reservaSelec.id)
      toast.success('Reserva marcada como entregada. Ciclo finalizado.')
      setModalEntregar(false)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al marcar como entregado')
    } finally {
      setEnviando(false)
    }
  }

  async function handleRechazar(e) {
    e.preventDefault()
    if (!motivoRechazo.trim()) return toast.warning('Debes ingresar un motivo')
    
    setEnviando(true)
    try {
      await apartadosApi.rechazarTemporal(reservaSelec.id, motivoRechazo)
      toast.success('Reserva rechazada y stock liberado')
      setModalRechazar(false)
      setMotivoRechazo('')
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al rechazar')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reservas Web (Apartados)</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Gestiona los comprobantes de pago de los apartados realizados desde el catálogo público.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-48 bg-white border-slate-200">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los estados</SelectItem>
              <SelectItem value="SOLICITADO">Nueva Solicitud</SelectItem>
              <SelectItem value="PENDIENTE_PAGO">Pago Pendiente</SelectItem>
              <SelectItem value="EN_REVISION">En Revisión</SelectItem>
              <SelectItem value="LISTO_PARA_RETIRAR">Por Retirar</SelectItem>
              <SelectItem value="ENTREGADO">Entregados</SelectItem>
              <SelectItem value="APROBADO">Aprobados (Histórico)</SelectItem>
              <SelectItem value="RECHAZADO">Rechazados</SelectItem>
              <SelectItem value="EXPIRADO">Expirados</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={cargar} disabled={cargando}>
            Actualizar
          </Button>
        </div>
      </div>

      {/* ── Grid de Reservas ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pr-2">
        {cargando ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm animate-pulse h-48" />
            ))}
          </div>
        ) : reservas.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-slate-100 border-dashed">
            <Clock size={48} className="mb-4 text-slate-300" />
            <p className="text-lg font-bold text-slate-600">No hay reservas</p>
            <p className="text-sm">No se encontraron reservas en este estado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {reservas.map(res => (
              <div key={res.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
                
                {/* Header de Tarjeta */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                  <div>
                    <p className="text-xs font-bold text-slate-400 mb-1">ID #{res.id}</p>
                    <EstadoBadge estado={res.estado} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Expiración</p>
                    <p className="text-xs font-medium text-slate-700">{formatDateTime(res.fechaExpiracion)}</p>
                  </div>
                </div>

                {/* Contenido de Tarjeta */}
                <div className="p-5 flex-1 space-y-4">
                  {/* Cliente */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Cliente</p>
                    <p className="font-bold text-slate-800 leading-tight">{res.nombreContacto}</p>
                    <div className="flex flex-col mt-1 gap-0.5">
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                        <span className="w-1 h-1 rounded-full bg-slate-300" /> {res.telefonoContacto}
                      </p>
                      {res.correoContacto && (
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                          <span className="w-1 h-1 rounded-full bg-slate-300" /> {res.correoContacto}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Producto */}
                  <div className="flex gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {(res.variante?.imagenUrl || res.producto?.imagenUrl) ? (
                        <img src={getUrl(res.variante?.imagenUrl || res.producto?.imagenUrl)} alt="Producto" className="w-full h-full object-contain" />
                      ) : (
                        <ImageIcon size={20} className="text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{res.producto?.nombre}</p>
                      {res.variante && (
                        <p className="text-[10px] font-bold text-slate-500 uppercase">
                          {[res.variante.talla && `T.${res.variante.talla}`, res.variante.color].filter(Boolean).join(' ')}
                        </p>
                      )}
                      <p className="text-blue-600 font-black text-sm mt-0.5">
                        {formatCurrency(res.variante?.precioVenta || res.producto?.precioVenta)}
                      </p>
                    </div>
                  </div>

                  {/* Comprobante Link */}
                  {res.comprobanteUrl ? (
                    <div className="space-y-2">
                      <button 
                        onClick={() => { setReservaSelec(res); setModalVerImagen(true) }}
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-sm rounded-xl transition-colors border border-blue-100"
                      >
                        <ImageIcon size={16} />
                        Ver Comprobante de Pago
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-2 text-xs font-medium text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                      Sin comprobante aún
                    </div>
                  )}

                  {/* Link de Seguimiento (Para enviar al cliente) */}
                  <div className="pt-2 border-t border-dashed border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Seguimiento Público</p>
                    <div className="flex gap-2">
                      <Input 
                        readOnly 
                        value={`${window.location.origin}/reserva/${res.id}`} 
                        className="h-8 text-[10px] font-mono bg-slate-50 border-slate-100 text-slate-500"
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 px-2 text-[10px] font-black uppercase"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/reserva/${res.id}`)
                          toast.success('Link copiado', { description: 'Puedes enviarlo por WhatsApp.' })
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>
                </div>

                 {/* Acciones */}
                {(res.estado === 'SOLICITADO' || res.estado === 'PENDIENTE_PAGO') && (
                  <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 font-bold rounded-xl text-red-600 border-slate-200"
                      onClick={() => { setReservaSelec(res); setModalRechazar(true) }}
                    >
                      Rechazar
                    </Button>
                    {res.estado === 'SOLICITADO' && (
                      <Button 
                        className="flex-1 font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                        onClick={() => { setReservaSelec(res); setModalConfirmar(true) }}
                      >
                        Confirmar Stock
                      </Button>
                    )}
                  </div>
                )}

                {res.estado === 'EN_REVISION' && (
                  <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                    <Button 
                      variant="destructive" 
                      className="flex-1 font-bold rounded-xl bg-red-50 hover:bg-red-500 hover:text-white text-red-600 border-0 shadow-none transition-all"
                      onClick={() => { setReservaSelec(res); setModalRechazar(true) }}
                    >
                      <XCircle size={16} className="mr-1.5" /> Rechazar
                    </Button>
                    <Button 
                      className="flex-1 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all"
                      onClick={() => { setReservaSelec(res); setModalAprobar(true) }}
                    >
                      <CheckCircle size={16} className="mr-1.5" /> Confirmar Pago
                    </Button>
                  </div>
                )}

                {res.estado === 'LISTO_PARA_RETIRAR' && (
                  <div className="p-4 bg-white border-t border-slate-100">
                    <Button 
                      className="w-full font-black rounded-xl bg-slate-900 hover:bg-black text-white shadow-xl shadow-slate-900/10 transition-all h-12"
                      onClick={() => { setReservaSelec(res); setModalEntregar(true) }}
                    >
                      <CheckCircle size={18} className="mr-2" /> Marcar como Entregado
                    </Button>
                  </div>
                )}

                {res.estado === 'ENTREGADO' && (
                  <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                    <span className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center justify-center gap-2">
                      <CheckCircle size={14} /> Ciclo de Venta Finalizado
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal Confirmar Disponibilidad ────────────────────────────────── */}
      <Dialog open={modalConfirmar} onOpenChange={setModalConfirmar}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-indigo-700">Confirmar Disponibilidad</DialogTitle>
            <DialogDescription className="font-medium">
              Al confirmar, el cliente recibirá un correo electrónico con las instrucciones de pago y las cuentas bancarias configuradas.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600">¿Deseas confirmar que hay stock físico para la solicitud de <strong>{reservaSelec?.nombreContacto}</strong>?</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalConfirmar(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleConfirmar} disabled={enviando} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md text-white font-bold">
              {enviando ? 'Confirmando...' : 'Confirmar y Enviar Datos'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Aprobar ─────────────────────────────────────────────────── */}
      <Dialog open={modalAprobar} onOpenChange={setModalAprobar}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-emerald-700">Aprobar Reserva</DialogTitle>
            <DialogDescription className="font-medium">
              Al aprobar esta reserva confirmas que el pago es válido. El inventario se descontará definitivamente de la tienda.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600">Asegúrate de haber revisado el comprobante de pago adjunto de <strong>{reservaSelec?.nombreContacto}</strong>.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalAprobar(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleAprobar} disabled={enviando} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-md text-white font-bold">
              {enviando ? 'Aprobando...' : 'Sí, Aprobar Reserva'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Rechazar ────────────────────────────────────────────────── */}
      <Dialog open={modalRechazar} onOpenChange={setModalRechazar}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-red-600">Rechazar Reserva</DialogTitle>
            <DialogDescription className="font-medium">
              El inventario reservado será devuelto al catálogo público inmediatamente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRechazar} className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Motivo del rechazo</label>
              <Textarea 
                required
                placeholder="Ej. El comprobante es falso o no corresponde al monto."
                className="resize-none rounded-xl bg-slate-50 border-slate-200"
                value={motivoRechazo}
                onChange={e => setMotivoRechazo(e.target.value)}
              />
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalRechazar(false)} className="rounded-xl">Cancelar</Button>
              <Button type="submit" disabled={enviando} variant="destructive" className="rounded-xl font-bold shadow-md">
                {enviando ? 'Rechazando...' : 'Rechazar Reserva'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal Ver Comprobante ─────────────────────────────────────────── */}
      <Dialog open={modalVerImagen} onOpenChange={setModalVerImagen}>
        <DialogContent className="sm:max-w-2xl rounded-3xl overflow-hidden p-0 border-0 bg-transparent shadow-none">
          <div className="relative group">
            <img 
              src={getUrl(reservaSelec?.comprobanteUrl)} 
              alt="Comprobante" 
              className="w-full h-auto max-h-[85vh] object-contain rounded-3xl shadow-2xl"
            />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
               <a 
                href={getUrl(reservaSelec?.comprobanteUrl)} 
                target="_blank" 
                rel="noreferrer"
                className="bg-white/90 backdrop-blur text-slate-900 px-6 py-3 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2 hover:bg-white"
              >
                <ExternalLink size={18} /> Abrir Original
              </a>
              <Button 
                onClick={() => setModalVerImagen(false)}
                className="bg-black/80 backdrop-blur text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl"
              >
                Cerrar Vista
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal Marcar Entregado ────────────────────────────────────────── */}
      <Dialog open={modalEntregar} onOpenChange={setModalEntregar}>
        <DialogContent className="sm:max-w-md rounded-[2rem]">
          <DialogHeader className="pt-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mb-4 mx-auto">
              <CheckCircle size={32} />
            </div>
            <DialogTitle className="text-2xl font-black text-center text-slate-900">¿Confirmar Entrega?</DialogTitle>
            <DialogDescription className="text-center font-medium text-slate-500 text-balance">
              Estás a punto de marcar el pedido <strong>#W-{reservaSelec?.id}</strong> de <strong>{reservaSelec?.nombreContacto}</strong> como entregado físicamente.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 my-4">
             <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Resumen de Entrega</p>
             <p className="font-bold text-slate-800 text-sm">{reservaSelec?.producto?.nombre}</p>
             <p className="text-xs text-slate-500 mt-1">Asegúrate de haber verificado la identidad del cliente.</p>
          </div>
          <DialogFooter className="sm:flex-col gap-3 pt-2 pb-4">
            <Button 
              onClick={handleEntregar} 
              disabled={enviando} 
              className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-base shadow-xl shadow-slate-900/20"
            >
              {enviando ? 'Procesando...' : 'Sí, Marcar como Entregado'}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setModalEntregar(false)} 
              className="w-full h-12 font-bold text-slate-400 hover:text-slate-600"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
