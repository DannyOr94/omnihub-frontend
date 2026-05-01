import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button }   from '../../components/ui/button'
import { Input }    from '../../components/ui/input'
import { Label }    from '../../components/ui/label'
import { Store, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [correo,   setCorreo]   = useState('')
  const [password, setPassword] = useState('')
  const [verPass,  setVerPass]  = useState(false)
  const [error,    setError]    = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      const usuario = await login(correo, password)
      // Redirigir según rol
      if (usuario.rol === 'TECNICO') {
        navigate('/admin/boletas', { replace: true })
      } else {
        navigate('/admin/dashboard', { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al iniciar sesión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-md w-full max-w-sm p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <div className="bg-blue-600 text-white rounded-xl p-3 mb-3">
            <Store size={28} />
          </div>
          <h1 className="text-xl font-bold text-slate-800">OmniHub T&K</h1>
          <p className="text-sm text-slate-500 mt-0.5">Panel administrativo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="correo">Correo electrónico</Label>
            <Input
              id="correo"
              type="email"
              placeholder="usuario@empresa.com"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={verPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setVerPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={cargando}>
            {cargando ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-6">
          ¿Problema para ingresar? Contacta al administrador.
        </p>
      </div>
    </div>
  )
}
