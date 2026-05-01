import { Button } from '../../../../components/ui/button'
import { formatCurrency } from '../../../../utils'

export function POSSummary({ pos }) {
  const { 
    carrito, subtotalLineas, gruposIva, totalDescuento, total, 
    cajaAbierta, abrirPago, abrirProforma 
  } = pos

  if (carrito.length === 0) return null

  return (
    <div className="border-t border-slate-200/60 px-6 py-6 bg-slate-50/30 z-10 shrink-0">
      {/* Totales con desglose IVA */}
      <div className="space-y-2.5 text-sm mb-6">
        <div className="flex justify-between text-slate-500 font-medium">
          <span>Subtotal</span><span className="text-slate-700">{formatCurrency(subtotalLineas)}</span>
        </div>

        {/* Desglose de IVA por tasa */}
        {gruposIva.map(g => (
          <div key={g.tasa} className="flex justify-between text-[13px] text-slate-400">
            <span>IVA {g.porcentaje}% incluido</span>
            <span className="font-medium text-slate-500">{formatCurrency(g.monto)}</span>
          </div>
        ))}

        {totalDescuento > 0 && (
          <div className="flex justify-between text-emerald-600 font-bold pt-1">
            <span>Descuento aplicado</span><span>-{formatCurrency(totalDescuento)}</span>
          </div>
        )}
        
        <div className="flex justify-between items-end font-black text-slate-900 pt-4 border-t border-slate-200/60 mt-4">
          <span className="text-lg">Total a cobrar</span>
          <span className="text-3xl tracking-tight leading-none text-slate-900">{formatCurrency(total)}</span>
        </div>

        <Button 
          variant="outline"
          className="w-full mt-3 h-12 text-sm font-bold text-slate-600 border-slate-200 hover:bg-slate-100 rounded-xl"
          onClick={abrirProforma}
        >
          Generar Proforma
        </Button>
      </div>

      {!cajaAbierta && (
        <div className="flex items-start gap-3 bg-red-50/80 border border-red-200/60 rounded-xl px-4 py-3 text-sm text-red-800 mb-4 shadow-sm">
          <span className="text-lg leading-none mt-0.5">⚠️</span>
          <div>
            <p className="font-bold text-xs uppercase tracking-wider">Caja cerrada</p>
            <p className="text-xs text-red-600/90 mt-0.5 leading-relaxed">Abre una caja registradora en el módulo principal para proceder al cobro.</p>
          </div>
        </div>
      )}

      <Button 
        className="w-full h-16 text-lg font-black tracking-wide shadow-[0_8px_20px_rgb(15,23,42,0.15)] hover:shadow-[0_12px_25px_rgb(15,23,42,0.25)] transition-all rounded-2xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none" 
        size="lg" 
        onClick={abrirPago} 
        disabled={cajaAbierta !== true || carrito.length === 0}
      >
        {cajaAbierta ? `Cobrar ${formatCurrency(total)}` : 'Caja cerrada'}
      </Button>
    </div>
  )
}
