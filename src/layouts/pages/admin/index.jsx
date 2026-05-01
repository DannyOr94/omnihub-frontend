// Páginas placeholder — se reemplazan módulo por módulo
// Cada una muestra el nombre del módulo mientras se construye

function Placeholder({ titulo, descripcion }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <p className="text-2xl font-bold text-slate-700">{titulo}</p>
      <p className="text-slate-400 mt-2 text-sm">{descripcion ?? 'En construcción'}</p>
    </div>
  )
}

export function DashboardPage()   { return <Placeholder titulo="Dashboard" descripcion="Métricas y alertas del negocio" /> }
export function CajaPage()        { return <Placeholder titulo="Caja" descripcion="Apertura, cierre y salidas de caja" /> }
export function POSPage()         { return <Placeholder titulo="Punto de Venta" descripcion="Registro de ventas en mostrador" /> }
export function ProductosPage()   { return <Placeholder titulo="Productos" descripcion="CRUD de productos y variantes" /> }
export function InventarioPage()  { return <Placeholder titulo="Inventario" descripcion="Movimientos y alertas de stock" /> }
export function ClientesPage()    { return <Placeholder titulo="Clientes" descripcion="Gestión de clientes" /> }
export function ApartadosPage()   { return <Placeholder titulo="Apartados" descripcion="Reservas y abonos" /> }
export function PedidosPage()     { return <Placeholder titulo="Pedidos Especiales" descripcion="Solicitudes de productos no disponibles" /> }
export function BoletasPage()     { return <Placeholder titulo="Servicio Técnico" descripcion="Boletas de reparación" /> }
export function ReportesPage()    { return <Placeholder titulo="Reportes" descripcion="Análisis y exportación de datos" /> }
export function PromocionesPage() { return <Placeholder titulo="Promociones" descripcion="Gestión de descuentos y ofertas" /> }
export function UsuariosPage()    { return <Placeholder titulo="Usuarios" descripcion="Gestión de usuarios del sistema" /> }
