import api from './client'

export const ventasApi = {
  listar:           (params)      => api.get('/ventas',           { params }),
  obtener:          (id)          => api.get(`/ventas/${id}`),
  crear:            (datos)       => api.post('/ventas',           datos),
  anular:           (id, motivo)  => api.patch(`/ventas/${id}/anular`, { motivo }),
  listarSucursales: ()            => api.get('/ventas/sucursales'),
}

export const productosApi = {
  listar:          (params)        => api.get('/productos',                   { params }),
  obtener:         (id)            => api.get(`/productos/${id}`),
  crear:           (datos)         => api.post('/productos',                   datos),
  editar:          (id, datos)     => api.put(`/productos/${id}`,              datos),
  toggle:          (id, activo)    => api.patch(`/productos/${id}/toggle-activo`,    { activo }),
  buscarCodigo:    (codigo)        => api.get(`/productos/codigo/${codigo}`),
  subirImagen:     (formData)      => api.post('/productos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  // Variantes
  crearVariante:   (id, datos)     => api.post(`/productos/${id}/variantes`,   datos),
  editarVariante:  (id, vid, d)    => api.put(`/productos/${id}/variantes/${vid}`, d),
  toggleVariante:  (id, vid, act)  => api.patch(`/productos/${id}/variantes/${vid}/toggle-activo`, { activo: act }),
}

export const inventarioApi = {
  movimientos: (params)      => api.get('/inventario/movimientos', { params }),
  entrada:     (datos)       => api.post('/inventario/entrada',    datos),
  ajuste:      (datos)       => api.post('/inventario/ajuste',     datos),
  alertas:     ()            => api.get('/inventario/alertas'),
}

export const clientesApi = {
  listar:    (params)     => api.get('/clientes',          { params }),
  obtener:   (id)         => api.get(`/clientes/${id}`),
  crear:     (datos)      => api.post('/clientes',          datos),
  editar:    (id, datos)  => api.put(`/clientes/${id}`,     datos),
  toggle:    (id, activo) => api.patch(`/clientes/${id}/toggle-activo`, { activo }),
  buscar:    (q)          => api.get('/clientes',          { params: { busqueda: q, limit: 10 } }),
}

export const categoriasApi = {
  listar:  (params)     => api.get('/categorias',        { params }),
  obtener: (id)         => api.get(`/categorias/${id}`),
  crear:   (datos)      => api.post('/categorias',        datos),
  editar:  (id, datos)  => api.put(`/categorias/${id}`,   datos),
  toggle:  (id, activa) => api.patch(`/categorias/${id}/toggle-activa`, { activa }),
}

export const boletasApi = {
  listar:          (params)         => api.get('/boletas',                           { params }),
  obtener:         (id)             => api.get(`/boletas/${id}`),
  crear:           (datos)          => api.post('/boletas',                           datos),
  cambiarEstado:   (id, datos)      => api.patch(`/boletas/${id}/estado`,             datos),
  presupuesto:     (id, datos)      => api.patch(`/boletas/${id}/presupuesto`,        datos),
  asignarRepuesto: (id, datos)      => api.post(`/boletas/${id}/repuestos`,           datos),
  retirarRepuesto: (id, rid)        => api.delete(`/boletas/${id}/repuestos/${rid}`),
  registrarPago:   (id, datos)      => api.post(`/boletas/${id}/pagos`,              datos),
  salidaCredito:   (id, autorizar)  => api.patch(`/boletas/${id}/salida-credito`,    { autorizar }),
  subirFotos:      (formData)       => api.post('/boletas/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

export const apartadosApi = {
  listar:   (params)     => api.get('/apartados',              { params }),
  obtener:  (id)         => api.get(`/apartados/${id}`),
  crear:    (datos)      => api.post('/apartados',              datos),
  abonar:   (id, datos)  => api.post(`/apartados/${id}/abonos`, datos),
  cancelar: (id, motivo) => api.patch(`/apartados/${id}/cancelar`, { motivo }),
  // Temporales (Reservas web)
  listarTemporales: (params) => api.get('/apartados/temporales/listar', { params }),
  confirmarTemporal: (id)    => api.patch(`/apartados/temporales/${id}/confirmar`),
  aprobarTemporal:  (id)     => api.patch(`/apartados/temporales/${id}/aprobar`),
  entregarTemporal: (id)     => api.patch(`/apartados/temporales/${id}/entregar`),
  rechazarTemporal: (id, motivo) => api.patch(`/apartados/temporales/${id}/rechazar`, { motivo }),
}

export const pedidosApi = {
  listar:          (params)       => api.get('/pedidos',                        { params }),
  obtener:         (id)           => api.get(`/pedidos/${id}`),
  crear:           (datos)        => api.post('/pedidos',                        datos),
  cambiarEstado:   (id, datos)    => api.patch(`/pedidos/${id}/estado`,          datos),
  abonar:          (id, datos)    => api.post(`/pedidos/${id}/abonos`,           datos),
  cancelar:        (id, motivo)   => api.patch(`/pedidos/${id}/cancelar`,       { motivo }),
}

export const reportesApi = {
  dashboard:      ()        => api.get('/reportes/dashboard'),
  ventas:         (params)  => api.get('/reportes/ventas',           { params }),
  inventario:     (params)  => api.get('/reportes/inventario',       { params }),
  servicioTecnico:(params)  => api.get('/reportes/servicio-tecnico', { params }),
  apartados:      ()        => api.get('/reportes/apartados'),
  pedidos:        ()        => api.get('/reportes/pedidos'),
  financiero:     (params)  => api.get('/reportes/financiero',       { params }),
  gerencial:      (params)  => api.get('/reportes/gerencial',        { params }),
  iaConsultor:    (datos)   => api.post('/reportes/ia-consultor',     datos),
}

export const promocionesApi = {
  listar:     (params)      => api.get('/promociones',                { params }),
  obtener:    (id)          => api.get(`/promociones/${id}`),
  crear:      (datos)       => api.post('/promociones',                datos),
  editar:     (id, datos)   => api.put(`/promociones/${id}`,           datos),
  toggle:     (id, activa)  => api.patch(`/promociones/${id}/toggle`, { activa }),
  evaluar:    (datos)       => api.post('/promociones/evaluar',        datos),
  sugerencias:()            => api.get('/promociones/sugerencias'),
}

export const usuariosApi = {
  listar:           (params)       => api.get('/usuarios',                         { params }),
  obtener:          (id)           => api.get(`/usuarios/${id}`),
  crear:            (datos)        => api.post('/usuarios',                         datos),
  editar:           (id, datos)    => api.put(`/usuarios/${id}`,                    datos),
  toggle:           (id, activo)   => api.patch(`/usuarios/${id}/toggle-activo`,          { activo }),
  cambiarPassword:  (id, datos)    => api.patch(`/usuarios/${id}/password`,         datos),
}

export const publicApi = {
  catalogo:     (params) => api.get('/public/catalogo',      { params }),
  categorias:   ()       => api.get('/public/categorias'),
  boleta:       (datos)  => api.post('/public/boleta',        datos),
  reservarTemporal: (datos) => api.post('/public/reservar-temporal', datos),
  obtenerReserva: (id) => api.get(`/public/reservar-temporal/${id}`),
  subirComprobanteTemporal: (id, formData) => api.post(`/public/reservar-temporal/${id}/comprobante`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  homeConfig:   ()       => api.get('/public/home-config'),
  submitTestimony: (datos) => api.post('/testimonios', datos),
  getTestimonios: ()       => api.get('/testimonios/aprobados'),
}

export const testimoniosApi = {
  listar: (pendientes) => api.get('/testimonios', { params: { pendientes } }),
  aprobar: (id)        => api.patch(`/testimonios/${id}/aprobar`),
  eliminar: (id)       => api.delete(`/testimonios/${id}`),
}

export const configuracionHomeApi = {
  obtener:    ()       => api.get('/configuracion-home'),
  actualizar: (datos)  => api.patch('/configuracion-home', datos),
}

export const analyticsApi = {
  registrarVisita:         (datos)  => api.post('/analytics/visita', datos),
  registrarBusqueda:       (datos)  => api.post('/analytics/busqueda', datos),
  matrizIntencion:         (params) => api.get('/analytics/matriz-intencion', { params }),
  oportunidadesPerdidas:   ()       => api.get('/analytics/oportunidades-perdidas'),
  productosMuertos:        (params) => api.get('/analytics/productos-muertos', { params }),
  alertasReabastecimiento: ()       => api.get('/analytics/alertas-reabastecimiento'),
}