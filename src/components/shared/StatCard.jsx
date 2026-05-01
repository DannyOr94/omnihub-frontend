import { cn } from '../../utils'

export function StatCard({
  titulo,
  valor,
  subtitulo,
  icono: Icono,
  color = 'blue',
  cargando = false,
}) {
  const colores = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100' },
    green:  { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-100' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100' },
    red:    { bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-100' },
    slate:  { bg: 'bg-slate-50',  text: 'text-slate-600',  border: 'border-slate-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
  }

  const c = colores[color] ?? colores.blue

  return (
    <div className={cn('bg-white rounded-xl border p-5 flex items-start gap-4', c.border)}>
      {Icono && (
        <div className={cn('rounded-lg p-2.5 shrink-0', c.bg, c.text)}>
          <Icono size={20} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide leading-none">
          {titulo}
        </p>
        {cargando ? (
          <div className="h-7 w-24 bg-slate-100 animate-pulse rounded mt-1.5" />
        ) : (
          <p className="text-2xl font-bold text-slate-800 mt-1 truncate leading-tight">
            {valor}
          </p>
        )}
        {subtitulo && (
          <p className="text-xs text-slate-400 mt-0.5 leading-tight">{subtitulo}</p>
        )}
      </div>
    </div>
  )
}
