// src/components/Cart.jsx
import { useCart } from '../context/CartContext';
import '../styles/Cart.css';

export default function Cart() {
  const { cart } = useCart();

  return (
    <div className="cart-container">
      <h1 className="cart-title">Carrito de Compras</h1>

      {cart.length === 0 ? (
        <p className="cart-message">
          Tu carrito está vacío. ¡Agrega algunos productos!
        </p>
      ) : (
        <div className="cart-items">
          {cart.map((item) => (
            <div key={item.id} className="cart-item">
              <img
                src={item.imagen || `https://picsum.photos/100/100?random=${item.id}`}
                alt={item.nombre}
                className="cart-item-image"
              />
              <div className="cart-item-info">
                <h3 className="cart-item-name">{item.nombre}</h3>
                <p className="cart-item-price">${item.precio} x {item.quantity}</p>
                <p className="cart-item-total">
                  Subtotal: ${(item.precio * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
          <div className="cart-total">
            <strong>Total: ${cart.reduce((sum, item) => sum + item.precio * item.quantity, 0).toFixed(2)}</strong>
          </div>
        </div>
      )}
    </div>
  );
}