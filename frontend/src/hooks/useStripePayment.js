// src/hooks/useStripePayment.js
// ✅ Usar la URL que genera Stripe directamente

import { createStripeCheckoutSession } from '../api'

export const useStripePayment = () => {
  const redirectToCheckout = async () => {
    try {
      console.log('🔵 Iniciando pago con Stripe...')
      
      // Crear sesión en el backend
      const response = await createStripeCheckoutSession()
      console.log('🔍 Respuesta del backend:', response.data)
      
      const { sessionId, url } = response.data
      
      console.log('✅ Session ID:', sessionId)
      console.log('✅ URL de Stripe:', url)
      
      // ✅ USAR LA URL QUE GENERA STRIPE (no construir manualmente)
      if (url) {
        console.log('🔵 Redirigiendo a URL de Stripe...')
        window.location.href = url
      } else {
        // Fallback: construir URL manualmente
        console.log('⚠️ No hay URL, construyendo manualmente...')
        window.location.href = `https://checkout.stripe.com/c/pay/${sessionId}`
      }
      
    } catch (error) {
      console.error('🛑 Error completo:', error)
      console.error('🛑 Response:', error.response)
      
      if (error.response?.data?.error) {
        alert(`Error: ${error.response.data.error}`)
      } else if (error.response?.status === 400) {
        alert('Error: Tu carrito está vacío. Añade productos antes de pagar.')
      } else if (error.response?.status === 401) {
        alert('Error: Debes iniciar sesión para realizar el pago.')
      } else {
        alert('Error al procesar el pago. Verifica tu conexión.')
      }
    }
  }

  return { redirectToCheckout }
}