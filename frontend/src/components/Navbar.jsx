// src/components/Navbar.jsx
import { Link } from 'react-router-dom'
import '../styles/Navbar.css'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">Joyería Élite</Link>
        <Link to="/cart" className="navbar-cart">🛒 Carrito</Link>
      </div>
    </nav>
  )
}