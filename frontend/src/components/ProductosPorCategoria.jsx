// src/components/ProductosPorCategoria.jsx
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchProductosByCategoria, fetchProductoById } from '../api'
import { ArrowLeft } from 'lucide-react'
import '../styles/ProductosPorCategoria.css'

export default function ProductosPorCategoria() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['productos-categoria', id],
    queryFn: () => fetchProductosByCategoria(id)
  })

  const productos = data?.data || []

  const prefetchProducto = (productId) => {
    queryClient.prefetchQuery({
      queryKey: ['producto', productId],
      queryFn: () => fetchProductoById(productId)
    })
  }

  if (isLoading) return <div className="loading">Cargando productos...</div>
  if (isError) return <div className="error">Error al cargar los productos.</div>

  return (
    <div className="productos-categoria-container">
      <div className="productos-categoria-header">
        <button 
          onClick={() => navigate('/categorias')} 
          className="back-link"
        >
          <ArrowLeft size={20} />
          Volver a Categorías
        </button>
        <h1 className="productos-categoria-title">Productos de la Categoría</h1>
        <p className="productos-categoria-count">
          {productos.length} producto{productos.length !== 1 ? 's' : ''} disponible{productos.length !== 1 ? 's' : ''}
        </p>
      </div>

      {productos.length === 0 ? (
        <div className="empty-state">
          <h2 className="empty-state-title">No hay productos en esta categoría</h2>
          <p>Vuelve pronto para ver nuevos productos</p>
        </div>
      ) : (
        <div className="productos-categoria-grid">
          {productos.map((p) => (
            <div 
              key={p.id} 
              className="producto-categoria-card"
              onMouseEnter={() => prefetchProducto(p.id)}
            >
              <img
                src={p.imagen || `https://picsum.photos/250/250?random=${p.id}`}
                alt={p.nombre}
                className="producto-categoria-image"
                onClick={() => navigate(`/producto/${p.id}`)}
              />
              <div className="producto-categoria-info">
                <h3 className="producto-categoria-nombre">{p.nombre}</h3>
                <p className="producto-categoria-precio">${p.precio}</p>
                <button
                  onClick={() => navigate(`/producto/${p.id}`)}
                  className="producto-categoria-link"
                >
                  Ver Detalles
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}