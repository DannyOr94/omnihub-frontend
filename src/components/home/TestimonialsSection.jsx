import { useState, useEffect, useRef } from 'react'
import { Quote, Star, Plus, MessageCircle, X, Loader2 } from 'lucide-react'
import { publicApi } from '../../api/index'
import { toast } from 'sonner'
import gsap from 'gsap'

export default function TestimonialsSection({ testimonios, visible }) {
  const [activo, setActivo] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({ nombre: '', texto: '', estrellas: 5 })
  const containerRef = useRef(null)

  useEffect(() => {
    if (!testimonios?.length) return
    const interval = setInterval(() => {
      setActivo(current => (current + 1) % testimonios.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [testimonios])

  useEffect(() => {
    // Animación de entrada para las tarjetas cuando se vuelven visibles
    const ctx = gsap.context(() => {
      gsap.from('.testimonial-card', {
        opacity: 0,
        y: 30,
        stagger: 0.2,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%'
        }
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  if (!visible) return null
  if (!testimonios?.length) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await publicApi.submitTestimony(formData)
      toast.success('¡Gracias! Tu comentario ha sido enviado para revisión.')
      setShowModal(false)
      setFormData({ nombre: '', texto: '', estrellas: 5 })
    } catch {
      toast.error('Hubo un problema al enviar tu comentario.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section ref={containerRef} className="py-24 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-3 block">Voces de la Comunidad</span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">La confianza se construye juntos</h2>
            <p className="text-slate-500 mt-6 font-medium text-lg">Cientos de familias y entusiastas de la tecnología ya son parte de OmniHub.</p>
          </div>
          
          <button 
            onClick={() => setShowModal(true)}
            className="group flex items-center gap-3 bg-slate-900 hover:bg-blue-600 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-xl hover:shadow-blue-500/20 active:scale-95"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            Dejar mi comentario
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {testimonios.map((t, i) => (
            <div
              key={i}
              className={`testimonial-card relative p-8 rounded-[2.5rem] border-2 transition-all duration-500 cursor-pointer group ${i === activo ? 'border-blue-600 bg-blue-50/50 shadow-2xl' : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'}`}
              onClick={() => setActivo(i)}
            >
              <div className="absolute top-8 right-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote size={48} className="text-blue-600" />
              </div>
              
              <div className="flex gap-1 mb-6">
                {[...Array(t.estrellas || 5)].map((_, j) => (
                  <Star key={j} size={16} className="fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-slate-700 text-lg md:text-xl font-medium leading-relaxed mb-8 italic">
                "{t.texto}"
              </p>

              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${t.color} flex items-center justify-center text-white font-black text-lg shadow-lg`}>
                  {t.inicial}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-base">{t.nombre}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Cliente Verificado</p>
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
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
