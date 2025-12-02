// src/components/OrderHistory.jsx
import { useQuery } from '@tanstack/react-query'
import { fetchUserOrders } from '../api'
import { useAuth } from '../hooks/useAuth'
import { Package, CreditCard, MapPin } from 'lucide-react'
import '../styles/OrderHistory.css'

export default function OrderHistory() {
  const { isAuthenticated } = useAuth()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchUserOrders,
    enabled: isAuthenticated,
  })

  const orders = data?.data || []

  if (isLoading) return <div className="order-history-container">Cargando historial...</div>
  if (isError) return <div className="order-history-container">Error al cargar el historial.</div>
  if (!isAuthenticated) return null

  return (
    <div className="order-history-container">
      <h1 className="order-history-title">Mi Historial de Compras</h1>
      
      {orders.length === 0 ? (
        <p className="no-orders">No has realizado compras aún.</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <h2 className="order-number">Orden #{order.numero_orden}</h2>
                <span className={`order-status status-${order.payment_status}`}>
                  {order.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                </span>
              </div>
              
              <div className="order-info">
                <div className="order-section">
                  <h3><Package size={16} /> Productos</h3>
                  <ul className="order-items">
                    {order.items.map((item) => (
                      <li key={item.id} className="order-item">
                        <span>{item.cantidad}x {item.nombre_producto}</span>
                        <span>${Number(item.subtotal).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="order-section">
                  <h3><MapPin size={16} /> Envío</h3>
                  <p>{order.direccion_envio}</p>
                  <p>{order.ciudad_envio}, {order.codigo_postal_envio}</p>
                  <p>Tel: {order.telefono_envio || 'No especificado'}</p>
                </div>

                <div className="order-summary">
                  <div className="summary-row">
                    <span>Total:</span>
                    <strong>${Number(order.total).toFixed(2)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Método:</span>
                    <span>
                      {order.payment_method === 'stripe' ? (
                        <><CreditCard size={14} /> Tarjeta</>
                      ) : 'Otro'}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Fecha:</span>
                    <span>{new Date(order.fecha_creacion).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}