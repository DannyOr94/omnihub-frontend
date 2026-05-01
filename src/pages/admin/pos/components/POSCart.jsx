import { Minus, Plus, Trash2, ShoppingCart, Tag, X } from 'lucide-react'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { formatCurrency } from '../../../../utils'

const TASAS_IVA = { EXENTO: 0, IVA_1: 1, IVA_4: 4, IVA_13: 13 }

function LineaCarrito({ linea, onCambiarCantidad, onEliminar }) {
  const stockLibre = linea.stockActual - linea.stockReservado
  const subtotal = (linea.precioUnitario * linea.cantidad) - linea.descuentoLinea

  return (
    <div className="flex items-start gap-4 py-3 px-2 border-b border-slate-100/60 last:border-0 group hover:bg-slate-50/50 rounded-xl transition-colors">
      <div className="flex-1 min-w-0 pt-1">
        <p className="text-sm font-bold text-slate-900 truncate leading-tight">{linea.nombre}</p>
        {linea.variante && (
          <p className="text-[11px] text-slate-500 font-medium mt-1 inline-flex bg-slate-100 px-1.5 py-0.5 rounded-md">
            {linea.variante.talla && `Talla ${linea.variante.talla}`}
            {linea.variante.talla && linea.variante.color && ' · '}
            {linea.variante.color}
          </p>
        )}
        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
          <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 shadow-sm px-1.5 py-0.5 rounded-md">
            {formatCurrency(linea.precioUnitario)}
          </span>
          {linea.descuentoLinea > 0 && (
            <span className="text-[11px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md font-bold">-{formatCurrency(linea.descuentoLinea)}</span>
          )}
          {linea.tasaIva && linea.tasaIva !== 'EXENTO' ? (
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">IVA {TASAS_IVA[linea.tasaIva]}%</span>
          ) : (
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Exento</span>
          )}
        </div>
      </div>

      {/* Cantidad - Pill Style */}
      <div className="flex flex-col items-center shrink-0">
        <div className="flex items-center gap-2 bg-slate-100 rounded-full p-1 border border-slate-200/60 shadow-inner">
          <button
            onClick={() => onCambiarCantidad(linea._key, linea.cantidad - 1)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 bg-white shadow-sm hover:text-blue-600 hover:scale-105 active:scale-95 transition-all"
          >
            <Minus size={14} strokeWidth={2.5} />
          </button>
          <span className="w-6 text-center text-sm font-black text-slate-800 tabular-nums">{linea.cantidad}</span>
          <button
            onClick={() => onCambiarCantidad(linea._key, linea.cantidad + 1)}
            disabled={linea.manejaStock && linea.cantidad >= stockLibre}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 bg-white shadow-sm hover:text-blue-600 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:text-slate-600 transition-all"
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Subtotal + eliminar */}
      <div className="text-right shrink-0 w-24 flex flex-col items-end justify-between h-full pt-1">
        <p className="text-base font-black text-slate-900">{formatCurrency(subtotal)}</p>
        <button
          onClick={() => onEliminar(linea._key)}
          className="text-[10px] uppercase font-bold tracking-wider text-red-500 hover:text-red-700 bg-red-50/0 hover:bg-red-50 px-2 py-1 rounded-md transition-colors mt-2 opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={14} className="inline mr-1" /> Quitar
        </button>
      </div>
    </div>
  )
}

export function POSCart({ pos }) {
  const { 
    carrito, cambiarCantidad, setCarrito, descuento, setDescuento,
    promoActiva, setPromoActiva, evaluarPromos, promos, setPromos
  } = pos

  return (
    <div className="flex flex-col">
      {/* Lista de productos */}
      <div className="px-4 py-4 space-y-3">
        {carrito.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-300 py-16">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
              <ShoppingCart size={28} className="opacity-40" />
            </div>
            <p className="text-sm font-semibold text-slate-500">El carrito está vacío</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300 space-y-4">
            {carrito.map(linea => (
              <LineaCarrito
                key={linea._key}
                linea={linea}
                onCambiarCantidad={cambiarCantidad}
                onEliminar={key => setCarrito(prev => prev.filter(l => l._key !== key))}
              />
            ))}
          </div>
        )}
      </div>

      {/* Promociones y Descuentos Manuales */}
      {carrito.length > 0 && (
        <div className="px-5 py-8 mt-4">
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200/60 p-6 space-y-6 shadow-sm">
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-4 shrink-0">Desc. Extra</Label>
              <Input type="number" min="0" value={descuento} onChange={e => setDescuento(e.target.value)} className="h-11 text-lg font-bold bg-transparent border-none shadow-none focus-visible:ring-0 text-right pr-4" placeholder="₡ 0.00" />
            </div>

            {promoActiva ? (
              <div className="flex items-center justify-between text-sm bg-emerald-50 border border-emerald-200/60 rounded-xl px-5 py-4 shadow-sm animate-in zoom-in-95">
                <span className="text-emerald-800 font-bold flex items-center gap-2">
                  <Tag size={18} className="text-emerald-500" fill="currentColor" fillOpacity={0.2} /> {promoActiva.nombre}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-emerald-600 font-black text-lg">-{formatCurrency(promoActiva.montoDescuento)}</span>
                  <button onClick={() => { setPromoActiva(null); setPromos([]) }} className="text-emerald-500 hover:text-red-500 bg-white p-2 rounded-full shadow-sm hover:shadow transition-all">
                    <X size={16} strokeWidth={3} />
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={evaluarPromos} className="w-full text-base font-bold text-blue-700 hover:text-blue-800 flex items-center justify-center gap-2 py-4 bg-blue-50/50 hover:bg-blue-100/80 rounded-xl transition-all duration-200 border border-blue-100 border-dashed hover:border-solid shadow-sm">
                <Tag size={18} /> Aplicar promociones
              </button>
            )}

            {promos.length > 0 && !promoActiva && (
              <div className="space-y-4 pt-4 border-t border-slate-200/60 mt-6 animate-in slide-in-from-top-2">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Promociones encontradas</p>
                {promos.map((p, i) => (
                  <button key={i} onClick={() => { setPromoActiva(p); setPromos([]) }}
                    className="w-full flex items-center justify-between text-sm bg-white border border-blue-200 rounded-xl px-5 py-4 hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
                    <span className="text-slate-800 font-bold group-hover:text-blue-700 transition-colors flex items-center gap-3">
                      <Tag size={18} className="text-blue-400 group-hover:text-blue-600" />
                      {p.nombre}
                    </span>
                    <span className="text-emerald-600 font-black bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                      -{formatCurrency(p.montoDescuento)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
