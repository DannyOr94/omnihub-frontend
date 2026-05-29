import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

export default function FAQSection({ faqs }) {
  const [abierto, setAbierto] = useState(null)

  if (!faqs?.length) return null

  return (
    <section className="py-32 relative overflow-hidden bg-white">

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 mb-6 border border-blue-100">
            <HelpCircle size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Resolviendo Dudas</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter mb-6">Preguntas Frecuentes</h2>
          <p className="text-slate-500 text-lg font-medium max-w-xl mx-auto">Todo lo que necesitas saber sobre nuestros servicios de moda y tecnología.</p>
        </div>

        <div className="grid gap-4">
          {faqs.map((faq, i) => (
            <div 
              key={i} 
              className={`group bg-slate-50 rounded-[2rem] border-2 transition-all duration-300 ${abierto === i ? 'border-blue-600/20 bg-white shadow-xl' : 'border-transparent hover:border-slate-200'}`}
            >
              <button
                className="w-full flex items-center justify-between gap-6 px-10 py-8 text-left outline-none"
                onClick={() => setAbierto(abierto === i ? null : i)}
              >
                <span className={`font-black text-xl tracking-tight transition-colors duration-300 ${abierto === i ? 'text-blue-600' : 'text-slate-900'}`}>{faq.p}</span>
                <div className={`w-12 h-12 rounded-2xl flex shrink-0 items-center justify-center transition-all duration-300 ${abierto === i ? 'bg-blue-600 text-white rotate-180 shadow-md shadow-blue-500/30' : 'bg-white text-slate-400 group-hover:bg-slate-200'}`}>
                  <ChevronDown size={24} strokeWidth={3} />
                </div>
              </button>
              
              <div 
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${abierto === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
              >
                <div className="overflow-hidden">
                  <div className="px-10 pb-10 border-t border-slate-100 pt-8">
                    <p className="text-slate-600 text-lg leading-relaxed font-medium">
                      {faq.r}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
