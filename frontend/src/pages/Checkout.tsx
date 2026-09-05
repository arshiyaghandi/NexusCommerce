import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, Loader2, ShoppingBag } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { usePlaceOrder } from '../hooks/useOrders';
import { useToast } from '../contexts/ToastContext';
import PageTransition from '../components/PageTransition';
import Confetti from '../components/Confetti';
import AnimatedCounter from '../components/AnimatedCounter';
import { useState } from 'react';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, isLoading } = useCart();
  const placeOrderMutation = usePlaceOrder();
  const { addToast } = useToast();

  const [orderSuccess, setOrderSuccess] = useState(false);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      addToast('Cart is empty', 'error');
      return;
    }
    try {
      await placeOrderMutation.mutateAsync();
      setOrderSuccess(true);
      addToast('Order placed! Processing payment via Saga...', 'success');
      setTimeout(() => navigate('/orders'), 2500); // Wait for confetti before redirecting
    } catch {
      addToast('Failed to place order. Please try again.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        <Loader2 size={32} className="spin" style={{ margin: '0 auto 1rem' }} />
        <p>Loading checkout...</p>
      </div>
    );
  }

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <PageTransition>
      <Confetti active={orderSuccess} />
      <h2 style={{ marginBottom: '2rem', fontSize: '2rem' }}>Checkout</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Order Summary */}
        <div className="glass" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShoppingBag size={22} color="var(--accent-primary)" />
            Order Summary
          </h3>

          {items.length === 0 ? (
            <p className="text-muted">Your cart is empty.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {items.map((item) => (
                <div key={item.productId} className="flex-between" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
                  <span className="text-muted">{item.productName} x {item.quantity}</span>
                  <span style={{ fontWeight: '600' }}>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex-between" style={{ paddingTop: '0.75rem', fontSize: '1.25rem', fontWeight: '700' }}>
                <span>Total</span>
                <span style={{ color: 'var(--accent-primary)' }}>
                  <AnimatedCounter value={total} prefix="$" decimals={2} duration={0.8} />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Payment */}
        <div className="glass" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MapPin size={22} color="var(--accent-primary)" />
            Checkout
          </h3>

          <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              style={{
                padding: '1rem 1.25rem',
                background: 'rgba(108, 92, 231, 0.1)',
                border: '1px solid rgba(108, 92, 231, 0.3)',
                borderRadius: '12px',
              }}
            >
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--accent-primary)' }}>
                Payment is processed automatically and securely via the NexusCommerce Saga pipeline.
              </p>
            </div>

            <button
              type="submit"
              disabled={placeOrderMutation.isPending || items.length === 0 || orderSuccess}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.05rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: placeOrderMutation.isPending || items.length === 0 || orderSuccess ? 0.6 : 1,
                cursor: placeOrderMutation.isPending || items.length === 0 || orderSuccess ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 32px rgba(108, 92, 231, 0.4)',
              }}
            >
              {placeOrderMutation.isPending ? (
                <><Loader2 size={20} className="spin" /> Processing...</>
              ) : orderSuccess ? (
                <>Order Placed!</>
              ) : (
                <><CreditCard size={20} /> Pay ${total.toFixed(2)}</>
              )}
            </button>
          </form>
        </div>
      </div>
    </PageTransition>
  );
}
