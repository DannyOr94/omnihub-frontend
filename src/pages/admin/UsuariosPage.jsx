import { useState, useEffect, useCallback } from 'react'
import { useForm }     from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z }           from 'zod'
import { toast }       from 'sonner'
import {
  UserCog, Plus, Edit2, ToggleLeft,
  ToggleRight, KeyRound, Shield,
} from 'lucide-react'
import { usuariosApi } from '../../api/index'
import { Button }      from '../../components/ui/button'
import { Input }       from '../../components/ui/input'
import { Label }       from '../../components/ui/label'
import { Badge }       from '../../components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '../../components/ui/dialog'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '../../components/ui/select'
import { formatDateTime } from '../../utils'

// ─── Schemas ─────────────────────────────────────────────────────────────────
const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

const crearSchema = z.object({
  nombre:   z.string().min(2, 'Mínimo 2 caracteres').max(100).trim(),
  apellido: z.string().min(2, 'Mínimo 2 caracteres').max(100).trim(),
  correo:   z.string().email('Correo inválido').toLowerCase(),
  password: z.string().regex(pwRegex, 'Mínimo 8 chars, una mayúscula, minúscula y número'),
  rolId:    z.coerce.number().int().positive('Selecciona un rol'),
})

const editarSchema = z.object({
  nombre:   z.string().min(2).max(100).trim().optional(),
  apellido: z.string().min(2).max(100).trim().optional(),
  correo:   z.string().email('Correo inválido').toLowerCase().optional(),
  rolId:    z.coerce.number().int().positive().optional(),
})

const pwSchema = z.object({
  passwordActual: z.string().min(1, 'Ingresa la contraseña actual'),
  passwordNueva:  z.string().regex(pwRegex, 'Mínimo 8 chars, una mayúscula, minúscula y número'),
  confirmar:      z.string(),
}).refine(d => d.passwordNueva === d.confirmar, {
  message: 'Las contraseñas no coinciden', path: ['confirmar'],
})

const COLOR_ROL = {
  ADMINISTRADOR: 'bg-purple-100 text-purple-800',
  VENDEDOR:      'bg-blue-100 text-blue-800',
  TECNICO:       'bg-orange-100 text-orange-800',
}

function Campo({ label, error, children, required }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export default function UsuariosPage() {
  const [usuarios,  setUsuarios]  = useState([])
  const [roles,     setRoles]     = useState([])
  const [cargando,  setCargando]  = useState(true)
  const [enviando,  setEnviando]  = useState(false)

  const [modalForm, setModalForm] = useState(false)
  const [modalPw,   setModalPw]   = useState(false)
  const [editando,  setEditando]  = useState(null)
  const [usuarioPw, setUsuarioPw] = useState(null)

  const formUsuario = useForm({ resolver: zodResolver(crearSchema) })
  const formEditar  = useForm({ resolver: zodResolver(editarSchema) })
  const formPw      = useForm({ resolver: zodResolver(pwSchema) })

  // ─── Cargar ───────────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const [resU, resR] = await Promise.all([
        usuariosApi.listar(),
        fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'}/usuarios/roles`, { credentials: 'include' }).then(r => r.json()),
      ])
      setUsuarios(resU.data.data ?? [])
      setRoles(resR.data ?? [])
    } catch {
      toast.error('Error al cargar')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  // ─── Crear ────────────────────────────────────────────────────────────────
  function abrirCrear() {
    setEditando(null)
    formUsuario.reset({ nombre:'', apellido:'', correo:'', password:'', rolId:'' })
    setModalForm(true)
  }

  async function onCrear(datos) {
    setEnviando(true)
    try {
      await usuariosApi.crear(datos)
      toast.success('Usuario creado correctamente')
      setModalForm(false)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error al crear usuario')
    } finally { setEnviando(false) }
  }

  // ─── Editar ───────────────────────────────────────────────────────────────
  function abrirEditar(u) {
    setEditando(u)
    formEditar.reset({
      nombre:   u.nombre,
      apellido: u.apellido,
      correo:   u.correo,
      rolId:    u.rol?.id,
    })
    setModalForm(true)
  }

  async function onEditar(datos) {
    setEnviando(true)
    try {
      await usuariosApi.editar(editando.id, datos)
      toast.success('Usuario actualizado')
      setModalForm(false)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error')
    } finally { setEnviando(false) }
  }

  // ─── Toggle ───────────────────────────────────────────────────────────────
  async function toggleActivo(u) {
    try {
      await usuariosApi.toggle(u.id, !u.activo)
      toast.success(`Usuario ${!u.activo ? 'activado' : 'desactivado'}`)
      cargar()
    } catch (err) { toast.error(err.response?.data?.message ?? 'Error') }
  }

  // ─── Cambiar contraseña ───────────────────────────────────────────────────
  function abrirCambiarPw(u) {
    setUsuarioPw(u)
    formPw.reset({ passwordActual: '', passwordNueva: '', confirmar: '' })
    setModalPw(true)
  }

  async function onCambiarPw(datos) {
    setEnviando(true)
    try {
      await usuariosApi.cambiarPassword(usuarioPw.id, {
        passwordActual: datos.passwordActual,
        passwordNueva:  datos.passwordNueva,
      })
      toast.success('Contraseña actualizada')
      setModalPw(false)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error')
    } finally { setEnviando(false) }
  }

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <UserCog size={20} /> Usuarios
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Gestión de accesos al sistema</p>
        </div>
        <Button size="sm" onClick={abrirCrear}>
          <Plus size={14} className="mr-1.5" /> Nuevo usuario
        </Button>
      </div>

      {/* ── Tabla ────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {cargando ? (
          <div className="divide-y">{[...Array(4)].map((_,i) => (
            <div key={i} className="px-6 py-4 flex gap-4">
              <div className="h-4 bg-slate-100 rounded animate-pulse flex-1" />
              <div className="h-4 bg-slate-100 rounded animate-pulse w-24" />
            </div>
          ))}</div>
        ) : usuarios.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">Sin usuarios</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 border-b">
                <th className="px-5 py-3 text-left font-medium">Usuario</th>
                <th className="px-5 py-3 text-left font-medium">Correo</th>
                <th className="px-5 py-3 text-left font-medium">Rol</th>
                <th className="px-5 py-3 text-left font-medium">Último acceso</th>
                <th className="px-5 py-3 text-left font-medium">Estado</th>
                <th className="px-5 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {usuarios.map(u => (
                <tr key={u.id} className={`hover:bg-slate-50 ${!u.activo ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-800">{u.nombre} {u.apellido}</p>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{u.correo}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${COLOR_ROL[u.rol?.nombreRol] ?? 'bg-slate-100 text-slate-600'}`}>
                      <Shield size={10} /> {u.rol?.nombreRol}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">
                    {u.ultimoAcceso ? formatDateTime(u.ultimoAcceso) : 'Nunca'}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={u.activo ? 'default' : 'secondary'}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => abrirEditar(u)} title="Editar"
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => abrirCambiarPw(u)} title="Cambiar contraseña"
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50">
                        <KeyRound size={14} />
                      </button>
                      <button onClick={() => toggleActivo(u)} title={u.activo ? 'Desactivar' : 'Activar'}
                        className={`p-1.5 rounded ${u.activo ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`}>
                        {u.activo ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL — Crear / Editar */}
      <Dialog open={modalForm} onOpenChange={setModalForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
          </DialogHeader>
          {editando ? (
            <form onSubmit={formEditar.handleSubmit(onEditar)} className="space-y-4 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Nombre" error={formEditar.formState.errors.nombre?.message}>
                  <Input {...formEditar.register('nombre')} />
                </Campo>
                <Campo label="Apellido" error={formEditar.formState.errors.apellido?.message}>
                  <Input {...formEditar.register('apellido')} />
                </Campo>
              </div>
              <Campo label="Correo electrónico" error={formEditar.formState.errors.correo?.message}>
                <Input type="email" {...formEditar.register('correo')} />
              </Campo>
              <Campo label="Rol" error={formEditar.formState.errors.rolId?.message}>
                <Select value={String(formEditar.watch('rolId') || '')} onValueChange={v => formEditar.setValue('rolId', Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                  <SelectContent>
                    {roles.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.nombreRol}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Campo>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setModalForm(false)}>Cancelar</Button>
                <Button type="submit" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar cambios'}</Button>
              </DialogFooter>
            </form>
          ) : (
            <form onSubmit={formUsuario.handleSubmit(onCrear)} className="space-y-4 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Nombre" required error={formUsuario.formState.errors.nombre?.message}>
                  <Input {...formUsuario.register('nombre')} />
                </Campo>
                <Campo label="Apellido" required error={formUsuario.formState.errors.apellido?.message}>
                  <Input {...formUsuario.register('apellido')} />
                </Campo>
              </div>
              <Campo label="Correo electrónico" required error={formUsuario.formState.errors.correo?.message}>
                <Input type="email" {...formUsuario.register('correo')} />
              </Campo>
              <Campo label="Contraseña" required error={formUsuario.formState.errors.password?.message}>
                <Input type="password" {...formUsuario.register('password')} />
                <p className="text-xs text-slate-400">Mínimo 8 caracteres, mayúscula, minúscula y número</p>
              </Campo>
              <Campo label="Rol" required error={formUsuario.formState.errors.rolId?.message}>
                <Select onValueChange={v => formUsuario.setValue('rolId', Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar rol…" /></SelectTrigger>
                  <SelectContent>
                    {roles.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.nombreRol}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Campo>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setModalForm(false)}>Cancelar</Button>
                <Button type="submit" disabled={enviando}>{enviando ? 'Creando…' : 'Crear usuario'}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL — Cambiar contraseña */}
      <Dialog open={modalPw} onOpenChange={setModalPw}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cambiar contraseña — {usuarioPw?.nombre}</DialogTitle>
          </DialogHeader>
          <form onSubmit={formPw.handleSubmit(onCambiarPw)} className="space-y-4 pt-1">
            <Campo label="Contraseña actual" required error={formPw.formState.errors.passwordActual?.message}>
              <Input type="password" {...formPw.register('passwordActual')} />
            </Campo>
            <Campo label="Nueva contraseña" required error={formPw.formState.errors.passwordNueva?.message}>
              <Input type="password" {...formPw.register('passwordNueva')} />
            </Campo>
            <Campo label="Confirmar nueva contraseña" required error={formPw.formState.errors.confirmar?.message}>
              <Input type="password" {...formPw.register('confirmar')} />
            </Campo>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setModalPw(false)}>Cancelar</Button>
              <Button type="submit" disabled={enviando}>{enviando ? 'Cambiando…' : 'Cambiar contraseña'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
