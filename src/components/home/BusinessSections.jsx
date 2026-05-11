import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shirt, Cpu, ArrowRight, CheckCircle } from 'lucide-react'
import gsap from 'gsap'

function BusinessCard({ icono: Icono, image, colorTag, tag, titulo, descripcion, items, to }) {
  const navigate = useNavigate()
  const cardRef = useRef(null)

  return (
    <div
      ref={cardRef}
      className="business-card relative group overflow-hidden rounded-[3rem] min-h-[500px] flex items-end p-8 md:p-12 transition-all duration-500 cursor-pointer shadow-2xl"
      onClick={() => navigate(to)}
    >
      {/* Background Image with Zoom Effect */}
      <div className="absolute inset-0 z-0">
        <img 
          src={image} 
          alt={titulo} 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="relative z-10 w-full">
        <div className="flex items-center gap-3 mb-6">
          <span className={`inline-block text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 ${colorTag}`}>
            {tag}
          </span>
        </div>

        <div className="inline-flex p-4 rounded-2xl mb-6 bg-white/5 border border-white/10 backdrop-blur-sm">
          <Icono size={32} className="text-white" />
        </div>

        <h3 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight tracking-tighter">
          {titulo}
        </h3>
        
        <p className="text-slate-300 text-base mb-8 leading-relaxed font-medium max-w-sm">
          {descripcion}
        </p>

        <ul className="grid grid-cols-2 gap-y-3 gap-x-4 mb-10">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-xs font-bold text-white/80">
              <CheckCircle size={14} className="text-blue-400" />
              {item}
            </li>
          ))}
        </ul>

        <div className="inline-flex items-center gap-3 text-sm font-black px-10 py-5 rounded-2xl transition-all bg-white text-slate-950 hover:bg-blue-500 hover:text-white group-hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]">
          Explorar Ahora <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  )
}

export default function BusinessSections() {
  const containerRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.business-card', {
        opacity: 0,
        y: 50,
        stagger: 0.3,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%'
        }
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={containerRef} className="max-w-7xl mx-auto px-4 py-32">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        <BusinessCard
          icono={Shirt}
          image="/fashion-hero.png"
          colorTag="text-rose-400"
          tag="Moda Josefina"
          titulo="Tienda Doña Tere"
          descripcion="Vistiendo a San José con estilo y calidez. Una selección curada de moda para toda la familia con la calidad de siempre."
          items={['Textiles Premium', 'Tallas para todos', 'Tendencias Locales', 'Atención Directa']}
          to="/catalogo?tipo=TEXTIL"
        />
        <BusinessCard
          icono={Cpu}
          image="/tech-hero.png"
          colorTag="text-blue-400"
          tag="Tech Solutions"
          titulo="K.M.A. Conexiones"
          descripcion="Tu aliado tecnológico en el corazón de la ciudad. Reparaciones expertas y accesorios de última generación con garantía total."
          items={['Soporte Especializado', 'Repuestos de Grado A', 'Gadgets Exclusivos', 'Diagnóstico Express']}
          to="/catalogo?tipo=TECNOLOGIA"
        />
      </div>
    </section>
  )
}
