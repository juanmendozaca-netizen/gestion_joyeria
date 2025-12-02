// src/components/PaymentSuccess.jsx
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { confirmStripePayment } from '../api'
import '../styles/PaymentSuccess.css'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [orderData, setOrderData] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (!sessionId) {
      navigate('/cart')
      return
    }

    // Confirmar el pago y crear la orden
    const confirmPayment = async () => {
      try {
        const response = await confirmStripePayment(sessionId)
        setOrderData(response.data.order)
        setStatus('success')
        
        // Invalidar caché del carrito y órdenes
        queryClient.invalidateQueries({ queryKey: ['cart'] })
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        
      } catch (error) {
        console.error('Error al confirmar pago:', error)
        setErrorMessage(error.response?.data?.error || 'Error al confirmar el pago')
        setStatus('error')
      }
    }

    confirmPayment()
  }, [searchParams, navigate, queryClient])

  if (status === 'loading') {
    return (
      <div className="payment-success-container">
        <Loader2 className="loading-icon" />
        <h1>Procesando tu pago...</h1>
        <p>Por favor espera un momento.</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="payment-success-container">
        <AlertCircle className="error-icon" />
        <h1>Error al Procesar el Pago</h1>
        <p>{errorMessage}</p>
        <button 
          onClick={() => navigate('/cart')} 
          className="success-home-btn"
        >
          Volver al Carrito
        </button>
      </div>
    )
  }

  return (
    <div className="payment-success-container">
      <CheckCircle className="success-icon" />
      <h1>¡Pago Exitoso!</h1>
      <p>Tu pedido ha sido procesado correctamente.</p>
      
      {orderData && (
        <div className="order-summary-box">
          <h2>Orden #{orderData.numero_orden}</h2>
          <p className="order-total">Total pagado: <strong>${Number(orderData.total).toFixed(2)}</strong></p>
        </div>
      )}
      
      <div className="success-actions">
        <button 
          onClick={() => navigate('/orders/history')} 
          className="success-orders-btn"
        >
          Ver Mi Historial
        </button>
        <button 
          onClick={() => navigate('/')} 
          className="success-home-btn"
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  )
}