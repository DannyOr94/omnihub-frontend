import { useState, useEffect, useCallback } from 'react'
import { useForm }     from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z }           from 'zod'
import { toast }       from 'sonner'
import {
  Plus, Search, RefreshCw, Users, Phone,
  Mail, MapPin, FileText, Edit2, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { clientesApi } from '../../api/index'
import { useAuth }     from '../../context/AuthContext'
import { Button }      from '../../components/ui/button'
import { Input }       from '../../components/ui/input'
import { Label }       from '../../components/ui/label'
import { Badge }       from '../../components/ui/badge'
import { Textarea }    from '../../components/ui/textarea'
import { FormField }   from '../../components/ui/form-field'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '../../components/ui/dialog'
import { formatDate, formatDateTime } from '../../utils'

// ─── Schema ───────────────────────────────────────────────────────────────────
const clienteSchema = z.object({
  nombreCompleto: z.string().min(2, 'Mínimo 2 caracteres').max(200).trim(),
  telefono:       z.string().min(8, 'Teléfono inválido').max(20).optional().or(z.literal('')),
  correo:         z.string().email('Correo inválido').optional().or(z.literal('')),
  cedula:         z.string().min(5, 'Cédula inválida').max(30).optional().or(z.literal('')),
  direccion:      z.string().max(300).optional().or(z.literal('')),
  observaciones:  z.string().max(1000).optional().or(z.literal('')),
})

export default function ClientesPage() {
  const { esAdmin } = useAuth()

  const [clientes,   setClientes]   = useState([])
  const [cargando,   setCargando]   = useState(true)
  const [busqueda,   setBusqueda]   = useState('')
  const [seleccion,  setSeleccion]  = useState(null)
  const [cargandoDet,setCargandoDet]= useState(false)

  const [modalForm,  setModalForm]  = useState(false) // crear o editar
  const [editando,   setEditando]   = useState(null)  // cliente a editar
  const [enviando,   setEnviando]   = useState(false)

  const form = useForm({ resolver: zodResolver(clienteSchema) })

  // ─── Cargar lista ──────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const res = await clientesApi.listar({ busqueda: busqueda || undefined, soloActivos: false })
      setClientes(res.data.data ?? [])
    } catch { toast.error('Error al cargar clientes') }
    finally  { setCargando(false) }
  }, [busqueda])

  useEffect(() => { cargar() }, [cargar])

  // ─── Cargar detalle ────────────────────────────────────────────────────────
  async function verDetalle(id) {
    setCargandoDet(true)
    setSeleccion(null)
    try {
      const res = await clientesApi.obtener(id)
      setSeleccion(res.data.data)
    } catch { toast.error('Error al cargar cliente') }
    finally  { setCargandoDet(false) }
  }

  // ─── Abrir modal crear / editar ────────────────────────────────────────────
  function abrirCrear() {
    setEditando(null)
    form.reset({ nombreCompleto: '', telefono: '', correo: '', cedula: '', direccion: '', observaciones: '' })
    setModalForm(true)
  }

  function abrirEditar(c) {
    setEditando(c)
    form.reset({
      nombreCompleto: c.nombreCompleto,
      telefono:       c.telefono ?? '',
      correo:         c.correo   ?? '',
      cedula:         c.cedula   ?? '',
      direccion:      c.direccion ?? '',
      observaciones:  c.observaciones ?? '',
    })
    setModalForm(true)
  }

  // ─── Guardar ──────────────────────────────────────────────────────────────
  async function onGuardar(datos) {
    // Limpiar strings vacíos a null
    const payload = Object.fromEntries(
      Object.entries(datos).map(([k, v]) => [k, v === '' ? null : v])
    )
    setEnviando(true)
    try {
      if (editando) {
        await clientesApi.editar(editando.id, payload)
        toast.success('Cliente actualizado')
      } else {
        await clientesApi.crear(payload)
        toast.success('Cliente creado')
      }
      setModalForm(false)
      cargar()
      if (seleccion) verDetalle(seleccion.id)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error al guardar')
    } finally { setEnviando(false) }
  }

  // ─── Toggle activo ─────────────────────────────────────────────────────────
  async function toggleActivo(c) {
    try {
      await clientesApi.toggle(c.id, !c.activo)
      toast.success(`Cliente ${!c.activo ? 'activado' : 'desactivado'}`)
      cargar()
      if (seleccion?.id === c.id) verDetalle(c.id)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error')
    }
  }

  // ─── Busqueda con debounce ─────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => cargar(), 350)
    return () => clearTimeout(t)
  }, [busqueda])

  return (
    <div className="flex gap-4 h-[calc(100vh-7rem)]">

      {/* ── Lista ─────────────────────────────────────────────────────────── */}
      <div className="w-80 shrink-0 flex flex-col bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Users size={15} /> Clientes
            </h1>
            <Button size="sm" onClick={abrirCrear} className="h-7 text-xs px-2">
              <Plus size={13} className="mr-1" /> Nuevo
            </Button>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {cargando ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="px-4 py-3 space-y-1.5">
                <div className="h-3.5 bg-slate-100 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
              </div>
            ))
          ) : clientes.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">Sin clientes</p>
          ) : (
            clientes.map(c => (
              <button
                key={c.id}
                onClick={() => verDetalle(c.id)}
                className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors ${seleccion?.id === c.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''} ${!c.activo ? 'opacity-50' : ''}`}
              >
                <p className="text-sm font-medium text-slate-800 truncate">{c.nombreCompleto}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {c.telefono ?? c.correo ?? c.cedula ?? 'Sin contacto'}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Detalle ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {cargandoDet ? (
          <div className="bg-white rounded-xl border p-6 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" />)}
          </div>
        ) : !seleccion ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300">
            <Users size={48} className="mb-3" />
            <p className="text-slate-400 font-medium">Selecciona un cliente</p>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Header */}
            <div className="bg-white rounded-xl border p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{seleccion.nombreCompleto}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Cliente desde {formatDate(seleccion.fechaCreacion)}
                  </p>
                </div>
                <Badge variant={seleccion.activo ? 'default' : 'secondary'}>
                  {seleccion.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>

              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => abrirEditar(seleccion)}>
                  <Edit2 size={13} className="mr-1" /> Editar
                </Button>
                {esAdmin && (
                  <Button
                    size="sm"
                    variant={seleccion.activo ? 'destructive' : 'outline'}
                    onClick={() => toggleActivo(seleccion)}
                  >
                    {seleccion.activo
                      ? <><ToggleLeft size={13} className="mr-1" /> Desactivar</>
                      : <><ToggleRight size={13} className="mr-1" /> Activar</>
                    }
                  </Button>
                )}
              </div>
            </div>

            {/* Datos de contacto */}
            <div className="bg-white rounded-xl border p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <h3 className="col-span-full text-xs font-semibold text-slate-500 uppercase tracking-wide">Datos de contacto</h3>
              {seleccion.telefono && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={14} className="text-slate-400 shrink-0" />
                  <span className="text-slate-700">{seleccion.telefono}</span>
                </div>
              )}
              {seleccion.correo && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-slate-400 shrink-0" />
                  <span className="text-slate-700 truncate">{seleccion.correo}</span>
                </div>
              )}
              {seleccion.cedula && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText size={14} className="text-slate-400 shrink-0" />
                  <span className="text-slate-700">Cédula: {seleccion.cedula}</span>
                </div>
              )}
              {seleccion.direccion && (
                <div className="flex items-center gap-2 text-sm col-span-full">
                  <MapPin size={14} className="text-slate-400 shrink-0" />
                  <span className="text-slate-700">{seleccion.direccion}</span>
                </div>
              )}
              {seleccion.observaciones && (
                <div className="col-span-full text-sm text-slate-500 bg-slate-50 rounded p-2.5">
                  {seleccion.observaciones}
                </div>
              )}
            </div>

            {/* Resumen de actividad */}
            {seleccion._count && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Ventas',    valor: seleccion._count.ventas },
                  { label: 'Apartados', valor: seleccion._count.apartados },
                  { label: 'Pedidos',   valor: seleccion._count.pedidosEspeciales },
                  { label: 'Boletas',   valor: seleccion._count.boletas },
                ].map(item => (
                  <div key={item.label} className="bg-white rounded-xl border p-4 text-center">
                    <p className="text-2xl font-bold text-slate-800">{item.valor}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL — Crear / Editar cliente                                      */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={modalForm} onOpenChange={setModalForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onGuardar)} className="space-y-4 pt-1">
            <FormField label="Nombre completo" required error={form.formState.errors.nombreCompleto?.message}>
              <Input aria-invalid={!!form.formState.errors.nombreCompleto} {...form.register('nombreCompleto')} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Teléfono" error={form.formState.errors.telefono?.message}>
                <Input aria-invalid={!!form.formState.errors.telefono} placeholder="8888-8888" {...form.register('telefono')} />
              </FormField>
              <FormField label="Cédula" error={form.formState.errors.cedula?.message}>
                <Input aria-invalid={!!form.formState.errors.cedula} {...form.register('cedula')} />
              </FormField>
            </div>
            <FormField label="Correo electrónico" error={form.formState.errors.correo?.message}>
              <Input aria-invalid={!!form.formState.errors.correo} type="email" {...form.register('correo')} />
            </FormField>
            <FormField label="Dirección" error={form.formState.errors.direccion?.message}>
              <Input aria-invalid={!!form.formState.errors.direccion} {...form.register('direccion')} />
            </FormField>
            <FormField label="Observaciones" error={form.formState.errors.observaciones?.message}>
              <Textarea aria-invalid={!!form.formState.errors.observaciones} rows={2} {...form.register('observaciones')} />
            </FormField>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setModalForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={enviando}>
                {enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear cliente'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
