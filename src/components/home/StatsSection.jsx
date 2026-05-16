import { useInView, useCounter } from '../../hooks'
import { Award, ShieldCheck, Users, MapPin } from 'lucide-react'

function StatItem({ target, suffix, label, icon: Icon, shouldStart }) {
  const count = useCounter(target, 2500, shouldStart)
  return (
    <div className="relative group p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-md transition-all duration-500 hover:bg-white/10 hover:border-blue-500/30 hover:-translate-y-1">
      {/* Decorative Glow */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
      
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-4 p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 group-hover:text-blue-300 transition-all">
          <Icon size={24} />
        </div>
        <div className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tighter">
          {count.toLocaleString()}{suffix}
        </div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          {label}
        </div>
      </div>
    </div>
  )
}

export default function StatsSection({ config }) {
  const [ref, inView] = useInView(0.2)

  return (
    <section 
      ref={ref}
      className="bg-[#020617] relative overflow-hidden py-40 grain"
    >
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-noise opacity-[0.05] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent pointer-events-none" />
      
      <div className="max-w-[1440px] mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-12">
          <StatItem icon={Award}       target={config.statAnios}        suffix="+" label="Años de éxito"       shouldStart={inView} />
          <StatItem icon={ShieldCheck} target={config.statReparaciones} suffix="+" label="Reparaciones"        shouldStart={inView} />
          <StatItem icon={MapPin}      target={config.statTiendas}      suffix=""  label="Sedes en San José"   shouldStart={inView} />
          <StatItem icon={Users}       target={config.statSatisfaccion} suffix="%" label="Felicidad Cliente"   shouldStart={inView} />
        </div>
      </div>
    </section>
  )
}
