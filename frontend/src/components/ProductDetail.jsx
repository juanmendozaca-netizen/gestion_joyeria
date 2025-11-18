// src/components/ProductDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProductoById } from '../api';
import { useCart } from '../context/CartContext'; // 👈 Importa el hook
import '../styles/ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const [producto, setProducto] = useState(null);
  const navigate = useNavigate();
  const { addToCart } = useCart(); // 👈 Usa el contexto

  useEffect(() => {
    fetchProductoById(id).then(res => setProducto(res.data));
  }, [id]);

  const handleAddToCart = () => {
    if (producto) {
      addToCart(producto); // 👈 Añade el producto completo
      alert(`"${producto.nombre}" añadido al carrito`);
      navigate('/cart');
    }
  };

  if (!producto) return <div className="detail-container">Cargando...</div>;

  return (
    <div className="detail-container">
      <a href="#" onClick={(e) => { e.preventDefault(); navigate(-1); }} className="back-button">
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
          <p className="detail-price">Precio: ${producto.precio}</p>
          <p className={`detail-stock`}>
            {producto.stock > 0
              ? `Stock disponible: ${producto.stock}`
              : 'Agotado'}
          </p>
          <button
            onClick={handleAddToCart}
            disabled={producto.stock <= 0}
            className="detail-button"
          >
            {producto.stock > 0 ? 'Añadir al carrito' : 'Sin stock'}
          </button>
        </div>
      </div>
    </div>
  );
}