import { usePOS } from './hooks/usePOS'
import { POSTabs, POSCartHeader } from './components/POSHeader'
import { POSSearch } from './components/POSSearch'
import { POSCart } from './components/POSCart'
import { POSSummary } from './components/POSSummary'
import { POSModals } from './components/POSModals'
import { POSHistory } from './components/POSHistory'

export function POSMain() {
  const pos = usePOS()

  return (
    <div className="h-[calc(100vh-6rem)] -m-6 bg-[#FAFAFA] flex flex-col p-6 relative overflow-hidden">
      <POSTabs pos={pos} />

      {pos.tabActivo === 'pos' ? (
        <div className="flex gap-6 flex-1 overflow-hidden h-full max-w-[1600px] mx-auto w-full">
          {/* Panel Izquierdo: Buscador y Resultados */}
          <div className="flex-1 flex flex-col min-w-0">
            <POSSearch pos={pos} />
          </div>

          {/* Panel Derecho: Carrito y Totales */}
          <div className="w-[440px] shrink-0 flex flex-col bg-white rounded-2xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              {/* Cabecera del carrito */}
              <POSCartHeader pos={pos} />
              
              <div className="flex-1 flex flex-col space-y-6">
                {/* Lista de productos en carrito */}
                <POSCart pos={pos} />
              </div>

              {/* Resumen y botón de cobro */}
              <POSSummary pos={pos} />
            </div>
          </div>
        </div>
      ) : (
        <POSHistory tabActivo={pos.tabActivo} />
      )}

      {/* Modales globales del POS */}
      <POSModals pos={pos} />
    </div>
  )
}

export default POSMain
