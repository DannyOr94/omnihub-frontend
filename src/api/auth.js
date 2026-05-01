import api from './client'

export const authApi = {
  login:   (correo, password) => api.post('/auth/login',   { correo, password }),
  logout:  ()                 => api.post('/auth/logout'),
  refresh: ()                 => api.post('/auth/refresh'),
  me:      ()                 => api.get('/auth/me'),
}
