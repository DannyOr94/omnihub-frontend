import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Clock, ExternalLink, Image as ImageIcon } from 'lucide-react'
import { apartadosApi } from '../../api'
import { formatCurrency, formatDateTime } from '../../utils'
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

const getUrl = (url) => url ? (url.startsWith('http') ? url : `http://localhost:3000${url}`) : ''

export default function ReservasWebPage() {
  const [reservas, setReservas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('SOLICITADO')
  
  // Modales
  const [reservaSelec, setReservaSelec] = useState(null)
  const [modalAprobar, setModalAprobar] = useState(false)
  const [modalConfirmar, setModalConfirmar] = useState(false)
  const [modalRechazar, setModalRechazar] = useState(false)
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
              <SelectItem value="APROBADO">Aprobados</SelectItem>
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
                    <a 
                      href={getUrl(res.comprobanteUrl)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-sm rounded-xl transition-colors border border-blue-100"
                    >
                      <ExternalLink size={16} />
                      Ver Comprobante Adjunto
                    </a>
                  ) : (
                    <div className="text-center py-2 text-xs font-medium text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                      Sin comprobante
                    </div>
                  )}
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
                      className="flex-1 font-bold rounded-xl bg-red-50 hover:bg-red-500 hover:text-white text-red-600 border-0 shadow-none"
                      onClick={() => { setReservaSelec(res); setModalRechazar(true) }}
                    >
                      <XCircle size={16} className="mr-1.5" /> Rechazar
                    </Button>
                    <Button 
                      className="flex-1 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                      onClick={() => { setReservaSelec(res); setModalAprobar(true) }}
                    >
                      <CheckCircle size={16} className="mr-1.5" /> Aprobar
                    </Button>
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
    </div>
  )
}
