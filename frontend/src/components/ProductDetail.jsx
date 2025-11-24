// src/components/ProductDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProductoById, fetchProductos, addToCart as apiAddToCart } from '../api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import '../styles/ProductDetail.css';

export default function ProductDetail() {
  const queryClient = useQueryClient();
  const { id } = useParams();
  const navigate = useNavigate();

  const [producto, setProducto] = useState(null);
  const [productosRecomendados, setProductosRecomendados] = useState([]);

  const addToCartMutation = useMutation({
    mutationFn: (product_id) => apiAddToCart(product_id, 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      alert(`"${producto?.nombre}" añadido al carrito`);
      navigate('/cart');
    },
    onError: (error) => {
      console.error('Error al añadir al carrito:', error);
      alert('No se pudo añadir el producto al carrito. Verifica el stock o intenta más tarde.');
    }
  });

  useEffect(() => {
    const cargarProductoYRecomendados = async () => {
      try {
        const resProducto = await fetchProductoById(id);
        const productoData = resProducto.data;
        setProducto(productoData);

        const resTodos = await fetchProductos();
        const todos = resTodos.data;

        const recomendados = todos
          .filter(p => 
            p.categoria === productoData.categoria && 
            p.id !== productoData.id && 
            p.stock > 0
          )
          .slice(0, 2);

        setProductosRecomendados(recomendados);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };

    cargarProductoYRecomendados();
  }, [id]);

  const handleAddToCart = () => {
    if (producto && producto.stock > 0 && !addToCartMutation.isPending) {
      addToCartMutation.mutate(producto.id);
    }
  };

  if (!producto) return <div className="detail-container">Cargando...</div>;

  return (
    <div className="detail-container">
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          navigate(-1);
        }}
        className="back-button"
      >
        ← Volver
      </a>

      <div className="detail-content">
        <img
          src={producto.imagen || `https://picsum.photos/500/600?random=${producto.id}`}
          alt={producto.nombre}
          className="detail-image"
        />
        <div className="detail-text">
          <h1 className="detail-title">{producto.nombre}</h1>
          <p className="detail-description">{producto.descripcion}</p>
          
          {/* ✅ Mostrar descuento si existe */}
          {producto.tiene_descuento ? (
            <div className="detail-pricing">
              <span className="detail-price-original">${producto.precio}</span>
              <span className="detail-price">${producto.precio_final.toFixed(2)}</span>
              <span className="detail-discount-badge">-{producto.descuento}% OFF</span>
            </div>
          ) : (
            <p className="detail-price">Precio: ${producto.precio}</p>
          )}
          
          {producto.tiene_descuento && (
            <p className="detail-savings">
              ¡Ahorras ${producto.ahorro.toFixed(2)}!
            </p>
          )}
          
          <p className={`detail-stock`}>
            {producto.stock > 0
              ? `Stock disponible: ${producto.stock}`
              : 'Agotado'}
          </p>
          <button
            onClick={handleAddToCart}
            disabled={producto.stock <= 0 || addToCartMutation.isPending}
            className="detail-button"
          >
            {addToCartMutation.isPending
              ? 'Añadiendo...'
              : producto.stock > 0 
                ? 'Añadir al carrito' 
                : 'Sin stock'}
          </button>
        </div>
      </div>

      {/* Sección de productos recomendados */}
      {productosRecomendados.length > 0 && (
        <div className="recommendations-section">
          <h3 className="recommendations-title">Productos recomendados</h3>
          <div className="recommendations-grid">
            {productosRecomendados.map((p) => (
              <div 
                key={p.id} 
                className="recommended-product" 
                onClick={() => navigate(`/producto/${p.id}`)}
              >
                {p.tiene_descuento && (
                  <span className="recommended-badge">-{p.descuento}%</span>
                )}
                <img
                  src={p.imagen || `https://picsum.photos/150/150?random=${p.id}`} 
                  alt={p.nombre}
                  className="recommended-image"
                />
                <h4 className="recommended-name">{p.nombre}</h4>
                {p.tiene_descuento ? (
                  <div className="recommended-pricing">
                    <span className="recommended-price-original">${p.precio}</span>
                    <span className="recommended-price">${p.precio_final.toFixed(2)}</span>
                  </div>
                ) : (
                  <p className="recommended-price">${p.precio}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}