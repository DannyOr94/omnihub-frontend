import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ─── Clases Tailwind ─────────────────────────────────────────────────────────
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// ─── Moneda (CRC) ────────────────────────────────────────────────────────────
export function formatCurrency(valor) {
  if (valor == null) return '₡0'
  return new Intl.NumberFormat('es-CR', {
    style:    'currency',
    currency: 'CRC',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(valor))
}

// ─── Fechas ───────────────────────────────────────────────────────────────────
export function formatDate(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-CR', {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
  })
}

export function formatDateTime(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleString('es-CR', {
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

export function formatTimeAgo(fecha) {
  if (!fecha) return '—'
  const diff = Date.now() - new Date(fecha).getTime()
  const mins  = Math.floor(diff / 60000)
  const horas = Math.floor(mins / 60)
  const dias  = Math.floor(horas / 24)
  if (mins < 1)   return 'Ahora mismo'
  if (mins < 60)  return `Hace ${mins} min`
  if (horas < 24) return `Hace ${horas}h`
  return `Hace ${dias}d`
}

// ─── Estados con color ───────────────────────────────────────────────────────
export const COLORES_ESTADO = {
  // Ventas
  COMPLETADA:       'bg-green-100 text-green-800',
  ANULADA:          'bg-red-100 text-red-800',
  EN_PROCESO:       'bg-yellow-100 text-yellow-800',
  // Boletas
  RECIBIDO:         'bg-slate-100 text-slate-700',
  EN_DIAGNOSTICO:   'bg-blue-100 text-blue-800',
  PRESUPUESTADO:    'bg-purple-100 text-purple-800',
  APROBADO:         'bg-teal-100 text-teal-800',
  RECHAZADO:        'bg-red-100 text-red-700',
  EN_REPARACION:    'bg-orange-100 text-orange-800',
  LISTO_ENTREGA:    'bg-green-100 text-green-700',
  ENTREGADO:        'bg-slate-100 text-slate-500',
  // Apartados
  ACTIVO:           'bg-blue-100 text-blue-800',
  ABONADO:          'bg-yellow-100 text-yellow-800',
  LIQUIDADO:        'bg-green-100 text-green-800',
  VENCIDO:          'bg-red-100 text-red-800',
  CANCELADO:        'bg-slate-100 text-slate-500',
  // Pedidos
  SOLICITADO:       'bg-slate-100 text-slate-700',
  CONFIRMADO:       'bg-blue-100 text-blue-800',
  EN_ESPERA:        'bg-yellow-100 text-yellow-800',
  DISPONIBLE:       'bg-green-100 text-green-700',
  // Caja
  ABIERTO:          'bg-green-100 text-green-800',
  CERRADO:          'bg-slate-100 text-slate-600',
}

export function colorEstado(estado) {
  return COLORES_ESTADO[estado] ?? 'bg-slate-100 text-slate-600'
}

// ─── Etiquetas legibles ───────────────────────────────────────────────────────
export const ETIQUETAS = {
  TEXTIL:       'Textil',
  TECNOLOGIA:   'Tecnología',
  REPUESTO:     'Repuesto',
  SERVICIO:     'Servicio',
  EFECTIVO:     'Efectivo',
  TRANSFERENCIA:'Transferencia',
  DATAFONO:     'Datáfono',
  SINPE:        'SINPE',
  NOTA_CREDITO: 'Nota de crédito',
  ADMINISTRADOR:'Administrador',
  VENDEDOR:     'Vendedor',
  TECNICO:      'Técnico',
}

export function etiqueta(valor) {
  return ETIQUETAS[valor] ?? valor
}

export function getImagenUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  const host = apiBase.replace('/api', '')
  const cleanUrl = url.startsWith('/') ? url : `/${url}`
  return `${host}${cleanUrl}`
}

