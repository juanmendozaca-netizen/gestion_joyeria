// src/components/Home.jsx
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchProductos, fetchProductoById } from '../api'
import { Search } from 'lucide-react'
import { useState, useMemo } from 'react'
import '../styles/Home.css'

export default function Home() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['productos'],
    queryFn: fetchProductos,
  })

  const productos = data?.data || []

  // ✅ Filtrado de productos por búsqueda
  const filteredProductos = useMemo(() => {
    if (!searchTerm.trim()) return productos
    
    const search = searchTerm.toLowerCase()
    return productos.filter(p => 
      p.nombre.toLowerCase().includes(search) ||
      p.descripcion.toLowerCase().includes(search)
    )
  }, [productos, searchTerm])

  if (isLoading) return <div className="home-container">Cargando productos...</div>
  if (isError) return <div className="home-container">Error al cargar los productos.</div>

  return (
    <div className="home-container">
      <div className="home-header">
        <h1 className="home-title">Joyería y Accesorios</h1>
        <p className="home-subtitle">Descubre nuestra exclusiva colección</p>
        
        {/* ✅ Barra de búsqueda */}
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="search-clear"
              aria-label="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        {searchTerm && (
          <p className="search-results">
            {filteredProductos.length} resultado{filteredProductos.length !== 1 ? 's' : ''} encontrado{filteredProductos.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {filteredProductos.length === 0 ? (
        <div className="no-results">
          <p>No se encontraron productos que coincidan con "{searchTerm}"</p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProductos.map((producto) => (
            <div key={producto.id} className="product-card">
              <Link
                to={`/producto/${producto.id}`}
                onMouseEnter={() => {
                  queryClient.prefetchQuery({
                    queryKey: ['producto', producto.id],
                    queryFn: () => fetchProductoById(producto.id),
                  })
                }}
              >
                <img
                  src={producto.imagen || `https://picsum.photos/250/250?random=${producto.id}`}
                  alt={producto.nombre}
                  className="product-image"
                />
              </Link>

              <div className="product-info">
                <h2 className="product-name">{producto.nombre}</h2>

                {producto.descuento > 0 && (
                  <span className="discount-badge">-{producto.descuento}%</span>
                )}

                <div className="product-pricing">
                  {producto.descuento > 0 ? (
                    <>
                      <span className="product-price-original">
                        ${producto.precio}
                      </span>
                      <span className="product-price">
                        ${(producto.precio * (1 - producto.descuento / 100)).toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="product-price">${producto.precio}</span>
                  )}
                </div>

                <Link
                  to={`/producto/${producto.id}`}
                  onMouseEnter={() => {
                    queryClient.prefetchQuery({
                      queryKey: ['producto', producto.id],
                      queryFn: () => fetchProductoById(producto.id),
                    })
                  }}
                  className="product-link"
                >
                  Ver detalles
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}