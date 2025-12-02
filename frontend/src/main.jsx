// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartProvider } from './context/CartContext';
import App from './App';
import './index.css';
import axios from 'axios';

const queryClient = new QueryClient();

// ✅ Obtener CSRF token al cargar la aplicación
axios.get('http://localhost:8000/api/auth/csrf/', { withCredentials: true })
  .then(() => {
    console.log('✅ CSRF token obtenido');
  })
  .catch((error) => {
    console.error('❌ Error al obtener CSRF token:', error);
  });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <CartProvider>
          <App />
        </CartProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);