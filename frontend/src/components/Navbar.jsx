// src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchCart } from '../api'
import { ShoppingCart, Grid3x3, Menu, X, Package, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import '../styles/Navbar.css'

export default function Navbar() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data } = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
  })
  const { isAuthenticated, logout, user } = useAuth() // ✅ Añadir logout y user
  const cartCount = data?.data?.reduce((sum, item) => sum + item.quantity, 0) || 0

  const closeMobileMenu = () => setMobileMenuOpen(false)

  // ✅ Función para cerrar sesión
  const handleLogout = () => {
    if (window.confirm('¿Cerrar sesión?')) {
      logout()
      navigate('/login')
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          Joyería Élite
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-links">
          <Link to="/" className="navbar-link">
            Inicio
          </Link>
          <Link to="/categorias" className="navbar-link">
            <Grid3x3 size={18} />
            Categorías
          </Link>
          <Link to="/cart" className="navbar-cart">
            <ShoppingCart size={20} />
            <span>Carrito</span>
            {cartCount > 0 && (
              <span className="cart-badge">{cartCount}</span>
            )}
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/orders" className="navbar-link">
                <Package size={18} />
                Mis Compras
              </Link>
              {/* ✅ Botón de logout */}
              <button 
                onClick={handleLogout}
                className="navbar-link navbar-logout"
                title={`Cerrar sesión (${user?.username})`}
              >
                <LogOut size={18} />
                Salir
              </button>
            </>
          ) : (
            // ✅ Mostrar login si no está autenticado
            <Link to="/login" className="navbar-link">
              Iniciar Sesión
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <Link to="/" className="mobile-link" onClick={closeMobileMenu}>
            Inicio
          </Link>
          <Link to="/categorias" className="mobile-link" onClick={closeMobileMenu}>
            <Grid3x3 size={18} />
            Categorías
          </Link>
          <Link to="/cart" className="mobile-link" onClick={closeMobileMenu}>
            <ShoppingCart size={18} />
            Carrito {cartCount > 0 && `(${cartCount})`}
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/orders" className="mobile-link" onClick={closeMobileMenu}>
                <Package size={18} />
                Mis Compras
              </Link>
              <button 
                onClick={() => {
                  handleLogout()
                  closeMobileMenu()
                }}
                className="mobile-link navbar-logout"
              >
                <LogOut size={18} />
                Salir ({user?.username})
              </button>
            </>
          ) : (
            <Link to="/login" className="mobile-link" onClick={closeMobileMenu}>
              Iniciar Sesión
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}