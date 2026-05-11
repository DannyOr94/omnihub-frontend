import { useState, useEffect } from 'react'

export default function WhatsAppButton({ numero }) {
  const [visible, setVisible] = useState(false)
  const [showTooltip, setShowTooltip] = useState(true)

  useEffect(() => {
    const timer1 = setTimeout(() => setVisible(true), 2000)
    const timer2 = setTimeout(() => setShowTooltip(false), 8000)
    return () => { clearTimeout(timer1); clearTimeout(timer2) }
  }, [])

  return (
    <div className={`fixed bottom-8 right-8 z-[90] flex flex-col items-end gap-3 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
      {showTooltip && (
        <div className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-2xl animate-bounce border border-white/10">
          ¿En qué podemos ayudarte? 👋
        </div>
      )}
      <a
        href={`https://wa.me/${numero || '50600000000'}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group w-16 h-16 bg-[#25D366] hover:bg-[#22c35e] rounded-[1.5rem] shadow-[0_10px_40px_rgba(37,211,102,0.4)] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        title="WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white group-hover:rotate-12 transition-transform">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.124 1.532 5.855L.057 23.428a.5.5 0 0 0 .617.609l5.784-1.514A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.017-1.374l-.36-.214-3.727.976.999-3.641-.235-.374A9.817 9.817 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
        </svg>
      </a>
    </div>
  )
}
