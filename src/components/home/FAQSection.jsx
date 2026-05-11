import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

export default function FAQSection({ faqs }) {
  const [abierto, setAbierto] = useState(null)

  if (!faqs?.length) return null

  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex p-3 bg-blue-100 text-blue-600 rounded-2xl mb-6">
            <HelpCircle size={24} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-3 block">Resolviendo Dudas</span>
          <h2 className="text-4xl font-black text-slate-900">Preguntas Frecuentes</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div 
              key={i} 
              className={`bg-white rounded-3xl border-2 transition-all duration-300 overflow-hidden ${abierto === i ? 'border-blue-600 shadow-xl' : 'border-slate-100'}`}
            >
              <button
                className="w-full flex items-center justify-between gap-6 px-8 py-6 text-left"
                onClick={() => setAbierto(abierto === i ? null : i)}
              >
                <span className="font-bold text-slate-900 text-lg leading-tight">{faq.p}</span>
                <div className={`p-2 rounded-full transition-all duration-300 ${abierto === i ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-100 text-slate-400'}`}>
                  <ChevronDown size={20} />
                </div>
              </button>
              
              <div 
                className={`px-8 transition-all duration-300 ease-in-out ${abierto === i ? 'max-h-96 pb-8 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}
              >
                <p className="text-slate-500 font-medium leading-relaxed border-t border-slate-100 pt-6">
                  {faq.r}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
