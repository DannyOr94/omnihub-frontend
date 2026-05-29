import { ShoppingCart, History, Clock, UserPlus, PauseCircle, Trash2 } from 'lucide-react'

export function POSTabs({ pos }) {
  const { tabActivo, setTabActivo, enEspera, setModalEspera, sucursales, sucursalActiva, cambiarSucursal, caja, setCaja } = pos

  return (
    <div className="flex items-center justify-between mb-6 gap-4">
      <div className="flex items-center gap-2">
        {/* Segmented Control */}
        <div className="flex items-center bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60 shadow-sm">
          <button
            onClick={() => setTabActivo('pos')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
              tabActivo === 'pos' 
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <ShoppingCart size={16} className={tabActivo === 'pos' ? 'text-blue-600' : ''} /> 
            Punto de Venta
          </button>
          <button
            onClick={() => setTabActivo('historial')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
              tabActivo === 'historial' 
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <History size={16} className={tabActivo === 'historial' ? 'text-blue-600' : ''} /> 
            Historial de ventas
          </button>
        </div>

        {/* Indicador de ventas en espera */}
        {enEspera.length > 0 && (
          <button
            onClick={() => setModalEspera(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-amber-700 bg-amber-50/80 border border-amber-200/50 hover:bg-amber-100 hover:shadow-sm transition-all animate-pulse shadow-sm"
          >
            <Clock size={16} className="text-amber-500" />
            {enEspera.length} en espera
          </button>
        )}
      </div>

      {/* Selector de Sucursal y Caja */}
      {tabActivo === 'pos' && (
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sucursal:</span>
            <select
              value={sucursalActiva?.id || ''}
              onChange={(e) => {
                const found = sucursales.find(s => s.id === Number(e.target.value))
                if (found) cambiarSucursal(found)
              }}
              className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {sucursales.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-slate-200"></div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Terminal:</span>
            <input
              type="text"
              value={caja}
              onChange={(e) => setCaja(e.target.value)}
              placeholder="Caja"
              className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 w-20 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function POSCartHeader({ pos }) {
  const { 
    carrito, clienteNombre, setModalCliente, setMostrarCrearCliente, 
    ponerEnEspera, limpiarCarrito 
  } = pos

  return (
    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 text-slate-700 flex items-center justify-center shadow-sm">
          <ShoppingCart size={18} className="text-slate-700" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 text-base leading-tight">
            Orden Actual
          </span>
          <span className="text-slate-400 font-medium text-xs">
            {carrito.length} {carrito.length === 1 ? 'ítem' : 'ítems'}
          </span>
        </div>
      </div>
      
      <div className="flex gap-2">
        {/* Botón cliente */}
        <button
          onClick={() => { setModalCliente(true); setMostrarCrearCliente(false) }}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg border transition-all duration-200 ${
            clienteNombre 
              ? 'text-blue-700 border-blue-200 bg-blue-50/50 hover:bg-blue-100 shadow-sm' 
              : 'text-slate-600 border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-sm'
          }`}
        >
          <UserPlus size={14} className={clienteNombre ? 'text-blue-500' : 'text-slate-400'} />
          {clienteNombre
            ? <span className="max-w-[100px] truncate">{clienteNombre}</span>
            : 'Asociar Cliente'
          }
        </button>

        {/* Parking */}
        {carrito.length > 0 && (
          <button
            onClick={ponerEnEspera}
            title="Poner en espera"
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50/50 hover:bg-amber-100 px-3.5 py-2 rounded-lg border border-amber-200/60 hover:border-amber-300 transition-all duration-200 shadow-sm"
          >
            <PauseCircle size={14} className="text-amber-500" /> Espera
          </button>
        )}

        {/* Limpiar */}
        {carrito.length > 0 && (
          <button 
            onClick={limpiarCarrito} 
            title="Limpiar Carrito"
            className="flex items-center justify-center text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 w-9 h-9 rounded-lg border border-slate-200 hover:border-red-200 transition-all duration-200 shadow-sm"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
