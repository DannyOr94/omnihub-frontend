import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth }  from '../../context/AuthContext'
import { Button }   from '../../components/ui/button'
import { Input }    from '../../components/ui/input'
import { Label }    from '../../components/ui/label'
import { Store, Eye, EyeOff, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const { login }  = useAuth()
  const navigate   = useNavigate()

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
      if (usuario.rol === 'TECNICO') {
        navigate('/admin/boletas', { replace: true })
      } else {
        navigate('/admin/dashboard', { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'Correo o contraseña incorrectos')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center px-4">

      {/* Volver al inicio */}
      <Link
        to="/"
        className="fixed top-4 left-4 flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
      >
        <ArrowLeft size={14} /> Volver al inicio
      </Link>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <Store size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">OmniHub T&K</h1>
          <p className="text-sm text-slate-400 mt-0.5">Acceso para empleados</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="correo" className="text-slate-700">Correo electrónico</Label>
            <Input
              id="correo"
              type="email"
              placeholder="usuario@empresa.com"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
              required
              autoFocus
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-slate-700">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={verPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="pr-10 h-11"
              />
              <button
                type="button"
                onClick={() => setVerPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 text-base font-semibold"
            disabled={cargando}
          >
            {cargando ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Ingresando…
              </span>
            ) : 'Ingresar'}
          </Button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-6">
          ¿Problemas para ingresar? Contacta al administrador del sistema.
        </p>
      </div>
    </div>
  )
}
