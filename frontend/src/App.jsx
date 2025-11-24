// src/App.jsx
import { Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import ProductDetail from './components/ProductDetail'
import Cart from './components/Cart'
import Navbar from './components/Navbar'
import Categorias from './components/Categorias'
import ProductosPorCategoria from './components/ProductosPorCategoria'


export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/producto/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/categorias" element={<Categorias />} />
        <Route path="/categoria/:id" element={<ProductosPorCategoria />} />
      </Routes>
    </div>
  )
}