// src/api.js
import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ✅ Función para obtener el CSRF token de las cookies
function getCookie(name) {
  let cookieValue = null
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
        break
      }
    }
  }
  return cookieValue
}

// ✅ Interceptor para añadir CSRF token a cada petición
API.interceptors.request.use(
  (config) => {
    // Obtener token CSRF de las cookies
    const csrfToken = getCookie('csrftoken')
    
    // Si existe, añadirlo al header
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken
    }
    
    if (import.meta.env.DEV) {
      console.log('📤 Request:', config.method?.toUpperCase(), config.url)
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor de respuesta (para debugging)
if (import.meta.env.DEV) {
  API.interceptors.response.use(
    (response) => {
      console.log('📥 Response:', response.status, response.config.url)
      return response
    },
    (error) => {
      console.error('❌ API Error:', error.response?.data || error.message)
      return Promise.reject(error)
    }
  )
}

// =============== Productos ===============
export const fetchProductos = () => API.get('/productos/')
export const fetchProductoById = (id) => API.get(`/productos/${id}/`)

// =============== Categorías ===============
export const fetchCategorias = () => API.get('/categorias/')
export const fetchProductosByCategoria = (categoriaId) =>
  API.get(`/productos/?categoria=${categoriaId}`)

// =============== Carrito ===============
export const fetchCart = () => API.get('/cart/')
export const addToCart = (product_id, quantity = 1) =>
  API.post('/cart/', { product_id, quantity })
export const updateCartItem = (id, quantity) =>
  API.patch(`/cart/${id}/`, { quantity })
export const removeCartItem = (id) => API.delete(`/cart/${id}/`)

// =============== Autenticación ===============
export const registerUser = (data) => API.post('/auth/register/', data)
export const loginUser = (data) => API.post('/auth/login/', data)
export const logoutUser = () => API.post('/auth/logout/')
export const fetchUserProfile = () => API.get('/auth/profile/')
export const checkAuthStatus = () => API.get('/auth/check/')

// =============== Órdenes (historial) ===============
export const fetchUserOrders = () => API.get('/orders/history/')

// =============== Pagos: Stripe ===============
export const createStripeCheckoutSession = () => 
  API.post('/payments/stripe/create-checkout-session/')

// ✅ NUEVA: Confirmar pago después de éxito
export const confirmStripePayment = (sessionId) =>
  API.post('/payments/stripe/confirm-payment/', { session_id: sessionId })

export default API