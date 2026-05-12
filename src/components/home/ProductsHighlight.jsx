import { Link } from 'react-router-dom'
import { ChevronRight, ShoppingBag } from 'lucide-react'
import { formatCurrency } from '../../utils'

function TarjetaDestacada({ producto }) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200/60 overflow-hidden hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-700 group cursor-pointer flex flex-col h-full hover:-translate-y-2">
      <div className="aspect-[4/5] bg-slate-100 flex items-center justify-center relative overflow-hidden">
        {producto.imagenUrl
          ? <img src={producto.imagenUrl} alt={producto.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
          : <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <ShoppingBag size={60} className="text-slate-300 group-hover:scale-110 transition-transform duration-700" />
            </div>
        }
        <div className={`absolute top-6 right-6 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full backdrop-blur-xl shadow-lg ${producto.disponible ? 'bg-emerald-500/20 text-emerald-700 border border-emerald-500/20' : 'bg-rose-500/20 text-rose-600 border border-rose-500/20'}`}>
          {producto.disponible ? '• En Stock' : '• Agotado'}
        </div>
      </div>
      <div className="p-8 flex flex-col flex-grow relative bg-white">
        <div className="absolute top-0 left-8 w-12 h-1 bg-blue-600 -translate-y-1/2 rounded-full" />
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-3">{producto.categoria?.nombre}</p>
        <h4 className="font-black text-slate-900 text-xl leading-tight mb-4 group-hover:text-blue-600 transition-colors tracking-tight">{producto.nombre}</h4>
        <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-50">
          <p className="font-black text-slate-950 text-2xl tracking-tighter">{formatCurrency(producto.precioVenta)}</p>
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center group-hover:bg-blue-600 group-hover:shadow-lg group-hover:shadow-blue-500/40 transition-all duration-500 active:scale-90">
            <ChevronRight size={24} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductsHighlight({ productos, cargando }) {
  if (!cargando && productos.length === 0) return null

  return (
    <section className="bg-white py-32 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full bg-noise opacity-[0.02] pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-rose-500/5 rounded-full blur-[100px] translate-x-1/2 pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 mb-6 border border-blue-100">
              <ShoppingBag size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Selección Exclusiva</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 leading-[0.95] tracking-tighter">Disponible ahora</h2>
            <p className="text-slate-500 mt-6 font-medium text-xl leading-relaxed">Lo más buscado en nuestras tiendas físicas y online. Calidad garantizada en cada pieza.</p>
          </div>
          <Link to="/catalogo" className="group inline-flex items-center gap-3 text-sm font-black text-slate-900 hover:text-blue-600 transition-all uppercase tracking-[0.2em]">
            Ver todo el catálogo <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>

        {cargando ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-50 rounded-[2.5rem] aspect-[4/5] animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {productos.map(p => <TarjetaDestacada key={p.id} producto={p} />)}
          </div>
        )}
      </div>
    </section>
  )
}
