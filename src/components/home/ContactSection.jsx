import { MapPin, Clock, Phone, MessageCircle } from 'lucide-react'

export default function ContactSection({ horario, direccion, whatsapp }) {
  return (
    <section className="py-24 bg-slate-950 text-white overflow-hidden relative">
      {/* Elementos decorativos */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #334155 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-4 block">Ubicación & Contacto</span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight">Ven a visitarnos</h2>
          <p className="text-slate-400 mt-6 text-lg font-medium max-w-xl mx-auto">Estamos ubicados en el corazón de San José, listos para brindarte la mejor atención.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Dirección */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/5 hover:border-blue-500/30 transition-all group">
            <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <MapPin size={32} />
            </div>
            <h3 className="text-2xl font-black mb-4">Visítanos</h3>
            <p className="text-slate-400 text-lg leading-relaxed font-medium">
              {direccion || 'San José, Costa Rica'}
            </p>
          </div>

          {/* Horario */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/5 hover:border-rose-500/30 transition-all group">
            <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <Clock size={32} />
            </div>
            <h3 className="text-2xl font-black mb-6">Horarios</h3>
            <div className="space-y-4">
              {(horario || []).map((h, i) => (
                <div key={i} className="flex justify-between items-center pb-3 border-b border-white/5 last:border-0 last:pb-0">
                  <span className="text-slate-400 font-bold text-sm uppercase tracking-widest">{h.dia}</span>
                  <span className={`font-black text-sm ${h.hora === 'Cerrado' ? 'text-rose-500' : 'text-white'}`}>{h.hora}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contacto */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/5 hover:border-emerald-500/30 transition-all group">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <Phone size={32} />
            </div>
            <h3 className="text-2xl font-black mb-4">¿Dudas?</h3>
            <p className="text-slate-400 text-lg leading-relaxed font-medium mb-8">Escríbenos directamente y te ayudaremos en minutos.</p>
            <a
              href={`https://wa.me/${whatsapp || '50600000000'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black px-8 py-5 rounded-[1.5rem] transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
            >
              <MessageCircle size={22} /> 
              <span>Hablar por WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
