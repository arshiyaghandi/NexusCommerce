import { Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import type { OrderStatus } from '../types';

function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'PENDING': return '#f59e0b';
    case 'CONFIRMED': return '#3b82f6';
    case 'COMPLETED': return '#10b981';
    case 'CANCELLED':
    case 'REJECTED': return '#ef4444';
    default: return 'var(--text-light)';
  }
}

function StepIcon({ status, step }: { status: OrderStatus; step: 'pending' | 'processing' | 'completed' }) {
  const isActive = (() => {
    switch (step) {
      case 'pending': return ['PENDING', 'CONFIRMED', 'COMPLETED'].includes(status);
      case 'processing': return ['CONFIRMED', 'COMPLETED'].includes(status) || ['REJECTED', 'CANCELLED'].includes(status);
      case 'completed': return status === 'COMPLETED';
    }
  })();
  const isFailed = step === 'processing' && ['REJECTED', 'CANCELLED'].includes(status);
  const bgColor = isActive ? (isFailed ? '#ef4444' : step === 'completed' ? '#10b981' : '#3b82f6') : 'var(--glass-bg)';
  const borderColor = isActive ? (isFailed ? '#ef4444' : step === 'completed' ? '#10b981' : '#3b82f6') : 'var(--glass-border)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, gap: '0.5rem' }}>
      <div
        style={{
          width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: bgColor, border: `2px solid ${borderColor}`,
          color: isActive ? '#fff' : 'var(--text-muted)',
        }}
      >
        {step === 'pending' && <Clock size={16} />}
        {step === 'processing' && (isFailed ? <XCircle size={16} /> : <Package size={16} />)}
        {step === 'completed' && <CheckCircle size={16} />}
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: '500', color: isActive ? '#fff' : 'var(--text-muted)' }}>
        {step === 'pending' ? 'Placed' : step === 'processing' ? (isFailed ? 'Failed' : 'Processing') : 'Completed'}
      </span>
    </div>
  );
}

export default function Orders() {
  const { data: orders, isLoading } = useOrders();

  if (isLoading) return <div className="text-center mt-4 text-muted">Loading orders...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>Your Orders</h2>

      {!orders || orders.length === 0 ? (
        <div className="glass" style={{ padding: '3rem', textAlign: 'center' }}>
          <p className="text-muted" style={{ fontSize: '1.25rem' }}>You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
          {orders.map((order) => (
            <div key={order.id} className="glass" style={{ padding: '1.5rem' }}>
              <div className="flex-between" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span className="text-muted" style={{ fontSize: '0.875rem' }}>Order ID: #{order.id}</span>
                  <div style={{ marginTop: '0.25rem', fontWeight: '500' }}>{new Date(order.createdAt).toLocaleString()}</div>
                </div>
              </div>

              {/* Stepper */}
              <div style={{ marginBottom: '2rem', padding: '1rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute', top: '50%', left: '10%', right: '10%', height: '2px',
                      background: 'var(--glass-border)', zIndex: 0, transform: 'translateY(-50%)',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        background: getStatusColor(order.status),
                        width: order.status === 'COMPLETED' ? '100%' : order.status === 'CONFIRMED' ? '50%' : '0%',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                  <StepIcon status={order.status} step="pending" />
                  <StepIcon status={order.status} step="processing" />
                  <StepIcon status={order.status} step="completed" />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                {order.items.map((line, idx) => (
                  <div key={idx} className="flex-between" style={{ marginBottom: '0.5rem' }}>
                    <span className="text-muted">Product #{line.productId} x {line.quantity}</span>
                    <span>${(line.unitPrice * line.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div
                className="flex-between"
                style={{
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px dashed var(--glass-border)',
                  fontWeight: '600',
                  fontSize: '1.125rem',
                }}
              >
                <span>Total</span>
                <span style={{ color: 'var(--accent-primary)' }}>${order.totalPrice}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
