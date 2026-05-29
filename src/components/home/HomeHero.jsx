import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FileText, ArrowRight } from 'lucide-react'
import gsap from 'gsap'

export default function HomeHero({ config }) {
  const navigate = useNavigate()
  const sectionRef = useRef(null)
  const titleRef = useRef(null)
  const subtitleRef = useRef(null)
  const buttonsRef = useRef(null)
  const badgeRef = useRef(null)
  const image1Ref = useRef(null)
  const image2Ref = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })
      
      tl.fromTo(badgeRef.current, 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 1, delay: 0.2 }
      )
      .fromTo(titleRef.current, 
        { opacity: 0, y: 60, skewY: 4 }, 
        { opacity: 1, y: 0, skewY: 0, duration: 1.5 }, 
        '-=0.8'
      )
      .fromTo(subtitleRef.current, 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 1 }, 
        '-=1'
      )
      .fromTo(buttonsRef.current, 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 }, 
        '-=0.6'
      )
      .fromTo([image1Ref.current, image2Ref.current],
        { opacity: 0, scale: 0.5, rotate: i => i === 0 ? -20 : 20, y: 100 },
        { opacity: 1, scale: 1, rotate: i => i === 0 ? -8 : 8, y: 0, duration: 2, ease: 'elastic.out(1, 0.8)', stagger: 0.3 },
        '-=1.2'
      )

    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section 
      ref={sectionRef}
      className="relative bg-[#020617] text-white overflow-hidden min-h-[95vh] lg:min-h-screen flex items-center pt-24 pb-20 lg:py-0"
    >
      {/* Background Orbs con Animación */}
      <div className="hero-orb absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/4 pointer-events-none z-0" />
      <div className="hero-orb absolute bottom-0 left-0 w-[600px] h-[600px] bg-rose-600/15 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/4 pointer-events-none z-0" />
      <div className="hero-orb absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-indigo-600/5 rounded-full blur-[160px] pointer-events-none z-0" />
      
      {/* Grid Pattern Premium */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-0" 
           style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="max-w-[1440px] mx-auto px-6 relative z-20 w-full">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          
          {/* Left Content: Typography Mastery */}
          <div className="text-center lg:text-left">
            <div 
              ref={badgeRef}
              className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-10 backdrop-blur-2xl shadow-2xl"
            >
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_15px_#3b82f6] animate-pulse" />
              <span>Tienda física · {config.direccionTexto}</span>
            </div>
            
            <h1 
              ref={titleRef}
              className="text-6xl md:text-8xl xl:text-9xl font-black leading-[0.85] mb-10 tracking-tighter"
            >
              <span className="block text-white drop-shadow-2xl">OmniHub</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-rose-400 animate-gradient-x">
                T&K
              </span>
            </h1>
            
            <p 
              ref={subtitleRef}
              className="text-xl md:text-2xl text-slate-300 mb-14 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium tracking-tight"
            >
              {config.heroSubtitulo}
            </p>
            
            <div 
              ref={buttonsRef}
              className="flex flex-wrap justify-center lg:justify-start gap-6"
            >
              <button
                onClick={() => navigate('/catalogo')}
                className="group relative flex items-center gap-4 bg-white text-slate-950 font-black px-12 py-6 rounded-3xl transition-all duration-500 hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl"
              >
                <span className="text-lg">Explorar Catálogo</span>
                <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform duration-500" />
              </button>
              
              <button
                onClick={() => navigate('/mis-boletas')}
                className="flex items-center gap-4 bg-slate-900/50 hover:bg-slate-800 text-white font-black px-12 py-6 rounded-3xl transition-all duration-500 border border-white/10 backdrop-blur-2xl hover:border-blue-500/50 group"
              >
                <FileText size={22} className="text-blue-400 group-hover:scale-110 transition-transform" /> 
                <span className="text-lg">Estado Reparación</span>
              </button>
            </div>
          </div>

          {/* Right Visuals: Interactive 3D Cards */}
          <div className="relative h-[650px] hidden lg:block perspective-1000">
            {/* Tech Card (K.M.A.) */}
            <div 
              ref={image2Ref}
              className="absolute top-10 right-0 w-[380px] h-[550px] rounded-[4rem] overflow-hidden border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] -rotate-8 backdrop-blur-md bg-slate-900/20 p-5 transition-all duration-700 hover:z-30 hover:rotate-0 hover:scale-105"
            >
              <div className="w-full h-full rounded-[3rem] overflow-hidden relative group">
                <img src="/tech-hero-new.png" alt="Tecnología" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80" />
                <div className="absolute bottom-10 left-10">
                  <div className="w-12 h-1 bg-blue-500 mb-4 rounded-full" />
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400 mb-2">K.M.A. Conexiones</p>
                  <p className="text-3xl font-black text-white">Tecnología de Vanguardia</p>
                </div>
              </div>
            </div>

            {/* Fashion Card (Doña Tere) */}
            <div 
              ref={image1Ref}
              className="absolute bottom-0 left-0 w-[380px] h-[550px] rounded-[4rem] overflow-hidden border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] rotate-8 backdrop-blur-md bg-slate-900/20 p-5 z-10 transition-all duration-700 hover:z-30 hover:rotate-0 hover:scale-105"
            >
              <div className="w-full h-full rounded-[3rem] overflow-hidden relative group">
                <img src="/fashion-hero-new.png" alt="Moda" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80" />
                <div className="absolute bottom-10 left-10">
                  <div className="w-12 h-1 bg-rose-500 mb-4 rounded-full" />
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-rose-400 mb-2">Tienda Doña Tere</p>
                  <p className="text-3xl font-black text-white">Moda con Herencia</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* Scroll Indicator: Refined */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-40 group cursor-pointer hover:opacity-100 transition-opacity">
        <span className="text-[10px] font-black uppercase tracking-[0.5em] mb-2 rotate-90 origin-left">Explore</span>
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-1.5">
          <div className="w-1 h-2 bg-white rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  )
}
