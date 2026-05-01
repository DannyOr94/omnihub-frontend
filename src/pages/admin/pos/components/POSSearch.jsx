import { Search, X, ShoppingCart, Image as ImageIcon, Package } from 'lucide-react'
import { Input } from '../../../../components/ui/input'
import { formatCurrency } from '../../../../utils'

const TASAS_IVA = { EXENTO: 0, IVA_1: 1, IVA_4: 4, IVA_13: 13 }

export function POSSearch({ pos }) {
  const { 
    searchRef, 
    busqueda: { query, resultados, buscando, buscar, limpiar }, 
    agregarProducto, 
    carrito, 
    cajaAbierta 
  } = pos

  return (
    <div className="flex-1 flex flex-col gap-5 min-w-0 h-full">
      {/* Buscador (Command Palette Style) */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-2 shadow-sm transition-shadow focus-within:shadow-md focus-within:border-blue-300">
        <div className="relative flex items-center group">
          <Search size={20} className="absolute left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <Input
            ref={searchRef}
            placeholder="Busca un producto por nombre, SKU o código de barras..."
            value={query}
            onChange={e => buscar(e.target.value)}
            className="pl-12 pr-16 h-14 text-base bg-transparent border-none shadow-none focus-visible:ring-0 placeholder:text-slate-400"
          />
          {!query && (
            <kbd className="absolute right-4 hidden sm:inline-flex items-center justify-center text-xs font-mono font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
              ⌘K
            </kbd>
          )}
          {query && (
            <button onClick={limpiar} className="absolute right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Resultados */}
      {resultados.length > 0 && (
        <div className="flex-1 overflow-y-auto pr-2 pb-4 -mr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {resultados.map(p => {
              const stockLibre = p.stockActual - p.stockReservado
              const sinStock = p.manejaStock && !p.usaVariantes && stockLibre <= 0
              
              // Iniciales para el placeholder de imagen
              const initial = p.nombre ? p.nombre.charAt(0).toUpperCase() : <Package size={20} />

              return (
                <button
                  key={p.id}
                  onClick={() => agregarProducto(p)}
                  disabled={sinStock}
                  className="flex items-center text-left bg-white border border-slate-200/60 p-3 rounded-2xl hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:border-slate-200/60 transition-all duration-300 group"
                >
                  {/* Image Placeholder */}
                  <div className="w-14 h-14 shrink-0 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 group-hover:border-blue-100 transition-colors mr-3">
                    <span className="font-bold text-lg">{initial}</span>
                  </div>

                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700 truncate transition-colors leading-tight">
                      {p.nombre}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {p.marca && <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">{p.marca}</span>}
                      {p.usaVariantes && (
                        <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">Variantes</span>
                      )}
                      {sinStock && (
                        <span className="text-[11px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100">Sin stock</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end justify-center h-full border-l border-slate-100 pl-3">
                    <p className="text-sm font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                      {formatCurrency(p.precioVenta)}
                    </p>
                    {p.manejaStock && !p.usaVariantes && (
                      <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${stockLibre <= 3 ? 'text-orange-500' : 'text-slate-400'}`}>
                        {stockLibre} disp.
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {buscando && (
        <div className="flex-1 flex justify-center items-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Estado vacío Premium */}
      {carrito.length === 0 && !query && !buscando && (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 select-none bg-white/50 rounded-2xl border border-dashed border-slate-200">
          <div className="relative mb-6 group">
            <div className="absolute inset-0 bg-blue-100 rounded-full scale-150 blur-2xl opacity-50"></div>
            <div className="w-24 h-24 bg-white shadow-sm rounded-full flex items-center justify-center relative border border-slate-100">
              <ShoppingCart size={48} strokeWidth={1.5} className="text-slate-300" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-700">Comienza una nueva venta</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-sm text-center leading-relaxed">
            Utiliza el buscador superior para encontrar productos o escanea un código de barras.
          </p>
          
          {!cajaAbierta && (
            <div className="mt-8 bg-red-50/80 border border-red-200 text-red-800 rounded-xl px-5 py-3.5 text-sm flex items-center gap-3 animate-in fade-in zoom-in-95 duration-500 shadow-sm">
              <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
                <span className="text-lg">⚠️</span>
              </div>
              <div>
                <p className="font-bold">La caja está cerrada</p>
                <p className="text-xs text-red-600/80 mt-0.5">Abre la caja en el módulo correspondiente antes de registrar ventas</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
