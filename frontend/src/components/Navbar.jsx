// src/components/Navbar.jsx
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchCart } from '../api'
import { ShoppingCart, Grid3x3, Menu, X } from 'lucide-react'
import { useState } from 'react'
import '../styles/Navbar.css'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Obtener cantidad de items en el carrito
  const { data } = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
  })

  const cartCount = data?.data?.reduce((sum, item) => sum + item.quantity, 0) || 0

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
          <Link 
            to="/" 
            className="mobile-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Inicio
          </Link>
          <Link 
            to="/categorias" 
            className="mobile-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Grid3x3 size={18} />
            Categorías
          </Link>
          <Link 
            to="/cart" 
            className="mobile-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            <ShoppingCart size={18} />
            Carrito {cartCount > 0 && `(${cartCount})`}
          </Link>
        </div>
      )}
    </nav>
  )
}