import { Heart, Shield, Users, Zap } from 'lucide-react'
import { useInView } from '../../hooks'

export default function NosotrosSection({ titulo, texto1, texto2 }) {
  const [ref, inView] = useInView(0.2)
  
  const valores = [
    { icono: Heart,  color: 'bg-rose-50 text-rose-600',   titulo: 'Pasión por servir',    desc: 'Cada cliente es tratado como parte de nuestra familia.' },
    { icono: Shield, color: 'bg-blue-50 text-blue-600',   titulo: 'Honestidad Total',    desc: 'Diagnósticos transparentes y precios justos sin sorpresas.' },
    { icono: Users,  color: 'bg-emerald-50 text-emerald-600', titulo: 'Comunidad Viva',    desc: 'Somos vecinos apoyando el crecimiento de San José.' },
    { icono: Zap,    color: 'bg-amber-50 text-amber-600', titulo: 'Agilidad Digital', desc: 'Tecnología a tu favor con seguimiento online en tiempo real.' },
  ]

  return (
    <section ref={ref} className="py-40 bg-white relative overflow-hidden">
      {/* Premium Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/[0.03] rounded-full blur-[140px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-rose-500/[0.03] rounded-full blur-[120px] -translate-x-1/3 translate-y-1/3 pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 2px, transparent 0)', backgroundSize: '60px 60px' }} />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className={`transition-all duration-1000 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Nuestra Esencia</span>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-8 leading-[0.95] tracking-tighter">{titulo}</h2>
            
            <div className="space-y-6">
              <p className="text-slate-600 text-xl leading-relaxed font-medium">
                {texto1}
              </p>
              <p className="text-slate-500 text-lg leading-relaxed">
                {texto2}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 mt-12">
              {['Legado Familiar', '100% Costarricense', 'Innovación Local'].map((tag, i) => (
                <span key={i} className="text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-900 px-6 py-3 rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-default">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className={`grid sm:grid-cols-2 gap-6 transition-all duration-1000 delay-300 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            {valores.map((v, i) => (
              <div key={i} className="p-10 bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700" />
                
                <div className={`relative z-10 w-16 h-16 rounded-2xl ${v.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-lg shadow-current/10`}>
                  <v.icono size={32} />
                </div>
                <h4 className="relative z-10 font-black text-slate-900 text-xl mb-4 tracking-tight">{v.titulo}</h4>
                <p className="relative z-10 text-slate-500 text-sm leading-relaxed font-medium">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
