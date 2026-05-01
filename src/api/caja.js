import api from './client'

export const cajaApi = {
  estado:        ()           => api.get('/caja/estado'),
  resumenActivo: ()           => api.get('/caja/resumen-activo'),
  abrir:         (datos)      => api.post('/caja/abrir',   datos),
  cerrar:        (datos)      => api.post('/caja/cerrar',  datos),
  salida:        (datos)      => api.post('/caja/salidas', datos),
  reabrir:       (id, datos)  => api.post(`/caja/${id}/reabrir`, datos),
  listar:        (params)     => api.get('/caja',          { params }),
  obtener:       (id)         => api.get(`/caja/${id}`),
}
