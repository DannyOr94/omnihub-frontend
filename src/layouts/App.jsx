import { AuthProvider } from './context/AuthContext'
import AppRouter        from './router/AppRouter'
import { Toaster }      from './components/ui/sonner'

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  )
}
