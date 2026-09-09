import { useAdminOrders } from '../../hooks/useOrders';

export default function AdminOrders() {
  const { data: orders = [], isLoading } = useAdminOrders();

  const statusStyle = (status: string) => ({
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.85rem',
    background: status === 'COMPLETED'
      ? 'rgba(16,185,129,0.1)'
      : status === 'CANCELLED' || status === 'REJECTED'
        ? 'rgba(239,68,68,0.1)'
        : 'rgba(245,158,11,0.1)',
    color: status === 'COMPLETED'
      ? '#10b981'
      : status === 'CANCELLED' || status === 'REJECTED'
        ? '#ef4444'
        : '#f59e0b',
  });

  if (isLoading) return <div className="text-muted">Loading orders...</div>;

  return (
    <div className="glass" style={{ padding: '2rem' }}>
      <h3 style={{ marginBottom: '1.5rem' }}>All Platform Orders</h3>
      {orders.length === 0 ? (
        <p className="text-muted">No orders found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                {['Order ID', 'User ID', 'Total Price', 'Status', 'Date'].map(h => (
                  <th key={h} style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem' }}>#{order.id}</td>
                  <td style={{ padding: '1rem' }}>{order.userId}</td>
                  <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--accent-primary)' }}>${order.totalPrice}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={statusStyle(order.status)}>{order.status}</span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{new Date(order.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
