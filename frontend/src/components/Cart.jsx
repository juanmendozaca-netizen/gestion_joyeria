import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchCart, updateCartItem, removeCartItem } from '../api'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import { useStripePayment } from '../hooks/useStripePayment'
import '../styles/Cart.css'






export default function Cart() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { redirectToCheckout } = useStripePayment() // ✅ Hook de Stripe

  const { data, isLoading, isError } = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
  })

  // ✅ Mutación para actualizar cantidad con optimistic update
  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }) => updateCartItem(id, quantity),
    onMutate: async ({ id, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] })
      const previousCart = queryClient.getQueryData(['cart'])
      queryClient.setQueryData(['cart'], (old) => {
        if (!old?.data) return old
        return {
          ...old,
          data: old.data.map(item => 
            item.id === id 
              ? { 
                  ...item, 
                  quantity, 
                  subtotal: item.product.precio_final * quantity
                }
              : item
          )
        }
      })
      return { previousCart }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['cart'], context.previousCart)
      alert('Error al actualizar cantidad. Intenta de nuevo.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  // ✅ Mutación para eliminar item con optimistic update
  const deleteMutation = useMutation({
    mutationFn: (id) => removeCartItem(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] })
      const previousCart = queryClient.getQueryData(['cart'])
      queryClient.setQueryData(['cart'], (old) => {
        if (!old?.data) return old
        return {
          ...old,
          data: old.data.filter(item => item.id !== id)
        }
      })
      return { previousCart }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['cart'], context.previousCart)
      alert('Error al eliminar producto. Intenta de nuevo.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  const handleIncrement = (item) => {
    const newQuantity = item.quantity + 1
    updateMutation.mutate({ id: item.id, quantity: newQuantity })
  }

  const handleDecrement = (item) => {
    const newQuantity = item.quantity - 1
    if (newQuantity <= 0) {
      deleteMutation.mutate(item.id)
    } else {
      updateMutation.mutate({ id: item.id, quantity: newQuantity })
    }
  }

  const handleDelete = (id) => {
    if (window.confirm('¿Eliminar este producto del carrito?')) {
      deleteMutation.mutate(id)
    }
  }

  const cart = data?.data || []
  const total = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const totalAhorro = cart.reduce((sum, item) => {
    return sum + (item.product.tiene_descuento ? item.product.ahorro * item.quantity : 0)
  }, 0)

  if (isLoading) return <div className="cart-container">Cargando carrito...</div>
  if (isError) return <div className="cart-container">Error al cargar el carrito.</div>

  return (
    <div className="cart-container">
      <h1 className="cart-title">
        <ShoppingBag className="cart-icon" />
        Carrito de Compras
      </h1>
      
      {cart.length === 0 ? (
        <div className="cart-empty">
          <p className="cart-message">Tu carrito está vacío.</p>
          <button 
            onClick={() => navigate('/')} 
            className="cart-continue-btn"
          >
            Continuar Comprando
          </button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.id} className="cart-item">
                <img
                  src={item.product.imagen || `https://picsum.photos/100/100?random=${item.product.id}`}
                  alt={item.product.nombre}
                  className="cart-item-image"
                  onClick={() => navigate(`/producto/${item.product.id}`)}
                />
                
                <div className="cart-item-info">
                  <h3 
                    className="cart-item-name"
                    onClick={() => navigate(`/producto/${item.product.id}`)}
                  >
                    {item.product.nombre}
                  </h3>
                  
                  {item.product.tiene_descuento ? (
                    <div className="cart-item-pricing">
                      <span className="cart-item-price-original">${item.product.precio}</span>
                      <span className="cart-item-price">${item.product.precio_final.toFixed(2)}</span>
                      <span className="cart-item-discount">-{item.product.descuento}%</span>
                    </div>
                  ) : (
                    <p className="cart-item-price">${item.product.precio}</p>
                  )}
                </div>

                <div className="cart-item-controls">
                  <div className="quantity-controls">
                    <button
                      onClick={() => handleDecrement(item)}
                      disabled={updateMutation.isPending}
                      className="quantity-btn"
                      aria-label="Disminuir cantidad"
                    >
                      <Minus size={16} />
                    </button>
                    
                    <span className="quantity-display">{item.quantity}</span>
                    
                    <button
                      onClick={() => handleIncrement(item)}
                      disabled={updateMutation.isPending}
                      className="quantity-btn"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <p className="cart-item-subtotal">
                    ${item.subtotal.toFixed(2)}
                  </p>

                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deleteMutation.isPending}
                    className="delete-btn"
                    aria-label="Eliminar producto"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            {totalAhorro > 0 && (
              <div className="cart-savings">
                <span>🎉 Estás ahorrando:</span>
                <strong className="savings-amount">${totalAhorro.toFixed(2)}</strong>
              </div>
            )}
            <div className="cart-total">
              <span>Total:</span>
              <strong>${total.toFixed(2)}</strong>
            </div>
            {/* ✅ Botón de pago con Stripe */}
            <button 
              onClick={redirectToCheckout}
              disabled={cart.length === 0 || updateMutation.isPending || deleteMutation.isPending}
              className="checkout-btn"
            >
              Pagar con Tarjeta / Apple Pay / Google Pay
            </button>
          </div>
        </>
      )}
    </div>
  )
}