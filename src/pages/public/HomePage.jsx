import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Shirt, Cpu, Wrench, Search, FileText,
  ChevronRight, Star, MapPin, Phone,
  ShoppingBag, Tag, Clock, ArrowRight,
  Shield, Zap, Heart, Users, MessageCircle,
  ChevronDown, ChevronUp, CheckCircle, Quote,
} from 'lucide-react'
import { publicApi } from '../../api/index'
// publicApi.homeConfig() usa axios con baseURL ya configurado
import { formatCurrency } from '../../utils'

// ─── Valores por defecto (fallback si la API falla) ───────────────────────────
const DEFAULTS = {
  heroTitulo:       'Moda que te define, tecnología que te conecta.',
  heroSubtitulo:    'Ropa para toda la familia en Tienda Doña Tere, y accesorios tecnológicos con servicio técnico especializado en K.M.A. Conexiones.',
  statAnios:        10,
  statReparaciones: 5000,
  statTiendas:      2,
  statSatisfaccion: 98,
  nosotrosTitulo:   'Un negocio familiar con corazón tico',
  nosotrosTexto1:   'OmniHub T&K nació de la unión de dos emprendimientos locales en San José: Tienda Doña Tere, con años vistiendo a las familias josefinas con ropa para toda la familia, y K.M.A. Conexiones, especialistas en mantener la tecnología de nuestra comunidad funcionando.',
  nosotrosTexto2:   'Creemos en la atención cercana, en los precios justos y en que cada cliente merece irse satisfecho. No somos una cadena ni una franquicia — somos vecinos atendiendo vecinos.',
  testimonios: [
    { nombre: 'María L.',   inicial: 'M', color: 'bg-pink-500',   texto: 'Encontré ropa preciosa para mis hijos en Tienda Doña Tere. Precios súper accesibles y la atención fue excelente.',       estrellas: 5 },
    { nombre: 'Carlos R.',  inicial: 'C', color: 'bg-blue-500',   texto: 'Me repararon el celular en K.M.A. en menos de 2 horas. El diagnóstico fue gratuito y el precio muy justo.',              estrellas: 5 },
    { nombre: 'Ana G.',     inicial: 'A', color: 'bg-purple-500', texto: 'Lo mejor es que puedo ver el estado de mi reparación en línea. Muy práctico y transparente.',                             estrellas: 5 },
    { nombre: 'Roberto M.', inicial: 'R', color: 'bg-green-500',  texto: 'Compro aquí hace años. Un negocio familiar de confianza, siempre tienen lo que busco.',                                   estrellas: 5 },
  ],
  faqs: [
    { p: '¿Qué tipos de dispositivos reparan en K.M.A. Conexiones?', r: 'Reparamos celulares, tablets, laptops y accesorios de prácticamente todas las marcas: Samsung, iPhone, Huawei, Xiaomi, LG y más.' },
    { p: '¿Cuánto tiempo tarda una reparación?',                     r: 'La mayoría de reparaciones comunes (pantalla rota, batería, carga) se realizan el mismo día. Puedes consultar el estado en línea con tu número de boleta.' },
    { p: '¿El diagnóstico tiene costo?',                             r: 'No. El diagnóstico inicial es completamente gratuito. Solo pagas si decides proceder con la reparación.' },
    { p: '¿Qué tallas manejan en Tienda Doña Tere?',                 r: 'Manejamos tallas para toda la familia: desde ropa de bebé hasta tallas grandes para adulto, para niño, niña, hombre y mujer.' },
    { p: '¿Tienen garantía en las reparaciones?',                    r: 'Sí. Todas nuestras reparaciones tienen garantía. Pregunta por el período específico según el tipo de trabajo al momento de la entrega.' },
  ],
  horario: [
    { dia: 'Lunes – Viernes', hora: '8:00 am – 6:00 pm' },
    { dia: 'Sábado',          hora: '8:00 am – 4:00 pm' },
    { dia: 'Domingo',         hora: 'Cerrado' },
  ],
  whatsapp:       '50600000000',
  direccionTexto: 'San José, Costa Rica',
}

// ─── Hook: cargar config del home ─────────────────────────────────────────────
function useHomeConfig() {
  const [config, setConfig] = useState(DEFAULTS)
  const [listo,  setListo]  = useState(false)

  useEffect(() => {
    publicApi.homeConfig()
      .then(r => {
        if (r.data?.data) {
          setConfig(prev => ({ ...prev, ...r.data.data }))
        }
      })
      .catch(() => { /* silencioso — usa DEFAULTS */ })
      .finally(() => setListo(true))
  }, [])

  return { config, listo }
}

// ─── Hook: contador animado ────────────────────────────────────────────────────
function useCounter(target, duration = 1800, shouldStart = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!shouldStart) return
    setCount(0)
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, shouldStart])
  return count
}

// ─── Hook: intersection observer ──────────────────────────────────────────────
function useInView(threshold = 0.3) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView]
}

// ─── Tarjeta producto ──────────────────────────────────────────────────────────
function TarjetaDestacada({ producto }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
      <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center relative overflow-hidden">
        {producto.imagenUrl
          ? <img src={producto.imagenUrl} alt={producto.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <ShoppingBag size={36} className="text-slate-200" />
        }
        <div className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium ${producto.disponible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {producto.disponible ? 'Disponible' : 'Agotado'}
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs text-slate-400 mb-1">{producto.categoria?.nombre}</p>
        <p className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2">{producto.nombre}</p>
        {producto.marca && <p className="text-xs text-slate-400 mt-0.5">{producto.marca}</p>}
        <p className="font-bold text-slate-900 mt-2 text-base">{formatCurrency(producto.precioVenta)}</p>
      </div>
    </div>
  )
}

// ─── Sección de negocio ────────────────────────────────────────────────────────
function SeccionNegocio({ icono: Icono, colorBg, tag, titulo, descripcion, items, to }) {
  const navigate = useNavigate()
  return (
    <div
      className={`rounded-3xl p-8 md:p-10 ${colorBg} relative overflow-hidden group cursor-pointer transition-transform duration-300 hover:scale-[1.02]`}
      onClick={() => navigate(to)}
    >
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 group-hover:scale-110 transition-transform duration-500" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5 group-hover:scale-110 transition-transform duration-500" />
      <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 bg-white/20 text-white">{tag}</span>
      <div className="inline-flex p-3 rounded-2xl bg-white/20 mb-4">
        <Icono size={28} className="text-white" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">{titulo}</h3>
      <p className="text-sm text-white/70 mb-5 leading-relaxed">{descripcion}</p>
      <ul className="space-y-2 mb-7">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm text-white/85">
            <CheckCircle size={14} className="text-white/60 shrink-0" />{item}
          </li>
        ))}
      </ul>
      <div className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
        Ver productos <ArrowRight size={14} />
      </div>
    </div>
  )
}

// ─── Stat item ─────────────────────────────────────────────────────────────────
function StatItem({ target, suffix, label, shouldStart }) {
  const count = useCounter(target, 1800, shouldStart)
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-extrabold text-white">{count.toLocaleString()}{suffix}</div>
      <div className="text-sm text-blue-200 mt-1 font-medium">{label}</div>
    </div>
  )
}

// ─── Testimonios ───────────────────────────────────────────────────────────────
function Testimonios({ testimonios }) {
  const [activo, setActivo] = useState(0)

  // Reiniciar índice si cambia la lista (por si viene de API con diferente longitud)
  useEffect(() => { setActivo(0) }, [testimonios])

  useEffect(() => {
    if (!testimonios?.length) return
    const t = setInterval(() => setActivo(a => (a + 1) % testimonios.length), 4000)
    return () => clearInterval(t)
  }, [testimonios])

  if (!testimonios?.length) return null

  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-2 block">Lo que dicen de nosotros</span>
          <h2 className="text-3xl font-extrabold text-slate-800">La comunidad confía en nosotros</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {testimonios.map((t, i) => (
            <div
              key={i}
              className={`rounded-2xl p-6 border-2 transition-all duration-300 cursor-pointer ${i === activo ? 'border-blue-200 bg-blue-50 shadow-md' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
              onClick={() => setActivo(i)}
            >
              <Quote size={20} className="text-blue-300 mb-3" />
              <p className="text-slate-700 text-sm leading-relaxed mb-4 italic">"{t.texto}"</p>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                  {t.inicial}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{t.nombre}</p>
                  <div className="flex gap-0.5 mt-0.5">
                    {Array(t.estrellas ?? 5).fill(0).map((_, j) => (
                      <Star key={j} size={11} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ───────────────────────────────────────────────────────────────────────
function FAQ({ faqs }) {
  const [abierto, setAbierto] = useState(null)

  if (!faqs?.length) return null

  return (
    <section className="py-20 bg-slate-50 border-t border-slate-100">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-2 block">Preguntas frecuentes</span>
          <h2 className="text-3xl font-extrabold text-slate-800">Resolvemos tus dudas</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <button
                className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setAbierto(abierto === i ? null : i)}
              >
                <span className="font-semibold text-slate-800 text-sm leading-snug">{faq.p}</span>
                {abierto === i
                  ? <ChevronUp size={16} className="text-blue-500 shrink-0" />
                  : <ChevronDown size={16} className="text-slate-400 shrink-0" />
                }
              </button>
              {abierto === i && (
                <div className="px-6 pb-5">
                  <p className="text-slate-600 text-sm leading-relaxed">{faq.r}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Nosotros ──────────────────────────────────────────────────────────────────
function Nosotros({ titulo, texto1, texto2 }) {
  const [ref, inView] = useInView(0.2)
  return (
    <section ref={ref} className="py-20 bg-white border-t border-slate-100">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className={`transition-all duration-700 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-3 block">Nuestra historia</span>
            <h2 className="text-3xl font-extrabold text-slate-800 mb-5 leading-tight">{titulo}</h2>
            <p className="text-slate-600 leading-relaxed mb-4">{texto1}</p>
            <p className="text-slate-600 leading-relaxed mb-6">{texto2}</p>
            <div className="flex flex-wrap gap-3">
              {['Negocio familiar', 'San José, CR', 'Atención personalizada'].map((tag, i) => (
                <span key={i} className="text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-100">{tag}</span>
              ))}
            </div>
          </div>
          <div className={`transition-all duration-700 delay-200 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <div className="space-y-4">
              {[
                { icono: Heart,  color: 'bg-pink-50 text-pink-600',   titulo: 'Pasión por servir',    desc: 'Cada cliente es tratado como parte de la familia.' },
                { icono: Shield, color: 'bg-blue-50 text-blue-600',   titulo: 'Honestidad ante todo', desc: 'Diagnóstico transparente, sin costos ocultos.' },
                { icono: Users,  color: 'bg-green-50 text-green-600', titulo: 'Comunidad primero',    desc: 'Apoyamos el crecimiento de San José desde adentro.' },
                { icono: Zap,    color: 'bg-amber-50 text-amber-600', titulo: 'Innovación constante', desc: 'Seguimiento digital para tu tranquilidad.' },
              ].map((v, i) => (
                <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className={`p-2.5 rounded-xl ${v.color} shrink-0`}><v.icono size={20} /></div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{v.titulo}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Ubicación ─────────────────────────────────────────────────────────────────
function Ubicacion({ horario, direccion, whatsapp }) {
  return (
    <section className="py-20 bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-2 block">Encuéntranos</span>
          <h2 className="text-3xl font-extrabold">Visítanos en San José</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Dirección */}
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="p-3 bg-blue-500/20 rounded-xl w-fit mb-4"><MapPin size={22} className="text-blue-400" /></div>
            <h3 className="font-bold text-lg mb-2">Dirección</h3>
            <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">
              {direccion || 'San José, Costa Rica'}
            </p>
          </div>

          {/* Horario dinámico */}
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="p-3 bg-pink-500/20 rounded-xl w-fit mb-4"><Clock size={22} className="text-pink-400" /></div>
            <h3 className="font-bold text-lg mb-3">Horario</h3>
            <div className="space-y-1.5 text-sm">
              {(horario || []).map((h, i) => (
                <div key={i} className="flex justify-between text-slate-400">
                  <span>{h.dia}</span>
                  <span className={h.hora === 'Cerrado' ? 'text-red-400' : 'text-white font-medium'}>{h.hora}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contacto con WhatsApp dinámico */}
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="p-3 bg-green-500/20 rounded-xl w-fit mb-4"><Phone size={22} className="text-green-400" /></div>
            <h3 className="font-bold text-lg mb-3">Contacto</h3>
            <p className="text-slate-400 text-sm mb-4">¿Tienes preguntas? Escríbenos directamente por WhatsApp.</p>
            <a
              href={`https://wa.me/${whatsapp || '50600000000'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <MessageCircle size={15} /> Escribir por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── WhatsApp flotante ─────────────────────────────────────────────────────────
function WhatsAppFlotante({ numero }) {
  const [visible, setVisible] = useState(false)
  const [tooltip, setTooltip] = useState(true)
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 1500)
    const t2 = setTimeout(() => setTooltip(false), 5500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      {tooltip && (
        <div className="bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap animate-bounce">¡Escríbenos! 👋</div>
      )}
      <a
        href={`https://wa.me/${numero || '50600000000'}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 bg-green-500 hover:bg-green-400 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110"
        title="WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.124 1.532 5.855L.057 23.428a.5.5 0 0 0 .617.609l5.784-1.514A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.017-1.374l-.36-.214-3.727.976.999-3.641-.235-.374A9.817 9.817 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
        </svg>
      </a>
    </div>
  )
}

// ─── Página principal ──────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate()
  const { config } = useHomeConfig()
  const [productos,  setProductos]  = useState([])
  const [cargando,   setCargando]   = useState(true)
  const [statsRef,   statsInView]   = useInView(0.5)

  useEffect(() => {
    publicApi.catalogo({ limit: 8 })
      .then(r => {
        const lista = r.data.data ?? []
        setProductos(lista.filter(p => p.disponible).slice(0, 6))
      })
      .catch(() => setProductos([]))
      .finally(() => setCargando(false))
  }, [])

  return (
    <div className="relative">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 rounded-full px-3 py-1 text-xs font-medium text-blue-300 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Tienda física · {config.direccionTexto}
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-5">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                {config.heroTitulo}
              </span>
            </h1>
            <p className="text-lg text-slate-300 mb-8 leading-relaxed max-w-xl">
              {config.heroSubtitulo}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/catalogo')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-7 py-3.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30"
              >
                <Search size={16} /> Ver catálogo
              </button>
              <button
                onClick={() => navigate('/mis-boletas')}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-7 py-3.5 rounded-xl transition-colors border border-white/20"
              >
                <FileText size={16} /> Mi reparación
              </button>
            </div>
          </div>
        </div>
        <div className="h-12 bg-slate-50" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)', marginTop: '-1px' }} />
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────────────── */}
      <section ref={statsRef} className="bg-gradient-to-r from-blue-700 to-blue-600 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem target={config.statAnios}        suffix="+" label="Años de experiencia"    shouldStart={statsInView} />
            <StatItem target={config.statReparaciones} suffix="+" label="Dispositivos reparados" shouldStart={statsInView} />
            <StatItem target={config.statTiendas}      suffix=""  label="Tiendas en San José"    shouldStart={statsInView} />
            <StatItem target={config.statSatisfaccion} suffix="%" label="Clientes satisfechos"   shouldStart={statsInView} />
          </div>
        </div>
      </section>

      {/* ── DOS TIENDAS ──────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-2 block">Nuestras tiendas</span>
          <h2 className="text-3xl font-extrabold text-slate-800">Dos negocios, un solo lugar</h2>
          <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">Cada uno especializado en lo suyo, juntos para servirte mejor</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <SeccionNegocio
            icono={Shirt}
            colorBg="bg-gradient-to-br from-pink-600 via-rose-600 to-rose-700"
            tag="🧥 Moda & Ropa"
            titulo="Tienda Doña Tere"
            descripcion="Ropa para niños, niñas y adultos. Variedad de tallas, estilos y marcas seleccionadas para toda la familia josefina."
            items={['Ropa niño y niña', 'Ropa adulto hombre y mujer', 'Todas las tallas disponibles', 'Precios accesibles']}
            to="/catalogo?tipo=TEXTIL"
          />
          <SeccionNegocio
            icono={Cpu}
            colorBg="bg-gradient-to-br from-blue-700 via-blue-700 to-indigo-800"
            tag="📱 Tech & Reparaciones"
            titulo="K.M.A. Conexiones"
            descripcion="Accesorios tecnológicos y servicio técnico especializado. Reparamos celulares, tablets y más con garantía."
            items={['Accesorios celular y tablet', 'Reparación de dispositivos', 'Repuestos originales', 'Diagnóstico gratuito']}
            to="/catalogo?tipo=TECNOLOGIA"
          />
        </div>
      </section>

      {/* ── PRODUCTOS ────────────────────────────────────────────────────────── */}
      {(cargando || productos.length > 0) && (
        <section className="bg-white py-16 border-y border-slate-100">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1 block">Productos</span>
                <h2 className="text-2xl font-bold text-slate-800">Disponible ahora</h2>
                <p className="text-slate-500 mt-1 text-sm">Listos para llevar hoy</p>
              </div>
              <Link to="/catalogo" className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium">
                Ver todo <ChevronRight size={14} />
              </Link>
            </div>
            {cargando ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => <div key={i} className="bg-slate-100 rounded-2xl aspect-square animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {productos.map(p => <TarjetaDestacada key={p.id} producto={p} />)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── SERVICIO TÉCNICO CTA ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Wrench size={20} className="text-blue-400" />
              <span className="text-blue-400 text-sm font-semibold uppercase tracking-wide">Servicio técnico</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">¿Tu dispositivo tiene problemas?</h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
              Llévalo a K.M.A. Conexiones. Diagnosticamos, presupuestamos y reparamos. Puedes consultar el estado de tu reparación en línea.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0 relative z-10">
            <button
              onClick={() => navigate('/mis-boletas')}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors whitespace-nowrap"
            >
              <FileText size={15} /> Ver mi reparación
            </button>
            <p className="text-xs text-slate-500 text-center">Solo necesitas tu cédula y N° de boleta</p>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIOS ──────────────────────────────────────────────────────── */}
      <Testimonios testimonios={config.testimonios} />

      {/* ── NOSOTROS ─────────────────────────────────────────────────────────── */}
      <Nosotros
        titulo={config.nosotrosTitulo}
        texto1={config.nosotrosTexto1}
        texto2={config.nosotrosTexto2}
      />

      {/* ── BENEFICIOS ───────────────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-t border-slate-100 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-2 block">Por qué elegirnos</span>
            <h2 className="text-3xl font-extrabold text-slate-800">Lo que nos hace diferentes</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icono: Tag,    color: 'text-green-600 bg-green-50',   titulo: 'Precios justos',       desc: 'Sin sorpresas. Lo que ves es lo que pagas.' },
              { icono: Wrench, color: 'text-blue-600 bg-blue-50',     titulo: 'Técnicos capacitados', desc: 'Diagnóstico honesto y reparación con garantía.' },
              { icono: Clock,  color: 'text-purple-600 bg-purple-50', titulo: 'Seguimiento online',   desc: 'Consulta el estado de tu reparación desde casa.' },
              { icono: Star,   color: 'text-amber-600 bg-amber-50',   titulo: 'Atención cercana',     desc: 'Negocio familiar con años de experiencia.' },
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className={`inline-flex p-4 rounded-2xl ${item.color} mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <item.icono size={22} />
                </div>
                <p className="font-semibold text-slate-800 text-sm mb-1">{item.titulo}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <FAQ faqs={config.faqs} />

      {/* ── UBICACIÓN ────────────────────────────────────────────────────────── */}
      <Ubicacion
        horario={config.horario}
        direccion={config.direccionTexto}
        whatsapp={config.whatsapp}
      />

      {/* ── CTA FINAL ────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3">¿Todo listo?</p>
        <h2 className="text-2xl font-extrabold text-slate-800 mb-6">Explora nuestro catálogo completo</h2>
        <button
          onClick={() => navigate('/catalogo')}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 text-sm"
        >
          Ver catálogo completo <ChevronRight size={16} />
        </button>
      </section>

      {/* ── WHATSAPP FLOTANTE ─────────────────────────────────────────────────── */}
      <WhatsAppFlotante numero={config.whatsapp} />

    </div>
  )
}
