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
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                  <span className="text-muted" style={{fontSize: '0.875rem'}}>Order ID: #{order.id}</span>
                  <div style={{marginTop: '0.25rem', fontWeight: '500'}}>{new Date(order.createdAt).toLocaleString()}</div>
                </div>
              </div>
              
              {/* Stepper UI */}
              <div style={{ marginBottom: '2rem', padding: '1rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                  {/* Progress Line */}
                  <div style={{ 
                    position: 'absolute', top: '50%', left: '10%', right: '10%', height: '2px', 
                    background: 'var(--glass-border)', zIndex: 0, transform: 'translateY(-50%)'
                  }}>
                    <div style={{
                      height: '100%', background: getStatusColor(order.status),
                      width: order.status === 'COMPLETED' ? '100%' : order.status === 'CONFIRMED' ? '50%' : order.status === 'PENDING' ? '0%' : '100%',
                      transition: 'width 0.5s ease'
                    }}></div>
                  </div>

                  {/* Step 1: PENDING */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, gap: '0.5rem' }}>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: ['PENDING', 'CONFIRMED', 'COMPLETED'].includes(order.status) ? 'var(--accent-primary)' : 'var(--glass-bg)',
                      border: '2px solid', borderColor: ['PENDING', 'CONFIRMED', 'COMPLETED'].includes(order.status) ? 'var(--accent-primary)' : 'var(--glass-border)',
                      color: ['PENDING', 'CONFIRMED', 'COMPLETED'].includes(order.status) ? '#fff' : 'var(--text-muted)'
                    }}>
                      <Clock size={16} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '500', color: ['PENDING', 'CONFIRMED', 'COMPLETED'].includes(order.status) ? '#fff' : 'var(--text-muted)' }}>Placed</span>
                  </div>

                  {/* Step 2: CONFIRMED (or processing) */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, gap: '0.5rem' }}>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: ['CONFIRMED', 'COMPLETED'].includes(order.status) ? '#3b82f6' : (['REJECTED', 'CANCELLED'].includes(order.status) ? '#ef4444' : 'var(--glass-bg)'),
                      border: '2px solid', borderColor: ['CONFIRMED', 'COMPLETED'].includes(order.status) ? '#3b82f6' : (['REJECTED', 'CANCELLED'].includes(order.status) ? '#ef4444' : 'var(--glass-border)'),
                      color: ['CONFIRMED', 'COMPLETED', 'REJECTED', 'CANCELLED'].includes(order.status) ? '#fff' : 'var(--text-muted)'
                    }}>
                      {['REJECTED', 'CANCELLED'].includes(order.status) ? <XCircle size={16} /> : <Package size={16} />}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '500', color: ['CONFIRMED', 'COMPLETED', 'REJECTED', 'CANCELLED'].includes(order.status) ? '#fff' : 'var(--text-muted)' }}>
                      {['REJECTED', 'CANCELLED'].includes(order.status) ? 'Failed' : 'Processing'}
                    </span>
                  </div>

                  {/* Step 3: COMPLETED */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, gap: '0.5rem' }}>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: order.status === 'COMPLETED' ? '#10b981' : 'var(--glass-bg)',
                      border: '2px solid', borderColor: order.status === 'COMPLETED' ? '#10b981' : 'var(--glass-border)',
                      color: order.status === 'COMPLETED' ? '#fff' : 'var(--text-muted)'
                    }}>
                      <CheckCircle size={16} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '500', color: order.status === 'COMPLETED' ? '#fff' : 'var(--text-muted)' }}>Completed</span>
                  </div>
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
