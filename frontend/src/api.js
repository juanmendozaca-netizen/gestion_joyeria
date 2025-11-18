// src/api.js
import axios from 'axios'

const API_BASE = 'http://127.0.0.1:8000/api'

export const fetchProductos = () => axios.get(`${API_BASE}/productos/`)
export const fetchProductoById = (id) => axios.get(`${API_BASE}/productos/${id}/`)