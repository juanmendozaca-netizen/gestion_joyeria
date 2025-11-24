// ✅ src/api.js — SOLUCIÓN: Usar localhost consistentemente
import axios from 'axios'

// ⚠️ IMPORTANTE: Debe ser "localhost", NO "127.0.0.1"
// porque tu frontend está en localhost:5173
const API = axios.create({
  baseURL: 'http://localhost:8000/api',  // ✅ Cambio crítico
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
})

// ✅ Interceptor para debugging
API.interceptors.request.use(
  (config) => {
    console.log('📤 Request:', config.method?.toUpperCase(), config.url)
    console.log('🍪 Cookies:', document.cookie)
    return config
  },
  (error) => Promise.reject(error)
)

API.interceptors.response.use(
  (response) => {
    console.log('📥 Response:', response.status, response.config.url)
    console.log('🍪 Cookies después:', document.cookie)
    return response
  },
  (error) => Promise.reject(error)
)

// Productos
export const fetchProductos = () => API.get('/productos/')
export const fetchProductoById = (id) => API.get(`/productos/${id}/`)

// Categorías
export const fetchCategorias = () => API.get('/categorias/')

// Productos por categoría
export const fetchProductosByCategoria = (categoriaId) => 
  API.get(`/productos/?categoria=${categoriaId}`)

// Carrito
export const fetchCart = () => API.get('/cart/')
export const addToCart = (product_id, quantity = 1) => 
  API.post('/cart/', { product_id, quantity })
export const updateCartItem = (id, quantity) => 
  API.patch(`/cart/${id}/`, { quantity })
export const removeCartItem = (id) => 
  API.delete(`/cart/${id}/`)