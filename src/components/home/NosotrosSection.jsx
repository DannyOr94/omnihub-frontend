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
    <section ref={ref} className="py-24 bg-white border-y border-slate-100 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className={`transition-all duration-1000 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-4 block">Nuestra Esencia</span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 leading-tight">{titulo}</h2>
            
            <div className="space-y-6">
              <p className="text-slate-600 text-lg leading-relaxed font-medium">
                {texto1}
              </p>
              <p className="text-slate-600 text-lg leading-relaxed font-medium">
                {texto2}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 mt-10">
              {['Legado Familiar', '100% Costarricense', 'Innovación Local'].map((tag, i) => (
                <span key={i} className="text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-5 py-2.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className={`grid sm:grid-cols-2 gap-6 transition-all duration-1000 delay-300 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
            {valores.map((v, i) => (
              <div key={i} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group">
                <div className={`w-14 h-14 rounded-2xl ${v.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <v.icono size={28} />
                </div>
                <h4 className="font-black text-slate-900 text-lg mb-3">{v.titulo}</h4>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
