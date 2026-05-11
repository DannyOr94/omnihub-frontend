import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Home, Save, RefreshCw, Plus, Trash2, ChevronDown, ChevronUp,
  Star, MessageSquare, HelpCircle, Clock, Phone, BarChart2,
  Type, Eye, Loader2, Info,
} from 'lucide-react'
import { configuracionHomeApi, testimoniosApi } from '../../api/index'
import { Switch } from '../../components/ui/switch'
import { Button }   from '../../components/ui/button'
import { Input }    from '../../components/ui/input'
import { Label }    from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Campo({ label, hint, error, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-slate-700">{label}</Label>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><Info size={11} />{error}</p>}
    </div>
  )
}

function Seccion({ icono: Icono, titulo, descripcion, children, defaultOpen = false }) {
  const [abierto, setAbierto] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <button
        className="w-full flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50 transition-colors text-left"
        onClick={() => setAbierto(a => !a)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-xl">
            <Icono size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">{titulo}</p>
            <p className="text-xs text-slate-500 mt-0.5">{descripcion}</p>
          </div>
        </div>
        {abierto
          ? <ChevronUp size={16} className="text-slate-400 shrink-0" />
          : <ChevronDown size={16} className="text-slate-400 shrink-0" />
        }
      </button>
      {abierto && (
        <div className="px-6 pb-6 border-t border-slate-100 pt-5 space-y-4">
          {children}
        </div>
      )}
    </div>
  )
}

// Colores disponibles para avatares de testimonios
const COLORES_AVATAR = [
  { label: 'Rosa',    value: 'bg-pink-500' },
  { label: 'Azul',    value: 'bg-blue-500' },
  { label: 'Morado',  value: 'bg-purple-500' },
  { label: 'Verde',   value: 'bg-green-500' },
  { label: 'Naranja', value: 'bg-orange-500' },
  { label: 'Rojo',    value: 'bg-red-500' },
  { label: 'Índigo',  value: 'bg-indigo-500' },
  { label: 'Amarillo',value: 'bg-yellow-500' },
]

// ─── Página principal ──────────────────────────────────────────────────────────
export default function ConfiguracionHomePage() {
  const [cargando,  setCargando]  = useState(true)
  const [guardando, setGuardando] = useState(null) // nombre de la sección guardando
  const [config,    setConfig]    = useState(null)
  const [errores,   setErrores]   = useState({})
  const [pendientes, setPendientes] = useState([])
  const [cargandoInbox, setCargandoInbox] = useState(false)

  // ── Cargar configuración ──────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const r = await configuracionHomeApi.obtener()
      setConfig(r.data.data)
    } catch {
      toast.error('Error al cargar la configuración')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // ── Cargar testimonios pendientes ─────────────────────────────────────────
  const cargarInbox = useCallback(async () => {
    setCargandoInbox(true)
    try {
      const r = await testimoniosApi.listar(true)
      setPendientes(r.data.data)
    } catch {
      toast.error('Error al cargar buzón de reseñas')
    } finally {
      setCargandoInbox(false)
    }
  }, [])

  useEffect(() => { cargarInbox() }, [cargarInbox])

  // ── Actualizar campo individual ───────────────────────────────────────────
  function set(campo, valor) {
    setConfig(prev => ({ ...prev, [campo]: valor }))
    // Limpiar error del campo si existe
    if (errores[campo]) setErrores(prev => { const n = { ...prev }; delete n[campo]; return n })
  }

  // ── Guardar sección ────────────────────────────────────────────────────────
  async function guardar(seccion, datos) {
    setGuardando(seccion)
    try {
      const r = await configuracionHomeApi.actualizar(datos)
      setConfig(r.data.data)
      toast.success('Sección guardada correctamente')
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error al guardar'
      toast.error(msg)
    } finally {
      setGuardando(null)
    }
  }

  // ─── Estado de carga ───────────────────────────────────────────────────────
  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm">Cargando configuración…</p>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="mb-3">No se pudo cargar la configuración.</p>
        <Button onClick={cargar} variant="outline" size="sm"><RefreshCw size={14} className="mr-2" />Reintentar</Button>
      </div>
    )
  }

  // ─── Sección: Testimonios ──────────────────────────────────────────────────
  function agregarTestimonio() {
    const nuevos = [...(config.testimonios || []), { nombre: '', inicial: '', color: 'bg-blue-500', texto: '', estrellas: 5 }]
    set('testimonios', nuevos)
  }
  function eliminarTestimonio(i) {
    set('testimonios', config.testimonios.filter((_, idx) => idx !== i))
  }
  function setTestimonio(i, campo, valor) {
    const arr = [...config.testimonios]
    arr[i] = { ...arr[i], [campo]: valor }
    set('testimonios', arr)
  }

  // ─── Acciones de Inbox ─────────────────────────────────────────────────────
  async function aprobarResena(id) {
    try {
      await testimoniosApi.aprobar(id)
      toast.success('Reseña aprobada')
      cargarInbox()
    } catch { toast.error('Error al aprobar') }
  }

  async function eliminarResena(id) {
    if (!confirm('¿Eliminar esta reseña permanentemente?')) return
    try {
      await testimoniosApi.eliminar(id)
      toast.success('Reseña eliminada')
      cargarInbox()
    } catch { toast.error('Error al eliminar') }
  }

  // ─── Sección: FAQs ────────────────────────────────────────────────────────
  function agregarFaq() {
    set('faqs', [...(config.faqs || []), { p: '', r: '' }])
  }
  function eliminarFaq(i) {
    set('faqs', config.faqs.filter((_, idx) => idx !== i))
  }
  function setFaq(i, campo, valor) {
    const arr = [...config.faqs]
    arr[i] = { ...arr[i], [campo]: valor }
    set('faqs', arr)
  }

  // ─── Sección: Horario ─────────────────────────────────────────────────────
  function agregarHorario() {
    set('horario', [...(config.horario || []), { dia: '', hora: '' }])
  }
  function eliminarHorario(i) {
    set('horario', config.horario.filter((_, idx) => idx !== i))
  }
  function setHorario(i, campo, valor) {
    const arr = [...config.horario]
    arr[i] = { ...arr[i], [campo]: valor }
    set('horario', arr)
  }

  const BtnGuardar = ({ seccion, datos }) => (
    <div className="flex justify-end pt-2">
      <Button
        size="sm"
        onClick={() => guardar(seccion, datos)}
        disabled={guardando === seccion}
        className="gap-2"
      >
        {guardando === seccion
          ? <><Loader2 size={13} className="animate-spin" />Guardando…</>
          : <><Save size={13} />Guardar sección</>
        }
      </Button>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-4">

      {/* Cabecera */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl">
            <Home size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Configuración del Home</h1>
            <p className="text-sm text-slate-500">Edita el contenido del sitio web público</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={cargar} className="gap-1.5">
            <RefreshCw size={13} /> Recargar
          </Button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 px-3 py-2 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
          >
            <Eye size={13} /> Ver sitio
          </a>
        </div>
      </div>

      {/* ─── SECCIÓN: HERO ───────────────────────────────────────────────────── */}
      <Seccion icono={Type} titulo="Hero" descripcion="Título y subtítulo principal de la portada" defaultOpen>
        <Campo label="Título principal" hint="Máx. 200 caracteres">
          <Input
            value={config.heroTitulo || ''}
            onChange={e => set('heroTitulo', e.target.value)}
            maxLength={200}
            placeholder="Moda que te define, tecnología que te conecta."
          />
        </Campo>
        <Campo label="Subtítulo / descripción" hint="Máx. 600 caracteres">
          <Textarea
            value={config.heroSubtitulo || ''}
            onChange={e => set('heroSubtitulo', e.target.value)}
            maxLength={600}
            rows={3}
            placeholder="Ropa para toda la familia…"
          />
        </Campo>
        <BtnGuardar seccion="hero" datos={{ heroTitulo: config.heroTitulo, heroSubtitulo: config.heroSubtitulo }} />
      </Seccion>

      {/* ─── SECCIÓN: STATS ──────────────────────────────────────────────────── */}
      <Seccion icono={BarChart2} titulo="Estadísticas" descripcion="Números que se muestran en la barra de logros">
        <div className="grid grid-cols-2 gap-4">
          <Campo label="Años de experiencia">
            <Input type="number" min={0} max={999}
              value={config.statAnios ?? 10}
              onChange={e => set('statAnios', parseInt(e.target.value) || 0)}
            />
          </Campo>
          <Campo label="Dispositivos reparados">
            <Input type="number" min={0} max={999999}
              value={config.statReparaciones ?? 5000}
              onChange={e => set('statReparaciones', parseInt(e.target.value) || 0)}
            />
          </Campo>
          <Campo label="Tiendas">
            <Input type="number" min={0} max={99}
              value={config.statTiendas ?? 2}
              onChange={e => set('statTiendas', parseInt(e.target.value) || 0)}
            />
          </Campo>
          <Campo label="% Clientes satisfechos">
            <Input type="number" min={0} max={100}
              value={config.statSatisfaccion ?? 98}
              onChange={e => set('statSatisfaccion', parseInt(e.target.value) || 0)}
            />
          </Campo>
        </div>
        <BtnGuardar seccion="stats" datos={{
          statAnios: config.statAnios,
          statReparaciones: config.statReparaciones,
          statTiendas: config.statTiendas,
          statSatisfaccion: config.statSatisfaccion,
        }} />
      </Seccion>

      {/* ─── SECCIÓN: NOSOTROS ───────────────────────────────────────────────── */}
      <Seccion icono={Info} titulo="Nuestra Historia" descripcion="Sección 'Nosotros' del home">
        <Campo label="Título">
          <Input
            value={config.nosotrosTitulo || ''}
            onChange={e => set('nosotrosTitulo', e.target.value)}
            maxLength={200}
          />
        </Campo>
        <Campo label="Párrafo 1">
          <Textarea
            value={config.nosotrosTexto1 || ''}
            onChange={e => set('nosotrosTexto1', e.target.value)}
            rows={4}
            maxLength={2000}
          />
        </Campo>
        <Campo label="Párrafo 2">
          <Textarea
            value={config.nosotrosTexto2 || ''}
            onChange={e => set('nosotrosTexto2', e.target.value)}
            rows={4}
            maxLength={2000}
          />
        </Campo>
        <BtnGuardar seccion="nosotros" datos={{
          nosotrosTitulo: config.nosotrosTitulo,
          nosotrosTexto1: config.nosotrosTexto1,
          nosotrosTexto2: config.nosotrosTexto2,
        }} />
      </Seccion>

      {/* ─── SECCIÓN: TESTIMONIOS ────────────────────────────────────────────── */}
      <Seccion icono={MessageSquare} titulo="Testimonios" descripcion="Control de visibilidad y reseñas manuales">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Mostrar sección de testimonios</p>
            <p className="text-xs text-slate-500">Activa o desactiva la visibilidad en el home</p>
          </div>
          <Switch
            checked={config.mostrarTestimonios ?? true}
            onCheckedChange={v => set('mostrarTestimonios', v)}
          />
        </div>

        <div className="space-y-4">
          {(config.testimonios || []).map((t, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Testimonio {i + 1}</span>
                <button
                  onClick={() => eliminarTestimonio(i)}
                  className="text-red-400 hover:text-red-600 transition-colors p-1"
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Nombre">
                  <Input value={t.nombre} onChange={e => setTestimonio(i, 'nombre', e.target.value)} maxLength={80} placeholder="María L." />
                </Campo>
                <Campo label="Inicial (letra del avatar)">
                  <Input value={t.inicial} onChange={e => setTestimonio(i, 'inicial', e.target.value.slice(0,3))} maxLength={3} placeholder="M" />
                </Campo>
              </div>
              <Campo label="Color del avatar">
                <div className="flex flex-wrap gap-2">
                  {COLORES_AVATAR.map(c => (
                    <button
                      key={c.value}
                      title={c.label}
                      onClick={() => setTestimonio(i, 'color', c.value)}
                      className={`w-7 h-7 rounded-full ${c.value} transition-all ${t.color === c.value ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'opacity-60 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </Campo>
              <Campo label="Texto del testimonio" hint="Máx. 500 caracteres">
                <Textarea value={t.texto} onChange={e => setTestimonio(i, 'texto', e.target.value)} maxLength={500} rows={2} placeholder="Excelente servicio…" />
              </Campo>
              <Campo label="Estrellas">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setTestimonio(i, 'estrellas', n)}>
                      <Star size={20} className={n <= t.estrellas ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                    </button>
                  ))}
                </div>
              </Campo>
            </div>
          ))}
        </div>

        {(config.testimonios || []).length < 8 && (
          <button
            onClick={agregarTestimonio}
            className="w-full border-2 border-dashed border-slate-200 rounded-xl py-3 text-sm text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={15} /> Agregar testimonio
          </button>
        )}

        <BtnGuardar seccion="testimonios" datos={{ testimonios: config.testimonios, mostrarTestimonios: config.mostrarTestimonios }} />
      </Seccion>

      {/* ─── SECCIÓN: BUZÓN DE RESEÑAS (PÚBLICAS) ─────────────────────────────── */}
      <Seccion icono={Star} titulo="Buzón de Reseñas" descripcion="Comentarios enviados por clientes desde la web">
        {cargandoInbox ? (
          <div className="py-8 flex justify-center"><Loader2 size={20} className="animate-spin text-slate-400" /></div>
        ) : pendientes.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">No hay reseñas pendientes de revisión.</div>
        ) : (
          <div className="space-y-3">
            {pendientes.map(p => (
              <div key={p.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{p.nombre}</p>
                    <div className="flex gap-0.5 my-1">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} size={12} className={n <= p.estrellas ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">{new Date(p.fecha).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-slate-600 italic">"{p.texto}"</p>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="xs" onClick={() => eliminarResena(p.id)} className="text-red-500 hover:text-red-600 border-red-100 h-7 px-3 text-[11px]">Eliminar</Button>
                  <Button size="xs" onClick={() => aprobarResena(p.id)} className="h-7 px-3 text-[11px]">Aprobar y publicar</Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-center pt-2">
          <Button variant="ghost" size="xs" onClick={cargarInbox} className="text-slate-400 hover:text-slate-600">
            <RefreshCw size={12} className="mr-1.5" /> Actualizar buzón
          </Button>
        </div>
      </Seccion>

      {/* ─── SECCIÓN: FAQ ────────────────────────────────────────────────────── */}
      <Seccion icono={HelpCircle} titulo="Preguntas Frecuentes" descripcion="Acordeón de FAQs en el home (máx. 15)">
        <div className="space-y-3">
          {(config.faqs || []).map((f, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pregunta {i + 1}</span>
                <button onClick={() => eliminarFaq(i)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                  <Trash2 size={14} />
                </button>
              </div>
              <Campo label="Pregunta">
                <Input value={f.p} onChange={e => setFaq(i, 'p', e.target.value)} maxLength={300} placeholder="¿Cuánto tarda una reparación?" />
              </Campo>
              <Campo label="Respuesta">
                <Textarea value={f.r} onChange={e => setFaq(i, 'r', e.target.value)} maxLength={800} rows={3} placeholder="La mayoría de reparaciones…" />
              </Campo>
            </div>
          ))}
        </div>

        {(config.faqs || []).length < 15 && (
          <button
            onClick={agregarFaq}
            className="w-full border-2 border-dashed border-slate-200 rounded-xl py-3 text-sm text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={15} /> Agregar pregunta
          </button>
        )}

        <BtnGuardar seccion="faqs" datos={{ faqs: config.faqs }} />
      </Seccion>

      {/* ─── SECCIÓN: HORARIO Y CONTACTO ─────────────────────────────────────── */}
      <Seccion icono={Clock} titulo="Horario y Contacto" descripcion="Horario de atención, dirección y WhatsApp">
        <div className="space-y-3">
          {(config.horario || []).map((h, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="flex-1">
                <Input value={h.dia} onChange={e => setHorario(i, 'dia', e.target.value)} placeholder="Lunes – Viernes" maxLength={50} />
              </div>
              <div className="flex-1">
                <Input value={h.hora} onChange={e => setHorario(i, 'hora', e.target.value)} placeholder="8:00 am – 6:00 pm" maxLength={50} />
              </div>
              <button onClick={() => eliminarHorario(i)} className="text-red-400 hover:text-red-600 transition-colors mt-2.5">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {(config.horario || []).length < 7 && (
            <button
              onClick={agregarHorario}
              className="w-full border-2 border-dashed border-slate-200 rounded-xl py-2.5 text-sm text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={14} /> Agregar día
            </button>
          )}
        </div>

        <Campo label="Dirección (texto)" hint="Se muestra en la sección de ubicación">
          <Input
            value={config.direccionTexto || ''}
            onChange={e => set('direccionTexto', e.target.value)}
            maxLength={300}
            placeholder="San José, Costa Rica"
          />
        </Campo>

        <Campo label="Número de WhatsApp" hint="Solo números, sin +, con código de país (ej: 50688887777)">
          <div className="relative">
            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={config.whatsapp || ''}
              onChange={e => set('whatsapp', e.target.value.replace(/\D/g,''))}
              maxLength={30}
              placeholder="50688887777"
              className="pl-8"
            />
          </div>
          {config.whatsapp && (
            <a
              href={`https://wa.me/${config.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-600 hover:underline"
            >
              Probar enlace → wa.me/{config.whatsapp}
            </a>
          )}
        </Campo>

        <BtnGuardar seccion="contacto" datos={{
          horario: config.horario,
          direccionTexto: config.direccionTexto,
          whatsapp: config.whatsapp,
        }} />
      </Seccion>

      {/* Espacio final */}
      <div className="h-8" />
    </div>
  )
}
