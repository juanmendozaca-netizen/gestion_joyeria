// src/components/Categorias.jsx
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchCategorias, fetchProductosByCategoria } from '../api'
import { Package } from 'lucide-react'
import '../styles/Categorias.css'

export default function Categorias() {
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['categorias'],
    queryFn: fetchCategorias
  })

  const categorias = data?.data || []

  const prefetchProductos = (id) => {
    queryClient.prefetchQuery({
      queryKey: ['productos-categoria', id],
      queryFn: () => fetchProductosByCategoria(id)
    })
  }

  if (isLoading) return <div className="loading">Cargando categorías...</div>
  if (isError) return <div className="error">Error al cargar las categorías.</div>

  return (
    <div className="categorias-container">
      <div className="categorias-header">
        <h1 className="categorias-title">Explora Nuestras Categorías</h1>
        <p className="categorias-subtitle">
          Encuentra el accesorio perfecto para cada ocasión
        </p>
      </div>

      <div className="categorias-grid">
        {categorias.map((cat) => (
          <Link
            key={cat.id}
            to={`/categoria/${cat.id}`}
            onMouseEnter={() => prefetchProductos(cat.id)}
            className="categoria-card"
          >
            <div className="categoria-icon">
              {cat.nombre.charAt(0).toUpperCase()}
            </div>
            <h2 className="categoria-nombre">{cat.nombre}</h2>
            {cat.descripcion && (
              <p className="categoria-descripcion">{cat.descripcion}</p>
            )}
            <div className="categoria-count">
              <Package size={16} />
              <span>{cat.productos?.length || 0} productos</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}