import { Link } from 'react-router-dom'
import { ChevronRight, ShoppingBag, Flame } from 'lucide-react'
import { formatCurrency } from '../../utils'

function TarjetaDestacada({ producto }) {
  const mostrarUrgencia = producto.disponible && producto.stockRestante !== null && producto.stockRestante <= 5

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200/60 overflow-hidden hover:shadow-[0_40px_80px_-20px_rgba(37,99,235,0.15)] transition-all duration-700 group cursor-pointer flex flex-col h-full hover:-translate-y-2 relative">
      
      {/* Etiqueta de Urgencia Flotante */}
      {mostrarUrgencia && (
        <div className="absolute top-6 right-6 z-20 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-rose-500/30 flex items-center gap-1 animate-pulse">
          <Flame size={12} /> ¡Solo {producto.stockRestante}!
        </div>
      )}

      <div className="aspect-[4/5] bg-slate-50 flex items-center justify-center relative overflow-hidden p-6">
        {/* Gradiente Radial Sutil de Fondo */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-100/50 to-transparent pointer-events-none" />
        
        {producto.imagenUrl
          ? <img src={producto.imagenUrl} alt={producto.nombre} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] relative z-10" loading="lazy" />
          : <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center rounded-2xl">
              <ShoppingBag size={60} className="text-slate-300 group-hover:scale-110 transition-transform duration-700" />
            </div>
        }
        
        {/* Etiqueta de Estado */}
        {!mostrarUrgencia && (
          <div className={`absolute top-6 right-6 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full backdrop-blur-xl shadow-sm z-20 ${producto.disponible ? 'bg-white/80 text-slate-700 border border-slate-200/50' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'}`}>
            {producto.disponible ? '• Disponible' : '• Agotado'}
          </div>
        )}
      </div>

      <div className="p-8 flex flex-col flex-grow relative bg-white">
        <div className="absolute top-0 left-8 w-12 h-1 bg-blue-600 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{producto.categoria?.nombre}</p>
        <h4 className="font-bold text-slate-900 text-lg md:text-xl leading-tight mb-4 group-hover:text-blue-600 transition-colors tracking-tight line-clamp-2">{producto.nombre}</h4>
        
        <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-50">
          <p className="font-black text-slate-950 text-2xl tracking-tighter">{formatCurrency(producto.precioVenta)}</p>
          
          <button 
            aria-label={`Ver detalles de ${producto.nombre}`}
            className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-xl group-hover:shadow-blue-500/40 transition-all duration-500 active:scale-95"
          >
            <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProductsHighlight({ productos, cargando }) {
  if (!cargando && (!productos || productos.length === 0)) return null

  return (
    <section className="bg-white py-32 relative overflow-hidden">
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
          <Link to="/catalogo" className="group flex items-center gap-3 bg-slate-950 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 text-sm uppercase tracking-[0.1em]">
            Ver todo el catálogo <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {cargando ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden flex flex-col h-[450px]">
                <div className="h-[250px] bg-slate-50 animate-pulse relative overflow-hidden" />
                <div className="p-8 flex flex-col gap-4 flex-grow">
                  <div className="h-3 w-1/3 bg-slate-100 rounded-full animate-pulse" />
                  <div className="h-6 w-full bg-slate-100 rounded-full animate-pulse" />
                  <div className="mt-auto flex justify-between items-center pt-4">
                     <div className="h-8 w-1/2 bg-slate-100 rounded-full animate-pulse" />
                     <div className="h-10 w-10 bg-slate-100 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
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
