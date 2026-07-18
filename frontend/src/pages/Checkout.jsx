import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, placeOrder } from '../services/api';
import { useToast } from '../components/Toast';
import { CreditCard, MapPin, Loader2, ShoppingBag } from 'lucide-react';

export default function Checkout() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [address, setAddress] = useState({ fullName: '', street: '', city: '', zip: '' });
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await getCart();
      setCartItems(response.data || []);
    } catch (err) {
      addToast('Failed to load cart', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      addToast('Cart is empty', 'error');
      return;
    }

    setPlacingOrder(true);
    try {
      await placeOrder();
      addToast('Order placed! Processing payment via Saga...', 'success');
      navigate('/orders');
    } catch (err) {
      addToast('Failed to place order. Please try again.', 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
      <Loader2 size={32} className="spin" style={{ margin: '0 auto 1rem' }} />
      <p>Loading checkout...</p>
    </div>
  );

  const total = cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  return (
    <div className="animate-fade-in-up">
      <h2 style={{ marginBottom: '2rem', fontSize: '2rem' }}>Checkout</h2>

      <div className="grid grid-cols-2">
        {/* Order Summary */}
        <div className="glass" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShoppingBag size={22} color="var(--accent-primary)" />
            Order Summary
          </h3>

          {cartItems.length === 0 ? (
            <p className="text-muted">Your cart is empty.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {cartItems.map((item) => (
                <div key={item.productId} className="flex-between" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
                  <span className="text-muted">{item.productName} × {item.quantity}</span>
                  <span style={{ fontWeight: '600' }}>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex-between" style={{ paddingTop: '0.75rem', fontSize: '1.25rem', fontWeight: '700' }}>
                <span>Total</span>
                <span style={{ color: 'var(--accent-primary)' }}>${total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Shipping & Payment Form */}
        <div className="glass" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MapPin size={22} color="var(--accent-primary)" />
            Shipping Information
          </h3>

          <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '500' }}>Full Name</label>
              <input
                type="text"
                name="fullName"
                required
                value={address.fullName}
                onChange={handleInputChange}
                placeholder="John Doe"
                style={{
                  width: '100%', padding: '0.875rem 1rem',
                  background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', color: 'white', fontSize: '1rem',
                  outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '500' }}>Street Address</label>
              <input
                type="text"
                name="street"
                required
                value={address.street}
                onChange={handleInputChange}
                placeholder="123 Main St"
                style={{
                  width: '100%', padding: '0.875rem 1rem',
                  background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', color: 'white', fontSize: '1rem',
                  outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '500' }}>City</label>
                <input
                  type="text"
                  name="city"
                  required
                  value={address.city}
                  onChange={handleInputChange}
                  placeholder="Tehran"
                  style={{
                    width: '100%', padding: '0.875rem 1rem',
                    background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px', color: 'white', fontSize: '1rem',
                    outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '500' }}>ZIP Code</label>
                <input
                  type="text"
                  name="zip"
                  required
                  value={address.zip}
                  onChange={handleInputChange}
                  placeholder="12345"
                  style={{
                    width: '100%', padding: '0.875rem 1rem',
                    background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px', color: 'white', fontSize: '1rem',
                    outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Payment info notice */}
            <div style={{
              padding: '1rem 1.25rem',
              background: 'rgba(108, 92, 231, 0.1)',
              border: '1px solid rgba(108, 92, 231, 0.3)',
              borderRadius: '12px'
            }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--accent-primary)' }}>
                💳 Payment is processed automatically and securely via the NexusCommerce Saga pipeline.
              </p>
            </div>

            <button
              type="submit"
              disabled={placingOrder || cartItems.length === 0}
              className="btn btn-primary"
              style={{
                width: '100%', padding: '1rem', fontSize: '1.05rem',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
                opacity: (placingOrder || cartItems.length === 0) ? 0.6 : 1,
                cursor: (placingOrder || cartItems.length === 0) ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 32px rgba(108, 92, 231, 0.4)'
              }}
            >
              {placingOrder ? (
                <><Loader2 size={20} className="spin" /> Processing...</>
              ) : (
                <><CreditCard size={20} /> Pay ${total.toFixed(2)}</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
