import { useState, useRef } from 'react'
import {
  Smartphone, Search, Wrench, CheckCircle,
  Clock, AlertTriangle, FileText, Package,
  ChevronRight, RefreshCw, RotateCcw,
} from 'lucide-react'
import { formatCurrency, formatDate, formatDateTime } from '../../utils'

// ─── Constantes ───────────────────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

const PASOS = [
  { key: 'RECIBIDO',       label: 'Recibido',        icono: Package      },
  { key: 'EN_DIAGNOSTICO', label: 'Diagnóstico',     icono: Search       },
  { key: 'PRESUPUESTADO',  label: 'Presupuestado',   icono: FileText     },
  { key: 'APROBADO',       label: 'Aprobado',        icono: CheckCircle  },
  { key: 'EN_REPARACION',  label: 'En reparación',   icono: Wrench       },
  { key: 'LISTO_ENTREGA',  label: 'Listo',           icono: CheckCircle  },
  { key: 'ENTREGADO',      label: 'Entregado',       icono: CheckCircle  },
]

const ESTADO_CONFIG = {
  RECIBIDO:       { paso: 1, color: 'blue',   label: 'Equipo recibido',        msg: 'Tu equipo está en nuestras manos. En breve iniciamos el diagnóstico.' },
  EN_DIAGNOSTICO: { paso: 2, color: 'purple', label: 'En diagnóstico',         msg: 'Nuestro técnico está analizando tu equipo para identificar el problema.' },
  PRESUPUESTADO:  { paso: 3, color: 'orange', label: 'Presupuesto listo',      msg: 'Ya tenemos el diagnóstico. Te contactaremos para presentarte el presupuesto.' },
  APROBADO:       { paso: 4, color: 'teal',   label: 'Reparación aprobada',    msg: 'El presupuesto fue aprobado. Tu equipo está en cola para reparación.' },
  EN_REPARACION:  { paso: 5, color: 'blue',   label: 'En reparación',          msg: 'Tu equipo está siendo reparado por nuestro técnico.' },
  LISTO_ENTREGA:  { paso: 6, color: 'green',  label: '¡Listo para retirar!',   msg: 'Tu equipo está reparado y listo para que lo retires en nuestra tienda.' },
  ENTREGADO:      { paso: 7, color: 'slate',  label: 'Entregado',              msg: 'Tu equipo fue entregado. ¡Gracias por confiar en K.M.A. Conexiones!' },
  RECHAZADO:      { paso: 0, color: 'red',    label: 'Reparación no realizada', msg: 'La reparación no fue realizada. Puedes pasar a retirar tu equipo sin cargo.' },
}

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-200',   ring: 'ring-blue-400',   fill: 'bg-blue-600'   },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', ring: 'ring-purple-400', fill: 'bg-purple-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', ring: 'ring-orange-400', fill: 'bg-orange-500' },
  teal:   { bg: 'bg-teal-50',   text: 'text-teal-600',   border: 'border-teal-200',   ring: 'ring-teal-400',   fill: 'bg-teal-600'   },
  green:  { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-200',  ring: 'ring-green-400',  fill: 'bg-green-600'  },
  red:    { bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-200',    ring: 'ring-red-400',    fill: 'bg-red-600'    },
  slate:  { bg: 'bg-slate-50',  text: 'text-slate-500',  border: 'border-slate-200',  ring: 'ring-slate-300',  fill: 'bg-slate-400'  },
}

// ─── Animación de engranaje girando ──────────────────────────────────────────
function AnimacionReparacion({ estado }) {
  const cfg    = ESTADO_CONFIG[estado] ?? ESTADO_CONFIG.RECIBIDO
  const colors = COLOR_MAP[cfg.color]
  const enReparacion = estado === 'EN_REPARACION'
  const listo        = estado === 'LISTO_ENTREGA'
  const entregado    = estado === 'ENTREGADO'

  return (
    <div className="flex flex-col items-center py-6">
      {/* Círculo animado central */}
      <div className="relative flex items-center justify-center mb-4">
        {/* Anillo pulsante exterior — solo cuando está activo */}
        {!entregado && estado !== 'RECHAZADO' && (
          <div className={`absolute w-28 h-28 rounded-full ${colors.fill} opacity-10 animate-ping`} />
        )}

        {/* Círculo principal */}
        <div className={`relative w-24 h-24 rounded-full ${colors.bg} ${colors.border} border-2 flex items-center justify-center shadow-sm`}>
          {/* Engranaje girando si está en reparación */}
          {enReparacion ? (
            <div className="relative">
              <Wrench
                size={38}
                className={`${colors.text} animate-spin`}
                style={{ animationDuration: '3s' }}
              />
            </div>
          ) : listo ? (
            <div className="relative">
              <CheckCircle size={38} className="text-green-500" />
              {/* Destello */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-green-400 opacity-0 animate-ping" style={{ animationDuration: '1.5s' }} />
              </div>
            </div>
          ) : entregado ? (
            <CheckCircle size={38} className="text-slate-400" />
          ) : estado === 'RECHAZADO' ? (
            <AlertTriangle size={38} className="text-red-500" />
          ) : (
            <Smartphone size={38} className={colors.text} />
          )}
        </div>
      </div>

      {/* Label de estado */}
      <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold ${colors.bg} ${colors.text} ${colors.border} border`}>
        {cfg.label}
      </span>

      {/* Mensaje descriptivo */}
      <p className="text-sm text-slate-500 text-center mt-3 max-w-xs leading-relaxed">
        {cfg.msg}
      </p>
    </div>
  )
}

// ─── Barra de progreso de pasos ───────────────────────────────────────────────
function BarraProgreso({ estado }) {
  if (estado === 'RECHAZADO') return null
  const cfg        = ESTADO_CONFIG[estado] ?? ESTADO_CONFIG.RECIBIDO
  const pasoActual = cfg.paso
  const colors     = COLOR_MAP[cfg.color]

  return (
    <div className="px-2 pb-2">
      {/* Línea de progreso */}
      <div className="relative">
        {/* Fondo gris */}
        <div className="absolute top-3 left-0 right-0 h-1 bg-slate-100 rounded-full" />
        {/* Progreso coloreado */}
        <div
          className={`absolute top-3 left-0 h-1 rounded-full transition-all duration-700 ${colors.fill}`}
          style={{ width: `${Math.max(0, ((pasoActual - 1) / (PASOS.length - 1)) * 100)}%` }}
        />
        {/* Puntos de paso */}
        <div className="relative flex justify-between">
          {PASOS.map((paso, i) => {
            const completado = i + 1 < pasoActual
            const activo     = i + 1 === pasoActual
            const Icono      = paso.icono
            return (
              <div key={paso.key} className="flex flex-col items-center" style={{ width: `${100 / PASOS.length}%` }}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 ${
                  completado
                    ? `${colors.fill} text-white`
                    : activo
                    ? `${colors.fill} text-white ring-4 ${colors.ring} ring-opacity-30`
                    : 'bg-white border-2 border-slate-200 text-slate-300'
                }`}>
                  {completado
                    ? <CheckCircle size={12} />
                    : <Icono size={11} />
                  }
                </div>
                <p className={`text-center mt-1.5 font-medium leading-tight transition-colors ${
                  activo ? colors.text : completado ? 'text-slate-500' : 'text-slate-300'
                }`} style={{ fontSize: '9px', width: '48px' }}>
                  {paso.label}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function ConsultaBoletaPage() {
  const [cedula,       setCedula]       = useState('')
  const [numeroBoleta, setNumeroBoleta] = useState('')
  const [resultado,    setResultado]    = useState(null)
  const [cargando,     setCargando]     = useState(false)
  const [error,        setError]        = useState('')
  const inputRef = useRef(null)

  async function consultar(e) {
    e.preventDefault()
    if (!cedula.trim() || !numeroBoleta.trim()) return

    setCargando(true)
    setError('')
    setResultado(null)

    try {
      const url = `${API_URL}/public/boleta?cedula=${encodeURIComponent(cedula.trim())}&numeroBoleta=${encodeURIComponent(numeroBoleta.trim().toUpperCase())}`
      const res  = await fetch(url)
      const json = await res.json()

      if (!json.ok) {
        setError(json.message ?? 'No se encontró la boleta con esos datos')
        return
      }
      setResultado(json.data)
    } catch {
      setError('No se pudo conectar con el servidor. Intenta de nuevo en un momento.')
    } finally {
      setCargando(false)
    }
  }

  function reiniciar() {
    setResultado(null)
    setError('')
    setCedula('')
    setNumeroBoleta('')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const cfg    = resultado ? ESTADO_CONFIG[resultado.estado] : null
  const colors = cfg ? COLOR_MAP[cfg.color] : null

  return (
    <div className="min-h-[calc(100vh-14rem)] flex flex-col">

      {/* ── Hero oscuro ──────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white">
        <div className="max-w-2xl mx-auto px-4 py-14 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 rounded-2xl mb-5 border border-white/20">
            <Wrench size={26} className="text-blue-300" />
          </div>
          <h1 className="text-3xl font-extrabold mb-2">Estado de tu reparación</h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Ingresa tu número de cédula y el número de boleta que te dimos al dejar tu equipo.<br/>
            Te mostraremos el estado actual de tu reparación en tiempo real.
          </p>
        </div>
        {/* Ola */}
        <div className="h-8 bg-slate-50" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)', marginTop: '-1px' }} />
      </div>

      {/* ── Contenido ────────────────────────────────────────────────────────── */}
      <div className="flex-1 bg-slate-50">
        <div className="max-w-lg mx-auto px-4 py-8 space-y-5">

          {/* ── Formulario de consulta ───────────────────────────────────────── */}
          {!resultado && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-50">
                <p className="font-bold text-slate-800 text-base">Consultar mi boleta</p>
                <p className="text-xs text-slate-400 mt-0.5">Los datos deben coincidir exactamente con los que registraste</p>
              </div>

              <form onSubmit={consultar} className="px-6 py-5 space-y-4">
                {/* Cédula */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Número de cédula</label>
                  <div className="relative">
                    <FileText size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={cedula}
                      onChange={e => setCedula(e.target.value)}
                      placeholder="Ej: 1-2345-6789 ó 123456789"
                      required
                      autoFocus
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Número de boleta */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Número de boleta</label>
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={numeroBoleta}
                      onChange={e => setNumeroBoleta(e.target.value.toUpperCase())}
                      placeholder="Ej: BOL-000001"
                      required
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono tracking-wide"
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={cargando || !cedula.trim() || !numeroBoleta.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                >
                  {cargando ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      Consultando…
                    </>
                  ) : (
                    <>
                      <Search size={15} />
                      Consultar estado
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ── Resultado ────────────────────────────────────────────────────── */}
          {resultado && cfg && colors && (
            <div className="space-y-4">

              {/* Card principal con animación */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                {/* Franja superior de color según estado */}
                <div className={`h-1.5 w-full ${colors.fill}`} />

                <div className="px-6 pt-4 pb-2">
                  {/* Número de boleta */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-slate-400 tracking-widest">
                      {resultado.numeroBoleta}
                    </span>
                    <button
                      onClick={reiniciar}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <RotateCcw size={11} /> Nueva consulta
                    </button>
                  </div>

                  {/* Nombre del cliente */}
                  <p className="text-lg font-bold text-slate-800">{resultado.cliente}</p>
                  <p className="text-sm text-slate-500">{resultado.equipo}</p>
                </div>

                {/* Animación central */}
                <AnimacionReparacion estado={resultado.estado} />

                {/* Barra de progreso */}
                <div className="px-6 pb-5">
                  <BarraProgreso estado={resultado.estado} />
                </div>
              </div>

              {/* Fechas y detalles */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 space-y-0 divide-y divide-slate-50">

                  <div className="flex justify-between py-3 text-sm">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Package size={13} /> Fecha de ingreso
                    </span>
                    <span className="font-medium text-slate-700">{formatDateTime(resultado.fechaRecepcion)}</span>
                  </div>

                  {resultado.fechaEstimada && resultado.estado !== 'ENTREGADO' && (
                    <div className="flex justify-between py-3 text-sm">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Clock size={13} /> Fecha estimada de entrega
                      </span>
                      <span className={`font-semibold ${colors.text}`}>{formatDate(resultado.fechaEstimada)}</span>
                    </div>
                  )}

                  {resultado.fechaEntrega && (
                    <div className="flex justify-between py-3 text-sm">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <CheckCircle size={13} /> Fecha de entrega
                      </span>
                      <span className="font-semibold text-green-600">{formatDateTime(resultado.fechaEntrega)}</span>
                    </div>
                  )}

                </div>
              </div>

              {/* Saldo pendiente */}
              {resultado.saldoPendiente && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                    <AlertTriangle size={18} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="font-bold text-amber-900 text-sm">Saldo pendiente de pago</p>
                    <p className="text-3xl font-extrabold text-amber-700 mt-0.5">
                      {formatCurrency(resultado.saldoPendiente)}
                    </p>
                    <p className="text-xs text-amber-600 mt-1 leading-relaxed">
                      Debes cancelar este monto al momento de retirar tu equipo en nuestra tienda.
                    </p>
                  </div>
                </div>
              )}

              {/* Banner especial: listo para retirar */}
              {resultado.estado === 'LISTO_ENTREGA' && (
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-5 text-white flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-base">¡Tu equipo está listo! 🎉</p>
                    <p className="text-sm text-green-100 mt-0.5">
                      Pasa por nuestra tienda en horario de atención para retirarlo
                      {!resultado.saldoPendiente ? ' — sin saldo pendiente.' : '.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Botón nueva consulta abajo */}
              <button
                onClick={reiniciar}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-slate-200 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <RotateCcw size={14} /> Consultar otra boleta
              </button>

            </div>
          )}

          {/* ── Info de ayuda (solo cuando no hay resultado) ─────────────────── */}
          {!resultado && !cargando && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icono: FileText,   titulo: '¿Dónde está mi boleta?', desc: 'Te la entregamos al recibir tu equipo. Tiene el formato BOL-000000.' },
                { icono: Smartphone, titulo: '¿Qué cédula uso?',       desc: 'La misma que proporcionaste al dejar tu equipo para reparación.' },
                { icono: Clock,      titulo: 'Actualización en vivo',  desc: 'El estado se actualiza automáticamente conforme avanza la reparación.' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-100 p-4">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mb-2">
                    <item.icono size={15} className="text-blue-500" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 mb-1">{item.titulo}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
