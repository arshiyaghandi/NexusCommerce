import { useNavigate } from 'react-router-dom';
import { Trash2, CreditCard } from 'lucide-react';
import { useCart } from '../hooks/useCart';

export default function Cart() {
  const navigate = useNavigate();
  const { items, isLoading, addItem, removeItem, clearCart } = useCart();

  if (isLoading) return <div className="text-center mt-4 text-muted">Loading cart...</div>;

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h2>Your Cart</h2>
        {items.length > 0 && (
          <button className="btn btn-outline" onClick={() => clearCart()}>
            <Trash2 size={16} /> Clear Cart
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="glass" style={{ padding: '3rem', textAlign: 'center' }}>
          <p className="text-muted" style={{ fontSize: '1.25rem' }}>Your cart is currently empty.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {items.map((item) => (
              <div key={item.productId} className="glass" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ marginBottom: '0.25rem' }}>{item.productName}</h4>
                  <p className="text-muted">Qty: {item.quantity} x ${item.unitPrice}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    className="glass"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '8px',
                    }}
                  >
                    <button
                      onClick={() => {
                        if (item.quantity > 1) {
                          addItem({
                            product: { id: item.productId, skuCode: '', name: item.productName, description: '', price: item.unitPrice },
                            quantity: -1,
                          });
                        } else {
                          removeItem(item.productId);
                        }
                      }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
                    >
                      -
                    </button>
                    <span style={{ padding: '0 0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>{item.quantity}</span>
                    <button
                      onClick={() =>
                        addItem({
                          product: { id: item.productId, skuCode: '', name: item.productName, description: '', price: item.unitPrice },
                          quantity: 1,
                        })
                      }
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
                    >
                      +
                    </button>
                  </div>
                  <span style={{ fontWeight: '600', minWidth: '70px', textAlign: 'right' }}>${(item.quantity * item.unitPrice).toFixed(2)}</span>
                  <button
                    className="btn btn-outline"
                    style={{ padding: '0.5rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    onClick={() => removeItem(item.productId)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="glass" style={{ padding: '2rem', position: 'sticky', top: '100px' }}>
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>Order Summary</h3>
            <div className="flex-between" style={{ marginBottom: '1rem' }}>
              <span className="text-muted">Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <span className="text-muted">Tax (0%)</span>
              <span>$0.00</span>
            </div>
            <div className="flex-between" style={{ marginBottom: '2rem', fontSize: '1.25rem', fontWeight: '600' }}>
              <span>Total</span>
              <span style={{ color: 'var(--accent-primary)' }}>${total.toFixed(2)}</span>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '1rem' }}
              onClick={() => navigate('/checkout')}
            >
              <CreditCard size={18} /> Checkout & Pay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
