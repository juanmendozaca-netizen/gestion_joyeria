// src/components/Register.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Mail, Lock, User, Phone, Map, Home, Eye, EyeOff } from 'lucide-react'
import '../styles/Auth.css'

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigo_postal: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const { register, isRegistering } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await register(formData)
      alert('¡Registro exitoso! Ahora puedes iniciar sesión.')
      navigate('/login')
    } catch (error) {
      const errors = error.response?.data
      if (errors) {
        alert(Object.values(errors).flat().join('\n'))
      } else {
        alert('Error al registrar. Intenta más tarde.')
      }
      console.error(error)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Crear Cuenta</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-row">
            <div className="auth-input-group">
              <User size={18} className="auth-input-icon" />
              <input
                type="text"
                name="first_name"
                placeholder="Nombre"
                value={formData.first_name}
                onChange={handleChange}
                className="auth-input"
              />
            </div>
            <div className="auth-input-group">
              <User size={18} className="auth-input-icon" />
              <input
                type="text"
                name="last_name"
                placeholder="Apellido"
                value={formData.last_name}
                onChange={handleChange}
                className="auth-input"
              />
            </div>
          </div>

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
            <Mail size={18} className="auth-input-icon" />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
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

          <div className="auth-input-group">
            <Lock size={18} className="auth-input-icon" />
            <input
              type="password"
              name="password_confirm"
              placeholder="Confirmar contraseña"
              value={formData.password_confirm}
              onChange={handleChange}
              required
              className="auth-input"
            />
          </div>

          {/* Información opcional de perfil */}
          <div className="auth-input-group">
            <Phone size={18} className="auth-input-icon" />
            <input
              type="text"
              name="telefono"
              placeholder="Teléfono (opcional)"
              value={formData.telefono}
              onChange={handleChange}
              className="auth-input"
            />
          </div>

          <div className="auth-input-group">
            <Map size={18} className="auth-input-icon" /> {/* ✅ Usa Map en lugar de MapPin */}
            <input
              type="text"
              name="ciudad"
              placeholder="Ciudad"
              value={formData.ciudad}
              onChange={handleChange}
              className="auth-input"
            />
          </div>

          <div className="auth-input-group">
            <Home size={18} className="auth-input-icon" />
            <input
              type="text"
              name="direccion"
              placeholder="Dirección"
              value={formData.direccion}
              onChange={handleChange}
              className="auth-input"
            />
          </div>

          <div className="auth-input-group">
            <input
              type="text"
              name="codigo_postal"
              placeholder="Código postal"
              value={formData.codigo_postal}
              onChange={handleChange}
              className="auth-input"
            />
          </div>

          <button
            type="submit"
            disabled={isRegistering}
            className="auth-submit-btn"
          >
            {isRegistering ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>
        <p className="auth-footer">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="auth-link">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}