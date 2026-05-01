import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { toast } from 'sonner'
import { ventasApi, productosApi, clientesApi, promocionesApi } from '../../../../api/index'
import { cajaApi } from '../../../../api/caja'

const TASAS_IVA = { EXENTO: 0, IVA_1: 1, IVA_4: 4, IVA_13: 13 }

function calcularIvaLinea(subtotal, tasaIva) {
  const tasa = TASAS_IVA[tasaIva] ?? 13
  if (tasa === 0) return 0
  return Math.round((subtotal * tasa / (100 + tasa)) * 100) / 100
}

function agruparIva(carrito) {
  const grupos = {}
  for (const linea of carrito) {
    const tasa = linea.tasaIva ?? 'IVA_13'
    const subtotal = (linea.precioUnitario * linea.cantidad) - linea.descuentoLinea
    const monto = calcularIvaLinea(subtotal, tasa)
    if (!grupos[tasa]) grupos[tasa] = { tasa, porcentaje: TASAS_IVA[tasa] ?? 13, monto: 0 }
    grupos[tasa].monto += monto
  }
  return Object.values(grupos).filter(g => g.monto > 0)
}

function useBusqueda() {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const timer = useRef(null)

  const buscar = useCallback((q) => {
    setQuery(q)
    clearTimeout(timer.current)
    if (!q.trim()) { setResultados([]); return }
    setBuscando(true)
    timer.current = setTimeout(async () => {
      try {
        const res = await productosApi.listar({ busqueda: q, soloActivos: true })
        setResultados(res.data.data ?? [])
      } catch { setResultados([]) }
      finally { setBuscando(false) }
    }, 300)
  }, [])

  const limpiar = useCallback(() => {
    setQuery('')
    setResultados([])
    clearTimeout(timer.current)
  }, [])

  return { query, resultados, buscando, buscar, limpiar }
}

export function usePOS() {
  // ─── Pestaña activa
  const [tabActivo, setTabActivo] = useState('pos')

  // ─── Referencias
  const searchRef = useRef(null)

  // ─── Búsqueda
  const busqueda = useBusqueda()

  // ─── Estado del carrito
  const [carrito, setCarrito] = useState([])
  const [descuento, setDescuento] = useState(0)
  const [clienteId, setClienteId] = useState(null)
  const [clienteNombre, setClienteNombre] = useState('')
  const [observaciones, setObservaciones] = useState('')

  // ─── Ventas en espera (parking)
  const [enEspera, setEnEspera] = useState([])
  const [modalEspera, setModalEspera] = useState(false)

  // ─── Modales
  const [modalVariantes, setModalVariantes] = useState(null)
  const [modalPago, setModalPago] = useState(false)
  const [modalCliente, setModalCliente] = useState(false)
  const [modalComprobante, setModalComprobante] = useState(null)
  const [modalProforma, setModalProforma] = useState(null)
  const [mostrarCrearCliente, setMostrarCrearCliente] = useState(false)

  // ─── Pagos
  const [pagos, setPagos] = useState([{ metodoPago: 'EFECTIVO', monto: '', referenciaPago: '' }])

  // ─── Promociones
  const [promos, setPromos] = useState([])
  const [promoActiva, setPromoActiva] = useState(null)

  // ─── Búsqueda de cliente
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [resultadosCliente, setResultadosCliente] = useState([])

  // ─── Caja
  const [cajaAbierta, setCajaAbierta] = useState(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    cajaApi.estado()
      .then(res => setCajaAbierta(res.data.data?.abierta ?? false))
      .catch(() => setCajaAbierta(false))
    searchRef.current?.focus()
  }, [])

  // ─── Cálculos
  const subtotalLineas = carrito.reduce((s, l) => s + (l.precioUnitario * l.cantidad) - l.descuentoLinea, 0)
  const descuentoPromo = promoActiva ? Number(promoActiva.montoDescuento) : 0
  const totalDescuento = Number(descuento) + descuentoPromo
  const total = Math.max(subtotalLineas - totalDescuento, 0)
  const totalPagado = pagos.reduce((s, p) => s + (Number(p.monto) || 0), 0)
  const cambio = Math.max(totalPagado - total, 0)
  const faltaPagar = Math.max(total - totalPagado, 0)
  const gruposIva = agruparIva(carrito)
  // eslint-disable-next-line no-unused-vars
  const totalIva = gruposIva.reduce((s, g) => s + g.monto, 0)

  // ─── Acciones del carrito
  function agregarProducto(producto) {
    if (producto.usaVariantes) {
      setModalVariantes(producto)
      busqueda.limpiar()
      return
    }
    const stockLibre = producto.stockActual - producto.stockReservado
    if (producto.manejaStock && stockLibre <= 0) {
      toast.error(`Sin stock disponible para "${producto.nombre}"`)
      return
    }
    const key = `p-${producto.id}`
    setCarrito(prev => {
      const existe = prev.find(l => l._key === key)
      if (existe) {
        if (producto.manejaStock && existe.cantidad >= stockLibre) {
          toast.warning('Stock máximo alcanzado')
          return prev
        }
        return prev.map(l => l._key === key ? { ...l, cantidad: l.cantidad + 1 } : l)
      }
      return [...prev, {
        _key: key,
        productoId: producto.id,
        varianteId: null,
        nombre: producto.nombre,
        precioUnitario: Number(producto.precioVenta),
        cantidad: 1,
        descuentoLinea: 0,
        manejaStock: producto.manejaStock,
        stockActual: producto.stockActual,
        stockReservado: producto.stockReservado,
        categoriaId: producto.categoria?.id ?? null,
        tasaIva: producto.tasaIva ?? 'IVA_13',
        variante: null,
      }]
    })
    busqueda.limpiar()
    searchRef.current?.focus()
  }

  function agregarVariante(producto, variante) {
    const stockLibre = variante.stockActual - variante.stockReservado
    if (stockLibre <= 0) { toast.error('Sin stock para esta variante'); return }
    const key = `v-${variante.id}`
    setCarrito(prev => {
      const existe = prev.find(l => l._key === key)
      if (existe) {
        if (existe.cantidad >= stockLibre) { toast.warning('Stock máximo alcanzado'); return prev }
        return prev.map(l => l._key === key ? { ...l, cantidad: l.cantidad + 1 } : l)
      }
      return [...prev, {
        _key: key,
        productoId: null,
        varianteId: variante.id,
        nombre: `${producto.nombre} — ${variante.talla ?? ''} ${variante.color ?? ''}`.trim(),
        precioUnitario: Number(variante.precioVenta),
        cantidad: 1,
        descuentoLinea: 0,
        manejaStock: true,
        stockActual: variante.stockActual,
        stockReservado: variante.stockReservado,
        categoriaId: producto.categoria?.id ?? null,
        tasaIva: producto.tasaIva ?? 'IVA_13',
        variante: { talla: variante.talla, color: variante.color },
      }]
    })
    setModalVariantes(null)
    busqueda.limpiar()
    searchRef.current?.focus()
  }

  function cambiarCantidad(key, nuevaCantidad) {
    if (nuevaCantidad <= 0) { setCarrito(prev => prev.filter(l => l._key !== key)); return }
    setCarrito(prev => prev.map(l => l._key === key ? { ...l, cantidad: nuevaCantidad } : l))
  }

  function limpiarCarrito() {
    setCarrito([])
    setDescuento(0)
    setClienteId(null)
    setClienteNombre('')
    setObservaciones('')
    setPagos([{ metodoPago: 'EFECTIVO', monto: '', referenciaPago: '' }])
    setPromoActiva(null)
    setPromos([])
    searchRef.current?.focus()
  }

  // ─── Parking (Ventas en Espera)
  function ponerEnEspera() {
    if (carrito.length === 0) { toast.warning('El carrito está vacío'); return }
    const id = Date.now()
    setEnEspera(prev => [...prev, {
      id,
      carrito: [...carrito],
      clienteId,
      clienteNombre,
      descuento,
      observaciones,
      promoActiva,
      hora: new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }),
    }])
    limpiarCarrito()
    toast.success('Venta guardada en espera')
  }

  function recuperarEspera(item) {
    if (carrito.length > 0) {
      if (!window.confirm('¿Descartar el carrito actual y recuperar la venta en espera?')) return
    }
    setCarrito(item.carrito)
    setClienteId(item.clienteId)
    setClienteNombre(item.clienteNombre)
    setDescuento(item.descuento)
    setObservaciones(item.observaciones)
    setPromoActiva(item.promoActiva)
    setEnEspera(prev => prev.filter(e => e.id !== item.id))
    setModalEspera(false)
    toast.success('Venta recuperada')
  }

  // ─── Promociones
  async function evaluarPromos() {
    if (carrito.length === 0) return
    try {
      const lineas = carrito.map(l => ({
        productoId: l.productoId,
        varianteId: l.varianteId,
        categoriaId: l.categoriaId,
        cantidad: l.cantidad,
        subtotalLinea: (l.precioUnitario * l.cantidad) - l.descuentoLinea,
      }))
      const metodoPago = pagos[0]?.metodoPago ?? null
      const res = await promocionesApi.evaluar({ lineas, metodoPago })
      const disponibles = res.data.data?.promocionesAplicables ?? []
      setPromos(disponibles)
      if (disponibles.length === 0) toast.info('No hay promociones aplicables')
    } catch { toast.error('Error al evaluar promociones') }
  }

  // ─── Clientes
  async function realizarBusquedaCliente(q) {
    setBusquedaCliente(q)
    if (!q.trim()) { setResultadosCliente([]); return }
    try {
      const res = await clientesApi.buscar(q)
      setResultadosCliente(res.data.data ?? [])
    } catch { setResultadosCliente([]) }
  }

  function seleccionarCliente(c) {
    setClienteId(c.id)
    setClienteNombre(c.nombreCompleto)
    setModalCliente(false)
    setBusquedaCliente('')
    setResultadosCliente([])
    setMostrarCrearCliente(false)
  }

  // ─── Flujo de Pago
  function abrirPago() {
    if (carrito.length === 0) { toast.warning('El carrito está vacío'); return }
    if (!cajaAbierta) { toast.error('Debe abrir la caja antes de cobrar'); return }
    setPagos([{ metodoPago: 'EFECTIVO', monto: String(total), referenciaPago: '' }])
    setModalPago(true)
  }

  const { usuario } = useAuth()

  function abrirProforma() {
    if (carrito.length === 0) { toast.warning('Agrega productos para generar una proforma'); return }
    const proforma = {
      numeroProforma: `PROF-${Date.now().toString().slice(-6)}`,
      fecha: new Date().toISOString(),
      vendedor: usuario?.nombre + ' ' + usuario?.apellido,
      cliente: clienteNombre ? { nombre: clienteNombre } : null,
      items: carrito,
      subtotal: subtotalLineas,
      totalDescuento,
      total,
      gruposIva
    }
    setModalProforma(proforma)
  }

  async function confirmarVenta() {
    if (faltaPagar > 0) { toast.error(`Falta cubrir ₡${faltaPagar}`); return }
    setEnviando(true)
    try {
      const body = {
        clienteId: clienteId ?? null,
        descuento: Number(descuento) || 0,
        observaciones: observaciones || null,
        detalles: carrito.map(l => ({
          productoId: l.productoId,
          varianteId: l.varianteId,
          cantidad: l.cantidad,
          precioUnitario: l.precioUnitario,
          descuentoLinea: l.descuentoLinea,
        })),
        pagos: pagos
          .filter(p => Number(p.monto) > 0)
          .map(p => ({
            metodoPago: p.metodoPago,
            monto: Number(p.monto),
            referenciaPago: p.referenciaPago || null,
          })),
        promocionesSeleccionadas: promoActiva ? [{
          promocionId: promoActiva.promocionId,
          tipoAplicacion: promoActiva.tipoAplicacion,
          montoDescuento: promoActiva.montoDescuento,
          detalleVentaId: promoActiva.detalleVentaId ?? null,
        }] : [],
      }
      const res = await ventasApi.crear(body)
      const venta = res.data.data
      setModalPago(false)
      setModalComprobante(venta)
      limpiarCarrito()
      toast.success(`Venta ${venta.numeroVenta} registrada`)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error al registrar la venta')
    } finally {
      setEnviando(false)
    }
  }

  return {
    // Referencias
    searchRef,
    // Estados
    tabActivo, setTabActivo,
    cajaAbierta, enviando,
    // Búsqueda productos
    busqueda,
    // Carrito
    carrito, setCarrito, descuento, setDescuento,
    clienteId, setClienteId, clienteNombre, setClienteNombre,
    observaciones, setObservaciones,
    subtotalLineas, totalDescuento, total, cambio, faltaPagar, gruposIva, totalPagado,
    // Pagos
    pagos, setPagos,
    // Promociones
    promos, setPromos, promoActiva, setPromoActiva, evaluarPromos,
    // En espera
    enEspera, setEnEspera, ponerEnEspera, recuperarEspera,
    // Modales
    modalVariantes, setModalVariantes,
    modalPago, setModalPago,
    modalCliente, setModalCliente,
    modalComprobante, setModalComprobante,
    modalProforma, setModalProforma,
    modalEspera, setModalEspera,
    mostrarCrearCliente, setMostrarCrearCliente,
    // Clientes
    busquedaCliente, setBusquedaCliente, resultadosCliente,
    realizarBusquedaCliente, seleccionarCliente,
    // Acciones
    agregarProducto, agregarVariante, cambiarCantidad, limpiarCarrito,
    abrirPago, abrirProforma, confirmarVenta,
    // Usuario
    usuario
  }
}
