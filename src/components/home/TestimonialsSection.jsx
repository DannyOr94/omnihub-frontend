import { useState, useEffect, useRef } from 'react'
import { Quote, Star, Plus, MessageCircle, X, Loader2 } from 'lucide-react'
import { publicApi } from '../../api/index'
import { toast } from 'sonner'
import gsap from 'gsap'

export default function TestimonialsSection({ testimonios = [], visible }) {
  const [activo, setActivo] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({ 
    nombre: '', 
    texto: '', 
    estrellas: 5,
    color: 'bg-blue-500' 
  })
  const containerRef = useRef(null)

  const COLORES_DISPONIBLES = [
    { label: 'Rosa',    value: 'bg-rose-500' },
    { label: 'Azul',    value: 'bg-blue-500' },
    { label: 'Morado',  value: 'bg-purple-500' },
    { label: 'Verde',   value: 'bg-emerald-500' },
    { label: 'Naranja', value: 'bg-orange-500' },
    { label: 'Fucsia',  value: 'bg-pink-500' },
    { label: 'Índigo',  value: 'bg-indigo-500' },
    { label: 'Ámbar',   value: 'bg-amber-500' },
  ]

  // Testimonios por defecto si la lista viene vacía o es muy corta
  const fallbackTestimonios = [
    { nombre: 'Familia Morales', inicial: 'F', color: 'bg-rose-500', texto: 'Increíble atención en la tienda física. La ropa es de excelente calidad.', estrellas: 5 },
    { nombre: 'Roberto S.', inicial: 'R', color: 'bg-blue-500', texto: 'Repararon mi celular en menos de una hora. El mejor servicio técnico de San José.', estrellas: 5 },
    { nombre: 'Lucía G.', inicial: 'L', color: 'bg-emerald-500', texto: 'OmniHub es mi lugar de confianza para todo lo tecnológico. 100% recomendados.', estrellas: 5 }
  ]

  const listaTestimonios = (testimonios && testimonios.length > 0) ? testimonios : fallbackTestimonios

  useEffect(() => {
    if (!listaTestimonios?.length) return
    const interval = setInterval(() => {
      setActivo(current => (current + 1) % listaTestimonios.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [listaTestimonios])

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Animación premium del Header (stagger)
      gsap.from('.testimonial-header > *', {
        opacity: 0,
        y: 30,
        stagger: 0.15,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%'
        }
      })

      // 2. Animación fluida de las tarjetas con escala
      gsap.from('.testimonial-card', {
        opacity: 0,
        y: 50,
        scale: 0.95,
        stagger: 0.2,
        duration: 1.2,
        ease: 'back.out(1.2)', // Efecto rebote sutil premium
        scrollTrigger: {
          trigger: '.testimonial-grid',
          start: 'top 85%'
        }
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  if (!visible) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validación visual premium
    if (formData.nombre.trim().length < 3) {
      toast.error('El nombre debe tener al menos 3 caracteres', { icon: '⚠️' })
      return
    }
    if (formData.texto.trim().length < 10) {
      toast.error('Por favor, cuéntanos un poco más (mínimo 10 caracteres)', { icon: '📝' })
      return
    }

    setSubmitting(true)
    
    // Promesa visual con estados de carga premium (sonner)
    toast.promise(
      publicApi.submitTestimony(formData),
      {
        loading: 'Enviando tu testimonio...',
        success: () => {
          setShowModal(false)
          setFormData({ nombre: '', texto: '', estrellas: 5, color: 'bg-blue-500' })
          setSubmitting(false)
          return '¡Gracias! Tu comentario está siendo revisado.'
        },
        error: () => {
          setSubmitting(false)
          return 'Lo sentimos, hubo un problema al enviar tu comentario.'
        }
      }
    )
  }

  return (
    <section ref={containerRef} className="py-32 bg-slate-950 relative overflow-hidden grain">
      {/* Premium Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full bg-noise opacity-[0.08] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3 pointer-events-none" />
      
      <div className="max-w-[1440px] mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-20 gap-10">
          <div className="testimonial-header max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 mb-6 border border-blue-500/20">
              <MessageCircle size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Opiniones Reales</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-white leading-[0.95] tracking-tighter">Comentarios de nuestros clientes</h2>
            <p className="text-slate-400 mt-8 font-medium text-xl leading-relaxed">Lo que nuestra comunidad dice sobre la experiencia OmniHub en moda y tecnología.</p>
          </div>
          
          <button 
            onClick={() => setShowModal(true)}
            className="group flex items-center gap-3 bg-white text-slate-950 font-black px-10 py-5 rounded-2xl transition-all shadow-2xl hover:scale-105 active:scale-95"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            Dejar mi comentario
          </button>
        </div>

        <div className="testimonial-grid grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {listaTestimonios.map((t, i) => (
            <div
              key={i}
              className={`testimonial-card relative p-10 rounded-[3rem] border transition-all duration-700 group cursor-pointer ${i === activo ? 'bg-blue-600 border-blue-400 shadow-[0_20px_50px_rgba(37,99,235,0.3)] -translate-y-2' : 'bg-slate-900/50 backdrop-blur-xl border-white/5 hover:border-white/20'}`}
              onClick={() => setActivo(i)}
            >
              <div className="absolute top-10 right-10 opacity-10 group-hover:opacity-30 transition-opacity">
                <Quote size={60} className={i === activo ? 'text-white' : 'text-blue-500'} />
              </div>
              
              <div className="flex gap-1 mb-8">
                {[...Array(t.estrellas || 5)].map((_, j) => (
                  <Star key={j} size={18} className={`fill-current ${i === activo ? 'text-white' : 'text-amber-400'}`} />
                ))}
              </div>

              <p className={`text-lg md:text-xl font-bold leading-relaxed mb-10 italic tracking-tight ${i === activo ? 'text-white' : 'text-slate-200'}`}>
                "{t.texto}"
              </p>

              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl ${t.color || 'bg-blue-500'} flex items-center justify-center text-white font-black text-xl shadow-2xl ring-4 ring-black/10`}>
                  {t.inicial || t.nombre?.charAt(0)}
                </div>
                <div>
                  <p className="font-black text-lg text-white">{t.nombre}</p>
                  <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${i === activo ? 'text-blue-100' : 'text-slate-500'}`}>Cliente Verificado</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal para dejar comentario (Mockup UI) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Tu opinión nos importa</h3>
              <p className="text-slate-500 font-medium text-sm mt-2">Cuéntanos cómo fue tu experiencia en OmniHub.</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-3xl border-2 border-slate-100">
                <div className={`w-16 h-16 rounded-2xl ${formData.color} flex items-center justify-center text-white font-black text-2xl shadow-xl transition-all duration-500`}>
                  {formData.nombre?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Vista previa</p>
                  <p className="text-slate-900 font-bold text-sm">Así se verá tu avatar</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Nombre Completo</label>
                <input 
                  type="text" 
                  value={formData.nombre}
                  onChange={e => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej. Juan Pérez"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold focus:border-blue-600 focus:bg-white outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Elige tu color</label>
                <div className="flex flex-wrap gap-3">
                  {COLORES_DISPONIBLES.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.label}
                      onClick={() => setFormData(prev => ({ ...prev, color: c.value }))}
                      className={`w-8 h-8 rounded-full ${c.value} transition-all ${formData.color === c.value ? 'ring-4 ring-offset-2 ring-blue-500 scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Puntuación</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, estrellas: n }))}
                      className={`p-2 rounded-lg transition-colors ${formData.estrellas >= n ? 'text-amber-400' : 'text-slate-300 hover:text-slate-400'}`}
                    >
                      <Star size={24} className={formData.estrellas >= n ? 'fill-amber-400' : ''} />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Tu Comentario</label>
                <textarea 
                  value={formData.texto}
                  onChange={e => setFormData(prev => ({ ...prev, texto: e.target.value }))}
                  placeholder="¿Qué te pareció nuestro servicio?"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold focus:border-blue-600 focus:bg-white outline-none transition-all h-32 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-between gap-4 pt-4">
                <button 
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-8 py-4 rounded-xl text-slate-500 font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-4 rounded-xl shadow-xl shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    'Enviar Testimonio'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
