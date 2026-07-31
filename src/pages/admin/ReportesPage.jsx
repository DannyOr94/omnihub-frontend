import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  BarChart3, RefreshCw, TrendingUp, Package,
  Wrench, BookMarked, ClipboardList, DollarSign,
  Download, Printer, Calendar, Users, Store,
  ArrowUpRight, AlertTriangle, Eye, HelpCircle,
  FileSpreadsheet
} from 'lucide-react'
import { reportesApi } from '../../api/index'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { formatCurrency, formatDate } from '../../utils'

const TABS = [
  { key: 'dashboard', label: 'Dashboard General', icon: BarChart3 },
  { key: 'inventario', label: 'Control de Inventario', icon: Package },
  { key: 'mercado', label: 'Inteligencia de Mercado', icon: Eye },
  { key: 'saldos', label: 'Resultados y Saldos', icon: DollarSign },
]

function formatMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    let cleanLine = line.trim();
    const isBullet = cleanLine.startsWith('-') || cleanLine.startsWith('*');
    if (isBullet) {
      cleanLine = cleanLine.substring(1).trim();
    }
    const parts = [];
    let currentText = cleanLine;
    const regex = /\*\*(.*?)\*\*/g;
    let match;
    let lastIndex = 0;
    while ((match = regex.exec(currentText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(currentText.substring(lastIndex, match.index));
      }
      parts.push(<strong key={match.index} className="font-extrabold text-white">{match[1]}</strong>);
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < currentText.length) {
      parts.push(currentText.substring(lastIndex));
    }
    if (isBullet) {
      return (
        <li key={i} className="ml-4 list-disc text-slate-300 my-1 text-xs text-left">
          {parts.length > 0 ? parts : cleanLine}
        </li>
      );
    }
    if (cleanLine.startsWith('###')) {
      return (
        <h5 key={i} className="text-xs font-bold text-indigo-400 mt-3 mb-1.5 text-left uppercase tracking-wider">
          {cleanLine.replace('###', '').trim()}
        </h5>
      );
    }
    if (cleanLine.startsWith('##')) {
      return (
        <h4 key={i} className="text-sm font-black text-indigo-300 mt-4 mb-1.5 text-left">
          {cleanLine.replace('##', '').trim()}
        </h4>
      );
    }
    if (cleanLine.startsWith('#')) {
      return (
        <h3 key={i} className="text-base font-black text-white mt-5 mb-2 text-left">
          {cleanLine.replace('#', '').trim()}
        </h3>
      );
    }
    return (
      <p key={i} className="text-xs text-slate-300 my-1 text-left leading-relaxed">
        {parts.length > 0 ? parts : cleanLine}
      </p>
    );
  });
}

export default function ReportesPage() {
  const [tab, setTab] = useState('dashboard')
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(false)

  // Asistente IA
  const [mensajes, setMensajes] = useState([])
  const [mensajeInput, setMensajeInput] = useState('')
  const [iaCargando, setIaCargando] = useState(false)

  // Filtros de fecha
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [presetActivo, setPresetActivo] = useState('mes')

  // Set default dates to current month on load
  useEffect(() => {
    const hoy = new Date()
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    
    // Formatear local YYYY-MM-DD
    const tzOffset = primerDia.getTimezoneOffset() * 60000
    const localPrimerDia = new Date(primerDia.getTime() - tzOffset)
    const localHoy = new Date(hoy.getTime() - tzOffset)
    
    setDesde(localPrimerDia.toISOString().slice(0, 10))
    setHasta(localHoy.toISOString().slice(0, 10))
  }, [])

  async function cargar() {
    if (!desde || !hasta) return
    setCargando(true)
    try {
      const res = await reportesApi.gerencial({ desde, hasta })
      setDatos(res.data.data)
    } catch (err) {
      console.error(err)
      toast.error('Error al cargar el reporte gerencial')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    if (datos?.insightIA) {
      setMensajes([
        { rol: 'assistant', content: datos.insightIA }
      ])
    } else {
      setMensajes([])
    }
  }, [datos])

  const enviarMensaje = async (e) => {
    e.preventDefault()
    if (!mensajeInput.trim() || iaCargando || !datos) return

    const nuevoMensaje = mensajeInput.trim()
    setMensajeInput('')
    
    // Add user message
    const msgUsuario = { rol: 'user', content: nuevoMensaje }
    setMensajes(prev => [...prev, msgUsuario])
    setIaCargando(true)

    try {
      const res = await reportesApi.iaConsultor({ mensaje: nuevoMensaje, metrics: datos })
      if (res.data?.respuesta) {
        setMensajes(prev => [...prev, { rol: 'assistant', content: res.data.respuesta }])
      } else {
        toast.error('La IA no devolvió una respuesta válida.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Error al comunicarse con el Asistente IA')
    } finally {
      setIaCargando(false)
    }
  }


  useEffect(() => {
    cargar()
  }, [desde, hasta])

  const handlePreset = (preset) => {
    setPresetActivo(preset)
    const hoy = new Date()
    const tzOffset = hoy.getTimezoneOffset() * 60000
    let d = ''
    let h = new Date(hoy.getTime() - tzOffset).toISOString().slice(0, 10)

    if (preset === 'hoy') {
      d = h
    } else if (preset === '7d') {
      const hace7d = new Date()
      hace7d.setDate(hace7d.getDate() - 7)
      d = new Date(hace7d.getTime() - tzOffset).toISOString().slice(0, 10)
    } else if (preset === 'mes') {
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      d = new Date(inicioMes.getTime() - tzOffset).toISOString().slice(0, 10)
    } else {
      return // Personalizado
    }
    setDesde(d)
    setHasta(h)
  }

  // Exportar a CSV
  const exportarCSV = () => {
    if (!datos) return
    toast.info('Generando archivos CSV de auditoría...')

    // 1. Resumen Financiero
    const resHeaders = ['KPI', 'Valor']
    const resRows = [
      ['Ingresos Brutos', formatCurrency(datos.resumenFinanciero.ingresosBrutos)],
      ['Costo de Ventas', formatCurrency(datos.resumenFinanciero.costoTotal)],
      ['Utilidad Neta Real', formatCurrency(datos.resumenFinanciero.utilidadNetaReal)],
      ['Ticket Promedio', formatCurrency(datos.resumenFinanciero.ticketPromedio)],
      ['Tasa de Conversión', `${datos.resumenFinanciero.tasaConversion.toFixed(2)}%`]
    ]
    downloadCSV('Resumen_Financiero.csv', resHeaders, resRows)

    // 2. Alertas de Inventario
    if (datos.alertasReabastecimiento?.length > 0) {
      const invHeaders = ['SKU', 'Nombre', 'Tipo', 'Stock Actual', 'Stock Mínimo', 'Días de Cobertura']
      const invRows = datos.alertasReabastecimiento.map(item => [
        item.sku,
        item.nombre,
        item.tipo,
        item.stockActual,
        item.stockMinimo,
        item.diasCobertura === 999 ? 'Sin consumo' : item.diasCobertura
      ])
      downloadCSV('Alertas_Reabastecimiento.csv', invHeaders, invRows)
    }
  }

  const downloadCSV = (filename, headers, rows) => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const triggerPrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print, nav, header, aside, button, select {
            display: none !important;
          }
          .print-container {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-card {
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            page-break-inside: avoid;
          }
        }
      `}} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <BarChart3 className="text-indigo-600" size={24}/> Finanzas y Reportes Gerenciales
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Análisis corporativo del rendimiento y control de la sucursal Nicoya central
          </p>
        </div>
        <div className="flex items-center gap-2 self-end">
          <Button variant="outline" size="sm" onClick={triggerPrint} className="h-9 font-bold flex items-center gap-1.5 border-slate-200 hover:bg-slate-50">
            <Printer size={15}/> Imprimir Acta PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportarCSV} className="h-9 font-bold flex items-center gap-1.5 text-indigo-700 border-indigo-100 hover:bg-indigo-50/50">
            <FileSpreadsheet size={15}/> Exportar Libros CSV
          </Button>
          <Button variant="outline" size="sm" onClick={cargar} disabled={cargando} className="h-9 font-bold">
            <RefreshCw size={14} className={`mr-1.5 ${cargando ? 'animate-spin' : ''}`}/> Recargar
          </Button>
        </div>
      </div>

      {/* ── Filtros y Presets de Fechas ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4 no-print text-left">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handlePreset('hoy')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${presetActivo === 'hoy' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              Hoy
            </button>
            <button
              onClick={() => handlePreset('7d')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${presetActivo === '7d' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              Últimos 7 días
            </button>
            <button
              onClick={() => handlePreset('mes')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${presetActivo === 'mes' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              Este Mes
            </button>
            <button
              onClick={() => setPresetActivo('personalizado')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${presetActivo === 'personalizado' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              Rango Personalizado
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-400" />
              <Input
                type="date"
                value={desde}
                onChange={e => {
                  setDesde(e.target.value)
                  setPresetActivo('personalizado')
                }}
                className="h-9 text-xs w-36 rounded-xl border-slate-200"
              />
            </div>
            <span className="text-xs text-slate-400 font-bold">a</span>
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-400" />
              <Input
                type="date"
                value={hasta}
                onChange={e => {
                  setHasta(e.target.value)
                  setPresetActivo('personalizado')
                }}
                className="h-9 text-xs w-36 rounded-xl border-slate-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Cards (Always Visible at Top for Quick Scan) ──────────────────── */}
      {datos && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {/* Card 1: Ingresos Brutos */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm border border-slate-800 relative overflow-hidden flex flex-col justify-between min-h-[110px]">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ingresos Facturados</p>
              <h3 className="text-2xl font-black mt-1.5">{formatCurrency(datos.resumenFinanciero.ingresosBrutos)}</h3>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-[10px] text-slate-400 font-bold">Ingresos brutos del periodo</span>
              <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <DollarSign size={14} />
              </div>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/10 rounded-full blur-xl pointer-events-none" />
          </div>

          {/* Card 2: Costos Operativos */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[110px]">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Costo de Mercadería (Costo Histórico)</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1.5">{formatCurrency(datos.resumenFinanciero.costoTotal)}</h3>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-[10px] text-slate-400 font-bold">Inversión real en inventario vendido</span>
              <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                <Package size={14} />
              </div>
            </div>
          </div>

          {/* Card 3: Utilidad Neta Real */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100 bg-emerald-50/10 flex flex-col justify-between min-h-[110px]">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800/80">Utilidad Neta Real (Ganancia)</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1.5">{formatCurrency(datos.resumenFinanciero.utilidadNetaReal)}</h3>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-[10px] text-emerald-700/60 font-bold">Retorno neto real calculado</span>
              <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                <ArrowUpRight size={14} />
              </div>
            </div>
          </div>

          {/* Card 4: Tasa de Conversión */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[110px]">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tasa de Conversión General</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1.5">{datos.resumenFinanciero.tasaConversion.toFixed(2)}%</h3>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-[10px] text-slate-400 font-bold">Ticket prom: {formatCurrency(datos.resumenFinanciero.ticketPromedio)}</span>
              <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <TrendingUp size={14} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabs de Navegación ────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b overflow-x-auto no-print">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all uppercase tracking-wider ${tab === t.key ? 'border-indigo-600 text-indigo-700 bg-indigo-50/10' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── Loading Skeleton ─────────────────────────────────────────────────── */}
      {cargando && (
        <div className="space-y-4 no-print">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN 1: DASHBOARD GENERAL                                           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {!cargando && tab === 'dashboard' && datos && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-container">
          
          {/* Canales de Venta & Conciliación */}
          <div className="space-y-6">
            {/* Ventas por Canal */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-left space-y-4 print-card">
              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Store size={16} className="text-indigo-600"/> Rendimiento por Canal de Venta
                </h4>
                <p className="text-xs text-slate-400 font-medium">Volumen de ingresos capturados según su origen comercial.</p>
              </div>
              <div className="space-y-3.5 pt-2">
                {[
                  { name: 'POS (Venta Directa de Caja)', value: datos.ventasPorCanal.POS, color: 'bg-indigo-600' },
                  { name: 'Pedidos Regulares de Stock', value: datos.ventasPorCanal.REGULAR, color: 'bg-blue-500' },
                  { name: 'Pedidos Especiales de Confección', value: datos.ventasPorCanal.ESPECIAL, color: 'bg-purple-500' },
                  { name: 'Servicio Técnico / Soporte', value: datos.ventasPorCanal.SOPORTE || 0, color: 'bg-emerald-500' }
                ].map((canal, idx) => {
                  const maxVal = Math.max(datos.ventasPorCanal.POS, datos.ventasPorCanal.REGULAR, datos.ventasPorCanal.ESPECIAL, datos.ventasPorCanal.SOPORTE || 0, 1)
                  const percent = (canal.value / maxVal) * 100
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-600">{canal.name}</span>
                        <span className="text-slate-800">{formatCurrency(canal.value)}</span>
                      </div>
                      <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden">
                        <div className={`${canal.color} h-full rounded-full transition-all duration-700`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Conciliación Métodos de Pago */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-left space-y-4 print-card">
              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <DollarSign size={16} className="text-indigo-600"/> Conciliación del Efectivo en Caja
                </h4>
                <p className="text-xs text-slate-400 font-medium">Ingresos agrupados por método de pago para arqueo físico diario.</p>
              </div>
              {datos.conciliacionMetodosPago.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4 font-medium">No se registran movimientos en caja en el periodo actual.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {datos.conciliacionMetodosPago.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-700 uppercase">{p.metodoPago.replace('_', ' ')}</span>
                        <p className="text-[10px] text-slate-400 font-medium">{p.cantidad} transacciones registradas</p>
                      </div>
                      <span className="font-black text-slate-900">{formatCurrency(p.monto)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sucursales & Auditoría Cajeros */}
          <div className="space-y-6">
            {/* Control Sucursales */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-left space-y-4 print-card">
              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Store size={16} className="text-indigo-600"/> Distribución Multi-Sucursal
                </h4>
                <p className="text-xs text-slate-400 font-medium">Comparativo de rendimiento de puntos físicos frente a la tienda online.</p>
              </div>
              {datos.rendimientoSucursales.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4 font-medium">Sin ventas registradas en ninguna sucursal.</p>
              ) : (
                <div className="space-y-4 pt-2">
                  {datos.rendimientoSucursales.map((suc, idx) => {
                    const maxVal = Math.max(...datos.rendimientoSucursales.map(s => s.totalFacturado), 1)
                    const percent = (suc.totalFacturado / maxVal) * 100
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <div className="space-y-0.5">
                            <span className="text-slate-700">{suc.nombre}</span>
                            <span className="text-[10px] text-slate-400 block font-normal">{suc.transacciones} comprobantes</span>
                          </div>
                          <span className="text-slate-800">{formatCurrency(suc.totalFacturado)}</span>
                        </div>
                        <div className="w-full bg-slate-50 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full rounded-full transition-all duration-700" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Rendimiento Vendedores/Cajeros */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-left space-y-4 print-card">
              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Users size={16} className="text-indigo-600"/> Trazabilidad de Ventas por Cajero
                </h4>
                <p className="text-xs text-slate-400 font-medium">Auditoría del total facturado y operaciones concluidas por cada operario.</p>
              </div>
              {datos.auditoriaCajeros.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4 font-medium">Sin ventas registradas en este periodo.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {datos.auditoriaCajeros.map((caj, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-700">{caj.nombre}</span>
                        <p className="text-[10px] text-slate-400 font-medium">{caj.transacciones} operaciones de venta</p>
                      </div>
                      <span className="font-black text-slate-900">{formatCurrency(caj.totalFacturado)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN 2: CONTROL DE INVENTARIO                                       */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {!cargando && tab === 'inventario' && datos && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-container">
          
          {/* Alertas de Reabastecimiento Crítico */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-left space-y-4 print-card">
            <div>
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={16} /> Alertas de Reabastecimiento Crítico
              </h4>
              <p className="text-xs text-slate-400 font-medium">Variantes que están por debajo de su punto de pedido. Incluye días de cobertura simulados.</p>
            </div>
            {datos.alertasReabastecimiento.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8 font-medium">🎉 Todos los artículos tienen niveles óptimos de inventario.</p>
            ) : (
              <div className="overflow-x-auto max-h-[450px] custom-scrollbar pr-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b">
                      <th className="px-3 py-2 text-left font-bold uppercase tracking-wider">Artículo / SKU</th>
                      <th className="px-3 py-2 text-right font-bold uppercase tracking-wider">Disp.</th>
                      <th className="px-3 py-2 text-right font-bold uppercase tracking-wider">Mín.</th>
                      <th className="px-3 py-2 text-center font-bold uppercase tracking-wider">Cobertura</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {datos.alertasReabastecimiento.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-3 text-left">
                          <span className="font-bold text-slate-800">{item.nombre}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{item.sku}</span>
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-red-600">{item.stockActual}</td>
                        <td className="px-3 py-3 text-right text-slate-500 font-medium">{item.stockMinimo}</td>
                        <td className="px-3 py-3 text-center">
                          {item.diasCobertura === 999 ? (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full">Sin ventas</span>
                          ) : item.diasCobertura <= 5 ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-black rounded-full uppercase">Crítico ({item.diasCobertura}d)</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">{item.diasCobertura} días</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Productos Muertos o Sin Rotación */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-left space-y-4 print-card">
            <div>
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <Package className="text-slate-500" size={16} /> Inventario Estancado (Sin Ventas)
              </h4>
              <p className="text-xs text-slate-400 font-medium">Artículos con stock físico pero sin ventas registradas en el rango de tiempo seleccionado.</p>
            </div>
            {datos.productosMuertos.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8 font-medium">🎉 Excelente. Todo el stock físico ha rotado en este rango.</p>
            ) : (
              <div className="overflow-x-auto max-h-[450px] custom-scrollbar pr-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b">
                      <th className="px-3 py-2 text-left font-bold uppercase tracking-wider">Artículo / SKU</th>
                      <th className="px-3 py-2 text-right font-bold uppercase tracking-wider">Stock</th>
                      <th className="px-3 py-2 text-right font-bold uppercase tracking-wider">Precio</th>
                      <th className="px-3 py-2 text-right font-bold uppercase tracking-wider">Valorizado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {datos.productosMuertos.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-3 text-left">
                          <span className="font-bold text-slate-800">{item.nombre}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{item.sku}</span>
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-slate-700">{item.stockActual}</td>
                        <td className="px-3 py-3 text-right text-slate-600 font-medium">{formatCurrency(item.precioVenta)}</td>
                        <td className="px-3 py-3 text-right font-bold text-slate-800">
                          {formatCurrency(item.stockActual * item.precioVenta)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN 3: INTELIGENCIA DE MERCADO                                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {!cargando && tab === 'mercado' && datos && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-container">
          
          {/* Estacionalidad y Tendencias de Demanda Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-left space-y-4 print-card lg:col-span-2">
            <div>
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="text-indigo-600" size={16} /> Estacionalidad y Tendencias de Demanda Semanal
              </h4>
              <p className="text-xs text-slate-400 font-medium">Días de mayor y menor facturación cruzados con telemetría de visitas del catálogo online.</p>
            </div>
            
            {datos.estacionalidad ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-3 border rounded-xl bg-indigo-50/20 text-xs">
                  <span className="text-[10px] text-indigo-700 font-bold block uppercase mb-1">Días Pico de Venta (Física/POS)</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {datos.estacionalidad.diasMasVentas?.length > 0 ? (
                      datos.estacionalidad.diasMasVentas.map((d, i) => (
                        <span key={i} className="px-2 py-0.5 bg-indigo-600 text-white font-bold rounded-lg text-[10px] uppercase">{d}</span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">No hay suficientes ventas</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Días del periodo actual con mayor volumen acumulado facturado en caja.</p>
                </div>

                <div className="p-3 border rounded-xl bg-slate-50 text-xs">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase mb-1">Días de Menor Tráfico</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {datos.estacionalidad.diasMenosVentas?.length > 0 ? (
                      datos.estacionalidad.diasMenosVentas.map((d, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] uppercase">{d}</span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">Estable en toda la semana</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Días con menor volumen facturado. Sugeridos para cierres de caja o inventarios físicos.</p>
                </div>

                <div className="p-3 border rounded-xl bg-purple-50/20 text-xs">
                  <span className="text-[10px] text-purple-700 font-bold block uppercase mb-1">Pico de Navegación E-Commerce</span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-purple-600" />
                    <span className="font-extrabold text-purple-900 uppercase text-xs">
                      {datos.estacionalidad.visitasDiaPico || 'Sin visitas'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Día de la semana con mayor tráfico de consultas y visualización de productos en la web.</p>
                </div>
                
                {datos.estacionalidad.recomendacion && (
                  <div className="md:col-span-3 p-3 bg-amber-50/20 text-amber-900/90 rounded-xl text-xs border border-amber-100 font-medium">
                    🎯 <strong>Recomendación Logística y de Marketing:</strong> {datos.estacionalidad.recomendacion}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4 font-medium">Métricas de estacionalidad no disponibles.</p>
            )}
          </div>

          {/* Matriz de Intención */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-left space-y-4 print-card">
            <div>
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <Eye className="text-indigo-600" size={16} /> Matriz de Intención vs Compra
              </h4>
              <p className="text-xs text-slate-400 font-medium">Relación entre visitas al catálogo y ventas concretadas para detectar productos de alta atracción pero baja conversión.</p>
            </div>
            {datos.matrizIntencion.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8 font-medium">Sin datos de telemetría de navegación en el catálogo.</p>
            ) : (
              <div className="overflow-x-auto max-h-[450px] custom-scrollbar pr-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b">
                      <th className="px-3 py-2 text-left font-bold uppercase tracking-wider">Artículo</th>
                      <th className="px-3 py-2 text-right font-bold uppercase tracking-wider">Vistas</th>
                      <th className="px-3 py-2 text-right font-bold uppercase tracking-wider">Vendidos</th>
                      <th className="px-3 py-2 text-center font-bold uppercase tracking-wider">Conversión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {datos.matrizIntencion.map((item, idx) => {
                      const isAlert = item.clasificacion.includes('Alerta')
                      return (
                        <tr key={idx} className={`hover:bg-slate-50 ${isAlert ? 'bg-red-50/30' : ''}`}>
                          <td className="px-3 py-3 text-left">
                            <span className="font-bold text-slate-800 block">{item.nombre}</span>
                            {isAlert && <span className="text-[10px] text-red-600 font-bold block">⚠️ Alta atracción, baja venta</span>}
                          </td>
                          <td className="px-3 py-3 text-right text-slate-600 font-semibold">{item.visitas}</td>
                          <td className="px-3 py-3 text-right text-slate-600 font-semibold">{item.ventas}</td>
                          <td className="px-3 py-3 text-center font-black text-slate-900">
                            {item.tasaConversion}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Oportunidades Perdidas (Búsquedas sin resultado) */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-left space-y-4 print-card">
            <div>
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <HelpCircle className="text-red-500" size={16} /> Demandas No Satisfechas (Oportunidades Perdidas)
              </h4>
              <p className="text-xs text-slate-400 font-medium">Búsquedas realizadas por clientes en el catálogo que arrojaron cero coincidencias. Útil para orientar compras.</p>
            </div>
            {datos.oportunidadesPerdidas.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8 font-medium">🎉 No hay búsquedas fallidas registradas.</p>
            ) : (
              <div className="overflow-x-auto max-h-[450px] custom-scrollbar pr-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b">
                      <th className="px-3 py-2 text-left font-bold uppercase tracking-wider">Término de Búsqueda</th>
                      <th className="px-3 py-2 text-right font-bold uppercase tracking-wider">Frecuencia</th>
                      <th className="px-3 py-2 text-right font-bold uppercase tracking-wider">Última Consulta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {datos.oportunidadesPerdidas.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-3 text-left font-black text-slate-700">"{item.terminoBuscado}"</td>
                        <td className="px-3 py-3 text-right">
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-black rounded-full">
                            {item.conteo} veces
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right text-slate-400">{formatDate(item.ultimaVez)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN 4: ESTADO DE RESULTADOS & SALDOS                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {!cargando && tab === 'saldos' && datos && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print-container">
          
          {/* P&L Simulado */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm text-left space-y-4 print-card lg:col-span-1 h-fit">
            <div>
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <DollarSign className="text-emerald-600" size={16} /> Estado de Resultados (Simulado)
              </h4>
              <p className="text-xs text-slate-400 font-medium">Margen y rentabilidad real restando costos de compra históricos.</p>
            </div>
            
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex justify-between py-2 border-b">
                <span className="text-slate-600 font-medium">(+) Ingresos Facturados</span>
                <span className="font-bold text-slate-900">{formatCurrency(datos.resumenFinanciero.ingresosBrutos)}</span>
              </div>
              <div className="flex justify-between py-2 border-b text-red-600">
                <span className="font-medium">(-) Costo de Mercadería (Costo)</span>
                <span className="font-bold">-{formatCurrency(datos.resumenFinanciero.costoTotal)}</span>
              </div>
              <div className="flex justify-between py-3 border-b text-sm">
                <span className="text-slate-800 font-black">(=) Utilidad Neta Real</span>
                <span className="font-black text-emerald-600">{formatCurrency(datos.resumenFinanciero.utilidadNetaReal)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-600 font-medium">Margen de Rentabilidad Promedio</span>
                <span className="font-bold text-slate-800">
                  {datos.resumenFinanciero.ingresosBrutos > 0 
                    ? ((datos.resumenFinanciero.utilidadNetaReal / datos.resumenFinanciero.ingresosBrutos) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Cuentas por Cobrar (Saldos Ledger) */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-left space-y-4 print-card lg:col-span-2">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ClipboardList className="text-indigo-600" size={16} /> Cuentas por Cobrar (Clientes)
                </h4>
                <p className="text-xs text-slate-400 font-medium">Saldos remanentes de pedidos en preparación o enviados sin liquidar.</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-black uppercase">Saldo Total Calle</span>
                <p className="text-base font-black text-red-600">{formatCurrency(datos.cuentasPorCobrar.totalSaldosPendientes)}</p>
              </div>
            </div>

            {datos.cuentasPorCobrar.pedidos.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8 font-medium">🎉 No hay pedidos pendientes de cobro.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b">
                      <th className="px-3 py-2 text-left font-bold uppercase tracking-wider">Pedido</th>
                      <th className="px-3 py-2 text-left font-bold uppercase tracking-wider">Cliente</th>
                      <th className="px-3 py-2 text-center font-bold uppercase tracking-wider">Estado</th>
                      <th className="px-3 py-2 text-right font-bold uppercase tracking-wider">Abonado</th>
                      <th className="px-3 py-2 text-right font-bold uppercase tracking-wider">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {datos.cuentasPorCobrar.pedidos.map((ped) => (
                      <tr key={ped.id} className="hover:bg-slate-50">
                        <td className="px-3 py-3 text-left font-mono font-bold text-slate-700">{ped.consecutivo}</td>
                        <td className="px-3 py-3 text-left">
                          <span className="font-bold text-slate-800 block">{ped.clienteNombre}</span>
                          <span className="text-[10px] text-slate-400 block">{ped.clienteTelefono}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded text-[10px]">
                            {ped.estado}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right text-slate-500 font-semibold">{formatCurrency(ped.abono)}</td>
                        <td className="px-3 py-3 text-right font-black text-red-600">{formatCurrency(ped.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* DuPont Analysis Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm text-left space-y-4 print-card lg:col-span-1 h-fit">
            <div>
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="text-indigo-600" size={16} /> Rendimiento sobre Inventario (DuPont)
              </h4>
              <p className="text-xs text-slate-400 font-medium">Fórmula corporativa para medir el retorno del capital invertido en stock.</p>
            </div>
            
            {datos.dupont ? (
              <div className="space-y-4 pt-2 text-xs">
                <div className="grid grid-cols-3 gap-2 border rounded-xl p-3 bg-slate-50/50">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Margen (MUN)</span>
                    <span className="font-black text-slate-800 text-sm">{Number(datos.dupont.margenUtilidadNeta || 0).toFixed(1)}%</span>
                  </div>
                  <div className="text-center border-x">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Rotación (Activos)</span>
                    <span className="font-black text-slate-800 text-sm">{Number(datos.dupont.rotacionActivos || 0).toFixed(2)}x</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-indigo-600 font-bold block uppercase">Retorno (ROI)</span>
                    <span className="font-black text-indigo-600 text-sm">{Number(datos.dupont.roiDuPont || 0).toFixed(1)}%</span>
                  </div>
                </div>
                
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-slate-600 font-medium">Ventas Anualizadas</span>
                    <span className="font-bold text-slate-800">{formatCurrency(datos.dupont.ingresosTotales)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-slate-600 font-medium">Inventario Promedio en Bodega</span>
                    <span className="font-bold text-slate-800">{formatCurrency(datos.dupont.valorInventarioPromedio)}</span>
                  </div>
                  <div className="p-2.5 bg-indigo-50/30 text-indigo-800/90 rounded-lg text-[10px] font-medium leading-normal">
                    💡 <strong>Análisis DuPont:</strong> Por cada colón invertido en inventario promedio, este genera un retorno del <strong>{Number(datos.dupont.roiDuPont || 0).toFixed(1)}%</strong> anualizado.
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4 font-medium">Métricas DuPont no disponibles para este periodo.</p>
            )}
          </div>

          {/* Auditoría de Caja Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-left space-y-4 print-card lg:col-span-2">
            <div>
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <ClipboardList className="text-amber-500" size={16} /> Auditoría de Arqueos de Caja (Inconsistencias)
              </h4>
              <p className="text-xs text-slate-400 font-medium">Discrepancias registradas entre el monto esperado y el conteo físico en cajas.</p>
            </div>
            
            {!datos.auditoriaCajas || datos.auditoriaCajas.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6 font-medium">✅ Todos los arqueos del periodo conciliaron al 100% (cero discrepancias).</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b">
                      <th className="px-3 py-2 text-left font-bold uppercase tracking-wider">Cajero</th>
                      <th className="px-3 py-2 text-left font-bold uppercase tracking-wider">Sucursal</th>
                      <th className="px-3 py-2 text-center font-bold uppercase tracking-wider">Fecha Arqueo</th>
                      <th className="px-3 py-2 text-center font-bold uppercase tracking-wider">Tipo</th>
                      <th className="px-3 py-2 text-right font-bold uppercase tracking-wider">Diferencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {datos.auditoriaCajas.map((arq, idx) => {
                      const isFaltante = arq.bandera === 'Faltante';
                      const isSobrante = arq.bandera === 'Sobrante';
                      return (
                        <tr key={idx} className={`hover:bg-slate-50 ${isFaltante ? 'bg-red-50/20' : isSobrante ? 'bg-amber-50/20' : ''}`}>
                          <td className="px-3 py-3 text-left font-bold text-slate-800">{arq.cajero}</td>
                          <td className="px-3 py-3 text-left text-slate-500 font-medium">{arq.sucursal || 'Central Nicoya'}</td>
                          <td className="px-3 py-3 text-center text-slate-400">{formatDate(arq.fechaCierre)}</td>
                          <td className="px-3 py-3 text-center">
                            <span className={`px-2 py-0.5 font-bold rounded text-[10px] uppercase ${isFaltante ? 'bg-red-100 text-red-800' : isSobrante ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                              {arq.bandera}
                            </span>
                          </td>
                          <td className={`px-3 py-3 text-right font-black ${isFaltante ? 'text-red-600' : isSobrante ? 'text-amber-600' : 'text-green-600'}`}>
                            {isFaltante ? '-' : ''}{formatCurrency(Math.abs(arq.diferencia))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Asistente Estratégico IA Chat Box */}
          <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 p-6 shadow-xl text-left space-y-4 print-card lg:col-span-3 mt-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black animate-pulse">
                  🤖
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                    Consultor Financiero & Estratégico IA
                  </h4>
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">Conectado a Datos del Periodo (Nicoya)</span>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 text-[10px] font-black rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> ONLINE
              </span>
            </div>

            {/* Messages Container */}
            <div className="h-80 overflow-y-auto space-y-4 pr-1 scroll-smooth max-h-[350px] relative z-10">
              {mensajes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                  <RefreshCw className="animate-spin text-slate-500" size={20} />
                  <span className="text-xs">Inicializando consultor estratégico...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {mensajes.map((msg, idx) => {
                    const isUser = msg.rol === 'user';
                    return (
                      <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${isUser ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>
                          {isUser ? (
                            <p className="text-left whitespace-pre-wrap">{msg.content}</p>
                          ) : (
                            <div className="space-y-1.5">
                              {formatMarkdown(msg.content)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {iaCargando && (
                    <div className="flex justify-start">
                      <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                        <RefreshCw className="animate-spin" size={12} />
                        <span>Analizando métricas y procesando recomendación...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Send Message Input */}
            <form onSubmit={enviarMensaje} className="flex gap-2 pt-2 relative z-10">
              <Input
                type="text"
                placeholder="Haz una consulta (ej: '¿Cómo mejoro la rotación del inventario?' o 'Dame el análisis DuPont')"
                value={mensajeInput}
                onChange={e => setMensajeInput(e.target.value)}
                disabled={iaCargando}
                className="bg-slate-800 border-slate-700 text-white rounded-xl placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 h-10 text-xs flex-1"
              />
              <Button
                type="submit"
                disabled={iaCargando || !mensajeInput.trim()}
                className="bg-indigo-600 text-white hover:bg-indigo-500 font-bold text-xs h-10 rounded-xl px-4 flex items-center gap-1.5"
              >
                Preguntar
              </Button>
            </form>
          </div>

        </div>
      )}

    </div>
  )
}
