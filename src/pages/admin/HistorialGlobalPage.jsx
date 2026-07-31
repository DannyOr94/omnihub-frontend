import { useState, useEffect } from 'react'
import { 
  Search, Filter, Calendar, FileDown, Printer,
  ShoppingCart, DollarSign, Wrench, BookMarked, Package, Globe, Eye,
  Users, Activity, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { reportesApi } from '../../api/index'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { formatCurrency } from '../../utils'

export default function HistorialGlobalPage() {
  const [filtroModulo, setFiltroModulo] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null)
  
  const [movimientos, setMovimientos] = useState([])
  const [paginacion, setPaginacion] = useState({ total: 0, paginas: 1, paginaActual: 1, limite: 50 })
  const [cargando, setCargando] = useState(true)
  const [pagina, setPagina] = useState(1)

  const modulos = ['Todos', 'Caja', 'Ventas', 'Soporte', 'Inventario', 'Apartados', 'Clientes']

  // Paleta de Colores por Módulos calibrada según ERP
  const getBadgeStyle = (modulo) => {
    switch (modulo) {
      case 'Ventas':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'Inventario':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'Soporte':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Caja':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'Apartados':
        return 'bg-pink-100 text-pink-800 border-pink-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const verDetalle = (registro) => {
    setRegistroSeleccionado(registro)
    setModalAbierto(true)
  }

  useEffect(() => {
    let active = true
    const cargar = async () => {
      setCargando(true)
      try {
        const res = await reportesApi.historialGlobal({
          modulo: filtroModulo,
          busqueda,
          pagina,
          limite: 50
        })
        if (active && res.data.ok) {
          setMovimientos(res.data.data.movimientos || [])
          setPaginacion(res.data.data.paginacion || { total: 0, paginas: 1, paginaActual: 1, limite: 50 })
        }
      } catch (err) {
        console.error(err)
        toast.error('Error al cargar el historial global')
      } finally {
        if (active) setCargando(false)
      }
    }

    const timer = setTimeout(() => {
      cargar()
    }, 300)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [filtroModulo, busqueda, pagina])

  // Resetear página al cambiar filtros
  useEffect(() => {
    setPagina(1)
  }, [filtroModulo, busqueda])

  const datosFiltrados = movimientos

  // Cálculos dinámicos para los summary cards consolidados
  const totalMovimientos = paginacion.total
  
  const ventasRegistradas = movimientos
    .filter(r => r.modulo === 'Ventas' && r.impacto.includes('+'))
    .reduce((acc, curr) => {
      const num = parseInt(curr.impacto.replace(/[^0-9]/g, ''), 10)
      return acc + (isNaN(num) ? 0 : num)
    }, 0)

  const flujoSoporte = movimientos.filter(r => r.modulo === 'Soporte').length

  const balanceInventario = movimientos
    .filter(r => r.modulo === 'Inventario')
    .reduce((acc, curr) => {
      const isNegative = curr.impacto.includes('-')
      const num = parseInt(curr.impacto.replace(/[^0-9]/g, ''), 10)
      const val = isNaN(num) ? 0 : num
      return acc + (isNegative ? -val : val)
    }, 0)

  // Exportar Excel formateado profesionalmente como plantilla ERP/Corporativo
  const exportarExcel = () => {
    toast.success('Exportando historial...', { description: 'Generando archivo Excel corporativo con estilos ERP.' })

    const tableRows = datosFiltrados.map(row => `
      <tr>
        <td style="padding: 12px 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #0f172a; font-family: Segoe UI, sans-serif;">#${row.id}</td>
        <td style="padding: 12px 10px; border: 1px solid #e2e8f0; color: #334155; font-family: Segoe UI, sans-serif;">
          <strong>${row.fecha}</strong><br/><span style="font-size: 10px; color: #94a3b8;">${row.hora}</span>
        </td>
        <td style="padding: 12px 10px; border: 1px solid #e2e8f0; font-family: Segoe UI, sans-serif;">
          <span style="padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; ${
            row.modulo === 'Ventas' ? 'background-color: #d1fae5; color: #065f46;' :
            row.modulo === 'Inventario' ? 'background-color: #fef3c7; color: #92400e;' :
            row.modulo === 'Soporte' ? 'background-color: #dbeafe; color: #1e40af;' :
            row.modulo === 'Caja' ? 'background-color: #e0e7ff; color: #3730a3;' :
            'background-color: #fce7f3; color: #9d174d;'
          }">${row.modulo}</span>
        </td>
        <td style="padding: 12px 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #334155; font-family: Segoe UI, sans-serif;">${row.accion}</td>
        <td style="padding: 12px 10px; border: 1px solid #e2e8f0; color: #475569; font-weight: 500; font-family: Segoe UI, sans-serif;">${row.responsable}</td>
        <td style="padding: 12px 10px; border: 1px solid #e2e8f0; font-weight: 900; text-align: right; font-family: Segoe UI, sans-serif; ${
          row.impacto.includes('+') ? 'color: #10b981;' :
          row.impacto.includes('-') ? 'color: #f43f5e;' : 'color: #64748b;'
        }">${row.impacto || '---'}</td>
        <td style="padding: 12px 10px; border: 1px solid #e2e8f0; color: #334155; font-size: 11px; font-family: Segoe UI, sans-serif; max-width: 300px;">
          <strong style="color: #0f172a;">${row.detalle}</strong>
          ${row.nota ? `<br/><span style="color: #94a3b8; font-style: italic;">Nota: ${row.nota}</span>` : ''}
        </td>
      </tr>
    `).join('')

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; }
        </style>
      </head>
      <body>
        <!-- Header Banner matching the PDF mockup style -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td colspan="7" style="background-color: #0b1329; color: #ffffff; padding: 25px; font-family: sans-serif; height: 80px;">
              <span style="font-size: 24px; font-weight: bold; color: #ffffff;">OmniHub <span style="color: #38bdf8;">T&K</span></span><br/>
              <span style="font-size: 11px; color: #94a3b8;">Módulo de Auditoría • Sistema de Gestión Comercial Integrado</span>
            </td>
          </tr>
          <tr>
            <td colspan="4" style="padding: 15px 0 5px 0; font-size: 11px; color: #475569; font-family: sans-serif;">
              <strong>Reporte:</strong> Historial Global de Movimientos y Auditoría
            </td>
            <td colspan="3" style="padding: 15px 0 5px 0; font-size: 11px; color: #475569; text-align: right; font-family: sans-serif;">
              <strong>Fecha Emisión:</strong> ${new Date().toLocaleDateString('es-CR')} ${new Date().toLocaleTimeString('es-CR')}<br/>
              <strong>Generado por:</strong> Administrador del Sistema
            </td>
          </tr>
        </table>

        <!-- KPIs styled as blocks in Excel -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 15px; background-color: #ffffff; width: 25%; font-family: sans-serif;">
              <span style="font-size: 9px; color: #94a3b8; font-weight: bold;">TOTAL MOVIMIENTOS</span><br/>
              <span style="font-size: 16px; font-weight: bold; color: #0f172a;">${totalMovimientos} Registros</span>
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 15px; background-color: #ffffff; width: 25%; font-family: sans-serif;">
              <span style="font-size: 9px; color: #94a3b8; font-weight: bold;">VENTAS REGISTRADAS</span><br/>
              <span style="font-size: 16px; font-weight: bold; color: #10b981;">+₡${ventasRegistradas.toLocaleString('es-CR')}</span>
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 15px; background-color: #ffffff; width: 25%; font-family: sans-serif;">
              <span style="font-size: 9px; color: #94a3b8; font-weight: bold;">FLUJO DE SOPORTE</span><br/>
              <span style="font-size: 16px; font-weight: bold; color: #2563eb;">${flujoSoporte} Órdenes</span>
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 15px; background-color: #ffffff; width: 25%; font-family: sans-serif;">
              <span style="font-size: 9px; color: #94a3b8; font-weight: bold;">AJUSTES INVENTARIO</span><br/>
              <span style="font-size: 16px; font-weight: bold; color: #ea580c;">${balanceInventario} Unidades</span>
            </td>
          </tr>
        </table>

        <!-- Main Data Table -->
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f8fafc;">
              <th style="padding: 12px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: left; font-size: 11px; font-family: sans-serif;">ID</th>
              <th style="padding: 12px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: left; font-size: 11px; font-family: sans-serif;">FECHA / HORA</th>
              <th style="padding: 12px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: left; font-size: 11px; font-family: sans-serif;">MÓDULO</th>
              <th style="padding: 12px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: left; font-size: 11px; font-family: sans-serif;">ACCIÓN REALIZADA</th>
              <th style="padding: 12px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: left; font-size: 11px; font-family: sans-serif;">USUARIO</th>
              <th style="padding: 12px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: right; font-size: 11px; font-family: sans-serif;">IMPACTO</th>
              <th style="padding: 12px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #475569; text-align: left; font-size: 11px; font-family: sans-serif;">DETALLE / NOTAS DE SISTEMA</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `

    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `reporte_auditoria_${new Date().getTime()}.xls`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Generar y descargar el reporte en formato PDF/Impresión Premium
  const exportarPDF = () => {
    const printWindow = window.open('', '_blank')
    const htmlContent = `
      <html>
        <head>
          <title>Reporte de Historial Global y Auditoría - OmniHub T&K</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; padding: 40px; background-color: white; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body class="bg-white">
          <div class="max-w-5xl mx-auto space-y-6">
            
            <!-- Encabezado Corporativo PDF -->
            <div class="bg-[#0b1329] text-white p-8 rounded-3xl flex justify-between items-center">
              <div>
                <h1 class="text-3xl font-black tracking-tight text-white">OmniHub <span class="text-blue-400">T&K</span></h1>
                <p class="text-xs text-slate-400 mt-1.5 font-medium tracking-wide uppercase">Módulo de Auditoría • Sistema de Gestión Comercial Integrado</p>
              </div>
              <div class="text-right text-xs text-slate-300 space-y-1 font-medium">
                <p><span class="text-slate-500 font-bold">Reporte:</span> Historial Global de Movimientos</p>
                <p><span class="text-slate-500 font-bold">Fecha de Emisión:</span> ${new Date().toLocaleDateString('es-CR')} ${new Date().toLocaleTimeString('es-CR')}</p>
                <p><span class="text-slate-500 font-bold">Generado por:</span> Administrador del Sistema</p>
              </div>
            </div>

            <!-- KPIs Consolidados -->
            <div class="grid grid-cols-4 gap-4 mt-6">
              <div class="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL MOVIMIENTOS</p>
                <p class="text-xl font-black text-slate-800 mt-1">${totalMovimientos} Registros</p>
              </div>
              <div class="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">VENTAS REGISTRADAS</p>
                <p class="text-xl font-black text-emerald-600 mt-1">+₡${ventasRegistradas.toLocaleString('es-CR')}</p>
              </div>
              <div class="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">FLUJO DE SOPORTE</p>
                <p class="text-xl font-black text-blue-600 mt-1">${flujoSoporte} Órdenes</p>
              </div>
              <div class="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AJUSTES INVENTARIO</p>
                <p class="text-xl font-black text-amber-600 mt-1">${balanceInventario} Unidades</p>
              </div>
            </div>

            <!-- Tabla de Datos -->
            <table class="w-full text-left text-xs text-slate-600 border-collapse mt-8">
              <thead>
                <tr class="border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px] tracking-wider bg-slate-50">
                  <th class="py-4 px-3">ID</th>
                  <th class="py-4 px-3">FECHA / HORA</th>
                  <th class="py-4 px-3">MÓDULO</th>
                  <th class="py-4 px-3">ACCIÓN REALIZADA</th>
                  <th class="py-4 px-3">USUARIO</th>
                  <th class="py-4 px-3 text-right">IMPACTO</th>
                  <th class="py-4 px-3">DETALLE / NOTAS DE SISTEMA</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${datosFiltrados.map(row => `
                  <tr>
                    <td class="py-4 px-3 font-bold text-slate-900">#${row.id}</td>
                    <td class="py-4 px-3 text-slate-800">
                      <div class="font-bold">${row.fecha}</div>
                      <div class="text-[10px] text-slate-400 mt-0.5">${row.hora}</div>
                    </td>
                    <td class="py-4 px-3">
                      <span class="px-2.5 py-1 rounded text-[10px] font-bold ${
                        row.modulo === 'Ventas' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        row.modulo === 'Inventario' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        row.modulo === 'Soporte' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 
                        row.modulo === 'Caja' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                        'bg-pink-100 text-pink-800 border border-pink-200'
                      }">
                        ${row.modulo}
                      </span>
                    </td>
                    <td class="py-4 px-3 font-bold text-slate-700">${row.accion}</td>
                    <td class="py-4 px-3 text-slate-600 font-medium">${row.responsable}</td>
                    <td class="py-4 px-3 text-right font-black ${
                      row.impacto.includes('+') ? 'text-emerald-600' : 
                      row.impacto.includes('-') ? 'text-rose-600' : 'text-slate-400'
                    }">${row.impacto || '---'}</td>
                    <td class="py-4 px-3 max-w-xs">
                      <div class="text-slate-800 font-medium">${row.detalle}</div>
                      ${row.nota ? `<div class="text-[10px] text-slate-400 italic mt-0.5">Nota: ${row.nota}</div>` : ''}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10 animate-in fade-in duration-300">
      
      {/* ── Encabezado ───────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Historial Global de Movimientos</h1>
          <p className="text-sm text-slate-500 mt-1">Auditoría centralizada de todas las operaciones del sistema</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="shadow-sm border-slate-200 text-slate-600 bg-white"
            onClick={exportarPDF}
          >
            <Printer size={16} className="mr-2 text-slate-500" /> Exportar a PDF
          </Button>
          <Button 
            variant="outline" 
            className="shadow-sm border-slate-200 text-slate-600 bg-white"
            onClick={exportarExcel}
          >
            <FileDown size={16} className="mr-2 text-slate-500" /> Exportar a Excel
          </Button>
        </div>
      </div>

      {/* ── 2. Bloque Superior de Métricas Consolidadas ───────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm transition-all hover:shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Movimientos</p>
          <p className="text-2xl font-black text-slate-800 mt-2">{totalMovimientos} Registros</p>
          <p className="text-xs text-slate-500 mt-1">Logs en el periodo</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm transition-all hover:shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ventas Registradas</p>
          <p className="text-2xl font-black text-emerald-600 mt-2">+{formatCurrency(ventasRegistradas)}</p>
          <p className="text-xs text-slate-500 mt-1">Ingresos netos estimados</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm transition-all hover:shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Flujo de Soporte</p>
          <p className="text-2xl font-black text-blue-600 mt-2">{flujoSoporte} {flujoSoporte === 1 ? 'Orden' : 'Órdenes'}</p>
          <p className="text-xs text-slate-500 mt-1">Equipos en taller</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm transition-all hover:shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ajustes de Inventario</p>
          <p className={`text-2xl font-black mt-2 ${balanceInventario < 0 ? 'text-rose-600' : balanceInventario > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
            {balanceInventario > 0 ? `+${balanceInventario}` : balanceInventario} Unidades
          </p>
          <p className="text-xs text-slate-500 mt-1">Balance físico del almacén</p>
        </div>
      </div>

      {/* ── Barra de Filtros Inteligentes ─────────────────────── */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          
          <div className="flex w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 hide-scrollbar gap-2 scroll-smooth">
            {modulos.map(m => (
              <button
                key={m}
                onClick={() => setFiltroModulo(m)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  filtroModulo === m 
                    ? 'bg-slate-800 text-white shadow-sm' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          
          <div className="w-full lg:w-96 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Buscar por cliente, boleta, acción..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10 rounded-2xl h-11 bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800 rounded-xl">
            <Calendar size={16} className="mr-2 text-slate-400" /> Fecha: <span className="font-bold ml-1">Hoy</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800 rounded-xl">
            <Filter size={16} className="mr-2 text-slate-400" /> Usuario: <span className="font-bold ml-1">Todos</span>
          </Button>
        </div>
      </div>

      {/* ── Tabla Principal ──────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Fecha y Hora</th>
                <th className="px-6 py-4">Módulo</th>
                <th className="px-6 py-4">Acción Realizada</th>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4 text-right">Impacto</th>
                <th className="px-6 py-4">Detalle / Notas de Sistema</th>
                <th className="px-6 py-4 text-center">Auditoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando && movimientos.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                    <RefreshCw className="mx-auto animate-spin text-blue-500 mb-3" size={32} />
                    <p className="text-base font-semibold">Cargando movimientos del sistema...</p>
                  </td>
                </tr>
              ) : (
                datosFiltrados.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      #{row.id}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-800 font-medium">{row.fecha}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{row.hora}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold border ${getBadgeStyle(row.modulo)}`}>
                        {row.modulo}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {row.accion}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-semibold">
                      {row.responsable}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-extrabold ${
                        row.impacto.includes('+') ? 'text-emerald-600' : 
                        row.impacto.includes('-') ? 'text-rose-600' : 'text-slate-400'
                      }`}>
                        {row.impacto || '---'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm max-w-xs whitespace-normal">
                      <div className="text-slate-800 font-medium" title={row.detalle}>{row.detalle}</div>
                      {row.nota && (
                        <div className="text-xs text-slate-400 italic mt-0.5">
                          Nota: {row.nota}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => verDetalle(row)} 
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 shadow-sm border border-transparent hover:border-blue-100 mx-auto block"
                        title="Ver detalle completo"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
              {!cargando && datosFiltrados.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                    <Search className="mx-auto text-slate-300 mb-3" size={32} />
                    <p className="text-base font-semibold">No se encontraron movimientos</p>
                    <p className="text-sm mt-1">Ajusta los filtros o intenta con otra búsqueda.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Paginación Server-Side (Interactivo) */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 bg-slate-50/50">
          <span className="font-medium">
            Mostrando <strong className="text-slate-800">{movimientos.length}</strong> de{' '}
            <strong className="text-slate-800">{paginacion.total}</strong> registros
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-white rounded-lg shadow-sm"
              disabled={pagina <= 1 || cargando}
              onClick={() => setPagina(p => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white rounded-lg shadow-sm"
              disabled={pagina >= paginacion.paginas || cargando}
              onClick={() => setPagina(p => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>

      {/* ── Modal de Detalle "Pro" ────────────────────── */}
      {modalAbierto && registroSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Detalle del Movimiento <span className="text-slate-400">#{registroSeleccionado.id}</span></h3>
              <button onClick={() => setModalAbierto(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors">
                ✕
              </button>
            </div>
            
            <div className="px-8 py-6 space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Módulo Origen</p>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold border ${getBadgeStyle(registroSeleccionado.modulo)}`}>
                    {registroSeleccionado.modulo}
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Fecha y Hora</p>
                  <p className="font-extrabold text-slate-800">{registroSeleccionado.fecha}</p>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">{registroSeleccionado.hora}</p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 border border-blue-100">
                    <Users size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Responsable</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{registroSeleccionado.responsable}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-100">
                    <Activity size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acción Ejecutada</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{registroSeleccionado.accion}</p>
                    <p className="font-medium text-slate-600 text-sm mt-1">{registroSeleccionado.detalle}</p>
                  </div>
                </div>
              </div>

              {registroSeleccionado.impacto && (
                <div className="mt-4 pt-5 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Impacto / Cambio</p>
                  <p className={`text-lg font-black ${
                    registroSeleccionado.impacto.includes('-') ? 'text-rose-600' : 
                    registroSeleccionado.impacto.includes('+') ? 'text-emerald-600' : 'text-slate-500'
                  }`}>
                    {registroSeleccionado.impacto}
                  </p>
                </div>
              )}

              {registroSeleccionado.nota && (
                <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-2xl mt-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                  <p className="text-[10px] font-bold text-amber-600/80 uppercase tracking-wider mb-1.5">Nota del Usuario</p>
                  <p className="text-sm font-semibold text-amber-900/90 italic">"{registroSeleccionado.nota}"</p>
                </div>
              )}
            </div>

            <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button onClick={() => setModalAbierto(false)} className="rounded-xl px-8 shadow-sm">
                Entendido
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
