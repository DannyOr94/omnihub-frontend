import { useNavigate } from 'react-router-dom'
import { cn } from '../../utils'

export function AlertaItem({ icono: Icono, label, cantidad, to, color = 'yellow' }) {
  const navigate = useNavigate()

  const estilos = {
    yellow: { contenedor: 'bg-yellow-50 border-yellow-200 text-yellow-800', icono: 'text-yellow-500' },
    red:    { contenedor: 'bg-red-50    border-red-200    text-red-800',    icono: 'text-red-500'    },
    blue:   { contenedor: 'bg-blue-50   border-blue-200   text-blue-800',   icono: 'text-blue-500'   },
    green:  { contenedor: 'bg-green-50  border-green-200  text-green-800',  icono: 'text-green-500'  },
    slate:  { contenedor: 'bg-slate-50  border-slate-200  text-slate-700',  icono: 'text-slate-400'  },
  }

  const e = estilos[color] ?? estilos.yellow

  return (
    <button
      onClick={() => to && navigate(to)}
      className={cn(
        'w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium transition-opacity',
        e.contenedor,
        to ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
      )}
    >
      <span className="flex items-center gap-2">
        {Icono && <Icono size={16} className={e.icono} />}
        {label}
      </span>
      <span className="text-base font-bold tabular-nums">{cantidad}</span>
    </button>
  )
}
