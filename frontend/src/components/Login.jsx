// src/components/Login.jsx
import { useState, useEffect } from 'react'  // ✅ Agregar useEffect
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Eye, EyeOff, Lock, User } from 'lucide-react'
import '../styles/Auth.css'

export default function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoggingIn, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // ✅ CORRECTO: navigate dentro de useEffect
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/cart')
    }
  }, [isAuthenticated, navigate])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await login(formData)
      // navigate('/cart') se ejecutará automáticamente por el useEffect cuando isAuthenticated cambie
    } catch (error) {
      alert('Error en el login. Verifica tus credenciales.')
      console.error(error)
    }
  }

  // ✅ Si ya está autenticado, mostrar loading mientras redirige
  if (isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <p>Redirigiendo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Iniciar Sesión</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <User size={18} className="auth-input-icon" />
            <input
              type="text"
              name="username"
              placeholder="Nombre de usuario"
              value={formData.username}
              onChange={handleChange}
              required
              className="auth-input"
            />
          </div>

          <div className="auth-input-group">
            <Lock size={18} className="auth-input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Contraseña"
              value={formData.password}
              onChange={handleChange}
              required
              className="auth-input"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="auth-toggle-password"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="auth-submit-btn"
          >
            {isLoggingIn ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>
        <p className="auth-footer">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="auth-link">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}