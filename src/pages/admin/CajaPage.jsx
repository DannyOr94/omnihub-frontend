import { useEffect, useState } from 'react'
import { useForm }              from 'react-hook-form'
import { zodResolver }          from '@hookform/resolvers/zod'
import { z }                    from 'zod'
import { toast }                from 'sonner'
import {
  DollarSign, Lock, Unlock, Plus, ArrowDownCircle,
  RefreshCw, TrendingUp, TrendingDown, AlertTriangle,
} from 'lucide-react'
import { cajaApi }    from '../../api/caja'
import { useAuth }    from '../../context/AuthContext'
import { Button }     from '../../components/ui/button'
import { Input }      from '../../components/ui/input'
import { Label }      from '../../components/ui/label'
import { Badge }      from '../../components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '../../components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select'
import { Textarea }  from '../../components/ui/textarea'
import { StatCard }  from '../../components/shared/StatCard'
import { formatCurrency, formatDateTime } from '../../utils'

// ─── Schemas Zod ──────────────────────────────────────────────────────────────
const abrirSchema  = z.object({ montoInicial: z.coerce.number().min(0, 'Debe ser 0 o mayor') })
const cerrarSchema = z.object({
  montoFinalFisico:      z.coerce.number().min(0, 'Debe ser 0 o mayor'),
  observaciones:         z.string().optional(),
  observacionDiferencia: z.string().optional(),
})
const salidaSchema = z.object({
  monto:      z.coerce.number().positive('Debe ser mayor a 0'),
  tipoSalida: z.string().min(1, 'Selecciona un tipo'),
  motivo:     z.string().min(3, 'Mínimo 3 caracteres'),
  descripcion: z.string().optional(),
})

const TIPOS_SALIDA = [
  { value: 'GASTO_OPERATIVO', label: 'Gasto operativo' },
  { value: 'COMPRA_URGENTE',  label: 'Compra urgente' },
  { value: 'CAMBIO_CAJA',     label: 'Cambio de caja' },
  { value: 'DEVOLUCION',      label: 'Devolución' },
  { value: 'TRANSPORTE',      label: 'Transporte' },
  { value: 'OTRO',            label: 'Otro' },
]

// ─── Formulario genérico para modales ────────────────────────────────────────
function CampoForm({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export default function CajaPage() {
  const { esAdmin, esVendedor } = useAuth()

  const [estado,      setEstado]      = useState(null)
  const [resumen,     setResumen]     = useState(null)
  const [cargando,    setCargando]    = useState(true)
  const [enviando,    setEnviando]    = useState(false)

  // Modales
  const [modalAbrir,  setModalAbrir]  = useState(false)
  const [modalCerrar, setModalCerrar] = useState(false)
  const [modalSalida, setModalSalida] = useState(false)

  // ─── Forms ───────────────────────────────────────────────────────────────
  const formAbrir = useForm({
    resolver: zodResolver(abrirSchema),
    defaultValues: { montoInicial: 0 },
  })
  const formCerrar = useForm({
    resolver: zodResolver(cerrarSchema),
    defaultValues: { montoFinalFisico: 0, observaciones: '', observacionDiferencia: '' },
  })
  const formSalida = useForm({
    resolver: zodResolver(salidaSchema),
    defaultValues: { monto: '', tipoSalida: '', motivo: '', descripcion: '' },
  })

  // ─── Cargar estado ───────────────────────────────────────────────────────
  async function cargar() {
    setCargando(true)
    try {
      const [resEstado, resResumen] = await Promise.allSettled([
        cajaApi.estado(),
        cajaApi.resumenActivo(),
      ])
      if (resEstado.status === 'fulfilled') setEstado(resEstado.value.data.data)
      if (resResumen.status === 'fulfilled') setResumen(resResumen.value.data.data)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  // ─── Abrir caja ──────────────────────────────────────────────────────────
  async function onAbrir(datos) {
    setEnviando(true)
    try {
      await cajaApi.abrir(datos)
      toast.success('Caja abierta correctamente')
      setModalAbrir(false)
      formAbrir.reset()
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error al abrir caja')
    } finally {
      setEnviando(false)
    }
  }

  // ─── Cerrar caja ─────────────────────────────────────────────────────────
  async function onCerrar(datos) {
    setEnviando(true)
    try {
      await cajaApi.cerrar(datos)
      toast.success('Caja cerrada correctamente')
      setModalCerrar(false)
      formCerrar.reset()
      setResumen(null)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error al cerrar caja')
    } finally {
      setEnviando(false)
    }
  }

  // ─── Registrar salida ────────────────────────────────────────────────────
  async function onSalida(datos) {
    setEnviando(true)
    try {
      await cajaApi.salida(datos)
      toast.success('Salida registrada correctamente')
      setModalSalida(false)
      formSalida.reset()
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error al registrar salida')
    } finally {
      setEnviando(false)
    }
  }

  const abierta      = estado?.abierta ?? false
  const cajaActual   = estado?.caja
  const ingresos     = resumen?.resumen?.ingresos
  const egresos      = resumen?.resumen?.egresos
  const desglose     = resumen?.resumen?.desglosePorMetodo ?? []
  const diferencia   = resumen?.resumen?.diferencia
  const montoSistema = cajaActual?.montoSistemaActual ?? resumen?.resumen?.montoSistema ?? 0

  return (
    <div className="space-y-6">

      {/* ── Encabezado ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Caja</h1>
          <p className="text-sm text-slate-500 mt-0.5">Control del turno operativo</p>
        </div>
        <Button variant="outline" size="sm" onClick={cargar} disabled={cargando}>
          <RefreshCw size={14} className={`mr-1.5 ${cargando ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* ── Estado actual ──────────────────────────────────────────────────── */}
      <div className={`rounded-xl border p-5 flex items-center justify-between ${
        abierta ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          {abierta
            ? <Unlock size={22} className="text-green-600" />
            : <Lock   size={22} className="text-slate-500" />
          }
          <div>
            <p className={`font-semibold ${abierta ? 'text-green-800' : 'text-slate-700'}`}>
              {cargando ? 'Verificando…' : abierta ? 'Caja abierta' : 'Caja cerrada'}
            </p>
            {abierta && cajaActual && (
              <p className="text-xs text-green-600 mt-0.5">
                Abierta: {formatDateTime(cajaActual.fechaApertura)} ·
                Monto inicial: {formatCurrency(cajaActual.montoInicial)}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {!abierta && (esAdmin || esVendedor) && (
            <Button size="sm" onClick={() => setModalAbrir(true)}>
              <Unlock size={14} className="mr-1.5" /> Abrir caja
            </Button>
          )}
          {abierta && (esAdmin || esVendedor) && (
            <>
              <Button size="sm" variant="outline" onClick={() => setModalSalida(true)}>
                <ArrowDownCircle size={14} className="mr-1.5" /> Salida
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setModalCerrar(true)}>
                <Lock size={14} className="mr-1.5" /> Cerrar caja
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Resumen del turno (solo si hay caja abierta) ───────────────────── */}
      {abierta && resumen && (
        <>
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
            Resumen del turno actual
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              titulo="Monto inicial"
              valor={formatCurrency(cajaActual?.montoInicial ?? 0)}
              icono={DollarSign}
              color="slate"
            />
            <StatCard
              titulo="Total ingresos"
              valor={formatCurrency(
                (ingresos?.ventas ?? 0) + (ingresos?.apartados ?? 0) + (ingresos?.boletas ?? 0)
              )}
              subtitulo={`${resumen.resumen.cantidadVentas} ventas · ${ingresos?.totalApartadosCobrados ?? 0} apartados · ${ingresos?.totalBoletasCobradas ?? 0} boletas`}
              icono={TrendingUp}
              color="green"
            />
            <StatCard
              titulo="Total salidas"
              valor={formatCurrency(egresos?.total ?? 0)}
              subtitulo={`${egresos?.detalle?.length ?? 0} salidas registradas`}
              icono={TrendingDown}
              color="red"
            />
            <StatCard
              titulo="Monto en caja (sistema)"
              valor={formatCurrency(montoSistema)}
              subtitulo="Calculado automáticamente"
              icono={DollarSign}
              color="blue"
            />
          </div>

          {/* Desglose por método de pago */}
          {desglose.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Desglose por método de pago</h3>
              <div className="divide-y divide-slate-100">
                {desglose.map(d => (
                  <div key={d.metodoPago} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-slate-600">{d.metodoPago.replace('_', ' ')}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400 text-xs">{d.transacciones} transacciones</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(d.monto)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Salidas del turno */}
          {egresos?.detalle?.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Salidas registradas en este turno</h3>
              <div className="divide-y divide-slate-100">
                {egresos.detalle.map(s => (
                  <div key={s.id} className="flex items-start justify-between py-2.5 text-sm">
                    <div>
                      <p className="text-slate-700 font-medium">{s.motivo}</p>
                      <p className="text-xs text-slate-400">
                        {s.tipoSalida.replace('_', ' ')} · {s.usuario?.nombre} · {formatDateTime(s.fechaSalida)}
                      </p>
                    </div>
                    <span className="text-red-600 font-semibold shrink-0 ml-4">
                      -{formatCurrency(s.monto)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Sin caja abierta ───────────────────────────────────────────────── */}
      {!cargando && !abierta && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
          <Lock size={40} className="mb-3 text-slate-300" />
          <p className="font-medium text-slate-500">No hay caja abierta</p>
          <p className="text-sm mt-1">Abre la caja para empezar a registrar ventas y cobros</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL — Abrir caja                                                    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={modalAbrir} onOpenChange={setModalAbrir}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Abrir caja</DialogTitle>
          </DialogHeader>
          <form onSubmit={formAbrir.handleSubmit(onAbrir)} className="space-y-4 pt-2">
            <CampoForm label="Monto inicial en efectivo (₡)" error={formAbrir.formState.errors.montoInicial?.message}>
              <Input
                type="number"
                min="0"
                step="100"
                {...formAbrir.register('montoInicial')}
              />
            </CampoForm>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setModalAbrir(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={enviando}>
                {enviando ? 'Abriendo…' : 'Abrir caja'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL — Registrar salida                                              */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={modalSalida} onOpenChange={setModalSalida}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar salida de efectivo</DialogTitle>
          </DialogHeader>
          <form onSubmit={formSalida.handleSubmit(onSalida)} className="space-y-4 pt-2">
            <CampoForm label="Monto (₡)" error={formSalida.formState.errors.monto?.message}>
              <Input type="number" min="0" step="100" {...formSalida.register('monto')} />
            </CampoForm>

            <CampoForm label="Tipo de salida" error={formSalida.formState.errors.tipoSalida?.message}>
              <Select onValueChange={v => formSalida.setValue('tipoSalida', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                <SelectContent>
                  {TIPOS_SALIDA.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CampoForm>

            <CampoForm label="Motivo" error={formSalida.formState.errors.motivo?.message}>
              <Input placeholder="Ej: Compra de materiales" {...formSalida.register('motivo')} />
            </CampoForm>

            <CampoForm label="Descripción adicional (opcional)">
              <Textarea rows={2} {...formSalida.register('descripcion')} />
            </CampoForm>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setModalSalida(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={enviando}>
                {enviando ? 'Registrando…' : 'Registrar salida'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL — Cerrar caja                                                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={modalCerrar} onOpenChange={setModalCerrar}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cerrar caja</DialogTitle>
          </DialogHeader>
          <form onSubmit={formCerrar.handleSubmit(onCerrar)} className="space-y-4 pt-2">

            {/* Resumen rápido */}
            <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1.5 border">
              <div className="flex justify-between">
                <span className="text-slate-500">Monto sistema</span>
                <span className="font-semibold">{formatCurrency(montoSistema)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Ingresos - Salidas calculadas automáticamente</span>
              </div>
            </div>

            <CampoForm label="Monto físico contado (₡)" error={formCerrar.formState.errors.montoFinalFisico?.message}>
              <Input
                type="number"
                min="0"
                step="100"
                {...formCerrar.register('montoFinalFisico')}
              />
            </CampoForm>

            <CampoForm label="Observación de diferencia (obligatorio si hay diferencia)" error={formCerrar.formState.errors.observacionDiferencia?.message}>
              <Textarea
                rows={2}
                placeholder="Explica la diferencia si existe…"
                {...formCerrar.register('observacionDiferencia')}
              />
            </CampoForm>

            <CampoForm label="Observaciones generales (opcional)">
              <Textarea rows={2} {...formCerrar.register('observaciones')} />
            </CampoForm>

            <div className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2.5">
              <AlertTriangle size={14} className="shrink-0" />
              Una vez cerrada la caja, no podrá registrar ventas ni cobros hasta abrir una nueva.
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setModalCerrar(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="destructive" disabled={enviando}>
                {enviando ? 'Cerrando…' : 'Confirmar cierre'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
