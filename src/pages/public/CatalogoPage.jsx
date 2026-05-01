import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Package, X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react'
import { publicApi } from '../../api/index'
import { Input }     from '../../components/ui/input'
import { formatCurrency } from '../../utils'

// ─── Constantes ───────────────────────────────────────────────────────────────
const TIPO_LABEL = {
  TEXTIL:     'Ropa',
  TECNOLOGIA: 'Tecnología',
  REPUESTO:   'Repuesto',
  SERVICIO:   'Servicio',
}

const TIPO_COLOR = {
  TEXTIL:     'bg-pink-100 text-pink-700',
  TECNOLOGIA: 'bg-blue-100 text-blue-700',
  REPUESTO:   'bg-orange-100 text-orange-700',
  SERVICIO:   'bg-purple-100 text-purple-700',
}

const TIPO_FILTROS = [
  { value: '',          label: 'Todo' },
  { value: 'TEXTIL',    label: '👕 Ropa' },
  { value: 'TECNOLOGIA',label: '📱 Tecnología' },
  { value: 'REPUESTO',  label: '🔧 Repuestos' },
  { value: 'SERVICIO',  label: '⚙️ Servicios' },
]

// ─── Tarjeta de producto ──────────────────────────────────────────────────────
function TarjetaProducto({ producto }) {
  const [expandido, setExpandido] = useState(false)
  const tieneVariantes    = producto.variantes?.length > 0
  const variantesDisponibles = producto.variantes?.filter(v => v.disponible) ?? []

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-all group ${!producto.disponible ? 'opacity-60' : ''}`}>
      {/* Imagen */}
      <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center overflow-hidden relative">
        {producto.imagenUrl ? (
          <img
            src={producto.imagenUrl}
            alt={producto.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={e => { e.target.style.display='none' }}
          />
        ) : (
          <Package size={36} className="text-slate-200" />
        )}
        {/* Badge tipo */}
        <span className={`absolute top-2 left-2 text-xs px-1.5 py-0.5 rounded font-medium ${TIPO_COLOR[producto.tipoProducto] ?? 'bg-slate-100 text-slate-600'}`}>
          {TIPO_LABEL[producto.tipoProducto] ?? producto.tipoProducto}
        </span>
      </div>

      <div className="p-4">
        {/* Categoría */}
        {producto.categoria && (
          <p className="text-xs text-slate-400 mb-1">{producto.categoria.nombre}</p>
        )}

        {/* Nombre */}
        <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2">
          {producto.nombre}
        </h3>
        {producto.marca && (
          <p className="text-xs text-slate-400 mt-0.5">{producto.marca}</p>
        )}
        {producto.descripcion && (
          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{producto.descripcion}</p>
        )}

        {/* Precio + disponibilidad */}
        <div className="flex items-center justify-between mt-3">
          <p className="font-bold text-slate-900 text-base">
            {formatCurrency(producto.precioVenta)}
          </p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            producto.disponible
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-600'
          }`}>
            {producto.disponible ? 'Disponible' : 'Agotado'}
          </span>
        </div>

        {/* Variantes */}
        {tieneVariantes && (
          <div className="mt-3">
            <button
              onClick={() => setExpandido(v => !v)}
              className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-600 py-1.5 border-t border-slate-50 transition-colors"
            >
              <span>
                {variantesDisponibles.length > 0
                  ? `${variantesDisponibles.length} variante${variantesDisponibles.length > 1 ? 's' : ''} disponible${variantesDisponibles.length > 1 ? 's' : ''}`
                  : 'Sin stock en variantes'}
              </span>
              {expandido ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {expandido && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {producto.variantes.map(v => (
                  <span
                    key={v.id}
                    className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                      v.disponible
                        ? 'border-slate-200 text-slate-700 bg-white hover:border-blue-300 hover:bg-blue-50'
                        : 'border-slate-100 text-slate-300 bg-slate-50 line-through'
                    }`}
                  >
                    {[v.talla && `T.${v.talla}`, v.color].filter(Boolean).join(' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function CatalogoPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [productos,    setProductos]    = useState([])
  const [categorias,   setCategorias]   = useState([])
  const [cargando,     setCargando]     = useState(true)
  const [busqueda,     setBusqueda]     = useState('')
  const [categoriaId,  setCategoriaId]  = useState(null)
  const [soloDisponibles, setSoloDisponibles] = useState(false)
  const [mostrarFiltros,  setMostrarFiltros]  = useState(false)
  const timer = useRef(null)

  // Leer tipo desde URL (?tipo=TEXTIL)
  const tipoFiltro = searchParams.get('tipo') ?? ''

  // Cargar categorías al montar
  useEffect(() => {
    publicApi.categorias()
      .then(r => setCategorias(r.data.data ?? []))
      .catch(() => {})
  }, [])

  // Cargar productos con debounce
  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setCargando(true)
      publicApi.catalogo({
        busqueda:    busqueda     || undefined,
        categoriaId: categoriaId  || undefined,
      })
        .then(r => {
          let lista = r.data.data ?? []
          // Filtrar por tipo si viene en URL
          if (tipoFiltro) lista = lista.filter(p => p.tipoProducto === tipoFiltro)
          // Filtrar solo disponibles
          if (soloDisponibles) lista = lista.filter(p => p.disponible)
          setProductos(lista)
        })
        .catch(() => setProductos([]))
        .finally(() => setCargando(false))
    }, 300)
    return () => clearTimeout(timer.current)
  }, [busqueda, categoriaId, tipoFiltro, soloDisponibles])

  function cambiarTipo(tipo) {
    const params = new URLSearchParams(searchParams)
    if (tipo) params.set('tipo', tipo)
    else params.delete('tipo')
    setSearchParams(params)
    setCategoriaId(null)
  }

  const disponibles = productos.filter(p => p.disponible).length
  const agotados    = productos.filter(p => !p.disponible).length

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

      {/* ── Encabezado ────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Catálogo</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Encuentra ropa, accesorios tecnológicos y más
        </p>
      </div>

      {/* ── Barra de búsqueda ─────────────────────────────────────────────── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar productos, marcas…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="pl-9 pr-9 h-11 bg-white border-slate-200"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setMostrarFiltros(v => !v)}
          className={`flex items-center gap-1.5 px-4 h-11 rounded-xl border text-sm font-medium transition-colors ${
            mostrarFiltros || soloDisponibles
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
          }`}
        >
          <SlidersHorizontal size={14} /> Filtros
        </button>
      </div>

      {/* ── Filtros ───────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Chips de tipo */}
        <div className="flex flex-wrap gap-2">
          {TIPO_FILTROS.map(t => (
            <button
              key={t.value}
              onClick={() => cambiarTipo(t.value)}
              className={`text-sm px-4 py-1.5 rounded-full font-medium transition-colors border ${
                tipoFiltro === t.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filtros expandibles */}
        {mostrarFiltros && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-4">
            {/* Categorías */}
            {categorias.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Categoría</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCategoriaId(null)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                      !categoriaId ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    Todas
                  </button>
                  {categorias.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCategoriaId(categoriaId === cat.id ? null : cat.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                        categoriaId === cat.id ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {cat.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Solo disponibles */}
            <div>
              <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soloDisponibles}
                  onChange={e => setSoloDisponibles(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                Mostrar solo productos disponibles
              </label>
            </div>
          </div>
        )}
      </div>

      {/* ── Contador ──────────────────────────────────────────────────────── */}
      {!cargando && productos.length > 0 && (
        <p className="text-xs text-slate-400">
          <span className="font-medium text-slate-600">{productos.length}</span> producto{productos.length !== 1 ? 's' : ''}
          {disponibles > 0 && <> · <span className="text-green-600 font-medium">{disponibles} disponible{disponibles !== 1 ? 's' : ''}</span></>}
          {agotados > 0 && <> · <span className="text-slate-400">{agotados} agotado{agotados !== 1 ? 's' : ''}</span></>}
        </p>
      )}

      {/* ── Grid de productos ─────────────────────────────────────────────── */}
      {cargando ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="aspect-square bg-slate-100 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-slate-100 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
                <div className="h-5 bg-slate-100 rounded animate-pulse w-1/3 mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : productos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Package size={28} className="text-slate-300" />
          </div>
          <p className="text-slate-600 font-semibold">Sin productos</p>
          {busqueda && (
            <p className="text-sm text-slate-400 mt-1">
              No hay resultados para "<span className="font-medium">{busqueda}</span>"
            </p>
          )}
          {(busqueda || categoriaId || tipoFiltro || soloDisponibles) && (
            <button
              onClick={() => { setBusqueda(''); setCategoriaId(null); setSoloDisponibles(false); cambiarTipo('') }}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {productos.map(p => (
            <TarjetaProducto key={p.id} producto={p} />
          ))}
        </div>
      )}

    </div>
  )
}
