// src/App.jsx
import { Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import ProductDetail from './components/ProductDetail'
import Cart from './components/Cart'
import Navbar from './components/Navbar'
import Categorias from './components/Categorias'
import ProductosPorCategoria from './components/ProductosPorCategoria'
import Login from './components/Login'
import Register from './components/Register'
import ProtectedRoute from './components/ProtectedRoute'
import PaymentSuccess from './components/PaymentSuccess'
import OrderHistory from './components/OrderHistory'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/producto/:id" element={<ProductDetail />} />
        <Route path="/categorias" element={<Categorias />} />
        <Route path="/categoria/:id" element={<ProductosPorCategoria />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />

        {/* Rutas protegidas */}
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/history"
          element={
            <ProtectedRoute>
              <OrderHistory />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}