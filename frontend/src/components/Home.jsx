// src/components/Home.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchProductos } from '../api'
import '../styles/Home.css'

export default function Home() {
  const [productos, setProductos] = useState([])

  useEffect(() => {
    fetchProductos().then(res => setProductos(res.data))
  }, [])

  return (
    <div className="home-container">
      <h1 className="home-title">Joyería y Accesorios</h1>
      <div className="products-grid">
        {productos.map(producto => (
          <div key={producto.id} className="product-card">
            <img
              src={producto.imagen || `https://picsum.photos/250/250?random=${producto.id}`}
              alt={producto.nombre}
              className="product-image"
            />
            <div className="product-info">
              <h2 className="product-name">{producto.nombre}</h2>
              <p className="product-price">${producto.precio}</p>
              <Link to={`/producto/${producto.id}`} className="product-link">
                Ver detalles
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}