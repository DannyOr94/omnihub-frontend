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
        { opacity: 0, y: 40, skewY: 2 }, 
        { opacity: 1, y: 0, skewY: 0, duration: 1.2 }, 
        '-=0.8'
      )
      .fromTo(subtitleRef.current, 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 1 }, 
        '-=0.8'
      )
      .fromTo(buttonsRef.current, 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.8 }, 
        '-=0.6'
      )
      .fromTo([image1Ref.current, image2Ref.current],
        { opacity: 0, scale: 0.8, rotate: i => i === 0 ? -10 : 10 },
        { opacity: 1, scale: 1, rotate: i => i === 0 ? -5 : 5, duration: 1.5, stagger: 0.2 },
        '-=1'
      )

      // Parallax suave al mover el mouse
      const handleMouseMove = (e) => {
        const { clientX, clientY } = e
        const xPos = (clientX / window.innerWidth - 0.5) * 30
        const yPos = (clientY / window.innerHeight - 0.5) * 30
        
        gsap.to(image1Ref.current, { x: xPos, y: yPos, duration: 1 })
        gsap.to(image2Ref.current, { x: -xPos, y: -yPos, duration: 1 })
      }

      window.addEventListener('mousemove', handleMouseMove)
      return () => window.removeEventListener('mousemove', handleMouseMove)
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section 
      ref={sectionRef}
      className="relative bg-[#020617] text-white overflow-hidden min-h-screen flex items-center pt-20"
    >
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      <div className="max-w-7xl mx-auto px-4 relative z-20 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <div 
              ref={badgeRef}
              className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-8 backdrop-blur-md"
            >
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Tienda física · {config.direccionTexto}
            </div>
            
            <h1 
              ref={titleRef}
              className="text-5xl md:text-7xl xl:text-8xl font-black leading-[0.95] mb-8 tracking-tighter"
            >
              <span className="block text-white">OmniHub</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-200 to-rose-400">
                T&K
              </span>
            </h1>
            
            <p 
              ref={subtitleRef}
              className="text-lg md:text-xl text-slate-400 mb-12 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium"
            >
              {config.heroSubtitulo}
            </p>
            
            <div 
              ref={buttonsRef}
              className="flex flex-wrap justify-center lg:justify-start gap-4"
            >
              <button
                onClick={() => navigate('/catalogo')}
                className="group relative flex items-center gap-3 bg-white text-slate-950 font-black px-10 py-5 rounded-2xl transition-all duration-300 hover:scale-105 shadow-2xl"
              >
                <span>Explorar Catálogo</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => navigate('/mis-boletas')}
                className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-bold px-10 py-5 rounded-2xl transition-all border border-slate-800 backdrop-blur-md"
              >
                <FileText size={20} className="text-blue-400" /> 
                <span>Estado Reparación</span>
              </button>
            </div>
          </div>

          {/* Right Visuals: Dual Floating Cards */}
          <div className="relative h-[500px] hidden lg:block">
            {/* Tech Card */}
            <div 
              ref={image2Ref}
              className="absolute top-0 right-0 w-80 h-[450px] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl -rotate-6 backdrop-blur-sm bg-slate-900/40 p-4"
            >
              <div className="w-full h-full rounded-[2rem] overflow-hidden relative group">
                <img src="/tech-hero.png" alt="Tecnología" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-6 left-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">K.M.A. Conexiones</p>
                  <p className="text-xl font-black">Tecnología</p>
                </div>
              </div>
            </div>

            {/* Fashion Card */}
            <div 
              ref={image1Ref}
              className="absolute bottom-0 left-0 w-80 h-[450px] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl rotate-6 backdrop-blur-sm bg-slate-900/40 p-4 z-10"
            >
              <div className="w-full h-full rounded-[2rem] overflow-hidden relative group">
                <img src="/fashion-hero.png" alt="Moda" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-6 left-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-1">Doña Tere</p>
                  <p className="text-xl font-black">Moda Josefina</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
        <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent" />
        <span className="text-[8px] font-black uppercase tracking-[0.4em]">Scroll</span>
      </div>
    </section>
  )
}
