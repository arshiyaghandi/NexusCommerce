import { useState, useEffect } from 'react';
import { getCart, removeFromCart, clearCart, placeOrder } from '../services/api';
import { Trash2, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Cart({ refreshCart }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  const loadCart = () => {
    setLoading(true);
    getCart()
      .then(res => {
        setCartItems(res.data);
        setLoading(false);
        refreshCart();
      })
      .catch(err => {
        console.error("Failed to load cart", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadCart();
  }, []);

  const handleRemove = async (productId) => {
    await removeFromCart(productId);
    loadCart();
  };

  const handleClear = async () => {
    await clearCart();
    loadCart();
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (loading) return <div className="text-center mt-4 text-muted">Loading cart...</div>;

  const total = cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  return (
    <div>
      <div className="flex-between" style={{marginBottom: '2rem'}}>
        <h2>Your Cart</h2>
        {cartItems.length > 0 && (
          <button className="btn btn-outline" onClick={handleClear}>
            <Trash2 size={16} /> Clear Cart
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="glass" style={{padding: '3rem', textAlign: 'center'}}>
          <p className="text-muted" style={{fontSize: '1.25rem'}}>Your cart is currently empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2">
          <div className="cart-items" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            {cartItems.map(item => (
              <div key={item.productId} className="glass" style={{padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                  <h4 style={{marginBottom: '0.25rem'}}>{item.productName}</h4>
                  <p className="text-muted">Qty: {item.quantity} × ${item.unitPrice}</p>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                  <span style={{fontWeight: '600'}}>${item.quantity * item.unitPrice}</span>
                  <button className="btn btn-outline" style={{padding: '0.5rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)'}} onClick={() => handleRemove(item.productId)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="glass" style={{padding: '2rem', position: 'sticky', top: '100px'}}>
              <h3 style={{marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem'}}>Order Summary</h3>
              <div className="flex-between" style={{marginBottom: '1rem'}}>
                <span className="text-muted">Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex-between" style={{marginBottom: '1.5rem'}}>
                <span className="text-muted">Tax (0%)</span>
                <span>$0.00</span>
              </div>
              <div className="flex-between" style={{marginBottom: '2rem', fontSize: '1.25rem', fontWeight: '600'}}>
                <span>Total</span>
                <span style={{color: 'var(--accent-primary)'}}>${total.toFixed(2)}</span>
              </div>
              <button 
                className="btn btn-primary" 
                style={{width: '100%', padding: '1rem'}}
                onClick={handleCheckout}
                disabled={processing}
              >
                <CreditCard size={18} /> {processing ? 'Processing...' : 'Checkout & Pay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
