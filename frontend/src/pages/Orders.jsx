import { useState, useEffect } from 'react';
import { getOrders } from '../services/api';
import { Package, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    getOrders()
      .then(res => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch orders", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
    // Poll every 5 seconds to see status changes from the Saga
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Clock size={18} color="#f59e0b" />;
      case 'COMPLETED': return <CheckCircle size={18} color="#10b981" />;
      case 'CANCELLED': 
      case 'REJECTED': return <XCircle size={18} color="#ef4444" />;
      default: return <Package size={18} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#f59e0b';
      case 'COMPLETED': return '#10b981';
      case 'CANCELLED': 
      case 'REJECTED': return '#ef4444';
      default: return 'var(--text-light)';
    }
  };

  if (loading) return <div className="text-center mt-4 text-muted">Loading orders...</div>;

  return (
    <div>
      <h2 style={{marginBottom: '2rem'}}>Your Orders</h2>
      
      {orders.length === 0 ? (
        <div className="glass" style={{padding: '3rem', textAlign: 'center'}}>
          <p className="text-muted" style={{fontSize: '1.25rem'}}>You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2">
          {orders.map(order => (
            <div key={order.id} className="glass" style={{padding: '1.5rem'}}>
              <div className="flex-between" style={{marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem'}}>
                <div>
                  <span className="text-muted" style={{fontSize: '0.875rem'}}>Order ID: #{order.id}</span>
                  <div style={{marginTop: '0.25rem'}}>{new Date(order.createdAt).toLocaleString()}</div>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: getStatusColor(order.status), fontWeight: '500'}}>
                  {getStatusIcon(order.status)}
                  {order.status}
                </div>
              </div>
              
              <div style={{marginBottom: '1rem'}}>
                {order.lines && order.lines.map((line, idx) => (
                  <div key={idx} className="flex-between" style={{marginBottom: '0.5rem'}}>
                    <span className="text-muted">Product #{line.productId} × {line.quantity}</span>
                    <span>${line.unitPrice * line.quantity}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex-between" style={{marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--glass-border)', fontWeight: '600', fontSize: '1.125rem'}}>
                <span>Total</span>
                <span style={{color: 'var(--accent-primary)'}}>${order.totalPrice}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
