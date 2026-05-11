import { Link } from 'react-router-dom'
import { ChevronRight, ShoppingBag } from 'lucide-react'
import { formatCurrency } from '../../utils'

function TarjetaDestacada({ producto }) {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-500 group cursor-pointer flex flex-col h-full">
      <div className="aspect-[4/5] bg-slate-50 flex items-center justify-center relative overflow-hidden">
        {producto.imagenUrl
          ? <img src={producto.imagenUrl} alt={producto.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          : <ShoppingBag size={48} className="text-slate-200" />
        }
        <div className={`absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md ${producto.disponible ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-600'}`}>
          {producto.disponible ? 'En Stock' : 'Agotado'}
        </div>
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">{producto.categoria?.nombre}</p>
        <h4 className="font-bold text-slate-900 text-lg leading-tight mb-2 group-hover:text-blue-600 transition-colors">{producto.nombre}</h4>
        <div className="mt-auto pt-4 flex items-center justify-between">
          <p className="font-black text-slate-900 text-xl">{formatCurrency(producto.precioVenta)}</p>
          <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:bg-blue-600 transition-colors">
            <ChevronRight size={20} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductsHighlight({ productos, cargando }) {
  if (!cargando && productos.length === 0) return null

  return (
    <section className="bg-slate-50 py-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-3 block">Selección Exclusiva</span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">Disponible ahora</h2>
            <p className="text-slate-500 mt-4 font-medium text-lg">Lo más buscado en nuestras tiendas físicas y online.</p>
          </div>
          <Link to="/catalogo" className="inline-flex items-center gap-2 text-sm font-black text-slate-900 hover:text-blue-600 transition-colors uppercase tracking-widest">
            Ver todo el catálogo <ChevronRight size={18} />
          </Link>
        </div>

        {cargando ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-[2rem] aspect-[4/5] animate-pulse border border-slate-100" />
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
